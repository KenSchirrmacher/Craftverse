/**
 * Stripped Cherry Log - The stripped variant of the cherry log
 * Added in the Trails & Tales update
 */

const LogBlock = require('./logBlock');

class StrippedCherryLog extends LogBlock {
  constructor() {
    super({
      id: 'stripped_cherry_log',
      name: 'Stripped Cherry Log',
      hardness: 2.0,
      toolType: 'axe',
      stackSize: 64,
      flammable: true,
      woodType: 'cherry',
      stripped: true
    });
  }

  /**
   * Get texture indexes for this block
   * @returns {Object} - Texture configuration
   */
  getTextureConfig() {
    return {
      top: 'stripped_cherry_log_top',
      side: 'stripped_cherry_log_side'
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

module.exports = StrippedCherryLog; 