/**
 * StatusEffectManager - Manages status effects on entities
 */

class StatusEffectManager {
  constructor(options = {}) {
    this.entityEffects = new Map(); // Map of entityId -> Map of effectType -> effect
    this.tickCallbacks = new Map(); // Map of effect type -> tick callback function
    this.eventEmitter = options.eventEmitter;
    this.lastTick = Date.now();
    
    // Register default effect types
    this.registerDefaultEffects();
  }
  
  /**
   * Add an effect to an entity
   * @param {string} entityId - ID of the entity
   * @param {string} effectType - Type of effect to apply
   * @param {Object} options - Effect options
   * @returns {boolean} - Whether the effect was applied
   */
  addEffect(entityId, effectType, options = {}) {
    if (!entityId || !effectType) return false;
    
    // Get or create entity effects map
    if (!this.entityEffects.has(entityId)) {
      this.entityEffects.set(entityId, new Map());
    }
    
    const entityEffectsMap = this.entityEffects.get(entityId);
    const currentTime = Date.now();
    
    // Effect configuration
    const effect = {
      type: effectType,
      level: options.level || 1,
      duration: options.duration || 1200, // Default 1 minute (1200 ticks at 20 TPS)
      startTime: currentTime,
      endTime: currentTime + (options.duration || 1200) * 50, // Convert ticks to ms
      showParticles: options.showParticles !== false,
      showIcon: options.showIcon !== false,
      source: options.source || 'unknown',
      lastTickTime: currentTime,
      metadata: options.metadata || {}
    };
    
    // Check if there's an existing effect
    if (entityEffectsMap.has(effectType)) {
      const existingEffect = entityEffectsMap.get(effectType);
      
      // If existing effect has higher level, only extend duration if specified
      if (existingEffect.level > effect.level && !options.forceOverwrite) {
        if (options.extendDuration) {
          existingEffect.endTime = Math.max(existingEffect.endTime, effect.endTime);
          existingEffect.duration = Math.floor((existingEffect.endTime - currentTime) / 50);
          this.emitEffectEvent('effect_extended', entityId, existingEffect);
        }
        return false;
      }
      
      // If same level, just extend duration
      if (existingEffect.level === effect.level && !options.forceOverwrite) {
        existingEffect.endTime = Math.max(existingEffect.endTime, effect.endTime);
        existingEffect.duration = Math.floor((existingEffect.endTime - currentTime) / 50);
        this.emitEffectEvent('effect_extended', entityId, existingEffect);
        return true;
      }
      
      // Higher level or force overwrite, remove old and apply new
      this.emitEffectEvent('effect_removed', entityId, existingEffect);
    }
    
    // Store the effect
    entityEffectsMap.set(effectType, effect);
    
    // Emit event
    this.emitEffectEvent('effect_added', entityId, effect);
    
    return true;
  }
  
  /**
   * Remove an effect from an entity
   * @param {string} entityId - ID of the entity
   * @param {string} effectType - Type of effect to remove
   * @returns {boolean} - Whether the effect was removed
   */
  removeEffect(entityId, effectType) {
    if (!entityId || !effectType) return false;
    
    if (!this.entityEffects.has(entityId)) return false;
    
    const entityEffectsMap = this.entityEffects.get(entityId);
    
    if (!entityEffectsMap.has(effectType)) return false;
    
    const effect = entityEffectsMap.get(effectType);
    entityEffectsMap.delete(effectType);
    
    // Remove entity from tracking if no more effects
    if (entityEffectsMap.size === 0) {
      this.entityEffects.delete(entityId);
    }
    
    // Emit event
    this.emitEffectEvent('effect_removed', entityId, effect);
    
    return true;
  }
  
