class EntityManager {
  constructor() {
    // ... existing initialization ...
    
    // Track entities with their status effects
    this.entityStatusEffects = new Map();
  }
  
  // ... existing methods ...
  
  /**
   * Add a status effect to an entity
   * @param {string} entityId - ID of the entity
   * @param {Object} effect - Effect to add {type, level, duration}
   * @returns {boolean} Whether effect was added successfully
   */
  addStatusEffect(entityId, effect) {
    if (!entityId || !effect || !effect.type) {
      return false;
    }
    
    // Use global status effects manager if available
    if (global.statusEffectsManager) {
      return global.statusEffectsManager.addEffect(entityId, effect.type, {
        level: effect.level || 1,
        duration: effect.duration || 600, // Default 30 seconds
        source: effect.source || 'unknown'
      });
    }
    
    // Fallback implementation if no global manager
    if (!this.entityStatusEffects.has(entityId)) {
      this.entityStatusEffects.set(entityId, []);
    }
    
    const effects = this.entityStatusEffects.get(entityId);
    
    // Check if effect already exists
    const existingIndex = effects.findIndex(e => e.type === effect.type);
    if (existingIndex >= 0) {
      // Replace if new level is higher, or extend duration if same level
      const existing = effects[existingIndex];
      if (effect.level > existing.level) {
        effects[existingIndex] = { ...effect, timeLeft: effect.duration };
      } else if (effect.level === existing.level) {
        existing.timeLeft = Math.max(existing.timeLeft, effect.duration);
      }
    } else {
      // Add new effect
      effects.push({
        type: effect.type,
        level: effect.level || 1,
        duration: effect.duration || 600,
        timeLeft: effect.duration || 600,
        source: effect.source || 'unknown'
      });
    }
    
    return true;
  }
  
  /**
   * Remove a status effect from an entity
   * @param {string} entityId - ID of the entity
   * @param {string} effectType - Type of effect to remove
   * @returns {boolean} Whether effect was removed
   */
  removeStatusEffect(entityId, effectType) {
    if (!entityId || !effectType) {
      return false;
    }
    
    // Use global status effects manager if available
    if (global.statusEffectsManager) {
      return global.statusEffectsManager.removeEffect(entityId, effectType);
    }
    
    // Fallback implementation
    if (!this.entityStatusEffects.has(entityId)) {
      return false;
    }
    
    const effects = this.entityStatusEffects.get(entityId);
    const index = effects.findIndex(e => e.type === effectType);
    
    if (index >= 0) {
      effects.splice(index, 1);
      return true;
    }
    
    return false;
  }
  
  /**
   * Clear all status effects from an entity
   * @param {string} entityId - ID of the entity
   * @returns {boolean} Whether effects were cleared
   */
  clearStatusEffects(entityId) {
    if (!entityId) {
      return false;
    }
    
    // Use global status effects manager if available
    if (global.statusEffectsManager) {
      return global.statusEffectsManager.clearEffects(entityId);
    }
    
    // Fallback implementation
    if (!this.entityStatusEffects.has(entityId)) {
      return false;
    }
    
    this.entityStatusEffects.set(entityId, []);
    return true;
  }
  
  /**
   * Get all status effects for an entity
   * @param {string} entityId - ID of the entity
   * @returns {Array} Array of active effects
   */
  getStatusEffects(entityId) {
    if (!entityId) {
      return [];
    }
    
    // Use global status effects manager if available
    if (global.statusEffectsManager) {
      return global.statusEffectsManager.getEffects(entityId);
    }
    
    // Fallback implementation
    if (!this.entityStatusEffects.has(entityId)) {
      return [];
    }
    
    return [...this.entityStatusEffects.get(entityId)];
  }
  
