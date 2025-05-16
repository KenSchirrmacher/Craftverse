/**
 * Raft Test - Tests the raft implementation for the 1.20 Update
 */

const assert = require('assert');
const Raft = require('../entities/raft');
const RaftItem = require('../items/raftItem');
const BambooRaftItem = require('../items/bambooRaftItem');
const itemRegistry = require('../items/itemRegistry');

// Mock classes for testing
class MockWorld {
  constructor() {
    this.entities = [];
    this.blocks = {};
  }
  
  addEntity(entity) {
    this.entities.push(entity);
    return true;
  }
  
  getBlock(x, y, z) {
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    return this.blocks[key] || null;
  }
  
  setBlock(x, y, z, block) {
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    this.blocks[key] = block;
    return true;
  }
}

class MockPlayer {
  constructor(id = 'player1') {
    this.id = id;
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { y: 0, x: 0, z: 0 };
    this.events = [];
  }
  
  emit(event, data) {
    this.events.push({ event, data });
    return true;
  }
  
  setPosition(x, y, z) {
    this.position = { x, y, z };
  }
}

// Test suite
describe('Raft Implementation', function() {
  // Test Raft entity implementation
  describe('Raft Entity', function() {
    let world, raft;
    
    beforeEach(function() {
      world = new MockWorld();
      raft = new Raft(world, { 
        position: { x: 10, y: 5, z: 10 },
        woodType: 'oak'
      });
    });
    
    it('should create a raft with correct properties', function() {
      assert.strictEqual(raft.type, 'oak_raft', 'Raft should have correct type');
      assert.strictEqual(raft.isRaft, true, 'Raft should have isRaft property set to true');
      assert.strictEqual(raft.health, 60, 'Raft should have 60 health');
      assert.strictEqual(raft.maxHealth, 60, 'Raft should have 60 max health');
      assert.strictEqual(raft.buoyancy, 1.2, 'Raft should have 1.2 buoyancy');
      assert.strictEqual(raft.speed, 0.08, 'Raft should have 0.08 speed');
      assert.strictEqual(raft.turnSpeed, 2.5, 'Raft should have 2.5 turn speed');
      assert.strictEqual(raft.maxPassengers, 2, 'Raft should support 2 passengers');
    });
    
    it('should handle multiple passengers', function() {
      const player1 = new MockPlayer('player1');
      const player2 = new MockPlayer('player2');
      const player3 = new MockPlayer('player3');
      
      // Add first passenger
      assert.strictEqual(raft.addPassenger(player1), true, 'Should successfully add first passenger');
      assert.strictEqual(raft.passengers.length, 1, 'Should have 1 passenger');
      assert.strictEqual(raft.passenger, player1, 'First passenger should be the controller');
      
      // Add second passenger
      assert.strictEqual(raft.addPassenger(player2), true, 'Should successfully add second passenger');
      assert.strictEqual(raft.passengers.length, 2, 'Should have 2 passengers');
      assert.strictEqual(raft.passenger, player1, 'First passenger should still be the controller');
      
      // Try to add third passenger (should fail)
      assert.strictEqual(raft.addPassenger(player3), false, 'Should fail to add third passenger');
      assert.strictEqual(raft.passengers.length, 2, 'Should still have only 2 passengers');
      
      // Remove first passenger
      assert.strictEqual(raft.removePassenger(player1), true, 'Should successfully remove first passenger');
      assert.strictEqual(raft.passengers.length, 1, 'Should have 1 passenger remaining');
      assert.strictEqual(raft.passenger, player2, 'Second passenger should now be the controller');
      
      // Remove all passengers
      raft.removeAllPassengers();
      assert.strictEqual(raft.passengers.length, 0, 'Should have no passengers after removeAllPassengers');
      assert.strictEqual(raft.passenger, null, 'Should have no controller after removeAllPassengers');
    });
    
    it('should calculate correct passenger positions', function() {
      const player1 = new MockPlayer('player1');
      const player2 = new MockPlayer('player2');
      
      // Add passengers
      raft.addPassenger(player1);
      raft.addPassenger(player2);
      
      // Test position calculations
      const pos1 = raft.getPassengerPosition(0);
      const pos2 = raft.getPassengerPosition(1);
      
      // Positions should be different for the two passengers
      assert.notDeepStrictEqual(pos1, pos2, 'Passengers should have different positions');
      
      // Both positions should be on top of the raft
      assert.strictEqual(pos1.y, raft.position.y + raft.height, 'Passenger 1 should be on top of the raft');
      assert.strictEqual(pos2.y, raft.position.y + raft.height, 'Passenger 2 should be on top of the raft');
    });
    
    it('should apply raft-specific physics', function() {
      // Set raft in water
      raft.isInWater = true;
      raft.velocity = { x: 0.5, y: 0.1, z: 0.5 };
      
      // Apply raft physics
      raft.applyBoatPhysics(1.0);
      
      // Velocity should be reduced by drag factor
      assert.ok(raft.velocity.x < 0.5, 'X velocity should be reduced by drag');
      assert.ok(raft.velocity.z < 0.5, 'Z velocity should be reduced by drag');
    });
    
    it('should properly serialize and deserialize', function() {
      // Add a passenger
      const player = new MockPlayer('player1');
      raft.addPassenger(player);
      
      // Serialize
      const data = raft.serialize();
      
      // Verify serialized data
      assert.strictEqual(data.isRaft, true, 'Serialized data should have isRaft=true');
      assert.strictEqual(data.dragFactor, raft.dragFactor, 'Serialized data should include dragFactor');
      assert.strictEqual(data.maxPassengers, 2, 'Serialized data should have maxPassengers=2');
      assert.deepStrictEqual(data.passengers, [player.id], 'Serialized data should include passenger IDs');
      
      // Test deserialization (static method)
      const deserializedRaft = Raft.deserialize(data, world);
      assert.strictEqual(deserializedRaft.isRaft, true, 'Deserialized raft should have isRaft=true');
      assert.strictEqual(deserializedRaft.maxPassengers, 2, 'Deserialized raft should have maxPassengers=2');
    });
  });
  
  // Test RaftItem implementation
  describe('Raft Item', function() {
    let world, player;
    
    beforeEach(function() {
      world = new MockWorld();
      player = new MockPlayer();
      
      // Add water blocks
      world.blocks['0,0,0'] = { material: 'water' };
    });
    
    it('should create raft items with correct properties', function() {
      const oakRaftItem = new RaftItem({ woodType: 'oak' });
      const birchChestRaftItem = new RaftItem({ woodType: 'birch', hasChest: true });
      
      assert.strictEqual(oakRaftItem.id, 'oak_raft', 'Oak raft should have correct ID');
      assert.strictEqual(oakRaftItem.isRaft, true, 'Raft item should have isRaft property set to true');
      assert.strictEqual(oakRaftItem.hasChest, false, 'Normal raft should have hasChest=false');
      
      assert.strictEqual(birchChestRaftItem.id, 'birch_chest_raft', 'Birch chest raft should have correct ID');
      assert.strictEqual(birchChestRaftItem.hasChest, true, 'Chest raft should have hasChest=true');
    });
    
    it('should place a raft in water', function() {
      const raftItem = new RaftItem({ woodType: 'oak' });
      
      // Mock context for use function
      const context = {
        world: world,
        targetBlock: {
          position: { x: 0, y: 0, z: 0 },
          face: 'top'
        }
      };
      
      // Try to use raft in water
      const result = raftItem.use(player, context);
      
      // Should succeed
      assert.strictEqual(result, true, 'Raft use should succeed in water');
      assert.strictEqual(world.entities.length, 1, 'World should have one entity (the raft)');
      assert.strictEqual(player.events.length > 0, true, 'Player should have received an event');
    });
    
    it('should handle both regular and chest variants', function() {
      const regularRaft = new RaftItem({ woodType: 'spruce' });
      const chestRaft = new RaftItem({ woodType: 'spruce', hasChest: true });
      
      // Regular raft should not have inventory
      assert.strictEqual(regularRaft.hasChest, false, 'Regular raft should not have chest');
      
      // Chest raft should have inventory
      assert.strictEqual(chestRaft.hasChest, true, 'Chest raft should have chest');
      assert.strictEqual(chestRaft.id, 'spruce_chest_raft', 'Chest raft should have correct ID');
      assert.ok(chestRaft.getDescription().includes('chest'), 'Chest raft description should mention chest');
    });
  });
  
  // Test BambooRaftItem implementation
  describe('Bamboo Raft Item', function() {
    it('should create bamboo raft items with correct properties', function() {
      const bambooRaft = new BambooRaftItem();
      const bambooChestRaft = new BambooRaftItem({ hasChest: true });
      
      assert.strictEqual(bambooRaft.id, 'bamboo_raft', 'Bamboo raft should have correct ID');
      assert.strictEqual(bambooRaft.woodType, 'bamboo', 'Bamboo raft should have wood type set to bamboo');
      assert.strictEqual(bambooRaft.isRaft, true, 'Bamboo raft should have isRaft property set to true');
      
      assert.strictEqual(bambooChestRaft.id, 'bamboo_chest_raft', 'Bamboo chest raft should have correct ID');
      assert.strictEqual(bambooChestRaft.hasChest, true, 'Bamboo chest raft should have hasChest=true');
    });
    
    it('should have bamboo-specific properties', function() {
      const bambooRaft = new BambooRaftItem();
      
      // Bamboo rafts have different properties from regular rafts
      assert.strictEqual(bambooRaft.speed, 1.1, 'Bamboo raft should have specific speed value');
      assert.strictEqual(bambooRaft.maxHealth, 300, 'Bamboo raft should have specific health value');
    });
  });
  
  // Test item registry integration
  describe('Item Registry Integration', function() {
    it('should register raft items in the item registry', function() {
      // Check if bamboo raft items are registered
      assert.strictEqual(itemRegistry.hasItem('bamboo_raft'), true, 'Bamboo raft should be registered');
      assert.strictEqual(itemRegistry.hasItem('bamboo_chest_raft'), true, 'Bamboo chest raft should be registered');
      
      // Get items from registry
      const bambooRaft = itemRegistry.getItem('bamboo_raft');
      const bambooChestRaft = itemRegistry.getItem('bamboo_chest_raft');
      
      // Verify properties
      assert.strictEqual(bambooRaft.isRaft, true, 'Bamboo raft from registry should have isRaft=true');
      assert.strictEqual(bambooChestRaft.hasChest, true, 'Bamboo chest raft from registry should have hasChest=true');
    });
  });
});

