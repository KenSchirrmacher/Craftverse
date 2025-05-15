/**
 * Ink Sac Items implementation
 * Regular ink sacs from squids and glow ink sacs from glow squids
 */

const Item = require('./item');

class InkSacItem extends Item {
  /**
   * Create a new ink sac item
   * @param {number} count - Number of items in the stack
   * @param {object} options - Additional options
   */
  constructor(count = 1, options = {}) {
    super({
      id: 'ink_sac',
      name: 'Ink Sac',
      stackSize: 64,
      count,
      ...options
    });
    
    // Ink sac specific properties
    this.dyeColor = 'black';
    this.useAsColorModifier = true;
  }
  
  /**
   * Apply ink sac as black dye to an item
   * @param {object} item - The item to dye
   * @returns {boolean} - Whether the application was successful
   */
  applyToDyeable(item) {
    if (!item || !item.canBeDyed) {
      return false;
    }
    
    item.color = this.dyeColor;
    return true;
  }
  
  /**
   * Get special crafting behavior
   */
  getCraftingProperties() {
    return {
      dyeColor: this.dyeColor,
      specialCraftingType: 'dye'
    };
  }
}

class GlowInkSacItem extends InkSacItem {
  /**
   * Create a new glow ink sac item
   * @param {number} count - Number of items in the stack
   * @param {object} options - Additional options
   */
  constructor(count = 1, options = {}) {
    super(count, options);
    
    // Override base properties
    this.id = 'glow_ink_sac';
    this.name = 'Glow Ink Sac';
    
    // Glow ink specific properties
    this.glowing = true;
    this.lightLevel = 4; // Emits a small amount of light
  }
  
  /**
   * Apply glow ink sac to a sign to make it glow
   * @param {object} sign - The sign to make glow
   * @returns {boolean} - Whether the application was successful
   */
  applyToSign(sign) {
    if (!sign || sign.type !== 'sign') {
      return false;
    }
    
    sign.glowing = true;
    return true;
  }
  
  /**
   * Apply glow ink sac to item frames to make them glow
   * @param {object} itemFrame - The item frame to make glow
   * @returns {boolean} - Whether the application was successful
   */
  applyToItemFrame(itemFrame) {
    if (!itemFrame || itemFrame.type !== 'item_frame') {
      return false;
    }
    
    itemFrame.glowing = true;
    return true;
  }
  
  /**
   * Get special crafting behavior
   */
  getCraftingProperties() {
    return {
      dyeColor: this.dyeColor,
      specialCraftingType: 'glow_dye',
      glowing: true
    };
  }
}

module.exports = {
  InkSacItem,
  GlowInkSacItem
}; 