/**
 * Noise generation utilities for terrain and climate generation
 * Provides several noise algorithms including Perlin, Simplex, and FBM
 */

/**
 * Simple pseudorandom number generator with seed
 */
class SeededRandom {
  /**
   * Create a new seeded random number generator
   * @param {number} seed - Seed value
   */
  constructor(seed = 1234) {
    this.seed = seed;
  }

  /**
   * Generate a random number between 0 and 1
   * @returns {number} - Random value between 0 and 1
   */
  next() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Generate a random integer between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} - Random integer between min and max
   */
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate a random float between min and max
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} - Random float between min and max
   */
  nextFloat(min, max) {
    return this.next() * (max - min) + min;
  }
}

/**
 * Simple 2D interpolated noise
 */
class InterpolatedNoise {
  /**
   * Create a new interpolated noise generator
   * @param {Object} options - Noise options
   * @param {number} options.seed - Seed for the noise
   * @param {number} options.scale - Scale of the noise (default 1.0)
   */
  constructor({ seed = 1234, scale = 1.0 } = {}) {
    this.random = new SeededRandom(seed);
    this.scale = scale;
    this.points = new Map();
  }

  /**
   * Get a value from the noise at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate (optional)
   * @param {number} z - Z coordinate (optional)
   * @returns {number} - Noise value between -1 and 1
   */
  get(x, y = 0, z = 0) {
    // Apply scale
    x = x * this.scale;
    y = y * this.scale;
    z = z * this.scale;
    
    // Get grid points
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const z0 = Math.floor(z);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const z1 = z0 + 1;
    
    // Get interpolation factors
    const sx = x - x0;
    const sy = y - y0;
    const sz = z - z0;
    
    // Interpolate values
    let value;
    if (z === 0) {
      // 2D interpolation
      const n00 = this.getValue(x0, y0, 0);
      const n10 = this.getValue(x1, y0, 0);
      const n01 = this.getValue(x0, y1, 0);
      const n11 = this.getValue(x1, y1, 0);
      
      const nx0 = this.lerp(n00, n10, this.fade(sx));
      const nx1 = this.lerp(n01, n11, this.fade(sx));
      value = this.lerp(nx0, nx1, this.fade(sy));
    } else {
      // 3D interpolation
      const n000 = this.getValue(x0, y0, z0);
      const n100 = this.getValue(x1, y0, z0);
      const n010 = this.getValue(x0, y1, z0);
      const n110 = this.getValue(x1, y1, z0);
      const n001 = this.getValue(x0, y0, z1);
      const n101 = this.getValue(x1, y0, z1);
      const n011 = this.getValue(x0, y1, z1);
      const n111 = this.getValue(x1, y1, z1);
      
      const nx00 = this.lerp(n000, n100, this.fade(sx));
      const nx10 = this.lerp(n010, n110, this.fade(sx));
      const nx01 = this.lerp(n001, n101, this.fade(sx));
      const nx11 = this.lerp(n011, n111, this.fade(sx));
      
      const nxy0 = this.lerp(nx00, nx10, this.fade(sy));
      const nxy1 = this.lerp(nx01, nx11, this.fade(sy));
      
      value = this.lerp(nxy0, nxy1, this.fade(sz));
    }
    
    return value;
  }

  /**
   * Get a noise value at an integer grid point
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @returns {number} - Noise value between -1 and 1
   */
  getValue(x, y, z) {
    const key = `${x},${y},${z}`;
    if (!this.points.has(key)) {
      // Generate a new point value
      this.random.seed = (x * 12345 + y * 67890 + z * 54321) % 987654321;
      this.points.set(key, this.random.nextFloat(-1, 1));
    }
    return this.points.get(key);
  }

  /**
   * Linear interpolation between a and b by t
   * @private
   * @param {number} a - First value
   * @param {number} b - Second value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} - Interpolated value
   */
  lerp(a, b, t) {
    return a + t * (b - a);
  }

