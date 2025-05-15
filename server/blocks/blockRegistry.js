/**
 * BlockRegistry - Manages registration and lookup of all block types in the game
 */

// Import blocks
const SporeBlossomBlock = require('./sporeBlossomBlock');
const SculkSensorBlock = require('./sculkSensorBlock');
const LightningRodBlock = require('./lightningRodBlock');
const SuspiciousSandBlock = require('../archaeology/suspiciousSandBlock');
const SuspiciousGravelBlock = require('../archaeology/suspiciousGravelBlock');
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
    
    // Future: Register vanilla blocks (stone, dirt, etc.)
    // this.registerBlock(new StoneBlock());
    // this.registerBlock(new DirtBlock());
    // etc.
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
    } else {
      // Fallback to creating a new instance directly
      try {
        const BlockConstructor = blockType.constructor;
        return new BlockConstructor(options);
      } catch (error) {
        console.error(`Error creating block of type '${type}':`, error);
        return null;
      }
    }
  }
}

// Export the registry
module.exports = new BlockRegistry(); 