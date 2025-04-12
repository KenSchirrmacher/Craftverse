/**
 * Shield - Implements shield mechanics for the Combat Update
 */

class Shield {
  /**
   * Create a new shield
   * @param {Object} options Shield options
   * @param {string} options.id Shield identifier
   * @param {number} options.maxDurability Maximum durability of the shield
   * @param {number} options.durability Current durability of the shield
   * @param {number} options.blockAmount Percentage of damage to block (0-1)
   * @param {Object} options.enchantments Shield enchantments
   */
  constructor(options = {}) {
    this.id = options.id || 'shield';
    this.maxDurability = options.maxDurability || 336;
    this.durability = options.durability || this.maxDurability;
    this.blockAmount = options.blockAmount || 0.75; // Block 75% of damage by default
    this.enchantments = options.enchantments || {};
    this.bannerPattern = options.bannerPattern || null;
    this.cooldownTicks = 0;
    this.isDisabled = false;
  }

  /**
   * Check if shield is usable (has durability and not disabled)
   * @returns {boolean} True if shield is usable
   */
  isUsable() {
    return this.durability > 0 && !this.isDisabled;
  }

  /**
   * Calculate the amount of damage that will be blocked
   * @param {number} incomingDamage Incoming damage amount
   * @returns {Object} Object with blocked amount and remainder
   */
  calculateBlock(incomingDamage) {
    if (!this.isUsable()) {
      return { blocked: 0, remainder: incomingDamage };
    }

    let blockModifier = this.blockAmount;
    
    // Apply unbreaking enchantment if present
    const unbreakingLevel = this.enchantments.unbreaking || 0;
    if (unbreakingLevel > 0) {
      blockModifier += 0.05 * unbreakingLevel; // 5% more blocking per level
    }
    
    const blockedAmount = Math.min(incomingDamage * blockModifier, incomingDamage);
    const remainderDamage = incomingDamage - blockedAmount;
    
    return {
      blocked: blockedAmount,
      remainder: remainderDamage
    };
  }

  /**
   * Damage the shield when blocking
   * @param {number} amount Amount of damage blocked
   * @returns {boolean} True if shield broke
   */
  applyDamage(amount) {
    if (!this.isUsable()) {
      return false;
    }
    
    // Calculate durability loss (1 point per 4 damage blocked)
    let durabilityLoss = Math.ceil(amount / 4);
    
    // Apply unbreaking enchantment if present
    const unbreakingLevel = this.enchantments.unbreaking || 0;
    if (unbreakingLevel > 0) {
      // Each level reduces durability loss
      const reduction = 1 - (1 / (unbreakingLevel + 1));
      durabilityLoss = Math.ceil(durabilityLoss * (1 - reduction));
    }
    
    // Ensure at least 1 durability point is lost
    durabilityLoss = Math.max(1, durabilityLoss);
    
    // Apply damage
    this.durability -= durabilityLoss;
    
    // Check if shield broke
    if (this.durability <= 0) {
      this.durability = 0;
      return true; // Shield broke
    }
    
    return false; // Shield didn't break
  }

  /**
   * Disable the shield (axe hit)
   * @param {number} ticks Number of ticks to disable for
   */
  disable(ticks = 100) {
    this.isDisabled = true;
    this.cooldownTicks = ticks;
  }

  /**
   * Update shield state (cooldowns)
   * @param {number} deltaMs Milliseconds since last update
   * @returns {boolean} True if shield state changed (enabled/disabled)
   */
  update(deltaMs) {
    if (!this.isDisabled || this.cooldownTicks <= 0) {
      return false;
    }
    
    // Convert ms to ticks (20 ticks per second = 50ms per tick)
    const ticksPassed = Math.floor(deltaMs / 50);
    
    // Update cooldown
    this.cooldownTicks = Math.max(0, this.cooldownTicks - ticksPassed);
    
    // Check if disabled state changed
    if (this.cooldownTicks <= 0) {
      this.isDisabled = false;
      return true; // State changed
    }
    
    return false;
  }

  /**
   * Repair shield durability
   * @param {number} amount Amount to repair
   */
  repair(amount) {
    this.durability = Math.min(this.maxDurability, this.durability + amount);
  }

  /**
   * Apply a banner pattern to the shield
   * @param {Object} bannerPattern Banner pattern data
   */
  applyBannerPattern(bannerPattern) {
    this.bannerPattern = bannerPattern;
  }

  /**
   * Get remaining cooldown time in seconds
   * @returns {number} Remaining cooldown in seconds
   */
  getCooldownSeconds() {
    return this.cooldownTicks / 20; // 20 ticks per second
  }

  /**
   * Convert shield to JSON representation
   * @returns {Object} JSON representation of shield
   */
  toJSON() {
    return {
      id: this.id,
      durability: this.durability,
      maxDurability: this.maxDurability,
      enchantments: this.enchantments,
      bannerPattern: this.bannerPattern,
      isDisabled: this.isDisabled,
      cooldownTicks: this.cooldownTicks
    };
  }

  /**
   * Create a shield from JSON data
   * @param {Object} data JSON data
   * @returns {Shield} Shield instance
   */
  static fromJSON(data) {
    return new Shield({
      id: data.id,
      durability: data.durability,
      maxDurability: data.maxDurability,
      enchantments: data.enchantments,
      bannerPattern: data.bannerPattern
    });
  }
}

module.exports = Shield; 