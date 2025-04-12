/**
 * StatusEffectsManager - Handles all status effects for entities in the game
 * Manages application, duration, and impact of potion and other status effects
 */

const EventEmitter = require('events');

class StatusEffectsManager extends EventEmitter {
  constructor(server) {
    super();
    this.server = server;
    
    // Map of entity IDs to their active effects
    // Structure: Map<entityId, Map<effectType, effectData>>
    this.entityEffects = new Map();
    
    // Effect type definitions with their behavior
    this.effectDefinitions = {
      SPEED: {
        apply: (entity, level) => {
          if (entity.movementSpeed) {
            entity.movementSpeed *= (1 + level * 0.2); // 20% speed boost per level
          }
        },
        remove: (entity) => {
          if (entity.movementSpeed) {
            entity.resetMovementSpeed();
          }
        },
        tickRate: 0, // Passive effect, no tick handling needed
        beneficial: true,
        color: '#7CAFC6'
      },
      SLOWNESS: {
        apply: (entity, level) => {
          if (entity.movementSpeed) {
            entity.movementSpeed *= (1 - level * 0.15); // 15% speed reduction per level
          }
        },
        remove: (entity) => {
          if (entity.movementSpeed) {
            entity.resetMovementSpeed();
          }
        },
        tickRate: 0, // Passive effect, no tick handling needed
        beneficial: false,
        color: '#5A6C81'
      },
      HASTE: {
        apply: (entity, level) => {
          if (entity.miningSpeed) {
            entity.miningSpeed *= (1 + level * 0.2); // 20% mining speed boost per level
          }
        },
        remove: (entity) => {
          if (entity.miningSpeed) {
            entity.resetMiningSpeed();
          }
        },
        tickRate: 0, // Passive effect, no tick handling needed
        beneficial: true,
        color: '#D9C043'
      },
      MINING_FATIGUE: {
        apply: (entity, level) => {
          if (entity.miningSpeed) {
            entity.miningSpeed *= (1 - level * 0.3); // 30% mining speed reduction per level
          }
        },
        remove: (entity) => {
          if (entity.miningSpeed) {
            entity.resetMiningSpeed();
          }
        },
        tickRate: 0, // Passive effect, no tick handling needed
        beneficial: false,
        color: '#4A4217'
      },
      STRENGTH: {
        apply: (entity, level) => {
          if (entity.attackDamage) {
            entity.attackDamage += level * 3; // +3 damage per level
          }
        },
        remove: (entity) => {
          if (entity.attackDamage) {
            entity.resetAttackDamage();
          }
        },
        tickRate: 0, // Passive effect, no tick handling needed
        beneficial: true,
        color: '#932423'
      },
      WEAKNESS: {
        apply: (entity, level) => {
          if (entity.attackDamage) {
            entity.attackDamage = Math.max(1, entity.attackDamage - level * 4); // -4 damage per level, min 1
          }
        },
        remove: (entity) => {
          if (entity.attackDamage) {
            entity.resetAttackDamage();
          }
        },
        tickRate: 0, // Passive effect, no tick handling needed
        beneficial: false,
        color: '#484D48'
      },
      JUMP_BOOST: {
        apply: (entity, level) => {
          if (entity.jumpHeight) {
            entity.jumpHeight *= (1 + level * 0.5); // 50% jump height increase per level
          }
        },
        remove: (entity) => {
          if (entity.jumpHeight) {
            entity.resetJumpHeight();
          }
        },
        tickRate: 0, // Passive effect, no tick handling needed
        beneficial: true,
        color: '#22FF4C'
      },
      NAUSEA: {
        apply: (entity, level) => {
          // Visual effect handled by client
        },
        remove: (entity) => {
          // Visual effect handled by client
        },
        tickRate: 0, // Visual effect, no tick handling needed
        beneficial: false,
        color: '#551D4A'
      },
      REGENERATION: {
        apply: (entity, level) => {
          // Applied during tick handling
        },
        remove: (entity) => {
          // No cleanup needed
        },
        tickRate: 50 / (level + 1), // Regenerate health every 2.5s, 1.7s, 1.25s based on level
        onTick: (entity, level) => {
          if (entity.health < entity.maxHealth) {
            entity.health = Math.min(entity.maxHealth, entity.health + 1);
          }
        },
        beneficial: true,
        color: '#CD5CAB'
      },
      RESISTANCE: {
        apply: (entity, level) => {
          if (!entity.damageReduction) entity.damageReduction = 0;
          entity.damageReduction += level * 0.2; // 20% damage reduction per level
        },
        remove: (entity) => {
          if (entity.damageReduction) {
            entity.damageReduction = 0;
          }
        },
        tickRate: 0, // Passive effect, no tick handling needed
        beneficial: true,
        color: '#99453A'
      },
      FIRE_RESISTANCE: {
        apply: (entity, level) => {
          entity.isFireResistant = true;
        },
        remove: (entity) => {
          entity.isFireResistant = false;
        },
        tickRate: 0, // Passive effect, no tick handling needed
        beneficial: true,
        color: '#E49A0A'
      },
      WATER_BREATHING: {
        apply: (entity, level) => {
          entity.canBreatheUnderwater = true;
        },
        remove: (entity) => {
          entity.canBreatheUnderwater = false;
        },
        tickRate: 0, // Passive effect, no tick handling needed
        beneficial: true,
        color: '#2E5299'
      },
      INVISIBILITY: {
        apply: (entity, level) => {
          entity.isInvisible = true;
        },
        remove: (entity) => {
          entity.isInvisible = false;
        },
        tickRate: 0, // Passive effect, no tick handling needed
        beneficial: true,
        color: '#7F8392'
      },
      BLINDNESS: {
        apply: (entity, level) => {
          // Visual effect handled by client
        },
        remove: (entity) => {
          // Visual effect handled by client
        },
        tickRate: 0, // Visual effect, no tick handling needed
        beneficial: false,
        color: '#1F1F23'
      },
      NIGHT_VISION: {
        apply: (entity, level) => {
          // Visual effect handled by client
        },
        remove: (entity) => {
          // Visual effect handled by client
        },
        tickRate: 0, // Visual effect, no tick handling needed
        beneficial: true,
        color: '#1F1FA1'
      },
      HUNGER: {
        apply: (entity, level) => {
          // Applied during tick handling
        },
        remove: (entity) => {
          // No cleanup needed
        },
        tickRate: 40 / level, // Reduce hunger faster with higher levels
        onTick: (entity, level) => {
          if (entity.hunger) {
            entity.hunger = Math.max(0, entity.hunger - 1);
          }
        },
        beneficial: false,
        color: '#587653'
      },
      POISON: {
        apply: (entity, level) => {
          // Applied during tick handling
        },
        remove: (entity) => {
          // No cleanup needed
        },
        tickRate: 25 / level, // Damage more frequently at higher levels
        onTick: (entity, level) => {
          if (entity.health && entity.health > 1) { // Poison can't kill
            entity.health = Math.max(1, entity.health - 1);
          }
        },
        beneficial: false,
        color: '#4E9331'
      },
      WITHER: {
        apply: (entity, level) => {
          // Applied during tick handling
        },
        remove: (entity) => {
          // No cleanup needed
        },
        tickRate: 40 / level, // Damage more frequently at higher levels
        onTick: (entity, level) => {
          if (entity.health) {
            entity.health = Math.max(0, entity.health - 1); // Wither can kill
          }
        },
        beneficial: false,
        color: '#352A27'
      },
      HEALTH_BOOST: {
        apply: (entity, level) => {
          if (entity.maxHealth) {
            entity.maxHealthBonus = level * 4; // +4 max health per level
            entity.maxHealth += entity.maxHealthBonus;
          }
        },
        remove: (entity) => {
          if (entity.maxHealth && entity.maxHealthBonus) {
            entity.maxHealth -= entity.maxHealthBonus;
            entity.maxHealthBonus = 0;
            entity.health = Math.min(entity.health, entity.maxHealth);
          }
        },
        tickRate: 0, // Passive effect, no tick handling needed
        beneficial: true,
        color: '#F87D23'
      },
      ABSORPTION: {
        apply: (entity, level) => {
          entity.absorptionHealth = level * 4; // +4 absorption hearts per level
        },
        remove: (entity) => {
          entity.absorptionHealth = 0;
        },
        tickRate: 0, // Passive effect, no tick handling needed
        beneficial: true,
        color: '#2552A5'
      },
      SATURATION: {
        apply: (entity, level) => {
          // Applied during tick handling
        },
        remove: (entity) => {
          // No cleanup needed
        },
        tickRate: 10, // Rapidly apply saturation
        onTick: (entity, level) => {
          if (entity.hunger < entity.maxHunger) {
            entity.hunger = Math.min(entity.maxHunger, entity.hunger + level);
          }
        },
        beneficial: true,
        color: '#F82423'
      },
      LEVITATION: {
        apply: (entity, level) => {
          entity.isLevitating = true;
          entity.levitationSpeed = 0.05 * level;
        },
        remove: (entity) => {
          entity.isLevitating = false;
          entity.levitationSpeed = 0;
        },
        tickRate: 0, // Handled by physics system
        beneficial: false,
        color: '#CEFFFF'
      },
      SLOW_FALLING: {
        apply: (entity, level) => {
          entity.hasSlowFalling = true;
        },
        remove: (entity) => {
          entity.hasSlowFalling = false;
        },
        tickRate: 0, // Handled by physics system
        beneficial: true,
        color: '#F7F8E0'
      }
    };
    
    // Initialize tick counter for effect processing
    this.tickCounter = 0;
  }
  
