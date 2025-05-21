const assert = require('assert');
const RecipeRegistry = require('../registry/recipeRegistry');
const StonecutterRegistry = require('../registry/stonecutterRegistry');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const Player = require('../entities/player');
const Inventory = require('../inventory/inventory');

describe('Tuff Variants Recipe Tests', () => {
  let player;
  let inventory;

  beforeEach(() => {
    player = new Player('test-player', 'TestPlayer');
    inventory = new Inventory();
    player.inventory = inventory;
  });

  describe('Crafting Recipes', () => {
    it('should craft tuff bricks from tuff blocks', () => {
      // Add tuff blocks to inventory
      inventory.addItem('tuff', 4);
      
      const recipe = RecipeRegistry.getRecipe('tuff_bricks');
      const result = recipe.craft(player);
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.item.id, 'tuff_bricks');
      assert.strictEqual(result.item.count, 4);
    });

    it('should craft tuff brick slabs from tuff bricks', () => {
      // Add tuff bricks to inventory
      inventory.addItem('tuff_bricks', 3);
      
      const recipe = RecipeRegistry.getRecipe('tuff_brick_slab');
      const result = recipe.craft(player);
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.item.id, 'tuff_brick_slab');
      assert.strictEqual(result.item.count, 6);
    });

    it('should craft tuff brick stairs from tuff bricks', () => {
      // Add tuff bricks to inventory
      inventory.addItem('tuff_bricks', 6);
      
      const recipe = RecipeRegistry.getRecipe('tuff_brick_stairs');
      const result = recipe.craft(player);
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.item.id, 'tuff_brick_stairs');
      assert.strictEqual(result.item.count, 4);
    });

    it('should craft tuff brick walls from tuff bricks', () => {
      // Add tuff bricks to inventory
      inventory.addItem('tuff_bricks', 6);
      
      const recipe = RecipeRegistry.getRecipe('tuff_brick_wall');
      const result = recipe.craft(player);
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.item.id, 'tuff_brick_wall');
      assert.strictEqual(result.item.count, 6);
    });

    it('should craft chiseled tuff from tuff brick slabs', () => {
      // Add tuff brick slabs to inventory
      inventory.addItem('tuff_brick_slab', 2);
      
      const recipe = RecipeRegistry.getRecipe('chiseled_tuff');
      const result = recipe.craft(player);
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.item.id, 'chiseled_tuff');
      assert.strictEqual(result.item.count, 1);
    });
  });

  describe('Stonecutter Recipes', () => {
    it('should convert tuff to tuff bricks in stonecutter', () => {
      // Add tuff to inventory
      inventory.addItem('tuff', 1);
      
      const recipe = StonecutterRegistry.getRecipe('tuff_to_bricks');
      const result = recipe.craft(player);
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.item.id, 'tuff_bricks');
      assert.strictEqual(result.item.count, 1);
    });

    it('should convert tuff bricks to slab in stonecutter', () => {
      // Add tuff bricks to inventory
      inventory.addItem('tuff_bricks', 1);
      
      const recipe = StonecutterRegistry.getRecipe('tuff_bricks_to_slab');
      const result = recipe.craft(player);
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.item.id, 'tuff_brick_slab');
      assert.strictEqual(result.item.count, 2);
    });

    it('should convert tuff bricks to stairs in stonecutter', () => {
      // Add tuff bricks to inventory
      inventory.addItem('tuff_bricks', 1);
      
      const recipe = StonecutterRegistry.getRecipe('tuff_bricks_to_stairs');
      const result = recipe.craft(player);
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.item.id, 'tuff_brick_stairs');
      assert.strictEqual(result.item.count, 1);
    });

    it('should convert tuff bricks to wall in stonecutter', () => {
      // Add tuff bricks to inventory
      inventory.addItem('tuff_bricks', 1);
      
      const recipe = StonecutterRegistry.getRecipe('tuff_bricks_to_wall');
      const result = recipe.craft(player);
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.item.id, 'tuff_brick_wall');
      assert.strictEqual(result.item.count, 1);
    });

    it('should convert tuff bricks to chiseled tuff in stonecutter', () => {
      // Add tuff bricks to inventory
      inventory.addItem('tuff_bricks', 1);
      
      const recipe = StonecutterRegistry.getRecipe('tuff_bricks_to_chiseled');
      const result = recipe.craft(player);
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.item.id, 'chiseled_tuff');
      assert.strictEqual(result.item.count, 1);
    });
  });

  describe('Recipe Validation', () => {
    it('should validate recipe ingredients', () => {
      const recipe = RecipeRegistry.getRecipe('tuff_bricks');
      const isValid = recipe.validateIngredients(['tuff', 'tuff', 'tuff', 'tuff']);
      
      assert.strictEqual(isValid, true);
    });

    it('should handle invalid recipe ingredients', () => {
      const recipe = RecipeRegistry.getRecipe('tuff_bricks');
      const isValid = recipe.validateIngredients(['stone', 'stone', 'stone', 'stone']);
      
      assert.strictEqual(isValid, false);
    });
  });

  describe('Recipe Results', () => {
    it('should return correct result for tuff bricks recipe', () => {
      const recipe = RecipeRegistry.getRecipe('tuff_bricks');
      const result = recipe.getResult();
      
      assert.strictEqual(result.id, 'tuff_bricks');
      assert.strictEqual(result.count, 4);
    });

    it('should return correct result for stonecutter recipe', () => {
      const recipe = StonecutterRegistry.getRecipe('tuff_to_bricks');
      const result = recipe.getResult();
      
      assert.strictEqual(result.id, 'tuff_bricks');
      assert.strictEqual(result.count, 1);
    });
  });
}); 