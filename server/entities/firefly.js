/**
 * Firefly - Ambient entity that emits light and glowing particles
 * Appears in Mangrove Swamp biomes, primarily during night time
 */

const Entity = require('./entity');

class Firefly extends Entity {
  /**
   * Create a new Firefly entity
   * @param {Object} world - Reference to the world object
   * @param {Object} options - Firefly configuration options
   */
  constructor(world, options = {}) {
    // Initialize the base entity with correct parameters
    super(world, {
      id: options.id || 'firefly_' + Math.floor(Math.random() * 1000000),
      type: 'firefly',
      position: options.position || { x: 0, y: 0, z: 0 },
      velocity: options.velocity || { x: 0, y: 0, z: 0 },
      gravity: 0, // Fireflies hover and don't fall with gravity
      drag: 0.1, // Light air resistance
      width: 0.1, // Small entity
      height: 0.1,
      maxLifetime: -1, // No lifetime limit
      ...options
    });
    
    // Define specific size for the firefly
    this.size = { width: 0.1, height: 0.1, depth: 0.1 };
    
    // Add health properties
    this.health = 1;
    this.maxHealth = 1;
    
    // Firefly-specific properties
    this.glowColor = options.glowColor || '#FFFF77'; // Yellow-ish glow
    this.glowIntensity = options.glowIntensity || 0.8; // Initial glow intensity
    this.glowCycleSpeed = options.glowCycleSpeed || (0.5 + Math.random() * 0.5); // Cycle speed variation
    this.glowState = Math.random() * Math.PI * 2; // Random starting point in glow cycle
    this.active = true; // Whether the firefly is currently active and glowing
    
    // Movement properties
    this.hoverHeight = 1.5 + Math.random() * 1.0; // Random hover height between 1.5 and 2.5 blocks
    this.moveSpeed = 0.3 + Math.random() * 0.2; // Random movement speed
    this.restTime = 0; // Time spent resting in one position
    this.maxRestTime = options.maxRestTime || 200; // Max ticks to rest
    this.maxFlightTime = options.maxFlightTime || 300; // Max ticks to fly
    this.flightTime = 0; // Current flight time
    this.fleeing = false; // Whether firefly is fleeing from a player
    
    // Target position for movement
    this.targetPosition = { ...this.position };
    
    // Last time particles were emitted
    this.lastParticleTime = 0;
    this.particleCooldown = 500 + Math.floor(Math.random() * 500); // 0.5-1 second between particles
    
    // Day/night behavior
    this.dayActive = options.dayActive !== undefined ? options.dayActive : false; // Generally only active at night
    
    // Group behavior - fireflies sometimes form small groups
    this.groupId = options.groupId || null;
    this.isGroupLeader = options.isGroupLeader !== undefined ? options.isGroupLeader : false;
    
    // Check distance from spawning position
    this.spawnPosition = { ...this.position };
    this.maxDistanceFromSpawn = options.maxDistanceFromSpawn || 16;
  }
  
  /**
   * Update firefly state and position
   * @param {Object} world - World reference
   * @param {Array} players - Array of nearby players
   * @param {Array} entities - Array of nearby entities
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(world, players, entities, deltaTime) {
    // Skip update if world is not available
    if (!world) return;
    
    // Convert to ticks (20 ticks per second)
    const dt = deltaTime / 50;
    
    // Time of day check - hide during day if not dayActive
    const timeOfDay = world.timeOfDay || 0;
    const isDaytime = timeOfDay >= 0.25 && timeOfDay < 0.75;
    
    if (isDaytime && !this.dayActive) {
      // During day, fireflies should hide and not emit light
      this.active = false;
      return;
    } else {
      // During night or if dayActive is true, fireflies should be active
      this.active = true;
    }
    
    // If not active, skip the rest of the update
    if (!this.active) return;
    
    // Update glow cycle
    this.updateGlowState(dt);
    
    // Update movement
    this.updateMovement(world, players, dt);
    
    // Generate particles occasionally
    this.generateParticles(world, deltaTime);
    
    // Check for collision with blocks
    this.handleCollisions(world);
  }
  
  /**
   * Update the firefly's glow state
   * @private
   * @param {number} dt - Delta time in ticks
   */
  updateGlowState(dt) {
    // Update glow cycle
    this.glowState += dt * this.glowCycleSpeed * 0.1;
    
    // Calculate glow intensity using sine wave for pulsing effect
    // Add some randomness with small probability for brief flashes
    const baseIntensity = (Math.sin(this.glowState) + 1) * 0.5; // 0 to 1
    
    // Occasional flash
    const flash = Math.random() < 0.01 ? 0.5 : 0;
    
    // Combine base and flash for final intensity
    this.glowIntensity = Math.min(baseIntensity + flash, 1.0);
  }
  
