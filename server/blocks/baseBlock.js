/**
 * Base Block class - Foundation for all block types in the game
 */

class Block {
  /**
   * Create a new block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    this.id = options.id || 'unknown';
    this.name = options.name || 'Unknown Block';
    this.hardness = options.hardness !== undefined ? options.hardness : 1.0;
    this.resistance = options.resistance !== undefined ? options.resistance : 1.0;
    this.requiresTool = options.requiresTool !== undefined ? options.requiresTool : false;
    this.transparent = options.transparent !== undefined ? options.transparent : false;
    this.solid = options.solid !== undefined ? options.solid : true;
    this.lightLevel = options.lightLevel !== undefined ? options.lightLevel : 0;
    this.flammable = options.flammable !== undefined ? options.flammable : false;
    this.model = options.model || 'cube';
    this.textureTop = options.textureTop || options.texture || this.id;
    this.textureBottom = options.textureBottom || options.texture || this.id;
    this.textureFront = options.textureFront || options.texture || this.id;
    this.textureBack = options.textureBack || options.texture || this.id;
    this.textureLeft = options.textureLeft || options.texture || this.id;
    this.textureRight = options.textureRight || options.texture || this.id;
    this.renderLayer = options.renderLayer || 'solid';
    this.drops = options.drops || [{ id: this.id, count: 1 }];
    this.rotation = options.rotation || { x: 0, y: 0, z: 0 };
    this.tintColor = options.tintColor || null;
    this.sounds = options.sounds || {
      break: 'block.generic.break',
      step: 'block.generic.footsteps',
      place: 'block.generic.place',
      hit: 'block.generic.hit'
    };
  }
  
  /**
   * Handle block updates from neighbors
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Vector3} fromPosition - Position of block that caused the update
   */
  onNeighborUpdate(world, position, fromPosition) {
    // Default implementation does nothing
  }
  
  /**
   * Handle random block updates
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Object} options - Additional update options
   */
  update(world, position, options = {}) {
    // Default implementation does nothing
  }
  
  /**
   * Handle block placement in the world
   * @param {World} world - World object
   * @param {Vector3} position - Position where block is placed
   * @param {Player} player - Player who placed the block
   * @returns {boolean} Whether placement was successful
   */
  onPlace(world, position, player) {
    return true; // Default always allows placement
  }
  
  /**
   * Handle block breaking
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Player} player - Player who broke the block
   * @param {Object} options - Additional break options
   */
  onBreak(world, position, player, options = {}) {
    if (!world) return;
    
    // Drop items
    if (player && player.gameMode !== 'creative' && this.drops.length > 0) {
      for (const drop of this.drops) {
        world.dropItem(drop, position);
      }
    }
    
    return true;
  }
  
  /**
   * Handle right click on the block
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Player} player - Player who clicked
   * @param {Object} options - Additional options
   * @returns {boolean} Whether the interaction was handled
   */
  onInteract(world, position, player, options = {}) {
    return false; // Default does not handle interactions
  }
  
  /**
   * Check if block can be placed at the given position
   * @param {World} world - World object
   * @param {Vector3} position - Position to check
   * @returns {boolean} Whether block can be placed here
   */
  canPlaceAt(world, position) {
    return true; // Default allows placement anywhere
  }
  
  /**
   * Get mining time for this block
   * @param {Player} player - Player mining the block
   * @param {Object} options - Additional options (e.g., tool)
   * @returns {number} Mining time in milliseconds
   */
  getMiningTime(player, options = {}) {
    let baseTime = this.hardness * 1500; // Base time in milliseconds
    
    if (player && options.tool) {
      const tool = options.tool;
      
      // Check if using correct tool type
      if (this.requiresTool && !this.isCorrectTool(tool)) {
        return baseTime * 3.33; // Much slower with wrong tool
      }
      
      // Apply efficiency from tool
      const efficiency = tool.efficiency || 1.0;
      baseTime /= efficiency;
      
      // Apply player mining speed modifiers (e.g., from status effects)
      if (player.miningSpeedModifier) {
        baseTime /= player.miningSpeedModifier;
      }
    }
    
    return Math.max(50, baseTime); // Minimum 50ms, even with best tools
  }
  
  /**
   * Check if a tool is the correct type for this block
   * @param {Object} tool - Tool object
   * @returns {boolean} Whether this is the correct tool
   */
  isCorrectTool(tool) {
    // Default implementation just checks if any tool is used
    return tool !== null && tool !== undefined;
  }
  
  /**
   * Get items dropped when block is broken
   * @param {Player} player - Player who broke the block
   * @param {Object} options - Additional options (e.g., tool)
   * @returns {Array} Array of drop objects (id, count)
   */
  getDrops(player, options = {}) {
    return [...this.drops]; // Return a copy of the drops array
  }
  
  /**
   * Get block collision boxes
   * @returns {Object[]} Array of collision boxes
   */
  getCollisionBoxes() {
    if (!this.solid) {
      return []; // No collision for non-solid blocks
    }
    
    // Default full block collision box
    return [
      {
        minX: 0.0,
        minY: 0.0,
        minZ: 0.0,
        maxX: 1.0,
        maxY: 1.0,
        maxZ: 1.0
      }
    ];
  }
  
  /**
   * Get the block's light level
   * @returns {number} Light level (0-15)
   */
  getLightLevel() {
    return this.lightLevel;
  }
  
  /**
   * Check if the block is flammable
   * @returns {boolean} Whether block is flammable
   */
  isFlammable() {
    return this.flammable;
  }
  
  /**
   * Convert block to JSON for serialization
   * @returns {Object} Block data
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      rotation: { ...this.rotation },
      tintColor: this.tintColor
    };
  }
  
  /**
   * Create block from JSON data
   * @param {Object} data - Block data
   * @returns {Block} Block instance
   */
  static fromJSON(data) {
    return new Block({
      id: data.id,
      name: data.name,
      rotation: data.rotation,
      tintColor: data.tintColor
    });
  }
}

module.exports = Block; 