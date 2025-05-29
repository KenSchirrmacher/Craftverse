class EnhancedBiomeMethod {
  constructor(world) {
    this.world = world;
  }

  /**
   * Gets the biome for a chunk
   * @param {Chunk} chunk The chunk to get the biome for
   * @returns {Object|null} Biome object or null
   */
  getBiomeForChunk(chunk) {
    // Validate input
    if (!this.world || !this.world.getBiomeAt) return null;
    if (!chunk || typeof chunk !== 'object') return null;
    if (typeof chunk.x !== 'number' || typeof chunk.z !== 'number') return null;
    
    // Handle large coordinates by wrapping them
    const wrapCoordinate = (coord) => {
      const maxSafe = Number.MAX_SAFE_INTEGER / 16;
      if (Math.abs(coord) > maxSafe) {
        return coord % maxSafe;
      }
      return coord;
    };
    
    const wrappedX = wrapCoordinate(chunk.x);
    const wrappedZ = wrapCoordinate(chunk.z);
    
    // Sample the biome at multiple points in the chunk for better accuracy
    const centerX = wrappedX * 16 + 8;
    const centerZ = wrappedZ * 16 + 8;
    
    // Sample points in a 3x3 grid within the chunk
    const samples = [];
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        try {
          const biome = this.world.getBiomeAt(centerX + x * 4, centerZ + z * 4);
          if (biome && biome.id) samples.push(biome);
        } catch (error) {
          console.warn(`Error sampling biome at (${centerX + x * 4}, ${centerZ + z * 4}):`, error);
        }
      }
    }
    
    // Return the most common biome, or null if no samples
    if (samples.length === 0) return null;
    
    const counts = {};
    let maxCount = 0;
    let mostCommon = null;
    
    for (const biome of samples) {
      counts[biome.id] = (counts[biome.id] || 0) + 1;
      if (counts[biome.id] > maxCount) {
        maxCount = counts[biome.id];
        mostCommon = biome;
      }
    }
    
    return mostCommon;
  }
}

module.exports = EnhancedBiomeMethod; 