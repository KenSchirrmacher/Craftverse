/**
 * Cherry Grove Biome - A beautiful biome with pink cherry blossom trees
 * Added in the Trails & Tales update
 */

const BaseBiome = require('./baseBiome');

class CherryGroveBiome extends BaseBiome {
  constructor() {
    super({
      id: 'cherry_grove',
      name: 'Cherry Grove',
      color: '#ffb7c5', // Light pink color
      temperature: 0.5,
      humidity: 0.7,
      elevation: {
        min: 64,
        max: 120
      },
      rarity: 0.05, // Somewhat rare biome
      features: [
        'cherry_trees',
        'grass',
        'flowers',
        'bees',
        'pigs',
        'sheep'
      ]
    });

    // Special properties for cherry grove biome
    this.hasPetalParticles = true;
    this.groundCoverageChance = 0.8;
    this.treeFrequency = 0.15; // Higher tree density than average
    this.flowersChance = 0.4; // Lots of flowers
    this.musicTrack = 'minecraft.music.cherry_grove';
    this.ambientSounds = ['minecraft.ambient.cherry_grove'];
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
    
    // Add cherry trees based on frequency
    if (random.nextFloat() < this.treeFrequency) {
      features.push({
        type: 'cherry',
        position: { x, z }
      });
    }
    
    // Add grass and flowers
    if (random.nextFloat() < this.groundCoverageChance) {
      // Tall grass
      if (random.nextFloat() < 0.7) {
        features.push({
          type: 'tall_grass',
          position: { x, z }
        });
      }
      
      // Flowers (more common in this biome)
      if (random.nextFloat() < this.flowersChance) {
        const flowerTypes = [
          'poppy',
          'dandelion',
          'blue_orchid',
          'allium',
          'azure_bluet',
          'tulip_red',
          'tulip_orange',
          'tulip_white',
          'tulip_pink',
          'oxeye_daisy',
          'cornflower',
          'lily_of_the_valley'
        ];
        
        const flowerType = flowerTypes[Math.floor(random.nextFloat() * flowerTypes.length)];
        
        features.push({
          type: 'flower',
          variant: flowerType,
          position: { x, z }
        });
      }
    }
    
    // Occasionally add beehives
    if (random.nextFloat() < 0.03) {
      features.push({
        type: 'beehive',
        beeCount: Math.floor(random.nextFloat() * 3) + 1,
        position: { x, z }
      });
    }
    
    // Add some passive mobs
    if (random.nextFloat() < 0.05) {
      const mobTypes = ['sheep', 'pig', 'rabbit'];
      const mobType = mobTypes[Math.floor(random.nextFloat() * mobTypes.length)];
      
      features.push({
        type: 'mob',
        variant: mobType,
        count: Math.floor(random.nextFloat() * 4) + 1,
        position: { x, z }
      });
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
    // Cherry groves are more gently rolling
    const baseNoise = noiseGenerators.continentalness.noise2D(x * 0.01, z * 0.01) * 0.5;
    const detailNoise = noiseGenerators.erosion.noise2D(x * 0.05, z * 0.05) * 0.3;
    
    return (baseNoise + detailNoise) * 0.8; // Lower multiplier for gentler hills
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
    // Cherry groves have slightly fewer caves (lower noise value)
    return 0.8;
  }
  
  /**
   * Handle ambient effects specific to this biome
   * @param {Object} player - Player to apply effects to
   * @param {Object} position - Player position
   */
  applyAmbientEffects(player, position) {
    // If this biome has petal particles, spawn them occasionally
    if (this.hasPetalParticles && Math.random() < 0.02) {
      // Calculate a position above and around the player
      const particleX = position.x + (Math.random() * 10 - 5);
      const particleY = position.y + 3 + (Math.random() * 5);
      const particleZ = position.z + (Math.random() * 10 - 5);
      
      // Add a petal particle
      player.world.addParticle({
        type: 'cherry_blossom_petal',
        position: { x: particleX, y: particleY, z: particleZ },
        velocity: { 
          x: (Math.random() - 0.5) * 0.05,
          y: -0.05 - (Math.random() * 0.05),
          z: (Math.random() - 0.5) * 0.05
        },
        color: '#ffb7c5',
        lifetime: 5 + Math.floor(Math.random() * 5)
      });
    }
  }
}

module.exports = CherryGroveBiome; 