const assert = require('assert');
const EnhancedBiomeMethod = require('../archaeology/enhancedBiomeMethod');
const World = require('../world/world');
const BiomeRegistry = require('../biomes/biomeRegistry');

class EnhancedBiomeMethodTest {
  constructor() {
    this.world = new World();
    this.biomeRegistry = new BiomeRegistry();
    this.world.setBiomeRegistry(this.biomeRegistry);
    this.biomeMethod = new EnhancedBiomeMethod(this.world);
  }

  runTests() {
    console.log('\nRunning EnhancedBiomeMethod Tests...');
    
    this.testBasicBiomeDetection();
    this.testBiomeSampling();
    this.testEdgeCases();
    this.testBiomeTransitions();
    this.testLargeChunkCoordinates();
    this.testBiomeConsistency();
    this.testPerformance();
    
    console.log('All EnhancedBiomeMethod tests completed!');
  }

  testBasicBiomeDetection() {
    console.log('\nTesting basic biome detection...');
    
    // Test with a plains chunk
    const plainsChunk = { x: 0, z: 0 };
    const plainsBiome = this.biomeMethod.getBiomeForChunk(plainsChunk);
    assert.ok(plainsBiome, 'Should detect a biome for plains chunk');
    assert.strictEqual(plainsBiome.id, 'plains', 'Should detect plains biome');
    
    // Test with a desert chunk
    const desertChunk = { x: 100, z: 100 };
    const desertBiome = this.biomeMethod.getBiomeForChunk(desertChunk);
    assert.ok(desertBiome, 'Should detect a biome for desert chunk');
    assert.strictEqual(desertBiome.id, 'desert', 'Should detect desert biome');
  }

  testBiomeSampling() {
    console.log('\nTesting biome sampling...');
    
    // Test sampling multiple points in a chunk
    const chunk = { x: 0, z: 0 };
    const biome = this.biomeMethod.getBiomeForChunk(chunk);
    
    // Verify that the biome is consistent across the chunk
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const sampleBiome = this.world.getBiomeAt(
          chunk.x * 16 + 8 + x * 4,
          chunk.z * 16 + 8 + z * 4
        );
        assert.strictEqual(sampleBiome.id, biome.id, 
          `Biome should be consistent at offset (${x},${z})`);
      }
    }
  }

  testEdgeCases() {
    console.log('\nTesting edge cases...');
    
    // Test with null world
    const nullWorldMethod = new EnhancedBiomeMethod(null);
    const nullResult = nullWorldMethod.getBiomeForChunk({ x: 0, z: 0 });
    assert.strictEqual(nullResult, null, 'Should return null for null world');
    
    // Test with invalid chunk coordinates
    const invalidChunk = { x: 'invalid', z: 'invalid' };
    const invalidResult = this.biomeMethod.getBiomeForChunk(invalidChunk);
    assert.strictEqual(invalidResult, null, 'Should handle invalid chunk coordinates');
    
    // Test with missing chunk properties
    const missingPropsChunk = { x: 0 };
    const missingPropsResult = this.biomeMethod.getBiomeForChunk(missingPropsChunk);
    assert.strictEqual(missingPropsResult, null, 'Should handle missing chunk properties');
    
    // Test with negative chunk coordinates
    const negativeChunk = { x: -1, z: -1 };
    const negativeResult = this.biomeMethod.getBiomeForChunk(negativeChunk);
    assert.ok(negativeResult, 'Should handle negative chunk coordinates');
  }

  testBiomeTransitions() {
    console.log('\nTesting biome transitions...');
    
    // Test biome transition at chunk boundaries
    const transitionChunk = { x: 16, z: 16 };
    const transitionBiome = this.biomeMethod.getBiomeForChunk(transitionChunk);
    
    // Get biomes from adjacent chunks
    const adjacentChunks = [
      { x: 15, z: 16 },
      { x: 17, z: 16 },
      { x: 16, z: 15 },
      { x: 16, z: 17 }
    ];
    
    const adjacentBiomes = adjacentChunks.map(chunk => 
      this.biomeMethod.getBiomeForChunk(chunk)
    );
    
    // Verify that the transition chunk's biome is one of the adjacent biomes
    assert.ok(adjacentBiomes.some(biome => 
      biome && biome.id === transitionBiome.id
    ), 'Transition chunk should match one of its adjacent biomes');
  }

  testLargeChunkCoordinates() {
    console.log('\nTesting large chunk coordinates...');
    
    // Test with very large chunk coordinates
    const largeChunk = { x: 1000000, z: 1000000 };
    const largeBiome = this.biomeMethod.getBiomeForChunk(largeChunk);
    assert.ok(largeBiome, 'Should handle large chunk coordinates');
    
    // Test with maximum safe integer coordinates
    const maxSafeChunk = { x: Number.MAX_SAFE_INTEGER / 16, z: Number.MAX_SAFE_INTEGER / 16 };
    const maxSafeBiome = this.biomeMethod.getBiomeForChunk(maxSafeChunk);
    assert.ok(maxSafeBiome, 'Should handle maximum safe integer coordinates');
  }

  testBiomeConsistency() {
    console.log('\nTesting biome consistency...');
    
    // Test that repeated calls return the same biome
    const chunk = { x: 0, z: 0 };
    const biome1 = this.biomeMethod.getBiomeForChunk(chunk);
    const biome2 = this.biomeMethod.getBiomeForChunk(chunk);
    assert.strictEqual(biome1.id, biome2.id, 'Repeated calls should return the same biome');
    
    // Test that nearby chunks have consistent biomes
    const nearbyChunk = { x: 1, z: 1 };
    const nearbyBiome = this.biomeMethod.getBiomeForChunk(nearbyChunk);
    assert.ok(nearbyBiome, 'Should detect biome for nearby chunk');
  }

  testPerformance() {
    console.log('\nTesting performance...');
    
    // Test performance with multiple chunk queries
    const startTime = process.hrtime();
    
    // Query 100 chunks
    for (let x = 0; x < 10; x++) {
      for (let z = 0; z < 10; z++) {
        const biome = this.biomeMethod.getBiomeForChunk({ x, z });
        assert.ok(biome, 'Should detect biome for performance test chunk');
      }
    }
    
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds
    
    // Ensure the operation completes within a reasonable time (100ms)
    assert.ok(duration < 100, `Performance test took too long: ${duration}ms`);
  }
}

// Run the tests
const test = new EnhancedBiomeMethodTest();
test.runTests(); 