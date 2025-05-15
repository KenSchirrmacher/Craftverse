/**
 * Packed Mud Block - A dried version of mud, created by drying mud blocks
 * Used as a building material and for crafting mud bricks
 */

const { Block } = require('./baseBlock');

class PackedMudBlock extends Block {
  /**
   * Create a new packed mud block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'packed_mud',
      name: 'Packed Mud',
      hardness: 1.0, // Harder than regular mud
      resistance: 3.0, // More resistant to explosions
      requiresTool: false, // Can be broken without specific tools
      transparent: false,
      solid: true,
      lightLevel: 0,
      model: 'cube',
      texture: 'packed_mud',
      sounds: {
        break: 'block.packed_mud.break',
        step: 'block.packed_mud.step',
        place: 'block.packed_mud.place',
        hit: 'block.packed_mud.hit',
        fall: 'block.packed_mud.fall'
      },
      ...options
    });
  }
  
  /**
   * Handle player right clicking on packed mud
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Player} player - Player who clicked
   * @param {Object} options - Additional options
   * @returns {boolean} Whether the interaction was handled
   */
  onInteract(world, position, player, options = {}) {
    // If player is holding a water bottle, the packed mud can become regular mud
    const heldItem = player.getHeldItem();
    
    if (heldItem && heldItem.id === 'water_bottle') {
      // Convert to regular mud
      world.setBlock(position, 'mud');
      
      // Create splash particles
      world.addParticle({
        type: 'splash',
        position: {
          x: position.x + 0.5,
          y: position.y + 1.0,
          z: position.z + 0.5
        },
        count: 8,
        speed: 0.2
      });
      
      // Play sound
      world.playSound('item.bottle.empty', position, 1.0, 1.0);
      
      // Give back glass bottle
      player.addItem({ id: 'glass_bottle', count: 1 });
      
      // Remove water bottle from player
      player.removeHeldItem(1);
      
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
      
      // Pickaxe and shovel both work effectively
      if (tool.type === 'pickaxe' || tool.type === 'shovel') {
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
    // Packed mud always drops itself
    return [{ id: 'packed_mud', count: 1 }];
  }
  
  /**
   * Handle neighbor block updates
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Vector3} fromPosition - Position of block that caused the update
   */
  onNeighborUpdate(world, position, fromPosition) {
    // If water is placed adjacent to packed mud, there's a small chance it reverts to mud
    const fromBlock = world.getBlockAt(fromPosition.x, fromPosition.y, fromPosition.z);
    if (fromBlock === 'water' && Math.random() < 0.2) { // 20% chance
      world.setBlock(position, 'mud');
      
      // Create particles
      world.addParticle({
        type: 'splash',
        position: {
          x: position.x + 0.5,
          y: position.y + 0.5,
          z: position.z + 0.5
        },
        count: 5,
        speed: 0.1
      });
    }
  }
  
  /**
   * Convert block to JSON for serialization
   * @returns {Object} Block data
   */
  toJSON() {
    return {
      ...super.toJSON()
    };
  }
  
  /**
   * Create block from JSON data
   * @param {Object} data - Block data
   * @returns {PackedMudBlock} Block instance
   */
  static fromJSON(data) {
    return new PackedMudBlock();
  }
}

module.exports = PackedMudBlock; 