/**
 * DripstoneCavesBiome - Underground cave biome featuring stalactites and stalagmites
 * Part of the Caves & Cliffs update
 */

const Biome = require('./baseBiome');

class DripstoneCavesBiome extends Biome {
  /**
   * Create a new DripstoneCavesBiome
   * @param {Object} options - Biome configuration options
   */
  constructor(options = {}) {
    super({
      id: 'dripstone_caves',
      name: 'Dripstone Caves',
      temperature: 0.8,
      humidity: 0.4,
      continentalness: 0.0,
      erosion: 0.0,
      weirdness: 0.0,
      depth: 0.0,
      scale: 0.0,
      fogColor: '#1A1A1A',
      waterColor: '#3F76E4',
      waterFogColor: '#050533',
      skyColor: '#0D0D0D',
      fogDensity: 0.5
    });

    // Dripstone caves specific properties
    this.dripstoneDensity = options.dripstoneDensity || 0.2;
    this.stalactiteHeight = options.stalactiteHeight || 10;
    this.stalagmiteHeight = options.stalagmiteHeight || 8;
    this.pointedDripstoneChance = options.pointedDripstoneChance || 0.1;
    
    // Mob spawning weights in this biome
    this.mobSpawns = {
      bat: { weight: 10, minCount: 1, maxCount: 3 },
      zombie: { weight: 5, minCount: 1, maxCount: 2 },
      skeleton: { weight: 5, minCount: 1, maxCount: 2 },
      creeper: { weight: 3, minCount: 1, maxCount: 1 }
    };
  }
  
  /**
   * Get a block type at a specific position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators to use
   * @param {number} seed - World seed
   * @param {number} surfaceHeight - Height of the terrain surface at this position
   * @returns {Object} - Block type and properties
   */
  getBlockAt(x, y, z, noiseGenerators, seed, surfaceHeight) {
    // First check standard cave blocks
    const baseBlock = super.getBlockAt(x, y, z, noiseGenerators, seed, surfaceHeight);
    
    // Only modify cave air or stone
    if (baseBlock.type !== 'air' && baseBlock.type !== 'stone' && baseBlock.type !== 'cave_air') {
      return baseBlock;
    }
    
    // Check for dripstone formation
    if (noiseGenerators && noiseGenerators.caveNoise) {
      const dripstoneNoise = noiseGenerators.caveNoise.getValue(x * 0.2, y * 0.2, z * 0.2);
      if (dripstoneNoise > 0.8) {
        // Use dripstone block for larger formations
        if (Math.random() < this.dripstoneDensity) {
          return { type: 'dripstone_block' };
        }
      }
      
      // Check for pointed dripstone (stalactites/stalagmites)
      if (baseBlock.type === 'air' || baseBlock.type === 'cave_air') {
        // Check block above and below
        const isBlockAbove = this.isSolidBlockAt(x, y + 1, z, noiseGenerators, seed, surfaceHeight);
        const isBlockBelow = this.isSolidBlockAt(x, y - 1, z, noiseGenerators, seed, surfaceHeight);
        
        if (isBlockAbove && !isBlockBelow) {
          // Potential stalactite (hanging from ceiling)
          const stalactiteNoise = noiseGenerators.caveNoise.getValue(x * 0.5, y * 0.5, z * 0.5);
          if (stalactiteNoise > 0.75 && Math.random() < this.pointedDripstoneChance) {
            return { type: 'pointed_dripstone', variant: 'stalactite' };
          }
        } else if (!isBlockAbove && isBlockBelow) {
          // Potential stalagmite (growing from floor)
          const stalagmiteNoise = noiseGenerators.caveNoise.getValue(x * 0.5, y * 0.5, z * 0.5);
          if (stalagmiteNoise > 0.75 && Math.random() < this.pointedDripstoneChance) {
            return { type: 'pointed_dripstone', variant: 'stalagmite' };
          }
        }
      }
    }
    
    return baseBlock;
  }
  
  /**
   * Check if there's a solid block at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators to use
   * @param {number} seed - World seed
   * @param {number} surfaceHeight - Height of the terrain surface at this position
   * @returns {boolean} - Whether there's a solid block at this position
   */
  isSolidBlockAt(x, y, z, noiseGenerators, seed, surfaceHeight) {
    const block = super.getBlockAt(x, y, z, noiseGenerators, seed, surfaceHeight);
    return block.type !== 'air' && block.type !== 'cave_air' && block.type !== 'water' && block.type !== 'lava';
  }
  
  /**
   * Get features to generate at this position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators to use
   * @param {number} seed - World seed
   * @returns {Array} - List of features to generate
   */
  getFeaturesAt(x, y, z, noiseGenerators, seed) {
    const features = super.getFeaturesAt(x, y, z, noiseGenerators, seed);
    
    // Only add features in underground spaces
    if (!this.isOpenCaveSpace(x, y, z, noiseGenerators, seed)) {
      return features;
    }
    
    // Use position-based RNG
    const rng = this.getPositionRNG(x, y, z, seed);
    
    // Add dripstone column feature
    if (rng() < this.dripstoneDensity) {
      const columnHeight = Math.floor(rng() * this.stalactiteHeight) + 2;
      features.push({
        type: 'dripstone_column',
        x, y, z,
        height: columnHeight,
        baseDiameter: Math.floor(rng() * 3) + 1, // 1-3 block diameter
        connectCeiling: rng() < 0.3, // 30% chance to connect ceiling and floor
        dripLava: rng() < 0.1, // 10% chance to drip lava
        dripWater: rng() < 0.2  // 20% chance to drip water
      });
    }
    
    // Add small water pools (water dripping from stalactites)
    if (rng() < 0.05) {
      features.push({
        type: 'water_pool',
        x, y, z,
        radius: 1 + Math.floor(rng() * 2)
      });
    }
    
    return features;
  }
  
