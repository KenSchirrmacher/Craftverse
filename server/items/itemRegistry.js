/**
 * ItemRegistry - Manages registration and lookup of all item types in the game
 */

// Import items
const Item = require('./item');
const GlowBerryItem = require('./glowBerryItem');
const FlintAndSteelItem = require('./flintAndSteelItem');
const ShieldItem = require('./shieldItem');
const { InkSacItem, GlowInkSacItem } = require('./inkSacItem');
const BoatItem = require('./boatItem');
const PotionRegistry = require('./potionRegistry');
const RecoveryCompassItem = require('./recoveryCompassItem');
const EchoShardItem = require('./echoShardItem');
const CompassItem = require('./compassItem');
const BrushItem = require('./brushItem');
const PotterySherdItem = require('./potterySherdItem');
const { ArmorItem, ArmorType, ArmorMaterial } = require('./armorItem');
const { ArmorTrimItem, createAllArmorTrimTemplates } = require('./armorTrimItem');
const PotBase = require('./potBase');
const DecoratedPotItem = require('./decoratedPotItem');
const HangingSignItem = require('./hangingSignItem');
const ChiseledBookshelfItem = require('./chiseledBookshelfItem');

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
    // Register unknown item as fallback
    this.registerItem(new Item({
      id: 'unknown_item',
      name: 'Unknown Item',
      type: 'unknown_item',
      description: 'An unknown item.',
      stackable: false
    }));
    
    // Register Caves & Cliffs items
    this.registerItem(new GlowBerryItem());
    
    // Register special test items
    this.registerItem(new Item({
      id: 'test_item',
      name: 'Test Item',
      type: 'test_item',
      description: 'Used for testing.',
      stackable: true,
      maxStackSize: 16
    }));
    
    // Register tools
    this.registerItem(new SwordItem());
    this.registerItem(new PickaxeItem());
    this.registerItem(new AxeItem());
    this.registerItem(new ShovelItem());
    this.registerItem(new HoeItem());
    
    // Register tool items
    this.registerItem(new FlintAndSteelItem());
    this.registerItem(new ShieldItem());
    this.registerItem(new CompassItem());
    
    // Register drop items
    this.registerItem(new InkSacItem());
    this.registerItem(new GlowInkSacItem());
    
    // Register boat items
    this.registerBoatItems();
    
    // Register Wild Update items
    this.registerWildUpdateItems();
    
    // Register Trails & Tales Update items
    this.registerTrailsAndTalesItems();
    
    // Register Pottery System items
    this.registerPotteryItems();
    
    // Register Hanging Sign items
    this.registerHangingSignItems();
    
    // Future: Register more items (stone, dirt, etc.)
    
    // Register potion items
    this.potionRegistry.registerDefaultPotions();
  }
  
  /**
   * Register all boat variants
   * @private
   */
  registerBoatItems() {
    const woodTypes = [
      'oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove'
    ];
    
    // Register regular boats
    for (const woodType of woodTypes) {
      this.registerItem(new BoatItem({ woodType, hasChest: false }));
    }
    
    // Register boats with chests (Wild Update feature)
    for (const woodType of woodTypes) {
      this.registerItem(new BoatItem({ woodType, hasChest: true }));
    }
  }
  
  /**
   * Register Wild Update items
   * @private
   */
  registerWildUpdateItems() {
    // Register Recovery Compass and Echo Shard
    this.registerItem(new RecoveryCompassItem());
    this.registerItem(new EchoShardItem());
    
    // Other Wild Update items...
  }
  
  /**
   * Register Trails & Tales Update items
   * @private
   */
  registerTrailsAndTalesItems() {
    // Register Archaeology-related items
    this.registerItem(new BrushItem());
    
    // Register pottery sherds
    this.registerSherdItems();
    
    // Register armor trim templates
    this.registerArmorTrimItems();
    
    // Register basic armor items (for testing trims)
    this.registerBasicArmorItems();
    
    // Register Chiseled Bookshelf item
    this.registerItem(new ChiseledBookshelfItem());
  }
  
  /**
   * Register all pottery sherd items
   * @private
   */
  registerSherdItems() {
    const patterns = [
      'angler', 'archer', 'arms_up', 'blade', 'brewer', 'burn', 'danger',
      'explorer', 'friend', 'heart', 'heartbreak', 'howl', 'miner', 
      'mourner', 'plenty', 'prize', 'sheaf', 'shelter', 'skull', 'snort'
    ];
    
    for (const pattern of patterns) {
      this.registerItem(new PotterySherdItem({ pattern }));
    }
  }
  
  /**
   * Register all armor trim template items
   * @private
   */
  registerArmorTrimItems() {
    // Create and register all armor trim templates
    const armorTrimTemplates = createAllArmorTrimTemplates();
    
    for (const template of armorTrimTemplates) {
      this.registerItem(template);
    }
  }
  
  /**
   * Register hanging sign items for all wood types
   * @private
   */
  registerHangingSignItems() {
    // Wood types supported for hanging signs
    const woodTypes = [
      'oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 
      'mangrove', 'cherry', 'bamboo', 'crimson', 'warped'
    ];
    
    // Register hanging sign items for each wood type
    for (const woodType of woodTypes) {
      this.registerItem(new HangingSignItem({ woodType }));
    }
  }
  
  /**
   * Register basic armor items for testing
   * @private
   */
  registerBasicArmorItems() {
    // Register all armor pieces for each material for testing
    const materials = [
      ArmorMaterial.LEATHER,
      ArmorMaterial.CHAINMAIL,
      ArmorMaterial.IRON,
      ArmorMaterial.GOLD,
      ArmorMaterial.DIAMOND,
      ArmorMaterial.NETHERITE
    ];
    
    const types = [
      ArmorType.HELMET,
      ArmorType.CHESTPLATE,
      ArmorType.LEGGINGS,
      ArmorType.BOOTS
    ];
    
    for (const material of materials) {
      for (const type of types) {
        const materialName = material.toLowerCase();
        const typeName = type.toLowerCase();
        const itemName = `${materialName}_${typeName}`;
        
        const formattedMaterial = material.charAt(0) + material.slice(1).toLowerCase();
        const formattedType = type.charAt(0) + type.slice(1).toLowerCase();
        const displayName = `${formattedMaterial} ${formattedType}`;
        
        this.registerItem(new ArmorItem({
          id: itemName,
          name: displayName,
          material: material,
          type: type
        }));
      }
    }
  }
  
  /**
   * Register pottery system items
   * @private
   */
  registerPotteryItems() {
    // Register pot base
    this.registerItem(new PotBase());
    
    // Register decorated pot item
    this.registerItem(new DecoratedPotItem());
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
    }
    
    // Default to creating a new instance with merged options
    return new itemType.constructor({
      ...itemType,
      ...options
    });
  }
}

