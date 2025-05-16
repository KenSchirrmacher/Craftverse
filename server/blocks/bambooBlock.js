/**
 * Bamboo Blocks - Implementations for bamboo-based blocks for the 1.20 Update
 * Includes bamboo planks, block, mosaic and other bamboo wood variants
 */

const Block = require('./block');

/**
 * Base class for all bamboo block types
 */
class BambooBlock extends Block {
  /**
   * Create a new bamboo block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'bamboo_block',
      name: options.name || 'Bamboo Block',
      hardness: 2.0,
      toolType: 'axe',
      requiredToolLevel: 0, // Can be broken with any tier
      flammable: true,
      solid: true,
      transparent: false,
      ...options
    });
    
    // Make sure basic properties are set for bamboo blocks
    this.material = 'wood';
    
    // Strip option for logs
    this.stripped = options.stripped || false;
  }
  
  /**
   * Get drops when broken
   * @returns {Array} Array of item drops
   */
  getDrops() {
    return [
      {
        type: this.id,
        count: 1
      }
    ];
  }
  
  /**
   * Handle block interaction (e.g., stripping with axe)
   * @param {Object} player - The player interacting
   * @param {Object} itemInHand - The item being used
   * @returns {boolean} Whether interaction was successful
   */
  interact(player, itemInHand) {
    // If this is a bamboo block and player is using an axe, strip it
    if (!this.stripped && 
        itemInHand && 
        itemInHand.type === 'axe' && 
        this.id === 'bamboo_block') {
      
      // Replace with stripped version
      if (player.world) {
        player.world.setBlockAt(
          this.position.x, 
          this.position.y, 
          this.position.z, 
          'stripped_bamboo_block'
        );
        
        // Damage the axe
        if (itemInHand.durability) {
          itemInHand.durability -= 1;
        }
        
        // Play stripping sound
        player.world.playSound(
          this.position, 
          'block.wood.scrape', 
          1.0, 
          1.0
        );
        
        return true;
      }
    }
    
    return false;
  }
}

/**
 * Bamboo Block - The basic block form of bamboo items
 */
class BambooWoodBlock extends BambooBlock {
  constructor(options = {}) {
    super({
      id: options.stripped ? 'stripped_bamboo_block' : 'bamboo_block',
      name: options.stripped ? 'Stripped Bamboo Block' : 'Bamboo Block',
      ...options
    });
    
    this.stripped = options.stripped || false;
    
    // Set textures based on stripped state
    const texturePrefix = this.stripped ? 'stripped_' : '';
    this.textures = {
      top: `blocks/${texturePrefix}bamboo_block_top`,
      sides: `blocks/${texturePrefix}bamboo_block_side`
    };
  }
}

/**
 * Bamboo Planks - Processed bamboo wood material
 */
class BambooPlanksBlock extends BambooBlock {
  constructor(options = {}) {
    super({
      id: 'bamboo_planks',
      name: 'Bamboo Planks',
      ...options
    });
    
    // Planks have a single texture for all sides
    this.textures = {
      all: 'blocks/bamboo_planks'
    };
  }
}

/**
 * Bamboo Mosaic - Decorative bamboo block with a pattern
 */
class BambooMosaicBlock extends BambooBlock {
  constructor(options = {}) {
    super({
      id: 'bamboo_mosaic',
      name: 'Bamboo Mosaic',
      ...options
    });
    
    // Mosaic has a special texture
    this.textures = {
      all: 'blocks/bamboo_mosaic'
    };
  }
}

/**
 * Bamboo Door - A door made of bamboo
 */
class BambooDoorBlock extends Block {
  constructor(options = {}) {
    super({
      id: 'bamboo_door',
      name: 'Bamboo Door',
      hardness: 3.0,
      toolType: 'axe',
      requiredToolLevel: 0,
      transparent: true,
      solid: false,
      flammable: true,
      ...options
    });
    
    this.material = 'wood';
    this.isOpen = options.isOpen || false;
    this.hinge = options.hinge || 'left';
    this.isPowered = options.isPowered || false;
    this.half = options.half || 'lower'; // 'lower' or 'upper'
    this.facing = options.facing || 'north';
    
    // Door texture depends on state
    this.textures = {
      front: `blocks/bamboo_door_${this.isOpen ? 'open' : 'closed'}`
    };
  }
  