  /**
   * Smoothstep function for smoother interpolation
   * @private
   * @param {number} t - Value to fade (0-1)
   * @returns {number} - Faded value
   */
  fade(t) {
    return t * t * (3 - 2 * t);
  }
}

/**
 * Fractal Brownian Motion noise - layered noise for natural-looking terrain
 */
class FBMNoise {
  /**
   * Create a new FBM noise generator
   * @param {Object} options - Noise options
   * @param {number} options.seed - Base seed for the noise
   * @param {number} options.octaves - Number of octaves (noise layers)
   * @param {number} options.persistence - How much each octave contributes
   * @param {number} options.lacunarity - How frequency increases with each octave
   * @param {number} options.scale - Base scale of the noise
   */
  constructor({ 
    seed = 1234, 
    octaves = 4, 
    persistence = 0.5, 
    lacunarity = 2.0,
    scale = 1.0
  } = {}) {
    this.octaves = Math.max(1, Math.min(octaves, 16)); // Clamp octaves to reasonable range
    this.persistence = persistence;
    this.lacunarity = lacunarity;
    this.scale = scale;
    
    // Create noise generators for each octave
    this.noiseGenerators = [];
    for (let i = 0; i < this.octaves; i++) {
      this.noiseGenerators.push(new InterpolatedNoise({
        seed: seed + i * 1000,
        scale: scale * Math.pow(lacunarity, i)
      }));
    }
  }

  /**
   * Get a value from the noise at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate (optional)
   * @param {number} z - Z coordinate (optional)
   * @returns {number} - Noise value between -1 and 1
   */
  get(x, y = 0, z = 0) {
    let total = 0;
    let frequency = 1.0;
    let amplitude = 1.0;
    let maxValue = 0;
    
    // Combine octaves
    for (let i = 0; i < this.octaves; i++) {
      total += this.noiseGenerators[i].get(x, y, z) * amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;
    }
    
    // Normalize to -1 to 1
    return total / maxValue;
  }
}

/**
 * Worley noise (cellular noise) for creating cell-like structures
 */
class WorleyNoise {
  /**
   * Create a new Worley noise generator
   * @param {Object} options - Noise options
   * @param {number} options.seed - Seed for the noise
   * @param {number} options.scale - Scale of the noise (default 1.0)
   * @param {number} options.points - Number of feature points per cell
   */
  constructor({ seed = 1234, scale = 1.0, points = 1 } = {}) {
    this.random = new SeededRandom(seed);
    this.scale = scale;
    this.points = points;
    this.featurePoints = new Map();
  }

  /**
   * Get a value from the noise at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate (optional)
   * @returns {number} - Noise value between 0 and 1
   */
  get(x, y, z = 0) {
    // Apply scale
    x = x * this.scale;
    y = y * this.scale;
    z = z * this.scale;
    
    // Get grid cell
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    const cellZ = Math.floor(z);
    
    // Find minimum distance to a feature point
    let minDist = 2.0; // Start with a value greater than max possible distance
    
    // Check current cell and neighboring cells
    for (let offsetZ = -1; offsetZ <= 1; offsetZ++) {
      for (let offsetY = -1; offsetY <= 1; offsetY++) {
        for (let offsetX = -1; offsetX <= 1; offsetX++) {
          const neighborX = cellX + offsetX;
          const neighborY = cellY + offsetY;
          const neighborZ = cellZ + offsetZ;
          
          // Get feature points for this cell
          const cellPoints = this.getFeaturePoints(neighborX, neighborY, neighborZ);
          
          // Calculate distance to each feature point
          for (const point of cellPoints) {
            const dx = x - (neighborX + point.x);
            const dy = y - (neighborY + point.y);
            const dz = z - (neighborZ + point.z);
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            minDist = Math.min(minDist, dist);
          }
        }
      }
    }
    
    // Convert distance to a value between 0 and 1
    // Closer points are higher values
    return 1.0 - Math.min(1.0, minDist);
  }

