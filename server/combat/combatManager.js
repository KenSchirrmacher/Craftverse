/**
 * CombatManager - Manages combat mechanics including attack cooldown, dual wielding, and shields
 */

const EventEmitter = require('events');

class CombatManager extends EventEmitter {
  /**
   * Create a new Combat Manager
   * @param {Object} options - Configuration options
   * @param {Object} options.server - Server instance for emitting events
   * @param {Object} options.statusEffectsManager - Status effects manager
   */
  constructor(options = {}) {
    super();
    this.server = options.server;
    this.statusEffectsManager = options.statusEffectsManager;
    
    // Track player attack cooldowns
    this.attackCooldowns = new Map();
    
    // Track player offhand items
    this.offhandItems = new Map();
    
    // Track active shields
    this.activeShields = new Map();
    
    // Track heavy attack charging
    this.heavyAttackCharges = new Map();
    
    // Configuration
    this.config = {
      // Attack cooldown in ticks (20 ticks = 1 second)
      baseCooldown: 10, // 0.5 seconds base cooldown
      
      // Attack damage multipliers based on cooldown progress (0-1)
      damageCurve: [
        { threshold: 0.1, multiplier: 0.2 },  // 0-10% cooldown = 20% damage
        { threshold: 0.5, multiplier: 0.5 },  // 10-50% cooldown = 50% damage
        { threshold: 0.9, multiplier: 0.8 },  // 50-90% cooldown = 80% damage
        { threshold: 1.0, multiplier: 1.0 }   // 90-100% cooldown = 100% damage
      ],
      
      // Weapon type cooldowns (in ticks)
      weaponCooldowns: {
        sword: 10,      // 0.5 seconds
        axe: 16,        // 0.8 seconds
        pickaxe: 14,    // 0.7 seconds
        shovel: 12,     // 0.6 seconds
        hoe: 10,        // 0.5 seconds
        mace: 18,       // 0.9 seconds
        default: 10     // 0.5 seconds
      },
      
      // Shield configuration
      shield: {
        blockingDamageReduction: 0.5,  // 50% damage reduction when blocking
        knockbackReduction: 0.8,       // 80% knockback reduction when blocking
        cooldownAfterBreakBlock: 100,  // 5 seconds cooldown after shield is disabled by axe
        durabilityLossPerHit: 1,       // Durability lost per hit blocked
        maxUsageTicks: 400             // Maximum shield usage time (20 seconds)
      },
      
      // Heavy attack configuration
      heavyAttack: {
        chargeFeedbackTicks: 5,        // Send feedback every 5 ticks during charging
        maxChargeTicks: 20,            // 1 second max charge time
        cooldownTicks: 30,             // 1.5 second cooldown after heavy attack
        damageMultiplier: 2.5,         // Default damage multiplier
        knockbackMultiplier: 1.5       // Default knockback multiplier
      }
    };
    
    // Set up tick handler for cooldowns
    this.lastTickTime = Date.now();
  }
  
