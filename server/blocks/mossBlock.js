/**
 * MossBlock - Moss blocks for lush caves biome
 * Can be bonemealed to spread moss to nearby blocks
 */

class MossBlock {
  /**
   * Create a new MossBlock instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.id = options.id || 'moss_block';
    this.hardness = 0.5;
    this.toolType = 'hoe';
    this.drops = ['moss_block'];
    this.metadata = options.metadata || 0;
    this.spreadChance = options.spreadChance || 0.1;
    this.randomTickRate = 200; // 1 in 200 chance of a random tick
  }

  /**
   * Update method called on each tick
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @param {Number} deltaTime - Time since last update in ms
   * @returns {Object|null} - Block update data or null if no update
   */
  update(world, position, deltaTime) {
    // Random tick for natural moss spreading (very slow)
    if (Math.random() < 1/this.randomTickRate) {
      return this.trySpreadNaturally(world, position);
    }
    
    return null;
  }
  
  /**
   * Try to naturally spread moss to one adjacent block (very slow)
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @returns {Object|null} - Block update data or null if no spread
   * @private
   */
  trySpreadNaturally(world, position) {
    // Only spread in lush caves biome
    const biome = world.getBiomeAt(position.x, position.y, position.z);
    if (!biome || biome.id !== 'lush_caves') {
      return null;
    }
    
    // Only spread if there's water nearby
    if (!this.hasWaterNearby(world, position)) {
      return null;
    }
    
    // Blocks that can be converted to moss blocks
    const convertibleToMoss = [
      'stone', 'cobblestone', 'dirt', 'clay', 'tuff', 'deepslate'
    ];
    
    // Directions to check for spreading
    const directions = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 }
    ];
    
    // Choose a random direction
    const dir = directions[Math.floor(Math.random() * directions.length)];
    const targetPos = {
      x: position.x + dir.x,
      y: position.y + dir.y,
      z: position.z + dir.z
    };
    
    // Check if the target block can be converted
    const targetBlock = world.getBlockAt(targetPos.x, targetPos.y, targetPos.z);
    if (!targetBlock || !convertibleToMoss.includes(targetBlock.type)) {
      return null;
    }
    
    // Random chance to spread
    if (Math.random() < this.spreadChance) {
      world.setBlock(targetPos, { type: 'moss_block' });
      return true;
    }
    
    return null;
  }
  
  /**
   * Check if there's water nearby for growth/spread
   * @param {Object} world - The world object
   * @param {Object} position - The position to check around
   * @returns {Boolean} - Whether there's water nearby
   * @private
   */
  hasWaterNearby(world, position) {
    // Check adjacent blocks for water
    const directions = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 }
    ];
    
    for (const dir of directions) {
      const newPos = {
        x: position.x + dir.x,
        y: position.y + dir.y,
        z: position.z + dir.z
      };
      
      const block = world.getBlockAt(newPos.x, newPos.y, newPos.z);
      if (block && (block.type === 'water' || block.waterlogged)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Process an interaction with this block
   * @param {Object} player - Player who interacted
   * @param {String} action - Type of interaction
   * @param {Object} data - Additional data for the interaction
   * @returns {Object} - Result of the interaction
   */
  interact(player, action, data) {
    // Handle bone meal interaction
    if (action === 'use_item' && data.item === 'bone_meal') {
      // Spread moss to nearby convertible blocks
      this.spreadMoss(player.world, data.position);
      
      return {
        success: true,
        message: 'Applied bone meal to moss',
        consumeItem: true
      };
    }
    
    return { success: false };
  }
  
  /**
   * Spread moss to nearby blocks when bone meal is applied
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @private
   */
  spreadMoss(world, position) {
    // Blocks that can be converted to moss blocks
    const convertibleToMoss = [
      'stone', 'cobblestone', 'dirt', 'grass_block', 
      'tuff', 'deepslate', 'diorite', 'andesite', 'granite',
      'clay'
    ];
    
    // Blocks that can be converted to moss carpet
    const convertibleToCarpet = [
      'grass', 'air'
    ];
    
    // Spread range (3x3x3 cube centered on the moss block)
    const range = 1;
    
    // Check blocks in range
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        for (let dz = -range; dz <= range; dz++) {
          // Skip the center block (this moss block)
          if (dx === 0 && dy === 0 && dz === 0) continue;
          
          const blockPos = {
            x: position.x + dx,
            y: position.y + dy,
            z: position.z + dz
          };
          
          const targetBlock = world.getBlockAt(blockPos.x, blockPos.y, blockPos.z);
          
          if (!targetBlock) continue;
          
          // Convert to moss block with 50% chance
          if (convertibleToMoss.includes(targetBlock.type) && Math.random() < 0.5) {
            world.setBlock(blockPos, { type: 'moss_block' });
          }
          
          // Convert to moss carpet with 25% chance if air or grass and has solid block below
          if (convertibleToCarpet.includes(targetBlock.type) && Math.random() < 0.25) {
            const blockBelow = world.getBlockAt(blockPos.x, blockPos.y - 1, blockPos.z);
            
            if (blockBelow && blockBelow.solid) {
              world.setBlock(blockPos, { type: 'moss_carpet' });
            }
          }
          
          // Small chance to spawn azalea
          if (targetBlock.type === 'moss_block' && Math.random() < 0.1) {
            const blockAbove = world.getBlockAt(blockPos.x, blockPos.y + 1, blockPos.z);
            
            if (blockAbove && blockAbove.type === 'air') {
              const isFlowering = Math.random() < 0.4;
              world.setBlock({
                x: blockPos.x,
                y: blockPos.y + 1,
                z: blockPos.z
              }, { 
                type: isFlowering ? 'flowering_azalea' : 'azalea'
              });
            }
          }
        }
      }
    }
  }
  
  /**
   * Get the block's data for client
   * @returns {Object} - Block data for the client
   */
  getState() {
    return {
      type: this.id,
      metadata: this.metadata,
      hardness: this.hardness,
      toolType: this.toolType,
      drops: this.drops,
      solid: true,
      transparent: false,
      collidable: true
    };
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      type: this.id,
      metadata: this.metadata
    };
  }
  
  /**
   * Deserialize data to restore the block's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    if (data.metadata !== undefined) {
      this.metadata = data.metadata;
    }
  }
}

module.exports = MossBlock; 