/**
 * Enchantment Types - Defines all available enchantments in the game
 */

// Enchantment target types - what items can be enchanted
const EnchantmentTargets = {
  ARMOR: 'armor',
  ARMOR_HEAD: 'armor_head',
  ARMOR_CHEST: 'armor_chest',
  ARMOR_LEGS: 'armor_legs',
  ARMOR_FEET: 'armor_feet',
  WEAPON: 'weapon',
  SWORD: 'sword',
  BOW: 'bow',
  TOOL: 'tool',
  PICKAXE: 'pickaxe',
  AXE: 'axe',
  SHOVEL: 'shovel',
  HOE: 'hoe',
  FISHING_ROD: 'fishing_rod',
  TRIDENT: 'trident',
  CROSSBOW: 'crossbow',
  WEARABLE: 'wearable',
  BREAKABLE: 'breakable',
  VANISHABLE: 'vanishable'
};

// Enchantment rarity - affects enchantment table probabilities and XP cost
const EnchantmentRarity = {
  COMMON: {
    name: 'common',
    weight: 10,
    minCost: 1,
    maxCost: 8
  },
  UNCOMMON: {
    name: 'uncommon',
    weight: 5,
    minCost: 5,
    maxCost: 15
  },
  RARE: {
    name: 'rare',
    weight: 2,
    minCost: 10,
    maxCost: 25
  },
  VERY_RARE: {
    name: 'very_rare',
    weight: 1,
    minCost: 20,
    maxCost: 40
  }
};