  /**
   * Get info about a status effect type
   * @param {string} effectType - Type of effect
   * @returns {Object|null} Effect definition or null if not found
   */
  getEffectInfo(effectType) {
    return this.effectDefinitions[effectType] || null;
  }
  
  /**
   * Process status effects on game tick
   * @param {number} dt - Delta time in milliseconds
   */
  update(dt) {
    this.tickCounter++;
    
    // Process all entities with effects
    for (const [entityId, effects] of this.entityEffects.entries()) {
      const entity = this.getEntity(entityId);
      if (!entity) {
        // Entity no longer exists, remove all effects
        this.clearEffects(entityId);
        continue;
      }
      
      // Track if effects have changed
      let effectsChanged = false;
      
      // Process each effect
      for (const [effectType, effectData] of effects.entries()) {
        // Update remaining time
        effectData.timeLeft -= dt;
        
        // Process tick-based effects
        const effectDef = this.effectDefinitions[effectType];
        if (effectDef && effectDef.tickRate > 0 && effectDef.onTick) {
          if (this.tickCounter % effectDef.tickRate === 0) {
            effectDef.onTick(entity, effectData.level);
          }
        }
        
        // Check if effect has expired
        if (effectData.timeLeft <= 0) {
          // Remove effect
          this.removeEffect(entityId, effectType);
          effectsChanged = true;
        }
      }
      
      // Notify clients if effects changed
      if (effectsChanged) {
        this.notifyEffectsUpdate(entityId);
      }
    }
  }
  
