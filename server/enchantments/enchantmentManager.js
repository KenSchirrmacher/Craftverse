/**
 * Enchantment Manager - Handles applying enchantments, generating enchantment options,
 * and calculating enchantment effects.
 */

const { 
  EnchantmentTypes, 
  EnchantmentRarity, 
  getValidEnchantmentsForItem, 
  doEnchantmentsConflict,
  calculateEnchantmentCost
} = require('./enchantmentTypes');

class EnchantmentManager {
  constructor() {
    this.randomSeed = Math.floor(Math.random() * 10000);
    this.tableRNG = this.createRNG(this.randomSeed);
    
    // Initialize cache for enchantment calculations
    this.enchantmentOptionsCache = new Map();
    this.MAX_CACHE_SIZE = 100;
  }
  
  /**
   * Create a simple deterministic RNG for consistent enchantment results
   * @param {number} seed - Random seed
   * @returns {Function} - RNG function
   */
  createRNG(seed) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
  
  /**
   * Apply an enchantment to an item
   * @param {Object} item - Item to enchant
   * @param {string} enchantmentId - ID of the enchantment to apply
   * @param {number} level - Level of enchantment to apply
   * @param {boolean} force - Whether to force the enchantment even if it's invalid or conflicts
   * @returns {Object} - Enchanted item or null if enchantment failed
   */
  applyEnchantment(item, enchantmentId, level, force = false) {
    // Initialize enchantments array if not present
    if (!item.enchantments) {
      item.enchantments = [];
    }
    
    // Get enchantment from ID
    const enchantment = Object.values(EnchantmentTypes).find(e => e.id === enchantmentId);
    if (!enchantment) {
      console.warn(`Unknown enchantment: ${enchantmentId}`);
      return null;
    }
    
    // Validate enchantment level
    if (level < 1 || level > enchantment.maxLevel) {
      if (!force) {
        console.warn(`Invalid enchantment level: ${level} for ${enchantmentId}`);
        return null;
      }
      // Clamp level if forced
      level = Math.max(1, Math.min(level, enchantment.maxLevel));
    }
    
    // Check if the item can be enchanted with this enchantment
    if (!this.canEnchantItemWith(item, enchantment) && !force) {
      console.warn(`Item ${item.type} cannot be enchanted with ${enchantmentId}`);
      return null;
    }
    
    // Check for conflicting enchantments
    const conflictingEnchantment = item.enchantments.find(
      e => doEnchantmentsConflict(
        { id: e.id, conflicts: EnchantmentTypes[e.id.toUpperCase()]?.conflicts || [] },
        enchantment
      )
    );
    
    if (conflictingEnchantment && !force) {
      console.warn(`Enchantment ${enchantmentId} conflicts with existing enchantment ${conflictingEnchantment.id}`);
      return null;
    }
    
    // Check if the enchantment already exists on the item
    const existingEnchantmentIndex = item.enchantments.findIndex(e => e.id === enchantmentId);
    
    if (existingEnchantmentIndex >= 0) {
      // Update level if higher, otherwise do nothing
      if (level > item.enchantments[existingEnchantmentIndex].level || force) {
        item.enchantments[existingEnchantmentIndex].level = level;
      }
    } else {
      // Add new enchantment
      item.enchantments.push({
        id: enchantmentId,
        level: level
      });
    }
    
    // Update item lore and glow effect
    this.updateItemEnchantmentDisplay(item);
    
    return item;
  }
  
  /**
   * Check if an item can be enchanted with a specific enchantment
   * @param {Object} item - Item to check
   * @param {Object} enchantment - Enchantment to check
   * @returns {boolean} - Whether the item can be enchanted
   */
  canEnchantItemWith(item, enchantment) {
    const itemType = this.getItemEnchantmentType(item);
    return getValidEnchantmentsForItem(itemType).some(e => e.id === enchantment.id);
  }
  
