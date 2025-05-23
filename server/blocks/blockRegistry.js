/**
 * BlockRegistry - Manages registration and lookup of all block types in the game
 */

// Import blocks
const SporeBlossomBlock = require('./sporeBlossomBlock');
const SculkSensorBlock = require('./sculkSensorBlock');
const CalibratedSculkSensorBlock = require('./calibratedSculkSensorBlock');
const LightningRodBlock = require('./lightningRodBlock');
const { SuspiciousSandBlock, SuspiciousGravelBlock } = require('./suspiciousBlocks');
const Block = require('./baseBlock');
const PointedDripstoneBlock = require('./pointedDripstoneBlock');
const DripstoneBlock = require('./dripstoneBlock');
const AmethystBlock = require('./amethystBlock');
const AmethystCluster = require('./amethystCluster');
const BuddingAmethyst = require('./buddingAmethyst');
const SmallAmethystBud = require('./smallAmethystBud');
const MediumAmethystBud = require('./mediumAmethystBud');
const LargeAmethystBud = require('./largeAmethystBud');
const DeepslateBricksBlock = require('./deepslateBricksBlock');
const DeepslateChiseledBlock = require('./deepslateChiseledBlock');
const DeepslateTilesBlock = require('./deepslateTilesBlock');
const { CaveVineHeadBlock, CaveVineBodyBlock } = require('./caveVineBlock');
const MudBlock = require('./mudBlock');
const PackedMudBlock = require('./packedMudBlock');
const MudBricksBlock = require('./mudBricksBlock');
const MangroveLogBlock = require('./mangroveLogBlock');
const MangroveLeavesBlock = require('./mangroveLeavesBlock');
const MangroveRootsBlock = require('./mangroveRootsBlock');
const MangrovePropaguleBlock = require('./mangrovePropaguleBlock');
const CherryLog = require('./cherryLog');
const StrippedCherryLog = require('./strippedCherryLog');
const CherryLeaves = require('./cherryLeaves');
const CherrySapling = require('./cherrySapling');
const DecoratedPot = require('./decoratedPot');
const EnhancedPot = require('./enhancedPot');
const SignBlock = require('./signBlock');
const HangingSignBlock = require('./hangingSignBlock');
const ChiseledBookshelfBlock = require('./chiseledBookshelfBlock');
const CrafterBlock = require('./crafterBlock');
const TrialSpawnerBlock = require('./trialSpawner');
// Import 1.21 Copper and Tuff blocks
const CopperBulbBlock = require('./copperBulbBlock');
const CopperGrateBlock = require('./copperGrateBlock');
const { ChiseledTuffBlock, TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock } = require('./tuffVariantsBlocks');
// Import 1.22 Sorcery Update blocks
const WindEnergyTransmitter = require('./windEnergyTransmitter');
// Import 1.23 Ancient Seeds blocks
const AncientPlantBlock = require('./ancientPlantBlock');
// Import bamboo blocks
const { 
  BambooBlock, 
  BambooWoodBlock, 
  BambooPlanksBlock, 
  BambooMosaicBlock,
  BambooDoorBlock,
  BambooTrapdoorBlock,
  BambooFenceBlock,
  BambooFenceGateBlock,
  BambooSlabBlock,
  BambooStairsBlock
} = require('./bambooBlock');

class BlockRegistry {
  /**
   * Create a new block registry
   */
  constructor() {
    // Map of block types by ID
    this.blocks = new Map();
    // Map of block classes by ID
    this.blockClasses = new Map();
    
    // Register default blocks
    this.registerDefaultBlocks();
  }
  
  /**
   * Register a block type
   * @param {Block} block - Block instance to register
   */
  registerBlock(block) {
    if (!block || !block.id) {
      console.error('Attempted to register invalid block:', block);
      return false;
    }
    
    if (this.blocks.has(block.id)) {
      console.warn(`Block type '${block.id}' already registered, overwriting`);
    }
    
    this.blocks.set(block.id, block);
    // Register the class if not already present
    if (block.constructor && !this.blockClasses.has(block.id)) {
      this.blockClasses.set(block.id, block.constructor);
    }
    return true;
  }
  
