/**
 * StatusEffectManager - Handles entity status effects like potion effects
 */

class StatusEffectManager {
  constructor() {
    this.entityEffects = new Map(); // Map of entity ID to effects
    
    // Define all possible status effects with their default behavior
    this.effectDefinitions = {
      // Positive effects
      "REGENERATION": {
        positive: true,
        tickRate: 50, // Every 2.5 seconds
        onTick: (entity, effect) => {
          // Heal entity based on effect level
          const healAmount = Math.max(1, effect.level);
          if (entity.heal) {
            entity.heal(healAmount);
          }
        }
      },
      "SPEED": {
        positive: true,
        onApply: (entity, effect) => {
          const speedBoost = 0.2 * effect.level;
          if (entity.attributes && entity.attributes.speed) {
            entity.attributes.speed.addModifier({
              id: `speed_effect_${effect.id}`,
              value: speedBoost,
              operation: "multiply_base"
            });
          }
        },
        onRemove: (entity, effect) => {
          if (entity.attributes && entity.attributes.speed) {
            entity.attributes.speed.removeModifier(`speed_effect_${effect.id}`);
          }
        }
      },
      "STRENGTH": {
        positive: true,
        onApply: (entity, effect) => {
          const damageBoost = 3 * effect.level;
          if (entity.attributes && entity.attributes.attackDamage) {
            entity.attributes.attackDamage.addModifier({
              id: `strength_effect_${effect.id}`,
              value: damageBoost,
              operation: "add"
            });
          }
        },
        onRemove: (entity, effect) => {
          if (entity.attributes && entity.attributes.attackDamage) {
            entity.attributes.attackDamage.removeModifier(`strength_effect_${effect.id}`);
          }
        }
      },
      "JUMP_BOOST": {
        positive: true,
        onApply: (entity, effect) => {
          const jumpBoost = 0.1 * effect.level;
          if (entity.attributes && entity.attributes.jumpStrength) {
            entity.attributes.jumpStrength.addModifier({
              id: `jump_effect_${effect.id}`,
              value: jumpBoost,
              operation: "add"
            });
          }
        },
        onRemove: (entity, effect) => {
          if (entity.attributes && entity.attributes.jumpStrength) {
            entity.attributes.jumpStrength.removeModifier(`jump_effect_${effect.id}`);
          }
        }
      },
      "RESISTANCE": {
        positive: true,
        onApply: (entity, effect) => {
          const resistanceAmount = 0.2 * effect.level;
          if (entity.attributes && entity.attributes.armor) {
            entity.attributes.armor.addModifier({
              id: `resistance_effect_${effect.id}`,
              value: resistanceAmount,
              operation: "add"
            });
          }
        },
        onRemove: (entity, effect) => {
          if (entity.attributes && entity.attributes.armor) {
            entity.attributes.armor.removeModifier(`resistance_effect_${effect.id}`);
          }
        }
      },
      "FIRE_RESISTANCE": {
        positive: true,
        onApply: (entity) => {
          entity.fireImmune = true;
        },
        onRemove: (entity) => {
          entity.fireImmune = false;
        }
      },
      "WATER_BREATHING": {
        positive: true,
        onApply: (entity) => {
          entity.canBreatheUnderwater = true;
        },
        onRemove: (entity) => {
          entity.canBreatheUnderwater = false;
        }
      },
      "INVISIBILITY": {
        positive: true,
        onApply: (entity) => {
          entity.invisible = true;
          
          // Send update to clients
          if (entity.world && entity.world.updateEntityVisibility) {
            entity.world.updateEntityVisibility(entity.id, true);
          }
        },
        onRemove: (entity) => {
          entity.invisible = false;
          
          // Send update to clients
          if (entity.world && entity.world.updateEntityVisibility) {
            entity.world.updateEntityVisibility(entity.id, false);
          }
        }
      },
      "NIGHT_VISION": {
        positive: true,
        // No direct effect on server side
      },
      
      // Negative effects
      "POISON": {
        positive: false,
        tickRate: 25, // Every 1.25 seconds
        onTick: (entity, effect) => {
          // Don't kill entity, leave at half a heart
          if (entity.health > 1) {
            const damage = Math.max(1, effect.level);
            if (entity.damage) {
              entity.damage({
                amount: damage,
                source: "POISON",
                bypassArmor: true
              });
            }
          }
        }
      },
      "WEAKNESS": {
        positive: false,
        onApply: (entity, effect) => {
          const damageReduction = -4 * effect.level;
          if (entity.attributes && entity.attributes.attackDamage) {
            entity.attributes.attackDamage.addModifier({
              id: `weakness_effect_${effect.id}`,
              value: damageReduction,
              operation: "add"
            });
          }
        },
        onRemove: (entity, effect) => {
          if (entity.attributes && entity.attributes.attackDamage) {
            entity.attributes.attackDamage.removeModifier(`weakness_effect_${effect.id}`);
          }
        }
      },
      "SLOWNESS": {
        positive: false,
        onApply: (entity, effect) => {
          const slowFactor = -0.15 * effect.level;
          if (entity.attributes && entity.attributes.speed) {
            entity.attributes.speed.addModifier({
              id: `slowness_effect_${effect.id}`,
              value: slowFactor,
              operation: "multiply_base"
            });
          }
        },
        onRemove: (entity, effect) => {
          if (entity.attributes && entity.attributes.speed) {
            entity.attributes.speed.removeModifier(`slowness_effect_${effect.id}`);
          }
        }
      },
      "MINING_FATIGUE": {
        positive: false,
        onApply: (entity, effect) => {
          const fatigueMultiplier = 0.3 * effect.level;
          if (entity.attributes && entity.attributes.miningSpeed) {
            entity.attributes.miningSpeed.addModifier({
              id: `fatigue_effect_${effect.id}`,
              value: fatigueMultiplier,
              operation: "multiply"
            });
          }
        },
        onRemove: (entity, effect) => {
          if (entity.attributes && entity.attributes.miningSpeed) {
            entity.attributes.miningSpeed.removeModifier(`fatigue_effect_${effect.id}`);
          }
        }
      },
      "BLINDNESS": {
        positive: false,
        // Mostly client-side effect
      },
      "WITHER": {
        positive: false,
        tickRate: 40, // Every 2 seconds
        onTick: (entity, effect) => {
          const damage = Math.max(1, effect.level);
          if (entity.damage) {
            entity.damage({
              amount: damage,
              source: "WITHER",
              bypassArmor: true,
              bypassEffects: true
            });
          }
        }
      }
    };
  }
  
