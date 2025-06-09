const BiomeBase = require('./biomeBase');

/**
 * Mountains biome - high elevation terrain with dramatic peaks and valleys
 * Represents mountainous regions with stone peaks, steep cliffs, and snow-capped summits
 */
class MountainsBiome extends BiomeBase {
  /**
   * Create a new Mountains biome
   * @param {Object} props - Optional properties to override defaults
   */
  constructor(props = {}) {
    // Call parent constructor with mountains-specific defaults
    super({
      id: 'mountains',
      name: 'Mountains',
      color: '#A0A0A0',
      
      // Climate values - mountains span various temps but need specific erosion (using midpoint of ranges)
      temperature: -0.3, // Mid-point of -1.0 to 0.4
      precipitation: 0.55, // Mid-point of 0.1 to 1.0
      continentalness: 0.75, // Mid-point of 0.5 to 1.0
      erosion: 0.2, // Mid-point of 0.0 to 0.4
      weirdness: 0.35, // Mid-point of -0.3 to 1.0
      
      // Terrain properties
      baseHeight: 90,          // Much higher base height
      heightVariation: 30,     // Extreme height variation
      hilliness: 0.8,
      
      // Block types
      topBlock: { id: 'stone', metadata: 0 },
      fillerBlock: { id: 'stone', metadata: 0 },
      undergroundBlock: { id: 'stone', metadata: 0 },
      underwaterBlock: { id: 'gravel', metadata: 0 },
      
      // Vegetation - sparse
      treeDensity: 0.05,    // Few trees
      grassDensity: 0.2,    // Some grass
      flowerDensity: 0.05,  // Few flowers
      
      // Features and structures
      features: [
        { id: 'spruce_tree', weight: 0.7 },
        { id: 'stone_patch', weight: 0.8 },
        { id: 'gravel_patch', weight: 0.5 },
        { id: 'snow_layer', weight: 0.9 }
      ],
      structures: [
        { id: 'mountain_peak', weight: 0.02 },
        { id: 'cave_entrance', weight: 0.01 },
        { id: 'abandoned_mineshaft', weight: 0.005 }
      ],
      
      // Mob spawn rates
      spawnRates: {
        passive: {
          goat: 0.5,
          sheep: 0.1,
          rabbit: 0.2
        },
        neutral: {
          llama: 0.2,
          wolf: 0.1
        },
        hostile: {
          spider: 0.2,
          skeleton: 0.2,
          creeper: 0.2,
          slime: 0.1
        }
      },
      
      // Weather properties
      weatherProperties: {
        rainChance: 0.3,
        thunderChance: 0.1,
        fogDensity: 0.4,
        temperature: 0.2,    // Cold
        rainfall: 0.5        // Moderate rainfall
      },
      
      // Visual and sound effects
      visualEffects: {
        skyColor: '#88BBFF',
        fogColor: '#CCDDFF',
        waterColor: '#3F76E4',
        waterFogColor: '#050533',
        grassColor: '#8EB971',
        foliageColor: '#71A74D'
      },
      
      ambientSounds: {
        day: ['ambient.mountains.day'],
        night: ['ambient.mountains.night'],
        mood: ['ambient.mountains.mood']
      },
      
      // Override any properties provided
      ...props
    });
    
    // Mountain-specific snow level
    this.snowLevel = props.snowLevel || 110;
  }

