/**
 * Mangrove Propagule Block - Special hanging sapling for mangrove trees
 * Can be waterlogged and planted on various blocks
 */

const Block = require('./baseBlock');

class MangrovePropaguleBlock extends Block {
  /**
   * Create a new mangrove propagule block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'mangrove_propagule',
      name: 'Mangrove Propagule',
      hardness: 0.0,
      resistance: 0.0,
      requiresTool: false, 
      transparent: true, 
      solid: false, // Not solid for collision
      flammable: true,
      lightLevel: 0,
      model: 'propagule',
      texture: 'mangrove_propagule',
      sounds: {
        break: 'block.grass.break',
        step: 'block.grass.step',
        place: 'block.grass.place',
        hit: 'block.grass.hit',
        fall: 'block.grass.fall'
      },
      ...options
    });
    
    // Waterlogging state
    this.waterlogged = options.waterlogged || false;
    
    // Growth stage (0-4, with 4 being fully grown)
    this.stage = options.stage !== undefined ? options.stage : 0;
    
    // Whether this propagule is hanging (true) or planted (false)
    this.hanging = options.hanging !== undefined ? options.hanging : true;
    
    // Valid placement blocks when planted
    this.canPlantOn = ['mud', 'dirt', 'grass', 'farmland', 'podzol', 'sand', 'mycelium', 'moss_block', 'mangrove_roots'];
  }
  
  /**
   * Check if the block can be placed at the given position
   * @param {World} world - World object
   * @param {Vector3} position - Position to place at
   * @param {Object} options - Additional placement options
   * @returns {boolean} Whether the block can be placed
   */
  canPlaceAt(world, position, options = {}) {
    const blockAbove = world.getBlockAt(position.x, position.y + 1, position.z);
    const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
    
    // Can hang from mangrove leaves
    if (blockAbove?.id === 'mangrove_leaves') {
      return true;
    }
    
    // Can be planted on valid soil blocks
    if (this.canPlantOn.includes(blockBelow?.id || 'air')) {
      return true;
    }
    
    return false;
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
    
    // Determine if we're hanging or planted
    const blockAbove = world.getBlockAt(position.x, position.y + 1, position.z);
    const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
    
    if (blockAbove?.id === 'mangrove_leaves') {
      this.hanging = true;
    } else if (this.canPlantOn.includes(blockBelow?.id || 'air')) {
      this.hanging = false;
    }
  }
  
  /**
   * Handle random block updates for growth
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Object} options - Additional update options
   */
  onRandomTick(world, position, options = {}) {
    // Only non-hanging propagules can grow
    if (this.hanging) {
      return;
    }
    
    // Random chance to grow
    const growthChance = this.waterlogged ? 0.15 : 0.05; // Faster in water
    
    if (Math.random() < growthChance) {
      // Increase growth stage
      if (this.stage < 4) {
        this.stage += 1;
        world.setBlock(position, 'mangrove_propagule', {
          waterlogged: this.waterlogged,
          stage: this.stage,
          hanging: this.hanging
        });
      } else {
        // Fully grown, attempt to grow into a mangrove tree
        this.growTree(world, position);
      }
    }
  }
  
