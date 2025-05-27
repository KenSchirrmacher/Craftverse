/**
 * Bamboo Blocks Test Suite
 * Tests the implementation of the Bamboo wood set for the 1.20 Update
 */

const assert = require('assert');
const blockRegistry = require('../blocks/blockRegistry');
const itemRegistry = require('../items/itemRegistry');
const { 
  BambooBlock,
  BambooWoodBlock, 
  BambooPlanksBlock, 
  BambooMosaicBlock, 
  BambooDoorBlock,
  BambooTrapdoorBlock,
  BambooFenceBlock,
  BambooFenceGateBlock,
  BambooSlabBlock,
  BambooStairsBlock
} = require('../blocks/bambooBlock');
const { BambooItem, BambooSignItem } = require('../items/bambooItem');
const BambooRaftItem = require('../items/bambooRaftItem');
const World = require('../world/world');
const Player = require('../entities/player');

// Test world implementation
class TestWorld extends World {
  constructor() {
    super();
    this.blocks = {};
    this.entities = [];
    this.sounds = [];
  }
  
  setBlockAt(x, y, z, blockId, data = {}) {
    const key = `${x},${y},${z}`;
    const blockType = blockRegistry.getBlock(blockId);
    if (!blockType) return false;
    
    // Create a proper block instance instead of just copying properties
    const block = blockRegistry.createBlock(blockId, {
      position: { x, y, z },
      ...data
    });
    
    if (!block) return false;
    
    this.blocks[key] = block;
    return true;
  }
  
  getBlockAt(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks[key] || null;
  }
  
  playSound(position, sound, volume, pitch) {
    this.sounds.push({ position, sound, volume, pitch });
    return true;
  }
  
  createEntity(data) {
    this.entities.push(data);
    return data;
  }
  
  createBlock(id, position, data = {}) {
    const block = blockRegistry.createBlock(id, {
      position,
      ...data
    });
    if (!block) return null;
    
    this.setBlockAt(position.x, position.y, position.z, id, data);
    return block;
  }
  
  getBlock(x, y, z) {
    // Alias for getBlockAt for compatibility
    return this.getBlockAt(x, y, z);
  }
}

// Test player implementation
class TestPlayer extends Player {
  constructor() {
    super();
    this.world = new TestWorld();
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { yaw: 0, pitch: 0 };
    this.inventory = [];
  }
  
  giveItem(item) {
    this.inventory.push(item);
    return true;
  }
  
  removeItem(item) {
    const index = this.inventory.indexOf(item);
    if (index !== -1) {
      this.inventory.splice(index, 1);
      return true;
    }
    return false;
  }
  
  updateItem(item) {
    const index = this.inventory.findIndex(i => i.id === item.id);
    if (index !== -1) {
      this.inventory[index] = item;
      return true;
    }
    return false;
  }
}

/**
 * Main test function
 */
function runBambooBlocksTest() {
  console.log('Running Bamboo Blocks Tests...');
  
  try {
    testBambooBlockRegistration();
    testBambooBlockProperties();
    testBambooBlockPlacement();
    testBambooItemRegistration();
    testBambooRaftItem();
    testBambooInteractions();
    
    console.log('All Bamboo Blocks Tests Passed!');
    return true;
  } catch (error) {
    console.error('Bamboo Blocks test failed:', error);
    return false;
  }
}

/**
 * Test bamboo block registration in the block registry
 */
function testBambooBlockRegistration() {
  console.log('Testing Bamboo Block Registration...');
  
  // Test that all bamboo blocks are registered
  const bambooBlockIds = [
    'bamboo_block',
    'stripped_bamboo_block',
    'bamboo_planks',
    'bamboo_mosaic',
    'bamboo_door',
    'bamboo_trapdoor',
    'bamboo_fence',
    'bamboo_fence_gate',
    'bamboo_slab',
    'bamboo_mosaic_slab',
    'bamboo_stairs',
    'bamboo_mosaic_stairs',
    'bamboo_button',
    'bamboo_pressure_plate',
    'bamboo_sign',
    'bamboo_wall_sign',
    'bamboo_hanging_sign'
  ];
  
  for (const blockId of bambooBlockIds) {
    assert.strictEqual(
      blockRegistry.hasBlock(blockId), 
      true, 
      `Block ${blockId} should be registered`
    );
  }
  
  console.log('Bamboo Block Registration tests passed!');
}

