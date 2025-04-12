/**
 * Effects Manager - Handles status effects on entities
 */

class EffectsManager {
  constructor(server) {
    this.server = server;
    
    // Map of active effects by entity ID
    // Map<entityId, Map<effectType, effectData>>
    this.activeEffects = new Map();
    
    // Register effect definitions
    this.registerEffectDefinitions();
    
    // Register event handlers
    this.registerEventHandlers();
  }
  
  /**
   * Register effect definitions with properties and behaviors
   */
  registerEffectDefinitions() {
    // Map of effect definitions
    this.effectDefinitions = new Map();
    
    // Register basic effect types
    this.registerEffect('SPEED', {
      name: 'Speed',
      color: '#7CAFC6',
      maxLevel: 2,
      isNegative: false,
      description: 'Increases movement speed',
      onApply: (entity, effect) => {
        const multiplier = 1.0 + (0.2 * effect.level);
        entity.speed = (entity.baseSpeed || entity.speed) * multiplier;
        entity.baseSpeed = entity.baseSpeed || entity.speed;
      },
      onRemove: (entity) => {
        entity.speed = entity.baseSpeed || entity.speed;
      }
    });
    
    this.registerEffect('SLOWNESS', {
      name: 'Slowness',
      color: '#5A6C81',
      maxLevel: 4,
      isNegative: true,
      description: 'Decreases movement speed',
      onApply: (entity, effect) => {
        const multiplier = Math.max(0.2, 1.0 - (0.15 * effect.level));
        entity.baseSpeed = entity.baseSpeed || entity.speed;
        entity.speed = entity.baseSpeed * multiplier;
      },
      onRemove: (entity) => {
        entity.speed = entity.baseSpeed || entity.speed;
      }
    });
    
    this.registerEffect('HASTE', {
      name: 'Haste',
      color: '#D9C043',
      maxLevel: 2,
      isNegative: false,
      description: 'Increases mining and attack speed',
      onApply: (entity, effect) => {
        const multiplier = 1.0 + (0.2 * effect.level);
        entity.miningSpeed = (entity.baseMiningSpeed || entity.miningSpeed || 1.0) * multiplier;
        entity.baseMiningSpeed = entity.baseMiningSpeed || entity.miningSpeed || 1.0;
        
        if (entity.attackSpeed) {
          entity.baseAttackSpeed = entity.baseAttackSpeed || entity.attackSpeed;
          entity.attackSpeed = entity.baseAttackSpeed * multiplier;
        }
      },
      onRemove: (entity) => {
        entity.miningSpeed = entity.baseMiningSpeed || entity.miningSpeed;
        if (entity.attackSpeed) {
          entity.attackSpeed = entity.baseAttackSpeed || entity.attackSpeed;
        }
      }
    });
    
    this.registerEffect('MINING_FATIGUE', {
      name: 'Mining Fatigue',
      color: '#4A4217',
      maxLevel: 4,
      isNegative: true,
      description: 'Decreases mining speed',
      onApply: (entity, effect) => {
        const multiplier = Math.max(0.05, 1.0 - (0.3 * effect.level));
        entity.baseMiningSpeed = entity.baseMiningSpeed || entity.miningSpeed || 1.0;
        entity.miningSpeed = entity.baseMiningSpeed * multiplier;
      },
      onRemove: (entity) => {
        entity.miningSpeed = entity.baseMiningSpeed || entity.miningSpeed;
      }
    });
    
    this.registerEffect('STRENGTH', {
      name: 'Strength',
      color: '#932423',
      maxLevel: 2,
      isNegative: false,
      description: 'Increases attack damage',
      onApply: (entity, effect) => {
        const bonusDamage = 3 * effect.level;
        entity.baseDamage = entity.baseDamage || entity.damage || 0;
        entity.damage = entity.baseDamage + bonusDamage;
      },
      onRemove: (entity) => {
        entity.damage = entity.baseDamage || entity.damage;
      }
    });
    
    this.registerEffect('WEAKNESS', {
      name: 'Weakness',
      color: '#484D48',
      maxLevel: 2,
      isNegative: true,
      description: 'Decreases attack damage',
      onApply: (entity, effect) => {
        const penaltyDamage = 4 * effect.level;
        entity.baseDamage = entity.baseDamage || entity.damage || 0;
        entity.damage = Math.max(0, entity.baseDamage - penaltyDamage);
      },
      onRemove: (entity) => {
        entity.damage = entity.baseDamage || entity.damage;
      }
    });
    
    this.registerEffect('REGENERATION', {
      name: 'Regeneration',
      color: '#CD5CAB',
      maxLevel: 2,
      isNegative: false,
      description: 'Restores health over time',
      // Logic handled in tick instead of onApply
    });
    
    this.registerEffect('POISON', {
      name: 'Poison',
      color: '#4E9331',
      maxLevel: 2,
      isNegative: true,
      description: 'Deals damage over time (cannot be fatal)',
      // Logic handled in tick instead of onApply
    });
    
    this.registerEffect('INSTANT_HEALTH', {
      name: 'Instant Health',
      color: '#F82423',
      maxLevel: 2,
      isNegative: false,
      description: 'Instantly restores health',
      isInstant: true,
      onApply: (entity, effect) => {
        const healAmount = 4 * Math.pow(2, effect.level - 1);
        this.healEntity(entity, healAmount);
      }
    });
    
    this.registerEffect('INSTANT_DAMAGE', {
      name: 'Instant Damage',
      color: '#430A09',
      maxLevel: 2,
      isNegative: true,
      description: 'Instantly deals damage',
      isInstant: true,
      onApply: (entity, effect) => {
        const damageAmount = 6 * Math.pow(2, effect.level - 1);
        this.damageEntity(entity, damageAmount, 'POTION');
      }
    });
    
    this.registerEffect('JUMP_BOOST', {
      name: 'Jump Boost',
      color: '#22FF4C',
      maxLevel: 2,
      isNegative: false,
      description: 'Increases jump height',
      onApply: (entity, effect) => {
        const multiplier = 1.0 + (0.5 * effect.level);
        entity.baseJumpHeight = entity.baseJumpHeight || entity.jumpHeight || 1.0;
        entity.jumpHeight = entity.baseJumpHeight * multiplier;
      },
      onRemove: (entity) => {
        entity.jumpHeight = entity.baseJumpHeight || entity.jumpHeight;
      }
    });
    
    this.registerEffect('NAUSEA', {
      name: 'Nausea',
      color: '#551D4A',
      maxLevel: 1,
      isNegative: true,
      description: 'Distorts vision',
      onApply: (entity, effect) => {
        if (entity.type === 'PLAYER') {
          this.server.sendToPlayer(entity, {
            type: 'effect:nausea',
            enabled: true
          });
        }
      },
      onRemove: (entity) => {
        if (entity.type === 'PLAYER') {
          this.server.sendToPlayer(entity, {
            type: 'effect:nausea',
            enabled: false
          });
        }
      }
    });
    
    this.registerEffect('RESISTANCE', {
      name: 'Resistance',
      color: '#99453A',
      maxLevel: 4,
      isNegative: false,
      description: 'Reduces damage taken',
      onApply: (entity, effect) => {
        const resistancePercent = 0.2 * effect.level;
        entity.damageResistance = (entity.damageResistance || 0) + resistancePercent;
      },
      onRemove: (entity, effect) => {
        const resistancePercent = 0.2 * effect.level;
        entity.damageResistance = Math.max(0, (entity.damageResistance || 0) - resistancePercent);
      }
    });
    
    this.registerEffect('FIRE_RESISTANCE', {
      name: 'Fire Resistance',
      color: '#E49A0A',
      maxLevel: 1,
      isNegative: false,
      description: 'Prevents fire damage',
      onApply: (entity) => {
        entity.fireResistant = true;
      },
      onRemove: (entity) => {
        entity.fireResistant = false;
      }
    });
    
    this.registerEffect('WATER_BREATHING', {
      name: 'Water Breathing',
      color: '#2E5299',
      maxLevel: 1,
      isNegative: false,
      description: 'Prevents drowning',
      onApply: (entity) => {
        entity.waterBreathing = true;
      },
      onRemove: (entity) => {
        entity.waterBreathing = false;
      }
    });
    
    this.registerEffect('INVISIBILITY', {
      name: 'Invisibility',
      color: '#7F8392',
      maxLevel: 1,
      isNegative: false,
      description: 'Grants invisibility',
      onApply: (entity) => {
        entity.invisible = true;
        if (entity.type === 'PLAYER') {
          this.server.broadcastNearby({
            type: 'entity:update',
            entityId: entity.id,
            properties: { visible: false }
          }, entity.position, 64);
        }
      },
      onRemove: (entity) => {
        entity.invisible = false;
        if (entity.type === 'PLAYER') {
          this.server.broadcastNearby({
            type: 'entity:update',
            entityId: entity.id,
            properties: { visible: true }
          }, entity.position, 64);
        }
      }
    });
    
    this.registerEffect('BLINDNESS', {
      name: 'Blindness',
      color: '#1F1F23',
      maxLevel: 1,
      isNegative: true,
      description: 'Impairs vision',
      onApply: (entity) => {
        if (entity.type === 'PLAYER') {
          this.server.sendToPlayer(entity, {
            type: 'effect:blindness',
            enabled: true
          });
        }
      },
      onRemove: (entity) => {
        if (entity.type === 'PLAYER') {
          this.server.sendToPlayer(entity, {
            type: 'effect:blindness',
            enabled: false
          });
        }
      }
    });
    
    this.registerEffect('NIGHT_VISION', {
      name: 'Night Vision',
      color: '#1F1FA1',
      maxLevel: 1,
      isNegative: false,
      description: 'Brightens vision in darkness',
      onApply: (entity) => {
        if (entity.type === 'PLAYER') {
          this.server.sendToPlayer(entity, {
            type: 'effect:night_vision',
            enabled: true
          });
        }
      },
      onRemove: (entity) => {
        if (entity.type === 'PLAYER') {
          this.server.sendToPlayer(entity, {
            type: 'effect:night_vision',
            enabled: false
          });
        }
      }
    });
    
    this.registerEffect('GLOWING', {
      name: 'Glowing',
      color: '#FFFFFF',
      maxLevel: 1,
      isNegative: false,
      description: 'Makes entity visible through walls',
      onApply: (entity) => {
        entity.glowing = true;
        this.server.broadcastNearby({
          type: 'entity:update',
          entityId: entity.id,
          properties: { glowing: true }
        }, entity.position, 64);
      },
      onRemove: (entity) => {
        entity.glowing = false;
        this.server.broadcastNearby({
          type: 'entity:update',
          entityId: entity.id,
          properties: { glowing: false }
        }, entity.position, 64);
      }
    });
    
    this.registerEffect('LEVITATION', {
      name: 'Levitation',
      color: '#CEFFFF',
      maxLevel: 1,
      isNegative: false,
      description: 'Makes entity float upward',
      onApply: (entity) => {
        entity.levitating = true;
        entity.baseGravity = entity.baseGravity || entity.gravity || 1.0;
        entity.gravity = -0.05;
      },
      onRemove: (entity) => {
        entity.levitating = false;
        entity.gravity = entity.baseGravity || 1.0;
      }
    });
  }
  
