/**
 * Boat With Chest Tests - Verifies the boat with chest functionality for the Wild Update
 */

// Import dependencies
const assert = require('assert');
const Boat = require('../entities/boat');
const BoatItem = require('../items/boatItem');
const ItemRegistry = require('../items/itemRegistry');

// Mock world implementation
class MockWorld {
  constructor() {
    this.entities = new Map();
    this.blocks = {};
    this.events = [];
  }
  
  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks[key] || null;
  }
  
  setBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    this.blocks[key] = block;
  }
  
  addEntity(entity) {
    this.entities.set(entity.id, entity);
    return entity.id;
  }
  
  removeEntity(id) {
    return this.entities.delete(id);
  }
  
  getEntity(id) {
    return this.entities.get(id) || null;
  }
  
  getEntitiesInRadius(position, radius) {
    const result = [];
    
    for (const entity of this.entities.values()) {
      const dx = entity.position.x - position.x;
      const dy = entity.position.y - position.y;
      const dz = entity.position.z - position.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      
      if (distSq <= radius * radius) {
        result.push(entity);
      }
    }
    
    return result;
  }
  
  createDrop(options) {
    this.events.push({
      type: 'drop_created',
      ...options
    });
  }
}

// Mock player implementation
class MockPlayer {
  constructor(id, position, rotation) {
    this.id = id;
    this.position = position || { x: 0, y: 0, z: 0 };
    this.rotation = rotation || { x: 0, y: 0, z: 0 };
    this.events = [];
  }
  
  emit(event, data) {
    this.events.push({ event, data });
  }
}

// Test suite
function runBoatWithChestTests() {
  console.log('Starting Boat with Chest tests...');
  
  testBoatEntityBasics();
  testBoatWithChestInventory();
  testBoatItemPlacement();
  testBoatPhysicsInWater();
  testBoatPassengerInteraction();
  testBoatSerialization();
  testBoatBreakingAndDrops();
  testBoatWithChestItemRegistration();
  
  console.log('All Boat with Chest tests completed successfully!');
}

/**
 * Test basic boat entity properties and creation
 */
function testBoatEntityBasics() {
  console.log('Testing Boat entity basics...');
  
  const world = new MockWorld();
  
  // Test regular boat
  const regularBoat = new Boat(world, {
    position: { x: 10, y: 65, z: 10 },
    woodType: 'oak',
    hasChest: false
  });
  
  assert.strictEqual(regularBoat.type, 'boat');
  assert.strictEqual(regularBoat.woodType, 'oak');
  assert.strictEqual(regularBoat.hasChest, false);
  assert.strictEqual(regularBoat.inventorySize, 0);
  assert.strictEqual(regularBoat.inventory.length, 0);
  
  // Test boat with chest
  const boatWithChest = new Boat(world, {
    position: { x: 10, y: 65, z: 10 },
    woodType: 'spruce',
    hasChest: true
  });
  
  assert.strictEqual(boatWithChest.type, 'boat');
  assert.strictEqual(boatWithChest.woodType, 'spruce');
  assert.strictEqual(boatWithChest.hasChest, true);
  assert.strictEqual(boatWithChest.inventorySize, 27);
  assert.strictEqual(boatWithChest.inventory.length, 27);
  
  // Check all inventory slots are empty
  for (const slot of boatWithChest.inventory) {
    assert.strictEqual(slot, null);
  }
  
  console.log('Boat entity basics tests passed!');
}

/**
 * Test boat with chest inventory functionality
 */
