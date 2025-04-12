/**
 * BasaltDeltasBiome - Nether biome with basalt columns, blackstone, and magma
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
      continentalness: 0.2,
      erosion: 0.8,
      weirdness: 0.6,
      fogColor: '#6A6A6A', // Gray ash-filled fog
      fogDensity: 0.9,     // Dense fog
      waterColor: '#FC4E03', // Lava color
      grassColor: '#A0A0A0', // Gray
      foliageColor: '#A0A0A0', // Gray
      surfaceBlock: 'basalt',
      subsurfaceBlock: 'blackstone',
      stoneBlock: 'netherrack',
      liquidBlock: 'lava',
      minHeight: 0,
      maxHeight: 128,
      hasLavaOcean: true,
      lavaOceanLevel: 31,
      structures: {
        netherFortress: { chance: 0.01, minDistance: 300, isNetherOnly: true }
      },
      vegetationChance: 0.01, // Very little vegetation
      vegetationTypes: [],     // No standard vegetation
      hostileMobSpawnChance: 0.2,
      neutralMobSpawnChance: 0.05,
      ...options
    });
    
    // Set specific mob spawns for basalt deltas
    this.mobSpawns = {
      magma_cube: { weight: 25, minCount: 1, maxCount: 4 },
      ghast: { weight: 15, minCount: 1, maxCount: 2 },
      strider: { weight: 8, minCount: 1, maxCount: 3, spawnNearLava: true },
      zombified_piglin: { weight: 5, minCount: 1, maxCount: 4 }
    };
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
    // First check standard nether conditions (ceiling, lava ocean, etc.)
    const baseBlock = super.getBlockAt(x, y, z, noiseGenerators, seed, surfaceHeight);
    if (baseBlock.type !== 'netherrack' && 
        baseBlock.type !== this.surfaceBlock && 
        baseBlock.type !== this.subsurfaceBlock) {
      return baseBlock;
    }
    
    // Basalt Deltas specific features
    
    // Surface blocks - mix of basalt and blackstone
    if (y === surfaceHeight) {
      // Use noise to determine surface block type
      if (noiseGenerators && noiseGenerators.continentalness) {
        const surfaceNoise = noiseGenerators.continentalness.getValue(x, 0, z);
        if (surfaceNoise > 0.6) {
          return { type: 'basalt' };
        } else if (surfaceNoise > 0.3) {
          return { type: 'blackstone' };
        } else {
          return { type: 'magma_block' };
        }
      }
      return { type: 'basalt' };
    }
    
    // Subsurface blocks - mainly blackstone with occasional basalt
    if (y < surfaceHeight && y >= surfaceHeight - 3) {
      // Add occasional magma blocks
      if (noiseGenerators && noiseGenerators.erosion) {
        const magmaNoise = noiseGenerators.erosion.getValue(x, y, z);
        if (magmaNoise > 0.8) {
          return { type: 'magma_block' };
        } else if (magmaNoise > 0.4) {
          return { type: 'blackstone' };
        }
      }
      return { type: this.subsurfaceBlock };
    }
    
    // Basalt columns - tall vertical structures
    if (y <= surfaceHeight + 15 && y >= surfaceHeight) {
      if (noiseGenerators && noiseGenerators.weirdness) {
        const columnNoise = noiseGenerators.weirdness.getValue(x * 0.1, 0, z * 0.1);
        if (columnNoise > 0.9) {
          // Create vertical basalt columns
          // Check if we're in a valid position for a column
          const columnX = Math.floor(x / 4) * 4 + 2;
          const columnZ = Math.floor(z / 4) * 4 + 2;
          const distance = Math.sqrt(Math.pow(x - columnX, 2) + Math.pow(z - columnZ, 2));
          
          if (distance < 0.8) {
            // Determine column height using the y-coordinate's noise
            const heightNoise = noiseGenerators.weirdness.getValue(columnX, 0, columnZ);
            const maxHeight = surfaceHeight + 5 + Math.floor(heightNoise * 10);
            
            if (y <= maxHeight) {
              return { type: 'basalt' };
            }
          }
        }
      }
    }
    
    // Lava pools on the surface
    if (y === surfaceHeight) {
      if (noiseGenerators && noiseGenerators.caveNoise) {
        const lavaNoise = noiseGenerators.caveNoise.getValue(x * 0.2, 0, z * 0.2);
        if (lavaNoise > 0.92) {
          return { type: 'lava' };
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
    
    // Add specific features for basalt deltas
    const rng = this.getPositionRNG(x, y, z, seed);
    
    // Only add features at the surface level
    if (y !== Math.floor(this.getTerrainHeight(x, z, noiseGenerators, seed))) {
      return features;
    }
    
    // Small obsidian deposits
    if (rng() < 0.02) {
      features.push({ type: 'obsidian', x, y, z });
    }
    
    // Magma blocks
    if (rng() < 0.08) {
      features.push({ type: 'magma_block', x, y, z });
    }
    
    // Gilded blackstone (rare)
    if (rng() < 0.005) {
      features.push({ type: 'gilded_blackstone', x, y, z });
    }
    
    // Lava bubbles (particle effect feature)
    if (rng() < 0.1) {
      features.push({ 
        type: 'particle_emitter', 
        particleType: 'lava',
        rate: 0.02,
        x, y, z 
      });
    }
    
    // Ash particles (particle effect feature)
    if (rng() < 0.2) {
      features.push({ 
        type: 'particle_emitter', 
        particleType: 'ash',
        rate: 0.05,
        x, y, z 
      });
    }
    
    return features;
  }
  
  /**
   * Generate a basalt column structure
   * @param {number} x - X coordinate of the base
   * @param {number} y - Y coordinate of the base
   * @param {number} z - Z coordinate of the base
   * @param {Object} random - Random number generator
   * @returns {Object} Structure definition with blocks
   */
  generateBasaltColumn(x, y, z, random) {
    const structure = {
      blocks: {},
      origin: { x, y, z }
    };
    
    // Get a consistent RNG based on the coordinates
    const rng = this.getPositionRNG(x, y, z, random);
    
    // Column dimensions
    const height = 4 + Math.floor(rng() * 12); // 4-15 blocks tall
    const radius = rng() < 0.3 ? 1 : 0; // Occasionally make thicker columns
    
    // Generate column
    for (let dy = 0; dy < height; dy++) {
      if (radius === 0) {
        // Single column
        structure.blocks[`${x},${y + dy},${z}`] = { type: 'basalt' };
      } else {
        // Thicker column
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dz = -radius; dz <= radius; dz++) {
            // Skip corners for a more natural look
            if (Math.abs(dx) === radius && Math.abs(dz) === radius) {
              if (rng() < 0.5) continue;
            }
            structure.blocks[`${x + dx},${y + dy},${z + dz}`] = { type: 'basalt' };
          }
        }
      }
    }
    
    // Occasionally add magma block at the base
    if (rng() < 0.3) {
      structure.blocks[`${x},${y - 1},${z}`] = { type: 'magma_block' };
    }
    
    return structure;
  }
  
  /**
   * Get terrain height at a specific position
   * Overridden to create more varied terrain with deltas and basins
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators to use
   * @param {number} seed - World seed value
   * @returns {number} - Height of the terrain at this position
   */
  getTerrainHeight(x, z, noiseGenerators, seed) {
    // First get the base height from the parent method
    const baseHeight = super.getTerrainHeight(x, z, noiseGenerators, seed);
    
    // Add additional delta/basin variation for basalt deltas biome
    if (noiseGenerators && noiseGenerators.weirdness) {
      const deltaNoise = noiseGenerators.weirdness.getValue(x * 0.05, 0, z * 0.05);
      
      // Sharp peaks and valleys
      const deltaVariation = Math.pow(Math.abs(deltaNoise), 0.5) * 12;
      
      if (deltaNoise > 0) {
        // Raised deltas
        return baseHeight + deltaVariation;
      } else {
        // Lowered basins, but not below lava level
        return Math.max(this.lavaOceanLevel + 1, baseHeight - deltaVariation);
      }
    }
    
    return baseHeight;
  }
  
  /**
   * Get a fitness score for how well this biome matches climate parameters
   * @param {Object} climate - Climate parameters
   * @returns {number} - Fitness score (higher is better)
   */
  getFitnessScore(climate) {
    let score = super.getFitnessScore(climate);
    
    // Basalt deltas are more likely in areas with high erosion
    if (climate.erosion > 0.7) {
      score += 150;
    }
    
    // Basalt deltas are more likely in areas with high weirdness
    if (climate.weirdness > 0.5) {
      score += 100;
    }
    
    return score;
  }
}

module.exports = BasaltDeltasBiome; 