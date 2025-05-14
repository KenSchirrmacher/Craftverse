/**
 * DripLeafBlock - Implementation of Big and Small Dripleafs from Lush Caves
 * These are plants found in the Lush Caves biome that provide unique platforming mechanics
 */

class DripLeafBlock {
  /**
   * Create a new DripLeafBlock instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.id = options.id || 'big_dripleaf';
    this.isBig = this.id === 'big_dripleaf';
    this.isSmall = this.id === 'small_dripleaf';
    this.metadata = options.metadata || 0;
    this.tilted = options.tilted || false;
    this.tiltTimer = 0;
    this.maxTiltTime = 15; // 0.75 seconds at 20 ticks per second
    this.tiltState = 0; // 0 = not tilted, 1 = partial tilt, 2 = full tilt
    this.headBlock = options.headBlock || false; // Whether this is the head of a big dripleaf
    this.stemPart = options.stemPart || false; // Whether this is a stem part of a big dripleaf
    this.waterlogged = options.waterlogged || false;
    this.facing = options.facing || 0; // 0 = north, 1 = east, 2 = south, 3 = west
    this.randomTickRate = 20; // 1 in 20 chance of a random tick (for growth)
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
    
    // Only big dripleafs that are head blocks can tilt
    if (this.isBig && this.headBlock && this.tilted) {
      this.tiltTimer += dt;
      
      // Update tilt state based on timer
      if (this.tiltTimer >= this.maxTiltTime && this.tiltState < 2) {
        this.tiltState++;
        this.tiltTimer = 0;
        
        // When fully tilted, entities will fall through
        if (this.tiltState === 2) {
          return {
            type: this.id,
            metadata: this.metadata,
            tiltState: this.tiltState,
            headBlock: this.headBlock,
            stemPart: this.stemPart,
            facing: this.facing,
            waterlogged: this.waterlogged
          };
        }
      }
    }
    
    // Random tick for small dripleafs (growth chance)
    if (this.isSmall && Math.random() < 1/this.randomTickRate) {
      return this.tryGrow(world, position);
    }
    
    return null;
  }
  
  /**
   * Try to grow a small dripleaf into a big dripleaf
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @returns {Object|null} - Block update data or null if no growth
   * @private
   */
  tryGrow(world, position) {
    // Check if conditions are right for growth
    // Small dripleafs need water or waterlogged blocks nearby to grow
    
    // Check for water nearby
    const hasWater = this.hasWaterNearby(world, position);
    
    // Random chance to grow (higher with water)
    const growthChance = hasWater ? 0.1 : 0.01;
    
    if (Math.random() < growthChance) {
      // Check if there's room to grow (2 blocks of space above)
      const blockAbove1 = world.getBlockAt(position.x, position.y + 1, position.z);
      const blockAbove2 = world.getBlockAt(position.x, position.y + 2, position.z);
      
      if ((!blockAbove1 || blockAbove1.type === 'air') && 
          (!blockAbove2 || blockAbove2.type === 'air')) {
        
        // Growth successful - convert to big dripleaf
        // Set stem at current position
        world.setBlock(position, {
          type: 'big_dripleaf',
          metadata: this.metadata,
          stemPart: true,
          facing: this.facing,
          waterlogged: this.waterlogged
        });
        
        // Set head block above
        world.setBlock({
          x: position.x,
          y: position.y + 1,
          z: position.z
        }, {
          type: 'big_dripleaf',
          metadata: this.metadata,
          headBlock: true,
          facing: this.facing,
          waterlogged: false
        });
        
        return true;
      }
    }
    
    return null;
  }
  
  /**
   * Check if there's water nearby for growth
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
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 },
      { x: 0, y: -1, z: 0 } // Check below as well
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
    // Can't interact directly
    return { success: false };
  }
  
  /**
   * Handle an entity colliding with this block
   * @param {Object} entity - Entity that collided
   * @param {Object} collisionData - Data about the collision
   * @returns {Object} - Effects to apply to the entity
   */
  onEntityCollide(entity, collisionData) {
    // Only big dripleaf head blocks have special collision behavior
    if (this.isBig && this.headBlock) {
      // If block is not already tilting, start tilting
      if (!this.tilted && entity.type === 'player') {
        this.tilted = true;
        this.tiltTimer = 0;
        this.tiltState = 0;
        
        // Return a response to start the tilting animation
        return {
          effect: 'start_tilt',
          blockUpdate: {
            type: this.id,
            metadata: this.metadata,
            tilted: true,
            tiltState: this.tiltState,
            headBlock: this.headBlock,
            stemPart: this.stemPart,
            facing: this.facing,
            waterlogged: this.waterlogged
          }
        };
      }
      
      // If fully tilted, don't provide collision support
      if (this.tiltState === 2) {
        return {
          platformSupport: false
        };
      }
    }
    
    return { success: true };
  }
  