  /**
   * Update firefly movement
   * @private
   * @param {Object} world - World reference
   * @param {Array} players - Array of nearby players
   * @param {number} dt - Delta time in ticks
   */
  updateMovement(world, players, dt) {
    // Check if any players are too close
    const nearbyPlayer = this.checkForNearbyPlayers(players);
    
    if (nearbyPlayer) {
      // Player is too close, flee
      this.fleeing = true;
      this.flightTime = 0;
      this.restTime = 0;
      
      // Set target away from player
      const fleeDirection = {
        x: this.position.x - nearbyPlayer.position.x,
        y: this.position.y - nearbyPlayer.position.y,
        z: this.position.z - nearbyPlayer.position.z
      };
      
      // Normalize direction
      const magnitude = Math.sqrt(
        fleeDirection.x * fleeDirection.x + 
        fleeDirection.y * fleeDirection.y + 
        fleeDirection.z * fleeDirection.z
      );
      
      if (magnitude > 0) {
        fleeDirection.x /= magnitude;
        fleeDirection.y /= magnitude;
        fleeDirection.z /= magnitude;
      }
      
      // Set flee target
      this.targetPosition = {
        x: this.position.x + fleeDirection.x * 5,
        y: this.position.y + fleeDirection.y * 3 + this.hoverHeight,
        z: this.position.z + fleeDirection.z * 5
      };
    } else {
      this.fleeing = false;
      
      if (this.restTime > 0) {
        // Firefly is resting
        this.restTime -= dt;
        
        // Slow hover in place
        this.velocity.x = Math.sin(this.glowState * 2) * 0.01;
        this.velocity.y = Math.cos(this.glowState * 1.5) * 0.01;
        this.velocity.z = Math.sin(this.glowState * 1.7) * 0.01;
      } else if (this.flightTime > 0) {
        // Firefly is flying
        this.flightTime -= dt;
        
        // Move toward target position
        const dx = this.targetPosition.x - this.position.x;
        const dy = this.targetPosition.y - this.position.y;
        const dz = this.targetPosition.z - this.position.z;
        
        // Calculate distance to target
        const distanceToTarget = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (distanceToTarget < 0.5) {
          // Reached target, start resting
          this.restTime = Math.random() * this.maxRestTime;
          this.flightTime = 0;
        } else {
          // Move toward target
          this.velocity.x = dx / distanceToTarget * this.moveSpeed;
          this.velocity.y = dy / distanceToTarget * this.moveSpeed;
          this.velocity.z = dz / distanceToTarget * this.moveSpeed;
          
          // Add small random variation
          this.velocity.x += (Math.random() - 0.5) * 0.05;
          this.velocity.y += (Math.random() - 0.5) * 0.05;
          this.velocity.z += (Math.random() - 0.5) * 0.05;
        }
      } else {
        // Choose a new target
        this.chooseNewTarget(world);
        this.flightTime = Math.random() * this.maxFlightTime;
      }
    }
    
    // Apply velocity to position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;
    
    // Check if too far from spawn
    const distanceFromSpawn = this.getDistanceFromSpawn();
    if (distanceFromSpawn > this.maxDistanceFromSpawn) {
      // Return toward spawn area
      const returnDirection = {
        x: this.spawnPosition.x - this.position.x,
        y: this.spawnPosition.y - this.position.y,
        z: this.spawnPosition.z - this.position.z
      };
      
      // Normalize
      const magnitude = Math.sqrt(
        returnDirection.x * returnDirection.x + 
        returnDirection.y * returnDirection.y + 
        returnDirection.z * returnDirection.z
      );
      
      if (magnitude > 0) {
        returnDirection.x /= magnitude;
        returnDirection.y /= magnitude;
        returnDirection.z /= magnitude;
      }
      
      // Set new target back toward spawn
      this.targetPosition = {
        x: this.position.x + returnDirection.x * 5,
        y: this.position.y + returnDirection.y * 2 + this.hoverHeight,
        z: this.position.z + returnDirection.z * 5
      };
      
      this.flightTime = Math.random() * this.maxFlightTime;
      this.restTime = 0;
    }
  }
  
  /**
   * Generate light particles
   * @private
   * @param {Object} world - World reference
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  generateParticles(world, deltaTime) {
    if (!this.active || this.glowIntensity < 0.4 || !world) return;
    
    // Only emit particles occasionally
    const now = Date.now();
    if (now - this.lastParticleTime < this.particleCooldown) return;
    
    this.lastParticleTime = now;
    
    // Create glowing particle
    if (world.particleSystem) {
      world.particleSystem.emitParticles({
        type: 'firefly_glow',
        position: { ...this.position },
        color: this.glowColor,
        size: 0.05 + (this.glowIntensity * 0.05), // Size varies with glow
        lifespan: 300 + Math.random() * 200, // 300-500ms
        velocity: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02
        },
        gravity: -0.001, // Slightly float upward
        count: 1
      });
    }
  }
  
  /**
   * Choose a new random target position
   * @private
   * @param {Object} world - World reference
   */
  chooseNewTarget(world) {
    // Random direction
    const angle = Math.random() * Math.PI * 2;
    const distance = 2 + Math.random() * 3; // 2-5 blocks
    
    // Calculate new target
    this.targetPosition = {
      x: this.position.x + Math.cos(angle) * distance,
      y: this.position.y + (Math.random() * 2 - 1) + this.hoverHeight,
      z: this.position.z + Math.sin(angle) * distance
    };
    
    // Ensure target is not inside a block
    const blockAtTarget = world.getBlockAt(
      Math.floor(this.targetPosition.x), 
      Math.floor(this.targetPosition.y), 
      Math.floor(this.targetPosition.z)
    );
    
    if (blockAtTarget && blockAtTarget.type !== 'air' && blockAtTarget.type !== 'water') {
      // Target is inside a block, adjust y position
      this.targetPosition.y = Math.ceil(this.targetPosition.y) + this.hoverHeight;
    }
    
    // Ensure target is above ground/water
    const groundY = world.getHighestBlock(this.targetPosition.x, this.targetPosition.z);
    if (this.targetPosition.y < groundY + this.hoverHeight) {
      this.targetPosition.y = groundY + this.hoverHeight;
    }
  }
  
