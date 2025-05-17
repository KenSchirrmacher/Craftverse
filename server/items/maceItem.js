/**
 * Mace Item - New weapon from Minecraft 1.21 Tricky Trials Update
 * Features heavy attack mechanics and armor piercing capabilities
 */
const { ToolItem } = require('./toolItem');

class MaceItem extends ToolItem {
  /**
   * Create a Mace item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'mace',
      name: options.name || 'Mace',
      type: 'mace',
      subtype: 'weapon',
      category: 'combat',
      stackable: false,
      maxStackSize: 1,
      durability: options.durability || 250,
      maxDurability: options.durability || 250,
      attackDamage: options.attackDamage || 7,
      attackSpeed: options.attackSpeed || 0.8, // Slower than sword
      toolType: 'mace',
      material: options.material || 'iron',
      miningLevel: options.miningLevel || 2,
      enchantability: options.enchantability || 14,
      texture: options.texture || 'mace',
      ...options
    });
    
    // Mace-specific properties
    this.heavyAttackMultiplier = options.heavyAttackMultiplier || 2.5; // Damage multiplier for heavy attacks
    this.heavyAttackChargeTicks = options.heavyAttackChargeTicks || 20; // 1 second charge time
    this.heavyAttackCooldownTicks = options.heavyAttackCooldownTicks || 30; // 1.5 second cooldown
    this.armorPiercingPercent = options.armorPiercingPercent || 30; // 30% armor piercing by default
    this.knockbackMultiplier = options.knockbackMultiplier || 1.5; // 50% more knockback
    this.fallDamageMultiplier = options.fallDamageMultiplier || 1.0; // No additional fall damage by default
    
    // Set based on material
    if (this.material === 'netherite') {
      this.attackDamage = 9;
      this.durability = 2031;
      this.maxDurability = 2031;
      this.armorPiercingPercent = 40;
      this.fallDamageMultiplier = 1.5;
    } else if (this.material === 'diamond') {
      this.attackDamage = 8;
      this.durability = 1561;
      this.maxDurability = 1561;
      this.armorPiercingPercent = 35;
      this.fallDamageMultiplier = 1.3;
    } else if (this.material === 'gold') {
      this.attackDamage = 5;
      this.durability = 32;
      this.maxDurability = 32;
      this.armorPiercingPercent = 25;
      this.enchantability = 22;
    } else if (this.material === 'stone') {
      this.attackDamage = 6;
      this.durability = 131;
      this.maxDurability = 131;
      this.armorPiercingPercent = 25;
    } else if (this.material === 'wood') {
      this.attackDamage = 5;
      this.durability = 59;
      this.maxDurability = 59;
      this.armorPiercingPercent = 20;
    }
  }
  
  /**
   * Start charging a heavy attack
   * @param {Object} player - The player charging the attack
   */
  startHeavyAttackCharge(player) {
    if (!player) return;
    
    player.heavyAttackCharging = {
      itemId: this.id,
      startTime: Date.now(),
      chargeTicks: 0,
      maxChargeTicks: this.heavyAttackChargeTicks,
      ready: false
    };
    
    return player.heavyAttackCharging;
  }
  
  /**
   * Update heavy attack charge
   * @param {Object} player - The player charging the attack
   * @param {number} deltaTicks - Number of ticks elapsed
   * @returns {Object} Charge status
   */
  updateHeavyAttackCharge(player, deltaTicks) {
    if (!player || !player.heavyAttackCharging) return null;
    
    const charging = player.heavyAttackCharging;
    if (charging.itemId !== this.id) return charging;
    
    charging.chargeTicks += deltaTicks;
    charging.ready = charging.chargeTicks >= charging.maxChargeTicks;
    
    return charging;
  }
  
  /**
   * Release a heavy attack
   * @param {Object} player - The player performing the attack
   * @param {Object} target - Target entity
   * @returns {Object|null} Attack result or null if cannot attack
   */
  releaseHeavyAttack(player, target) {
    if (!player || !player.heavyAttackCharging) return null;
    
    const charging = player.heavyAttackCharging;
    
    // Check if charge is ready and for the correct weapon
    if (!charging.ready || charging.itemId !== this.id) {
      return null;
    }
    
    // Calculate base damage
    let damage = this.attackDamage;
    
    // Apply heavy attack multiplier if fully charged
    damage *= this.heavyAttackMultiplier;
    
    // Apply armor piercing effect
    const armorPiercing = this.armorPiercingPercent / 100;
    
    // Clear charging state and set cooldown
    player.heavyAttackCharging = null;
    player.heavyAttackCooldown = {
      itemId: this.id,
      ticksRemaining: this.heavyAttackCooldownTicks
    };
    
    // Reduce durability more for heavy attacks
    this.damage(2);
    
    // Apply fall damage modifier if attacking while falling
    let additionalFallDamage = 0;
    if (player.velocity && player.velocity.y < -0.5) {
      additionalFallDamage = Math.abs(player.velocity.y) * this.fallDamageMultiplier;
      damage += additionalFallDamage;
    }
    
    return {
      damage,
      armorPiercing,
      knockbackMultiplier: this.knockbackMultiplier,
      additionalFallDamage,
      isCritical: true,
      heavyAttack: true
    };
  }
  
