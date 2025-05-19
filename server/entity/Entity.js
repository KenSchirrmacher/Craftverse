/**
 * Entity - Base class for all entities in the world
 */

class Entity {
  constructor(world, x = 0, y = 0, z = 0) {
    this.world = world;
    this.position = { x, y, z };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = { x: 1, y: 1, z: 1 };
    this.hasPhysics = true;
    this.isOnGround = false;
    this.boundingBox = {
      minX: -0.5,
      minY: 0,
      minZ: -0.5,
      maxX: 0.5,
      maxY: 1,
      maxZ: 0.5
    };
  }

  /**
   * Get the entity's bounding box
   * @returns {Object} The bounding box
   */
  getBoundingBox() {
    return {
      minX: this.position.x + this.boundingBox.minX,
      minY: this.position.y + this.boundingBox.minY,
      minZ: this.position.z + this.boundingBox.minZ,
      maxX: this.position.x + this.boundingBox.maxX,
      maxY: this.position.y + this.boundingBox.maxY,
      maxZ: this.position.z + this.boundingBox.maxZ
    };
  }

  /**
   * Update the entity
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Base update logic
  }

  /**
   * Serialize the entity to JSON
   * @returns {Object} Serialized entity data
   */
  serialize() {
    return {
      position: this.position,
      velocity: this.velocity,
      rotation: this.rotation,
      scale: this.scale,
      hasPhysics: this.hasPhysics,
      isOnGround: this.isOnGround
    };
  }

  /**
   * Deserialize the entity from JSON
   * @param {Object} data - Serialized entity data
   */
  deserialize(data) {
    this.position = data.position;
    this.velocity = data.velocity;
    this.rotation = data.rotation;
    this.scale = data.scale;
    this.hasPhysics = data.hasPhysics;
    this.isOnGround = data.isOnGround;
  }
}

module.exports = { Entity }; 