/**
 * ToolItem - Base class for tool items like swords, pickaxes, etc.
 */

const Item = require('./item');

/**
 * Base class for all tool items
 */
class ToolItem extends Item {
  /**
   * Create a new tool
   * @param {Object} options - Tool options
   */
  constructor(options = {}) {
    const defaults = {
      id: 'unknown_tool',
      name: 'Unknown Tool',
      stackable: false,
      maxStackSize: 1,
      durability: 100,
      maxDurability: options.durability || 100,
      miningSpeed: 1.0,
      attackDamage: 1,
      attackSpeed: 1.0,
      material: 'wood',
      toolType: 'unknown',
      miningLevel: 0,
      enchantability: 10,
      tier: 0,
      repairMaterial: null
    };
    
    super({...defaults, ...options});
    
    // Tool-specific properties
    this.material = options.material || defaults.material;
    this.toolType = options.toolType || defaults.toolType;
    this.miningSpeed = options.miningSpeed || defaults.miningSpeed;
    this.miningLevel = options.miningLevel || defaults.miningLevel;
    this.attackDamage = options.attackDamage || defaults.attackDamage;
    this.attackSpeed = options.attackSpeed || defaults.attackSpeed;
    this.enchantability = options.enchantability || defaults.enchantability;
    this.tier = options.tier || defaults.tier;
    this.repairMaterial = options.repairMaterial || this.material + '_ingot';
    
    // For tools with fire/lava resistance
    this.fireResistant = options.fireResistant || false;
  }
  
  /**
   * Check if this tool can mine a specific block
   * @param {Object} block - Block to check
   * @returns {boolean} Whether this tool can mine the block
   */
  canMine(block) {
    if (!block) return false;
    
    // Check if this is the right tool type
    if (block.requiredToolType && block.requiredToolType !== this.toolType) {
      return false;
    }
    
    // Check if this tool has a high enough mining level
    if (block.miningLevel > this.miningLevel) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get the mining speed for a specific block
   * @param {Object} block - Block to mine
   * @returns {number} Mining speed
   */
  getMiningSpeedFor(block) {
    if (!this.canMine(block)) {
      return 1.0; // Default slow speed for incorrect tool
    }
    
    return this.miningSpeed;
  }
  
  /**
   * Damage the tool when used
   * @param {number} amount - Damage amount
   * @returns {boolean} Whether the tool broke
   */
  damage(amount = 1) {
    if (this.durability === null) return false; // Unbreakable tool
    
    this.durability -= amount;
    
    if (this.durability <= 0) {
      this.durability = 0;
      return true; // Tool broke
    }
    
    return false;
  }
  
  /**
   * Check if this tool is broken
   * @returns {boolean} Whether the tool is broken
   */
  isBroken() {
    return this.durability === 0;
  }
  
  /**
   * Check if this tool is fire resistant
   * @returns {boolean} Whether the tool is fire resistant
   */
  isFireResistant() {
    return this.fireResistant;
  }
  
  /**
   * Check if this tool floats in lava
   * @returns {boolean} Whether the tool floats in lava
   */
  floatsInLava() {
    return false; // Override in subclasses if needed
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
      material: this.material,
      toolType: this.toolType,
      miningSpeed: this.miningSpeed,
      miningLevel: this.miningLevel,
      attackDamage: this.attackDamage,
      attackSpeed: this.attackSpeed,
      enchantability: this.enchantability,
      tier: this.tier,
      repairMaterial: this.repairMaterial,
      fireResistant: this.fireResistant
    };
  }
  
  /**
   * Deserialize from JSON
   * @param {Object} data - Serialized data
   * @returns {ToolItem} New tool item
   * @static
   */
  static fromJSON(data) {
    return new ToolItem(data);
  }
}

module.exports = {
  ToolItem
}; 