  /**
   * Regular attack with the mace
   * @param {Object} player - The player attacking
   * @param {Object} target - Target entity
   * @returns {Object} Attack result
   */
  attack(player, target) {
    // Regular attacks still have some armor piercing
    const armorPiercing = this.armorPiercingPercent / 200; // Half effect for regular attacks
    
    // Standard durability reduction
    this.damage(1);
    
    return {
      damage: this.attackDamage,
      armorPiercing,
      knockbackMultiplier: 1.0,
      isCritical: false,
      heavyAttack: false
    };
  }
  
  /**
   * Check if heavy attack is on cooldown
   * @param {Object} player - The player to check
   * @returns {boolean} Whether heavy attack is on cooldown
   */
  isHeavyAttackOnCooldown(player) {
    return !!(player.heavyAttackCooldown && 
              player.heavyAttackCooldown.itemId === this.id && 
              player.heavyAttackCooldown.ticksRemaining > 0);
  }
  
  /**
   * Update cooldown ticks
   * @param {Object} player - The player to update
   * @param {number} deltaTicks - Number of ticks elapsed
   */
  updateCooldown(player, deltaTicks) {
    if (!player || !player.heavyAttackCooldown) return;
    
    if (player.heavyAttackCooldown.itemId === this.id) {
      player.heavyAttackCooldown.ticksRemaining -= deltaTicks;
      
      if (player.heavyAttackCooldown.ticksRemaining <= 0) {
        player.heavyAttackCooldown = null;
      }
    }
  }
  
  /**
   * Get tooltip text for the mace
   * @returns {string[]} Tooltip lines
   */
  getTooltip() {
    const tooltip = super.getTooltip();
    tooltip.push(`${this.attackDamage} Attack Damage`);
    tooltip.push(`${this.attackSpeed} Attack Speed`);
    tooltip.push(`${this.armorPiercingPercent}% Armor Piercing`);
    tooltip.push('Hold to charge a heavy attack');
    return tooltip;
  }
  
  /**
   * Convert item to JSON representation
   * @returns {Object} JSON data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      durability: this.durability,
      maxDurability: this.maxDurability,
      heavyAttackMultiplier: this.heavyAttackMultiplier,
      heavyAttackChargeTicks: this.heavyAttackChargeTicks,
      heavyAttackCooldownTicks: this.heavyAttackCooldownTicks,
      armorPiercingPercent: this.armorPiercingPercent,
      knockbackMultiplier: this.knockbackMultiplier,
      fallDamageMultiplier: this.fallDamageMultiplier
    };
  }
  
  /**
   * Create a mace item from JSON data
   * @param {Object} data - JSON data
   * @returns {MaceItem} Mace item
   */
  static fromJSON(data) {
    return new MaceItem(data);
  }
}

// Define different material variants
class WoodenMaceItem extends MaceItem {
  constructor(options = {}) {
    super({
      id: 'wooden_mace',
      name: 'Wooden Mace',
      material: 'wood',
      ...options
    });
  }
}

class StoneMaceItem extends MaceItem {
  constructor(options = {}) {
    super({
      id: 'stone_mace',
      name: 'Stone Mace',
      material: 'stone',
      ...options
    });
  }
}

class IronMaceItem extends MaceItem {
  constructor(options = {}) {
    super({
      id: 'iron_mace',
      name: 'Iron Mace',
      material: 'iron',
      ...options
    });
  }
}

class GoldenMaceItem extends MaceItem {
  constructor(options = {}) {
    super({
      id: 'golden_mace',
      name: 'Golden Mace',
      material: 'gold',
      ...options
    });
  }
}

class DiamondMaceItem extends MaceItem {
  constructor(options = {}) {
    super({
      id: 'diamond_mace',
      name: 'Diamond Mace',
      material: 'diamond',
      ...options
    });
  }
  
  /**
   * Create a diamond mace item from JSON data
   * @param {Object} data - JSON data
   * @returns {DiamondMaceItem} Diamond mace item
   */
  static fromJSON(data) {
    const mace = new DiamondMaceItem();
    if (data.durability !== undefined) {
      mace.durability = data.durability;
    }
    if (data.maxDurability !== undefined) {
      mace.maxDurability = data.maxDurability;
    }
    return mace;
  }
}

class NetheriteMaceItem extends MaceItem {
  constructor(options = {}) {
    super({
      id: 'netherite_mace',
      name: 'Netherite Mace',
      material: 'netherite',
      ...options
    });
  }
  
  /**
   * Netherite items are immune to fire and lava
   */
  isFireResistant() {
    return true;
  }
  
  /**
   * Netherite items float in lava
   */
  floatsInLava() {
    return true;
  }
  
  /**
   * Create a netherite mace item from JSON data
   * @param {Object} data - JSON data
   * @returns {NetheriteMaceItem} Netherite mace item
   */
  static fromJSON(data) {
    const mace = new NetheriteMaceItem();
    if (data.durability !== undefined) {
      mace.durability = data.durability;
    }
    if (data.maxDurability !== undefined) {
      mace.maxDurability = data.maxDurability;
    }
    return mace;
  }
}

module.exports = {
  MaceItem,
  WoodenMaceItem,
  StoneMaceItem,
  IronMaceItem,
  GoldenMaceItem,
  DiamondMaceItem,
  NetheriteMaceItem
}; 