  /**
   * Register a block class for a given ID
   * @param {string} id - Block ID
   * @param {Function} classRef - Block class/constructor
   */
  registerBlockClass(id, classRef) {
    if (!id || !classRef) return;
    this.blockClasses.set(id, classRef);
  }
  
  /**
   * Get a block class by ID
   * @param {string} id - Block ID
   * @returns {Function|null} Block class/constructor or null if not found
   */
  getBlockClass(id) {
    return this.blockClasses.get(id) || null;
  }
  
  /**
   * Get a block type by ID
   * @param {string} id - Block ID
   * @returns {Block|null} Block instance or null if not found
   */
  getBlock(id) {
    return this.blocks.get(id) || null;
  }
  
  /**
   * Check if a block type is registered
   * @param {string} id - Block ID
   * @returns {boolean} Whether block is registered
   */
  hasBlock(id) {
    return this.blocks.has(id);
  }
  
  /**
   * Get all registered blocks
   * @returns {Array} Array of block instances
   */
  getAllBlocks() {
    return Array.from(this.blocks.values());
  }
  
  /**
   * Get block IDs by property
   * @param {string} property - Property name to check
   * @param {*} value - Value to match
   * @returns {string[]} Array of matching block IDs
   */
  getBlockIdsByProperty(property, value) {
    const result = [];
    for (const [id, block] of this.blocks.entries()) {
      if (block[property] === value) {
        result.push(id);
      }
    }
    return result;
  }
  
  /**
   * Get blocks by property
   * @param {string} property - Property name to check
   * @param {*} value - Value to match
   * @returns {Block[]} Array of matching block instances
   */
  getBlocksByProperty(property, value) {
    const result = [];
    for (const block of this.blocks.values()) {
      if (block[property] === value) {
        result.push(block);
      }
    }
    return result;
  }
  
  /**
   * Register all default blocks
   * @private
   */
  registerDefaultBlocks() {
    // Register Caves & Cliffs blocks
    this.registerBlock(new SporeBlossomBlock());
    this.registerBlock(new SculkSensorBlock());
    this.registerBlock(new CalibratedSculkSensorBlock());
    this.registerBlock(new LightningRodBlock());
    this.registerBlock(new CaveVineHeadBlock());
    this.registerBlock(new CaveVineBodyBlock());
    
    // Register archaeology blocks
    this.registerBlock(new SuspiciousSandBlock());
    this.registerBlock(new SuspiciousGravelBlock());
    
    // Register dripstone blocks
    this.registerBlock(new PointedDripstoneBlock());
    this.registerBlock(new DripstoneBlock());
    
    // Register amethyst blocks
    this.registerBlock(new AmethystBlock());
    this.registerBlock(new AmethystCluster());
    this.registerBlock(new BuddingAmethyst());
    this.registerBlock(new SmallAmethystBud());
    this.registerBlock(new MediumAmethystBud());
    this.registerBlock(new LargeAmethystBud());
    
    // Register deepslate blocks
    this.registerBlock(new DeepslateBricksBlock());
    this.registerBlock(new DeepslateChiseledBlock());
    this.registerBlock(new DeepslateTilesBlock());
    
    // Register Wild Update blocks (Mangrove Swamp)
    this.registerBlock(new MudBlock());
    this.registerBlock(new PackedMudBlock());
    this.registerBlock(new MudBricksBlock());
    
    // Register Mangrove tree blocks
    this.registerBlock(new MangroveLogBlock());
    this.registerBlock(new MangroveLogBlock({ id: 'stripped_mangrove_log', name: 'Stripped Mangrove Log', stripped: true }));
    this.registerBlock(new MangroveLeavesBlock());
    this.registerBlock(new MangroveRootsBlock());
    this.registerBlock(new MangrovePropaguleBlock());
    
    // Register Cherry Blossom blocks (Trails & Tales Update)
    this.registerBlock(new CherryLog());
    this.registerBlock(new StrippedCherryLog());
    this.registerBlock(new CherryLeaves());
    this.registerBlock(new CherrySapling());
    
    // Register decorative blocks
    this.registerBlock(new DecoratedPot());
    
    // Register Enhanced Pot for 1.23 Update's Decorated Pots Expansion
    this.registerBlock(new EnhancedPot());
    
    // Register Sign blocks
    this.registerBlock(new SignBlock());
    this.registerBlock(new HangingSignBlock());
    
    // Register Chiseled Bookshelf
    this.registerBlock(new ChiseledBookshelfBlock());
    
    // Register Bamboo blocks (1.20 Update)
    this.registerBambooBlocks();
    
    // Register 1.21 (Tricky Trials) blocks
    this.registerBlock(new CrafterBlock());
    this.registerBlock(new TrialSpawnerBlock());
    
    // Register 1.21 Copper and Tuff blocks
    this.register121CopperAndTuffBlocks();
    
    // Register 1.22 Sorcery Update blocks
    this.register122SorceryBlocks();
    
    // Register 1.23 Ancient Seeds blocks
    this.register123AncientSeedsBlocks();
    
    // Future: Register more blocks
  }
  
