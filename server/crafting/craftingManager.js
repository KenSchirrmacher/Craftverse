/**
 * CraftingManager - Manages all crafting recipes in the game
 */
class CraftingManager {
  /**
   * Create a new crafting manager
   */
  constructor() {
    // Store shaped and shapeless recipes separately
    this.shapedRecipes = [];
    this.shapelessRecipes = [];
  }
  
  /**
   * Register a recipe (can be shaped or shapeless)
   * @param {Object} recipe - Recipe definition
   * @returns {boolean} Success
   */
  registerRecipe(recipe) {
    if (!recipe || !recipe.type || !recipe.result) {
      console.error('Invalid recipe:', recipe);
      return false;
    }
    
    if (recipe.type === 'shaped') {
      return this.registerShapedRecipe(recipe);
    } else if (recipe.type === 'shapeless') {
      return this.registerShapelessRecipe(recipe);
    } else {
      console.error('Unknown recipe type:', recipe.type);
      return false;
    }
  }
  
  /**
   * Register a shaped recipe (items must be in specific pattern)
   * @param {Object} recipe - Recipe definition
   * @param {Array<String>} recipe.pattern - Array of strings representing crafting grid pattern
   * @param {Object} recipe.ingredients - Map of characters in pattern to item types
   * @param {Object} recipe.result - Result item { item, count }
   * @param {String} recipe.id - Recipe ID
   * @returns {boolean} Success
   */
  registerShapedRecipe(recipe) {
    if (!recipe || !recipe.pattern || !recipe.ingredients || !recipe.result) {
      console.error('Invalid shaped recipe:', recipe);
      return false;
    }
    
    this.shapedRecipes.push(recipe);
    return true;
  }
  
  /**
   * Register a shapeless recipe (items can be in any position)
   * @param {Object} recipe - Recipe definition
   * @param {Array<Object>} recipe.ingredients - Array of items { type, count }
   * @param {Object} recipe.result - Result item { item, count }
   * @param {String} recipe.id - Recipe ID
   * @returns {boolean} Success
   */
  registerShapelessRecipe(recipe) {
    if (!recipe || !recipe.ingredients || !recipe.result) {
      console.error('Invalid shapeless recipe:', recipe);
      return false;
    }
    
    this.shapelessRecipes.push(recipe);
    return true;
  }
  
  /**
   * Get all registered recipes
   * @returns {Object} All recipes
   */
  getRecipes() {
    return {
      shaped: this.shapedRecipes,
      shapeless: this.shapelessRecipes
    };
  }
  
  /**
   * Find a recipe that matches the given ingredients
   * @param {Array<Object>} ingredients - Array of items { id, count, position? }
   * @param {boolean} isShapedCrafting - Whether to consider item positions
   * @returns {Object|null} Matching recipe or null
   */
  findMatchingRecipe(ingredients, isShapedCrafting = false) {
    if (isShapedCrafting) {
      return this.findShapedRecipe(ingredients);
    } else {
      return this.findShapelessRecipe(ingredients);
    }
  }
  
  /**
   * Find a shaped recipe that matches the given ingredients and positions
   * @private
   * @param {Array<Object>} ingredients - Array of items with positions
   * @returns {Object|null} Matching recipe or null
   */
  findShapedRecipe(ingredients) {
    // TODO: Implement shaped recipe matching
    return null;
  }
  
  /**
   * Find a shapeless recipe that matches the given ingredients
   * @private
   * @param {Array<Object>} ingredients - Array of items
   * @returns {Object|null} Matching recipe or null
   */
  findShapelessRecipe(ingredients) {
    // Create a map of ingredient IDs to their counts
    const ingredientMap = {};
    for (const item of ingredients) {
      if (!item || !item.id) continue;
      ingredientMap[item.id] = (ingredientMap[item.id] || 0) + item.count;
    }
    
    // Check each shapeless recipe
    for (const recipe of this.shapelessRecipes) {
      let isMatch = true;
      
      // Check if all required ingredients are present in the correct amounts
      for (const requiredIngredient of recipe.ingredients) {
        const availableCount = ingredientMap[requiredIngredient.id] || 0;
        if (availableCount < requiredIngredient.count) {
          isMatch = false;
          break;
        }
      }
      
      // Check if there are no extra ingredients
      const requiredIngredientIds = recipe.ingredients.map(ing => ing.id);
      const availableIngredientIds = Object.keys(ingredientMap).filter(id => ingredientMap[id] > 0);
      
      if (availableIngredientIds.length !== requiredIngredientIds.length) {
        isMatch = false;
      }
      
      if (isMatch) {
        return recipe;
      }
    }
    
    return null;
  }
  
  /**
   * Register default crafting recipes
   */
  registerDefaultRecipes() {
    // Register Wild Update recipes
    this.registerWildUpdateRecipes();
    
    // Register Trails & Tales Update recipes
    this.registerTrailsAndTalesRecipes();
  }
  
  /**
   * Register Wild Update recipes
   */
  registerWildUpdateRecipes() {
    // Register Recovery Compass recipe (8 Echo Shards + 1 Compass)
    this.registerShapedRecipe({
      id: 'recovery_compass_recipe',
      type: 'shaped',
      pattern: [
        ['echo_shard', 'echo_shard', 'echo_shard'],
        ['echo_shard', 'compass', 'echo_shard'],
        ['echo_shard', 'echo_shard', 'echo_shard']
      ],
      ingredients: {
        'echo_shard': { type: 'echo_shard' },
        'compass': { type: 'compass' }
      },
      result: { item: 'recovery_compass', count: 1 },
      category: 'TOOLS'
    });
  }
  
  /**
   * Register Trails & Tales Update recipes
   */
  registerTrailsAndTalesRecipes() {
    // Register pottery system recipes
    const { registerPotteryRecipes } = require('./potteryRecipes');
    registerPotteryRecipes(this);
  }
}

module.exports = CraftingManager; 