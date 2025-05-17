/**
 * WindChargeEntity - Represents a wind charge projectile that can push blocks and entities
 * Part of the Minecraft 1.21 Tricky Trials Update
 */
const Entity = require('./entity');
const Vector3 = require('../math/vector3');
const AABB = require('../physics/aabb');
const { v4: uuidv4 } = require('uuid');

class WindChargeEntity extends Entity {
  /**
   * Create a wind charge entity
   * @param {string} id - Entity ID
   * @param {Object} options - Configuration options
   */
  constructor(id, options = {}) {
    const world = options.world || null;
    const entityId = id || uuidv4();
    
    // Calculate initial velocity based on the provided options
    let initialVelocity = { x: 0, y: 0, z: 0 };
    
    // Case 1: Velocity is provided as an object - use it directly
    if (options.velocity && typeof options.velocity === 'object') {
      initialVelocity = options.velocity;
    }
    // Case 2: Velocity is provided as a number, and direction is also provided
    else if (options.velocity && typeof options.velocity === 'number' && options.direction) {
      initialVelocity = {
        x: options.direction.x * options.velocity,
        y: options.direction.y * options.velocity,
        z: options.direction.z * options.velocity
      };
    }
    
    // Initialize with entity properties
    super(world, {
      id: entityId,
      type: 'wind_charge_entity',
      position: options.position || { x: 0, y: 0, z: 0 },
      velocity: initialVelocity,
      width: 0.3,
      height: 0.3,
      gravity: options.gravity || 0.03,
      drag: 0.01,
      ...options
    });
    
    // Wind charge specific properties
    this.shooter = options.shooter || null;
    this.damage = options.damage || 5;
    this.direction = options.direction || { x: 0, y: 0, z: 0 };
    this.moveDistance = options.moveDistance || 1;
    this.explosionRadius = options.radius || 1.5;
    this.hasExploded = false;
    this.particles = [];
    
    // Wind charge trail particles
    this.trailParticleDelay = 2; // Ticks between particle spawns
    this.trailParticleTimer = 0;
    
    // Maximum lifetime (in ticks)
    this.maxLifetime = 100; // 5 seconds at 20 ticks/second
    this.lifetime = 0;
    
    // Power level affects push strength
    this.powerLevel = options.powerLevel || 1.0;
    
    // Track entities already affected to prevent multiple hits
    this.affectedEntities = new Set();
    
    // Calculate bounding box
    this.boundingBox = this.calculateBoundingBox();
  }
  
  /**
   * Update the entity state
   * @param {number} delta - Time elapsed since last update
   */
  update(delta) {
    // Check lifetime
    this.lifetime += 1;
    
    if (this.lifetime > this.maxLifetime && !this.hasExploded) {
      this.explode();
      return;
    }
    
    // If the wind charge has exploded, no need to update
    if (this.hasExploded) {
      return;
    }
    
    // Update trail particles
    this.updateTrailParticles(delta);
    
    // Apply physics
    super.update(delta);
    
    // Check for collisions
    this.checkCollisions();
  }
  
