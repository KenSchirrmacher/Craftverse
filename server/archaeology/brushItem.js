/**
 * BrushItem - Implementation of the brush tool for archaeology
 */

const Item = require('../items/item');

class BrushItem extends Item {
  constructor(options = {}) {
    super({
      id: 'brush',
      name: 'Brush',
      maxStackSize: 1,
      durability: 64,
      ...options
    });

    this.durability = options.durability || 64;
    this.maxDurability = this.durability;
  }

  /**
   * Use the brush on a block
   * @param {Object} player - The player using the brush
   * @param {Object} block - The block being brushed
   * @returns {boolean} Whether the brush was used successfully
   */
  use(player, block) {
    if (this.durability <= 0) {
      return false;
    }

    // Check if block is valid for brushing
    if (block.type !== 'suspicious_sand' && block.type !== 'suspicious_gravel') {
      return false;
    }

    // Start excavation process
    const archaeologyManager = player.world.getArchaeologyManager();
    archaeologyManager.startExcavation(player, block, this)
      .then(loot => {
        if (loot) {
          // Add loot to player's inventory
          player.inventory.addItem(loot);
        }
      })
      .catch(error => {
        console.error('Excavation failed:', error);
      });

    return true;
  }

  /**
   * Get the current durability of the brush
   * @returns {number} Current durability
   */
  getDurability() {
    return this.durability;
  }

  /**
   * Get the maximum durability of the brush
   * @returns {number} Maximum durability
   */
  getMaxDurability() {
    return this.maxDurability;
  }

  /**
   * Damage the brush by one use
   */
  damage() {
    this.durability--;
    if (this.durability <= 0) {
      this.durability = 0;
      // Emit break event
      this.emit('break');
    }
  }

  /**
   * Repair the brush
   * @param {number} amount - Amount to repair by
   */
  repair(amount) {
    this.durability = Math.min(this.durability + amount, this.maxDurability);
  }

  /**
   * Serialize the brush state
   * @returns {Object} Serialized brush data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      durability: this.durability
    };
  }

  /**
   * Deserialize the brush state
   * @param {Object} data - Serialized brush data
   * @returns {BrushItem} New brush instance
   */
  static fromJSON(data) {
    return new BrushItem(data);
  }
}

module.exports = BrushItem; 