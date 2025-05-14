/**
 * Deep Dark Biome - A rare underground biome featuring sculk growth and ancient city structures
 */

const { Biome } = require('./baseBiome');

class DeepDarkBiome extends Biome {
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
          { type: 'creeper', weight: 5, minCount: 1, maxCount: 1 }
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
   */
  applyEntityEffects(entity, duration) {
    // Apply darkness effect to players in Deep Dark
    if (entity.type === 'player' && this.hasDarkness && duration > 100) {
      entity.addStatusEffect('darkness', {
        duration: 200,
        amplifier: 0,
        showParticles: false
      });
    }
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