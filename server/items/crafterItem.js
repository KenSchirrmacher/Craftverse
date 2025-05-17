/**
 * CrafterItem - Item representation of the Crafter block
 * Places a CrafterBlock when used on a valid surface
 */

const Item = require('./item');

class CrafterItem extends Item {
  /**
   * Create a new CrafterItem
   * @param {Object} options - Item configuration options
   */
  constructor(options = {}) {
    // Set default options for crafter item
    const defaultOptions = {
      id: 'crafter',
      name: 'Crafter',
      stackable: true,
      maxStackSize: 64,
      durability: null, // Non-durable item
      placesBlock: true,
      tooltip: [
        'An automated crafting block',
        'Crafts items when powered by redstone',
        'Faces the direction you\'re looking when placed'
      ],
      ...options
    };
    
    super(defaultOptions);
  }
  
  /**
   * Use the item to place a crafter block
   * @param {Object} player - Player using the item
   * @param {Object} action - Usage action details
   * @returns {boolean} Whether the item was used successfully
   */
  use(player, action) {
    // Only handle right-click actions on blocks
    if (action.type !== 'right_click' || !action.target || action.target.type !== 'block') {
      return false;
    }
    
    const world = player.getWorld();
    if (!world) {
      return false;
    }
    
    // Get target position
    const targetBlock = action.target.block;
    const targetFace = action.target.face;
    
    // Calculate position for new block based on clicked face
    const placePos = {
      x: targetBlock.position.x + targetFace.x,
      y: targetBlock.position.y + targetFace.y,
      z: targetBlock.position.z + targetFace.z
    };
    
    // Check if position is valid for placement
    if (!world.canPlaceBlock(placePos)) {
      return false;
    }
    
    // Determine facing direction based on player orientation
    const facing = this.getPlayerFacingDirection(player);
    
    // Create crafter block with proper orientation
    const CrafterBlock = require('../blocks/crafterBlock');
    const crafterBlock = new CrafterBlock({ facing });
    
    // Place the block in the world
    const success = world.setBlock(placePos, crafterBlock);
    
    if (success) {
      // Play placement sound
      world.playSound('block.wood.place', placePos, 1.0, 1.0);
      
      // Reduce item stack if not in creative mode
      if (player.gameMode !== 'creative') {
        // Assuming this is an instance method on the actual item stack
        this.count--;
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the cardinal direction the player is facing
   * @param {Object} player - Player entity
   * @returns {string} Facing direction (north, south, east, west)
   */
  getPlayerFacingDirection(player) {
    // Extract yaw (horizontal rotation) from player
    // Normalize to 0-360 degrees
    let yaw = player.rotation.yaw % 360;
    if (yaw < 0) yaw += 360;
    
    // Convert yaw to cardinal direction
    // North: -45 to 45 (or 315 to 360 and 0 to 45)
    // East: 45 to 135
    // South: 135 to 225
    // West: 225 to 315
    if ((yaw >= 315 || yaw < 45)) {
      return 'north';
    } else if (yaw >= 45 && yaw < 135) {
      return 'east';
    } else if (yaw >= 135 && yaw < 225) {
      return 'south';
    } else {
      return 'west';
    }
  }
  
  /**
   * Serialize the item for saving
   * @returns {Object} Serialized item data
   */
  serialize() {
    return {
      ...super.serialize(),
      // Add any crafter-specific data here if needed
    };
  }
  
  /**
   * Create a tooltip for the item
   * @returns {Array} Array of tooltip lines
   */
  getTooltip() {
    return this.tooltip;
  }
}

module.exports = CrafterItem; 