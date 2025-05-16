/**
 * SaplingBlock - Base class for all sapling blocks that can grow into trees
 */

const Block = require('./block');

class SaplingBlock extends Block {
  /**
   * Create a new sapling block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super(options);
    
    // Sapling-specific properties
    this.treeType = options.treeType || 'oak';
    this.growthChance = options.growthChance || 0.1;
    this.growthStages = options.growthStages || 2;
    this.requiresLight = options.requiresLight !== false;
    this.canPlantOn = options.canPlantOn || [
      'grass_block',
      'dirt',
      'coarse_dirt',
      'podzol',
      'mycelium',
      'moss_block',
      'farmland'
    ];
  }

  /**
   * Get texture for this block
   * @returns {string} - Texture identifier
   */
  getTexture() {
    return this.id;
  }
  
  /**
   * Check if the sapling can grow at the specified position
   * @param {Object} world - World instance
   * @param {Object} position - Position to check
   * @returns {boolean} - Whether the sapling can grow
   */
  canGrow(world, position) {
    // Check if there's enough light
    if (this.requiresLight && world.getLightLevel(position) < 9) {
      return false;
    }
    
    // Check if the ground is suitable
    const groundBlock = world.getBlockState(position.x, position.y - 1, position.z);
    if (!groundBlock) {
      return false;
    }
    
    // Check if the ground block is valid
    if (!this.canPlantOn.includes(groundBlock.type)) {
      return false;
    }
    
    // Check if there's enough vertical space for the tree
    // Default minimum height is 6 blocks
    for (let y = 1; y <= 6; y++) {
      const blockAbove = world.getBlockState(position.x, position.y + y, position.z);
      if (blockAbove && blockAbove.type !== 'air') {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Called when the sapling should grow into a tree
   * @param {Object} world - World instance
   * @param {Object} position - Position to grow at
   * @param {Object} random - Random number generator
   * @returns {boolean} - Whether the tree was successfully generated
   */
  growTree(world, position, random) {
    // Generate tree using the world's feature generator
    return world.generateFeature(this.treeType, position, random);
  }
  
  /**
   * Called on random block tick to handle special block behavior
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} blockState - Current block state
   * @param {Object} random - Random number generator
   */
  onRandomTick(world, position, blockState, random) {
    // Get the current growth stage
    const stage = blockState.stage || 0;
    
    // Only proceed with random chance
    if (random.nextFloat() < this.growthChance) {
      // If already at max stage, attempt to grow the tree
      if (stage >= this.growthStages - 1) {
        if (this.canGrow(world, position)) {
          this.growTree(world, position, random);
          
          // Remove the sapling if tree was generated
          world.setBlockState(position.x, position.y, position.z, { type: 'air' });
        }
      } else {
        // Otherwise, increment the growth stage
        world.setBlockState(position.x, position.y, position.z, {
          type: this.id,
          stage: stage + 1
        });
      }
    }
  }
  
  /**
   * Called when bone meal is used on this block
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} blockState - Current block state
   * @returns {boolean} - Whether bone meal was consumed
   */
  onBonemeal(world, position, blockState) {
    // Get the current growth stage
    const stage = blockState.stage || 0;
    
    // If already at max stage, attempt to grow the tree
    if (stage >= this.growthStages - 1) {
      if (this.canGrow(world, position)) {
        const random = world.getRandom();
        this.growTree(world, position, random);
        
        // Remove the sapling if tree was generated
        world.setBlockState(position.x, position.y, position.z, { type: 'air' });
        
        // Add particles and sound
        world.addParticle({
          type: 'bonemeal',
          position: position,
          count: 15,
          spread: { x: 0.5, y: 0.5, z: 0.5 }
        });
        
        world.playSound(position, 'item.bone_meal.use', 1.0, 1.0);
        
        return true;
      }
    } else {
      // Otherwise, increment the growth stage
      world.setBlockState(position.x, position.y, position.z, {
        type: this.id,
        stage: stage + 1
      });
      
      // Add particles and sound
      world.addParticle({
        type: 'bonemeal',
        position: position,
        count: 15,
        spread: { x: 0.5, y: 0.5, z: 0.5 }
      });
      
      world.playSound(position, 'item.bone_meal.use', 1.0, 1.0);
      
      return true;
    }
    
    return false;
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
}

module.exports = SaplingBlock; 