const assert = require('assert');
const WeatherSystem = require('../weather/weatherSystem');

// Mock world for testing
class MockWorld {
  constructor() {
    this.blocks = new Map();
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

describe('WeatherSystem', () => {
  let weatherSystem;
  let mockWorld;

  beforeEach(() => {
    mockWorld = new MockWorld();
    weatherSystem = new WeatherSystem(mockWorld);
  });

  describe('Weather Changes', () => {
    it('should start with clear weather', () => {
      assert.strictEqual(weatherSystem.currentWeather, 'clear');
    });

    it('should change weather after duration', () => {
      const initialWeather = weatherSystem.currentWeather;
      weatherSystem.update(weatherSystem.weatherDuration + 1);
      assert.notStrictEqual(weatherSystem.currentWeather, initialWeather);
    });

    it('should emit weather change event', (done) => {
      weatherSystem.on('weatherChange', (data) => {
        assert.ok(data.weather);
        assert.ok(data.duration);
        done();
      });
      weatherSystem.update(weatherSystem.weatherDuration + 1);
    });
  });

  describe('Lightning Strikes', () => {
    it('should generate lightning strikes during thunderstorms', () => {
      weatherSystem.currentWeather = 'thunder';
      weatherSystem.update(100);
      assert.ok(weatherSystem.lightningStrikes.length > 0);
    });

    it('should not generate lightning strikes during clear weather', () => {
      weatherSystem.currentWeather = 'clear';
      weatherSystem.update(100);
      assert.strictEqual(weatherSystem.lightningStrikes.length, 0);
    });

    it('should emit lightning strike event', (done) => {
      weatherSystem.currentWeather = 'thunder';
      weatherSystem.on('lightningStrike', (strike) => {
        assert.ok(strike.x);
        assert.ok(strike.y);
        assert.ok(strike.z);
        assert.ok(strike.time);
        assert.ok(strike.power);
        done();
      });
      weatherSystem.update(100);
    });

    it('should clean up old lightning strikes', () => {
      weatherSystem.currentWeather = 'thunder';
      weatherSystem.update(100);
      const initialStrikes = weatherSystem.lightningStrikes.length;
      // Wait for 2 seconds
      setTimeout(() => {
        weatherSystem.processLightningStrikes();
        assert.strictEqual(weatherSystem.lightningStrikes.length, 0);
      }, 2000);
    });
  });

  describe('Weather Duration', () => {
    it('should have appropriate duration for clear weather', () => {
      weatherSystem.currentWeather = 'clear';
      const duration = weatherSystem.getRandomDuration();
      assert.ok(duration >= 12000 && duration <= 24000);
    });

    it('should have appropriate duration for rain', () => {
      weatherSystem.currentWeather = 'rain';
      const duration = weatherSystem.getRandomDuration();
      assert.ok(duration >= 12000 && duration <= 24000);
    });

    it('should have appropriate duration for thunder', () => {
      weatherSystem.currentWeather = 'thunder';
      const duration = weatherSystem.getRandomDuration();
      assert.ok(duration >= 6000 && duration <= 12000);
    });
  });
  
  describe('Finding highest block', () => {
    it('should find the highest non-air block', () => {
      // Create some blocks in the mock world
      mockWorld.blocks.set('100,50,100', { id: 'stone' });
      mockWorld.blocks.set('100,51,100', { id: 'dirt' });
      mockWorld.blocks.set('100,52,100', { id: 'grass_block' });
      mockWorld.blocks.set('100,53,100', { id: 'air' });
      
      const height = weatherSystem.findHighestBlock(100, 100);
      assert.strictEqual(height, 53, 'Should return position above the highest solid block');
    });
    
    it('should return default height when no blocks found', () => {
      const height = weatherSystem.findHighestBlock(200, 200);
      assert.strictEqual(height, 64, 'Should return default ground level height');
    });
  });
}); 