  /**
   * Get entity by ID
   * @param {string} entityId - Entity ID
   * @returns {Object|null} Entity object or null if not found
   */
  getEntity(entityId) {
    // Players
    if (this.server.players && this.server.players[entityId]) {
      return this.server.players[entityId];
    }
    
    // Mobs and other entities
    if (this.server.mobManager && this.server.mobManager.mobs[entityId]) {
      return this.server.mobManager.mobs[entityId];
    }
    
    return null;
  }
  
  /**
   * Add a status effect to an entity
   * @param {string} entityId - Entity ID
   * @param {string} effectType - Type of effect to add
   * @param {Object} options - Effect options
   * @returns {boolean} Whether effect was added successfully
   */
  addEffect(entityId, effectType, options = {}) {
    if (!entityId || !effectType || !this.effectDefinitions[effectType]) {
      return false;
    }
    
    const entity = this.getEntity(entityId);
    if (!entity) {
      return false;
    }
    
    // Get or create effects map for this entity
    if (!this.entityEffects.has(entityId)) {
      this.entityEffects.set(entityId, new Map());
    }
    
    const effects = this.entityEffects.get(entityId);
    const effectDef = this.effectDefinitions[effectType];
    
    // Default options
    const effectOptions = {
      level: options.level || 1,
      duration: options.duration || 600, // Default 30 seconds at 20 ticks/sec
      ambient: options.ambient || false,
      showParticles: options.showParticles !== false, // Default true
      showIcon: options.showIcon !== false, // Default true
      source: options.source || 'unknown'
    };
    
    // Check if effect already exists
    if (effects.has(effectType)) {
      const existingEffect = effects.get(effectType);
      
      // If new effect is higher level or longer duration, replace it
      if (effectOptions.level > existingEffect.level || 
          (effectOptions.level === existingEffect.level && 
           effectOptions.duration > existingEffect.timeLeft)) {
        // Remove existing effect
        if (effectDef.remove) {
          effectDef.remove(entity);
        }
        
        // Add new effect
        effects.set(effectType, {
          level: effectOptions.level,
          duration: effectOptions.duration,
          timeLeft: effectOptions.duration,
          ambient: effectOptions.ambient,
          showParticles: effectOptions.showParticles,
          showIcon: effectOptions.showIcon,
          source: effectOptions.source
        });
        
        // Apply effect
        if (effectDef.apply) {
          effectDef.apply(entity, effectOptions.level);
        }
      }
    } else {
      // Add new effect
      effects.set(effectType, {
        level: effectOptions.level,
        duration: effectOptions.duration,
        timeLeft: effectOptions.duration,
        ambient: effectOptions.ambient,
        showParticles: effectOptions.showParticles,
        showIcon: effectOptions.showIcon,
        source: effectOptions.source
      });
      
      // Apply effect
      if (effectDef.apply) {
        effectDef.apply(entity, effectOptions.level);
      }
    }
    
    // Notify clients
    this.notifyEffectsUpdate(entityId);
    
    return true;
  }
  
