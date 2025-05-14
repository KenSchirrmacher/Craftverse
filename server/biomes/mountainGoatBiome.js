/**
 * Mountain Goat biome - specialized mountain biome with more goats
 * Part of the Caves & Cliffs update
 */

const MountainsBiome = require('./mountainsBiome');

class MountainGoatBiome extends MountainsBiome {
  /**
   * Create a new Mountain Goat biome
   * @param {Object} props - Optional properties to override defaults
   */
  constructor(props = {}) {
    // Call parent constructor with custom options
    super({
      id: 'mountain_goat',
      name: 'Mountain Goat Peaks',
      color: '#A0A0B8',
      
      // Climate ranges - adjusted for peaks where goats live
      temperatureRange: { min: -1.0, max: 0.2 },
      continentalnessRange: { min: 0.7, max: 1.0 },
      erosionRange: { min: 0.0, max: 0.3 },   // Even lower erosion for steeper peaks
      
      // Terrain properties
      baseHeight: 100,         // Higher base height
      heightVariation: 35,     // More extreme height variation
      
      // Block types - more stone and gravel
      topBlock: { id: 'stone', metadata: 0 },
      
      // Vegetation - very sparse
      treeDensity: 0.02,    // Very few trees
      grassDensity: 0.1,    // Very little grass
      
      // Features and structures - more snow and rocks
      features: [
        { id: 'stone_patch', weight: 0.9 },
        { id: 'gravel_patch', weight: 0.7 },
        { id: 'snow_layer', weight: 1.0 }
      ],
      
      // Mob spawn rates - much higher goat rate
      spawnRates: {
        passive: {
          goat: 1.0,       // Maximum goat spawn rate
          sheep: 0.05,
          rabbit: 0.1
        },
        neutral: {
          wolf: 0.05
        },
        hostile: {
          spider: 0.1,
          skeleton: 0.1,
          creeper: 0.1
        }
      },
      
      // Visual effects - more fog
      visualEffects: {
        fogDensity: 0.6,
        skyColor: '#88BBFF',
        fogColor: '#CCDDFF',
        waterColor: '#3F76E4',
        waterFogColor: '#050533',
        grassColor: '#8EB971',
        foliageColor: '#71A74D'
      },
      
      // Override any properties provided
      ...props
    });
    
    // Lower snow level for more snow coverage
    this.snowLevel = props.snowLevel || 100;
    
    // Add powder snow patches
    this.powderSnowChance = 0.3;
  }

  /**
   * Get block at specified coordinates with mountain goat biome-specific generation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate 
   * @param {number} z - Z coordinate
   * @param {number} surfaceHeight - Height of the surface at this position
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Object} - Block type {id, metadata} at this position
   */
  getBlockAt(x, y, z, surfaceHeight, noiseGenerators) {
    // Get block from parent implementation
    let block = super.getBlockAt(x, y, z, surfaceHeight, noiseGenerators);
    
    // Calculate local slope
    const eastHeight = this.getHeight(x + 1, z, noiseGenerators);
    const westHeight = this.getHeight(x - 1, z, noiseGenerators);
    const northHeight = this.getHeight(x, z + 1, noiseGenerators);
    const southHeight = this.getHeight(x, z - 1, noiseGenerators);
    
    const maxSlope = Math.max(
      Math.abs(eastHeight - westHeight),
      Math.abs(northHeight - southHeight)
    );
    
    // Add powder snow pockets on flatter areas
    if (y === surfaceHeight && 
        y >= this.snowLevel && 
        maxSlope < 2.0 && 
        block.id === 'snow_layer') {
      
      // Random chance to place powder snow
      const powderSnowNoise = noiseGenerators.powderSnow ? 
        noiseGenerators.powderSnow.get(x * 0.1, z * 0.1) : 
        Math.random();
      
      if (powderSnowNoise < this.powderSnowChance) {
        // Replace snow layer with powder snow
        return { id: 'powder_snow', metadata: 0 };
      }
    }
    
    return block;
  }

  /**
   * Gets features at the specified coordinates
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Object} random - Random number generator
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Array} - Array of features to place
   */
  getFeaturesAt(x, z, random, noiseGenerators) {
    // Get features from parent implementation
    const features = super.getFeaturesAt(x, z, random, noiseGenerators);
    
    // Calculate a height-dependent feature noise
    const surfaceHeight = this.getHeight(x, z, noiseGenerators);
    
    // Add special goat-related features for atmosphere
    if (surfaceHeight > this.snowLevel && random.random() < 0.05) {
      // Add goat horn fragment as a rare feature
      features.push({
        type: 'item',
        id: 'goat_horn_fragment',
        position: { x, y: surfaceHeight + 1, z }
      });
    }
    
    return features;
  }
}

module.exports = MountainGoatBiome; 