  /**
   * Gets the terrain height at the specified coordinates
   * Implementation specific to mountains biome
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate 
   * @param {Object} noiseGenerators - Noise generators
   * @returns {number} - Terrain height at this position
   */
  getHeight(x, z, noiseGenerators) {
    // Mountains use more complex height calculation
    
    // Base noise - large rolling hills
    const baseNoise = noiseGenerators.base ? 
      noiseGenerators.base.get(x * 0.01, z * 0.01) : 
      Math.sin(x * 0.005) * Math.cos(z * 0.005);
    
    // Ridge noise - creates sharp mountain ridges
    const ridgeNoise = noiseGenerators.ridge ? 
      noiseGenerators.ridge.get(x * 0.02, z * 0.02) : 
      Math.abs(Math.sin(x * 0.01 + z * 0.01));
    
    // Peak noise - creates occasional tall peaks
    const peakNoise = noiseGenerators.peak ? 
      noiseGenerators.peak.get(x * 0.005, z * 0.005) : 
      Math.pow(Math.sin(x * 0.002) * Math.cos(z * 0.002), 2);
    
    // Local steepness - affects how sharp the terrain is
    const steepnessFactor = noiseGenerators.steepness ? 
      noiseGenerators.steepness.get(x * 0.03, z * 0.03) * 0.5 + 0.5 : 
      0.7;
    
    // Calculate base mountain shape (20-40 blocks high from base)
    let mountainHeight = baseNoise * 20 + this.baseHeight;
    
    // Add ridge features (0-25 blocks high)
    mountainHeight += Math.pow(ridgeNoise, 1 + steepnessFactor) * 25;
    
    // Add occasional tall peaks (0-40 blocks high)
    if (peakNoise > 0.7) {
      mountainHeight += Math.pow((peakNoise - 0.7) / 0.3, 2) * 40;
    }
    
    return mountainHeight;
  }

  /**
   * Get block at specified coordinates with mountain-specific generation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate 
   * @param {number} z - Z coordinate
   * @param {number} surfaceHeight - Height of the surface at this position
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Object} - Block type {id, metadata} at this position
   */
  getBlockAt(x, y, z, surfaceHeight, noiseGenerators) {
    // Use parent implementation for basic block selection
    let block = super.getBlockAt(x, y, z, surfaceHeight, noiseGenerators);
    
    // Calculate local slope to determine if this is a cliff face
    const eastHeight = this.getHeight(x + 1, z, noiseGenerators);
    const westHeight = this.getHeight(x - 1, z, noiseGenerators);
    const northHeight = this.getHeight(x, z + 1, noiseGenerators);
    const southHeight = this.getHeight(x, z - 1, noiseGenerators);
    
    const maxSlope = Math.max(
      Math.abs(eastHeight - westHeight),
      Math.abs(northHeight - southHeight)
    );
    
    const isCliff = maxSlope > 4.0;
    
    // Snow layer on top above snow level
    if (y === surfaceHeight && y >= this.snowLevel) {
      return { id: 'snow_layer', metadata: 0 };
    }
    
    // Snow block instead of regular surface if deep snow
    if (y === surfaceHeight && y >= this.snowLevel + 10) {
      return { id: 'snow_block', metadata: 0 };
    }
    
    // Different surface blocks based on height
    if (y === surfaceHeight) {
      // Stone on steep cliffs
      if (isCliff) {
        return { id: 'stone', metadata: 0 };
      }
      
      // Grass at lower elevations
      if (y < this.snowLevel - 10) {
        return { id: 'grass_block', metadata: 0 };
      }
      
      // Mix of grass and coarse dirt in the transition zone
      if (y < this.snowLevel) {
        const transitionNoise = noiseGenerators.transition ? 
          noiseGenerators.transition.get(x, z) : 
          (Math.sin(x * 0.2) * Math.cos(z * 0.2) + 1) / 2;
        
        if (transitionNoise > 0.6) {
          return { id: 'coarse_dirt', metadata: 0 };
        } else {
          return { id: 'grass_block', metadata: 0 };
        }
      }
      
      // Stone near the peaks
      return { id: 'stone', metadata: 0 };
    }
    
    // Underground block variations
    if (y < surfaceHeight) {
      // Add various stone types
      const stoneTypeNoise = noiseGenerators.stoneType ? 
        noiseGenerators.stoneType.get(x, y, z) : 
        (Math.sin(x * 0.1 + y * 0.1) * Math.cos(z * 0.1 + y * 0.05) + 1) / 2;
      
      // Andesite patches
      if (stoneTypeNoise < 0.2) {
        return { id: 'andesite', metadata: 0 };
      }
      
      // Granite patches 
      if (stoneTypeNoise > 0.8) {
        return { id: 'granite', metadata: 0 };
      }
      
      // Add ore deposits
      if (y < 120 && y > 40) {
        const oreNoise = noiseGenerators.ore ? 
          noiseGenerators.ore.get(x, y, z) : 
          Math.random();
        
        // Coal ore - most common
        if (oreNoise > 0.96) {
          return { id: 'coal_ore', metadata: 0 };
        }
        
        // Iron ore - less common
        if (oreNoise > 0.985) {
          return { id: 'iron_ore', metadata: 0 };
        }
        
        // Emerald ore - rare, only in mountains
        if (oreNoise > 0.998) {
          return { id: 'emerald_ore', metadata: 0 };
        }
      }
    }
    
    return block;
  }

