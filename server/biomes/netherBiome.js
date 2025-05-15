/**
 * NetherBiome - Base class for all nether biomes
 * Defines common properties and behaviors for nether environments
 */

const BiomeBase = require('./biomeBase');

class NetherBiome extends BiomeBase {
  /**
   * Create a new NetherBiome
   * @param {Object} options - Biome configuration options
   */
  constructor(options = {}) {
    // Set default options for nether biomes
    const defaultOptions = {
      name: 'Nether',
      id: 'nether',
      temperature: 2.0,  // Very hot
      precipitation: 0,   // No rain
      hasSnow: false,
      hasCaves: true,
      fogColor: '#330808',
      waterColor: '#fc4e03',  // Lava color
      grassColor: '#3f3f3f',
      foliageColor: '#3f3f3f',
      minHeight: 0,
      maxHeight: 128,
      surfaceBlock: 'netherrack',
      subsurfaceBlock: 'netherrack',
      stoneBlock: 'netherrack',
      liquidBlock: 'lava',
      dimension: 'nether',
      ...options
    };
    
    super(defaultOptions);
    
    // Additional nether-specific properties
    this.isNether = true;
    this.hasLavaOcean = options.hasLavaOcean !== undefined ? options.hasLavaOcean : true;
    this.lavaOceanLevel = options.lavaOceanLevel || 31;
    this.ceilingHeight = options.ceilingHeight || 128;
    this.hasCeiling = options.hasCeiling !== undefined ? options.hasCeiling : true;
    this.ceilingBlock = options.ceilingBlock || 'netherrack';
    
    // Default vegetation is different in the nether
    this.vegetationChance = options.vegetationChance || 0.1;
    this.vegetationTypes = options.vegetationTypes || [];
    
    // Structure generation is also different
    this.structures = options.structures || {
      netherFortress: { chance: 0.02, minDistance: 300, isNetherOnly: true }
    };
    
    // Hostility is higher in the nether
    this.hostileMobSpawnChance = options.hostileMobSpawnChance || 0.2;
    this.passiveMobSpawnChance = options.passiveMobSpawnChance || 0;
    this.neutralMobSpawnChance = options.neutralMobSpawnChance || 0.05;
  }
  
  /**
   * Get terrain height at a specific position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators to use
   * @param {number} seed - World seed value
   * @returns {number} - Height of the terrain at this position
   */
  getTerrainHeight(x, z, noiseGenerators, seed) {
    // Nether has a different height generation approach
    // It generates from bottom (0) to ceiling (128) with various cave systems
    
    const terrainScale = 0.01; // Scale factor for noise
    
    // Base continent noise
    let baseHeight = 0;
    if (noiseGenerators && noiseGenerators.continentalness) {
      baseHeight = noiseGenerators.continentalness.getValue(x, 0, z);
    } else {
      // Fallback noise if generators not provided
      baseHeight = Math.sin(x * terrainScale) * Math.cos(z * terrainScale);
    }
    
    // Adjust to full nether height range
    baseHeight = (baseHeight + 1) * 0.5; // Normalize to 0-1
    
    // Calculate height range - nether typically has height valleys for lava oceans
    let minGenHeight = this.minHeight || 16;
    const maxGenHeight = this.hasLavaOcean ? this.lavaOceanLevel + 16 : 48;
    
    // Adjust height if below lava ocean level
    if (this.hasLavaOcean && baseHeight < 0.3) {
      // Areas with very low noise become lava oceans
      return this.lavaOceanLevel - (0.3 - baseHeight) * 20;
    }
    
    // Generate base height
    const height = Math.floor(minGenHeight + baseHeight * (maxGenHeight - minGenHeight));
    
    return height;
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
    // First check for ceiling blocks
    if (this.hasCeiling && y >= this.ceilingHeight - 1) {
      return { type: this.ceilingBlock };
    }
    
    // Check for lava ocean
    if (this.hasLavaOcean && y <= this.lavaOceanLevel) {
      return { type: this.liquidBlock };
    }
    
    // Add some cave systems
    if (noiseGenerators && noiseGenerators.caveNoise) {
      const caveValue = noiseGenerators.caveNoise.getValue(x, y, z);
      
      // Larger caves in the nether
      if (caveValue > 0.6) {
        return { type: 'air' };
      }
    }
    
    // Check for soul sand patches using noise
    if (noiseGenerators && noiseGenerators.erosion) {
      const erosionValue = noiseGenerators.erosion.getValue(x, y, z);
      if (erosionValue > 0.8 && y < surfaceHeight + 3 && y > this.lavaOceanLevel) {
        return { type: 'soul_sand' };
      }
    }
    
    // Standard nether blocks
    if (y === surfaceHeight) {
      return { type: this.surfaceBlock };
    }
    
    return { type: this.subsurfaceBlock };
  }
  
