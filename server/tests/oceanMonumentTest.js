/**
 * Ocean Monument Structure Test
 * Tests the generation of ocean monuments in deep ocean biomes
 */

const StructureGenerator = require('../utils/structureGenerator');
const BiomeManager = require('../biomes/biomeManager');
const BiomeRegistry = require('../biomes/biomeRegistry');
const OceanBiome = require('../biomes/oceanBiome');
const { createTerrainNoiseGenerators, createClimateNoiseGenerators } = require('../utils/noiseGenerator');

// Test constants
const TEST_SEED = 12345;
const BLOCKS_TO_TEST = ['prismarine', 'prismarine_bricks', 'dark_prismarine', 'sea_lantern'];

// Mock blockSetter function to collect placed blocks
function createMockBlockSetter() {
  const placedBlocks = {};
  const setter = (key, block) => {
    placedBlocks[key] = block;
  };
  return { setter, placedBlocks };
}

// Test suite for ocean monument generation
console.log('Running Ocean Monument Structure Tests...');

// Test 1: Ocean monument basic generation
function testBasicOceanMonumentGeneration() {
  console.log('Test 1: Basic ocean monument generation');
  
  // Create a structure generator with a fixed seed
  const structureGenerator = new StructureGenerator({ seed: TEST_SEED });
  
  // Create a mock block setter to capture the blocks
  const { setter: blockSetter, placedBlocks } = createMockBlockSetter();
  
  // Generate an ocean monument
  const position = { x: 0, y: 45, z: 0 }; // Y at 45 (underwater)
  const monument = structureGenerator.generateOceanMonument(position, {}, blockSetter);
  
  // Verify the monument was generated
  if (!monument) {
    console.error('FAIL: No monument was generated');
    return false;
  }
  
  // Check that monument has correct properties
  if (monument.type !== 'ocean_monument') {
    console.error(`FAIL: Expected type 'ocean_monument', got '${monument.type}'`);
    return false;
  }
  
  if (monument.size.width !== 21 || monument.size.height !== 18 || monument.size.depth !== 21) {
    console.error(`FAIL: Expected size {21, 18, 21}, got {${monument.size.width}, ${monument.size.height}, ${monument.size.depth}}`);
    return false;
  }
  
  // Check that monument contains all required block types
  const blockTypeCount = {};
  BLOCKS_TO_TEST.forEach(type => blockTypeCount[type] = 0);
  
  Object.values(placedBlocks).forEach(block => {
    if (BLOCKS_TO_TEST.includes(block.type)) {
      blockTypeCount[block.type]++;
    }
  });
  
  // Verify each block type exists in sufficient quantities
  let allBlockTypesPresent = true;
  BLOCKS_TO_TEST.forEach(type => {
    if (blockTypeCount[type] === 0) {
      console.error(`FAIL: No blocks of type '${type}' were generated`);
      allBlockTypesPresent = false;
    }
  });
  
  if (!allBlockTypesPresent) {
    return false;
  }
  
  // Check that sea lantern blocks are present (should have at least a few)
  if (blockTypeCount['sea_lantern'] < 5) {
    console.error(`FAIL: Expected at least 5 sea lanterns, got ${blockTypeCount['sea_lantern']}`);
    return false;
  }
  
  // Count the total blocks placed
  const totalBlocks = Object.keys(placedBlocks).length;
  if (totalBlocks < 1000) {
    console.error(`FAIL: Expected at least 1000 blocks, got ${totalBlocks}`);
    return false;
  }
  
  console.log('PASS: Basic ocean monument generation');
  console.log(`      Generated monument with ${totalBlocks} total blocks`);
  console.log(`      Block counts: ${JSON.stringify(blockTypeCount)}`);
  return true;
}

// Test 2: Ocean monument in deep ocean biome
function testOceanMonumentPlacement() {
  console.log('Test 2: Ocean monument placement in deep ocean');
  
  // Create required components
  const seed = TEST_SEED;
  const terrainNoiseGenerators = createTerrainNoiseGenerators(seed);
  const climateNoiseGenerators = createClimateNoiseGenerators(seed + 12345);
  const biomeRegistry = new BiomeRegistry();
  const deepOcean = new OceanBiome({ isDeep: true });
  
  // Create a biome manager for testing
  const biomeManager = new BiomeManager({
    biomes: [deepOcean],
    noiseGenerators: {
      ...terrainNoiseGenerators,
      temperature: climateNoiseGenerators.temperature,
      precipitation: climateNoiseGenerators.precipitation,
      continentalness: climateNoiseGenerators.continentalness,
      erosion: climateNoiseGenerators.erosion,
      weirdness: climateNoiseGenerators.weirdness
    }
  });
  
  // Ensure deep ocean biome returns ocean monument in structures
  const random = () => 0.0001; // Force return value to be below ocean monument threshold
  const structures = deepOcean.getStructuresAt(0, 0, random);
  
  // Verify structures contain ocean monument
  const hasOceanMonument = structures.some(structure => 
    structure.id === 'ocean_monument' || structure.type === 'ocean_monument');
  
  if (!hasOceanMonument) {
    console.error('FAIL: Deep ocean biome did not return ocean monument structure');
    return false;
  }
  
  console.log('PASS: Ocean monument placement in deep ocean');
  return true;
}

// Test 3: Verify guardian spawning
function testGuardianSpawning() {
  console.log('Test 3: Guardian spawning in ocean monument');
  
  // Create a structure generator with a fixed seed
  const structureGenerator = new StructureGenerator({ seed: TEST_SEED });
  
  // Create a mock entity spawner
  const spawnedEntities = [];
  structureGenerator.setEntitySpawner((entity) => {
    spawnedEntities.push(entity);
    return { id: `entity-${spawnedEntities.length}`, ...entity };
  });
  
  // Generate an ocean monument
  const { setter: blockSetter } = createMockBlockSetter();
  const position = { x: 0, y: 45, z: 0 };
  structureGenerator.generateOceanMonument(position, {}, blockSetter);
  
  // Check that guardians were spawned
  const guardians = spawnedEntities.filter(entity => entity.type === 'guardian');
  const elderGuardians = spawnedEntities.filter(entity => entity.type === 'elder_guardian');
  
  if (guardians.length < 5) {
    console.error(`FAIL: Expected at least 5 guardians, got ${guardians.length}`);
    return false;
  }
  
  if (elderGuardians.length !== 1) {
    console.error(`FAIL: Expected exactly 1 elder guardian, got ${elderGuardians.length}`);
    return false;
  }
  
  console.log('PASS: Guardian spawning in ocean monument');
  console.log(`      Spawned ${guardians.length} guardians and ${elderGuardians.length} elder guardian`);
  return true;
}

// Run all tests
function runTests() {
  let passCount = 0;
  const totalTests = 3;
  
  if (testBasicOceanMonumentGeneration()) passCount++;
  if (testOceanMonumentPlacement()) passCount++;
  if (testGuardianSpawning()) passCount++;
  
  console.log(`\nOcean Monument Tests: ${passCount}/${totalTests} passed`);
  return passCount === totalTests;
}

// Execute the tests
const success = runTests();
if (!success) {
  console.error('FAILED: Ocean monument tests failed');
  process.exit(1);
} else {
  console.log('SUCCESS: All ocean monument tests passed');
}

module.exports = {
  runTests
}; 