/**
 * Stonecutter Registry
 * Manages all stonecutter-specific recipes in the game
 */

class StonecutterRegistry {
  constructor() {
    this.recipes = new Map();
  }

  /**
   * Register a stonecutter recipe
   * @param {string} id - Recipe identifier
   * @param {Object} recipe - Recipe data
   */
  registerRecipe(id, recipe) {
    if (this.recipes.has(id)) {
      console.warn(`Stonecutter recipe '${id}' already registered, overwriting`);
    }
    this.recipes.set(id, recipe);
  }

  /**
   * Get a stonecutter recipe by ID
   * @param {string} id - Recipe identifier
   * @returns {Object|null} - Recipe data or null if not found
   */
  getRecipe(id) {
    return this.recipes.get(id) || null;
  }

  /**
   * Get all stonecutter recipes
   * @returns {Map} - Map of all recipes
   */
  getAllRecipes() {
    return this.recipes;
  }

  /**
   * Get recipes for a specific input material
   * @param {string} material - Input material ID
   * @returns {Array} - Array of recipes for the material
   */
  getRecipesForMaterial(material) {
    return Array.from(this.recipes.values())
      .filter(recipe => recipe.input === material);
  }

  /**
   * Clear all recipes
   */
  clear() {
    this.recipes.clear();
  }
}

// Create singleton instance
const stonecutterRegistry = new StonecutterRegistry();

module.exports = stonecutterRegistry; 