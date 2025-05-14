/**
 * FireBlock - Implementation of regular fire and soul fire
 */

class FireBlock {
  /**
   * Create a new FireBlock instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.id = options.id || 'fire';
    this.isSoulFire = this.id === 'soul_fire';
    this.light = this.isSoulFire ? 10 : 15; // Soul fire is dimmer
    this.damage = this.isSoulFire ? 2 : 1;  // Soul fire does more damage
    this.burnTime = 0;
    this.maxBurnTime = 60 + Math.floor(Math.random() * 40); // Fire burns for 3-5 seconds
    this.spreadChance = this.isSoulFire ? 0.2 : 0.4; // Soul fire spreads slower
    this.canBePlaced = false; // Fire can only be started, not placed directly
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
    
    // Update burn time
    this.burnTime += dt;
    
    // Check if fire should extinguish due to time
    if (this.burnTime >= this.maxBurnTime) {
      return { type: 'air' };
    }
    
    // Check if fire has a valid block beneath it
    const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
    
    // Soul fire requires soul sand or soul soil
    if (this.isSoulFire) {
      if (!blockBelow || (blockBelow.type !== 'soul_sand' && blockBelow.type !== 'soul_soil')) {
        return { type: 'air' };
      }
    } else {
      // Regular fire extinguishes if over air
      if (!blockBelow || blockBelow.type === 'air') {
        return { type: 'air' };
      }
    }
    
    // Try to spread fire (with reduced chance based on burn time)
    if (Math.random() < this.spreadChance * (1 - this.burnTime / this.maxBurnTime * 0.5)) {
      this.trySpreadFire(world, position);
    }
    
    return null;
  }
  
  /**
   * Process an interaction with this block
   * @param {Object} player - Player who interacted
   * @param {String} action - Type of interaction
   * @param {Object} data - Additional data for the interaction
   * @returns {Object} - Result of the interaction
   */
  interact(player, action, data) {
    // Fire can't be interacted with directly
    return { success: false };
  }
  
  /**
   * Handle a player stepping on this block
   * @param {Object} player - Player who stepped on the block
   * @returns {Object} - Effect to apply to the player
   */
  onPlayerStep(player) {
    return {
      type: 'damage',
      amount: this.damage
    };
  }
  
  /**
   * Check if this block can be placed at the given location
   * @param {Object} world - The world object
   * @param {Object} position - Target position
   * @returns {Boolean} - Whether the block can be placed
   */
  canPlace(world, position) {
    return false; // Fire cannot be placed directly
  }
  
  /**
   * Try to spread fire to adjacent blocks
   * @param {Object} world - The world object
   * @param {Object} position - The position of this fire block
   * @private
   */
  trySpreadFire(world, position) {
    // Directions to check for spreading
    const directions = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 },
      { x: 0, y: 1, z: 0 }
    ];
    
    // Choose a random direction
    const dir = directions[Math.floor(Math.random() * directions.length)];
    const newPos = {
      x: position.x + dir.x,
      y: position.y + dir.y,
      z: position.z + dir.z
    };
    
    // Check if the target position is air
    const targetBlock = world.getBlockAt(newPos.x, newPos.y, newPos.z);
    if (!targetBlock || targetBlock.type !== 'air') {
      return;
    }
    
    // Check if there's a flammable block adjacent to the target
    const hasFlammableAdjacent = this.hasFlammableAdjacent(world, newPos);
    if (!hasFlammableAdjacent) {
      return;
    }
    
    // Check if target position has soul sand/soil below (for soul fire)
    const blockBelow = world.getBlockAt(newPos.x, newPos.y - 1, newPos.z);
    if (blockBelow) {
      const fireType = (blockBelow.type === 'soul_sand' || blockBelow.type === 'soul_soil') 
        ? 'soul_fire' 
        : 'fire';
      
      // Set the new fire
      world.setBlock(newPos, { type: fireType });
    }
  }
  
  /**
   * Check if there's a flammable block adjacent to the position
   * @param {Object} world - The world object
   * @param {Object} position - Position to check
   * @returns {Boolean} - Whether there's a flammable block adjacent
   * @private
   */
  hasFlammableAdjacent(world, position) {
    // Directions to check
    const directions = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 }
    ];
    
    // Flammable block types
    const flammableBlocks = [
      'wood', 'leaves', 'planks', 'wool', 'bookshelf', 'fence',
      'hay_block', 'carpet', 'tnt'
    ];
    
    // Check each direction
    for (const dir of directions) {
      const newPos = {
        x: position.x + dir.x,
        y: position.y + dir.y,
        z: position.z + dir.z
      };
      
      const block = world.getBlockAt(newPos.x, newPos.y, newPos.z);
      if (block && flammableBlocks.includes(block.type)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Start a fire at the given position
   * @param {Object} world - The world object
   * @param {Object} position - Where to start the fire
   * @returns {Boolean} - Whether the fire was successfully started
   */
  static startFireAt(world, position) {
    // Check if the position is valid (air block)
    const targetBlock = world.getBlockAt(position.x, position.y, position.z);
    if (!targetBlock || targetBlock.type !== 'air') {
      return false;
    }
    
    // Check the block below to determine fire type
    const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
    if (!blockBelow) {
      return false;
    }
    
    // Determine fire type based on block below
    const fireType = (blockBelow.type === 'soul_sand' || blockBelow.type === 'soul_soil') 
      ? 'soul_fire' 
      : 'fire';
    
    // Set the fire block
    world.setBlock(position, { type: fireType });
    return true;
  }
  
  /**
   * Get the block's data for client
   * @returns {Object} - Block data for the client
   */
  getState() {
    return {
      type: this.id,
      light: this.light,
      solid: false,
      transparent: true,
      collidable: false
    };
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      type: this.id,
      burnTime: this.burnTime,
      maxBurnTime: this.maxBurnTime
    };
  }
  
  /**
   * Deserialize data to restore the block's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    if (data.burnTime !== undefined) {
      this.burnTime = data.burnTime;
    }
    if (data.maxBurnTime !== undefined) {
      this.maxBurnTime = data.maxBurnTime;
    }
  }
}

module.exports = FireBlock; 