  /**
   * Handle interaction (opening/closing)
   */
  interact(player) {
    if (!player) return false;
    
    // Toggle open state
    this.isOpen = !this.isOpen;
    
    // Update texture
    this.textures.front = `blocks/bamboo_door_${this.isOpen ? 'open' : 'closed'}`;
    
    // Play door sound
    if (player.world) {
      player.world.playSound(
        this.position, 
        `block.wooden_door.${this.isOpen ? 'open' : 'close'}`, 
        1.0, 
        1.0
      );
    }
    
    // If this is the lower half, also update the upper half
    if (this.half === 'lower' && player.world) {
      const upperDoor = player.world.getBlockAt(
        this.position.x, 
        this.position.y + 1, 
        this.position.z
      );
      
      if (upperDoor && upperDoor.id === 'bamboo_door') {
        upperDoor.isOpen = this.isOpen;
        upperDoor.textures.front = this.textures.front;
      }
    }
    
    return true;
  }
  
  /**
   * Get drops when broken
   */
  getDrops() {
    // Only drop door item if it's the lower half
    if (this.half === 'lower') {
      return [
        {
          type: 'bamboo_door',
          count: 1
        }
      ];
    }
    return [];
  }
}

/**
 * Bamboo Trapdoor - A trapdoor made of bamboo
 */
class BambooTrapdoorBlock extends Block {
  constructor(options = {}) {
    super({
      id: 'bamboo_trapdoor',
      name: 'Bamboo Trapdoor',
      hardness: 3.0,
      toolType: 'axe',
      requiredToolLevel: 0,
      transparent: true,
      solid: false,
      flammable: true,
      ...options
    });
    
    this.material = 'wood';
    this.isOpen = options.isOpen || false;
    this.isPowered = options.isPowered || false;
    this.facing = options.facing || 'north';
    this.half = options.half || 'bottom'; // 'bottom' or 'top'
    
    // Trapdoor texture depends on state
    this.textures = {
      main: 'blocks/bamboo_trapdoor'
    };
  }
  
  /**
   * Handle interaction (opening/closing)
   */
  interact(player) {
    if (!player) return false;
    
    // Toggle open state
    this.isOpen = !this.isOpen;
    
    // Play trapdoor sound
    if (player.world) {
      player.world.playSound(
        this.position, 
        `block.wooden_trapdoor.${this.isOpen ? 'open' : 'close'}`, 
        1.0, 
        1.0
      );
    }
    
    return true;
  }
}

/**
 * Bamboo Fence - A fence made of bamboo
 */
class BambooFenceBlock extends Block {
  constructor(options = {}) {
    super({
      id: 'bamboo_fence',
      name: 'Bamboo Fence',
      hardness: 2.0,
      toolType: 'axe',
      requiredToolLevel: 0,
      transparent: true,
      solid: false,
      flammable: true,
      ...options
    });
    
    this.material = 'wood';
    
    // Fence connections to neighboring blocks
    this.connections = {
      north: false,
      east: false,
      south: false,
      west: false
    };
    
    this.textures = {
      post: 'blocks/bamboo_fence_post',
      side: 'blocks/bamboo_fence_side'
    };
  }
  
  /**
   * Update connections based on neighboring blocks
   */
  updateConnections(world) {
    if (!world) return;
    
    const { x, y, z } = this.position;
    
    // Check each direction for connectable blocks
    const directions = [
      { dir: 'north', offset: [0, 0, -1] },
      { dir: 'east', offset: [1, 0, 0] },
      { dir: 'south', offset: [0, 0, 1] },
      { dir: 'west', offset: [-1, 0, 0] }
    ];
    
    for (const { dir, offset } of directions) {
      const neighborBlock = world.getBlockAt(
        x + offset[0], 
        y + offset[1], 
        z + offset[2]
      );
      
      // Connect to other fences or solid blocks
      this.connections[dir] = neighborBlock && (
        neighborBlock.id.includes('fence') || 
        (neighborBlock.solid && !neighborBlock.transparent)
      );
    }
  }
}