/**
 * Test bamboo block properties
 */
function testBambooBlockProperties() {
  console.log('Testing Bamboo Block Properties...');
  
  // Test BambooBlock base properties
  const bambooBlock = new BambooBlock();
  assert.strictEqual(bambooBlock.material, 'wood', 'Material should be wood');
  assert.strictEqual(bambooBlock.flammable, true, 'Bamboo should be flammable');
  
  // Test BambooWoodBlock properties
  const bambooWoodBlock = new BambooWoodBlock();
  assert.strictEqual(bambooWoodBlock.id, 'bamboo_block', 'ID should be bamboo_block');
  assert.strictEqual(bambooWoodBlock.stripped, false, 'Should not be stripped by default');
  
  const strippedBambooBlock = new BambooWoodBlock({ stripped: true });
  assert.strictEqual(strippedBambooBlock.id, 'stripped_bamboo_block', 'ID should be stripped_bamboo_block');
  assert.strictEqual(strippedBambooBlock.stripped, true, 'Should be stripped');
  
  // Test BambooPlanksBlock properties
  const bambooPlanksBlock = new BambooPlanksBlock();
  assert.strictEqual(bambooPlanksBlock.id, 'bamboo_planks', 'ID should be bamboo_planks');
  assert.deepStrictEqual(bambooPlanksBlock.textures, { all: 'blocks/bamboo_planks' }, 'Should have correct texture');
  
  // Test BambooMosaicBlock properties
  const bambooMosaicBlock = new BambooMosaicBlock();
  assert.strictEqual(bambooMosaicBlock.id, 'bamboo_mosaic', 'ID should be bamboo_mosaic');
  assert.deepStrictEqual(bambooMosaicBlock.textures, { all: 'blocks/bamboo_mosaic' }, 'Should have correct texture');
  
  // Test BambooDoorBlock properties
  const bambooDoorBlock = new BambooDoorBlock();
  assert.strictEqual(bambooDoorBlock.id, 'bamboo_door', 'ID should be bamboo_door');
  assert.strictEqual(bambooDoorBlock.isOpen, false, 'Door should be closed by default');
  
  // Test BambooFenceBlock properties  
  const bambooFenceBlock = new BambooFenceBlock();  
  assert.strictEqual(bambooFenceBlock.id, 'bamboo_fence', 'ID should be bamboo_fence');  
  assert.strictEqual(bambooFenceBlock.solid, false, 'Fence should not be solid');
  
  console.log('Bamboo Block Properties tests passed!');
}

/**
 * Test bamboo block placement
 */
function testBambooBlockPlacement() {
  console.log('Testing Bamboo Block Placement...');
  
  const world = new TestWorld();
  
  // Test placing a bamboo block
  const success = world.setBlockAt(5, 5, 5, 'bamboo_block');
  assert.strictEqual(success, true, 'Should be able to place bamboo block');
  
  const placedBlock = world.getBlockAt(5, 5, 5);
  assert.strictEqual(placedBlock.id, 'bamboo_block', 'Block should be a bamboo block');
  
  // Test placing a bamboo door
  const doorSuccess = world.setBlockAt(6, 5, 5, 'bamboo_door', { half: 'lower' });
  assert.strictEqual(doorSuccess, true, 'Should be able to place bamboo door');
  
  const placedDoor = world.getBlockAt(6, 5, 5);
  assert.strictEqual(placedDoor.id, 'bamboo_door', 'Block should be a bamboo door');
  assert.strictEqual(placedDoor.half, 'lower', 'Door should be the lower half');
  
  console.log('Bamboo Block Placement tests passed!');
}

/**
 * Test bamboo item registration in the item registry
 */
