/**
 * Mangrove Roots Block - Special roots for mangrove trees
 * Can be waterlogged and partially transparent
 */

const Block = require('./baseBlock');

class MangroveRootsBlock extends Block {
  /**
   * Create a new mangrove roots block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'mangrove_roots',
      name: 'Mangrove Roots',
      hardness: 0.7,
      resistance: 0.7,
      requiresTool: false, // Can be broken without specific tools
      transparent: true, // Partially transparent for rendering
      solid: true, // Still blocks movement
      flammable: true,
      lightLevel: 0,
      model: 'roots',
      texture: 'mangrove_roots',
      sounds: {
        break: 'block.wood.break',
        step: 'block.roots.step',
        place: 'block.roots.place',
        hit: 'block.roots.hit',
        fall: 'block.wood.fall'
      },
      ...options
    });
    
    // Waterlogging state
    this.waterlogged = options.waterlogged || false;
    
    // Tool properties
    this.preferredTool = 'axe';
    
    // Special root properties
    this.canGrowThrough = true; // Plants can grow through roots
    this.canPlaceOn = ['mud', 'dirt', 'sand', 'clay', 'gravel', 'mangrove_roots']; // Valid placement blocks
  }
  
  /**
   * Check if the block can be placed at the given position
   * @param {World} world - World object
   * @param {Vector3} position - Position to place at
   * @param {Object} options - Additional placement options
   * @returns {boolean} Whether the block can be placed
   */
  canPlaceAt(world, position, options = {}) {
    // Check if there's a valid supporting block underneath
    const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
    
    // Can be placed on soil blocks or other mangrove roots
    const isValidBase = this.canPlaceOn.includes(blockBelow?.id || 'air');
    
    // Can also be placed in water
    const isInWater = world.getBlockAt(position.x, position.y, position.z)?.id === 'water';
    
    return isValidBase || isInWater;
  }
  
  /**
   * Handle block being placed
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Player} player - Player who placed the block
   * @param {Object} options - Additional options
   */
  onPlace(world, position, player, options = {}) {
    // Check if we're placing in water and set waterlogged state
    const replaceBlock = world.getBlockAt(position.x, position.y, position.z);
    
    if (replaceBlock?.id === 'water') {
      this.waterlogged = true;
    }
  }
  
  /**
   * Handle block updates
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Vector3} fromPosition - Position of block that caused the update
   */
  onNeighborUpdate(world, position, fromPosition) {
    // If water is placed adjacent to roots, waterlog them
    const fromBlock = world.getBlockAt(fromPosition.x, fromPosition.y, fromPosition.z);
    
    if (fromBlock?.id === 'water' && !this.waterlogged) {
      this.waterlogged = true;
      world.setBlock(position, 'mangrove_roots', { waterlogged: true });
    }
    
    // Check if the supporting block below was removed
    if (fromPosition.y === position.y - 1) {
      const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
      
      // If the block below is no longer valid support, break this block
      if (!blockBelow || !this.canPlaceOn.includes(blockBelow.id)) {
        world.setBlock(position, 'air');
        
        // Drop the block as an item
        world.dropItem(
          { id: 'mangrove_roots', count: 1 },
          { x: position.x + 0.5, y: position.y + 0.5, z: position.z + 0.5 }
        );
        
        // Play breaking sound
        world.playSound(this.sounds.break, position, 1.0, 1.0);
      }
    }
  }
  
  /**
   * Special collision handling for entities
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Entity} entity - Entity colliding with the block
   * @param {Object} options - Additional options
   */
  onEntityCollision(world, position, entity, options = {}) {
    // Slow movement slightly, but less than mud
    if (entity && entity.isOnGround) {
      // Add a slight movement penalty (10%)
      entity.applyMovementModifier('roots', 0.9);
    }
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
      
      // Axe is the best tool for roots
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
    return [{ id: 'mangrove_roots', count: 1 }];
  }
  
  /**
   * Get the fluid state of this block (for waterlogged blocks)
   * @returns {string|null} Fluid type or null if not fluid
   */
  getFluidType() {
    return this.waterlogged ? 'water' : null;
  }
  
  /**
   * Convert block to JSON for serialization
   * @returns {Object} Block data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      waterlogged: this.waterlogged,
      canGrowThrough: this.canGrowThrough,
      canPlaceOn: this.canPlaceOn
    };
  }
  
  /**
   * Create block from JSON data
   * @param {Object} data - Block data
   * @returns {MangroveRootsBlock} Block instance
   */
  static fromJSON(data) {
    return new MangroveRootsBlock({
      waterlogged: data.waterlogged,
      canGrowThrough: data.canGrowThrough,
      canPlaceOn: data.canPlaceOn
    });
  }
}

module.exports = MangroveRootsBlock; 