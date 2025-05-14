/**
 * PointedDripstoneBlock - Implementation of stalactites and stalagmites
 * Part of the Caves & Cliffs update
 */

const Block = require('./block');

class PointedDripstoneBlock extends Block {
  /**
   * Create a new PointedDripstoneBlock
   * @param {Object} options - Block configuration options
   */
  constructor(options = {}) {
    super({
      id: 'pointed_dripstone',
      name: 'Pointed Dripstone',
      hardness: 1.5,
      blastResistance: 3,
      toolType: 'pickaxe',
      toolLevel: 0,
      transparent: false,
      solid: true,
      ...options
    });

    this.type = options.type || 'stalactite'; // 'stalactite' or 'stalagmite'
    this.thickness = options.thickness || 'tip'; // 'tip', 'frustum', 'middle', 'base'
    this.fluid = options.fluid || null; // null, 'water', or 'lava'
    this.dripTime = options.dripTime || 0;
    this.maxDripTime = options.maxDripTime || (this.fluid ? (Math.random() * 600 + 400) : 0); // 20-50 seconds
    this.nextGrowthTime = options.nextGrowthTime || 0;
    this.growthStage = options.growthStage || 0;
    this.canGrow = options.canGrow !== undefined ? options.canGrow : (Math.random() < 0.3);
    this.isDripping = options.isDripping !== undefined ? options.isDripping : false;
    this.canCollapse = options.canCollapse !== undefined ? options.canCollapse : true;
    this.isPartOfColumn = options.isPartOfColumn !== undefined ? options.isPartOfColumn : false;
  }

  onPlace(world, x, y, z) {
    // Check if block above is pointed dripstone
    const blockAbove = world.getBlock(x, y + 1, z);
    if (blockAbove && blockAbove.id === 'pointed_dripstone' && blockAbove.type === 'stalactite') {
      this.type = 'stalagmite';
    }

    // Check if block below is pointed dripstone
    const blockBelow = world.getBlock(x, y - 1, z);
    if (blockBelow && blockBelow.id === 'pointed_dripstone' && blockBelow.type === 'stalagmite') {
      this.type = 'stalactite';
    }

    // Update thickness based on neighbors
    this.updateThickness(world, x, y, z);
  }

  updateThickness(world, x, y, z) {
    const neighbors = this.getNeighbors(world, x, y, z);
    const connectedCount = neighbors.filter(n => n && n.id === 'pointed_dripstone' && n.type === this.type).length;

    if (connectedCount === 0) {
      this.thickness = 'tip';
    } else if (connectedCount === 1) {
      this.thickness = 'middle';
    } else {
      this.thickness = 'base';
    }
  }

