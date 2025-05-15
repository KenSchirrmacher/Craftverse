/**
 * Deep Dark Biome - A rare underground biome featuring sculk growth and ancient city structures
 */

const BiomeBase = require('./biomeBase');

class DeepDarkBiome extends BiomeBase {
  /**
   * Create a new Deep Dark biome
   */
  constructor() {
    super({
      id: 'deep_dark',
      name: 'Deep Dark',
      temperature: 0.5,
      rainfall: 0.5,
      depth: -1.2, // Very deep underground
      scale: 0.2,
      color: '#0A0E14',
      
      // Biome properties
      waterColor: '#3F76E4',
      waterFogColor: '#050533',
      fogColor: '#050505',
      skyColor: '#050505',
      
      // Block composition
      surfaceBlock: 'deepslate',
      fillerBlock: 'deepslate',
      underwaterBlock: 'deepslate',
      
      // Structure placement
      structureFeatures: {
        ancient_city: {
          chance: 0.05, // 5% chance per chunk in valid regions
          minY: -52,
          maxY: -20
        }
      },
      
      // Sound settings
      ambientSound: 'ambient.cave',
      ambientMoodSound: 'ambient.crimson_forest.mood',
      particleOptions: {
        type: 'sculk_particle',
        probability: 0.01 // 1% chance per tick in covered areas
      }
    });
    
    // Deep Dark specific settings
    this.hasDarkness = true; // Applies darkness effect
    this.hasSculkGrowth = true; // Can generate sculk features
    this.allowsWardenSpawning = true; // The Warden can spawn here
    
    // Darkness effect settings
    this.darknessSettings = {
      baseLevel: 1, // Base level of darkness (amplifier 0)
      maxLevel: 3,  // Maximum level that can be reached
      buildupRate: 0.01, // How quickly darkness builds up
      wardenNearbyAddedLevel: 2, // Added intensity when warden is nearby
      ancientCityAddedLevel: 1, // Added intensity in ancient cities
      pulseEnabled: true, // Whether darkness pulses or is constant
      pulseMinimum: 0.7, // Minimum intensity during pulse cycle (0-1)
      applyCooldown: 20, // Ticks between effect application checks
      lastAppliedEffects: {} // Tracks when effects were last applied to entities
    };
    
    // Mob spawning settings
    this.spawnSettings = {
      spawnCost: {
        energy_budget: 0.12,
        charge: 0.7
      },
      spawners: {
        // Very limited mob spawning in the Deep Dark
        monster: [
          { type: 'enderman', weight: 10, minCount: 1, maxCount: 2 },
          { type: 'creeper', weight: 5, minCount: 1, maxCount: 1 },
          { type: 'warden', weight: 1, minCount: 1, maxCount: 1 } // Very rare warden spawn
        ],
        creature: [], // No passive creatures spawn naturally
        ambient: [], // No ambient creatures
        underground_water_creature: [] // No water creatures
      }
    };
  }
  
  /**
   * Get features to generate in this biome
   * @returns {Array} Array of feature definitions
   */
  getFeatures() {
    return [
      // Sculk patches
      {
        type: 'sculk_patch',
        chance: 0.4,
        count: { min: 1, max: 5 },
        placement: 'floor',
        y: { min: -60, max: -10 }
      },
      // Sculk veins
      {
        type: 'sculk_vein',
        chance: 0.6,
        count: { min: 2, max: 8 },
        placement: 'wall',
        y: { min: -60, max: -10 }
      },
      // Sculk catalysts
      {
        type: 'sculk_catalyst',
        chance: 0.15,
        count: { min: 0, max: 2 },
        placement: 'floor',
        y: { min: -60, max: -10 },
        requiresOpen: true
      },
      // Sculk shriekers
      {
        type: 'sculk_shrieker',
        chance: 0.1,
        count: { min: 0, max: 3 },
        placement: 'floor',
        y: { min: -60, max: -10 },
        requiresSculk: true
      },
      // Sculk sensors
      {
        type: 'sculk_sensor',
        chance: 0.2,
        count: { min: 0, max: 3 },
        placement: 'floor',
        y: { min: -60, max: -10 },
        requiresSculk: true
      },
      // Ore features
      {
        type: 'ore',
        block: 'diamond_ore',
        size: 6,
        count: 3,
        y: { min: -60, max: -20 }
      },
      {
        type: 'ore',
        block: 'redstone_ore',
        size: 8,
        count: 4,
        y: { min: -60, max: -10 }
      },
      // Cave features
      {
        type: 'cave_feature',
        feature: 'cobweb',
        chance: 0.1,
        count: { min: 1, max: 3 },
        placement: 'ceiling',
        y: { min: -60, max: -10 }
      }
    ];
  }
  