/**
 * Default item classes needed by the registry
 * These would normally be imported from their own files
 */
class SwordItem extends Item {
  constructor(options = {}) {
    super({
      id: options.id || 'iron_sword',
      name: options.name || 'Iron Sword',
      type: 'sword',
      durability: 250,
      maxDurability: 250,
      stackable: false,
      ...options
    });
  }
}

class PickaxeItem extends Item {
  constructor(options = {}) {
    super({
      id: options.id || 'iron_pickaxe',
      name: options.name || 'Iron Pickaxe',
      type: 'pickaxe',
      durability: 250,
      maxDurability: 250,
      stackable: false,
      ...options
    });
  }
}

class AxeItem extends Item {
  constructor(options = {}) {
    super({
      id: options.id || 'iron_axe',
      name: options.name || 'Iron Axe',
      type: 'axe',
      durability: 250,
      maxDurability: 250,
      stackable: false,
      ...options
    });
  }
}

class ShovelItem extends Item {
  constructor(options = {}) {
    super({
      id: options.id || 'iron_shovel',
      name: options.name || 'Iron Shovel',
      type: 'shovel',
      durability: 250,
      maxDurability: 250,
      stackable: false,
      ...options
    });
  }
}

class HoeItem extends Item {
  constructor(options = {}) {
    super({
      id: options.id || 'iron_hoe',
      name: options.name || 'Iron Hoe',
      type: 'hoe',
      durability: 250,
      maxDurability: 250,
      stackable: false,
      ...options
    });
  }
}

module.exports = ItemRegistry; 