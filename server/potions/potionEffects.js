/**
 * Potion Effects - Defines all status effects that can be applied to entities
 */

// Effect types - categories of effects
const EffectType = {
  BENEFICIAL: 'beneficial',
  HARMFUL: 'harmful',
  NEUTRAL: 'neutral'
};

// Effect categories - what the effect applies to
const EffectCategory = {
  MOVEMENT: 'movement',
  COMBAT: 'combat',
  VISION: 'vision',
  HEALTH: 'health',
  HUNGER: 'hunger',
  MISCELLANEOUS: 'miscellaneous'
};

// Effect definitions
const PotionEffects = {
  SPEED: {
    id: 'speed',
    displayName: 'Speed',
    type: EffectType.BENEFICIAL,
    category: EffectCategory.MOVEMENT,
    maxLevel: 2,
    color: '#7CAFC6',
    particles: true,
    icon: 'speed_icon',
    description: 'Increases movement speed',
    compatible: [], // Effects this can be combined with (empty means all)
    incompatible: ['slowness'], // Effects this cannot be combined with
    apply: (entity, level, duration) => {
      const multiplier = 1 + (level * 0.2); // 20% speed boost per level
      entity.movementSpeed = (entity.movementSpeed || 1) * multiplier;
      return entity;
    },
    remove: (entity) => {
      entity.movementSpeed = entity.baseMovementSpeed || 1;
      return entity;
    }
  },
  
  SLOWNESS: {
    id: 'slowness',
    displayName: 'Slowness',
    type: EffectType.HARMFUL,
    category: EffectCategory.MOVEMENT,
    maxLevel: 4,
    color: '#5A6C81',
    particles: true,
    icon: 'slowness_icon',
    description: 'Decreases movement speed',
    compatible: [],
    incompatible: ['speed'],
    apply: (entity, level, duration) => {
      const multiplier = Math.max(0.1, 1 - (level * 0.15)); // 15% slowdown per level, min 0.1
      entity.movementSpeed = (entity.movementSpeed || 1) * multiplier;
      return entity;
    },
    remove: (entity) => {
      entity.movementSpeed = entity.baseMovementSpeed || 1;
      return entity;
    }
  },
  
  HASTE: {
    id: 'haste',
    displayName: 'Haste',
    type: EffectType.BENEFICIAL,
    category: EffectCategory.MISCELLANEOUS,
    maxLevel: 2,
    color: '#D9C043',
    particles: true,
    icon: 'haste_icon',
    description: 'Increases mining and attack speed',
    compatible: [],
    incompatible: ['mining_fatigue'],
    apply: (entity, level, duration) => {
      const multiplier = 1 + (level * 0.2); // 20% speed boost per level
      entity.miningSpeed = (entity.miningSpeed || 1) * multiplier;
      entity.attackSpeed = (entity.attackSpeed || 1) * multiplier;
      return entity;
    },
    remove: (entity) => {
      entity.miningSpeed = entity.baseMiningSpeed || 1;
      entity.attackSpeed = entity.baseAttackSpeed || 1;
      return entity;
    }
  },
  
  MINING_FATIGUE: {
    id: 'mining_fatigue',
    displayName: 'Mining Fatigue',
    type: EffectType.HARMFUL,
    category: EffectCategory.MISCELLANEOUS,
    maxLevel: 3,
    color: '#4A4217',
    particles: true,
    icon: 'mining_fatigue_icon',
    description: 'Decreases mining speed',
    compatible: [],
    incompatible: ['haste'],
    apply: (entity, level, duration) => {
      const multiplier = Math.max(0.05, 1 - (level * 0.3)); // 30% slowdown per level, min 0.05
      entity.miningSpeed = (entity.miningSpeed || 1) * multiplier;
      return entity;
    },
    remove: (entity) => {
      entity.miningSpeed = entity.baseMiningSpeed || 1;
      return entity;
    }
  },
  
  STRENGTH: {
    id: 'strength',
    displayName: 'Strength',
    type: EffectType.BENEFICIAL,
    category: EffectCategory.COMBAT,
    maxLevel: 2,
    color: '#932423',
    particles: true,
    icon: 'strength_icon',
    description: 'Increases attack damage',
    compatible: [],
    incompatible: ['weakness'],
    apply: (entity, level, duration) => {
      // +3 damage per level
      entity.attackDamageBonus = (entity.attackDamageBonus || 0) + (level * 3);
      return entity;
    },
    remove: (entity) => {
      entity.attackDamageBonus = 0;
      return entity;
    }
  },
  
  WEAKNESS: {
    id: 'weakness',
    displayName: 'Weakness',
    type: EffectType.HARMFUL,
    category: EffectCategory.COMBAT,
    maxLevel: 2,
    color: '#484D48',
    particles: true,
    icon: 'weakness_icon',
    description: 'Decreases attack damage',
    compatible: [],
    incompatible: ['strength'],
    apply: (entity, level, duration) => {
      // -4 damage per level
      entity.attackDamagePenalty = (entity.attackDamagePenalty || 0) + (level * 4);
      return entity;
    },
    remove: (entity) => {
      entity.attackDamagePenalty = 0;
      return entity;
    }
  },
  
  INSTANT_HEALTH: {
    id: 'instant_health',
    displayName: 'Instant Health',
    type: EffectType.BENEFICIAL,
    category: EffectCategory.HEALTH,
    maxLevel: 2,
    color: '#F82423',
    particles: true,
    icon: 'instant_health_icon',
    description: 'Instantly restores health',
    compatible: [],
    incompatible: [],
    apply: (entity, level, duration) => {
      // Heal 4 hearts (8 hp) per level
      const healAmount = level * 8;
      entity.health = Math.min((entity.maxHealth || 20), (entity.health || 0) + healAmount);
      return entity;
    },
    remove: (entity) => entity // No removal needed for instant effects
  },
  
  INSTANT_DAMAGE: {
    id: 'instant_damage',
    displayName: 'Instant Damage',
    type: EffectType.HARMFUL,
    category: EffectCategory.HEALTH,
    maxLevel: 2,
    color: '#430A09',
    particles: true,
    icon: 'instant_damage_icon',
    description: 'Instantly deals damage',
    compatible: [],
    incompatible: [],
    apply: (entity, level, duration) => {
      // Damage 3 hearts (6 hp) per level
      const damageAmount = level * 6;
      entity.health = Math.max(0, (entity.health || 0) - damageAmount);
      
      // Add damage animation/effect if entity is still alive
      if (entity.health > 0) {
        entity.damageEffect = { type: 'magic', amount: damageAmount };
      }
      
      return entity;
    },
    remove: (entity) => entity // No removal needed for instant effects
  },
  
  REGENERATION: {
    id: 'regeneration',
    displayName: 'Regeneration',
    type: EffectType.BENEFICIAL,
    category: EffectCategory.HEALTH,
    maxLevel: 2,
    color: '#CD5CAB',
    particles: true,
    icon: 'regeneration_icon',
    description: 'Restores health over time',
    compatible: [],
    incompatible: ['poison', 'wither'],
    apply: (entity, level, duration) => {
      entity.regeneration = {
        tickInterval: Math.max(10, 50 - (level * 20)), // Ticks between heals (faster at higher levels)
        amount: 1 // 1/2 heart per tick
      };
      return entity;
    },
    remove: (entity) => {
      entity.regeneration = null;
      return entity;
    }
  },
  
  POISON: {
    id: 'poison',
    displayName: 'Poison',
    type: EffectType.HARMFUL,
    category: EffectCategory.HEALTH,
    maxLevel: 2,
    color: '#4E9331',
    particles: true,
    icon: 'poison_icon',
    description: 'Deals damage over time, but cannot kill',
    compatible: [],
    incompatible: ['regeneration', 'wither'],
    apply: (entity, level, duration) => {
      entity.poison = {
        tickInterval: Math.max(10, 25 - (level * 5)), // Ticks between damage (faster at higher levels)
        amount: 1 // 1/2 heart per tick
      };
      return entity;
    },
    remove: (entity) => {
      entity.poison = null;
      return entity;
    }
  },
  
  WITHER: {
    id: 'wither',
    displayName: 'Wither',
    type: EffectType.HARMFUL,
    category: EffectCategory.HEALTH,
    maxLevel: 1,
    color: '#352A27',
    particles: true,
    icon: 'wither_icon',
    description: 'Deals damage over time and can kill',
    compatible: [],
    incompatible: ['regeneration', 'poison'],
    apply: (entity, level, duration) => {
      entity.wither = {
        tickInterval: 40, // Damage every 2 seconds
        amount: 1 * level // 1/2 heart per tick per level
      };
      return entity;
    },
    remove: (entity) => {
      entity.wither = null;
      return entity;
    }
  },
  
  FIRE_RESISTANCE: {
    id: 'fire_resistance',
    displayName: 'Fire Resistance',
    type: EffectType.BENEFICIAL,
    category: EffectCategory.HEALTH,
    maxLevel: 1,
    color: '#E49A0F',
    particles: true,
    icon: 'fire_resistance_icon',
    description: 'Provides immunity to fire damage',
    compatible: [],
    incompatible: [],
    apply: (entity, level, duration) => {
      entity.fireResistance = true;
      return entity;
    },
    remove: (entity) => {
      entity.fireResistance = false;
      return entity;
    }
  },
  
  WATER_BREATHING: {
    id: 'water_breathing',
    displayName: 'Water Breathing',
    type: EffectType.BENEFICIAL,
    category: EffectCategory.HEALTH,
    maxLevel: 1,
    color: '#2E5299',
    particles: true,
    icon: 'water_breathing_icon',
    description: 'Allows breathing underwater',
    compatible: [],
    incompatible: [],
    apply: (entity, level, duration) => {
      entity.waterBreathing = true;
      return entity;
    },
    remove: (entity) => {
      entity.waterBreathing = false;
      return entity;
    }
  },
  
  INVISIBILITY: {
    id: 'invisibility',
    displayName: 'Invisibility',
    type: EffectType.BENEFICIAL,
    category: EffectCategory.MISCELLANEOUS,
    maxLevel: 1,
    color: '#7F8392',
    particles: true,
    icon: 'invisibility_icon',
    description: 'Grants invisibility',
    compatible: [],
    incompatible: [],
    apply: (entity, level, duration) => {
      entity.invisibility = true;
      entity.opacity = 0.2; // Still slightly visible
      return entity;
    },
    remove: (entity) => {
      entity.invisibility = false;
      entity.opacity = 1.0;
      return entity;
    }
  },
  
  NIGHT_VISION: {
    id: 'night_vision',
    displayName: 'Night Vision',
    type: EffectType.BENEFICIAL,
    category: EffectCategory.VISION,
    maxLevel: 1,
    color: '#1F1FA1',
    particles: true,
    icon: 'night_vision_icon',
    description: 'Allows perfect vision in darkness',
    compatible: [],
    incompatible: [],
    apply: (entity, level, duration) => {
      entity.nightVision = true;
      return entity;
    },
    remove: (entity) => {
      entity.nightVision = false;
      return entity;
    }
  },
  
  JUMP_BOOST: {
    id: 'jump_boost',
    displayName: 'Jump Boost',
    type: EffectType.BENEFICIAL,
    category: EffectCategory.MOVEMENT,
    maxLevel: 2,
    color: '#22FF4C',
    particles: true,
    icon: 'jump_boost_icon',
    description: 'Increases jump height',
    compatible: [],
    incompatible: [],
    apply: (entity, level, duration) => {
      entity.jumpBoost = level * 0.5; // Additional jump height per level
      return entity;
    },
    remove: (entity) => {
      entity.jumpBoost = 0;
      return entity;
    }
  },
  
  NAUSEA: {
    id: 'nausea',
    displayName: 'Nausea',
    type: EffectType.HARMFUL,
    category: EffectCategory.VISION,
    maxLevel: 1,
    color: '#551D4A',
    particles: true,
    icon: 'nausea_icon',
    description: 'Distorts vision',
    compatible: [],
    incompatible: [],
    apply: (entity, level, duration) => {
      entity.nausea = true;
      return entity;
    },
    remove: (entity) => {
      entity.nausea = false;
      return entity;
    }
  },
  
  RESISTANCE: {
    id: 'resistance',
    displayName: 'Resistance',
    type: EffectType.BENEFICIAL,
    category: EffectCategory.COMBAT,
    maxLevel: 2,
    color: '#99453A',
    particles: true,
    icon: 'resistance_icon',
    description: 'Reduces damage taken',
    compatible: [],
    incompatible: [],
    apply: (entity, level, duration) => {
      entity.resistance = level * 0.2; // 20% damage reduction per level
      return entity;
    },
    remove: (entity) => {
      entity.resistance = 0;
      return entity;
    }
  },
  
  SLOW_FALLING: {
    id: 'slow_falling',
    displayName: 'Slow Falling',
    type: EffectType.BENEFICIAL,
    category: EffectCategory.MOVEMENT,
    maxLevel: 1,
    color: '#FEFDCE',
    particles: true,
    icon: 'slow_falling_icon',
    description: 'Slows falling speed and negates fall damage',
    compatible: [],
    incompatible: [],
    apply: (entity, level, duration) => {
      entity.slowFalling = true;
      entity.fallDamageImmunity = true;
      return entity;
    },
    remove: (entity) => {
      entity.slowFalling = false;
      entity.fallDamageImmunity = false;
      return entity;
    }
  }
};

