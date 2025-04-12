const Biome = require('./baseBiome');

/**
 * Plains biome - flat grassland with occasional trees and flowers
 * Represents temperate grasslands with mild weather and fertile soil
 */
class PlainsBiome extends Biome {
  /**
   * Create a new Plains biome
   * @param {Object} props - Optional properties to override defaults
   */
  constructor(props = {}) {
    // Call parent constructor with plains-specific defaults
    super({
      id: 'plains',
      name: 'Plains',
      color: '#91BD59',
      
      // Climate ranges - plains are temperate biomes
      temperatureRange: { min: -0.2, max: 0.4 },
      precipitationRange: { min: 0.3, max: 0.7 },
      continentalnessRange: { min: 0.4, max: 0.8 },
      erosionRange: { min: 0.3, max: 0.8 },
      weirdnessRange: { min: -0.5, max: 0.5 },
      
      // Terrain properties
      baseHeight: 68,
      heightVariation: 2.5,
      hilliness: 0.3,
      
      // Block types
      topBlock: { id: 'grass_block', metadata: 0 },
      fillerBlock: { id: 'dirt', metadata: 0 },
      undergroundBlock: { id: 'stone', metadata: 0 },
      underwaterBlock: { id: 'sand', metadata: 0 },
      
      // Vegetation
      treeDensity: 0.02,    // Sparse trees
      grassDensity: 0.8,    // Lots of grass
      flowerDensity: 0.4,   // Some flowers
      
      // Features and structures
      features: [
        { id: 'oak_tree', weight: 0.7 },
        { id: 'birch_tree', weight: 0.3 },
        { id: 'tall_grass', weight: 1.0 },
        { id: 'flowers', weight: 0.5 },
        { id: 'grass', weight: 1.0 }
      ],
      structures: [
        { id: 'village', weight: 0.01 },
        { id: 'well', weight: 0.005 }
      ],
      
      // Mob spawn rates
      spawnRates: {
        passive: {
          sheep: 0.3,
          cow: 0.3,
          horse: 0.2,
          rabbit: 0.1,
          chicken: 0.1
        },
        neutral: {
          wolf: 0.05
        },
        hostile: {
          zombie: 0.3,
          skeleton: 0.3,
          spider: 0.3,
          creeper: 0.1
        }
      },
      
      // Weather properties
      weatherProperties: {
        rainChance: 0.25,
        thunderChance: 0.05,
        fogDensity: 0.1,
        temperature: 0.8,    // Warm but not hot
        rainfall: 0.4        // Moderate rainfall
      },
      
      // Visual and sound effects
      visualEffects: {
        skyColor: '#7BA4FF',
        fogColor: '#C0D8FF',
        waterColor: '#3F76E4',
        waterFogColor: '#050533',
        grassColor: '#91BD59',
        foliageColor: '#77AB2F'
      },
      
      ambientSounds: {
        day: ['ambient.plains.day'],
        night: ['ambient.plains.night'],
        mood: ['ambient.plains.mood']
      },
      
      // Override any properties provided
      ...props
    });
  }

  /**
   * Gets the terrain height at the specified coordinates
   * Implementation specific to plains biome
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate 
   * @param {Object} noiseGenerators - Noise generators
   * @returns {number} - Terrain height at this position
   */
  getHeight(x, z, noiseGenerators) {
    // Get base height from parent method
    const baseHeight = super.getHeight(x, z, noiseGenerators);
    
    // Plains have rolling hills with occasional flat areas
    const flatnessNoise = noiseGenerators.flatness ? 
      noiseGenerators.flatness.get(x * 0.02, z * 0.02) : 
      Math.sin(x * 0.01) * Math.cos(z * 0.01);
    
    // If flatness is high, make terrain more flat
    const flatness = Math.pow((flatnessNoise + 1) / 2, 2) * 0.8;
    
    // Use parent height but reduce variation in flat areas
    return this.baseHeight + (baseHeight - this.baseHeight) * (1 - flatness);
  }

  /**
   * Get block at specified coordinates with plains-specific generation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate 
   * @param {number} z - Z coordinate
   * @param {number} surfaceHeight - Height of the surface at this position
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Object} - Block type {id, metadata} at this position
   */
  getBlockAt(x, y, z, surfaceHeight, noiseGenerators) {
    // Use parent implementation for basic block selection
    const block = super.getBlockAt(x, y, z, surfaceHeight, noiseGenerators);
    
    // Plains-specific modification: add coarse dirt patches
    if (block.id === 'dirt') {
      const coarseDirtNoise = noiseGenerators.coarseDirt ? 
        noiseGenerators.coarseDirt.get(x, z) : 
        (Math.sin(x * 0.4) * Math.cos(z * 0.4) + 1) / 2;
      
      if (coarseDirtNoise > 0.85) {
        return { id: 'coarse_dirt', metadata: 0 };
      }
    }
    
    // Add stone patches on surface for rocky outcrops
    if (block.id === 'grass_block') {
      const stoneNoise = noiseGenerators.stone ? 
        noiseGenerators.stone.get(x, z) : 
        (Math.sin(x * 0.2 + z * 0.3) + 1) / 2;
      
      if (stoneNoise > 0.92) {
        return { id: 'stone', metadata: 0 };
      }
    }
    
    return block;
  }

  /**
   * Get features at specified coordinates with plains-specific generation
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Seeded random function
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Array} - Array of features to place at this position
   */
  getFeaturesAt(x, z, random, noiseGenerators) {
    const features = [];
    
    // Determine base vegetation density
    const vegetationNoise = noiseGenerators.vegetation ? 
      noiseGenerators.vegetation.get(x, z) : 
      (Math.sin(x * 0.1) * Math.cos(z * 0.1) + 1) / 2;
    
    // Tree placement
    if (random() < this.treeDensity * vegetationNoise) {
      // Determine tree type - mostly oak with some birch
      const treeType = random() < 0.8 ? 'oak_tree' : 'birch_tree';
      features.push({
        type: 'tree',
        id: treeType,
        x, z
      });
    }
    
    // Grass placement - common in plains
    if (random() < this.grassDensity * vegetationNoise) {
      // Different grass heights
      const grassHeight = Math.floor(random() * 3) + 1;
      features.push({
        type: 'vegetation',
        id: grassHeight > 1 ? 'tall_grass' : 'grass',
        height: grassHeight,
        x, z
      });
    }
    
    // Flower placement - clusters of flowers
    if (random() < this.flowerDensity * vegetationNoise) {
      // Select flower type based on position
      const flowerTypes = ['poppy', 'dandelion', 'cornflower', 'oxeye_daisy'];
      const flowerIndex = Math.floor(random() * flowerTypes.length);
      
      features.push({
        type: 'vegetation',
        id: flowerTypes[flowerIndex],
        x, z
      });
    }
    
    return features;
  }

  /**
   * Get structures to place at specified coordinates
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Seeded random function
   * @returns {Array} - Array of structures to place at this position
   */
  getStructuresAt(x, z, random) {
    const structures = [];
    
    // Villages are common in plains but still rare overall
    if (random() < 0.001) {
      // Only place village if there's enough flat space
      structures.push({
        type: 'structure',
        id: 'village',
        variant: 'plains',
        x, z
      });
    }
    
    // Wells can appear occasionally
    if (random() < 0.0005) {
      structures.push({
        type: 'structure',
        id: 'well',
        x, z
      });
    }
    
    return structures;
  }
}

module.exports = PlainsBiome; 