const { World } = require('../world/world');
const { ChunkManager } = require('../world/ChunkManager');
const { blockRegistry } = require('../blocks/blockRegistry');
const { EntityManager } = require('../entity/EntityManager');
const { PhysicsEngine } = require('../physics/PhysicsEngine');

class TestWorld {
  constructor() {
    this.blocks = new Map();
    this.chunks = new Map();
    this.entities = new Map();
    this.blockStates = new Map();
    this.chunkManager = new ChunkManager();
    this.entityManager = new EntityManager();
    this.physicsEngine = new PhysicsEngine();
  }

  getChunkKey(x, z) {
    const chunkX = Math.floor(x / 16);
    const chunkZ = Math.floor(z / 16);
    return `${chunkX},${chunkZ}`;
  }

  getChunk(x, z) {
    const key = this.getChunkKey(x, z);
    if (!this.chunks.has(key)) {
      this.chunks.set(key, {
        x: Math.floor(x / 16),
        z: Math.floor(z / 16),
        blocks: new Map(),
        entities: new Set()
      });
    }
    return this.chunks.get(key);
  }

  setBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    if (typeof block === 'string') {
      block = blockRegistry.create(block, x, y, z);
    }
    block.position = { x, y, z };
    block.world = this;
    this.blocks.set(key, block);
    
    // Update chunk data
    const chunk = this.getChunk(x, z);
    const localX = x % 16;
    const localZ = z % 16;
    const localKey = `${localX},${y},${localZ}`;
    chunk.blocks.set(localKey, block);
    
    // Initialize block state if not exists
    if (!this.blockStates.has(key)) {
      this.blockStates.set(key, {});
    }
    
    return block;
  }

  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks.get(key) || null;
  }

  removeBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    const block = this.blocks.get(key);
    if (block) {
      this.blocks.delete(key);
      this.blockStates.delete(key);
      
      // Update chunk data
      const chunk = this.getChunk(x, z);
      const localX = x % 16;
      const localZ = z % 16;
      const localKey = `${localX},${y},${localZ}`;
      chunk.blocks.delete(localKey);
    }
    return false;
  }

  clear() {
    this.blocks.clear();
    this.chunkManager.clear();
  }

  updateBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    if (this.blocks.has(key)) {
      block.position = { x, y, z };
      block.world = this;
      this.blocks.set(key, block);
      
      // Update chunk data
      const chunk = this.getChunk(x, z);
      const localX = x % 16;
      const localZ = z % 16;
      const localKey = `${localX},${y},${localZ}`;
      chunk.blocks.set(localKey, block);
      
      return true;
    }
    return false;
  }

  getBlockState(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blockStates.get(key) || {};
  }

  setBlockState(x, y, z, state) {
    const key = `${x},${y},${z}`;
    const currentState = this.blockStates.get(key) || {};
    this.blockStates.set(key, { ...currentState, ...state });
  }

  getEntitiesInRange(position, range) {
    return this.entityManager.getEntitiesInRange(position, range);
  }

  update() {
    this.physicsEngine.update(this);
    this.entityManager.update(this);
  }
}

module.exports = TestWorld; 