  /**
   * Get the enchantment type of an item
   * @param {Object} item - Item to check
   * @returns {string} - Enchantment item type
   */
  getItemEnchantmentType(item) {
    const type = item.type;
    
    // Armor types
    if (type.endsWith('_helmet')) return 'armor_head';
    if (type.endsWith('_chestplate')) return 'armor_chest';
    if (type.endsWith('_leggings')) return 'armor_legs';
    if (type.endsWith('_boots')) return 'armor_feet';
    
    // Tool types
    if (type.endsWith('_pickaxe')) return 'pickaxe';
    if (type.endsWith('_axe')) return 'axe';
    if (type.endsWith('_shovel')) return 'shovel';
    if (type.endsWith('_hoe')) return 'hoe';
    
    // Weapon types
    if (type.endsWith('_sword')) return 'sword';
    if (type === 'bow') return 'bow';
    if (type === 'crossbow') return 'crossbow';
    if (type === 'trident') return 'trident';
    
    // Other tool types
    if (type === 'fishing_rod') return 'fishing_rod';
    if (type === 'shears') return 'shears';
    
    return type;
  }
  
  /**
   * Update an item's display to show enchantment effects
   * @param {Object} item - Item to update
   */
  updateItemEnchantmentDisplay(item) {
    if (!item.enchantments || item.enchantments.length === 0) {
      // Remove enchantment visual effects if no enchantments
      item.glowing = false;
      item.lore = item.lore?.filter(line => !line.startsWith('§7')) || [];
      return;
    }
    
    // Add glowing effect
    item.glowing = true;
    
    // Initialize or clear enchantment lore
    if (!item.lore) {
      item.lore = [];
    } else {
      // Remove existing enchantment lore
      item.lore = item.lore.filter(line => !line.startsWith('§7'));
    }
    
    // Add enchantment lore
    for (const enchantment of item.enchantments) {
      const enchantDef = Object.values(EnchantmentTypes).find(e => e.id === enchantment.id);
      if (enchantDef) {
        const romanLevel = this.getRomanNumeral(enchantment.level);
        item.lore.push(`§7${enchantDef.displayName} ${romanLevel}`);
      }
    }
  }
  
  /**
   * Convert a number to Roman numerals (for enchantment display)
   * @param {number} num - Number to convert
   * @returns {string} - Roman numeral representation
   */
  getRomanNumeral(num) {
    if (num <= 0 || num > 10) return num.toString();
    
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romanNumerals[num - 1];
  }
  
  /**
   * Generate random enchantment options for an enchantment table
   * @param {Object} item - Item to enchant
   * @param {number} enchantmentLevel - Enchantment level (1-30)
   * @param {number} bookshelfCount - Number of bookshelves around the table (0-15)
   * @param {number} playerLevel - Player's XP level
   * @returns {Array} - Array of enchantment options
   */
  generateEnchantmentTableOptions(item, enchantmentLevel, bookshelfCount, playerLevel) {
    const cacheKey = `${item.type}:${enchantmentLevel}:${bookshelfCount}:${playerLevel}:${this.randomSeed}`;
    
    // Check cache
    if (this.enchantmentOptionsCache.has(cacheKey)) {
      return this.enchantmentOptionsCache.get(cacheKey);
    }
    
    // Seed the RNG with player level + item ID + random seed for consistency
    const seed = playerLevel + this.getItemEnchantability(item) + this.randomSeed;
    const rng = this.createRNG(seed);
    
    // Calculate base enchantment level with randomness
    const effectiveLevel = Math.max(1, Math.round(
      enchantmentLevel + 
      rng() * bookshelfCount / 2 + 
      rng() * bookshelfCount / 2
    ));
    
    // Get item enchantability
    const itemEnchantability = this.getItemEnchantability(item);
    
    // Generate three options with different levels
    const options = [
      this.generateEnchantmentOption(item, Math.max(1, effectiveLevel / 3), itemEnchantability, rng()),
      this.generateEnchantmentOption(item, Math.max(1, effectiveLevel * 2 / 3), itemEnchantability, rng()),
      this.generateEnchantmentOption(item, effectiveLevel, itemEnchantability, rng())
    ];
    
    // Cache the result
    this.enchantmentOptionsCache.set(cacheKey, options);
    this.pruneCache();
    
    return options;
  }
  
