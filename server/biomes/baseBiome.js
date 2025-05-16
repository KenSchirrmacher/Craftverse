/**
 * BaseBiome - Base class for all biomes in the game
 */

class BaseBiome {
  /**
   * Create a new biome type
   * @param {Object} options - Biome options
   * @param {string} options.id - Unique biome identifier
   * @param {string} options.name - Human-readable biome name
   * @param {string} options.color - Biome color (hex code)
   * @param {number} options.temperature - Biome temperature (0.0 to 2.0)
   * @param {number} options.humidity - Biome humidity (0.0 to 1.0)
   * @param {Object} options.elevation - Elevation range
   * @param {number} options.rarity - Biome rarity (0.0 to 1.0)
   * @param {Array} options.features - List of feature types to generate
   */
  constructor(options = {}) {
    this.id = options.id || 'unknown';
    this.name = options.name || 'Unknown Biome';
    this.color = options.color || '#7FBF7F';
    this.temperature = options.temperature !== undefined ? options.temperature : 0.5;
    this.humidity = options.humidity !== undefined ? options.humidity : 0.5;
    this.elevation = options.elevation || { min: 0, max: 128 };
    this.rarity = options.rarity !== undefined ? options.rarity : 1.0;
    this.features = options.features || [];
    
    // Default values
    this.seaLevel = 63;
    this.groundCoverageChance = 0.7;
    this.vegetationChance = 0.1;
    this.treeFrequency = 0.05;
  }

  /**
   * Get the features that should be generated at the given position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Object} random - Random number generator
   * @returns {Array} - List of features to generate
   */
  getFeaturesAt(x, z, random) {
    const features = [];
    
    // Add trees based on frequency
    if (random.nextFloat() < this.treeFrequency) {
      const treeTypes = ['oak', 'birch', 'spruce', 'jungle', 'acacia', 'dark_oak'];
      const treeType = treeTypes[Math.floor(random.nextFloat() * treeTypes.length)];
      
      features.push({
        type: treeType,
        position: { x, z }
      });
    }
    
    // Add grass and flowers
    if (random.nextFloat() < this.groundCoverageChance) {
      // Tall grass
      if (random.nextFloat() < 0.8) {
        features.push({
          type: 'tall_grass',
          position: { x, z }
        });
      }
      
      // Flowers
      if (random.nextFloat() < 0.2) {
        const flowerTypes = [
          'dandelion',
          'poppy',
          'blue_orchid',
          'allium',
          'azure_bluet',
          'tulip_red',
          'tulip_orange',
          'tulip_white',
          'tulip_pink',
          'oxeye_daisy'
        ];
        
        const flowerType = flowerTypes[Math.floor(random.nextFloat() * flowerTypes.length)];
        
        features.push({
          type: 'flower',
          variant: flowerType,
          position: { x, z }
        });
      }
    }
    
    return features;
  }
  
  /**
   * Get suitable blocks for this biome at the given height
   * @param {number} height - Block height/Y coordinate
   * @param {number} surfaceHeight - Surface height at this position
   * @returns {string} - Block type to place
   */
  getBlockAt(height, surfaceHeight) {
    // Bedrock at the bottom
    if (height <= 1) {
      return 'bedrock';
    }
    
    // Underground
    if (height < surfaceHeight - 3) {
      return 'stone';
    }
    
    // Surface layers
    if (height < surfaceHeight) {
      return 'dirt';
    }
    
    // Surface block
    if (height === surfaceHeight) {
      return 'grass_block';
    }
    
    // Water if below sea level
    if (height <= this.seaLevel) {
      return 'water';
    }
    
    // Air above surface
    return 'air';
  }
  
  /**
   * Get the height variation for this biome
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators to use
   * @returns {number} - Height modifier (-1.0 to 1.0)
   */
  getHeightVariation(x, z, noiseGenerators) {
    // Default implementation uses simple perlin noise
    return noiseGenerators.continentalness.noise2D(x * 0.01, z * 0.01) * 0.5;
  }
  
  /**
   * Get the density coefficient for this biome
   * Used for 3D noise-based generation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators to use
   * @returns {number} - Density value for cave carving
   */
  getDensityCoefficient(x, y, z, noiseGenerators) {
    return 1.0;
  }
  
  /**
   * Handle ambient effects specific to this biome
   * @param {Object} player - Player to apply effects to
   * @param {Object} position - Player position
   */
  applyAmbientEffects(player, position) {
    // Default implementation does nothing
  }
}

module.exports = BaseBiome; 