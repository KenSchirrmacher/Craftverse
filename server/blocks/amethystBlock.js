/**
 * AmethystBlock - Decorative block found in amethyst geodes
 * Part of the Caves & Cliffs update
 */

const Block = require('./block');

class AmethystBlock extends Block {
  /**
   * Create a new AmethystBlock
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super(options);
    this.type = 'amethyst_block';
    this.name = 'Amethyst Block';
    this.hardness = 1.5;
    this.resistance = 6.0;
    this.transparent = false;
    this.requiresTool = true;
    this.toolType = 'pickaxe';
    this.minToolLevel = 1; // Stone pickaxe or better
    this.sounds = {
      break: 'block.amethyst_block.break',
      step: 'block.amethyst_block.step',
      place: 'block.amethyst_block.place',
      hit: 'block.amethyst_block.hit',
      fall: 'block.amethyst_block.fall'
    };
    this.state = options.state || {};
    this.drops = [{ id: 'amethyst_block', count: 1 }];
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

  onBreak(world, x, y, z) {
    // Drop amethyst shards when broken
    world.dropItem(x, y, z, {
      type: 'amethyst_shard',
      count: 4
    });
  }

  getDrops() {
    return {
      type: 'amethyst_shard',
      count: 4
    };
  }
}

module.exports = AmethystBlock; 