  /**
   * Update trail particles
   * @param {number} delta - Time elapsed since last update
   */
  updateTrailParticles(delta) {
    this.trailParticleTimer += delta;
    
    if (this.trailParticleTimer >= this.trailParticleDelay) {
      this.trailParticleTimer = 0;
      
      // Add a new trail particle at current position
      this.particles.push({
        position: { ...this.position },
        lifetime: 10, // 0.5 seconds at 20 ticks/second
        size: 0.2,
        color: '#a0e6ff' // Light blue color for wind particles
      });
    }
    
    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.lifetime -= delta;
      
      if (particle.lifetime <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  /**
   * Check for collisions with blocks or entities
   */
  checkCollisions() {
    if (!this.world) return;
    
    // Check if we hit a block
    const blockPos = this.getBlockPosition();
    const block = this.world.getBlock(blockPos.x, blockPos.y, blockPos.z);
    
    if (block && block.isSolid) {
      this.explode();
      return;
    }
    
    // Check for entity collisions
    // Only check entities that can be affected and aren't the shooter
    const nearbyEntities = this.getNearbyEntities(0.5);
    
    for (const entity of nearbyEntities) {
      if (entity.id === this.id || (this.shooter && entity.id === this.shooter)) {
        continue;
      }
      
      // Skip already affected entities
      if (this.affectedEntities.has(entity.id)) {
        continue;
      }
      
      // Check for collision with entity
      if (entity.boundingBox) {
        const entityIntersects = this.intersectsWith(entity.boundingBox);
        if (entityIntersects) {
          this.hitEntity(entity);
          this.affectedEntities.add(entity.id);
          return;
        }
      }
    }
  }
  
  /**
   * Check if wind charge intersects with another box
   * @param {Object} box - Bounding box to check against
   * @returns {boolean} Whether the boxes intersect
   */
  intersectsWith(box) {
    return (
      this.boundingBox.min.x < box.max.x &&
      this.boundingBox.max.x > box.min.x &&
      this.boundingBox.min.y < box.max.y &&
      this.boundingBox.max.y > box.min.y &&
      this.boundingBox.min.z < box.max.z &&
      this.boundingBox.max.z > box.min.z
    );
  }
  
  /**
   * Get nearby entities
   * @param {number} radius - Search radius
   * @returns {Entity[]} Array of nearby entities
   */
  getNearbyEntities(radius) {
    if (!this.world) return [];
    
    return this.world.getEntitiesInRadius(this.position, radius);
  }
  
  /**
   * Get the current block position
   * @returns {Object} Block position
   */
  getBlockPosition() {
    return {
      x: Math.floor(this.position.x),
      y: Math.floor(this.position.y),
      z: Math.floor(this.position.z)
    };
  }
  
  /**
   * Handle hitting an entity
   * @param {Entity} entity - The entity hit
   */
  hitEntity(entity) {
    // Apply damage
    if (typeof entity.takeDamage === 'function') {
      entity.takeDamage(this.damage, this);
    } else if (entity.health !== undefined) {
      entity.health -= this.damage;
      if (entity.health <= 0) {
        entity.dead = true;
      }
    }
    
    // Apply knockback in direction of wind charge travel
    this.applyKnockback(entity);
    
    // Explode on impact
    this.explode();
  }
  
  /**
   * Apply knockback to an entity
   * @param {Entity} entity - The entity to knock back
   */
  applyKnockback(entity) {
    if (!entity.velocity) return;
    
    // Calculate knockback power based on power level
    const knockbackPower = 1.0 + (this.powerLevel * 0.5);
    
    // Apply knockback in the direction of travel
    entity.velocity.x += this.direction.x * knockbackPower;
    entity.velocity.y += (this.direction.y * 0.5 + 0.4) * knockbackPower; // Add upward component
    entity.velocity.z += this.direction.z * knockbackPower;
    
    // Set entity as affected by wind charge
    entity.windAffectedTime = 20; // 1 second of being affected
  }
  
  /**
   * Explode the wind charge
   */
  explode() {
    if (this.hasExploded) return;
    
    this.hasExploded = true;
    this.velocity = { x: 0, y: 0, z: 0 };
    
    // Apply explosion effects to blocks and entities in radius
    this.applyExplosionEffects();
    
    // Remove after explosion effects are applied
    setTimeout(() => this.remove(), 1000); // Keep entity around briefly for client effects
    
    // Notify clients
    this.emitUpdate();
  }
  
  /**
   * Apply explosion effects to blocks and entities in radius
   */
  applyExplosionEffects() {
    if (!this.world) return;
    
    // Move nearby blocks if possible
    this.tryMoveBlocks();
    
    // Affect nearby entities with wind push
    const entities = this.getNearbyEntities(this.explosionRadius);
    
    for (const entity of entities) {
      // Skip entities that are already affected
      if (this.affectedEntities.has(entity.id)) {
        continue;
      }
      
      // Skip the shooter
      if (this.shooter && entity.id === this.shooter) {
        continue;
      }
      
      // Calculate distance factor (closer = stronger effect)
      const distance = this.distanceTo(entity.position);
      const distanceFactor = 1.0 - (distance / this.explosionRadius);
      
      // Skip if too far away
      if (distanceFactor <= 0) continue;
      
      // Apply reduced knockback based on distance
      if (entity.velocity) {
        const knockbackPower = distanceFactor * 0.8 * this.powerLevel;
        
        // Direction from explosion center to entity
        const dx = entity.position.x - this.position.x;
        const dy = entity.position.y - this.position.y;
        const dz = entity.position.z - this.position.z;
        
        // Normalize direction
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        
        // Apply knockback
        entity.velocity.x += (dx / length) * knockbackPower;
        entity.velocity.y += ((dy / length) * 0.5 + 0.3) * knockbackPower; // Add upward component
        entity.velocity.z += (dz / length) * knockbackPower;
        
        // Set entity as affected by wind charge
        entity.windAffectedTime = 10; // 0.5 seconds of being affected
        this.affectedEntities.add(entity.id);
      }
      
      // Apply small damage to entities very close to the explosion
      if (distanceFactor > 0.7 && typeof entity.takeDamage === 'function') {
        entity.takeDamage(this.damage * distanceFactor * 0.5, this);
      }
    }
  }
  
  /**
   * Try to move blocks affected by the wind charge
   */
  tryMoveBlocks() {
    if (!this.world) return;
    
    // Only move certain block types (e.g., sand, gravel, concrete powder)
    const movableBlockTypes = [
      'sand', 'red_sand', 'gravel', 'concrete_powder'
    ];
    
    // Get blocks within effect radius
    const radius = Math.ceil(this.explosionRadius);
    const blockPos = this.getBlockPosition();
    
    // Track blocks that have been moved to prevent moving the same block multiple times
    const movedBlocks = new Set();
    
    for (let x = blockPos.x - radius; x <= blockPos.x + radius; x++) {
      for (let y = blockPos.y - radius; y <= blockPos.y + radius; y++) {
        for (let z = blockPos.z - radius; z <= blockPos.z + radius; z++) {
          const blockKey = `${x},${y},${z}`;
          
          // Skip blocks that have already been moved
          if (movedBlocks.has(blockKey)) continue;
          
          // Check if in radius
          const dx = x - this.position.x;
          const dy = y - this.position.y;
          const dz = z - this.position.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (distance > this.explosionRadius) continue;
          
          // Get block and check if movable
          const block = this.world.getBlock(x, y, z);
          if (!block || !movableBlockTypes.includes(block.type)) continue;
          
          // Calculate move direction (away from explosion center)
          const direction = {
            x: Math.sign(dx) || 0, // Ensure we don't get NaN with || 0
            y: Math.sign(dy) || 0,
            z: Math.sign(dz) || 0
          };
          
          // Try to move block by up to this.moveDistance blocks
          let moved = false;
          for (let i = 1; i <= this.moveDistance && !moved; i++) {
            const newX = x + direction.x * i;
            const newY = y + direction.y * i;
            const newZ = z + direction.z * i;
            const newBlockKey = `${newX},${newY},${newZ}`;
            
            // Skip if this position has already been filled
            if (movedBlocks.has(newBlockKey)) continue;
            
            // Check if target position is air
            const targetBlock = this.world.getBlock(newX, newY, newZ);
            if (!targetBlock || targetBlock.type === 'air') {
              // Move the block
              this.world.setBlock(newX, newY, newZ, { ...block });
              this.world.setBlock(x, y, z, { type: 'air' });
              
              // Mark source and target as processed
              movedBlocks.add(blockKey);
              movedBlocks.add(newBlockKey);
              
              moved = true;
            }
          }
        }
      }
    }
  }
  
  /**
   * Calculate distance to a position
   * @param {Object} position - Position to calculate distance to
   * @returns {number} Distance
   */
  distanceTo(position) {
    const dx = this.position.x - position.x;
    const dy = this.position.y - position.y;
    const dz = this.position.z - position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Emit update event with current state
   */
  emitUpdate() {
    this.emit('update', this.serialize());
  }
  
  /**
   * Remove the entity
   */
  remove() {
    this.emit('remove', this.id);
    super.remove();
  }
  
  /**
   * Serialize the entity for network transmission
   * @returns {Object} Serialized entity data
   */
  serialize() {
    return {
      ...super.serialize(),
      shooter: this.shooter,
      damage: this.damage,
      direction: this.direction,
      moveDistance: this.moveDistance,
      explosionRadius: this.explosionRadius,
      hasExploded: this.hasExploded,
      particles: this.particles.map(p => ({ ...p })),
      powerLevel: this.powerLevel
    };
  }
  
  /**
   * Create a wind charge entity from serialized data
   * @param {Object} data - Serialized entity data
   * @returns {WindChargeEntity} Wind charge entity instance
   */
  static deserialize(data) {
    const entity = new WindChargeEntity(data.id, {
      position: data.position,
      direction: data.direction,
      velocity: data.velocity,
      shooter: data.shooter,
      damage: data.damage,
      moveDistance: data.moveDistance,
      radius: data.explosionRadius,
      powerLevel: data.powerLevel
    });
    
    entity.hasExploded = data.hasExploded || false;
    entity.particles = data.particles ? [...data.particles] : [];
    entity.lifetime = data.lifetime || 0;
    
    return entity;
  }
}

module.exports = WindChargeEntity; 