  /**
   * Register a single effect definition
   * @param {string} effectType - Effect type identifier
   * @param {Object} definition - Effect definition properties
   */
  registerEffect(effectType, definition) {
    this.effectDefinitions.set(effectType, definition);
  }
  
  /**
   * Get an effect definition by type
   * @param {string} effectType - Effect type identifier
   * @returns {Object} Effect definition or null if not found
   */
  getEffectDefinition(effectType) {
    return this.effectDefinitions.get(effectType) || null;
  }
  
  /**
   * Register event handlers
   */
  registerEventHandlers() {
    // Process effects on server tick
    this.server.eventBus.on('server:tick', this.processTick.bind(this));
    
    // Remove effects when entity removed
    this.server.eventBus.on('entity:remove', this.handleEntityRemove.bind(this));
    
    // Handle damage events for resistance effects
    this.server.eventBus.on('entity:damage', this.handleEntityDamage.bind(this));
  }
  
  /**
   * Apply an effect to an entity
   * @param {Object} entity - Entity object
   * @param {Object} effectData - Effect data
   * @param {string} effectData.type - Effect type
   * @param {number} effectData.level - Effect level
   * @param {number} effectData.duration - Effect duration in ticks
   * @param {string} effectData.source - Source of the effect
   * @returns {boolean} Whether the effect was applied
   */
  applyEffect(entity, effectData) {
    // Validate entity and effect
    if (!entity || !entity.id) return false;
    
    const { type, level = 1, duration = 600, source = 'UNKNOWN' } = effectData;
    
    // Get effect definition
    const definition = this.getEffectDefinition(type);
    if (!definition) return false;
    
    // Clamp level to maximum allowed
    const clampedLevel = Math.min(level, definition.maxLevel);
    
    // Create effect object
    const effect = {
      type,
      level: clampedLevel,
      duration,
      source,
      startTime: this.server.currentTick,
      definition
    };
    
    // Get or create entity effects map
    let entityEffects = this.activeEffects.get(entity.id);
    if (!entityEffects) {
      entityEffects = new Map();
      this.activeEffects.set(entity.id, entityEffects);
    }
    
    // Check for existing effect of same type
    const existingEffect = entityEffects.get(type);
    
    // If effect is instant, just apply it
    if (definition.isInstant) {
      if (definition.onApply) {
        definition.onApply(entity, effect);
      }
      return true;
    }
    
    // Handle effect extension, amplification or replacement
    if (existingEffect) {
      // If new effect has higher level, replace existing
      if (effect.level > existingEffect.level) {
        // Remove old effect first
        if (existingEffect.definition.onRemove) {
          existingEffect.definition.onRemove(entity, existingEffect);
        }
        
        // Apply new effect
        if (effect.definition.onApply) {
          effect.definition.onApply(entity, effect);
        }
        
        entityEffects.set(type, effect);
      } 
      // If same level, extend duration
      else if (effect.level === existingEffect.level) {
        existingEffect.duration = Math.max(existingEffect.duration, duration);
        existingEffect.startTime = this.server.currentTick;
      }
      // If lower level, ignore new effect
    } 
    // New effect, apply it
    else {
      // Apply effect
      if (effect.definition.onApply) {
        effect.definition.onApply(entity, effect);
      }
      
      entityEffects.set(type, effect);
    }
    
    // Notify the entity of the effect
    this.notifyEffectChanged(entity, effect);
    
    return true;
  }
  