  /**
   * Check for nearby players
   * @private
   * @param {Array} players - Array of nearby players
   * @returns {Object|null} - Nearest player within range or null
   */
  checkForNearbyPlayers(players) {
    if (!players || players.length === 0) return null;
    
    const fleeDistance = 3; // Distance at which firefly flees
    let nearestPlayer = null;
    let nearestDistance = fleeDistance;
    
    for (const player of players) {
      const dx = player.position.x - this.position.x;
      const dy = player.position.y - this.position.y;
      const dz = player.position.z - this.position.z;
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPlayer = player;
      }
    }
    
    return nearestPlayer;
  }
  
  /**
   * Handle collisions with blocks
   * @private
   * @param {Object} world - World reference
   */
  handleCollisions(world) {
    // Get block at current position
    const blockAtPosition = world.getBlockAt(
      Math.floor(this.position.x), 
      Math.floor(this.position.y), 
      Math.floor(this.position.z)
    );
    
    if (blockAtPosition && blockAtPosition.type !== 'air' && 
        blockAtPosition.type !== 'water' && blockAtPosition.type !== 'mangrove_leaves') {
      // Inside a block, move away
      // Find nearest air block
      const directions = [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 }
      ];
      
      for (const dir of directions) {
        const checkX = Math.floor(this.position.x) + dir.x;
        const checkY = Math.floor(this.position.y) + dir.y;
        const checkZ = Math.floor(this.position.z) + dir.z;
        
        const checkBlock = world.getBlockAt(checkX, checkY, checkZ);
        
        if (!checkBlock || checkBlock.type === 'air' || 
            checkBlock.type === 'water' || checkBlock.type === 'mangrove_leaves') {
          // Found escape direction
          this.position.x += dir.x * 0.2;
          this.position.y += dir.y * 0.2;
          this.position.z += dir.z * 0.2;
          break;
        }
      }
    }
  }
  
  /**
   * Get distance from spawn position
   * @private
   * @returns {number} - Distance from spawn
   */
  getDistanceFromSpawn() {
    const dx = this.position.x - this.spawnPosition.x;
    const dy = this.position.y - this.spawnPosition.y;
    const dz = this.position.z - this.spawnPosition.z;
    
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }
  
  /**
   * Get light source data from firefly
   * @returns {Object|null} - Light source data or null if not active
   */
  getLightSource() {
    if (!this.active || this.glowIntensity < 0.2) return null;
    
    return {
      position: { ...this.position },
      color: this.glowColor,
      intensity: this.glowIntensity * 0.6, // Scale down intensity
      radius: 3 + (this.glowIntensity * 2), // Light radius
      flicker: true
    };
  }
  
  /**
   * Serialize firefly for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      glowColor: this.glowColor,
      glowIntensity: this.glowIntensity,
      glowCycleSpeed: this.glowCycleSpeed,
      glowState: this.glowState,
      active: this.active,
      hoverHeight: this.hoverHeight,
      moveSpeed: this.moveSpeed,
      targetPosition: this.targetPosition,
      spawnPosition: this.spawnPosition,
      maxDistanceFromSpawn: this.maxDistanceFromSpawn,
      groupId: this.groupId,
      isGroupLeader: this.isGroupLeader,
      dayActive: this.dayActive
    };
  }
  
  /**
   * Create firefly from serialized data
   * @param {Object} data - Serialized data
   * @param {Object} world - World reference
   * @returns {Firefly} - Reconstructed firefly
   */
  static fromJSON(data, world) {
    const firefly = new Firefly(world, {
      id: data.id,
      position: data.position,
      velocity: data.velocity,
      size: data.size,
      health: data.health,
      maxHealth: data.maxHealth,
      glowColor: data.glowColor,
      glowIntensity: data.glowIntensity,
      glowCycleSpeed: data.glowCycleSpeed,
      glowState: data.glowState,
      active: data.active,
      hoverHeight: data.hoverHeight,
      moveSpeed: data.moveSpeed,
      targetPosition: data.targetPosition,
      spawnPosition: data.spawnPosition,
      maxDistanceFromSpawn: data.maxDistanceFromSpawn,
      groupId: data.groupId,
      isGroupLeader: data.isGroupLeader,
      dayActive: data.dayActive
    });
    
    if (data.serialize) {
      firefly.deserialize(data);
    }
    
    return firefly;
  }
}

module.exports = Firefly; 