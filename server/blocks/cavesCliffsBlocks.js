/**
 * Caves & Cliffs Blocks
 * Implements new blocks from the Caves & Cliffs update:
 * - Copper blocks (normal, exposed, weathered, oxidized) with oxidation mechanics
 * - Amethyst blocks (budding, clusters, shards)
 * - Deepslate and its variants
 * - Dripstone blocks and pointed dripstone
 * - Moss, azalea, and other lush cave blocks
 * - Powder snow with player interaction
 */

const Block = require('./block');

/**
 * Base class for Copper blocks with oxidation mechanics
 */
class CopperBlock extends Block {
  /**
   * Create a new CopperBlock
   * @param {Object} options - Block configuration
   */
  constructor(options = {}) {
    super({
      name: 'Copper Block',
      hardness: 3.0,
      toolType: 'pickaxe',
      minToolLevel: 'stone',
      drops: ['copper_block'],
      ...options
    });
    
    this.oxidationState = options.oxidationState || 'none'; // none, exposed, weathered, oxidized
    this.waxed = options.waxed || false;
    this.oxidationTimer = options.oxidationTimer || 0;
    this.oxidationThreshold = 12000; // 10 minutes at 20 ticks/second
  }
  
  /**
   * Update method called on each tick
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @param {Number} deltaTime - Time since last update in ms
   * @returns {Object|null} - Block update data or null if no update
   */
  update(world, position, deltaTime) {
    // Don't update if waxed
    if (this.waxed) return null;
    
    // Don't update if already fully oxidized
    if (this.oxidationState === 'oxidized') return null;
    
    // Update oxidation timer
    this.oxidationTimer += deltaTime;
    
    // Check if it's time to oxidize further
    if (this.oxidationTimer >= this.oxidationThreshold) {
      this.oxidationTimer = 0;
      
      // Move to next oxidation state
      let newState = 'exposed';
      if (this.oxidationState === 'exposed') {
        newState = 'weathered';
      } else if (this.oxidationState === 'weathered') {
        newState = 'oxidized';
      }
      
      // Only update if state actually changed
      if (newState !== this.oxidationState) {
        return {
          type: `${this.id.replace(this.oxidationState, newState)}`,
          oxidationState: newState,
          waxed: this.waxed
        };
      }
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
    // Handle scraping with axe to remove oxidation
    if (action === 'use_item' && data.item && data.item.startsWith('axe')) {
      // Can't scrape non-oxidized block
      if (this.oxidationState === 'none') {
        return { success: false, message: 'Block is not oxidized' };
      }
      
      // Determine new oxidation state
      let newState = 'none';
      if (this.oxidationState === 'weathered') {
        newState = 'exposed';
      } else if (this.oxidationState === 'oxidized') {
        newState = 'weathered';
      }
      
      // Update block type
      return {
        success: true,
        message: 'Scraped off some oxidation',
        newBlock: {
          type: `${this.id.replace(this.oxidationState, newState)}`,
          oxidationState: newState,
          waxed: this.waxed
        }
      };
    }
    
    // Handle waxing with honeycomb
    if (action === 'use_item' && data.item === 'honeycomb') {
      if (this.waxed) {
        return { success: false, message: 'Block is already waxed' };
      }
      
      // Update block to waxed variant
      return {
        success: true,
        message: 'Applied wax to copper',
        newBlock: {
          type: `waxed_${this.id}`,
          oxidationState: this.oxidationState,
          waxed: true
        },
        consumeItem: true
      };
    }
    
    return super.interact(player, action, data);
  }
  
  /**
   * Get the block's data for client
   * @returns {Object} - Block data for the client
   */
  getState() {
    return {
      ...super.getState(),
      oxidationState: this.oxidationState,
      waxed: this.waxed
    };
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      oxidationState: this.oxidationState,
      waxed: this.waxed,
      oxidationTimer: this.oxidationTimer
    };
  }
  
