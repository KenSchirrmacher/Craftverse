/**
 * WolfArmorItem - Wolf armor item implementation
 * Part of the 1.22 Sorcery Update
 */

const Item = require('./item');

/**
 * Enum for wolf armor materials
 * @readonly
 * @enum {string}
 */
const WolfArmorMaterial = {
  LEATHER: 'leather',
  IRON: 'iron',
  GOLD: 'gold',
  DIAMOND: 'diamond',
  NETHERITE: 'netherite'
};

/**
 * Wolf armor item class
 */
class WolfArmorItem extends Item {
  /**
   * Create a new wolf armor item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    const defaults = {
      stackable: false,
      maxStackSize: 1,
      type: 'wolf_armor',
      subtype: 'wolf_equipment',
      category: 'equipment',
      armorMaterial: options.armorMaterial || WolfArmorMaterial.IRON,
      armorValue: 0,
      durability: 100,
      maxDurability: 100,
      trim: null
    };
    
    super({...defaults, ...options});
    
    // Armor-specific properties
    this.armorMaterial = options.armorMaterial || defaults.armorMaterial;
    this.armorValue = options.armorValue || this.calculateDefaultArmorValue();
    
    // Trim properties (similar to player armor)
    this.trim = options.trim || null; // { pattern: string, material: string }
  }
  
  /**
   * Calculate the default armor value based on material
   * @returns {number} Armor value
   * @private
   */
  calculateDefaultArmorValue() {
    const materialValues = {
      [WolfArmorMaterial.LEATHER]: 2,
      [WolfArmorMaterial.IRON]: 4,
      [WolfArmorMaterial.GOLD]: 3,
      [WolfArmorMaterial.DIAMOND]: 6,
      [WolfArmorMaterial.NETHERITE]: 8
    };
    
    return materialValues[this.armorMaterial] || 2;
  }
  
  /**
   * Apply an armor trim to this item
   * @param {Object} trim - Trim data
   * @param {string} trim.pattern - Pattern ID
   * @param {string} trim.material - Material ID
   * @returns {boolean} Whether the trim was applied successfully
   */
  applyTrim(trim) {
    if (!trim || !trim.pattern || !trim.material) return false;
    
    // Use the same trim materials and patterns as player armor
    const { ArmorTrimMaterials, ArmorTrimPatterns } = require('./armorItem');
    
    // Check if material is valid
    if (!ArmorTrimMaterials.includes(trim.material)) return false;
    
    // Check if pattern is valid
    if (!ArmorTrimPatterns.includes(trim.pattern)) return false;
    
    // Apply the trim
    this.trim = {
      pattern: trim.pattern,
      material: trim.material
    };
    
    return true;
  }
  
  /**
   * Remove the armor trim from this item
   * @returns {boolean} Whether the trim was removed successfully
   */
  removeTrim() {
    if (!this.trim) return false;
    
    this.trim = null;
    return true;
  }
  
  /**
   * Check if this item has a trim
   * @returns {boolean} Whether the item has a trim
   */
  hasTrim() {
    return this.trim !== null;
  }
  
  /**
   * Get the trim information
   * @returns {Object|null} Trim data or null if no trim
   */
  getTrim() {
    return this.trim;
  }
  
  /**
   * Use the armor on a wolf
   * @param {Player} player - The player using the item
   * @param {Object} context - Use context with target wolf
   * @returns {boolean} Whether the armor was applied successfully
   */
  use(player, context) {
    // Check if we have a target wolf
    if (!context || !context.target || context.target.type !== 'wolf') {
      return false;
    }
    
    const wolf = context.target;
    
    // Can only equip armor on tamed wolves
    if (!wolf.tamed || wolf.owner !== player.id) {
      return false;
    }
    
    // Apply armor to the wolf
    return wolf.equipArmor(this);
  }
  
  /**
   * Get the tooltip text for the item
   * @returns {string[]} Array of tooltip lines
   */
  getTooltip() {
    const tooltip = [this.name];
    
    tooltip.push(`Armor Value: +${this.armorValue}`);
    
    if (this.durability !== null && this.maxDurability !== null) {
      tooltip.push(`Durability: ${this.durability}/${this.maxDurability}`);
    }
    
    if (this.trim) {
      tooltip.push(`Trim: ${this.getTrimPatternName()} (${this.getTrimMaterialName()})`);
    }
    
    return tooltip;
  }
  
