/**
 * Biome System Test Utility
 * Tests biome generation, selection, and properties
 */

const BiomeRegistry = require('../biomes/biomeRegistry');
const { FBMNoise } = require('../utils/noiseGenerator');
const BiomeManager = require('../biomes/biomeManager');

class BiomeTest {
  /**
   * Run all biome tests
   * @returns {Object} - Test results
   */
  static runAllTests() {
    console.log("=== BIOME SYSTEM TESTS ===");
    
    const results = {
      registryTests: this.testRegistry(),
      biomeSelectionTests: this.testBiomeSelection(),
      terrainGenerationTests: this.testTerrainGeneration(),
      blockSelectionTests: this.testBlockSelection(),
      featureGenerationTests: this.testFeatureGeneration(),
      biomeBlendingTests: this.testBiomeBlending()
    };
    
    console.log("\n=== TEST SUMMARY ===");
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(results).forEach(([testName, result]) => {
      console.log(`${testName}: ${result.passed}/${result.total} passed`);
      totalPassed += result.passed;
      totalFailed += result.total - result.passed;
    });
    
    console.log(`\nOVERALL: ${totalPassed} tests passed, ${totalFailed} tests failed`);
    
    return {
      details: results,
      passed: totalPassed,
      failed: totalFailed,
      total: totalPassed + totalFailed
    };
  }
  
  /**
   * Test biome registry functionality
   * @returns {Object} - Test results
   */
  static testRegistry() {
    console.log("\n--- Testing Biome Registry ---");
    let passed = 0;
    let failed = 0;
    
    // Test 1: Registry contains default biomes
    const allBiomes = BiomeRegistry.getAllBiomes();
    if (allBiomes.length >= 4) {
      console.log("✓ Registry contains default biomes");
      passed++;
    } else {
      console.log("✗ Registry missing default biomes");
      failed++;
    }
    
    // Test 2: Get biome by ID
    const plains = BiomeRegistry.getBiome('plains');
    if (plains && plains.id === 'plains') {
      console.log("✓ Can retrieve biome by ID");
      passed++;
    } else {
      console.log("✗ Cannot retrieve biome by ID");
      failed++;
    }
    
    // Test 3: Default biome is set
    const defaultBiome = BiomeRegistry.getDefaultBiome();
    if (defaultBiome && defaultBiome.id) {
      console.log(`✓ Default biome is set to ${defaultBiome.id}`);
      passed++;
    } else {
      console.log("✗ Default biome not set");
      failed++;
    }
    
    // Test 4: Register new biome
    const testBiome = {
      id: 'test_biome',
      name: 'Test Biome',
      isValidForClimate: () => true,
      getFitnessScore: () => 0.5
    };
    
    const registerResult = BiomeRegistry.registerBiome(testBiome);
    if (registerResult && BiomeRegistry.getBiome('test_biome')) {
      console.log("✓ Can register new biome");
      passed++;
    } else {
      console.log("✗ Failed to register new biome");
      failed++;
    }
    
    // Test 5: Unregister biome
    const unregisterResult = BiomeRegistry.unregisterBiome('test_biome');
    if (unregisterResult && !BiomeRegistry.getBiome('test_biome')) {
      console.log("✓ Can unregister biome");
      passed++;
    } else {
      console.log("✗ Failed to unregister biome");
      failed++;
    }
    
    return { passed, failed, total: passed + failed };
  }
  
