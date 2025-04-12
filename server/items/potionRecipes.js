/**
 * PotionRecipes - Manages brewing recipes for potions
 */

class PotionRecipes {
  constructor() {
    this.recipes = [];
    this.registerDefaultRecipes();
  }
  
  /**
   * Register a new brewing recipe
   * @param {Object} recipe - Recipe definition
   * @returns {boolean} Whether registration was successful
   */
  registerRecipe(recipe) {
    if (!recipe.base || !recipe.ingredient || !recipe.result) {
      return false;
    }
    
    // Check for duplicate recipes
    const duplicateIndex = this.recipes.findIndex(r => 
      r.base === recipe.base && r.ingredient === recipe.ingredient
    );
    
    if (duplicateIndex >= 0) {
      // Replace duplicate
      this.recipes[duplicateIndex] = recipe;
    } else {
      // Add new recipe
      this.recipes.push(recipe);
    }
    
    return true;
  }
  
  /**
   * Get a brewing recipe by base potion and ingredient
   * @param {string} base - Base potion ID
   * @param {string} ingredient - Ingredient item ID
   * @returns {Object|null} Recipe or null if not found
   */
  getRecipe(base, ingredient) {
    return this.recipes.find(r => r.base === base && r.ingredient === ingredient) || null;
  }
  
  /**
   * Get all recipes that use a specific base potion
   * @param {string} base - Base potion ID
   * @returns {Array} Array of recipes
   */
  getRecipesForBase(base) {
    return this.recipes.filter(r => r.base === base);
  }
  
  /**
   * Get all recipes that result in a specific potion
   * @param {string} result - Result potion ID
   * @returns {Array} Array of recipes
   */
  getRecipesForResult(result) {
    return this.recipes.filter(r => r.result === result);
  }
  
  /**
   * Get all recipes that use a specific ingredient
   * @param {string} ingredient - Ingredient item ID
   * @returns {Array} Array of recipes
   */
  getRecipesForIngredient(ingredient) {
    return this.recipes.filter(r => r.ingredient === ingredient);
  }
  
  /**
   * Register default brewing recipes
   */
  registerDefaultRecipes() {
    // Base potions
    this.registerRecipe({
      base: 'WATER',
      ingredient: 'NETHER_WART',
      result: 'AWKWARD'
    });
    
    this.registerRecipe({
      base: 'WATER',
      ingredient: 'REDSTONE',
      result: 'MUNDANE'
    });
    
    this.registerRecipe({
      base: 'WATER',
      ingredient: 'GLOWSTONE_DUST',
      result: 'MUNDANE'
    });
    
    this.registerRecipe({
      base: 'WATER',
      ingredient: 'FERMENTED_SPIDER_EYE',
      result: 'MUNDANE'
    });
    
    this.registerRecipe({
      base: 'WATER',
      ingredient: 'GUNPOWDER',
      result: 'SPLASH_WATER'
    });
    
    this.registerRecipe({
      base: 'WATER',
      ingredient: 'DRAGON_BREATH',
      result: 'LINGERING_WATER'
    });
    
    // Effect potions
    this.registerRecipe({
      base: 'AWKWARD',
      ingredient: 'GOLDEN_CARROT',
      result: 'NIGHT_VISION'
    });
    
    this.registerRecipe({
      base: 'NIGHT_VISION',
      ingredient: 'FERMENTED_SPIDER_EYE',
      result: 'INVISIBILITY'
    });
    
    this.registerRecipe({
      base: 'AWKWARD',
      ingredient: 'RABBIT_FOOT',
      result: 'LEAPING'
    });
    
    this.registerRecipe({
      base: 'AWKWARD',
      ingredient: 'MAGMA_CREAM',
      result: 'FIRE_RESISTANCE'
    });
    
    this.registerRecipe({
      base: 'AWKWARD',
      ingredient: 'SUGAR',
      result: 'SWIFTNESS'
    });
    
    this.registerRecipe({
      base: 'SWIFTNESS',
      ingredient: 'FERMENTED_SPIDER_EYE',
      result: 'SLOWNESS'
    });
    
    this.registerRecipe({
      base: 'LEAPING',
      ingredient: 'FERMENTED_SPIDER_EYE',
      result: 'SLOWNESS'
    });
    
    this.registerRecipe({
      base: 'AWKWARD',
      ingredient: 'PUFFERFISH',
      result: 'WATER_BREATHING'
    });
    
    this.registerRecipe({
      base: 'AWKWARD',
      ingredient: 'GLISTERING_MELON',
      result: 'HEALING'
    });
    
    this.registerRecipe({
      base: 'HEALING',
      ingredient: 'FERMENTED_SPIDER_EYE',
      result: 'HARMING'
    });
    
    this.registerRecipe({
      base: 'AWKWARD',
      ingredient: 'SPIDER_EYE',
      result: 'POISON'
    });
    
    this.registerRecipe({
      base: 'POISON',
      ingredient: 'FERMENTED_SPIDER_EYE',
      result: 'HARMING'
    });
    
    this.registerRecipe({
      base: 'AWKWARD',
      ingredient: 'GHAST_TEAR',
      result: 'REGENERATION'
    });
    
    this.registerRecipe({
      base: 'AWKWARD',
      ingredient: 'BLAZE_POWDER',
      result: 'STRENGTH'
    });
    
    this.registerRecipe({
      base: 'AWKWARD',
      ingredient: 'FERMENTED_SPIDER_EYE',
      result: 'WEAKNESS'
    });
    
    this.registerRecipe({
      base: 'AWKWARD',
      ingredient: 'PHANTOM_MEMBRANE',
      result: 'SLOW_FALLING'
    });
    
    // Duration modifiers
    this.registerDurationModifiers();
    
    // Strength modifiers
    this.registerStrengthModifiers();
    
    // Splash and lingering conversions
    this.registerTypeModifiers();
  }
  