  /**
   * Remove a status effect from an entity
   * @param {string} entityId - Entity ID
   * @param {string} effectType - Type of effect to remove
   * @returns {boolean} Whether effect was removed
   */
  removeEffect(entityId, effectType) {
    if (!entityId || !effectType) {
      return false;
    }
    
    const entity = this.getEntity(entityId);
    if (!entity) {
      return false;
    }
    
    // Check if entity has any effects
    if (!this.entityEffects.has(entityId)) {
      return false;
    }
    
    const effects = this.entityEffects.get(entityId);
    
    // Check if entity has this effect
    if (!effects.has(effectType)) {
      return false;
    }
    
    // Remove effect
    const effectDef = this.effectDefinitions[effectType];
    if (effectDef && effectDef.remove) {
      effectDef.remove(entity);
    }
    
    effects.delete(effectType);
    
    // Remove entity from effects map if no effects left
    if (effects.size === 0) {
      this.entityEffects.delete(entityId);
    }
    
    // Notify clients
    this.notifyEffectsUpdate(entityId);
    
    return true;
  }
  
  /**
   * Clear all status effects from an entity
   * @param {string} entityId - Entity ID
   * @returns {boolean} Whether effects were cleared
   */
  clearEffects(entityId) {
    if (!entityId) {
      return false;
    }
    
    const entity = this.getEntity(entityId);
    if (!entity) {
      this.entityEffects.delete(entityId);
      return true;
    }
    
    // Check if entity has any effects
    if (!this.entityEffects.has(entityId)) {
      return false;
    }
    
    const effects = this.entityEffects.get(entityId);
    
    // Remove each effect
    for (const [effectType, effectData] of effects.entries()) {
      const effectDef = this.effectDefinitions[effectType];
      if (effectDef && effectDef.remove) {
        effectDef.remove(entity);
      }
    }
    
    // Clear all effects
    this.entityEffects.delete(entityId);
    
    // Notify clients
    this.notifyEffectsUpdate(entityId);
    
    return true;
  }
  
  /**
   * Get all status effects for an entity
   * @param {string} entityId - Entity ID
   * @returns {Array} Array of active effects
   */
  getEffects(entityId) {
    if (!entityId || !this.entityEffects.has(entityId)) {
      return [];
    }
    
    const effects = this.entityEffects.get(entityId);
    const result = [];
    
    for (const [effectType, effectData] of effects.entries()) {
      const effectDef = this.effectDefinitions[effectType];
      result.push({
        id: this.generateEffectId(entityId, effectType),
        type: effectType,
        level: effectData.level,
        duration: effectData.duration,
        remainingTime: effectData.timeLeft,
        ambient: effectData.ambient,
        showParticles: effectData.showParticles,
        showIcon: effectData.showIcon,
        source: effectData.source,
        color: effectDef ? effectDef.color : '#FFFFFF',
        beneficial: effectDef ? effectDef.beneficial : true
      });
    }
    
    return result;
  }
  
  /**
   * Check if an entity has a specific effect
   * @param {string} entityId - Entity ID
   * @param {string} effectType - Type of effect
   * @returns {boolean} Whether entity has the effect
   */
  hasEffect(entityId, effectType) {
    if (!entityId || !effectType || !this.entityEffects.has(entityId)) {
      return false;
    }
    
    return this.entityEffects.get(entityId).has(effectType);
  }
  
  /**
   * Get the level of a specific effect on an entity
   * @param {string} entityId - Entity ID
   * @param {string} effectType - Type of effect
   * @returns {number} Effect level, or 0 if not active
   */
  getEffectLevel(entityId, effectType) {
    if (!entityId || !effectType || !this.entityEffects.has(entityId)) {
      return 0;
    }
    
    const effects = this.entityEffects.get(entityId);
    if (!effects.has(effectType)) {
      return 0;
    }
    
    return effects.get(effectType).level;
  }
  
  /**
   * Generate a unique ID for an effect
   * @param {string} entityId - Entity ID
   * @param {string} effectType - Effect type
   * @returns {string} Unique effect ID
   */
  generateEffectId(entityId, effectType) {
    return `${entityId}_${effectType}_${Date.now()}`;
  }
  
  /**
   * Notify clients of effect updates
   * @param {string} entityId - Entity ID
   */
  notifyEffectsUpdate(entityId) {
    const effects = this.getEffects(entityId);
    
    // Send to all clients or just to the player if it's a player
    if (this.server.io) {
      this.server.io.emit('player_effects_update', {
        entityId,
        effects
      });
    }
    
    // Emit an event that other systems can listen for
    this.emit('effects_updated', {
      entityId,
      effects
    });
  }
}

module.exports = StatusEffectsManager; 