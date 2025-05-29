/**
 * Entity - Base class for all entities in the world
 */

const EventEmitter = require('events');

class Entity extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.id = options.id || 'entity';
    this.type = options.type || 'entity';
    this.world = options.world || null;
    this.position = options.position || { x: 0, y: 0, z: 0 };
    this.rotation = options.rotation || { x: 0, y: 0, z: 0 };
    this.velocity = options.velocity || { x: 0, y: 0, z: 0 };
    this.health = options.health || 20;
    this.maxHealth = options.maxHealth || 20;
    this.isDead = false;
    this.isRemoved = false;
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
    if (this.isDead || this.isRemoved) return;
    
    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    this.emit('update', { deltaTime });
  }

  damage(amount, source = null) {
    if (this.isDead) return false;
    
    this.health -= amount;
    this.emit('damage', { amount, source });
    
    if (this.health <= 0) {
      this.health = 0;
      this.kill(source);
      return true;
    }
    
    return false;
  }

  heal(amount) {
    if (this.isDead) return false;
    
    const oldHealth = this.health;
    this.health = Math.min(this.health + amount, this.maxHealth);
    
    if (this.health !== oldHealth) {
      this.emit('heal', { amount });
    }
    
    return this.health === this.maxHealth;
  }

  kill(source = null) {
    if (this.isDead) return;
    
    this.isDead = true;
    this.health = 0;
    this.emit('death', { source });
  }

  remove() {
    if (this.isRemoved) return;
    
    this.isRemoved = true;
    this.emit('remove');
    
    if (this.world) {
      this.world.removeEntity(this);
    }
  }

  getClientData() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      rotation: this.rotation,
      velocity: this.velocity,
      health: this.health,
      maxHealth: this.maxHealth,
      isDead: this.isDead
    };
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

module.exports = Entity; 