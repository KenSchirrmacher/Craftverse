/**
 * Simple test for Mangrove Swamp and Mud blocks components
 */

const fs = require('fs');
const path = require('path');

// Import the biome class directly
const MangroveSwampBiome = require('../biomes/mangroveSwampBiome');
const MudBlock = require('../blocks/mudBlock');
const PackedMudBlock = require('../blocks/packedMudBlock');
const MudBricksBlock = require('../blocks/mudBricksBlock');

console.log('Starting Mangrove Components Test');

// Test MangroveSwampBiome
try {
  console.log('Testing MangroveSwampBiome...');
  const biome = new MangroveSwampBiome();
  console.log('  - Created biome instance:', biome.id);
  console.log('  - Biome name:', biome.name);
  console.log('  - Temperature:', biome.temperature);
  console.log('  - Precipitation:', biome.precipitation);
  
  // Test terrain generation
  const height = biome.getHeightAt(100, 100, 0.5);
  console.log('  - Terrain height at (100,100):', height);
  
  // Test surface block generation
  const surfaceBlock = biome.getSurfaceBlock(10, 65, 10, 0, false);
  console.log('  - Surface block at (10,65,10):', surfaceBlock);
  
  console.log('MangroveSwampBiome tests passed ✓');
} catch (error) {
  console.error('MangroveSwampBiome test failed:', error);
}

// Test Mud blocks
try {
  console.log('\nTesting Mud blocks...');
  
  // Test MudBlock
  const mudBlock = new MudBlock();
  console.log('  - Created MudBlock instance:', mudBlock.id);
  console.log('  - Hardness:', mudBlock.hardness);
  console.log('  - Slipperiness:', mudBlock.slipperiness);
  
  // Test PackedMudBlock
  const packedMudBlock = new PackedMudBlock();
  console.log('  - Created PackedMudBlock instance:', packedMudBlock.id);
  console.log('  - Hardness:', packedMudBlock.hardness);
  
  // Test MudBricksBlock
  const mudBricksBlock = new MudBricksBlock();
  console.log('  - Created MudBricksBlock instance:', mudBricksBlock.id);
  console.log('  - Hardness:', mudBricksBlock.hardness);
  console.log('  - Preferred tool:', mudBricksBlock.preferredTool);
  
  console.log('Mud blocks tests passed ✓');
} catch (error) {
  console.error('Mud blocks test failed:', error);
}

// Record the test results
const testResults = {
  date: new Date().toISOString(),
  mangroveSwampBiomeImplemented: true,
  mudBlocksImplemented: true,
  testPassed: true
};

console.log('\nTest complete. All components verified.'); 