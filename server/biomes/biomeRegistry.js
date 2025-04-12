/**
 * BiomeRegistry manages all available biomes in the game
 * Handles registration, retrieval, and default biome set
 */

const PlainsBiome = require('./plainsBiome');
const DesertBiome = require('./desertBiome');
const ForestBiome = require('./forestBiome');
const MountainsBiome = require('./mountainsBiome');
const OceanBiome = require('./oceanBiome');
const NetherWastesBiome = require('./netherWastesBiome');
const SoulSandValleyBiome = require('./soulSandValleyBiome');
const CrimsonForestBiome = require('./crimsonForestBiome');
const WarpedForestBiome = require('./warpedForestBiome');
const BasaltDeltasBiome = require('./basaltDeltasBiome');

class BiomeRegistry {
  /**
   * Create a new BiomeRegistry
   */
  constructor() {
    this.biomes = new Map();
    this.biomeList = [];
    this.defaultBiome = null;
    this.defaultNetherBiome = null;
    
    // Register default biomes
    this.registerDefaultBiomes();
  }

  /**
   * Register default biomes that come with the game
   * @private
   */
  registerDefaultBiomes() {
    // Register basic overworld biomes
    const plains = new PlainsBiome();
    const desert = new DesertBiome();
    const forest = new ForestBiome();
    const mountains = new MountainsBiome();
    
    // Register ocean variants
    const ocean = new OceanBiome();
    const deepOcean = new OceanBiome({ isDeep: true });
    const frozenOcean = new OceanBiome({ isFrozen: true });
    const frozenDeepOcean = new OceanBiome({ isDeep: true, isFrozen: true });
    
    // Register nether biomes
    const netherWastes = new NetherWastesBiome();
    const soulSandValley = new SoulSandValleyBiome();
    const crimsonForest = new CrimsonForestBiome();
    const warpedForest = new WarpedForestBiome();
    const basaltDeltas = new BasaltDeltasBiome();
    
    // Register all overworld biomes
    this.registerBiome(plains);
    this.registerBiome(desert);
    this.registerBiome(forest);
    this.registerBiome(mountains);
    this.registerBiome(ocean);
    this.registerBiome(deepOcean);
    this.registerBiome(frozenOcean);
    this.registerBiome(frozenDeepOcean);
    
    // Register all nether biomes
    this.registerBiome(netherWastes);
    this.registerBiome(soulSandValley);
    this.registerBiome(crimsonForest);
    this.registerBiome(warpedForest);
    this.registerBiome(basaltDeltas);
    
    // Set plains as the default overworld biome
    this.defaultBiome = plains;
    
    // Set nether wastes as the default nether biome
    this.defaultNetherBiome = netherWastes;
  }

  /**
   * Register a biome to the registry
   * @param {Biome} biome - The biome to register
   * @returns {boolean} - Whether the registration was successful
   */
  registerBiome(biome) {
    if (!biome || !biome.id) {
      console.error('Attempted to register invalid biome');
      return false;
    }
    
    if (this.biomes.has(biome.id)) {
      console.error(`Biome with ID ${biome.id} is already registered`);
      return false;
    }
    
    this.biomes.set(biome.id, biome);
    this.biomeList.push(biome);
    return true;
  }

  /**
   * Unregister a biome from the registry
   * @param {string} biomeId - ID of the biome to unregister
   * @returns {boolean} - Whether the unregistration was successful
   */
  unregisterBiome(biomeId) {
    if (!this.biomes.has(biomeId)) {
      return false;
    }
    
    const biome = this.biomes.get(biomeId);
    this.biomes.delete(biomeId);
    
    const index = this.biomeList.indexOf(biome);
    if (index !== -1) {
      this.biomeList.splice(index, 1);
    }
    
    // If we removed the default biome, set a new one if available
    if (this.defaultBiome && this.defaultBiome.id === biomeId) {
      this.defaultBiome = this.biomeList.length > 0 ? this.biomeList[0] : null;
    }
    
    return true;
  }

  /**
   * Get a biome by its ID
   * @param {string} biomeId - ID of the biome to get
   * @returns {Biome|null} - The biome, or null if not found
   */
  getBiome(biomeId) {
    return this.biomes.get(biomeId) || null;
  }

  /**
   * Get all registered biomes
   * @returns {Array<Biome>} - Array of all registered biomes
   */
  getAllBiomes() {
    return [...this.biomeList];
  }

  /**
   * Set the default biome
   * @param {string} biomeId - ID of the biome to set as default
   * @returns {boolean} - Whether setting the default was successful
   */
  setDefaultBiome(biomeId) {
    const biome = this.getBiome(biomeId);
    if (!biome) {
      return false;
    }
    
    this.defaultBiome = biome;
    return true;
  }

  /**
   * Get the default biome
   * @returns {Biome|null} - The default biome, or null if none set
   */
  getDefaultBiome() {
    return this.defaultBiome;
  }

  /**
   * Get all biomes that are valid for a set of climate parameters
   * @param {Object} climate - Climate parameters
   * @returns {Array<Biome>} - Array of valid biomes
   */
  getBiomesForClimate(climate) {
    return this.biomeList.filter(biome => biome.isValidForClimate(climate));
  }

