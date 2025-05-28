/**
 * Test suite for CrafterBlock enhancements from Minecraft 1.24 Update (Trail Tales)
 */

const assert = require('assert');
const CrafterBlock = require('../blocks/crafterBlock');
const World = require('../world/world');
const RecipeManager = require('../crafting/recipeManager');

/**
 * Run the tests
 */
function runTests() {
  // Simple test runner for Node.js environment
  console.log('Running CrafterBlock Enhancements Tests...');
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Helper function to run a test
  function runTest(testName, testFn) {
    try {
      testFn();
      console.log(`  ✓ ${testName}`);
      passedTests++;
    } catch (error) {
      console.error(`  ✗ ${testName}`);
      console.error(`    ${error.message}`);
      failedTests++;
    }
  }
  
  console.log('\nRecipe Memory System:');
  
  // Create a fresh world and recipe manager
  const world = new World();
  const recipeManager = new RecipeManager();
  world.setRecipeManager(recipeManager);
  
  // Create a fresh crafter block for tests
  let crafterBlock = new CrafterBlock();
  crafterBlock.setWorld(world);
  
  runTest('Should initially have no recipe memory', () => {
    assert.strictEqual(crafterBlock.recipeMemory, null);
    assert.strictEqual(crafterBlock.recipeResult, null);
  });
  
  runTest('Should save recipe memory when output is taken in template mode', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    crafterBlock.setWorld(world);
    
    // Set crafting mode to template
    crafterBlock.setCraftingMode('template');
    
    // Setup inventory with test items
    const testItems = [
      { id: 'planks', count: 2 },
      { id: 'stick', count: 1 },
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ];
    
    // Place items in inventory
    testItems.forEach((item, index) => {
      if (item) {
        crafterBlock.placeItem(index, item);
      }
    });
    
    // Attempt crafting
    crafterBlock.attemptCrafting();
    
    // Get the output (should trigger recipe memory saving)
    const output = crafterBlock.getOutput();
    
    // Verify output was returned
    assert.ok(output, 'Should have crafted an item');
    
    // Verify recipe memory was saved
    assert.notStrictEqual(crafterBlock.recipeMemory, null);
    assert.strictEqual(crafterBlock.recipeMemory[0].id, 'planks');
    assert.strictEqual(crafterBlock.recipeMemory[1].id, 'stick');
    assert.strictEqual(crafterBlock.recipeMemory[2], null);
    
    // Verify recipe result was saved
    assert.deepStrictEqual(crafterBlock.recipeResult, output);
  });
  
  runTest('Should not save recipe memory in manual mode', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
    // Ensure crafting mode is manual
    crafterBlock.setCraftingMode('manual');
    
    // Setup inventory with test items
    crafterBlock.placeItem(0, { id: 'planks', count: 2 });
    
    // Mock a crafted result
    crafterBlock.outputSlot = { id: 'stick', count: 4 };
    
    // Get the output
    crafterBlock.getOutput();
    
    // Verify recipe memory was not saved
    assert.strictEqual(crafterBlock.recipeMemory, null);
    assert.strictEqual(crafterBlock.recipeResult, null);
  });
  
  runTest('Should clear recipe memory when requested', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
    // Setup recipe memory
    crafterBlock.recipeMemory = [
      { id: 'planks', count: 2 },
      { id: 'stick', count: 1 },
      null, null, null, null, null, null, null
    ];
    crafterBlock.recipeResult = { id: 'wooden_pickaxe', count: 1 };
    
    // Clear the memory
    crafterBlock.clearRecipeMemory();
    
    // Verify it was cleared
    assert.strictEqual(crafterBlock.recipeMemory, null);
    assert.strictEqual(crafterBlock.recipeResult, null);
  });
  
  runTest('Should correctly check if inventory matches recipe memory', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
    // Setup recipe memory
    crafterBlock.recipeMemory = [
      { id: 'planks', count: 2 },
      { id: 'stick', count: 1 },
      null, null, null, null, null, null, null
    ];
    crafterBlock.recipeResult = { id: 'wooden_pickaxe', count: 1 };
    
    // Set up matching inventory
    crafterBlock.placeItem(0, { id: 'planks', count: 2 });
    crafterBlock.placeItem(1, { id: 'stick', count: 3 }); // More than needed is ok
    
    // Should match
    assert.strictEqual(crafterBlock.matchesRecipeMemory(), true);
    
    // Change inventory to not match
    crafterBlock.placeItem(2, { id: 'stone', count: 1 });
    
    // Should not match (extra item)
    assert.strictEqual(crafterBlock.matchesRecipeMemory(), false);
    
    // Remove the extra item
    crafterBlock.removeItem(2);
    
    // Should match again
    assert.strictEqual(crafterBlock.matchesRecipeMemory(), true);
    
    // Replace with wrong item
    crafterBlock.placeItem(0, { id: 'stone', count: 2 });
    
    // Should not match (wrong item)
    assert.strictEqual(crafterBlock.matchesRecipeMemory(), false);
    
    // Correct item but insufficient count
    crafterBlock.placeItem(0, { id: 'planks', count: 1 });
    
    // Should not match (insufficient count)
    assert.strictEqual(crafterBlock.matchesRecipeMemory(), false);
  });
  
  console.log('\nCrafting Modes:');
  
  runTest('Should default to manual mode', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
    assert.strictEqual(crafterBlock.craftingMode, 'manual');
  });
  
  runTest('Should allow setting crafting mode', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
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
  
  runTest('Should reject invalid crafting modes', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
    // Try to set invalid mode
    const result = crafterBlock.setCraftingMode('invalid_mode');
    assert.strictEqual(result, false);
    assert.strictEqual(crafterBlock.craftingMode, 'manual'); // Should remain unchanged
  });
  
  console.log('\nSlot Locking:');
  
  runTest('Should have all slots unlocked by default', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
    // All slots should start unlocked
    for (let i = 0; i < crafterBlock.inventorySize; i++) {
      assert.strictEqual(crafterBlock.slotsLocked[i], false);
    }
  });
  
  runTest('Should allow toggling slot lock status', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
    // Lock slot 0
    const result1 = crafterBlock.toggleSlotLock(0);
    assert.strictEqual(result1, true);
    assert.strictEqual(crafterBlock.slotsLocked[0], true);
    
    // Unlock slot 0
    const result2 = crafterBlock.toggleSlotLock(0);
    assert.strictEqual(result2, false);
    assert.strictEqual(crafterBlock.slotsLocked[0], false);
  });
  
  runTest('Should prevent placing items in locked slots', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
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
  
  console.log('\nRedstone Modes:');
  
  runTest('Should default to pulse mode', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
    assert.strictEqual(crafterBlock.redstoneMode, 'pulse');
  });
  
  runTest('Should cycle through redstone modes', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
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
  
  console.log('\nComparator Output:');
  
  runTest('Should report low signal when empty', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
    // Empty inventory
    assert.strictEqual(crafterBlock.getComparatorOutput(), 0);
  });
  
  runTest('Should report signal proportional to inventory fullness when no recipe memory', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
    // Fill half the slots
    for (let i = 0; i < 4; i++) {
      crafterBlock.placeItem(i, { id: 'test_item', count: 1 });
    }
    
    // Should output around half strength
    const output = crafterBlock.getComparatorOutput();
    assert.ok(output > 0 && output < 15, `Output ${output} should be between 0 and 15`);
    assert.strictEqual(output, 6); // 4/9 * 15 = 6.67, floored to 6
  });
  
  runTest('Should output based on recipe completeness with recipe memory', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    
    // Setup recipe memory requiring 3 slots
    crafterBlock.recipeMemory = [
      { id: 'planks', count: 2 },
      { id: 'stick', count: 1 },
      { id: 'iron', count: 3 },
      null, null, null, null, null, null
    ];
    
    // Empty inventory - 0% complete
    assert.strictEqual(crafterBlock.getComparatorOutput(), 0);
    
    // Fill 1/3 of required slots
    crafterBlock.placeItem(0, { id: 'planks', count: 2 });
    
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
  
  console.log('\nSerialization and Deserialization:');
  
  runTest('Should properly serialize and deserialize enhanced properties', () => {
    // Reset block
    crafterBlock = new CrafterBlock();
    crafterBlock.setWorld(world);
    
    // Setup block with enhanced properties
    crafterBlock.recipeMemory = [
      { id: 'planks', count: 2 },
      { id: 'stick', count: 1 },
      null, null, null, null, null, null, null
    ];
    crafterBlock.recipeResult = { id: 'wooden_pickaxe', count: 1 };
    crafterBlock.craftingMode = 'template';
    crafterBlock.slotsLocked[0] = true;
    crafterBlock.redstoneMode = 'continuous';
    
    // Add some inventory items
    crafterBlock.placeItem(1, { id: 'stone', count: 3 });
    
    // Serialize
    const serialized = crafterBlock.serialize();
    
    // Deserialize into a new block
    const deserializedBlock = CrafterBlock.deserialize(serialized, world);
    
    // Verify enhanced properties
    assert.deepStrictEqual(deserializedBlock.recipeMemory, crafterBlock.recipeMemory);
    assert.deepStrictEqual(deserializedBlock.recipeResult, crafterBlock.recipeResult);
    assert.strictEqual(deserializedBlock.craftingMode, crafterBlock.craftingMode);
    assert.deepStrictEqual(deserializedBlock.slotsLocked, crafterBlock.slotsLocked);
    assert.strictEqual(deserializedBlock.redstoneMode, crafterBlock.redstoneMode);
    assert.deepStrictEqual(deserializedBlock.inventory[1], crafterBlock.inventory[1]);
  });
  
  // Print test summary
  console.log(`\n${passedTests} tests passed, ${failedTests} tests failed.`);
  
  // Return success status
  return failedTests === 0;
}

// If this file is run directly (not imported), run the tests
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests }; 