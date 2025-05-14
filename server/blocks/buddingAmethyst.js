/**
 * BuddingAmethyst - Special block that can grow amethyst buds
 * Part of the Caves & Cliffs update
 */

const Block = require('./block');
const Vector = require('../utils/vector');

class BuddingAmethyst extends Block {
  /**
   * Create a new BuddingAmethyst block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super(options);
    this.type = 'budding_amethyst';
    this.name = 'Budding Amethyst';
    this.hardness = 2;
    this.resistance = 2;
    this.transparent = false;
    this.requiresTool = true;
    this.toolType = 'pickaxe';
    this.minToolLevel = 0; // Stone pickaxe or better
    this.sounds = {
      break: 'block.amethyst_block.break',
      step: 'block.amethyst_block.step',
      place: 'block.amethyst_block.place',
      hit: 'block.amethyst_block.hit',
      fall: 'block.amethyst_block.fall'
    };
    this.state = options.state || {};
    this.drops = null; // Budding amethyst drops nothing when broken
    this.tickRate = 5; // Ticks randomly based on random tick
    this.growthChance = 0.2; // 20% chance to grow a bud when ticked
  }

  /**
   * Handle random block tick
   * @param {Object} world - World instance
   * @param {Vector} pos - Block position
   */
  onRandomTick(world, pos) {
    if (Math.random() > this.growthChance) return;
    
    // Check adjacent faces for potential bud growth
    const adjacentDirections = [
      new Vector(1, 0, 0),
      new Vector(-1, 0, 0),
      new Vector(0, 1, 0),
      new Vector(0, -1, 0),
      new Vector(0, 0, 1),
      new Vector(0, 0, -1)
    ];
    
    // Randomly select one direction
    const randomDir = adjacentDirections[Math.floor(Math.random() * adjacentDirections.length)];
    const targetPos = pos.add(randomDir);
    
    // Check if target block is air
    const targetBlock = world.getBlock(targetPos);
    if (!targetBlock || targetBlock.type === 'air') {
      // Determine which growth stage to place
      this.growAmethystBud(world, targetPos);
    }
  }
  
  /**
   * Grow an amethyst bud at the specified position
   * @param {Object} world - World instance
   * @param {Vector} pos - Target position
   */
  growAmethystBud(world, pos) {
    // Start with small bud and let it grow naturally
    world.setBlock(pos, 'small_amethyst_bud');
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

  onPlace(world, x, y, z) {
    // Check for air blocks around to potentially grow amethyst buds
    this.checkForGrowth(world, x, y, z);
  }

  update(world, x, y, z) {
    // Random chance to check for growth
    if (Math.random() < 0.01) {
      this.checkForGrowth(world, x, y, z);
    }
  }

  checkForGrowth(world, x, y, z) {
    // Check all 6 directions for air blocks
    const directions = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 }
    ];

    for (const dir of directions) {
      const checkX = x + dir.x;
      const checkY = y + dir.y;
      const checkZ = z + dir.z;

      const block = world.getBlock(checkX, checkY, checkZ);
      if (block && block.id === 'air') {
        // Random chance to grow a small amethyst bud
        if (Math.random() < 0.1) {
          world.setBlock(checkX, checkY, checkZ, {
            type: 'small_amethyst_bud',
            facing: this.getFacingFromDirection(dir)
          });
        }
      }
    }
  }

  getFacingFromDirection(dir) {
    if (dir.y !== 0) return dir.y > 0 ? 'up' : 'down';
    if (dir.x !== 0) return dir.x > 0 ? 'east' : 'west';
    return dir.z > 0 ? 'south' : 'north';
  }

  onBreak(world, x, y, z) {
    // Budding amethyst drops nothing when broken
    return null;
  }

  getDrops() {
    return null;
  }
}

module.exports = BuddingAmethyst; 