function testBoatWithChestInventory() {
  console.log('Testing Boat with Chest inventory...');
  
  const world = new MockWorld();
  
  // Create a boat with chest
  const boatWithChest = new Boat(world, {
    position: { x: 10, y: 65, z: 10 },
    woodType: 'oak',
    hasChest: true
  });
  
  // Create a test item
  const testItem = {
    type: 'apple',
    count: 5,
    metadata: {}
  };
  
  // Test adding items to chest
  assert.strictEqual(boatWithChest.addItem(testItem), true);
  
  // Check that item was added to the first slot
  assert.deepStrictEqual(boatWithChest.inventory[0], testItem);
  
  // Test removing items from chest
  const removedItem = boatWithChest.removeItem(0);
  assert.deepStrictEqual(removedItem, testItem);
  assert.strictEqual(boatWithChest.inventory[0], null);
  
  // Test inventory full behavior
  // Fill entire inventory
  for (let i = 0; i < boatWithChest.inventorySize; i++) {
    assert.strictEqual(boatWithChest.addItem({ ...testItem }), true);
  }
  
  // Try to add one more item beyond capacity
  assert.strictEqual(boatWithChest.addItem({ ...testItem }), false);
  
  // Test removing from invalid slot
  assert.strictEqual(boatWithChest.removeItem(-1), null);
  assert.strictEqual(boatWithChest.removeItem(100), null);
  
  // Test regular boat has no inventory functionality
  const regularBoat = new Boat(world, {
    position: { x: 10, y: 65, z: 10 },
    woodType: 'oak',
    hasChest: false
  });
  
  assert.strictEqual(regularBoat.addItem(testItem), false);
  assert.strictEqual(regularBoat.removeItem(0), null);
  
  console.log('Boat with Chest inventory tests passed!');
}

/**
 * Test boat item placement in water
 */
function testBoatItemPlacement() {
  console.log('Testing Boat item placement...');
  
  const world = new MockWorld();
  
  // Create water blocks
  world.setBlock(10, 63, 10, { material: 'water', isSolid: false });
  
  // Create a Player
  const player = new MockPlayer('player1', { x: 10, y: 65, z: 12 });
  
  // Create Boat items for testing
  const regularBoatItem = new BoatItem({ woodType: 'oak', hasChest: false });
  const boatWithChestItem = new BoatItem({ woodType: 'birch', hasChest: true });
  
  // Test placement context
  const placementContext = {
    world,
    targetBlock: {
      position: { x: 10, y: 63, z: 10 },
      face: 'top'
    }
  };
  
  // Test placement of regular boat
  assert.strictEqual(regularBoatItem.use(player, placementContext), true);
  
  // Find the boat entity in the world
  let placedBoat = null;
  for (const entity of world.entities.values()) {
    if (entity.type === 'boat') {
      placedBoat = entity;
      break;
    }
  }
  
  // Verify boat was properly placed
  assert.notStrictEqual(placedBoat, null);
  assert.strictEqual(placedBoat.woodType, 'oak');
  assert.strictEqual(placedBoat.hasChest, false);
  
  // Clear world entities
  world.entities.clear();
  
  // Test placement of boat with chest
  assert.strictEqual(boatWithChestItem.use(player, placementContext), true);
  
  // Find the boat with chest entity
  let placedBoatWithChest = null;
  for (const entity of world.entities.values()) {
    if (entity.type === 'boat') {
      placedBoatWithChest = entity;
      break;
    }
  }
  
  // Verify boat with chest was properly placed
  assert.notStrictEqual(placedBoatWithChest, null);
  assert.strictEqual(placedBoatWithChest.woodType, 'birch');
  assert.strictEqual(placedBoatWithChest.hasChest, true);
  assert.strictEqual(placedBoatWithChest.inventorySize, 27);
  
  // Test fail placement on land
  const invalidPlacementContext = {
    world,
    targetBlock: {
      position: { x: 15, y: 63, z: 15 },
      face: 'top'
    }
  };
  
  // No water at this position, should fail
  assert.strictEqual(regularBoatItem.use(player, invalidPlacementContext), false);
  
  console.log('Boat item placement tests passed!');
}

/**
 * Test boat physics in water
 */
