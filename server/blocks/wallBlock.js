/**
 * Wall Block - Base class for wall blocks
 */
const Block = require('./block');

class WallBlock extends Block {
  constructor(options = {}) {
    super({
      id: options.id || 'wall',
      name: options.name || 'Wall',
      hardness: options.hardness || 1.5,
      blastResistance: options.blastResistance || 6.0,
      transparent: false,
      lightLevel: 0,
      toolType: 'pickaxe',
      toolTier: 1,
      ...options
    });
    
    // Wall-specific properties
    this.connections = {
      north: false,
      south: false,
      east: false,
      west: false,
      up: false
    };
    
    // Wall blocks are always solid
    this.isSolid = true;
  }
  
  /**
   * Called when the block is placed
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} player - Player that placed the block
   * @returns {Object} Final block state
   */
  onPlace(world, position, player) {
    if (!world) return super.onPlace(world, position, player);
    
    // Update connections based on neighboring blocks
    this.updateConnections(world, position);
    
    return this.getState();
  }
  
  /**
   * Update wall connections based on neighboring blocks
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   */
  updateConnections(world, position) {
    // Check each direction
    this.connections.north = this.canConnectTo(world, position.x, position.y, position.z - 1);
    this.connections.south = this.canConnectTo(world, position.x, position.y, position.z + 1);
    this.connections.east = this.canConnectTo(world, position.x + 1, position.y, position.z);
    this.connections.west = this.canConnectTo(world, position.x - 1, position.y, position.z);
    this.connections.up = this.canConnectTo(world, position.x, position.y + 1, position.z);
  }
  
  /**
   * Check if this wall can connect to a block at the given position
   * @param {Object} world - World instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @returns {boolean} Whether this wall can connect to the block
   */
  canConnectTo(world, x, y, z) {
    const block = world.getBlock(x, y, z);
    if (!block) return false;
    
    // Can connect to solid blocks and other walls
    return block.isSolid || block instanceof WallBlock;
  }
  
  /**
   * Get the block's data for client
   * @returns {Object} Block data for the client
   */
  getState() {
    return {
      ...super.getState(),
      connections: this.connections
    };
  }
  
  /**
   * Serialize the block's data
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      connections: this.connections
    };
  }
  
  /**
   * Deserialize the block's data
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    super.deserialize(data);
    this.connections = data.connections || {
      north: false,
      south: false,
      east: false,
      west: false,
      up: false
    };
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {WallBlock} New block instance
   */
  static deserialize(data) {
    const block = new WallBlock();
    block.deserialize(data);
    return block;
  }
}

module.exports = WallBlock; 