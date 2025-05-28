/**
 * CrafterBlock - Automated crafting block from Minecraft 1.21 Update
 * Allows for redstone-powered crafting automation
 * Enhanced for Minecraft 1.24 Update (Trail Tales)
 */

const Block = require('./baseBlock');
const { EventEmitter } = require('events');

class CrafterBlock extends Block {
  // ... existing constructor and other methods ...

  /**
   * Check if current inventory matches recipe memory
   * @returns {boolean} Whether inventory matches recipe memory
   */
  matchesRecipeMemory() {
    if (!this.recipeMemory) {
      return false;
    }
    
    // Get recipe manager from world
    const recipeManager = this.world.getRecipeManager();
    if (!recipeManager) {
      return false;
    }
    
    // Convert inventory to 3x3 grid format
    const grid = [];
    for (let y = 0; y < 3; y++) {
      const row = [];
      for (let x = 0; x < 3; x++) {
        const slot = y * 3 + x;
        row.push(this.inventory[slot]);
      }
      grid.push(row);
    }
    
    // Find matching recipe using recipe manager
    const recipe = recipeManager.findMatchingRecipe(grid);
    return recipe !== null;
  }
  
  /**
   * Calculate recipe completeness percentage
   * @returns {number} Percentage of recipe completeness (0-100)
   */
  calculateRecipeCompleteness() {
    if (!this.recipeMemory) {
      return 0;
    }
    
    let matchedSlots = 0;
    let totalRequiredSlots = 0;
    
    for (let i = 0; i < this.inventorySize; i++) {
      const memoryItem = this.recipeMemory[i];
      
      if (memoryItem) {
        totalRequiredSlots++;
        const currentItem = this.inventory[i];
        
        // If current item matches memory item
        if (currentItem && currentItem.id === memoryItem.id && currentItem.count >= memoryItem.count) {
          matchedSlots++;
        }
      }
    }
    
    // Avoid division by zero
    if (totalRequiredSlots === 0) {
      return 0;
    }
    
    return Math.round((matchedSlots / totalRequiredSlots) * 100);
  }
  
  /**
   * Get comparator output signal strength
   * @returns {number} Signal strength (0-15)
   */
  getComparatorOutput() {
    // If no recipe memory, base on inventory fullness
    if (!this.recipeMemory) {
      // Count non-empty slots
      const filledSlots = this.inventory.filter(item => item !== null).length;
      // Scale to 0-15 range
      return Math.min(15, Math.floor((filledSlots / this.inventorySize) * 15));
    }
    
    // With recipe memory, base on recipe completeness
    const completeness = this.calculateRecipeCompleteness();
    
    // Output strength varies based on state:
    // 0: Empty/no recipe
    // 1-7: Partial recipe completion (based on percentage)
    // 8-14: Full recipe but not enough ingredients
    // 15: Ready to craft
    
    if (completeness === 0) {
      return 0;
    } else if (completeness < 100) {
      // Scale 1-7 based on completion percentage
      // For 33% completion: 1 + Math.round((33/100) * 6) = 1 + 2 = 3
      // For 66% completion: 1 + Math.round((66/100) * 6) = 1 + 4 = 5
      // For 100% completion: 1 + Math.round((100/100) * 6) = 1 + 6 = 7
      return 1 + Math.round((completeness / 100) * 6);
    } else if (this.outputSlot) {
      // Output slot occupied
      return 15;
    } else {
      // Ready to craft
      return 14;
    }
  }
}

module.exports = CrafterBlock; 