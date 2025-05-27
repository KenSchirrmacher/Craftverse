/**
 * BlockBase - Base class for all blocks
 * Provides common functionality and properties for all blocks
 */
const { BlockFace } = require('./blockFace');

class BlockBase {
  /**
   * Create a new block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    this.id = options.id || 'unknown';
    this.name = options.name || 'Unknown Block';
    this.type = options.type || 'block';
    this.isSolid = options.isSolid ?? true;
    this.isTransparent = options.isTransparent ?? false;
    this.lightLevel = options.lightLevel || 0;
    this.hardness = options.hardness || 1.0;
    this.resistance = options.resistance || 1.0;
    this.properties = new Map(options.properties || []);
    this.state = new Map(options.state || []);
  }
  
  /**
   * Get a block property
   * @param {string} key - Property key
   * @returns {*} Property value
   */
  getProperty(key) {
    return this.properties.get(key);
  }
  
  /**
   * Set a block property
   * @param {string} key - Property key
   * @param {*} value - Property value
   */
  setProperty(key, value) {
    this.properties.set(key, value);
  }
  
  /**
   * Get a block state value
   * @param {string} key - State key
   * @returns {*} State value
   */
  getState(key) {
    return this.state.get(key);
  }
  
  /**
   * Set a block state value
   * @param {string} key - State key
   * @param {*} value - State value
   */
  setState(key, value) {
    this.state.set(key, value);
  }
  
  /**
   * Get the block's bounding box
   * @returns {Object} The bounding box
   */
  getBoundingBox() {
    return {
      minX: 0,
      minY: 0,
      minZ: 0,
      maxX: 1,
      maxY: 1,
      maxZ: 1
    };
  }
  
  /**
   * Get the block's light emission
   * @returns {number} The light level
   */
  getLightLevel() {
    return this.lightLevel;
  }
  
  /**
   * Get the block's light absorption
   * @returns {number} The light absorption
   */
  getLightAbsorption() {
    return this.isTransparent ? 0 : 15;
  }
  
  /**
   * Check if the block can be placed at the given position
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {string} face - The face to place against
   * @returns {boolean} Whether the block can be placed
   */
  canPlaceAt(world, x, y, z, face) {
    return true;
  }
  
  /**
   * Handle block placement
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {string} face - The face to place against
   */
  onPlace(world, x, y, z, face) {
    // Override in subclasses
  }
  
  /**
   * Handle block breaking
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   */
  onBreak(world, x, y, z) {
    // Override in subclasses
  }
  
  /**
   * Handle block update
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   */
  onUpdate(world, x, y, z) {
    // Override in subclasses
  }
  
  /**
   * Handle neighbor block update
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   */
  onNeighborUpdate(world, x, y, z) {
    // Override in subclasses
  }
  
  /**
   * Serialize the block state
   * @returns {Object} The serialized state
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      isSolid: this.isSolid,
      isTransparent: this.isTransparent,
      lightLevel: this.lightLevel,
      hardness: this.hardness,
      resistance: this.resistance,
      properties: Array.from(this.properties.entries()),
      state: Array.from(this.state.entries())
    };
  }
  
  /**
   * Deserialize the block state
   * @param {Object} data - The serialized state
   * @returns {BlockBase} The deserialized block
   */
  static deserialize(data) {
    return new BlockBase({
      id: data.id,
      name: data.name,
      type: data.type,
      isSolid: data.isSolid,
      isTransparent: data.isTransparent,
      lightLevel: data.lightLevel,
      hardness: data.hardness,
      resistance: data.resistance,
      properties: data.properties,
      state: data.state
    });
  }
}

module.exports = BlockBase; 