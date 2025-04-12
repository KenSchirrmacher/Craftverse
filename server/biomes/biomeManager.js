const { FBMNoise, RidgedNoise } = require('../utils/noiseGenerator');
const { 
  getTemperatureCategory, 
  getHumidityCategory, 
  getExpectedTerrainType,
  BiomeTemperature,
  BiomeHumidity 
} = require('./biomeTypes');

/**
 * BiomeManager handles biome selection, blending, and transitions
 * for world generation and climate systems
 */
class BiomeManager {
  /**
   * Create a new BiomeManager
   * @param {Object} options - Configuration options
   * @param {Array} options.biomes - List of available biome instances
   * @param {Object} options.noiseGenerators - Noise generators for climate parameters
   * @param {number} options.blendRadius - Radius for biome blending in blocks (default: 8)
   */
  constructor(options = {}) {
    this.biomes = options.biomes || [];
    this.noiseGenerators = options.noiseGenerators || {};
    this.blendRadius = options.blendRadius || 8;
    
    // Cache for biome selection results
    this.biomeCache = new Map();
    this.maxCacheSize = 10000; // Prevent memory issues
    
    // Create lookup maps for quick access
    this.biomeById = new Map();
    this.biomes.forEach(biome => {
      this.biomeById.set(biome.id, biome);
    });
  }

  /**
   * Add a biome to the manager
   * @param {Biome} biome - Biome instance to add
   */
  addBiome(biome) {
    this.biomes.push(biome);
    this.biomeById.set(biome.id, biome);
    this.biomeCache.clear(); // Clear cache as biome selection may change
  }

  /**
   * Remove a biome from the manager
   * @param {string} biomeId - ID of the biome to remove
   * @returns {boolean} - Whether the biome was successfully removed
   */
  removeBiome(biomeId) {
    const index = this.biomes.findIndex(b => b.id === biomeId);
    if (index !== -1) {
      this.biomes.splice(index, 1);
      this.biomeById.delete(biomeId);
      this.biomeCache.clear();
      return true;
    }
    return false;
  }

  /**
   * Get a biome by ID
   * @param {string} biomeId - ID of the biome to retrieve
   * @returns {Biome|null} - The biome instance or null if not found
   */
  getBiome(biomeId) {
    return this.biomeById.get(biomeId) || null;
  }

  /**
   * Generate climate parameters for a given position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {number} seed - World seed
   * @returns {Object} - Climate parameters
   */
  getClimateParams(x, z, seed) {
    // Use the provided noise generators or create defaults
    const temperatureNoise = this.noiseGenerators.temperature || 
      { get: (x, z) => Math.sin(x * 0.05) * Math.cos(z * 0.05) };
    
    const precipitationNoise = this.noiseGenerators.precipitation || 
      { get: (x, z) => (Math.sin(x * 0.1 + seed * 0.01) + 1) * 0.5 };
    
    const continentalnessNoise = this.noiseGenerators.continentalness || 
      { get: (x, z) => (Math.cos(x * 0.03 + z * 0.03) + 1) * 0.5 };
    
    const erosionNoise = this.noiseGenerators.erosion || 
      { get: (x, z) => (Math.sin(x * 0.2 + seed * 0.02) + 1) * 0.5 };
    
    const weirdnessNoise = this.noiseGenerators.weirdness || 
      { get: (x, z) => Math.sin(x * 0.1 + z * 0.1 + seed * 0.03) };

    // Calculate climate parameters from noise generators
    return {
      temperature: temperatureNoise.get(x, z),
      precipitation: precipitationNoise.get(x, z),
      continentalness: continentalnessNoise.get(x, z),
      erosion: erosionNoise.get(x, z),
      weirdness: weirdnessNoise.get(x, z)
    };
  }

  /**
   * Select the most appropriate biome for the given climate parameters
   * @param {Object} climate - Climate parameters
   * @returns {Biome} - The selected biome
   */
  selectBiome(climate) {
    // Find all biomes that are valid for these climate parameters
    const validBiomes = this.biomes.filter(biome => 
      biome.isValidForClimate(climate)
    );
    
    if (validBiomes.length === 0) {
      // If no valid biomes, return a default biome (first in the list)
      return this.biomes[0] || null;
    }
    
    // Calculate fitness scores for all valid biomes
    const biomeScores = validBiomes.map(biome => ({
      biome,
      score: biome.getFitnessScore(climate)
    }));
    
    // Sort by score (highest first)
    biomeScores.sort((a, b) => b.score - a.score);
    
    // Return the biome with the highest score
    return biomeScores[0].biome;
  }