  /**
   * Deserialize data to restore the block's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.oxidationState) {
      this.oxidationState = data.oxidationState;
    }
    if (data.waxed !== undefined) {
      this.waxed = data.waxed;
    }
    if (data.oxidationTimer !== undefined) {
      this.oxidationTimer = data.oxidationTimer;
    }
  }
}

/**
 * Amethyst block that can grow crystal clusters
 */
class BuddingAmethystBlock extends Block {
  /**
   * Create a new BuddingAmethystBlock
   * @param {Object} options - Block configuration
   */
  constructor(options = {}) {
    super({
      name: 'Budding Amethyst',
      hardness: 1.5,
      toolType: 'pickaxe',
      minToolLevel: 'iron',
      drops: ['amethyst_block'], // Drops regular amethyst, not budding
      ...options
    });
    
    this.growthTimer = 0;
    this.growthThreshold = 6000; // 5 minutes at 20 ticks/second
    this.maxClusters = 4; // Maximum clusters around a budding block
  }
  
  /**
   * Update method called on each tick
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @param {Number} deltaTime - Time since last update in ms
   * @returns {Object|null} - Block update data or null if no update
   */
  update(world, position, deltaTime) {
    // Update growth timer
    this.growthTimer += deltaTime;
    
    // Check if it's time to try growing a cluster
    if (this.growthTimer >= this.growthThreshold) {
      this.growthTimer = 0;
      
      // Count existing clusters around this block
      const directions = [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 }
      ];
      
      let clusterCount = 0;
      let emptyDirections = [];
      
      // Check each direction
      for (const dir of directions) {
        const blockPos = {
          x: position.x + dir.x,
          y: position.y + dir.y,
          z: position.z + dir.z
        };
        
        const adjacentBlock = world.getBlockAt(blockPos.x, blockPos.y, blockPos.z);
        
        // Count amethyst clusters and collect empty positions
        if (adjacentBlock) {
          if (adjacentBlock.type && adjacentBlock.type.includes('amethyst_cluster')) {
            clusterCount++;
          }
        } else {
          emptyDirections.push(dir);
        }
      }
      
      // Grow new cluster if below max and there's an empty space
      if (clusterCount < this.maxClusters && emptyDirections.length > 0) {
        // Choose random empty direction
        const randomDir = emptyDirections[Math.floor(Math.random() * emptyDirections.length)];
        const newPos = {
          x: position.x + randomDir.x,
          y: position.y + randomDir.y,
          z: position.z + randomDir.z
        };
        
        // Place small amethyst bud
        world.setBlock(newPos, { type: 'small_amethyst_bud', growthStage: 0 });
        return null; // World already updated
      }
    }
    
    return null;
  }
}

/**
 * Amethyst cluster with growth stages
 */
class AmethystClusterBlock extends Block {
  /**
   * Create a new AmethystClusterBlock
   * @param {Object} options - Block configuration
   */
  constructor(options = {}) {
    super({
      name: 'Amethyst Cluster',
      hardness: 1.5,
      toolType: 'pickaxe',
      drops: ['amethyst_shard'],
      ...options
    });
    
    this.growthStage = options.growthStage || 0; // 0=small, 1=medium, 2=large, 3=cluster
    this.growthTimer = 0;
    this.growthThreshold = 4800; // 4 minutes at 20 ticks/second
    
    // Update block properties based on growth stage
    this.updateStageProperties();
  }
  
  /**
   * Update properties based on growth stage
   * @private
   */
  updateStageProperties() {
    switch (this.growthStage) {
      case 0:
        this.id = 'small_amethyst_bud';
        this.name = 'Small Amethyst Bud';
        this.drops = []; // Small buds drop nothing
        this.light = 1;
        break;
      case 1:
        this.id = 'medium_amethyst_bud';
        this.name = 'Medium Amethyst Bud';
        this.drops = []; // Medium buds drop nothing
        this.light = 2;
        break;
      case 2:
        this.id = 'large_amethyst_bud';
        this.name = 'Large Amethyst Bud';
        this.drops = []; // Large buds drop nothing
        this.light = 3;
        break;
      case 3:
        this.id = 'amethyst_cluster';
        this.name = 'Amethyst Cluster';
        this.drops = ['amethyst_shard'];
        this.light = 5;
        break;
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
    // Don't update fully grown clusters
    if (this.growthStage >= 3) return null;
    
    // Check if attached to budding amethyst
    const blockDirections = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 }
    ];
    
    let attachedToBuddingAmethyst = false;
    
