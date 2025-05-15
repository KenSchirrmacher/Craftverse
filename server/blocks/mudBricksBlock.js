/**
 * Mud Bricks Block - A decorative building block crafted from packed mud
 * Has higher hardness and blast resistance than mud
 */

const { Block } = require('./baseBlock');

class MudBricksBlock extends Block {
  /**
   * Create a new mud bricks block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'mud_bricks',
      name: 'Mud Bricks',
      hardness: 1.5, // Harder than packed mud
      resistance: 6.0, // Good blast resistance
      requiresTool: true, // Requires pickaxe for efficient mining
      transparent: false,
      solid: true,
      lightLevel: 0,
      model: 'cube',
      texture: 'mud_bricks',
      sounds: {
        break: 'block.mud_bricks.break',
        step: 'block.mud_bricks.step',
        place: 'block.mud_bricks.place',
        hit: 'block.mud_bricks.hit',
        fall: 'block.stone.fall' // Uses stone fall sound
      },
      ...options
    });
    
    // Specify the correct tool for mining
    this.preferredTool = 'pickaxe';
  }
  
  /**
   * Get mining time for this block
   * @param {Player} player - Player mining the block
   * @param {Object} options - Additional options (e.g., tool)
   * @returns {number} Mining time in milliseconds
   */
  getMiningTime(player, options = {}) {
    let baseTime = this.hardness * 1500; // Base time in milliseconds
    
    if (player && options.tool) {
      const tool = options.tool;
      
      // Pickaxe is the correct tool for mud bricks
      if (tool.type === 'pickaxe') {
        const efficiency = tool.efficiency || 1.0;
        baseTime /= efficiency;
      } else {
        // Wrong tool penalty
        baseTime *= 3.33;
      }
      
      // Apply player mining speed modifiers
      if (player.miningSpeedModifier) {
        baseTime /= player.miningSpeedModifier;
      }
    } else {
      // No tool penalty
      baseTime *= 5;
    }
    
    return Math.max(50, baseTime); // Minimum 50ms, even with best tools
  }
  
  /**
   * Get items dropped when block is broken
   * @param {Player} player - Player who broke the block
   * @param {Object} options - Additional options (e.g., tool)
   * @returns {Array} Array of drop objects (id, count)
   */
  getDrops(player, options = {}) {
    // Mud bricks always drop itself
    return [{ id: 'mud_bricks', count: 1 }];
  }
  
  /**
   * Check if a tool is the correct type for this block
   * @param {Object} tool - Tool object
   * @returns {boolean} Whether this is the correct tool
   */
  isCorrectTool(tool) {
    return tool && tool.type === this.preferredTool;
  }
  
  /**
   * Handle neighbor block updates
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Vector3} fromPosition - Position of block that caused the update
   */
  onNeighborUpdate(world, position, fromPosition) {
    // Mud bricks are stable and don't react to neighbor updates
    return;
  }
  
  /**
   * Convert block to JSON for serialization
   * @returns {Object} Block data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      preferredTool: this.preferredTool
    };
  }
  
  /**
   * Create block from JSON data
   * @param {Object} data - Block data
   * @returns {MudBricksBlock} Block instance
   */
  static fromJSON(data) {
    return new MudBricksBlock({
      preferredTool: data.preferredTool
    });
  }
}

module.exports = MudBricksBlock; 