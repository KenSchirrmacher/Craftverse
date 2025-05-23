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
    this.position = position;
    this.world = world;
    if (typeof world.setBlock === 'function') {
      world.setBlock(position, this);
    } else if (typeof world.setBlockAt === 'function') {
      world.setBlockAt(position.x, position.y, position.z, this);
    }
    return this;
  }

  getDrops() {
    return [{ id: this.id, count: 1 }];
  }

  setState(key, value) {
    if (key === 'facing') {
      const validDirections = ['north', 'south', 'east', 'west'];
      if (!validDirections.includes(value)) {
        throw new Error(`Invalid facing direction: ${value}. Must be one of: ${validDirections.join(', ')}`);
      }
    }
    this.state[key] = value;
    if (this.position && this.world) {
      const blockData = this.world.getBlock(this.position.x, this.position.y, this.position.z);
      if (blockData) {
        blockData.state = { ...this.state };
        this.world.updateBlock(this.position.x, this.position.y, this.position.z, blockData);
      }
    }
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

  getCollisionBox() {
    return {
      minX: this.position.x,
      minY: this.position.y,
      minZ: this.position.z,
      maxX: this.position.x + 1,
      maxY: this.position.y + 1,
      maxZ: this.position.z + 1
    };
  }

  getBoundingBox() {
    return this.getCollisionBox();
  }

  canEntityCollide(entity) {
    return true;
  }

  resolveEntityCollision(entity) {
    const collisionBox = this.getCollisionBox();
    const entityBox = entity.getBoundingBox();
    
    // Calculate overlap in each dimension
    const overlapX = Math.min(collisionBox.maxX - entityBox.minX, entityBox.maxX - collisionBox.minX);
    const overlapY = Math.min(collisionBox.maxY - entityBox.minY, entityBox.maxY - collisionBox.minY);
    const overlapZ = Math.min(collisionBox.maxZ - entityBox.minZ, entityBox.maxZ - collisionBox.minZ);
    
    // Find the minimum overlap direction
    const minOverlap = Math.min(overlapX, overlapY, overlapZ);
    
    // Resolve collision by moving entity in the direction of minimum overlap
    if (minOverlap === overlapX) {
      if (entity.position.x < this.position.x) {
        entity.position.x = collisionBox.minX - entityBox.width;
      } else {
        entity.position.x = collisionBox.maxX;
      }
    } else if (minOverlap === overlapY) {
      if (entity.position.y < this.position.y) {
        entity.position.y = collisionBox.minY - entityBox.height;
      } else {
        entity.position.y = collisionBox.maxY;
      }
    } else if (minOverlap === overlapZ) {
      if (entity.position.z < this.position.z) {
        entity.position.z = collisionBox.minZ - entityBox.depth;
      } else {
        entity.position.z = collisionBox.maxZ;
      }
    }
    
    return { resolved: true };
  }

  calculateExplosionDamage(explosion) {
    const distance = Math.sqrt(
      Math.pow(this.position.x - explosion.position.x, 2) +
      Math.pow(this.position.y - explosion.position.y, 2) +
      Math.pow(this.position.z - explosion.position.z, 2)
    );
    
    const damage = explosion.power * (1 - distance / explosion.radius);
    return Math.max(0, damage * (1 - this.properties.blastResistance / 100));
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
    this.state = {
      facing: 'north',
      half: 'bottom',
      shape: 'straight'
    };
  }

  setState(property, value) {
    if (property === 'facing') {
      const validDirections = ['north', 'south', 'east', 'west'];
      if (!validDirections.includes(value)) {
        throw new Error(`Invalid facing direction: ${value}. Must be one of: ${validDirections.join(', ')}`);
      }
    }
    this.state[property] = value;
    if (this.position && this.world) {
      const blockData = this.world.getBlock(this.position.x, this.position.y, this.position.z);
      if (blockData) {
        blockData.state = { ...this.state };
        this.world.updateBlock(this.position.x, this.position.y, this.position.z, blockData);
      }
    }
    return this;
  }

  getState() {
    return this.state;
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