const Block = require('./block');

/**
 * Base class for all stair blocks
 * @extends Block
 */
class StairsBlock extends Block {
  constructor(options = {}) {
    const defaultOptions = {
      id: options.id || 'stairs',
      name: options.name || 'Stairs',
      hardness: options.hardness || 2.0,
      resistance: options.resistance || 6.0,
      material: options.material || 'stone',
      isTransparent: false,
      isSolid: true,
      isStairs: true,
      lightLevel: 0,
      render: 'cube',
      solid: true,
      textures: {}
    };

    super(defaultOptions);

    // Set stair-specific properties
    this.facing = options.facing || 'north'; // north, south, east, west
    this.half = options.half || 'bottom'; // bottom, top
    this.shape = options.shape || 'straight'; // straight, inner_left, inner_right, outer_left, outer_right
    this.waterlogged = options.waterlogged || false;
    this.resistance = options.resistance || 6.0;
    this.material = options.material || 'stone';
    this.isTransparent = false;
    this.isSolid = true;
    this.isStairs = true;
  }

  /**
   * Get the current state of the stairs
   * @returns {Object} The stairs' state
   */
  getState() {
    return {
      id: this.id,
      name: this.name,
      hardness: this.hardness,
      resistance: this.resistance,
      material: this.material,
      isTransparent: this.isTransparent,
      isSolid: this.isSolid,
      isStairs: this.isStairs,
      facing: this.facing,
      half: this.half,
      shape: this.shape,
      waterlogged: this.waterlogged
    };
  }

  /**
   * Set the state of the stairs
   * @param {Object} state - The new state
   */
  setState(state) {
    if (state.facing !== undefined) this.facing = state.facing;
    if (state.half !== undefined) this.half = state.half;
    if (state.shape !== undefined) this.shape = state.shape;
    if (state.waterlogged !== undefined) this.waterlogged = state.waterlogged;
    if (state.hardness !== undefined) this.hardness = state.hardness;
    if (state.resistance !== undefined) this.resistance = state.resistance;
    if (state.material !== undefined) this.material = state.material;
    if (state.isTransparent !== undefined) this.isTransparent = state.isTransparent;
    if (state.isSolid !== undefined) this.isSolid = state.isSolid;
    if (state.isStairs !== undefined) this.isStairs = state.isStairs;
    if (state.lightLevel !== undefined) this.lightLevel = state.lightLevel;
    if (state.render !== undefined) this.render = state.render;
    if (state.solid !== undefined) this.solid = state.solid;
    if (state.textures !== undefined) this.textures = state.textures;
  }

  /**
   * Check if the stairs can be placed at the given position
   * @param {World} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} face - The face being placed against
   * @returns {boolean} Whether the stairs can be placed
   */
  canPlaceAt(world, x, y, z, face) {
    const block = world.getBlock(x, y, z);
    if (!block || block.isAir) return true;

    // Can't place on non-solid blocks
    if (!block.isSolid) return false;

    return true;
  }

  /**
   * Handle placement of the stairs
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
    // Determine facing based on player's look direction
    const dx = cursorX - x;
    const dz = cursorZ - z;
    
    if (Math.abs(dx) > Math.abs(dz)) {
      this.facing = dx > 0 ? 'east' : 'west';
    } else {
      this.facing = dz > 0 ? 'south' : 'north';
    }

    // Determine half based on cursor position
    this.half = cursorY > y + 0.5 ? 'top' : 'bottom';

    // Determine shape based on adjacent blocks
    this.updateShape(world, x, y, z);
  }

  /**
   * Update the shape of the stairs based on adjacent blocks
   * @param {World} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   */
  updateShape(world, x, y, z) {
    const facing = this.facing;
    const half = this.half;
    
    // Get adjacent blocks
    const left = this.getAdjacentBlock(world, x, y, z, this.getLeftDirection(facing));
    const right = this.getAdjacentBlock(world, x, y, z, this.getRightDirection(facing));
    
    // Check for inner/outer corners
    if (left && left.isStairs && left.facing === this.getRightDirection(facing)) {
      this.shape = half === 'top' ? 'outer_left' : 'inner_left';
    } else if (right && right.isStairs && right.facing === this.getLeftDirection(facing)) {
      this.shape = half === 'top' ? 'outer_right' : 'inner_right';
    } else {
      this.shape = 'straight';
    }
  }

  /**
   * Get the direction to the left of the given facing
   * @param {string} facing - Current facing direction
   * @returns {string} Left direction
   */
  getLeftDirection(facing) {
    switch (facing) {
      case 'north': return 'west';
      case 'south': return 'east';
      case 'east': return 'north';
      case 'west': return 'south';
      default: return facing;
    }
  }

  /**
   * Get the direction to the right of the given facing
   * @param {string} facing - Current facing direction
   * @returns {string} Right direction
   */
  getRightDirection(facing) {
    switch (facing) {
      case 'north': return 'east';
      case 'south': return 'west';
      case 'east': return 'south';
      case 'west': return 'north';
      default: return facing;
    }
  }

  /**
   * Get the block at the given position in the given direction
   * @param {World} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {string} direction - Direction to check
   * @returns {Block|null} The block or null if none exists
   */
  getAdjacentBlock(world, x, y, z, direction) {
    switch (direction) {
      case 'north': return world.getBlock(x, y, z - 1);
      case 'south': return world.getBlock(x, y, z + 1);
      case 'east': return world.getBlock(x + 1, y, z);
      case 'west': return world.getBlock(x - 1, y, z);
      default: return null;
    }
  }

  /**
   * Get the collision box for the stairs
   * @returns {Object} The collision box
   */
  getCollisionBox() {
    // Base collision box
    const box = {
      minX: 0,
      minY: 0,
      minZ: 0,
      maxX: 1,
      maxY: 1,
      maxZ: 1
    };

    // Adjust based on shape and facing
    switch (this.shape) {
      case 'inner_left':
      case 'inner_right':
        // Inner corner has full height
        break;
      case 'outer_left':
      case 'outer_right':
        // Outer corner has half height
        box.maxY = 0.5;
        break;
      default:
        // Straight stairs have half height
        box.maxY = 0.5;
    }

    return box;
  }

  /**
   * Get the selection box for the stairs
   * @returns {Object} The selection box
   */
  getSelectionBox() {
    return this.getCollisionBox();
  }

  /**
   * Get the bounding box for the stairs
   * @returns {Object} The bounding box
   */
  getBoundingBox() {
    return this.getCollisionBox();
  }
}

module.exports = StairsBlock; 