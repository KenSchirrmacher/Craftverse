const EventEmitter = require('events');

class WeatherSystem extends EventEmitter {
  constructor(world) {
    super();
    this.world = world;
    this.currentWeather = 'clear';
    this.weatherDuration = 0;
    this.weatherTimer = 0;
    this.thunderTimer = 0;
    this.lightningStrikes = [];
  }

  update(deltaTime) {
    // Update weather timers
    this.weatherTimer += deltaTime;
    this.thunderTimer += deltaTime;

    // Check for weather changes
    if (this.weatherTimer >= this.weatherDuration) {
      this.changeWeather();
    }

    // Handle lightning strikes during thunderstorms
    if (this.currentWeather === 'thunder' && this.thunderTimer >= 100) {
      this.thunderTimer = 0;
      this.generateLightningStrike();
    }

    // Process lightning strikes
    this.processLightningStrikes();
  }

  changeWeather() {
    const weatherTypes = ['clear', 'rain', 'thunder'];
    const weights = [0.6, 0.3, 0.1];
    
    // Select new weather based on weights
    let random = Math.random();
    let newWeather = 'clear';
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        newWeather = weatherTypes[i];
        break;
      }
    }

    // Set new weather
    this.currentWeather = newWeather;
    this.weatherDuration = this.getRandomDuration();
    this.weatherTimer = 0;

    // Emit weather change event
    this.emit('weatherChange', {
      weather: this.currentWeather,
      duration: this.weatherDuration
    });
  }

  getRandomDuration() {
    // Return duration in ticks (20 ticks = 1 second)
    switch (this.currentWeather) {
      case 'clear':
        return Math.floor(Math.random() * 12000) + 12000; // 10-20 minutes
      case 'rain':
        return Math.floor(Math.random() * 12000) + 12000; // 10-20 minutes
      case 'thunder':
        return Math.floor(Math.random() * 6000) + 6000; // 5-10 minutes
      default:
        return 12000; // 10 minutes default
    }
  }

  generateLightningStrike() {
    if (this.currentWeather !== 'thunder') return;

    // Generate random coordinates for lightning strike
    const x = Math.floor(Math.random() * 1000) - 500;
    const z = Math.floor(Math.random() * 1000) - 500;
    
    // Find highest block at these coordinates
    const y = this.findHighestBlock(x, z);

    // Create lightning strike
    const strike = {
      x,
      y,
      z,
      time: Date.now(),
      power: 15
    };

    this.lightningStrikes.push(strike);

    // Emit lightning strike event
    this.emit('lightningStrike', strike);
  }

  findHighestBlock(x, z) {
    // Implementation to find the highest non-air block at the given coordinates
    if (this.world) {
      const maxHeight = this.world.getMaxHeight();
      
      // Start from the top and work down
      for (let y = maxHeight; y >= 0; y--) {
        const block = this.world.getBlock(x, y, z);
        if (block && block.id !== 'air') {
          return y + 1; // Return the position above the highest block
        }
      }
      
      // Default to ground level if no blocks found
      return 64;
    }
    
    // Default height if world reference is not available
    return 64;
  }

  processLightningStrikes() {
    const currentTime = Date.now();
    this.lightningStrikes = this.lightningStrikes.filter(strike => {
      // Remove strikes older than 1 second
      return currentTime - strike.time < 1000;
    });
  }

  getWeather() {
    return {
      type: this.currentWeather,
      duration: this.weatherDuration - this.weatherTimer
    };
  }
}

module.exports = WeatherSystem; 