  /**
   * Get the best biome for a set of climate parameters
   * @param {Object} climate - Climate parameters
   * @returns {Biome} - The best matching biome, or default if none match
   */
  getBestBiomeForClimate(climate) {
    const validBiomes = this.getBiomesForClimate(climate);
    
    if (validBiomes.length === 0) {
      return this.defaultBiome;
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
   * Get a list of biomes by terrain type
   * @param {string} terrainType - Type of terrain (e.g. 'land', 'ocean', 'mountain')
   * @returns {Array<Biome>} - Array of biomes matching the terrain type
   */
  getBiomesByTerrainType(terrainType) {
    switch (terrainType.toLowerCase()) {
      case 'ocean':
        return this.biomeList.filter(biome => 
          biome.id.includes('ocean')
        );
        
      case 'mountain':
        return this.biomeList.filter(biome => 
          biome.id.includes('mountain') || biome.id.includes('hill')
        );
        
      case 'land':
        return this.biomeList.filter(biome => 
          !biome.id.includes('ocean')
        );
        
      case 'forest':
        return this.biomeList.filter(biome => 
          biome.id.includes('forest')
        );
        
      case 'desert':
        return this.biomeList.filter(biome => 
          biome.id.includes('desert')
        );
        
      default:
        return [];
    }
  }

  /**
   * Get biomes by temperature category
   * @param {string} category - Temperature category ('frozen', 'cold', 'temperate', 'warm', 'hot')
   * @returns {Array<Biome>} - Array of biomes in the temperature category
   */
  getBiomesByTemperature(category) {
    // Define temperature ranges for each category
    const ranges = {
      frozen: { min: -1.0, max: 0.0 },
      cold: { min: 0.0, max: 0.3 },
      temperate: { min: 0.3, max: 0.6 },
      warm: { min: 0.6, max: 0.8 },
      hot: { min: 0.8, max: 1.0 }
    };
    
    const range = ranges[category.toLowerCase()];
    if (!range) {
      return [];
    }
    
    return this.biomeList.filter(biome => {
      // Check if the biome's temperature range overlaps with the category range
      const biomeMin = biome.temperatureRange.min !== undefined ? 
        biome.temperatureRange.min : -1.0;
      const biomeMax = biome.temperatureRange.max !== undefined ? 
        biome.temperatureRange.max : 1.0;
      
      // Check for overlap between ranges
      return !(biomeMax < range.min || biomeMin > range.max);
    });
  }

  /**
   * Get all nether biomes from the registry
   * @returns {Array<Biome>} - Array of all nether biomes
   */
  getNetherBiomes() {
    return this.biomeList.filter(biome => biome.isNether);
  }
  
  /**
   * Get the default nether biome
   * @returns {Biome|null} - The default nether biome, or null if none set
   */
  getDefaultNetherBiome() {
    return this.defaultNetherBiome;
  }
  
  /**
   * Set the default nether biome
   * @param {string} biomeId - ID of the biome to set as default nether biome
   * @returns {boolean} - Whether setting the default was successful
   */
  setDefaultNetherBiome(biomeId) {
    const biome = this.getBiome(biomeId);
    if (!biome || !biome.isNether) {
      return false;
    }
    
    this.defaultNetherBiome = biome;
    return true;
  }
  
  /**
   * Get biomes by dimension
   * @param {string} dimension - Dimension ID ('overworld', 'nether', 'end')
   * @returns {Array<Biome>} - Array of biomes for the dimension
   */
  getBiomesByDimension(dimension) {
    return this.biomeList.filter(biome => {
      if (dimension === 'nether') {
        return biome.isNether;
      } else if (dimension === 'end') {
        return biome.isEnd;
      } else {
        return !biome.isNether && !biome.isEnd;
      }
    });
  }
  
  /**
   * Get the best biome for a set of climate parameters in a specific dimension
   * @param {Object} climate - Climate parameters
   * @param {string} dimension - Dimension ID ('overworld', 'nether', 'end')
   * @returns {Biome} - The best matching biome, or default if none match
   */
  getBestBiomeForClimateInDimension(climate, dimension) {
    // Add dimension to climate parameters
    const climateWithDimension = {
      ...climate,
      dimension
    };
    
    const validBiomes = this.getBiomesByDimension(dimension)
      .filter(biome => biome.isValidForClimate(climateWithDimension));
    
    if (validBiomes.length === 0) {
      return dimension === 'nether' ? this.defaultNetherBiome : this.defaultBiome;
    }
    
    // Calculate fitness scores for all valid biomes
    const biomeScores = validBiomes.map(biome => ({
      biome,
      score: biome.getFitnessScore(climateWithDimension)
    }));
    
    // Sort by score (highest first)
    biomeScores.sort((a, b) => b.score - a.score);
    
    // Return the biome with the highest score
    return biomeScores[0].biome;
  }
}

// Create and export a singleton instance
const registry = new BiomeRegistry();
module.exports = registry; 