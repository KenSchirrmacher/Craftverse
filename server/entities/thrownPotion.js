/**
 * ThrownPotion - Server-side implementation for thrown potion entities
 */
const Entity = require('./entity');
const Vector3 = require('../math/vector3');
const AABB = require('../physics/aabb');
const { v4: uuidv4 } = require('uuid');

class ThrownPotion extends Entity {
  /**
   * Create a thrown potion entity
   * @param {string} id - Entity ID
   * @param {Object} options - Configuration options
   */
  constructor(id, options = {}) {
    const world = options.world || null;
    const entityId = id || uuidv4();
    
    // Initialize with entity properties
    super(world, {
      id: entityId,
      type: 'thrown_potion',
      position: options.position || { x: 0, y: 0, z: 0 },
      velocity: options.velocity || { x: 0, y: 0, z: 0 },
      width: 0.25,
      height: 0.25,
      gravity: 0.05,
      drag: 0.01,
      ...options
    });
    
    // Potion specific properties
    this.thrower = options.thrower || null;
    this.potionType = options.potionType || 'WATER';
    this.potionItem = options.potionItem || null;
    this.isSplash = options.isSplash || false;
    this.isLingering = options.isLingering || false;
    this.color = options.color || '#0000FF';
    this.effectRadius = this.isLingering ? 4 : this.isSplash ? 3 : 0;
    this.hasBroken = false;
    
    // Maximum lifetime (in ticks)
    this.maxLifetime = 600; // 30 seconds at 20 ticks/second
    this.lifetime = 0;
    
    // Duration for lingering potions
    this.lingeringDuration = this.isLingering ? 400 : 0; // 20 seconds at 20 ticks/second
    this.lingeringTick = 0;
    this.lingeringEntities = new Map();
    
    // Track entities already affected (to avoid multiple applications)
    this.affectedEntities = new Set();
  }
  
  /**
   * Update the entity state
   * @param {number} delta - Time elapsed since last update
   */
  update(delta) {
    // Check lifetime
    this.lifetime += 1;
    
    if (this.lifetime > this.maxLifetime && !this.hasBroken) {
      this.remove();
      return;
    }
    
    // If the potion has broken and is lingering, process lingering effects
    if (this.hasBroken && this.isLingering) {
      this.updateLingeringEffect();
      return;
    }
    
    // If the potion has broken but isn't lingering, no need to update
    if (this.hasBroken) {
      return;
    }
    
    // Apply physics
    super.update(delta);
    
    // Check for collisions
    this.checkCollisions();
  }
  
  /**
   * Check for collisions with blocks or entities
   */
  checkCollisions() {
    // Check if we hit a block
    const blockPos = this.position.floor();
    const block = this.world.getBlock(blockPos.x, blockPos.y, blockPos.z);
    
    if (block && block.isSolid) {
      this.breakPotion();
      return;
    }
    
    // Check for ground collision
    if (this.onGround) {
      this.breakPotion();
      return;
    }
    
    // Check for entity collisions
    // Only check entities that can be affected by potions and aren't the thrower
    const nearbyEntities = this.world.getEntitiesInRadius(this.position, 0.5);
    
    for (const entity of nearbyEntities) {
      if (entity.id === this.id || (this.thrower && entity.id === this.thrower.id)) {
        continue;
      }
      
      if (entity.boundingBox && this.boundingBox.intersects(entity.boundingBox)) {
        this.breakPotion();
        return;
      }
    }
  }
  
  /**
   * Break the potion and apply effects
   */
  breakPotion() {
    if (this.hasBroken) return;
    
    this.hasBroken = true;
    this.velocity = new Vector3(0, 0, 0);
    
    // Apply potion effects to entities in range
    this.applyPotionEffects();
    
    // If not a lingering potion, remove after effects are applied
    if (!this.isLingering) {
      setTimeout(() => this.remove(), 2000); // Keep entity around briefly for client effects
    }
    
    // Notify clients
    this.emitUpdate();
  }
  
  /**
   * Apply potion effects to entities in range
   */
  applyPotionEffects() {
    // Skip if no potion item
    if (!this.potionItem) return;
    
    // Get the effects from the potion
    const effects = this.potionItem.effects || [];
    if (effects.length === 0) return;
    
    // Get entities in range
    const entities = this.world.getEntitiesInRadius(this.position, this.effectRadius);
    
    // Process each entity
    for (const entity of entities) {
      // Skip if this entity is the thrower and it's a negative effect
      if (this.thrower && entity.id === this.thrower.id && this.hasNegativeEffects(effects)) {
        if (!this.isSplash && !this.isLingering) {
          // Only skip for direct hit potions - splash and lingering affect the thrower
          continue;
        }
      }
      
      // Skip if already affected (for non-lingering potions)
      if (!this.isLingering && this.affectedEntities.has(entity.id)) {
        continue;
      }
      
      // Calculate distance factor (closer = stronger effect)
      let distanceFactor = 1.0;
      
      if (this.isSplash || this.isLingering) {
        const distance = this.position.distanceTo(entity.position);
        distanceFactor = 1.0 - (distance / this.effectRadius);
        
        // Skip if too far away
        if (distanceFactor <= 0) continue;
      }
      
      // Apply effects to the entity
      this.applyEffectsToEntity(entity, effects, distanceFactor);
      
      // Mark as affected
      this.affectedEntities.add(entity.id);
      
      // For lingering potions, track affected entities
      if (this.isLingering) {
        this.lingeringEntities.set(entity.id, {
          entity: entity,
          lastApplied: 0
        });
      }
    }
  }
  
