/**
 * Shield Item - Implements shield item functionality for the Combat Update
 */

const Item = require('./item');
const Shield = require('./shield');

class ShieldItem extends Item {
  /**
   * Create a new shield item
   * @param {Object} options Item options
   */
  constructor(options = {}) {
    // Set shield-specific options and pass to parent
    super({
      id: options.id || 'shield',
      name: options.name || 'Shield',
      stackable: false,
      maxStackSize: 1,
      durability: options.durability || 336,
      maxDurability: options.maxDurability || 336,
      ...options
    });

    this.type = 'shield';
    this.shield = new Shield({
      id: this.id,
      durability: this.durability,
      maxDurability: this.maxDurability,
      enchantments: this.enchantments || {},
      bannerPattern: options.bannerPattern || null
    });
    
    // Shield can be placed in offhand slot
    this.allowedSlots = ['mainhand', 'offhand'];
    
    // Time it takes to raise the shield (in ticks)
    this.raiseTime = options.raiseTime || 5;
    
    // Currently raising the shield
    this.isRaising = false;
    this.raisingTicks = 0;
  }

  /**
   * Start the use of the shield (right-click)
   * @param {Object} player The player using the shield
   * @returns {boolean} Whether the use started successfully
   */
  startUse(player) {
    if (!this.shield.isUsable() || player.isAttacking) {
      return false;
    }
    
    this.isRaising = true;
    this.raisingTicks = 0;
    
    return true;
  }

  /**
   * Stop the use of the shield (release right-click)
   * @param {Object} player The player using the shield
   */
  stopUse(player) {
    if (this.isRaising) {
      this.isRaising = false;
      this.raisingTicks = 0;
      
      // Notify player shield is lowered
      if (player.isBlocking) {
        player.setBlocking(false);
      }
    }
  }

  /**
   * Update shield state
   * @param {Object} player The player holding the shield
   * @param {number} deltaMs Milliseconds since last update
   */
  update(player, deltaMs) {
    // Update shield status (cooldowns, etc)
    const shieldStateChanged = this.shield.update(deltaMs);
    
    // If shield was disabled and is now enabled, notify player
    if (shieldStateChanged && !this.shield.isDisabled) {
      player.emit('shield:enabled', { itemId: this.id });
    }
    
    // Handle raising shield
    if (this.isRaising) {
      // Convert ms to ticks (20 ticks per second = 50ms per tick)
      const ticksPassed = Math.floor(deltaMs / 50);
      this.raisingTicks += ticksPassed;
      
      // Check if shield is now raised
      if (this.raisingTicks >= this.raiseTime && !player.isBlocking) {
        player.setBlocking(true);
      }
    }
  }

  /**
   * Block incoming damage with the shield
   * @param {Object} player The player using the shield
   * @param {number} damage Amount of damage to block
   * @param {Object} source Source of the damage
   * @returns {Object} Object with blocked amount and remainder
   */
  blockDamage(player, damage, source) {
    // Can only block if shield is fully raised and player is blocking
    if (!player.isBlocking || !this.shield.isUsable()) {
      return { blocked: 0, remainder: damage };
    }
    
    // Calculate blocked damage
    const blockResult = this.shield.calculateBlock(damage);
    
    // Apply damage to shield
    const shieldBroke = this.shield.applyDamage(blockResult.blocked);
    
    // Update item durability to match shield
    this.durability = this.shield.durability;
    
    // Emit events
    player.emit('shield:block', { 
      blocked: blockResult.blocked, 
      remainder: blockResult.remainder,
      shieldBroke 
    });
    
    // If shield broke, stop blocking
    if (shieldBroke) {
      player.setBlocking(false);
      this.isRaising = false;
      this.raisingTicks = 0;
    }
    
    return blockResult;
  }
  
  /**
   * Disable the shield (e.g., from axe hit)
   * @param {Object} player The player using the shield
   * @param {number} ticks Number of ticks to disable for
   */
  disable(player, ticks = 100) {
    // If player was blocking, stop blocking
    if (player.isBlocking) {
      player.setBlocking(false);
    }
    
    this.isRaising = false;
    this.raisingTicks = 0;
    
    // Disable the shield
    this.shield.disable(ticks);
    
    // Emit event
    player.emit('shield:disabled', { 
      itemId: this.id,
      cooldownTicks: ticks 
    });
  }

  /**
   * Apply a banner pattern to the shield
   * @param {Object} bannerPattern Banner pattern data
   */
  applyBannerPattern(bannerPattern) {
    this.shield.applyBannerPattern(bannerPattern);
  }

  /**
   * Repair the shield
   * @param {number} amount Amount to repair
   */
  repair(amount) {
    this.shield.repair(amount);
    this.durability = this.shield.durability;
  }

  /**
   * Convert shield item to JSON representation
   * @returns {Object} JSON representation of shield item
   */
  toJSON() {
    const json = super.toJSON();
    
    return {
      ...json,
      shield: this.shield.toJSON(),
      isRaising: this.isRaising,
      raisingTicks: this.raisingTicks
    };
  }

  /**
   * Create a shield item from JSON data
   * @param {Object} data JSON data
   * @returns {ShieldItem} Shield item instance
   */
  static fromJSON(data) {
    const shieldItem = new ShieldItem({
      id: data.id,
      name: data.name,
      durability: data.durability,
      maxDurability: data.maxDurability,
      enchantments: data.enchantments
    });
    
    if (data.shield) {
      shieldItem.shield = Shield.fromJSON(data.shield);
    }
    
    shieldItem.isRaising = data.isRaising || false;
    shieldItem.raisingTicks = data.raisingTicks || 0;
    
    return shieldItem;
  }
}

module.exports = ShieldItem; 