/**
 * Spell Registry - Defines and organizes different spell types
 * Part of the Minecraft 1.22 "Sorcery Update" features
 */

// Spell categories
const SpellCategory = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  UTILITY: 'utility',
  MOVEMENT: 'movement',
  TRANSFORMATION: 'transformation',
  SUMMONING: 'summoning'
};

// Spell target types
const SpellTargetType = {
  ENTITY: 'entity',
  BLOCK: 'block',
  SELF: 'self',
  AREA: 'area',
  PROJECTILE: 'projectile'
};

// Spell elements
const SpellElement = {
  FIRE: 'fire',
  WATER: 'water',
  EARTH: 'earth',
  AIR: 'air',
  LIGHT: 'light',
  DARK: 'dark',
  NEUTRAL: 'neutral'
};

// Rarity levels for spells
const SpellRarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

class SpellRegistry {
  constructor() {
    // Map of spell ID to spell definition
    this.spellDefinitions = new Map();
    
    // Register all default spells
    this.registerDefaultSpells();
  }
  
  /**
   * Register all default spells
   */
  registerDefaultSpells() {
    // Fireball - A basic attack spell
    this.registerSpell('fireball', {
      name: 'Fireball',
      description: 'Launches a ball of fire that deals damage on impact',
      manaCost: 15,
      cooldown: 3,
      duration: 0,
      area: 0,
      element: SpellElement.FIRE,
      category: SpellCategory.ATTACK,
      targetType: SpellTargetType.PROJECTILE,
      rarity: SpellRarity.COMMON,
      levelScaling: {
        manaCost: 1.5,
        damage: 2.0,
        area: 1.2,
        cooldown: 0.9
      }
    });
    
    // Ice Spike - Another attack spell
    this.registerSpell('ice_spike', {
      name: 'Ice Spike',
      description: 'Creates a spike of ice that deals damage and slows enemies',
      manaCost: 20,
      cooldown: 5,
      duration: 0,
      area: 0,
      element: SpellElement.WATER,
      category: SpellCategory.ATTACK,
      targetType: SpellTargetType.PROJECTILE,
      rarity: SpellRarity.UNCOMMON,
      levelScaling: {
        manaCost: 1.5,
        damage: 1.75,
        slowEffect: 1.5,
        cooldown: 0.9
      }
    });
    
    // Blink - A utility movement spell
    this.registerSpell('blink', {
      name: 'Blink',
      description: 'Teleports you a short distance in the direction you are looking',
      manaCost: 25,
      cooldown: 8,
      duration: 0,
      area: 0,
      element: SpellElement.NEUTRAL,
      category: SpellCategory.MOVEMENT,
      targetType: SpellTargetType.SELF,
      rarity: SpellRarity.UNCOMMON,
      levelScaling: {
        manaCost: 1.25,
        distance: 1.5,
        cooldown: 0.8
      }
    });
    
    // Healing Aura - A healing spell
    this.registerSpell('healing_aura', {
      name: 'Healing Aura',
      description: 'Creates an aura that heals you and nearby allies over time',
      manaCost: 35,
      cooldown: 15,
      duration: 10,
      area: 5,
      element: SpellElement.LIGHT,
      category: SpellCategory.UTILITY,
      targetType: SpellTargetType.AREA,
      rarity: SpellRarity.RARE,
      levelScaling: {
        manaCost: 1.5,
        healing: 1.75,
        duration: 1.5,
        area: 1.3,
        cooldown: 0.85
      }
    });
    
    // Earthen Shield - A defensive spell
    this.registerSpell('earthen_shield', {
      name: 'Earthen Shield',
      description: 'Creates a shield of earth that absorbs damage',
      manaCost: 30,
      cooldown: 12,
      duration: 8,
      area: 0,
      element: SpellElement.EARTH,
      category: SpellCategory.DEFENSE,
      targetType: SpellTargetType.SELF,
      rarity: SpellRarity.UNCOMMON,
      levelScaling: {
        manaCost: 1.4,
        absorption: 2.0,
        duration: 1.25,
        cooldown: 0.9
      }
    });
    
    // Wind Gust - An air-based utility spell
    this.registerSpell('wind_gust', {
      name: 'Wind Gust',
      description: 'Creates a gust of wind that pushes entities away',
      manaCost: 20,
      cooldown: 6,
      duration: 0,
      area: 3,
      element: SpellElement.AIR,
      category: SpellCategory.UTILITY,
      targetType: SpellTargetType.AREA,
      rarity: SpellRarity.COMMON,
      levelScaling: {
        manaCost: 1.3,
        force: 1.75,
        area: 1.5,
        cooldown: 0.9
      }
    });
    
    // Summon Familiar - A summoning spell
    this.registerSpell('summon_familiar', {
      name: 'Summon Familiar',
      description: 'Summons a magical familiar that assists you in battle',
      manaCost: 45,
      cooldown: 30,
      duration: 60,
      area: 0,
      element: SpellElement.NEUTRAL,
      category: SpellCategory.SUMMONING,
      targetType: SpellTargetType.BLOCK,
      rarity: SpellRarity.RARE,
      levelScaling: {
        manaCost: 1.6,
        duration: 1.5,
        power: 1.75,
        cooldown: 0.85
      }
    });
    
    // Shadow Step - A dark teleport spell
    this.registerSpell('shadow_step', {
      name: 'Shadow Step',
      description: 'Step through the shadows to appear behind an enemy',
      manaCost: 35,
      cooldown: 10,
      duration: 0,
      area: 0,
      element: SpellElement.DARK,
      category: SpellCategory.MOVEMENT,
      targetType: SpellTargetType.ENTITY,
      rarity: SpellRarity.RARE,
      levelScaling: {
        manaCost: 1.4,
        range: 1.5,
        cooldown: 0.8
      }
    });
  }
  
