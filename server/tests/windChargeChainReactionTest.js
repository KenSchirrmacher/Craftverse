/**
 * WindChargeChainReactionTest
 * Test cases for the chain reaction capability of Wind Charges
 * Part of the Minecraft 1.24 Update (Trail Tales)
 */

const WindChargeEntity = require('../entities/windChargeEntity');
const WindChargeItem = require('../items/windChargeItem');
const { v4: uuidv4 } = require('uuid');
const assert = require('assert');
const World = require('../world/world');
const Player = require('../entities/player');

class TestWorld extends World {
  constructor() {
    super();
    this.blocks = new Map();
    this.entities = new Map();
    this.blockStateUpdates = [];
    this.particleEffects = [];
    this.activatedBlocks = [];
    this.soundEffects = [];
  }
  
  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks.get(key) || { type: 'air', isSolid: false };
  }
  
  setBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    this.blocks.set(key, block);
    this.emit('blockUpdate', { x, y, z, block });
  }
  
  getEntitiesInRadius(position, radius) {
    return Array.from(this.entities.values()).filter(entity => {
      const dx = entity.position.x - position.x;
      const dy = entity.position.y - position.y;
      const dz = entity.position.z - position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance <= radius;
    });
  }
  
  addEntity(entity) {
    this.entities.set(entity.id, entity);
    entity.world = this;
    this.emit('entityAdded', entity);
  }
  
  removeEntity(id) {
    const entity = this.entities.get(id);
    if (entity) {
      this.entities.delete(id);
      this.emit('entityRemoved', entity);
    }
  }

  updateBlockState(x, y, z, state) {
    this.blockStateUpdates.push({ x, y, z, state });
    this.emit('blockStateUpdate', { x, y, z, state });
  }

  addParticleEffect(effect) {
    this.particleEffects.push(effect);
    this.emit('particleEffect', effect);
  }

  activateBlock(x, y, z, type, data) {
    this.activatedBlocks.push({ x, y, z, type, ...data });
    this.emit('blockActivated', { x, y, z, type, ...data });
  }

  playSound(sound, position, volume, pitch) {
    this.soundEffects.push({ sound, position, volume, pitch });
    this.emit('soundPlayed', { sound, position, volume, pitch });
  }

  reset() {
    this.blockStateUpdates = [];
    this.particleEffects = [];
    this.activatedBlocks = [];
    this.soundEffects = [];
  }
}

class TestPlayer extends Player {
  constructor(id, position) {
    super(id, position);
    this.charging = {};
    this.cooldowns = {};
    this.gameMode = 'survival';
    this.rotation = { x: 0, y: 0, z: 0 };
    this.sentEvents = [];
    this.inventory = new Map();
  }

  sendEvent(event) {
    this.sentEvents.push(event);
    this.emit('eventSent', event);
  }

  getLookDirection() {
    return {
      x: -Math.sin(this.rotation.y) * Math.cos(this.rotation.x),
      y: -Math.sin(this.rotation.x),
      z: Math.cos(this.rotation.y) * Math.cos(this.rotation.x)
    };
  }

  addItem(item) {
    this.inventory.set(item.id, item);
    this.emit('itemAdded', item);
  }

  removeItem(itemId) {
    const item = this.inventory.get(itemId);
    if (item) {
      this.inventory.delete(itemId);
      this.emit('itemRemoved', item);
    }
  }
}

/**
 * Simple test runner
 */