  /**
   * Get the trim pattern name
   * @returns {string|null} Pattern name or null if no trim
   */
  getTrimPatternName() {
    if (!this.trim) return null;
    
    const patternNames = {
      'coast': 'Coast',
      'dune': 'Dune',
      'eye': 'Eye',
      'host': 'Host', 
      'raiser': 'Raiser',
      'rib': 'Rib',
      'sentry': 'Sentry',
      'shaper': 'Shaper',
      'silence': 'Silence',
      'snout': 'Snout',
      'spire': 'Spire',
      'tide': 'Tide',
      'vex': 'Vex',
      'ward': 'Ward',
      'wayfinder': 'Wayfinder',
      'wild': 'Wild'
    };
    
    return patternNames[this.trim.pattern] || this.trim.pattern;
  }
  
  /**
   * Get the trim material name
   * @returns {string|null} Material name or null if no trim
   */
  getTrimMaterialName() {
    if (!this.trim) return null;
    
    const materialNames = {
      'iron': 'Iron',
      'copper': 'Copper',
      'gold': 'Gold',
      'lapis': 'Lapis Lazuli',
      'emerald': 'Emerald',
      'diamond': 'Diamond',
      'netherite': 'Netherite',
      'redstone': 'Redstone',
      'amethyst': 'Amethyst',
      'quartz': 'Quartz'
    };
    
    return materialNames[this.trim.material] || this.trim.material;
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
      armorMaterial: this.armorMaterial,
      armorValue: this.armorValue,
      trim: this.trim
    };
  }
  
  /**
   * Deserialize from JSON
   * @param {Object} data - Serialized data
   * @returns {WolfArmorItem} New wolf armor item
   * @static
   */
  static fromJSON(data) {
    return new WolfArmorItem(data);
  }
}

// Create specific wolf armor material classes
class LeatherWolfArmorItem extends WolfArmorItem {
  constructor(options = {}) {
    super({
      id: 'leather_wolf_armor',
      name: 'Leather Wolf Armor',
      description: 'Basic protection for your loyal companion.',
      armorMaterial: WolfArmorMaterial.LEATHER,
      durability: 80,
      maxDurability: 80,
      ...options
    });
  }
}

class IronWolfArmorItem extends WolfArmorItem {
  constructor(options = {}) {
    super({
      id: 'iron_wolf_armor',
      name: 'Iron Wolf Armor',
      description: 'Sturdy protection for your wolf.',
      armorMaterial: WolfArmorMaterial.IRON,
      durability: 160,
      maxDurability: 160,
      ...options
    });
  }
}

class GoldWolfArmorItem extends WolfArmorItem {
  constructor(options = {}) {
    super({
      id: 'golden_wolf_armor',
      name: 'Golden Wolf Armor',
      description: 'Flashy but somewhat fragile protection for your wolf.',
      armorMaterial: WolfArmorMaterial.GOLD,
      durability: 112,
      maxDurability: 112,
      ...options
    });
  }
}

class DiamondWolfArmorItem extends WolfArmorItem {
  constructor(options = {}) {
    super({
      id: 'diamond_wolf_armor',
      name: 'Diamond Wolf Armor',
      description: 'Premium protection for your loyal companion.',
      armorMaterial: WolfArmorMaterial.DIAMOND,
      durability: 240,
      maxDurability: 240,
      ...options
    });
  }
}

class NetheriteWolfArmorItem extends WolfArmorItem {
  constructor(options = {}) {
    super({
      id: 'netherite_wolf_armor',
      name: 'Netherite Wolf Armor',
      description: 'The ultimate protection for your loyal companion.',
      armorMaterial: WolfArmorMaterial.NETHERITE,
      durability: 320,
      maxDurability: 320,
      ...options
    });
  }
}

// Export the wolf armor item classes
module.exports = {
  WolfArmorItem,
  WolfArmorMaterial,
  LeatherWolfArmorItem,
  IronWolfArmorItem,
  GoldWolfArmorItem,
  DiamondWolfArmorItem,
  NetheriteWolfArmorItem
}; 