  /**
   * Generate a single enchantment option
   * @param {Object} item - Item to enchant
   * @param {number} level - Enchantment level
   * @param {number} itemEnchantability - Item's enchantability value
   * @param {number} randomValue - Random value for selection
   * @returns {Object} - Enchantment option
   */
  generateEnchantmentOption(item, level, itemEnchantability, randomValue) {
    // The effective level for enchantment selection
    const effectiveLevel = Math.max(1, Math.round(
      level + (itemEnchantability / 4) * (1 + randomValue)
    ));
    
    // Get valid enchantments for this item
    const itemType = this.getItemEnchantmentType(item);
    let validEnchantments = getValidEnchantmentsForItem(itemType);
    
    // Filter by effective level range
    validEnchantments = validEnchantments.filter(enchantment => {
      const minCost = enchantment.rarity.minCost;
      const maxCost = enchantment.rarity.maxCost;
      return effectiveLevel >= minCost && effectiveLevel <= maxCost * 2;
    });
    
    // If no valid enchantments, return generic option
    if (validEnchantments.length === 0) {
      return {
        level: Math.min(level, 30),
        xpLevelCost: Math.max(1, Math.min(level, 30) / 2),
        enchantments: []
      };
    }
    
    // Calculate selection weights
    const totalWeight = validEnchantments.reduce((sum, enchant) => sum + enchant.rarity.weight, 0);
    
    // Choose main enchantment
    let weightSelector = randomValue * totalWeight;
    let mainEnchantment = null;
    
    for (const enchant of validEnchantments) {
      weightSelector -= enchant.rarity.weight;
      if (weightSelector <= 0) {
        mainEnchantment = enchant;
        break;
      }
    }
    
    // If no enchantment selected, use the first one
    if (!mainEnchantment) {
      mainEnchantment = validEnchantments[0];
    }
    
    // Calculate enchantment level based on effective level and enchantment min/max cost
    const enchantmentLevel = this.calculateEnchantmentLevel(
      mainEnchantment, 
      effectiveLevel, 
      randomValue
    );
    
    // Chance for additional enchantments
    const additionalEnchantments = [];
    let remainingLevel = effectiveLevel;
    
    // Try to add additional non-conflicting enchantments
    if (remainingLevel > 10) {
      for (let attempt = 0; attempt < 3; attempt++) {
        // Reduce remaining power
        remainingLevel = Math.floor(remainingLevel / 2);
        if (remainingLevel < 1) break;
        
        // Filter out conflicting enchantments
        const nonConflictingEnchantments = validEnchantments.filter(enchant => 
          !doEnchantmentsConflict(enchant, mainEnchantment) &&
          !additionalEnchantments.some(e => doEnchantmentsConflict(e.enchantment, enchant))
        );
        
        if (nonConflictingEnchantments.length === 0) break;
        
        // Select random additional enchantment
        const additionalEnchant = nonConflictingEnchantments[
          Math.floor(randomValue * nonConflictingEnchantments.length)
        ];
        
        // Calculate level for additional enchantment
        const additionalLevel = this.calculateEnchantmentLevel(
          additionalEnchant, 
          remainingLevel, 
          randomValue
        );
        
        if (additionalLevel > 0) {
          additionalEnchantments.push({
            enchantment: additionalEnchant,
            level: additionalLevel
          });
        }
      }
    }
    
    // Create the final option
    return {
      level: Math.min(level, 30),
      xpLevelCost: Math.max(1, Math.min(level, 30) / 2),
      enchantments: [
        {
          id: mainEnchantment.id,
          level: enchantmentLevel,
          displayName: mainEnchantment.displayName
        },
        ...additionalEnchantments.map(e => ({
          id: e.enchantment.id,
          level: e.level,
          displayName: e.enchantment.displayName
        }))
      ]
    };
  }
  
  /**
   * Calculate the level for an enchantment based on effective level and rarity
   * @param {Object} enchantment - Enchantment definition
   * @param {number} effectiveLevel - Effective enchantment level
   * @param {number} randomValue - Random value for variation
   * @returns {number} - Calculated enchantment level
   */
  calculateEnchantmentLevel(enchantment, effectiveLevel, randomValue) {
    // Calculate where in the range the effective level falls
    const { minCost, maxCost } = enchantment.rarity;
    const range = maxCost - minCost;
    
    if (range <= 0 || effectiveLevel < minCost) return 0;
    
    // Calculate normalized position in the range (0-1)
    const normalizedLevel = Math.min(1, (effectiveLevel - minCost) / range);
    
    // Calculate level with some randomness
    const exactLevel = 1 + (enchantment.maxLevel - 1) * normalizedLevel * (0.8 + randomValue * 0.4);
    
    // Return integer level, weighted towards lower values
    return Math.min(enchantment.maxLevel, Math.floor(exactLevel));
  }
  
