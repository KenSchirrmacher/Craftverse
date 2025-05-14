/**
 * SuspiciousGravelBlock - Implementation of suspicious gravel blocks for archaeology
 */

const BaseBlock = require('../blocks/baseBlock');

class SuspiciousGravelBlock extends BaseBlock {
  constructor(options = {}) {
    super({
      id: 'suspicious_gravel',
      name: 'Suspicious Gravel',
      hardness: 0.6,
      blastResistance: 0.6,
      transparent: false,
      luminance: 0,
      ...options
    });

    this.isExcavated = false;
    this.loot = null;
  }

  /**
   * Check if the block can be excavated
   * @returns {boolean} Whether the block can be excavated
   */
  canBeExcavated() {
    return !this.isExcavated;
  }

  /**
   * Set the block as excavated
   * @param {Object} loot - The loot found in the block
   */
  setExcavated(loot) {
    this.isExcavated = true;
    this.loot = loot;
  }

  /**
   * Get the loot found in the block
   * @returns {Object|null} The loot or null if not excavated
   */
  getLoot() {
    return this.loot;
  }

  /**
   * Serialize the block state
   * @returns {Object} Serialized block data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      isExcavated: this.isExcavated,
      loot: this.loot
    };
  }

  /**
   * Deserialize the block state
   * @param {Object} data - Serialized block data
   * @returns {SuspiciousGravelBlock} New block instance
   */
  static fromJSON(data) {
    const block = new SuspiciousGravelBlock(data);
    block.isExcavated = data.isExcavated || false;
    block.loot = data.loot || null;
    return block;
  }
}

module.exports = SuspiciousGravelBlock; 