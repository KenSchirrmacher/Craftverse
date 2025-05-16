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
// Import bamboo items
const { BambooItem, BambooSignItem, BambooButtonItem, BambooPressurePlateItem } = require('./bambooItem');
const BambooRaftItem = require('./bambooRaftItem');

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
    
    // Register Bamboo items for 1.20 Update
    this.registerBambooItems();
    
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
    
    // Register chest boats
    for (const woodType of woodTypes) {
      this.registerItem(new BoatItem({ woodType, hasChest: true }));
    }
  }
  
  /**
   * Register items for the Wild Update
   * @private
   */
  registerWildUpdateItems() {
    // Register Recovery Compass
    this.registerItem(new RecoveryCompassItem());
    
    // Register Echo Shards
    this.registerItem(new EchoShardItem());
  }
  
  /**
   * Register items for the Trails & Tales Update
   * @private
   */
  registerTrailsAndTalesItems() {
    // Register Brush item for archaeology
    this.registerItem(new BrushItem());
    
    // Register Pottery Sherd items
    this.registerSherdItems();
    
    // Register Armor Trim Smithing Templates
    this.registerArmorTrimItems();
    
    // Register Chiseled Bookshelf Item
    this.registerItem(new ChiseledBookshelfItem());
  }
  
  /**
   * Register pottery sherd items
   * @private
   */
  registerSherdItems() {
    const sherdTypes = [
      'angler', 'archer', 'arms_up', 'blade', 'brewer', 'burn', 'danger',
      'explorer', 'friend', 'heart', 'heartbreak', 'howl', 'miner', 'mourner',
      'plenty', 'prize', 'sheaf', 'shelter', 'skull', 'snort'
    ];
    
    for (const type of sherdTypes) {
      this.registerItem(new PotterySherdItem({ type }));
    }
  }
  
  /**
   * Register armor trim items
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
    
    // Register hanging sign items
    for (const woodType of woodTypes) {
      this.registerItem(new HangingSignItem({
        woodType: woodType
      }));
    }
  }
  
  /**
   * Register bamboo items for the 1.20 Update
   * @private
   */
  registerBambooItems() {
    // Register basic bamboo item
    this.registerItem(new BambooItem());
    
    // Register bamboo building items
    this.registerItem(new BambooSignItem());
    this.registerItem(new BambooButtonItem());
    this.registerItem(new BambooPressurePlateItem());
    
    // Register door, slab, fence items
    const blockItems = [
      'bamboo_block', 'stripped_bamboo_block', 'bamboo_planks', 'bamboo_mosaic',
      'bamboo_door', 'bamboo_trapdoor', 'bamboo_fence', 'bamboo_fence_gate',
      'bamboo_slab', 'bamboo_mosaic_slab', 'bamboo_stairs', 'bamboo_mosaic_stairs'
    ];
    
    for (const blockId of blockItems) {
      this.registerItem(new Item({
        id: blockId,
        type: blockId,
        name: blockId.split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        description: `A ${blockId.replace(/_/g, ' ')} for building.`,
        stackable: true,
        maxStackSize: 64,
        placeable: true
      }));
    }
    
    // Register bamboo raft items
    this.registerItem(new BambooRaftItem({ hasChest: false }));
    this.registerItem(new BambooRaftItem({ hasChest: true }));
  }
  
  /**
   * Register pottery items
   * @private
   */
  registerPotteryItems() {
    // Register pot base
    this.registerItem(new PotBase());
    
    // Register decorated pot item
    this.registerItem(new DecoratedPotItem());
  }
  
  /**
   * Register basic armor items
   * @private
   */
  registerBasicArmorItems() {
    // Register leather armor
    const leatherPieces = [
      { id: 'leather_helmet', name: 'Leather Helmet', type: ArmorType.HELMET },
      { id: 'leather_chestplate', name: 'Leather Chestplate', type: ArmorType.CHESTPLATE },
      { id: 'leather_leggings', name: 'Leather Leggings', type: ArmorType.LEGGINGS },
      { id: 'leather_boots', name: 'Leather Boots', type: ArmorType.BOOTS }
    ];
    
    for (const piece of leatherPieces) {
      this.registerItem(new ArmorItem({
        id: piece.id,
        name: piece.name,
        type: piece.type,
        material: ArmorMaterial.LEATHER,
        durability: 55
      }));
    }
    
    // Register iron armor
    const ironPieces = [
      { id: 'iron_helmet', name: 'Iron Helmet', type: ArmorType.HELMET },
      { id: 'iron_chestplate', name: 'Iron Chestplate', type: ArmorType.CHESTPLATE },
      { id: 'iron_leggings', name: 'Iron Leggings', type: ArmorType.LEGGINGS },
      { id: 'iron_boots', name: 'Iron Boots', type: ArmorType.BOOTS }
    ];
    
    for (const piece of ironPieces) {
      this.registerItem(new ArmorItem({
        id: piece.id,
        name: piece.name,
        type: piece.type,
        material: ArmorMaterial.IRON,
        durability: 165
      }));
    }
  }
  
  /**
   * Create an item instance by type
   * @param {string} type - Item type
   * @param {Object} options - Item options
   * @returns {Item|null} Item instance or null if type not found
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

// Standard item types
class SwordItem extends Item {
  constructor(options = {}) {
    super({
      id: 'sword',
      name: 'Sword',
      type: 'sword',
      description: 'A basic sword for combat.',
      stackable: false,
      ...options
    });
  }
}

class PickaxeItem extends Item {
  constructor(options = {}) {
    super({
      id: 'pickaxe',
      name: 'Pickaxe',
      type: 'pickaxe',
      description: 'A mining tool for breaking stone blocks.',
      stackable: false,
      ...options
    });
  }
}

class AxeItem extends Item {
  constructor(options = {}) {
    super({
      id: 'axe',
      name: 'Axe',
      type: 'axe',
      description: 'A tool for chopping wood and combat.',
      stackable: false,
      ...options
    });
  }
}

class ShovelItem extends Item {
  constructor(options = {}) {
    super({
      id: 'shovel',
      name: 'Shovel',
      type: 'shovel',
      description: 'A tool for digging dirt and similar blocks.',
      stackable: false,
      ...options
    });
  }
}

class HoeItem extends Item {
  constructor(options = {}) {
    super({
      id: 'hoe',
      name: 'Hoe',
      type: 'hoe',
      description: 'A farming tool for tilling soil.',
      stackable: false,
      ...options
    });
  }
}

// Export the registry
module.exports = new ItemRegistry(); 