/**
 * Tuff Variants Blocks - Various decorative tuff block variants
 * Part of the Minecraft 1.21 (Tricky Trials) Update
 */

const TuffBlock = require('./tuffBlock');
const Block = require('./block');

/**
 * Chiseled Tuff Block - Decorative variant with carved pattern
 */
class ChiseledTuffBlock extends TuffBlock {
  /**
   * Create a new chiseled tuff block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'chiseled_tuff',
      name: 'Chiseled Tuff',
      ...options
    });
    
    // Override textures for chiseled design
    this.textures = {
      top: 'blocks/chiseled_tuff_top',
      bottom: 'blocks/chiseled_tuff_top',
      sides: 'blocks/chiseled_tuff_side'
    };
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {ChiseledTuffBlock} New block instance
   */
  static deserialize(data) {
    const block = new ChiseledTuffBlock();
    block.deserialize(data);
    return block;
  }
}

/**
 * Tuff Bricks Block - Building block made from tuff
 */
class TuffBricksBlock extends TuffBlock {
  /**
   * Create a new tuff bricks block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'tuff_bricks',
      name: 'Tuff Bricks',
      ...options
    });
    
    // Override textures for brick pattern
    this.textures = {
      all: 'blocks/tuff_bricks'
    };
    
    // Tuff bricks are slightly more resistant than regular tuff
    this.blast_resistance = 7.0; // Slightly higher than regular tuff
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {TuffBricksBlock} New block instance
   */
  static deserialize(data) {
    const block = new TuffBricksBlock();
    block.deserialize(data);
    return block;
  }
}

/**
 * Tuff Brick Slab - Half-height variant of tuff bricks
 */
class TuffBrickSlabBlock extends Block {
  /**
   * Create a new tuff brick slab block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'tuff_brick_slab',
      name: 'Tuff Brick Slab',
      hardness: 1.5,
      toolType: 'pickaxe',
      minToolLevel: 'stone',
      drops: ['tuff_brick_slab'],
      ...options
    });
    
    // Slab-specific properties
    this.isTop = options.isTop !== undefined ? options.isTop : false;
    this.isDouble = options.isDouble !== undefined ? options.isDouble : false;
    
    // Override textures for brick pattern
    this.textures = {
      all: 'blocks/tuff_bricks'
    };
    
    // Slab is shorter than a full block
    this.boundingBox = this.isDouble ? 
      { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 } : // Double slab is full-sized
      this.isTop ? 
        { minX: 0, minY: 0.5, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 } : // Top slab
        { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 0.5, maxZ: 1 };  // Bottom slab
    
    // Slabs are transparent for rendering purposes
    this.transparent = !this.isDouble;
  }
  
  /**
   * Called when the block is placed
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} player - Player that placed the block
   * @returns {Object} Final block state
   */
  onPlace(world, position, player) {
    // Check if we're placing against another slab
    if (world) {
      const targetBlock = world.getBlockAt(position.x, position.y, position.z);
      
      // If there's already a slab there, turn it into a double slab
      if (targetBlock && targetBlock.id === this.id && !targetBlock.isDouble) {
        return {
          type: this.id,
          isDouble: true,
          isTop: false // Not relevant for double slabs
        };
      }
      
      // Determine if the slab should be placed on the top or bottom half
      // based on where the player is looking
      const placeOnTop = player.lookingAt && player.lookingAt.face === 'bottom';
      
      return {
        type: this.id,
        isDouble: false,
        isTop: placeOnTop
      };
    }
    
    return super.onPlace(world, position, player);
  }
  
  /**
   * Get the block's data for client
   * @returns {Object} - Block data for the client
   */
  getState() {
    return {
      ...super.getState(),
      isTop: this.isTop,
      isDouble: this.isDouble
    };
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      isTop: this.isTop,
      isDouble: this.isDouble
    };
  }
  
  /**
   * Deserialize data to restore the block's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.isTop !== undefined) {
      this.isTop = data.isTop;
    }
    if (data.isDouble !== undefined) {
      this.isDouble = data.isDouble;
    }
    
    // Update bounding box based on loaded state
    this.boundingBox = this.isDouble ? 
      { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 } : // Double slab is full-sized
      this.isTop ? 
        { minX: 0, minY: 0.5, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 } : // Top slab
        { minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 0.5, maxZ: 1 };  // Bottom slab
    
    // Update transparency
    this.transparent = !this.isDouble;
  }
  
  /**
   * Create a tuff brick slab from serialized data
   * @param {Object} data - Serialized data
   * @returns {TuffBrickSlabBlock} - New instance
   */
  static deserialize(data) {
    const block = new TuffBrickSlabBlock({
      isTop: data.isTop,
      isDouble: data.isDouble
    });
    block.deserialize(data);
    return block;
  }
}

