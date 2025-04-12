/**
 * EndIslandsBiome - Represents the Outer End Islands biome
 */

const NoiseGenerator = require('../utils/noiseGenerator');
const ChorusPlantBlock = require('../blocks/chorusPlantBlock');

class EndIslandsBiome {
  /**
   * Create a new End Islands biome
   * @param {Object} options - Biome options
   * @param {Number} options.seed - World seed
   * @param {Object} options.server - Server instance
   */
  constructor(options = {}) {
    this.id = 'end_islands';
    this.name = 'End Islands';
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    this.server = options.server;
    
    // Biome properties
    this.temperature = 0.5;
    this.humidity = 0.5;
    this.precipitation = 'none';
    this.category = 'end';
    
    // Visual properties
    this.fogColor = '#A080A0';
    this.skyColor = '#000000';
    this.waterColor = '#3F76E4';
    this.waterFogColor = '#050533';
    
    // End islands are floating in the void
    this.baseHeight = 0;
    this.heightVariation = 0.5;
    
    // Initialize noise generators
    this.initNoiseGenerators();
    
    // Block types
    this.surfaceBlock = 'end_stone';
    this.subsurfaceBlock = 'end_stone';
    this.stoneBlock = 'end_stone';
    
    // Features
    this.features = {
      chorusPlants: {
        chance: 0.05,
        minHeight: 1,
        maxHeight: 5
      },
      endStonePillars: {
        chance: 0.02,
        minHeight: 3,
        maxHeight: 10
      },
      endCities: {
        chance: 0.01
      }
    };
    
    // Mob spawns
    this.mobSpawns = {
      enderman: {
        weight: 10,
        minGroupSize: 1,
        maxGroupSize: 4
      },
      shulker: {
        weight: 2,
        minGroupSize: 1,
        maxGroupSize: 1,
        onlyNearEndCities: true
      }
    };
  }
  
  /**
   * Initialize noise generators for terrain generation
   */
  initNoiseGenerators() {
    // Primary terrain noise determines if there's an island at all
    this.terrainNoise = new NoiseGenerator.FBMNoise({
      seed: this.seed,
      octaves: 6,
      persistence: 0.5,
      lacunarity: 2.0,
      scale: 100
    });
    
    // Secondary noise for height details
    this.heightNoise = new NoiseGenerator.FBMNoise({
      seed: this.seed + 1,
      octaves: 4,
      persistence: 0.5,
      lacunarity: 2.0,
      scale: 50
    });
    
    // Noise for feature placement
    this.featureNoise = new NoiseGenerator.InterpolatedNoise({
      seed: this.seed + 2,
      scale: 40
    });
  }
  
  /**
   * Generate terrain for this biome
   * @param {Number} x - World X coordinate
   * @param {Number} z - World Z coordinate
   * @param {Object} world - World instance
   * @returns {Array} Generated column of blocks
   */
  generateTerrain(x, z, world) {
    const blocks = [];
    
    // Calculate island value at this position
    const islandValue = this.terrainNoise.get2D(x, z);
    
    // Islands only exist where noise value is high enough
    if (islandValue > 0.75) {
      // Determine island size based on noise value
      const islandSize = (islandValue - 0.75) * 20; // Up to 5 blocks thick
      
      // Calculate base height for this position
      const baseHeight = 64; // Base height for end islands
      
      // Apply height variation
      const heightVariation = this.heightNoise.get2D(x, z) * 10;
      const surfaceHeight = Math.round(baseHeight + heightVariation);
      
      // Generate end stone
      for (let y = surfaceHeight - islandSize; y <= surfaceHeight; y++) {
        blocks.push({ y, type: this.surfaceBlock });
      }
      
      // Add features on the surface if applicable
      if (world) {
        this.addFeatures(x, surfaceHeight, z, world);
      }
    }
    
    return blocks;
  }
  
  /**
   * Add biome-specific features
   * @param {Number} x - World X coordinate
   * @param {Number} y - Surface Y coordinate
   * @param {Number} z - World Z coordinate
   * @param {Object} world - World instance
   */
  addFeatures(x, y, z, world) {
    // Only add features if there's end stone below
    if (world.getBlockType({ x, y: y - 1, z }) !== 'end_stone') {
      return;
    }
    
    // Chorus plants
    const chorusValue = this.featureNoise.getValue(x, 0, z);
    if (chorusValue > 1 - this.features.chorusPlants.chance) {
      const maxHeight = this.features.chorusPlants.maxHeight;
      ChorusPlantBlock.generatePlant({ x, y, z }, world, this.server, maxHeight);
    }
    
    // End stone pillars
    const pillarValue = this.featureNoise.getValue(x + 50, 0, z + 50);
    if (pillarValue > 1 - this.features.endStonePillars.chance) {
      this.generateEndStonePillar(x, y, z, world);
    }
    
    // End cities (placeholder for more complex generation)
    const cityValue = this.featureNoise.getValue(x + 100, 0, z + 100);
    if (cityValue > 1 - this.features.endCities.chance) {
      // Check if there's enough space for a city
      if (this.checkSpaceForCity(x, y, z, world)) {
        this.generateEndCity(x, y, z, world);
      }
    }
  }
  