  /**
   * Get appropriate features (vegetation, ores, etc.) for this position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators to use
   * @param {number} seed - World seed
   * @returns {Array} - List of features to generate at this position
   */
  getFeaturesAt(x, y, z, noiseGenerators, seed) {
    const features = [];
    
    // Simple RNG based on position and seed
    const rng = this.getPositionRNG(x, y, z, seed);
    
    // Generate vegetation if on surface and random check passes
    if (rng() < this.vegetationChance && this.vegetationTypes.length > 0) {
      const vegetationType = this.vegetationTypes[Math.floor(rng() * this.vegetationTypes.length)];
      features.push({ type: vegetationType, x, y, z });
    }
    
    // Add nether-specific ores
    this.addNetherOres(features, x, y, z, rng);
    
    return features;
  }
  
  /**
   * Add appropriate nether ores to the features list
   * @private
   * @param {Array} features - Features array to modify
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Function} rng - Random number generator
   */
  addNetherOres(features, x, y, z, rng) {
    // Quartz ore - common in the nether
    if (rng() < 0.1 && y > this.lavaOceanLevel && y < this.ceilingHeight - 10) {
      features.push({ type: 'nether_quartz_ore', x, y, z });
    }
    
    // Ancient debris - rare but valuable
    if (rng() < 0.005 && y > 15 && y < 80) {
      features.push({ type: 'ancient_debris', x, y, z });
    }
    
    // Gold ore - appears in the nether
    if (rng() < 0.02 && y > this.lavaOceanLevel + 10 && y < this.ceilingHeight - 20) {
      features.push({ type: 'nether_gold_ore', x, y, z });
    }
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
    const structures = [];
    
    // Simple RNG based on position and seed
    const rng = this.getPositionRNG(x, 0, z, seed);
    
    // Check for each structure type
    for (const [structureType, config] of Object.entries(this.structures)) {
      if (rng() < config.chance) {
        structures.push({ type: structureType, x, z });
      }
    }
    
    return structures;
  }
  
  /**
   * Get a consistent random number generator for a position
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} seed - World seed
   * @returns {Function} - RNG function
   */
  getPositionRNG(x, y, z, seed) {
    // Create a seed from the position and world seed
    const positionSeed = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791) ^ seed;
    
    // Simple RNG function
    return () => {
      // Xorshift algorithm
      let result = positionSeed;
      result ^= result << 13;
      result ^= result >> 17;
      result ^= result << 5;
      
      // Normalize to 0-1
      return Math.abs(result) / 2147483647;
    };
  }
  
  /**
   * Check if the biome is valid for a set of climate parameters
   * @param {Object} climate - Climate parameters
   * @returns {boolean} - Whether the biome is valid for these parameters
   */
  isValidForClimate(climate) {
    // Nether biomes are only valid for the nether dimension
    if (climate.dimension !== 'nether') {
      return false;
    }
    
    // Nether biomes have different climate criteria
    if (climate.temperature < this.temperature - 0.4 || climate.temperature > this.temperature + 0.4) {
      return false;
    }
    
    // Check other climate parameters as needed
    if (climate.continentalness && 
        (climate.continentalness < this.minContinentalness || 
         climate.continentalness > this.maxContinentalness)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get a fitness score for how well this biome matches climate parameters
   * @param {Object} climate - Climate parameters
   * @returns {number} - Fitness score (higher is better)
   */
  getFitnessScore(climate) {
    // For non-nether dimensions, return very low score
    if (climate.dimension !== 'nether') {
      return -1000;
    }
    
    let score = 1000;
    
    // Temperature difference affects score
    const tempDiff = Math.abs(climate.temperature - this.temperature);
    score -= tempDiff * 300;
    
    // Other climate parameters can affect score
    if (climate.continentalness !== undefined) {
      const contDiff = Math.abs(climate.continentalness - (this.minContinentalness + this.maxContinentalness) / 2);
      score -= contDiff * 200;
    }
    
    return score;
  }
}

module.exports = NetherBiome; 