  /**
   * Remove an effect from an entity
   * @param {Object} entity - Entity object
   * @param {string} effectType - Effect type to remove
   * @returns {boolean} Whether the effect was removed
   */
  removeEffect(entity, effectType) {
    if (!entity || !entity.id) return false;
    
    // Get entity effects
    const entityEffects = this.activeEffects.get(entity.id);
    if (!entityEffects) return false;
    
    // Get the effect
    const effect = entityEffects.get(effectType);
    if (!effect) return false;
    
    // Call onRemove handler
    if (effect.definition.onRemove) {
      effect.definition.onRemove(entity, effect);
    }
    
    // Remove the effect
    entityEffects.delete(effectType);
    
    // Notify the entity
    this.notifyEffectRemoved(entity, effectType);
    
    return true;
  }
  
  /**
   * Remove all effects from an entity
   * @param {Object} entity - Entity object
   */
  removeAllEffects(entity) {
    if (!entity || !entity.id) return;
    
    // Get entity effects
    const entityEffects = this.activeEffects.get(entity.id);
    if (!entityEffects) return;
    
    // Remove each effect
    entityEffects.forEach((effect, type) => {
      if (effect.definition.onRemove) {
        effect.definition.onRemove(entity, effect);
      }
      this.notifyEffectRemoved(entity, type);
    });
    
    // Clear effects map
    entityEffects.clear();
  }
  