  /**
   * Get structures that can generate in this biome
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @returns {Array} Array of structure types
   */
  getStructuresAt(x, z) {
    const structures = [];
    
    // Check for ancient city (complex structure)
    if (this.structureFeatures.ancient_city) {
      const feature = this.structureFeatures.ancient_city;
      const random = this.getRandomFromCoords(x, z, 'ancient_city');
      
      if (random < feature.chance) {
        structures.push('ancient_city');
      }
    }
    
    return structures;
  }
  
  /**
   * Apply biome-specific effects to an entity
   * @param {Object} entity - The entity in this biome
   * @param {number} duration - Time in ticks the entity has been in biome
   * @param {Object} world - World object with access to systems like statusEffectsManager
   * @returns {Object} Applied effects
   */
  applyEntityEffects(entity, duration, world) {
    const appliedEffects = {};
    
    // Skip if darkness is disabled
    if (!this.hasDarkness) return appliedEffects;
    
    // Skip if not a player (darkness mainly affects players)
    if (entity.type !== 'player') return appliedEffects;
    
    // Check cooldown to avoid applying effects too frequently
    const now = Date.now();
    const lastApplied = this.darknessSettings.lastAppliedEffects[entity.id] || 0;
    if (now - lastApplied < this.darknessSettings.applyCooldown) {
      return appliedEffects;
    }
    
    // Calculate darkness level
    let darknessLevel = this.darknessSettings.baseLevel;
    
    // Increase darkness the longer the player is in the biome
    if (duration > 100) {
      const additionalLevels = Math.min(
        this.darknessSettings.maxLevel - this.darknessSettings.baseLevel,
        duration * this.darknessSettings.buildupRate / 1000
      );
      darknessLevel += additionalLevels;
    }
    
    // Check for nearby warden (within 64 blocks)
    const nearbyWarden = this.isWardenNearby(entity, world, 64);
    if (nearbyWarden) {
      darknessLevel += this.darknessSettings.wardenNearbyAddedLevel;
    }
    
    // Check if in ancient city
    const inAncientCity = this.isInAncientCity(entity.position, world);
    if (inAncientCity) {
      darknessLevel += this.darknessSettings.ancientCityAddedLevel;
    }
    
    // Cap at max level
    darknessLevel = Math.min(darknessLevel, this.darknessSettings.maxLevel);
    
    // Apply the darkness effect
    if (world && world.statusEffectsManager) {
      // Duration escalates with level - longer stays have more persistent darkness
      const effectDuration = 200 + Math.min(duration, 2000);
      
      world.statusEffectsManager.addEffect(entity.id, 'DARKNESS', {
        level: Math.floor(darknessLevel),
        duration: effectDuration,
        showParticles: true,
        ambient: true
      });
      
      // Track when we last applied the effect
      this.darknessSettings.lastAppliedEffects[entity.id] = now;
      
      // Add to applied effects
      appliedEffects.darkness = {
        level: Math.floor(darknessLevel),
        duration: effectDuration
      };
    }
    
    return appliedEffects;
  }
  
  /**
   * Check if a Warden is near the entity
   * @param {Object} entity - The entity to check
   * @param {Object} world - World object
   * @param {number} radius - Radius to check for wardens
   * @returns {boolean} Whether a warden is nearby
   */
  isWardenNearby(entity, world, radius) {
    if (!world || !world.entities) return false;
    
    // Simple distance check to all wardens
    for (const otherEntity of world.entities.values()) {
      if (otherEntity.type === 'warden') {
        const dx = entity.position.x - otherEntity.position.x;
        const dy = entity.position.y - otherEntity.position.y;
        const dz = entity.position.z - otherEntity.position.z;
        const distSquared = dx * dx + dy * dy + dz * dz;
        
        if (distSquared <= radius * radius) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if entity is in an Ancient City
   * @param {Object} position - Entity position
   * @param {Object} world - World object
   * @returns {boolean} Whether entity is in an Ancient City
   */
  isInAncientCity(position, world) {
    if (!world || !world.structures) return false;
    
    // Check if there's an Ancient City at this position
    const x = Math.floor(position.x);
    const y = Math.floor(position.y);
    const z = Math.floor(position.z);
    
    return world.structures.some(structure => {
      return (
        structure.type === 'ancient_city' &&
        x >= structure.minX && x <= structure.maxX &&
        y >= structure.minY && y <= structure.maxY &&
        z >= structure.minZ && z <= structure.maxZ
      );
    });
  }
  
  /**
   * Get a deterministic random number based on coordinates
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {string} salt - String to modify the random result
   * @returns {number} Random number between 0 and 1
   */
  getRandomFromCoords(x, z, salt) {
    const hash = Math.sin(x * 12.9898 + z * 78.233 + salt.charCodeAt(0) * 43758.5453) * 43758.5453;
    return hash - Math.floor(hash);
  }
}

module.exports = DeepDarkBiome; 