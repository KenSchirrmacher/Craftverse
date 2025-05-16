/**
 * DecoratedPotItem - Item representation of the Decorated Pot block
 * Part of the Trails & Tales Update's pottery system
 */

const Item = require('./item');

class DecoratedPotItem extends Item {
  /**
   * Create a new decorated pot item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'decorated_pot',
      type: 'decorated_pot',
      name: 'Decorated Pot',
      stackable: true,
      maxStackSize: 1, // Only stack non-decorated pots
      ...options
    });
    
    // Mark as placeable directly
    this.placeable = true;
    
    // The sherds displayed on each side (north, east, south, west)
    this.sherds = options.sherds || {
      north: null, 
      east: null, 
      south: null, 
      west: null
    };
    
    // If the pot has items stored in it
    this.inventory = options.inventory || {
      slots: 1,
      items: []
    };
    
    // Custom properties
    this.hasCustomSherds = this.checkForCustomSherds();
  }
  
  /**
   * Check if this pot has any custom sherds applied
   * @returns {boolean} - Whether any sherds are applied
   * @private
   */
  checkForCustomSherds() {
    for (const side in this.sherds) {
      if (this.sherds[side]) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get the name of the item, with customization if present
   * @returns {string} - The name to display
   */
  getDisplayName() {
    if (this.hasCustomSherds) {
      return 'Decorated Pot';
    }
    return 'Pot';
  }
  
  /**
   * Get information for the item tooltip
   * @returns {Array} - Array of tooltip lines
   */
  getTooltip() {
    const tooltip = super.getTooltip();
    
    tooltip.push('');
    
    // List which sherds are applied
    if (this.hasCustomSherds) {
      tooltip.push('Applied sherds:');
      for (const side in this.sherds) {
        if (this.sherds[side]) {
          const formattedPattern = this.sherds[side]
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          tooltip.push(` - ${side.charAt(0).toUpperCase() + side.slice(1)}: ${formattedPattern}`);
        } else {
          tooltip.push(` - ${side.charAt(0).toUpperCase() + side.slice(1)}: None`);
        }
      }
    } else {
      tooltip.push('A simple clay pot.');
    }
    
    // Show if it contains an item
    if (this.inventory.items.length > 0) {
      tooltip.push('');
      tooltip.push('Contains:');
      for (const item of this.inventory.items) {
        tooltip.push(` - ${item.name || item.type} x${item.count}`);
      }
    }
    
    return tooltip;
  }
  
  /**
   * Handle placement of the decorated pot
   * @param {Object} world - The game world
   * @param {Object} position - The position to place at
   * @param {Object} player - The player placing the pot
   * @returns {Object|boolean} - Result of placement
   */
  place(world, position, player) {
    if (!world || !position) return false;
    
    // Get the facing direction based on player rotation
    const rotationY = player ? calculateRotation(player.rotation.y) : 0;
    
    // Check if we can place a block here
    if (world.getBlockState(position.x, position.y, position.z)) {
      const currentBlock = world.getBlockState(position.x, position.y, position.z);
      if (currentBlock && currentBlock.type !== 'air') {
        return false;
      }
    }
    
    // Create the decorated pot block
    const potBlock = {
      type: 'decorated_pot',
      sherds: { ...this.sherds },
      inventory: { ...this.inventory },
      rotationY
    };
    
    // Place it in the world
    world.setBlockState(position.x, position.y, position.z, potBlock);
    
    // Play placement sound
    if (player && player.emitSound) {
      player.emitSound('block.decorated_pot.place', { position, volume: 1.0, pitch: 1.0 });
    }
    
    return true;
  }
  
  /**
   * Serialize decorated pot item data
   * @returns {Object} - Serialized data
   */
  serialize() {
    const data = this.toJSON();
    return {
      ...data,
      placeable: this.placeable,
      sherds: this.sherds,
      inventory: this.inventory,
      hasCustomSherds: this.hasCustomSherds
    };
  }
  
  /**
   * Create decorated pot item from serialized data
   * @param {Object} data - Serialized data
   * @returns {DecoratedPotItem} - New decorated pot item instance
   * @static
   */
  static deserialize(data) {
    if (!data) return null;
    
    return new DecoratedPotItem({
      id: data.id,
      count: data.count,
      sherds: data.sherds,
      inventory: data.inventory
    });
  }
}

/**
 * Calculate block rotation from player rotation
 * @param {number} playerRotation - Player's y rotation in radians
 * @returns {number} - Block rotation (0, 1, 2, 3) for N, E, S, W
 * @private
 */
function calculateRotation(playerRotation) {
  // Convert to degrees for easier math
  const degrees = ((playerRotation * (180 / Math.PI)) + 360) % 360;
  
  // The player is facing the opposite direction from the block front
  // Map to N, E, S, W (0, 1, 2, 3)
  if (degrees >= 315 || degrees < 45) {
    return 2; // North
  } else if (degrees >= 45 && degrees < 135) {
    return 3; // East
  } else if (degrees >= 135 && degrees < 225) {
    return 0; // South
  } else {
    return 1; // West
  }
}

module.exports = DecoratedPotItem; 