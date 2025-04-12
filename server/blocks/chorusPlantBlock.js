/**
 * ChorusPlantBlock - Represents a Chorus Plant block for the End dimension
 */

class ChorusPlantBlock {
  /**
   * Creates a new Chorus Plant block
   * @param {Object} options - Block options
   * @param {Boolean} options.isFlower - Whether this is a flower (end of plant)
   * @param {Object} options.connections - Connections to other chorus blocks
   * @param {Object} options.server - Server instance
   */
  constructor(options = {}) {
    this.type = options.isFlower ? 'chorus_flower' : 'chorus_plant';
    this.isFlower = options.isFlower || false;
    this.connections = options.connections || { up: false, down: false, north: false, east: false, south: false, west: false };
    this.server = options.server;
    this.solid = true;
    this.transparent = true;
    this.hardness = 0.4;
    this.blastResistance = 0.4;
    this.requiresTool = false;
    this.toolType = 'any';
    this.age = options.age || 0; // Age is only relevant for flowers (0-5)
    this.maxAge = 5; // Maximum age for flowers
  }
  
  /**
   * Handle block being placed
   * @param {Object} position - Block position
   * @param {Object} world - World instance
   * @returns {Boolean} Whether placement was successful
   */
  onPlace(position, world) {
    if (!world) return false;
    
    // Check if placement is valid
    if (!this.canPlaceAt(position, world)) {
      return false;
    }
    
    // Update connections
    this.updateConnections(position, world);
    
    return true;
  }
  
