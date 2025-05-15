/**
 * Mangrove Leaves Block - Special leaves for mangrove trees
 * Can be waterlogged and support propagules
 */

const { Block } = require('./baseBlock');

class MangroveLeavesBlock extends Block {
  /**
   * Create a new mangrove leaves block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'mangrove_leaves',
      name: 'Mangrove Leaves',
      hardness: 0.2,
      resistance: 0.2,
      requiresTool: false,
      transparent: true, // Partially transparent for rendering
      solid: true, // Still blocks movement
      flammable: true,
      lightLevel: 0,
      model: 'leaves',
      texture: 'mangrove_leaves',
      sounds: {
        break: 'block.grass.break',
        step: 'block.grass.step',
        place: 'block.grass.place',
        hit: 'block.grass.hit',
        fall: 'block.grass.fall'
      },
      ...options
    });
    
    // Leaf specific properties
    this.persistent = options.persistent !== undefined ? options.persistent : false;
    this.distance = options.distance !== undefined ? options.distance : 7;
    
    // Waterlogging state
    this.waterlogged = options.waterlogged || false;
    
    // Tool properties
    this.preferredTool = 'shears';
    
    // Chance of dropping a sapling when destroyed without shears
    this.propaguleDropChance = 0.05; // 5% chance
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
    
    // Leaves placed by a player are persistent (won't decay)
    this.persistent = true;
    this.distance = 0;
  }
  
  /**
   * Handle random block updates for leaf decay
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Object} options - Additional update options
   */
  onRandomTick(world, position, options = {}) {
    // Only non-persistent leaves can decay
    if (this.persistent) {
      return;
    }
    
    // Check if leaves should decay
    if (this.distance >= 7) {
      // Decay chance increases with distance
      const decayChance = 0.05 + (this.distance - 7) * 0.1;
      
      if (Math.random() < decayChance) {
        // Destroy the leaves
        world.setBlock(position, this.waterlogged ? 'water' : 'air');
        
        // Play sound and spawn particles
        world.playSound(this.sounds.break, position, 1.0, 1.0);
        world.addParticle({
          type: 'block_break',
          blockType: 'mangrove_leaves',
          position: {
            x: position.x + 0.5,
            y: position.y + 0.5,
            z: position.z + 0.5
          },
          count: 10,
          speed: 0.05
        });
        
        // Small chance to drop a propagule
        if (Math.random() < this.propaguleDropChance) {
          world.dropItem(
            { id: 'mangrove_propagule', count: 1 },
            { x: position.x + 0.5, y: position.y + 0.5, z: position.z + 0.5 }
          );
        }
      }
    } else {
      // Random chance to create a hanging propagule
      if (Math.random() < 0.01) { // 1% chance per random tick
        const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
        
        if (!blockBelow || blockBelow.id === 'air' || blockBelow.id === 'water') {
          world.setBlock(
            { x: position.x, y: position.y - 1, z: position.z },
            'mangrove_propagule',
            { 
              hanging: true, 
              stage: 0,
              waterlogged: blockBelow?.id === 'water'
            }
          );
        }
      }
    }
  }
  
  /**
   * Update leaf distance from logs
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   */
  updateLeafDistance(world, position) {
    if (this.persistent) {
      return;
    }
    
    // Check neighboring blocks to find the minimum distance to a log
    let minDistance = 7; // Max decay distance
    
    // Check each direction
    const directions = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 }
    ];
    
    for (const dir of directions) {
      const neighborPos = {
        x: position.x + dir.x,
        y: position.y + dir.y,
        z: position.z + dir.z
      };
      
      const neighborBlock = world.getBlockAt(neighborPos.x, neighborPos.y, neighborPos.z);
      
      if (neighborBlock) {
        if (neighborBlock.id === 'mangrove_log' || neighborBlock.id === 'stripped_mangrove_log') {
          // Log found, distance is 1
          minDistance = 1;
          break;
        } else if (neighborBlock.id === 'mangrove_leaves') {
          // Another leaf block, get its distance
          const leafBlock = neighborBlock;
          const leafDistance = leafBlock.distance;
          
          if (leafDistance < minDistance - 1) {
            minDistance = leafDistance + 1;
          }
        }
      }
    }
    
    // Update the distance if it changed
    if (minDistance < this.distance) {
      this.distance = minDistance;
      world.setBlock(position, 'mangrove_leaves', {
        persistent: this.persistent,
        distance: minDistance,
        waterlogged: this.waterlogged
      });
      
      // Propagate the update to neighboring leaves
      for (const dir of directions) {
        const neighborPos = {
          x: position.x + dir.x,
          y: position.y + dir.y,
          z: position.z + dir.z
        };
        
        const neighborBlock = world.getBlockAt(neighborPos.x, neighborPos.y, neighborPos.z);
        
        if (neighborBlock && neighborBlock.id === 'mangrove_leaves') {
          // Only update if our new distance + 1 is less than the neighbor's distance
          if (minDistance + 1 < neighborBlock.distance) {
            neighborBlock.updateLeafDistance(world, neighborPos);
          }
        }
      }
    }
  }
  
  /**
   * Handle block updates
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Vector3} fromPosition - Position of block that caused the update
   */
  onNeighborUpdate(world, position, fromPosition) {
    // If water is placed adjacent, waterlog the leaves
    const fromBlock = world.getBlockAt(fromPosition.x, fromPosition.y, fromPosition.z);
    
    if (fromBlock?.id === 'water' && !this.waterlogged) {
      this.waterlogged = true;
      world.setBlock(position, 'mangrove_leaves', {
        persistent: this.persistent,
        distance: this.distance,
        waterlogged: true
      });
    }
    
    // Check if this is a non-persistent leaf and update its distance
    if (!this.persistent) {
      this.updateLeafDistance(world, position);
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
      
      // Shears are the best tool for leaves
      if (tool.type === 'shears') {
        // Much faster mining with shears
        baseTime /= 4.0;
      } else if (tool.type === 'sword') {
        // Swords are also effective
        baseTime /= 2.0;
      } else if (tool.type === 'hoe') {
        // Hoes are also effective
        baseTime /= 2.0;
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
    // If using shears or has silk touch, drop the leaves block
    if (options.tool && (options.tool.type === 'shears' || options.tool.enchantments?.silkTouch)) {
      return [{ id: 'mangrove_leaves', count: 1 }];
    }
    
    // Otherwise random chance to drop a propagule
    const drops = [];
    
    if (Math.random() < this.propaguleDropChance) {
      drops.push({ id: 'mangrove_propagule', count: 1 });
    }
    
    // Small chance to drop a stick
    if (Math.random() < 0.1) {
      drops.push({ id: 'stick', count: 1 });
    }
    
    return drops;
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
      persistent: this.persistent,
      distance: this.distance,
      waterlogged: this.waterlogged,
      propaguleDropChance: this.propaguleDropChance
    };
  }
  
  /**
   * Create block from JSON data
   * @param {Object} data - Block data
   * @returns {MangroveLeavesBlock} Block instance
   */
  static fromJSON(data) {
    return new MangroveLeavesBlock({
      persistent: data.persistent,
      distance: data.distance,
      waterlogged: data.waterlogged,
      propaguleDropChance: data.propaguleDropChance
    });
  }
}

module.exports = MangroveLeavesBlock; 