  /**
   * Check if an entity has a specific status effect
   * @param {string} entityId - ID of the entity
   * @param {string} effectType - Type of effect to check
   * @returns {boolean} Whether entity has the effect
   */
  hasStatusEffect(entityId, effectType) {
    if (!entityId || !effectType) {
      return false;
    }
    
    // Use global status effects manager if available
    if (global.statusEffectsManager) {
      return global.statusEffectsManager.hasEffect(entityId, effectType);
    }
    
    // Fallback implementation
    if (!this.entityStatusEffects.has(entityId)) {
      return false;
    }
    
    return this.entityStatusEffects.get(entityId).some(e => e.type === effectType);
  }
  
  /**
   * Get entities within a radius of a position
   * @param {string} worldId - ID of the world
   * @param {Object} position - Position {x, y, z}
   * @param {number} radius - Radius to check
   * @returns {Array} Array of entities within radius
   */
  getEntitiesInRange(worldId, position, radius) {
    // Return all entities that are within the specified radius
    const entitiesInWorld = [];
    
    for (const [entityId, entity] of this.entities.entries()) {
      if (entity.worldId === worldId) {
        const distance = this.calculateDistance(position, entity.position);
        if (distance <= radius) {
          entitiesInWorld.push(entity);
        }
      }
    }
    
    return entitiesInWorld;
  }
  
  /**
   * Calculate distance between two positions
   * @param {Object} pos1 - First position {x, y, z}
   * @param {Object} pos2 - Second position {x, y, z}
   * @returns {number} Distance between positions
   */
  calculateDistance(pos1, pos2) {
    return Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) +
      Math.pow(pos2.y - pos1.y, 2) +
      Math.pow(pos2.z - pos1.z, 2)
    );
  }
  
  /**
   * Remove an entity from the game
   * @param {string} entityId - ID of the entity to remove
   * @returns {boolean} Whether entity was removed successfully
   */
  removeEntity(entityId) {
    // ... existing entity removal code ...
    
    // Clear status effects
    this.clearStatusEffects(entityId);
    
    // ... existing cleanup ...
    
    return true;
  }
  
  /**
   * Update entity on server tick
   */
  update(dt) {
    // ... existing update code ...
    
    // Update status effects (if not using global manager)
    if (!global.statusEffectsManager) {
      this.updateStatusEffects(dt);
    }
    
    // ... existing update logic ...
  }
  
  /**
   * Update status effects for all entities
   * @param {number} dt - Delta time (ms)
   */
  updateStatusEffects(dt) {
    // Skip if using global manager
    if (global.statusEffectsManager) return;
    
    // Process each entity's effects
    for (const [entityId, effects] of this.entityStatusEffects.entries()) {
      if (!effects || effects.length === 0) continue;
      
      const effectsToRemove = [];
      
      // Update each effect
      for (let i = 0; i < effects.length; i++) {
        const effect = effects[i];
        
        // Reduce time left
        effect.timeLeft -= dt;
        
        // Process effect tick (could apply healing, damage, etc.)
        this.processEffectTick(entityId, effect);
        
        // Check if effect has expired
        if (effect.timeLeft <= 0) {
          effectsToRemove.push(i);
        }
      }
      
      // Remove expired effects (in reverse order)
      for (let i = effectsToRemove.length - 1; i >= 0; i--) {
        effects.splice(effectsToRemove[i], 1);
      }
    }
  }
  
  /**
   * Process a tick for a specific effect
   * @param {string} entityId - ID of the entity
   * @param {Object} effect - The effect to process
   */
  processEffectTick(entityId, effect) {
    const entity = this.entities.get(entityId);
    if (!entity) return;
    
    // Implement basic effect processing here
    // More complex effects would be handled by the global manager
    switch (effect.type) {
      case 'REGENERATION':
        // Heal every few ticks
        if (entity.health < entity.maxHealth && Math.random() < 0.1) {
          entity.health = Math.min(entity.maxHealth, entity.health + 1);
        }
        break;
      case 'POISON':
        // Damage every few ticks but don't kill
        if (entity.health > 1 && Math.random() < 0.1) {
          entity.health -= 1;
        }
        break;
      // Add more basic effects as needed
    }
  }
  
  // ... existing methods ...
} 