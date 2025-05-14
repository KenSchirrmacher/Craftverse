/**
 * AmethystCluster - Final growth stage of amethyst crystals
 * Part of the Caves & Cliffs update
 */

const Block = require('./block');
const Vector = require('../utils/vector');

class AmethystCluster extends Block {
  /**
   * Create a new AmethystCluster block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super(options);
    this.type = 'amethyst_cluster';
    this.name = 'Amethyst Cluster';
    this.hardness = 1.5;
    this.resistance = 1.5;
    this.transparent = true;
    this.requiresTool = true;
    this.toolType = 'pickaxe';
    this.minToolLevel = 1; // Stone pickaxe or better
    this.sounds = {
      break: 'block.amethyst_cluster.break',
      step: 'block.amethyst_cluster.step',
      place: 'block.amethyst_cluster.place',
      hit: 'block.amethyst_cluster.hit',
      fall: 'block.amethyst_cluster.fall'
    };
    
    this.state = {
      facing: options.state?.facing || 'up',
      waterlogged: options.state?.waterlogged || false,
      ...options.state
    };
    
    // Guaranteed to drop 4 amethyst shards
    this.drops = [{ id: 'amethyst_shard', count: 4, probability: 1.0 }];
    this.currentGrowthStage = 3; // Final growth stage (0-based index)
    this.emitsLight = true;
    this.lightLevel = 5; // Emits a light level of 5
    this.growthStage = 0;
    this.maxGrowthStage = 3; // Small, Medium, Large, Cluster
  }

  /**
   * Check if block can be placed at the specified position
   * @param {Object} world - World instance
   * @param {Vector} pos - Position to place block
   * @param {Vector} placeAgainstPos - Position of block being placed against
   * @param {String} face - Face being placed against
   * @returns {Boolean} - Whether block can be placed
   */
  canPlaceAt(world, pos, placeAgainstPos, face) {
    // Can only be placed on solid faces
    const placeAgainstBlock = world.getBlock(placeAgainstPos);
    if (!placeAgainstBlock || !placeAgainstBlock.isSolid) {
      return false;
    }
    
    // Set the facing state based on the opposite of placement face
    const faceToDirection = {
      'up': 'down',
      'down': 'up',
      'north': 'south',
      'south': 'north',
      'east': 'west',
      'west': 'east'
    };
    
    this.state.facing = faceToDirection[face] || 'up';
    return true;
  }

  /**
   * Handle breaking the block
   * @param {Object} world - World instance
   * @param {Vector} pos - Block position
   * @param {Object} player - Player breaking the block
   * @param {Object} options - Additional options
   */
  onBreak(world, pos, player, options = {}) {
    // Emit a special sound when broken
    if (player) {
      world.playSoundAt(pos, 'block.amethyst_cluster.break', {
        volume: 1.0,
        pitch: 0.9 + Math.random() * 0.2
      });
    }
    
    // Call the parent's onBreak method to handle drops
    super.onBreak(world, pos, player, options);
  }

  /**
   * Special interaction on right-click
   * @param {Object} world - World instance
   * @param {Vector} pos - Block position
   * @param {Object} player - Player interacting with block
   * @param {String} hand - Hand used for interaction
   * @returns {Boolean} - Whether interaction was handled
   */
  onInteract(world, pos, player, hand) {
    // Play a special chime sound when the cluster is interacted with
    world.playSoundAt(pos, 'block.amethyst_cluster.chime', {
      volume: 0.7,
      pitch: 0.8 + Math.random() * 0.4
    });
    
    // Don't consume the interaction so other actions can still occur
    return false;
  }
  
  /**
   * Get the direction vector based on facing state
   * @returns {Vector} - Direction vector
   */
  getFacingVector() {
    const directions = {
      'up': new Vector(0, 1, 0),
      'down': new Vector(0, -1, 0),
      'north': new Vector(0, 0, -1),
      'south': new Vector(0, 0, 1),
      'east': new Vector(1, 0, 0),
      'west': new Vector(-1, 0, 0)
    };
    
    return directions[this.state.facing] || directions.up;
  }

  /**
   * Get block state for client rendering
   * @returns {Object} - Block state for client
   */
  getState() {
    return {
      type: this.type,
      lightLevel: this.lightLevel,
      ...this.state
    };
  }

  /**
   * Serialize block for storage
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      state: this.state,
      growthStage: this.growthStage
    };
  }

  /**
   * Deserialize block from storage
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    if (data.state) {
      this.state = data.state;
    }
    this.growthStage = data.growthStage || 0;
  }

  onPlace(world, x, y, z) {
    // Check if block below is budding amethyst
    const blockBelow = world.getBlock(x, y - 1, z);
    if (blockBelow && blockBelow.id === 'budding_amethyst') {
      this.growthStage = 0; // Start as small bud
    } else {
      this.growthStage = 3; // Place as full cluster
    }
  }

  update(world, x, y, z) {
    // Check if block below is budding amethyst
    const blockBelow = world.getBlock(x, y - 1, z);
    if (blockBelow && blockBelow.id === 'budding_amethyst') {
      // Random chance to grow
      if (Math.random() < 0.01 && this.growthStage < this.maxGrowthStage) {
        this.growthStage++;
        return true; // Indicate block state changed
      }
    }
    return false;
  }

  getDrops() {
    return {
      type: 'amethyst_shard',
      count: this.growthStage + 1
    };
  }
}

module.exports = AmethystCluster; 