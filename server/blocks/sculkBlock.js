/**
 * SculkBlock - Base block for the sculk family found in the Deep Dark biome
 */

const Block = require('./baseBlock');

class SculkBlock extends Block {
  /**
   * Create a new SculkBlock
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'sculk',
      name: 'Sculk',
      hardness: 0.6,
      resistance: 0.6,
      requiresTool: true,
      toolType: 'hoe',
      drops: [], // Drops nothing by default without silk touch
      texture: 'sculk',
      sounds: {
        break: 'block.sculk.break',
        step: 'block.sculk.step',
        place: 'block.sculk.place',
        hit: 'block.sculk.hit',
        fall: 'block.sculk.fall'
      },
      ...options
    });

    // Sculk-specific properties
    this.spreadable = true; // Can be spread by sculk catalysts
    this.xpDropAmount = 1; // Small XP drop when mined with silk touch
  }

  /**
   * Handle block breaking
   * @param {Object} world - World object
   * @param {Object} position - Block position
   * @param {Object} player - Player who broke the block
   * @param {Object} options - Additional break options
   * @returns {boolean} Whether breaking was successful
   */
  onBreak(world, position, player, options = {}) {
    if (!world) return true;
    
    // Handle drops based on tool and enchantments
    if (player && player.gameMode !== 'creative') {
      const tool = options.tool || player.getEquippedItem();
      
      // Check for silk touch
      if (tool && tool.enchantments && tool.enchantments.silkTouch) {
        world.dropItem({ id: this.id, count: 1 }, position);
      } else {
        // Drop XP when broken without silk touch
        world.addExperience(this.xpDropAmount, position);
      }
    }
    
    return true;
  }

  /**
   * Get mining time for this block
   * @param {Object} player - Player mining the block
   * @param {Object} options - Additional options (e.g., tool)
   * @returns {number} Mining time in milliseconds
   */
  getMiningTime(player, options = {}) {
    let baseTime = this.hardness * 1500; // Base time in milliseconds
    
    if (player && options.tool) {
      const tool = options.tool;
      
      // Hoes are the correct tool for sculk blocks
      if (tool.type === 'hoe') {
        const efficiency = tool.efficiency || 1.0;
        baseTime /= (efficiency * 2); // Hoes are extra effective
      } else if (this.requiresTool && !this.isCorrectTool(tool)) {
        return baseTime * 3.33; // Much slower with wrong tool
      } else {
        // Apply efficiency from tool
        const efficiency = tool.efficiency || 1.0;
        baseTime /= efficiency;
      }
      
      // Apply player mining speed modifiers (e.g., from status effects)
      if (player.miningSpeedModifier) {
        baseTime /= player.miningSpeedModifier;
      }
    }
    
    return Math.max(50, baseTime); // Minimum 50ms, even with best tools
  }

  /**
   * Check if a tool is the correct type for this block
   * @param {Object} tool - Tool object
   * @returns {boolean} Whether this is the correct tool
   */
  isCorrectTool(tool) {
    // Hoes are the preferred tool for sculk blocks
    return tool && tool.type === 'hoe';
  }

  /**
   * Get items dropped when block is broken
   * @param {Object} player - Player who broke the block
   * @param {Object} options - Additional options (e.g., tool)
   * @returns {Array} Array of drop objects (id, count)
   */
  getDrops(player, options = {}) {
    // Only drop with silk touch
    if (options.tool && options.tool.enchantments && options.tool.enchantments.silkTouch) {
      return [{ id: this.id, count: 1 }];
    }
    
    return []; // No drops without silk touch
  }

  /**
   * Convert block to JSON for serialization
   * @returns {Object} Block data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      spreadable: this.spreadable,
      xpDropAmount: this.xpDropAmount
    };
  }

  /**
   * Create block from JSON data
   * @param {Object} data - Block data
   * @returns {SculkBlock} Block instance
   */
  static fromJSON(data) {
    const block = new SculkBlock();
    block.spreadable = data.spreadable !== undefined ? data.spreadable : true;
    block.xpDropAmount = data.xpDropAmount !== undefined ? data.xpDropAmount : 1;
    return block;
  }
}

module.exports = SculkBlock; 