/**
 * LeavesBlock - Base class for all leaf blocks in the game
 */

const Block = require('./block');

class LeavesBlock extends Block {
  /**
   * Create a new leaves block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super(options);
    
    // Leaves-specific properties
    this.persistent = options.persistent || false;
    this.distance = options.distance || 7;
    this.decayable = options.decayable !== false;
    this.saplingDropChance = options.saplingDropChance || 0.05;
    this.saplingType = options.saplingType || 'oak_sapling';
    this.hasParticles = options.hasParticles || false;
    this.color = options.color || '#00FF00';
  }

  /**
   * Get the texture for this block
   * @returns {string} - Texture identifier
   */
  getTexture() {
    return this.id;
  }

  /**
   * Get the item drops for this block
   * @param {Object} blockState - State of the broken block
   * @param {Object} toolInfo - Information about the tool used
   * @returns {Array} - Array of item drops
   */
  getDrops(blockState, toolInfo) {
    const drops = [];
    
    // Always drop leaves when broken with shears or silk touch
    if (toolInfo && (toolInfo.type === 'shears' || toolInfo.enchantments.some(e => e.type === 'silk_touch'))) {
      drops.push({ type: this.id, count: 1 });
      return drops;
    }
    
    // Random chance to drop sapling
    if (Math.random() < this.saplingDropChance) {
      drops.push({ type: this.saplingType, count: 1 });
    }
    
    // Random chance to drop sticks (1-2)
    if (Math.random() < 0.2) {
      drops.push({ type: 'stick', count: Math.floor(Math.random() * 2) + 1 });
    }
    
    return drops;
  }
  
  /**
   * Called on random block tick to handle special block behavior
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} blockState - Current block state
   * @param {Object} random - Random number generator
   */
  onRandomTick(world, position, blockState, random) {
    // Handle leaf decay
    if (this.decayable && this.canDecay() && !blockState.persistent) {
      const distance = this.getLogDistance(world, position);
      
      if (distance > this.getMaxLogDistance()) {
        // Replace with air (leaf decayed)
        world.setBlockState(position.x, position.y, position.z, { type: 'air' });
        
        // Play sound and add particles
        world.playSound(position, 'block.grass.break', 0.05, 1.2);
        world.addParticle({
          type: 'leaf',
          position: position,
          count: 4,
          spread: { x: 0.5, y: 0.5, z: 0.5 },
          color: this.color
        });
      }
    }
  }
  
  /**
   * Calculate the distance to the nearest connected log block
   * @param {Object} world - World instance
   * @param {Object} position - Start position
   * @returns {number} - Distance to log (in blocks)
   */
  getLogDistance(world, position) {
    // This is a simplified version
    // In a real implementation, this would use a breadth-first search
    // to find the nearest log block within a certain range
    
    // For now, we'll just check nearby blocks in a small radius
    const maxRadius = this.getMaxLogDistance();
    
    // Check if there's a log nearby
    for (let x = -maxRadius; x <= maxRadius; x++) {
      for (let y = -maxRadius; y <= maxRadius; y++) {
        for (let z = -maxRadius; z <= maxRadius; z++) {
          // Skip if too far away
          if (Math.abs(x) + Math.abs(y) + Math.abs(z) > maxRadius) continue;
          
          const blockPos = {
            x: position.x + x,
            y: position.y + y,
            z: position.z + z
          };
          
          const block = world.getBlockState(blockPos.x, blockPos.y, blockPos.z);
          if (block && block.type.includes('log')) {
            // Found a log, return the distance
            return Math.abs(x) + Math.abs(y) + Math.abs(z);
          }
        }
      }
    }
    
    // No log found within range
    return Number.MAX_SAFE_INTEGER;
  }
  
  /**
   * Get the sound this block makes when broken
   * @returns {string} - Sound identifier
   */
  getBreakSound() {
    return 'block.grass.break';
  }
  
  /**
   * Get the sound this block makes when placed
   * @returns {string} - Sound identifier
   */
  getPlaceSound() {
    return 'block.grass.place';
  }
  
  /**
   * Get the sound this block makes when stepped on
   * @returns {string} - Sound identifier
   */
  getStepSound() {
    return 'block.grass.step';
  }
  
  /**
   * Whether this block can decay when not connected to logs
   * @returns {boolean} - Whether the leaves can decay
   */
  canDecay() {
    return true;
  }
  
  /**
   * The maximum distance from a log block for these leaves to persist
   * @returns {number} - Max distance from log
   */
  getMaxLogDistance() {
    return 6;
  }
}

module.exports = LeavesBlock; 