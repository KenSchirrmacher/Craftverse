/**
 * EnhancedPotBaseItem - Base item for crafting enhanced pots
 * Part of the Minecraft 1.23 Update's Decorated Pots Expansion
 */

const Item = require('./item');

class EnhancedPotBaseItem extends Item {
  /**
   * Create a new enhanced pot base item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'enhanced_pot_base',
      type: 'enhanced_pot_base',
      name: 'Enhanced Pot Base',
      stackable: true,
      maxStackSize: 64,
      ...options
    });
    
    // Additional pot base properties
    this.material = options.material || 'clay'; // Can be upgraded with other materials
    this.quality = options.quality || 1; // Quality level affects pot durability and effects
  }
  
  /**
   * Get information for the item tooltip
   * @returns {Array} - Array of tooltip lines
   */
  getTooltip() {
    const tooltip = super.getTooltip();
    
    tooltip.push('');
    tooltip.push('A sturdy base for creating');
    tooltip.push('enhanced decorated pots.');
    tooltip.push('');
    
    // Display material information
    let materialText = 'Clay';
    if (this.material === 'reinforced_clay') {
      materialText = 'Reinforced Clay';
    } else if (this.material === 'terracotta') {
      materialText = 'Terracotta';
    } else if (this.material === 'glazed') {
      materialText = 'Glazed Ceramic';
    }
    
    tooltip.push(`Material: ${materialText}`);
    
    // Display quality information
    if (this.quality > 1) {
      tooltip.push(`Quality: ${this.quality}`);
      tooltip.push('Produces more durable pots');
      tooltip.push('with enhanced effects.');
    }
    
    return tooltip;
  }
  
  /**
   * Handle crafting with pottery sherds
   * @param {Object} craftingGrid - Crafting grid data
   * @returns {boolean} - Whether this item can be used in the given recipe
   */
  canCraftWith(craftingGrid) {
    if (!craftingGrid) return false;
    
    // Check for pottery sherds in the grid
    let sherdCount = 0;
    
    for (const item of craftingGrid) {
      if (!item) continue;
      if (item.type.startsWith('pottery_sherd_')) {
        sherdCount++;
      }
    }
    
    // Need at least one sherd to craft
    return sherdCount > 0;
  }
  
  /**
   * Upgrade the pot base with a new material
   * @param {string} material - New material type
   * @returns {EnhancedPotBaseItem} - The upgraded pot base
   */
  upgradeMaterial(material) {
    // Valid materials for upgrade
    const validMaterials = ['reinforced_clay', 'terracotta', 'glazed'];
    
    if (!validMaterials.includes(material)) {
      return this;
    }
    
    // Create a new pot base with upgraded material
    return new EnhancedPotBaseItem({
      material,
      quality: this.getQualityForMaterial(material)
    });
  }
  
  /**
   * Get quality level for a given material
   * @param {string} material - Material type
   * @returns {number} - Quality level
   * @private
   */
  getQualityForMaterial(material) {
    switch (material) {
      case 'reinforced_clay': return 2;
      case 'terracotta': return 3;
      case 'glazed': return 4;
      default: return 1;
    }
  }
  
  /**
   * Get custom data for client rendering
   * @returns {Object} - Custom client data
   */
  getClientData() {
    return {
      ...super.getClientData(),
      material: this.material,
      quality: this.quality
    };
  }
  
  /**
   * Serialize enhanced pot base data
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      material: this.material,
      quality: this.quality
    };
  }
  
  /**
   * Create enhanced pot base from serialized data
   * @param {Object} data - Serialized data
   * @returns {EnhancedPotBaseItem} - New enhanced pot base instance
   * @static
   */
  static deserialize(data) {
    if (!data) return null;
    
    return new EnhancedPotBaseItem({
      id: data.id,
      count: data.count,
      material: data.material,
      quality: data.quality
    });
  }
}

module.exports = EnhancedPotBaseItem; 