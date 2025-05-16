/**
 * ChiseledBookshelfItem - A placeable item that creates a chiseled bookshelf block
 * Part of the Trails & Tales Update
 */

const Item = require('./item');

class ChiseledBookshelfItem extends Item {
  /**
   * Create a new chiseled bookshelf item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'chiseled_bookshelf',
      name: 'Chiseled Bookshelf',
      stackable: true,
      maxStackSize: 64,
      ...options
    });
    
    // Make sure necessary properties are set
    this.type = 'chiseled_bookshelf';
    this.displayName = 'Chiseled Bookshelf';
    this.placeable = true;
  }
  
  /**
   * Place this item as a block in the world
   * @param {Object} world - The world to place in
   * @param {Object} position - The position to place at
   * @param {Object} player - The player placing the block
   * @param {Object} face - The face of the block clicked
   * @returns {boolean} - Whether placement was successful
   */
  place(world, position, player, face) {
    if (!world || !position) return false;
    
    // Default rotation based on player position
    let rotationY = 0;
    if (player && player.rotation) {
      // Convert player's rotation to block rotation (0, 90, 180, 270)
      const yaw = ((player.rotation.yaw % 360) + 360) % 360;
      if (yaw >= 315 || yaw < 45) {
        rotationY = 180; // Facing north
      } else if (yaw >= 45 && yaw < 135) {
        rotationY = 270; // Facing east
      } else if (yaw >= 135 && yaw < 225) {
        rotationY = 0;   // Facing south
      } else {
        rotationY = 90;  // Facing west
      }
    }
    
    // Create a new chiseled bookshelf block at the position
    const block = {
      type: 'chiseled_bookshelf',
      rotationY: rotationY,
      inventory: {
        slots: 6,
        items: Array(6).fill(null)
      },
      filledSlots: [false, false, false, false, false, false]
    };
    
    // Try to set the block in the world
    const result = world.setBlock(position.x, position.y, position.z, block);
    
    // Play placement sound
    if (result && player && player.world) {
      player.world.playSound(position, 'block.wood.place', 1.0, 1.0);
    }
    
    return result;
  }
  
  /**
   * Get special tooltip information for this item
   * @returns {string[]} - Array of tooltip text lines
   */
  getTooltip() {
    const tooltip = super.getTooltip ? super.getTooltip() : [];
    tooltip.push('Can store up to 6 books');
    tooltip.push('Emits redstone signal based on filled slots');
    return tooltip;
  }
  
  /**
   * Serialize the item data
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      count: this.count || 1
    };
  }
  
  /**
   * Create item from serialized data
   * @param {Object} data - Serialized data
   * @returns {ChiseledBookshelfItem} - The deserialized item
   */
  static deserialize(data) {
    if (!data) return null;
    
    const item = new ChiseledBookshelfItem({
      id: data.id
    });
    
    if (data.count) {
      item.count = data.count;
    }
    
    return item;
  }
}

module.exports = ChiseledBookshelfItem; 