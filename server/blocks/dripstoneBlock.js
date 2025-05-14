/**
 * DripstoneBlock - Solid block variant that forms dripstone formations
 * Part of the Caves & Cliffs update
 */

const Block = require('./block');

class DripstoneBlock extends Block {
  /**
   * Create a new DripstoneBlock
   * @param {Object} options - Block configuration options
   */
  constructor(options = {}) {
    super({
      id: 'dripstone_block',
      name: 'Dripstone Block',
      hardness: 1.5,
      blastResistance: 3,
      toolType: 'pickaxe',
      toolLevel: 0,
      transparent: false,
      solid: true,
      ...options
    });
  }

  /**
   * Update method called on each tick
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @param {Number} deltaTime - Time since last update in ms
   * @returns {Object|null} - Block update data or null if no update
   */
  update(world, position, deltaTime) {
    // Dripstone blocks don't do anything on tick
    return null;
  }
  
  /**
   * Process an interaction with this block
   * @param {Object} player - Player who interacted
   * @param {String} action - Type of interaction
   * @param {Object} data - Additional data for the interaction
   * @returns {Object} - Result of the interaction
   */
  interact(player, action, data) {
    // No special interactions
    return { success: false };
  }
  
  /**
   * Called when a block is placed adjacent to this one
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @param {Object} adjacentPosition - Position of the new adjacent block
   * @param {Object} adjacentBlock - The new adjacent block
   * @returns {Object|null} - Block update data or null if no update
   */
  onAdjacentBlockPlaced(world, position, adjacentPosition, adjacentBlock) {
    // Check if a pointed dripstone could naturally form
    if (this.isNatural && adjacentBlock.type === 'air' || adjacentBlock.type === 'cave_air') {
      // Determine placement direction (above or below)
      const isBelow = adjacentPosition.y < position.y;
      const isAbove = adjacentPosition.y > position.y;
      
      // Check for space to grow pointed dripstone
      if ((isBelow || isAbove) && Math.random() < 0.05) { // 5% chance
        // Try to create a pointed dripstone
        const variant = isBelow ? 'stalagmite' : 'stalactite';
        
        world.setBlock(adjacentPosition, {
          type: 'pointed_dripstone',
          variant: variant,
          size: 0, // Tip
          canGrow: Math.random() < 0.3 // 30% chance to be able to grow
        });
        
        return null; // No change to this block
      }
    }
    
    return null;
  }
  
  /**
   * Check if this block can support the given block above it
   * @param {Object} block - The block to check support for
   * @returns {Boolean} - Whether this block can support the other block
   */
  canSupport(block) {
    // Can support any block but especially good for pointed dripstone
    return true;
  }
  
  /**
   * Get the block's data for client
   * @returns {Object} - Block data for the client
   */
  getState() {
    return {
      type: this.id,
      solid: true,
      transparent: false,
      collidable: true,
      hardness: this.hardness,
      resistance: this.resistance,
      texture: 'dripstone_block',
      sounds: this.sounds
    };
  }
  
  /**
   * Get the drop item when this block is broken
   * @param {Object} tool - The tool used to break the block
   * @returns {Object|null} - The item to drop
   */
  getDrops(tool) {
    // Only drops if mined with a pickaxe
    if (tool && tool.type && tool.type.includes('pickaxe')) {
      return {
        type: this.id,
        count: 1
      };
    }
    
    return null;
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      type: this.id,
      isNatural: this.isNatural
    };
  }
  
  /**
   * Deserialize data to restore the block's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    if (data.isNatural !== undefined) this.isNatural = data.isNatural;
  }

  onPlace(world, x, y, z) {
    // Check if block above is pointed dripstone
    const blockAbove = world.getBlock(x, y + 1, z);
    if (blockAbove && blockAbove.id === 'pointed_dripstone' && blockAbove.type === 'stalactite') {
      // Update the dripstone's thickness
      blockAbove.updateThickness(world, x, y + 1, z);
    }

    // Check if block below is pointed dripstone
    const blockBelow = world.getBlock(x, y - 1, z);
    if (blockBelow && blockBelow.id === 'pointed_dripstone' && blockBelow.type === 'stalagmite') {
      // Update the dripstone's thickness
      blockBelow.updateThickness(world, x, y - 1, z);
    }
  }

  onBreak(world, x, y, z) {
    // Update neighboring pointed dripstone blocks
    const blockAbove = world.getBlock(x, y + 1, z);
    if (blockAbove && blockAbove.id === 'pointed_dripstone') {
      blockAbove.updateThickness(world, x, y + 1, z);
    }

    const blockBelow = world.getBlock(x, y - 1, z);
    if (blockBelow && blockBelow.id === 'pointed_dripstone') {
      blockBelow.updateThickness(world, x, y - 1, z);
    }
  }
}

module.exports = DripstoneBlock; 