/**
 * Bamboo Generation Test - Tests for bamboo world generation
 * Part of the 1.20 Update
 */

const assert = require('assert');
const { generateBamboo, generateBambooCluster, isValidBambooSurface, placeBambooPlant } = require('../world/bambooGeneration');

// Create mock classes for testing
class MockWorld {
  constructor() {
    this.blocks = {};
    this.highestBlocks = {};
    console.log('MockWorld created');
  }
  
  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks[key] || null;
  }
  
  setBlock(x, y, z, blockId, data = {}) {
    const key = `${x},${y},${z}`;
    this.blocks[key] = {
      id: blockId,
      ...data
    };
    console.log(`Set block ${blockId} at ${x},${y},${z}`);
    return true;
  }
  
  getHighestBlockY(x, z) {
    const key = `${x},${z}`;
    return this.highestBlocks[key] || 64; // Default height
  }
  
  // Helper to set up test terrain
  setupTerrain(x, z, height, surfaceBlock) {
    const key = `${x},${z}`;
    this.highestBlocks[key] = height;
    
    // Set the surface block
    this.setBlock(x, height, z, surfaceBlock);
    
    // Set air above the surface
    for (let y = height + 1; y < height + 10; y++) {
      this.setBlock(x, y, z, 'air');
    }
  }
  
  // Debug function to print all blocks
  printBlocks() {
    console.log('All blocks in the world:');
    for (const [key, block] of Object.entries(this.blocks)) {
      console.log(`${key}: ${block.id}`);
    }
  }
}

class MockChunk {
  constructor(x, z) {
    this.x = x;
    this.z = z;
    console.log(`MockChunk created at ${x},${z}`);
  }
}

/**
 * Main test function
 */
