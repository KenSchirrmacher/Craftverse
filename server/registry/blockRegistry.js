/**
 * Block Registry
 * Manages block types and their registration
 */

class BlockRegistry {
  constructor() {
    if (BlockRegistry.instance) {
      return BlockRegistry.instance;
    }
    this.blocks = new Map();
    BlockRegistry.instance = this;
  }

  static getInstance() {
    if (!BlockRegistry.instance) {
      BlockRegistry.instance = new BlockRegistry();
    }
    return BlockRegistry.instance;
  }

  register(type, block) {
    this.blocks.set(type, block);
  }

  get(type) {
    return this.blocks.get(type);
  }

  has(type) {
    return this.blocks.has(type);
  }

  create(type, x, y, z) {
    const block = this.get(type);
    if (!block) {
      throw new Error(`Unknown block type: ${type}`);
    }
    return new block(x, y, z);
  }

  list() {
    return Array.from(this.blocks.keys());
  }
}

module.exports = BlockRegistry; 