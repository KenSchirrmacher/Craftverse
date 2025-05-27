/**
 * BlockFace - Enumeration and utilities for block faces
 */

class BlockFace {
  static UP = 'up';
  static DOWN = 'down';
  static NORTH = 'north';
  static SOUTH = 'south';
  static EAST = 'east';
  static WEST = 'west';

  /**
   * Get the opposite face
   * @param {string} face - The face to get the opposite of
   * @returns {string} The opposite face
   */
  static getOpposite(face) {
    const opposites = {
      [BlockFace.UP]: BlockFace.DOWN,
      [BlockFace.DOWN]: BlockFace.UP,
      [BlockFace.NORTH]: BlockFace.SOUTH,
      [BlockFace.SOUTH]: BlockFace.NORTH,
      [BlockFace.EAST]: BlockFace.WEST,
      [BlockFace.WEST]: BlockFace.EAST
    };
    return opposites[face];
  }

  /**
   * Get adjacent faces (faces that share an edge)
   * @param {string} face - The face to get adjacent faces for
   * @returns {string[]} Array of adjacent faces
   */
  static getAdjacentFaces(face) {
    const adjacent = {
      [BlockFace.UP]: [BlockFace.NORTH, BlockFace.SOUTH, BlockFace.EAST, BlockFace.WEST],
      [BlockFace.DOWN]: [BlockFace.NORTH, BlockFace.SOUTH, BlockFace.EAST, BlockFace.WEST],
      [BlockFace.NORTH]: [BlockFace.UP, BlockFace.DOWN, BlockFace.EAST, BlockFace.WEST],
      [BlockFace.SOUTH]: [BlockFace.UP, BlockFace.DOWN, BlockFace.EAST, BlockFace.WEST],
      [BlockFace.EAST]: [BlockFace.UP, BlockFace.DOWN, BlockFace.NORTH, BlockFace.SOUTH],
      [BlockFace.WEST]: [BlockFace.UP, BlockFace.DOWN, BlockFace.NORTH, BlockFace.SOUTH]
    };
    return adjacent[face];
  }

  /**
   * Get the vector direction for a face
   * @param {string} face - The face to get the vector for
   * @returns {Object} Vector with x, y, z components
   */
  static getVectorFromFace(face) {
    const vectors = {
      [BlockFace.UP]: { x: 0, y: 1, z: 0 },
      [BlockFace.DOWN]: { x: 0, y: -1, z: 0 },
      [BlockFace.NORTH]: { x: 0, y: 0, z: -1 },
      [BlockFace.SOUTH]: { x: 0, y: 0, z: 1 },
      [BlockFace.EAST]: { x: 1, y: 0, z: 0 },
      [BlockFace.WEST]: { x: -1, y: 0, z: 0 }
    };
    return vectors[face];
  }
}

module.exports = BlockFace; 