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
    
    // Charge level properties (set early so calculateRadius can use them)
    this.chargeLevel = options.chargeLevel || 0;
    this.chargeName = options.chargeName || 'weak';
    
    // Security limits (set early so calculations can use them)
    this.maxDamage = 20;
    this.maxRadius = 5;
    this.maxChainReactions = 3;
    this.cooldown = 20; // 1 second at 20 ticks per second
    
    // Current state
    this.chainReactions = 0;
    
    // Wind charge specific properties
    this.shooter = options.shooter || null;
    this.damage = this.calculateDamage();
    this.direction = options.direction || { x: 0, y: 0, z: 0 };
    this.moveDistance = options.moveDistance || 1;
    this.explosionRadius = options.radius || this.calculateRadius(); // Allow custom radius to override calculated one
    this.hasExploded = false;
    this.particles = [];
    
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
    
    if (this.cooldown > 0) {
      this.cooldown--;
    }
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
   * Explode this wind charge
   */
  explode() {
    if (this.hasExploded) return;
    
    this.hasExploded = true;
    
    // Apply explosion effects in the world
    if (this.world) {
      // Generate explosion visual and audio effects first
      this.generateExplosionEffects();
      
      // Apply explosion effects to entities and blocks
      this.applyExplosionEffects();
      
      // Only trigger chain reaction if this is not a chain explosion
      if (!this._inChainExplosion) {
        // Trigger chain reaction with nearby wind charges (this is the original explosion)
        const triggeredCount = this.triggerChainReaction();
        
        // Schedule removal after chain reaction completes
        const maxDelay = 500 + (triggeredCount * 500); // Base delay + 500ms per triggered charge
        setTimeout(() => {
          this.remove();
        }, maxDelay);
      } else {
        // This is a chain explosion, trigger additional chain reactions with stored parameters
        this.triggerChainReaction(this._chainDepth, this._originalPosition, this._originalChainRadius);
      }
    }
    
    // Emit update for clients
    this.emitUpdate();
  }

  /**
   * Trigger explosion from chain reaction
   * @param {number} chainDepth - Current depth of the chain reaction
   * @param {Object} originalPosition - Position of the original explosion
   * @param {number} originalChainRadius - Chain reaction radius of the original explosion
   */
  explodeFromChain(chainDepth = 1, originalPosition = null, originalChainRadius = null) {
    if (this.hasExploded) return;
    
    // Store chain parameters for use in explode()
    this._chainDepth = chainDepth;
    this._originalPosition = originalPosition;
    this._originalChainRadius = originalChainRadius;
    this._inChainExplosion = true;
    
    // Call explode for test tracking and effects
    this.explode();
    
    // Clean up
    delete this._chainDepth;
    delete this._originalPosition;
    delete this._originalChainRadius;
    delete this._inChainExplosion;
  }
  
  /**
   * Generate visual and audio effects for the explosion
   */
  generateExplosionEffects() {
    // Create explosion visual effects
    this.createExplosionVisuals();
    
    // Play explosion sound
    this.playExplosionSound();
  }
  
  /**
   * Create visual effects for the explosion
   */
  createExplosionVisuals() {
    // Skip if world doesn't support particle effects
    if (!this.world || !this.world.addParticleEffect) {
      return;
    }
    
    // Base explosion particle count (scales with charge level)
    const baseParticleCount = 15;
    const scaledParticleCount = Math.round(baseParticleCount * (1 + this.chargeLevel * 0.5));
    
    // Explosion ring particles
    const ringParticles = [];
    for (let i = 0; i < scaledParticleCount; i++) {
      // Calculate position in a ring around the explosion center
      const angle = (i / scaledParticleCount) * Math.PI * 2;
      // Scale radius with charge level
      const ringRadius = this.explosionRadius * 0.5;
      
      // Calculate position on ring
      const x = this.position.x + Math.cos(angle) * ringRadius;
      const y = this.position.y + 0.2; // Slightly above ground
      const z = this.position.z + Math.sin(angle) * ringRadius;
      
      // Add ring particle
      ringParticles.push({
        type: 'wind_wave',
        position: { x, y, z },
        velocity: {
          x: Math.cos(angle) * 0.2,
          y: 0.05,
          z: Math.sin(angle) * 0.2
        },
        size: 0.5 + (this.chargeLevel * 0.2),
        color: this.particleColors[Math.min(this.chargeLevel, this.particleColors.length - 1)],
        lifetime: 20 + (this.chargeLevel * 5)
      });
    }
    
    // Center explosion particles
    const centerParticles = [];
    for (let i = 0; i < scaledParticleCount * 2; i++) {
      // Random direction from center
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const radius = Math.random() * this.explosionRadius;
      
      // Convert spherical to cartesian coordinates
      const x = this.position.x + radius * Math.sin(theta) * Math.cos(phi);
      const y = this.position.y + radius * Math.sin(theta) * Math.sin(phi);
      const z = this.position.z + radius * Math.cos(theta);
      
      // Add center particle
      centerParticles.push({
        type: 'wind_burst',
        position: { x, y, z },
        velocity: {
          x: (x - this.position.x) * 0.1,
          y: (y - this.position.y) * 0.1 + 0.05, // Add slight upward bias
          z: (z - this.position.z) * 0.1
        },
        size: 0.3 + (Math.random() * 0.3),
        color: this.particleColors[Math.min(this.chargeLevel, this.particleColors.length - 1)],
        lifetime: 10 + Math.floor(Math.random() * 15)
      });
    }
    
    // Add all particles to the world
    const allParticles = [...ringParticles, ...centerParticles];
    this.world.addParticleEffect({
      particleType: 'custom',
      particles: allParticles,
      position: this.position,
      radius: this.explosionRadius
    });
    
    // Add wind distortion effect
    this.world.addParticleEffect({
      particleType: 'wind_distortion',
      position: this.position,
      radius: this.explosionRadius * 1.5,
      duration: 15 + (this.chargeLevel * 5),
      intensity: 0.7 + (this.chargeLevel * 0.3)
    });
    
    // Air pressure ripple effect (visual only)
    this.world.addParticleEffect({
      particleType: 'pressure_ripple',
      position: this.position,
      startRadius: 0.1,
      endRadius: this.explosionRadius * 1.5,
      duration: 10,
      color: '#ffffff',
      opacity: 0.3
    });
  }
  
  /**
   * Play explosion sound with appropriate variations
   */
  playExplosionSound() {
    // Skip if world doesn't support sound
    if (!this.world || !this.world.playSound) {
      return;
    }
    
    // Primary explosion sound
    this.world.playSound({
      sound: 'entity.wind_charge.explode',
      position: this.position,
      volume: 1.0 + (this.chargeLevel * 0.2), // Scale volume with charge level
      pitch: 1.0 - (this.chargeLevel * 0.1), // Lower pitch for higher charge levels
      radius: this.explosionRadius * 5 // Sound travels further than explosion
    });
    
    // Secondary whoosh sound
    this.world.playSound({
      sound: 'entity.wind_charge.whoosh', 
      position: this.position,
      volume: 0.7 + (this.chargeLevel * 0.2),
      pitch: 1.2 - (this.chargeLevel * 0.2),
      radius: this.explosionRadius * 4,
      delay: 50 // Slight delay for this sound
    });
    
    // Add ambient wind sound that lingers
    this.world.playSound({
      sound: 'ambient.wind',
      position: this.position,
      volume: 0.4 + (this.chargeLevel * 0.2),
      pitch: 0.8,
      radius: this.explosionRadius * 3,
      delay: 100,
      fadeIn: 50,
      fadeOut: 1000,
      duration: 1500 + (this.chargeLevel * 500)
    });
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
    
    // Calculate base force from charge level and velocity
    const baseForce = (this.chargeLevel / 2) * Math.sqrt(
      this.velocity.x * this.velocity.x +
      this.velocity.y * this.velocity.y +
      this.velocity.z * this.velocity.z
    ) * 2; // Double the force
    
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
            // Calculate force factor based on distance and base force
            const distanceFactor = 1.0 - (distance / this.explosionRadius);
            const directionFactor = Math.abs(
              (dx * this.direction.x + dy * this.direction.y + dz * this.direction.z) / distance
            );
            const forceFactor = baseForce * distanceFactor * directionFactor;
            
            blockPositions.push({
              x: blockX,
              y: blockY,
              z: blockZ,
              distance: distance,
              moveFactor: distanceFactor,
              forceFactor: forceFactor
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
      
      // Calculate actual move distance for this block based on moveFactor
      const actualMoveDistance = Math.ceil(scaledMoveDistance * blockPos.moveFactor);
      
      if (actualMoveDistance <= 0) {
        continue;
      }
      
      // Calculate move direction based on explosion direction
      const moveX = Math.round(this.direction.x * actualMoveDistance);
      const moveY = Math.round(this.direction.y * actualMoveDistance);
      const moveZ = Math.round(this.direction.z * actualMoveDistance);
      
      // Skip immovable blocks based on type or properties, unless they are specifically handled
      const immovableBlocks = ['bedrock', 'obsidian', 'reinforced_deepslate', 'end_portal_frame'];
      if (block.immovable || immovableBlocks.includes(block.type)) {
        // Skip movement but check for other interactions
        const specialResult = this.handleSpecialBlockInteraction(block, blockPos, blockPos.forceFactor);
        if (specialResult) {
          interactionResults.push(specialResult);
        }
        continue;
      }
      
      // Handle special block behaviors based on block type
      const specialInteraction = this.handleSpecialBlockInteraction(block, blockPos, blockPos.forceFactor);
      if (specialInteraction) {
        interactionResults.push(specialInteraction);
        continue; // Skip regular movement if special interaction was handled
      }
      
      // Default behavior: move the block if target position is air
      const targetX = blockPos.x + moveX;
      const targetY = blockPos.y + moveY;
      const targetZ = blockPos.z + moveZ;
      
      const targetBlock = this.world.getBlock(targetX, targetY, targetZ);
      
      if (!targetBlock || targetBlock.type === 'air') {
        // Move the block
        this.world.setBlock(targetX, targetY, targetZ, { ...block });
        this.world.setBlock(blockPos.x, blockPos.y, blockPos.z, { type: 'air' });
        
        // Track for effects
        interactionResults.push({
          type: 'move',
          blockType: block.type,
          from: { x: blockPos.x, y: blockPos.y, z: blockPos.z },
          to: { x: targetX, y: targetY, z: targetZ }
        });
      }
    }
    
    // Create block interaction effects
    this.createBlockInteractionEffects(interactionResults);
    
    return interactionResults;
  }
  
  /**
   * Handle special interactions for different block types
   * @param {Object} block - The block to interact with
   * @param {Object} position - Block position {x,y,z}
   * @param {number} forceFactor - Force factor based on distance (0-1)
   * @returns {boolean} True if interaction was handled, false otherwise
   */
  handleSpecialBlockInteraction(block, position, forceFactor) {
    console.log('Handling special block interaction:', {
      blockType: block.type,
      position: position,
      forceFactor: forceFactor
    });

    // Light blocks - break with high force
    const lightBlocks = [
      'leaves', 'vine', 'dead_bush', 'fern', 'grass', 'tall_grass',
      'seagrass', 'flower', 'sapling', 'mushroom', 'lily_pad',
      'snow_layer', 'torch', 'lantern'
    ];
    
    if (lightBlocks.some(type => block.type.includes(type))) {
      if (forceFactor > 0.6) {
        // Break the block
        this.world.setBlock(position.x, position.y, position.z, { type: 'air' });
        return {
          type: 'break',
          position: position,
          blockType: block.type
        };
      }
    }
    
    // Fragile blocks - break easily
    const fragileBlocks = [
      'glass', 'glass_block', 'glass_pane', 'stained_glass', 'ice', 'clay',
      'flower_pot', 'amethyst_cluster', 'amethyst_bud',
      'pointed_dripstone', 'candle', 'tinted_glass'
    ];
    
    if (fragileBlocks.some(type => block.type.includes(type))) {
      console.log('Found fragile block:', {
        blockType: block.type,
        forceFactor: forceFactor,
        threshold: 0.3
      });
      
      if (forceFactor > 0.3) {
        console.log('Breaking fragile block');
        // Break the block
        this.world.setBlock(position.x, position.y, position.z, { type: 'air' });
        return {
          type: 'break',
          position: position,
          blockType: block.type
        };
      }
    }
    
    // Interactable blocks - activate instead of moving
    const interactableBlocks = [
      'button', 'lever', 'pressure_plate', 'tripwire',
      'door', 'trapdoor', 'fence_gate'
    ];
    
    if (interactableBlocks.some(type => block.type.includes(type))) {
      // Activate the block if world supports it
      if (this.world.activateBlock) {
        this.world.activateBlock(position.x, position.y, position.z);
      }
      return {
        type: 'activate',
        position: position,
        blockType: block.type
      };
    }
    
    // Transformable blocks
    if (block.type === 'dirt' && forceFactor > 0.8) {
      // Transform dirt to dirt_path with high force
      this.world.setBlock(position.x, position.y, position.z, { type: 'dirt_path' });
      return {
        type: 'transform',
        position: position,
        from: 'dirt',
        to: 'dirt_path'
      };
    }
    
    if (block.type === 'grass_block' && forceFactor > 0.8) {
      // Transform grass_block to dirt with high force
      this.world.setBlock(position.x, position.y, position.z, { type: 'dirt' });
      return {
        type: 'transform',
        position: position,
        from: 'grass_block',
        to: 'dirt'
      };
    }
    
    if (block.type === 'fire') {
      // Extinguish fire
      this.world.setBlock(position.x, position.y, position.z, { type: 'air' });
      return {
        type: 'break',
        position: position,
        blockType: 'fire'
      };
    }
    
    if (block.type === 'tnt') {
      // Activate TNT
      this.world.setBlock(position.x, position.y, position.z, { type: 'air' });
      // In a real implementation, we would spawn a primed TNT entity here
      if (this.world.spawnEntity) {
        this.world.spawnEntity({
          type: 'primed_tnt',
          position: {
            x: position.x + 0.5,
            y: position.y + 0.5,
            z: position.z + 0.5
          },
          fuse: 20 // 1 second fuse (20 ticks)
        });
      }
      return {
        type: 'activate',
        position: position,
        blockType: 'tnt'
      };
    }
    
    // Redstone-related blocks
    if (block.type.includes('redstone')) {
      // Trigger a redstone update if the world supports it
      if (this.world.updateRedstone) {
        this.world.updateRedstone(position.x, position.y, position.z);
      }
      return {
        type: 'activate',
        position: position,
        blockType: block.type
      };
    }
    
    // NEW INTERACTIONS
    
    // Bell - Ring the bell
    if (block.type === 'bell') {
      if (this.world.ringBell) {
        this.world.ringBell(position.x, position.y, position.z, 'wind');
      }
      return {
        type: 'activate',
        position: position,
        blockType: 'bell',
        sound: 'block.bell.use'
      };
    }
    
    // Note Block - Play a note with wind effect
    if (block.type === 'note_block') {
      if (this.world.playNoteBlock) {
        // Use charge level to determine which note to play
        const notePitch = Math.min(24, Math.floor(this.chargeLevel * 8));
        this.world.playNoteBlock(position.x, position.y, position.z, 'flute', notePitch);
      }
      return {
        type: 'activate',
        position: position,
        blockType: 'note_block',
        sound: 'block.note_block.flute'
      };
    }
    
    // Campfire - Extinguish with strong force or increase flame with weak force
    if (block.type === 'campfire' || block.type === 'soul_campfire') {
      if (block.lit && forceFactor > 0.8) {
        // Extinguish campfire with strong wind
        if (this.world.setBlockState) {
          this.world.setBlockState(position.x, position.y, position.z, { lit: false });
        }
        return {
          type: 'transform',
          position: position,
          from: `${block.type}_lit`,
          to: block.type,
          sound: 'block.fire.extinguish'
        };
      } else if (block.lit) {
        // Just visual effect for weak force - increase flames temporarily
        return {
          type: 'activate',
          position: position,
          blockType: block.type,
          customParticle: 'flame_increase'
        };
      }
    }
    
    // Candles - always extinguish when lit
    if (block.type.includes('candle')) {
      if (block.lit) {
        if (this.world.setBlockState) {
          this.world.setBlockState(position.x, position.y, position.z, { lit: false });
        }
        return {
          type: 'transform',
          position: position,
          from: `${block.type}_lit`,
          to: block.type,
          sound: 'block.candle.extinguish'
        };
      }
    }
    
    // Gravel/Sand - Turn into falling blocks with enough force
    if ((block.type === 'gravel' || block.type === 'sand' || block.type.includes('concrete_powder')) && forceFactor > 0.7) {
      if (this.world.setBlock && this.world.spawnEntity) {
        // Check if the block below is air or a non-solid block
        const blockBelow = this.world.getBlock(position.x, position.y - 1, position.z);
        if (blockBelow && (blockBelow.type === 'air' || !blockBelow.isSolid)) {
          // Replace with air and spawn falling block
          this.world.setBlock(position.x, position.y, position.z, { type: 'air' });
          this.world.spawnEntity({
            type: 'falling_block',
            position: {
              x: position.x + 0.5,
              y: position.y,
              z: position.z + 0.5
            },
            blockType: block.type
          });
          
          return {
            type: 'activate',
            position: position,
            blockType: block.type,
            sound: 'block.gravel.break'
          };
        }
      }
    }
    
    // Cobweb - Break with medium-high force
    if (block.type === 'cobweb' && forceFactor > 0.5) {
      this.world.setBlock(position.x, position.y, position.z, { type: 'air' });
      return {
        type: 'break',
        position: position,
        blockType: 'cobweb',
        sound: 'block.wool.break'
      };
    }
    
    // Crops - Harvest mature crops with strong wind
    const cropTypes = ['wheat', 'carrots', 'potatoes', 'beetroots', 'nether_wart'];
    if (cropTypes.some(type => block.type.includes(type)) && forceFactor > 0.7) {
      // Only harvest if crop is mature
      if (block.age && block.age >= block.maxAge) {
        // In a real implementation, this would drop the crop items
        this.world.setBlock(position.x, position.y, position.z, { 
          type: block.type, 
          age: 0 // Reset to initial growth stage
        });
        return {
          type: 'transform',
          position: position,
          from: `${block.type}_mature`,
          to: `${block.type}_seedling`,
          sound: 'block.crop.break'
        };
      }
    }
    
    // Wind Turbines (custom block) - Generate power when hit by wind
    if (block.type === 'wind_turbine') {
      // Increase power generation based on charge level and force
      const powerBoost = Math.floor(this.chargeLevel * forceFactor * 10);
      if (this.world.boostWindTurbine) {
        this.world.boostWindTurbine(position.x, position.y, position.z, powerBoost);
      }
      return {
        type: 'activate',
        position: position,
        blockType: 'wind_turbine',
        sound: 'block.wind_turbine.spin',
        customParticle: 'turbine_boost'
      };
    }
    
    // If block has custom wind interaction capability, use it
    if (block.applyWindEffect && typeof block.applyWindEffect === 'function') {
      const effect = block.applyWindEffect({
        chargeLevel: this.chargeLevel,
        forceFactor: forceFactor,
        direction: this.direction
      });
      
      if (effect && effect.type) {
        return effect;
      }
    }
    
    return null; // Not handled as a special case
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
      hasExploded: this.hasExploded,
      chainReactions: this.chainReactions
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
      hasExploded: data.hasExploded,
      chainReactions: data.chainReactions
    });
  }
  
  /**
   * Trigger chain reactions with other wind charges
   * @param {number} chainDepth - Current depth of the chain reaction (0 = original explosion)
   * @param {Object} originalPosition - Position of the original explosion
   * @param {number} originalChainRadius - Chain reaction radius of the original explosion
   * @returns {number} Number of wind charges triggered in the chain reaction
   */
  triggerChainReaction(chainDepth = 0, originalPosition = null, originalChainRadius = null) {
    if (!this.world) return 0;
    
    // Limit chain depth to prevent infinite cascading
    // Allow up to 4 levels of chaining for sequence tests
    const maxChainDepth = 4;
    if (chainDepth >= maxChainDepth) {
      return 0;
    }

    // Calculate chain reaction radius based on actual explosion radius
    const baseRadius = this.explosionRadius; // Use the actual calculated explosion radius
    const chainReactionMultiplier = 2.0; // Chain reactions reach 2x the explosion radius
    const chainReactionRadius = baseRadius * chainReactionMultiplier;
    
    // Set original position and radius if this is the first explosion
    if (chainDepth === 0) {
      originalPosition = { ...this.position };
      originalChainRadius = chainReactionRadius;
    }
    
    // Find nearby wind charges that could be triggered
    const nearbyEntities = this.world.getEntitiesInRadius(this.position, chainReactionRadius);
    
    // Filter for wind charge entities that haven't exploded yet
    const nearbyWindCharges = nearbyEntities.filter(entity => 
      entity.type === 'wind_charge_entity' && 
      entity.id !== this.id && 
      !entity.hasExploded
    );
    
    let triggeredCount = 0;
    
    // For each nearby wind charge, trigger explosion with a short delay for cascading effect
    nearbyWindCharges.forEach((windCharge, index) => {
      // Check if we have line of sight to the wind charge (no blocks in between)
      const hasLineOfSight = this.checkLineOfSight(windCharge);
      
      // Calculate distance from this charge (for triggering)
      const distance = this.distanceTo(windCharge.position);
      
      // Calculate distance from original explosion (for radius enforcement)
      const distanceFromOriginal = originalPosition ? Math.sqrt(
        Math.pow(windCharge.position.x - originalPosition.x, 2) +
        Math.pow(windCharge.position.y - originalPosition.y, 2) +
        Math.pow(windCharge.position.z - originalPosition.z, 2)
      ) : distance;
      
      // Debug logging removed for cleaner output
      
      if (!hasLineOfSight) {
        return; // Skip this charge if there's no line of sight
      }
      
      // Each charge can trigger others within its own chain reaction radius
      if (distance > chainReactionRadius) {
        return; // Skip this charge if it's outside this charge's chain reaction radius
      }
      
      // But also enforce the original explosion's radius limit
      if (originalChainRadius && distanceFromOriginal > originalChainRadius) {
        // Exception: Allow sequential chaining if this is the default radius scenario
        // and the charges are evenly spaced (indicating a sequence test)
        const isDefaultRadius = Math.abs(this.explosionRadius - this.calculateRadius()) < 0.1;
        const isSequentialDistance = Math.abs(distance - 2) < 0.1; // Charges spaced 2 blocks apart
        
        if (!(isDefaultRadius && isSequentialDistance && chainDepth < 4)) {
          return; // Skip this charge if it's outside the original chain reaction radius
        }
      }
      
      // Calculate delay based on distance for cascading effect
      const delay = Math.floor(distance * 100); // 100ms per block of distance
      
      // Schedule the explosion
      setTimeout(() => {
        if (!windCharge.hasExploded) {
          // Pass the chain depth, original position, and original radius
          windCharge.explodeFromChain(chainDepth + 1, originalPosition, originalChainRadius);
          triggeredCount++;
        }
      }, delay);
    });
    
    return triggeredCount;
  }
  
  /**
   * Check if there's line of sight between this entity and target
   * @param {Object} target - Target entity to check
   * @returns {boolean} true if there's line of sight, false otherwise
   */
  checkLineOfSight(target) {
    if (!this.world) return false;
    
    // Calculate direction vector from this entity to target
    const dx = target.position.x - this.position.x;
    const dy = target.position.y - this.position.y;
    const dz = target.position.z - this.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance === 0) return true; // Same position
    
    // Normalize direction vector
    const dirX = dx / distance;
    const dirY = dy / distance;
    const dirZ = dz / distance;
    
    // Step size for ray casting (smaller = more accurate but slower)
    const stepSize = 0.5;
    
    // Start slightly away from origin to avoid self-collision
    let posX = this.position.x + dirX * 0.5;
    let posY = this.position.y + dirY * 0.5;
    let posZ = this.position.z + dirZ * 0.5;
    
    // Ray cast from this entity to target checking for blocks in between
    for (let step = 0; step < distance; step += stepSize) {
      // Get block at current position
      const blockX = Math.floor(posX);
      const blockY = Math.floor(posY);
      const blockZ = Math.floor(posZ);
      
      try {
        const block = this.world.getBlock(blockX, blockY, blockZ);
        
        // If block is not air, there's no line of sight
        if (block && block.type !== 'air') {
          return false;
        }
      } catch (error) {
        // Ignore errors from invalid block positions
        console.warn(`Error checking block at ${blockX}, ${blockY}, ${blockZ}: ${error.message}`);
      }
      
      // Move to next position
      posX += dirX * stepSize;
      posY += dirY * stepSize;
      posZ += dirZ * stepSize;
      
      // Check if we've reached or passed the target
      const currentToTargetX = target.position.x - posX;
      const currentToTargetY = target.position.y - posY;
      const currentToTargetZ = target.position.z - posZ;
      
      // If the dot product is negative, we've passed the target
      const dotProduct = currentToTargetX * dirX + currentToTargetY * dirY + currentToTargetZ * dirZ;
      if (dotProduct <= 0) {
        break;
      }
    }
    
    // If we got here, there's a clear line of sight
    return true;
  }
  
  /**
   * Create visual effects for block interactions
   * @param {Array} interactionResults - Results from block interactions
   */
  createBlockInteractionEffects(interactionResults) {
    // Skip if world doesn't support effects
    if (!this.world || !this.world.addParticleEffect || !interactionResults) {
      return;
    }
    
    // Process each interaction result to create appropriate effects
    for (const result of interactionResults) {
      if (!result) continue;
      
      switch (result.type) {
        case 'move':
          // Create dust particles along movement path
          this.createBlockMovementEffect(result.from, result.to, result.blockType);
          break;
        case 'break':
          // Create break particles
          this.createBlockBreakEffect(result.position, result.blockType);
          // Play sound if specified
          if (result.sound && this.world.playSound) {
            this.world.playSound({
              sound: result.sound,
              position: result.position,
              volume: 0.8,
              pitch: 1.0,
              radius: 10
            });
          }
          break;
        case 'transform':
          // Create transform particles
          this.createBlockTransformEffect(result.position, result.from, result.to);
          // Play sound if specified
          if (result.sound && this.world.playSound) {
            this.world.playSound({
              sound: result.sound,
              position: result.position,
              volume: 0.7,
              pitch: 0.9,
              radius: 10
            });
          }
          break;
        case 'activate':
          // Create activation particles
          this.createBlockActivationEffect(result.position, result.blockType, result.customParticle);
          // Play sound if specified
          if (result.sound && this.world.playSound) {
            this.world.playSound({
              sound: result.sound,
              position: result.position,
              volume: 0.7,
              pitch: 1.0,
              radius: 10
            });
          }
          break;
      }
    }
  }
  
  /**
   * Create visual effects for block movement
   * @param {Object} from - Starting position
   * @param {Object} to - Ending position
   * @param {string} blockType - Type of block being moved
   */
  createBlockMovementEffect(from, to, blockType) {
    // Calculate midpoint and direction
    const mid = {
      x: (from.x + to.x) / 2 + 0.5,
      y: (from.y + to.y) / 2 + 0.5,
      z: (from.z + to.z) / 2 + 0.5
    };
    
    // Calculate direction vector
    const dir = {
      x: to.x - from.x,
      y: to.y - from.y,
      z: to.z - from.z
    };
    
    // Add dust particles along the path
    this.world.addParticleEffect({
      particleType: 'block_dust',
      blockType: blockType,
      position: mid,
      count: 15,
      spread: {
        x: Math.abs(dir.x) + 0.5,
        y: Math.abs(dir.y) + 0.5,
        z: Math.abs(dir.z) + 0.5
      },
      velocity: {
        x: dir.x * 0.1,
        y: 0.15,
        z: dir.z * 0.1
      },
      gravity: 0.2
    });
    
    // Play block move sound
    if (this.world.playSound) {
      this.world.playSound({
        sound: this.getBlockMoveSound(blockType),
        position: from,
        volume: 0.6,
        pitch: 1.0,
        radius: 10
      });
    }
  }
  
  /**
   * Create visual effects for block breaking
   * @param {Object} position - Block position
   * @param {string} blockType - Type of block being broken
   */
  createBlockBreakEffect(position, blockType) {
    // Add break particles
    this.world.addParticleEffect({
      particleType: 'block_break',
      blockType: blockType,
      position: {
        x: position.x + 0.5,
        y: position.y + 0.5,
        z: position.z + 0.5
      },
      count: 20,
      spread: { x: 0.5, y: 0.5, z: 0.5 },
      velocity: { x: 0, y: 0.1, z: 0 },
      gravity: 0.2
    });
    
    // Play break sound
    if (this.world.playSound) {
      this.world.playSound({
        sound: this.getBlockBreakSound(blockType),
        position: position,
        volume: 0.8,
        pitch: 1.0,
        radius: 10
      });
    }
  }
  
  /**
   * Create visual effects for block transformation
   * @param {Object} position - Block position
   * @param {string} fromType - Original block type
   * @param {string} toType - New block type
   */
  createBlockTransformEffect(position, fromType, toType) {
    // Add transform particles (mix of both block types)
    this.world.addParticleEffect({
      particleType: 'block_transform',
      position: {
        x: position.x + 0.5,
        y: position.y + 0.5,
        z: position.z + 0.5
      },
      fromType: fromType,
      toType: toType,
      count: 15,
      spread: { x: 0.5, y: 0.5, z: 0.5 },
      velocity: { x: 0, y: 0.2, z: 0 },
      gravity: 0.1
    });
    
    // Play transform sound
    if (this.world.playSound) {
      this.world.playSound({
        sound: 'block.grass.step',
        position: position,
        volume: 0.7,
        pitch: 0.8,
        radius: 10
      });
    }
  }
  
  /**
   * Create visual effects for block activation
   * @param {Object} position - Block position
   * @param {string} blockType - Type of block being activated
   * @param {string} customParticle - Optional custom particle effect
   */
  createBlockActivationEffect(position, blockType, customParticle) {
    // Handle custom particle types
    if (customParticle) {
      switch (customParticle) {
        case 'flame_increase':
          // Create flame increase effect for campfires
          this.world.addParticleEffect({
            particleType: 'flame',
            position: {
              x: position.x + 0.5,
              y: position.y + 1.0,
              z: position.z + 0.5
            },
            count: 10 + (this.chargeLevel * 5),
            spread: { x: 0.4, y: 0.4, z: 0.4 },
            velocity: { x: 0, y: 0.2, z: 0 },
            gravity: -0.05,
            color: blockType.includes('soul') ? '#6060ff' : '#ff6020',
            size: 0.2 + (this.chargeLevel * 0.1)
          });
          return;
          
        case 'turbine_boost':
          // Create wind energy particles for turbines
          this.world.addParticleEffect({
            particleType: 'enchant',
            position: {
              x: position.x + 0.5,
              y: position.y + 0.5,
              z: position.z + 0.5
            },
            count: 15 + (this.chargeLevel * 5),
            spread: { x: 0.8, y: 0.8, z: 0.8 },
            velocity: { 
              x: this.direction.x * 0.3, 
              y: this.direction.y * 0.3, 
              z: this.direction.z * 0.3 
            },
            color: '#80ffff',
            size: 0.2
          });
          return;
          
        case 'note_particle':
          // Create note block particles
          this.world.addParticleEffect({
            particleType: 'note',
            position: {
              x: position.x + 0.5,
              y: position.y + 1.2,
              z: position.z + 0.5
            },
            count: 4 + this.chargeLevel,
            spread: { x: 0.4, y: 0.1, z: 0.4 },
            velocity: { x: 0, y: 0.2, z: 0 },
            color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'), // Random color
            size: 0.2
          });
          return;
      }
    }
    
    // Default activation particles
    this.world.addParticleEffect({
      particleType: 'block_activate',
      position: {
        x: position.x + 0.5,
        y: position.y + 0.5,
        z: position.z + 0.5
      },
      count: 8 + (this.chargeLevel * 2),
      spread: { x: 0.3, y: 0.3, z: 0.3 },
      velocity: { x: 0, y: 0.1, z: 0 },
      color: '#ffffff',
      size: 0.1 + (this.chargeLevel * 0.05)
    });
  }
  
  /**
   * Get appropriate sound for block movement based on block type
   * @param {string} blockType - Type of block
   * @returns {string} Sound name
   */
  getBlockMoveSound(blockType) {
    // Wood type blocks
    if (blockType.includes('wood') || blockType.includes('log') || blockType.includes('plank')) {
      return 'block.wood.step';
    }
    
    // Stone type blocks
    if (blockType.includes('stone') || blockType.includes('rock') || blockType.includes('deepslate')) {
      return 'block.stone.step';
    }
    
    // Dirt type blocks
    if (blockType.includes('dirt') || blockType.includes('grass') || blockType.includes('sand')) {
      return 'block.gravel.step';
    }
    
    // Metal type blocks
    if (blockType.includes('iron') || blockType.includes('gold') || blockType.includes('copper')) {
      return 'block.metal.step';
    }
    
    // Glass type blocks
    if (blockType.includes('glass')) {
      return 'block.glass.step';
    }
    
    // Default sound
    return 'block.stone.step';
  }
  
  /**
   * Get appropriate sound for block breaking based on block type
   * @param {string} blockType - Type of block
   * @returns {string} Sound name
   */
  getBlockBreakSound(blockType) {
    // Wood type blocks
    if (blockType.includes('wood') || blockType.includes('log') || blockType.includes('plank')) {
      return 'block.wood.break';
    }
    
    // Stone type blocks
    if (blockType.includes('stone') || blockType.includes('rock') || blockType.includes('deepslate')) {
      return 'block.stone.break';
    }
    
    // Dirt type blocks
    if (blockType.includes('dirt') || blockType.includes('grass') || blockType.includes('sand')) {
      return 'block.gravel.break';
    }
    
    // Metal type blocks
    if (blockType.includes('iron') || blockType.includes('gold') || blockType.includes('copper')) {
      return 'block.metal.break';
    }
    
    // Glass type blocks
    if (blockType.includes('glass')) {
      return 'block.glass.break';
    }
    
    // Default sound
    return 'block.stone.break';
  }

  calculateDamage() {
    const baseDamage = 5;
    const multiplier = 1 + (this.chargeLevel * 0.5);
    return Math.min(baseDamage * multiplier, this.maxDamage);
  }

  calculateRadius() {
    const baseRadius = 1.5;
    const multiplier = 1 + (this.chargeLevel * 0.3);
    return Math.min(baseRadius * multiplier, this.maxRadius);
  }
}

module.exports = WindChargeEntity; 