// Function to get effect by ID
function getEffectById(id) {
  for (const effect of Object.values(PotionEffects)) {
    if (effect.id === id) {
      return effect;
    }
  }
  return null;
}

// Function to check if effects can be combined
function canCombineEffects(effect1Id, effect2Id) {
  const effect1 = getEffectById(effect1Id);
  const effect2 = getEffectById(effect2Id);
  
  if (!effect1 || !effect2) {
    return false;
  }
  
  // Check if either effect has the other in its incompatible list
  if (effect1.incompatible.includes(effect2.id) || 
      effect2.incompatible.includes(effect1.id)) {
    return false;
  }
  
  return true;
}

// Function to apply an effect to an entity
function applyEffect(entity, effectId, level, duration) {
  const effect = getEffectById(effectId);
  
  if (!effect) {
    return entity;
  }
  
  // Cap level at the maximum for this effect
  const cappedLevel = Math.min(level, effect.maxLevel);
  
  // Store effect information in entity's active effects
  entity.activeEffects = entity.activeEffects || {};
  entity.activeEffects[effectId] = {
    id: effectId,
    level: cappedLevel,
    duration: duration,
    startTime: Date.now(),
    endTime: Date.now() + (duration * 1000), // Convert seconds to milliseconds
    particles: effect.particles,
    color: effect.color
  };
  
  // Apply the effect's function
  return effect.apply(entity, cappedLevel, duration);
}

