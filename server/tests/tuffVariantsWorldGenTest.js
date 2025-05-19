/**
 * Tests for Tuff Variants World Generation
 * Verifies the world generation functionality of tuff variants
 */

const assert = require('assert');
const World = require('../world/world');
const BiomeRegistry = require('../world/biomeRegistry');

class TuffVariantsWorldGenTest {
  constructor() {
    this.world = new World();
    this.biomeRegistry = new BiomeRegistry();
  }

  runTests() {
    this.testTuffVariantsInBiomes();
    this.testTuffVariantsInStructures();
    this.testTuffVariantsInCaves();
  }

  testTuffVariantsInBiomes() {
    console.log('Testing Tuff Variants in Biomes...');
    
    // Test tuff variants in mountain biomes
    const mountainBiome = this.biomeRegistry.getBiome('mountain');
    const blocks = this.countBlocksInBiome(mountainBiome, ['tuff', 'chiseled_tuff', 'tuff_bricks']);
    assert.strictEqual(blocks > 0, true, 'Mountain biome should contain tuff variants');

    // Test tuff variants in cave biomes
    const caveBiome = this.biomeRegistry.getBiome('cave');
    const caveBlocks = this.countBlocksInBiome(caveBiome, ['tuff', 'chiseled_tuff', 'tuff_bricks']);
    assert.strictEqual(caveBlocks > 0, true, 'Cave biome should contain tuff variants');
  }

  testTuffVariantsInStructures() {
    console.log('Testing Tuff Variants in Structures...');
    
    // Test tuff variants in ancient cities
    const ancientCity = this.world.getStructure('ancient_city');
    const blocks = this.countBlocksInStructure(ancientCity, ['tuff_bricks', 'tuff_brick_stairs', 'tuff_brick_wall']);
    assert.strictEqual(blocks > 0, true, 'Ancient cities should contain tuff variants');

    // Test tuff variants in strongholds
    const stronghold = this.world.getStructure('stronghold');
    const strongholdBlocks = this.countBlocksInStructure(stronghold, ['tuff_bricks', 'tuff_brick_stairs', 'tuff_brick_wall']);
    assert.strictEqual(strongholdBlocks > 0, true, 'Strongholds should contain tuff variants');
  }

  testTuffVariantsInCaves() {
    console.log('Testing Tuff Variants in Caves...');
    
    // Test tuff variants in deep caves
    const deepCave = this.world.getStructure('deep_cave');
    const blocks = this.countBlocksInStructure(deepCave, ['tuff', 'chiseled_tuff', 'tuff_bricks']);
    assert.strictEqual(blocks > 0, true, 'Deep caves should contain tuff variants');

    // Test tuff variants in cave systems
    const caveSystem = this.world.getStructure('cave_system');
    const caveBlocks = this.countBlocksInStructure(caveSystem, ['tuff', 'chiseled_tuff', 'tuff_bricks']);
    assert.strictEqual(caveBlocks > 0, true, 'Cave systems should contain tuff variants');
  }

  countBlocksInBiome(biome, blockTypes) {
    let count = 0;
    const chunkSize = 16;
    const biomeSize = 256;
    
    for (let x = 0; x < biomeSize; x += chunkSize) {
      for (let z = 0; z < biomeSize; z += chunkSize) {
        const chunk = this.world.getChunkAt(x, z);
        if (chunk && chunk.biome === biome.id) {
          for (let bx = 0; bx < chunkSize; bx++) {
            for (let by = 0; by < 256; by++) {
              for (let bz = 0; bz < chunkSize; bz++) {
                const block = chunk.getBlock(bx, by, bz);
                if (block && blockTypes.includes(block.id)) {
                  count++;
                }
              }
            }
          }
        }
      }
    }
    return count;
  }

  countBlocksInStructure(structure, blockTypes) {
    let count = 0;
    const bounds = structure.getBounds();
    
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      for (let y = bounds.minY; y <= bounds.maxY; y++) {
        for (let z = bounds.minZ; z <= bounds.maxZ; z++) {
          const block = this.world.getBlockAt(x, y, z);
          if (block && blockTypes.includes(block.id)) {
            count++;
          }
        }
      }
    }
    return count;
  }
}

module.exports = TuffVariantsWorldGenTest; 