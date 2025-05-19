/**
 * Tests for Tuff Variant Blocks implementation
 * Verifies the functionality of tuff variants for the 1.21 Tricky Trials update
 */

const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariants');
const BlockRegistry = require('../registry/blockRegistry');
const TestWorld = require('./testWorld');

class TuffVariantsTest {
  constructor() {
    this.world = new TestWorld();
  }

  runTests() {
    this.testChiseledTuff();
    this.testTuffBricks();
    this.testTuffBrickSlab();
    this.testTuffBrickStairs();
    this.testTuffBrickWall();
    this.testRegistryIntegration();
  }

  testChiseledTuff() {
    console.log('Testing Chiseled Tuff...');
    const block = new ChiseledTuffBlock();

    // Test basic properties
    assert.strictEqual(block.id, 'chiseled_tuff');
    assert.strictEqual(block.name, 'Chiseled Tuff');
    assert.strictEqual(block.hardness, 1.5);
    assert.strictEqual(block.resistance, 6.0);
    assert.strictEqual(block.transparent, false);
    assert.strictEqual(block.lightLevel, 0);

    // Test drops
    const drops = block.getDrops();
    assert.strictEqual(drops.length, 1);
    assert.strictEqual(drops[0].id, 'chiseled_tuff');
    assert.strictEqual(drops[0].count, 1);

    // Test placement
    this.world.setBlock(0, 0, 0, block);
    const placedBlock = this.world.getBlock(0, 0, 0);
    assert.strictEqual(placedBlock.id, 'chiseled_tuff');
  }

  testTuffBricks() {
    console.log('Testing Tuff Bricks...');
    const block = new TuffBricksBlock();

    // Test basic properties
    assert.strictEqual(block.id, 'tuff_bricks');
    assert.strictEqual(block.name, 'Tuff Bricks');
    assert.strictEqual(block.hardness, 1.5);
    assert.strictEqual(block.resistance, 6.0);
    assert.strictEqual(block.transparent, false);
    assert.strictEqual(block.lightLevel, 0);

    // Test drops
    const drops = block.getDrops();
    assert.strictEqual(drops.length, 1);
    assert.strictEqual(drops[0].id, 'tuff_bricks');
    assert.strictEqual(drops[0].count, 1);

    // Test placement
    this.world.setBlock(0, 0, 0, block);
    const placedBlock = this.world.getBlock(0, 0, 0);
    assert.strictEqual(placedBlock.id, 'tuff_bricks');
  }

  testTuffBrickSlab() {
    console.log('Testing Tuff Brick Slab...');
    const block = new TuffBrickSlabBlock();

    // Test basic properties
    assert.strictEqual(block.id, 'tuff_brick_slab');
    assert.strictEqual(block.name, 'Tuff Brick Slab');
    assert.strictEqual(block.hardness, 1.5);
    assert.strictEqual(block.resistance, 6.0);
    assert.strictEqual(block.transparent, false);
    assert.strictEqual(block.lightLevel, 0);
    assert.strictEqual(block.isSlab, true);

    // Test drops
    const drops = block.getDrops();
    assert.strictEqual(drops.length, 1);
    assert.strictEqual(drops[0].id, 'tuff_brick_slab');
    assert.strictEqual(drops[0].count, 1);

    // Test placement
    this.world.setBlock(0, 0, 0, block);
    const placedBlock = this.world.getBlock(0, 0, 0);
    assert.strictEqual(placedBlock.id, 'tuff_brick_slab');
  }

  testTuffBrickStairs() {
    console.log('Testing Tuff Brick Stairs...');
    const block = new TuffBrickStairsBlock();

    // Test basic properties
    assert.strictEqual(block.id, 'tuff_brick_stairs');
    assert.strictEqual(block.name, 'Tuff Brick Stairs');
    assert.strictEqual(block.hardness, 1.5);
    assert.strictEqual(block.resistance, 6.0);
    assert.strictEqual(block.transparent, false);
    assert.strictEqual(block.lightLevel, 0);
    assert.strictEqual(block.isStairs, true);

    // Test drops
    const drops = block.getDrops();
    assert.strictEqual(drops.length, 1);
    assert.strictEqual(drops[0].id, 'tuff_brick_stairs');
    assert.strictEqual(drops[0].count, 1);

    // Test placement
    this.world.setBlock(0, 0, 0, block);
    const placedBlock = this.world.getBlock(0, 0, 0);
    assert.strictEqual(placedBlock.id, 'tuff_brick_stairs');
  }

  testTuffBrickWall() {
    console.log('Testing Tuff Brick Wall...');
    const block = new TuffBrickWallBlock();

    // Test basic properties
    assert.strictEqual(block.id, 'tuff_brick_wall');
    assert.strictEqual(block.name, 'Tuff Brick Wall');
    assert.strictEqual(block.hardness, 1.5);
    assert.strictEqual(block.resistance, 6.0);
    assert.strictEqual(block.transparent, false);
    assert.strictEqual(block.lightLevel, 0);
    assert.strictEqual(block.isWall, true);

    // Test drops
    const drops = block.getDrops();
    assert.strictEqual(drops.length, 1);
    assert.strictEqual(drops[0].id, 'tuff_brick_wall');
    assert.strictEqual(drops[0].count, 1);

    // Test placement
    this.world.setBlock(0, 0, 0, block);
    const placedBlock = this.world.getBlock(0, 0, 0);
    assert.strictEqual(placedBlock.id, 'tuff_brick_wall');
  }

  testRegistryIntegration() {
    console.log('Testing Registry Integration...');

    // Test block registration
    assert.strictEqual(BlockRegistry.getBlock('chiseled_tuff') !== undefined, true);
    assert.strictEqual(BlockRegistry.getBlock('tuff_bricks') !== undefined, true);
    assert.strictEqual(BlockRegistry.getBlock('tuff_brick_slab') !== undefined, true);
    assert.strictEqual(BlockRegistry.getBlock('tuff_brick_stairs') !== undefined, true);
    assert.strictEqual(BlockRegistry.getBlock('tuff_brick_wall') !== undefined, true);

    // Test block instantiation
    const chiseledTuff = BlockRegistry.createBlock('chiseled_tuff');
    const tuffBricks = BlockRegistry.createBlock('tuff_bricks');
    const tuffBrickSlab = BlockRegistry.createBlock('tuff_brick_slab');
    const tuffBrickStairs = BlockRegistry.createBlock('tuff_brick_stairs');
    const tuffBrickWall = BlockRegistry.createBlock('tuff_brick_wall');

    assert.strictEqual(chiseledTuff instanceof ChiseledTuffBlock, true);
    assert.strictEqual(tuffBricks instanceof TuffBricksBlock, true);
    assert.strictEqual(tuffBrickSlab instanceof TuffBrickSlabBlock, true);
    assert.strictEqual(tuffBrickStairs instanceof TuffBrickStairsBlock, true);
    assert.strictEqual(tuffBrickWall instanceof TuffBrickWallBlock, true);
  }
}

// Run tests
const test = new TuffVariantsTest();
test.runTests();
console.log('All Tuff variants tests passed!');

module.exports = TuffVariantsTest; 