  /**
   * Check if a position is an open cave space
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators to use
   * @param {number} seed - World seed
   * @returns {boolean} - Whether this is an open cave space
   */
  isOpenCaveSpace(x, y, z, noiseGenerators, seed) {
    // Simple check: is the current block air, and are there solid blocks nearby?
    const currentBlock = super.getBlockAt(x, y, z, noiseGenerators, seed, 0);
    if (currentBlock.type !== 'air' && currentBlock.type !== 'cave_air') {
      return false;
    }
    
    // Check for solid blocks around (simple cave detection)
    const hasFloor = this.isSolidBlockAt(x, y - 1, z, noiseGenerators, seed, 0);
    const hasCeiling = this.isSolidBlockAt(x, y + 3, z, noiseGenerators, seed, 0);
    
    return hasFloor || hasCeiling; // Floor or ceiling makes it a cave
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
    
    // Use position-based RNG
    const rng = this.getPositionRNG(x, 0, z, seed);
    
    // Occasional small dripstone cluster structure
    if (rng() < 0.01) { // 1% chance
      structures.push({
        type: 'dripstone_cluster',
        x, y: -1, z, // Y will be determined during generation
        size: Math.floor(rng() * 3) // 0=small, 1=medium, 2=large
      });
    }
    
    return structures;
  }
  
  /**
   * Check if this biome is valid for the given climate parameters
   * @param {Object} climate - Climate parameters
   * @returns {boolean} - Whether this biome can generate with these parameters
   */
  isValidForClimate(climate) {
    // Dripstone caves can generate in various temperature ranges but need to be underground
    return climate.depth > 0.2 && 
           climate.temperature >= 0.3 && 
           climate.temperature <= 1.0;
  }
  
  /**
   * Get a fitness score for how well this biome matches climate parameters
   * @param {Object} climate - Climate parameters
   * @returns {number} - Fitness score (higher is better)
   */
  getFitnessScore(climate) {
    let score = super.getFitnessScore(climate);
    
    // Bonus for underground areas
    if (climate.depth > 0.4) {
      score += 100;
    }
    
    // Bonus for drier areas
    if (climate.precipitation < 0.5) {
      score += 50;
    }
    
    return score;
  }

  generateTerrain(chunk, x, y, z) {
    // Generate dripstone formations
    if (Math.random() < this.dripstoneDensity) {
      this.generateDripstoneFormation(chunk, x, y, z);
    }
  }

  generateDripstoneFormation(chunk, x, y, z) {
    // Generate stalactites from ceiling
    const ceilingY = this.findCeiling(chunk, x, y, z);
    if (ceilingY !== null) {
      this.generateStalactite(chunk, x, ceilingY, z);
    }

    // Generate stalagmites from floor
    const floorY = this.findFloor(chunk, x, y, z);
    if (floorY !== null) {
      this.generateStalagmite(chunk, x, floorY, z);
    }
  }

  findCeiling(chunk, x, y, z) {
    for (let i = y; i < chunk.height; i++) {
      if (chunk.getBlock(x, i, z).isSolid()) {
        return i;
      }
    }
    return null;
  }

  findFloor(chunk, x, y, z) {
    for (let i = y; i > 0; i--) {
      if (chunk.getBlock(x, i, z).isSolid()) {
        return i;
      }
    }
    return null;
  }

  generateStalactite(chunk, x, y, z) {
    const height = Math.floor(Math.random() * this.stalactiteHeight) + 1;
    for (let i = 0; i < height; i++) {
      if (y - i >= 0) {
        chunk.setBlock(x, y - i, z, 'pointed_dripstone', { 
          type: 'stalactite',
          thickness: this.calculateThickness(i, height)
        });
      }
    }
  }

  generateStalagmite(chunk, x, y, z) {
    const height = Math.floor(Math.random() * this.stalagmiteHeight) + 1;
    for (let i = 0; i < height; i++) {
      if (y + i < chunk.height) {
        chunk.setBlock(x, y + i, z, 'pointed_dripstone', {
          type: 'stalagmite',
          thickness: this.calculateThickness(i, height)
        });
      }
    }
  }

  calculateThickness(distance, totalHeight) {
    if (distance === 0) return 'base';
    if (distance === totalHeight - 1) return 'tip';
    if (distance < totalHeight / 3) return 'frustum';
    if (distance > (totalHeight * 2) / 3) return 'middle';
    return 'frustum';
  }

  getSpawnableMobs() {
    return [
      { type: 'drowned', weight: 5 },
      { type: 'skeleton', weight: 3 },
      { type: 'zombie', weight: 2 }
    ];
  }

  getSpawnableBlocks() {
    return [
      { type: 'dripstone_block', weight: 10 },
      { type: 'pointed_dripstone', weight: 5 },
      { type: 'water', weight: 3 }
    ];
  }
}

module.exports = DripstoneCavesBiome; 