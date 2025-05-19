/**
 * ParticleManager - Manages particle effects in the world
 */

class ParticleManager {
  constructor(world) {
    this.world = world;
    this.particles = new Map();
    this.nextParticleId = 1;
  }

  /**
   * Create a particle effect
   * @param {string} type - The type of particle effect
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} options - Additional options for the particle effect
   * @returns {string} The particle effect ID
   */
  createParticle(type, x, y, z, options = {}) {
    const id = `particle_${this.nextParticleId++}`;
    const particle = {
      id,
      type,
      position: { x, y, z },
      velocity: options.velocity || { x: 0, y: 0, z: 0 },
      lifetime: options.lifetime || 1.0,
      age: 0,
      scale: options.scale || 1.0,
      color: options.color || { r: 1, g: 1, b: 1, a: 1 },
      data: options.data || {}
    };
    this.particles.set(id, particle);
    return id;
  }

  /**
   * Remove a particle effect
   * @param {string} particleId - The ID of the particle effect to remove
   * @returns {boolean} Whether the particle effect was removed
   */
  removeParticle(particleId) {
    return this.particles.delete(particleId);
  }

  /**
   * Get a particle effect by ID
   * @param {string} particleId - The ID of the particle effect to get
   * @returns {Object|null} The particle effect, or null if not found
   */
  getParticle(particleId) {
    return this.particles.get(particleId) || null;
  }

  /**
   * Get all particle effects
   * @returns {Array} Array of all particle effects
   */
  getAllParticles() {
    return Array.from(this.particles.values());
  }

  /**
   * Get particle effects within a region
   * @param {number} x1 - Start X coordinate
   * @param {number} y1 - Start Y coordinate
   * @param {number} z1 - Start Z coordinate
   * @param {number} x2 - End X coordinate
   * @param {number} y2 - End Y coordinate
   * @param {number} z2 - End Z coordinate
   * @returns {Array} Array of particle effects in the region
   */
  getParticlesInRegion(x1, y1, z1, x2, y2, z2) {
    return this.getAllParticles().filter(particle => {
      const pos = particle.position;
      return pos.x >= x1 && pos.x <= x2 &&
             pos.y >= y1 && pos.y <= y2 &&
             pos.z >= z1 && pos.z <= z2;
    });
  }

  /**
   * Update all particle effects
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    for (const [id, particle] of this.particles.entries()) {
      // Update age
      particle.age += deltaTime;
      
      // Remove expired particles
      if (particle.age >= particle.lifetime) {
        this.particles.delete(id);
        continue;
      }
      
      // Update position
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.position.z += particle.velocity.z * deltaTime;
      
      // Update color alpha based on lifetime
      const lifeRatio = 1 - (particle.age / particle.lifetime);
      particle.color.a = lifeRatio;
    }
  }

  /**
   * Clear all particle effects
   */
  clear() {
    this.particles.clear();
  }
}

module.exports = { ParticleManager }; 