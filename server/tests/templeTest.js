/**
 * Temple Structure Test
 * Tests the generation of desert and jungle temples
 */

const StructureGenerator = require('../utils/structureGenerator');
const BiomeManager = require('../biomes/biomeManager');
const BiomeRegistry = require('../biomes/biomeRegistry');
const { createTerrainNoiseGenerators, createClimateNoiseGenerators } = require('../utils/noiseGenerator');

// Test constants
const TEST_SEED = 12345;

// Mock blockSetter function to collect placed blocks
function createMockBlockSetter() {
  const placedBlocks = {};
  const setter = (key, block) => {
    placedBlocks[key] = block;
  };
  return { setter, placedBlocks };
}

// Test suite for temple generation
console.log('Running Temple Structure Tests...');

// Test 1: Desert temple basic generation
function testDesertTempleGeneration() {
  console.log('Test 1: Basic desert temple generation');
  
  // Create a structure generator with a fixed seed
  const structureGenerator = new StructureGenerator({ seed: TEST_SEED });
  
  // Create a mock block setter to capture the blocks
  const { setter: blockSetter, placedBlocks } = createMockBlockSetter();
  
  // Generate a desert temple
  const position = { x: 0, y: 64, z: 0 }; // Y at surface level
  const temple = structureGenerator.generateStructure('desert_temple', position, {}, blockSetter);
  
  // Verify the temple was generated
  if (!temple) {
    console.error('FAIL: No desert temple was generated');
    return false;
  }
  
  // Check that temple has correct properties
  if (temple.type !== 'desert_temple') {
    console.error(`FAIL: Expected type 'desert_temple', got '${temple.type}'`);
    return false;
  }
  
  // Check for specific block types that should exist in a desert temple
  const requiredBlocks = ['sandstone', 'stone_pressure_plate', 'tnt', 'chest'];
  const blockTypes = {};
  requiredBlocks.forEach(type => blockTypes[type] = 0);
  
  // Count blocks by type
  Object.values(placedBlocks).forEach(block => {
    if (requiredBlocks.includes(block.type)) {
      blockTypes[block.type]++;
    }
  });
  
  // Verify each required block type exists
  let missingBlocks = false;
  requiredBlocks.forEach(type => {
    if (blockTypes[type] === 0) {
      console.error(`FAIL: No blocks of type '${type}' were found`);
      missingBlocks = true;
    }
  });
  
  if (missingBlocks) {
    return false;
  }
  
  // Check for treasure chests
  if (blockTypes['chest'] < 2) {
    console.error(`FAIL: Expected at least 2 chests, found ${blockTypes['chest']}`);
    return false;
  }
  
  // Check for TNT (trap component)
  if (blockTypes['tnt'] < 1) {
    console.error(`FAIL: Expected at least 1 TNT block, found ${blockTypes['tnt']}`);
    return false;
  }
  
  // Count the total blocks placed
  const totalBlocks = Object.keys(placedBlocks).length;
  if (totalBlocks < 500) {
    console.error(`FAIL: Expected at least 500 blocks for a desert temple, got ${totalBlocks}`);
    return false;
  }
  
  console.log('PASS: Basic desert temple generation');
  console.log(`      Generated temple with ${totalBlocks} total blocks`);
  console.log(`      Block counts: ${JSON.stringify(blockTypes)}`);
  return true;
}