  /**
   * Generate an end stone pillar
   * @param {Number} x - World X coordinate
   * @param {Number} y - Surface Y coordinate
   * @param {Number} z - World Z coordinate
   * @param {Object} world - World instance
   */
  generateEndStonePillar(x, y, z, world) {
    // Determine pillar height
    const minHeight = this.features.endStonePillars.minHeight;
    const maxHeight = this.features.endStonePillars.maxHeight;
    const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    
    // Create the pillar
    for (let dy = 0; dy < height; dy++) {
      world.setBlock({ x, y: y + dy, z }, { type: 'end_stone' });
    }
    
    // Sometimes add a chorus plant on top
    if (Math.random() < 0.3) {
      ChorusPlantBlock.generatePlant({ x, y: y + height, z }, world, this.server, 3);
    }
  }
  
  /**
   * Check if there's enough space for an end city
   * @param {Number} x - World X coordinate
   * @param {Number} y - Surface Y coordinate
   * @param {Number} z - World Z coordinate
   * @param {Object} world - World instance
   * @returns {Boolean} Whether there's enough space
   */
  checkSpaceForCity(x, y, z, world) {
    // Check for a minimum flat area (simple check for now)
    const radius = 10;
    let flatArea = true;
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const pos = { x: x + dx, y, z: z + dz };
        const blockBelow = world.getBlockType({ x: pos.x, y: pos.y - 1, z: pos.z });
        
        if (blockBelow !== 'end_stone') {
          flatArea = false;
          break;
        }
      }
      
      if (!flatArea) break;
    }
    
    return flatArea;
  }
  
  /**
   * Generate an end city (placeholder)
   * @param {Number} x - World X coordinate
   * @param {Number} y - Surface Y coordinate
   * @param {Number} z - World Z coordinate
   * @param {Object} world - World instance
   */
  generateEndCity(x, y, z, world) {
    // This is a placeholder for end city generation
    // In a real implementation, this would use a structure generator
    
    // For now, just place a marker block
    world.setBlock({ x, y, z }, { type: 'purpur_block' });
    
    // Build a small tower as a placeholder
    for (let dy = 1; dy < 10; dy++) {
      world.setBlock({ x, y: y + dy, z }, { type: 'purpur_block' });
    }
    
    // Add an end rod on top
    world.setBlock({ x, y: y + 10, z }, { type: 'end_rod' });
    
    // Mark this area as having an end city (for mob spawning)
    if (world.setStructureAt) {
      world.setStructureAt({ x, y, z }, 'end_city');
    }
  }
  
  /**
   * Get the surface and subsurface block types for a specific position
   * @param {Number} x - World X coordinate
   * @param {Number} z - World Z coordinate
   * @returns {Object} Surface and subsurface block types
   */
  getSurfaceBlocks(x, z) {
    return {
      surface: this.surfaceBlock,
      subsurface: this.subsurfaceBlock
    };
  }
  
  /**
   * Get the climate parameters for a specific position
   * @param {Number} x - World X coordinate
   * @param {Number} z - World Z coordinate
   * @returns {Object} Climate parameters
   */
  getClimateParams(x, z) {
    return {
      temperature: this.temperature,
      humidity: this.humidity,
      precipitation: this.precipitation
    };
  }
  
  /**
   * Get mob spawns for this biome
   * @param {Number} x - World X coordinate
   * @param {Number} z - World Z coordinate
   * @param {Object} world - World instance
   * @returns {Array} Array of possible mob spawns
   */
  getMobSpawns(x, z, world) {
    const spawns = [];
    
    // Add enderman spawns
    spawns.push({
      type: 'enderman',
      weight: this.mobSpawns.enderman.weight,
      minGroupSize: this.mobSpawns.enderman.minGroupSize,
      maxGroupSize: this.mobSpawns.enderman.maxGroupSize
    });
    
    // Add shulker spawns only near end cities
    if (world && world.getStructureAt && world.getStructureAt({ x, y: 0, z }, 'end_city', 64)) {
      spawns.push({
        type: 'shulker',
        weight: this.mobSpawns.shulker.weight,
        minGroupSize: this.mobSpawns.shulker.minGroupSize,
        maxGroupSize: this.mobSpawns.shulker.maxGroupSize
      });
    }
    
    return spawns;
  }
  
  /**
   * Serializes the biome
   * @returns {Object} Serialized biome data
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      seed: this.seed,
      temperature: this.temperature,
      humidity: this.humidity,
      precipitation: this.precipitation,
      category: this.category
    };
  }
  
  /**
   * Creates a new End Islands biome from serialized data
   * @param {Object} data - Serialized biome data
   * @param {Object} server - Server instance
   * @returns {EndIslandsBiome} New End Islands biome
   */
  static deserialize(data, server) {
    return new EndIslandsBiome({
      seed: data.seed,
      server
    });
  }
}

module.exports = EndIslandsBiome; 