  /**
   * Clear all effects from an entity
   * @param {string} entityId - ID of the entity
   * @returns {boolean} - Whether any effects were cleared
   */
  clearEffects(entityId) {
    if (!entityId || !this.entityEffects.has(entityId)) return false;
    
    const entityEffectsMap = this.entityEffects.get(entityId);
    if (entityEffectsMap.size === 0) return false;
    
    // Emit removed events for each effect
    for (const [effectType, effect] of entityEffectsMap.entries()) {
      this.emitEffectEvent('effect_removed', entityId, effect);
    }
    
    // Clear the effects
    this.entityEffects.delete(entityId);
    
    return true;
  }
  
  /**
   * Get all active effects for an entity
   * @param {string} entityId - ID of the entity
   * @returns {Array} - Array of active effects
   */
  getEntityEffects(entityId) {
    if (!entityId || !this.entityEffects.has(entityId)) return [];
    
    const entityEffectsMap = this.entityEffects.get(entityId);
    return Array.from(entityEffectsMap.values());
  }
  
  /**
   * Check if an entity has a specific effect
   * @param {string} entityId - ID of the entity
   * @param {string} effectType - Type of effect to check
   * @returns {boolean} - Whether the entity has the effect
   */
  hasEffect(entityId, effectType) {
    if (!entityId || !effectType) return false;
    
    if (!this.entityEffects.has(entityId)) return false;
    
    return this.entityEffects.get(entityId).has(effectType);
  }
  
  /**
   * Get a specific effect on an entity
   * @param {string} entityId - ID of the entity
   * @param {string} effectType - Type of effect to get
   * @returns {Object|null} - The effect object or null if not found
   */
  getEffect(entityId, effectType) {
    if (!entityId || !effectType) return null;
    
    if (!this.entityEffects.has(entityId)) return null;
    
    const entityEffectsMap = this.entityEffects.get(entityId);
    
    if (!entityEffectsMap.has(effectType)) return null;
    
    return entityEffectsMap.get(effectType);
  }
  
  /**
   * Register a tick callback for an effect type
   * @param {string} effectType - Type of effect
   * @param {Function} callback - Callback function(entity, effect, deltaTime)
   */
  registerTickCallback(effectType, callback) {
    if (!effectType || typeof callback !== 'function') return;
    
    this.tickCallbacks.set(effectType, callback);
  }
  
  /**
   * Update effects for all entities
   * @param {Object} gameState - Current game state with entities
   */
  update(gameState) {
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastTick) / 1000; // Convert to seconds
    this.lastTick = currentTime;
    