  /**
   * Check if the block can be placed at the given position
   * @param {Object} position - Block position
   * @param {Object} world - World instance
   * @returns {Boolean} Whether the placement is valid
   */
  canPlaceAt(position, world) {
    if (!world) return false;
    
    // Check block below
    const belowPos = { ...position, y: position.y - 1 };
    const blockBelow = world.getBlock(belowPos);
    
    // Can only place on end stone or another chorus plant
    if (!blockBelow) return false;
    
    const validBase = blockBelow.type === 'end_stone' || 
                      blockBelow.type === 'chorus_plant' || 
                      blockBelow.type === 'chorus_flower';
    
    if (!validBase) return false;
    
    // If this is a flower, there are additional checks
    if (this.isFlower) {
      // Flowers can only be placed on top of a chorus plant or on end stone
      if (blockBelow.type !== 'chorus_plant' && blockBelow.type !== 'end_stone') {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Update connections to adjacent chorus blocks
   * @param {Object} position - Block position
   * @param {Object} world - World instance
   */
  updateConnections(position, world) {
    if (!world) return;
    
    // Don't update connections for flowers
    if (this.isFlower) return;
    
    // Check in all 6 directions
    const directions = [
      { dir: 'up', pos: { ...position, y: position.y + 1 } },
      { dir: 'down', pos: { ...position, y: position.y - 1 } },
      { dir: 'north', pos: { ...position, z: position.z - 1 } },
      { dir: 'south', pos: { ...position, z: position.z + 1 } },
      { dir: 'east', pos: { ...position, x: position.x + 1 } },
      { dir: 'west', pos: { ...position, x: position.x - 1 } }
    ];
    
    // Reset connections
    this.connections = { up: false, down: false, north: false, east: false, south: false, west: false };
    
    for (const { dir, pos } of directions) {
      const block = world.getBlock(pos);
      
      if (block) {
        if (block.type === 'chorus_plant' || block.type === 'chorus_flower') {
          this.connections[dir] = true;
        }
      }
    }
    
    // Update block in world
    world.setBlock(position, this);
    
    // Also update connections of adjacent chorus plants
    for (const { dir, pos } of directions) {
      const block = world.getBlock(pos);
      
      if (block && block.type === 'chorus_plant' && typeof block.updateConnections === 'function') {
        block.updateConnections(pos, world);
      }
    }
  }
  
  /**
   * Handle random tick (for chorus flowers)
   * @param {Object} position - Block position
   * @param {Object} world - World instance
   * @returns {Boolean} Whether the tick was handled
   */
  onRandomTick(position, world) {
    if (!world || !this.isFlower) return false;
    
    // Only flowers age and grow
    if (this.age >= this.maxAge) {
      // Dead flower doesn't do anything
      return false;
    }
    
    // 1/8 chance to grow
    if (Math.random() < 0.125) {
      this.grow(position, world);
      return true;
    }
    
    return false;
  }
  
  /**
   * Grow a chorus flower
   * @param {Object} position - Block position
   * @param {Object} world - World instance
   * @returns {Boolean} Whether growth was successful
   */
  grow(position, world) {
    if (!world || !this.isFlower) return false;
    
    // Increment age
    this.age++;
    
    // Check if the flower has died
    if (this.age >= this.maxAge) {
      // Update the block in the world
      world.setBlock(position, this);
      
      // Play death sound
      if (this.server) {
        this.server.emit('playSound', {
          name: 'block.chorus_flower.death',
          position,
          volume: 1.0,
          pitch: 1.0,
          dimension: world.dimension
        });
      }
      
      return true;
    }
    
    // Otherwise, try to grow in a random direction
    const growthDirections = [];
    
    // Can grow upward if there's space and we're not too tall
    const upPos = { ...position, y: position.y + 1 };
    const blockUp = world.getBlock(upPos);
    if (!blockUp || !blockUp.solid) {
      // Check height from base
      let height = 0;
      let basePos = { ...position };
      
      while (height < 5) {
        const belowPos = { ...basePos, y: basePos.y - 1 };
        const blockBelow = world.getBlock(belowPos);
        
        if (!blockBelow || blockBelow.type !== 'chorus_plant') {
          break;
        }
        
        basePos = belowPos;
        height++;
      }
      
      // Can grow up if we're not too tall
      if (height < 4) {
        growthDirections.push('up');
      }
    }
    
    // Can grow horizontally if there's space and support
    const horizontalDirs = [
      { dir: 'north', pos: { ...position, z: position.z - 1 } },
      { dir: 'south', pos: { ...position, z: position.z + 1 } },
      { dir: 'east', pos: { ...position, x: position.x + 1 } },
      { dir: 'west', pos: { ...position, x: position.x - 1 } }
    ];
    
    for (const { dir, pos } of horizontalDirs) {
      const block = world.getBlock(pos);
      
      if (!block || !block.solid) {
        growthDirections.push(dir);
      }
    }
    
    // If there are valid growth directions, pick one randomly
    if (growthDirections.length > 0) {
      const growthDir = growthDirections[Math.floor(Math.random() * growthDirections.length)];
      
      let growthPos;
      if (growthDir === 'up') {
        growthPos = upPos;
      } else if (growthDir === 'north') {
        growthPos = { ...position, z: position.z - 1 };
      } else if (growthDir === 'south') {
        growthPos = { ...position, z: position.z + 1 };
      } else if (growthDir === 'east') {
        growthPos = { ...position, x: position.x + 1 };
      } else if (growthDir === 'west') {
        growthPos = { ...position, x: position.x - 1 };
      }
      
      // Replace current flower with a plant
      const plant = new ChorusPlantBlock({
        isFlower: false,
        server: this.server
      });
      
      world.setBlock(position, plant);
      
      // Set a new flower at the growth position
      const newFlower = new ChorusPlantBlock({
        isFlower: true,
        age: this.age,
        server: this.server
      });
      
      world.setBlock(growthPos, newFlower);
      
      // Update connections
      plant.updateConnections(position, world);
      
      // Play growth sound
      if (this.server) {
        this.server.emit('playSound', {
          name: 'block.chorus_flower.grow',
          position,
          volume: 1.0,
          pitch: 1.0,
          dimension: world.dimension
        });
      }
      
      return true;
    }
    
    // If no valid growth directions, just age the flower
    world.setBlock(position, this);
    return false;
  }
  
  /**
   * Handle block being broken
   * @param {Object} position - Block position
   * @param {Object} world - World instance
   * @param {Object} player - Player breaking the block
   * @returns {Array} Drops from breaking the block
   */
  onBreak(position, world, player) {
    if (!world) return [];
    
    // Calculate drops
    let drops = [];
    
    if (player && player.getHeldItem && !this.isFlower) {
      const heldItem = player.getHeldItem('main');
      
      // No special tool required
      drops.push({
        type: 'chorus_fruit',
        count: Math.floor(Math.random() * 2) + 1 // 1-2 chorus fruit
      });
    }
    
    // If this is a flower, check age
    if (this.isFlower && this.age < this.maxAge) {
      drops.push({
        type: 'chorus_flower',
        count: 1
      });
    }
    
    // Check if there are chorus plants above that need to be broken
    this.breakConnectedPlants(position, world);
    
    // Play break sound
    if (this.server) {
      this.server.emit('playSound', {
        name: this.isFlower ? 'block.chorus_flower.break' : 'block.wood.break',
        position,
        volume: 1.0,
        pitch: 0.8,
        dimension: world.dimension
      });
    }
    
    return drops;
  }
  
  /**
   * Break connected chorus plants above this one
   * @param {Object} position - Block position
   * @param {Object} world - World instance
   */
  breakConnectedPlants(position, world) {
    if (!world) return;
    
    // Check plants in all directions
    const directions = [
      { pos: { ...position, y: position.y + 1 } },
      { pos: { ...position, z: position.z - 1 } },
      { pos: { ...position, z: position.z + 1 } },
      { pos: { ...position, x: position.x + 1 } },
      { pos: { ...position, x: position.x - 1 } }
    ];
    
    for (const { pos } of directions) {
      const block = world.getBlock(pos);
      
      if (block && (block.type === 'chorus_plant' || block.type === 'chorus_flower')) {
        // Break the connected block
        world.breakBlock(pos);
      }
    }
  }
  
  /**
   * Get the state of the block for client rendering
   * @returns {Object} Block state data
   */
  getState() {
    return {
      type: this.type,
      isFlower: this.isFlower,
      age: this.age,
      connections: { ...this.connections }
    };
  }
  
  /**
   * Serializes the chorus plant block
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      type: this.type,
      isFlower: this.isFlower,
      age: this.age,
      connections: { ...this.connections }
    };
  }
  
  /**
   * Creates a Chorus Plant block from serialized data
   * @param {Object} data - Serialized data
   * @param {Object} server - Server instance
   * @returns {ChorusPlantBlock} New Chorus Plant block
   */
  static deserialize(data, server) {
    return new ChorusPlantBlock({
      isFlower: data.isFlower,
      age: data.age,
      connections: data.connections,
      server
    });
  }
  
  /**
   * Generate a chorus plant structure
   * @param {Object} position - Base position
   * @param {Object} world - World instance
   * @param {Object} server - Server instance
   * @param {Number} maxHeight - Maximum height (1-5)
   * @returns {Boolean} Whether generation was successful
   */
  static generatePlant(position, world, server, maxHeight = 5) {
    if (!world) return false;
    
    // Check base position - must be end stone
    const baseBlock = world.getBlock(position);
    if (!baseBlock || baseBlock.type !== 'end_stone') {
      return false;
    }
    
    // Minimum height is 1, maximum is 5
    maxHeight = Math.min(5, Math.max(1, maxHeight));
    
    // Determine actual height (random between 1 and maxHeight)
    const height = Math.floor(Math.random() * maxHeight) + 1;
    
    // Create base plant
    world.setBlock(position, new ChorusPlantBlock({
      isFlower: false,
      server
    }));
    
    // Create stem
    let currentPos = { ...position };
    let currentHeight = 0;
    
    while (currentHeight < height - 1) {
      currentPos = { ...currentPos, y: currentPos.y + 1 };
      world.setBlock(currentPos, new ChorusPlantBlock({
        isFlower: false,
        server
      }));
      currentHeight++;
      
      // Chance to branch out (except for the last stem block)
      if (currentHeight < height - 1 && Math.random() < 0.3) {
        this.generateBranch(currentPos, world, server, currentHeight, maxHeight);
      }
    }
    
    // Add flower at the top
    const flowerPos = { ...currentPos, y: currentPos.y + 1 };
    world.setBlock(flowerPos, new ChorusPlantBlock({
      isFlower: true,
      server
    }));
    
    // Update connections for all blocks
    this.updateAllConnections(position, height, world);
    
    return true;
  }
  
  /**
   * Generate a branch from a chorus plant
   * @param {Object} position - Branch start position 
   * @param {Object} world - World instance
   * @param {Object} server - Server instance
   * @param {Number} currentHeight - Current height of the branch
   * @param {Number} maxHeight - Maximum height
   */
  static generateBranch(position, world, server, currentHeight, maxHeight) {
    // Choose a random direction
    const directions = [
      { dx: 0, dz: -1 }, // north
      { dx: 0, dz: 1 },  // south
      { dx: 1, dz: 0 },  // east
      { dx: -1, dz: 0 }  // west
    ];
    
    const dir = directions[Math.floor(Math.random() * directions.length)];
    
    // Create branch block
    const branchPos = {
      x: position.x + dir.dx,
      y: position.y,
      z: position.z + dir.dz
    };
    
    // Check if the position is valid
    const blockAtPos = world.getBlock(branchPos);
    if (blockAtPos && blockAtPos.solid) {
      return; // Can't place branch here
    }
    
    // Create branch block
    world.setBlock(branchPos, new ChorusPlantBlock({
      isFlower: false,
      server
    }));
    
    // Random branch height (shorter than main stem)
    const branchHeight = Math.floor(Math.random() * 2) + 1;
    let branchCurrentPos = { ...branchPos };
    
    // Create branch stem
    for (let i = 0; i < branchHeight; i++) {
      branchCurrentPos = { ...branchCurrentPos, y: branchCurrentPos.y + 1 };
      
      // Check if position is valid
      const blockAtPos = world.getBlock(branchCurrentPos);
      if (blockAtPos && blockAtPos.solid) {
        break; // Can't continue branch
      }
      
      world.setBlock(branchCurrentPos, new ChorusPlantBlock({
        isFlower: false,
        server
      }));
    }
    
    // Add flower at the top of the branch
    const flowerPos = { ...branchCurrentPos, y: branchCurrentPos.y + 1 };
    
    // Check if position is valid
    const blockAtFlowerPos = world.getBlock(flowerPos);
    if (!blockAtFlowerPos || !blockAtFlowerPos.solid) {
      world.setBlock(flowerPos, new ChorusPlantBlock({
        isFlower: true,
        server
      }));
    }
  }
  
  /**
   * Update connections for all blocks in a chorus plant
   * @param {Object} basePosition - Base position of the plant
   * @param {Number} height - Height of the plant
   * @param {Object} world - World instance
   */
  static updateAllConnections(basePosition, height, world) {
    if (!world) return;
    
    // Update base position
    const baseBlock = world.getBlock(basePosition);
    if (baseBlock && baseBlock.type === 'chorus_plant' && typeof baseBlock.updateConnections === 'function') {
      baseBlock.updateConnections(basePosition, world);
    }
    
    // Update all positions above
    for (let y = 1; y <= height; y++) {
      const pos = { ...basePosition, y: basePosition.y + y };
      const block = world.getBlock(pos);
      
      if (block && (block.type === 'chorus_plant' || block.type === 'chorus_flower') && 
          typeof block.updateConnections === 'function') {
        block.updateConnections(pos, world);
      }
    }
    
    // Also scan horizontally for branches
    const directions = [
      { dx: 0, dz: -1 }, // north
      { dx: 0, dz: 1 },  // south
      { dx: 1, dz: 0 },  // east
      { dx: -1, dz: 0 }  // west
    ];
    
    for (let y = 0; y <= height; y++) {
      const pos = { ...basePosition, y: basePosition.y + y };
      
      for (const { dx, dz } of directions) {
        const branchPos = { x: pos.x + dx, y: pos.y, z: pos.z + dz };
        const block = world.getBlock(branchPos);
        
        if (block && (block.type === 'chorus_plant' || block.type === 'chorus_flower') && 
            typeof block.updateConnections === 'function') {
          block.updateConnections(branchPos, world);
        }
      }
    }
  }
}

module.exports = ChorusPlantBlock; 