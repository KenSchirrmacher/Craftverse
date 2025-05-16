/**
 * Run Raft Test
 * Executes the raft implementation tests
 * Part of the 1.20 Update
 */

const assert = require('assert');
const Raft = require('../entities/raft');
const RaftItem = require('../items/raftItem');
const BambooRaftItem = require('../items/bambooRaftItem');
const itemRegistry = require('../items/itemRegistry');

console.log('=== Starting Raft Test Suite ===');
console.log('Testing raft implementation for the 1.20 Update');

// Mock world for testing
class MockWorld {
  constructor() {
    this.entities = [];
  }
  
  addEntity(entity) {
    this.entities.push(entity);
    return true;
  }
}

// Test Raft Entity
try {
  console.log('\nTesting Raft Entity:');
  
  const world = new MockWorld();
  const raft = new Raft(world, { 
    position: { x: 10, y: 5, z: 10 },
    woodType: 'oak'
  });
  
  assert.strictEqual(raft.type, 'oak_raft', 'Raft should have correct type');
  assert.strictEqual(raft.isRaft, true, 'Raft should have isRaft property set to true');
  assert.strictEqual(raft.health, 60, 'Raft should have 60 health');
  assert.strictEqual(raft.maxHealth, 60, 'Raft should have 60 max health');
  assert.strictEqual(raft.buoyancy, 1.2, 'Raft should have 1.2 buoyancy');
  assert.strictEqual(raft.speed, 0.08, 'Raft should have 0.08 speed');
  assert.strictEqual(raft.turnSpeed, 2.5, 'Raft should have 2.5 turn speed');
  assert.strictEqual(raft.maxPassengers, 2, 'Raft should support 2 passengers');
  
  console.log('✓ Raft entity tests passed');
} catch (error) {
  console.error('❌ Raft entity tests failed:', error.message);
  process.exit(1);
}

// Test Raft Item
try {
  console.log('\nTesting RaftItem:');
  
  const oakRaft = new RaftItem({ woodType: 'oak' });
  assert.strictEqual(oakRaft.id, 'oak_raft', 'Oak raft should have correct ID');
  assert.strictEqual(oakRaft.isRaft, true, 'Raft item should have isRaft property set to true');
  assert.strictEqual(oakRaft.hasChest, false, 'Normal raft should have hasChest=false');
  
  const chestRaft = new RaftItem({ woodType: 'birch', hasChest: true });
  assert.strictEqual(chestRaft.id, 'birch_chest_raft', 'Birch chest raft should have correct ID');
  assert.strictEqual(chestRaft.hasChest, true, 'Chest raft should have hasChest=true');
  
  console.log('✓ Raft item tests passed');
} catch (error) {
  console.error('❌ Raft item tests failed:', error.message);
  process.exit(1);
}

// Test Bamboo Raft Item
try {
  console.log('\nTesting BambooRaftItem:');
  
  const bambooRaft = new BambooRaftItem();
  assert.strictEqual(bambooRaft.id, 'bamboo_raft', 'Bamboo raft should have correct ID');
  assert.strictEqual(bambooRaft.woodType, 'bamboo', 'Bamboo raft should have wood type set to bamboo');
  assert.strictEqual(bambooRaft.isRaft, true, 'Bamboo raft should have isRaft property set to true');
  
  const bambooChestRaft = new BambooRaftItem({ hasChest: true });
  assert.strictEqual(bambooChestRaft.id, 'bamboo_chest_raft', 'Bamboo chest raft should have correct ID');
  assert.strictEqual(bambooChestRaft.hasChest, true, 'Bamboo chest raft should have hasChest=true');
  
  console.log('✓ Bamboo raft item tests passed');
} catch (error) {
  console.error('❌ Bamboo raft item tests failed:', error.message);
  process.exit(1);
}

// Test Item Registry Integration
try {
  console.log('\nTesting Item Registry Integration:');
  
  // Check if raft items are registered
  assert.strictEqual(itemRegistry.hasItem('bamboo_raft'), true, 'Bamboo raft should be registered');
  assert.strictEqual(itemRegistry.hasItem('bamboo_chest_raft'), true, 'Bamboo chest raft should be registered');
  assert.strictEqual(itemRegistry.hasItem('oak_raft'), true, 'Oak raft should be registered');
  assert.strictEqual(itemRegistry.hasItem('oak_chest_raft'), true, 'Oak chest raft should be registered');
  
  console.log('✓ Item registry integration tests passed');
} catch (error) {
  console.error('❌ Item registry integration tests failed:', error.message);
  process.exit(1);
}

console.log('\n✅ ALL TESTS PASSED: Raft implementation is complete!'); 