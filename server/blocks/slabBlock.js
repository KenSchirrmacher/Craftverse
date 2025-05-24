const Block = require('./block');

/**
 * Base class for all slab blocks
 * @extends Block
 */
class SlabBlock extends Block {
  constructor(options = {}) {
    super({
      id: options.id || 'slab',
      name: options.name || 'Slab',
      hardness: options.hardness || 2.0,
      resistance: options.resistance || 6.0,
      material: options.material || 'stone',
      isTransparent: false,
      isSolid: true,
      isSlab: true,
      ...options
    });

    this.type = options.type || 'bottom'; // bottom, top, double
    this.waterlogged = options.waterlogged || false;
  }

  /**
   * Get the current state of the slab
   * @returns {Object} The slab's state
   */
  getState() {
    return {
      ...super.getState(),
      type: this.type,
      waterlogged: this.waterlogged
    };
  }

  /**
   * Set the state of the slab
   * @param {Object} state - The new state
   */
  setState(state) {
    super.setState(state);
    if (state.type !== undefined) this.type = state.type;
    if (state.waterlogged !== undefined) this.waterlogged = state.waterlogged;
  }

  /**
   * Check if the slab can be placed at the given position
   * @param {World} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} face - The face being placed against
   * @returns {boolean} Whether the slab can be placed
   */
  canPlaceAt(world, x, y, z, face) {
    const block = world.getBlock(x, y, z);
    if (!block || block.isAir) return true;

    // Can't place on non-solid blocks
    if (!block.isSolid) return false;

    // Can't place on slabs of the same type
    if (block.isSlab && block.type === this.type) return false;

    return true;
  }

  /**
   * Handle placement of the slab
   * @param {World} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} face - The face being placed against
   * @param {number} cursorX - Cursor X position
   * @param {number} cursorY - Cursor Y position
   * @param {number} cursorZ - Cursor Z position
   */
  onPlace(world, x, y, z, face, cursorX, cursorY, cursorZ) {
    const block = world.getBlock(x, y, z);
    
    // If placing on a slab, create a double slab
    if (block && block.isSlab && block.type !== this.type) {
      const doubleSlab = new this.constructor({
        ...this,
        type: 'double'
      });
      world.setBlock(x, y, z, doubleSlab);
      return;
    }

    // Determine slab type based on placement
    if (face === 0) { // Bottom face
      this.type = 'top';
    } else if (face === 1) { // Top face
      this.type = 'bottom';
    } else {
      // Use cursor position to determine type
      const relativeY = cursorY - Math.floor(cursorY);
      this.type = relativeY > 0.5 ? 'bottom' : 'top';
    }

    super.onPlace(world, x, y, z, face, cursorX, cursorY, cursorZ);
  }

  /**
   * Get the collision box for the slab
   * @returns {Object} The collision box
   */
  getCollisionBox() {
    const height = this.type === 'double' ? 1.0 : 0.5;
    return {
      minX: 0,
      minY: 0,
      minZ: 0,
      maxX: 1,
      maxY: height,
      maxZ: 1
    };
  }

  /**
   * Get the selection box for the slab
   * @returns {Object} The selection box
   */
  getSelectionBox() {
    return this.getCollisionBox();
  }

  /**
   * Get the bounding box for the slab
   * @returns {Object} The bounding box
   */
  getBoundingBox() {
    return this.getCollisionBox();
  }
}

module.exports = SlabBlock; 