  /**
   * Get the biome at a specific world position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {number} seed - World seed
   * @returns {Biome} - The selected biome
   */
  getBiomeAt(x, z, seed) {
    // Check cache first
    const cacheKey = `${x}:${z}:${seed}`;
    if (this.biomeCache.has(cacheKey)) {
      return this.biomeCache.get(cacheKey);
    }
    
    // Generate climate parameters for this position
    const climate = this.getClimateParams(x, z, seed);
    
    // Select the most appropriate biome
    const biome = this.selectBiome(climate);
    
    // Cache the result
    this.biomeCache.set(cacheKey, biome);
    
    // Prevent cache from growing too large
    if (this.biomeCache.size > this.maxCacheSize) {
      // Remove oldest entries (first 10% of max size)
      const keysToDelete = Array.from(this.biomeCache.keys())
        .slice(0, Math.floor(this.maxCacheSize * 0.1));
      
      keysToDelete.forEach(key => this.biomeCache.delete(key));
    }
    
    return biome;
  }

  /**
   * Get interpolated biome data for smooth transitions
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {number} seed - World seed
   * @returns {Object} - Interpolated biome data
   */
  getBlendedBiomeData(x, z, seed) {
    if (this.blendRadius <= 0) {
      // No blending, just return the biome at this position
      const biome = this.getBiomeAt(x, z, seed);
      return {
        biome,
        blendFactor: 1.0,
        neighborBiomes: []
      };
    }
    
    // Get neighboring biomes for blending
    const neighbors = [];
    const centerBiome = this.getBiomeAt(x, z, seed);
    
    // Sample points in a circle around the target position
    const samplePoints = 8; // Number of sample points
    for (let i = 0; i < samplePoints; i++) {
      const angle = (Math.PI * 2 * i) / samplePoints;
      const sampleX = x + Math.cos(angle) * this.blendRadius;
      const sampleZ = z + Math.sin(angle) * this.blendRadius;
      
      const sampleBiome = this.getBiomeAt(sampleX, sampleZ, seed);
      
      // Only add if it's different from center biome
      if (sampleBiome && sampleBiome.id !== centerBiome.id) {
        // Check if we already have this biome in our list
        const existingNeighbor = neighbors.find(n => n.biome.id === sampleBiome.id);
        
        if (existingNeighbor) {
          // Increase weight if we already have this biome
          existingNeighbor.weight += 1 / samplePoints;
        } else {
          // Add new neighbor
          neighbors.push({
            biome: sampleBiome,
            weight: 1 / samplePoints,
            distance: this.blendRadius
          });
        }
      }
    }
    
    return {
      biome: centerBiome,
      blendFactor: 1.0 - (neighbors.reduce((sum, n) => sum + n.weight, 0) * 0.5),
      neighborBiomes: neighbors
    };
  }

  /**
   * Get interpolated terrain height with biome blending
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {number} seed - World seed
   * @returns {number} - Blended terrain height
   */
  getBlendedHeight(x, z, seed) {
    const { biome, blendFactor, neighborBiomes } = this.getBlendedBiomeData(x, z, seed);
    
    // Calculate the primary biome's height
    let height = biome.getHeight(x, z, this.noiseGenerators) * blendFactor;
    
    // Blend with neighboring biomes
    for (const neighbor of neighborBiomes) {
      const neighborHeight = neighbor.biome.getHeight(x, z, this.noiseGenerators);
      height += neighborHeight * neighbor.weight;
    }
    
    return height;
  }

