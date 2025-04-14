/**
 * Cave Vine Block Implementation
 * Provides growing vines that can produce light-emitting glow berries
 * Part of the Caves & Cliffs update
 */

// Dependencies
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

/**
 * Base class for cave vine blocks
 * Provides common functionality for both body and head segments
 */
class CaveVineBlock extends EventEmitter {
  /**
   * Create a new cave vine block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super();
    
    // Basic block properties
    this.id = options.id || uuidv4();
    this.type = options.type || 'cave_vine';
    this.hardness = 0.2;
    this.resistance = 0.2;
    this.transparent = true;
    this.solid = false;
    this.gravity = false;
    this.berries = options.berries || false;
    
    // Growth and age properties
    this.age = options.age !== undefined ? options.age : 0;
    this.maxAge = 25; // 25 age levels for berries to mature
    
    // Tool information
    this.toolType = 'any';
    this.minToolTier = 0;
    this.shearsDropSelf = true;
  }
  
  /**
   * Get the light level of this block
   * @returns {number} - Light level (0-15)
   */
  getLightLevel() {
    return this.berries ? 14 : 0;
  }
  
  /**
   * Can only place on solid blocks (ceiling for head, another vine for body)
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @returns {boolean} - Whether placement is valid
   */
  canPlaceAt(world, position) {
    return false; // Base method - specialized in subclasses
  }
  
  /**
   * Check if a block is a valid ceiling block
   * @param {Object} block - Block to check
   * @returns {boolean} - Whether the block is a valid ceiling
   */
  isValidCeiling(block) {
    if (!block || !block.solid) {
      return false;
    }
    
    // List of valid blocks to attach to (normally any solid block)
    return true;
  }
  
  /**
   * Handle block tick update for growth
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @param {Object} random - Random function or object
   */
  onTick(world, position, random) {
    // Random chance to increase age
    if (Math.random() < 0.1) {
      this.age++;
      if (this.age > this.maxAge) {
        this.age = this.maxAge;
      }
      
      // Emit update event
      this.emit('update', { block: this, position });
    }
  }
  
  /**
   * Get drops when broken
   * @param {Object} tool - Tool used to break
   * @returns {Array} - Array of item drops
   */
  getDrops(tool) {
    const drops = [];
    
    // If broken with shears, drop self
    if (tool && tool.type === 'shears' && this.shearsDropSelf) {
      drops.push({
        type: 'cave_vine',
        count: 1
      });
      return drops;
    }
    
    // If has berries, drop berries
    if (this.berries) {
      drops.push({
        type: 'glow_berries',
        count: 1
      });
    }
    
    return drops;
  }
  
  /**
   * Serialize block for saving
   * @returns {Object} - Serialized block data
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      berries: this.berries,
      age: this.age
    };
  }
  
  /**
   * Deserialize block from saved data
   * @param {Object} data - Serialized block data
   * @returns {CaveVineBlock} - Deserialized block
   */
  static deserialize(data) {
    return new CaveVineBlock({
      id: data.id,
      type: data.type,
      berries: data.berries,
      age: data.age
    });
  }
}

/**
 * Cave vine body segment (middle parts of the vine)
 * Connects to other vine segments
 */
class CaveVineBodyBlock extends CaveVineBlock {
  /**
   * Create a new cave vine body block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      ...options,
      type: 'cave_vine_body'
    });
  }
  
  /**
   * Can only place below another vine or cave vine
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @returns {boolean} - Whether placement is valid
   */
  canPlaceAt(world, position) {
    // Check block above - must be a cave vine or vine
    const blockAbove = world.getBlockAt(position.x, position.y + 1, position.z);
    return blockAbove && 
      (blockAbove.type === 'cave_vine' || 
       blockAbove.type === 'cave_vine_body' || 
       blockAbove.type === 'cave_vine_head');
  }
  
  /**
   * Handle block tick update for growth
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @param {Object} random - Random function or object
   */
  onTick(world, position, random) {
    super.onTick(world, position, random);
    
    // Berries growth based on age
    if (this.age >= this.maxAge && !this.berries && Math.random() < 0.15) {
      this.berries = true;
      this.emit('update', { block: this, position });
    }
  }
  