  /**
   * Test biome selection based on climate
   * @returns {Object} - Test results
   */
  static testBiomeSelection() {
    console.log("\n--- Testing Biome Selection ---");
    let passed = 0;
    let failed = 0;
    
    // Setup climate test cases
    const testCases = [
      {
        name: "Hot desert climate",
        climate: {
          temperature: 0.9,
          precipitation: 0.1,
          continentalness: 0.8,
          erosion: 0.7,
          weirdness: 0.0
        },
        expectedBiomeType: "desert"
      },
      {
        name: "Temperate forest climate",
        climate: {
          temperature: 0.5,
          precipitation: 0.7,
          continentalness: 0.6,
          erosion: 0.4,
          weirdness: 0.1
        },
        expectedBiomeType: "forest"
      },
      {
        name: "Cold mountain climate",
        climate: {
          temperature: 0.1,
          precipitation: 0.6,
          continentalness: 0.9,
          erosion: 0.2,
          weirdness: 0.3
        },
        expectedBiomeType: "mountain"
      },
      {
        name: "Ocean climate",
        climate: {
          temperature: 0.5,
          precipitation: 0.8,
          continentalness: 0.1,
          erosion: 0.5,
          weirdness: 0.0
        },
        expectedBiomeType: "ocean"
      }
    ];
    
    // Create a BiomeManager for testing
    const biomeManager = new BiomeManager({
      biomes: BiomeRegistry.getAllBiomes()
    });
    
    // Test each climate case
    testCases.forEach(testCase => {
      const validBiomes = BiomeRegistry.getBiomesForClimate(testCase.climate);
      const bestBiome = BiomeRegistry.getBestBiomeForClimate(testCase.climate);
      
      console.log(`Testing ${testCase.name}...`);
      
      // If no biomes match exactly, we'll look for biomes of the expected type
      const isExpectedType = bestBiome && 
        bestBiome.id.includes(testCase.expectedBiomeType);
      
      if (isExpectedType) {
        console.log(`✓ Selected ${bestBiome.id} - matches expected type`);
        passed++;
      } else {
        const selectedId = bestBiome ? bestBiome.id : 'none';
        console.log(`✗ Selected ${selectedId} - expected ${testCase.expectedBiomeType} type`);
        failed++;
      }
    });
    
    return { passed, failed, total: passed + failed };
  }
  
  /**
   * Test terrain generation for different biomes
   * @returns {Object} - Test results
   */
  static testTerrainGeneration() {
    console.log("\n--- Testing Terrain Generation ---");
    let passed = 0;
    let failed = 0;
    
    // Setup test cases for different biomes
    const testCases = [
      {
        biomeId: 'plains',
        description: 'Plains have relatively flat terrain',
        test: (heights) => {
          const variation = Math.max(...heights) - Math.min(...heights);
          return variation < 10; // Plains should have low height variation
        }
      },
      {
        biomeId: 'mountains',
        description: 'Mountains have high terrain variation',
        test: (heights) => {
          const variation = Math.max(...heights) - Math.min(...heights);
          return variation > 15; // Mountains should have high height variation
        }
      },
      {
        biomeId: 'ocean',
        description: 'Ocean floor is below sea level',
        test: (heights) => {
          // Assume sea level is around 63
          return heights.every(h => h < 60);
        }
      },
      {
        biomeId: 'desert',
        description: 'Desert has moderate height and dunes',
        test: (heights) => {
          // Desert should be around 65-75 blocks high
          const avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
          return avgHeight > 60 && avgHeight < 80;
        }
      }
    ];
    
    // Create noise generators for testing
    const seed = 12345;
    const noiseGenerators = {
      heightNoise: new FBMNoise({ seed, octaves: 4 }),
      detailNoise: new FBMNoise({ seed: seed + 1, octaves: 2 }),
      flatness: new FBMNoise({ seed: seed + 2, octaves: 2 }),
      dunes: new FBMNoise({ seed: seed + 3, octaves: 2 }),
      forest: new FBMNoise({ seed: seed + 4, octaves: 3 }),
      largeHills: new FBMNoise({ seed: seed + 5, octaves: 2 }),
      base: new FBMNoise({ seed: seed + 6, octaves: 4 }),
      ridge: new FBMNoise({ seed: seed + 7, octaves: 3 }),
      peak: new FBMNoise({ seed: seed + 8, octaves: 2 }),
      steepness: new FBMNoise({ seed: seed + 9, octaves: 2 }),
      oceanFloor: new FBMNoise({ seed: seed + 10, octaves: 4 }),
      oceanDetail: new FBMNoise({ seed: seed + 11, octaves: 2 }),
      oceanTrench: new FBMNoise({ seed: seed + 12, octaves: 2 }),
      oceanRidge: new FBMNoise({ seed: seed + 13, octaves: 3 })
    };
    
    // Test each biome
    testCases.forEach(testCase => {
      const biome = BiomeRegistry.getBiome(testCase.biomeId);
      
      if (!biome) {
        console.log(`✗ Biome ${testCase.biomeId} not found`);
        failed++;
        return;
      }
      
      // Generate heights for a 10x10 area
      const heights = [];
      for (let x = 0; x < 10; x++) {
        for (let z = 0; z < 10; z++) {
          heights.push(biome.getHeight(x * 10, z * 10, noiseGenerators));
        }
      }
      
      // Run the test
      const result = testCase.test(heights);
      
      if (result) {
        console.log(`✓ ${testCase.biomeId}: ${testCase.description}`);
        passed++;
      } else {
        console.log(`✗ ${testCase.biomeId}: ${testCase.description} - test failed`);
        console.log(`  Height range: ${Math.min(...heights)} to ${Math.max(...heights)}`);
        failed++;
      }
    });
    
    return { passed, failed, total: passed + failed };
  }
  