    for (const dir of blockDirections) {
      const blockPos = {
        x: position.x + dir.x,
        y: position.y + dir.y,
        z: position.z + dir.z
      };
      
      const adjacentBlock = world.getBlockAt(blockPos.x, blockPos.y, blockPos.z);
      
      if (adjacentBlock && adjacentBlock.type === 'budding_amethyst') {
        attachedToBuddingAmethyst = true;
        break;
      }
    }
    
    // Break if not attached to budding amethyst
    if (!attachedToBuddingAmethyst) {
      return { type: 'air' };
    }
    
    // Update growth timer
    this.growthTimer += deltaTime;
    
    // Check if it's time to grow
    if (this.growthTimer >= this.growthThreshold) {
      this.growthTimer = 0;
      this.growthStage++;
      
      // Update properties
      this.updateStageProperties();
      
      // Return updated block data
      return {
        type: this.id,
        growthStage: this.growthStage
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
      ...super.getState(),
      growthStage: this.growthStage,
      light: this.light
    };
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      growthStage: this.growthStage,
      growthTimer: this.growthTimer
    };
  }
  
  /**
   * Deserialize data to restore the block's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.growthStage !== undefined) {
      this.growthStage = data.growthStage;
      this.updateStageProperties();
    }
    if (data.growthTimer !== undefined) {
      this.growthTimer = data.growthTimer;
    }
  }
}

/**
 * Deepslate block and variants
 */
class DeepslateBlock extends Block {
  /**
   * Create a new DeepslateBlock
   * @param {Object} options - Block configuration
   */
  constructor(options = {}) {
    super({
      name: 'Deepslate',
      hardness: 3.0,
      toolType: 'pickaxe',
      minToolLevel: 'stone',
      drops: ['cobbled_deepslate'], // Regular deepslate drops cobbled
      ...options
    });
    
    // Default axis orientation
    this.axis = options.axis || 'y';
  }
  
  /**
   * Get the block's data for client
   * @returns {Object} - Block data for the client
   */
  getState() {
    return {
      ...super.getState(),
      axis: this.axis
    };
  }
  
  /**
   * Process an interaction with this block
   * @param {Object} player - Player who interacted
   * @param {String} action - Type of interaction
   * @param {Object} data - Additional data for the interaction
   * @returns {Object} - Result of the interaction
   */
  interact(player, action, data) {
    return super.interact(player, action, data);
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      axis: this.axis
    };
  }
  
  /**
   * Deserialize data to restore the block's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.axis) {
      this.axis = data.axis;
    }
  }
}

/**
 * Pointed Dripstone block with dripping mechanics
 */
class PointedDripstoneBlock extends Block {
  /**
   * Create a new PointedDripstoneBlock
   * @param {Object} options - Block configuration
   */
  constructor(options = {}) {
    super({
      name: 'Pointed Dripstone',
      hardness: 1.5,
      toolType: 'pickaxe',
      drops: ['pointed_dripstone'],
      ...options
    });
    
    this.direction = options.direction || 'down'; // 'up' or 'down'
    this.tipDirection = options.tipDirection || null; // Which end has the tip
    this.dripTimer = 0;
    this.dripThreshold = 12000; // 10 minutes
    this.stage = options.stage || 0; // 0-4, determines size
  }
  
  /**
   * Update method called on each tick
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @param {Number} deltaTime - Time since last update in ms
   * @returns {Object|null} - Block update data or null if no update
   */
  update(world, position, deltaTime) {
    // Check structural integrity
    if (!this.checkSupport(world, position)) {
      // Break if not supported
      return { type: 'air' };
    }
    
    // Only update stalactites (pointing down) that are tips
    if (this.direction === 'down' && this.tipDirection === 'down') {
      // Update drip timer
      this.dripTimer += deltaTime;
      
      // Check for fluid above
      const blockAbove = world.getBlockAt(position.x, position.y + 1, position.z);
      const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
      
      // Only proceed if there's a fluid above and air below
      if (blockAbove && (blockAbove.type === 'water' || blockAbove.type === 'lava') &&
          blockBelow && blockBelow.type === 'air') {
        
        // Check if it's time to drip
        if (this.dripTimer >= this.dripThreshold) {
          this.dripTimer = 0;
          
          // Create drip entity
          world.addEntity({
            type: 'dripstone_drip',
            position: {
              x: position.x + 0.5,
              y: position.y - 0.1,
              z: position.z + 0.5
            },
            fluidType: blockAbove.type
          });
        }
      }
    }
    
    return null;
  }
  