    // Process each entity's effects
    for (const [entityId, entityEffectsMap] of this.entityEffects.entries()) {
      // Get entity from game state
      const entity = gameState.getEntity(entityId);
      
      // Skip if entity no longer exists
      if (!entity) {
        this.entityEffects.delete(entityId);
        continue;
      }
      
      // Check each effect
      const expiredEffects = [];
      
      for (const [effectType, effect] of entityEffectsMap.entries()) {
        // Check if effect has expired
        if (currentTime >= effect.endTime) {
          expiredEffects.push(effectType);
          continue;
        }
        
        // Process effect tick if it has a callback
        if (this.tickCallbacks.has(effectType)) {
          const callback = this.tickCallbacks.get(effectType);
          callback(entity, effect, deltaTime);
        }
        
        // Update last tick time
        effect.lastTickTime = currentTime;
        
        // Spawn particles if enabled
        if (effect.showParticles && Math.random() < 0.1) { // 10% chance per update
          this.spawnEffectParticles(entity, effect, gameState);
        }
      }
      
      // Remove expired effects
      for (const expiredType of expiredEffects) {
        const effect = entityEffectsMap.get(expiredType);
        entityEffectsMap.delete(expiredType);
        this.emitEffectEvent('effect_expired', entityId, effect);
      }
      
      // Clean up empty entity entries
      if (entityEffectsMap.size === 0) {
        this.entityEffects.delete(entityId);
      }
    }
  }
  
  /**
   * Spawn particles for an active effect
   * @param {Object} entity - The entity with the effect
   * @param {Object} effect - The effect object
   * @param {Object} gameState - Current game state
   */
  spawnEffectParticles(entity, effect, gameState) {
    if (!entity || !effect || !gameState) return;
    
    // Default particles
    let particleType = 'SPELL_MOB';
    let particleColor = '#FFFFFF';
    let particleCount = 3;
    
    // Customize based on effect type
    switch (effect.type) {
      case 'SPEED':
        particleColor = '#7CAFC6';
        break;
      case 'SLOWNESS':
        particleColor = '#5A6C81';
        break;
      case 'HASTE':
        particleColor = '#D9C043';
        break;
      case 'MINING_FATIGUE':
        particleColor = '#4A4217';
        break;
      case 'STRENGTH':
        particleColor = '#932423';
        break;
      case 'INSTANT_HEALTH':
        particleType = 'HEART';
        particleColor = '#F82423';
        break;
      case 'INSTANT_DAMAGE':
        particleColor = '#430A09';
        break;
      case 'JUMP_BOOST':
        particleColor = '#22FF4C';
        break;
      case 'NAUSEA':
        particleColor = '#551D4A';
        break;
      case 'REGENERATION':
        particleColor = '#CD5CAB';
        break;
      case 'RESISTANCE':
        particleColor = '#99453A';
        break;
      case 'FIRE_RESISTANCE':
        particleColor = '#E49A3A';
        break;
      case 'WATER_BREATHING':
        particleColor = '#2E5299';
        break;
      case 'INVISIBILITY':
        particleColor = '#7F8392';
        particleType = 'SPELL';
        break;
      case 'BLINDNESS':
        particleColor = '#1F1F23';
        break;
      case 'NIGHT_VISION':
        particleColor = '#1F1FA1';
        break;
      case 'HUNGER':
        particleColor = '#587653';
        break;
      case 'WEAKNESS':
        particleColor = '#484D48';
        break;
      case 'POISON':
        particleColor = '#4E9331';
        break;
      case 'WITHER':
        particleColor = '#352A27';
        break;
      case 'HEALTH_BOOST':
        particleColor = '#F87D23';
        break;
      case 'ABSORPTION':
        particleColor = '#2552A5';
        break;
      case 'LEVITATION':
        particleColor = '#CEFFFF';
        break;
      default:
        particleColor = '#FFFFFF';
    }
    
    // Spawn particles
    gameState.spawnParticles(particleType, entity.position, {
      count: particleCount,
      spread: { x: 0.5, y: 0.5, z: 0.5 },
      color: particleColor,
      motion: { x: 0, y: 0.1, z: 0 }
    });
  }
  
  /**
   * Emit an effect-related event
   * @param {string} eventName - Name of the event
   * @param {string} entityId - ID of the entity
   * @param {Object} effect - The effect object
   */
  emitEffectEvent(eventName, entityId, effect) {
    if (!this.eventEmitter) return;
    
    this.eventEmitter.emit(eventName, {
      entityId,
      effect: { ...effect }
    });
  }
  
  /**
   * Register default effect handlers
   */
  registerDefaultEffects() {
    // SPEED effect
    this.registerTickCallback('SPEED', (entity, effect) => {
      const speedMultiplier = 1.0 + (0.2 * effect.level);
      entity.attributes = entity.attributes || {};
      entity.attributes.movementSpeed = entity.attributes.baseMovementSpeed * speedMultiplier;
    });
    
    // SLOWNESS effect
    this.registerTickCallback('SLOWNESS', (entity, effect) => {
      const slowAmount = Math.max(0, 1.0 - (0.15 * effect.level));
      entity.attributes = entity.attributes || {};
      entity.attributes.movementSpeed = entity.attributes.baseMovementSpeed * slowAmount;
    });
    
    // HASTE effect
    this.registerTickCallback('HASTE', (entity, effect) => {
      const hasteMultiplier = 1.0 + (0.2 * effect.level);
      entity.attributes = entity.attributes || {};
      entity.attributes.miningSpeed = entity.attributes.baseMiningSpeed * hasteMultiplier;
    });
    
    // MINING_FATIGUE effect
    this.registerTickCallback('MINING_FATIGUE', (entity, effect) => {
      let fatigueAmount = 0;
      switch (effect.level) {
        case 1: fatigueAmount = 0.3; break;
        case 2: fatigueAmount = 0.09; break;
        case 3: fatigueAmount = 0.027; break;
        default: fatigueAmount = Math.pow(0.3, effect.level);
      }
      entity.attributes = entity.attributes || {};
      entity.attributes.miningSpeed = entity.attributes.baseMiningSpeed * fatigueAmount;
    });
    
    // STRENGTH effect
    this.registerTickCallback('STRENGTH', (entity, effect) => {
      const strengthBonus = 3 * effect.level; // 3 damage per level
      entity.attributes = entity.attributes || {};
      entity.attributes.attackDamage = entity.attributes.baseAttackDamage + strengthBonus;
    });
    
    // INSTANT_HEALTH effect - applied once, not on tick
    
    // INSTANT_DAMAGE effect - applied once, not on tick
    
    // JUMP_BOOST effect
    this.registerTickCallback('JUMP_BOOST', (entity, effect) => {
      const jumpBoost = 0.1 * effect.level;
      entity.attributes = entity.attributes || {};
      entity.attributes.jumpHeight = entity.attributes.baseJumpHeight + jumpBoost;
    });
    
    // NAUSEA effect - visual effect on client
    
    // REGENERATION effect
    this.registerTickCallback('REGENERATION', (entity, effect, deltaTime) => {
      // Calculate regen interval - higher levels regenerate faster
      const tickInterval = Math.max(1, Math.floor(50 / (1 << (effect.level - 1))));
      
      // Current tick based on effect duration
      const effectDuration = effect.endTime - effect.startTime;
      const elapsedTime = Date.now() - effect.startTime;
      const currentTick = Math.floor((elapsedTime / effectDuration) * effect.duration);
      
      // Apply healing on appropriate ticks
      if (currentTick % tickInterval === 0 && currentTick !== effect.metadata.lastRegenTick) {
        entity.health = Math.min(entity.maxHealth, entity.health + 1);
        effect.metadata.lastRegenTick = currentTick;
      }
    });
    
    // RESISTANCE effect
    this.registerTickCallback('RESISTANCE', (entity, effect) => {
      let damageReduction = 0;
      switch (effect.level) {
        case 1: damageReduction = 0.2; break;
        case 2: damageReduction = 0.4; break;
        case 3: damageReduction = 0.6; break;
        case 4: damageReduction = 0.8; break;
        default: damageReduction = Math.min(0.95, effect.level * 0.2);
      }
      entity.attributes = entity.attributes || {};
      entity.attributes.damageReduction = damageReduction;
    });
    
    // FIRE_RESISTANCE effect
    this.registerTickCallback('FIRE_RESISTANCE', (entity) => {
      entity.attributes = entity.attributes || {};
      entity.attributes.fireImmune = true;
    });
    
    // WATER_BREATHING effect
    this.registerTickCallback('WATER_BREATHING', (entity) => {
      entity.attributes = entity.attributes || {};
      entity.attributes.canBreatheUnderwater = true;
    });
    
    // INVISIBILITY effect
    this.registerTickCallback('INVISIBILITY', (entity) => {
      entity.attributes = entity.attributes || {};
      entity.attributes.invisible = true;
    });
    
    // BLINDNESS effect - visual effect on client
    
    // NIGHT_VISION effect - visual effect on client
    
    // HUNGER effect - player specific
    this.registerTickCallback('HUNGER', (entity, effect, deltaTime) => {
      if (entity.type !== 'PLAYER') return;
      
      const hungerRate = 0.005 * effect.level * deltaTime;
      if (entity.hunger !== undefined) {
        entity.hunger = Math.max(0, entity.hunger - hungerRate);
      }
    });
    
    // WEAKNESS effect
    this.registerTickCallback('WEAKNESS', (entity, effect) => {
      const weaknessAmount = Math.max(0, effect.level * 4);
      entity.attributes = entity.attributes || {};
      entity.attributes.attackDamage = Math.max(1, entity.attributes.baseAttackDamage - weaknessAmount);
    });
    
    // POISON effect
    this.registerTickCallback('POISON', (entity, effect, deltaTime) => {
      // Cannot kill, minimum 1 health
      if (entity.health <= 1) return;
      
      // Calculate poison interval - higher levels damage faster
      const tickInterval = Math.max(1, Math.floor(25 / (1 << (effect.level - 1))));
      
      // Current tick based on effect duration
      const effectDuration = effect.endTime - effect.startTime;
      const elapsedTime = Date.now() - effect.startTime;
      const currentTick = Math.floor((elapsedTime / effectDuration) * effect.duration);
      
      // Apply damage on appropriate ticks
      if (currentTick % tickInterval === 0 && currentTick !== effect.metadata.lastPoisonTick) {
        entity.health = Math.max(1, entity.health - 1);
        effect.metadata.lastPoisonTick = currentTick;
      }
    });
    
    // WITHER effect
    this.registerTickCallback('WITHER', (entity, effect, deltaTime) => {
      // Wither can kill unlike poison
      
      // Calculate wither interval - higher levels damage faster
      const tickInterval = Math.max(1, Math.floor(40 / (1 << (effect.level - 1))));
      
      // Current tick based on effect duration
      const effectDuration = effect.endTime - effect.startTime;
      const elapsedTime = Date.now() - effect.startTime;
      const currentTick = Math.floor((elapsedTime / effectDuration) * effect.duration);
      
      // Apply damage on appropriate ticks
      if (currentTick % tickInterval === 0 && currentTick !== effect.metadata.lastWitherTick) {
        entity.health = Math.max(0, entity.health - 1);
        effect.metadata.lastWitherTick = currentTick;
        
        // Check if entity died
        if (entity.health <= 0) {
          this.emitEffectEvent('entity_died', entity.id, {
            cause: 'WITHER',
            sourceEffect: effect
          });
        }
      }
    });
    
    // HEALTH_BOOST effect
    this.registerTickCallback('HEALTH_BOOST', (entity, effect) => {
      const healthBoost = 4 * effect.level; // 4 health per level
      entity.attributes = entity.attributes || {};
      
      // Remember original max health if not stored
      if (effect.metadata.originalMaxHealth === undefined) {
        effect.metadata.originalMaxHealth = entity.maxHealth;
      }
      
      // Set new max health
      entity.maxHealth = effect.metadata.originalMaxHealth + healthBoost;
      
      // Health is always at least maxHealth when max health increases
      if (entity.health < entity.maxHealth) {
        entity.health = entity.maxHealth;
      }
    });
    
    // ABSORPTION effect
    this.registerTickCallback('ABSORPTION', (entity, effect) => {
      const absorptionAmount = 4 * effect.level; // 4 absorption per level
      entity.attributes = entity.attributes || {};
      entity.attributes.absorption = absorptionAmount;
    });
    
    // LEVITATION effect
    this.registerTickCallback('LEVITATION', (entity, effect) => {
      // Set upward motion
      entity.velocity = entity.velocity || { x: 0, y: 0, z: 0 };
      entity.velocity.y = 0.05 * effect.level;
      
      // Disable gravity while levitating
      entity.attributes = entity.attributes || {};
      entity.attributes.ignoreGravity = true;
    });
  }
  
  /**
   * Get client-side data about active effects for an entity
   * @param {string} entityId - ID of the entity
   * @returns {Array} - Array of effect data objects for client
   */
  getEntityEffectsForClient(entityId) {
    const effects = this.getEntityEffects(entityId);
    
    return effects.map(effect => ({
      type: effect.type,
      level: effect.level,
      duration: Math.floor((effect.endTime - Date.now()) / 50), // Remaining time in ticks
      showParticles: effect.showParticles,
      showIcon: effect.showIcon
    }));
  }
}

module.exports = StatusEffectManager; 