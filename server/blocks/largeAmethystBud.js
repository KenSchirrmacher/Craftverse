/**
 * LargeAmethystBud - Third growth stage of amethyst crystals
 * Part of the Caves & Cliffs update
 */

const Block = require('./block');
const Vector = require('../utils/vector');

class LargeAmethystBud extends Block {
  /**
   * Create a new LargeAmethystBud block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super(options);
    this.type = 'large_amethyst_bud';
    this.name = 'Large Amethyst Bud';
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
    
    this.drops = [{ id: 'amethyst_shard', count: 1, probability: 0.5 }]; // 50% chance to drop a shard
    this.tickRate = 5; // Ticks randomly based on random tick
    this.growthChance = 0.1; // 10% chance to grow to final stage when ticked
    this.currentGrowthStage = 2; // 0-based index (large is stage 2)
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
   * Handle random block tick
   * @param {Object} world - World instance
   * @param {Vector} pos - Block position
   */
  onRandomTick(world, pos) {
    if (Math.random() > this.growthChance) return;
    
    // Check if the block that this bud is attached to is still a budding amethyst
    const facingDir = this.getFacingVector();
    const attachedBlockPos = pos.add(facingDir);
    const attachedBlock = world.getBlock(attachedBlockPos);
    
    if (attachedBlock && attachedBlock.type === 'budding_amethyst') {
      // Grow to the final stage: amethyst cluster
      world.setBlock(pos, 'amethyst_cluster', { facing: this.state.facing, waterlogged: this.state.waterlogged });
    }
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
      state: this.state
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
  }
}

module.exports = LargeAmethystBud; 