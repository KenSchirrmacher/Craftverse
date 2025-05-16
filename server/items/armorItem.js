/**
 * ArmorItem - Base class for all armor items with shared properties
 * Including Armor Trims functionality for Trails & Tales Update
 */

const Item = require('./item');

/**
 * Enum for armor types
 * @readonly
 * @enum {string}
 */
const ArmorType = {
  HELMET: 'helmet',
  CHESTPLATE: 'chestplate',
  LEGGINGS: 'leggings',
  BOOTS: 'boots'
};

/**
 * Enum for armor materials
 * @readonly
 * @enum {string}
 */
const ArmorMaterial = {
  LEATHER: 'leather',
  CHAINMAIL: 'chainmail',
  IRON: 'iron',
  GOLD: 'gold',
  DIAMOND: 'diamond',
  NETHERITE: 'netherite'
};

/**
 * Base class for all armor items
 */
class ArmorItem extends Item {
  /**
   * Create a new armor item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    const defaults = {
      stackable: false,
      durability: 100,
      maxDurability: 100,
      type: 'armor_item',
      armorType: options.armorType || ArmorType.HELMET,
      armorMaterial: options.armorMaterial || ArmorMaterial.IRON,
      armorValue: 0,
      trim: null
    };
    
    super({...defaults, ...options});
    
    // Armor-specific properties
    this.armorType = options.armorType || defaults.armorType;
    this.armorMaterial = options.armorMaterial || defaults.armorMaterial;
    this.armorValue = options.armorValue || this.calculateDefaultArmorValue();
    
    // Trim properties for Trails & Tales Update
    this.trim = options.trim || null; // { pattern: string, material: string }
  }
  
  /**
   * Calculate the default armor value based on material and type
   * @returns {number} Armor value
   * @private
   */
  calculateDefaultArmorValue() {
    const materialValues = {
      [ArmorMaterial.LEATHER]: 1,
      [ArmorMaterial.CHAINMAIL]: 2,
      [ArmorMaterial.IRON]: 2,
      [ArmorMaterial.GOLD]: 1,
      [ArmorMaterial.DIAMOND]: 3,
      [ArmorMaterial.NETHERITE]: 3
    };
    
    const typeMultipliers = {
      [ArmorType.HELMET]: 1,
      [ArmorType.CHESTPLATE]: 1.6,
      [ArmorType.LEGGINGS]: 1.4,
      [ArmorType.BOOTS]: 1
    };
    
    const baseMaterialValue = materialValues[this.armorMaterial] || 1;
    const typeMultiplier = typeMultipliers[this.armorType] || 1;
    
    return Math.round(baseMaterialValue * typeMultiplier);
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
   * Get the trim color
   * @returns {string|null} Hex color value or null if no trim
   */
  getTrimColor() {
    if (!this.trim) return null;
    
    const materialColors = {
      'iron': '#C8C8C8',
      'copper': '#D3715F',
      'gold': '#FDCF41',
      'lapis': '#2956A2',
      'emerald': '#21A53A',
      'diamond': '#4CEDF5',
      'netherite': '#484848',
      'redstone': '#E02F2F',
      'amethyst': '#9C6CD3',
      'quartz': '#E7E2DC'
    };
    
    return materialColors[this.trim.material] || '#FFFFFF';
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
      armorType: this.armorType,
      armorMaterial: this.armorMaterial,
      armorValue: this.armorValue,
      trim: this.trim
    };
  }
  
  /**
   * Deserialize from JSON
   * @param {Object} data - Serialized data
   * @returns {ArmorItem} New armor item
   * @static
   */
  static fromJSON(data) {
    return new ArmorItem(data);
  }
}

// Valid armor trim materials
const ArmorTrimMaterials = [
  'iron', 'copper', 'gold', 'lapis', 'emerald', 
  'diamond', 'netherite', 'redstone', 'amethyst', 'quartz'
];

// Valid armor trim patterns
const ArmorTrimPatterns = [
  'coast', 'dune', 'eye', 'host', 'raiser', 'rib',
  'sentry', 'shaper', 'silence', 'snout', 'spire', 
  'tide', 'vex', 'ward', 'wayfinder', 'wild'
];

// Export the armor item class, types, and materials
module.exports = {
  ArmorItem,
  ArmorType,
  ArmorMaterial,
  ArmorTrimMaterials,
  ArmorTrimPatterns
}; 