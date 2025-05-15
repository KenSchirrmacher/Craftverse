/**
 * ItemRegistry - Manages registration and lookup of all item types in the game
 */

// Import items
const Item = require('./item');
const GlowBerryItem = require('./glowBerryItem');
const FlintAndSteelItem = require('./flintAndSteelItem');
const ShieldItem = require('./shieldItem');
const InkSacItem = require('./inkSacItem');
const PotionRegistry = require('./potionRegistry');

class ItemRegistry {
  /**
   * Create a new item registry
   */
  constructor() {
    // Map of item types by ID
    this.items = new Map();
    
    // Create a potion registry
    this.potionRegistry = new PotionRegistry();
    
    // Register default items
    this.registerDefaultItems();
  }
  
  /**
   * Register an item type
   * @param {Item} item - Item instance to register
   */
  registerItem(item) {
    if (!item || !item.id) {
      console.error('Attempted to register invalid item:', item);
      return false;
    }
    
    if (this.items.has(item.id)) {
      console.warn(`Item type '${item.id}' already registered, overwriting`);
    }
    
    this.items.set(item.id, item);
    return true;
  }
  
  /**
   * Get an item type by ID
   * @param {string} id - Item ID
   * @returns {Item|null} Item instance or null if not found
   */
  getItem(id) {
    return this.items.get(id) || null;
  }
  
  /**
   * Check if an item type is registered
   * @param {string} id - Item ID
   * @returns {boolean} Whether item is registered
   */
  hasItem(id) {
    return this.items.has(id);
  }
  
  /**
   * Get all registered items
   * @returns {Array} Array of item instances
   */
  getAllItems() {
    return Array.from(this.items.values());
  }
  
  /**
   * Get item IDs by property
   * @param {string} property - Property name to check
   * @param {*} value - Value to match
   * @returns {string[]} Array of matching item IDs
   */
  getItemIdsByProperty(property, value) {
    const result = [];
    for (const [id, item] of this.items.entries()) {
      if (item[property] === value) {
        result.push(id);
      }
    }
    return result;
  }
  
  /**
   * Get items by property
   * @param {string} property - Property name to check
   * @param {*} value - Value to match
   * @returns {Item[]} Array of matching item instances
   */
  getItemsByProperty(property, value) {
    const result = [];
    for (const item of this.items.values()) {
      if (item[property] === value) {
        result.push(item);
      }
    }
    return result;
  }
  
  /**
   * Get the potion registry
   * @returns {PotionRegistry} The potion registry
   */
  getPotionRegistry() {
    return this.potionRegistry;
  }
  
  /**
   * Register all default items
   * @private
   */
  registerDefaultItems() {
    // Register Caves & Cliffs items
    this.registerItem(new GlowBerryItem());
    
    // Register tool items
    this.registerItem(new FlintAndSteelItem());
    this.registerItem(new ShieldItem());
    
    // Register drop items
    this.registerItem(new InkSacItem());
    
    // Future: Register more items (stone, dirt, etc.)
    
    // Register potion items
    this.potionRegistry.registerDefaultPotions();
  }
  
  /**
   * Create a new item instance
   * @param {string} type - Item type ID
   * @param {Object} options - Additional item options
   * @returns {Item|null} New item instance or null if type not found
   */
  createItem(type, options = {}) {
    const itemType = this.getItem(type);
    if (!itemType) {
      console.error(`Item type '${type}' not found`);
      return null;
    }
    
    // Create a new instance of this item type
    // Use the static fromJSON if available, otherwise use constructor
    if (typeof itemType.constructor.fromJSON === 'function') {
      return itemType.constructor.fromJSON({
        ...itemType.toJSON(),
        ...options
      });
    } else {
      // Fallback to creating a new instance directly
      try {
        const ItemConstructor = itemType.constructor;
        return new ItemConstructor(options);
      } catch (error) {
        console.error(`Error creating item of type '${type}':`, error);
        return null;
      }
    }
  }
}

// Export the registry
module.exports = new ItemRegistry(); 