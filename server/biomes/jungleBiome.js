const Biome = require('./baseBiome');

/**
 * Jungle biome - dense tropical forest with unique structures
 * Represents hot, wet regions with lush vegetation
 */
class JungleBiome extends Biome {
  /**
   * Create a new Jungle biome
   * @param {Object} props - Optional properties to override defaults
   */
  constructor(props = {}) {
    // Call parent constructor with jungle-specific defaults
    super({
      id: 'jungle',
      name: 'Jungle',
      color: '#58B31F',
      
      // Climate ranges - jungle is hot and wet
      temperatureRange: { min: 0.7, max: 1.0 },
      precipitationRange: { min: 0.8, max: 1.0 },
      continentalnessRange: { min: 0.3, max: 0.7 },
      erosionRange: { min: 0.2, max: 0.8 },
      weirdnessRange: { min: -0.5, max: 0.5 },
      
      // Terrain properties
      baseHeight: 70,
      heightVariation: 10,
      hilliness: 0.6,
      
      // Block types
      topBlock: { id: 'grass_block', metadata: 0 },
      fillerBlock: { id: 'dirt', metadata: 0 },
      undergroundBlock: { id: 'stone', metadata: 0 },
      underwaterBlock: { id: 'clay', metadata: 0 },
      
      // Vegetation - very dense
      treeDensity: 0.8,   // Extremely dense trees
      grassDensity: 0.6,  // Lots of grass
      flowerDensity: 0.3, // Moderate flowers
      
      // Features and structures
      features: [
        { id: 'jungle_tree', weight: 0.5 },
        { id: 'jungle_tree_large', weight: 0.2 },
        { id: 'bamboo', weight: 0.1 },
        { id: 'vines', weight: 0.4 },
        { id: 'cocoa_beans', weight: 0.05 },
        { id: 'melon', weight: 0.01 },
        { id: 'fern', weight: 0.2 }
      ],
      structures: [
        { id: 'jungle_temple', weight: 0.0001 }
      ],
      
      // Mob spawn rates
      spawnRates: {
        passive: {
          parrot: 0.2,
          ocelot: 0.2,
          panda: 0.05
        },
        neutral: {
          wolf: 0.1
        },
        hostile: {
          zombie: 0.2,
          skeleton: 0.2,
          spider: 0.3,
          creeper: 0.2
        }
      },
      
      // Weather properties
      weatherProperties: {
        rainChance: 0.7,     // Frequent rain
        thunderChance: 0.2,  // Occasional storms
        fogDensity: 0.05,    // Misty/foggy
        temperature: 1.2,    // Hot
        rainfall: 0.9        // Very wet
      },
      
      // Visual and sound effects
      visualEffects: {
        skyColor: '#88B4FF',
        fogColor: '#64A23D',  // Green-tinted fog
        waterColor: '#14A09E',
        waterFogColor: '#0A4242',
        grassColor: '#59C93C', // Vibrant green
        foliageColor: '#30BB0B'
      },
      
      ambientSounds: {
        day: ['ambient.jungle.day'],
        night: ['ambient.jungle.night'],
        mood: ['ambient.jungle.mood']
      },
      
      // Mob spawning lists with jungle-specific weights
      mobSpawnLists: {
        passive: [
          { type: 'parrot', weight: 10, minCount: 1, maxCount: 2 },
          { type: 'ocelot', weight: 8, minCount: 1, maxCount: 2 },
          { type: 'panda', weight: 5, minCount: 1, maxCount: 2 }
        ],
        neutral: [
          { type: 'wolf', weight: 5, minCount: 1, maxCount: 4 },
          { type: 'enderman', weight: 5, minCount: 1, maxCount: 1 }
        ],
        hostile: [
          { type: 'zombie', weight: 12, minCount: 1, maxCount: 4 },
          { type: 'skeleton', weight: 12, minCount: 1, maxCount: 4 },
          { type: 'spider', weight: 15, minCount: 1, maxCount: 4 },
          { type: 'creeper', weight: 5, minCount: 1, maxCount: 2 }
        ]
      },
      
      // Override any properties provided
      ...props
    });
  }

  /**
   * Gets the terrain height at the specified coordinates
   * Implementation specific to jungle biome
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate 
   * @param {Object} noiseGenerators - Noise generators
   * @returns {number} - Terrain height at this position
   */
  getHeight(x, z, noiseGenerators) {
    // Get base height from parent method
    const baseHeight = super.getHeight(x, z, noiseGenerators);
    
    // Jungle has more varied terrain - use additional noise
    const jungleNoise = noiseGenerators.jungle ? 
      noiseGenerators.jungle.get(x * 0.04, z * 0.04) : 
      Math.sin(x * 0.03) * Math.cos(z * 0.03);
    
    // Use jungle noise to create more varied terrain
    const jungleHeight = (jungleNoise + 1) * 3;
    
    // Add occasional hills to the base height
    return baseHeight + jungleHeight;
  }

  /**
   * Get block at specified coordinates with jungle-specific generation
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
    
    // Add podzol patches in some areas
    if (block.id === 'grass_block' && y === surfaceHeight) {
      const podzolNoise = noiseGenerators.podzol ? 
        noiseGenerators.podzol.get(x * 0.1, z * 0.1) : 
        (Math.sin(x * 0.3) * Math.cos(z * 0.3) + 1) / 2;
      
      if (podzolNoise > 0.75) {
        return { id: 'podzol', metadata: 0 };
      }
    }
    
    // More clay near water
    if (y < this.seaLevel + 2 && y > this.seaLevel - 3 && block.id === 'dirt') {
      return { id: 'clay', metadata: 0 };
    }
    
    return block;
  }

  /**
   * Get features at specified coordinates with jungle-specific generation
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Seeded random function
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Array} - Array of features to place at this position
   */
  getFeaturesAt(x, z, random, noiseGenerators) {
    const features = [];
    
    // Jungle trees - extremely common
    if (random() < 0.1) {
      // Decide between normal and large jungle trees
      const isLarge = random() < 0.3;
      
      features.push({
        type: 'tree',
        variant: isLarge ? 'jungle_large' : 'jungle',
        height: isLarge ? 15 + Math.floor(random() * 10) : 7 + Math.floor(random() * 5)
      });
    }
    
    // Bamboo clusters
    if (random() < 0.05) {
      features.push({
        type: 'bamboo',
        height: 6 + Math.floor(random() * 8),
        count: 3 + Math.floor(random() * 10)
      });
    }
    
    // Vines on trees
    if (random() < 0.4) {
      features.push({
        type: 'vines',
        length: 3 + Math.floor(random() * 5)
      });
    }
    
    // Melon blocks - rare
    if (random() < 0.005) {
      features.push({
        type: 'melon'
      });
    }
    
    // Ferns and grass
    if (random() < 0.4) {
      features.push({
        type: random() < 0.3 ? 'fern' : 'grass',
        tall: random() < 0.4
      });
    }
    
    return features;
  }

  /**
   * Get structures to generate at the specified coordinates
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Seeded random function
   * @returns {Array} - Array of structures to place at this position
   */
  getStructuresAt(x, z, random) {
    const structures = [];
    
    // Jungle temples - rare structures with traps and treasure
    if (random() < 0.001) {
      structures.push({
        type: 'structure',
        id: 'jungle_temple'
      });
    }
    
    return structures;
  }
}

module.exports = JungleBiome; 