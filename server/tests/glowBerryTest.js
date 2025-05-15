/**
 * Test suite for GlowBerryItem
 * Tests functionality of glow berries as food items and as plantable items
 */

// Dependencies
const assert = require('assert');
const GlowBerryItem = require('../items/glowBerryItem');
const { CaveVineHeadBlock } = require('../blocks/caveVineBlock');

// Mock classes
class MockWorld {
  constructor() {
    this.blocks = new Map();
    this.sounds = [];
    this.items = [];
  }
  
  getBlockAt(x, y, z) {
    return this.blocks.get(`${x},${y},${z}`);
  }
  
  setBlock(x, y, z, block) {
    this.blocks.set(`${x},${y},${z}`, block);
    return true;
  }
  
  removeBlock(x, y, z) {
    this.blocks.delete(`${x},${y},${z}`);
    return true;
  }
  
  spawnItem(item, position) {
    this.items.push({ item, position });
  }
}

class MockPlayer {
  constructor() {
    this.inventory = new MockInventory();
    this.hunger = 10;
    this.saturation = 5;
    this.position = { x: 0, y: 0, z: 0 };
  }
}

class MockInventory {
  constructor() {
    this.items = {};
    this.removedItems = {};
  }
  
  addItem(type, count) {
    this.items[type] = (this.items[type] || 0) + count;
    return true;
  }
  
  removeItem(type, count) {
    this.removedItems[type] = (this.removedItems[type] || 0) + count;
    return true;
  }
}

function runTests() {
  console.log('Starting Glow Berry tests...');
  
  // Setup for all tests
  const glowBerry = new GlowBerryItem();
  const world = new MockWorld();
  const player = new MockPlayer();
  
  // Set up sound event listener
  glowBerry.on('sound', (sound) => {
    world.sounds.push(sound);
  });
  
  // Test Basic Properties
  console.log('Testing basic properties...');
  assert.strictEqual(glowBerry.id, 'glow_berries');
  assert.strictEqual(glowBerry.name, 'Glow Berries');
  assert.strictEqual(glowBerry.type, 'food');
  assert.strictEqual(glowBerry.subtype, 'plantable');
  assert.strictEqual(glowBerry.category, 'food');
  assert.strictEqual(glowBerry.stackable, true);
  assert.strictEqual(glowBerry.maxStackSize, 64);
  
  // Test food properties
  assert.strictEqual(glowBerry.foodValue, 2);
  assert.strictEqual(glowBerry.saturation, 0.4);
  
  // Test planting properties
  assert.strictEqual(glowBerry.isPlantable, true);
  assert.strictEqual(glowBerry.plantBlock, 'cave_vine_head');
  
  // Test Food Functionality
  console.log('Testing food functionality...');
  const initialHunger = player.hunger;
  const initialSaturation = player.saturation;
  
  const eatResult = glowBerry.use(player, {});
  
  assert.strictEqual(eatResult, true);
  assert.strictEqual(player.hunger, initialHunger + glowBerry.foodValue);
  assert.strictEqual(player.saturation, initialSaturation + glowBerry.saturation);
  assert.strictEqual(player.inventory.removedItems['glow_berries'], 1);
  assert.strictEqual(world.sounds.length, 1);
  assert.strictEqual(world.sounds[0].type, 'entity.player.eat');
  
  // Test not eating when hunger is full
  player.hunger = 20;
  world.sounds = []; // Clear sounds
  player.inventory.removedItems = {}; // Clear removed items
  
  const fullHungerResult = glowBerry.use(player, {});
  
  assert.strictEqual(fullHungerResult, false);
  assert.strictEqual(player.inventory.removedItems['glow_berries'], undefined);
  
  // Test Planting Functionality
  console.log('Testing planting functionality...');
  // Set up a valid ceiling for vine placement
  world.setBlock(0, 2, 0, { 
    type: 'stone', 
    solid: true 
  });
  
  // Mock the CaveVineHeadBlock.canPlaceAt method
  CaveVineHeadBlock.prototype.canPlaceAt = function(world, position) {
    const blockAbove = world.getBlockAt(position.x, position.y + 1, position.z);
    return blockAbove && blockAbove.solid;
  };
  
  // Test successful planting
  world.sounds = []; // Clear sounds
  player.inventory.removedItems = {}; // Clear removed items
  
  const plantResult = glowBerry.onUseOnBlock(world, { x: 0, y: 2, z: 0 }, 'down', player);
  
  assert.strictEqual(plantResult, true);
  const placedBlock = world.getBlockAt(0, 1, 0);
  assert.notStrictEqual(placedBlock, undefined);
  assert.strictEqual(placedBlock instanceof CaveVineHeadBlock, true);
  assert.strictEqual(player.inventory.removedItems['glow_berries'], 1);
  assert.strictEqual(world.sounds.length, 1);
  assert.strictEqual(world.sounds[0].type, 'block.cave_vines.place');
  
  // Test planting on wrong face
  world.sounds = []; // Clear sounds
  player.inventory.removedItems = {}; // Clear removed items
  
  const wrongFaceResult = glowBerry.onUseOnBlock(world, { x: 0, y: 2, z: 0 }, 'up', player);
  
  assert.strictEqual(wrongFaceResult, false);
  const nonPlacedBlock = world.getBlockAt(0, 3, 0);
  assert.strictEqual(nonPlacedBlock, undefined);
  
  // Test planting where block already exists
  world.sounds = []; // Clear sounds
  player.inventory.removedItems = {}; // Clear removed items
  world.setBlock(0, 1, 0, { type: 'dirt' });
  
  const blockExistsResult = glowBerry.onUseOnBlock(world, { x: 0, y: 2, z: 0 }, 'down', player);
  
  assert.strictEqual(blockExistsResult, false);
  
  // Test Serialization
  console.log('Testing serialization...');
  const json = glowBerry.toJSON();
  
  assert.strictEqual(json.id, 'glow_berries');
  assert.strictEqual(json.name, 'Glow Berries');
  assert.strictEqual(json.type, 'food');
  assert.strictEqual(json.foodValue, 2);
  assert.strictEqual(json.saturation, 0.4);
  assert.strictEqual(json.isPlantable, true);
  
  // Test Deserialization
  const customJson = {
    id: 'glow_berries',
    name: 'Custom Glow Berries',
    foodValue: 3,
    saturation: 0.6
  };
  
  const deserializedItem = GlowBerryItem.fromJSON(customJson);
  
  assert.strictEqual(deserializedItem.id, 'glow_berries');
  assert.strictEqual(deserializedItem.name, 'Custom Glow Berries');
  assert.strictEqual(deserializedItem.foodValue, 3);
  assert.strictEqual(deserializedItem.saturation, 0.6);
  
  // Test Tooltip
  console.log('Testing tooltip...');
  const tooltip = glowBerry.getTooltip();
  
  assert(tooltip.includes('Glow Berries'));
  assert(tooltip.some(line => line.includes('Food: +2 hunger')));
  assert(tooltip.some(line => line.includes('Can be planted')));
  assert(tooltip.some(line => line.includes('Emits light')));
  
  console.log('All Glow Berry tests passed successfully!');
  return true;
}

// Run the tests if this file is executed directly
if (require.main === module) {
  try {
    const success = runTests();
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.error('Glow Berry tests failed with error:', error);
    process.exitCode = 1;
  }
} 