  /**
   * Process a tick update to manage cooldowns and shields
   * @param {number} deltaTime - Time since last tick in milliseconds
   */
  tick(deltaTime) {
    const deltaTicks = deltaTime * 20 / 1000; // Convert to ticks (1 tick = 50ms)
    
    // Update attack cooldowns
    for (const [playerId, cooldown] of this.attackCooldowns.entries()) {
      cooldown.ticks -= deltaTicks;
      
      if (cooldown.ticks <= 0) {
        this.attackCooldowns.delete(playerId);
        this.emit('attackCooldownExpired', { playerId });
      }
    }
    
    // Update shield usage
    for (const [playerId, shieldData] of this.activeShields.entries()) {
      if (shieldData.disabled) {
        shieldData.cooldown -= deltaTicks;
        if (shieldData.cooldown <= 0) {
          // Shield is re-enabled
          shieldData.disabled = false;
          shieldData.cooldown = 0;
          this.emit('shieldReady', { playerId });
        }
      } else if (shieldData.active) {
        shieldData.usageTicks += deltaTicks;
        // Check if shield has been used too long
        if (shieldData.usageTicks >= this.config.shield.maxUsageTicks) {
          this.deactivateShield(playerId);
        }
      }
    }
    
    // Update heavy attack charging
    for (const [playerId, chargeData] of this.heavyAttackCharges.entries()) {
      chargeData.chargeTicks += deltaTicks;
      
      // Send periodic feedback during charging
      if (Math.floor(chargeData.chargeTicks / this.config.heavyAttack.chargeFeedbackTicks) >
          Math.floor((chargeData.chargeTicks - deltaTicks) / this.config.heavyAttack.chargeFeedbackTicks)) {
        
        const chargePercent = Math.min(100, Math.floor((chargeData.chargeTicks / this.config.heavyAttack.maxChargeTicks) * 100));
        this.emit('heavyAttackCharging', { 
          playerId, 
          itemId: chargeData.itemId,
          chargeTicks: chargeData.chargeTicks,
          maxChargeTicks: this.config.heavyAttack.maxChargeTicks,
          chargePercent 
        });
      }
      
      // Check if fully charged
      if (chargeData.chargeTicks >= this.config.heavyAttack.maxChargeTicks && !chargeData.ready) {
        chargeData.ready = true;
        this.emit('heavyAttackReady', { 
          playerId, 
          itemId: chargeData.itemId
        });
      }
    }
    
    // Update heavy attack cooldowns
    for (const [playerId, cooldownData] of (this.heavyAttackCooldowns || new Map()).entries()) {
      cooldownData.ticksRemaining -= deltaTicks;
      
      if (cooldownData.ticksRemaining <= 0) {
        // Heavy attack is available again
        this.heavyAttackCooldowns.delete(playerId);
        this.emit('heavyAttackAvailable', { playerId, itemId: cooldownData.itemId });
      }
    }
  }
  
  /**
   * Get weapon type from item ID
   * @param {string} itemId - The item ID
   * @returns {string} - Weapon type or 'default'
   */
  getWeaponType(itemId) {
    if (!itemId) return 'default';
    
    if (itemId.includes('sword')) return 'sword';
    if (itemId.includes('axe')) return 'axe';
    if (itemId.includes('pickaxe')) return 'pickaxe';
    if (itemId.includes('shovel')) return 'shovel';
    if (itemId.includes('hoe')) return 'hoe';
    if (itemId.includes('mace')) return 'mace';
    
    return 'default';
  }
  
  /**
   * Calculate attack cooldown for a weapon
   * @param {string} itemId - Weapon item ID
   * @returns {number} - Cooldown in ticks
   */
  getWeaponCooldown(itemId) {
    const weaponType = this.getWeaponType(itemId);
    return this.config.weaponCooldowns[weaponType] || this.config.weaponCooldowns.default;
  }
  
  /**
   * Start attack cooldown for a player
   * @param {string} playerId - Player ID
   * @param {string} itemId - Weapon item ID
   */
  startAttackCooldown(playerId, itemId) {
    const baseCooldown = this.getWeaponCooldown(itemId);
    
    // Check for haste/mining fatigue effects
    let cooldownMultiplier = 1.0;
    if (this.statusEffectsManager) {
      // Haste decreases cooldown (faster attack)
      const hasteEffect = this.statusEffectsManager.getEffect(playerId, 'haste');
      if (hasteEffect) {
        cooldownMultiplier *= (1 - (hasteEffect.level * 0.1)); // 10% reduction per level
      }
      
      // Mining fatigue increases cooldown (slower attack)
      const fatigueEffect = this.statusEffectsManager.getEffect(playerId, 'mining_fatigue');
      if (fatigueEffect) {
        cooldownMultiplier *= (1 + (fatigueEffect.level * 0.1)); // 10% increase per level
      }
    }
    
    const cooldownTicks = Math.max(1, baseCooldown * cooldownMultiplier);
    
    this.attackCooldowns.set(playerId, {
      ticks: cooldownTicks,
      maxTicks: cooldownTicks,
      itemId: itemId
    });
    
    this.emit('attackCooldownStarted', { 
      playerId, 
      cooldownTicks,
      maxCooldownTicks: cooldownTicks 
    });
    
    return cooldownTicks;
  }
  
