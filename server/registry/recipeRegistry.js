/**
 * Recipe Registry
 * Manages all crafting and stonecutter recipes in the game
 */

class RecipeRegistry {
  constructor() {
    this.recipes = new Map();
    this.stonecutterRecipes = new Map();
  }

  /**
   * Register a crafting recipe
   * @param {string} id - Recipe identifier
   * @param {Object} recipe - Recipe data
   */
  registerRecipe(id, recipe) {
    if (this.recipes.has(id)) {
      console.warn(`Recipe '${id}' already registered, overwriting`);
    }
    this.recipes.set(id, recipe);
  }

  /**
   * Register a stonecutter recipe
   * @param {string} id - Recipe identifier
   * @param {Object} recipe - Recipe data
   */
  registerStonecutterRecipe(id, recipe) {
    if (this.stonecutterRecipes.has(id)) {
      console.warn(`Stonecutter recipe '${id}' already registered, overwriting`);
    }
    this.stonecutterRecipes.set(id, recipe);
  }

  /**
   * Get a crafting recipe by ID
   * @param {string} id - Recipe identifier
   * @returns {Object|null} - Recipe data or null if not found
   */
  getRecipe(id) {
    return this.recipes.get(id) || null;
  }

  /**
   * Get a stonecutter recipe by ID
   * @param {string} id - Recipe identifier
   * @returns {Object|null} - Recipe data or null if not found
   */
  getStonecutterRecipe(id) {
    return this.stonecutterRecipes.get(id) || null;
  }

  /**
   * Get all crafting recipes
   * @returns {Map} - Map of all recipes
   */
  getAllRecipes() {
    return this.recipes;
  }

  /**
   * Get all stonecutter recipes
   * @returns {Map} - Map of all stonecutter recipes
   */
  getAllStonecutterRecipes() {
    return this.stonecutterRecipes;
  }

  /**
   * Clear all recipes
   */
  clear() {
    this.recipes.clear();
    this.stonecutterRecipes.clear();
  }
}

// Create singleton instance
const recipeRegistry = new RecipeRegistry();

module.exports = recipeRegistry; 