/**
 * SoulSandValleyBiome - Nether biome with soul sand, soul soil, and blue fire
 */

const NetherBiome = require('./netherBiome');

class SoulSandValleyBiome extends NetherBiome {
  /**
   * Create a new SoulSandValleyBiome
   * @param {Object} options - Biome configuration options
   */
  constructor(options = {}) {
    super({
      id: 'soul_sand_valley',
      name: 'Soul Sand Valley',
      temperature: 2.0,
      precipitation: 0,
      continentalness: 0.3,
      erosion: 0.4,
      weirdness: 0.4,
      fogColor: '#1B4745', // Dark cyan-blue fog
      fogDensity: 0.8,
      waterColor: '#FC4E03', // Lava color
      grassColor: '#5B5054',
      foliageColor: '#5B5054',
      surfaceBlock: 'soul_sand',
      subsurfaceBlock: 'soul_soil',
      stoneBlock: 'netherrack',
      liquidBlock: 'lava',
      minHeight: 0,
      maxHeight: 128,
      hasLavaOcean: true,
      lavaOceanLevel: 31,
      structures: {
        netherFortress: { chance: 0.01, minDistance: 300, isNetherOnly: true }
      },
      vegetationChance: 0.01,
      vegetationTypes: ['soul_fire', 'bone_block'],
      hostileMobSpawnChance: 0.25,
      neutralMobSpawnChance: 0.02,
      ...options
    });
    
    // Set specific mob spawns for soul sand valley
    this.mobSpawns = {
      // More skeletons/wither skeletons than other mobs
      skeleton: { weight: 20, minCount: 2, maxCount: 4 },
      wither_skeleton: { weight: 15, minCount: 1, maxCount: 3 },
      ghast: { weight: 10, minCount: 1, maxCount: 2 },
      enderman: { weight: 5, minCount: 1, maxCount: 2 },
      strider: { weight: 8, minCount: 1, maxCount: 3, spawnNearLava: true },
    };
  }
  
  /**
   * Get a block type at a specific position (override for soul sand valley specific blocks)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators to use
   * @param {number} seed - World seed
   * @param {number} surfaceHeight - Height of the terrain surface at this position
   * @returns {Object} - Block type and properties
   */
  getBlockAt(x, y, z, noiseGenerators, seed, surfaceHeight) {
    // First check standard nether conditions (ceiling, lava ocean, etc.)
    const baseBlock = super.getBlockAt(x, y, z, noiseGenerators, seed, surfaceHeight);
    if (baseBlock.type !== 'netherrack' && 
        baseBlock.type !== this.surfaceBlock && 
        baseBlock.type !== this.subsurfaceBlock) {
      return baseBlock;
    }
    
    // Soul Sand Valley specific features
    
    // Surface blocks - soul sand
    if (y === surfaceHeight) {
      return { type: this.surfaceBlock };
    }
    
    // Subsurface blocks - mix of soul soil and soul sand
    if (y < surfaceHeight && y >= surfaceHeight - 3) {
      // Use noise to mix soul sand and soul soil for varied terrain
      if (noiseGenerators && noiseGenerators.erosion) {
        const soilNoise = noiseGenerators.erosion.getValue(x, y, z);
        return { type: soilNoise > 0.4 ? 'soul_soil' : 'soul_sand' };
      }
      return { type: y === surfaceHeight - 1 ? 'soul_soil' : 'netherrack' };
    }
    
    // Basalt pillars
    if (y < surfaceHeight && y > this.lavaOceanLevel) {
      if (noiseGenerators && noiseGenerators.continentalness) {
        const basaltNoise = noiseGenerators.continentalness.getValue(x * 0.05, y * 0.1, z * 0.05);
        if (basaltNoise > 0.92) {
          return { type: 'basalt' };
        }
      }
    }
    
    // Bone blocks
    if (y <= surfaceHeight && y > this.lavaOceanLevel + 5) {
      const rng = this.getPositionRNG(x, y, z, seed);
      if (rng() < 0.005) {
        return { type: 'bone_block' };
      }
    }
    
    return baseBlock.type === 'netherrack' ? { type: 'netherrack' } : baseBlock;
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
    
    // Add specific features for soul sand valley
    const rng = this.getPositionRNG(x, y, z, seed);
    
    // Add soul fire on soul sand/soil
    if (y > this.lavaOceanLevel && rng() < 0.02) {
      features.push({ type: 'soul_fire', x, y, z });
    }
    
    // Add bone structures (small piles of bone blocks)
    if (y > this.lavaOceanLevel && rng() < 0.005) {
      features.push({ type: 'bone_structure', x, y, z });
    }
    
    // Extra fossils
    if (y > this.lavaOceanLevel + 10 && rng() < 0.001) {
      features.push({ type: 'nether_fossil', x, y, z });
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
    const structures = super.getStructuresAt(x, z, noiseGenerators, seed);
    
    // Add fossils as additional structures
    const rng = this.getPositionRNG(x, 0, z, seed);
    if (rng() < 0.01) {
      structures.push({ type: 'nether_fossil', x, z });
    }
    
    return structures;
  }
  
  /**
   * Get a fitness score for how well this biome matches climate parameters
   * @param {Object} climate - Climate parameters
   * @returns {number} - Fitness score (higher is better)
   */
  getFitnessScore(climate) {
    let score = super.getFitnessScore(climate);
    
    // Soul sand valley is more likely in areas with high weirdness
    if (climate.weirdness > 0.3) {
      score += 100;
    }
    
    return score;
  }
}

module.exports = SoulSandValleyBiome; 