  /**
   * Add a status effect to an entity
   * @param {string} entityId - Entity ID
   * @param {Object} effect - Effect object
   * @returns {string} Effect ID
   */
  addEffect(entityId, effect) {
    if (!effect.type || !this.effectDefinitions[effect.type]) {
      return null;
    }
    
    // Generate a unique effect ID
    const effectId = `${effect.type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Set up the effect
    const now = Date.now();
    const newEffect = {
      id: effectId,
      type: effect.type,
      level: effect.level || 1,
      duration: effect.duration || 30000, // 30 seconds default
      startTime: now,
      endTime: now + (effect.duration || 30000),
      lastTickTime: now,
      source: effect.source || "unknown"
    };
    
    // Get entity's current effects
    if (!this.entityEffects.has(entityId)) {
      this.entityEffects.set(entityId, new Map());
    }
    
    const entityEffectsMap = this.entityEffects.get(entityId);
    
    // Check for existing effect of the same type
    let replaced = false;
    entityEffectsMap.forEach((existingEffect, existingId) => {
      if (existingEffect.type === effect.type) {
        // If new effect is stronger or has longer duration, replace the old one
        if (newEffect.level > existingEffect.level || 
            (newEffect.level === existingEffect.level && newEffect.endTime > existingEffect.endTime)) {
          // Remove old effect
          this.removeEffect(entityId, existingId);
          replaced = true;
        } else {
          // New effect is weaker or shorter, don't add it
          return existingId;
        }
      }
    });
    
    // Add the new effect
    entityEffectsMap.set(effectId, newEffect);
    
    // Apply the effect
    const definition = this.effectDefinitions[effect.type];
    if (definition.onApply) {
      // Call onApply with an entity object
      try {
        definition.onApply(this.getEntityById(entityId), newEffect);
      } catch (error) {
        console.error(`Error applying effect ${effect.type} to entity ${entityId}:`, error);
      }
    }
    
    return effectId;
  }
  
  /**
   * Remove a status effect from an entity
   * @param {string} entityId - Entity ID
   * @param {string} effectId - Effect ID
   * @returns {boolean} Whether removal was successful
   */
  removeEffect(entityId, effectId) {
    if (!this.entityEffects.has(entityId)) {
      return false;
    }
    
    const entityEffectsMap = this.entityEffects.get(entityId);
    const effect = entityEffectsMap.get(effectId);
    
    if (!effect) {
      return false;
    }
    
    // Call onRemove function if it exists
    const definition = this.effectDefinitions[effect.type];
    if (definition.onRemove) {
      try {
        definition.onRemove(this.getEntityById(entityId), effect);
      } catch (error) {
        console.error(`Error removing effect ${effect.type} from entity ${entityId}:`, error);
      }
    }
    
    // Remove the effect
    entityEffectsMap.delete(effectId);
    
    // If entity has no more effects, remove from tracking
    if (entityEffectsMap.size === 0) {
      this.entityEffects.delete(entityId);
    }
    
    return true;
  }
  
  /**
   * Get all active effects for an entity
   * @param {string} entityId - Entity ID
   * @returns {Array} Array of effect objects
   */
  getEntityEffects(entityId) {
    if (!this.entityEffects.has(entityId)) {
      return [];
    }
    
    const entityEffectsMap = this.entityEffects.get(entityId);
    return Array.from(entityEffectsMap.values());
  }
  
  /**
   * Get a specific effect for an entity
   * @param {string} entityId - Entity ID
   * @param {string} effectId - Effect ID
   * @returns {Object|null} Effect object or null if not found
   */
  getEffect(entityId, effectId) {
    if (!this.entityEffects.has(entityId)) {
      return null;
    }
    
    const entityEffectsMap = this.entityEffects.get(entityId);
    return entityEffectsMap.get(effectId) || null;
  }
  
  /**
   * Check if an entity has a specific effect type
   * @param {string} entityId - Entity ID
   * @param {string} effectType - Effect type
   * @returns {boolean} Whether entity has the effect
   */
  hasEffectType(entityId, effectType) {
    if (!this.entityEffects.has(entityId)) {
      return false;
    }
    
    const entityEffectsMap = this.entityEffects.get(entityId);
    for (const effect of entityEffectsMap.values()) {
      if (effect.type === effectType) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get the level of a specific effect type
   * @param {string} entityId - Entity ID
   * @param {string} effectType - Effect type
   * @returns {number} Effect level or 0 if not found
   */
  getEffectLevel(entityId, effectType) {
    if (!this.entityEffects.has(entityId)) {
      return 0;
    }
    
    const entityEffectsMap = this.entityEffects.get(entityId);
    let maxLevel = 0;
    
    for (const effect of entityEffectsMap.values()) {
      if (effect.type === effectType && effect.level > maxLevel) {
        maxLevel = effect.level;
      }
    }
    
    return maxLevel;
  }
  
  /**
   * Update effects (called on server tick)
   * @param {number} deltaTime - Time since last update in milliseconds
   * @returns {Object} Update results with expired and ticked effects
   */
  update(deltaTime = 50) {
    const now = Date.now();
    const results = {
      expired: [],
      ticked: []
    };
    
    // Process all entities
    for (const [entityId, entityEffectsMap] of this.entityEffects.entries()) {
      // Process all effects for this entity
      for (const [effectId, effect] of entityEffectsMap.entries()) {
        // Check if effect has expired
        if (now >= effect.endTime) {
          this.removeEffect(entityId, effectId);
          results.expired.push({ entityId, effectId, type: effect.type });
          continue;
        }
        
        // Check if effect should tick
        const definition = this.effectDefinitions[effect.type];
        if (definition.onTick && definition.tickRate) {
          if (now - effect.lastTickTime >= definition.tickRate) {
            // Perform tick effect
            try {
              definition.onTick(this.getEntityById(entityId), effect);
              effect.lastTickTime = now;
              results.ticked.push({ entityId, effectId, type: effect.type });
            } catch (error) {
              console.error(`Error ticking effect ${effect.type} for entity ${entityId}:`, error);
            }
          }
        }
      }
    }
    
    return results;
  }
  
  /**
   * Clear all effects from an entity
   * @param {string} entityId - Entity ID
   * @returns {number} Number of effects removed
   */
  clearEffects(entityId) {
    if (!this.entityEffects.has(entityId)) {
      return 0;
    }
    
    const entityEffectsMap = this.entityEffects.get(entityId);
    let count = 0;
    
    // Remove each effect properly
    for (const effectId of entityEffectsMap.keys()) {
      if (this.removeEffect(entityId, effectId)) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Get entity object by ID (should be implemented by game engine)
   * @param {string} entityId - Entity ID
   * @returns {Object} Entity object
   */
  getEntityById(entityId) {
    // This is a placeholder - actual implementation would depend on the game engine
    // In a real implementation, this would return the entity from the world or entity manager
    
    // For now, we'll return a dummy object that won't break our code
    return {
      id: entityId,
      attributes: {},
      heal: (amount) => console.log(`Entity ${entityId} healed for ${amount}`),
      damage: (data) => console.log(`Entity ${entityId} damaged for ${data.amount} from ${data.source}`)
    };
  }
  
  /**
   * Register a custom effect definition
   * @param {string} effectType - Effect type name
   * @param {Object} definition - Effect definition object
   * @returns {boolean} Whether registration was successful
   */
  registerEffectDefinition(effectType, definition) {
    if (this.effectDefinitions[effectType]) {
      return false; // Already exists
    }
    
    this.effectDefinitions[effectType] = {
      positive: definition.positive || false,
      tickRate: definition.tickRate,
      onApply: definition.onApply,
      onTick: definition.onTick,
      onRemove: definition.onRemove
    };
    
    return true;
  }
}

module.exports = StatusEffectManager; 