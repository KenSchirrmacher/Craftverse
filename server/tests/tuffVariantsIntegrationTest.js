const assert = require('assert');
const { registerTuffVariantRecipes } = require('../recipes/tuffVariantsRecipes');
const { registerTuffVariantStonecutterRecipes } = require('../recipes/tuffVariantsStonecutterRecipes');
const RecipeRegistry = require('../registry/recipeRegistry');
const StonecutterRegistry = require('../registry/stonecutterRegistry');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const BlockRegistry = require('../blocks/blockRegistry');
const World = require('../world/world');
const Player = require('../entities/player');

class TuffVariantsIntegrationTest {
  constructor() {
    this.world = new TestWorld();
    this.recipeRegistry = new RecipeRegistry();
    this.stonecutterRegistry = new StonecutterRegistry();
  }

  runTests() {
    this.testCraftingToStonecutterFlow();
    this.testStonecutterToCraftingFlow();
    this.testBlockPlacementAndBreaking();
    this.testBlockProperties();
  }

  testCraftingToStonecutterFlow() {
    console.log('Testing crafting to stonecutter flow...');
    
    // Register all recipes
    registerTuffVariantRecipes();
    registerTuffVariantStonecutterRecipes();
    
    // Craft Tuff Bricks from Tuff
    const craftingGrid = [
      ['tuff', 'tuff'],
      ['tuff', 'tuff']
    ];
    const bricks = this.recipeRegistry.craft(craftingGrid);
    assert.strictEqual(bricks.id, 'tuff_bricks');
    assert.strictEqual(bricks.count, 4);
    
    // Use stonecutter to convert bricks to slabs
    const slabs = this.stonecutterRegistry.craft('tuff_bricks');
    assert.strictEqual(slabs.id, 'tuff_brick_slab');
    assert.strictEqual(slabs.count, 2);
  }

  testStonecutterToCraftingFlow() {
    console.log('Testing stonecutter to crafting flow...');
    
    // Convert Tuff to Bricks using stonecutter
    const bricks = this.stonecutterRegistry.craft('tuff');
    assert.strictEqual(bricks.id, 'tuff_bricks');
    assert.strictEqual(bricks.count, 1);
    
    // Use crafting table to make stairs
    const craftingGrid = [
      ['tuff_bricks', '', ''],
      ['tuff_bricks', 'tuff_bricks', ''],
      ['tuff_bricks', 'tuff_bricks', 'tuff_bricks']
    ];
    const stairs = this.recipeRegistry.craft(craftingGrid);
    assert.strictEqual(stairs.id, 'tuff_brick_stairs');
    assert.strictEqual(stairs.count, 4);
  }

  testBlockPlacementAndBreaking() {
    console.log('Testing block placement and breaking...');
    
    // Test Tuff Bricks placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    assert.strictEqual(placedBricks !== null, true);
    
    // Test breaking and drops
    const drops = placedBricks.break();
    assert.strictEqual(drops.length > 0, true);
    assert.strictEqual(drops[0].id, 'tuff_bricks');
    
    // Test Tuff Brick Slab placement
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 1, y: 0, z: 0 });
    assert.strictEqual(placedSlab !== null, true);
    
    // Test breaking and drops
    const slabDrops = placedSlab.break();
    assert.strictEqual(slabDrops.length > 0, true);
    assert.strictEqual(slabDrops[0].id, 'tuff_brick_slab');
  }

  testBlockProperties() {
    console.log('Testing block properties...');
    
    // Test Tuff Bricks properties
    const bricks = new TuffBricksBlock();
    assert.strictEqual(bricks.hardness, 1.5);
    assert.strictEqual(bricks.resistance, 6.0);
    assert.strictEqual(bricks.requiresTool, true);
    
    // Test Tuff Brick Stairs properties
    const stairs = new TuffBrickStairsBlock();
    assert.strictEqual(stairs.hardness, 1.5);
    assert.strictEqual(stairs.resistance, 6.0);
    assert.strictEqual(stairs.requiresTool, true);
    
    // Test Tuff Brick Wall properties
    const wall = new TuffBrickWallBlock();
    assert.strictEqual(wall.hardness, 1.5);
    assert.strictEqual(wall.resistance, 6.0);
    assert.strictEqual(wall.requiresTool, true);
    
    // Test Chiseled Tuff properties
    const chiseled = new ChiseledTuffBlock();
    assert.strictEqual(chiseled.hardness, 1.5);
    assert.strictEqual(chiseled.resistance, 6.0);
    assert.strictEqual(chiseled.requiresTool, true);
  }
}

// Run tests
const test = new TuffVariantsIntegrationTest();
test.runTests();
console.log('All Tuff variants integration tests passed!');

module.exports = TuffVariantsIntegrationTest; 