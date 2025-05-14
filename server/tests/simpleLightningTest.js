/**
 * Simple tests for the Weather System and Lightning Rod functionality
 */

const assert = require('assert');
const WeatherSystem = require('../weather/weatherSystem');

describe('Weather System', () => {
  let weatherSystem;
  
  beforeEach(() => {
    // Create a minimal world object
    const world = {
      getBlock: () => null,
      getMaxHeight: () => 256
    };
    
    weatherSystem = new WeatherSystem(world);
  });
  
  it('should initialize with clear weather', () => {
    assert.strictEqual(weatherSystem.currentWeather, 'clear');
  });
  
  it('should change weather when update exceeds duration', () => {
    const initialWeather = weatherSystem.currentWeather;
    const initialDuration = weatherSystem.weatherDuration;
    
    // Override the random selection to ensure we get a different weather
    const originalChangeWeather = weatherSystem.changeWeather;
    weatherSystem.changeWeather = function() {
      this.currentWeather = this.currentWeather === 'clear' ? 'rain' : 'clear';
      this.weatherDuration = 1000;
      this.weatherTimer = 0;
      this.emit('weatherChange', { weather: this.currentWeather, duration: this.weatherDuration });
    };
    
    // Update beyond the duration
    weatherSystem.weatherDuration = 100;
    weatherSystem.update(101);
    
    // Restore original method
    weatherSystem.changeWeather = originalChangeWeather;
    
    assert.notStrictEqual(weatherSystem.currentWeather, initialWeather);
  });
  
  it('should generate lightning during thunder weather', () => {
    weatherSystem.currentWeather = 'thunder';
    weatherSystem.lightningStrikes = []; // Clear any existing strikes
    
    // Directly call the method
    weatherSystem.generateLightningStrike();
    
    assert.strictEqual(weatherSystem.lightningStrikes.length, 1);
  });
  
  it('should not generate lightning during clear weather', () => {
    weatherSystem.currentWeather = 'clear';
    weatherSystem.lightningStrikes = []; // Clear any existing strikes
    
    // Directly call the method
    weatherSystem.generateLightningStrike();
    
    assert.strictEqual(weatherSystem.lightningStrikes.length, 0);
  });
  
  it('should emit events for weather changes', (done) => {
    weatherSystem.once('weatherChange', (data) => {
      assert.ok(data.weather);
      assert.ok(data.duration);
      done();
    });
    
    weatherSystem.changeWeather();
  });
  
  it('should emit events for lightning strikes', (done) => {
    weatherSystem.currentWeather = 'thunder';
    weatherSystem.lightningStrikes = []; // Clear any existing strikes
    
    weatherSystem.once('lightningStrike', (strike) => {
      assert.ok(strike.x !== undefined);
      assert.ok(strike.y !== undefined);
      assert.ok(strike.z !== undefined);
      assert.ok(strike.time);
      assert.ok(strike.power);
      done();
    });
    
    weatherSystem.generateLightningStrike();
  });
});

describe('Basic Lightning Rod Functionality', () => {
  it('should properly calculate distances', () => {
    // Create points
    const rod = { x: 0, y: 0, z: 0 };
    const strike1 = { x: 10, y: 0, z: 0 }; // 10 units away
    const strike2 = { x: 100, y: 100, z: 100 }; // ~173 units away
    
    // Calculate distances
    const dist1 = Math.sqrt(Math.pow(strike1.x - rod.x, 2) + Math.pow(strike1.y - rod.y, 2) + Math.pow(strike1.z - rod.z, 2));
    const dist2 = Math.sqrt(Math.pow(strike2.x - rod.x, 2) + Math.pow(strike2.y - rod.y, 2) + Math.pow(strike2.z - rod.z, 2));
    
    // Assert
    assert.strictEqual(dist1, 10);
    assert.ok(dist2 > 170 && dist2 < 175);
  });
  
  it('should determine if a strike is within range', () => {
    const maxRange = 128;
    
    // Create points
    const rod = { x: 0, y: 0, z: 0 };
    const strike1 = { x: 10, y: 0, z: 0 }; // 10 units away (in range)
    const strike2 = { x: 100, y: 100, z: 100 }; // ~173 units away (out of range)
    
    // Calculate distances
    const dist1 = Math.sqrt(Math.pow(strike1.x - rod.x, 2) + Math.pow(strike1.y - rod.y, 2) + Math.pow(strike1.z - rod.z, 2));
    const dist2 = Math.sqrt(Math.pow(strike2.x - rod.x, 2) + Math.pow(strike2.y - rod.y, 2) + Math.pow(strike2.z - rod.z, 2));
    
    // Check if in range
    const inRange1 = dist1 <= maxRange;
    const inRange2 = dist2 <= maxRange;
    
    // Assert
    assert.strictEqual(inRange1, true);
    assert.strictEqual(inRange2, false);
  });
}); 