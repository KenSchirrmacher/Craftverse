const Entity = require('./entity');
const { Vector3 } = require('../math/vector3');

class Zombie extends Entity {
  constructor() {
    super('zombie');
    this.position = new Vector3(0, 0, 0);
    this.velocity = new Vector3(0, 0, 0);
    this.width = 0.6;
    this.height = 1.8;
    this.depth = 0.6;
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

  findPath(targetPosition) {
    // Simple pathfinding implementation for testing
    return [
      { x: this.position.x, y: this.position.y, z: this.position.z },
      { x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }
    ];
  }
}

module.exports = Zombie; 