  /**
   * Handle a player stepping on this block
   * @param {Object} player - Player who stepped on the block
   * @returns {Object} - Effect to apply to the player
   */
  onPlayerStep(player) {
    // Only big dripleaf head blocks have special step behavior
    if (this.isBig && this.headBlock) {
      // If block is not already tilting, start tilting
      if (!this.tilted) {
        this.tilted = true;
        this.tiltTimer = 0;
        this.tiltState = 0;
        
        return {
          effect: 'start_tilt',
          blockUpdate: {
            type: this.id,
            metadata: this.metadata,
            tilted: true,
            tiltState: this.tiltState,
            headBlock: this.headBlock,
            stemPart: this.stemPart,
            facing: this.facing,
            waterlogged: this.waterlogged
          }
        };
      }
    }
    
    return { success: true };
  }
  
  /**
   * Check if this block can be placed at the given location
   * @param {Object} world - The world object
   * @param {Object} position - Target position
   * @returns {Boolean} - Whether the block can be placed
   */
  canPlace(world, position) {
    const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
    
    if (this.isSmall) {
      // Small dripleafs need clay, moss, or dirt to be placed
      return blockBelow && ['clay', 'moss_block', 'dirt', 'grass_block'].includes(blockBelow.type);
    } else if (this.isBig && this.stemPart) {
      // Stem parts need valid support or another stem below
      return blockBelow && (
        ['clay', 'moss_block', 'dirt', 'grass_block'].includes(blockBelow.type) ||
        (blockBelow.type === 'big_dripleaf' && blockBelow.stemPart)
      );
    } else if (this.isBig && this.headBlock) {
      // Head blocks need a stem below
      return blockBelow && blockBelow.type === 'big_dripleaf' && blockBelow.stemPart;
    }
    
    return false;
  }
  
  /**
   * Reset a tilted dripleaf
   * Called when there are no entities on the dripleaf
   */
  resetTilt() {
    if (this.isBig && this.headBlock && this.tilted) {
      this.tilted = false;
      this.tiltTimer = 0;
      this.tiltState = 0;
      
      return {
        type: this.id,
        metadata: this.metadata,
        tilted: false,
        tiltState: this.tiltState,
        headBlock: this.headBlock,
        stemPart: this.stemPart,
        facing: this.facing,
        waterlogged: this.waterlogged
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
      metadata: this.metadata,
      tilted: this.tilted,
      tiltState: this.tiltState,
      headBlock: this.headBlock,
      stemPart: this.stemPart,
      facing: this.facing,
      waterlogged: this.waterlogged,
      solid: this.isBig && this.headBlock && this.tiltState < 2,
      transparent: true,
      collidable: this.isBig && this.headBlock && this.tiltState < 2,
      model: this.isSmall ? 'small_dripleaf' : 
             (this.headBlock ? 'big_dripleaf_head' : 'big_dripleaf_stem')
    };
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      type: this.id,
      metadata: this.metadata,
      tilted: this.tilted,
      tiltTimer: this.tiltTimer,
      tiltState: this.tiltState,
      headBlock: this.headBlock,
      stemPart: this.stemPart,
      facing: this.facing,
      waterlogged: this.waterlogged
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
    if (data.tilted !== undefined) {
      this.tilted = data.tilted;
    }
    if (data.tiltTimer !== undefined) {
      this.tiltTimer = data.tiltTimer;
    }
    if (data.tiltState !== undefined) {
      this.tiltState = data.tiltState;
    }
    if (data.headBlock !== undefined) {
      this.headBlock = data.headBlock;
    }
    if (data.stemPart !== undefined) {
      this.stemPart = data.stemPart;
    }
    if (data.facing !== undefined) {
      this.facing = data.facing;
    }
    if (data.waterlogged !== undefined) {
      this.waterlogged = data.waterlogged;
    }
  }
}

module.exports = DripLeafBlock; 