// Enchantment types
const EnchantmentTypes = {
  // Armor enchantments
  PROTECTION: {
    id: 'protection',
    displayName: 'Protection',
    maxLevel: 4,
    targets: [EnchantmentTargets.ARMOR],
    rarity: EnchantmentRarity.COMMON,
    conflicts: ['blast_protection', 'fire_protection', 'projectile_protection'],
    description: 'Reduces damage from all sources',
    effect: (level) => ({ damageReduction: level * 4 })
  },
  FIRE_PROTECTION: {
    id: 'fire_protection',
    displayName: 'Fire Protection',
    maxLevel: 4,
    targets: [EnchantmentTargets.ARMOR],
    rarity: EnchantmentRarity.UNCOMMON,
    conflicts: ['protection', 'blast_protection', 'projectile_protection'],
    description: 'Reduces fire damage and burn time',
    effect: (level) => ({ fireDamageReduction: level * 8, burnTimeReduction: level * 15 })
  },
  BLAST_PROTECTION: {
    id: 'blast_protection',
    displayName: 'Blast Protection',
    maxLevel: 4,
    targets: [EnchantmentTargets.ARMOR],
    rarity: EnchantmentRarity.RARE,
    conflicts: ['protection', 'fire_protection', 'projectile_protection'],
    description: 'Reduces explosion damage and knockback',
    effect: (level) => ({ explosionDamageReduction: level * 8, explosionKnockbackReduction: level * 30 })
  },
  PROJECTILE_PROTECTION: {
    id: 'projectile_protection',
    displayName: 'Projectile Protection',
    maxLevel: 4,
    targets: [EnchantmentTargets.ARMOR],
    rarity: EnchantmentRarity.UNCOMMON,
    conflicts: ['protection', 'fire_protection', 'blast_protection'],
    description: 'Reduces damage from projectiles',
    effect: (level) => ({ projectileDamageReduction: level * 8 })
  },
  THORNS: {
    id: 'thorns',
    displayName: 'Thorns',
    maxLevel: 3,
    targets: [EnchantmentTargets.ARMOR],
    rarity: EnchantmentRarity.VERY_RARE,
    conflicts: [],
    description: 'Damages attackers',
    effect: (level) => ({ reflectChance: level * 15, reflectDamage: Math.floor(Math.random() * level) + 1 })
  },
  RESPIRATION: {
    id: 'respiration',
    displayName: 'Respiration',
    maxLevel: 3,
    targets: [EnchantmentTargets.ARMOR_HEAD],
    rarity: EnchantmentRarity.RARE,
    conflicts: [],
    description: 'Extends underwater breathing time',
    effect: (level) => ({ extraBreathTime: level * 15, underwaterVisionImprovement: true })
  },
  AQUA_AFFINITY: {
    id: 'aqua_affinity',
    displayName: 'Aqua Affinity',
    maxLevel: 1,
    targets: [EnchantmentTargets.ARMOR_HEAD],
    rarity: EnchantmentRarity.RARE,
    conflicts: [],
    description: 'Increases underwater mining speed',
    effect: (level) => ({ underwaterMiningSpeed: 5 })
  },
  FEATHER_FALLING: {
    id: 'feather_falling',
    displayName: 'Feather Falling',
    maxLevel: 4,
    targets: [EnchantmentTargets.ARMOR_FEET],
    rarity: EnchantmentRarity.UNCOMMON,
    conflicts: [],
    description: 'Reduces fall damage',
    effect: (level) => ({ fallDamageReduction: level * 12 })
  },
  
  // Weapon enchantments
  SHARPNESS: {
    id: 'sharpness',
    displayName: 'Sharpness',
    maxLevel: 5,
    targets: [EnchantmentTargets.SWORD, EnchantmentTargets.AXE],
    rarity: EnchantmentRarity.COMMON,
    conflicts: ['smite', 'bane_of_arthropods'],
    description: 'Increases attack damage',
    effect: (level) => ({ extraDamage: level * 1.25 })
  },
  SMITE: {
    id: 'smite',
    displayName: 'Smite',
    maxLevel: 5,
    targets: [EnchantmentTargets.SWORD, EnchantmentTargets.AXE],
    rarity: EnchantmentRarity.UNCOMMON,
    conflicts: ['sharpness', 'bane_of_arthropods'],
    description: 'Increases damage to undead mobs',
    effect: (level) => ({ extraDamageUndead: level * 2.5 })
  },
  BANE_OF_ARTHROPODS: {
    id: 'bane_of_arthropods',
    displayName: 'Bane of Arthropods',
    maxLevel: 5,
    targets: [EnchantmentTargets.SWORD, EnchantmentTargets.AXE],
    rarity: EnchantmentRarity.UNCOMMON,
    conflicts: ['sharpness', 'smite'],
    description: 'Increases damage to arthropods and applies Slowness',
    effect: (level) => ({ 
      extraDamageArthropods: level * 2.5,
      arthropodSlownessTime: 20 + level * 5 
    })
  },
  KNOCKBACK: {
    id: 'knockback',
    displayName: 'Knockback',
    maxLevel: 2,
    targets: [EnchantmentTargets.SWORD],
    rarity: EnchantmentRarity.UNCOMMON,
    conflicts: [],
    description: 'Increases knockback dealt',
    effect: (level) => ({ knockbackStrength: level * 3 })
  },
  FIRE_ASPECT: {
    id: 'fire_aspect',
    displayName: 'Fire Aspect',
    maxLevel: 2,
    targets: [EnchantmentTargets.SWORD],
    rarity: EnchantmentRarity.RARE,
    conflicts: [],
    description: 'Sets targets on fire',
    effect: (level) => ({ fireDuration: level * 4 })
  },
  LOOTING: {
    id: 'looting',
    displayName: 'Looting',
    maxLevel: 3,
    targets: [EnchantmentTargets.SWORD],
    rarity: EnchantmentRarity.RARE,
    conflicts: [],
    description: 'Increases mob loot',
    effect: (level) => ({ extraLootChance: level * 15, maxExtraDrops: level })
  },
  
  // Bow enchantments
  POWER: {
    id: 'power',
    displayName: 'Power',
    maxLevel: 5,
    targets: [EnchantmentTargets.BOW],
    rarity: EnchantmentRarity.COMMON,
    conflicts: [],
    description: 'Increases arrow damage',
    effect: (level) => ({ arrowDamageMultiplier: 1 + level * 0.25 })
  },
  PUNCH: {
    id: 'punch',
    displayName: 'Punch',
    maxLevel: 2,
    targets: [EnchantmentTargets.BOW],
    rarity: EnchantmentRarity.RARE,
    conflicts: [],
    description: 'Increases arrow knockback',
    effect: (level) => ({ arrowKnockbackStrength: level * 3 })
  },
  FLAME: {
    id: 'flame',
    displayName: 'Flame',
    maxLevel: 1,
    targets: [EnchantmentTargets.BOW],
    rarity: EnchantmentRarity.RARE,
    conflicts: [],
    description: 'Arrows set targets on fire',
    effect: (level) => ({ arrowFireDuration: 5 })
  },
  INFINITY: {
    id: 'infinity',
    displayName: 'Infinity',
    maxLevel: 1,
    targets: [EnchantmentTargets.BOW],
    rarity: EnchantmentRarity.VERY_RARE,
    conflicts: ['mending'],
    description: 'Shooting consumes no arrows',
    effect: (level) => ({ consumeArrows: false })
  },
  
  // Tool enchantments
  EFFICIENCY: {
    id: 'efficiency',
    displayName: 'Efficiency',
    maxLevel: 5,
    targets: [EnchantmentTargets.TOOL, EnchantmentTargets.SHEARS],
    rarity: EnchantmentRarity.COMMON,
    conflicts: [],
    description: 'Increases mining speed',
    effect: (level) => ({ miningSpeedMultiplier: 1 + level * 0.3 })
  },
  SILK_TOUCH: {
    id: 'silk_touch',
    displayName: 'Silk Touch',
    maxLevel: 1,
    targets: [EnchantmentTargets.TOOL],
    rarity: EnchantmentRarity.VERY_RARE,
    conflicts: ['fortune'],
    description: 'Mined blocks drop themselves',
    effect: (level) => ({ silkTouch: true })
  },
  FORTUNE: {
    id: 'fortune',
    displayName: 'Fortune',
    maxLevel: 3,
    targets: [EnchantmentTargets.TOOL],
    rarity: EnchantmentRarity.RARE,
    conflicts: ['silk_touch'],
    description: 'Increases block drops',
    effect: (level) => ({ fortuneLevel: level })
  },
  
  // General enchantments
  UNBREAKING: {
    id: 'unbreaking',
    displayName: 'Unbreaking',
    maxLevel: 3,
    targets: [EnchantmentTargets.BREAKABLE],
    rarity: EnchantmentRarity.UNCOMMON,
    conflicts: [],
    description: 'Increases item durability',
    effect: (level, itemType) => {
      // Different formula for armor vs tools
      const chanceToReduceDurability = itemType === 'armor' ? 
        0.6 - (0.4 * level / 3) : // For armor: 60% chance reducing to 20% at level 3
        1 / (level + 1); // For tools: 50% at level 1, 33% at level 2, 25% at level 3
      
      return { durabilityChanceReduction: chanceToReduceDurability };
    }
  },
  MENDING: {
    id: 'mending',
    displayName: 'Mending',
    maxLevel: 1,
    targets: [EnchantmentTargets.BREAKABLE],
    rarity: EnchantmentRarity.RARE,
    conflicts: ['infinity'],
    description: 'Repairs items with XP',
    effect: (level) => ({ xpToRepairRatio: 2 })
  }
};