/**
 * Tuff Brick Stairs - Stair variant of tuff bricks
 */
class TuffBrickStairsBlock extends Block {
  /**
   * Create a new tuff brick stairs block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'tuff_brick_stairs',
      name: 'Tuff Brick Stairs',
      hardness: 1.5,
      toolType: 'pickaxe',
      minToolLevel: 'stone',
      drops: ['tuff_brick_stairs'],
      ...options
    });
    
    // Stairs-specific properties
    this.facing = options.facing || 'north'; // Direction the stairs face
    this.half = options.half || 'bottom'; // top or bottom half
    this.shape = options.shape || 'straight'; // straight, inner_left, inner_right, outer_left, outer_right
    
    // Textures for brick pattern
    this.textures = {
      all: 'blocks/tuff_bricks'
    };
    
    // Stairs have a complex shape, handled by the rendering engine
    this.render = 'stairs';
    
    // Stairs are transparent for rendering purposes
    this.transparent = true;
  }
  
  /**
   * Called when the block is placed
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} player - Player that placed the block 
   * @returns {Object} Final block state
   */
  onPlace(world, position, player) {
    // Determine facing direction based on player orientation
    const facing = player.direction ? this.getFacingFromDirection(player.direction) : 'north';
    
    // Determine if stairs should be upside down based on where clicked
    const half = player.lookingAt && player.lookingAt.face === 'bottom' ? 'top' : 'bottom';
    
    // Auto-shape stairs based on neighboring stair blocks (simplified)
    const shape = 'straight'; // Default, would be calculated based on neighbors
    
    return {
      type: this.id,
      facing: facing,
      half: half,
      shape: shape
    };
  }
  
  /**
   * Convert player direction to facing direction
   * @param {string} direction - Player's direction
   * @returns {string} Facing direction
   */
  getFacingFromDirection(direction) {
    // Map cardinal directions to facing values
    const directionMap = {
      north: 'north',
      south: 'south',
      east: 'east',
      west: 'west',
      northeast: 'north',
      northwest: 'west',
      southeast: 'east',
      southwest: 'south'
    };
    
    return directionMap[direction] || 'north';
  }
  
  /**
   * Get the block's data for client
   * @returns {Object} - Block data for the client
   */
  getState() {
    return {
      ...super.getState(),
      facing: this.facing,
      half: this.half,
      shape: this.shape
    };
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      facing: this.facing,
      half: this.half,
      shape: this.shape
    };
  }
  
  /**
   * Deserialize data to restore the block's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.facing) {
      this.facing = data.facing;
    }
    if (data.half) {
      this.half = data.half;
    }
    if (data.shape) {
      this.shape = data.shape;
    }
  }
  
  /**
   * Create a tuff brick stairs from serialized data
   * @param {Object} data - Serialized data
   * @returns {TuffBrickStairsBlock} - New instance
   */
  static deserialize(data) {
    const block = new TuffBrickStairsBlock({
      facing: data.facing,
      half: data.half,
      shape: data.shape
    });
    block.deserialize(data);
    return block;
  }
}

/**
 * Tuff Brick Wall - Wall variant of tuff bricks
 */
