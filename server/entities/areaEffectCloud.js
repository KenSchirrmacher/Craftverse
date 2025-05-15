/**
 * AreaEffectCloud - Server-side implementation for lingering potion effect clouds
 */
const Entity = require('./entity');
const { v4: uuidv4 } = require('uuid');

class AreaEffectCloud extends Entity {
  /**
   * Create an area effect cloud entity
   * @param {string} id - Entity ID
   * @param {Object} options - Configuration options
   */
  constructor(id, options = {}) {
    const world = options.world || null;
    const entityId = id || uuidv4();
    
    // Initialize with entity properties
    super(world, {
      id: entityId,
      type: 'area_effect_cloud',
      position: options.position || { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 }, // Clouds don't move
      width: options.radius || 3,
      height: 0.5,
      gravity: 0, // No gravity
      drag: 0,
      ...options
    });
    
    // Cloud specific properties
    this.radius = options.radius || 3;
    this.color = options.color || '#FFFFFF';
    this.duration = options.duration || 600; // 30 seconds at 20 ticks/second
    this.effectType = options.effectType || 'NONE';
    this.ownerEntityId = options.ownerEntityId || null;
    this.effects = options.effects || [];
    
    // Tracking
    this.age = 0;
    this.affectedEntities = new Map(); // entityId -> lastAffectTime
    this.reapplicationDelay = options.reapplicationDelay || 20; // 1 second
  }
  
  /**
   * Update the entity state
   * @param {number} delta - Time elapsed since last update
   */
  update(delta) {
    // Increment age
    this.age += delta;
    
    // Check lifetime
    if (this.age >= this.duration) {
      this.remove();
      return;
    }
    
    // Apply effects to nearby entities
    this.applyEffectsToNearbyEntities();
    
    // Call parent update but skip physics
    this.emitUpdate();
  }
  
  /**
   * Apply effects to entities in the cloud
   */
  applyEffectsToNearbyEntities() {
    if (!this.world || this.effects.length === 0) return;
    
    // Get entities in radius
    const entities = this.world.getEntitiesInRadius(this.position, this.radius);
    
    for (const entity of entities) {
      // Skip entities without status effects system
      if (!entity.statusEffects) continue;
      
      // Check if enough time has passed to apply effects again
      const lastAffectTime = this.affectedEntities.get(entity.id) || 0;
      if (this.age - lastAffectTime < this.reapplicationDelay) continue;
      
      // Apply effects
      for (const effect of this.effects) {
        entity.statusEffects.addEffect({
          type: effect.type,
          duration: effect.duration,
          amplitude: effect.amplitude,
          source: this.ownerEntityId
        });
      }
      
      // Update last affect time
      this.affectedEntities.set(entity.id, this.age);
    }
  }
  
  /**
   * Serialize cloud data
   */
  serialize() {
    return {
      ...super.serialize(),
      radius: this.radius,
      color: this.color,
      duration: this.duration,
      effectType: this.effectType,
      ownerEntityId: this.ownerEntityId,
      effects: this.effects,
      age: this.age
    };
  }
  
  /**
   * Deserialize cloud data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.radius !== undefined) this.radius = data.radius;
    if (data.color) this.color = data.color;
    if (data.duration !== undefined) this.duration = data.duration;
    if (data.effectType) this.effectType = data.effectType;
    if (data.ownerEntityId) this.ownerEntityId = data.ownerEntityId;
    if (data.effects) this.effects = [...data.effects];
    if (data.age !== undefined) this.age = data.age;
  }
}

module.exports = AreaEffectCloud; 