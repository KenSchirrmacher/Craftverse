/**
 * Get the biome for a chunk with multiple sample points for accuracy
 * @private
 * @param {Object} chunk - Chunk data
 * @returns {Object|null} Biome object or null
 */
getBiomeForChunk(chunk) {
  if (!this.world || !this.world.getBiomeAt) return null;
  
  // Sample the biome at multiple points in the chunk for better accuracy
  const samplePoints = [
    { x: (chunk.x * 16) + 4, z: (chunk.z * 16) + 4 },
    { x: (chunk.x * 16) + 12, z: (chunk.z * 16) + 4 },
    { x: (chunk.x * 16) + 4, z: (chunk.z * 16) + 12 },
    { x: (chunk.x * 16) + 12, z: (chunk.z * 16) + 12 },
    { x: (chunk.x * 16) + 8, z: (chunk.z * 16) + 8 } // Center point
  ];
  
  // Count occurrences of each biome
  const biomeCounts = new Map();
  let mostCommonBiome = null;
  
  for (const point of samplePoints) {
    const biome = this.world.getBiomeAt(point.x, point.z);
    if (!biome) continue;
    
    // If no biomes found yet, use the first one
    if (!mostCommonBiome) {
      mostCommonBiome = biome;
    }
    
    // Count this biome
    const count = biomeCounts.get(biome.id) || 0;
    biomeCounts.set(biome.id, count + 1);
  }
  
  // Find the most common biome
  let highestCount = 0;
  
  for (const [biomeId, count] of biomeCounts.entries()) {
    if (count > highestCount) {
      // Find a sample that matches this biome ID
      for (const point of samplePoints) {
        const biome = this.world.getBiomeAt(point.x, point.z);
        if (biome && biome.id === biomeId) {
          mostCommonBiome = biome;
          break;
        }
      }
      highestCount = count;
    }
  }
  
  return mostCommonBiome;
} 