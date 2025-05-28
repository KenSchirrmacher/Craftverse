/**
 * Test suite for CrafterBlock comparator output
 */

const assert = require('assert');
const CrafterBlock = require('../blocks/crafterBlock');
const World = require('../world/world');
const RecipeManager = require('../crafting/recipeManager');

describe('CrafterBlock Comparator Tests', () => {
  let crafterBlock;
  let world;
  let recipeManager;
  
  beforeEach(() => {
    // Create a fresh world and recipe manager
    world = new World();
    recipeManager = new RecipeManager();
    world.setRecipeManager(recipeManager);
    
    // Create a fresh crafter block for each test
    crafterBlock = new CrafterBlock();
    crafterBlock.setWorld(world);
  });
  
  describe('Comparator Output Scaling', () => {
    it('should scale output correctly based on recipe completion percentage', () => {
      // Set crafting mode to template
      crafterBlock.setCraftingMode('template');
      
      // Setup inventory with a valid recipe for wooden pickaxe
      // Top row: planks
      crafterBlock.placeItem(0, { id: 'oak_planks', count: 1 });
      crafterBlock.placeItem(1, { id: 'oak_planks', count: 1 });
      crafterBlock.placeItem(2, { id: 'oak_planks', count: 1 });
      // Middle row: stick in center
      crafterBlock.placeItem(4, { id: 'stick', count: 1 });
      // Bottom row: stick in center
      crafterBlock.placeItem(7, { id: 'stick', count: 1 });
      
      // Attempt crafting
      crafterBlock.attemptCrafting();
      
      // Get the output to save recipe memory
      crafterBlock.getOutput();
      
      // Empty inventory - 0% complete
      assert.strictEqual(crafterBlock.getComparatorOutput(), 0);
      
      // Fill 1/3 of required slots
      crafterBlock.placeItem(0, { id: 'oak_planks', count: 1 });
      
      // Should output low-medium strength (1/3 completed = 33%)
      // 1 + Math.round((33/100) * 6) = 1 + 2 = 3
      assert.strictEqual(crafterBlock.getComparatorOutput(), 3);
      
      // Fill 2/3 of required slots
      crafterBlock.placeItem(1, { id: 'oak_planks', count: 1 });
      
      // Should output medium strength (2/3 completed = 66%)
      // 1 + Math.round((66/100) * 6) = 1 + 4 = 5
      assert.strictEqual(crafterBlock.getComparatorOutput(), 5);
      
      // Fill all required slots
      crafterBlock.placeItem(2, { id: 'oak_planks', count: 1 });
      crafterBlock.placeItem(4, { id: 'stick', count: 1 });
      crafterBlock.placeItem(7, { id: 'stick', count: 1 });
      
      // Should output high strength (ready to craft)
      assert.strictEqual(crafterBlock.getComparatorOutput(), 14);
      
      // Attempt crafting to fill output slot
      crafterBlock.attemptCrafting();
      
      // Should output maximum strength (output slot filled)
      assert.strictEqual(crafterBlock.getComparatorOutput(), 15);
    });
  });
}); 