  /**
   * Get all active effects for an entity
   * @param {Object} entity - Entity object
   * @returns {Array} Array of active effect objects
   */
  getActiveEffects(entity) {
    if (!entity || !entity.id) return [];
    
    const entityEffects = this.activeEffects.get(entity.id);
    if (!entityEffects) return [];
    
    return Array.from(entityEffects.values());
  }
  
  /**
   * Check if an entity has a specific effect
   * @param {Object} entity - Entity object
   * @param {string} effectType - Effect type to check
   * @returns {boolean} Whether the entity has the effect
   */
  hasEffect(entity, effectType) {
    if (!entity || !entity.id) return false;
    
    const entityEffects = this.activeEffects.get(entity.id);
    if (!entityEffects) return false;
    
    return entityEffects.has(effectType);
  }
  
  /**
   * Get effect level for an entity
   * @param {Object} entity - Entity object 
   * @param {string} effectType - Effect type
   * @returns {number} Effect level or 0 if not active
   */
  getEffectLevel(entity, effectType) {
    if (!entity || !entity.id) return 0;
    
    const entityEffects = this.activeEffects.get(entity.id);
    if (!entityEffects) return 0;
    
    const effect = entityEffects.get(effectType);
    return effect ? effect.level : 0;
  }
  
  /**
   * Notify entity of effect change (for client display)
   * @param {Object} entity - Entity object
   * @param {Object} effect - Effect data
   */
  notifyEffectChanged(entity, effect) {
    if (entity.type !== 'PLAYER') return;
    
    // Send effect update to player
    this.server.sendToPlayer(entity, {
      type: 'effect:update',
      effectType: effect.type,
      level: effect.level,
      duration: effect.duration,
      isNegative: effect.definition.isNegative
    });
    
    // Broadcast effect particles to nearby players
    this.server.broadcastNearby({
      type: 'particles:effect',
      entityId: entity.id,
      effectType: effect.type,
      color: effect.definition.color
    }, entity.position, 32);
  }
  
