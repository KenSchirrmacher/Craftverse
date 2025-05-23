const Block = require('./baseBlock');
const { blockRegistry } = require('./blockRegistry');

/**
 * Base class for Tuff variant blocks
 */
class TuffVariantBlock extends Block {
  constructor(id, name, properties = {}) {
    super({
      id,
      name,
      hardness: 1.5,
      resistance: 6.0,
      ...properties
    });
    this.state = {};
  }

  place(world, position) {
    const blockData = {
      id: this.id,
      type: this.id,
      position: position,
      properties: { ...this.properties },
      metadata: {},
      version: 'v1',
      state: { ...this.state }
    };
    
    if (world.setBlock(position.x, position.y, position.z, blockData)) {
      // Return a new instance of the block with the placed data
      const placedBlock = new this.constructor();
      placedBlock.id = blockData.id;
      placedBlock.type = blockData.type;
      placedBlock.position = blockData.position;
      placedBlock.properties = blockData.properties;
      placedBlock.metadata = blockData.metadata;
      placedBlock.state = blockData.state;
      placedBlock.version = blockData.version;
      return placedBlock;
    }
    return null;
  }

  getDrops() {
    return [{ id: this.id, count: 1 }];
  }

  setState(key, value) {
    this.state[key] = value;
    return this;
  }

  getState(key) {
    return this.state[key];
  }

  getConnections(world, position) {
    const connections = {
      north: false,
      south: false,
      east: false,
      west: false,
      up: false,
      down: false
    };

    // Check each direction for solid blocks
    const directions = {
      north: { x: 0, y: 0, z: -1 },
      south: { x: 0, y: 0, z: 1 },
      east: { x: 1, y: 0, z: 0 },
      west: { x: -1, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      down: { x: 0, y: -1, z: 0 }
    };

    for (const [dir, offset] of Object.entries(directions)) {
      const checkPos = {
        x: position.x + offset.x,
        y: position.y + offset.y,
        z: position.z + offset.z
      };
      const block = world.getBlock(checkPos.x, checkPos.y, checkPos.z);
      if (block && block.properties.solid) {
        connections[dir] = true;
      }
    }

    return connections;
  }

  canPlace(world, position) {
    // Check if there's a solid block below
    const belowPos = { x: position.x, y: position.y - 1, z: position.z };
    const belowBlock = world.getBlock(belowPos.x, belowPos.y, belowPos.z);
    return belowBlock && belowBlock.properties.solid;
  }

  serialize() {
    return {
      id: this.id,
      type: this.id,
      properties: { ...this.properties },
      metadata: { ...this.metadata },
      state: { ...this.state },
      version: 'v1'
    };
  }

  static deserialize(data) {
    const block = new this();
    block.id = data.id;
    block.type = data.type;
    block.position = data.position;
    block.properties = { ...data.properties };
    block.metadata = { ...data.metadata };
    block.state = { ...data.state };
    block.version = data.version || 'v1';
    return block;
  }
}

/**
 * Chiseled Tuff block
 */
class ChiseledTuffBlock extends TuffVariantBlock {
  constructor() {
    super('chiseled_tuff', 'Chiseled Tuff', {
      transparent: false,
      lightLevel: 0,
      blastResistance: 6.0
    });
  }
}

/**
 * Tuff Bricks block
 */
class TuffBricksBlock extends TuffVariantBlock {
  constructor() {
    super('tuff_bricks', 'Tuff Bricks', {
      transparent: false,
      lightLevel: 0,
      blastResistance: 6.0
    });
  }
}

/**
 * Tuff Brick Slab block
 */
class TuffBrickSlabBlock extends TuffVariantBlock {
  constructor() {
    super('tuff_brick_slab', 'Tuff Brick Slab', {
      transparent: false,
      lightLevel: 0,
      blastResistance: 6.0,
      isSlab: true
    });
  }
}

/**
 * Tuff Brick Stairs block
 */
class TuffBrickStairsBlock extends TuffVariantBlock {
  constructor() {
    super('tuff_brick_stairs', 'Tuff Brick Stairs', {
      transparent: false,
      lightLevel: 0,
      blastResistance: 6.0,
      isStairs: true
    });
  }
}

/**
 * Tuff Brick Wall block
 */
class TuffBrickWallBlock extends TuffVariantBlock {
  constructor() {
    super('tuff_brick_wall', 'Tuff Brick Wall', {
      transparent: false,
      lightLevel: 0,
      blastResistance: 6.0,
      isWall: true
    });
  }
}

// Register all Tuff variant blocks with the main registry
const chiseledTuff = new ChiseledTuffBlock();
const tuffBricks = new TuffBricksBlock();
const tuffBrickSlab = new TuffBrickSlabBlock();
const tuffBrickStairs = new TuffBrickStairsBlock();
const tuffBrickWall = new TuffBrickWallBlock();

// Register blocks with their correct types
blockRegistry.registerBlock(chiseledTuff);
blockRegistry.registerBlockClass('chiseled_tuff', ChiseledTuffBlock);
blockRegistry.registerBlock(tuffBricks);
blockRegistry.registerBlockClass('tuff_bricks', TuffBricksBlock);
blockRegistry.registerBlock(tuffBrickSlab);
blockRegistry.registerBlockClass('tuff_brick_slab', TuffBrickSlabBlock);
blockRegistry.registerBlock(tuffBrickStairs);
blockRegistry.registerBlockClass('tuff_brick_stairs', TuffBrickStairsBlock);
blockRegistry.registerBlock(tuffBrickWall);
blockRegistry.registerBlockClass('tuff_brick_wall', TuffBrickWallBlock);

module.exports = {
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
}; 