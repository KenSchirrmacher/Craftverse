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
  }
  
  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks.get(key) || { type: 'air', isSolid: false };
  }
  
  setBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    this.blocks.set(key, block);
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
  }
  
  removeEntity(id) {
    this.entities.delete(id);
  }

  updateBlockState(x, y, z, state) {
    this.blockStateUpdates.push({ x, y, z, state });
  }

  addParticleEffect(effect) {
    this.particleEffects.push(effect);
  }

  activateBlock(x, y, z, type, data) {
    this.activatedBlocks.push({ x, y, z, type, ...data });
  }

  reset() {
    this.blockStateUpdates = [];
    this.particleEffects = [];
    this.activatedBlocks = [];
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
  }

  sendEvent(event) {
    this.sentEvents.push(event);
  }

  getLookDirection() {
    return {
      x: -Math.sin(this.rotation.y) * Math.cos(this.rotation.x),
      y: -Math.sin(this.rotation.x),
      z: Math.cos(this.rotation.y) * Math.cos(this.rotation.x)
    };
  }
}

describe('Wind Charge Chain Reaction Tests', () => {
  let world;

  beforeEach(() => {
    world = new TestWorld();
    
    // Override setTimeout to execute immediately in tests
    global.originalSetTimeout = global.setTimeout;
    global.setTimeout = (callback, delay) => {
      callback();
      return 0;
    };
  });

  afterEach(() => {
    // Restore original setTimeout
    global.setTimeout = global.originalSetTimeout;
  });

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

    // Set up the obstacle detection in chain reaction
    const originalCheckLineOfSight = windCharge1.checkLineOfSight;
    windCharge1.checkLineOfSight = function(target) {
      const dx = target.position.x - this.position.x;
      const dy = target.position.y - this.position.y;
      const dz = target.position.z - this.position.z;
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (length === 0) return true;
      
      const stepX = dx / length;
      const stepY = dy / length;
      const stepZ = dz / length;
      
      let x = this.position.x;
      let y = this.position.y;
      let z = this.position.z;
      
      // Step along the line checking for obstacles
      for (let t = 0; t < length; t += 0.5) {
        x += stepX * 0.5;
        y += stepY * 0.5;
        z += stepZ * 0.5;
        
        const blockX = Math.floor(x);
        const blockY = Math.floor(y);
        const blockZ = Math.floor(z);
        
        const block = this.world.getBlock(blockX, blockY, blockZ);
        if (block && block.isSolid) {
          return false;
        }
      }
      
      return true;
    };

    // Explode the first wind charge
    windCharge1.explode();

    // Verify the second wind charge didn't explode due to the obstacle
    assert(!windCharge2.hasExploded, 'Second wind charge should not have exploded with obstacle between');

    // Restore original method if it existed
    if (originalCheckLineOfSight) {
      windCharge1.checkLineOfSight = originalCheckLineOfSight;
    }
  });
});

/**
 * Simple test runner
 */
function runTests() {
  let testCount = 0;
  let passedCount = 0;
  
  console.log('Running Wind Charge Chain Reaction Tests...\n');
  
  function describe(suiteName, testFn) {
    console.log(`Test Suite: ${suiteName}`);
    testFn();
    console.log('');
  }
  
  function test(testName, testFn) {
    testCount++;
    try {
      testFn();
      console.log(`✓ PASSED: ${testName}`);
      passedCount++;
    } catch (error) {
      console.error(`✗ FAILED: ${testName}`);
      console.error(`  Error: ${error.message}`);
    }
  }
  
  function beforeEach(fn) {
    global.beforeEachFn = fn;
  }
  
  function afterEach(fn) {
    global.afterEachFn = fn;
  }
  
  // Run the describe block (which runs the tests)
  try {
    if (global.beforeEachFn) global.beforeEachFn();
    describe('Wind Charge Chain Reaction Tests', () => {
      if (global.beforeEachFn) global.beforeEachFn();
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
      if (global.afterEachFn) global.afterEachFn();
      
      if (global.beforeEachFn) global.beforeEachFn();
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
      if (global.afterEachFn) global.afterEachFn();
      
      if (global.beforeEachFn) global.beforeEachFn();
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
      if (global.afterEachFn) global.afterEachFn();
    });
    
    console.log(`\nTest Summary: ${passedCount}/${testCount} tests passed.`);
    
    if (passedCount === testCount) {
      console.log('All tests passed!');
    } else {
      console.log(`${testCount - passedCount} tests failed.`);
      process.exit(1);
    }
  } finally {
    // Clean up global test helpers
    delete global.beforeEachFn;
    delete global.afterEachFn;
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  let world = new TestWorld();
  runTests();
}

module.exports = { runTests, TestWorld }; 