  /**
   * Register duration modifiers (redstone for longer duration)
   */
  registerDurationModifiers() {
    const potionsWithLongVariants = [
      'NIGHT_VISION',
      'INVISIBILITY',
      'LEAPING',
      'FIRE_RESISTANCE',
      'SWIFTNESS',
      'SLOWNESS',
      'WATER_BREATHING',
      'POISON',
      'REGENERATION',
      'STRENGTH',
      'WEAKNESS',
      'SLOW_FALLING'
    ];
    
    potionsWithLongVariants.forEach(potionId => {
      this.registerRecipe({
        base: potionId,
        ingredient: 'REDSTONE',
        result: `${potionId}_LONG`
      });
      
      // Also register splash and lingering variants
      this.registerRecipe({
        base: `SPLASH_${potionId}`,
        ingredient: 'REDSTONE',
        result: `SPLASH_${potionId}_LONG`
      });
      
      this.registerRecipe({
        base: `LINGERING_${potionId}`,
        ingredient: 'REDSTONE',
        result: `LINGERING_${potionId}_LONG`
      });
    });
  }
  
  /**
   * Register strength modifiers (glowstone for stronger effect)
   */
  registerStrengthModifiers() {
    const potionsWithStrongVariants = [
      'LEAPING',
      'SWIFTNESS',
      'SLOWNESS',
      'POISON',
      'HEALING',
      'HARMING',
      'REGENERATION',
      'STRENGTH'
    ];
    
    potionsWithStrongVariants.forEach(potionId => {
      this.registerRecipe({
        base: potionId,
        ingredient: 'GLOWSTONE_DUST',
        result: `${potionId}_STRONG`
      });
      
      // Also register splash and lingering variants
      this.registerRecipe({
        base: `SPLASH_${potionId}`,
        ingredient: 'GLOWSTONE_DUST',
        result: `SPLASH_${potionId}_STRONG`
      });
      
      this.registerRecipe({
        base: `LINGERING_${potionId}`,
        ingredient: 'GLOWSTONE_DUST',
        result: `LINGERING_${potionId}_STRONG`
      });
    });
  }
  
  /**
   * Register type modifiers (gunpowder for splash, dragon breath for lingering)
   */
  registerTypeModifiers() {
    // Get all regular potions
    const allPotions = [
      'WATER', 'MUNDANE', 'THICK', 'AWKWARD',
      'NIGHT_VISION', 'NIGHT_VISION_LONG',
      'INVISIBILITY', 'INVISIBILITY_LONG',
      'LEAPING', 'LEAPING_LONG', 'LEAPING_STRONG',
      'FIRE_RESISTANCE', 'FIRE_RESISTANCE_LONG',
      'SWIFTNESS', 'SWIFTNESS_LONG', 'SWIFTNESS_STRONG',
      'SLOWNESS', 'SLOWNESS_LONG', 'SLOWNESS_STRONG',
      'WATER_BREATHING', 'WATER_BREATHING_LONG',
      'HEALING', 'HEALING_STRONG',
      'HARMING', 'HARMING_STRONG',
      'POISON', 'POISON_LONG', 'POISON_STRONG',
      'REGENERATION', 'REGENERATION_LONG', 'REGENERATION_STRONG',
      'STRENGTH', 'STRENGTH_LONG', 'STRENGTH_STRONG',
      'WEAKNESS', 'WEAKNESS_LONG',
      'SLOW_FALLING', 'SLOW_FALLING_LONG'
    ];
    
    // Convert to splash
    allPotions.forEach(potionId => {
      this.registerRecipe({
        base: potionId,
        ingredient: 'GUNPOWDER',
        result: `SPLASH_${potionId}`
      });
    });
    
    // Convert to lingering (from splash)
    allPotions.forEach(potionId => {
      this.registerRecipe({
        base: `SPLASH_${potionId}`,
        ingredient: 'DRAGON_BREATH',
        result: `LINGERING_${potionId}`
      });
    });
  }
  
  /**
   * Get all recipes as an array
   * @returns {Array} Array of all recipes
   */
  getAllRecipes() {
    return [...this.recipes];
  }
}

module.exports = PotionRecipes; 