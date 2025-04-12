const Biome = require('./baseBiome');

/**
 * Ocean biome - deep water bodies with underwater terrain and marine features
 * Represents seas and oceans with varying depths, underwater ecosystems, and marine structures
 */
class OceanBiome extends Biome {
  /**
   * Create a new Ocean biome
   * @param {Object} props - Optional properties to override defaults
   */
  constructor(props = {}) {
    // Determine if this is a deep ocean variant
    const isDeep = props.isDeep !== undefined ? props.isDeep : false;
    const isFrozen = props.isFrozen !== undefined ? props.isFrozen : false;
    
    // Call parent constructor with ocean-specific defaults
    super({
      id: isDeep ? (isFrozen ? 'frozen_deep_ocean' : 'deep_ocean') : (isFrozen ? 'frozen_ocean' : 'ocean'),
      name: `${isFrozen ? 'Frozen ' : ''}${isDeep ? 'Deep ' : ''}Ocean`,
      color: isDeep ? '#000033' : '#000099',
      
      // Climate ranges - oceans have low continentalness by definition
      temperatureRange: { 
        min: isFrozen ? -1.0 : -0.5, 
        max: isFrozen ? 0.0 : 1.0 
      },
      precipitationRange: { min: 0.3, max: 1.0 },
      continentalnessRange: { min: 0.0, max: 0.3 },  // Low continentalness for oceans
      erosionRange: { min: 0.0, max: 1.0 },
      weirdnessRange: { min: -1.0, max: 1.0 },
      
      // Terrain properties
      baseHeight: isDeep ? 30 : 45,     // Deep oceans are deeper
      heightVariation: isDeep ? 5 : 8,  // Ocean floor variation
      hilliness: 0.2,
      
      // Block types
      topBlock: { id: 'sand', metadata: 0 },
      fillerBlock: { id: 'sand', metadata: 0 },
      undergroundBlock: { id: 'stone', metadata: 0 },
      underwaterBlock: { id: 'gravel', metadata: 0 },
      
      // No vegetation except seagrass and kelp
      treeDensity: 0.0,
      grassDensity: 0.0,
      flowerDensity: 0.0,
      
      // Ocean-specific features
      features: [
        { id: 'seagrass', weight: 0.6 },
        { id: 'tall_seagrass', weight: 0.3 },
        { id: 'kelp', weight: 0.4 },
        { id: isDeep ? 'deep_ocean_floor' : 'ocean_floor', weight: 1.0 }
      ],
      
      // Ocean structures
      structures: [
        { id: 'shipwreck', weight: 0.001 },
        { id: 'ocean_ruins', weight: 0.003 },
        { id: 'ocean_monument', weight: isDeep ? 0.001 : 0.0001 }
      ],
      
      // Mob spawn rates - aquatic creatures
      spawnRates: {
        passive: {
          cod: 0.4,
          salmon: 0.3,
          squid: 0.2,
          tropical_fish: isFrozen ? 0.0 : 0.1
        },
        neutral: {
          dolphin: isFrozen ? 0.0 : 0.1,
          pufferfish: isFrozen ? 0.0 : 0.05
        },
        hostile: {
          drowned: 0.1,
          guardian: isDeep ? 0.05 : 0.0,
          elder_guardian: isDeep ? 0.001 : 0.0
        }
      },
      
      // Weather properties
      weatherProperties: {
        rainChance: isFrozen ? 0.1 : 0.4,
        thunderChance: 0.1,
        fogDensity: 0.2,
        temperature: isFrozen ? -0.5 : 0.5,
        rainfall: 1.0        // Maximum rainfall
      },
      
      // Visual and sound effects
      visualEffects: {
        skyColor: '#7BA4FF',
        fogColor: '#06087D',
        waterColor: isFrozen ? '#3938C9' : '#3F76E4',
        waterFogColor: isFrozen ? '#050533' : '#050533',
        grassColor: '#8EB971',
        foliageColor: '#71A74D'
      },
      
      ambientSounds: {
        day: ['ambient.ocean.day'],
        night: ['ambient.ocean.night'],
        mood: ['ambient.ocean.mood'],
        underwater: ['ambient.underwater']
      },
      
      // Override any properties provided
      ...props
    });
    
    // Ocean-specific properties
    this.isDeep = isDeep;
    this.isFrozen = isFrozen;
    this.seaLevel = props.seaLevel || 63;
    this.waterBlock = { id: isFrozen ? 'ice' : 'water', metadata: 0 };
    this.coralChance = isFrozen ? 0.0 : (props.coralChance || (isDeep ? 0.01 : 0.05));
  }

