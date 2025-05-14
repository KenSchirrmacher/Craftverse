/**
 * ArchaeologyManager - Handles all archaeology-related functionality
 */

const EventEmitter = require('events');

class ArchaeologyManager extends EventEmitter {
  constructor() {
    super();
    this.brushDurability = 64; // Number of uses before brush breaks
    this.excavationTime = 2.5; // Seconds to excavate a block
    this.lootTables = this.initializeLootTables();
  }

  initializeLootTables() {
    return {
      suspicious_sand: {
        common: [
          { item: 'pottery_shard', weight: 10 },
          { item: 'emerald', weight: 5 },
          { item: 'gold_nugget', weight: 8 }
        ],
        uncommon: [
          { item: 'diamond', weight: 2 },
          { item: 'iron_ingot', weight: 4 },
          { item: 'gold_ingot', weight: 3 }
        ],
        rare: [
          { item: 'netherite_scrap', weight: 1 },
          { item: 'enchanted_book', weight: 1 }
        ]
      },
      suspicious_gravel: {
        common: [
          { item: 'pottery_shard', weight: 10 },
          { item: 'coal', weight: 8 },
          { item: 'iron_nugget', weight: 6 }
        ],
        uncommon: [
          { item: 'gold_ingot', weight: 3 },
          { item: 'iron_ingot', weight: 4 },
          { item: 'lapis_lazuli', weight: 3 }
        ],
        rare: [
          { item: 'diamond', weight: 1 },
          { item: 'enchanted_book', weight: 1 }
        ]
      }
    };
  }

  /**
   * Start excavating a suspicious block
   * @param {Object} player - The player excavating
   * @param {Object} block - The suspicious block being excavated
   * @param {Object} brush - The brush item being used
   * @returns {Promise} Resolves when excavation is complete
   */
  async startExcavation(player, block, brush) {
    if (!this.isValidBlock(block)) {
      throw new Error('Invalid block type for excavation');
    }

    if (brush.durability <= 0) {
      throw new Error('Brush is broken');
    }

    // Emit start event
    this.emit('excavationStart', { player, block, brush });

    // Simulate excavation time
    await new Promise(resolve => setTimeout(resolve, this.excavationTime * 1000));

    // Generate loot
    const loot = this.generateLoot(block.type);
    
    // Damage brush
    brush.durability--;

    // Emit completion event
    this.emit('excavationComplete', { player, block, brush, loot });

    return loot;
  }

  /**
   * Check if a block is valid for excavation
   * @param {Object} block - The block to check
   * @returns {boolean} Whether the block is valid
   */
  isValidBlock(block) {
    return block && (block.type === 'suspicious_sand' || block.type === 'suspicious_gravel');
  }

  /**
   * Generate loot based on block type and rarity
   * @param {string} blockType - Type of suspicious block
   * @returns {Object} Generated loot item
   */
  generateLoot(blockType) {
    const lootTable = this.lootTables[blockType];
    if (!lootTable) return null;

    // Determine rarity (common: 60%, uncommon: 30%, rare: 10%)
    const rarityRoll = Math.random();
    let rarity;
    if (rarityRoll < 0.6) rarity = 'common';
    else if (rarityRoll < 0.9) rarity = 'uncommon';
    else rarity = 'rare';

    // Select item from appropriate rarity table
    const items = lootTable[rarity];
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) {
        return {
          type: item.item,
          rarity: rarity
        };
      }
    }

    return null;
  }

  /**
   * Get the excavation time for a block
   * @returns {number} Excavation time in seconds
   */
  getExcavationTime() {
    return this.excavationTime;
  }

  /**
   * Get the maximum durability of a brush
   * @returns {number} Maximum brush durability
   */
  getBrushDurability() {
    return this.brushDurability;
  }
}

module.exports = ArchaeologyManager; 