  /**
   * Register a new spell
   * @param {string} spellId - Unique ID for the spell
   * @param {Object} definition - Spell definition
   * @returns {boolean} - Success
   */
  registerSpell(spellId, definition) {
    if (this.spellDefinitions.has(spellId)) {
      return false;
    }
    
    // Add the ID to the definition
    const fullDefinition = {
      id: spellId,
      ...definition
    };
    
    this.spellDefinitions.set(spellId, fullDefinition);
    return true;
  }
  
  /**
   * Get a spell definition by ID
   * @param {string} spellId - Spell ID
   * @returns {Object|null} - Spell definition or null
   */
  getSpellDefinition(spellId) {
    return this.spellDefinitions.get(spellId) || null;
  }
  
  /**
   * Get all spell definitions
   * @returns {Map} - Map of spell ID to definition
   */
  getAllSpellDefinitions() {
    return this.spellDefinitions;
  }
  
  /**
   * Get spells that match a specific category
   * @param {string} category - Spell category
   * @returns {Array} - Array of matching spells
   */
  getSpellsByCategory(category) {
    const result = [];
    
    for (const [spellId, spell] of this.spellDefinitions.entries()) {
      if (spell.category === category) {
        result.push(spell);
      }
    }
    
    return result;
  }
  
  /**
   * Get spells that match a specific element
   * @param {string} element - Spell element
   * @returns {Array} - Array of matching spells
   */
  getSpellsByElement(element) {
    const result = [];
    
    for (const [spellId, spell] of this.spellDefinitions.entries()) {
      if (spell.element === element) {
        result.push(spell);
      }
    }
    
    return result;
  }
  
  /**
   * Get spells that match a specific rarity
   * @param {string} rarity - Spell rarity
   * @returns {Array} - Array of matching spells
   */
  getSpellsByRarity(rarity) {
    const result = [];
    
    for (const [spellId, spell] of this.spellDefinitions.entries()) {
      if (spell.rarity === rarity) {
        result.push(spell);
      }
    }
    
    return result;
  }
  
  /**
   * Calculate mana cost for a spell at a specific level
   * @param {string} spellId - Spell ID
   * @param {number} level - Spell level
   * @returns {number} - Mana cost
   */
  calculateManaCost(spellId, level) {
    const spell = this.getSpellDefinition(spellId);
    if (!spell) return 0;
    
    const baseManaCost = spell.manaCost || 0;
    const scaling = spell.levelScaling?.manaCost || 1.0;
    
    // Level 1 is base cost, each level above increases by scaling
    return Math.round(baseManaCost * Math.pow(scaling, level - 1));
  }
  
  /**
   * Calculate cooldown for a spell at a specific level
   * @param {string} spellId - Spell ID
   * @param {number} level - Spell level
   * @returns {number} - Cooldown in seconds
   */
  calculateCooldown(spellId, level) {
    const spell = this.getSpellDefinition(spellId);
    if (!spell) return 0;
    
    const baseCooldown = spell.cooldown || 0;
    const scaling = spell.levelScaling?.cooldown || 1.0;
    
    // Higher levels typically reduce cooldown
    return Math.round(baseCooldown * Math.pow(scaling, level - 1));
  }
}

module.exports = {
  SpellRegistry,
  SpellCategory,
  SpellTargetType,
  SpellElement,
  SpellRarity
}; 