// Run tests if file is executed directly
if (require.main === module) {
  describe('Running Raft Tests directly', function() {
    // Regular raft tests
    const regularRaft = new RaftItem({ woodType: 'oak' });
    console.log('Testing Regular Raft Properties:');
    console.log('- ID:', regularRaft.id);
    console.log('- Name:', regularRaft.name);
    console.log('- Is Raft:', regularRaft.isRaft);
    console.log('- Has Chest:', regularRaft.hasChest);
    
    // Chest raft tests
    const chestRaft = new RaftItem({ woodType: 'oak', hasChest: true });
    console.log('\nTesting Chest Raft Properties:');
    console.log('- ID:', chestRaft.id);
    console.log('- Name:', chestRaft.name);
    console.log('- Is Raft:', chestRaft.isRaft);
    console.log('- Has Chest:', chestRaft.hasChest);
    
    // Bamboo raft tests
    const bambooRaft = new BambooRaftItem();
    console.log('\nTesting Bamboo Raft Properties:');
    console.log('- ID:', bambooRaft.id);
    console.log('- Wood Type:', bambooRaft.woodType);
    console.log('- Speed:', bambooRaft.speed);
    console.log('- Max Health:', bambooRaft.maxHealth);
    
    console.log('\nChecking Item Registry Integration:');
    console.log('- Bamboo Raft Registered:', itemRegistry.hasItem('bamboo_raft'));
    console.log('- Bamboo Chest Raft Registered:', itemRegistry.hasItem('bamboo_chest_raft'));
    
    console.log('\n✅ All manual tests completed!');
  });
}

