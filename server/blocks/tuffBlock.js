/**
 * Tuff Block for Caves & Cliffs Update
 * A stone-like block found near amethyst geodes and in dripstone caves
 */

const Block = require('./blockBase');

/**
 * Tuff Block
 * A rough stone-like block with volcanic origins
 */
class TuffBlock extends Block {
  /**
   * Create a new tuff block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'tuff',
      name: 'Tuff',
      hardness: 1.5, // Same as regular stone
      miningLevel: 'stone', // Requires stone pickaxe or better
      miningTime: 1.5,
      blast_resistance: 6.0,
      ...options
    });
    
    // Tuff has a uniform texture on all sides
    this.textures = {
      all: 'blocks/tuff'
    };
    
    // Tuff can generate with nearby amethyst geodes
    this.canGenerateNearGeodes = true;
    
    // Clusters of tuff can form in dripstone caves
    this.generatesInClusters = true;
    this.clusterSize = { min: 3, max: 8 };
  }
  
  /**
   * Get drops when mined without silk touch
   * @param {Object} tool - The tool used to mine
   * @returns {Array} Array of item drops
   */
  getDrops(tool) {
    // Check if mined with correct tool
    if (!tool || !tool.type || !tool.type.includes('pickaxe')) {
      return []; // No drops if mined with wrong tool
    }
    
    // Check for silk touch
    if (tool && tool.enchantments && tool.enchantments.silk_touch) {
      return [{ id: this.id, count: 1 }];
    }
    
    // Normal drops
    return [{ id: this.id, count: 1 }];
  }
  
  /**
   * Handle world generation behavior
   * @param {Object} world - The game world
   * @param {Object} noiseGenerator - Noise generator for world gen
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   * @returns {boolean} Whether tuff should generate at this position
   */
  shouldGenerateAt(world, noiseGenerator, x, y, z) {
    // If no noise generator available, use fallback method
    if (!noiseGenerator) {
      return false;
    }
    
    // Tuff tends to generate in patches near deep caves
    // Use a noise threshold to create natural-looking clusters
    const noiseValue = noiseGenerator.simplex3(x * 0.05, y * 0.05, z * 0.05);
    
    // Higher chance of tuff at lower y-levels
    const depthFactor = Math.max(0, (32 - y) / 32); // More common below y=32
    
    // Higher chance near amethyst geodes if detected
    let geodeProximityFactor = 0;
    if (this.isNearGeode(world, x, y, z)) {
      geodeProximityFactor = 0.3; // 30% boost near geodes
    }
    
    // Calculate final generation probability
    const threshold = 0.7 - (depthFactor * 0.2) - geodeProximityFactor;
    
    return noiseValue > threshold;
  }
  
  /**
   * Check if position is near an amethyst geode
   * @param {Object} world - The game world
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   * @returns {boolean} Whether position is near a geode
   */
  isNearGeode(world, x, y, z) {
    // If world doesn't have a method to check for geodes, return false
    if (!world || !world.isNearStructure) {
      return false;
    }
    
    // Check if position is near a geode
    return world.isNearStructure('amethyst_geode', x, y, z, 8); // Within 8 blocks
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      ...super.serialize()
    };
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {TuffBlock} New block instance
   */
  static deserialize(data) {
    const block = new TuffBlock();
    block.deserialize(data);
    return block;
  }
}

module.exports = TuffBlock; 