// Create an array of all enchantments
const allEnchantments = Object.values(EnchantmentTypes);

// Function to get valid enchantments for a specific item type
function getValidEnchantmentsForItem(itemType) {
  return allEnchantments.filter(enchantment => 
    enchantment.targets.includes(itemType) || 
    (itemType.startsWith('armor_') && enchantment.targets.includes(EnchantmentTargets.ARMOR)) ||
    (isBreakable(itemType) && enchantment.targets.includes(EnchantmentTargets.BREAKABLE)) ||
    (isWearable(itemType) && enchantment.targets.includes(EnchantmentTargets.WEARABLE)) ||
    (isVanishable(itemType) && enchantment.targets.includes(EnchantmentTargets.VANISHABLE))
  );
}

// Function to check if two enchantments conflict
function doEnchantmentsConflict(enchantment1, enchantment2) {
  if (enchantment1.id === enchantment2.id) {
    return true; // Same enchantment
  }
  
  return enchantment1.conflicts.includes(enchantment2.id) || 
         enchantment2.conflicts.includes(enchantment1.id);
}

// Helper functions for item type checking
function isBreakable(itemType) {
  const breakableItems = [
    'pickaxe', 'axe', 'shovel', 'hoe', 'sword', 'bow', 'crossbow',
    'fishing_rod', 'trident', 'shears', 'flint_and_steel', 
    'armor_head', 'armor_chest', 'armor_legs', 'armor_feet'
  ];
  
  return breakableItems.includes(itemType);
}

function isWearable(itemType) {
  const wearableItems = [
    'armor_head', 'armor_chest', 'armor_legs', 'armor_feet',
    'elytra', 'carved_pumpkin', 'skull'
  ];
  
  return wearableItems.includes(itemType);
}

function isVanishable(itemType) {
  // Almost all items are vanishable except a few
  const nonVanishableItems = ['bedrock', 'barrier', 'command_block'];
  return !nonVanishableItems.includes(itemType);
}

// Calculate enchantment cost in levels
function calculateEnchantmentCost(enchantment, level, itemQuality) {
  const baseMin = enchantment.rarity.minCost;
  const baseMax = enchantment.rarity.maxCost;
  
  // Interpolate between min and max based on level
  const baseCost = baseMin + ((baseMax - baseMin) * (level - 1) / (enchantment.maxLevel - 1));
  
  // Adjust for item quality/material (e.g., wood=1, stone=2, iron=3, diamond=4, netherite=5)
  return Math.ceil(baseCost * (0.5 + itemQuality * 0.25));
}

module.exports = {
  EnchantmentTargets,
  EnchantmentRarity,
  EnchantmentTypes,
  allEnchantments,
  getValidEnchantmentsForItem,
  doEnchantmentsConflict,
  calculateEnchantmentCost,
  isBreakable,
  isWearable,
  isVanishable
}; 