  /**
   * Get current attack cooldown progress for a player
   * @param {string} playerId - Player ID
   * @returns {Object} - Cooldown info or null if no cooldown
   */
  getAttackCooldown(playerId) {
    const cooldown = this.attackCooldowns.get(playerId);
    if (!cooldown) return null;
    
    return {
      remainingTicks: cooldown.ticks,
      maxTicks: cooldown.maxTicks,
      progress: 1 - (cooldown.ticks / cooldown.maxTicks),
      itemId: cooldown.itemId
    };
  }
  
  /**
   * Calculate damage multiplier based on cooldown progress
   * @param {string} playerId - Player ID
   * @returns {number} - Damage multiplier (0-1)
   */
  getDamageMultiplier(playerId) {
    const cooldown = this.getAttackCooldown(playerId);
    
    // If no cooldown or complete cooldown, full damage
    if (!cooldown || cooldown.progress >= 1) {
      return 1.0;
    }
    
    // Find the right damage multiplier from the curve
    for (let i = 0; i < this.config.damageCurve.length; i++) {
      const point = this.config.damageCurve[i];
      if (cooldown.progress <= point.threshold) {
        return point.multiplier;
      }
    }
    
    return 1.0; // Default to full damage
  }
  
  /**
   * Set an item in player's offhand
   * @param {string} playerId - Player ID
   * @param {Object} item - Item to put in offhand
   */
  setOffhandItem(playerId, item) {
    this.offhandItems.set(playerId, item);
    this.emit('offhandItemChanged', { playerId, item });
  }
  
  /**
   * Get item in player's offhand
   * @param {string} playerId - Player ID
   * @returns {Object} - Offhand item or null
   */
  getOffhandItem(playerId) {
    return this.offhandItems.get(playerId) || null;
  }
  
  /**
   * Activate a shield for blocking
   * @param {string} playerId - Player ID
   * @param {Object} shieldItem - Shield item
   * @returns {boolean} - Whether shield was activated
   */
  activateShield(playerId, shieldItem) {
    // Check if shield is on cooldown
    const shieldData = this.activeShields.get(playerId);
    if (shieldData && shieldData.disabled) {
      return false;
    }
    
    // Create or update shield data
    this.activeShields.set(playerId, {
      active: true,
      disabled: false,
      item: shieldItem,
      cooldown: 0,
      usageTicks: 0
    });
    
    this.emit('shieldActivated', { playerId });
    return true;
  }
  
  /**
   * Start charging a heavy attack
   * @param {string} playerId - Player ID
   * @param {string} itemId - The item ID of the mace
   * @returns {Object} - Charge data
   */
  startHeavyAttackCharge(playerId, itemId) {
    // Check if player already has a heavy attack cooldown
    if (this.heavyAttackCooldowns && this.heavyAttackCooldowns.has(playerId)) {
      const cooldown = this.heavyAttackCooldowns.get(playerId);
      if (cooldown.itemId === itemId && cooldown.ticksRemaining > 0) {
        // Still on cooldown
        return { cooldown: true, ticksRemaining: cooldown.ticksRemaining };
      }
    }
    
    // Initialize cooldowns map if needed
    if (!this.heavyAttackCooldowns) {
      this.heavyAttackCooldowns = new Map();
    }
    
    // Start charging
    const chargeData = {
      itemId,
      startTime: Date.now(),
      chargeTicks: 0,
      maxChargeTicks: this.config.heavyAttack.maxChargeTicks,
      ready: false
    };
    
    this.heavyAttackCharges.set(playerId, chargeData);
    this.emit('heavyAttackChargeStarted', { playerId, itemId });
    
    return chargeData;
  }
  
