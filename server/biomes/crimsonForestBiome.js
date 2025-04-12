/**
 * CrimsonForestBiome - Nether biome with crimson nylium, fungi, and vegetation
 */

const NetherBiome = require('./netherBiome');

class CrimsonForestBiome extends NetherBiome {
  /**
   * Create a new CrimsonForestBiome
   * @param {Object} options - Biome configuration options
   */
  constructor(options = {}) {
    super({
      id: 'crimson_forest',
      name: 'Crimson Forest',
      temperature: 2.0,
      precipitation: 0,
      continentalness: 0.6,
      erosion: 0.5,
      weirdness: 0.2,
      fogColor: '#330303', // Dark red fog
      fogDensity: 0.6,
      waterColor: '#FC4E03', // Lava color
      grassColor: '#DD0808', // Crimson color
      foliageColor: '#DD0808', // Crimson color
      surfaceBlock: 'crimson_nylium',
      subsurfaceBlock: 'netherrack',
      stoneBlock: 'netherrack',
      liquidBlock: 'lava',
      minHeight: 0,
      maxHeight: 128,
      hasLavaOcean: true,
      lavaOceanLevel: 31,
      structures: {
        netherFortress: { chance: 0.01, minDistance: 300, isNetherOnly: true }
      },
      vegetationChance: 0.2, // Higher vegetation chance in forests
      vegetationTypes: [
        'crimson_fungus',
        'crimson_roots',
        'weeping_vines',
        'shroomlight'
      ],
      hostileMobSpawnChance: 0.15,
      neutralMobSpawnChance: 0.1,
      ...options
    });
    
    // Set specific mob spawns for crimson forest
    this.mobSpawns = {
      piglin: { weight: 20, minCount: 2, maxCount: 4 },
      hoglin: { weight: 15, minCount: 1, maxCount: 3 },
      zombified_piglin: { weight: 10, minCount: 1, maxCount: 4 },
      enderman: { weight: 5, minCount: 1, maxCount: 2 },
      strider: { weight: 8, minCount: 1, maxCount: 3, spawnNearLava: true },
    };
  }
  
  /**
   * Get a block type at a specific position (override for crimson forest specific blocks)
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
    
    // Crimson Forest specific features
    
    // Surface blocks - crimson nylium
    if (y === surfaceHeight) {
      return { type: this.surfaceBlock };
    }
    
    // Subsurface blocks - mainly netherrack with occasional crimson nylium patches
    if (y < surfaceHeight && y >= surfaceHeight - 3) {
      // Add occasional crimson nylium patches deeper underground
      if (noiseGenerators && noiseGenerators.weirdness) {
        const nyliumNoise = noiseGenerators.weirdness.getValue(x, y, z);
        if (nyliumNoise > 0.85) {
          return { type: 'crimson_nylium' };
        }
      }
    }
    
    // Huge crimson fungi trunks
    if (y <= surfaceHeight + 20 && y >= surfaceHeight) {
      if (noiseGenerators && noiseGenerators.continentalness) {
        const fungiNoise = noiseGenerators.continentalness.getValue(x * 0.1, 0, z * 0.1);
        // Create large "trunk" structures
        if (fungiNoise > 0.92) {
          // Check if we're in a valid position for a trunk (center of a rough circle)
          const centerX = Math.floor(x / 8) * 8 + 4;
          const centerZ = Math.floor(z / 8) * 8 + 4;
          const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(z - centerZ, 2));
          
          if (distance < 2.5) {
            return { type: 'crimson_stem' };
          }
        }
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
    
    // Add specific features for crimson forest
    const rng = this.getPositionRNG(x, y, z, seed);
    
    // Only add features at the surface level
    if (y !== Math.floor(this.getTerrainHeight(x, z, noiseGenerators, seed))) {
      return features;
    }
    
    // Crimson fungus (small)
    if (rng() < 0.08) {
      features.push({ type: 'crimson_fungus', x, y, z });
    }
    
    // Crimson roots
    if (rng() < 0.25) {
      features.push({ type: 'crimson_roots', x, y, z });
    }
    
    // Huge crimson fungi (large structures) - these are rare
    if (rng() < 0.01) {
      features.push({ type: 'huge_crimson_fungus', x, y, z });
    }
    
    // Weeping vines hanging from ceilings
    if (y < this.ceilingHeight - 2 && y > this.ceilingHeight - 10 && rng() < 0.05) {
      features.push({ type: 'weeping_vines', x, y, z });
    }
    
    // Shroomlights around larger fungi
    if (rng() < 0.02) {
      features.push({ type: 'shroomlight', x, y, z });
    }
    
    return features;
  }
  
  /**
   * Generate a huge crimson fungus structure
   * @param {number} x - X coordinate of the base
   * @param {number} y - Y coordinate of the base
   * @param {number} z - Z coordinate of the base
   * @param {Object} random - Random number generator
   * @returns {Object} Structure definition with blocks
   */
  generateHugeCrimsonFungus(x, y, z, random) {
    const structure = {
      blocks: {},
      origin: { x, y, z }
    };
    
    // Get a consistent RNG based on the coordinates
    const rng = this.getPositionRNG(x, y, z, random);
    
    // Fungus dimensions
    const height = 5 + Math.floor(rng() * 7); // 5-11 blocks tall
    const capRadius = 2 + Math.floor(rng() * 3); // 2-4 block radius cap
    
    // Generate stem
    for (let dy = 0; dy < height; dy++) {
      structure.blocks[`${x},${y + dy},${z}`] = { type: 'crimson_stem' };
    }
    
    // Generate cap
    for (let dx = -capRadius; dx <= capRadius; dx++) {
      for (let dz = -capRadius; dz <= capRadius; dz++) {
        // Skip corners for a more rounded shape
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance <= capRadius + 0.5) {
          // Cap top
          structure.blocks[`${x + dx},${y + height},${z + dz}`] = { type: 'crimson_wart_block' };
          
          // Cap underside
          if (distance > 1) {
            structure.blocks[`${x + dx},${y + height - 1},${z + dz}`] = { type: 'crimson_wart_block' };
          }
        }
      }
    }
    
    // Add shroomlights
    const shroomlightCount = 1 + Math.floor(rng() * 3); // 1-3 shroomlights
    for (let i = 0; i < shroomlightCount; i++) {
      const sx = x + (Math.floor(rng() * (capRadius * 2)) - capRadius);
      const sz = z + (Math.floor(rng() * (capRadius * 2)) - capRadius);
      const sy = y + height - 1; // Place at the bottom of the cap
      
      // Only if a valid cap position
      const key = `${sx},${sy},${sz}`;
      if (structure.blocks[key] && structure.blocks[key].type === 'crimson_wart_block') {
        structure.blocks[key] = { type: 'shroomlight' };
      }
    }
    
    return structure;
  }
  
  /**
   * Get a fitness score for how well this biome matches climate parameters
   * @param {Object} climate - Climate parameters
   * @returns {number} - Fitness score (higher is better)
   */
  getFitnessScore(climate) {
    let score = super.getFitnessScore(climate);
    
    // Crimson forest is more likely in areas with high continentalness
    if (climate.continentalness > 0.5) {
      score += 100;
    }
    
    return score;
  }
}

module.exports = CrimsonForestBiome; 