  /**
   * Register sign and hanging sign blocks for all wood types
   * @private
   */
  registerSignBlocks() {
    // Wood types supported for signs
    const woodTypes = [
      'oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 
      'mangrove', 'cherry', 'bamboo', 'crimson', 'warped'
    ];
    
    // Register sign blocks
    for (const woodType of woodTypes) {
      // Standing sign
      this.registerBlock(new SignBlock({
        woodType,
        isWallSign: false
      }));
      
      // Wall sign
      this.registerBlock(new SignBlock({
        woodType,
        isWallSign: true
      }));
      
      // Hanging sign
      this.registerBlock(new HangingSignBlock({
        woodType,
        attachmentType: 'ceiling'
      }));
      
      // Chain hanging sign
      this.registerBlock(new HangingSignBlock({
        woodType,
        attachmentType: 'chain'
      }));
      
      // Wall hanging sign
      this.registerBlock(new HangingSignBlock({
        woodType,
        attachmentType: 'wall'
      }));
    }
  }
  
  /**
   * Register bamboo blocks for the 1.20 Update
   * @private
   */
  registerBambooBlocks() {
    // Register base bamboo blocks
    this.registerBlock(new BambooWoodBlock());
    this.registerBlock(new BambooWoodBlock({ stripped: true }));
    this.registerBlock(new BambooPlanksBlock());
    this.registerBlock(new BambooMosaicBlock());
    
    // Register bamboo building blocks
    this.registerBlock(new BambooDoorBlock());
    this.registerBlock(new BambooTrapdoorBlock());
    this.registerBlock(new BambooFenceBlock());
    this.registerBlock(new BambooFenceGateBlock());
    
    // Register bamboo decorative blocks
    this.registerBlock(new BambooSlabBlock()); // Regular bamboo slab
    this.registerBlock(new BambooSlabBlock({ type: 'mosaic' })); // Bamboo mosaic slab
    this.registerBlock(new BambooStairsBlock()); // Regular bamboo stairs
    this.registerBlock(new BambooStairsBlock({ type: 'mosaic' })); // Bamboo mosaic stairs
    
    // Register bamboo buttons and pressure plates
    this.registerBlock(new Block({
      id: 'bamboo_button',
      name: 'Bamboo Button',
      material: 'wood',
      hardness: 0.5,
      toolType: 'axe',
      solid: false,
      transparent: true,
      textures: {
        all: 'blocks/bamboo_planks'
      }
    }));
    
    this.registerBlock(new Block({
      id: 'bamboo_pressure_plate',
      name: 'Bamboo Pressure Plate',
      material: 'wood',
      hardness: 0.5,
      toolType: 'axe',
      solid: false,
      transparent: true,
      textures: {
        all: 'blocks/bamboo_planks'
      }
    }));
  }
  
