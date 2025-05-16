/**
 * Cherry Log - A wood type added in the Trails & Tales update
 * Has a distinctive pink hue
 */

const LogBlock = require('./logBlock');

class CherryLog extends LogBlock {
  constructor() {
    super({
      id: 'cherry_log',
      name: 'Cherry Log',
      hardness: 2.0,
      toolType: 'axe',
      stackSize: 64,
      flammable: true
    });
    
    // Special properties for the cherry log
    this.woodType = 'cherry';
    this.strippedVariant = 'stripped_cherry_log';
  }

  /**
   * Get texture indexes for this block
   * @returns {Object} - Texture configuration
   */
  getTextureConfig() {
    return {
      top: 'cherry_log_top',
      side: 'cherry_log_side'
    };
  }

  /**
   * Get the item that should be dropped when this block is broken
   * @param {Object} blockState - State of the broken block
   * @returns {Object} - The item drop information
   */
  getDrops(blockState) {
    return [{
      type: this.id,
      count: 1
    }];
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
    // Allow stripping the log with an axe
    if (itemInHand && itemInHand.type.includes('axe')) {
      // Get current block state
      const currentState = world.getBlockState(position.x, position.y, position.z);
      
      // Replace with stripped variant
      world.setBlockState(position.x, position.y, position.z, {
        type: this.strippedVariant,
        axis: currentState.axis || 'y'
      });
      
      // Damage the axe slightly
      if (player) {
        player.damageItem(itemInHand, 1);
      }
      
      // Play a sound effect
      world.playSound({
        x: position.x,
        y: position.y,
        z: position.z
      }, 'block.wood.strip', 1.0, 1.0);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the sound this block makes when broken
   * @returns {string} - Sound identifier
   */
  getBreakSound() {
    return 'block.wood.break';
  }
  
  /**
   * Get the sound this block makes when placed
   * @returns {string} - Sound identifier
   */
  getPlaceSound() {
    return 'block.wood.place';
  }
  
  /**
   * Get the sound this block makes when stepped on
   * @returns {string} - Sound identifier
   */
  getStepSound() {
    return 'block.wood.step';
  }
}

module.exports = CherryLog; 