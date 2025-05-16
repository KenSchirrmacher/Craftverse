/**
 * BlockRegistry - Manages registration and lookup of all block types in the game
 */

// Import blocks
const SporeBlossomBlock = require('./sporeBlossomBlock');
const SculkSensorBlock = require('./sculkSensorBlock');
const LightningRodBlock = require('./lightningRodBlock');
const { SuspiciousSandBlock, SuspiciousGravelBlock } = require('./suspiciousBlocks');
const Block = require('./block');
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
const CherryLeaves = require('./cherryLeaves');
const CherrySapling = require('./cherrySapling');
const DecoratedPot = require('./decoratedPot');
const SignBlock = require('./signBlock');
const HangingSignBlock = require('./hangingSignBlock');
const ChiseledBookshelfBlock = require('./chiseledBookshelfBlock');

class BlockRegistry {
  /**
   * Create a new block registry
   */
  constructor() {
    // Map of block types by ID
    this.blocks = new Map();
    
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
    return true;
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
    this.registerBlock(new CherryLog({ id: 'stripped_cherry_log', name: 'Stripped Cherry Log', stripped: true }));
    this.registerBlock(new CherryLeaves());
    this.registerBlock(new CherrySapling());
    
    // Register Pottery System blocks (Trails & Tales Update)
    this.registerBlock(new DecoratedPot());
    
    // Register Sign and Hanging Sign blocks (Trails & Tales Update)
    this.registerSignBlocks();
    
    // Register Chiseled Bookshelf block (Trails & Tales Update)
    this.registerBlock(new ChiseledBookshelfBlock());
    
    // Future: Register vanilla blocks (stone, dirt, etc.)
    // this.registerBlock(new StoneBlock());
    // this.registerBlock(new DirtBlock());
    // etc.
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
    
    // Register regular signs for each wood type
    for (const woodType of woodTypes) {
      const formattedWoodType = woodType.charAt(0).toUpperCase() + woodType.slice(1);
      
      // Register standing sign
      this.registerBlock(new SignBlock({
        id: `${woodType}_sign`,
        name: `${formattedWoodType} Sign`,
        woodType,
        isWallSign: false
      }));
      
      // Register wall sign variant
      this.registerBlock(new SignBlock({
        id: `${woodType}_wall_sign`,
        name: `${formattedWoodType} Wall Sign`,
        woodType,
        isWallSign: true
      }));
    }
    
    // Register hanging signs for each wood type (Trails & Tales feature)
    for (const woodType of woodTypes) {
      const formattedWoodType = woodType.charAt(0).toUpperCase() + woodType.slice(1);
      
      // Register ceiling hanging sign
      this.registerBlock(new HangingSignBlock({
        id: `${woodType}_hanging_sign`,
        name: `${formattedWoodType} Hanging Sign`,
        woodType,
        attachmentType: 'ceiling'
      }));
      
      // Register wall hanging sign variant
      this.registerBlock(new HangingSignBlock({
        id: `${woodType}_wall_hanging_sign`,
        name: `${formattedWoodType} Wall Hanging Sign`,
        woodType,
        attachmentType: 'wall'
      }));
    }
  }
  
  /**
   * Create a new block instance
   * @param {string} type - Block type ID
   * @param {Object} options - Additional block options
   * @returns {Block|null} New block instance or null if type not found
   */
  createBlock(type, options = {}) {
    const blockType = this.getBlock(type);
    if (!blockType) {
      console.error(`Block type '${type}' not found`);
      return null;
    }
    
    // Create a new instance of this block type
    // Use the static fromJSON if available, otherwise use constructor
    if (typeof blockType.constructor.fromJSON === 'function') {
      return blockType.constructor.fromJSON({
        ...blockType.toJSON(),
        ...options
      });
    }
    
    // Default to creating a new instance with merged options
    return new blockType.constructor({
      ...blockType,
      ...options
    });
  }
}

// Export the registry
module.exports = new BlockRegistry(); 