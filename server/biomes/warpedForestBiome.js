/**
 * WarpedForestBiome - Nether biome with warped nylium, fungi, and vegetation
 */

const NetherBiome = require('./netherBiome');

class WarpedForestBiome extends NetherBiome {
  /**
   * Create a new WarpedForestBiome
   * @param {Object} options - Biome configuration options
   */
  constructor(options = {}) {
    super({
      id: 'warped_forest',
      name: 'Warped Forest',
      temperature: 2.0,
      precipitation: 0,
      continentalness: 0.6,
      erosion: 0.5,
      weirdness: -0.2,
      fogColor: '#1a051a', // Dark cyan/purple fog
      fogDensity: 0.7,
      waterColor: '#FC4E03', // Lava color
      grassColor: '#0E8474', // Teal color
      foliageColor: '#0E8474', // Teal color
      surfaceBlock: 'warped_nylium',
      subsurfaceBlock: 'netherrack',
      stoneBlock: 'netherrack',
      liquidBlock: 'lava',
      minHeight: 0,
      maxHeight: 128,
      hasLavaOcean: true,
      lavaOceanLevel: 31,
      structures: {
        netherFortress: { chance: 0.005, minDistance: 300, isNetherOnly: true }
      },
      vegetationChance: 0.25, // Higher vegetation chance in forests
      vegetationTypes: [
        'warped_fungus',
        'warped_roots',
        'twisting_vines',
        'shroomlight'
      ],
      hostileMobSpawnChance: 0.05, // Lower hostile mob chance - peaceful biome
      neutralMobSpawnChance: 0.1,
      ...options
    });
    
    // Set specific mob spawns for warped forest
    this.mobSpawns = {
      enderman: { weight: 25, minCount: 1, maxCount: 4 },
      strider: { weight: 8, minCount: 1, maxCount: 3, spawnNearLava: true },
      // No hostile mobs by default in warped forests - it's a "peaceful" nether biome
    };
  }
  
  /**
   * Get a block type at a specific position (override for warped forest specific blocks)
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
    
    // Warped Forest specific features
    
    // Surface blocks - warped nylium
    if (y === surfaceHeight) {
      return { type: this.surfaceBlock };
    }
    
    // Subsurface blocks - mainly netherrack with occasional warped nylium patches
    if (y < surfaceHeight && y >= surfaceHeight - 3) {
      // Add occasional warped nylium patches deeper underground
      if (noiseGenerators && noiseGenerators.weirdness) {
        const nyliumNoise = noiseGenerators.weirdness.getValue(x, y, z);
        if (nyliumNoise > 0.85) {
          return { type: 'warped_nylium' };
        }
      }
    }
    
    // Huge warped fungi trunks
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
            return { type: 'warped_stem' };
          }
        }
      }
    }
    
    // Warped wart blocks
    if (y <= surfaceHeight + 3 && y >= surfaceHeight) {
      if (noiseGenerators && noiseGenerators.erosion) {
        const wartNoise = noiseGenerators.erosion.getValue(x * 0.2, y * 0.2, z * 0.2);
        if (wartNoise > 0.85) {
          return { type: 'warped_wart_block' };
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
    
    // Add specific features for warped forest
    const rng = this.getPositionRNG(x, y, z, seed);
    
    // Only add features at the surface level
    if (y !== Math.floor(this.getTerrainHeight(x, z, noiseGenerators, seed))) {
      return features;
    }
    
    // Warped fungus (small)
    if (rng() < 0.1) {
      features.push({ type: 'warped_fungus', x, y, z });
    }
    
    // Warped roots
    if (rng() < 0.3) {
      features.push({ type: 'warped_roots', x, y, z });
    }
    
    // Huge warped fungi (large structures) - these are rare
    if (rng() < 0.01) {
      features.push({ type: 'huge_warped_fungus', x, y, z });
    }
    
    // Twisting vines growing upward from ground
    if (rng() < 0.08) {
      features.push({ type: 'twisting_vines', x, y, z });
    }
    
    // Nether sprouts (small blue/teal grass)
    if (rng() < 0.15) {
      features.push({ type: 'nether_sprouts', x, y, z });
    }
    
    // Shroomlights around larger fungi
    if (rng() < 0.02) {
      features.push({ type: 'shroomlight', x, y, z });
    }
    
    // Warped wart blocks
    if (rng() < 0.04) {
      features.push({ type: 'warped_wart_block', x, y, z });
    }
    
    return features;
  }
  
  /**
   * Generate a huge warped fungus structure
   * @param {number} x - X coordinate of the base
   * @param {number} y - Y coordinate of the base
   * @param {number} z - Z coordinate of the base
   * @param {Object} random - Random number generator
   * @returns {Object} Structure definition with blocks
   */
  generateHugeWarpedFungus(x, y, z, random) {
    const structure = {
      blocks: {},
      origin: { x, y, z }
    };
    
    // Get a consistent RNG based on the coordinates
    const rng = this.getPositionRNG(x, y, z, random);
    
    // Fungus dimensions
    const height = 6 + Math.floor(rng() * 8); // 6-13 blocks tall
    const capRadius = 2 + Math.floor(rng() * 3); // 2-4 block radius cap
    
    // Generate stem
    for (let dy = 0; dy < height; dy++) {
      structure.blocks[`${x},${y + dy},${z}`] = { type: 'warped_stem' };
    }
    
    // Generate cap
    for (let dx = -capRadius; dx <= capRadius; dx++) {
      for (let dz = -capRadius; dz <= capRadius; dz++) {
        // Skip corners for a more rounded shape
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance <= capRadius + 0.5) {
          // Cap top
          structure.blocks[`${x + dx},${y + height},${z + dz}`] = { type: 'warped_wart_block' };
          
          // Cap underside
          if (distance > 1) {
            structure.blocks[`${x + dx},${y + height - 1},${z + dz}`] = { type: 'warped_wart_block' };
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
      if (structure.blocks[key] && structure.blocks[key].type === 'warped_wart_block') {
        structure.blocks[key] = { type: 'shroomlight' };
      }
    }
    
    // Add twisting vines hanging from the bottom of the cap
    const vineCount = 2 + Math.floor(rng() * 5); // 2-6 vine starts
    for (let i = 0; i < vineCount; i++) {
      const vx = x + (Math.floor(rng() * (capRadius * 2)) - capRadius);
      const vz = z + (Math.floor(rng() * (capRadius * 2)) - capRadius);
      const vy = y + height - 1; // Start at the bottom of the cap
      
      // Only if under a valid cap position
      const capKey = `${vx},${vy},${vz}`;
      if (structure.blocks[capKey] && structure.blocks[capKey].type === 'warped_wart_block') {
        // Vine length varies
        const vineLength = 1 + Math.floor(rng() * 4); // 1-4 blocks long
        for (let dy = 1; dy <= vineLength; dy++) {
          const vineKey = `${vx},${vy - dy},${vz}`;
          if (!structure.blocks[vineKey]) {
            structure.blocks[vineKey] = { type: 'twisting_vines' };
          }
        }
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
    
    // Warped forest is more likely in areas with negative weirdness
    if (climate.weirdness < 0) {
      score += 120;
    }
    
    // Warped forest is more likely in areas with high continentalness
    if (climate.continentalness > 0.5) {
      score += 80;
    }
    
    return score;
  }
}

module.exports = WarpedForestBiome; 