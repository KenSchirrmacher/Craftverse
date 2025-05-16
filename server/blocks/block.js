/**
 * Block - Base class for all blocks in the game
 */

class Block {
  /**
   * Create a new block type
   * @param {Object} options - Block options
   * @param {string} options.id - Unique block identifier
   * @param {string} options.name - Human-readable block name
   * @param {number} options.hardness - Block hardness (breaking time)
   * @param {string} options.toolType - Tool type required to break efficiently
   * @param {number} options.stackSize - Maximum stack size
   * @param {boolean} options.flammable - Whether the block can burn
   * @param {number} options.lightLevel - Light level emitted by the block
   * @param {number} options.opacity - Light opacity (how much light is blocked)
   */
  constructor(options = {}) {
    this.id = options.id || 'unknown';
    this.name = options.name || 'Unknown Block';
    this.hardness = options.hardness !== undefined ? options.hardness : 1.0;
    this.toolType = options.toolType || null;
    this.stackSize = options.stackSize || 64;
    this.flammable = options.flammable || false;
    this.lightLevel = options.lightLevel || 0;
    this.opacity = options.opacity !== undefined ? options.opacity : 15;
    this.solid = options.solid !== undefined ? options.solid : true;
    this.gravity = options.gravity || false;
    this.render = options.render !== undefined ? options.render : 'cube';
    this.textures = options.textures || {};
  }

  /**
   * Get the item that should be dropped when this block is broken
   * @param {Object} blockState - State of the broken block
   * @param {Object} toolInfo - Information about the tool used
   * @returns {Array} - Array of item drop information
   */
  getDrops(blockState, toolInfo) {
    return [
      {
        type: this.id,
        count: 1
      }
    ];
  }

  /**
   * Handle right-click interaction with the block
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} player - Player instance
   * @param {Object} itemInHand - Item being used
   * @returns {boolean} - Whether interaction was handled
   */
  onInteract(world, position, player, itemInHand) {
    return false;
  }

  /**
   * Called when a block is placed
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} player - Player instance that placed the block
   * @returns {Object} - Final block state to use
   */
  onPlace(world, position, player) {
    return { type: this.id };
  }

  /**
   * Called when a block is broken
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} player - Player instance that broke the block
   */
  onBreak(world, position, player) {
    // Default behavior is just to remove the block
    world.setBlockState(position.x, position.y, position.z, { type: 'air' });
  }

  /**
   * Called on random block tick to handle special block behavior
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} blockState - Current block state
   * @param {Object} random - Random number generator
   */
  onRandomTick(world, position, blockState, random) {
    // Default behavior is to do nothing
  }

  /**
   * Called when an entity collides with this block
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} entity - Entity that collided
   */
  onEntityCollision(world, position, entity) {
    // Default behavior is to do nothing
  }

  /**
   * Get the texture for this block
   * @returns {string} - Texture identifier
   */
  getTexture() {
    return this.id;
  }

  /**
   * Get the sound this block makes when broken
   * @returns {string} - Sound identifier
   */
  getBreakSound() {
    return 'block.stone.break';
  }

  /**
   * Get the sound this block makes when placed
   * @returns {string} - Sound identifier
   */
  getPlaceSound() {
    return 'block.stone.place';
  }

  /**
   * Get the sound this block makes when stepped on
   * @returns {string} - Sound identifier
   */
  getStepSound() {
    return 'block.stone.step';
  }

  /**
   * Convert block to a plain object for serialization
   * @returns {Object} - Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      hardness: this.hardness,
      toolType: this.toolType,
      stackSize: this.stackSize,
      flammable: this.flammable,
      lightLevel: this.lightLevel,
      opacity: this.opacity,
      solid: this.solid,
      gravity: this.gravity,
      render: this.render
    };
  }
}

module.exports = Block; 