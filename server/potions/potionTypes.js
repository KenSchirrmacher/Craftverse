/**
 * Potion Types - Defines all potion types, their effects, and brewing recipes
 */

const { PotionEffects } = require('./potionEffects');

// Potion categories
const PotionCategory = {
  NORMAL: 'normal',       // Regular drinkable potion
  SPLASH: 'splash',       // Throwable splash potion
  LINGERING: 'lingering'  // Creates a cloud effect
};

// Base potion types (used in brewing)
const BasePotionType = {
  AWKWARD: 'awkward',
  MUNDANE: 'mundane',
  THICK: 'thick',
  WATER: 'water'
};

// Ingredients used in brewing
const BrewingIngredient = {
  // Base ingredients
  NETHER_WART: { id: 'nether_wart', displayName: 'Nether Wart' },
  REDSTONE: { id: 'redstone', displayName: 'Redstone' },
  GLOWSTONE: { id: 'glowstone_dust', displayName: 'Glowstone Dust' },
  FERMENTED_SPIDER_EYE: { id: 'fermented_spider_eye', displayName: 'Fermented Spider Eye' },
  GUNPOWDER: { id: 'gunpowder', displayName: 'Gunpowder' },
  DRAGON_BREATH: { id: 'dragon_breath', displayName: 'Dragon\'s Breath' },
  
  // Effect ingredients
  SUGAR: { id: 'sugar', displayName: 'Sugar' },
  RABBIT_FOOT: { id: 'rabbit_foot', displayName: 'Rabbit\'s Foot' },
  BLAZE_POWDER: { id: 'blaze_powder', displayName: 'Blaze Powder' },
  GLISTERING_MELON: { id: 'glistering_melon', displayName: 'Glistering Melon' },
  SPIDER_EYE: { id: 'spider_eye', displayName: 'Spider Eye' },
  GHAST_TEAR: { id: 'ghast_tear', displayName: 'Ghast Tear' },
  MAGMA_CREAM: { id: 'magma_cream', displayName: 'Magma Cream' },
  PUFFERFISH: { id: 'pufferfish', displayName: 'Pufferfish' },
  GOLDEN_CARROT: { id: 'golden_carrot', displayName: 'Golden Carrot' },
  TURTLE_HELMET: { id: 'turtle_helmet', displayName: 'Turtle Helmet' },
  PHANTOM_MEMBRANE: { id: 'phantom_membrane', displayName: 'Phantom Membrane' }
};

// Duration multipliers for different potion types
const DurationMultiplier = {
  NORMAL: 1,
  EXTENDED: 2.5, // Extended with Redstone
  ENHANCED: 0.6, // Enhanced with Glowstone (level II but shorter)
  SPLASH: 0.75,  // Splash potions are 75% as effective
  LINGERING: 0.25 // Lingering clouds are 25% as effective per tick
};

