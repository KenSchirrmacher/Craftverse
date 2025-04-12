/**
 * Base Biome class
 * Provides default implementation and structure for all biomes
 */
class Biome {
  /**
   * Create a new biome
   * @param {Object} props - Biome properties
   */
  constructor(props = {}) {
    // Basic biome information
    this.id = props.id || 'unknown';
    this.name = props.name || 'Unknown Biome';
    this.color = props.color || '#FFFFFF';
    
    // Climate parameters
    this.temperatureRange = props.temperatureRange || { min: -1.0, max: 1.0 };
    this.precipitationRange = props.precipitationRange || { min: 0.0, max: 1.0 };
    this.continentalnessRange = props.continentalnessRange || { min: 0.0, max: 1.0 };
    this.erosionRange = props.erosionRange || { min: 0.0, max: 1.0 };
    this.weirdnessRange = props.weirdnessRange || { min: -1.0, max: 1.0 };
    
    // Terrain properties
    this.baseHeight = props.baseHeight || 64;
    this.heightVariation = props.heightVariation || 4;
    this.hilliness = props.hilliness || 0.5;
    
    // Block types
    this.topBlock = props.topBlock || { id: 'grass_block', metadata: 0 };
    this.fillerBlock = props.fillerBlock || { id: 'dirt', metadata: 0 };
    this.undergroundBlock = props.undergroundBlock || { id: 'stone', metadata: 0 };
    this.underwaterBlock = props.underwaterBlock || { id: 'gravel', metadata: 0 };
    
    // Vegetation density
    this.treeDensity = props.treeDensity !== undefined ? props.treeDensity : 0.1;
    this.grassDensity = props.grassDensity !== undefined ? props.grassDensity : 0.3;
    this.flowerDensity = props.flowerDensity !== undefined ? props.flowerDensity : 0.05;
    
    // Features and structures
    this.features = props.features || [];
    this.structures = props.structures || [];
    
    // Mob spawning
    this.spawnRates = props.spawnRates || {
      passive: {},
      neutral: {},
      hostile: {}
    };
    
    // Weather and visual properties
    this.weatherProperties = props.weatherProperties || {
      rainChance: 0.25,
      thunderChance: 0.05,
      fogDensity: 0.0,
      temperature: 0.5,
      rainfall: 0.5
    };
    
    this.visualEffects = props.visualEffects || {
      skyColor: '#7BA4FF',
      fogColor: '#C0D8FF',
      waterColor: '#3F76E4',
      waterFogColor: '#050533',
      grassColor: '#91BD59',
      foliageColor: '#77AB2F'
    };
    
    this.ambientSounds = props.ambientSounds || {
      day: ['ambient.generic.day'],
      night: ['ambient.generic.night'],
      mood: ['ambient.generic.mood']
    };
    
    // Mob spawning lists
    this.mobSpawnLists = props.mobSpawnLists || {
      passive: [
        { type: 'sheep', weight: 12, minCount: 2, maxCount: 4 },
        { type: 'pig', weight: 10, minCount: 2, maxCount: 4 },
        { type: 'chicken', weight: 10, minCount: 2, maxCount: 4 },
        { type: 'cow', weight: 8, minCount: 2, maxCount: 4 }
      ],
      neutral: [
        { type: 'wolf', weight: 5, minCount: 1, maxCount: 4 },
        { type: 'spider', weight: 10, minCount: 1, maxCount: 3 },
        { type: 'enderman', weight: 1, minCount: 1, maxCount: 1 }
      ],
      hostile: [
        { type: 'zombie', weight: 10, minCount: 1, maxCount: 4 },
        { type: 'skeleton', weight: 10, minCount: 1, maxCount: 4 },
        { type: 'creeper', weight: 8, minCount: 1, maxCount: 2 }
      ]
    };
  }

