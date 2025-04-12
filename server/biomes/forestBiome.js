const Biome = require('./baseBiome');

/**
 * Forest biome - dense woodland with many trees and undergrowth
 * Represents temperate forests with moderate rainfall and abundant vegetation
 */
class ForestBiome extends Biome {
  /**
   * Create a new Forest biome
   * @param {Object} options - Optional properties to override defaults
   */
  constructor(options = {}) {
    // Call parent constructor with forest-specific defaults
    super({
      id: options.id || 'forest',
      name: options.name || 'Forest',
      color: options.color || '#4F7F18',
      
      // Climate ranges - forests are temperate biomes with higher rainfall
      temperatureRange: { min: 0.4, max: 0.7 },
      precipitationRange: { min: 0.5, max: 1.0 },
      continentalnessRange: { min: 0.3, max: 0.6 },
      erosionRange: { min: 0.2, max: 0.8 },
      weirdnessRange: { min: -0.8, max: 0.8 },
      
      // Terrain properties
      baseHeight: 70,
      heightVariation: 8,
      hilliness: 0.6,
      
      // Block types
      topBlock: { id: 'grass_block', metadata: 0 },
      fillerBlock: { id: 'dirt', metadata: 0 },
      undergroundBlock: { id: 'stone', metadata: 0 },
      underwaterBlock: { id: 'dirt', metadata: 0 },
      
      // Vegetation - dense
      treeDensity: 0.7,    // Many trees
      grassDensity: 0.8,    // Moderate grass
      flowerDensity: 0.1,   // Some flowers
      
      // Features and structures
      features: [
        { id: 'oak_tree', weight: 0.6 },
        { id: 'birch_tree', weight: 0.3 },
        { id: 'dark_oak_tree', weight: 0.1 },
        { id: 'fern', weight: 0.4 },
        { id: 'large_fern', weight: 0.2 },
        { id: 'grass', weight: 0.6 },
        { id: 'tall_grass', weight: 0.3 },
        { id: 'flowers', weight: 0.2 },
        { id: 'mushrooms', weight: 0.1 }
      ],
      structures: [
        { id: 'fallen_log', weight: 0.02 },
        { id: 'forest_rock', weight: 0.01 },
        { id: 'beehive', weight: 0.005 }
      ],
      
      // Mob spawning lists with forest-specific weights
      mobSpawnLists: {
        passive: [
          { type: 'sheep', weight: 12, minCount: 2, maxCount: 4 },
          { type: 'pig', weight: 10, minCount: 2, maxCount: 4 },
          { type: 'chicken', weight: 10, minCount: 2, maxCount: 4 },
          { type: 'cow', weight: 8, minCount: 2, maxCount: 4 },
          { type: 'wolf', weight: 5, minCount: 2, maxCount: 6 } // Wolves are more common in forests
        ],
        neutral: [
          { type: 'wolf', weight: 8, minCount: 1, maxCount: 4 }, // Higher chance in forests
          { type: 'spider', weight: 10, minCount: 1, maxCount: 3 },
          { type: 'enderman', weight: 1, minCount: 1, maxCount: 1 }
        ],
        hostile: [
          { type: 'zombie', weight: 10, minCount: 1, maxCount: 4 },
          { type: 'skeleton', weight: 10, minCount: 1, maxCount: 4 },
          { type: 'creeper', weight: 8, minCount: 1, maxCount: 2 }
        ]
      },
      
      // Weather properties
      weatherProperties: {
        rainChance: 0.45,
        thunderChance: 0.1,
        fogDensity: 0.1,
        temperature: 0.7,    // Moderate temperature
        rainfall: 0.8        // High rainfall
      },
      
      // Visual and sound effects
      visualEffects: {
        skyColor: '#78A7FF',
        fogColor: '#B9D1FF',
        waterColor: '#3F76E4',
        waterFogColor: '#050533',
        grassColor: '#5CAC46',
        foliageColor: '#4F9F35'
      },
      
      ambientSounds: {
        day: ['ambient.forest.day'],
        night: ['ambient.forest.night'],
        mood: ['ambient.forest.mood']
      },
      
      // Override any properties provided
      ...options
    });
    
    // Add additional forest features
    this.features.push(
      { type: 'tree', variant: 'oak', frequency: 0.05 },
      { type: 'tree', variant: 'birch', frequency: 0.03 },
      { type: 'plant', blockType: 'fern', frequency: 0.1 },
      { type: 'plant', blockType: 'grass', frequency: 0.2 },
      { type: 'plant', blockType: 'flowers', frequency: 0.05 }
    );
    
    // Add forest structures
    this.structures.push(
      { type: 'fallen_tree', frequency: 0.02 },
      { type: 'boulder_pile', frequency: 0.01 }
    );
  }

  /**
   * Gets the terrain height at the specified coordinates
   * Implementation specific to forest biome
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate 
   * @param {Object} noiseGenerators - Noise generators
   * @returns {number} - Terrain height at this position
   */
  getHeight(x, z, noiseGenerators) {
    // Get base height from parent method
    const baseHeight = super.getHeight(x, z, noiseGenerators);
    
    // Forests have uneven terrain with occasional hills and valleys
    const forestNoise = noiseGenerators.forest ? 
      noiseGenerators.forest.get(x * 0.04, z * 0.04) : 
      Math.sin(x * 0.03) * Math.cos(z * 0.03);
    
    // Add small hills and depressions
    const hillEffect = forestNoise * 5;
    
    // Add occasional larger hills
    const largeHillNoise = noiseGenerators.largeHills ? 
      noiseGenerators.largeHills.get(x * 0.015, z * 0.015) : 
      Math.sin(x * 0.01 + z * 0.02);
    
    // If large hill noise is high enough, add a significant hill
    const largeHillEffect = largeHillNoise > 0.7 ? (largeHillNoise - 0.7) * 15 : 0;
    
    return baseHeight + hillEffect + largeHillEffect;
  }