function testBoatPhysicsInWater() {
  console.log('Testing Boat physics in water...');
  
  const world = new MockWorld();
  
  // Create water blocks
  world.setBlock(10, 64, 10, { material: 'water', isSolid: false });
  
  // Create a boat in water
  const boat = new Boat(world, {
    position: { x: 10, y: 64.5, z: 10 },
    woodType: 'oak',
    hasChest: true
  });
  
  // Force set isInWater to true to match expected test conditions
  boat.setInWater(true, 64.9); // Water level at y=64 + 0.9
  
  // Set boat velocity downward and record initial position
  boat.velocity.y = -0.5;
  const initialY = boat.position.y;
  
  // Add boat to world
  world.addEntity(boat);
  
  // Update boat for 10 ticks
  for (let i = 0; i < 10; i++) {
    boat.update(1);
  }
  
  // Boat in water should have buoyancy and not sink significantly
  assert.ok(boat.position.y >= initialY - 0.5);
  assert.strictEqual(boat.isInWater, true);
  
  // Move boat out of water
  boat.position.x = 15;
  boat.position.y = 65;
  boat.position.z = 15;
  boat.velocity.y = -0.5;
  boat.setInWater(false); // Force set to simulate removal from water
  
  // Update boat out of water for 10 ticks
  for (let i = 0; i < 10; i++) {
    boat.update(1);
  }
  
  // Boat should fall due to gravity when not in water
  assert.ok(boat.position.y < 65 - 0.5);
  assert.strictEqual(boat.isInWater, false);
  
  console.log('Boat physics in water tests passed!');
}

/**
 * Test boat passenger interaction
 */
function testBoatPassengerInteraction() {
  console.log('Testing Boat passenger interaction...');
  
  const world = new MockWorld();
  
  // Create a boat with chest
  const boat = new Boat(world, {
    position: { x: 10, y: 65, z: 10 },
    woodType: 'oak',
    hasChest: true
  });
  
  // Create mock passengers
  const player1 = new MockPlayer('player1', { x: 10, y: 65, z: 10 });
  const player2 = new MockPlayer('player2', { x: 10, y: 65, z: 10 });
  
  // Test adding passenger
  assert.strictEqual(boat.addPassenger(player1), true);
  assert.strictEqual(boat.passenger, 'player1');
  
  // Test that second passenger can't be added
  assert.strictEqual(boat.addPassenger(player2), false);
  assert.strictEqual(boat.passenger, 'player1');
  
  // Test passenger input processing
  boat.setInput({ forward: 1, turn: 0.5 });
  
  // Track initial position and rotation
  const initialX = boat.position.x;
  const initialZ = boat.position.z;
  const initialRotation = boat.rotation.y;
  
  // Update boat for 10 ticks
  for (let i = 0; i < 10; i++) {
    boat.update(1);
  }
  
  // Boat should have moved forward and turned
  assert.ok(boat.position.x !== initialX || boat.position.z !== initialZ);
  assert.notStrictEqual(boat.rotation.y, initialRotation);
  
  // Test removing passenger
  const removedPassengerId = boat.removePassenger();
  assert.strictEqual(removedPassengerId, 'player1');
  assert.strictEqual(boat.passenger, null);
  
  console.log('Boat passenger interaction tests passed!');
}

/**
 * Test boat serialization/deserialization
 */
function testBoatSerialization() {
  console.log('Testing Boat serialization...');
  
  const world = new MockWorld();
  
  // Create a boat with chest and some inventory
  const boat = new Boat(world, {
    id: 'test_boat',
    position: { x: 10.5, y: 65, z: 10.5 },
    rotation: { x: 0, y: 45, z: 0 },
    woodType: 'oak',
    hasChest: true
  });
  
  // Add some items to inventory
  boat.addItem({ type: 'apple', count: 1 });
  boat.addItem({ type: 'iron_ingot', count: 5 });
  
  // Add a passenger
  boat.addPassenger({ id: 'player1' });
  
  // Serialize boat
  const serialized = boat.serialize();
  
  // Create a new boat from serialized data
  const deserializedBoat = new Boat(world);
  deserializedBoat.deserialize(serialized);
  
  // Verify properties were properly deserialized
  assert.strictEqual(deserializedBoat.id, 'test_boat');
  assert.deepStrictEqual(deserializedBoat.position, { x: 10.5, y: 65, z: 10.5 });
  assert.deepStrictEqual(deserializedBoat.rotation, { x: 0, y: 45, z: 0 });
  assert.strictEqual(deserializedBoat.woodType, 'oak');
  assert.strictEqual(deserializedBoat.hasChest, true);
  assert.strictEqual(deserializedBoat.passenger, 'player1');
  
  // Verify inventory
  assert.strictEqual(deserializedBoat.inventory[0].type, 'apple');
  assert.strictEqual(deserializedBoat.inventory[0].count, 1);
  assert.strictEqual(deserializedBoat.inventory[1].type, 'iron_ingot');
  assert.strictEqual(deserializedBoat.inventory[1].count, 5);
  
  console.log('Boat serialization tests passed!');
}