  /**
   * Check if this biome is valid for the given climate parameters
   * @param {Object} climate - Climate parameters
   * @returns {boolean} - Whether this biome is valid
   */
  isValidForClimate(climate) {
    // Check if climate parameters are within the biome's valid ranges
    if (climate.temperature < this.temperatureRange.min || 
        climate.temperature > this.temperatureRange.max) {
      return false;
    }
    
    if (climate.precipitation < this.precipitationRange.min || 
        climate.precipitation > this.precipitationRange.max) {
      return false;
    }
    
    if (climate.continentalness < this.continentalnessRange.min || 
        climate.continentalness > this.continentalnessRange.max) {
      return false;
    }
    
    if (climate.erosion < this.erosionRange.min || 
        climate.erosion > this.erosionRange.max) {
      return false;
    }
    
    if (climate.weirdness < this.weirdnessRange.min || 
        climate.weirdness > this.weirdnessRange.max) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate how well this biome fits the given climate parameters
   * @param {Object} climate - Climate parameters
   * @returns {number} - Fitness score (0-1, higher is better)
   */
  getFitnessScore(climate) {
    // If not a valid climate, return 0
    if (!this.isValidForClimate(climate)) {
      return 0;
    }
    
    // Calculate distance from climate parameters to range midpoints
    const tempMid = (this.temperatureRange.min + this.temperatureRange.max) / 2;
    const tempDist = 1 - Math.abs(climate.temperature - tempMid) / 
      ((this.temperatureRange.max - this.temperatureRange.min) / 2);
    
    const precipMid = (this.precipitationRange.min + this.precipitationRange.max) / 2;
    const precipDist = 1 - Math.abs(climate.precipitation - precipMid) / 
      ((this.precipitationRange.max - this.precipitationRange.min) / 2);
    
    const contMid = (this.continentalnessRange.min + this.continentalnessRange.max) / 2;
    const contDist = 1 - Math.abs(climate.continentalness - contMid) / 
      ((this.continentalnessRange.max - this.continentalnessRange.min) / 2);
    
    const erosionMid = (this.erosionRange.min + this.erosionRange.max) / 2;
    const erosionDist = 1 - Math.abs(climate.erosion - erosionMid) / 
      ((this.erosionRange.max - this.erosionRange.min) / 2);
    
    const weirdMid = (this.weirdnessRange.min + this.weirdnessRange.max) / 2;
    const weirdDist = 1 - Math.abs(climate.weirdness - weirdMid) / 
      ((this.weirdnessRange.max - this.weirdnessRange.min) / 2);
    
    // Weight the parameters by importance
    // Temperature and precipitation are most important for biome selection
    const weights = {
      temperature: 0.35,
      precipitation: 0.25,
      continentalness: 0.2,
      erosion: 0.15,
      weirdness: 0.05
    };
    
    // Calculate weighted score
    const score = tempDist * weights.temperature +
      precipDist * weights.precipitation +
      contDist * weights.continentalness +
      erosionDist * weights.erosion +
      weirdDist * weights.weirdness;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Gets the terrain height at the specified coordinates
   * Default implementation for basic noise-based terrain
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate 
   * @param {Object} noiseGenerators - Noise generators
   * @returns {number} - Terrain height at this position
   */
  getHeight(x, z, noiseGenerators) {
    // Basic height generation uses two noise layers
    const baseNoise = noiseGenerators.heightNoise ? 
      noiseGenerators.heightNoise.get(x * 0.01, z * 0.01) : 
      Math.sin(x * 0.01) * Math.cos(z * 0.01);
    
    const detailNoise = noiseGenerators.detailNoise ? 
      noiseGenerators.detailNoise.get(x * 0.05, z * 0.05) : 
      Math.sin(x * 0.05) * Math.cos(z * 0.05);
    
    // Base terrain shape
    const baseHeight = this.baseHeight + (baseNoise * this.heightVariation * this.hilliness);
    
    // Add small details
    const detailHeight = detailNoise * 1.5 * this.hilliness;
    
    return baseHeight + detailHeight;
  }

  /**
   * Get block at specified coordinates
   * Default implementation for basic layer-based terrain
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate 
   * @param {number} z - Z coordinate
   * @param {number} surfaceHeight - Height of the surface at this position
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Object} - Block type {id, metadata} at this position
   */
  getBlockAt(x, y, z, surfaceHeight, noiseGenerators) {
    // Air above surface
    if (y > surfaceHeight) {
      return { id: 'air', metadata: 0 };
    }
    
    // Top layer (usually grass or similar)
    if (y === surfaceHeight) {
      return this.topBlock;
    }
    
    // Filler layer (usually dirt or similar, several blocks deep)
    if (y >= surfaceHeight - 3) {
      return this.fillerBlock;
    }
    
    // Underground layer (usually stone)
    return this.undergroundBlock;
  }

  /**
   * Get features to place at specified coordinates
   * Default implementation for basic feature generation
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Seeded random function
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Array} - Array of features to place at this position
   */
  getFeaturesAt(x, z, random, noiseGenerators) {
    const features = [];
    
    // Tree generation
    if (random() < this.treeDensity) {
      features.push({
        type: 'tree',
        id: 'oak_tree',
        x, z
      });
    }
    
    // Grass generation
    if (random() < this.grassDensity) {
      features.push({
        type: 'vegetation',
        id: 'grass',
        x, z
      });
    }
    
    // Flower generation
    if (random() < this.flowerDensity) {
      const flowerType = random() < 0.5 ? 'poppy' : 'dandelion';
      features.push({
        type: 'vegetation',
        id: flowerType,
        x, z
      });
    }
    
    return features;
  }

  /**
   * Get structures to place at specified coordinates
   * Default implementation for basic structure generation
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Seeded random function
   * @returns {Array} - Array of structures to place at this position
   */
  getStructuresAt(x, z, random) {
    const structures = [];
    
    // Default implementation just uses the predefined structures
    for (const structure of this.structures) {
      if (random() < (structure.weight || 0.001)) {
        structures.push({
          type: 'structure',
          id: structure.id,
          x, z
        });
      }
    }
    
    return structures;
  }

  /**
   * Get the mob spawn list for this biome
   * @param {string} category - Mob category: 'passive', 'neutral', or 'hostile'
   * @param {Object} options - Additional options for spawn selection
   * @param {boolean} options.isDaytime - Whether it's daytime (affects hostile mob spawning)
   * @param {number} options.moonPhase - Moon phase (0-7, affects some mob spawning)
   * @param {boolean} options.isRaining - Whether it's raining (affects some mob spawning)
   * @returns {Array} - Array of mob spawn entries for the requested category
   */
  getMobSpawnList(category, options = {}) {
    const { isDaytime = true, moonPhase = 0, isRaining = false } = options;
    
    // Default mob lists from the biome
    const spawnList = [...(this.mobSpawnLists[category] || [])];
    
    // Apply time and weather based modifications
    if (category === 'hostile') {
      // Reduce hostile mob spawning during daytime
      if (isDaytime) {
        // Keep only mobs that can spawn in daylight, reduce spawn rates
        return spawnList
          .filter(entry => this.canSpawnInDaylight(entry.type))
          .map(entry => ({
            ...entry,
            weight: Math.max(1, Math.floor(entry.weight * 0.5)) // Reduce weights during day
          }));
      }
      
      // Full moon increases some hostile mob spawning
      if (moonPhase === 0) {
        // Increase zombie and skeleton spawn rates during full moon
        spawnList.forEach(entry => {
          if (entry.type === 'zombie' || entry.type === 'skeleton') {
            entry.weight = Math.floor(entry.weight * 1.5);
            entry.maxCount += 1;
          }
        });
      }
    }
    
    // Weather effects
    if (isRaining) {
      // Some mobs are more common during rain
      spawnList.forEach(entry => {
        if (entry.type === 'enderman') {
          // Endermen don't like rain
          entry.weight = Math.max(1, Math.floor(entry.weight * 0.5));
        }
      });
    }
    
    return spawnList;
  }
  
  /**
   * Check if a mob type can spawn in daylight
   * @private
   * @param {string} mobType - Type of mob to check
   * @returns {boolean} - Whether the mob can spawn in daylight
   */
  canSpawnInDaylight(mobType) {
    // In a real implementation, would be more comprehensive
    const dayTimeHostileMobs = ['spider']; // Spiders are neutral in daylight
    return dayTimeHostileMobs.includes(mobType);
  }

  /**
   * Get mob spawn rates for a specific type
   * @param {string} type - Mob type (passive, neutral, hostile)
   * @returns {Object} - Spawn rates for this biome
   */
  getMobSpawnRates(type) {
    return this.spawnRates[type] || {};
  }

  /**
   * Get weather properties for this biome
   * @returns {Object} - Weather properties
   */
  getWeatherProperties() {
    return this.weatherProperties;
  }

  /**
   * Get visual effects for this biome
   * @returns {Object} - Visual effect properties
   */
  getVisualEffects() {
    return this.visualEffects;
  }

  /**
   * Get ambient sounds for this biome
   * @param {string} timeOfDay - Time of day ('day' or 'night')
   * @returns {Array} - List of ambient sounds
   */
  getAmbientSounds(timeOfDay) {
    return this.ambientSounds[timeOfDay] || this.ambientSounds.day;
  }
}

module.exports = Biome; 