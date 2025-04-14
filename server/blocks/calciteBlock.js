/**
 * Calcite Block for Caves & Cliffs Update
 * A white stone-like block found in amethyst geodes
 */

const Block = require('./blockBase');

/**
 * Calcite Block
 * A smooth, white stone block associated with amethyst geodes
 */
class CalciteBlock extends Block {
  /**
   * Create a new calcite block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'calcite',
      name: 'Calcite',
      hardness: 0.75, // Softer than regular stone
      miningLevel: 'stone', // Requires stone pickaxe or better
      miningTime: 0.8,
      blast_resistance: 0.75, // More fragile than regular stone
      ...options
    });
    
    // Calcite has a uniform white texture on all sides
    this.textures = {
      all: 'blocks/calcite'
    };
    
    // Calcite only generates as part of amethyst geodes
    this.generateOnlyInGeodes = true;
    
    // Calcite forms in layers around amethyst geodes
    this.geodePriority = 1; // 0 = outer (smooth basalt), 1 = middle (calcite), 2 = inner (amethyst)
    this.geodeLayerThickness = { min: 1, max: 2 };
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
   * Handle block sounds (softer, more crystalline)
   * @returns {Object} Sound properties
   */
  getSounds() {
    return {
      break: 'block.calcite.break',
      step: 'block.calcite.step',
      place: 'block.calcite.place',
      hit: 'block.calcite.hit',
      fall: 'block.calcite.fall'
    };
  }
  
  /**
   * Handle world generation behavior for geodes
   * @param {Object} world - The game world
   * @param {Object} geodeCenter - Center coordinates of the geode
   * @param {number} geodeRadius - Radius of the geode
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   * @returns {boolean} Whether calcite should generate at this position
   */
  shouldGenerateInGeode(world, geodeCenter, geodeRadius, x, y, z) {
    if (!geodeCenter || geodeRadius <= 0) {
      return false;
    }
    
    // Calculate distance from geode center
    const dx = x - geodeCenter.x;
    const dy = y - geodeCenter.y;
    const dz = z - geodeCenter.z;
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    
    // Calculate the inner and outer bounds of the calcite layer
    // Calcite forms the middle layer between smooth basalt and amethyst
    const innerRadiusSquared = Math.pow(geodeRadius * 0.8, 2); // Inner bound (next to amethyst)
    const outerRadiusSquared = Math.pow(geodeRadius * 0.9, 2); // Outer bound (next to smooth basalt)
    
    // Check if position is within the calcite layer
    return distanceSquared >= innerRadiusSquared && distanceSquared <= outerRadiusSquared;
  }
  
  /**
   * Special characteristic: slightly slippery, like when walking on ice but less pronounced
   * @returns {number} Slipperiness value (0-1, higher means more slippery)
   */
  getSlipperiness() {
    return 0.6; // Slightly slippery (default is 0.5, ice is 0.9)
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
   * @returns {CalciteBlock} New block instance
   */
  static deserialize(data) {
    const block = new CalciteBlock();
    block.deserialize(data);
    return block;
  }
}

module.exports = CalciteBlock; 