  /**
   * Get feature points for a cell
   * @private
   * @param {number} cellX - Cell X coordinate
   * @param {number} cellY - Cell Y coordinate
   * @param {number} cellZ - Cell Z coordinate
   * @returns {Array} - Array of feature points in the cell
   */
  getFeaturePoints(cellX, cellY, cellZ) {
    const key = `${cellX},${cellY},${cellZ}`;
    
    if (!this.featurePoints.has(key)) {
      const points = [];
      
      // Use deterministic random based on cell coordinates
      this.random.seed = (cellX * 12345 + cellY * 67890 + cellZ * 54321) % 987654321;
      
      // Generate random points within the cell
      for (let i = 0; i < this.points; i++) {
        points.push({
          x: this.random.next(),
          y: this.random.next(),
          z: this.random.next()
        });
      }
      
      this.featurePoints.set(key, points);
    }
    
    return this.featurePoints.get(key);
  }
}

/**
 * Domain warping - applies one noise to warp the coordinates of another
 */
class DomainWarpingNoise {
  /**
   * Create a new domain warping noise generator
   * @param {Object} options - Noise options
   * @param {Object} options.baseNoise - The base noise to be warped
   * @param {Object} options.warpNoiseX - Noise used to warp X coordinates
   * @param {Object} options.warpNoiseY - Noise used to warp Y coordinates
   * @param {Object} options.warpNoiseZ - Noise used to warp Z coordinates
   * @param {number} options.warpStrength - How strongly to warp (default 1.0)
   */
  constructor({
    baseNoise,
    warpNoiseX,
    warpNoiseY,
    warpNoiseZ,
    warpStrength = 1.0
  }) {
    this.baseNoise = baseNoise;
    this.warpNoiseX = warpNoiseX;
    this.warpNoiseY = warpNoiseY;
    this.warpNoiseZ = warpNoiseZ;
    this.warpStrength = warpStrength;
  }

  /**
   * Get a value from the noise at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate (optional)
   * @returns {number} - Noise value
   */
  get(x, y, z = 0) {
    // Warp coordinates
    const warpX = x + this.warpNoiseX.get(x, y, z) * this.warpStrength;
    const warpY = y + this.warpNoiseY.get(x, y, z) * this.warpStrength;
    const warpZ = z + (this.warpNoiseZ ? this.warpNoiseZ.get(x, y, z) * this.warpStrength : 0);
    
    // Sample base noise with warped coordinates
    return this.baseNoise.get(warpX, warpY, warpZ);
  }
}

/**
 * Create a set of noise generators for terrain generation
 * @param {number} seed - Seed for all noise generators
 * @returns {Object} - Object containing all noise generators
 */