  /**
   * Get the block at a position with biome blending
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} seed - World seed
   * @returns {Object} - Block data {id, metadata}
   */
  getBlockAt(x, y, z, seed) {
    const surfaceHeight = this.getBlendedHeight(x, z, seed);
    const { biome, blendFactor, neighborBiomes } = this.getBlendedBiomeData(x, z, seed);
    
    // If we're above all biomes' max height or below all biomes' min height,
    // we can just use the center biome's block
    if (y > surfaceHeight + 10 || y < surfaceHeight - 20) {
      return biome.getBlockAt(x, y, z, surfaceHeight, this.noiseGenerators);
    }
    
    // For blocks near the surface, we may need to blend between biomes
    // Get the primary block
    const primaryBlock = biome.getBlockAt(x, y, z, surfaceHeight, this.noiseGenerators);
    
    // Special case: if primary block is air or water, no need to blend
    if (primaryBlock.id === 'air' || primaryBlock.id === 'water') {
      return primaryBlock;
    }
    
    // Check if any neighboring biomes have different blocks at this position
    for (const neighbor of neighborBiomes) {
      // Calculate the height for this neighbor biome
      const neighborHeight = neighbor.biome.getHeight(x, z, this.noiseGenerators);
      
      // Get the block from the neighbor biome
      const neighborBlock = neighbor.biome.getBlockAt(
        x, y, z, neighborHeight, this.noiseGenerators
      );
      
      // If near the surface and blocks differ, use weighted random selection
      if (y >= Math.min(surfaceHeight, neighborHeight) - 3 &&
          y <= Math.max(surfaceHeight, neighborHeight) + 1 &&
          neighborBlock.id !== primaryBlock.id) {
        
        // Use weighted random to determine which block to use
        const random = this.pseudoRandom(x, y, z, seed);
        
        // If the random value is less than the neighbor's weight, use the neighbor's block
        if (random < neighbor.weight) {
          return neighborBlock;
        }
      }
    }
    
    // Default to the primary biome's block
    return primaryBlock;
  }

  /**
   * Get features to place at this position with biome blending
   * @param {number} x - X coordinate 
   * @param {number} z - Z coordinate
   * @param {number} seed - World seed
   * @returns {Array} - Array of features to place
   */
  getFeaturesAt(x, z, seed) {
    const { biome, blendFactor, neighborBiomes } = this.getBlendedBiomeData(x, z, seed);
    const features = [];
    
    // Pseudo-random generator for this position
    const random = () => this.pseudoRandom(x, z, features.length, seed);
    
    // Get features from the primary biome
    if (random() < blendFactor) {
      const primaryFeatures = biome.getFeaturesAt(x, z, random, this.noiseGenerators);
      features.push(...primaryFeatures);
    }
    
    // Get features from neighboring biomes
    for (const neighbor of neighborBiomes) {
      if (random() < neighbor.weight) {
        const neighborFeatures = neighbor.biome.getFeaturesAt(
          x, z, random, this.noiseGenerators
        );
        features.push(...neighborFeatures);
      }
    }
    
    return features;
  }

  /**
   * Get structures to place at this position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {number} seed - World seed
   * @returns {Array} - Array of structures to place
   */
  getStructuresAt(x, z, seed) {
    // Structures aren't blended - just use the primary biome
    const biome = this.getBiomeAt(x, z, seed);
    const random = () => this.pseudoRandom(x, z, 0, seed);
    
    return biome.getStructuresAt(x, z, random);
  }

  /**
   * Deterministic pseudo-random number generator based on position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} seed - World seed
   * @returns {number} - Random number between 0 and 1
   */
  pseudoRandom(x, y, z, seed) {
    // Simple implementation of mulberry32 algorithm
    let a = x * 374761393 + y * 668265263 + z * 2654435761 + seed;
    a = (a ^ (a >>> 13)) >>> 0;
    a = (a * 1597334677) >>> 0;
    a = (a ^ (a >>> 16)) >>> 0;
    return (a >>> 0) / 4294967296;
  }

  /**
   * Clear the biome cache
   */
  clearCache() {
    this.biomeCache.clear();
  }

  /**
   * Get interpolated climate parameters for biome transitions
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {number} seed - World seed
   * @returns {Object} - Climate parameters with categories
   */
  getDetailedClimateParams(x, z, seed) {
    // Get basic climate parameters
    const climate = this.getClimateParams(x, z, seed);
    
    // Add categorizations
    return {
      ...climate,
      temperatureCategory: getTemperatureCategory(climate.temperature),
      humidityCategory: getHumidityCategory(climate.precipitation),
      terrainType: getExpectedTerrainType(climate)
    };
  }

  /**
   * Get biomes that match a specific climate category
   * @param {string} temperatureCategory - Temperature category
   * @param {string} humidityCategory - Humidity category 
   * @returns {Array} - Array of matching biomes
   */
  getBiomesByClimateCategory(temperatureCategory, humidityCategory) {
    return this.biomes.filter(biome => {
      // Calculate biome's average temperature and precipitation
      const avgTemp = (biome.temperatureRange.min + biome.temperatureRange.max) / 2;
      const avgPrecip = (biome.precipitationRange.min + biome.precipitationRange.max) / 2;
      
      // Check if it matches the categories
      const biomeTemp = getTemperatureCategory(avgTemp);
      const biomeHumidity = getHumidityCategory(avgPrecip);
      
      return biomeTemp === temperatureCategory && biomeHumidity === humidityCategory;
    });
  }
}

module.exports = BiomeManager; 