// Potion definitions
const PotionTypes = {
  // Base potions
  WATER: {
    id: 'water',
    displayName: 'Water Bottle',
    basePotionType: BasePotionType.WATER,
    category: PotionCategory.NORMAL,
    color: '#385DC6',
    effects: [],
    level: 0,
    duration: 0
  },
  
  AWKWARD: {
    id: 'awkward',
    displayName: 'Awkward Potion',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#74AFFC',
    effects: [],
    level: 0,
    duration: 0
  },
  
  MUNDANE: {
    id: 'mundane',
    displayName: 'Mundane Potion',
    basePotionType: BasePotionType.MUNDANE,
    category: PotionCategory.NORMAL,
    color: '#545454',
    effects: [],
    level: 0,
    duration: 0
  },
  
  THICK: {
    id: 'thick',
    displayName: 'Thick Potion',
    basePotionType: BasePotionType.THICK,
    category: PotionCategory.NORMAL,
    color: '#747474',
    effects: [],
    level: 0,
    duration: 0
  },
  
  // Regular potions
  SPEED: {
    id: 'speed',
    displayName: 'Potion of Swiftness',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#7CAFC6',
    effects: [{ id: 'speed', level: 1 }],
    level: 1,
    duration: 180 // 3 minutes
  },
  
  SPEED_EXTENDED: {
    id: 'speed_extended',
    displayName: 'Potion of Swiftness',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#7CAFC6',
    effects: [{ id: 'speed', level: 1 }],
    level: 1,
    duration: 480 // 8 minutes
  },
  
  SPEED_II: {
    id: 'speed_2',
    displayName: 'Potion of Swiftness II',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#7CAFC6',
    effects: [{ id: 'speed', level: 2 }],
    level: 2,
    duration: 90 // 1.5 minutes
  },
  
  SLOWNESS: {
    id: 'slowness',
    displayName: 'Potion of Slowness',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#5A6C81',
    effects: [{ id: 'slowness', level: 1 }],
    level: 1,
    duration: 90 // 1.5 minutes
  },
  
  SLOWNESS_EXTENDED: {
    id: 'slowness_extended',
    displayName: 'Potion of Slowness',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#5A6C81',
    effects: [{ id: 'slowness', level: 1 }],
    level: 1,
    duration: 240 // 4 minutes
  },
  
  STRENGTH: {
    id: 'strength',
    displayName: 'Potion of Strength',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#932423',
    effects: [{ id: 'strength', level: 1 }],
    level: 1,
    duration: 180 // 3 minutes
  },
  
  STRENGTH_EXTENDED: {
    id: 'strength_extended',
    displayName: 'Potion of Strength',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#932423',
    effects: [{ id: 'strength', level: 1 }],
    level: 1,
    duration: 480 // 8 minutes
  },
  
  STRENGTH_II: {
    id: 'strength_2',
    displayName: 'Potion of Strength II',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#932423',
    effects: [{ id: 'strength', level: 2 }],
    level: 2,
    duration: 90 // 1.5 minutes
  },
  
  HEALING: {
    id: 'healing',
    displayName: 'Potion of Healing',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#F82423',
    effects: [{ id: 'instant_health', level: 1 }],
    level: 1,
    duration: 0 // Instant effect
  },
  
  HEALING_II: {
    id: 'healing_2',
    displayName: 'Potion of Healing II',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#F82423',
    effects: [{ id: 'instant_health', level: 2 }],
    level: 2,
    duration: 0 // Instant effect
  },
  
  HARMING: {
    id: 'harming',
    displayName: 'Potion of Harming',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#430A09',
    effects: [{ id: 'instant_damage', level: 1 }],
    level: 1,
    duration: 0 // Instant effect
  },
  
  HARMING_II: {
    id: 'harming_2',
    displayName: 'Potion of Harming II',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#430A09',
    effects: [{ id: 'instant_damage', level: 2 }],
    level: 2,
    duration: 0 // Instant effect
  },
  
  POISON: {
    id: 'poison',
    displayName: 'Potion of Poison',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#4E9331',
    effects: [{ id: 'poison', level: 1 }],
    level: 1,
    duration: 45 // 45 seconds
  },
  
  POISON_EXTENDED: {
    id: 'poison_extended',
    displayName: 'Potion of Poison',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#4E9331',
    effects: [{ id: 'poison', level: 1 }],
    level: 1,
    duration: 120 // 2 minutes
  },
  
  POISON_II: {
    id: 'poison_2',
    displayName: 'Potion of Poison II',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#4E9331',
    effects: [{ id: 'poison', level: 2 }],
    level: 2,
    duration: 22 // 22 seconds
  },
  
  REGENERATION: {
    id: 'regeneration',
    displayName: 'Potion of Regeneration',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#CD5CAB',
    effects: [{ id: 'regeneration', level: 1 }],
    level: 1,
    duration: 45 // 45 seconds
  },
  
  REGENERATION_EXTENDED: {
    id: 'regeneration_extended',
    displayName: 'Potion of Regeneration',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#CD5CAB',
    effects: [{ id: 'regeneration', level: 1 }],
    level: 1,
    duration: 120 // 2 minutes
  },
  
  REGENERATION_II: {
    id: 'regeneration_2',
    displayName: 'Potion of Regeneration II',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#CD5CAB',
    effects: [{ id: 'regeneration', level: 2 }],
    level: 2,
    duration: 22 // 22 seconds
  },
  
  FIRE_RESISTANCE: {
    id: 'fire_resistance',
    displayName: 'Potion of Fire Resistance',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#E49A0F',
    effects: [{ id: 'fire_resistance', level: 1 }],
    level: 1,
    duration: 180 // 3 minutes
  },
  
  FIRE_RESISTANCE_EXTENDED: {
    id: 'fire_resistance_extended',
    displayName: 'Potion of Fire Resistance',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#E49A0F',
    effects: [{ id: 'fire_resistance', level: 1 }],
    level: 1,
    duration: 480 // 8 minutes
  },
  
  WATER_BREATHING: {
    id: 'water_breathing',
    displayName: 'Potion of Water Breathing',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#2E5299',
    effects: [{ id: 'water_breathing', level: 1 }],
    level: 1,
    duration: 180 // 3 minutes
  },
  
  WATER_BREATHING_EXTENDED: {
    id: 'water_breathing_extended',
    displayName: 'Potion of Water Breathing',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#2E5299',
    effects: [{ id: 'water_breathing', level: 1 }],
    level: 1,
    duration: 480 // 8 minutes
  },
  
  NIGHT_VISION: {
    id: 'night_vision',
    displayName: 'Potion of Night Vision',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#1F1FA1',
    effects: [{ id: 'night_vision', level: 1 }],
    level: 1,
    duration: 180 // 3 minutes
  },
  
  NIGHT_VISION_EXTENDED: {
    id: 'night_vision_extended',
    displayName: 'Potion of Night Vision',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#1F1FA1',
    effects: [{ id: 'night_vision', level: 1 }],
    level: 1,
    duration: 480 // 8 minutes
  },
  
  INVISIBILITY: {
    id: 'invisibility',
    displayName: 'Potion of Invisibility',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#7F8392',
    effects: [{ id: 'invisibility', level: 1 }],
    level: 1,
    duration: 180 // 3 minutes
  },
  
  INVISIBILITY_EXTENDED: {
    id: 'invisibility_extended',
    displayName: 'Potion of Invisibility',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#7F8392',
    effects: [{ id: 'invisibility', level: 1 }],
    level: 1,
    duration: 480 // 8 minutes
  },
  
  LEAPING: {
    id: 'leaping',
    displayName: 'Potion of Leaping',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#22FF4C',
    effects: [{ id: 'jump_boost', level: 1 }],
    level: 1,
    duration: 180 // 3 minutes
  },
  
  LEAPING_EXTENDED: {
    id: 'leaping_extended',
    displayName: 'Potion of Leaping',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#22FF4C',
    effects: [{ id: 'jump_boost', level: 1 }],
    level: 1,
    duration: 480 // 8 minutes
  },
  
  LEAPING_II: {
    id: 'leaping_2',
    displayName: 'Potion of Leaping II',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#22FF4C',
    effects: [{ id: 'jump_boost', level: 2 }],
    level: 2,
    duration: 90 // 1.5 minutes
  },
  
  SLOW_FALLING: {
    id: 'slow_falling',
    displayName: 'Potion of Slow Falling',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#FEFDCE',
    effects: [{ id: 'slow_falling', level: 1 }],
    level: 1,
    duration: 90 // 1.5 minutes
  },
  
  SLOW_FALLING_EXTENDED: {
    id: 'slow_falling_extended',
    displayName: 'Potion of Slow Falling',
    basePotionType: BasePotionType.AWKWARD,
    category: PotionCategory.NORMAL,
    color: '#FEFDCE',
    effects: [{ id: 'slow_falling', level: 1 }],
    level: 1,
    duration: 240 // 4 minutes
  }
};

