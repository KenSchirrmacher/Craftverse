/**
 * Potion Registry - Defines and manages all potion types and their effects
 */

class PotionRegistry {
  constructor(effectsManager) {
    this.effectsManager = effectsManager;
    
    // Map of potion types with their definitions
    this.potions = new Map();
    
    // Register default potions
    this.registerDefaultPotions();
  }
  
  /**
   * Register default potion types
   */
  registerDefaultPotions() {
    // Base potions (no effects)
    this.registerPotion('AWKWARD', {
      name: 'Awkward Potion',
      color: '#7C7C7C',
      effects: [],
      brewing: {
        base: 'WATER',
        ingredient: 'NETHER_WART'
      }
    });
    
    this.registerPotion('MUNDANE', {
      name: 'Mundane Potion',
      color: '#7C7C7C',
      effects: [],
      brewing: {
        base: 'WATER',
        ingredient: 'REDSTONE'
      }
    });
    
    this.registerPotion('THICK', {
      name: 'Thick Potion',
      color: '#7C7C7C',
      effects: [],
      brewing: {
        base: 'WATER',
        ingredient: 'GLOWSTONE_DUST'
      }
    });
    
    // Effect potions
    this.registerPotion('HEALING', {
      name: 'Potion of Healing',
      color: '#F82423',
      effects: [
        { type: 'INSTANT_HEALTH', level: 1, duration: 1 }
      ],
      brewing: {
        base: 'AWKWARD',
        ingredient: 'GLISTERING_MELON'
      },
      variations: {
        STRONG: {
          name: 'Potion of Strong Healing',
          effects: [
            { type: 'INSTANT_HEALTH', level: 2, duration: 1 }
          ],
          ingredient: 'GLOWSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Healing',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Healing',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 45 // Duration in ticks for cloud effect
        }
      }
    });
    
    this.registerPotion('HARMING', {
      name: 'Potion of Harming',
      color: '#430A09',
      effects: [
        { type: 'INSTANT_DAMAGE', level: 1, duration: 1 }
      ],
      brewing: {
        base: 'HEALING',
        ingredient: 'FERMENTED_SPIDER_EYE'
      },
      variations: {
        STRONG: {
          name: 'Potion of Strong Harming',
          effects: [
            { type: 'INSTANT_DAMAGE', level: 2, duration: 1 }
          ],
          ingredient: 'GLOWSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Harming',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Harming',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 45
        }
      }
    });
    
    this.registerPotion('SWIFTNESS', {
      name: 'Potion of Swiftness',
      color: '#7CAFC6',
      effects: [
        { type: 'SPEED', level: 1, duration: 3600 }
      ],
      brewing: {
        base: 'AWKWARD',
        ingredient: 'SUGAR'
      },
      variations: {
        STRONG: {
          name: 'Potion of Strong Swiftness',
          effects: [
            { type: 'SPEED', level: 2, duration: 1800 }
          ],
          ingredient: 'GLOWSTONE_DUST'
        },
        LONG: {
          name: 'Potion of Extended Swiftness',
          effects: [
            { type: 'SPEED', level: 1, duration: 9600 }
          ],
          ingredient: 'REDSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Swiftness',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Swiftness',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 900
        }
      }
    });
    
    this.registerPotion('SLOWNESS', {
      name: 'Potion of Slowness',
      color: '#5A6C81',
      effects: [
        { type: 'SLOWNESS', level: 1, duration: 1800 }
      ],
      brewing: {
        base: 'SWIFTNESS',
        ingredient: 'FERMENTED_SPIDER_EYE'
      },
      variations: {
        STRONG: {
          name: 'Potion of Strong Slowness',
          effects: [
            { type: 'SLOWNESS', level: 2, duration: 400 }
          ],
          ingredient: 'GLOWSTONE_DUST'
        },
        LONG: {
          name: 'Potion of Extended Slowness',
          effects: [
            { type: 'SLOWNESS', level: 1, duration: 4800 }
          ],
          ingredient: 'REDSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Slowness',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Slowness',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 450
        }
      }
    });
    
    this.registerPotion('STRENGTH', {
      name: 'Potion of Strength',
      color: '#932423',
      effects: [
        { type: 'STRENGTH', level: 1, duration: 3600 }
      ],
      brewing: {
        base: 'AWKWARD',
        ingredient: 'BLAZE_POWDER'
      },
      variations: {
        STRONG: {
          name: 'Potion of Strong Strength',
          effects: [
            { type: 'STRENGTH', level: 2, duration: 1800 }
          ],
          ingredient: 'GLOWSTONE_DUST'
        },
        LONG: {
          name: 'Potion of Extended Strength',
          effects: [
            { type: 'STRENGTH', level: 1, duration: 9600 }
          ],
          ingredient: 'REDSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Strength',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Strength',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 900
        }
      }
    });
    
    this.registerPotion('WEAKNESS', {
      name: 'Potion of Weakness',
      color: '#484D48',
      effects: [
        { type: 'WEAKNESS', level: 1, duration: 1800 }
      ],
      brewing: {
        base: 'WATER',
        ingredient: 'FERMENTED_SPIDER_EYE'
      },
      variations: {
        LONG: {
          name: 'Potion of Extended Weakness',
          effects: [
            { type: 'WEAKNESS', level: 1, duration: 4800 }
          ],
          ingredient: 'REDSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Weakness',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Weakness',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 450
        }
      }
    });
    
    this.registerPotion('REGENERATION', {
      name: 'Potion of Regeneration',
      color: '#CD5CAB',
      effects: [
        { type: 'REGENERATION', level: 1, duration: 900 }
      ],
      brewing: {
        base: 'AWKWARD',
        ingredient: 'GHAST_TEAR'
      },
      variations: {
        STRONG: {
          name: 'Potion of Strong Regeneration',
          effects: [
            { type: 'REGENERATION', level: 2, duration: 450 }
          ],
          ingredient: 'GLOWSTONE_DUST'
        },
        LONG: {
          name: 'Potion of Extended Regeneration',
          effects: [
            { type: 'REGENERATION', level: 1, duration: 1800 }
          ],
          ingredient: 'REDSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Regeneration',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Regeneration',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 225
        }
      }
    });
    
    this.registerPotion('POISON', {
      name: 'Potion of Poison',
      color: '#4E9331',
      effects: [
        { type: 'POISON', level: 1, duration: 900 }
      ],
      brewing: {
        base: 'AWKWARD',
        ingredient: 'SPIDER_EYE'
      },
      variations: {
        STRONG: {
          name: 'Potion of Strong Poison',
          effects: [
            { type: 'POISON', level: 2, duration: 420 }
          ],
          ingredient: 'GLOWSTONE_DUST'
        },
        LONG: {
          name: 'Potion of Extended Poison',
          effects: [
            { type: 'POISON', level: 1, duration: 1800 }
          ],
          ingredient: 'REDSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Poison',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Poison',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 225
        }
      }
    });
    
    this.registerPotion('FIRE_RESISTANCE', {
      name: 'Potion of Fire Resistance',
      color: '#E49A0A',
      effects: [
        { type: 'FIRE_RESISTANCE', level: 1, duration: 3600 }
      ],
      brewing: {
        base: 'AWKWARD',
        ingredient: 'MAGMA_CREAM'
      },
      variations: {
        LONG: {
          name: 'Potion of Extended Fire Resistance',
          effects: [
            { type: 'FIRE_RESISTANCE', level: 1, duration: 9600 }
          ],
          ingredient: 'REDSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Fire Resistance',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Fire Resistance',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 900
        }
      }
    });
    
    this.registerPotion('WATER_BREATHING', {
      name: 'Potion of Water Breathing',
      color: '#2E5299',
      effects: [
        { type: 'WATER_BREATHING', level: 1, duration: 3600 }
      ],
      brewing: {
        base: 'AWKWARD',
        ingredient: 'PUFFERFISH'
      },
      variations: {
        LONG: {
          name: 'Potion of Extended Water Breathing',
          effects: [
            { type: 'WATER_BREATHING', level: 1, duration: 9600 }
          ],
          ingredient: 'REDSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Water Breathing',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Water Breathing',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 900
        }
      }
    });
    
    this.registerPotion('NIGHT_VISION', {
      name: 'Potion of Night Vision',
      color: '#1F1FA1',
      effects: [
        { type: 'NIGHT_VISION', level: 1, duration: 3600 }
      ],
      brewing: {
        base: 'AWKWARD',
        ingredient: 'GOLDEN_CARROT'
      },
      variations: {
        LONG: {
          name: 'Potion of Extended Night Vision',
          effects: [
            { type: 'NIGHT_VISION', level: 1, duration: 9600 }
          ],
          ingredient: 'REDSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Night Vision',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Night Vision',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 900
        }
      }
    });
    
    this.registerPotion('INVISIBILITY', {
      name: 'Potion of Invisibility',
      color: '#7F8392',
      effects: [
        { type: 'INVISIBILITY', level: 1, duration: 3600 }
      ],
      brewing: {
        base: 'NIGHT_VISION',
        ingredient: 'FERMENTED_SPIDER_EYE'
      },
      variations: {
        LONG: {
          name: 'Potion of Extended Invisibility',
          effects: [
            { type: 'INVISIBILITY', level: 1, duration: 9600 }
          ],
          ingredient: 'REDSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Invisibility',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Invisibility',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 900
        }
      }
    });
    
    this.registerPotion('LEAPING', {
      name: 'Potion of Leaping',
      color: '#22FF4C',
      effects: [
        { type: 'JUMP_BOOST', level: 1, duration: 3600 }
      ],
      brewing: {
        base: 'AWKWARD',
        ingredient: 'RABBIT_FOOT'
      },
      variations: {
        STRONG: {
          name: 'Potion of Strong Leaping',
          effects: [
            { type: 'JUMP_BOOST', level: 2, duration: 1800 }
          ],
          ingredient: 'GLOWSTONE_DUST'
        },
        LONG: {
          name: 'Potion of Extended Leaping',
          effects: [
            { type: 'JUMP_BOOST', level: 1, duration: 9600 }
          ],
          ingredient: 'REDSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Leaping',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Leaping',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 900
        }
      }
    });
    
    this.registerPotion('SLOW_FALLING', {
      name: 'Potion of Slow Falling',
      color: '#FEFEFE',
      effects: [
        { type: 'SLOW_FALLING', level: 1, duration: 1800 }
      ],
      brewing: {
        base: 'AWKWARD',
        ingredient: 'PHANTOM_MEMBRANE'
      },
      variations: {
        LONG: {
          name: 'Potion of Extended Slow Falling',
          effects: [
            { type: 'SLOW_FALLING', level: 1, duration: 4800 }
          ],
          ingredient: 'REDSTONE_DUST'
        },
        SPLASH: {
          name: 'Splash Potion of Slow Falling',
          ingredient: 'GUNPOWDER',
          splash: true
        },
        LINGERING: {
          name: 'Lingering Potion of Slow Falling',
          ingredient: 'DRAGON_BREATH',
          lingering: true,
          duration: 450
        }
      }
    });
    
    // Register all variations of base potions
    this.registerPotionVariations();
  }
  