/**
 * Bamboo Fence Gate - A fence gate made of bamboo
 */
class BambooFenceGateBlock extends Block {
  constructor(options = {}) {
    super({
      id: 'bamboo_fence_gate',
      name: 'Bamboo Fence Gate',
      hardness: 2.0,
      toolType: 'axe',
      requiredToolLevel: 0,
      transparent: true,
      solid: false,
      flammable: true,
      ...options
    });
    
    this.material = 'wood';
    this.isOpen = options.isOpen || false;
    this.isPowered = options.isPowered || false;
    this.facing = options.facing || 'north';
    
    this.textures = {
      closed: 'blocks/bamboo_fence_gate_closed',
      open: 'blocks/bamboo_fence_gate_open'
    };
  }
  
  /**
   * Handle interaction (opening/closing)
   */
  interact(player) {
    if (!player) return false;
    
    // Toggle open state
    this.isOpen = !this.isOpen;
    
    // Play fence gate sound
    if (player.world) {
      player.world.playSound(
        this.position, 
        `block.fence_gate.${this.isOpen ? 'open' : 'close'}`, 
        1.0, 
        1.0
      );
    }
    
    return true;
  }
}

/**
 * Bamboo Slab - A slab made of bamboo planks
 */
class BambooSlabBlock extends Block {
  constructor(options = {}) {
    super({
      id: options.type === 'mosaic' ? 'bamboo_mosaic_slab' : 'bamboo_slab',
      name: options.type === 'mosaic' ? 'Bamboo Mosaic Slab' : 'Bamboo Slab',
      hardness: 2.0,
      toolType: 'axe',
      requiredToolLevel: 0,
      transparent: false,
      solid: true,
      flammable: true,
      ...options
    });
    
    this.material = 'wood';
    this.type = options.type || 'normal'; // 'normal' or 'mosaic'
    this.half = options.half || 'bottom'; // 'bottom', 'top', or 'double'
    
    // Texture depends on slab type
    const textureBase = this.type === 'mosaic' ? 'bamboo_mosaic' : 'bamboo_planks';
    this.textures = {
      top: `blocks/${textureBase}`,
      bottom: `blocks/${textureBase}`,
      sides: `blocks/${textureBase}`
    };
  }
  
  /**
   * Get collision box based on slab position
   */
  getCollisionBoxes() {
    if (this.half === 'double') {
      // Full block
      return [{
        minX: 0, minY: 0, minZ: 0,
        maxX: 1, maxY: 1, maxZ: 1
      }];
    } else if (this.half === 'top') {
      // Top half
      return [{
        minX: 0, minY: 0.5, minZ: 0,
        maxX: 1, maxY: 1, maxZ: 1
      }];
    } else {
      // Bottom half
      return [{
        minX: 0, minY: 0, minZ: 0,
        maxX: 1, maxY: 0.5, maxZ: 1
      }];
    }
  }
  
  /**
   * Handle placing a slab against another slab to make a double slab
   */
  onPlace(world, position, player, face) {
    if (!world) return false;
    
    // Check if we're placing against another slab of the same type
    if (face === 'up' || face === 'down') {
      const adjacentY = face === 'up' ? position.y - 1 : position.y + 1;
      const adjacentBlock = world.getBlockAt(position.x, adjacentY, position.z);
      
      if (adjacentBlock && 
          adjacentBlock.id === this.id && 
          adjacentBlock.type === this.type &&
          ((face === 'up' && adjacentBlock.half === 'bottom') ||
           (face === 'down' && adjacentBlock.half === 'top'))) {
        
        // Replace the adjacent slab with a double slab
        world.setBlockAt(position.x, adjacentY, position.z, {
          ...adjacentBlock,
          half: 'double'
        });
        
        // Don't place the new slab
        return false;
      }
      
      // Set the proper half based on face clicked
      this.half = face === 'down' ? 'top' : 'bottom';
    }
    
    return true;
  }
}

/**
 * Bamboo Stairs - Stairs made of bamboo planks
 */