  /**
   * Get an item's enchantability value
   * @param {Object} item - Item to check
   * @returns {number} - Enchantability value
   */
  getItemEnchantability(item) {
    // Different materials have different enchantability
    const material = this.getItemMaterial(item);
    
    const enchantabilityTable = {
      wood: 15,
      stone: 5,
      iron: 14,
      gold: 22,
      diamond: 10,
      netherite: 15,
      leather: 15,
      chainmail: 12,
      book: 30
    };
    
    return enchantabilityTable[material] || 1;
  }
  
  /**
   * Get an item's material type
   * @param {Object} item - Item to check
   * @returns {string} - Material type
   */
  getItemMaterial(item) {
    const type = item.type;
    
    if (type.startsWith('wooden_')) return 'wood';
    if (type.startsWith('stone_')) return 'stone';
    if (type.startsWith('iron_')) return 'iron';
    if (type.startsWith('golden_')) return 'gold';
    if (type.startsWith('diamond_')) return 'diamond';
    if (type.startsWith('netherite_')) return 'netherite';
    if (type.startsWith('leather_')) return 'leather';
    if (type.startsWith('chainmail_')) return 'chainmail';
    if (type === 'book') return 'book';
    
    return 'unknown';
  }
  
  /**
   * Calculate the effect of all enchantments on an item
   * @param {Object} item - Enchanted item
   * @returns {Object} - Combined enchantment effects
   */
  calculateEnchantmentEffects(item) {
    if (!item.enchantments || item.enchantments.length === 0) {
      return {};
    }
    
    const effects = {};
    const itemType = this.getItemEnchantmentType(item);
    
    // Calculate effects for each enchantment
    for (const enchant of item.enchantments) {
      const enchantmentDef = Object.values(EnchantmentTypes).find(e => e.id === enchant.id);
      
      if (enchantmentDef && typeof enchantmentDef.effect === 'function') {
        const enchantmentEffect = enchantmentDef.effect(enchant.level, itemType);
        
        // Merge effect properties
        for (const [key, value] of Object.entries(enchantmentEffect)) {
          // Handle numeric effects (use highest value)
          if (typeof value === 'number') {
            effects[key] = Math.max(effects[key] || 0, value);
          } 
          // Handle boolean effects
          else if (typeof value === 'boolean') {
            effects[key] = effects[key] || value;
          }
          // Handle special cases like arrays
          else if (Array.isArray(value)) {
            effects[key] = effects[key] || [];
            effects[key].push(...value);
          }
        }
      }
    }
    
    return effects;
  }
  