function runTests() {
  let testCount = 0;
  let passedCount = 0;
  let world;
  
  console.log('Running Wind Charge Chain Reaction Tests...\n');
  
  function describe(suiteName, testFn) {
    console.log(`Test Suite: ${suiteName}`);
    testFn();
    console.log('');
  }
  
  function test(testName, testFn) {
    testCount++;
    try {
      // Reset world before each test
      world = new TestWorld();
      
      // Override setTimeout to execute immediately in tests
      global.originalSetTimeout = global.setTimeout;
      global.setTimeout = (callback, delay) => {
        callback();
        return 0;
      };
      
      testFn();
      console.log(`✓ PASSED: ${testName}`);
      passedCount++;
      
      // Restore original setTimeout
      global.setTimeout = global.originalSetTimeout;
    } catch (error) {
      // Restore original setTimeout on error too
      if (global.originalSetTimeout) {
        global.setTimeout = global.originalSetTimeout;
      }
      console.error(`✗ FAILED: ${testName}`);
      console.error(`  Error: ${error.message}`);
    }
  }
  
  function beforeEach(fn) {
    // This is handled in the test function above
  }
  
  function afterEach(fn) {
    // This is handled in the test function above
  }
  
  // Run the tests
  try {
    describe('Wind Charge Chain Reaction Tests', () => {
      test('Chain reaction with single nearby wind charge', () => {
        // Create initial wind charge
        const windCharge1 = new WindChargeEntity('test-charge-1', {
          world: world,
          position: { x: 0, y: 0, z: 0 },
          direction: { x: 0, y: 1, z: 0 },
          chargeLevel: 1
        });
        world.addEntity(windCharge1);
    
        // Create second wind charge within chain reaction radius
        const windCharge2 = new WindChargeEntity('test-charge-2', {
          world: world,
          position: { x: 2, y: 0, z: 0 },
          direction: { x: 0, y: 1, z: 0 },
          chargeLevel: 1
        });
        world.addEntity(windCharge2);
    
        // Explode the first wind charge
        windCharge1.explode();
    
        // Verify that the second wind charge was triggered
        assert(windCharge2.hasExploded, 'Second wind charge should have exploded via chain reaction');
      });
      
      test('Chain reaction with multiple wind charges in sequence', () => {
        // Create a line of wind charges
        const positions = [
          { x: 0, y: 0, z: 0 },
          { x: 2, y: 0, z: 0 },
          { x: 4, y: 0, z: 0 },
          { x: 6, y: 0, z: 0 },
          { x: 8, y: 0, z: 0 }
        ];
    
        const windCharges = positions.map((pos, index) => {
          const charge = new WindChargeEntity(`test-charge-${index}`, {
            world: world,
            position: pos,
            direction: { x: 0, y: 1, z: 0 },
            chargeLevel: 1
          });
          world.addEntity(charge);
          return charge;
        });
    
        // Track exploded charges
        const exploded = new Set();
        const originalExplode = WindChargeEntity.prototype.explode;
        WindChargeEntity.prototype.explode = function() {
          exploded.add(this.id);
          originalExplode.call(this);
        };
    
        // Explode the first wind charge
        windCharges[0].explode();
    
        // Verify that all wind charges were triggered in sequence
        assert.equal(exploded.size, 5, 'All five wind charges should have exploded');
    
        // Restore original method
        WindChargeEntity.prototype.explode = originalExplode;
      });
      
      test('Chain reaction respects explosion radius', () => {
        // Create wind charges at different distances
        const windCharge1 = new WindChargeEntity('test-charge-1', {
          world: world,
          position: { x: 0, y: 0, z: 0 },
          direction: { x: 0, y: 1, z: 0 },
          chargeLevel: 1,
          radius: 2 // Explosion radius of 2 blocks
        });
        world.addEntity(windCharge1);
    
        // Within chain reaction radius (2 * 2 = 4 blocks)
        const windCharge2 = new WindChargeEntity('test-charge-2', {
          world: world,
          position: { x: 3.5, y: 0, z: 0 },
          direction: { x: 0, y: 1, z: 0 },
          chargeLevel: 1
        });
        world.addEntity(windCharge2);
    
        // Beyond chain reaction radius
        const windCharge3 = new WindChargeEntity('test-charge-3', {
          world: world,
          position: { x: 5, y: 0, z: 0 },
          direction: { x: 0, y: 1, z: 0 },
          chargeLevel: 1
        });
        world.addEntity(windCharge3);
    
        // Explode the first wind charge
        windCharge1.explode();
    
        // Verify correct charges exploded
        assert(windCharge2.hasExploded, 'Wind charge within radius should have exploded');
        assert(!windCharge3.hasExploded, 'Wind charge outside radius should not have exploded');
      });

      test('Chain reaction with different charge levels', () => {
        // Create initial wind charge with high charge level (larger radius)
        const windCharge1 = new WindChargeEntity('test-charge-1', {
          world: world,
          position: { x: 0, y: 0, z: 0 },
          direction: { x: 0, y: 1, z: 0 },
          chargeLevel: 2, // Strong charge
          radius: 3 // Base explosion radius
        });
        world.addEntity(windCharge1);

        // Create second wind charge at a greater distance that can only be triggered by strong charge
        const windCharge2 = new WindChargeEntity('test-charge-2', {
          world: world,
          position: { x: 5, y: 0, z: 0 },
          direction: { x: 0, y: 1, z: 0 },
          chargeLevel: 0 // Weak charge
        });
        world.addEntity(windCharge2);

        // Explode the first wind charge
        windCharge1.explode();

        // Verify that the second wind charge was triggered
        assert(windCharge2.hasExploded, 'Second wind charge should have exploded from strong charge');
      });

      test('Chain reaction with obstacles', () => {
        // Create test world with a block in the middle
        world.setBlock(2, 0, 0, { isSolid: true });

        // Create two wind charges with a solid block between them
        const windCharge1 = new WindChargeEntity('test-charge-1', {
          world: world,
          position: { x: 0, y: 0, z: 0 },
          direction: { x: 0, y: 1, z: 0 },
          chargeLevel: 2
        });
        world.addEntity(windCharge1);

        const windCharge2 = new WindChargeEntity('test-charge-2', {
          world: world,
          position: { x: 4, y: 0, z: 0 },
          direction: { x: 0, y: 1, z: 0 },
          chargeLevel: 0
        });
        world.addEntity(windCharge2);

        // Explode the first wind charge
        windCharge1.explode();

        // Verify the second wind charge didn't explode due to the obstacle
        assert(!windCharge2.hasExploded, 'Second wind charge should not have exploded with obstacle between');
      });
    });
    
    console.log(`\nTest Summary: ${passedCount}/${testCount} tests passed.`);
    
    if (passedCount === testCount) {
      console.log('All tests passed!');
    } else {
      console.log(`${testCount - passedCount} tests failed.`);
      process.exit(1);
    }
  } finally {
    // Clean up
    if (global.originalSetTimeout) {
      global.setTimeout = global.originalSetTimeout;
      delete global.originalSetTimeout;
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, TestWorld }; 