class BambooStairsBlock extends Block {
  constructor(options = {}) {
    super({
      id: options.type === 'mosaic' ? 'bamboo_mosaic_stairs' : 'bamboo_stairs',
      name: options.type === 'mosaic' ? 'Bamboo Mosaic Stairs' : 'Bamboo Stairs',
      hardness: 2.0,
      toolType: 'axe',
      requiredToolLevel: 0,
      transparent: false,
      solid: true,
      flammable: true,
      ...options
    });
    
    this.material = 'wood';
    this.type = options.type || 'normal'; // 'normal' or 'mosaic'
    this.facing = options.facing || 'north'; // 'north', 'east', 'south', 'west'
    this.half = options.half || 'bottom'; // 'bottom' or 'top'
    this.shape = options.shape || 'straight'; // 'straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'
    
    // Texture depends on stair type
    const textureBase = this.type === 'mosaic' ? 'bamboo_mosaic' : 'bamboo_planks';
    this.textures = {
      top: `blocks/${textureBase}`,
      bottom: `blocks/${textureBase}`,
      sides: `blocks/${textureBase}`
    };
  }
  
  /**
   * Get collision boxes based on stair configuration
   */
  getCollisionBoxes() {
    // This is simplified - a full implementation would account for all stair shapes
    if (this.shape === 'straight') {
      if (this.half === 'bottom') {
        // Bottom stairs
        return [
          // Bottom slab part
          {
            minX: 0, minY: 0, minZ: 0,
            maxX: 1, maxY: 0.5, maxZ: 1
          },
          // Upper step part (position depends on facing)
          this.facing === 'north' ? {
            minX: 0, minY: 0.5, minZ: 0,
            maxX: 1, maxY: 1, maxZ: 0.5
          } : this.facing === 'south' ? {
            minX: 0, minY: 0.5, minZ: 0.5,
            maxX: 1, maxY: 1, maxZ: 1
          } : this.facing === 'west' ? {
            minX: 0, minY: 0.5, minZ: 0,
            maxX: 0.5, maxY: 1, maxZ: 1
          } : { // east
            minX: 0.5, minY: 0.5, minZ: 0,
            maxX: 1, maxY: 1, maxZ: 1
          }
        ];
      } else {
        // Top stairs (inverted)
        return [
          // Top slab part
          {
            minX: 0, minY: 0.5, minZ: 0,
            maxX: 1, maxY: 1, maxZ: 1
          },
          // Lower step part (position depends on facing)
          this.facing === 'north' ? {
            minX: 0, minY: 0, minZ: 0,
            maxX: 1, maxY: 0.5, maxZ: 0.5
          } : this.facing === 'south' ? {
            minX: 0, minY: 0, minZ: 0.5,
            maxX: 1, maxY: 0.5, maxZ: 1
          } : this.facing === 'west' ? {
            minX: 0, minY: 0, minZ: 0,
            maxX: 0.5, maxY: 0.5, maxZ: 1
          } : { // east
            minX: 0.5, minY: 0, minZ: 0,
            maxX: 1, maxY: 0.5, maxZ: 1
          }
        ];
      }
    }
    
    // Default return for other shapes (would need more complex implementation)
    return [{
      minX: 0, minY: 0, minZ: 0,
      maxX: 1, maxY: 1, maxZ: 1
    }];
  }
  
  /**
   * Handle placement to determine facing direction
   */
  onPlace(world, position, player) {
    if (!player) return true;
    
    // Determine facing direction based on player rotation
    const yaw = ((player.rotation.yaw % 360) + 360) % 360;
    
    if (yaw >= 315 || yaw < 45) {
      this.facing = 'north';
    } else if (yaw >= 45 && yaw < 135) {
      this.facing = 'east';
    } else if (yaw >= 135 && yaw < 225) {
      this.facing = 'south';
    } else {
      this.facing = 'west';
    }
    
    return true;
  }
}

// Export all bamboo block classes
module.exports = {
  BambooBlock,
  BambooWoodBlock,
  BambooPlanksBlock,
  BambooMosaicBlock,
  BambooDoorBlock,
  BambooTrapdoorBlock,
  BambooFenceBlock,
  BambooFenceGateBlock,
  BambooSlabBlock,
  BambooStairsBlock
}; 