/**
 * HangingSignBlock - A sign that can be hung from ceilings or chains
 * Part of the Trails & Tales Update
 */

const SignBlock = require('./signBlock');

class HangingSignBlock extends SignBlock {
  /**
   * Create a new hanging sign block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    const woodType = options.woodType || 'oak';
    const attachmentType = options.attachmentType || 'ceiling';
    const isWall = attachmentType === 'wall';
    
    const id = options.id || `${woodType}_${isWall ? 'wall_' : ''}hanging_sign`;
    const name = options.name || `${woodType.charAt(0).toUpperCase() + woodType.slice(1)} ${isWall ? 'Wall ' : ''}Hanging Sign`;
    
    super({
      id,
      name,
      woodType,
      hardness: 1.0,
      toolType: 'axe',
      transparent: true,
      solid: false,
      isWallSign: isWall,
      ...options
    });
    
    // Ensure type is set correctly
    this.type = 'hanging_sign';
    
    // Hanging sign specific properties
    this.attachmentType = attachmentType; // ceiling, chain, or wall
    this.chainCount = options.chainCount || 1; // Number of chains used for attachment (1-2)
    this.rotation = options.rotation || 0; // For ceiling/chain attachments, determines the horizontal rotation (0-15)
  }
  
  /**
   * Check if the hanging sign can be placed at the given location
   * @param {Object} world - Game world object
   * @param {Object} position - Target position
   * @param {string} attachmentType - Type of attachment (ceiling, chain, or wall)
   * @returns {boolean} - Whether placement is valid
   */
  canPlaceAt(world, position, attachmentType = 'ceiling') {
    if (!world || !position) return false;
    
    try {
      // Check for valid attachment points based on type
      if (attachmentType === 'ceiling') {
        // Need a solid block above
        const blockAbove = world.getBlockState(position.x, position.y + 1, position.z);
        return !!(blockAbove && blockAbove.solid);
      } 
      else if (attachmentType === 'chain') {
        // Need a chain block above
        const blockAbove = world.getBlockState(position.x, position.y + 1, position.z);
        return !!(blockAbove && blockAbove.type === 'chain');
      }
      else if (attachmentType === 'wall') {
        // Need a solid block adjacent in the attachment direction
        const adjacentPosition = getAdjacentPosition(position, this.wallDirection);
        const adjacentBlock = world.getBlockState(adjacentPosition.x, adjacentPosition.y, adjacentPosition.z);
        return !!(adjacentBlock && adjacentBlock.solid);
      }
      
      return false;
    } catch (error) {
      console.error('Error in canPlaceAt:', error);
      return false;
    }
  }
  
  /**
   * Handle placement of the hanging sign
   * @param {Object} world - Game world object
   * @param {Object} position - Target position
   * @param {Object} player - Player placing the sign
   * @param {Object} item - The sign item being placed
   * @returns {boolean} - Whether placement was successful
   */
  onPlace(world, position, player, item) {
    if (!this.canPlaceAt(world, position, this.attachmentType)) {
      return false;
    }
    
    // Set facing based on player rotation for ceiling/chain attachments
    if (this.attachmentType === 'ceiling' || this.attachmentType === 'chain') {
      this.rotation = calculateRotation(player.rotation.y);
    }
    
    return true;
  }
  
  /**
   * Update the hanging sign when a neighbor block changes
   * @param {Object} world - Game world object
   * @param {Object} position - Sign position
   * @returns {boolean} - Whether the sign should be broken
   */
  onNeighborChanged(world, position) {
    // Check if attachment point still exists
    if (!this.canPlaceAt(world, position, this.attachmentType)) {
      // Break the sign if it can't be supported anymore
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the drops when breaking this hanging sign
   * @returns {Array} - Array of items to drop
   */
  getDrops() {
    return [
      {
        type: `${this.woodType}_hanging_sign`,
        count: 1
      }
    ];
  }
  
  /**
   * Get data for rendering the block
   * @returns {Object} - Render data
   */
  getRenderData() {
    return {
      ...super.getRenderData(),
      attachmentType: this.attachmentType,
      chainCount: this.chainCount,
      rotation: this.rotation
    };
  }
  
  /**
   * Serialize the hanging sign data
   * @returns {Object} - Serialized data
   */
  serialize() {
    const data = super.serialize();
    return {
      ...data,
      type: 'hanging_sign', // Ensure correct type is serialized
      attachmentType: this.attachmentType,
      chainCount: this.chainCount,
      rotation: this.rotation
    };
  }
  
  /**
   * Create hanging sign block from serialized data
   * @param {Object} data - Serialized data
   * @returns {HangingSignBlock} - New hanging sign instance
   * @static
   */
  static deserialize(data) {
    if (!data) return null;
    
    return new HangingSignBlock({
      id: data.id,
      woodType: data.woodType,
      text: data.text,
      textColor: data.textColor,
      isGlowing: data.isGlowing,
      isWaxed: data.isWaxed,
      facing: data.facing,
      isWallSign: data.isWallSign,
      wallDirection: data.wallDirection,
      attachmentType: data.attachmentType,
      chainCount: data.chainCount,
      rotation: data.rotation
    });
  }
}

/**
 * Calculate sign rotation from player rotation
 * @param {number} playerRotation - Player's y rotation in radians
 * @returns {number} - Sign rotation (0-15)
 * @private
 */
function calculateRotation(playerRotation) {
  // Convert to degrees for easier math
  const degrees = ((playerRotation * (180 / Math.PI)) + 360) % 360;
  
  // Map to 16 possible orientations (0-15)
  return Math.round(degrees / 22.5) % 16;
}

/**
 * Get position adjacent to the given position in the specified direction
 * @param {Object} position - Base position
 * @param {string} direction - Direction (north, east, south, west)
 * @returns {Object} - Adjacent position
 * @private
 */
function getAdjacentPosition(position, direction) {
  switch (direction) {
    case 'north':
      return { x: position.x, y: position.y, z: position.z - 1 };
    case 'east':
      return { x: position.x + 1, y: position.y, z: position.z };
    case 'south':
      return { x: position.x, y: position.y, z: position.z + 1 };
    case 'west':
      return { x: position.x - 1, y: position.y, z: position.z };
    default:
      return position;
  }
}

module.exports = HangingSignBlock; 