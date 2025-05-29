/**
 * ItemStack - Represents a stack of items in the game
 */

const Item = require('./item');

class ItemStack {
  /**
   * Create a new item stack
   * @param {string|Object} id - Item ID or options object
   * @param {Object} options - Stack options
   */
  constructor(id, options = {}) {
    // Handle case where id is an options object
    if (typeof id === 'object') {
      options = id;
      id = options.id;
    }

    this.item = new Item(id, options);
    this.count = options.count || 1;
    this.maxStackSize = this.item.maxStackSize;
  }

  /**
   * Check if this stack can be merged with another stack
   * @param {ItemStack} other - The other stack
   * @returns {boolean} Whether the stacks can be merged
   */
  canStackWith(other) {
    if (!other) return false;
    return this.item.canStackWith(other.item) && this.count < this.maxStackSize;
  }

  /**
   * Merge another stack into this one
   * @param {ItemStack} other - The stack to merge
   * @returns {number} The number of items that couldn't be merged
   */
  merge(other) {
    if (!this.canStackWith(other)) return other.count;

    const spaceLeft = this.maxStackSize - this.count;
    const amountToMerge = Math.min(spaceLeft, other.count);
    
    this.count += amountToMerge;
    other.count -= amountToMerge;

    return other.count;
  }

  /**
   * Split this stack into two stacks
   * @param {number} amount - The amount to split off
   * @returns {ItemStack} The new stack
   */
  split(amount) {
    if (amount >= this.count) return null;
    
    const newStack = new ItemStack(this.item.id, {
      count: amount,
      ...this.item
    });
    
    this.count -= amount;
    return newStack;
  }

  /**
   * Convert stack to JSON representation
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.item.id,
      count: this.count,
      ...this.item.toJSON()
    };
  }

  /**
   * Create an ItemStack from JSON data
   * @param {Object} data - JSON data
   * @returns {ItemStack} New ItemStack instance
   */
  static fromJSON(data) {
    return new ItemStack(data.id, {
      count: data.count,
      ...data
    });
  }
}

module.exports = { ItemStack }; 