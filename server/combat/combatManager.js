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
        default: 10     // 0.5 seconds
      },
      
      // Shield configuration
      shield: {
        blockingDamageReduction: 0.5,  // 50% damage reduction when blocking
        knockbackReduction: 0.8,       // 80% knockback reduction when blocking
        cooldownAfterBreakBlock: 100,  // 5 seconds cooldown after shield is disabled by axe
        durabilityLossPerHit: 1,       // Durability lost per hit blocked
        maxUsageTicks: 400             // Maximum shield usage time (20 seconds)
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
    
    this.emit('shieldActivated', { playerId, shieldItem });
    return true;
  }
  
  /**
   * Deactivate a player's shield
   * @param {string} playerId - Player ID
   */
  deactivateShield(playerId) {
    const shieldData = this.activeShields.get(playerId);
    if (shieldData) {
      shieldData.active = false;
      shieldData.usageTicks = 0;
      this.emit('shieldDeactivated', { playerId });
    }
  }
  
  /**
   * Disable a player's shield (after axe hit)
   * @param {string} playerId - Player ID
   */
  disableShield(playerId) {
    const shieldData = this.activeShields.get(playerId);
    if (shieldData) {
      shieldData.active = false;
      shieldData.disabled = true;
      shieldData.cooldown = this.config.shield.cooldownAfterBreakBlock;
      this.emit('shieldDisabled', { playerId });
    }
  }
  
  /**
   * Check if a player's shield is active
   * @param {string} playerId - Player ID
   * @returns {boolean} - Whether shield is active
   */
  isShieldActive(playerId) {
    const shieldData = this.activeShields.get(playerId);
    return shieldData ? shieldData.active : false;
  }
  
  /**
   * Handle a shield blocking an attack
   * @param {string} playerId - Player ID
   * @param {number} damage - Incoming damage amount
   * @returns {Object} - Modified damage and shield data
   */
  handleShieldBlock(playerId, damage) {
    const shieldData = this.activeShields.get(playerId);
    if (!shieldData || !shieldData.active) {
      return { damage, blocked: false };
    }
    
    // Calculate reduced damage
    const reducedDamage = damage * (1 - this.config.shield.blockingDamageReduction);
    
    // Apply durability loss to shield
    const shield = shieldData.item;
    if (shield.durability) {
      shield.durability = Math.max(0, shield.durability - this.config.shield.durabilityLossPerHit);
      
      // Check if shield broke
      if (shield.durability <= 0) {
        this.deactivateShield(playerId);
        this.offhandItems.delete(playerId);
        this.emit('shieldBroken', { playerId });
      }
    }
    
    return {
      damage: reducedDamage,
      blocked: true,
      knockbackReduction: this.config.shield.knockbackReduction
    };
  }
  
  /**
   * Handle a player attacking with a tipped arrow
   * @param {string} playerId - Player ID
   * @param {Object} arrowData - Arrow data
   * @param {Object} arrowData.effects - Effects to apply
   * @returns {Object} - Modified arrow data
   */
  processTippedArrow(playerId, arrowData) {
    // Just pass through for now - will be enhanced when implementing tipped arrows
    return arrowData;
  }
  
  /**
   * Process an attack by a player
   * @param {string} playerId - Attacking player ID
   * @param {string} targetId - Target entity ID
   * @param {Object} attackData - Attack data
   * @returns {Object} - Modified attack data
   */
  processAttack(playerId, targetId, attackData) {
    // Apply attack cooldown damage multiplier
    const damageMultiplier = this.getDamageMultiplier(playerId);
    
    // Start a new cooldown
    this.startAttackCooldown(playerId, attackData.itemId);
    
    // Apply damage multiplier
    attackData.damage = attackData.baseDamage * damageMultiplier;
    
    // Check if target is blocking with shield
    if (this.isShieldActive(targetId)) {
      const blockResult = this.handleShieldBlock(targetId, attackData.damage);
      
      // Update damage and knockback
      attackData.damage = blockResult.damage;
      if (blockResult.blocked) {
        attackData.knockback *= (1 - blockResult.knockbackReduction);
        
        // Check if attacking with axe to disable shield
        if (this.getWeaponType(attackData.itemId) === 'axe') {
          this.disableShield(targetId);
        }
      }
    }
    
    return attackData;
  }
  
  /**
   * Reset all cooldowns (e.g., for testing)
   */
  resetAllCooldowns() {
    this.attackCooldowns.clear();
    this.activeShields.clear();
  }
}

module.exports = CombatManager; 