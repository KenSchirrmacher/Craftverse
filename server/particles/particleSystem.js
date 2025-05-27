/**
 * ParticleSystem - Handles creation, management, and rendering of particles in the game
 * Includes specialized particle types for various blocks and effects
 */

class ParticleSystem {
  /**
   * Create a new particle system
   */
  constructor() {
    this.particles = new Map();
    this.nextParticleId = 0;
    this.particleTypes = {
      'spore': {
        defaultColor: '#E5A9FF', // Pale pink/purple
        defaultSize: 0.1,
        defaultLifespan: 20000, // 20 seconds
        defaultGravity: 0.005
      },
      'dripping_water': {
        defaultColor: '#3F76E4', // Blue
        defaultSize: 0.05,
        defaultLifespan: 2000, // 2 seconds
        defaultGravity: 0.05
      },
      'dripping_lava': {
        defaultColor: '#E45B0D', // Orange-red
        defaultSize: 0.05,
        defaultLifespan: 1200, // 1.2 seconds
        defaultGravity: 0.03
      },
      'smoke': {
        defaultColor: '#959595', // Gray
        defaultSize: 0.15,
        defaultLifespan: 3000, // 3 seconds
        defaultGravity: -0.01 // Rises slowly
      },
      'flame': {
        defaultColor: '#FFA500', // Orange
        defaultSize: 0.1,
        defaultLifespan: 1000, // 1 second
        defaultGravity: -0.02 // Rises moderately
      },
      'portal': {
        defaultColor: '#BD00FC', // Purple
        defaultSize: 0.12,
        defaultLifespan: 5000, // 5 seconds
        defaultGravity: 0
      },
      'explosion': {
        defaultColor: '#FFAA00', // Orange
        defaultSize: 0.3,
        defaultLifespan: 800, // 0.8 seconds
        defaultGravity: 0
      },
      'splash': {
        defaultColor: '#FFFFFF', // White
        defaultSize: 0.08,
        defaultLifespan: 600, // 0.6 seconds
        defaultGravity: 0.1
      },
      'firefly_glow': {
        defaultColor: '#FFFF77', // Yellow glow
        defaultSize: 0.05,
        defaultLifespan: 400, // 0.4 seconds
        defaultGravity: -0.001, // Very slight upward drift
        isPulsing: true, // Special property for firefly particles
        pulseRate: 0.1  // How fast it pulses
      }
    };
  }
  
  /**
   * Create new particles
   * @param {Object} options - Particle creation options
   * @returns {number[]} Array of created particle IDs
   */
  emitParticles(options = {}) {
    if (!options.type || !options.position) {
      return [];
    }
    
    const count = options.count || 1;
    const createdIds = [];
    
    // Get particle type defaults
    const typeDefaults = this.particleTypes[options.type] || {};
    
    for (let i = 0; i < count; i++) {
      const particleId = this.nextParticleId++;
      
      // Apply randomization to velocity if specified
      let velocity = { ...(options.velocity || { x: 0, y: 0, z: 0 }) };
      if (options.randomizeVelocity) {
        const randomFactor = options.randomizeVelocity;
        velocity.x += (Math.random() * 2 - 1) * randomFactor;
        velocity.y += (Math.random() * 2 - 1) * randomFactor;
        velocity.z += (Math.random() * 2 - 1) * randomFactor;
      }
      
      // Create the particle
      const particle = {
        id: particleId,
        type: options.type,
        position: { ...options.position },
        velocity,
        color: options.color || typeDefaults.defaultColor || '#FFFFFF',
        size: options.size || typeDefaults.defaultSize || 0.1,
        gravity: options.gravity !== undefined ? options.gravity : (typeDefaults.defaultGravity || 0),
        lifespan: options.lifespan || typeDefaults.defaultLifespan || 1000,
        creationTime: Date.now(),
        maxDistance: options.maxDistance || 20,
        startPosition: { ...options.position },
        collides: options.collides !== undefined ? options.collides : false
      };
      
      this.particles.set(particleId, particle);
      createdIds.push(particleId);
    }
    
    return createdIds;
  }
  