// Define brewing recipes
const BrewingRecipes = [
  // Base potion recipes
  {
    input: PotionTypes.WATER,
    ingredient: BrewingIngredient.NETHER_WART,
    output: PotionTypes.AWKWARD
  },
  {
    input: PotionTypes.WATER,
    ingredient: BrewingIngredient.REDSTONE,
    output: PotionTypes.MUNDANE
  },
  {
    input: PotionTypes.WATER,
    ingredient: BrewingIngredient.GLOWSTONE,
    output: PotionTypes.THICK
  },
  
  // Speed potions
  {
    input: PotionTypes.AWKWARD,
    ingredient: BrewingIngredient.SUGAR,
    output: PotionTypes.SPEED
  },
  {
    input: PotionTypes.SPEED,
    ingredient: BrewingIngredient.REDSTONE,
    output: PotionTypes.SPEED_EXTENDED
  },
  {
    input: PotionTypes.SPEED,
    ingredient: BrewingIngredient.GLOWSTONE,
    output: PotionTypes.SPEED_II
  },
  
  // Slowness potions
  {
    input: PotionTypes.SPEED,
    ingredient: BrewingIngredient.FERMENTED_SPIDER_EYE,
    output: PotionTypes.SLOWNESS
  },
  {
    input: PotionTypes.SLOWNESS,
    ingredient: BrewingIngredient.REDSTONE,
    output: PotionTypes.SLOWNESS_EXTENDED
  },
  
  // Strength potions
  {
    input: PotionTypes.AWKWARD,
    ingredient: BrewingIngredient.BLAZE_POWDER,
    output: PotionTypes.STRENGTH
  },
  {
    input: PotionTypes.STRENGTH,
    ingredient: BrewingIngredient.REDSTONE,
    output: PotionTypes.STRENGTH_EXTENDED
  },
  {
    input: PotionTypes.STRENGTH,
    ingredient: BrewingIngredient.GLOWSTONE,
    output: PotionTypes.STRENGTH_II
  },
  
  // Healing potions
  {
    input: PotionTypes.AWKWARD,
    ingredient: BrewingIngredient.GLISTERING_MELON,
    output: PotionTypes.HEALING
  },
  {
    input: PotionTypes.HEALING,
    ingredient: BrewingIngredient.GLOWSTONE,
    output: PotionTypes.HEALING_II
  },
  
  // Harming potions
  {
    input: PotionTypes.HEALING,
    ingredient: BrewingIngredient.FERMENTED_SPIDER_EYE,
    output: PotionTypes.HARMING
  },
  {
    input: PotionTypes.HEALING_II,
    ingredient: BrewingIngredient.FERMENTED_SPIDER_EYE,
    output: PotionTypes.HARMING_II
  },
  
  // Poison potions
  {
    input: PotionTypes.AWKWARD,
    ingredient: BrewingIngredient.SPIDER_EYE,
    output: PotionTypes.POISON
  },
  {
    input: PotionTypes.POISON,
    ingredient: BrewingIngredient.REDSTONE,
    output: PotionTypes.POISON_EXTENDED
  },
  {
    input: PotionTypes.POISON,
    ingredient: BrewingIngredient.GLOWSTONE,
    output: PotionTypes.POISON_II
  },
  
  // Regeneration potions
  {
    input: PotionTypes.AWKWARD,
    ingredient: BrewingIngredient.GHAST_TEAR,
    output: PotionTypes.REGENERATION
  },
  {
    input: PotionTypes.REGENERATION,
    ingredient: BrewingIngredient.REDSTONE,
    output: PotionTypes.REGENERATION_EXTENDED
  },
  {
    input: PotionTypes.REGENERATION,
    ingredient: BrewingIngredient.GLOWSTONE,
    output: PotionTypes.REGENERATION_II
  },
  
  // Fire Resistance potions
  {
    input: PotionTypes.AWKWARD,
    ingredient: BrewingIngredient.MAGMA_CREAM,
    output: PotionTypes.FIRE_RESISTANCE
  },
  {
    input: PotionTypes.FIRE_RESISTANCE,
    ingredient: BrewingIngredient.REDSTONE,
    output: PotionTypes.FIRE_RESISTANCE_EXTENDED
  },
  
  // Water Breathing potions
  {
    input: PotionTypes.AWKWARD,
    ingredient: BrewingIngredient.PUFFERFISH,
    output: PotionTypes.WATER_BREATHING
  },
  {
    input: PotionTypes.WATER_BREATHING,
    ingredient: BrewingIngredient.REDSTONE,
    output: PotionTypes.WATER_BREATHING_EXTENDED
  },
  
  // Night Vision potions
  {
    input: PotionTypes.AWKWARD,
    ingredient: BrewingIngredient.GOLDEN_CARROT,
    output: PotionTypes.NIGHT_VISION
  },
  {
    input: PotionTypes.NIGHT_VISION,
    ingredient: BrewingIngredient.REDSTONE,
    output: PotionTypes.NIGHT_VISION_EXTENDED
  },
  
  // Invisibility potions
  {
    input: PotionTypes.NIGHT_VISION,
    ingredient: BrewingIngredient.FERMENTED_SPIDER_EYE,
    output: PotionTypes.INVISIBILITY
  },
  {
    input: PotionTypes.NIGHT_VISION_EXTENDED,
    ingredient: BrewingIngredient.FERMENTED_SPIDER_EYE,
    output: PotionTypes.INVISIBILITY_EXTENDED
  },
  
  // Leaping potions
  {
    input: PotionTypes.AWKWARD,
    ingredient: BrewingIngredient.RABBIT_FOOT,
    output: PotionTypes.LEAPING
  },
  {
    input: PotionTypes.LEAPING,
    ingredient: BrewingIngredient.REDSTONE,
    output: PotionTypes.LEAPING_EXTENDED
  },
  {
    input: PotionTypes.LEAPING,
    ingredient: BrewingIngredient.GLOWSTONE,
    output: PotionTypes.LEAPING_II
  },
  
  // Slow Falling potions
  {
    input: PotionTypes.AWKWARD,
    ingredient: BrewingIngredient.PHANTOM_MEMBRANE,
    output: PotionTypes.SLOW_FALLING
  },
  {
    input: PotionTypes.SLOW_FALLING,
    ingredient: BrewingIngredient.REDSTONE,
    output: PotionTypes.SLOW_FALLING_EXTENDED
  }
];

