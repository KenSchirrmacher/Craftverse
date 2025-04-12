/**
 * PotionRegistry - Manages potion types and their effects
 */

class PotionRegistry {
  constructor() {
    this.potions = new Map();
    
    // Register default potions
    this.registerDefaultPotions();
  }
  
  /**
   * Register a new potion type
   * @param {string} id - Unique potion identifier
   * @param {Object} definition - Potion definition
   * @returns {boolean} Whether registration was successful
   */
  registerPotion(id, definition) {
    if (!id || this.potions.has(id)) return false;
    
    this.potions.set(id, {
      ...definition,
      id
    });
    
    return true;
  }
  
  /**
   * Get a potion definition by ID
   * @param {string} id - Potion identifier
   * @returns {Object|null} Potion definition or null if not found
   */
  getPotion(id) {
    if (!id) return null;
    return this.potions.get(id) || null;
  }
  
  /**
   * Check if a potion ID exists
   * @param {string} id - Potion identifier
   * @returns {boolean} Whether the potion exists
   */
  hasPotion(id) {
    return this.potions.has(id);
  }
  
  /**
   * Remove a potion definition
   * @param {string} id - Potion identifier
   * @returns {boolean} Whether removal was successful
   */
  removePotion(id) {
    if (!id || !this.potions.has(id)) return false;
    
    this.potions.delete(id);
    return true;
  }
  
  /**
   * Get all registered potion definitions
   * @returns {Array} Array of potion definitions
   */
  getAllPotions() {
    return Array.from(this.potions.values());
  }
  