  /**
   * Get current heavy attack charge progress
   * @param {string} playerId - Player ID
   * @returns {Object|null} - Charge info or null if not charging
   */
  getHeavyAttackCharge(playerId) {
    const charge = this.heavyAttackCharges.get(playerId);
    if (!charge) return null;
    
    return {
      chargeTicks: charge.chargeTicks,
      maxChargeTicks: charge.maxChargeTicks,
      progress: Math.min(1, charge.chargeTicks / charge.maxChargeTicks),
      ready: charge.ready,
      itemId: charge.itemId
    };
  }
  
  /**
   * Release a heavy attack
   * @param {string} playerId - Player ID
   * @param {string} targetId - Target entity ID
   * @param {Object} attackData - Attack data from weapon
   * @returns {Object|null} - Attack result or null if failed
   */
  releaseHeavyAttack(playerId, targetId, attackData) {
    const charge = this.heavyAttackCharges.get(playerId);
    if (!charge) return null;
    
    // Remove charge data
    this.heavyAttackCharges.delete(playerId);
    
    // If not ready, return null
    if (!charge.ready) {
      this.emit('heavyAttackFailed', { playerId, reason: 'not_charged' });
      return null;
    }
    
    // Set cooldown
    this.heavyAttackCooldowns.set(playerId, {
      itemId: charge.itemId,
      ticksRemaining: this.config.heavyAttack.cooldownTicks
    });
    
    // Apply attack effects
    const damageMultiplier = attackData.damageMultiplier || this.config.heavyAttack.damageMultiplier;
    const knockbackMultiplier = attackData.knockbackMultiplier || this.config.heavyAttack.knockbackMultiplier;
    
    // Calculate armor piercing effect
    const armorPiercing = attackData.armorPiercing || 0;
    
    // Process attack
    const result = this.processAttack(playerId, targetId, {
      ...attackData,
      damageMultiplier,
      knockbackMultiplier,
      armorPiercing,
      isHeavyAttack: true
    });
    
    this.emit('heavyAttackReleased', { 
      playerId, 
      targetId,
      damage: result.finalDamage,
      armorPiercing
    });
    
    return result;
  }
  
  /**
   * Cancel a heavy attack charge
   * @param {string} playerId - Player ID
   */
  cancelHeavyAttackCharge(playerId) {
    const charge = this.heavyAttackCharges.get(playerId);
    if (!charge) return;
    
    this.heavyAttackCharges.delete(playerId);
    this.emit('heavyAttackCancelled', { playerId });
  }
  
  /**
   * Deactivate a shield
   * @param {string} playerId - Player ID
   */
  deactivateShield(playerId) {
    const shieldData = this.activeShields.get(playerId);
    if (shieldData && shieldData.active) {
      shieldData.active = false;
      shieldData.usageTicks = 0;
      this.emit('shieldDeactivated', { playerId });
    }
  }
  
  /**
   * Disable a shield (after being hit by an axe)
   * @param {string} playerId - Player ID
   */
  disableShield(playerId) {
    const shieldData = this.activeShields.get(playerId);
    if (shieldData) {
      shieldData.active = false;
      shieldData.disabled = true;
      shieldData.cooldown = this.config.shield.cooldownAfterBreakBlock;
      shieldData.usageTicks = 0;
      this.emit('shieldDisabled', { playerId, cooldownTicks: shieldData.cooldown });
    }
  }
  
  /**
   * Check if shield is active for a player
   * @param {string} playerId - Player ID
   * @returns {boolean} - Whether shield is active
   */
  isShieldActive(playerId) {
    const shieldData = this.activeShields.get(playerId);
    return !!(shieldData && shieldData.active && !shieldData.disabled);
  }
  
