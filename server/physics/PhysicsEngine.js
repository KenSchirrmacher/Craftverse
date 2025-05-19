/**
 * PhysicsEngine - Handles physics simulation for the world
 */

class PhysicsEngine {
  constructor(world) {
    this.world = world;
    this.gravity = 9.8; // m/s^2
    this.airResistance = 0.02;
    this.maxFallDistance = 100;
  }

  /**
   * Update physics for all entities
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    for (const entity of this.world.entityManager.getAllEntities()) {
      this.updateEntity(entity, deltaTime);
    }
  }

  /**
   * Update physics for a single entity
   * @param {Entity} entity - The entity to update
   * @param {number} deltaTime - Time since last update in seconds
   */
  updateEntity(entity, deltaTime) {
    if (!entity.hasPhysics) {
      return;
    }

    // Apply gravity
    if (!entity.isOnGround) {
      entity.velocity.y -= this.gravity * deltaTime;
    }

    // Apply air resistance
    entity.velocity.x *= (1 - this.airResistance);
    entity.velocity.z *= (1 - this.airResistance);

    // Update position
    const newPosition = {
      x: entity.position.x + entity.velocity.x * deltaTime,
      y: entity.position.y + entity.velocity.y * deltaTime,
      z: entity.position.z + entity.velocity.z * deltaTime
    };

    // Check for collisions
    const collision = this.checkCollision(entity, newPosition);
    if (collision) {
      // Handle collision
      this.handleCollision(entity, collision);
    } else {
      // Update position if no collision
      entity.position = newPosition;
    }

    // Check if entity is on ground
    entity.isOnGround = this.checkOnGround(entity);
  }

  /**
   * Check if an entity is on the ground
   * @param {Entity} entity - The entity to check
   * @returns {boolean} Whether the entity is on the ground
   */
  checkOnGround(entity) {
    const blockBelow = this.world.getBlock(
      Math.floor(entity.position.x),
      Math.floor(entity.position.y - 0.1),
      Math.floor(entity.position.z)
    );
    return blockBelow && blockBelow.isSolid;
  }

  /**
   * Check for collisions with blocks
   * @param {Entity} entity - The entity to check
   * @param {Object} newPosition - The new position to check
   * @returns {Object|null} Collision information or null if no collision
   */
  checkCollision(entity, newPosition) {
    // Get blocks in entity's bounding box
    const blocks = this.getBlocksInBoundingBox(entity, newPosition);
    
    for (const block of blocks) {
      if (block && block.isSolid) {
        return {
          block,
          position: {
            x: Math.floor(newPosition.x),
            y: Math.floor(newPosition.y),
            z: Math.floor(newPosition.z)
          }
        };
      }
    }
    
    return null;
  }

  /**
   * Handle a collision
   * @param {Entity} entity - The entity involved in the collision
   * @param {Object} collision - Collision information
   */
  handleCollision(entity, collision) {
    // Stop vertical movement
    entity.velocity.y = 0;
    
    // Adjust position to prevent clipping
    entity.position.y = Math.ceil(entity.position.y);
    
    // Mark entity as on ground
    entity.isOnGround = true;
  }

  /**
   * Get all blocks in an entity's bounding box
   * @param {Entity} entity - The entity to check
   * @param {Object} position - The position to check
   * @returns {Array} Array of blocks in the bounding box
   */
  getBlocksInBoundingBox(entity, position) {
    const blocks = [];
    const box = entity.getBoundingBox();
    
    for (let x = Math.floor(box.minX); x <= Math.ceil(box.maxX); x++) {
      for (let y = Math.floor(box.minY); y <= Math.ceil(box.maxY); y++) {
        for (let z = Math.floor(box.minZ); z <= Math.ceil(box.maxZ); z++) {
          blocks.push(this.world.getBlock(x, y, z));
        }
      }
    }
    
    return blocks;
  }
}

module.exports = { PhysicsEngine }; 