/**
 * SmithingManager - Handles smithing table recipes and upgrades
 * Part of the Minecraft 1.21 Tricky Trials Update
 */
const RecipeManager = require('./recipeManager');
const { v4: uuidv4 } = require('uuid');

class SmithingManager extends RecipeManager {
  /**
   * Create a smithing manager
   */
  constructor() {
    super('smithing');
    
    // Recipe categories
    this.categories = {
      UPGRADE: 'upgrade',
      TRIM: 'trim',
      TEMPLATE: 'template'
    };
    
    // Recipe types
    this.types = {
      NETHERITE: 'netherite',
      DIAMOND: 'diamond',
      GOLD: 'gold',
      IRON: 'iron',
      COPPER: 'copper'
    };
    
    // Initialize recipe registry
    this.recipes = new Map();
    this.templates = new Map();
  }
  
  /**
   * Register a smithing recipe
   * @param {Object} recipe - The recipe to register
   */
  registerRecipe(recipe) {
    const id = recipe.id || uuidv4();
    this.recipes.set(id, {
      ...recipe,
      id,
      type: recipe.type || this.types.NETHERITE,
      category: recipe.category || this.categories.UPGRADE
    });
  }
  
  /**
   * Register a smithing template
   * @param {Object} template - The template to register
   */
  registerTemplate(template) {
    const id = template.id || uuidv4();
    this.templates.set(id, {
      ...template,
      id,
      type: template.type || this.types.NETHERITE
    });
  }
  
  /**
   * Check if a recipe matches the given ingredients
   * @param {Object} base - The base item
   * @param {Object} addition - The addition item
   * @param {Object} template - The template item
   * @returns {Object|null} The matching recipe or null
   */
  findMatchingRecipe(base, addition, template) {
    for (const recipe of this.recipes.values()) {
      if (this.matchesRecipe(recipe, base, addition, template)) {
        return recipe;
      }
    }
    return null;
  }
  
  /**
   * Check if ingredients match a recipe
   * @param {Object} recipe - The recipe to check
   * @param {Object} base - The base item
   * @param {Object} addition - The addition item
   * @param {Object} template - The template item
   * @returns {boolean} Whether the ingredients match
   */
  matchesRecipe(recipe, base, addition, template) {
    // Check base item
    if (!this.matchesIngredient(recipe.base, base)) {
      return false;
    }
    
    // Check addition item
    if (!this.matchesIngredient(recipe.addition, addition)) {
      return false;
    }
    
    // Check template if required
    if (recipe.template && !this.matchesIngredient(recipe.template, template)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if an item matches an ingredient
   * @param {Object} ingredient - The ingredient to match
   * @param {Object} item - The item to check
   * @returns {boolean} Whether the item matches
   */
  matchesIngredient(ingredient, item) {
    if (!ingredient || !item) {
      return false;
    }
    
    // Check item type
    if (ingredient.type && ingredient.type !== item.type) {
      return false;
    }
    
    // Check item tags
    if (ingredient.tags) {
      for (const tag of ingredient.tags) {
        if (!item.tags || !item.tags.includes(tag)) {
          return false;
        }
      }
    }
    
    // Check item properties
    if (ingredient.properties) {
      for (const [key, value] of Object.entries(ingredient.properties)) {
        if (item[key] !== value) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Get all recipes of a specific type
   * @param {string} type - The recipe type
   * @returns {Array} The matching recipes
   */
  getRecipesByType(type) {
    return Array.from(this.recipes.values())
      .filter(recipe => recipe.type === type);
  }
  
  /**
   * Get all recipes in a category
   * @param {string} category - The recipe category
   * @returns {Array} The matching recipes
   */
  getRecipesByCategory(category) {
    return Array.from(this.recipes.values())
      .filter(recipe => recipe.category === category);
  }
  
  /**
   * Get all available templates
   * @returns {Array} The available templates
   */
  getTemplates() {
    return Array.from(this.templates.values());
  }
  
  /**
   * Get a template by ID
   * @param {string} id - The template ID
   * @returns {Object|null} The template or null
   */
  getTemplate(id) {
    return this.templates.get(id) || null;
  }
  
  /**
   * Serialize the manager state
   * @returns {Object} The serialized state
   */
  serialize() {
    return {
      recipes: Array.from(this.recipes.values()),
      templates: Array.from(this.templates.values())
    };
  }
  
  /**
   * Deserialize the manager state
   * @param {Object} data - The serialized state
   */
  deserialize(data) {
    this.recipes.clear();
    this.templates.clear();
    
    if (data.recipes) {
      for (const recipe of data.recipes) {
        this.registerRecipe(recipe);
      }
    }
    
    if (data.templates) {
      for (const template of data.templates) {
        this.registerTemplate(template);
      }
    }
  }
}

module.exports = SmithingManager; 