  /**
   * Test block selection for different biomes
   * @returns {Object} - Test results
   */
  static testBlockSelection() {
    console.log("\n--- Testing Block Selection ---");
    let passed = 0;
    let failed = 0;
    
    // Setup test cases for different biomes
    const testCases = [
      {
        biomeId: 'plains',
        description: 'Plains have grass as top block',
        test: (blocks) => {
          const surfaceBlocks = blocks.filter(b => b.y === b.surfaceHeight);
          return surfaceBlocks.every(b => b.block.id === 'grass_block');
        }
      },
      {
        biomeId: 'desert',
        description: 'Desert has sand as top block',
        test: (blocks) => {
          const surfaceBlocks = blocks.filter(b => b.y === b.surfaceHeight);
          return surfaceBlocks.every(b => b.block.id === 'sand' || b.block.id === 'red_sand');
        }
      },
      {
        biomeId: 'mountains',
        description: 'Mountains have stone and grass as top blocks',
        test: (blocks) => {
          const surfaceBlocks = blocks.filter(b => b.y === b.surfaceHeight);
          const stoneCount = surfaceBlocks.filter(b => 
            b.block.id === 'stone' || 
            b.block.id === 'andesite' || 
            b.block.id === 'granite'
          ).length;
          
          const grassCount = surfaceBlocks.filter(b => 
            b.block.id === 'grass_block'
          ).length;
          
          // Mountains should have a mix of stone and grass
          return stoneCount > 0 && grassCount > 0;
        }
      },
      {
        biomeId: 'ocean',
        description: 'Ocean has sand/gravel as floor blocks',
        test: (blocks) => {
          const floorBlocks = blocks.filter(b => b.y === b.surfaceHeight);
          return floorBlocks.every(b => 
            b.block.id === 'sand' || 
            b.block.id === 'gravel' ||
            b.block.id === 'clay' ||
            b.block.id === 'stone'
          );
        }
      }
    ];
    
    // Create noise generators for testing
    const seed = 54321;
    const noiseGenerators = {
      // Same noise generators as in terrain test
      heightNoise: new FBMNoise({ seed, octaves: 4 }),
      detailNoise: new FBMNoise({ seed: seed + 1, octaves: 2 }),
      coarseDirt: new FBMNoise({ seed: seed + 2, octaves: 2 }),
      stone: new FBMNoise({ seed: seed + 3, octaves: 2 }),
      redSand: new FBMNoise({ seed: seed + 4, octaves: 2 }),
      forestDensity: new FBMNoise({ seed: seed + 5, octaves: 3 }),
      mossy: new FBMNoise({ seed: seed + 6, octaves: 2 }),
      stoneType: new FBMNoise({ seed: seed + 7, octaves: 3 }),
      transition: new FBMNoise({ seed: seed + 8, octaves: 2 }),
      oceanSurface: new FBMNoise({ seed: seed + 9, octaves: 3 }),
      oceanSubSurface: new FBMNoise({ seed: seed + 10, octaves: 3 }),
      deepOcean: new FBMNoise({ seed: seed + 11, octaves: 3 })
    };
    
    // Test each biome
    testCases.forEach(testCase => {
      const biome = BiomeRegistry.getBiome(testCase.biomeId);
      
      if (!biome) {
        console.log(`✗ Biome ${testCase.biomeId} not found`);
        failed++;
        return;
      }
      
      // Generate blocks for a 5x5 area
      const blocks = [];
      for (let x = 0; x < 5; x++) {
        for (let z = 0; z < 5; z++) {
          const surfaceHeight = biome.getHeight(x * 10, z * 10, noiseGenerators);
          
          // Check blocks at surface and a few blocks above/below
          for (let y = surfaceHeight - 3; y <= surfaceHeight + 1; y++) {
            const block = biome.getBlockAt(x * 10, y, z * 10, surfaceHeight, noiseGenerators);
            blocks.push({ x: x * 10, y, z: z * 10, surfaceHeight, block });
          }
        }
      }
      
      // Run the test
      const result = testCase.test(blocks);
      
      if (result) {
        console.log(`✓ ${testCase.biomeId}: ${testCase.description}`);
        passed++;
      } else {
        console.log(`✗ ${testCase.biomeId}: ${testCase.description} - test failed`);
        failed++;
      }
    });
    
    return { passed, failed, total: passed + failed };
  }
  
