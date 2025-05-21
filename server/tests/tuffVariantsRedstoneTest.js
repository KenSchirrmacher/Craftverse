const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const RedstoneBlock = require('../blocks/redstoneBlock');
const RedstoneTorchBlock = require('../blocks/redstoneTorchBlock');
const RedstoneRepeaterBlock = require('../blocks/redstoneRepeaterBlock');
const RedstoneComparatorBlock = require('../blocks/redstoneComparatorBlock');

class TuffVariantsRedstoneTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testRedstoneConduction();
    this.testRedstoneTorchInteraction();
    this.testRedstoneRepeaterInteraction();
    this.testRedstoneComparatorInteraction();
  }

  testRedstoneConduction() {
    console.log('Testing redstone conduction...');
    
    // Test Tuff Bricks redstone conduction
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place redstone dust
    const redstone = new RedstoneBlock();
    redstone.place(this.world, { x: 1, y: 0, z: 0 });
    
    // Test redstone conduction
    assert.strictEqual(placedBricks.canConductRedstone(), false);
    assert.strictEqual(placedBricks.getRedstonePower(), 0);
    
    // Test redstone power level
    redstone.setPowerLevel(15);
    assert.strictEqual(placedBricks.getRedstonePower(), 0);
  }

  testRedstoneTorchInteraction() {
    console.log('Testing redstone torch interaction...');
    
    // Test Tuff Brick Wall redstone torch interaction
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place redstone torch
    const torch = new RedstoneTorchBlock();
    torch.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test torch power
    assert.strictEqual(torch.isPowered(), true);
    assert.strictEqual(placedWall.getRedstonePower(), 0);
    
    // Test torch deactivation
    torch.deactivate();
    assert.strictEqual(torch.isPowered(), false);
  }

  testRedstoneRepeaterInteraction() {
    console.log('Testing redstone repeater interaction...');
    
    // Test Tuff Brick Stairs redstone repeater interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place redstone repeater
    const repeater = new RedstoneRepeaterBlock();
    repeater.place(this.world, { x: 1, y: 0, z: 0 });
    
    // Test repeater delay
    assert.strictEqual(repeater.getDelay(), 1);
    repeater.setDelay(4);
    assert.strictEqual(repeater.getDelay(), 4);
    
    // Test repeater power
    repeater.setPowerLevel(15);
    assert.strictEqual(placedStairs.getRedstonePower(), 0);
  }

  testRedstoneComparatorInteraction() {
    console.log('Testing redstone comparator interaction...');
    
    // Test Tuff Brick Slab redstone comparator interaction
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place redstone comparator
    const comparator = new RedstoneComparatorBlock();
    comparator.place(this.world, { x: 1, y: 0, z: 0 });
    
    // Test comparator mode
    assert.strictEqual(comparator.getMode(), 'compare');
    comparator.setMode('subtract');
    assert.strictEqual(comparator.getMode(), 'subtract');
    
    // Test comparator power
    comparator.setPowerLevel(15);
    assert.strictEqual(placedSlab.getRedstonePower(), 0);
  }
}

// Run tests
const test = new TuffVariantsRedstoneTest();
test.runTests();
console.log('All Tuff variants redstone interaction tests passed!');

module.exports = TuffVariantsRedstoneTest; 