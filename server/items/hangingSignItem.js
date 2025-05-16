/**
 * HangingSignItem - Item for placing hanging signs
 * Part of the Trails & Tales Update
 */

const Item = require('./item');
const HangingSignBlock = require('../blocks/hangingSignBlock');

class HangingSignItem extends Item {
  /**
   * Create a new hanging sign item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    const woodType = options.woodType || 'oak';
    const formattedWoodType = woodType.charAt(0).toUpperCase() + woodType.slice(1);
    
    super({
      id: options.id || `${woodType}_hanging_sign`,
      type: `${woodType}_hanging_sign`,
      name: options.name || `${formattedWoodType} Hanging Sign`,
      stackable: true,
      maxStackSize: 16,
      ...options
    });
    
    // Explicitly set placeable property
    this.placeable = true;
    
    // Save the wood type for the sign
    this.woodType = woodType;
  }
  
  /**
   * Place the hanging sign in the world
   * @param {Object} world - Game world
   * @param {Object} position - Position to place at
   * @param {Object} player - Player placing the sign
   * @param {Object} clickedFace - Face that was clicked
   * @returns {boolean} - Whether placement was successful
   */
  place(world, position, player, clickedFace) {
    if (!world || !position || !player) return false;
    
    // Determine attachment type based on clicked face
    let attachmentType = 'ceiling';
    let attachPosition = { ...position };
    
    if (clickedFace === 'bottom') {
      // Clicked under a block, ceiling attachment
      attachmentType = 'ceiling';
      // We want to place the sign at the position below the clicked block
      attachPosition = {
        x: position.x,
        y: position.y - 1,
        z: position.z
      };
    } 
    else if (clickedFace === 'top') {
      // Clicked on top of a block, likely a chain
      const clickedBlock = world.getBlockState(position.x, position.y, position.z);
      if (clickedBlock && clickedBlock.type === 'chain') {
        attachmentType = 'chain';
        // We place the sign below the chain
        attachPosition = {
          x: position.x,
          y: position.y - 1,
          z: position.z
        };
      } else {
        // Can't attach to this face
        return false;
      }
    }
    else {
      // Clicked on a side face (north, east, south, west)
      attachmentType = 'wall';
      // We place the sign in front of the clicked face
      switch (clickedFace) {
        case 'north':
          attachPosition.z -= 1;
          break;
        case 'east':
          attachPosition.x += 1;
          break;
        case 'south':
          attachPosition.z += 1;
          break;
        case 'west':
          attachPosition.x -= 1;
          break;
      }
    }
    
    // Check if the position is available
    const blockAtPosition = world.getBlockState(
      attachPosition.x,
      attachPosition.y,
      attachPosition.z
    );
    
    if (blockAtPosition && blockAtPosition.type !== 'air') {
      return false;
    }
    
    // Create the hanging sign block
    const signBlock = new HangingSignBlock({
      woodType: this.woodType,
      attachmentType,
      // For wall signs, the wall direction is opposite to the clicked face
      wallDirection: getOppositeDirection(clickedFace),
    });
    
    // Check if the sign can be placed at this position
    if (!signBlock.canPlaceAt(world, attachPosition, attachmentType)) {
      return false;
    }
    
    // Apply player rotation for ceiling/chain signs
    if (attachmentType === 'ceiling' || attachmentType === 'chain') {
      signBlock.rotation = calculateRotation(player.rotation.y);
    }
    
    // Place the sign block
    world.setBlockState(
      attachPosition.x,
      attachPosition.y,
      attachPosition.z,
      signBlock
    );
    
    // Play placement sound
    if (player && player.emitSound) {
      player.emitSound('block.wood.place', { 
        position: attachPosition, 
        volume: 1.0, 
        pitch: 0.8 
      });
    }
    
    return true;
  }
  
  /**
   * Get information for the item tooltip
   * @returns {Array} - Array of tooltip lines
   */
  getTooltip() {
    const tooltip = super.getTooltip();
    
    tooltip.push('');
    tooltip.push('Can be attached to:');
    tooltip.push('- The underside of blocks');
    tooltip.push('- Chains');
    tooltip.push('- The side of blocks');
    
    return tooltip;
  }
  
  /**
   * Serialize hanging sign item data
   * @returns {Object} - Serialized data
   */
  serialize() {
    const data = this.toJSON();
    return {
      ...data,
      woodType: this.woodType,
      placeable: this.placeable
    };
  }
  
  /**
   * Create hanging sign item from serialized data
   * @param {Object} data - Serialized data
   * @returns {HangingSignItem} - New hanging sign item instance
   * @static
   */
  static deserialize(data) {
    if (!data) return null;
    
    return new HangingSignItem({
      id: data.id,
      count: data.count,
      woodType: data.woodType
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
 * Get the opposite direction of a face
 * @param {string} direction - Direction (north, east, south, west)
 * @returns {string} - Opposite direction
 * @private
 */
function getOppositeDirection(direction) {
  switch (direction) {
    case 'north': return 'south';
    case 'east': return 'west';
    case 'south': return 'north';
    case 'west': return 'east';
    default: return direction;
  }
}

module.exports = HangingSignItem; 