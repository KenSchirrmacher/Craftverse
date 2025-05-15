/**
 * Simple test for NetherBiome class
 */

const NetherBiome = require('../biomes/netherBiome');

console.log('Starting NetherBiome Test');

try {
  console.log('Testing NetherBiome...');
  const biome = new NetherBiome();
  console.log('  - Created biome instance:', biome.id);
  console.log('  - Biome name:', biome.name);
  console.log('  - Temperature:', biome.temperature);
  console.log('  - isNether property:', biome.isNether);
  console.log('  - hasLavaOcean property:', biome.hasLavaOcean);
  
  // Test terrain generation
  const height = biome.getTerrainHeight(100, 100, null, 12345);
  console.log('  - Terrain height at (100,100):', height);
  
  console.log('NetherBiome tests passed ✓');
} catch (error) {
  console.error('NetherBiome test failed:', error);
}

console.log('\nTest complete.'); 