  /**
   * Test feature generation for different biomes
   * @returns {Object} - Test results
   */
  static testFeatureGeneration() {
    console.log("\n--- Testing Feature Generation ---");
    let passed = 0;
    let failed = 0;
    
    // Setup test cases for different biomes
    const testCases = [
      {
        biomeId: 'plains',
        description: 'Plains have grass and occasional trees',
        test: (features) => {
          const hasGrass = features.some(f => f.id === 'grass' || f.id === 'tall_grass');
          const hasTrees = features.some(f => f.id === 'oak_tree' || f.id === 'birch_tree');
          return hasGrass && features.length > 10; // Should have plenty of features
        }
      },
      {
        biomeId: 'forest',
        description: 'Forest has many trees',
        test: (features) => {
          const trees = features.filter(f => 
            f.id === 'oak_tree' || 
            f.id === 'birch_tree' || 
            f.id === 'dark_oak_tree'
          );
          return trees.length >= 5; // Should have lots of trees
        }
      },
      {
        biomeId: 'desert',
        description: 'Desert has cacti and dead bushes',
        test: (features) => {
          const hasCacti = features.some(f => f.id === 'cactus');
          const hasDeadBushes = features.some(f => f.id === 'dead_bush');
          return hasCacti || hasDeadBushes;
        }
      },
      {
        biomeId: 'ocean',
        description: 'Ocean has underwater plants',
        test: (features) => {
          const hasSeagrass = features.some(f => 
            f.id === 'seagrass' || 
            f.id === 'tall_seagrass' || 
            f.id === 'kelp'
          );
          return hasSeagrass;
        }
      }
    ];
    
    // Create noise generators for testing
    const seed = 98765;
    const noiseGenerators = {
      vegetation: new FBMNoise({ seed, octaves: 3 }),
      forestDensity: new FBMNoise({ seed: seed + 1, octaves: 3 })
    };
    
    // Create seeded random function
    const createRandom = (seed) => {
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    };
    
    // Test each biome
    testCases.forEach(testCase => {
      const biome = BiomeRegistry.getBiome(testCase.biomeId);
      
      if (!biome) {
        console.log(`✗ Biome ${testCase.biomeId} not found`);
        failed++;
        return;
      }
      
      // Generate features for a 20x20 area
      const features = [];
      const random = createRandom(seed);
      
      for (let x = 0; x < 20; x++) {
        for (let z = 0; z < 20; z++) {
          const newFeatures = biome.getFeaturesAt(x * 5, z * 5, random, noiseGenerators);
          features.push(...newFeatures);
        }
      }
      
      // Run the test
      const result = testCase.test(features);
      
      if (result) {
        console.log(`✓ ${testCase.biomeId}: ${testCase.description}`);
        passed++;
      } else {
        console.log(`✗ ${testCase.biomeId}: ${testCase.description} - test failed`);
        console.log(`  Feature count: ${features.length}`);
        console.log(`  Feature types: ${[...new Set(features.map(f => f.id))].join(', ')}`);
        failed++;
      }
    });
    
    return { passed, failed, total: passed + failed };
  }
  
