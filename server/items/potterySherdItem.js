/**
 * PotterySherdItem - Archaeological artifact collected through excavation
 * Part of the Trails & Tales Update
 */

const Item = require('./item');

class PotterySherdItem extends Item {
  /**
   * Create a new pottery sherd item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    // Pattern determines the appearance and name
    const pattern = options.pattern || 'arms_up';
    
    // Format the name with proper capitalization
    const formattedPattern = pattern
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    super({
      type: `pottery_sherd_${pattern}`,
      name: `${formattedPattern} Pottery Sherd`,
      stackable: true,
      maxStackSize: 64,
      ...options
    });
    
    // Pottery sherd properties
    this.pattern = pattern;
    this.origin = options.origin || 'unknown'; // Where it was found
    this.category = this.getCategoryFromPattern(pattern);
  }
  
  /**
   * Determine the category based on the pattern
   * @private
   * @param {string} pattern - Pattern name
   * @returns {string} - Category name
   */
  getCategoryFromPattern(pattern) {
    // Categories group similar pottery patterns
    const categories = {
      'decoration': ['prize', 'heartbreak', 'explorer', 'skull', 'archer'],
      'storytelling': ['arms_up', 'friend', 'howl'],
      'crafting': ['brewer', 'angler', 'shelter', 'danger', 'miner']
    };
    
    for (const [category, patterns] of Object.entries(categories)) {
      if (patterns.includes(pattern)) {
        return category;
      }
    }
    
    return 'miscellaneous';
  }
  
  /**
   * Get information for the item tooltip
   * @returns {Array} - Array of tooltip lines
   */
  getTooltip() {
    const tooltip = super.getTooltip();
    
    // Add pottery sherd-specific information
    tooltip.push('');
    tooltip.push(`Category: ${this.category.charAt(0).toUpperCase() + this.category.slice(1)}`);
    tooltip.push('');
    tooltip.push('Can be used to decorate');
    tooltip.push('pottery or create decorated pots.');
    
    return tooltip;
  }
  
  /**
   * Get custom data for client rendering
   * @returns {Object} - Custom client data
   */
  getClientData() {
    return {
      ...super.getClientData(),
      pattern: this.pattern,
      category: this.category
    };
  }
  
  /**
   * Handle crafting with pottery
   * @param {Object} craftingGrid - Crafting grid data
   * @returns {boolean} - Whether this item can be used in the given recipe
   */
  canCraftWith(craftingGrid) {
    // Check if crafting with clay or pot base
    if (!craftingGrid) return false;
    
    let hasClay = false;
    let hasPotBase = false;
    
    for (const item of craftingGrid) {
      if (!item) continue;
      if (item.type === 'clay_ball') hasClay = true;
      if (item.type === 'pot_base') hasPotBase = true;
    }
    
    return hasClay || hasPotBase;
  }
  
  /**
   * Serialize pottery sherd data
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      pattern: this.pattern,
      origin: this.origin,
      category: this.category
    };
  }
  
  /**
   * Create pottery sherd from serialized data
   * @param {Object} data - Serialized data
   * @returns {PotterySherdItem} - New pottery sherd instance
   */
  static deserialize(data) {
    if (!data) return null;
    
    return new PotterySherdItem({
      id: data.id,
      type: data.type,
      count: data.count,
      pattern: data.pattern,
      origin: data.origin
    });
  }
}

module.exports = PotterySherdItem; 