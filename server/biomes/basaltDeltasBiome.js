/**
 * BasaltDeltasBiome - Volcanic nether biome with basalt columns, blackstone, and magma blocks
 */

const NetherBiome = require('./netherBiome');

class BasaltDeltasBiome extends NetherBiome {
  /**
   * Create a new BasaltDeltasBiome
   * @param {Object} options - Biome configuration options
   */
  constructor(options = {}) {
    super({
      id: 'basalt_deltas',
      name: 'Basalt Deltas',
      temperature: 2.0,
      precipitation: 0,
      continentalness: 0.6,
      erosion: 0.2,
      weirdness: 0.8,
      fogColor: '#6A6A6A',
      fogDensity: 0.8,
      waterColor: '#FC4E03', // Lava color
      grassColor: '#5A5A5A',
      foliageColor: '#5A5A5A',
      surfaceBlock: 'basalt',
      subsurfaceBlock: 'blackstone',
      stoneBlock: 'blackstone',
      liquidBlock: 'lava',
      minHeight: 0,
      maxHeight: 128,
      hasLavaOcean: true,
      lavaOceanLevel: 31,
      structures: {
        netherFortress: { chance: 0.01, minDistance: 300, isNetherOnly: true },
        ruinedPortal: { chance: 0.02, minDistance: 200, isNetherOnly: true }
      },
      vegetationChance: 0.01,
      vegetationTypes: ['fire_coral'],
      hostileMobSpawnChance: 0.2,
      neutralMobSpawnChance: 0.05,
      ...options
    });
  }
  
  /**
   * Get a block type at a specific position (override for basalt deltas specific blocks)
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
    if (baseBlock.type !== 'basalt' && baseBlock.type !== 'blackstone') {
      return baseBlock;
    }
    
    // Basalt deltas specific features
    
    // Generate basalt columns
    if (y <= surfaceHeight && y > this.lavaOceanLevel) {
      if (noiseGenerators && noiseGenerators.caveNoise) {
        const columnNoise = noiseGenerators.caveNoise.getValue(x * 0.3, 0, z * 0.3);
        if (columnNoise > 0.75) {
          // Generate basalt columns that extend upward
          const heightNoise = noiseGenerators.caveNoise.getValue(x * 0.1, y * 0.1, z * 0.1);
          const columnHeight = Math.floor(10 + heightNoise * 15);
          if (y <= surfaceHeight + columnHeight) {
            return { type: 'basalt' };
          }
        }
      }
    }
    
    // Add magma blocks near lava level
    if (y <= this.lavaOceanLevel + 2 && y > this.lavaOceanLevel) {
      if (noiseGenerators && noiseGenerators.caveNoise) {
        const magmaNoise = noiseGenerators.caveNoise.getValue(x * 0.4, y * 0.4, z * 0.4);
        if (magmaNoise > 0.7) {
          return { type: 'magma_block' };
        }
      }
    }
    
    // Add blackstone patches
    if (y <= surfaceHeight && y > this.lavaOceanLevel) {
      if (noiseGenerators && noiseGenerators.erosion) {
        const blackstoneNoise = noiseGenerators.erosion.getValue(x * 0.2, y * 0.2, z * 0.2);
        if (blackstoneNoise > 0.65) {
          // Use gilded blackstone rarely
          const isGilded = Math.random() < 0.05;
          return { type: isGilded ? 'gilded_blackstone' : 'blackstone' };
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
    
    // Simple RNG based on position and seed
    const rng = this.getPositionRNG(x, y, z, seed);
    
    // Add magma blocks with higher frequency
    if (y <= this.lavaOceanLevel + 5 && y >= this.lavaOceanLevel && rng() < 0.3) {
      features.push({ type: 'magma_block', x, y, z });
    }
    
    // Add occasional polished basalt as decoration
    if (y > this.lavaOceanLevel && rng() < 0.02) {
      features.push({ type: 'polished_basalt', x, y, z });
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

module.exports = BasaltDeltasBiome; 