  /**
   * Notify entity of effect removal
   * @param {Object} entity - Entity object
   * @param {string} effectType - Effect type that was removed
   */
  notifyEffectRemoved(entity, effectType) {
    if (entity.type !== 'PLAYER') return;
    
    // Send effect removal to player
    this.server.sendToPlayer(entity, {
      type: 'effect:remove',
      effectType: effectType
    });
  }
  
  /**
   * Handle entity damage event for resistance effects
   * @param {Object} data - Damage event data
   */
  handleEntityDamage(data) {
    const { entity, amount, type } = data;
    
    // Skip if no entity or already handled
    if (!entity || data.processed) return;
    
    // Check for resistance effects
    const fireResistant = this.hasEffect(entity, 'FIRE_RESISTANCE');
    const resistance = this.getEffectLevel(entity, 'RESISTANCE');
    
    // Handle fire resistance
    if (fireResistant && (type === 'FIRE' || type === 'LAVA' || type === 'FIRE_TICK')) {
      data.amount = 0;
      data.cancelled = true;
      return;
    }
    
    // Handle resistance effect
    if (resistance > 0) {
      const resistanceFactor = 0.2 * resistance;
      data.amount = Math.max(0, amount * (1 - resistanceFactor));
    }
  }
  
  /**
   * Handle entity remove event
   * @param {Object} data - Entity remove event data
   */
  handleEntityRemove(data) {
    const { entityId } = data;
    
    // Remove all effects for the entity
    this.activeEffects.delete(entityId);
  }
  
