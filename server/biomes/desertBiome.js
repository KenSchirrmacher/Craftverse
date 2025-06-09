const BiomeBase = require('./biomeBase');

/**
 * Desert biome - sandy, hot biome with few vegetation and structures
 * Represents arid regions with extreme heat and minimal rainfall
 */
class DesertBiome extends BiomeBase {
  /**
   * Create a new Desert biome
   * @param {Object} props - Optional properties to override defaults
   */
  constructor(props = {}) {
    // Call parent constructor with desert-specific defaults
    super({
      id: 'desert',
      name: 'Desert',
      color: '#FFDB81',
      
      // Climate values - desert is hot and dry (using midpoint of ranges)
      temperature: 0.8, // Mid-point of 0.6 to 1.0
      precipitation: 0.1, // Mid-point of 0.0 to 0.2
      continentalness: 0.8, // Mid-point of 0.6 to 1.0
      erosion: 0.75, // Mid-point of 0.5 to 1.0
      weirdness: 0.0, // Mid-point of -1.0 to 1.0
      
      // Terrain properties
      baseHeight: 65,
      heightVariation: 4,
      hilliness: 0.2,
      
      // Block types
      topBlock: { id: 'sand', metadata: 0 },
      fillerBlock: { id: 'sand', metadata: 0 },
      undergroundBlock: { id: 'sandstone', metadata: 0 },
      underwaterBlock: { id: 'sand', metadata: 0 },
      
      // Vegetation - very sparse
      treeDensity: 0.001,   // Extremely rare trees (oases)
      grassDensity: 0.01,   // Barely any grass
      flowerDensity: 0.005, // Almost no flowers
      
      // Features and structures
      features: [
        { id: 'cactus', weight: 0.8 },
        { id: 'dead_bush', weight: 0.6 },
        { id: 'desert_well', weight: 0.05 }
      ],
      structures: [
        { id: 'desert_temple', weight: 0.003 },
        { id: 'desert_village', weight: 0.005 },
        { id: 'desert_well', weight: 0.01 }
      ],
      
      // Mob spawn rates
      spawnRates: {
        passive: {
          rabbit: 0.2
        },
        neutral: {
          husk: 0.4
        },
        hostile: {
          skeleton: 0.2,
          spider: 0.2,
          scorpion: 0.3,
          husk: 0.5
        }
      },
      
      // Weather properties
      weatherProperties: {
        rainChance: 0.01,     // Almost never rains
        thunderChance: 0.005, // Extremely rare storms
        fogDensity: 0.05,
        temperature: 2.0,     // Very hot
        rainfall: 0.0         // No rainfall
      },
      
      // Visual and sound effects
      visualEffects: {
        skyColor: '#88B4FF',  // Lighter blue sky
        fogColor: '#FFDB81',  // Sandy fog color
        waterColor: '#32A598',
        waterFogColor: '#050533',
        grassColor: '#91BD59',
        foliageColor: '#77AB2F'
      },
      
      ambientSounds: {
        day: ['ambient.desert.day'],
        night: ['ambient.desert.night'],
        mood: ['ambient.desert.mood']
      },
      
      // Mob spawning lists with desert-specific weights
      mobSpawnLists: {
        passive: [
          // Few passive mobs in desert
          { type: 'rabbit', weight: 8, minCount: 2, maxCount: 3 }
        ],
        neutral: [
          // Spiders are more common in desert
          { type: 'spider', weight: 15, minCount: 1, maxCount: 4 },
          { type: 'enderman', weight: 5, minCount: 1, maxCount: 1 }
        ],
        hostile: [
          { type: 'zombie', weight: 12, minCount: 1, maxCount: 4 },
          { type: 'skeleton', weight: 12, minCount: 1, maxCount: 4 },
          { type: 'creeper', weight: 5, minCount: 1, maxCount: 2 },
          // Desert-specific hostile mob
          { type: 'husk', weight: 15, minCount: 2, maxCount: 4 }
        ]
      },
      
      // Override any properties provided
      ...props
    });
  }

  /**
   * Gets the terrain height at the specified coordinates
   * Implementation specific to desert biome
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate 
   * @param {Object} noiseGenerators - Noise generators
   * @returns {number} - Terrain height at this position
   */
  getHeight(x, z, noiseGenerators) {
    // Get base height from parent method
    const baseHeight = super.getHeight(x, z, noiseGenerators);
    
    // Desert has sand dunes - use a smoother, wider noise
    const duneNoise = noiseGenerators.dunes ? 
      noiseGenerators.dunes.get(x * 0.03, z * 0.03) : 
      Math.sin(x * 0.02) * Math.cos(z * 0.02);
    
    // Use dune noise to create sand dune heights
    const duneHeight = (duneNoise + 1) * 2.5;
    
    // Add occasional dunes to the base height
    return baseHeight + duneHeight;
  }

  /**
   * Get block at specified coordinates with desert-specific generation
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
    
    // Deep sand in desert biome
    if (block.id === 'sand' && y < surfaceHeight - 5) {
      return { id: 'sandstone', metadata: 0 };
    }
    
    // Add occasional layers of red sand
    if (block.id === 'sand') {
      const redSandNoise = noiseGenerators.redSand ? 
        noiseGenerators.redSand.get(x, z) : 
        (Math.sin(x * 0.2) * Math.cos(z * 0.2) + 1) / 2;
      
      if (redSandNoise > 0.8) {
        return { id: 'red_sand', metadata: 0 };
      }
    }
    
    // Add exposed sandstone on slopes
    if (y >= surfaceHeight - 1 && block.id === 'sand') {
      // Calculate local slope
      const eastHeight = this.getHeight(x + 1, z, noiseGenerators);
      const westHeight = this.getHeight(x - 1, z, noiseGenerators);
      const northHeight = this.getHeight(x, z + 1, noiseGenerators);
      const southHeight = this.getHeight(x, z - 1, noiseGenerators);
      
      // Get max slope
      const maxSlope = Math.max(
        Math.abs(eastHeight - westHeight),
        Math.abs(northHeight - southHeight)
      );
      
      // If slope is steep, expose sandstone
      if (maxSlope > 3.5) {
        return { id: 'sandstone', metadata: 0 };
      }
    }
    
    return block;
  }

  /**
   * Get features at specified coordinates with desert-specific generation
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Seeded random function
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Array} - Array of features to place at this position
   */
  getFeaturesAt(x, z, random, noiseGenerators) {
    const features = [];
    
    // Add cacti with more control
    if (random() < 0.02) {
      features.push({
        type: 'tree',
        variant: 'cactus',
        height: 2 + Math.floor(random() * 2)
      });
    }
    
    // Add dead bushes
    if (random() < 0.05) {
      features.push({
        type: 'plant',
        blockType: 'dead_bush'
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
    
    // Desert wells - simple water source
    if (random() < 0.01) {
      structures.push({
        type: 'structure',
        id: 'desert_well'
      });
    }
    
    // Desert temples - rare structure with loot and traps
    if (random() < 0.005) {
      structures.push({
        type: 'structure',
        id: 'desert_temple'
      });
    }
    
    // Desert villages - very rare
    if (random() < 0.001) {
      structures.push({
        type: 'structure',
        id: 'village',
        variant: 'desert'
      });
    }
    
    return structures;
  }
}

module.exports = DesertBiome; 