  /**
   * Get block at specified coordinates with forest-specific generation
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
    
    // Forest-specific modification: add podzol patches in denser areas
    if (block.id === 'grass_block') {
      const forestDensityNoise = noiseGenerators.forestDensity ? 
        noiseGenerators.forestDensity.get(x, z) : 
        (Math.sin(x * 0.1) * Math.cos(z * 0.1) + 1) / 2;
      
      if (forestDensityNoise > 0.85) {
        return { id: 'podzol', metadata: 0 };
      }
    }
    
    // Add occasional mossy cobblestone boulders underground
    if (block.id === 'stone' && y <= surfaceHeight - 2 && y >= surfaceHeight - 10) {
      const mossyNoise = noiseGenerators.mossy ? 
        noiseGenerators.mossy.get(x, z) : 
        (Math.sin(x * 0.5) * Math.cos(z * 0.5) + 1) / 2;
      
      if (mossyNoise > 0.92) {
        return { id: 'mossy_cobblestone', metadata: 0 };
      }
    }
    
    return block;
  }

  /**
   * Get features at specified coordinates with forest-specific generation
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Seeded random function
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Array} - Array of features to place at this position
   */
  getFeaturesAt(x, z, random, noiseGenerators) {
    const features = [];
    
    // Calculate forest density for this position
    const forestDensityNoise = noiseGenerators.forestDensity ? 
      noiseGenerators.forestDensity.get(x * 0.1, z * 0.1) : 
      (Math.sin(x * 0.05) * Math.cos(z * 0.05) + 1) / 2;
    
    // Adjust tree density based on forest density noise
    const localTreeDensity = this.treeDensity * (forestDensityNoise * 0.5 + 0.5);
    
    // Tree placement - common in forests
    if (random() < localTreeDensity) {
      // Determine tree type
      const treeTypeRoll = random();
      let treeType;
      
      if (treeTypeRoll < 0.6) {
        treeType = 'oak_tree';
      } else if (treeTypeRoll < 0.9) {
        treeType = 'birch_tree';
      } else {
        treeType = 'dark_oak_tree';
      }
      
      // Determine tree size
      const sizeVariation = 1 + (random() * 0.5 - 0.25); // 0.75-1.25x size variation
      
      features.push({
        type: 'tree',
        id: treeType,
        size: sizeVariation,
        x, z
      });
    }
    
    // Fern placement
    if (random() < 0.2 * forestDensityNoise) {
      // Sometimes generate large ferns
      const isLarge = random() < 0.2;
      features.push({
        type: 'vegetation',
        id: isLarge ? 'large_fern' : 'fern',
        x, z
      });
    }
    
    // Grass placement - less common in dense forest (less sunlight)
    if (random() < this.grassDensity * (1 - forestDensityNoise * 0.5)) {
      // Different grass heights
      const grassHeight = Math.floor(random() * 2) + 1;
      features.push({
        type: 'vegetation',
        id: grassHeight > 1 ? 'tall_grass' : 'grass',
        height: grassHeight,
        x, z
      });
    }
    
    // Mushroom placement - more common in dense forest
    if (random() < 0.05 * forestDensityNoise) {
      const mushroomType = random() < 0.5 ? 'red_mushroom' : 'brown_mushroom';
      features.push({
        type: 'vegetation',
        id: mushroomType,
        x, z
      });
    }
    
    // Flower placement - less common in dense forest
    if (random() < this.flowerDensity * (1 - forestDensityNoise * 0.7)) {
      // Select flower type based on position
      const flowerTypes = ['poppy', 'dandelion', 'blue_orchid', 'allium', 'azure_bluet'];
      const flowerIndex = Math.floor(random() * flowerTypes.length);
      
      features.push({
        type: 'vegetation',
        id: flowerTypes[flowerIndex],
        x, z
      });
    }
    
    // Berry bushes - occasional
    if (random() < 0.02 * forestDensityNoise) {
      features.push({
        type: 'vegetation',
        id: 'sweet_berry_bush',
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
    
    // Fallen logs - relatively common forest structure
    if (random() < 0.001) {
      // Determine log orientation (0-3 = north, east, south, west)
      const orientation = Math.floor(random() * 4);
      
      structures.push({
        type: 'structure',
        id: 'fallen_log',
        orientation,
        x, z
      });
    }
    
    // Forest rocks - large boulders
    if (random() < 0.0005) {
      // Determine rock size (1-3)
      const size = Math.floor(random() * 3) + 1;
      
      structures.push({
        type: 'structure',
        id: 'forest_rock',
        size,
        x, z
      });
    }
    
    // Beehives - rare
    if (random() < 0.0002) {
      structures.push({
        type: 'structure',
        id: 'beehive',
        x, z
      });
    }
    
    return structures;
  }
}

module.exports = ForestBiome; 