  /**
   * Register copper bulbs, copper grates, and tuff variants from 1.21 update
   * @private
   */
  register121CopperAndTuffBlocks() {
    // Register Copper Bulb blocks in different oxidation states
    this.registerBlock(new CopperBulbBlock({ oxidationState: 'none' }));
    this.registerBlock(new CopperBulbBlock({ oxidationState: 'exposed', id: 'exposed_copper_bulb', name: 'Exposed Copper Bulb' }));
    this.registerBlock(new CopperBulbBlock({ oxidationState: 'weathered', id: 'weathered_copper_bulb', name: 'Weathered Copper Bulb' }));
    this.registerBlock(new CopperBulbBlock({ oxidationState: 'oxidized', id: 'oxidized_copper_bulb', name: 'Oxidized Copper Bulb' }));
    
    // Register waxed versions of Copper Bulb blocks
    this.registerBlock(new CopperBulbBlock({ waxed: true, id: 'waxed_copper_bulb', name: 'Waxed Copper Bulb' }));
    this.registerBlock(new CopperBulbBlock({ oxidationState: 'exposed', waxed: true, id: 'waxed_exposed_copper_bulb', name: 'Waxed Exposed Copper Bulb' }));
    this.registerBlock(new CopperBulbBlock({ oxidationState: 'weathered', waxed: true, id: 'waxed_weathered_copper_bulb', name: 'Waxed Weathered Copper Bulb' }));
    this.registerBlock(new CopperBulbBlock({ oxidationState: 'oxidized', waxed: true, id: 'waxed_oxidized_copper_bulb', name: 'Waxed Oxidized Copper Bulb' }));
    
    // Register Copper Grate blocks in different oxidation states
    this.registerBlock(new CopperGrateBlock({ oxidationState: 'none' }));
    this.registerBlock(new CopperGrateBlock({ oxidationState: 'exposed', id: 'exposed_copper_grate', name: 'Exposed Copper Grate' }));
    this.registerBlock(new CopperGrateBlock({ oxidationState: 'weathered', id: 'weathered_copper_grate', name: 'Weathered Copper Grate' }));
    this.registerBlock(new CopperGrateBlock({ oxidationState: 'oxidized', id: 'oxidized_copper_grate', name: 'Oxidized Copper Grate' }));
    
    // Register waxed versions of Copper Grate blocks
    this.registerBlock(new CopperGrateBlock({ waxed: true, id: 'waxed_copper_grate', name: 'Waxed Copper Grate' }));
    this.registerBlock(new CopperGrateBlock({ oxidationState: 'exposed', waxed: true, id: 'waxed_exposed_copper_grate', name: 'Waxed Exposed Copper Grate' }));
    this.registerBlock(new CopperGrateBlock({ oxidationState: 'weathered', waxed: true, id: 'waxed_weathered_copper_grate', name: 'Waxed Weathered Copper Grate' }));
    this.registerBlock(new CopperGrateBlock({ oxidationState: 'oxidized', waxed: true, id: 'waxed_oxidized_copper_grate', name: 'Waxed Oxidized Copper Grate' }));
    
    // Register Tuff variants
    this.registerBlock(new ChiseledTuffBlock());
    this.registerBlock(new TuffBricksBlock());
    this.registerBlock(new TuffBrickSlabBlock());
    this.registerBlock(new TuffBrickStairsBlock());
    this.registerBlock(new TuffBrickWallBlock());
  }
  
  /**
   * Register blocks from the 1.22 Sorcery Update
   * @private
   */
  register122SorceryBlocks() {
    // Register Wind Energy Transmitter
    this.registerBlock(new WindEnergyTransmitter());
    
    // More 1.22 blocks will be added here as they are implemented
  }
  
  /**
   * Register blocks for the Ancient Seeds feature (Minecraft 1.23 Update)
   * @private
   */
  register123AncientSeedsBlocks() {
    // Register the generic ancient plant block
    this.registerBlock(new AncientPlantBlock());
    
    // Register variant-specific plant blocks
    const variants = ['torchflower', 'pitcher_pod', 'mystic', 'crystal', 'arcane', 'frost'];
    
    for (const variant of variants) {
      this.registerBlock(new AncientPlantBlock({ 
        variant,
        growthStage: 0
      }));
    }
  }
  
  /**
   * Create a block instance by type
   * @param {string} type - Block type
   * @param {Object} options - Block options
   * @returns {Block|null} Block instance or null if type not found
   */
  createBlock(type, options = {}) {
    if (!type) return null;
    
    // Get block class from registry
    const blockClass = this.blocks.get(type);
    if (!blockClass) return null;
    
    // Create a new instance with the same properties
    const newBlock = Object.create(blockClass);
    Object.assign(newBlock, blockClass, options);
    
    return newBlock;
  }
}

// Create singleton instance
const blockRegistry = new BlockRegistry();
module.exports = { BlockRegistry, blockRegistry }; 