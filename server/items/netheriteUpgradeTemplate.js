/**
 * NetheriteUpgradeTemplate - Smithing template for upgrading diamond equipment to netherite
 * Part of the 1.20 update, requiring specific templates for upgrades
 */

const Item = require('./item');

/**
 * Class representing a smithing template for upgrading diamond equipment to netherite
 */
class NetheriteUpgradeTemplate extends Item {
  /**
   * Create a new netherite upgrade template
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    const defaults = {
      id: 'netherite_upgrade_template',
      name: 'Netherite Upgrade Smithing Template',
      stackable: true,
      maxStackSize: 64,
      type: 'netherite_upgrade_template',
      rarity: 'rare',
      description: 'Required for upgrading diamond equipment to netherite'
    };
    
    // Make sure defaults are correctly merged with options
    const mergedOptions = {...defaults, ...options};
    super(mergedOptions);
    
    // Template-specific properties
    this.isNetheriteUpgradeTemplate = true;
    this.ingredientSlots = ['diamond_equipment', 'netherite_ingot'];
    this.applicableTo = [
      'diamond_helmet', 'diamond_chestplate', 'diamond_leggings', 'diamond_boots',
      'diamond_sword', 'diamond_pickaxe', 'diamond_axe', 'diamond_shovel', 'diamond_hoe'
    ];
  }
  
  /**
   * Check if this template can be applied to the specified item
   * @param {Object} item - Item to check
   * @returns {boolean} Whether this template can be applied
   */
  canApplyTo(item) {
    if (!item || !item.type) return false;
    
    return this.applicableTo.includes(item.type);
  }
  
  /**
   * Get a description of how to obtain this template
   * @returns {string} Description of source
   */
  getSource() {
    return 'Found in bastion remnants, ancient cities, and nether fortresses';
  }
  
  /**
   * Get usage instructions for the template
   * @returns {string} Instructions
   */
  getUsageInstructions() {
    return 'Place in a smithing table along with a piece of diamond equipment and a netherite ingot to upgrade the equipment to netherite.';
  }
  
  /**
   * Serialize to JSON
   * @returns {Object} Serialized data
   * @override
   */
  toJSON() {
    const data = super.toJSON();
    return {
      ...data,
      isNetheriteUpgradeTemplate: this.isNetheriteUpgradeTemplate,
      ingredientSlots: this.ingredientSlots,
      applicableTo: this.applicableTo
    };
  }
  
  /**
   * Deserialize from JSON
   * @param {Object} data - Serialized data
   * @returns {NetheriteUpgradeTemplate} New netherite upgrade template
   * @static
   */
  static fromJSON(data) {
    return new NetheriteUpgradeTemplate(data);
  }
}

module.exports = {
  NetheriteUpgradeTemplate
}; 