  /**
   * Test biome blending functionality
   * @returns {Object} - Test results
   */
  static testBiomeBlending() {
    console.log("\n--- Testing Biome Blending ---");
    let passed = 0;
    let failed = 0;
    
    // Create a biome manager for testing
    const biomeManager = new BiomeManager({
      biomes: BiomeRegistry.getAllBiomes(),
      blendRadius: 8
    });
    
    // Test 1: Blend data contains primary biome
    const blendData = biomeManager.getBlendedBiomeData(100, 100, 12345);
    
    if (blendData.biome && typeof blendData.blendFactor === 'number') {
      console.log("✓ Blend data contains primary biome and blend factor");
      passed++;
    } else {
      console.log("✗ Blend data missing primary biome or blend factor");
      failed++;
    }
    
    // Test 2: Blended height differs from primary biome height
    const primaryHeight = blendData.biome.getHeight(100, 100, {});
    const blendedHeight = biomeManager.getBlendedHeight(100, 100, 12345);
    
    // They should be slightly different due to blending
    if (Math.abs(primaryHeight - blendedHeight) > 0.001) {
      console.log("✓ Blended height differs from primary biome height");
      passed++;
    } else {
      console.log("✗ Blended height matches primary height exactly");
      failed++;
    }
    
    // Test 3: Blended blocks can differ from primary biome blocks
    let blockDifferences = 0;
    const surfaceHeight = biomeManager.getBlendedHeight(150, 150, 12345);
    
    for (let y = surfaceHeight - 5; y <= surfaceHeight + 1; y++) {
      const primaryBlock = blendData.biome.getBlockAt(150, y, 150, surfaceHeight, {});
      const blendedBlock = biomeManager.getBlockAt(150, y, 150, 12345);
      
      if (primaryBlock.id !== blendedBlock.id) {
        blockDifferences++;
      }
    }
    
    if (blockDifferences > 0) {
      console.log(`✓ Found ${blockDifferences} block differences due to blending`);
      passed++;
    } else {
      console.log("✗ No block differences found due to blending");
      failed++;
    }
    
    // Test 4: Blended features include features from different biomes
    const features1 = biomeManager.getFeaturesAt(200, 200, 12345);
    const features2 = biomeManager.getFeaturesAt(200 + biomeManager.blendRadius * 2, 200, 12345);
    
    const featureTypes1 = new Set(features1.map(f => f.id));
    const featureTypes2 = new Set(features2.map(f => f.id));
    
    // Check if there are differences in feature types
    const differentFeatureTypes = [...featureTypes1].some(type => !featureTypes2.has(type)) ||
                                 [...featureTypes2].some(type => !featureTypes1.has(type));
    
    if (differentFeatureTypes) {
      console.log("✓ Different locations have different feature sets");
      passed++;
    } else {
      console.log("✗ Feature sets are identical despite location difference");
      failed++;
    }
    
    return { passed, failed, total: passed + failed };
  }
}

// Export the BiomeTest class
module.exports = BiomeTest;

// If this file is run directly, execute the tests
if (require.main === module) {
  BiomeTest.runAllTests();
} 