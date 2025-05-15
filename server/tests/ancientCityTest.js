/**
 * Tests for Ancient City structure generation
 */

const AncientCityGenerator = require('../utils/structures/ancientCityGenerator');

// Mock block setter function for testing
const mockBlockSetter = (key, block) => {
  const [x, y, z] = key.split(',').map(Number);
  placedBlocks[key] = {
    position: { x, y, z },
    block
  };
};

// Mock entity spawner function
const mockEntitySpawner = (type, position, options) => {
  spawnedEntities.push({
    type,
    position,
    options
  });
};

// Test the Ancient City generation
function testAncientCityGeneration() {
  console.log('Testing Ancient City Generation...');
  
  // Reset tracking variables
  placedBlocks = {};
  spawnedEntities = [];
  
  // Create generator with fixed seed for deterministic testing
  const generator = new AncientCityGenerator({ seed: 12345 });
  
  // Generate the Ancient City
  const position = { x: 0, y: 64, z: 0 };
  const options = { 
    size: 'medium',
    sculkDensity: 0.5
  };
  
  const structure = generator.generateAncientCity(
    position, 
    options, 
    mockBlockSetter, 
    mockEntitySpawner
  );
  
  // Run tests
  runStructureTests(structure);
  
  console.log('Ancient City tests completed!');
  return true;
}

function runStructureTests(structure) {
  // Check if structure data is valid
  console.assert(structure.type === 'ancient_city', 'Structure type should be ancient_city');
  console.assert(structure.position.x === 0, 'Structure X position should be 0');
  console.assert(structure.position.y <= 25, 'Structure Y position should be deep underground');
  console.assert(structure.position.z === 0, 'Structure Z position should be 0');
  
  // Check if structure has the expected components
  console.assert(structure.rooms.length > 0, 'Structure should have rooms');
  console.assert(structure.corridors.length > 0, 'Structure should have corridors');
  console.assert(structure.features.length > 0, 'Structure should have special features');
  
  // Check for presence of specific blocks
  let hasReinforcedDeepslate = false;
  let hasSculkBlocks = false;
  let hasSoulFire = false;
  
  for (const key in placedBlocks) {
    const blockData = placedBlocks[key];
    
    if (blockData.block.type === 'reinforced_deepslate') {
      hasReinforcedDeepslate = true;
    }
    
    if (['sculk', 'sculk_catalyst', 'sculk_sensor', 'sculk_shrieker'].includes(blockData.block.type)) {
      hasSculkBlocks = true;
    }
    
    if (blockData.block.type === 'soul_fire') {
      hasSoulFire = true;
    }
  }
  
  console.assert(hasReinforcedDeepslate, 'Ancient City should contain reinforced deepslate blocks');
  console.assert(hasSculkBlocks, 'Ancient City should contain sculk blocks');
  console.assert(hasSoulFire, 'Ancient City should contain soul fire');
  
  // Count blocks by type for statistical analysis
  const blockTypeCounts = {};
  
  for (const key in placedBlocks) {
    const blockType = placedBlocks[key].block.type;
    blockTypeCounts[blockType] = (blockTypeCounts[blockType] || 0) + 1;
  }
  
  console.log('Block type distribution:');
  for (const blockType in blockTypeCounts) {
    console.log(`- ${blockType}: ${blockTypeCounts[blockType]}`);
  }
}

// Variables to track test results
let placedBlocks = {};
let spawnedEntities = [];

// Run the tests
testAncientCityGeneration();

module.exports = {
  testAncientCityGeneration
}; 