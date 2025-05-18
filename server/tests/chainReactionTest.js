/**
 * Quick test for Wind Charge chain reaction functionality
 */
const assert = require('assert');
const WindChargeEntity = require('../entities/windChargeEntity');
const { v4: uuidv4 } = require('uuid');

// Simple mock world for testing
class MockWorld {
  constructor() {
    this.entities = {};
  }
  
  getEntitiesInRadius(position, radius) {
    return Object.values(this.entities).filter(entity => {
      const dx = entity.position.x - position.x;
      const dy = entity.position.y - position.y;
      const dz = entity.position.z - position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance <= radius;
    });
  }
  
  addEntity(entity) {
    this.entities[entity.id] = entity;
    entity.world = this;
  }
  
  removeEntity(id) {
    delete this.entities[id];
  }
  
  emitEntityUpdate() {
    // Mock implementation
  }
  
  getBlock() {
    // Mock implementation
    return { type: 'air' };
  }
  
  setBlock() {
    // Mock implementation
  }
}

// Run tests
console.log('Testing Wind Charge chain reaction functionality...');

// Test case 1: Chain reaction with charges in range
async function testChainReactionInRange() {
  console.log('\nTest 1: Chain reaction with charges in range');
  
  const world = new MockWorld();
  
  // Create first wind charge
  const windCharge1 = new WindChargeEntity(uuidv4(), {
    position: { x: 10, y: 5, z: 10 },
    direction: { x: 1, y: 0, z: 0 },
    explosionRadius: 2.0
  });
  windCharge1.type = 'wind_charge_entity'; // Set the entity type for filtering
  
  // Create second wind charge within chain reaction range
  const windCharge2 = new WindChargeEntity(uuidv4(), {
    position: { x: 13, y: 5, z: 10 }, // 3 blocks away
    direction: { x: 0, y: 1, z: 0 }
  });
  windCharge2.type = 'wind_charge_entity'; // Set the entity type for filtering
  
  // Add both to world
  world.addEntity(windCharge1);
  world.addEntity(windCharge2);
  
  // Track explosions
  let explosionCount = 0;
  const originalExplode1 = windCharge1.explode;
  const originalExplode2 = windCharge2.explode;
  
  windCharge1.explode = function() {
    explosionCount++;
    originalExplode1.call(windCharge1);
  };
  
  windCharge2.explode = function() {
    explosionCount++;
    originalExplode2.call(windCharge2);
  };
  
  // Trigger first explosion
  windCharge1.explode();
  
  // Wait for chain reaction
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check results
  assert.strictEqual(explosionCount, 2, "Both wind charges should have exploded");
  assert.strictEqual(windCharge1.hasExploded, true, "First wind charge should be exploded");
  assert.strictEqual(windCharge2.hasExploded, true, "Second wind charge should be triggered by chain reaction");
  console.log('✓ Test passed: Chain reaction successfully triggered nearby wind charge');
}

// Test case 2: No chain reaction with charges out of range
async function testNoChainReactionOutOfRange() {
  console.log('\nTest 2: No chain reaction with charges out of range');
  
  const world = new MockWorld();
  
  // Create first wind charge
  const windCharge1 = new WindChargeEntity(uuidv4(), {
    position: { x: 10, y: 5, z: 10 },
    direction: { x: 1, y: 0, z: 0 },
    explosionRadius: 1.0 // Smaller explosion radius
  });
  windCharge1.type = 'wind_charge_entity'; // Set the entity type for filtering
  
  // Create second wind charge outside chain reaction range
  const windCharge2 = new WindChargeEntity(uuidv4(), {
    position: { x: 20, y: 5, z: 10 }, // 10 blocks away
    direction: { x: 0, y: 1, z: 0 }
  });
  windCharge2.type = 'wind_charge_entity'; // Set the entity type for filtering
  
  // Add both to world
  world.addEntity(windCharge1);
  world.addEntity(windCharge2);
  
  // Track explosions
  let explosionCount = 0;
  const originalExplode1 = windCharge1.explode;
  const originalExplode2 = windCharge2.explode;
  
  windCharge1.explode = function() {
    explosionCount++;
    originalExplode1.call(windCharge1);
  };
  
  windCharge2.explode = function() {
    explosionCount++;
    originalExplode2.call(windCharge2);
  };
  
  // Trigger first explosion
  windCharge1.explode();
  
  // Wait to ensure no chain reaction occurs
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check results
  assert.strictEqual(explosionCount, 1, "Only the first wind charge should have exploded");
  assert.strictEqual(windCharge1.hasExploded, true, "First wind charge should be exploded");
  assert.strictEqual(windCharge2.hasExploded, false, "Second wind charge should NOT be triggered");
  console.log('✓ Test passed: No chain reaction triggered for wind charge outside range');
}

// Run all tests
async function runAllTests() {
  try {
    await testChainReactionInRange();
    await testNoChainReactionOutOfRange();
    console.log('\n✅ All chain reaction tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runAllTests(); 