  /**
   * Handle block interaction (right-click)
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @param {Object} player - Player object
   * @param {Object} item - Item used for interaction
   * @returns {boolean} - Whether interaction was handled
   */
  onInteract(world, position, player, item) {
    // Handle berry harvesting
    if (this.berries) {
      // Remove berries and reset age
      this.berries = false;
      this.age = 0;
      
      // Give player berries
      if (player && player.inventory) {
        player.inventory.addItem('glow_berries', 1);
      }
      
      // Update block state
      this.emit('update', { block: this, position });
      return true;
    }
    
    // Handle bone meal
    if (item && item.type === 'bone_meal') {
      this.age = this.maxAge;
      this.berries = true;
      
      // Update block state
      this.emit('update', { block: this, position });
      
      // Consume bone meal
      if (player && player.inventory) {
        player.inventory.removeItem('bone_meal', 1);
      }
      
      // Spawn particles
      this.emit('particles', {
        type: 'bone_meal',
        position: {
          x: position.x + 0.5,
          y: position.y + 0.5,
          z: position.z + 0.5
        },
        count: 10
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle neighbor updates
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @param {string} face - Face that was updated
   * @returns {boolean} - Whether the update was handled
   */
  onNeighborUpdate(world, position, face) {
    // Check if block above was removed
    if (face === 'up') {
      const blockAbove = world.getBlockAt(position.x, position.y + 1, position.z);
      
      // If no support above, break this block
      if (!blockAbove || 
          (blockAbove.type !== 'cave_vine' && 
           blockAbove.type !== 'cave_vine_body' && 
           blockAbove.type !== 'cave_vine_head')) {
        world.removeBlock(position.x, position.y, position.z);
        
        // Drop any berries
        if (this.berries) {
          world.spawnItem({
            type: 'glow_berries',
            count: 1
          }, {
            x: position.x + 0.5,
            y: position.y + 0.5,
            z: position.z + 0.5
          });
        }
        
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Deserialize block from saved data
   * @param {Object} data - Serialized block data
   * @returns {CaveVineBodyBlock} - Deserialized block
   */
  static deserialize(data) {
    return new CaveVineBodyBlock({
      id: data.id,
      berries: data.berries,
      age: data.age
    });
  }
}

/**
 * Cave vine head segment (end of the vine)
 * Can grow downward to extend the vine
 */
class CaveVineHeadBlock extends CaveVineBlock {
  /**
   * Create a new cave vine head block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      ...options,
      type: 'cave_vine_head'
    });
  }
  
  /**
   * Can place on a ceiling block or below another vine
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @returns {boolean} - Whether placement is valid
   */
  canPlaceAt(world, position) {
    // Check block above - must be a solid block or vine
    const blockAbove = world.getBlockAt(position.x, position.y + 1, position.z);
    
    if (blockAbove) {
      // Can attach to cave vine or vine
      if (blockAbove.type === 'cave_vine_body' || blockAbove.type === 'cave_vine') {
        return true;
      }
      
      // Or can attach to solid ceiling
      if (this.isValidCeiling(blockAbove)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Handle block tick update for growth
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @param {Object} random - Random function or object
   */
  onTick(world, position, random) {
    super.onTick(world, position, random);
    
    // Berries growth based on age
    if (this.age >= this.maxAge && !this.berries && Math.random() < 0.15) {
      this.berries = true;
      this.emit('update', { block: this, position });
      return;
    }
    
    // Random chance to grow downward
    if (Math.random() < 0.05) {
      // Check block below
      const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
      
      // If there's space below, grow downward
      if (!blockBelow || blockBelow.type === 'air' || blockBelow.type === 'cave_air') {
        // This becomes a body segment
        world.setBlock(position.x, position.y, position.z, new CaveVineBodyBlock({
          berries: this.berries,
          age: this.age
        }));
        
        // Create new head segment below
        world.setBlock(position.x, position.y - 1, position.z, new CaveVineHeadBlock());
      }
    }
  }
  
  /**
   * Handle block interaction (right-click)
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @param {Object} player - Player object
   * @param {Object} item - Item used for interaction
   * @returns {boolean} - Whether interaction was handled
   */
  onInteract(world, position, player, item) {
    // Handle berry harvesting
    if (this.berries) {
      // Remove berries and reset age
      this.berries = false;
      this.age = 0;
      
      // Give player berries
      if (player && player.inventory) {
        player.inventory.addItem('glow_berries', 1);
      }
      
      // Update block state
      this.emit('update', { block: this, position });
      return true;
    }
    
    // Handle bone meal
    if (item && item.type === 'bone_meal') {
      this.age = this.maxAge;
      this.berries = true;
      
      // Update block state
      this.emit('update', { block: this, position });
      
      // Consume bone meal
      if (player && player.inventory) {
        player.inventory.removeItem('bone_meal', 1);
      }
      
      // Spawn particles
      this.emit('particles', {
        type: 'bone_meal',
        position: {
          x: position.x + 0.5,
          y: position.y + 0.5,
          z: position.z + 0.5
        },
        count: 10
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle neighbor updates
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @param {string} face - Face that was updated
   * @returns {boolean} - Whether the update was handled
   */
  onNeighborUpdate(world, position, face) {
    // Check if block above was removed
    if (face === 'up') {
      const blockAbove = world.getBlockAt(position.x, position.y + 1, position.z);
      
      // If no support above, break this block
      if (!blockAbove || 
          (blockAbove.type !== 'cave_vine_body' && 
           !this.isValidCeiling(blockAbove))) {
        world.removeBlock(position.x, position.y, position.z);
        
        // Drop any berries
        if (this.berries) {
          world.spawnItem({
            type: 'glow_berries',
            count: 1
          }, {
            x: position.x + 0.5,
            y: position.y + 0.5,
            z: position.z + 0.5
          });
        }
        
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Deserialize block from saved data
   * @param {Object} data - Serialized block data
   * @returns {CaveVineHeadBlock} - Deserialized block
   */
  static deserialize(data) {
    return new CaveVineHeadBlock({
      id: data.id,
      berries: data.berries,
      age: data.age
    });
  }
}

// Export the classes
module.exports = {
  CaveVineBlock,
  CaveVineBodyBlock,
  CaveVineHeadBlock
}; 