class TuffBrickWallBlock extends Block {
  /**
   * Create a new tuff brick wall block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'tuff_brick_wall',
      name: 'Tuff Brick Wall',
      hardness: 1.5,
      toolType: 'pickaxe',
      minToolLevel: 'stone',
      drops: ['tuff_brick_wall'],
      ...options
    });
    
    // Wall-specific properties
    this.up = options.up !== undefined ? options.up : false; // Whether to connect upward
    this.north = options.north || 'none'; // none, low, tall
    this.south = options.south || 'none';
    this.east = options.east || 'none';
    this.west = options.west || 'none';
    
    // Textures for brick pattern
    this.textures = {
      all: 'blocks/tuff_bricks'
    };
    
    // Walls have a complex shape, handled by the rendering engine
    this.render = 'wall';
    
    // Walls are transparent for rendering purposes
    this.transparent = true;
  }
  
  /**
   * Called when the block is placed
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} player - Player that placed the block
   * @returns {Object} Final block state
   */
  onPlace(world, position, player) {
    // Connect to adjacent blocks
    let connections = {
      up: false,
      north: 'none',
      south: 'none',
      east: 'none',
      west: 'none'
    };
    
    if (world) {
      // Check each direction for connectable blocks
      const directions = [
        { dir: 'north', x: 0, y: 0, z: -1 },
        { dir: 'south', x: 0, y: 0, z: 1 },
        { dir: 'east', x: 1, y: 0, z: 0 },
        { dir: 'west', x: -1, y: 0, z: 0 },
        { dir: 'up', x: 0, y: 1, z: 0 }
      ];
      
      for (const { dir, x, y, z } of directions) {
        const nx = position.x + x;
        const ny = position.y + y;
        const nz = position.z + z;
        
        const neighbor = world.getBlockAt(nx, ny, nz);
        
        if (dir === 'up') {
          // Connect upward if there's a solid block above
          connections.up = !!(neighbor && neighbor.solid);
        } else {
          // Connect to walls and some other blocks
          if (neighbor) {
            if (neighbor.id.includes('wall')) {
              connections[dir] = 'tall';
            } else if (neighbor.solid) {
              connections[dir] = 'low';
            }
          }
        }
      }
    }
    
    return {
      type: this.id,
      up: connections.up,
      north: connections.north,
      south: connections.south,
      east: connections.east,
      west: connections.west
    };
  }
  
  /**
   * Called on random block tick to handle updates
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} blockState - Current block state
   * @param {Object} random - Random number generator
   */
  onRandomTick(world, position, blockState, random) {
    // Update connections when neighbor blocks change
    const connections = this.getConnections(world, position);
    
    // Check if connections changed
    if (connections.up !== this.up ||
        connections.north !== this.north ||
        connections.south !== this.south ||
        connections.east !== this.east ||
        connections.west !== this.west) {
      
      // Update self with new connections
      world.setBlockAt(position.x, position.y, position.z, {
        type: this.id,
        up: connections.up,
        north: connections.north,
        south: connections.south,
        east: connections.east,
        west: connections.west
      });
    }
  }
  
  /**
   * Get wall connections for current position
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @returns {Object} - Connection state
   */
  getConnections(world, position) {
    const connections = {
      up: false,
      north: 'none',
      south: 'none',
      east: 'none',
      west: 'none'
    };
    
    if (!world) return connections;
    
    // Check each direction for connectable blocks
    const directions = [
      { dir: 'north', x: 0, y: 0, z: -1 },
      { dir: 'south', x: 0, y: 0, z: 1 },
      { dir: 'east', x: 1, y: 0, z: 0 },
      { dir: 'west', x: -1, y: 0, z: 0 },
      { dir: 'up', x: 0, y: 1, z: 0 }
    ];
    
    for (const { dir, x, y, z } of directions) {
      const nx = position.x + x;
      const ny = position.y + y;
      const nz = position.z + z;
      
      const neighbor = world.getBlockAt(nx, ny, nz);
      
      if (dir === 'up') {
        // Connect upward if there's a solid block above
        connections.up = !!(neighbor && neighbor.solid);
      } else {
        // Connect to walls and some other blocks
        if (neighbor) {
          if (neighbor.id.includes('wall')) {
            connections[dir] = 'tall';
          } else if (neighbor.solid) {
            connections[dir] = 'low';
          }
        }
      }
    }
    
    return connections;
  }
  
  /**
   * Get the block's data for client
   * @returns {Object} - Block data for the client
   */
  getState() {
    return {
      ...super.getState(),
      up: this.up,
      north: this.north,
      south: this.south,
      east: this.east,
      west: this.west
    };
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      up: this.up,
      north: this.north,
      south: this.south,
      east: this.east,
      west: this.west
    };
  }
  
  /**
   * Deserialize data to restore the block's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.up !== undefined) {
      this.up = data.up;
    }
    if (data.north) {
      this.north = data.north;
    }
    if (data.south) {
      this.south = data.south;
    }
    if (data.east) {
      this.east = data.east;
    }
    if (data.west) {
      this.west = data.west;
    }
  }
  
  /**
   * Create a tuff brick wall from serialized data
   * @param {Object} data - Serialized data
   * @returns {TuffBrickWallBlock} - New instance
   */
  static deserialize(data) {
    const block = new TuffBrickWallBlock({
      up: data.up,
      north: data.north,
      south: data.south,
      east: data.east,
      west: data.west
    });
    block.deserialize(data);
    return block;
  }
}

module.exports = {
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
}; 