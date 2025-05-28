/**
 * RecipeManager - Handles recipe validation and crafting
 */

class RecipeManager {
  constructor() {
    this.recipes = new Map();
    this.initializeRecipes();
  }

  /**
   * Initialize default recipes
   */
  initializeRecipes() {
    // Wooden Pickaxe Recipe - accepts both wood_planks and oak_planks
    this.addRecipe({
      id: 'wooden_pickaxe',
      pattern: [
        ['wood_planks', 'wood_planks', 'wood_planks'],
        [null, 'stick', null],
        [null, 'stick', null]
      ],
      result: {
        id: 'wooden_pickaxe',
        count: 1
      },
      alternatives: {
        'wood_planks': ['oak_planks', 'birch_planks', 'spruce_planks', 'jungle_planks', 'acacia_planks', 'dark_oak_planks']
      }
    });

    // Add more recipes as needed
  }

  /**
   * Add a new recipe
   * @param {Object} recipe - Recipe definition
   */
  addRecipe(recipe) {
    this.recipes.set(recipe.id, recipe);
  }

  /**
   * Get a recipe by ID
   * @param {string} id - Recipe ID
   * @returns {Object|null} Recipe definition or null if not found
   */
  getRecipe(id) {
    return this.recipes.get(id) || null;
  }

  /**
   * Check if a crafting grid matches a recipe pattern
   * @param {Array} grid - 3x3 crafting grid
   * @param {Array} pattern - Recipe pattern
   * @param {Object} alternatives - Alternative items for each pattern item
   * @returns {boolean} Whether the grid matches the pattern
   */
  matchesPattern(grid, pattern, alternatives = {}) {
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const gridItem = grid[y * 3 + x];
        const patternItem = pattern[y][x];

        if (patternItem === null) {
          if (gridItem !== null) return false;
        } else {
          if (!gridItem || gridItem.count < 1) return false;
          
          // Check if the item matches the pattern or any alternatives
          const patternAlternatives = alternatives[patternItem] || [];
          if (gridItem.id !== patternItem && !patternAlternatives.includes(gridItem.id)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Find a matching recipe for a crafting grid
   * @param {Array} grid - 3x3 crafting grid
   * @returns {Object|null} Matching recipe or null if none found
   */
  findMatchingRecipe(grid) {
    for (const recipe of this.recipes.values()) {
      if (this.matchesPattern(grid, recipe.pattern, recipe.alternatives)) {
        return recipe;
      }
    }
    return null;
  }

  /**
   * Craft an item using a recipe
   * @param {Array} grid - 3x3 crafting grid
   * @returns {Object|null} Crafted item or null if no valid recipe
   */
  craftItem(grid) {
    const recipe = this.findMatchingRecipe(grid);
    if (!recipe) return null;

    // Create a copy of the result item
    return {
      id: recipe.result.id,
      count: recipe.result.count
    };
  }

  /**
   * Calculate the completeness percentage of a pattern match
   * @param {Array} grid - 3x3 crafting grid
   * @param {Array} pattern - Recipe pattern
   * @param {Object} alternatives - Alternative items for each pattern item
   * @returns {number} Completeness percentage (0-100)
   */
  calculatePatternCompleteness(grid, pattern, alternatives = {}) {
    let matchedSlots = 0;
    let totalRequiredSlots = 0;
    
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const gridItem = grid[y * 3 + x];
        const patternItem = pattern[y][x];
        
        if (patternItem !== null) {
          totalRequiredSlots++;
          
          if (gridItem && gridItem.count >= 1) {
            // Check if the item matches the pattern or any alternatives
            const patternAlternatives = alternatives[patternItem] || [];
            if (gridItem.id === patternItem || patternAlternatives.includes(gridItem.id)) {
              matchedSlots++;
            }
          }
        }
      }
    }
    
    // Avoid division by zero
    if (totalRequiredSlots === 0) {
      return 0;
    }
    
    return Math.round((matchedSlots / totalRequiredSlots) * 100);
  }
}

module.exports = RecipeManager; 