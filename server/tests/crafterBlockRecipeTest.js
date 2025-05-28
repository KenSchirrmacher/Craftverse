/**
 * Test suite for CrafterBlock recipe matching and comparator output
 */

const assert = require('assert');
const CrafterBlock = require('../blocks/crafterBlock');
const World = require('../world/world');
const RecipeManager = require('../crafting/recipeManager');

describe('CrafterBlock Recipe Tests', () => {
  let crafterBlock;
  let world;
  let recipeManager;
  
  beforeEach(() => {
    // Create a fresh world and recipe manager for each test
    world = new World();
    recipeManager = new RecipeManager();
    world.setRecipeManager(recipeManager);
    
    // Create a fresh crafter block
    crafterBlock = new CrafterBlock();
    crafterBlock.setWorld(world);
  });
  
  describe('Recipe Pattern Matching', () => {
    it('should craft items using alternative plank types', () => {
      // Set crafting mode to template
      crafterBlock.setCraftingMode('template');
      
      // Setup inventory with oak planks
      crafterBlock.placeItem(0, { id: 'oak_planks', count: 1 });
      crafterBlock.placeItem(1, { id: 'oak_planks', count: 1 });
      crafterBlock.placeItem(2, { id: 'oak_planks', count: 1 });
      crafterBlock.placeItem(4, { id: 'stick', count: 1 });
      crafterBlock.placeItem(7, { id: 'stick', count: 1 });
      
      // Attempt crafting
      crafterBlock.attemptCrafting();
      
      // Get output and save recipe memory
      const output = crafterBlock.getOutput();
      assert.ok(output, 'Should have crafted an item');
      
      // Clear inventory
      for (let i = 0; i < crafterBlock.inventorySize; i++) {
        crafterBlock.removeItem(i);
      }
      
      // Try crafting with birch planks (should work due to recipe alternatives)
      crafterBlock.placeItem(0, { id: 'birch_planks', count: 1 });
      crafterBlock.placeItem(1, { id: 'birch_planks', count: 1 });
      crafterBlock.placeItem(2, { id: 'birch_planks', count: 1 });
      crafterBlock.placeItem(4, { id: 'stick', count: 1 });
      crafterBlock.placeItem(7, { id: 'stick', count: 1 });
      
      // Should match recipe memory
      assert.strictEqual(crafterBlock.matchesRecipeMemory(), true);
      
      // Should be able to craft
      const result = crafterBlock.attemptCrafting();
      assert.strictEqual(result, true);
    });
  });
  
  describe('Comparator Output', () => {
    it('should output correct signal strength based on recipe completion', () => {
      // Set crafting mode to template
      crafterBlock.setCraftingMode('template');
      
      // Setup initial recipe memory with wooden pickaxe recipe
      crafterBlock.placeItem(0, { id: 'oak_planks', count: 1 });
      crafterBlock.placeItem(1, { id: 'oak_planks', count: 1 });
      crafterBlock.placeItem(2, { id: 'oak_planks', count: 1 });
      crafterBlock.placeItem(4, { id: 'stick', count: 1 });
      crafterBlock.placeItem(7, { id: 'stick', count: 1 });
      
      // Attempt crafting to save recipe memory
      crafterBlock.attemptCrafting();
      crafterBlock.getOutput();
      
      // Clear inventory
      for (let i = 0; i < crafterBlock.inventorySize; i++) {
        crafterBlock.removeItem(i);
      }
      
      // Test various completion percentages
      const testCases = [
        { slots: [], expected: 0, description: '0% complete (empty)' },
        { slots: [0], expected: 2, description: '33% complete (1/3 slots)' },
        { slots: [0, 1], expected: 4, description: '66% complete (2/3 slots)' },
        { slots: [0, 1, 2, 4, 7], expected: 14, description: '100% complete (all slots)' }
      ];
      
      for (const testCase of testCases) {
        // Clear inventory
        for (let i = 0; i < crafterBlock.inventorySize; i++) {
          crafterBlock.removeItem(i);
        }
        
        // Fill specified slots
        for (const slot of testCase.slots) {
          crafterBlock.placeItem(slot, { id: 'oak_planks', count: 1 });
        }
        
        // Verify output
        const output = crafterBlock.getComparatorOutput();
        assert.strictEqual(
          output,
          testCase.expected,
          `Comparator output should be ${testCase.expected} for ${testCase.description}`
        );
      }
      
      // Test output slot occupied
      crafterBlock.attemptCrafting();
      assert.strictEqual(
        crafterBlock.getComparatorOutput(),
        15,
        'Comparator output should be 15 when output slot is occupied'
      );
    });
  });

  describe('Recipe Memory Matching', () => {
    it('should correctly match recipe memory with alternatives', () => {
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
      
      // Should match with oak planks
      assert.strictEqual(crafterBlock.matchesRecipeMemory(), true);
      
      // Should match with birch planks
      crafterBlock.removeItem(0);
      crafterBlock.placeItem(0, { id: 'birch_planks', count: 1 });
      assert.strictEqual(crafterBlock.matchesRecipeMemory(), true);
      
      // Should match with spruce planks
      crafterBlock.removeItem(1);
      crafterBlock.placeItem(1, { id: 'spruce_planks', count: 1 });
      assert.strictEqual(crafterBlock.matchesRecipeMemory(), true);
      
      // Should not match with stone
      crafterBlock.removeItem(2);
      crafterBlock.placeItem(2, { id: 'stone', count: 1 });
      assert.strictEqual(crafterBlock.matchesRecipeMemory(), false);
      
      // Should not match with extra item
      crafterBlock.removeItem(2);
      crafterBlock.placeItem(2, { id: 'oak_planks', count: 1 });
      crafterBlock.placeItem(3, { id: 'stone', count: 1 });
      assert.strictEqual(crafterBlock.matchesRecipeMemory(), false);
    });
  });
}); 