  /**
   * Handle shield blocking an attack
   * @param {string} playerId - Player ID
   * @param {number} damage - Incoming damage
   * @returns {Object} - Blocked damage info
   */
  handleShieldBlock(playerId, damage) {
    const shieldData = this.activeShields.get(playerId);
    if (!shieldData || !shieldData.active || shieldData.disabled) {
      return { blocked: false, damage };
    }
    
    // Calculate reduced damage
    const reducedDamage = damage * (1 - this.config.shield.blockingDamageReduction);
    
    // Reduce shield durability
    if (shieldData.item && shieldData.item.reduceDurability) {
      const durabilityLoss = this.config.shield.durabilityLossPerHit;
      const shieldBroke = shieldData.item.reduceDurability(durabilityLoss);
      
      if (shieldBroke) {
        this.deactivateShield(playerId);
        this.emit('shieldBroken', { playerId });
      }
    }
    
    this.emit('shieldBlocked', { 
      playerId, 
      originalDamage: damage, 
      reducedDamage 
    });
    
    return {
      blocked: true,
      damage: reducedDamage,
      reduction: damage - reducedDamage,
      reductionPercent: this.config.shield.blockingDamageReduction * 100
    };
  }
  
  /**
   * Handle a player attacking with a tipped arrow
   * @param {string} playerId - Player ID
   * @param {Object} arrowData - Arrow data
   */
  processTippedArrow(playerId, arrowData) {
    // Add status effects to the target if hit
    if (arrowData.hit && arrowData.targetId && this.statusEffectsManager) {
      const effects = arrowData.effects || [];
      
      for (const effect of effects) {
        this.statusEffectsManager.addEffect(arrowData.targetId, effect.type, effect.level, effect.duration);
      }
    }
  }
  
  /**
   * Process an attack
   * @param {string} playerId - Attacking player ID
   * @param {string} targetId - Target entity ID
   * @param {Object} attackData - Attack data
   * @returns {Object} - Attack result
   */
  processAttack(playerId, targetId, attackData) {
    // Start attack cooldown if not a heavy attack
    if (!attackData.isHeavyAttack) {
      this.startAttackCooldown(playerId, attackData.itemId);
    }
    
    // Get damage multiplier from cooldown (only for regular attacks)
    let damageMultiplier = attackData.isHeavyAttack ? 
      (attackData.damageMultiplier || 1.0) : 
      this.getDamageMultiplier(playerId);
    
    // Base damage
    let damage = attackData.damage || 1;
    
    // Apply damage multiplier
    damage *= damageMultiplier;
    
    // Check for critical hit
    const isCritical = attackData.isCritical || false;
    if (isCritical) {
      damage *= 1.5; // 50% more damage for critical hits
    }
    
    // Apply knockback
    const knockbackMultiplier = attackData.knockbackMultiplier || 1.0;
    
    // Calculate final damage accounting for armor piercing
    let finalDamage = damage;
    const armorPiercing = attackData.armorPiercing || 0;
    
    // Emit attack event
    this.emit('attackProcessed', {
      playerId,
      targetId,
      damage: finalDamage,
      isCritical,
      knockbackMultiplier,
      armorPiercing: armorPiercing * 100, // Convert to percentage
      isHeavyAttack: attackData.isHeavyAttack || false
    });
    
    return {
      finalDamage,
      isCritical,
      knockbackMultiplier,
      armorPiercing
    };
  }
  
  /**
   * Reset all cooldowns (for testing)
   */
  resetAllCooldowns() {
    this.attackCooldowns.clear();
    this.activeShields.clear();
    this.heavyAttackCharges.clear();
    if (this.heavyAttackCooldowns) {
      this.heavyAttackCooldowns.clear();
    }
  }
}

module.exports = CombatManager; 