  /**
   * Gets the terrain height at the specified coordinates
   * Implementation specific to ocean biome
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate 
   * @param {Object} noiseGenerators - Noise generators
   * @returns {number} - Terrain height at this position
   */
  getHeight(x, z, noiseGenerators) {
    // Base ocean floor noise
    const baseNoise = noiseGenerators.oceanFloor ? 
      noiseGenerators.oceanFloor.get(x * 0.01, z * 0.01) : 
      Math.sin(x * 0.005) * Math.cos(z * 0.005);
    
    // Detail noise for smaller features
    const detailNoise = noiseGenerators.oceanDetail ? 
      noiseGenerators.oceanDetail.get(x * 0.05, z * 0.05) : 
      Math.sin(x * 0.05) * Math.cos(z * 0.05);
    
    // Trenches - occasional deep trenches in the ocean floor
    const trenchNoise = noiseGenerators.oceanTrench ? 
      noiseGenerators.oceanTrench.get(x * 0.002, z * 0.002) : 
      Math.sin(x * 0.001 + z * 0.002);
    
    // Calculate base ocean floor height
    let oceanFloorHeight = this.baseHeight + baseNoise * this.heightVariation;
    
    // Add small details
    oceanFloorHeight += detailNoise * 2;
    
    // Create occasional trenches
    if (trenchNoise > 0.85 && this.isDeep) {
      // Deep trenches in deep ocean
      const trenchDepth = (trenchNoise - 0.85) * 20 / 0.15;
      oceanFloorHeight -= trenchDepth;
    }
    
    // Underwater mountains/ridges
    const ridgeNoise = noiseGenerators.oceanRidge ? 
      noiseGenerators.oceanRidge.get(x * 0.01, z * 0.01) : 
      Math.sin(x * 0.008 - z * 0.008);
    
    if (ridgeNoise > 0.8) {
      // Create underwater ridges/mountains
      const ridgeHeight = (ridgeNoise - 0.8) * 15 / 0.2;
      oceanFloorHeight += ridgeHeight;
      
      // In rare cases, the ridge may breach the surface
      if (this.isDeep === false && oceanFloorHeight > this.seaLevel - 3) {
        oceanFloorHeight = this.seaLevel - 3;
      }
    }
    
    return oceanFloorHeight;
  }

  /**
   * Get block at specified coordinates with ocean-specific generation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate 
   * @param {number} z - Z coordinate
   * @param {number} surfaceHeight - Height of the surface at this position
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Object} - Block type {id, metadata} at this position
   */
  getBlockAt(x, y, z, surfaceHeight, noiseGenerators) {
    // Above water surface
    if (y > this.seaLevel) {
      return { id: 'air', metadata: 0 };
    }
    
    // At water surface
    if (y === this.seaLevel) {
      return this.waterBlock;
    }
    
    // Water blocks
    if (y > surfaceHeight) {
      return { id: 'water', metadata: 0 };
    }
    
    // Ocean floor surface
    if (y === surfaceHeight) {
      // Decide surface block type based on noise
      const surfaceNoise = noiseGenerators.oceanSurface ? 
        noiseGenerators.oceanSurface.get(x, z) : 
        (Math.sin(x * 0.1) * Math.cos(z * 0.1) + 1) / 2;
      
      // Mix of sand, gravel, and clay on ocean floor
      if (surfaceNoise < 0.3) {
        return { id: 'gravel', metadata: 0 };
      } else if (surfaceNoise < 0.5) {
        return { id: 'clay', metadata: 0 };
      } else if (surfaceNoise < 0.95) {
        return { id: 'sand', metadata: 0 };
      } else {
        // Occasional stone patches on the ocean floor
        return { id: 'stone', metadata: 0 };
      }
    }
    
    // Underground blocks
    if (y < surfaceHeight) {
      // Layer of sand/gravel/clay under the surface
      if (y >= surfaceHeight - 3) {
        const subSurfaceNoise = noiseGenerators.oceanSubSurface ? 
          noiseGenerators.oceanSubSurface.get(x, y, z) : 
          (Math.sin(x * 0.2 + y * 0.5) * Math.cos(z * 0.2) + 1) / 2;
        
        if (subSurfaceNoise < 0.4) {
          return { id: 'sand', metadata: 0 };
        } else if (subSurfaceNoise < 0.7) {
          return { id: 'gravel', metadata: 0 };
        } else {
          return { id: 'clay', metadata: 0 };
        }
      }
      
      // Stone/ores below the ocean floor
      const deepNoise = noiseGenerators.deepOcean ? 
        noiseGenerators.deepOcean.get(x, y, z) : 
        Math.random();
      
      // Add ore veins under ocean
      if (deepNoise > 0.97) {
        return { id: 'coal_ore', metadata: 0 };
      } else if (deepNoise > 0.985) {
        return { id: 'iron_ore', metadata: 0 };
      } else if (deepNoise > 0.995) {
        return { id: 'gold_ore', metadata: 0 };
      }
      
      // Default to stone
      return { id: 'stone', metadata: 0 };
    }
    
    // Should never reach here
    return { id: 'water', metadata: 0 };
  }

