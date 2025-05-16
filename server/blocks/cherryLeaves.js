/**
 * Cherry Leaves - Pink colored leaves with petal particles
 * Added in the Trails & Tales update
 */

const LeavesBlock = require('./leavesBlock');

class CherryLeaves extends LeavesBlock {
  constructor() {
    super({
      id: 'cherry_leaves',
      name: 'Cherry Leaves',
      hardness: 0.2,
      toolType: 'shears',
      stackSize: 64,
      flammable: true,
      opacity: 1
    });
    
    // Special properties for cherry leaves
    this.color = '#ffb7c5'; // Light pink color
    this.hasParticles = true;
    this.saplingDropChance = 0.05; // 5% chance to drop a sapling
    this.saplingType = 'cherry_sapling';
  }

  /**
   * Get texture indexes for this block
   * @returns {string} - Texture identifier
   */
  getTexture() {
    return 'cherry_leaves';
  }

  /**
   * Get the item that should be dropped when this block is broken
   * @param {Object} blockState - State of the broken block
   * @param {Object} toolInfo - Information about the tool used
   * @returns {Array} - Array of item drop information
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
    super.onRandomTick(world, position, blockState, random);
    
    // Generate falling petal particles
    if (this.hasParticles && random.nextFloat() < 0.05) {
      // Only spawn particles if there's air below
      const belowBlock = world.getBlockState(position.x, position.y - 1, position.z);
      
      if (!belowBlock || belowBlock.type === 'air') {
        world.addParticle({
          type: 'cherry_blossom_petal',
          position: {
            x: position.x + random.nextFloat(),
            y: position.y,
            z: position.z + random.nextFloat()
          },
          velocity: {
            x: (random.nextFloat() - 0.5) * 0.05,
            y: -0.05 - random.nextFloat() * 0.05,
            z: (random.nextFloat() - 0.5) * 0.05
          },
          color: this.color,
          lifetime: 5 + random.nextInt(5)
        });
      }
    }
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

module.exports = CherryLeaves; 