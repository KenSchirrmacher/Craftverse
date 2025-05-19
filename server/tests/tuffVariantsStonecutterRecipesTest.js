const assert = require('assert');
const { registerTuffVariantStonecutterRecipes } = require('../recipes/tuffVariantsStonecutterRecipes');
const StonecutterRegistry = require('../registry/stonecutterRegistry');
const TestWorld = require('./testWorld');

class TuffVariantsStonecutterRecipesTest {
  constructor() {
    this.world = new TestWorld();
    this.stonecutterRegistry = new StonecutterRegistry();
  }

  runTests() {
    this.testTuffToBricksRecipe();
    this.testTuffBricksToSlabRecipe();
    this.testTuffBricksToStairsRecipe();
    this.testTuffBricksToWallRecipe();
    this.testTuffBricksToChiseledRecipe();
  }

  testTuffToBricksRecipe() {
    console.log('Testing Tuff to Bricks stonecutter recipe...');
    
    // Register recipe
    registerTuffVariantStonecutterRecipes();
    
    // Test recipe
    const recipe = this.stonecutterRegistry.getRecipe('tuff_to_bricks');
    assert.strictEqual(recipe !== undefined, true);
    assert.strictEqual(recipe.input, 'tuff');
    assert.strictEqual(recipe.result.id, 'tuff_bricks');
    assert.strictEqual(recipe.result.count, 1);
    
    // Test crafting
    const result = this.stonecutterRegistry.craft('tuff');
    assert.strictEqual(result.id, 'tuff_bricks');
    assert.strictEqual(result.count, 1);
  }

  testTuffBricksToSlabRecipe() {
    console.log('Testing Tuff Bricks to Slab stonecutter recipe...');
    
    // Test recipe
    const recipe = this.stonecutterRegistry.getRecipe('tuff_bricks_to_slab');
    assert.strictEqual(recipe !== undefined, true);
    assert.strictEqual(recipe.input, 'tuff_bricks');
    assert.strictEqual(recipe.result.id, 'tuff_brick_slab');
    assert.strictEqual(recipe.result.count, 2);
    
    // Test crafting
    const result = this.stonecutterRegistry.craft('tuff_bricks');
    assert.strictEqual(result.id, 'tuff_brick_slab');
    assert.strictEqual(result.count, 2);
  }

  testTuffBricksToStairsRecipe() {
    console.log('Testing Tuff Bricks to Stairs stonecutter recipe...');
    
    // Test recipe
    const recipe = this.stonecutterRegistry.getRecipe('tuff_bricks_to_stairs');
    assert.strictEqual(recipe !== undefined, true);
    assert.strictEqual(recipe.input, 'tuff_bricks');
    assert.strictEqual(recipe.result.id, 'tuff_brick_stairs');
    assert.strictEqual(recipe.result.count, 1);
    
    // Test crafting
    const result = this.stonecutterRegistry.craft('tuff_bricks');
    assert.strictEqual(result.id, 'tuff_brick_stairs');
    assert.strictEqual(result.count, 1);
  }

  testTuffBricksToWallRecipe() {
    console.log('Testing Tuff Bricks to Wall stonecutter recipe...');
    
    // Test recipe
    const recipe = this.stonecutterRegistry.getRecipe('tuff_bricks_to_wall');
    assert.strictEqual(recipe !== undefined, true);
    assert.strictEqual(recipe.input, 'tuff_bricks');
    assert.strictEqual(recipe.result.id, 'tuff_brick_wall');
    assert.strictEqual(recipe.result.count, 1);
    
    // Test crafting
    const result = this.stonecutterRegistry.craft('tuff_bricks');
    assert.strictEqual(result.id, 'tuff_brick_wall');
    assert.strictEqual(result.count, 1);
  }

  testTuffBricksToChiseledRecipe() {
    console.log('Testing Tuff Bricks to Chiseled Tuff stonecutter recipe...');
    
    // Test recipe
    const recipe = this.stonecutterRegistry.getRecipe('tuff_bricks_to_chiseled');
    assert.strictEqual(recipe !== undefined, true);
    assert.strictEqual(recipe.input, 'tuff_bricks');
    assert.strictEqual(recipe.result.id, 'chiseled_tuff');
    assert.strictEqual(recipe.result.count, 1);
    
    // Test crafting
    const result = this.stonecutterRegistry.craft('tuff_bricks');
    assert.strictEqual(result.id, 'chiseled_tuff');
    assert.strictEqual(result.count, 1);
  }
}

// Run tests
const test = new TuffVariantsStonecutterRecipesTest();
test.runTests();
console.log('All Tuff variants stonecutter recipe tests passed!');

module.exports = TuffVariantsStonecutterRecipesTest; 