  /**
   * Get features at specified coordinates with ocean-specific generation
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Seeded random function
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Array} - Array of features to place at this position
   */
  getFeaturesAt(x, z, random, noiseGenerators) {
    const features = [];
    const surfaceHeight = this.getHeight(x, z, noiseGenerators);
    
    // Don't generate features if too deep below sea level
    if (surfaceHeight < this.baseHeight - 10) {
      return features;
    }
    
    // Seagrass - common in shallower areas
    const seagrassChance = Math.max(0, (this.seaLevel - surfaceHeight) / 30);
    if (random() < 0.3 * (1 - seagrassChance) && !this.isFrozen) {
      const isShort = random() < 0.7;
      features.push({
        type: 'underwater_plant',
        id: isShort ? 'seagrass' : 'tall_seagrass',
        height: isShort ? 1 : 2,
        x, z
      });
    }
    
    // Kelp - grows from ocean floor to near surface
    if (random() < 0.15 && !this.isFrozen && surfaceHeight < this.seaLevel - 4) {
      const maxHeight = Math.min(12, this.seaLevel - surfaceHeight - 1);
      const kelpHeight = Math.floor(random() * maxHeight) + 1;
      
      features.push({
        type: 'underwater_plant',
        id: 'kelp',
        height: kelpHeight,
        x, z
      });
    }
    
    // Coral reefs - only in warm, shallow ocean areas
    if (random() < this.coralChance && surfaceHeight > this.baseHeight + 5 && surfaceHeight < this.seaLevel - 2) {
      // Choose coral type
      const coralTypes = ['tube', 'brain', 'bubble', 'fire', 'horn'];
      const coralIndex = Math.floor(random() * coralTypes.length);
      const coralType = coralTypes[coralIndex];
      
      // Coral size/cluster
      const coralSize = Math.floor(random() * 3) + 1; // 1-3 size
      
      features.push({
        type: 'coral',
        id: `${coralType}_coral`,
        size: coralSize,
        x, z
      });
      
      // Add some coral fans around main coral
      if (random() < 0.7) {
        features.push({
          type: 'coral',
          id: `${coralType}_coral_fan`,
          x: x + (random() * 2 - 1),
          z: z + (random() * 2 - 1)
        });
      }
    }
    
    // Sea pickles - glow underwater
    if (random() < 0.03 && !this.isFrozen) {
      const count = Math.floor(random() * 3) + 1; // 1-3 pickles in a cluster
      
      features.push({
        type: 'underwater_plant',
        id: 'sea_pickle',
        count,
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
    
    // Ocean monuments - only in deep ocean
    if (this.isDeep && random() < 0.0001 && !this.isFrozen) {
      structures.push({
        type: 'structure',
        id: 'ocean_monument',
        x, z
      });
    }
    
    // Shipwrecks - can occur in any ocean
    if (random() < 0.0003) {
      // Determine if shipwreck is buried in sand
      const isBuried = random() < 0.3;
      
      structures.push({
        type: 'structure',
        id: 'shipwreck',
        variant: this.isFrozen ? 'frozen' : 'normal',
        isBuried,
        x, z
      });
    }
    
    // Ocean ruins - underwater ruins of ancient structures
    if (random() < 0.0005 && !this.isFrozen) {
      // Determine size of ruins
      const isLarge = random() < 0.2;
      
      structures.push({
        type: 'structure',
        id: 'ocean_ruins',
        size: isLarge ? 'large' : 'small',
        x, z
      });
    }
    
    // Underwater caves - entrances to cave systems
    if (random() < 0.0002) {
      structures.push({
        type: 'structure',
        id: 'underwater_cave',
        x, z
      });
    }
    
    // Icebergs - only in frozen oceans
    if (this.isFrozen && random() < 0.0007) {
      const size = Math.floor(random() * 3) + 1; // 1-3 size scale
      
      structures.push({
        type: 'structure',
        id: 'iceberg',
        size,
        x, z
      });
    }
    
    return structures;
  }

  /**
   * Special method for ocean biomes to determine if water should be frozen
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @returns {boolean} - Whether water should be frozen
   */
  shouldFreezeWater(x, y, z) {
    // Frozen oceans have ice on the surface
    return this.isFrozen && y === this.seaLevel;
  }
}

module.exports = OceanBiome; 