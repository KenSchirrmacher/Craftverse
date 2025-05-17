/**
 * Wind Charge Item - Projectile item from Minecraft 1.21 Tricky Trials Update
 * Can be used to launch a wind charge, which moves blocks and damages entities
 */
const Item = require('./item');
const { v4: uuidv4 } = require('uuid');

class WindChargeItem extends Item {
  /**
   * Create a Wind Charge item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: 'wind_charge',
      name: 'Wind Charge',
      type: 'wind_charge',
      subtype: 'throwable',
      category: 'combat',
      stackable: true,
      maxStackSize: 16,
      texture: 'wind_charge',
      description: 'A powerful projectile that can push blocks and entities',
      ...options
    });
    
    // Wind charge specific properties
    this.damage = options.damage || 5;
    this.moveDistance = options.moveDistance || 1;
    this.explosionRadius = options.explosionRadius || 1.5;
    this.cooldown = 20; // 1 second cooldown (20 ticks)
  }
  
  /**
   * Use the wind charge
   * @param {Object} player - The player using the item
   * @param {Object} context - Use context
   * @returns {Object|boolean} Wind charge entity data or false if unsuccessful
   */
  use(player, context) {
    // Check cooldown
    const lastUseTime = player.cooldowns?.wind_charge || 0;
    const currentTime = Date.now();
    
    if (currentTime - lastUseTime < this.cooldown * 50) {
      return false;
    }
    
    // Set cooldown
    if (player.cooldowns) {
      player.cooldowns.wind_charge = currentTime;
    }
    
    // Calculate direction based on player look direction
    const direction = player.getLookDirection ? player.getLookDirection() : {
      x: -Math.sin(player.rotation.y) * Math.cos(player.rotation.x),
      y: -Math.sin(player.rotation.x),
      z: Math.cos(player.rotation.y) * Math.cos(player.rotation.x)
    };
    
    // Create wind charge entity
    const windChargeData = {
      id: uuidv4(),
      type: 'wind_charge_entity',
      position: {
        x: player.position.x,
        y: player.position.y + 1.6, // Eye height
        z: player.position.z
      },
      direction: direction,
      shooter: player.id,
      damage: this.damage,
      velocity: 1.5,
      gravity: 0.03,
      radius: this.explosionRadius,
      moveDistance: this.moveDistance
    };
    
    // In Creative mode, don't consume the item
    if (player.gameMode !== 'creative') {
      // If the item has a count, reduce it
      if (context.itemStack && context.itemStack.count) {
        context.itemStack.count--;
      }
    }
    
    return windChargeData;
  }
  
  /**
   * Get tooltip text for the wind charge
   * @returns {string[]} Tooltip lines
   */
  getTooltip() {
    const tooltip = super.getTooltip();
    tooltip.push(`Damage: ${this.damage}`);
    tooltip.push('Pushes entities and blocks');
    return tooltip;
  }
  
  /**
   * Convert item to JSON representation
   * @returns {Object} JSON data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      damage: this.damage,
      moveDistance: this.moveDistance,
      explosionRadius: this.explosionRadius
    };
  }
  
  /**
   * Create a wind charge item from JSON data
   * @param {Object} data - JSON data
   * @returns {WindChargeItem} Wind charge item
   */
  static fromJSON(data) {
    return new WindChargeItem({
      damage: data.damage,
      moveDistance: data.moveDistance,
      explosionRadius: data.explosionRadius
    });
  }
}

module.exports = WindChargeItem; 