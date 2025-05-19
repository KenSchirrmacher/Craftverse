const { World } = require('../world/World');
const { ChunkManager } = require('../world/ChunkManager');
const { BlockRegistry } = require('../blocks/blockRegistry');
const { EntityManager } = require('../entity/EntityManager');
const { PhysicsEngine } = require('../physics/PhysicsEngine');

class TestWorld extends World {
  constructor() {
    super();
    this.chunkManager = new ChunkManager(this);
    this.blockRegistry = new BlockRegistry();
    this.entityManager = new EntityManager(this);
    this.physicsEngine = new PhysicsEngine(this);
    
    // Initialize test world with a 16x16x16 chunk
    this.initializeTestChunk();
  }

  initializeTestChunk() {
    // Create a test chunk at origin
    const chunk = this.chunkManager.createChunk(0, 0, 0);
    
    // Initialize chunk with air blocks
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        for (let z = 0; z < 16; z++) {
          chunk.setBlock(x, y, z, this.blockRegistry.getBlock('air'));
        }
      }
    }
  }

  getBlock(x, y, z) {
    const chunk = this.chunkManager.getChunkAt(x, y, z);
    if (!chunk) return null;
    
    const localX = x & 15;
    const localY = y & 15;
    const localZ = z & 15;
    
    return chunk.getBlock(localX, localY, localZ);
  }

  setBlock(x, y, z, block) {
    const chunk = this.chunkManager.getChunkAt(x, y, z);
    if (!chunk) return false;
    
    const localX = x & 15;
    const localY = y & 15;
    const localZ = z & 15;
    
    return chunk.setBlock(localX, localY, localZ, block);
  }

  isValidPosition(x, y, z) {
    return x >= 0 && x < 16 && y >= 0 && y < 16 && z >= 0 && z < 16;
  }
}

module.exports = TestWorld; 