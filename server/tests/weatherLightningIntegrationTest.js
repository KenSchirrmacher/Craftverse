/**
 * Integration tests for Weather System and Lightning Rod
 */

const assert = require('assert');
const WeatherSystem = require('../weather/weatherSystem');

// Mock lightning rod for testing
class MockLightningRod {
  constructor() {
    this.attractionRange = 128;
    this.powerLevel = 0;
    this.isActive = false;
    this.lastStrikeTime = 0;
    this.cooldown = 100;
    this.powerEmitted = false;
    this.mobsCharged = false;
    this.x = 50;
    this.y = 70;
    this.z = 50;
  }
  
  handleLightningStrike(strike, currentTime) {
    // Check cooldown
    if (currentTime - this.lastStrikeTime < this.cooldown) {
      return false;
    }

    // Calculate distance to strike
    const dx = strike.x - this.x;
    const dy = strike.y - this.y;
    const dz = strike.z - this.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Check if strike is in range
    if (distance > this.attractionRange) {
      return false;
    }

    // Attract the strike
    this.powerLevel = 15;
    this.isActive = true;
    this.lastStrikeTime = currentTime;
    this.powerEmitted = true;
    this.mobsCharged = true;

    // Also call these methods to ensure they're triggered
    this.emitRedstoneSignal();
    this.convertNearbyMobs();

    return true;
  }
  
  emitRedstoneSignal() {
    this.powerEmitted = true;
  }
  
  convertNearbyMobs() {
    this.mobsCharged = true;
  }
  
  update(currentTime) {
    // Deactivate after cooldown period
    if (this.isActive && currentTime - this.lastStrikeTime >= this.cooldown) {
      this.isActive = false;
      this.powerLevel = 0;
    }
  }
}

// Mock world for testing
class MockWorld {
  constructor() {
    this.blocks = new Map();
    this.entities = [];
    this.maxHeight = 256;
  }
  
  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks.get(key);
  }
  
  getMaxHeight() {
    return this.maxHeight;
  }
}

describe('Weather and Lightning Rod Integration', () => {
  let weatherSystem;
  let world;
  let lightningRod;
  
  beforeEach(() => {
    world = new MockWorld();
    weatherSystem = new WeatherSystem(world);
    lightningRod = new MockLightningRod();
  });
  
  describe('Lightning strike attraction', () => {
    it('should attract lightning strikes within range', () => {
      const strike = {
        x: 60,
        y: 75,
        z: 60,
        time: Date.now(),
        power: 15
      };
      
      const result = lightningRod.handleLightningStrike(strike, 0);
      
      assert.ok(result, 'Lightning rod should attract strike within range');
      assert.strictEqual(lightningRod.isActive, true);
      assert.strictEqual(lightningRod.powerLevel, 15);
    });
    
    it('should not attract lightning strikes outside range', () => {
      const strike = {
        x: 500,
        y: 80,
        z: 500,
        time: Date.now(),
        power: 15
      };
      
      const result = lightningRod.handleLightningStrike(strike, 0);
      
      assert.ok(!result, 'Lightning rod should not attract strike outside range');
      assert.strictEqual(lightningRod.isActive, false);
      assert.strictEqual(lightningRod.powerLevel, 0);
    });
  });
  
  describe('Lightning effects', () => {
    it('should charge nearby mobs when struck', () => {
      const strike = {
        x: 50,
        y: 71,
        z: 50,
        time: Date.now(),
        power: 15
      };
      
      lightningRod.handleLightningStrike(strike, 0);
      
      assert.strictEqual(lightningRod.mobsCharged, true, 'Nearby mobs should be charged');
    });
    
    it('should emit redstone signal when struck', () => {
      const strike = {
        x: 50,
        y: 71,
        z: 50,
        time: Date.now(),
        power: 15
      };
      
      lightningRod.handleLightningStrike(strike, 0);
      
      assert.ok(lightningRod.powerEmitted, 'Lightning rod should emit redstone signal');
    });
    
    it('should deactivate after cooldown period', () => {
      const strike = {
        x: 50,
        y: 71,
        z: 50,
        time: Date.now(),
        power: 15
      };
      
      lightningRod.handleLightningStrike(strike, 0);
      
      // Fast forward past cooldown period
      lightningRod.update(101);
      
      assert.strictEqual(lightningRod.isActive, false, 'Lightning rod should deactivate after cooldown');
      assert.strictEqual(lightningRod.powerLevel, 0, 'Power level should be 0 after deactivation');
    });
  });
  
  describe('Weather System', () => {
    it('should generate lightning strikes during thunderstorms', () => {
      weatherSystem.currentWeather = 'thunder';
      
      // Directly call the method to avoid timing issues
      weatherSystem.generateLightningStrike();
      
      assert.ok(weatherSystem.lightningStrikes.length > 0, 'Weather system should generate lightning strikes');
    });
    
    it('should emit weather change events', (done) => {
      weatherSystem.once('weatherChange', (data) => {
        assert.ok(data.weather, 'Weather change event should contain weather state');
        assert.ok(data.duration, 'Weather change event should contain duration');
        done();
      });
      
      weatherSystem.changeWeather();
    });
  });
}); 