  /**
   * Apply enchantment effects during an action (like attacking or mining)
   * @param {Object} item - Enchanted item being used
   * @param {string} actionType - Type of action (e.g., 'attack', 'mine', 'defense')
   * @param {Object} actionData - Data related to the action
   * @returns {Object} - Modified action data with enchantment effects applied
   */
  applyEnchantmentEffects(item, actionType, actionData) {
    if (!item.enchantments || item.enchantments.length === 0) {
      return actionData;
    }
    
    const effects = this.calculateEnchantmentEffects(item);
    const result = { ...actionData };
    
    // Apply effects based on action type
    switch (actionType) {
      case 'attack':
        // Apply damage enchantments
        if (effects.extraDamage) {
          result.damage = (result.damage || 0) + effects.extraDamage;
        }
        
        // Apply mob-specific damage bonuses
        if (effects.extraDamageUndead && result.targetType === 'undead') {
          result.damage = (result.damage || 0) + effects.extraDamageUndead;
        }
        
        if (effects.extraDamageArthropods && result.targetType === 'arthropod') {
          result.damage = (result.damage || 0) + effects.extraDamageArthropods;
          // Apply slowness effect
          result.effects = result.effects || [];
          result.effects.push({
            type: 'slowness',
            duration: effects.arthropodSlownessTime || 20,
            amplifier: 3
          });
        }
        
        // Apply knockback
        if (effects.knockbackStrength) {
          result.knockback = (result.knockback || 0) + effects.knockbackStrength;
        }
        
        // Apply fire aspect
        if (effects.fireDuration) {
          result.effects = result.effects || [];
          result.effects.push({
            type: 'fire',
            duration: effects.fireDuration * 20 // Convert to ticks
          });
        }
        
        // Apply looting effects for mob drops
        if (effects.extraLootChance) {
          result.lootBonus = effects.extraLootChance;
          result.extraDrops = effects.maxExtraDrops;
        }
        break;
        
      case 'bow_attack':
        // Apply power (arrow damage)
        if (effects.arrowDamageMultiplier) {
          result.damage = (result.damage || 0) * effects.arrowDamageMultiplier;
        }
        
        // Apply punch (arrow knockback)
        if (effects.arrowKnockbackStrength) {
          result.knockback = (result.knockback || 0) + effects.arrowKnockbackStrength;
        }
        
        // Apply flame (arrow fire effect)
        if (effects.arrowFireDuration) {
          result.effects = result.effects || [];
          result.effects.push({
            type: 'fire',
            duration: effects.arrowFireDuration * 20 // Convert to ticks
          });
        }
        
        // Apply infinity (arrow conservation)
        if (effects.consumeArrows === false) {
          result.consumeArrow = false;
        }
        break;
        
      case 'defense':
        // Apply damage reduction
        if (effects.damageReduction) {
          result.damageReduction = (result.damageReduction || 0) + effects.damageReduction;
        }
        
        // Apply specific damage reductions
        if (effects.fireDamageReduction && result.damageType === 'fire') {
          result.damageReduction = (result.damageReduction || 0) + effects.fireDamageReduction;
        }
        
        if (effects.explosionDamageReduction && result.damageType === 'explosion') {
          result.damageReduction = (result.damageReduction || 0) + effects.explosionDamageReduction;
        }
        
        if (effects.projectileDamageReduction && result.damageType === 'projectile') {
          result.damageReduction = (result.damageReduction || 0) + effects.projectileDamageReduction;
        }
        
        if (effects.fallDamageReduction && result.damageType === 'fall') {
          result.damageReduction = (result.damageReduction || 0) + effects.fallDamageReduction;
        }
        
        // Apply thorns (reflect damage)
        if (effects.reflectChance && Math.random() * 100 < effects.reflectChance) {
          result.reflectDamage = effects.reflectDamage || 1;
        }
        break;
        
      case 'mining':
        // Apply efficiency (mining speed)
        if (effects.miningSpeedMultiplier) {
          result.miningSpeed = (result.miningSpeed || 1) * effects.miningSpeedMultiplier;
        }
        
        // Apply underwater mining boost
        if (effects.underwaterMiningSpeed && result.underwater) {
          result.miningSpeed = (result.miningSpeed || 1) * effects.underwaterMiningSpeed;
        }
        
        // Apply silk touch
        if (effects.silkTouch) {
          result.silkTouch = true;
        }
        
        // Apply fortune
        if (effects.fortuneLevel) {
          result.fortuneLevel = effects.fortuneLevel;
        }
        break;
        
      case 'durability':
        // Apply unbreaking
        if (effects.durabilityChanceReduction) {
          // Only reduce durability if random check passes
          if (Math.random() >= effects.durabilityChanceReduction) {
            result.reduceDurability = false;
          }
        }
        break;
        
      case 'experience':
        // Apply mending
        if (effects.xpToRepairRatio && result.xpAmount > 0) {
          // Calculate repair amount
          const repairAmount = Math.min(
            result.xpAmount / effects.xpToRepairRatio,
            item.maxDurability - item.durability
          );
          
          if (repairAmount > 0) {
            result.repairAmount = Math.floor(repairAmount);
            result.xpAmount = Math.max(0, result.xpAmount - (repairAmount * effects.xpToRepairRatio));
          }
        }
        break;
    }
    
    return result;
  }
  
  /**
   * Prune the enchantment options cache to prevent memory issues
   * @private
   */
  pruneCache() {
    if (this.enchantmentOptionsCache.size > this.MAX_CACHE_SIZE) {
      // Remove random entries
      const entries = Array.from(this.enchantmentOptionsCache.keys());
      const removeCount = Math.floor(this.enchantmentOptionsCache.size * 0.2); // Remove 20%
      
      for (let i = 0; i < removeCount; i++) {
        this.enchantmentOptionsCache.delete(entries[Math.floor(Math.random() * entries.length)]);
      }
    }
  }
}

module.exports = EnchantmentManager; 