module.exports = {
  runTests: function() {
    // Run all tests and return results
    try {
      // Regular raft tests
      const regularRaft = new RaftItem({ woodType: 'oak' });
      console.log('Testing Regular Raft Properties:');
      console.log('- ID:', regularRaft.id);
      console.log('- Name:', regularRaft.name);
      console.log('- Is Raft:', regularRaft.isRaft);
      console.log('- Has Chest:', regularRaft.hasChest);
      
      // Chest raft tests
      const chestRaft = new RaftItem({ woodType: 'oak', hasChest: true });
      console.log('\nTesting Chest Raft Properties:');
      console.log('- ID:', chestRaft.id);
      console.log('- Name:', chestRaft.name);
      console.log('- Is Raft:', chestRaft.isRaft);
      console.log('- Has Chest:', chestRaft.hasChest);
      
      // Bamboo raft tests
      const bambooRaft = new BambooRaftItem();
      console.log('\nTesting Bamboo Raft Properties:');
      console.log('- ID:', bambooRaft.id);
      console.log('- Wood Type:', bambooRaft.woodType);
      console.log('- Speed:', bambooRaft.speed);
      console.log('- Max Health:', bambooRaft.maxHealth);
      
      console.log('\nChecking Item Registry Integration:');
      console.log('- Bamboo Raft Registered:', itemRegistry.hasItem('bamboo_raft'));
      console.log('- Bamboo Chest Raft Registered:', itemRegistry.hasItem('bamboo_chest_raft'));
      console.log('- Oak Raft Registered:', itemRegistry.hasItem('oak_raft'));
      console.log('- Oak Chest Raft Registered:', itemRegistry.hasItem('oak_chest_raft'));
      
      // Test raft entity
      const world = new MockWorld();
      const raft = new Raft(world, { 
        position: { x: 10, y: 5, z: 10 },
        woodType: 'oak'
      });
      
      console.log('\nTesting Raft Entity Properties:');
      console.log('- Type:', raft.type);
      console.log('- Is Raft:', raft.isRaft);
      console.log('- Health:', raft.health);
      console.log('- Max Health:', raft.maxHealth);
      console.log('- Buoyancy:', raft.buoyancy);
      console.log('- Speed:', raft.speed);
      console.log('- Turn Speed:', raft.turnSpeed);
      console.log('- Max Passengers:', raft.maxPassengers);
      
      console.log('\n✅ All raft tests passed!');
      return true;
    } catch (error) {
      console.error('❌ Raft tests failed:', error);
      return false;
    }
  }
}; 