function testBambooItemRegistration() {
  console.log('Testing Bamboo Item Registration...');
  
  // Test that all bamboo items are registered
  const bambooItemIds = [
    'bamboo',
    'bamboo_sign',
    'bamboo_button',
    'bamboo_pressure_plate',
    'bamboo_block',
    'stripped_bamboo_block',
    'bamboo_planks',
    'bamboo_mosaic',
    'bamboo_door',
    'bamboo_trapdoor',
    'bamboo_fence',
    'bamboo_fence_gate',
    'bamboo_slab',
    'bamboo_mosaic_slab',
    'bamboo_stairs',
    'bamboo_mosaic_stairs',
    'bamboo_raft',
    'bamboo_chest_raft'
  ];
  
  for (const itemId of bambooItemIds) {
    assert.strictEqual(
      itemRegistry.hasItem(itemId), 
      true, 
      `Item ${itemId} should be registered`
    );
  }
  
  // Test bamboo item properties
  const bambooItem = itemRegistry.getItem('bamboo');
  assert.strictEqual(bambooItem.type, 'bamboo', 'Should have correct type');
  assert.strictEqual(bambooItem.stackable, true, 'Should be stackable');
  assert.strictEqual(bambooItem.maxStackSize, 64, 'Should have stack size of 64');
  
  console.log('Bamboo Item Registration tests passed!');
}

/**
 * Test bamboo raft item functionality
 */
function testBambooRaftItem() {
  console.log('Testing Bamboo Raft Item...');
  
  const world = new TestWorld();
  const player = new TestPlayer();
  
  // Create a bamboo raft
  const raft = new BambooRaftItem();
  
  // Test basic properties
  assert.strictEqual(raft.type, 'bamboo_raft', 'Should have correct type');
  assert.strictEqual(raft.durability, 100, 'Should have correct durability');
  assert.strictEqual(raft.maxDurability, 100, 'Should have correct max durability');
  
  // Test placing raft in water
  const waterBlock = { type: 'water', metadata: { level: 0 } };
  world.setBlockAt(0, 0, 0, waterBlock.type, waterBlock.metadata);
  
  const placeResult = raft.onUseOnBlock(world, player, waterBlock, { x: 0, y: 0, z: 0 });
  assert.strictEqual(placeResult, true, 'Should be able to place raft in water');
  
  // Test raft entity creation
  assert.strictEqual(world.entities.length, 1, 'Should create a raft entity');
  const raftEntity = world.entities[0];
  assert.strictEqual(raftEntity.type, 'bamboo_raft', 'Should create correct entity type');
  
  // Test raft movement
  const initialPos = { ...raftEntity.position };
  raftEntity.update(1); // Update for 1 tick
  assert.notDeepStrictEqual(raftEntity.position, initialPos, 'Raft should move');
  
  console.log('Bamboo Raft Item tests passed!');
}

/**
 * Test bamboo block interactions
 */
function testBambooInteractions() {
  console.log('Testing Bamboo Block Interactions...');
  
  const world = new TestWorld();
  const player = new TestPlayer();
  
  // Test door interaction
  const door = new BambooDoorBlock();
  world.setBlockAt(0, 0, 0, door.id);
  
  door.interact(player);
  assert.strictEqual(door.isOpen, true, 'Door should open on interaction');
  
  door.interact(player);
  assert.strictEqual(door.isOpen, false, 'Door should close on second interaction');
  
  // Test trapdoor interaction
  const trapdoor = new BambooTrapdoorBlock();
  world.setBlockAt(1, 0, 0, trapdoor.id);
  
  trapdoor.interact(player);
  assert.strictEqual(trapdoor.isOpen, true, 'Trapdoor should open on interaction');
  
  trapdoor.interact(player);
  assert.strictEqual(trapdoor.isOpen, false, 'Trapdoor should close on second interaction');
  
  // Test fence gate interaction
  const fenceGate = new BambooFenceGateBlock();
  world.setBlockAt(2, 0, 0, fenceGate.id);
  
  fenceGate.interact(player);
  assert.strictEqual(fenceGate.isOpen, true, 'Fence gate should open on interaction');
  
  fenceGate.interact(player);
  assert.strictEqual(fenceGate.isOpen, false, 'Fence gate should close on second interaction');
  
  // Test bamboo wood stripping
  const bambooWood = new BambooWoodBlock();
  world.setBlockAt(3, 0, 0, bambooWood.id);
  
  const axe = { type: 'wooden_axe' };
  bambooWood.interact(player, axe);
  assert.strictEqual(bambooWood.stripped, true, 'Bamboo wood should be stripped with axe');
  
  console.log('Bamboo Block Interactions tests passed!');
}

// Run the tests if this file is executed directly
if (require.main === module) {
  try {
    const success = runBambooBlocksTest();
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.error('Bamboo Blocks tests failed with error:', error);
    process.exitCode = 1;
  }
}

module.exports = {
  runBambooBlocksTest
}; 