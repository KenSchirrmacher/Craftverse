/**
 * Bamboo Integration - Integrates bamboo generation into the world generator
 * Part of the 1.20 Update
 */

const { generateBamboo } = require('./bambooGeneration');

/**
 * Integrate bamboo generation into a world generator
 * @param {WorldGenerator} worldGenerator - The world generator to integrate with
 */
function integrateBambooGeneration(worldGenerator) {
  // Store the original generateStructures method
  const originalGenerateStructures = worldGenerator.generateStructures;
  
  // Override the generateStructures method to include bamboo generation
  worldGenerator.generateStructures = function(chunk, chunkX, chunkZ) {
    // Call the original method first to get original structures
    const structures = originalGenerateStructures.call(this, chunk, chunkX, chunkZ);
    
    // Get the biome for this chunk
    const biome = this.getBiomeForChunk(chunk);
    if (!biome) return structures;
    
    // Create a seeded random function for this chunk
    const random = () => {
      // Simple PRNG using the chunk coordinates and world seed
      const x = chunkX * 16;
      const z = chunkZ * 16;
      const seed = this.seed || 0;
      return ((Math.sin(x * 12.9898 + z * 78.233 + seed) * 43758.5453) % 1 + 1) / 2;
    };
    
    // Generate bamboo in this chunk if appropriate
    generateBamboo(this, chunk, biome, random);
    
    return structures;
  };
  
  // Log that bamboo generation has been integrated
  console.log('Bamboo generation integrated into world generator');
}

module.exports = { integrateBambooGeneration }; 