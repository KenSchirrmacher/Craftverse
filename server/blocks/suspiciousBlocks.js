/**
 * Suspicious Blocks - Blocks used for archaeology
 * Part of the Trails & Tales Update
 */

const Block = require('./block');

/**
 * Base class for suspicious blocks that can be excavated with brushes
 */
class SuspiciousBlock extends Block {
  /**
   * Create a new suspicious block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    // Set up base properties
    super({
      name: options.name || 'Suspicious Block',
      hardness: options.hardness !== undefined ? options.hardness : 0.5,
      resistance: options.resistance !== undefined ? options.resistance : 0.5,
      toolType: options.toolType || 'shovel',
      transparent: false,
      solid: true,
      gravity: false,
      ...options
    });
    
    // Suspicious block specific properties
    this.siteType = options.siteType || 'plains';
    this.lootTable = options.lootTable || null;
    this.dusted = options.dusted || false;
    this.excavationProgress = options.excavationProgress || 0;
    this.excavationStages = options.excavationStages || 4;
  }
  
  /**
   * Handle block interaction with brush
   * @param {Object} world - World reference
   * @param {Object} player - Player interacting with block
   * @param {Object} item - Item used (brush)
   * @param {Object} position - Block position
   * @returns {boolean} - Whether interaction was handled
   */
  onInteract(world, player, item, position) {
    // Actual handling is done by ArchaeologyManager
    // This just passes the event along
    if (item && item.type === 'brush') {
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle block break
   * @param {Object} world - World reference
   * @param {Object} player - Player breaking the block
   * @param {Object} position - Block position
   * @param {Object} item - Item used to break
   * @returns {Object[]} - Drops from the block
   */
  onBreak(world, player, position, item) {
    // When broken directly (not excavated), drop the normal block variant
    return [{ type: this.getNormalVariant(), count: 1 }];
  }
  
  /**
   * Get the normal (non-suspicious) variant of this block
   * @returns {string} - Normal block type
   */
  getNormalVariant() {
    return 'stone'; // Overridden by subclasses
  }
  
  /**
   * Get custom data for client rendering
   * @returns {Object} - Client data
   */
  getClientData() {
    return {
      ...super.getClientData(),
      dusted: this.dusted,
      excavationProgress: this.excavationProgress,
      excavationStages: this.excavationStages
    };
  }
  
  /**
   * Serialize block data
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      siteType: this.siteType,
      lootTable: this.lootTable,
      dusted: this.dusted,
      excavationProgress: this.excavationProgress
    };
  }
  
  /**
   * Deserialize block data
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data) {
      this.siteType = data.siteType || this.siteType;
      this.lootTable = data.lootTable || this.lootTable;
      this.dusted = data.dusted || this.dusted;
      this.excavationProgress = data.excavationProgress || 0;
    }
  }
}

/**
 * SuspiciousSandBlock - Sandy variant found in deserts and beaches
 */
class SuspiciousSandBlock extends SuspiciousBlock {
  /**
   * Create a new suspicious sand block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      type: 'suspicious_sand',
      name: 'Suspicious Sand',
      hardness: 0.5,
      resistance: 0.5,
      toolType: 'shovel',
      toolLevel: 'wood',
      drops: [], // Special drops handled by archaeology system
      ...options
    });
    
    // Default to desert site type for sand
    this.siteType = options.siteType || 'desert';
  }
  
  /**
   * Get the normal (non-suspicious) variant of this block
   * @returns {string} - Normal block type
   */
  getNormalVariant() {
    return 'sand';
  }
  
  /**
   * Handle gravity for sand blocks
   * @param {Object} world - World reference
   * @param {Object} position - Block position
   */
  onTick(world, position) {
    // Check if air block below
    if (!world) return;
    
    const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
    
    if (!blockBelow || blockBelow.type === 'air' || !blockBelow.solid) {
      // Replace with normal sand (which will fall)
      world.setBlockAt(position.x, position.y, position.z, this.getNormalVariant());
    }
  }
}

/**
 * SuspiciousGravelBlock - Gravel variant found in underground sites
 */
class SuspiciousGravelBlock extends SuspiciousBlock {
  /**
   * Create a new suspicious gravel block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      type: 'suspicious_gravel',
      name: 'Suspicious Gravel',
      hardness: 0.6,
      resistance: 0.6,
      toolType: 'shovel',
      toolLevel: 'wood',
      drops: [], // Special drops handled by archaeology system
      ...options
    });
    
    // Default to plains site type for gravel
    this.siteType = options.siteType || 'plains';
  }
  
  /**
   * Get the normal (non-suspicious) variant of this block
   * @returns {string} - Normal block type
   */
  getNormalVariant() {
    return 'gravel';
  }
  
  /**
   * Handle gravity for gravel blocks
   * @param {Object} world - World reference
   * @param {Object} position - Block position
   */
  onTick(world, position) {
    // Check if air block below
    if (!world) return;
    
    const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
    
    if (!blockBelow || blockBelow.type === 'air' || !blockBelow.solid) {
      // Replace with normal gravel (which will fall)
      world.setBlockAt(position.x, position.y, position.z, this.getNormalVariant());
    }
  }
}

module.exports = {
  SuspiciousBlock,
  SuspiciousSandBlock,
  SuspiciousGravelBlock
}; 