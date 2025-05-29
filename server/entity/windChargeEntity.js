/**
 * WindChargeEntity - Represents a wind charge projectile from the Breeze mob
 * Part of the 1.21 Tricky Trials Update
 */

const Entity = require('./entity');
const { Vector3 } = require('../math/vector3');

class WindChargeEntity extends Entity {
  /**
   * Create a new wind charge entity
   * @param {Object} options - Entity options
   */
  constructor(options = {}) {
    super({
      id: 'wind_charge',
      type: 'projectile',
      ...options
    });

    this.velocity = options.velocity || new Vector3(0, 0, 0);
    this.gravity = 0.0; // Wind charges are not affected by gravity
    this.drag = 0.0; // Wind charges maintain velocity
    this.lifetime = 60; // 3 seconds at 20 TPS
    this.age = 0;
    this.damage = 3; // Base damage
    this.knockback = 0.5; // Knockback strength
    this.radius = 0.5; // Collision radius
    this.owner = options.owner || null; // Entity that created this wind charge
  }

  /**
   * Update the wind charge's state
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    super.update(deltaTime);

    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Increment age
    this.age += deltaTime * 20; // Convert to ticks

    // Remove if lifetime exceeded
    if (this.age >= this.lifetime) {
      this.remove();
      return;
    }

    // Check for collisions
    this.checkCollisions();
  }

  /**
   * Check for collisions with entities and blocks
   * @private
   */
  checkCollisions() {
    // Get nearby entities
    const nearbyEntities = this.world.getEntitiesInRadius(this.position, this.radius);

    for (const entity of nearbyEntities) {
      // Skip owner and other wind charges
      if (entity === this.owner || entity instanceof WindChargeEntity) {
        continue;
      }

      // Check collision
      if (this.collidesWith(entity)) {
        this.onCollision(entity);
        break;
      }
    }

    // Check block collisions
    const block = this.world.getBlockAt(this.position);
    if (block && block.isSolid) {
      this.onBlockCollision(block);
    }
  }

  /**
   * Handle collision with an entity
   * @param {Entity} entity - The entity that was hit
   * @private
   */
  onCollision(entity) {
    // Apply damage and knockback
    if (entity.damage) {
      entity.damage(this.damage, this.owner);
      
      // Apply knockback
      const knockbackVector = this.velocity.normalize().multiply(this.knockback);
      entity.addVelocity(knockbackVector);
    }

    // Create wind burst effect
    this.createWindBurst();

    // Remove the wind charge
    this.remove();
  }

  /**
   * Handle collision with a block
   * @param {Block} block - The block that was hit
   * @private
   */
  onBlockCollision(block) {
    // Create wind burst effect
    this.createWindBurst();

    // Remove the wind charge
    this.remove();
  }

  /**
   * Create a wind burst effect at the current position
   * @private
   */
  createWindBurst() {
    // Create particles
    this.world.createParticleEffect('wind_burst', this.position, {
      count: 20,
      spread: 0.5,
      speed: 0.2
    });

    // Apply wind effect to nearby entities
    const affectedEntities = this.world.getEntitiesInRadius(this.position, 3);
    for (const entity of affectedEntities) {
      if (entity === this.owner) continue;

      // Apply wind force
      const direction = entity.position.subtract(this.position).normalize();
      const force = direction.multiply(0.5);
      entity.addVelocity(force);
    }
  }

  /**
   * Get the client-side data for this entity
   * @returns {Object} Data for the client
   */
  getClientData() {
    return {
      ...super.getClientData(),
      velocity: this.velocity,
      age: this.age,
      lifetime: this.lifetime
    };
  }
}

module.exports = { WindChargeEntity }; 