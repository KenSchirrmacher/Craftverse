/**
 * LightningRodBlock - A block that attracts lightning strikes and emits redstone signals
 */

const Block = require('./block');

class LightningRodBlock extends Block {
  /**
   * Create a new LightningRodBlock
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'lightning_rod',
      name: 'Lightning Rod',
      hardness: 3.0,
      resistance: 6.0, // Changed from blastResistance to match Block class properties
      requiresTool: true,
      toolType: 'pickaxe',
      ...options
    });

    // Lightning attraction properties
    this.attractionRange = 128; // Blocks
    this.powerLevel = 0;
    this.isActive = false;
    this.lastStrikeTime = 0;
    this.cooldown = 100; // Ticks
    
    // Initialize positions
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.z = options.z || 0;
    this.world = options.world || null;
  }

  /**
   * Handle a lightning strike
   * @param {Object} strike - Lightning strike event
   * @param {number} strike.x - X coordinate of strike
   * @param {number} strike.y - Y coordinate of strike
   * @param {number} strike.z - Z coordinate of strike
   * @param {number} currentTime - Current game time in ticks
   * @returns {boolean} Whether the strike was attracted
   */
  handleLightningStrike(strike, currentTime) {
    // Check cooldown
    if (currentTime - this.lastStrikeTime < this.cooldown) {
      return false;
    }

    // Calculate distance to strike
    const dx = strike.x - this.x;
    const dy = strike.y - this.y;
    const dz = strike.z - this.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Check if strike is in range
    if (distance > this.attractionRange) {
      return false;
    }

    // Attract the strike
    this.powerLevel = 15;
    this.isActive = true;
    this.lastStrikeTime = currentTime;

    // Emit redstone signal
    this.emitRedstoneSignal();

    // Convert nearby mobs to charged variants
    this.convertNearbyMobs();

    return true;
  }

  /**
   * Convert nearby mobs to their charged variants
   */
  convertNearbyMobs() {
    if (!this.world) return;
    
    const nearbyMobs = this.world.getEntitiesInRange?.(this.x, this.y, this.z, 4) || [];
    
    for (const mob of nearbyMobs) {
      if (mob && mob.convertToCharged) {
        mob.convertToCharged();
      }
    }
  }

  /**
   * Emit a redstone signal to adjacent blocks
   */
  emitRedstoneSignal() {
    if (!this.world) return;
    
    // Get adjacent blocks
    const adjacentBlocks = this.world.getAdjacentBlocks?.(this.x, this.y, this.z) || [];

    // Update redstone state for each adjacent block
    for (const block of adjacentBlocks) {
      if (block && block.updateRedstoneState) {
        block.updateRedstoneState(this.powerLevel);
      }
    }
    
    // Set the powerEmitted flag for testing
    this.powerEmitted = true;
  }

  /**
   * Update block state
   * @param {number} currentTime - Current game time in ticks
   */
  update(currentTime) {
    // Deactivate after cooldown period
    if (this.isActive && currentTime - this.lastStrikeTime >= this.cooldown) {
      this.isActive = false;
      this.powerLevel = 0;
      this.emitRedstoneSignal();
    }
  }

  /**
   * Get the current redstone power level
   * @returns {number} Power level (0-15)
   */
  getRedstonePower() {
    return this.isActive ? this.powerLevel : 0;
  }

  /**
   * Serialize block state
   * @returns {Object} Serialized block data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      lastStrikeTime: this.lastStrikeTime,
      powerLevel: this.powerLevel,
      isActive: this.isActive
    };
  }

  /**
   * Deserialize block state
   * @param {Object} data - Serialized block data
   * @returns {LightningRodBlock} New block instance
   */
  static fromJSON(data) {
    const block = new LightningRodBlock(data);
    block.lastStrikeTime = data.lastStrikeTime || 0;
    block.powerLevel = data.powerLevel || 0;
    block.isActive = data.isActive || false;
    return block;
  }
}

module.exports = LightningRodBlock; 