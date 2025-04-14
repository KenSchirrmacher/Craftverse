/**
 * Base Item class - Represents the base functionality for all items in the game
 */

const EventEmitter = require('events');

class Item extends EventEmitter {
  /**
   * Create a new item
   * @param {string|Object} id - Item ID or options object
   * @param {Object} options - Item options
   */
  constructor(id, options = {}) {
    super();
    
    // Handle case where id is an options object
    if (typeof id === 'object') {
      options = id;
      id = options.id;
    }
    
    this.id = id || 'unknown_item';
    this.name = options.name || 'Unknown Item';
    this.stackable = options.stackable !== undefined ? options.stackable : true;
    this.maxStackSize = options.maxStackSize || 64;
    this.durability = options.durability || null;
    this.maxDurability = options.maxDurability || null;
    this.type = options.type || 'item';
    this.subtype = options.subtype || 'generic';
    this.category = options.category || 'miscellaneous';
    this.enchantments = options.enchantments || {};
    this.allowedSlots = options.allowedSlots || ['mainhand', 'offhand', 'inventory', 'hotbar'];
    this.texture = options.texture || this.id;
    this.data = options.data || {};
  }
  
  /**
   * Use the item
   * @param {Player} player - The player using the item
   * @param {Object} context - Use context
   * @returns {boolean} Whether the use was successful
   */
  use(player, context) {
    return false;
  }
  
  /**
   * Check if the item is broken (durability is 0)
   * @returns {boolean} Whether the item is broken
   */
  isBroken() {
    return this.durability !== null && this.durability <= 0;
  }
  
  /**
   * Reduce the durability of the item
   * @param {number} amount - Amount to reduce by
   * @returns {boolean} Whether the item broke
   */
  reduceDurability(amount = 1) {
    if (this.durability === null) return false;
    
    this.durability = Math.max(0, this.durability - amount);
    this.emit('durabilityChanged', this.durability);
    
    return this.isBroken();
  }
  
  /**
   * Repair the item
   * @param {number} amount - Amount to repair
   */
  repair(amount) {
    if (this.durability === null || this.maxDurability === null) return;
    
    this.durability = Math.min(this.maxDurability, this.durability + amount);
    this.emit('durabilityChanged', this.durability);
  }
  
  /**
   * Check if the item can be stacked with another item
   * @param {Item} other - The other item
   * @returns {boolean} Whether the items can be stacked
   */
  canStackWith(other) {
    if (!this.stackable || !other.stackable) return false;
    if (this.id !== other.id) return false;
    
    // Don't stack items with different durability
    if (this.durability !== other.durability) return false;
    
    // Don't stack items with different enchantments
    const thisEnchKeys = Object.keys(this.enchantments);
    const otherEnchKeys = Object.keys(other.enchantments);
    
    if (thisEnchKeys.length !== otherEnchKeys.length) return false;
    
    for (const key of thisEnchKeys) {
      if (this.enchantments[key] !== other.enchantments[key]) return false;
    }
    
    return true;
  }
  
  /**
   * Get the tooltip text for the item
   * @returns {string[]} Array of tooltip lines
   */
  getTooltip() {
    const tooltip = [this.name];
    
    if (this.durability !== null && this.maxDurability !== null) {
      tooltip.push(`Durability: ${this.durability}/${this.maxDurability}`);
    }
    
    for (const [enchName, level] of Object.entries(this.enchantments)) {
      tooltip.push(`${enchName} ${level}`);
    }
    
    return tooltip;
  }
  
  /**
   * Convert item to JSON representation for serialization
   * @returns {Object} JSON representation of item
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      stackable: this.stackable,
      maxStackSize: this.maxStackSize,
      durability: this.durability,
      maxDurability: this.maxDurability,
      type: this.type,
      subtype: this.subtype,
      category: this.category,
      enchantments: {...this.enchantments},
      data: {...this.data}
    };
  }
  
  /**
   * Create an item from JSON data
   * @param {Object} data - JSON data
   * @returns {Item} Item instance
   */
  static fromJSON(data) {
    return new Item(data.id, {
      name: data.name,
      stackable: data.stackable,
      maxStackSize: data.maxStackSize,
      durability: data.durability,
      maxDurability: data.maxDurability,
      type: data.type,
      subtype: data.subtype,
      category: data.category,
      enchantments: data.enchantments,
      data: data.data
    });
  }
  
  /**
   * Get client-side data for this item
   * @returns {Object} Data for the client
   */
  getClientData() {
    return {
      id: this.id,
      name: this.name,
      durability: this.durability,
      maxDurability: this.maxDurability,
      stackable: this.stackable,
      maxStackSize: this.maxStackSize,
      type: this.type,
      subtype: this.subtype,
      category: this.category,
      texture: this.texture,
      enchantments: {...this.enchantments}
    };
  }
}

module.exports = Item; 