  /**
   * Check if the dripstone is properly supported
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @returns {Boolean} - Whether the block is supported
   */
  checkSupport(world, position) {
    const { x, y, z } = position;
    
    if (this.direction === 'down') {
      // Check block above
      const blockAbove = world.getBlockAt(x, y + 1, z);
      return blockAbove && (
        blockAbove.type === 'dripstone_block' ||
        blockAbove.type === 'pointed_dripstone'
      );
    } else if (this.direction === 'up') {
      // Check block below
      const blockBelow = world.getBlockAt(x, y - 1, z);
      return blockBelow && (
        blockBelow.type === 'dripstone_block' ||
        blockBelow.type === 'pointed_dripstone'
      );
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
    return super.interact(player, action, data);
  }
  
  /**
   * Get the block's data for client
   * @returns {Object} - Block data for the client
   */
  getState() {
    return {
      ...super.getState(),
      direction: this.direction,
      tipDirection: this.tipDirection,
      stage: this.stage
    };
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      direction: this.direction,
      tipDirection: this.tipDirection,
      dripTimer: this.dripTimer,
      stage: this.stage
    };
  }
  
  /**
   * Deserialize data to restore the block's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.direction) {
      this.direction = data.direction;
    }
    if (data.tipDirection) {
      this.tipDirection = data.tipDirection;
    }
    if (data.dripTimer !== undefined) {
      this.dripTimer = data.dripTimer;
    }
    if (data.stage !== undefined) {
      this.stage = data.stage;
    }
  }
}

/**
 * Powder Snow block with player interaction
 */
class PowderSnowBlock extends Block {
  /**
   * Create a new PowderSnowBlock
   * @param {Object} options - Block configuration
   */
  constructor(options = {}) {
    super({
      name: 'Powder Snow',
      hardness: 0.25,
      toolType: null,
      drops: ['powder_snow_bucket'],
      toolRequired: false,
      ...options
    });
  }
  
  /**
   * Process an interaction with this block
   * @param {Object} player - Player who interacted
   * @param {String} action - Type of interaction
   * @param {Object} data - Additional data for the interaction
   * @returns {Object} - Result of the interaction
   */
  interact(player, action, data) {
    // Handle bucket interaction
    if (action === 'use_item' && data.item === 'bucket') {
      return {
        success: true,
        message: 'Collected powder snow in bucket',
        newBlock: { type: 'air' },
        giveItem: { id: 'powder_snow_bucket', count: 1 },
        consumeItem: true
      };
    }
    
    return super.interact(player, action, data);
  }
  
  /**
   * Handle a player stepping on this block
   * @param {Object} player - Player who stepped on the block
   * @returns {Object} - Effect to apply to the player
   */
  onPlayerStep(player) {
    // Check if player has leather boots
    const hasLeatherBoots = player.equipment && 
                           player.equipment.feet && 
                           player.equipment.feet.id === 'leather_boots';
    
    if (hasLeatherBoots) {
      // Player can walk normally
      return { type: 'movement', speedFactor: 1.0 };
    } else {
      // Player sinks and slows down
      return { 
        type: 'movement', 
        speedFactor: 0.3,
        sinking: true
      };
    }
  }
  
  /**
   * Get the block's data for client
   * @returns {Object} - Block data for the client
   */
  getState() {
    return {
      ...super.getState(),
      solid: false,
      translucent: true,
      collidable: true
    };
  }
}

/**
 * Moss Block with spreading behavior
 */
class MossBlock extends Block {
  /**
   * Create a new MossBlock
   * @param {Object} options - Block configuration
   */
  constructor(options = {}) {
    super({
      name: 'Moss Block',
      hardness: 0.5,
      toolType: 'hoe',
      drops: ['moss_block'],
      ...options
    });
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
    
    return super.interact(player, action, data);
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
      'tuff', 'deepslate', 'diorite', 'andesite', 'granite'
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
        }
      }
    }
  }
}

// Export all block classes
module.exports = {
  CopperBlock,
  BuddingAmethystBlock,
  AmethystClusterBlock,
  DeepslateBlock,
  PointedDripstoneBlock,
  PowderSnowBlock: require('./powderSnowBlock'),
  MossBlock: require('./mossBlock'),
  DripLeafBlock: require('./dripleafBlock')
}; 