const { World } = require('../world/world');
const { ChunkManager } = require('../world/ChunkManager');
const { blockRegistry } = require('../blocks/blockRegistry');
const { EntityManager } = require('../entity/EntityManager');
const { PhysicsEngine } = require('../physics/PhysicsEngine');

class TestWorld {
  constructor() {
    this.blocks = new Map();
  }

  setBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    this.blocks.set(key, block);
    return true;
  }

  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks.get(key) || null;
  }

  removeBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks.delete(key);
  }

  clear() {
    this.blocks.clear();
  }
}

module.exports = TestWorld; 