// Function to find a brewing recipe
function findBrewingRecipe(inputPotion, ingredient) {
  return BrewingRecipes.find(recipe => 
    recipe.input.id === inputPotion.id && 
    recipe.ingredient.id === ingredient.id
  );
}

// Function to get all possible recipes for a potion
function getRecipesForPotion(potionId) {
  return BrewingRecipes.filter(recipe => recipe.output.id === potionId);
}

// Function to convert a normal potion to splash potion
function convertToSplashPotion(potion) {
  if (potion.category === PotionCategory.SPLASH) {
    return potion; // Already a splash potion
  }
  
  return {
    ...potion,
    id: `splash_${potion.id}`,
    displayName: `Splash ${potion.displayName}`,
    category: PotionCategory.SPLASH,
    // Apply splash potion duration multiplier
    duration: potion.duration * DurationMultiplier.SPLASH
  };
}

// Function to convert a splash potion to lingering potion
function convertToLingeringPotion(potion) {
  if (potion.category === PotionCategory.LINGERING) {
    return potion; // Already a lingering potion
  }
  
  if (potion.category !== PotionCategory.SPLASH) {
    potion = convertToSplashPotion(potion); // Convert to splash first
  }
  
  return {
    ...potion,
    id: potion.id.replace('splash_', 'lingering_'),
    displayName: `Lingering ${potion.displayName.replace('Splash ', '')}`,
    category: PotionCategory.LINGERING,
    // Apply lingering potion duration multiplier
    duration: (potion.duration / DurationMultiplier.SPLASH) * DurationMultiplier.LINGERING
  };
}

// Function to apply potion effects to an entity
function applyPotionToEntity(entity, potion) {
  if (!potion.effects || potion.effects.length === 0) {
    return entity; // No effects to apply
  }
  
  for (const effect of potion.effects) {
    const effectDuration = potion.duration || 0;
    entity = require('./potionEffects').applyEffect(entity, effect.id, effect.level, effectDuration);
  }
  
  return entity;
}

module.exports = {
  PotionCategory,
  BasePotionType,
  BrewingIngredient,
  DurationMultiplier,
  PotionTypes,
  BrewingRecipes,
  findBrewingRecipe,
  getRecipesForPotion,
  convertToSplashPotion,
  convertToLingeringPotion,
  applyPotionToEntity
}; 