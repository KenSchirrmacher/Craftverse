const Entity = require('./entity');
const { Vector3 } = require('../math/vector3');

class ItemEntity extends Entity {
  constructor(itemData) {
    super('item');
    this.itemData = itemData;
    this.position = new Vector3(0, 0, 0);
    this.velocity = new Vector3(0, 0, 0);
    this.width = 0.25;
    this.height = 0.25;
    this.depth = 0.25;
    this.gravity = 0.04;
    this.airResistance = 0.02;
  }

  setPosition(position) {
    this.position = position;
  }

  getPosition() {
    return this.position;
  }

  getBoundingBox() {
    return {
      minX: this.position.x - this.width / 2,
      minY: this.position.y,
      minZ: this.position.z - this.depth / 2,
      maxX: this.position.x + this.width / 2,
      maxY: this.position.y + this.height,
      maxZ: this.position.z + this.depth / 2,
      width: this.width,
      height: this.height,
      depth: this.depth
    };
  }

  applyGravity() {
    // Apply gravity to velocity
    this.velocity.y -= this.gravity;
    
    // Apply air resistance
    this.velocity.x *= (1 - this.airResistance);
    this.velocity.z *= (1 - this.airResistance);
    
    // Update position
    this.position = this.position.add(this.velocity);
    
    // Check for ground collision
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
    }
  }
}

module.exports = ItemEntity; 