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
const { NetheriteUpgradeTemplate } = require('./netheriteUpgradeTemplate');
const CrafterItem = require('./crafterItem');
const WindChargeItem = require('./windChargeItem');
// Import bamboo items
const { BambooItem, BambooSignItem, BambooButtonItem, BambooPressurePlateItem } = require('./bambooItem');
const BambooRaftItem = require('./bambooRaftItem');
const RaftItem = require('./raftItem');
// Import wolf armor items for 1.22 Sorcery Update
const { 
  LeatherWolfArmorItem, 
  IronWolfArmorItem, 
  GoldWolfArmorItem, 
  DiamondWolfArmorItem, 
  NetheriteWolfArmorItem 
} = require('./wolfArmorItem');
// Import Ominous Bottle for 1.22 Sorcery Update
const OminousBottleItem = require('./ominousBottleItem');
// Import Armadillo Scute for 1.22 Sorcery Update
const ArmadilloScuteItem = require('./armadilloScuteItem');
// Import items for Minecraft 1.23 Decorated Pots Expansion
const EnhancedPotItem = require('./enhancedPotItem');
const EnhancedPotBaseItem = require('./enhancedPotBaseItem');
// Import items for Minecraft 1.23 Ancient Seeds feature
const AncientSeedItem = require('./ancientSeedItem');

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
    
    // Register basic armor items
    this.registerBasicArmorItems();
    
    // Register 1.21 (Tricky Trials) items
    this.register121Items();
    
    // Register 1.22 (Sorcery) items
    this.register122Items();
    
    // Register Animal Improvements / Wolf Armor items
    this.registerWolfArmorItems();
    
    // Register 1.23 Ancient Seeds items
    this.register123AncientSeedsItems();
    
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
    
    // Register regular rafts (1.20 Update)
    for (const woodType of woodTypes) {
      this.registerItem(new RaftItem({ woodType, hasChest: false }));
    }
    
    // Register chest rafts (1.20 Update)
    for (const woodType of woodTypes) {
      this.registerItem(new RaftItem({ woodType, hasChest: true }));
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
    
    // Register Netherite Upgrade Template
    this.registerItem(new NetheriteUpgradeTemplate());
  }
  
  /**
   * Register pottery sherd items
   * @private
   */
  registerSherdItems() {
    // Original sherds from Trails & Tales
    const originalPatterns = [
      'arms_up', 'skull', 'danger', 'explorer', 'friend', 
      'heart', 'heartbreak', 'howl', 'miner', 'mourner', 
      'plenty', 'prize', 'sheaf', 'shelter', 'snort', 
      'angler', 'archer', 'blade', 'brewer', 'burn'
    ];
    
    // New sherds for 1.23 Update
    const newPatterns = [
      'enchanted', 'mystical', 'alchemical', 'runic',
      'flowery', 'royal', 'ancient',
      'musical', 'melodic', 'harmonic',
      'redstone', 'clockwork', 'compass'
    ];
    
    // Register all patterns
    for (const pattern of [...originalPatterns, ...newPatterns]) {
      const type = `pottery_sherd_${pattern}`;
      this.registerItem(new PotterySherdItem({ pattern }));
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
    
    // Register enhanced pot base for 1.23 Update
    this.registerItem(new EnhancedPotBaseItem());
    
    // Register decorated pot item
    this.registerItem(new DecoratedPotItem());
    
    // Register enhanced pot item for 1.23 Update
    this.registerItem(new EnhancedPotItem());
    
    // Register pottery sherd items (handled in registerSherdItems)
    this.registerSherdItems();
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
   * Register items for the 1.21 (Tricky Trials) Update
   * @private
   */
  register121Items() {
    // Register Crafter item
    this.registerItem(new CrafterItem());
    
    // Register Wind Charge item
    this.registerItem(new WindChargeItem());
    
    // Register Mace weapons
    const { 
      WoodenMaceItem, 
      StoneMaceItem, 
      IronMaceItem, 
      GoldenMaceItem, 
      DiamondMaceItem, 
      NetheriteMaceItem 
    } = require('./maceItem');
    
    this.registerItem(new WoodenMaceItem());
    this.registerItem(new StoneMaceItem());
    this.registerItem(new IronMaceItem());
    this.registerItem(new GoldenMaceItem());
    this.registerItem(new DiamondMaceItem());
    this.registerItem(new NetheriteMaceItem());
  }
  
  /**
   * Register items for the 1.22 (Sorcery Update)
   * @private
   */
  register122Items() {
    // Register Wolf armor items
    this.registerWolfArmorItems();
    
    // Register Ominous Bottle item
    this.registerItem(new OminousBottleItem());
    
    // Register Armadillo Scute item
    this.registerItem(new ArmadilloScuteItem());
    
    // Future: Register spell-related items
  }
  
  /**
   * Register Wolf armor items
   * @private
   */
  registerWolfArmorItems() {
    // Register various Wolf armor materials
    this.registerItem(new LeatherWolfArmorItem());
    this.registerItem(new IronWolfArmorItem());
    this.registerItem(new GoldWolfArmorItem());
    this.registerItem(new DiamondWolfArmorItem());
    this.registerItem(new NetheriteWolfArmorItem());
  }
  
  /**
   * Register items for the Ancient Seeds feature (Minecraft 1.23 Update)
   * @private
   */
  register123AncientSeedsItems() {
    // Register the generic ancient seed
    this.registerItem(new AncientSeedItem());
    
    // Register variant-specific ancient seeds
    const variants = ['torchflower', 'pitcher_pod', 'mystic', 'crystal', 'arcane', 'frost'];
    
    for (const variant of variants) {
      this.registerItem(new AncientSeedItem({ variant }));
    }
    
    // Register the plant items that grow from the seeds
    const plantItems = [
      { id: 'ancient_flower', name: 'Ancient Flower', description: 'A mysterious ancient flower.' },
      { id: 'torchflower', name: 'Torchflower', description: 'A vibrant, flame-colored flower.' },
      { id: 'pitcher_plant', name: 'Pitcher Plant', description: 'A unique pitcher-shaped plant.' },
      { id: 'mystic_flower', name: 'Mystic Flower', description: 'A flower with mystical properties.' },
      { id: 'crystal_bloom', name: 'Crystal Bloom', description: 'A crystalline flower that emits light.' },
      { id: 'arcane_blossom', name: 'Arcane Blossom', description: 'A rare flower with potent magical properties.' },
      { id: 'frost_lily', name: 'Frost Lily', description: 'A cold-resistant flowering plant.' },
    ];
    
    for (const plantItem of plantItems) {
      this.registerItem(new Item({
        id: plantItem.id,
        type: plantItem.id,
        name: plantItem.name,
        description: plantItem.description,
        stackable: true,
        maxStackSize: 64
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