  /**
   * Get features at specified coordinates with mountain-specific generation
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Seeded random function
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Array} - Array of features to place at this position
   */
  getFeaturesAt(x, z, random, noiseGenerators) {
    const features = [];
    const surfaceHeight = this.getHeight(x, z, noiseGenerators);
    
    // Calculate slopes for cliffs detection
    const eastHeight = this.getHeight(x + 1, z, noiseGenerators);
    const westHeight = this.getHeight(x - 1, z, noiseGenerators);
    const northHeight = this.getHeight(x, z + 1, noiseGenerators);
    const southHeight = this.getHeight(x, z - 1, noiseGenerators);
    
    const maxSlope = Math.max(
      Math.abs(eastHeight - westHeight),
      Math.abs(northHeight - southHeight)
    );
    
    const isCliff = maxSlope > 4.0;
    
    // Don't place features on steep cliffs
    if (isCliff) {
      return features;
    }
    
    // Tree placement - only below snow level and not too steep
    if (surfaceHeight < this.snowLevel - 5 && maxSlope < 2.0 && random() < this.treeDensity) {
      // Spruce trees are dominant in mountains
      const treeHeight = Math.floor(random() * 3) + 5; // 5-7 blocks tall
      features.push({
        type: 'tree',
        id: 'spruce_tree',
        height: treeHeight,
        x, z
      });
    }
    
    // Grass and flowers - only below snow level
    if (surfaceHeight < this.snowLevel - 2 && random() < this.grassDensity) {
      features.push({
        type: 'vegetation',
        id: 'grass',
        x, z
      });
    }
    
    // Alpine flowers - in transition zone
    if (surfaceHeight >= this.snowLevel - 10 && surfaceHeight < this.snowLevel && random() < this.flowerDensity * 2) {
      features.push({
        type: 'vegetation',
        id: 'azure_bluet', // White flowers for alpine meadows
        x, z
      });
    }
    
    // Rock formations - more common at higher altitudes
    if (random() < 0.03 * (surfaceHeight - this.baseHeight) / 50) {
      const rockSize = Math.floor(random() * 2) + 1; // 1-2 block rocks
      features.push({
        type: 'boulder',
        id: 'stone',
        size: rockSize,
        x, z
      });
    }
    
    // Snow layers - above snow level
    if (surfaceHeight >= this.snowLevel && random() < 0.8) {
      // Variable snow depth (1-3 layers)
      const snowDepth = Math.floor(random() * 3) + 1;
      features.push({
        type: 'snow_layer',
        depth: snowDepth,
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
    
    // Mountain peaks with special terrain features
    if (random() < 0.0001) {
      structures.push({
        type: 'structure',
        id: 'mountain_peak',
        variant: random() < 0.5 ? 'pointy' : 'flat',
        x, z
      });
    }
    
    // Cave entrances are more common in mountains
    if (random() < 0.0005) {
      structures.push({
        type: 'structure',
        id: 'cave_entrance',
        size: Math.floor(random() * 2) + 1, // 1-2 size
        x, z
      });
    }
    
    // Abandoned mineshafts in lower mountains
    if (random() < 0.0002) {
      structures.push({
        type: 'structure',
        id: 'abandoned_mineshaft',
        x, z
      });
    }
    
    return structures;
  }
}

module.exports = MountainsBiome; 