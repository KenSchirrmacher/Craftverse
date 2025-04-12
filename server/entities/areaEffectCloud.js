/**
 * AreaEffectCloud - Entity for lingering potion effects
 */

const Entity = require('./entity');

class AreaEffectCloud extends Entity {
  constructor(id, options = {}) {
    super(id, {
      type: 'area_effect_cloud',
      ...options
    });
    
    // Cloud properties
    this.radius = options.radius || 3.0;
    this.color = options.color || '#FFFFFF';
    this.duration = options.duration || 600; // 30 seconds at 20 ticks/sec
    this.waitTime = options.waitTime || 10; // Wait 10 ticks before first application
    this.reapplicationDelay = options.reapplicationDelay || 20; // Apply effects every 20 ticks
    this.durationOnUse = options.durationOnUse || -0.5; // Reduce duration by 0.5 ticks per use
    this.radiusOnUse = options.radiusOnUse || -0.005; // Reduce radius slightly on use
    this.radiusPerTick = options.radiusPerTick || -0.005; // Reduce radius over time
    this.particlesPerTick = options.particlesPerTick || 2; // Particles to spawn per tick
    
    // Effect history - track entity IDs that have received effects
    this.affectedEntities = new Map(); // entityId -> last application tick
    
    // Store effects
    this.effects = options.effects || [];
    
    // Track ticks
    this.ticksExisted = 0;
  }
  
  /**
   * Update the area effect cloud
   * @param {Object} world - The world
   * @param {number} dt - Time since last update in ms
   */
  update(world, dt) {
    if (!world) return;
    
    // Increment ticks
    this.ticksExisted++;
    
    // Decrement duration
    this.duration -= dt / 50; // Convert ms to ticks
    
    // Check if cloud should be removed
    if (this.duration <= 0 || this.radius <= 0.1) {
      this.remove(world);
      return;
    }
    
    // Apply effects to entities if past wait time
    if (this.ticksExisted > this.waitTime) {
      // Check if it's time to apply effects
      if (this.ticksExisted % this.reapplicationDelay === 0) {
        this.applyEffectsToEntities(world);
      }
    }
    
    // Update radius
    this.radius += this.radiusPerTick;
    if (this.radius < 0.1) {
      this.radius = 0.1;
    }
    
    // Spawn particles
    this.spawnParticles(world);
  }
  
  /**
   * Apply effects to entities in range
   * @param {Object} world - The world
   */
  applyEffectsToEntities(world) {
    // Skip if no entity manager
    if (!world.entityManager) return;
    
    // Get entities in range
    const entitiesInRange = world.entityManager.getEntitiesInRange(
      world.id,
      this.position,
      this.radius
    );
    
    // Track affected entities in this application
    const newlyAffected = [];
    
    // Apply effects to each entity
    for (const entity of entitiesInRange) {
      // Skip entities that were recently affected
      const lastAffected = this.affectedEntities.get(entity.id) || 0;
      if (this.ticksExisted - lastAffected < this.reapplicationDelay) {
        continue;
      }
      
      // Apply each effect
      for (const effect of this.effects) {
        // Calculate distance-based effect scaling
        const distance = this.calculateDistance(this.position, entity.position);
        const distanceFactor = 1 - (distance / this.radius);
        
        // Scale duration and level based on distance
        const scaledDuration = Math.floor(effect.duration * distanceFactor);
        const scaledLevel = Math.max(1, Math.floor(effect.level * distanceFactor));
        
        // Add the effect to the entity
        if (world.entityManager.addStatusEffect) {
          world.entityManager.addStatusEffect(entity.id, {
            type: effect.type,
            level: scaledLevel,
            duration: scaledDuration,
            source: 'lingering_potion'
          });
        }
      }
      
      // Record that this entity was affected
      this.affectedEntities.set(entity.id, this.ticksExisted);
      newlyAffected.push(entity.id);
    }
    
    // Adjust duration and radius based on use
    if (newlyAffected.length > 0) {
      this.duration += this.durationOnUse * newlyAffected.length;
      this.radius += this.radiusOnUse * newlyAffected.length;
    }
  }
  
  /**
   * Spawn particles for the effect cloud
   * @param {Object} world - The world
   */
  spawnParticles(world) {
    // Skip if no particle system
    if (!world.addParticleEffect) return;
    
    // Determine how many particles to spawn this tick
    const particlesToSpawn = this.particlesPerTick;
    
    // Spawn particles around the cloud
    for (let i = 0; i < particlesToSpawn; i++) {
      // Calculate a random position within the cloud
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.radius;
      
      const particleX = this.position.x + Math.cos(angle) * distance;
      const particleY = this.position.y + (Math.random() * 0.5);
      const particleZ = this.position.z + Math.sin(angle) * distance;
      
      world.addParticleEffect({
        type: 'EFFECT_CLOUD',
        position: {
          x: particleX,
          y: particleY,
          z: particleZ
        },
        color: this.color,
        count: 1,
        spread: { x: 0.05, y: 0.05, z: 0.05 },
        velocity: { x: 0, y: 0.02, z: 0 }
      });
    }
  }
  
  /**
   * Calculate distance between two positions
   * @param {Object} pos1 - First position
   * @param {Object} pos2 - Second position
   * @returns {number} - Distance
   */
  calculateDistance(pos1, pos2) {
    return Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) +
      Math.pow(pos2.y - pos1.y, 2) +
      Math.pow(pos2.z - pos1.z, 2)
    );
  }
  
  /**
   * Remove the entity from the world
   * @param {Object} world - The world
   */
  remove(world) {
    if (world && world.removeEntity) {
      world.removeEntity(this.id);
    }
  }
  
  /**
   * Convert to network data for clients
   * @returns {Object} - Data for network transmission
   */
  toNetworkData() {
    return {
      ...super.toNetworkData(),
      radius: this.radius,
      color: this.color,
      duration: this.duration,
      effects: this.effects.map(effect => ({
        type: effect.type,
        level: effect.level,
        duration: effect.duration
      }))
    };
  }
}

module.exports = AreaEffectCloud; 