/**
 * Test boat breaking and item drops
 */
function testBoatBreakingAndDrops() {
  console.log('Testing Boat breaking and drops...');
  
  const world = new MockWorld();
  
  // Create a boat with chest and some inventory
  const boat = new Boat(world, {
    position: { x: 10, y: 65, z: 10 },
    woodType: 'birch',
    hasChest: true
  });
  
  // Add some items to inventory
  boat.addItem({ type: 'diamond', count: 3 });
  boat.addItem({ type: 'emerald', count: 2 });
  
  // Add boat to world
  world.addEntity(boat);
  
  // Add a passenger
  boat.addPassenger({ id: 'player1' });
  
  // Break the boat
  boat.break({ id: 'player2' });
  
  // Boat should be removed from world
  assert.strictEqual(world.entities.has(boat.id), false);
  
  // Debug log the events
  console.log('Events after breaking boat:', JSON.stringify(world.events, null, 2));
  
  // Verify that all expected drops were created
  const boatDrops = world.events.filter(event => event.type === 'boat_with_chest');
  const diamondDrops = world.events.filter(event => event.type === 'diamond');
  const emeraldDrops = world.events.filter(event => event.type === 'emerald');
  
  // Check boat drop
  assert.strictEqual(boatDrops.length, 1, "Boat with chest not dropped");
  assert.strictEqual(boatDrops[0].metadata.woodType, 'birch');
  assert.strictEqual(boatDrops[0].metadata.hasChest, true);
  
  // Check diamond drop
  assert.strictEqual(diamondDrops.length, 1, "Diamond not dropped");
  assert.strictEqual(diamondDrops[0].count, 3);
  
  // Check emerald drop
  assert.strictEqual(emeraldDrops.length, 1, "Emerald not dropped");
  assert.strictEqual(emeraldDrops[0].count, 2);
  
  console.log('Boat breaking and drops tests passed!');
}

/**
 * Test boat item registration in ItemRegistry
 */
function testBoatWithChestItemRegistration() {
  console.log('Testing Boat with Chest item registration...');
  
  // Create BoatItems manually
  const oakBoat = new BoatItem({ woodType: 'oak', hasChest: false });
  const oakBoatWithChest = new BoatItem({ woodType: 'oak', hasChest: true });
  
  // Check IDs and names
  assert.strictEqual(oakBoat.id, 'oak_boat');
  assert.strictEqual(oakBoatWithChest.id, 'oak_boat_with_chest');
  assert.strictEqual(oakBoat.name, 'Oak Boat');
  assert.strictEqual(oakBoatWithChest.name, 'Oak Boat with Chest');
  
  // Check ItemRegistry has registered all variants
  const registry = ItemRegistry;
  
  // Check regular boats
  assert.ok(registry.hasItem('oak_boat'));
  assert.ok(registry.hasItem('spruce_boat'));
  assert.ok(registry.hasItem('birch_boat'));
  assert.ok(registry.hasItem('jungle_boat'));
  assert.ok(registry.hasItem('acacia_boat'));
  assert.ok(registry.hasItem('dark_oak_boat'));
  assert.ok(registry.hasItem('mangrove_boat'));
  
  // Check boats with chests
  assert.ok(registry.hasItem('oak_boat_with_chest'));
  assert.ok(registry.hasItem('spruce_boat_with_chest'));
  assert.ok(registry.hasItem('birch_boat_with_chest'));
  assert.ok(registry.hasItem('jungle_boat_with_chest'));
  assert.ok(registry.hasItem('acacia_boat_with_chest'));
  assert.ok(registry.hasItem('dark_oak_boat_with_chest'));
  assert.ok(registry.hasItem('mangrove_boat_with_chest'));
  
  console.log('Boat with Chest item registration tests passed!');
}

module.exports = runBoatWithChestTests; 