  getNeighbors(world, x, y, z) {
    const neighbors = [];
    const offset = this.type === 'stalactite' ? -1 : 1;
    
    // Check block above/below
    neighbors.push(world.getBlock(x, y + offset, z));
    
    // Check blocks in a 3x3 area
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue;
        neighbors.push(world.getBlock(x + dx, y, z + dz));
      }
    }
    
    return neighbors;
  }

  onBreak(world, x, y, z) {
    // Update neighboring dripstone blocks
    const neighbors = this.getNeighbors(world, x, y, z);
    neighbors.forEach(block => {
      if (block && block.id === 'pointed_dripstone') {
        block.updateThickness(world, block.x, block.y, block.z);
      }
    });
  }

  onEntityCollision(entity) {
    // Deal damage to entities that collide with dripstone
    if (this.thickness === 'tip') {
      entity.damage(2); // 1 heart of damage
    }
  }

  /**
   * Update method called on each tick
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @param {Number} deltaTime - Time since last update in ms
   * @returns {Object|null} - Block update data or null if no update
   */
  update(world, position, deltaTime) {
    // Convert time to ticks (assuming 20 ticks per second)
    const dt = deltaTime / 50;
    
    // Handle dripping
    if (this.fluid && this.isDripping) {
      this.dripTime += dt;
      
      // Drop a fluid particle
      if (this.dripTime >= this.maxDripTime) {
        this.dripFluid(world, position);
        this.dripTime = 0;
        this.maxDripTime = Math.random() * 600 + 400; // Reset drip timer (20-50 seconds)
      }
    }
    
    // Handle natural growth if enabled
    if (this.canGrow && this.growthStage < 4) {
      this.nextGrowthTime -= dt;
      
      if (this.nextGrowthTime <= 0) {
        // Try to grow
        const didGrow = this.attemptGrowth(world, position);
        
        // Reset growth timer 
        this.nextGrowthTime = Math.random() * 12000 + 6000; // 5-10 minutes
        
        // Update block state if we grew
        if (didGrow) {
          // Update the block's state
          return {
            type: this.id,
            variant: this.type,
            size: this.thickness,
            fluid: this.fluid,
            growthStage: this.growthStage,
            isDripping: this.isDripping,
            canGrow: this.canGrow,
            isPartOfColumn: this.isPartOfColumn
          };
        }
      }
    }
    
    // Update dripping state based on fluid source above/below
    if (!this.isDripping && this.type === 'stalactite') {
      const hasWaterAbove = this.checkForFluidSource(world, position, 'water', true);
      const hasLavaAbove = this.checkForFluidSource(world, position, 'lava', true);
      
      if (hasWaterAbove) {
        this.fluid = 'water';
        this.isDripping = true;
        return {
          type: this.id,
          variant: this.type,
          size: this.thickness,
          fluid: this.fluid,
          isDripping: true,
          growthStage: this.growthStage,
          canGrow: this.canGrow,
          isPartOfColumn: this.isPartOfColumn
        };
      } else if (hasLavaAbove) {
        this.fluid = 'lava';
        this.isDripping = true;
        return {
          type: this.id,
          variant: this.type,
          size: this.thickness,
          fluid: this.fluid,
          isDripping: true,
          growthStage: this.growthStage,
          canGrow: this.canGrow,
          isPartOfColumn: this.isPartOfColumn
        };
      }
    }
    
    // Check for column connection (merging stalactite and stalagmite)
    if (this.type === 'stalactite' && this.thickness === 'base') {
      // Check for a stalagmite below that could connect
      const blockBelow = this.getBlockBelow(world, position);
      if (blockBelow && blockBelow.type === 'pointed_dripstone' && 
          blockBelow.type === 'stalagmite' && blockBelow.thickness === 'base') {
        // Create a dripstone column instead
        this.isPartOfColumn = true;
        world.setBlock({ x: position.x, y: position.y - 1, z: position.z }, {
          type: 'pointed_dripstone',
          variant: 'stalagmite',
          size: 'base',
          isPartOfColumn: true
        });
        
        return {
          type: this.id,
          variant: this.type,
          size: this.thickness,
          isPartOfColumn: true,
          fluid: this.fluid,
          isDripping: this.isDripping,
          growthStage: this.growthStage,
          canGrow: this.canGrow
        };
      }
    }
    
    return null;
  }
  
  /**
   * Check if there's a fluid source above or below this block
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @param {String} fluidType - The type of fluid to check for ('water' or 'lava')
   * @param {Boolean} checkAbove - Whether to check above (true) or below (false)
   * @returns {Boolean} - Whether a fluid source was found
   */
  checkForFluidSource(world, position, fluidType, checkAbove) {
    // Check directly above/below first
    const yOffset = checkAbove ? 1 : -1;
    let currentY = position.y + yOffset;
    
    // Check blocks up to 10 blocks away
    for (let i = 0; i < 10; i++) {
      const blockPos = { x: position.x, y: currentY, z: position.z };
      const block = world.getBlockAt(blockPos.x, blockPos.y, blockPos.z);
      
      if (block && block.type === fluidType) {
        return true;
      }
      
      // Stop if we hit a non-pointed-dripstone solid block
      if (block && block.type !== 'pointed_dripstone' && block.type !== 'air' && 
          block.type !== 'cave_air') {
        return false;
      }
      
      currentY += yOffset;
    }
    
    return false;
  }
  
  /**
   * Drip fluid from this dripstone
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   */
  dripFluid(world, position) {
    // Create a particle entity for the fluid drip
    const particleData = {
      type: `${this.fluid}_drip`,
      position: {
        x: position.x + 0.5,
        y: position.y - 0.1,
        z: position.z + 0.5
      },
      velocity: { x: 0, y: -0.1, z: 0 },
      lifetime: 60, // 3 seconds
      gravity: true
    };
    
    // Add the particle to the world
    world.addParticle(particleData);
    
    // Find target block below
    let targetY = position.y - 1;
    let targetBlock = null;
    
    // Check up to 10 blocks below for a landing spot
    for (let i = 0; i < 10; i++) {
      const block = world.getBlockAt(position.x, targetY, position.z);
      
      if (block && block.type !== 'air' && block.type !== 'cave_air') {
        // Found a landing spot
        targetBlock = block;
        break;
      }
      
      targetY--;
    }
    
    // Special effects based on fluid type and target block
    if (targetBlock) {
      if (this.fluid === 'water') {
        if (targetBlock.type === 'pointed_dripstone' && targetBlock.type === 'stalagmite') {
          // Water dripping on a stalagmite makes it grow
          if (targetBlock.canGrow) {
            world.setBlock({ x: position.x, y: targetY, z: position.z }, {
              ...targetBlock,
              growthStage: Math.min(targetBlock.growthStage + 1, 4)
            });
          }
        } else if (targetBlock.type === 'lava') {
          // Water dripping on lava creates obsidian or stone
          world.setBlock({ x: position.x, y: targetY, z: position.z }, {
            type: 'obsidian'
          });
        } else if (targetBlock.type === 'dirt') {
          // Water dripping on dirt might make mud (10% chance)
          if (Math.random() < 0.1) {
            world.setBlock({ x: position.x, y: targetY, z: position.z }, {
              type: 'mud'
            });
          }
        }
      } else if (this.fluid === 'lava') {
        if (['grass', 'dirt', 'sand', 'gravel'].includes(targetBlock.type)) {
          // Lava dripping on certain blocks creates fire
          world.setBlock({ x: position.x, y: targetY + 1, z: position.z }, {
            type: 'fire'
          });
        }
      }
    }
  }
  
  /**
   * Try to grow this dripstone
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @returns {Boolean} - Whether growth occurred
   */
  attemptGrowth(world, position) {
    // Increment growth stage
    this.growthStage++;
    
    // Growth behavior depends on variant
    if (this.type === 'stalactite') {
      // Stalactites grow downward
      const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
      
      if (blockBelow && (blockBelow.type === 'air' || blockBelow.type === 'cave_air')) {
        // Can grow downward
        if (this.growthStage >= 4) {
          // Extend the stalactite
          world.setBlock({ x: position.x, y: position.y - 1, z: position.z }, {
            type: 'pointed_dripstone',
            variant: 'stalactite',
            size: 'tip', // Start with a tip
            fluid: this.fluid,
            isDripping: this.isDripping,
            canGrow: Math.random() < 0.5 // 50% chance to keep growing
          });
          
          // Increase this block's size
          this.thickness = 'tip';
          this.growthStage = 0;
          return true;
        }
      }
    } else {
      // Stalagmites grow upward
      const blockAbove = world.getBlockAt(position.x, position.y + 1, position.z);
      
      if (blockAbove && (blockAbove.type === 'air' || blockAbove.type === 'cave_air')) {
        // Can grow upward
        if (this.growthStage >= 4) {
          // Extend the stalagmite
          world.setBlock({ x: position.x, y: position.y + 1, z: position.z }, {
            type: 'pointed_dripstone',
            variant: 'stalagmite',
            size: 'tip', // Start with a tip
            canGrow: Math.random() < 0.5 // 50% chance to keep growing
          });
          
          // Increase this block's size
          this.thickness = 'tip';
          this.growthStage = 0;
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Get the block below this one
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @returns {Object|null} - The block below or null
   */
  getBlockBelow(world, position) {
    return world.getBlockAt(position.x, position.y - 1, position.z);
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
   * Handle when an entity collides with this block
   * @param {Object} entity - Entity that collided
   * @param {Object} collision - Collision data
   * @returns {Object} - Effect to apply to the entity
   */
  onEntityCollide(entity, collision) {
    // Sharp dripstone causes damage when fallen onto
    if (collision.direction === 'down' && entity.velocity.y < -0.5) {
      return {
        type: 'damage',
        amount: Math.ceil(entity.velocity.y * -1) // More damage for higher falls
      };
    }
    
    return null;
  }
  
  /**
   * Get the block's data for client
   * @returns {Object} - Block data for the client
   */
  getState() {
    return {
      type: this.id,
      variant: this.type,
      size: this.thickness,
      fluid: this.fluid,
      isDripping: this.isDripping,
      solid: true,
      transparent: false,
      collidable: true,
      hardness: 1.0,
      isPartOfColumn: this.isPartOfColumn
    };
  }
  
  /**
   * Get the drop item when this block is broken
   * @returns {Object|null} - The item to drop, or null if nothing
   */
  getDrops() {
    // 25% chance to drop nothing (breaking)
    if (Math.random() < 0.25) {
      return null;
    }
    
    return {
      type: 'pointed_dripstone',
      count: 1
    };
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      type: this.type,
      thickness: this.thickness,
      fluid: this.fluid,
      dripTime: this.dripTime,
      maxDripTime: this.maxDripTime,
      nextGrowthTime: this.nextGrowthTime,
      growthStage: this.growthStage,
      canGrow: this.canGrow,
      isDripping: this.isDripping,
      canCollapse: this.canCollapse,
      isPartOfColumn: this.isPartOfColumn
    };
  }
  
  /**
   * Deserialize data to restore the block's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    this.type = data.type;
    this.thickness = data.thickness;
    if (data.fluid !== undefined) this.fluid = data.fluid;
    if (data.dripTime !== undefined) this.dripTime = data.dripTime;
    if (data.maxDripTime !== undefined) this.maxDripTime = data.maxDripTime;
    if (data.nextGrowthTime !== undefined) this.nextGrowthTime = data.nextGrowthTime;
    if (data.growthStage !== undefined) this.growthStage = data.growthStage;
    if (data.canGrow !== undefined) this.canGrow = data.canGrow;
    if (data.isDripping !== undefined) this.isDripping = data.isDripping;
    if (data.canCollapse !== undefined) this.canCollapse = data.canCollapse;
    if (data.isPartOfColumn !== undefined) this.isPartOfColumn = data.isPartOfColumn;
  }
}

module.exports = PointedDripstoneBlock; 