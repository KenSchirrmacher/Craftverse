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
    
    // Charge level properties
    this.chargeLevel = options.chargeLevel || 0;
    this.chargeName = options.chargeName || 'weak';
    
    // Wind charge trail particles
    this.trailParticleDelay = 2; // Ticks between particle spawns
    this.trailParticleTimer = 0;
    
    // Maximum lifetime (in ticks)
    this.maxLifetime = 100; // 5 seconds at 20 ticks/second
    this.lifetime = 0;
    
    // Power level affects push strength (now based on charge level)
    this.powerLevel = options.powerLevel || (1.0 + (this.chargeLevel * 0.5));
    
    // Track entities already affected to prevent multiple hits
    this.affectedEntities = new Set();
    
    // Calculate bounding box
    this.boundingBox = this.calculateBoundingBox();
    
    // Charge level visual effects
    this.particleColors = ['#a0e6ff', '#80d0ff', '#60b8ff']; // Colors for weak, medium, strong
    this.particleSizes = [0.2, 0.3, 0.4]; // Sizes for weak, medium, strong
    this.particleDensity = [1, 1.5, 2]; // Multiplier for particle count
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
    
    // Adjust particle spawning rate based on charge level
    const baseDelay = this.trailParticleDelay;
    const adjustedDelay = baseDelay / (1 + (this.chargeLevel * 0.5));
    
    if (this.trailParticleTimer >= adjustedDelay) {
      this.trailParticleTimer = 0;
      
      // Get particle appearance based on charge level
      const color = this.particleColors[Math.min(this.chargeLevel, this.particleColors.length - 1)];
      const size = this.particleSizes[Math.min(this.chargeLevel, this.particleSizes.length - 1)];
      const density = this.particleDensity[Math.min(this.chargeLevel, this.particleDensity.length - 1)];
      
      // Add particles (more particles for higher charge levels)
      const particleCount = Math.ceil(density);
      for (let i = 0; i < particleCount; i++) {
        // Add random offset for multiple particles
        const offset = particleCount > 1 ? {
          x: (Math.random() - 0.5) * 0.2,
          y: (Math.random() - 0.5) * 0.2,
          z: (Math.random() - 0.5) * 0.2
        } : { x: 0, y: 0, z: 0 };
        
        this.particles.push({
          position: { 
            x: this.position.x + offset.x, 
            y: this.position.y + offset.y, 
            z: this.position.z + offset.z 
          },
          lifetime: 10 + this.chargeLevel * 5, // Particles last longer at higher charge levels
          size: size,
          color: color
        });
      }
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
    
    // Scale radius based on charge level for direct hit detection
    const scaledRadius = radius * (1 + (this.chargeLevel * 0.2));
    
    return this.world.getEntitiesInRadius(this.position, scaledRadius);
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
    
    // Add to affected entities to prevent multiple hits
    this.affectedEntities.add(entity.id);
  }
  
  /**
   * Explode the wind charge
   */
  explode() {
    if (this.hasExploded) return;
    
    this.hasExploded = true;
    
    // Apply explosion effects in the world
    if (this.world) {
      this.applyExplosionEffects();
      
      // Trigger chain reaction with nearby wind charges
      this.triggerChainReaction();
    }
    
    // Emit update for clients
    this.emitUpdate();
    
    // Schedule removal
    setTimeout(() => {
      this.remove();
    }, 500); // Remove after 0.5 seconds
  }
  
  /**
   * Apply explosion effects to nearby entities and blocks
   */
  applyExplosionEffects() {
    // Scale explosion radius based on charge level
    const scaledRadius = this.explosionRadius;
    
    // Get affected entities
    const affectedEntities = this.world.getEntitiesInRadius(this.position, scaledRadius);
    
    // Apply explosion effects to entities
    for (const entity of affectedEntities) {
      // Skip already affected entities
      if (this.affectedEntities.has(entity.id)) {
        continue;
      }
      
      // Skip the shooter
      if (this.shooter && entity.id === this.shooter) {
        continue;
      }
      
      // Calculate distance factor (1.0 at center, 0.0 at edge)
      const distance = this.distanceTo(entity.position);
      const distanceFactor = 1.0 - (distance / scaledRadius);
      
      if (distanceFactor <= 0) {
        continue;
      }
      
      // Apply scaled damage based on distance
      const scaledDamage = this.damage * distanceFactor * 0.5; // Less damage than direct hit
      
      if (typeof entity.takeDamage === 'function') {
        entity.takeDamage(scaledDamage, this);
      } else if (entity.health !== undefined) {
        entity.health -= scaledDamage;
        if (entity.health <= 0) {
          entity.dead = true;
        }
      }
      
      // Apply knockback if entity has velocity
      if (entity.velocity) {
        // Calculate direction from explosion to entity
        const dx = entity.position.x - this.position.x;
        const dy = entity.position.y - this.position.y;
        const dz = entity.position.z - this.position.z;
        
        // Normalize direction
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const direction = {
          x: dx / length,
          y: dy / length,
          z: dz / length
        };
        
        // Calculate knockback power based on distance and charge level
        const knockbackPower = (1.0 + (this.powerLevel * 0.3)) * distanceFactor;
        
        // Apply knockback in the direction away from explosion
        entity.velocity.x += direction.x * knockbackPower;
        entity.velocity.y += (direction.y * 0.5 + 0.4) * knockbackPower; // Add upward component
        entity.velocity.z += direction.z * knockbackPower;
      }
      
      // Add to affected entities to prevent multiple hits
      this.affectedEntities.add(entity.id);
    }
    
    // Try to move blocks based on charge level and explosion radius
    this.tryMoveBlocks();
  }
  
  /**
   * Try to move blocks affected by the wind charge
   */
  tryMoveBlocks() {
    // Scale move distance based on charge level
    const scaledMoveDistance = this.moveDistance;
    
    // Get block positions within range
    const blockPositions = [];
    const radius = Math.ceil(this.explosionRadius);
    
    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        for (let z = -radius; z <= radius; z++) {
          const blockX = Math.floor(this.position.x) + x;
          const blockY = Math.floor(this.position.y) + y;
          const blockZ = Math.floor(this.position.z) + z;
          
          // Calculate distance from explosion center
          const dx = this.position.x - (blockX + 0.5);
          const dy = this.position.y - (blockY + 0.5);
          const dz = this.position.z - (blockZ + 0.5);
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          // Only consider blocks within the explosion radius
          if (distance <= this.explosionRadius) {
            blockPositions.push({
              x: blockX,
              y: blockY,
              z: blockZ,
              distance: distance,
              // Moving distance factor - more movement for closer blocks
              moveFactor: 1.0 - (distance / this.explosionRadius)
            });
          }
        }
      }
    }
    
    // Sort blocks by distance (farthest first to avoid overwriting)
    blockPositions.sort((a, b) => b.distance - a.distance);
    
    // Process blocks
    const interactionResults = [];
    
    for (const blockPos of blockPositions) {
      const block = this.world.getBlock(blockPos.x, blockPos.y, blockPos.z);
      
      // Skip air blocks
      if (!block || block.type === 'air') {
        continue;
      }
      
      // Skip immovable blocks based on type or properties
      if (block.immovable || ['bedrock', 'obsidian'].includes(block.type)) {
        continue;
      }
      
      // Calculate actual move distance for this block based on moveFactor
      const actualMoveDistance = Math.ceil(scaledMoveDistance * blockPos.moveFactor);
      
      if (actualMoveDistance <= 0) {
        continue;
      }
      
      // Calculate move direction based on explosion direction
      const moveX = Math.round(this.direction.x * actualMoveDistance);
      const moveY = Math.round(this.direction.y * actualMoveDistance);
      const moveZ = Math.round(this.direction.z * actualMoveDistance);
      
      // Special interaction based on block type
      const interaction = this.getBlockInteraction(block.type, blockPos, {
        x: blockPos.x + moveX,
        y: blockPos.y + moveY,
        z: blockPos.z + moveZ
      }, blockPos.moveFactor);
      
      // Apply interaction result
      if (interaction.action === 'move') {
        // Standard move behavior - move block to target position
        const targetX = blockPos.x + moveX;
        const targetY = blockPos.y + moveY;
        const targetZ = blockPos.z + moveZ;
        
        const targetBlock = this.world.getBlock(targetX, targetY, targetZ);
        
        if (!targetBlock || targetBlock.type === 'air') {
          // Move the block
          this.world.setBlock(targetX, targetY, targetZ, { ...block });
          this.world.setBlock(blockPos.x, blockPos.y, blockPos.z, { type: 'air' });
          
          // Track the interaction for visual effects
          interactionResults.push({
            type: 'move',
            from: { x: blockPos.x, y: blockPos.y, z: blockPos.z },
            to: { x: targetX, y: targetY, z: targetZ },
            blockType: block.type
          });
        }
      } else if (interaction.action === 'transform') {
        // Transform the block in place
        this.world.setBlock(blockPos.x, blockPos.y, blockPos.z, interaction.result);
        
        // Track the transformation for visual effects
        interactionResults.push({
          type: 'transform',
          position: { x: blockPos.x, y: blockPos.y, z: blockPos.z },
          from: block.type,
          to: interaction.result.type
        });
      } else if (interaction.action === 'activate') {
        // Activate the block (like buttons, levers, etc.)
        if (this.world.activateBlock) {
          this.world.activateBlock(blockPos.x, blockPos.y, blockPos.z);
        }
        
        // Track the activation for visual effects
        interactionResults.push({
          type: 'activate',
          position: { x: blockPos.x, y: blockPos.y, z: blockPos.z },
          blockType: block.type
        });
      } else if (interaction.action === 'break') {
        // Break the block and spawn drops
        this.world.setBlock(blockPos.x, blockPos.y, blockPos.z, { type: 'air' });
        
        // Track the breakage for visual effects
        interactionResults.push({
          type: 'break',
          position: { x: blockPos.x, y: blockPos.y, z: blockPos.z },
          blockType: block.type
        });
      }
    }
    
    // Return interaction results for effects processing
    return interactionResults;
  }
  
  /**
   * Determine special block interaction based on block type
   * @param {string} blockType - Type of block
   * @param {Object} position - Current position of the block
   * @param {Object} targetPosition - Potential target position
   * @param {number} forceFactor - Force factor (0-1) based on distance from explosion
   * @returns {Object} Interaction instructions
   */
  getBlockInteraction(blockType, position, targetPosition, forceFactor) {
    // Default is standard movement behavior
    const defaultInteraction = {
      action: 'move'
    };
    
    // Light blocks like leaves, flowers, etc. move with more force
    const lightBlocks = [
      'leaves', 'mangrove_leaves', 'cherry_leaves', 'azalea_leaves', 
      'flower', 'tall_grass', 'grass', 'fern', 'dead_bush', 'seagrass',
      'vine', 'lily_pad', 'snow_layer', 'scaffolding', 'bamboo'
    ];
    
    if (lightBlocks.some(type => blockType.includes(type))) {
      // Light blocks move farther or break with high force
      if (forceFactor > 0.7) {
        return { action: 'break' };
      }
      return defaultInteraction;
    }
    
    // Heavy blocks like stone require more force to move
    const heavyBlocks = [
      'stone', 'cobblestone', 'andesite', 'diorite', 'granite',
      'deepslate', 'tuff', 'basalt', 'blackstone', 'logs', 'planks'
    ];
    
    if (heavyBlocks.some(type => blockType.includes(type))) {
      // Heavy blocks need more force to move
      if (forceFactor < 0.5) {
        return { action: 'none' }; // Too weak to move
      }
      return defaultInteraction;
    }
    
    // Interactable blocks like buttons, levers, etc.
    const interactableBlocks = [
      'button', 'lever', 'pressure_plate', 'tripwire', 'door',
      'trapdoor', 'fence_gate', 'bell'
    ];
    
    if (interactableBlocks.some(type => blockType.includes(type))) {
      // Activate instead of moving
      return { action: 'activate' };
    }
    
    // Transformable blocks
    if (blockType === 'dirt' && forceFactor > 0.8) {
      // High force transforms dirt to path
      return {
        action: 'transform',
        result: { type: 'dirt_path' }
      };
    }
    
    if (blockType === 'grass_block' && forceFactor > 0.8) {
      // High force transforms grass to dirt
      return {
        action: 'transform',
        result: { type: 'dirt' }
      };
    }
    
    if (blockType === 'sand' || blockType === 'gravel' || blockType === 'powder_snow') {
      // Always try to move loose materials
      return defaultInteraction;
    }
    
    // Fragile blocks break easily
    const fragileBlocks = [
      'glass', 'glass_pane', 'stained_glass', 'ice', 'clay',
      'candle', 'lantern', 'torch', 'flower_pot', 'amethyst',
      'calcite', 'tinted_glass', 'amethyst_bud', 'pointed_dripstone'
    ];
    
    if (fragileBlocks.some(type => blockType.includes(type))) {
      // Fragile blocks break instead of moving
      return { action: 'break' };
    }
    
    // Default behavior for all other blocks
    return defaultInteraction;
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
   * Emit update to clients
   */
  emitUpdate() {
    if (this.world && this.world.emitEntityUpdate) {
      this.world.emitEntityUpdate(this);
    }
  }
  
  /**
   * Remove the entity from the world
   */
  remove() {
    if (this.world && this.world.removeEntity) {
      this.world.removeEntity(this.id);
    }
  }
  
  /**
   * Serialize entity data
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      shooter: this.shooter,
      damage: this.damage,
      direction: this.direction,
      moveDistance: this.moveDistance,
      explosionRadius: this.explosionRadius,
      chargeLevel: this.chargeLevel,
      chargeName: this.chargeName,
      powerLevel: this.powerLevel,
      hasExploded: this.hasExploded
    };
  }
  
  /**
   * Deserialize entity data
   * @param {Object} data - Serialized data
   * @returns {WindChargeEntity} Wind charge entity
   */
  static deserialize(data) {
    return new WindChargeEntity(data.id, {
      world: data.world,
      position: data.position,
      velocity: data.velocity,
      shooter: data.shooter,
      damage: data.damage,
      direction: data.direction,
      moveDistance: data.moveDistance,
      radius: data.explosionRadius,
      chargeLevel: data.chargeLevel,
      chargeName: data.chargeName,
      powerLevel: data.powerLevel,
      hasExploded: data.hasExploded
    });
  }
  
  /**
   * Trigger chain reactions with other wind charges
   */
  triggerChainReaction() {
    // Find nearby wind charges that could be triggered
    const chainReactionRadius = this.explosionRadius * 2; // Larger radius for chain reactions
    const nearbyEntities = this.world.getEntitiesInRadius(this.position, chainReactionRadius);
    
    // Filter for wind charge entities that haven't exploded yet
    const nearbyWindCharges = nearbyEntities.filter(entity => 
      entity.type === 'wind_charge_entity' && 
      entity.id !== this.id && 
      !entity.hasExploded
    );
    
    // For each nearby wind charge, trigger explosion with a short delay for cascading effect
    nearbyWindCharges.forEach((windCharge, index) => {
      // Calculate delay based on distance (further = more delay)
      const distance = this.distanceTo(windCharge.position);
      const delayFactor = distance / chainReactionRadius; // 0 to 1 based on distance
      const baseDelay = 100; // Base delay in milliseconds
      const delay = baseDelay + (delayFactor * 150); // 100-250ms delay based on distance
      
      // Schedule explosion
      setTimeout(() => {
        if (!windCharge.hasExploded) {
          // Set direction toward this explosion for visual effect
          const dx = windCharge.position.x - this.position.x;
          const dy = windCharge.position.y - this.position.y;
          const dz = windCharge.position.z - this.position.z;
          const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (length > 0) {
            windCharge.direction = {
              x: dx / length,
              y: dy / length,
              z: dz / length
            };
          }
          
          // Trigger explosion
          windCharge.explode();
        }
      }, delay);
    });
    
    // Return number of triggered charges for chaining information
    return nearbyWindCharges.length;
  }
}

module.exports = WindChargeEntity; 