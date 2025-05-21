/**
 * Integration Tests for Tuff Variants
 * Verifies that all components work together correctly
 */

const assert = require('assert');
const World = require('../world/world');
const Player = require('../entities/player');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const RecipeRegistry = require('../registry/recipeRegistry');
const StonecutterRegistry = require('../registry/stonecutterRegistry');

class TuffVariantsIntegrationTest {
  constructor() {
    this.world = new World();
    this.player = new Player();
    this.recipeRegistry = new RecipeRegistry();
    this.stonecutterRegistry = new StonecutterRegistry();
  }

  runTests() {
    this.testBlockPlacementAndBreaking();
    this.testCraftingFlow();
    this.testStonecutterFlow();
    this.testBlockInteractions();
  }

  testBlockPlacementAndBreaking() {
    console.log('Testing Block Placement and Breaking...');

    // Test placing and breaking each block type
    const blockTypes = [
      'chiseled_tuff',
      'tuff_bricks',
      'tuff_brick_slab',
      'tuff_brick_stairs',
      'tuff_brick_wall'
    ];

    for (const blockType of blockTypes) {
      // Place block
      this.world.setBlockAt(0, 0, 0, blockType);
      const placedBlock = this.world.getBlockAt(0, 0, 0);
      assert.strictEqual(placedBlock.type, blockType);

      // Break block
      const drops = placedBlock.getDrops();
      assert.strictEqual(drops.length, 1);
      assert.strictEqual(drops[0].id, blockType);
      assert.strictEqual(drops[0].count, 1);

      // Verify block is removed
      this.world.setBlockAt(0, 0, 0, 'air');
      const removedBlock = this.world.getBlockAt(0, 0, 0);
      assert.strictEqual(removedBlock.type, 'air');
    }
  }

  testCraftingFlow() {
    console.log('Testing Crafting Flow...');

    // Test crafting Tuff Bricks
    const tuffBricksRecipe = this.recipeRegistry.getRecipe('tuff_bricks');
    const tuffBricksResult = this.recipeRegistry.craft([
      ['tuff', 'tuff'],
      ['tuff', 'tuff']
    ]);
    assert.strictEqual(tuffBricksResult.id, 'tuff_bricks');
    assert.strictEqual(tuffBricksResult.count, 4);

    // Test crafting Tuff Brick Slab
    const tuffBrickSlabResult = this.recipeRegistry.craft([
      ['tuff_bricks', 'tuff_bricks', 'tuff_bricks']
    ]);
    assert.strictEqual(tuffBrickSlabResult.id, 'tuff_brick_slab');
    assert.strictEqual(tuffBrickSlabResult.count, 6);

    // Test crafting Tuff Brick Stairs
    const tuffBrickStairsResult = this.recipeRegistry.craft([
      ['tuff_bricks', '', ''],
      ['tuff_bricks', 'tuff_bricks', ''],
      ['tuff_bricks', 'tuff_bricks', 'tuff_bricks']
    ]);
    assert.strictEqual(tuffBrickStairsResult.id, 'tuff_brick_stairs');
    assert.strictEqual(tuffBrickStairsResult.count, 4);

    // Test crafting Tuff Brick Wall
    const tuffBrickWallResult = this.recipeRegistry.craft([
      ['tuff_bricks', 'tuff_bricks', 'tuff_bricks'],
      ['tuff_bricks', 'tuff_bricks', 'tuff_bricks']
    ]);
    assert.strictEqual(tuffBrickWallResult.id, 'tuff_brick_wall');
    assert.strictEqual(tuffBrickWallResult.count, 6);

    // Test crafting Chiseled Tuff
    const chiseledTuffResult = this.recipeRegistry.craft([
      ['tuff_brick_slab'],
      ['tuff_brick_slab']
    ]);
    assert.strictEqual(chiseledTuffResult.id, 'chiseled_tuff');
    assert.strictEqual(chiseledTuffResult.count, 1);
  }

  testStonecutterFlow() {
    console.log('Testing Stonecutter Flow...');

    // Test Tuff to Tuff Bricks
    const tuffToBricksResult = this.stonecutterRegistry.craft('tuff');
    assert.strictEqual(tuffToBricksResult.id, 'tuff_bricks');
    assert.strictEqual(tuffToBricksResult.count, 1);

    // Test Tuff Bricks to Slab
    const tuffBricksToSlabResult = this.stonecutterRegistry.craft('tuff_bricks');
    assert.strictEqual(tuffBricksToSlabResult.id, 'tuff_brick_slab');
    assert.strictEqual(tuffBricksToSlabResult.count, 2);

    // Test Tuff Bricks to Stairs
    const tuffBricksToStairsResult = this.stonecutterRegistry.craft('tuff_bricks');
    assert.strictEqual(tuffBricksToStairsResult.id, 'tuff_brick_stairs');
    assert.strictEqual(tuffBricksToStairsResult.count, 1);

    // Test Tuff Bricks to Wall
    const tuffBricksToWallResult = this.stonecutterRegistry.craft('tuff_bricks');
    assert.strictEqual(tuffBricksToWallResult.id, 'tuff_brick_wall');
    assert.strictEqual(tuffBricksToWallResult.count, 1);

    // Test Tuff Bricks to Chiseled Tuff
    const tuffBricksToChiseledResult = this.stonecutterRegistry.craft('tuff_bricks');
    assert.strictEqual(tuffBricksToChiseledResult.id, 'chiseled_tuff');
    assert.strictEqual(tuffBricksToChiseledResult.count, 1);
  }

  testBlockInteractions() {
    console.log('Testing Block Interactions...');

    // Test wall connections
    const wallBlock = new TuffBrickWallBlock();
    this.world.setBlockAt(0, 0, 0, 'tuff_brick_wall');
    this.world.setBlockAt(1, 0, 0, 'tuff_brick_wall');
    const connections = wallBlock.getConnections(this.world, { x: 0, y: 0, z: 0 });
    assert.strictEqual(connections.east, true);

    // Test stair placement
    const stairsBlock = new TuffBrickStairsBlock();
    this.world.setBlockAt(0, 0, 0, 'tuff_brick_stairs');
    const state = stairsBlock.getState();
    assert.strictEqual(state.facing !== undefined, true);
    assert.strictEqual(state.half !== undefined, true);

    // Test slab placement
    const slabBlock = new TuffBrickSlabBlock();
    this.world.setBlockAt(0, 0, 0, 'tuff_brick_slab');
    const slabState = slabBlock.getState();
    assert.strictEqual(slabState.isTop !== undefined, true);
    assert.strictEqual(slabState.isDouble !== undefined, true);
  }
}

module.exports = TuffVariantsIntegrationTest; 