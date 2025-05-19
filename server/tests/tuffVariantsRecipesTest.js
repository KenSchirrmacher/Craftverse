const assert = require('assert');
const { registerTuffVariantRecipes } = require('../recipes/tuffVariantsRecipes');
const RecipeRegistry = require('../registry/recipeRegistry');
const TestWorld = require('./testWorld');

class TuffVariantsRecipesTest {
  constructor() {
    this.world = new TestWorld();
    this.recipeRegistry = new RecipeRegistry();
  }

  runTests() {
    this.testTuffBricksRecipe();
    this.testTuffBrickSlabRecipe();
    this.testTuffBrickStairsRecipe();
    this.testTuffBrickWallRecipe();
    this.testChiseledTuffRecipe();
  }

  testTuffBricksRecipe() {
    console.log('Testing Tuff Bricks recipe...');
    
    // Register recipe
    registerTuffVariantRecipes();
    
    // Test recipe
    const recipe = this.recipeRegistry.getRecipe('tuff_bricks');
    assert.strictEqual(recipe !== undefined, true);
    assert.strictEqual(recipe.result.id, 'tuff_bricks');
    assert.strictEqual(recipe.result.count, 4);
    
    // Test crafting
    const craftingGrid = [
      ['tuff', 'tuff'],
      ['tuff', 'tuff']
    ];
    const result = this.recipeRegistry.craft(craftingGrid);
    assert.strictEqual(result.id, 'tuff_bricks');
    assert.strictEqual(result.count, 4);
  }

  testTuffBrickSlabRecipe() {
    console.log('Testing Tuff Brick Slab recipe...');
    
    // Test recipe
    const recipe = this.recipeRegistry.getRecipe('tuff_brick_slab');
    assert.strictEqual(recipe !== undefined, true);
    assert.strictEqual(recipe.result.id, 'tuff_brick_slab');
    assert.strictEqual(recipe.result.count, 6);
    
    // Test crafting
    const craftingGrid = [
      ['tuff_bricks', 'tuff_bricks', 'tuff_bricks']
    ];
    const result = this.recipeRegistry.craft(craftingGrid);
    assert.strictEqual(result.id, 'tuff_brick_slab');
    assert.strictEqual(result.count, 6);
  }

  testTuffBrickStairsRecipe() {
    console.log('Testing Tuff Brick Stairs recipe...');
    
    // Test recipe
    const recipe = this.recipeRegistry.getRecipe('tuff_brick_stairs');
    assert.strictEqual(recipe !== undefined, true);
    assert.strictEqual(recipe.result.id, 'tuff_brick_stairs');
    assert.strictEqual(recipe.result.count, 4);
    
    // Test crafting
    const craftingGrid = [
      ['tuff_bricks', '', ''],
      ['tuff_bricks', 'tuff_bricks', ''],
      ['tuff_bricks', 'tuff_bricks', 'tuff_bricks']
    ];
    const result = this.recipeRegistry.craft(craftingGrid);
    assert.strictEqual(result.id, 'tuff_brick_stairs');
    assert.strictEqual(result.count, 4);
  }

  testTuffBrickWallRecipe() {
    console.log('Testing Tuff Brick Wall recipe...');
    
    // Test recipe
    const recipe = this.recipeRegistry.getRecipe('tuff_brick_wall');
    assert.strictEqual(recipe !== undefined, true);
    assert.strictEqual(recipe.result.id, 'tuff_brick_wall');
    assert.strictEqual(recipe.result.count, 6);
    
    // Test crafting
    const craftingGrid = [
      ['tuff_bricks', 'tuff_bricks', 'tuff_bricks'],
      ['tuff_bricks', 'tuff_bricks', 'tuff_bricks']
    ];
    const result = this.recipeRegistry.craft(craftingGrid);
    assert.strictEqual(result.id, 'tuff_brick_wall');
    assert.strictEqual(result.count, 6);
  }

  testChiseledTuffRecipe() {
    console.log('Testing Chiseled Tuff recipe...');
    
    // Test recipe
    const recipe = this.recipeRegistry.getRecipe('chiseled_tuff');
    assert.strictEqual(recipe !== undefined, true);
    assert.strictEqual(recipe.result.id, 'chiseled_tuff');
    assert.strictEqual(recipe.result.count, 1);
    
    // Test crafting
    const craftingGrid = [
      ['tuff_brick_slab'],
      ['tuff_brick_slab']
    ];
    const result = this.recipeRegistry.craft(craftingGrid);
    assert.strictEqual(result.id, 'chiseled_tuff');
    assert.strictEqual(result.count, 1);
  }
}

// Run tests
const test = new TuffVariantsRecipesTest();
test.runTests();
console.log('All Tuff variants recipe tests passed!');

module.exports = TuffVariantsRecipesTest; 