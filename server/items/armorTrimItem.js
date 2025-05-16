/**
 * ArmorTrimItem - Smithing template items used for applying trims to armor
 */

const Item = require('./item');
const { ArmorTrimPatterns } = require('./armorItem');

/**
 * Class representing smithing templates for armor trims
 */
class ArmorTrimItem extends Item {
  /**
   * Create a new armor trim smithing template
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    // Pattern for this trim template
    const pattern = options.pattern || 'coast';
    const displayName = options.displayName || getDefaultPatternName(pattern);
    
    const defaults = {
      id: `${pattern}_armor_trim`,
      name: `${displayName} Armor Trim Smithing Template`,
      stackable: true,
      maxStackSize: 64,
      type: 'armor_trim_template',
      rarity: 'uncommon',
      description: `Applies the ${displayName} pattern to armor when used in a smithing table`
    };
    
    super({...defaults, ...options});
    
    // Trim-specific properties
    this.pattern = pattern;
    this.isArmorTrimTemplate = true;
  }
  
  /**
   * Get the pattern ID for this trim template
   * @returns {string} Pattern ID
   */
  getPatternId() {
    return this.pattern;
  }
  
  /**
   * Get pattern display name
   * @returns {string} Pattern display name
   */
  getPatternDisplayName() {
    return getDefaultPatternName(this.pattern);
  }
  
  /**
   * Get a description of how to obtain this template
   * @returns {string} Description of source
   */
  getSource() {
    const sources = {
      'coast': 'Found in Beach village houses',
      'dune': 'Found in Desert pyramids',
      'eye': 'Found in Ancient Cities',
      'host': 'Found in Nether Fortresses',
      'raiser': 'Found in Pillager Outposts',
      'rib': 'Found in Ancient Cities',
      'sentry': 'Found in Ocean Monuments',
      'shaper': 'Found in Strongholds',
      'silence': 'Found in Deep Dark Cities',
      'snout': 'Found in Bastion Remnants',
      'spire': 'Found in End Cities',
      'tide': 'Found in Underwater Ruins',
      'vex': 'Found in Woodland Mansions',
      'ward': 'Found in Ancient Cities',
      'wayfinder': 'Found in Trail Ruins',
      'wild': 'Found in Jungle Temples'
    };
    
    return sources[this.pattern] || 'Found in various structures';
  }
  
  /**
   * Get usage instructions for the smithing template
   * @returns {string} Instructions
   */
  getUsageInstructions() {
    return `Combine with any piece of armor and a trim material in a smithing table to apply the ${this.getPatternDisplayName()} trim pattern.`;
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
      pattern: this.pattern,
      isArmorTrimTemplate: this.isArmorTrimTemplate
    };
  }
  
  /**
   * Deserialize from JSON
   * @param {Object} data - Serialized data
   * @returns {ArmorTrimItem} New armor trim item
   * @static
   */
  static fromJSON(data) {
    return new ArmorTrimItem(data);
  }
}

/**
 * Get the display name for a pattern ID
 * @param {string} pattern - Pattern ID
 * @returns {string} Display name
 * @private
 */
function getDefaultPatternName(pattern) {
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
  
  return patternNames[pattern] || pattern;
}

/**
 * Create a complete set of armor trim templates
 * @returns {ArmorTrimItem[]} Array of all armor trim templates
 */
function createAllArmorTrimTemplates() {
  return ArmorTrimPatterns.map(pattern => new ArmorTrimItem({ pattern }));
}

module.exports = {
  ArmorTrimItem,
  createAllArmorTrimTemplates
}; 