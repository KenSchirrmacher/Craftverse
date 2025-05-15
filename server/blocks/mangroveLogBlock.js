/**
 * Mangrove Log Block - Log block from mangrove trees
 * Has vertical and horizontal orientations, can be stripped
 */

const { Block } = require('./baseBlock');

class MangroveLogBlock extends Block {
  /**
   * Create a new mangrove log block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'mangrove_log',
      name: 'Mangrove Log',
      hardness: 2.0,
      resistance: 2.0,
      requiresTool: false, // Can be broken without specific tools
      transparent: false,
      solid: true,
      flammable: true, // Wood is flammable
      lightLevel: 0,
      model: 'log',
      texture: 'mangrove_log',
      sounds: {
        break: 'block.wood.break',
        step: 'block.wood.step',
        place: 'block.wood.place',
        hit: 'block.wood.hit',
        fall: 'block.wood.fall'
      },
      ...options
    });
    
    // Log orientation (default: vertical)
    this.axis = options.axis || 'y';
    
    // Whether this log is stripped
    this.stripped = options.stripped || false;
    
    // Tool properties
    this.preferredTool = 'axe';
  }
  
  /**
   * Handle player right clicking on log
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Player} player - Player who clicked
   * @param {Object} options - Additional options
   * @returns {boolean} Whether the interaction was handled
   */
  onInteract(world, position, player, options = {}) {
    // If player is using an axe, strip the log
    const heldItem = player.getHeldItem();
    
    if (heldItem && heldItem.type === 'axe' && !this.stripped) {
      // Convert to stripped version
      world.setBlock(position, 'stripped_mangrove_log', { axis: this.axis });
      
      // Play sound
      world.playSound('item.axe.strip', position, 1.0, 1.0);
      
      // Damage the axe
      if (player.gameMode !== 'creative') {
        player.damageHeldItem(1);
      }
      
      // Spawn bark particles
      world.addParticle({
        type: 'item',
        itemType: 'mangrove_bark',
        position: {
          x: position.x + 0.5,
          y: position.y + 0.5,
          z: position.z + 0.5
        },
        count: 10,
        speed: 0.1
      });
      
      return true;
    }
    
    return false;
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
      
      // Axe is the best tool for wood
      if (tool.type === 'axe') {
        // Faster mining with axes
        const efficiency = tool.efficiency || 1.0;
        baseTime /= efficiency;
      }
      
      // Apply player mining speed modifiers
      if (player.miningSpeedModifier) {
        baseTime /= player.miningSpeedModifier;
      }
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
    return [{ id: this.stripped ? 'stripped_mangrove_log' : 'mangrove_log', count: 1 }];
  }
  
  /**
   * Convert block to JSON for serialization
   * @returns {Object} Block data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      axis: this.axis,
      stripped: this.stripped
    };
  }
  
  /**
   * Create block from JSON data
   * @param {Object} data - Block data
   * @returns {MangroveLogBlock} Block instance
   */
  static fromJSON(data) {
    return new MangroveLogBlock({
      axis: data.axis,
      stripped: data.stripped
    });
  }
}

module.exports = MangroveLogBlock; 