  /**
   * Register potion variations based on base potion definitions
   */
  registerPotionVariations() {
    // Create compound keys for variations
    this.potions.forEach((potionData, type) => {
      if (!potionData.variations) return;
      
      Object.entries(potionData.variations).forEach(([variationType, variationData]) => {
        const variationKey = `${type}_${variationType}`;
        
        // Create a new potion definition based on the base and variation
        const baseEffects = JSON.parse(JSON.stringify(potionData.effects || []));
        
        // Apply variation effect changes if provided
        const variationEffects = variationData.effects 
          ? JSON.parse(JSON.stringify(variationData.effects))
          : baseEffects.map(effect => {
              // Apply duration modifier for LONG potions 
              if (variationType === 'LONG' && variationData.durationModifier) {
                return { 
                  ...effect, 
                  duration: Math.floor(effect.duration * variationData.durationModifier)
                };
              }
              // Apply level modifier for STRONG potions
              else if (variationType === 'STRONG' && variationData.levelModifier) {
                return {
                  ...effect,
                  level: Math.min(effect.level + variationData.levelModifier, 
                    this.effectsManager.getEffectDefinition(effect.type).maxLevel || 1)
                };
              }
              return effect;
            });
        
        // Register the variation
        this.registerPotion(variationKey, {
          name: variationData.name || `${potionData.name} (${variationType})`,
          color: variationData.color || potionData.color,
          effects: variationEffects,
          splash: variationData.splash || false,
          lingering: variationData.lingering || false,
          lingeringDuration: variationData.duration || 0,
          brewing: {
            base: type,
            ingredient: variationData.ingredient
          }
        });
      });
    });
  }
  