  /**
   * Update all particles (called each game tick)
   * @param {World} world - World object for collision checking
   * @param {number} deltaTime - Time passed since last update in ms
   */
  update(world, deltaTime) {
    const now = Date.now();
    const secondsFactor = deltaTime / 1000;
    
    // Update each particle
    for (const [id, particle] of this.particles.entries()) {
      // Check if particle has expired
      if (now - particle.creationTime >= particle.lifespan) {
        this.particles.delete(id);
        continue;
      }
      
      // Apply gravity
      particle.velocity.y -= particle.gravity * secondsFactor;
      
      // Update position
      particle.position.x += particle.velocity.x * secondsFactor;
      particle.position.y += particle.velocity.y * secondsFactor;
      particle.position.z += particle.velocity.z * secondsFactor;
      
      // Special handling for pulsing particles (like firefly glow)
      const typeDefaults = this.particleTypes[particle.type] || {};
      if (typeDefaults.isPulsing) {
        // Calculate age as a percentage of lifespan
        const age = (now - particle.creationTime) / particle.lifespan;
        
        // Size pulsing - grow and then shrink
        if (age < 0.5) {
          // First half - grow to 1.5x size
          particle.size = typeDefaults.defaultSize * (1 + (age * 1.0));
        } else {
          // Second half - shrink to 0.5x size
          particle.size = typeDefaults.defaultSize * (1.5 - (age - 0.5) * 2);
        }
        
        // Opacity follows a similar curve but stays more visible for longer
        const opacityAge = Math.min(age * 1.5, 1.0); // Stretches the opacity curve
        particle.opacity = 1.0 - opacityAge * opacityAge; // Quadratic falloff
      }
      
      // Check max distance
      const dx = particle.position.x - particle.startPosition.x;
      const dy = particle.position.y - particle.startPosition.y;
      const dz = particle.position.z - particle.startPosition.z;
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      
      if (distanceSquared > particle.maxDistance * particle.maxDistance) {
        this.particles.delete(id);
        continue;
      }
      
      // Check collisions if enabled
      if (particle.collides && world) {
        const blockPos = {
          x: Math.floor(particle.position.x),
          y: Math.floor(particle.position.y),
          z: Math.floor(particle.position.z)
        };
        
        const block = world.getBlockAt(blockPos.x, blockPos.y, blockPos.z);
        if (block && block.solid) {
          // Handle collision (delete or bounce)
          if (particle.type === 'dripping_water' || particle.type === 'dripping_lava') {
            // Create splash particles on collision
            this.emitParticles({
              type: 'splash',
              position: particle.position,
              count: 3,
              randomizeVelocity: 0.05,
              velocity: { x: 0, y: 0.1, z: 0 }
            });
          }
          
          this.particles.delete(id);
        }
      }
    }
  }
  
  /**
   * Get all active particles for rendering
   * @returns {Object[]} Array of particle data objects
   */
  getParticlesForRendering() {
    const result = [];
    for (const particle of this.particles.values()) {
      result.push({
        id: particle.id,
        type: particle.type,
        position: { ...particle.position },
        color: particle.color,
        size: particle.size,
        age: Date.now() - particle.creationTime,
        lifespan: particle.lifespan
      });
    }
    return result;
  }
  
  /**
   * Get particles within a specific range of a position
   * @param {Vector3} position - Center position
   * @param {number} range - Distance range
   * @returns {Object[]} Array of particle data objects within range
   */
  getParticlesInRange(position, range) {
    const result = [];
    const rangeSquared = range * range;
    
    for (const particle of this.particles.values()) {
      const dx = particle.position.x - position.x;
      const dy = particle.position.y - position.y;
      const dz = particle.position.z - position.z;
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      
      if (distanceSquared <= rangeSquared) {
        result.push({
          id: particle.id,
          type: particle.type,
          position: { ...particle.position },
          color: particle.color,
          size: particle.size,
          age: Date.now() - particle.creationTime,
          lifespan: particle.lifespan
        });
      }
    }
    
    return result;
  }
  
  /**
   * Clear all particles
   */
  clearParticles() {
    this.particles.clear();
  }
  
  /**
   * Register a new particle type
   * @param {string} type - Particle type identifier
   * @param {Object} defaults - Default properties for this particle type
   */
  registerParticleType(type, defaults) {
    this.particleTypes[type] = {
      defaultColor: defaults.color || '#FFFFFF',
      defaultSize: defaults.size || 0.1,
      defaultLifespan: defaults.lifespan || 1000,
      defaultGravity: defaults.gravity || 0
    };
  }
  
  /**
   * Serialize the system state for saving
   * @returns {Object} Serialized data
   */
  serialize() {
    const particleData = [];
    for (const particle of this.particles.values()) {
      particleData.push({
        id: particle.id,
        type: particle.type,
        position: particle.position,
        velocity: particle.velocity,
        color: particle.color,
        size: particle.size,
        gravity: particle.gravity,
        lifespan: particle.lifespan,
        creationTime: particle.creationTime,
        maxDistance: particle.maxDistance,
        startPosition: particle.startPosition,
        collides: particle.collides
      });
    }
    
    return {
      particles: particleData,
      nextParticleId: this.nextParticleId
    };
  }
  
  /**
   * Deserialize from saved data
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    this.particles.clear();
    this.nextParticleId = data.nextParticleId || 0;
    
    if (data.particles && Array.isArray(data.particles)) {
      for (const pData of data.particles) {
        this.particles.set(pData.id, {
          id: pData.id,
          type: pData.type,
          position: pData.position,
          velocity: pData.velocity,
          color: pData.color,
          size: pData.size,
          gravity: pData.gravity,
          lifespan: pData.lifespan,
          creationTime: pData.creationTime,
          maxDistance: pData.maxDistance,
          startPosition: pData.startPosition,
          collides: pData.collides
        });
      }
    }
  }
  
  /**
   * Get all active particles (raw objects, for test compatibility)
   * @returns {Object[]} Array of particle objects
   */
  getParticles() {
    return Array.from(this.particles.values());
  }
}

module.exports = ParticleSystem; 