// Test 2: Jungle temple basic generation
function testJungleTempleGeneration() {
  console.log('Test 2: Basic jungle temple generation');
  
  // Create a structure generator with a fixed seed
  const structureGenerator = new StructureGenerator({ seed: TEST_SEED });
  
  // Create a mock block setter to capture the blocks
  const { setter: blockSetter, placedBlocks } = createMockBlockSetter();
  
  // Generate a jungle temple
  const position = { x: 0, y: 64, z: 0 }; // Y at surface level
  const temple = structureGenerator.generateStructure('jungle_temple', position, {}, blockSetter);
  
  // Verify the temple was generated
  if (!temple) {
    console.error('FAIL: No jungle temple was generated');
    return false;
  }
  
  // Check that temple has correct properties
  if (temple.type !== 'jungle_temple') {
    console.error(`FAIL: Expected type 'jungle_temple', got '${temple.type}'`);
    return false;
  }
  
  // Check for specific block types that should exist in a jungle temple
  const requiredBlocks = ['cobblestone', 'mossy_cobblestone', 'tripwire', 'dispenser', 'chest', 'lever'];
  const blockTypes = {};
  requiredBlocks.forEach(type => blockTypes[type] = 0);
  
  // Count blocks by type
  Object.values(placedBlocks).forEach(block => {
    if (requiredBlocks.includes(block.type)) {
      blockTypes[block.type]++;
    }
  });
  
  // Verify each required block type exists
  let missingBlocks = false;
  requiredBlocks.forEach(type => {
    if (blockTypes[type] === 0) {
      console.error(`FAIL: No blocks of type '${type}' were found`);
      missingBlocks = true;
    }
  });
  
  if (missingBlocks) {
    return false;
  }
  
  // Check for treasure chests
  if (blockTypes['chest'] < 1) {
    console.error(`FAIL: Expected at least 1 chest, found ${blockTypes['chest']}`);
    return false;
  }
  
  // Check for traps
  if (blockTypes['tripwire'] < 1 || blockTypes['dispenser'] < 1) {
    console.error(`FAIL: Expected at least 1 trap setup (tripwire + dispenser)`);
    return false;
  }
  
  // Count the total blocks placed
  const totalBlocks = Object.keys(placedBlocks).length;
  if (totalBlocks < 500) {
    console.error(`FAIL: Expected at least 500 blocks for a jungle temple, got ${totalBlocks}`);
    return false;
  }
  
  console.log('PASS: Basic jungle temple generation');
  console.log(`      Generated temple with ${totalBlocks} total blocks`);
  console.log(`      Block counts: ${JSON.stringify(blockTypes)}`);
  return true;
}

// Test 3: Biome-specific temple placement
function testTempleInBiomes() {
  console.log('Test 3: Temple placement in appropriate biomes');
  
  // Create required components
  const seed = TEST_SEED;
  const terrainNoiseGenerators = createTerrainNoiseGenerators(seed);
  const climateNoiseGenerators = createClimateNoiseGenerators(seed + 12345);
  
  // Create specific biomes to test with
  const desertsAndBiomes = BiomeRegistry.getBiomesOfType('desert');
  const jungleBiomes = BiomeRegistry.getBiomesOfType('jungle');
  
  // Verify biomes exist
  if (!desertsAndBiomes || desertsAndBiomes.length === 0) {
    console.error('FAIL: No desert biomes found in registry');
    return false;
  }
  
  if (!jungleBiomes || jungleBiomes.length === 0) {
    console.error('FAIL: No jungle biomes found in registry');
    return false;
  }
  
  // Test a desert biome for desert temple possibility
  const desertBiome = desertsAndBiomes[0];
  const random = () => 0.01; // Force return value to be below structure generation threshold
  const desertStructures = desertBiome.getStructuresAt(0, 0, random);
  
  // Test a jungle biome for jungle temple possibility
  const jungleBiome = jungleBiomes[0];
  const jungleStructures = jungleBiome.getStructuresAt(0, 0, random);
  
  // Verify structures contain appropriate temple types
  const hasDesertTemple = desertStructures.some(structure => 
    structure.id === 'desert_temple' || structure.type === 'desert_temple');
  
  const hasJungleTemple = jungleStructures.some(structure => 
    structure.id === 'jungle_temple' || structure.type === 'jungle_temple');
  
  if (!hasDesertTemple) {
    console.error('FAIL: Desert biome did not return desert temple structure');
    return false;
  }
  
  if (!hasJungleTemple) {
    console.error('FAIL: Jungle biome did not return jungle temple structure');
    return false;
  }
  
  console.log('PASS: Temple placement in appropriate biomes');
  return true;
}

// Run all tests
function runTests() {
  let passCount = 0;
  const totalTests = 3;
  
  if (testDesertTempleGeneration()) passCount++;
  if (testJungleTempleGeneration()) passCount++;
  if (testTempleInBiomes()) passCount++;
  
  console.log(`\nTemple Tests: ${passCount}/${totalTests} passed`);
  return passCount === totalTests;
}

// Execute the tests
const success = runTests();
if (!success) {
  console.error('FAILED: Temple tests failed');
  process.exit(1);
} else {
  console.log('SUCCESS: All temple tests passed');
}

module.exports = {
  runTests
}; 