  /**
   * Register a new potion type
   * @param {string} type - The potion type identifier
   * @param {Object} potionData - The potion definition
   */
  registerPotion(type, potionData) {
    this.potions.set(type, potionData);
  }
  
  /**
   * Get a potion definition by type
   * @param {string} type - Potion type identifier
   * @returns {Object|null} Potion definition or null if not found
   */
  getPotion(type) {
    return this.potions.get(type) || null;
  }
  
  /**
   * Get all registered potion types
   * @returns {Array<string>} Array of potion type identifiers
   */
  getPotionTypes() {
    return Array.from(this.potions.keys());
  }
  
  /**
   * Get all brewable potion recipes
   * @returns {Array<Object>} Array of brewing recipes
   */
  getBrewingRecipes() {
    const recipes = [];
    
    this.potions.forEach((potionData, type) => {
      if (potionData.brewing) {
        recipes.push({
          result: type,
          base: potionData.brewing.base,
          ingredient: potionData.brewing.ingredient
        });
      }
    });
    
    return recipes;
  }
  
  /**
   * Get possible brewing results for a base potion and ingredient
   * @param {string} basePotion - Base potion type
   * @param {string} ingredient - Ingredient item type
   * @returns {string|null} Resulting potion type or null if recipe not found
   */
  getBrewingResult(basePotion, ingredient) {
    let result = null;
    
    this.potions.forEach((potionData, type) => {
      if (potionData.brewing && 
          potionData.brewing.base === basePotion && 
          potionData.brewing.ingredient === ingredient) {
        result = type;
      }
    });
    
    return result;
  }
  
