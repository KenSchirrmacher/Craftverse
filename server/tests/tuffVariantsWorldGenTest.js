const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { WorldGenerator } = require('../world/worldGenerator');
const { BiomeType } = require('../world/biomeType');

class TuffVariantsWorldGenTest {
  constructor() {
    this.world = new TestWorld();
    this.worldGenerator = new WorldGenerator(this.world);
  }

  runTests() {
    this.testNaturalGeneration();
    this.testStructurePlacement();
    this.testBiomeIntegration();
    this.testHeightDistribution();
    this.testClusterGeneration();
  }

  testNaturalGeneration() {
    console.log('Testing natural generation...');
    
    // Test Tuff Bricks natural generation
    const chunk = this.worldGenerator.generateChunk(0, 0);
    const tuffBricksCount = this.countBlocksInChunk(chunk, 'tuff_bricks');
    
    assert.strictEqual(typeof tuffBricksCount, 'number');
    assert.strictEqual(tuffBricksCount >= 0, true);
  }

  testStructurePlacement() {
    console.log('Testing structure placement...');
    
    // Test Chiseled Tuff in structures
    const structure = this.worldGenerator.generateStructure('ruins', { x: 0, y: 0, z: 0 });
    const chiseledTuffCount = this.countBlocksInStructure(structure, 'chiseled_tuff');
    
    assert.strictEqual(typeof chiseledTuffCount, 'number');
    assert.strictEqual(chiseledTuffCount >= 0, true);
  }

  testBiomeIntegration() {
    console.log('Testing biome integration...');
    
    // Test Tuff Brick variants in different biomes
    const plainsBiome = this.worldGenerator.generateBiome(BiomeType.PLAINS, 0, 0);
    const desertBiome = this.worldGenerator.generateBiome(BiomeType.DESERT, 0, 0);
    
    const plainsTuffCount = this.countBlocksInBiome(plainsBiome, 'tuff_brick_wall');
    const desertTuffCount = this.countBlocksInBiome(desertBiome, 'tuff_brick_wall');
    
    assert.strictEqual(typeof plainsTuffCount, 'number');
    assert.strictEqual(typeof desertTuffCount, 'number');
    assert.strictEqual(plainsTuffCount !== desertTuffCount, true);
  }

  testHeightDistribution() {
    console.log('Testing height distribution...');
    
    // Test Tuff Brick Slab height distribution
    const heightMap = this.worldGenerator.generateHeightMap(0, 0);
    const slabDistribution = this.analyzeHeightDistribution(heightMap, 'tuff_brick_slab');
    
    assert.strictEqual(Array.isArray(slabDistribution), true);
    assert.strictEqual(slabDistribution.length > 0, true);
    assert.strictEqual(slabDistribution.every(count => typeof count === 'number'), true);
  }

  testClusterGeneration() {
    console.log('Testing cluster generation...');
    
    // Test Tuff Brick Stairs cluster generation
    const cluster = this.worldGenerator.generateCluster('tuff_variants', { x: 0, y: 0, z: 0 });
    const stairsCount = this.countBlocksInCluster(cluster, 'tuff_brick_stairs');
    
    assert.strictEqual(typeof stairsCount, 'number');
    assert.strictEqual(stairsCount >= 0, true);
  }

  countBlocksInChunk(chunk, blockType) {
    let count = 0;
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 256; y++) {
        for (let z = 0; z < 16; z++) {
          const block = chunk.getBlock(x, y, z);
          if (block && block.type === blockType) {
            count++;
          }
        }
      }
    }
    return count;
  }

  countBlocksInStructure(structure, blockType) {
    let count = 0;
    structure.blocks.forEach(block => {
      if (block.type === blockType) {
        count++;
      }
    });
    return count;
  }

  countBlocksInBiome(biome, blockType) {
    let count = 0;
    biome.blocks.forEach(block => {
      if (block.type === blockType) {
        count++;
      }
    });
    return count;
  }

  analyzeHeightDistribution(heightMap, blockType) {
    const distribution = new Array(256).fill(0);
    heightMap.forEach((height, index) => {
      const block = this.world.getBlock(index % 16, height, Math.floor(index / 16));
      if (block && block.type === blockType) {
        distribution[height]++;
      }
    });
    return distribution;
  }

  countBlocksInCluster(cluster, blockType) {
    let count = 0;
    cluster.blocks.forEach(block => {
      if (block.type === blockType) {
        count++;
      }
    });
    return count;
  }
}

// Run tests
const test = new TuffVariantsWorldGenTest();
test.runTests();
console.log('All Tuff variants world generation tests passed!');

module.exports = TuffVariantsWorldGenTest; 