function createTerrainNoiseGenerators(seed = 1234) {
  return {
    // Terrain base
    heightNoise: new FBMNoise({ 
      seed, 
      octaves: 4, 
      persistence: 0.5, 
      lacunarity: 2.0, 
      scale: 0.01 
    }),
    
    // Terrain details
    detailNoise: new FBMNoise({ 
      seed: seed + 1000, 
      octaves: 2, 
      persistence: 0.5, 
      lacunarity: 2.0, 
      scale: 0.05 
    }),
    
    // Biome-specific noise
    // Plains
    flatness: new FBMNoise({ seed: seed + 2000, octaves: 2, scale: 0.02 }),
    
    // Desert
    dunes: new FBMNoise({ seed: seed + 3000, octaves: 2, scale: 0.03 }),
    redSand: new FBMNoise({ seed: seed + 3100, octaves: 2, scale: 0.2 }),
    
    // Forest
    forest: new FBMNoise({ seed: seed + 4000, octaves: 3, scale: 0.04 }),
    largeHills: new FBMNoise({ seed: seed + 4100, octaves: 2, scale: 0.015 }),
    forestDensity: new FBMNoise({ seed: seed + 4200, octaves: 3, scale: 0.1 }),
    mossy: new FBMNoise({ seed: seed + 4300, octaves: 2, scale: 0.5 }),
    
    // Mountains
    base: new FBMNoise({ seed: seed + 5000, octaves: 4, scale: 0.01 }),
    ridge: new FBMNoise({ seed: seed + 5100, octaves: 3, scale: 0.02 }),
    peak: new FBMNoise({ seed: seed + 5200, octaves: 2, scale: 0.005 }),
    steepness: new FBMNoise({ seed: seed + 5300, octaves: 2, scale: 0.03 }),
    stoneType: new FBMNoise({ seed: seed + 5400, octaves: 3, scale: 0.1 }),
    transition: new FBMNoise({ seed: seed + 5500, octaves: 2, scale: 0.2 }),
    
    // Ocean
    oceanFloor: new FBMNoise({ seed: seed + 6000, octaves: 4, scale: 0.01 }),
    oceanDetail: new FBMNoise({ seed: seed + 6100, octaves: 2, scale: 0.05 }),
    oceanTrench: new FBMNoise({ seed: seed + 6200, octaves: 2, scale: 0.002 }),
    oceanRidge: new FBMNoise({ seed: seed + 6300, octaves: 3, scale: 0.01 }),
    oceanSurface: new FBMNoise({ seed: seed + 6400, octaves: 3, scale: 0.1 }),
    oceanSubSurface: new FBMNoise({ seed: seed + 6500, octaves: 3, scale: 0.2 }),
    deepOcean: new FBMNoise({ seed: seed + 6600, octaves: 3, scale: 0.3 }),
    
    // General use
    ore: new FBMNoise({ seed: seed + 7000, octaves: 3, scale: 0.5 }),
    cave: new FBMNoise({ seed: seed + 7100, octaves: 3, scale: 0.03 }),
    vegetation: new FBMNoise({ seed: seed + 7200, octaves: 3, scale: 0.1 }),
    stone: new FBMNoise({ seed: seed + 7300, octaves: 2, scale: 0.2 }),
    coarseDirt: new FBMNoise({ seed: seed + 7400, octaves: 2, scale: 0.4 }),
    
    // Advanced noise for special features
    cellular: new WorleyNoise({ seed: seed + 8000, scale: 0.05, points: 3 })
  };
}

/**
 * Create climate parameter noise generators for biome selection
 * @param {number} seed - Seed for noise generators
 * @returns {Object} - Object containing climate noise generators
 */
function createClimateNoiseGenerators(seed = 5678) {
  return {
    temperature: new FBMNoise({ 
      seed, 
      octaves: 3, 
      persistence: 0.5, 
      lacunarity: 2.0, 
      scale: 0.005 
    }),
    
    precipitation: new FBMNoise({ 
      seed: seed + 1000, 
      octaves: 3, 
      persistence: 0.4, 
      lacunarity: 2.0, 
      scale: 0.005 
    }),
    
    continentalness: new FBMNoise({ 
      seed: seed + 2000, 
      octaves: 4, 
      persistence: 0.7, 
      lacunarity: 1.8, 
      scale: 0.002 
    }),
    
    erosion: new FBMNoise({ 
      seed: seed + 3000, 
      octaves: 2, 
      persistence: 0.5, 
      lacunarity: 2.0, 
      scale: 0.005 
    }),
    
    weirdness: new FBMNoise({ 
      seed: seed + 4000, 
      octaves: 2, 
      persistence: 0.6, 
      lacunarity: 2.0, 
      scale: 0.01 
    })
  };
}

// Export noise classes and helper functions
module.exports = {
  SeededRandom,
  InterpolatedNoise,
  FBMNoise,
  WorleyNoise,
  DomainWarpingNoise,
  createTerrainNoiseGenerators,
  createClimateNoiseGenerators
}; 