const assert = require('assert');
const BlockRegistry = require('../registry/blockRegistry');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');

class TuffVariantsRegistrationTest {
  constructor() {
    this.blockRegistry = BlockRegistry.getInstance();
    this.blockRegistry.clear(); // Clear registry before tests
  }

  runTests() {
    this.testBlockRegistration();
    this.testBlockCreation();
    this.testBlockProperties();
  }

  testBlockRegistration() {
    console.log('Testing Tuff Variants Registration...');

    // Register blocks
    this.blockRegistry.register('chiseled_tuff', ChiseledTuffBlock);
    this.blockRegistry.register('tuff_bricks', TuffBricksBlock);
    this.blockRegistry.register('tuff_brick_slab', TuffBrickSlabBlock);
    this.blockRegistry.register('tuff_brick_stairs', TuffBrickStairsBlock);
    this.blockRegistry.register('tuff_brick_wall', TuffBrickWallBlock);

    // Verify all blocks are registered
    assert.strictEqual(this.blockRegistry.has('chiseled_tuff'), true);
    assert.strictEqual(this.blockRegistry.has('tuff_bricks'), true);
    assert.strictEqual(this.blockRegistry.has('tuff_brick_slab'), true);
    assert.strictEqual(this.blockRegistry.has('tuff_brick_stairs'), true);
    assert.strictEqual(this.blockRegistry.has('tuff_brick_wall'), true);

    // Verify block types
    assert.strictEqual(this.blockRegistry.get('chiseled_tuff') === ChiseledTuffBlock, true);
    assert.strictEqual(this.blockRegistry.get('tuff_bricks') === TuffBricksBlock, true);
    assert.strictEqual(this.blockRegistry.get('tuff_brick_slab') === TuffBrickSlabBlock, true);
    assert.strictEqual(this.blockRegistry.get('tuff_brick_stairs') === TuffBrickStairsBlock, true);
    assert.strictEqual(this.blockRegistry.get('tuff_brick_wall') === TuffBrickWallBlock, true);
  }

  testBlockCreation() {
    console.log('Testing Tuff Variants Creation...');

    // Test creating each block type
    const chiseledTuff = this.blockRegistry.create('chiseled_tuff', 0, 0, 0);
    const tuffBricks = this.blockRegistry.create('tuff_bricks', 0, 0, 0);
    const tuffBrickSlab = this.blockRegistry.create('tuff_brick_slab', 0, 0, 0);
    const tuffBrickStairs = this.blockRegistry.create('tuff_brick_stairs', 0, 0, 0);
    const tuffBrickWall = this.blockRegistry.create('tuff_brick_wall', 0, 0, 0);

    // Verify instances
    assert.strictEqual(chiseledTuff instanceof ChiseledTuffBlock, true);
    assert.strictEqual(tuffBricks instanceof TuffBricksBlock, true);
    assert.strictEqual(tuffBrickSlab instanceof TuffBrickSlabBlock, true);
    assert.strictEqual(tuffBrickStairs instanceof TuffBrickStairsBlock, true);
    assert.strictEqual(tuffBrickWall instanceof TuffBrickWallBlock, true);
  }

  testBlockProperties() {
    console.log('Testing Tuff Variants Properties...');

    // Create blocks
    const chiseledTuff = this.blockRegistry.create('chiseled_tuff', 0, 0, 0);
    const tuffBricks = this.blockRegistry.create('tuff_bricks', 0, 0, 0);
    const tuffBrickSlab = this.blockRegistry.create('tuff_brick_slab', 0, 0, 0);
    const tuffBrickStairs = this.blockRegistry.create('tuff_brick_stairs', 0, 0, 0);
    const tuffBrickWall = this.blockRegistry.create('tuff_brick_wall', 0, 0, 0);

    // Verify properties
    assert.strictEqual(chiseledTuff.id, 'chiseled_tuff');
    assert.strictEqual(tuffBricks.id, 'tuff_bricks');
    assert.strictEqual(tuffBrickSlab.id, 'tuff_brick_slab');
    assert.strictEqual(tuffBrickStairs.id, 'tuff_brick_stairs');
    assert.strictEqual(tuffBrickWall.id, 'tuff_brick_wall');

    // Verify hardness values
    assert.strictEqual(chiseledTuff.hardness, 1.5);
    assert.strictEqual(tuffBricks.hardness, 1.5);
    assert.strictEqual(tuffBrickSlab.hardness, 1.5);
    assert.strictEqual(tuffBrickStairs.hardness, 1.5);
    assert.strictEqual(tuffBrickWall.hardness, 1.5);

    // Verify tool requirements
    assert.strictEqual(chiseledTuff.toolType, 'pickaxe');
    assert.strictEqual(tuffBricks.toolType, 'pickaxe');
    assert.strictEqual(tuffBrickSlab.toolType, 'pickaxe');
    assert.strictEqual(tuffBrickStairs.toolType, 'pickaxe');
    assert.strictEqual(tuffBrickWall.toolType, 'pickaxe');
  }
}

module.exports = TuffVariantsRegistrationTest; 