  /**
   * Apply potion effects to an entity
   * @param {Object} entity - Entity to apply effects to
   * @param {string} potionType - Type of potion to apply
   * @param {string} source - Source of the effects (e.g. 'POTION', 'SPLASH', etc.)
   * @returns {boolean} Whether any effects were applied
   */
  applyPotionEffects(entity, potionType, source = 'POTION') {
    const potionData = this.getPotion(potionType);
    if (!potionData || !potionData.effects || !potionData.effects.length) {
      return false;
    }
    
    let appliedAny = false;
    
    // Apply each effect
    potionData.effects.forEach(effectData => {
      const applied = this.effectsManager.applyEffect(entity, {
        type: effectData.type,
        level: effectData.level,
        duration: effectData.duration,
        source: source
      });
      
      if (applied) {
        appliedAny = true;
      }
    });
    
    return appliedAny;
  }
  
  /**
   * Apply splash potion effects to entities in range
   * @param {Array<Object>} entities - Array of entities in range
   * @param {Object} position - Position of splash
   * @param {string} potionType - Type of splash potion
   * @returns {number} Number of entities affected
   */
  applySplashPotion(entities, position, potionType) {
    const potionData = this.getPotion(potionType);
    if (!potionData || !potionData.effects || !potionData.effects.length) {
      return 0;
    }
    
    let affectedCount = 0;
    
    // Apply to each entity with distance factor
    entities.forEach(entity => {
      const distance = this.calculateDistance(position, entity.position);
      const maxDistance = 4.0; // Maximum splash radius
      
      // Skip if out of range
      if (distance > maxDistance) return;
      
      // Calculate effect strength based on distance (closer = stronger)
      const distanceFactor = Math.max(0, 1.0 - (distance / maxDistance));
      
      // Apply each effect with adjusted duration
      let appliedAny = false;
      
      potionData.effects.forEach(effectData => {
        const adjustedDuration = Math.floor(effectData.duration * distanceFactor);
        if (adjustedDuration <= 0) return;
        
        const applied = this.effectsManager.applyEffect(entity, {
          type: effectData.type,
          level: effectData.level,
          duration: adjustedDuration,
          source: 'SPLASH_POTION'
        });
        
        if (applied) {
          appliedAny = true;
        }
      });
      
      if (appliedAny) {
        affectedCount++;
      }
    });
    
    return affectedCount;
  }
  
  /**
   * Create a lingering effect cloud at a position
   * @param {Object} position - Position to create cloud
   * @param {string} potionType - Type of lingering potion
   * @returns {Object} Lingering effect cloud entity data
   */
  createLingeringEffectCloud(position, potionType) {
    const potionData = this.getPotion(potionType);
    if (!potionData || !potionData.effects || !potionData.effects.length) {
      return null;
    }
    
    // Default duration of 30 seconds (600 ticks)
    const duration = potionData.lingeringDuration || 600;
    const radius = 3.0;
    
    // Create the cloud entity
    return {
      type: 'AREA_EFFECT_CLOUD',
      position: { ...position },
      potionType,
      duration,
      radius,
      effects: JSON.parse(JSON.stringify(potionData.effects)),
      color: potionData.color,
      ticksExisted: 0
    };
  }
  
  /**
   * Apply lingering cloud effects to entities in range
   * @param {Object} cloud - Lingering effect cloud entity
   * @param {Array<Object>} entities - Entities in range
   * @returns {number} Number of entities affected
   */
  applyLingeringCloudEffects(cloud, entities) {
    if (!cloud.effects || !cloud.effects.length) {
      return 0;
    }
    
    let affectedCount = 0;
    
    // Apply to each entity with distance factor
    entities.forEach(entity => {
      const distance = this.calculateDistance(cloud.position, entity.position);
      
      // Skip if out of range
      if (distance > cloud.radius) return;
      
      // Apply each effect with reduced duration (20% of original)
      let appliedAny = false;
      
      cloud.effects.forEach(effectData => {
        const adjustedDuration = Math.floor(effectData.duration * 0.2);
        if (adjustedDuration <= 0) return;
        
        const applied = this.effectsManager.applyEffect(entity, {
          type: effectData.type,
          level: effectData.level,
          duration: adjustedDuration,
          source: 'LINGERING_POTION'
        });
        
        if (applied) {
          appliedAny = true;
        }
      });
      
      if (appliedAny) {
        affectedCount++;
      }
    });
    
    return affectedCount;
  }
  
  /**
   * Calculate distance between two positions
   * @param {Object} pos1 - First position {x, y, z}
   * @param {Object} pos2 - Second position {x, y, z}
   * @returns {number} Distance between positions
   */
  calculateDistance(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

module.exports = PotionRegistry; 