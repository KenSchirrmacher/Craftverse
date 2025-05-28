/**
 * Test suite for CrafterBlock using real implementations
 */

const assert = require('assert');
const CrafterBlock = require('../blocks/crafterBlock');
const World = require('../world/world');
const RecipeManager = require('../crafting/recipeManager');

describe('CrafterBlock Real Implementation Tests', () => {
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
  
  describe('Recipe Memory System', () => {
    it('should not save recipe memory in manual mode', () => {
      // Ensure crafting mode is manual
      crafterBlock.setCraftingMode('manual');
      
      // Setup inventory with a valid recipe for wooden pickaxe
      crafterBlock.placeItem(0, { id: 'oak_planks', count: 3 });
      crafterBlock.placeItem(1, { id: 'stick', count: 2 });
      crafterBlock.placeItem(2, { id: 'stick', count: 2 });
      
      // Attempt crafting using real logic
      crafterBlock.attemptCrafting();
      
      // Get the output
      crafterBlock.getOutput();
      
      // Verify recipe memory was not saved
      assert.strictEqual(crafterBlock.recipeMemory, null);
      assert.strictEqual(crafterBlock.recipeResult, null);
    });
    
    it('should save recipe memory in template mode', () => {
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
      
      // Get the output
      const output = crafterBlock.getOutput();
      
      // Verify output was returned
      assert.ok(output, 'Should have crafted an item');
      assert.strictEqual(output.id, 'wooden_pickaxe', 'Should have crafted a wooden pickaxe');
      
      // Verify recipe memory was saved
      assert.notStrictEqual(crafterBlock.recipeMemory, null);
      assert.strictEqual(crafterBlock.recipeMemory[0].id, 'oak_planks');
      assert.strictEqual(crafterBlock.recipeMemory[1].id, 'oak_planks');
      assert.strictEqual(crafterBlock.recipeMemory[2].id, 'oak_planks');
      assert.strictEqual(crafterBlock.recipeMemory[4].id, 'stick');
      assert.strictEqual(crafterBlock.recipeMemory[7].id, 'stick');
      
      // Verify recipe result was saved
      assert.deepStrictEqual(crafterBlock.recipeResult, output);
    });
  });
  
  describe('Crafting Modes', () => {
    it('should default to manual mode', () => {
      assert.strictEqual(crafterBlock.craftingMode, 'manual');
    });
    
    it('should allow setting crafting mode', () => {
      // Set to template mode
      const result1 = crafterBlock.setCraftingMode('template');
      assert.strictEqual(result1, true);
      assert.strictEqual(crafterBlock.craftingMode, 'template');
      
      // Set to auto-refill mode
      const result2 = crafterBlock.setCraftingMode('auto-refill');
      assert.strictEqual(result2, true);
      assert.strictEqual(crafterBlock.craftingMode, 'auto-refill');
      
      // Set back to manual mode
      const result3 = crafterBlock.setCraftingMode('manual');
      assert.strictEqual(result3, true);
      assert.strictEqual(crafterBlock.craftingMode, 'manual');
    });
    
    it('should reject invalid crafting modes', () => {
      const result = crafterBlock.setCraftingMode('invalid_mode');
      assert.strictEqual(result, false);
      assert.strictEqual(crafterBlock.craftingMode, 'manual');
    });
  });
  
  describe('Slot Locking', () => {
    it('should have all slots unlocked by default', () => {
      for (let i = 0; i < crafterBlock.inventorySize; i++) {
        assert.strictEqual(crafterBlock.slotsLocked[i], false);
      }
    });
    
    it('should allow toggling slot lock status', () => {
      // Lock slot 0
      const result1 = crafterBlock.toggleSlotLock(0);
      assert.strictEqual(result1, true);
      assert.strictEqual(crafterBlock.slotsLocked[0], true);
      
      // Unlock slot 0
      const result2 = crafterBlock.toggleSlotLock(0);
      assert.strictEqual(result2, false);
      assert.strictEqual(crafterBlock.slotsLocked[0], false);
    });
    
    it('should prevent placing items in locked slots', () => {
      // Lock slot 0
      crafterBlock.toggleSlotLock(0);
      
      // Try to place item in locked slot
      const testItem = { id: 'test_item', count: 1 };
      const result = crafterBlock.placeItem(0, testItem);
      
      // Should return the item back
      assert.deepStrictEqual(result, testItem);
      
      // Slot should still be empty
      assert.strictEqual(crafterBlock.inventory[0], null);
    });
  });
  
  describe('Redstone Modes', () => {
    it('should default to pulse mode', () => {
      assert.strictEqual(crafterBlock.redstoneMode, 'pulse');
    });
    
    it('should cycle through redstone modes', () => {
      // Initially in pulse mode
      assert.strictEqual(crafterBlock.redstoneMode, 'pulse');
      
      // Cycle to continuous mode
      const result1 = crafterBlock.cycleRedstoneMode();
      assert.strictEqual(result1, 'continuous');
      assert.strictEqual(crafterBlock.redstoneMode, 'continuous');
      
      // Cycle to filtered mode
      const result2 = crafterBlock.cycleRedstoneMode();
      assert.strictEqual(result2, 'filtered');
      assert.strictEqual(crafterBlock.redstoneMode, 'filtered');
      
      // Cycle back to pulse mode
      const result3 = crafterBlock.cycleRedstoneMode();
      assert.strictEqual(result3, 'pulse');
      assert.strictEqual(crafterBlock.redstoneMode, 'pulse');
    });
  });
  
  describe('Comparator Output', () => {
    it('should report low signal when empty', () => {
      assert.strictEqual(crafterBlock.getComparatorOutput(), 0);
    });
    
    it('should report signal proportional to inventory fullness when no recipe memory', () => {
      // Fill half the slots
      for (let i = 0; i < 4; i++) {
        crafterBlock.placeItem(i, { id: 'test_item', count: 1 });
      }
      
      // Should output around half strength
      const output = crafterBlock.getComparatorOutput();
      assert.ok(output > 0 && output < 15, `Output ${output} should be between 0 and 15`);
      assert.strictEqual(output, 6); // 4/9 * 15 = 6.67, floored to 6
    });
    
    it('should output based on recipe completeness with recipe memory', () => {
      // Setup recipe memory requiring 3 slots
      crafterBlock.recipeMemory = [
        { id: 'oak_planks', count: 2 },
        { id: 'stick', count: 1 },
        { id: 'iron', count: 3 },
        null, null, null, null, null, null
      ];
      
      // Empty inventory - 0% complete
      assert.strictEqual(crafterBlock.getComparatorOutput(), 0);
      
      // Fill 1/3 of required slots
      crafterBlock.placeItem(0, { id: 'oak_planks', count: 2 });
      
      // Should output low-medium strength (1/3 completed = 33%)
      // 1 + Math.floor((33/100) * 6) = 1 + 1 = 2
      assert.strictEqual(crafterBlock.getComparatorOutput(), 2);
      
      // Fill 2/3 of required slots
      crafterBlock.placeItem(1, { id: 'stick', count: 1 });
      
      // Should output medium strength (2/3 completed = 66%)
      // 1 + Math.floor((66/100) * 6) = 1 + 3 = 4
      assert.strictEqual(crafterBlock.getComparatorOutput(), 4);
      
      // Fill all required slots
      crafterBlock.placeItem(2, { id: 'iron', count: 3 });
      
      // Should output high strength (ready to craft)
      assert.strictEqual(crafterBlock.getComparatorOutput(), 14);
      
      // Add output
      crafterBlock.outputSlot = { id: 'test_output', count: 1 };
      
      // Should output maximum strength (output slot filled)
      assert.strictEqual(crafterBlock.getComparatorOutput(), 15);
    });
  });
}); 