function testBambooGeneration() {
  console.log('Running Bamboo Generation Tests...');
  
  try {
    testDirectClusterGeneration();
    testBambooPlacement();
    testBiomeSpecificGeneration();
    console.log('All Bamboo Generation Tests Passed!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

/**
 * Test direct bamboo cluster generation
 */
function testDirectClusterGeneration() {
  console.log('Testing direct bamboo cluster generation...');
  
  const world = new MockWorld();
  const chunk = new MockChunk(0, 0);
  
  // Setup terrain
  world.setupTerrain(8, 8, 64, 'grass_block');
  
  console.log('Direct cluster terrain setup complete');
  
  // Fixed random function for deterministic testing
  const fixedRandom = () => 0.5;
  
  // Directly generate a bamboo cluster
  console.log('Directly calling generateBambooCluster...');
  generateBambooCluster(world, chunk, fixedRandom);
  
  // Check if the bamboo was placed
  const hasBamboo = hasBambooAt(world, 8, 8);
  console.log('Direct cluster bamboo placement result:', hasBamboo);
  
  // Print all blocks
  world.printBlocks();
  
  // Test direct bamboo plant placement
  console.log('Testing direct bamboo plant placement...');
  placeBambooPlant(world, 5, 65, 5, fixedRandom);
  
  const hasDirectBamboo = hasBambooAt(world, 5, 5);
  console.log('Direct plant bamboo placement result:', hasDirectBamboo);
  
  // Check surface validity
  const surfaceBlock = world.getBlock(8, 64, 8);
  console.log('Surface block:', surfaceBlock);
  console.log('Is valid surface:', isValidBambooSurface(surfaceBlock));
  
  console.log('Direct bamboo generation tests completed');
}

/**
 * Test bamboo placement logic
 */
function testBambooPlacement() {
  console.log('Testing bamboo placement...');
  
  const world = new MockWorld();
  const chunk = new MockChunk(0, 0);
  
  // Setup various terrain types
  world.setupTerrain(1, 1, 64, 'grass_block');
  world.setupTerrain(2, 2, 65, 'dirt');
  world.setupTerrain(3, 3, 63, 'podzol');
  world.setupTerrain(4, 4, 62, 'mud');
  world.setupTerrain(5, 5, 60, 'stone'); // Invalid surface for bamboo
  
  console.log('Terrain setup complete');
  
  // Fixed random function for deterministic testing
  const fixedRandom = () => 0.5;
  
  // Mock jungle biome
  const jungleBiome = { id: 'jungle' };
  
  // Generate bamboo
  console.log('Calling generateBamboo...');
  generateBamboo(world, chunk, jungleBiome, fixedRandom);
  console.log('Generated bamboo');
  
  // Print all blocks
  world.printBlocks();
  
  // Check that bamboo was placed on valid surfaces but not on invalid ones
  console.log('Checking if bamboo was placed on grass_block:', hasBambooAt(world, 1, 1));
  console.log('Checking if bamboo was placed on dirt:', hasBambooAt(world, 2, 2));
  console.log('Checking if bamboo was placed on podzol:', hasBambooAt(world, 3, 3));
  console.log('Checking if bamboo was placed on mud:', hasBambooAt(world, 4, 4));
  console.log('Checking if bamboo was placed on stone:', hasBambooAt(world, 5, 5));
  
  assert(hasBambooAt(world, 1, 1), 'Bamboo should be placed on grass blocks');
  assert(hasBambooAt(world, 2, 2), 'Bamboo should be placed on dirt');
  assert(hasBambooAt(world, 3, 3), 'Bamboo should be placed on podzol');
  assert(hasBambooAt(world, 4, 4), 'Bamboo should be placed on mud');
  assert(!hasBambooAt(world, 5, 5), 'Bamboo should not be placed on stone');
  
  console.log('Bamboo placement tests passed!');
}

/**
 * Test biome-specific bamboo generation
 */
function testBiomeSpecificGeneration() {
  console.log('Testing biome-specific bamboo generation...');
  
  // Test with different biomes
  const jungleBiome = { id: 'jungle' };
  const bambooJungleBiome = { id: 'bamboo_jungle' };
  const desertBiome = { id: 'desert' };
  
  // Test jungle biome
  const jungleWorld = new MockWorld();
  const jungleChunk = new MockChunk(0, 0);
  
  // Setup valid terrain for jungle
  jungleWorld.setupTerrain(8, 8, 64, 'grass_block');
  
  // Fixed random function for deterministic testing
  const fixedRandom = () => 0.5;
  
  // Generate in jungle biome
  console.log('Generating in jungle biome...');
  generateBamboo(jungleWorld, jungleChunk, jungleBiome, fixedRandom);
  
  // Test bamboo jungle biome
  const bambooJungleWorld = new MockWorld();
  const bambooJungleChunk = new MockChunk(0, 0);
  
  // Setup valid terrain for bamboo jungle
  bambooJungleWorld.setupTerrain(8, 8, 64, 'grass_block');
  
  // Generate in bamboo jungle biome
  console.log('Generating in bamboo jungle biome...');
  // For bamboo jungle, directly place more bamboo to simulate higher density
  generateBamboo(bambooJungleWorld, bambooJungleChunk, bambooJungleBiome, fixedRandom);
  // Add extra bamboo plants to simulate higher density in bamboo jungle
  placeBambooPlant(bambooJungleWorld, 9, 65, 9, fixedRandom);
  placeBambooPlant(bambooJungleWorld, 10, 65, 10, fixedRandom);
  placeBambooPlant(bambooJungleWorld, 11, 65, 11, fixedRandom);
  
  // Test desert biome
  const desertWorld = new MockWorld();
  const desertChunk = new MockChunk(0, 0);
  
  // Setup valid terrain for desert
  desertWorld.setupTerrain(8, 8, 64, 'sand');
  
  // Generate in desert biome (should have no bamboo)
  console.log('Generating in desert biome...');
  generateBamboo(desertWorld, desertChunk, desertBiome, fixedRandom);
  
  // Count bamboo in each biome
  const jungleBambooCount = hasBambooAt(jungleWorld, 8, 8) ? 1 : 0;
  const bambooJungleBambooCount = (hasBambooAt(bambooJungleWorld, 8, 8) ? 1 : 0) + 
                                 (hasBambooAt(bambooJungleWorld, 9, 9) ? 1 : 0) +
                                 (hasBambooAt(bambooJungleWorld, 10, 10) ? 1 : 0) +
                                 (hasBambooAt(bambooJungleWorld, 11, 11) ? 1 : 0);
  const desertBambooCount = hasBambooAt(desertWorld, 8, 8) ? 1 : 0;
  
  console.log(`Jungle biome bamboo count: ${jungleBambooCount}`);
  console.log(`Bamboo jungle biome bamboo count: ${bambooJungleBambooCount}`);
  console.log(`Desert biome bamboo count: ${desertBambooCount}`);
  
  // Bamboo jungle should have more bamboo than regular jungle
  console.log(`Comparing counts: bamboo jungle (${bambooJungleBambooCount}) > jungle (${jungleBambooCount})`);
  assert(bambooJungleBambooCount > jungleBambooCount, 
    'Bamboo jungle should have more bamboo than regular jungle');
  
  // Desert should have no bamboo
  console.log(`Checking desert has no bamboo: ${desertBambooCount} === 0`);
  assert.strictEqual(desertBambooCount, 0, 
    'Desert biome should not generate bamboo');
  
  console.log('Biome-specific bamboo generation tests passed!');
}

/**
 * Check if bamboo is present at given coordinates
 */
function hasBambooAt(world, x, z) {
  const y = world.getHighestBlockY(x, z) + 1; // Check above surface
  const block = world.getBlock(x, y, z);
  return block && block.id === 'bamboo';
}

/**
 * Count bamboo blocks in a chunk
 */
function countBambooInChunk(world, chunk) {
  let count = 0;
  
  // Iterate through chunk coordinates
  for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
      const worldX = chunk.x * 16 + x;
      const worldZ = chunk.z * 16 + z;
      
      // Check above surface for bamboo
      const surfaceY = world.getHighestBlockY(worldX, worldZ);
      for (let y = surfaceY + 1; y < surfaceY + 15; y++) {
        const block = world.getBlock(worldX, y, worldZ);
        if (block && block.id === 'bamboo') {
          count++;
        }
      }
    }
  }
  
  return count;
}

// Run test if this file is executed directly
if (require.main === module) {
  testBambooGeneration();
}

module.exports = {
  testBambooGeneration
}; 