  /**
   * Grow into a full mangrove tree
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @returns {boolean} Whether the tree was successfully grown
   */
  growTree(world, position) {
    // Check if there's enough space for a tree
    if (!this.checkTreeSpace(world, position)) {
      return false;
    }
    
    // Generate a mangrove tree
    // This is a simplified version; real generation would be more complex
    const treeHeight = 5 + Math.floor(Math.random() * 4); // 5-8 blocks tall
    
    // Create the trunk
    for (let y = 0; y < treeHeight; y++) {
      world.setBlock(
        { x: position.x, y: position.y + y, z: position.z },
        'mangrove_log',
        { axis: 'y' }
      );
    }
    
    // Create roots
    for (let i = 0; i < 6; i++) {
      const rootX = position.x + (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.7 ? 2 : 1);
      const rootZ = position.z + (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.7 ? 2 : 1);
      const rootY = position.y + (Math.random() > 0.7 ? 1 : 0);
      
      world.setBlock(
        { x: rootX, y: rootY, z: rootZ },
        'mangrove_roots',
        { waterlogged: false }
      );
    }
    
    // Create leaves
    const leafRadius = 2;
    const leafTop = position.y + treeHeight;
    const leafBottom = leafTop - 3;
    
    for (let y = leafBottom; y <= leafTop + 1; y++) {
      const curRadius = y === leafTop + 1 ? 1 : leafRadius;
      
      for (let x = -curRadius; x <= curRadius; x++) {
        for (let z = -curRadius; z <= curRadius; z++) {
          // Skip corners for a more natural shape
          if (x*x + z*z > curRadius*curRadius + 0.5) continue;
          
          // Skip trunk positions
          if (x === 0 && z === 0 && y < leafTop) continue;
          
          // Place leaf block
          world.setBlock(
            { x: position.x + x, y, z: position.z + z },
            'mangrove_leaves',
            { persistent: false }
          );
          
          // Small chance to add a propagule underneath leaves
          if (y === leafBottom && Math.random() < 0.2) {
            world.setBlock(
              { x: position.x + x, y: y - 1, z: position.z + z },
              'mangrove_propagule',
              { hanging: true, stage: 0 }
            );
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * Check if there's enough space to grow a tree
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @returns {boolean} Whether there's enough space
   */
  checkTreeSpace(world, position) {
    // Basic space checking - would be more complex in actual implementation
    // Check vertical space
    const minHeight = 5;
    for (let y = 1; y <= minHeight; y++) {
      const block = world.getBlockAt(position.x, position.y + y, position.z);
      if (block && block.id !== 'air' && block.id !== 'water') {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Handle block updates
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Vector3} fromPosition - Position of block that caused the update
   */
  onNeighborUpdate(world, position, fromPosition) {
    // If water is placed adjacent, waterlog the propagule
    const fromBlock = world.getBlockAt(fromPosition.x, fromPosition.y, fromPosition.z);
    
    if (fromBlock?.id === 'water' && !this.waterlogged) {
      this.waterlogged = true;
      world.setBlock(position, 'mangrove_propagule', {
        waterlogged: true,
        stage: this.stage,
        hanging: this.hanging
      });
    }
    
    // Check if support was removed
    if (this.hanging && fromPosition.y === position.y + 1) {
      const blockAbove = world.getBlockAt(position.x, position.y + 1, position.z);
      
      if (!blockAbove || blockAbove.id !== 'mangrove_leaves') {
        // Support removed, break and drop
        world.setBlock(position, this.waterlogged ? 'water' : 'air');
        
        // Drop the propagule as an item
        world.dropItem(
          { id: 'mangrove_propagule', count: 1 },
          { x: position.x + 0.5, y: position.y + 0.5, z: position.z + 0.5 }
        );
        
        // Play breaking sound
        world.playSound(this.sounds.break, position, 1.0, 1.0);
      }
    } else if (!this.hanging && fromPosition.y === position.y - 1) {
      const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
      
      if (!blockBelow || !this.canPlantOn.includes(blockBelow.id)) {
        // Support removed, break and drop
        world.setBlock(position, this.waterlogged ? 'water' : 'air');
        
        // Drop the propagule as an item
        world.dropItem(
          { id: 'mangrove_propagule', count: 1 },
          { x: position.x + 0.5, y: position.y + 0.5, z: position.z + 0.5 }
        );
        
        // Play breaking sound
        world.playSound(this.sounds.break, position, 1.0, 1.0);
      }
    }
  }
  
  /**
   * Handle bone meal usage
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Player} player - Player using bone meal
   * @returns {boolean} Whether bone meal was successfully used
   */
  onBoneMeal(world, position, player) {
    // Only non-hanging propagules can be accelerated with bone meal
    if (this.hanging) {
      return false;
    }
    
    // Either grow to next stage or into tree if fully grown
    if (this.stage < 4) {
      this.stage += 1;
      world.setBlock(position, 'mangrove_propagule', {
        waterlogged: this.waterlogged,
        stage: this.stage,
        hanging: this.hanging
      });
      
      // Show success particles
      world.addParticle({
        type: 'bonemeal',
        position: {
          x: position.x + 0.5,
          y: position.y + 0.5,
          z: position.z + 0.5
        },
        count: 15,
        spread: { x: 0.5, y: 0.5, z: 0.5 }
      });
      
      return true;
    } else {
      // Try to grow into a tree
      const success = this.growTree(world, position);
      
      if (success) {
        // Show success particles
        world.addParticle({
          type: 'bonemeal',
          position: {
            x: position.x + 0.5,
            y: position.y + 0.5,
            z: position.z + 0.5
          },
          count: 30,
          spread: { x: 1.0, y: 1.0, z: 1.0 }
        });
      }
      
      return success;
    }
  }
  
  /**
   * Get items dropped when block is broken
   * @returns {Array} Array of drop objects (id, count)
   */
  getDrops() {
    return [{ id: 'mangrove_propagule', count: 1 }];
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
      stage: this.stage,
      hanging: this.hanging,
      canPlantOn: this.canPlantOn
    };
  }
  
  /**
   * Create block from JSON data
   * @param {Object} data - Block data
   * @returns {MangrovePropaguleBlock} Block instance
   */
  static fromJSON(data) {
    return new MangrovePropaguleBlock({
      waterlogged: data.waterlogged,
      stage: data.stage,
      hanging: data.hanging,
      canPlantOn: data.canPlantOn
    });
  }
}

module.exports = MangrovePropaguleBlock; 