/**
 * Base Entity class - Common functionality for all entities in the game
 */
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

class Entity extends EventEmitter {
  /**
   * Create a new entity
   * @param {Object} world - World instance
   * @param {Object} options - Entity options
   */
  constructor(world, options = {}) {
    super();
    
    this.id = options.id || uuidv4();
    this.type = options.type || 'unknown';
    this.position = options.position || { x: 0, y: 0, z: 0 };
    this.rotation = options.rotation || { x: 0, y: 0, z: 0 };
    this.velocity = options.velocity || { x: 0, y: 0, z: 0 };
    this.world = world;
    this.boundingBox = options.boundingBox || this.calculateBoundingBox();
    this.gravity = options.gravity !== undefined ? options.gravity : 0.08;
    this.drag = options.drag !== undefined ? options.drag : 0.02;
    this.width = options.width || 0.6;
    this.height = options.height || 1.8;
    this.onGround = false;
    this.dead = false;
    this.age = 0;
    this.persistent = options.persistent || false;
    this.maxLifetime = options.maxLifetime || -1; // -1 means no lifetime limit
    this.dimension = options.dimension || 'overworld';
    this.data = options.data || {};
  }
  
  /**
   * Update entity state
   * @param {number} delta - Time elapsed since last update
   */
  update(delta) {
    // Increment age
    this.age += delta;
    
    // Check max lifetime
    if (this.maxLifetime > 0 && this.age >= this.maxLifetime) {
      this.remove();
      return;
    }
    
    // Apply physics
    this.applyPhysics(delta);
    
    // Emit update event
    this.emitUpdate();
  }
  
  /**
   * Apply physics to entity
   * @param {number} delta - Time elapsed since last update
   */
  applyPhysics(delta) {
    if (this.dead) return;
    
    // Apply gravity
    if (this.gravity !== 0) {
      this.velocity.y -= this.gravity * delta;
    }
    
    // Apply drag
    if (this.drag !== 0) {
      this.velocity.x *= (1 - this.drag);
      this.velocity.z *= (1 - this.drag);
      
      // Applies less drag to Y when falling
      if (this.velocity.y < 0) {
        this.velocity.y *= (1 - this.drag * 0.5);
      } else {
        this.velocity.y *= (1 - this.drag);
      }
    }
    
    // Update position based on velocity
    const prevY = this.position.y;
    
    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.position.z += this.velocity.z * delta;
    
    // Update bounding box
    this.boundingBox = this.calculateBoundingBox();
    
    // Check for ground collision
    this.checkGroundCollision(prevY);
    
    // Check for block collisions
    this.handleBlockCollisions();
  }
  
  /**
   * Check if entity is on ground
   * @param {number} prevY - Previous Y position
   */
  checkGroundCollision(prevY) {
    if (!this.world) return;
    
    // Quick ground check
    const blockBelow = Math.floor(this.position.y);
    const block = this.world.getBlock(
      Math.floor(this.position.x),
      blockBelow,
      Math.floor(this.position.z)
    );
    
    // Check if there's a solid block below
    if (block && block.isSolid && this.position.y - blockBelow < 0.1) {
      // We're on the ground
      this.onGround = true;
      
      // Stop falling and position precisely on top of block
      if (this.velocity.y < 0) {
        this.velocity.y = 0;
        this.position.y = blockBelow + 1;
      }
    } else {
      this.onGround = false;
    }
  }
  
  /**
   * Handle collisions with blocks
   */
  handleBlockCollisions() {
    if (!this.world) return;
    
    // Basic collision check with blocks
    const entityBox = this.boundingBox;
    
    // Check surrounding blocks
    const minX = Math.floor(entityBox.min.x);
    const maxX = Math.ceil(entityBox.max.x);
    const minY = Math.floor(entityBox.min.y);
    const maxY = Math.ceil(entityBox.max.y);
    const minZ = Math.floor(entityBox.min.z);
    const maxZ = Math.ceil(entityBox.max.z);
    
    for (let x = minX; x < maxX; x++) {
      for (let y = minY; y < maxY; y++) {
        for (let z = minZ; z < maxZ; z++) {
          const block = this.world.getBlock(x, y, z);
          
          if (block && block.isSolid) {
            // Calculate block bounding box
            const blockBox = {
              min: { x, y, z },
              max: { x: x + 1, y: y + 1, z: z + 1 }
            };
            
            // Check if entity intersects with block
            if (this.intersectsWith(blockBox)) {
              this.resolveBlockCollision(blockBox);
            }
          }
        }
      }
    }
  }
  
  /**
   * Resolve collision with a block
   * @param {Object} blockBox - Block bounding box
   */
  resolveBlockCollision(blockBox) {
    // Calculate overlap on each axis
    const overlapX = Math.min(
      Math.abs(this.boundingBox.max.x - blockBox.min.x),
      Math.abs(blockBox.max.x - this.boundingBox.min.x)
    );
    
    const overlapY = Math.min(
      Math.abs(this.boundingBox.max.y - blockBox.min.y),
      Math.abs(blockBox.max.y - this.boundingBox.min.y)
    );
    
    const overlapZ = Math.min(
      Math.abs(this.boundingBox.max.z - blockBox.min.z),
      Math.abs(blockBox.max.z - this.boundingBox.min.z)
    );
    
    // Find axis with smallest overlap
    if (overlapX < overlapY && overlapX < overlapZ) {
      // X-axis has smallest overlap
      if (this.boundingBox.max.x > blockBox.max.x) {
        // Colliding from right
        this.position.x += overlapX;
      } else {
        // Colliding from left
        this.position.x -= overlapX;
      }
      this.velocity.x = 0;
    } else if (overlapY < overlapX && overlapY < overlapZ) {
      // Y-axis has smallest overlap
      if (this.boundingBox.max.y > blockBox.max.y) {
        // Colliding from above
        this.position.y += overlapY;
        this.onGround = false;
      } else {
        // Colliding from below
        this.position.y -= overlapY;
        this.velocity.y = 0;
        this.onGround = true;
      }
    } else {
      // Z-axis has smallest overlap
      if (this.boundingBox.max.z > blockBox.max.z) {
        // Colliding from front
        this.position.z += overlapZ;
      } else {
        // Colliding from back
        this.position.z -= overlapZ;
      }
      this.velocity.z = 0;
    }
    
    // Update bounding box after position change
    this.boundingBox = this.calculateBoundingBox();
  }
  
