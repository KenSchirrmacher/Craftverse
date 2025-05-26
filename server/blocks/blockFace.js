/**
 * BlockFace - Enum representing the six faces of a block
 * Used for block placement, interaction, and collision detection
 */
const BlockFace = {
  // Cardinal directions
  NORTH: { x: 0, y: 0, z: -1, name: 'north', opposite: 'SOUTH' },
  SOUTH: { x: 0, y: 0, z: 1, name: 'south', opposite: 'NORTH' },
  EAST: { x: 1, y: 0, z: 0, name: 'east', opposite: 'WEST' },
  WEST: { x: -1, y: 0, z: 0, name: 'west', opposite: 'EAST' },
  
  // Vertical directions
  UP: { x: 0, y: 1, z: 0, name: 'up', opposite: 'DOWN' },
  DOWN: { x: 0, y: -1, z: 0, name: 'down', opposite: 'UP' },
  
  // Helper methods
  getOpposite(face) {
    return BlockFace[BlockFace[face].opposite];
  },
  
  getFaceFromVector(vector) {
    const { x, y, z } = vector;
    
    // Check vertical faces first
    if (y > 0) return BlockFace.UP;
    if (y < 0) return BlockFace.DOWN;
    
    // Then check horizontal faces
    if (x > 0) return BlockFace.EAST;
    if (x < 0) return BlockFace.WEST;
    if (z > 0) return BlockFace.SOUTH;
    if (z < 0) return BlockFace.NORTH;
    
    // Default to up if no clear direction
    return BlockFace.UP;
  },
  
  getVectorFromFace(face) {
    return {
      x: BlockFace[face].x,
      y: BlockFace[face].y,
      z: BlockFace[face].z
    };
  }
};

module.exports = { BlockFace }; 