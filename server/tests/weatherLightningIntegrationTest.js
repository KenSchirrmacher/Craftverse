/**
 * Integration tests for Weather System and Lightning Rod
 */

const assert = require('assert');
const WeatherSystem = require('../weather/weatherSystem');
const LightningRodBlock = require('../blocks/lightningRodBlock');

// Mock world for testing
class MockWorld {
  constructor() {
    this.blocks = new Map();
    this.entities = [];
  }
  
  addBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    this.blocks.set(key, block);
    block.x = x;
    block.y = y;
    block.z = z;
    block.world = this;
  }
  
  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks.get(key);
  }
  
  getEntitiesInRange(x, y, z, range) {
    return this.entities.filter(entity => {
      const dx = entity.x - x;
      const dy = entity.y - y;
      const dz = entity.z - z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance <= range;
    });
  }
  
  getAdjacentBlocks(x, y, z) {
    const adjacentPositions = [
      [x+1, y, z], [x-1, y, z],
      [x, y+1, z], [x, y-1, z],
      [x, y, z+1], [x, y, z-1]
    ];
    
    return adjacentPositions
      .map(([x, y, z]) => this.getBlock(x, y, z))
      .filter(block => block !== undefined);
  }
  
  addEntity(entity) {
    this.entities.push(entity);
  }
}

// Mock creeper entity with charged state for testing
class MockCreeper {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.isCharged = false;
  }
  
  convertToCharged() {
    this.isCharged = true;
  }
}

describe('Weather and Lightning Rod Integration', () => {
  let weatherSystem;
  let world;
  let lightningRod;
  
  beforeEach(() => {
    world = new MockWorld();
    weatherSystem = new WeatherSystem(world);
    lightningRod = new LightningRodBlock();
    world.addBlock(50, 70, 50, lightningRod);
  });
  
  describe('Lightning strike attraction', () => {
    it('should attract lightning strikes within range', () => {
      const strike = {
        x: 100,
        y: 80,
        z: 100,
        time: Date.now(),
        power: 15
      };
      
      // Override findHighestBlock to return a value for testing
      weatherSystem.findHighestBlock = (x, z) => 70;
      
      // Force thunder weather
      weatherSystem.currentWeather = 'thunder';
      
      // Generate a lightning strike and emit event
      weatherSystem.emit('lightningStrike', strike);
      
      // The lightning rod should detect the strike
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
      
      // Override findHighestBlock to return a value for testing
      weatherSystem.findHighestBlock = (x, z) => 70;
      
      // Force thunder weather
      weatherSystem.currentWeather = 'thunder';
      
      // Generate a lightning strike and emit event
      weatherSystem.emit('lightningStrike', strike);
      
      // The lightning rod should detect the strike
      const result = lightningRod.handleLightningStrike(strike, 0);
      
      assert.ok(!result, 'Lightning rod should not attract strike outside range');
      assert.strictEqual(lightningRod.isActive, false);
      assert.strictEqual(lightningRod.powerLevel, 0);
    });
  });
  
  describe('Lightning effects', () => {
    it('should charge nearby creepers', () => {
      // Add a creeper near the lightning rod
      const creeper = new MockCreeper(51, 70, 51);
      world.addEntity(creeper);
      
      const strike = {
        x: 50,
        y: 71,
        z: 50,
        time: Date.now(),
        power: 15
      };
      
      // Trigger lightning strike
      lightningRod.handleLightningStrike(strike, 0);
      
      // The lightning rod should call convertNearbyMobs()
      lightningRod.convertNearbyMobs();
      
      assert.strictEqual(creeper.isCharged, true, 'Creeper should be charged after lightning strike');
    });
    
    it('should emit redstone signal', () => {
      // Mock for checking if redstone signal was emitted
      let redstoneCalled = false;
      lightningRod.emitRedstoneSignal = () => {
        redstoneCalled = true;
      };
      
      const strike = {
        x: 50,
        y: 71,
        z: 50,
        time: Date.now(),
        power: 15
      };
      
      // Trigger lightning strike
      lightningRod.handleLightningStrike(strike, 0);
      
      assert.ok(redstoneCalled, 'Lightning rod should emit redstone signal');
    });
    
    it('should deactivate after cooldown period', () => {
      const strike = {
        x: 50,
        y: 71,
        z: 50,
        time: Date.now(),
        power: 15
      };
      
      // Trigger lightning strike
      lightningRod.handleLightningStrike(strike, 0);
      
      // Fast forward past cooldown period
      lightningRod.update(101);
      
      assert.strictEqual(lightningRod.isActive, false, 'Lightning rod should deactivate after cooldown');
      assert.strictEqual(lightningRod.powerLevel, 0, 'Power level should be 0 after deactivation');
    });
  });
}); 