  /**
   * Register all default potion types
   */
  registerDefaultPotions() {
    // Regular potions
    this.registerPotion('WATER', {
      name: 'Water Bottle',
      color: '#385dc6',
      effects: [],
      duration: 0,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('MUNDANE', {
      name: 'Mundane Potion',
      color: '#385dc6',
      effects: [],
      duration: 0,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('THICK', {
      name: 'Thick Potion',
      color: '#385dc6',
      effects: [],
      duration: 0,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('AWKWARD', {
      name: 'Awkward Potion',
      color: '#385dc6',
      effects: [],
      duration: 0,
      splash: false,
      lingering: false
    });
    
    // Effect potions - normal variants
    this.registerPotion('NIGHT_VISION', {
      name: 'Potion of Night Vision',
      color: '#1f1fa1',
      effects: [
        { type: 'NIGHT_VISION', level: 1, duration: 3600 }
      ],
      duration: 3600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('NIGHT_VISION_LONG', {
      name: 'Potion of Night Vision',
      color: '#1f1fa1',
      effects: [
        { type: 'NIGHT_VISION', level: 1, duration: 9600 }
      ],
      duration: 9600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('INVISIBILITY', {
      name: 'Potion of Invisibility',
      color: '#7f8392',
      effects: [
        { type: 'INVISIBILITY', level: 1, duration: 3600 }
      ],
      duration: 3600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('INVISIBILITY_LONG', {
      name: 'Potion of Invisibility',
      color: '#7f8392',
      effects: [
        { type: 'INVISIBILITY', level: 1, duration: 9600 }
      ],
      duration: 9600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('LEAPING', {
      name: 'Potion of Leaping',
      color: '#22ff4c',
      effects: [
        { type: 'JUMP_BOOST', level: 1, duration: 3600 }
      ],
      duration: 3600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('LEAPING_LONG', {
      name: 'Potion of Leaping',
      color: '#22ff4c',
      effects: [
        { type: 'JUMP_BOOST', level: 1, duration: 9600 }
      ],
      duration: 9600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('LEAPING_STRONG', {
      name: 'Potion of Leaping',
      color: '#22ff4c',
      effects: [
        { type: 'JUMP_BOOST', level: 2, duration: 1800 }
      ],
      duration: 1800,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('FIRE_RESISTANCE', {
      name: 'Potion of Fire Resistance',
      color: '#e49a3a',
      effects: [
        { type: 'FIRE_RESISTANCE', level: 1, duration: 3600 }
      ],
      duration: 3600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('FIRE_RESISTANCE_LONG', {
      name: 'Potion of Fire Resistance',
      color: '#e49a3a',
      effects: [
        { type: 'FIRE_RESISTANCE', level: 1, duration: 9600 }
      ],
      duration: 9600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('SWIFTNESS', {
      name: 'Potion of Swiftness',
      color: '#7cafc6',
      effects: [
        { type: 'SPEED', level: 1, duration: 3600 }
      ],
      duration: 3600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('SWIFTNESS_LONG', {
      name: 'Potion of Swiftness',
      color: '#7cafc6',
      effects: [
        { type: 'SPEED', level: 1, duration: 9600 }
      ],
      duration: 9600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('SWIFTNESS_STRONG', {
      name: 'Potion of Swiftness',
      color: '#7cafc6',
      effects: [
        { type: 'SPEED', level: 2, duration: 1800 }
      ],
      duration: 1800,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('SLOWNESS', {
      name: 'Potion of Slowness',
      color: '#5a6c81',
      effects: [
        { type: 'SLOWNESS', level: 1, duration: 1800 }
      ],
      duration: 1800,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('SLOWNESS_LONG', {
      name: 'Potion of Slowness',
      color: '#5a6c81',
      effects: [
        { type: 'SLOWNESS', level: 1, duration: 4800 }
      ],
      duration: 4800,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('SLOWNESS_STRONG', {
      name: 'Potion of Slowness',
      color: '#5a6c81',
      effects: [
        { type: 'SLOWNESS', level: 4, duration: 400 }
      ],
      duration: 400,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('WATER_BREATHING', {
      name: 'Potion of Water Breathing',
      color: '#2e5299',
      effects: [
        { type: 'WATER_BREATHING', level: 1, duration: 3600 }
      ],
      duration: 3600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('WATER_BREATHING_LONG', {
      name: 'Potion of Water Breathing',
      color: '#2e5299',
      effects: [
        { type: 'WATER_BREATHING', level: 1, duration: 9600 }
      ],
      duration: 9600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('HEALING', {
      name: 'Potion of Healing',
      color: '#f82423',
      effects: [
        { type: 'INSTANT_HEALTH', level: 1, duration: 1 }
      ],
      duration: 1,
      splash: false,
      lingering: false,
      instantEffect: true
    });
    
    this.registerPotion('HEALING_STRONG', {
      name: 'Potion of Healing',
      color: '#f82423',
      effects: [
        { type: 'INSTANT_HEALTH', level: 2, duration: 1 }
      ],
      duration: 1,
      splash: false,
      lingering: false,
      instantEffect: true
    });
    
    this.registerPotion('HARMING', {
      name: 'Potion of Harming',
      color: '#430a09',
      effects: [
        { type: 'INSTANT_DAMAGE', level: 1, duration: 1 }
      ],
      duration: 1,
      splash: false,
      lingering: false,
      instantEffect: true
    });
    
    this.registerPotion('HARMING_STRONG', {
      name: 'Potion of Harming',
      color: '#430a09',
      effects: [
        { type: 'INSTANT_DAMAGE', level: 2, duration: 1 }
      ],
      duration: 1,
      splash: false,
      lingering: false,
      instantEffect: true
    });
    
    this.registerPotion('POISON', {
      name: 'Potion of Poison',
      color: '#4e9331',
      effects: [
        { type: 'POISON', level: 1, duration: 900 }
      ],
      duration: 900,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('POISON_LONG', {
      name: 'Potion of Poison',
      color: '#4e9331',
      effects: [
        { type: 'POISON', level: 1, duration: 1800 }
      ],
      duration: 1800,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('POISON_STRONG', {
      name: 'Potion of Poison',
      color: '#4e9331',
      effects: [
        { type: 'POISON', level: 2, duration: 440 }
      ],
      duration: 440,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('REGENERATION', {
      name: 'Potion of Regeneration',
      color: '#cd5cab',
      effects: [
        { type: 'REGENERATION', level: 1, duration: 900 }
      ],
      duration: 900,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('REGENERATION_LONG', {
      name: 'Potion of Regeneration',
      color: '#cd5cab',
      effects: [
        { type: 'REGENERATION', level: 1, duration: 1800 }
      ],
      duration: 1800,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('REGENERATION_STRONG', {
      name: 'Potion of Regeneration',
      color: '#cd5cab',
      effects: [
        { type: 'REGENERATION', level: 2, duration: 440 }
      ],
      duration: 440,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('STRENGTH', {
      name: 'Potion of Strength',
      color: '#932423',
      effects: [
        { type: 'STRENGTH', level: 1, duration: 3600 }
      ],
      duration: 3600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('STRENGTH_LONG', {
      name: 'Potion of Strength',
      color: '#932423',
      effects: [
        { type: 'STRENGTH', level: 1, duration: 9600 }
      ],
      duration: 9600,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('STRENGTH_STRONG', {
      name: 'Potion of Strength',
      color: '#932423',
      effects: [
        { type: 'STRENGTH', level: 2, duration: 1800 }
      ],
      duration: 1800,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('WEAKNESS', {
      name: 'Potion of Weakness',
      color: '#484d48',
      effects: [
        { type: 'WEAKNESS', level: 1, duration: 1800 }
      ],
      duration: 1800,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('WEAKNESS_LONG', {
      name: 'Potion of Weakness',
      color: '#484d48',
      effects: [
        { type: 'WEAKNESS', level: 1, duration: 4800 }
      ],
      duration: 4800,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('SLOW_FALLING', {
      name: 'Potion of Slow Falling',
      color: '#f7f8e0',
      effects: [
        { type: 'SLOW_FALLING', level: 1, duration: 1800 }
      ],
      duration: 1800,
      splash: false,
      lingering: false
    });
    
    this.registerPotion('SLOW_FALLING_LONG', {
      name: 'Potion of Slow Falling',
      color: '#f7f8e0',
      effects: [
        { type: 'SLOW_FALLING', level: 1, duration: 4800 }
      ],
      duration: 4800,
      splash: false,
      lingering: false
    });
    
    // Register splash variants
    this.registerSplashVariants();
    
    // Register lingering variants
    this.registerLingeringVariants();
  }
  
  /**
   * Register splash variants of all effect potions
   */
  registerSplashVariants() {
    // Get all potions
    const potions = this.getAllPotions();
    
    // Create splash variants for all potions with effects
    for (const potion of potions) {
      if (potion.effects.length > 0 && !potion.splash) {
        const splashId = `SPLASH_${potion.id}`;
        
        // Skip if already registered
        if (this.hasPotion(splashId)) continue;
        
        this.registerPotion(splashId, {
          name: `Splash ${potion.name}`,
          color: potion.color,
          effects: potion.effects,
          duration: potion.duration,
          splash: true,
          lingering: false,
          instantEffect: potion.instantEffect
        });
      }
    }
  }
  
  /**
   * Register lingering variants of all effect potions
   */
  registerLingeringVariants() {
    // Get all potions
    const potions = this.getAllPotions();
    
    // Create lingering variants for all potions with effects
    for (const potion of potions) {
      if (potion.effects.length > 0 && !potion.lingering) {
        const lingeringId = `LINGERING_${potion.id}`;
        
        // Skip if already registered
        if (this.hasPotion(lingeringId)) continue;
        
        // Lingering potions have 1/4 the duration but last in an area
        const lingeringEffects = potion.effects.map(effect => ({
          ...effect,
          duration: Math.floor(effect.duration / 4)
        }));
        
        this.registerPotion(lingeringId, {
          name: `Lingering ${potion.name}`,
          color: potion.color,
          effects: lingeringEffects,
          duration: Math.floor(potion.duration / 4),
          splash: false,
          lingering: true,
          instantEffect: potion.instantEffect
        });
      }
    }
  }
}

module.exports = PotionRegistry; 