  /**
   * Check if entity intersects with another box
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
   * Calculate entity bounding box based on position and size
   * @returns {Object} Bounding box with min/max vectors
   */
  calculateBoundingBox() {
    const halfWidth = this.width / 2;
    
    return {
      min: {
        x: this.position.x - halfWidth,
        y: this.position.y,
        z: this.position.z - halfWidth
      },
      max: {
        x: this.position.x + halfWidth,
        y: this.position.y + this.height,
        z: this.position.z + halfWidth
      }
    };
  }
  
  /**
   * Emit an update event with current entity state
   */
  emitUpdate() {
    this.emit('update', {
      id: this.id,
      type: this.type,
      position: { ...this.position },
      rotation: { ...this.rotation },
      velocity: { ...this.velocity }
    });
  }
  
  /**
   * Remove entity from the world
   */
  remove() {
    if (this.dead) return;
    
    this.dead = true;
    
    // Emit remove event
    this.emit('remove', { id: this.id });
    
    // Remove from world if available
    if (this.world && typeof this.world.removeEntity === 'function') {
      this.world.removeEntity(this.id);
    }
    
    // Clean up references
    this.world = null;
    this.removeAllListeners();
  }
  
  /**
   * Serialize entity data for saving or sending to client
   * @returns {Object} Serialized entity data
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      position: { ...this.position },
      rotation: { ...this.rotation },
      velocity: { ...this.velocity },
      width: this.width,
      height: this.height,
      gravity: this.gravity,
      drag: this.drag,
      age: this.age,
      maxLifetime: this.maxLifetime,
      dimension: this.dimension,
      data: { ...this.data }
    };
  }
  
  /**
   * Deserialize entity data
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    // Preserve the entity ID
    if (data.id !== undefined) this.id = data.id;
    
    if (data.position) this.position = { ...data.position };
    if (data.rotation) this.rotation = { ...data.rotation };
    if (data.velocity) this.velocity = { ...data.velocity };
    if (data.width !== undefined) this.width = data.width;
    if (data.height !== undefined) this.height = data.height;
    if (data.gravity !== undefined) this.gravity = data.gravity;
    if (data.drag !== undefined) this.drag = data.drag;
    if (data.age !== undefined) this.age = data.age;
    if (data.maxLifetime !== undefined) this.maxLifetime = data.maxLifetime;
    if (data.dimension) this.dimension = data.dimension;
    if (data.data) this.data = { ...data.data };
    
    // Update bounding box after deserializing
    this.boundingBox = this.calculateBoundingBox();
  }

  getPosition() {
    return { ...this.position };
  }

  setPosition(x, y, z) {
    this.position = { x, y, z };
  }

  getVelocity() {
    return { ...this.velocity };
  }

  setVelocity(x, y, z) {
    this.velocity = { x, y, z };
  }

  getRotation() {
    return { ...this.rotation };
  }

  setRotation(yaw, pitch) {
    this.rotation = { yaw, pitch };
  }

  isOnGround() {
    return this.onGround;
  }

  setOnGround(onGround) {
    this.onGround = onGround;
  }

  isDead() {
    return this.dead;
  }

  kill() {
    this.dead = true;
  }

  getTicksExisted() {
    return this.age;
  }

  tick() {
    this.age++;
  }

  getBoundingBox() {
    return { ...this.boundingBox };
  }

  setBoundingBox(minX, minY, minZ, maxX, maxY, maxZ) {
    this.boundingBox = {
      minX, minY, minZ,
      maxX, maxY, maxZ
    };
  }

  // Helper method to check if this entity collides with another entity
  collidesWith(other) {
    const thisBox = this.getBoundingBox();
    const otherBox = other.getBoundingBox();
    const thisPos = this.getPosition();
    const otherPos = other.getPosition();

    return (
      thisPos.x + thisBox.max.x > otherPos.x + otherBox.min.x &&
      thisPos.x + thisBox.min.x < otherPos.x + otherBox.max.x &&
      thisPos.y + thisBox.max.y > otherPos.y + otherBox.min.y &&
      thisPos.y + thisBox.min.y < otherPos.y + otherBox.max.y &&
      thisPos.z + thisBox.max.z > otherPos.z + otherBox.min.z &&
      thisPos.z + thisBox.min.z < otherPos.z + otherBox.max.z
    );
  }

  // Helper method to check if this entity is within a certain distance of another entity
  isWithinDistance(other, distance) {
    const thisPos = this.getPosition();
    const otherPos = other.getPosition();
    const dx = thisPos.x - otherPos.x;
    const dy = thisPos.y - otherPos.y;
    const dz = thisPos.z - otherPos.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) <= distance;
  }
}

// If I can't find the method, I'll let you know
console.log("Checking entity.js file content to see what we need to update...")

module.exports = Entity; 