// Base Biome class that defines common functionality for all biomes
class BiomeBase {
  constructor(options = {}) {
    // Basic biome properties
    this.id = options.id || 'unknown';
    this.name = options.name || 'Unknown Biome';
    this.color = options.color || '#7FBF7F'; // Default color (medium green)
    
    // Climate properties
    this.temperature = options.temperature || 0.5; // 0.0 to 1.0 (coldest to hottest)
    this.precipitation = options.precipitation || 0.5; // 0.0 to 1.0 (driest to wettest)
    this.continentalness = options.continentalness || 0.5; // 0.0 to 1.0 (ocean to inland)
    this.erosion = options.erosion || 0.5; // 0.0 to 1.0 (flat to mountainous)
    this.weirdness = options.weirdness || 0.5; // 0.0 to 1.0 (normal to weird)
    
    // Visual properties
    this.fogColor = options.fogColor || '#E0FFFF'; // Light cyan default fog
    this.fogDensity = options.fogDensity || 0.0; // 0.0 to 1.0 (no fog to dense fog)
    this.waterColor = options.waterColor || '#3F76E4'; // Default water color
    this.waterFogColor = options.waterFogColor || '#50533'; // Default underwater fog color
    this.grassColor = options.grassColor || '#7FBF7F'; // Default grass color
    this.foliageColor = options.foliageColor || '#59C93C'; // Default foliage color
    
    // Surface configuration
    this.topBlock = options.topBlock || 'grass'; // Default top block
    this.fillerBlock = options.fillerBlock || 'dirt'; // Default filler block
    this.underwaterBlock = options.underwaterBlock || 'sand'; // Default underwater block
    this.oceanFloorBlock = options.oceanFloorBlock || 'gravel'; // Default ocean floor block
    
    // Height configuration
    this.baseHeight = options.baseHeight || 0.1; // Average terrain height
    this.heightVariation = options.heightVariation || 0.2; // Amount of height variation
    
    // Feature properties (trees, structures, etc.)
    this.features = options.features || [];
    this.structures = options.structures || [];
    
    // Mob spawning
    this.mobSpawns = options.mobSpawns || {};
    
    // Decorations (flowers, grass, etc.)
    this.decorations = options.decorations || [];
    
    // Sound properties
    this.ambientSound = options.ambientSound || null;
    this.ambientParticles = options.ambientParticles || null;
  }

  // Evaluate how well this biome matches the given climate parameters (0-1)
  evaluateMatch(params) {
    // Calculate distance in 5D climate space
    const tDiff = Math.abs(params.temperature - this.temperature);
    const pDiff = Math.abs(params.precipitation - this.precipitation);
    const cDiff = Math.abs(params.continentalness - this.continentalness);
    const eDiff = Math.abs(params.erosion - this.erosion);
    const wDiff = Math.abs(params.weirdness - this.weirdness);
    
    // Weight differences (temperature and precipitation are most important)
    const weightedDiff = tDiff * 1.2 + pDiff * 1.0 + cDiff * 0.8 + eDiff * 0.6 + wDiff * 0.4;
    
    // Convert to a 0-1 match score (1 = perfect match, 0 = terrible match)
    return Math.max(0, 1 - weightedDiff);
  }

  // Get height at a specific position
  getHeightAt(x, z, baseNoise) {
    // Default implementation applies the biome's height factors to the base noise
    return baseNoise * this.heightVariation + this.baseHeight;
  }

  // Get surface and filler blocks at a specific position and depth
  getSurfaceBlock(x, y, z, depth, isUnderwater) {
    if (isUnderwater) {
      // Underwater blocks
      if (depth === 0) {
        return this.underwaterBlock;
      } else if (depth < 4) {
        return this.fillerBlock;
      }
    } else {
      // Above water blocks
      if (depth === 0) {
        return this.topBlock;
      } else if (depth < 3) {
        return this.fillerBlock;
      }
    }
    
    // Default to stone for deeper layers
    return 'stone';
  }

  // Get block variants for decoration within this biome
  getDecorationBlocks() {
    return this.decorations;
  }

  // Check whether a feature can generate at a specific position
  canGenerateFeatureAt(featureType, x, y, z, random) {
    // Default implementation - check if feature is in the features list
    return this.features.includes(featureType);
  }

  // Get list of mobs that can spawn in this biome
  getMobSpawns() {
    return this.mobSpawns;
  }

  // Calculate fog intensity at a specific position
  getFogIntensity(x, y, z, timeOfDay, weather) {
    // Default implementation - return the base fog density
    return this.fogDensity;
  }
  
  // Get block at specific coordinates for this biome
  getBlockAt(x, y, z, options = {}) {
    const { 
      height = 0, 
      seaLevel = 64, 
      isCliff = false,
      random = Math.random 
    } = options;
    
    // Determine if we're underwater
    const isUnderwater = y < seaLevel;
    
    // Calculate depth from the surface
    const depth = Math.max(0, height - y);

    // Get basic surface/filler block
    if (y < height) {
      return this.getSurfaceBlock(x, y, z, depth, isUnderwater);
    }
    
    // Air above the surface
    if (y > height) {
      return 'air';
    }
    
    // Water in oceans/lakes
    if (isUnderwater) {
      return 'water';
    }
    
    // Fallback
    return 'air';
  }
  
  // Get climate category for this biome
  getClimateCategory() {
    // Temperature categories
    if (this.temperature < 0.2) return 'frozen';
    if (this.temperature < 0.4) return 'cold';
    if (this.temperature < 0.7) return 'temperate';
    if (this.temperature < 0.9) return 'warm';
    return 'hot';
  }
  
  // Get precipitation type for this biome based on temperature
  getPrecipitationType() {
    if (this.temperature < 0.15) return 'snow';
    if (this.temperature < 0.95) return 'rain';
    return 'none'; // Too hot for rain
  }
  
  // Check if biome is ocean
  isOcean() {
    return this.continentalness < 0.3;
  }
  
  // Check if biome is mountainous
  isMountainous() {
    return this.erosion < 0.3;
  }
  
  // Check if biome is a river type
  isRiver() {
    return false; // Override in river subclasses
  }
  
  // Basic transitions to other biomes (can be overridden)
  getTransitions() {
    return {
      // Default transitions based on temperature changes
      colder: null, // Biome to transition to when getting colder
      warmer: null, // Biome to transition to when getting warmer
      wetter: null, // Biome to transition to when getting wetter
      drier: null,  // Biome to transition to when getting drier
      hillier: null, // Biome to transition to when getting more mountainous
      flatter: null  // Biome to transition to when getting flatter
    };
  }

  /**
   * Determine if this biome is valid for the given climate parameters
   * @param {Object} params - Climate parameters
   * @returns {boolean}
   */
  isValidForClimate(params) {
    // Use a threshold for match score (e.g., 0.6)
    return this.evaluateMatch(params) >= 0.6;
  }

  /**
   * Get a fitness score for this biome given climate parameters
   * @param {Object} params - Climate parameters
   * @returns {number} - Fitness score (higher is better)
   */
  getFitnessScore(params) {
    return this.evaluateMatch(params);
  }
}

module.exports = BiomeBase; 