  /**
   * Process effects on server tick
   */
  processTick() {
    const currentTick = this.server.currentTick;
    
    // Process each entity's effects
    this.activeEffects.forEach((entityEffects, entityId) => {
      const entity = this.server.getEntityById(entityId);
      if (!entity) {
        // Entity no longer exists, remove its effects
        this.activeEffects.delete(entityId);
        return;
      }
      
      // Process each effect
      const effectsToRemove = [];
      
      entityEffects.forEach((effect, type) => {
        // Calculate remaining duration
        const elapsedTicks = currentTick - effect.startTime;
        const remainingTicks = effect.duration - elapsedTicks;
        
        // Effect expired
        if (remainingTicks <= 0) {
          effectsToRemove.push(type);
          return;
        }
        
        // Process tick effects 
        this.processTickEffect(entity, effect, currentTick);
      });
      
      // Remove expired effects
      effectsToRemove.forEach(type => {
        this.removeEffect(entity, type);
      });
    });
  }
  
  /**
   * Process tick-based effects like regeneration and poison 
   * @param {Object} entity - Entity object
   * @param {Object} effect - Effect data
   * @param {number} currentTick - Current server tick
   */
  processTickEffect(entity, effect, currentTick) {
    const { type, level } = effect;
    
    // Handle regeneration
    if (type === 'REGENERATION') {
      // Regenerate health every 50 / level ticks (2.5s for level 1, 1.25s for level 2)
      const interval = Math.floor(50 / level);
      if (currentTick % interval === 0) {
        this.healEntity(entity, 1);
      }
    }
    
    // Handle poison
    if (type === 'POISON') {
      // Damage every 25 ticks (1.25s)
      if (currentTick % 25 === 0) {
        // Don't kill with poison, leave at 1 health
        if (entity.health > 1) {
          this.damageEntity(entity, level, 'POISON');
        }
      }
    }
    
    // Handle wither
    if (type === 'WITHER') {
      // Damage every 40 ticks (2s)
      if (currentTick % 40 === 0) {
        // Wither can kill unlike poison
        this.damageEntity(entity, level, 'WITHER');
      }
    }
  }
  
  /**
   * Heal an entity
   * @param {Object} entity - Entity to heal
   * @param {number} amount - Amount to heal
   */
  healEntity(entity, amount) {
    if (!entity || !entity.id) return;
    
    // Skip if entity doesn't have health
    if (typeof entity.health === 'undefined' || 
        typeof entity.maxHealth === 'undefined') {
      return;
    }
    
    // Calculate new health
    const newHealth = Math.min(entity.maxHealth, entity.health + amount);
    if (newHealth === entity.health) return;
    
    // Update health
    entity.health = newHealth;
    
    // Notify entity of health change
    this.server.eventBus.emit('entity:heal', {
      entity,
      amount,
      source: 'EFFECT'
    });
    
    // Update client if player
    if (entity.type === 'PLAYER') {
      this.server.sendToPlayer(entity, {
        type: 'player:health_update',
        health: entity.health,
        maxHealth: entity.maxHealth
      });
    }
  }
  
  /**
   * Damage an entity
   * @param {Object} entity - Entity to damage
   * @param {number} amount - Amount of damage
   * @param {string} source - Damage source
   */
  damageEntity(entity, amount, source) {
    if (!entity || !entity.id) return;
    
    // Skip if entity doesn't have health
    if (typeof entity.health === 'undefined' || 
        typeof entity.maxHealth === 'undefined') {
      return;
    }
    
    // Emit damage event (allows for cancellation or modification)
    const damageData = {
      entity,
      amount,
      type: source,
      processed: false,
      cancelled: false
    };
    
    this.server.eventBus.emit('entity:damage', damageData);
    
    // Check if damage was cancelled
    if (damageData.cancelled || damageData.processed) return;
    
    // Apply damage
    const newHealth = Math.max(0, entity.health - damageData.amount);
    entity.health = newHealth;
    
    // Notify entity of damage
    this.server.eventBus.emit('entity:damaged', {
      entity,
      amount: damageData.amount,
      source
    });
    
    // Update client if player
    if (entity.type === 'PLAYER') {
      this.server.sendToPlayer(entity, {
        type: 'player:health_update',
        health: entity.health,
        maxHealth: entity.maxHealth
      });
    }
    
    // Check if entity died
    if (entity.health <= 0) {
      this.server.eventBus.emit('entity:death', {
        entity,
        source
      });
    }
  }
}

module.exports = EffectsManager; 