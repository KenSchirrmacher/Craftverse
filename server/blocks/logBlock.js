/**
 * LogBlock - Base class for all wooden logs
 */

const Block = require('./block');

class LogBlock extends Block {
  /**
   * Create a new log block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super(options);
    
    // Log-specific properties
    this.woodType = options.woodType || 'oak';
    this.stripped = options.stripped || false;
    this.axis = options.axis || 'y';
    this.strippedVariant = options.strippedVariant || `stripped_${this.id}`;
    this.plankType = options.plankType || `${this.woodType}_planks`;
  }

  /**
   * Get the textures for this block
   * @returns {Object} - Texture configuration
   */
  getTextureConfig() {
    return {
      top: `${this.id}_top`,
      side: `${this.id}_side`
    };
  }
  
  /**
   * Get the item drops for this block
   * @returns {Array} - Array of item drops
   */
  getDrops() {
    return [
      {
        type: this.id,
        count: 1
      }
    ];
  }
  
  /**
   * Handle block interaction
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} player - Player instance
   * @param {Object} itemInHand - Item being used
   * @returns {boolean} - Whether interaction was handled
   */
  onInteract(world, position, player, itemInHand) {
    // Only allow stripping logs when not already stripped
    if (!this.stripped && itemInHand && itemInHand.type.includes('axe')) {
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

module.exports = LogBlock; 