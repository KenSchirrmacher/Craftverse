/**
 * NetherWastesBiome - Standard nether biome with netherrack and lava pools
 */

const NetherBiome = require('./netherBiome');

class NetherWastesBiome extends NetherBiome {
  /**
   * Create a new NetherWastesBiome
   * @param {Object} options - Biome configuration options
   */
  constructor(options = {}) {
    super({
      id: 'nether_wastes',
      name: 'Nether Wastes',
      temperature: 2.0,
      precipitation: 0,
      continentalness: 0.4,
      erosion: 0.7,
      weirdness: 0.0,
      fogColor: '#330808',
      fogDensity: 0.7,
      waterColor: '#FC4E03', // Lava color
      grassColor: '#A04E4E',
      foliageColor: '#A04E4E',
      surfaceBlock: 'netherrack',
      subsurfaceBlock: 'netherrack',
      stoneBlock: 'netherrack',
      liquidBlock: 'lava',
      minHeight: 0,
      maxHeight: 128,
      vegetation: {
        netherWart: 0.03,
        fireCoral: 0.01
      },
      hasLavaOcean: true,
      lavaOceanLevel: 31,
      structures: {
        netherFortress: { chance: 0.02, minDistance: 300, isNetherOnly: true }
      },
      vegetationChance: 0.02,
      vegetationTypes: ['nether_wart_block', 'fire_coral'],
      hostileMobSpawnChance: 0.2,
      neutralMobSpawnChance: 0.05,
      ...options
    });
  }
  
  /**
   * Get a block type at a specific position (override for nether wastes specific blocks)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators to use
   * @param {number} seed - World seed
   * @param {number} surfaceHeight - Height of the terrain surface at this position
   * @returns {Object} - Block type and properties
   */
  getBlockAt(x, y, z, noiseGenerators, seed, surfaceHeight) {
    // First check standard nether conditions
    const baseBlock = super.getBlockAt(x, y, z, noiseGenerators, seed, surfaceHeight);
    if (baseBlock.type !== 'netherrack') {
      return baseBlock;
    }
    
    // Nether wastes specific features
    
    // Generate small lava pools
    if (y <= surfaceHeight && y > this.lavaOceanLevel + 1) {
      if (noiseGenerators && noiseGenerators.caveNoise) {
        const lavaPoolNoise = noiseGenerators.caveNoise.getValue(x * 0.5, y * 0.5, z * 0.5);
        if (lavaPoolNoise > 0.93) {
          return { type: 'lava' };
        }
      }
    }
    
    // Add gravel patches
    if (y <= surfaceHeight && y > this.lavaOceanLevel) {
      if (noiseGenerators && noiseGenerators.erosion) {
        const gravelNoise = noiseGenerators.erosion.getValue(x * 0.2, y * 0.2, z * 0.2);
        if (gravelNoise > 0.93) {
          return { type: 'gravel' };
        }
      }
    }
    
    return baseBlock;
  }
  
  /**
   * Get appropriate features for this position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators to use
   * @param {number} seed - World seed
   * @returns {Array} - List of features to generate at this position
   */
  getFeaturesAt(x, y, z, noiseGenerators, seed) {
    const features = super.getFeaturesAt(x, y, z, noiseGenerators, seed);
    
    // Add nether wart clusters on suitable blocks (if at the surface)
    const rng = this.getPositionRNG(x, y, z, seed);
    
    if (y > this.lavaOceanLevel && rng() < 0.005) {
      features.push({ type: 'nether_wart', x, y, z });
    }
    
    // Add magma blocks near lava level
    if (y <= this.lavaOceanLevel + 3 && y >= this.lavaOceanLevel && rng() < 0.2) {
      features.push({ type: 'magma_block', x, y, z });
    }
    
    return features;
  }
  
  /**
   * Get structures to generate at this position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators to use
   * @param {number} seed - World seed
   * @returns {Array} - List of structures to generate
   */
  getStructuresAt(x, z, noiseGenerators, seed) {
    return super.getStructuresAt(x, z, noiseGenerators, seed);
  }
}

module.exports = NetherWastesBiome; 