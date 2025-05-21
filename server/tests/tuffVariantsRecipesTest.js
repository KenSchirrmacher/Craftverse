/**
 * Tests for Tuff Variant Recipes implementation
 * Verifies the crafting and stonecutter recipes for tuff variants
 */

const assert = require('assert');
const RecipeRegistry = require('../registry/recipeRegistry');
const StonecutterRegistry = require('../registry/stonecutterRegistry');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock } = require('../blocks/tuffVariantsBlocks');

class TuffVariantsRecipesTest {
  constructor() {
    this.recipeRegistry = new RecipeRegistry();
    this.stonecutterRegistry = new StonecutterRegistry();
  }

  runTests() {
    this.testCraftingRecipes();
    this.testStonecutterRecipes();
  }

  testCraftingRecipes() {
    console.log('Testing Tuff Variant Crafting Recipes...');

    // Test Tuff Bricks recipe
    const tuffBricksRecipe = this.recipeRegistry.getRecipe('tuff_bricks');
    assert.strictEqual(tuffBricksRecipe !== undefined, true);
    assert.strictEqual(tuffBricksRecipe.result.id, 'tuff_bricks');
    assert.strictEqual(tuffBricksRecipe.result.count, 4);

    // Test Tuff Brick Slab recipe
    const tuffBrickSlabRecipe = this.recipeRegistry.getRecipe('tuff_brick_slab');
    assert.strictEqual(tuffBrickSlabRecipe !== undefined, true);
    assert.strictEqual(tuffBrickSlabRecipe.result.id, 'tuff_brick_slab');
    assert.strictEqual(tuffBrickSlabRecipe.result.count, 6);

    // Test Tuff Brick Stairs recipe
    const tuffBrickStairsRecipe = this.recipeRegistry.getRecipe('tuff_brick_stairs');
    assert.strictEqual(tuffBrickStairsRecipe !== undefined, true);
    assert.strictEqual(tuffBrickStairsRecipe.result.id, 'tuff_brick_stairs');
    assert.strictEqual(tuffBrickStairsRecipe.result.count, 4);

    // Test Tuff Brick Wall recipe
    const tuffBrickWallRecipe = this.recipeRegistry.getRecipe('tuff_brick_wall');
    assert.strictEqual(tuffBrickWallRecipe !== undefined, true);
    assert.strictEqual(tuffBrickWallRecipe.result.id, 'tuff_brick_wall');
    assert.strictEqual(tuffBrickWallRecipe.result.count, 6);

    // Test Chiseled Tuff recipe
    const chiseledTuffRecipe = this.recipeRegistry.getRecipe('chiseled_tuff');
    assert.strictEqual(chiseledTuffRecipe !== undefined, true);
    assert.strictEqual(chiseledTuffRecipe.result.id, 'chiseled_tuff');
    assert.strictEqual(chiseledTuffRecipe.result.count, 1);
  }

  testStonecutterRecipes() {
    console.log('Testing Tuff Variant Stonecutter Recipes...');

    // Test Tuff to Tuff Bricks recipe
    const tuffToBricksRecipe = this.stonecutterRegistry.getRecipe('tuff_to_bricks');
    assert.strictEqual(tuffToBricksRecipe !== undefined, true);
    assert.strictEqual(tuffToBricksRecipe.result.id, 'tuff_bricks');
    assert.strictEqual(tuffToBricksRecipe.result.count, 1);

    // Test Tuff Bricks to Slab recipe
    const tuffBricksToSlabRecipe = this.stonecutterRegistry.getRecipe('tuff_bricks_to_slab');
    assert.strictEqual(tuffBricksToSlabRecipe !== undefined, true);
    assert.strictEqual(tuffBricksToSlabRecipe.result.id, 'tuff_brick_slab');
    assert.strictEqual(tuffBricksToSlabRecipe.result.count, 2);

    // Test Tuff Bricks to Stairs recipe
    const tuffBricksToStairsRecipe = this.stonecutterRegistry.getRecipe('tuff_bricks_to_stairs');
    assert.strictEqual(tuffBricksToStairsRecipe !== undefined, true);
    assert.strictEqual(tuffBricksToStairsRecipe.result.id, 'tuff_brick_stairs');
    assert.strictEqual(tuffBricksToStairsRecipe.result.count, 1);

    // Test Tuff Bricks to Wall recipe
    const tuffBricksToWallRecipe = this.stonecutterRegistry.getRecipe('tuff_bricks_to_wall');
    assert.strictEqual(tuffBricksToWallRecipe !== undefined, true);
    assert.strictEqual(tuffBricksToWallRecipe.result.id, 'tuff_brick_wall');
    assert.strictEqual(tuffBricksToWallRecipe.result.count, 1);

    // Test Tuff Bricks to Chiseled Tuff recipe
    const tuffBricksToChiseledRecipe = this.stonecutterRegistry.getRecipe('tuff_bricks_to_chiseled');
    assert.strictEqual(tuffBricksToChiseledRecipe !== undefined, true);
    assert.strictEqual(tuffBricksToChiseledRecipe.result.id, 'chiseled_tuff');
    assert.strictEqual(tuffBricksToChiseledRecipe.result.count, 1);
  }
}

module.exports = TuffVariantsRecipesTest; 