// Function to remove an effect from an entity
function removeEffect(entity, effectId) {
  const effect = getEffectById(effectId);
  
  if (!effect || !entity.activeEffects || !entity.activeEffects[effectId]) {
    return entity;
  }
  
  // Apply the effect's removal function
  entity = effect.remove(entity);
  
  // Remove the effect from active effects
  delete entity.activeEffects[effectId];
  
  return entity;
}

// Function to update all effects on an entity
function updateEffects(entity, deltaTime) {
  if (!entity.activeEffects) {
    return entity;
  }
  
  const now = Date.now();
  
  // Process each active effect
  for (const effectId in entity.activeEffects) {
    const effectState = entity.activeEffects[effectId];
    
    // Check if the effect has expired
    if (now >= effectState.endTime) {
      entity = removeEffect(entity, effectId);
      continue;
    }
    
    // Process periodic effects (regeneration, poison, wither)
    if (effectId === 'regeneration' && entity.regeneration) {
      entity.regenerationTimer = (entity.regenerationTimer || 0) + deltaTime;
      if (entity.regenerationTimer >= entity.regeneration.tickInterval) {
        entity.health = Math.min((entity.maxHealth || 20), (entity.health || 0) + entity.regeneration.amount);
        entity.regenerationTimer = 0;
      }
    } else if (effectId === 'poison' && entity.poison) {
      entity.poisonTimer = (entity.poisonTimer || 0) + deltaTime;
      if (entity.poisonTimer >= entity.poison.tickInterval) {
        // Poison can't kill - minimum 1 health
        entity.health = Math.max(1, (entity.health || 0) - entity.poison.amount);
        entity.poisonTimer = 0;
      }
    } else if (effectId === 'wither' && entity.wither) {
      entity.witherTimer = (entity.witherTimer || 0) + deltaTime;
      if (entity.witherTimer >= entity.wither.tickInterval) {
        // Wither can kill
        entity.health = Math.max(0, (entity.health || 0) - entity.wither.amount);
        entity.witherTimer = 0;
      }
    }
  }
  
  return entity;
}

module.exports = {
  EffectType,
  EffectCategory,
  PotionEffects,
  getEffectById,
  canCombineEffects,
  applyEffect,
  removeEffect,
  updateEffects
}; 