  /**
   * Check if potion has any negative effects
   * @param {Array} effects - List of effects
   * @returns {boolean} - True if has negative effects
   */
  hasNegativeEffects(effects) {
    const negativeTypes = [
      'POISON', 'WITHER', 'HARM', 'SLOWNESS', 'WEAKNESS', 'MINING_FATIGUE'
    ];
    
    return effects.some(effect => negativeTypes.includes(effect.type));
  }
  
  /**
   * Apply potion effects to a specific entity
   * @param {Object} entity - Target entity
   * @param {Array} effects - List of effects to apply
   * @param {number} distanceFactor - Factor based on distance (0-1)
   */
  applyEffectsToEntity(entity, effects, distanceFactor = 1.0) {
    // Skip if entity doesn't have status effects
    if (!entity.statusEffects) return;
    
    // Calculate duration modifier based on potion type
    let durationModifier = 1.0;
    if (this.isSplash) durationModifier = 0.75;
    if (this.isLingering) durationModifier = 0.25;
    
    // Apply each effect
    for (const effect of effects) {
      // Skip if no type
      if (!effect.type) continue;
      
      // Calculate adjusted duration and amplitude
      const duration = Math.floor(effect.duration * durationModifier * distanceFactor);
      let amplitude = effect.amplitude;
      
      // For lingering potions, reduce amplitude
      if (this.isLingering) {
        amplitude = Math.max(1, amplitude - 1);
      }
      
      // Add effect to entity
      entity.statusEffects.addEffect({
        type: effect.type,
        duration: duration,
        amplitude: amplitude,
        source: this.thrower ? this.thrower.id : null
      });
    }
  }
  
  /**
   * Update lingering effect over time
   */
  updateLingeringEffect() {
    // Increment lingering tick
    this.lingeringTick++;
    
    // Check if lingering effect is finished
    if (this.lingeringTick >= this.lingeringDuration) {
      this.remove();
      return;
    }
    
    // Every 5 ticks (1/4 second), refresh entities in range and apply effects
    if (this.lingeringTick % 5 === 0) {
      const entities = this.world.getEntitiesInRadius(this.position, this.effectRadius);
      
      // Update list of entities in range
      const currentEntityIds = new Set(entities.map(e => e.id));
      
      // Remove entities that are no longer in range
      for (const [entityId, data] of this.lingeringEntities.entries()) {
        if (!currentEntityIds.has(entityId)) {
          this.lingeringEntities.delete(entityId);
        }
      }
      
      // Add new entities
      for (const entity of entities) {
        if (!this.lingeringEntities.has(entity.id)) {
          this.lingeringEntities.set(entity.id, {
            entity: entity,
            lastApplied: 0
          });
        }
      }
      
      // Every 40 ticks (2 seconds), apply effects to entities in range
      if (this.lingeringTick % 40 === 0) {
        // Get the effects from the potion
        const effects = this.potionItem.effects || [];
        if (effects.length === 0) return;
        
        // Apply effects to entities in range
        for (const [entityId, data] of this.lingeringEntities.entries()) {
          const entity = data.entity;
          const distanceFactor = 1.0 - (this.position.distanceTo(entity.position) / this.effectRadius);
          
          // Skip if too far away
          if (distanceFactor <= 0) continue;
          
          // Apply effects to entity
          this.applyEffectsToEntity(entity, effects, distanceFactor);
          
          // Update last applied time
          data.lastApplied = this.lingeringTick;
        }
      }
    }
    
    // Emit occasional updates to clients to show lingering effect
    if (this.lingeringTick % 20 === 0) {
      this.emitUpdate();
    }
  }
  
  /**
   * Emit update to clients
   */
  emitUpdate() {
    if (!this.world || !this.world.server) return;
    
    this.world.server.broadcast('entity:update', {
      id: this.id,
      type: 'thrown_potion',
      position: this.position.toArray(),
      velocity: this.velocity.toArray(),
      potionType: this.potionType,
      color: this.color,
      isSplash: this.isSplash,
      isLingering: this.isLingering,
      hasBroken: this.hasBroken
    });
  }
  
  /**
   * Handle removing the entity
   */
  remove() {
    // Notify clients that entity is removed
    if (this.world && this.world.server) {
      this.world.server.broadcast('entity:remove', {
        id: this.id
      });
    }
    
    // Remove from world
    if (this.world) {
      this.world.removeEntity(this.id);
    }
  }
  
  /**
   * Serialize entity for saving
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      potionType: this.potionType,
      isSplash: this.isSplash,
      isLingering: this.isLingering,
      color: this.color,
      hasBroken: this.hasBroken,
      lifetime: this.lifetime,
      lingeringTick: this.lingeringTick
    };
  }
  
  /**
   * Deserialize potion data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.potionType) this.potionType = data.potionType;
    if (data.isSplash !== undefined) this.isSplash = data.isSplash;
    if (data.isLingering !== undefined) this.isLingering = data.isLingering;
    if (data.color) this.color = data.color;
    if (data.hasBroken !== undefined) this.hasBroken = data.hasBroken;
  }
}

module.exports = ThrownPotion;