/**
 * PotBase - Base crafting component for decorated pots
 * Part of the Trails & Tales Update's pottery system
 */

const Item = require('./item');

class PotBase extends Item {
  /**
   * Create a new pot base item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'pot_base',
      type: 'pot_base',
      name: 'Pot Base',
      stackable: true,
      maxStackSize: 64,
      ...options
    });
  }
  
  /**
   * Get information for the item tooltip
   * @returns {Array} - Array of tooltip lines
   */
  getTooltip() {
    const tooltip = super.getTooltip();
    
    tooltip.push('');
    tooltip.push('Crafted from 4 clay balls.');
    tooltip.push('');
    tooltip.push('Used to create decorated pots');
    tooltip.push('with pottery sherds.');
    
    return tooltip;
  }
  
  /**
   * Serialize pot base data
   * @returns {Object} - Serialized data
   */
  serialize() {
    return this.toJSON();
  }
  
  /**
   * Create pot base from serialized data
   * @param {Object} data - Serialized data
   * @returns {PotBase} - New pot base instance
   * @static
   */
  static deserialize(data) {
    if (!data) return null;
    
    return new PotBase({
      id: data.id,
      count: data.count
    });
  }
}

module.exports = PotBase; 