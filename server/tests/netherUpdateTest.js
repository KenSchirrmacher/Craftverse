/**
 * Nether Update Test
 * Tests functionality of Nether Update features:
 * - New biomes (Soul Sand Valley, Warped Forest, Crimson Forest, Basalt Deltas)
 * - New blocks (Ancient debris, Basalt, Blackstone variants, Nether gold ore)
 * - Soul fire and soul fire torches
 * - Ruined portals in Overworld and Nether
 */

const assert = require('assert');
const StructureGenerator = require('../utils/structureGenerator');
const FireBlock = require('../blocks/fireBlock');
const SoulFireTorch = require('../blocks/soulFireTorch');
const NetherWastesBiome = require('../biomes/netherWastesBiome');
const SoulSandValleyBiome = require('../biomes/soulSandValleyBiome');
const CrimsonForestBiome = require('../biomes/crimsonForestBiome');
const WarpedForestBiome = require('../biomes/warpedForestBiome');
const BasaltDeltasBiome = require('../biomes/basaltDeltasBiome');

// Mock world for testing
class MockWorld {
  constructor() {
    this.blocks = {};
  }

  getBlockAt(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks[key];
  }

  setBlock(position, blockData) {
    const key = `${position.x},${position.y},${position.z}`;
    this.blocks[key] = blockData;
    return true;
  }
}

// Test suite setup
function runTests() {
  console.log('Running Nether Update Tests...');
  let passedTests = 0;
  let failedTests = 0;
  let totalTests = 0;

  // Helper function to run a test
  function runTest(name, testFn) {
    totalTests++;
    try {
      testFn();
      passedTests++;
      console.log(`  ✓ ${name}`);
    } catch (error) {
      failedTests++;
      console.log(`  ✗ ${name}`);
      console.log(`    ${error.message}`);
    }
  }

  // -----------------------------------------------
  // Biome Tests
  // -----------------------------------------------
  console.log('\nTesting Nether Biomes:');
  
  runTest('NetherWastesBiome should have correct properties', () => {
    const biome = new NetherWastesBiome();
    assert.equal(biome.id, 'nether_wastes');
    assert.equal(biome.dimension, 'nether');
    assert.equal(biome.temperature, 2.0);
    assert.equal(biome.hasLavaOcean, true);
  });
  
  runTest('SoulSandValleyBiome should have correct properties', () => {
    const biome = new SoulSandValleyBiome();
    assert.equal(biome.id, 'soul_sand_valley');
    assert.equal(biome.surfaceBlock, 'soul_sand');
    assert.ok(biome.vegetationTypes.includes('bone_block'));
  });
  
  runTest('CrimsonForestBiome should have correct properties', () => {
    const biome = new CrimsonForestBiome();
    assert.equal(biome.id, 'crimson_forest');
    assert.equal(biome.surfaceBlock, 'crimson_nylium');
    assert.ok(biome.vegetationTypes.includes('crimson_fungus'));
  });
  
  runTest('WarpedForestBiome should have correct properties', () => {
    const biome = new WarpedForestBiome();
    assert.equal(biome.id, 'warped_forest');
    assert.equal(biome.surfaceBlock, 'warped_nylium');
    assert.ok(biome.vegetationTypes.includes('warped_fungus'));
  });
  
  runTest('BasaltDeltasBiome should have correct properties', () => {
    const biome = new BasaltDeltasBiome();
    assert.equal(biome.id, 'basalt_deltas');
    assert.equal(biome.surfaceBlock, 'basalt');
    assert.equal(biome.subsurfaceBlock, 'blackstone');
  });
  
  runTest('BasaltDeltasBiome should generate basalt columns', () => {
    const biome = new BasaltDeltasBiome();
    const mockNoiseGenerators = {
      caveNoise: {
        getValue: (x, y, z) => 0.9 // Always high noise for testing
      },
      erosion: {
        getValue: (x, y, z) => 0.5
      }
    };
    
    const blockType = biome.getBlockAt(0, 65, 0, mockNoiseGenerators, 12345, 64).type;
    assert.equal(blockType, 'basalt');
  });

  // -----------------------------------------------
  // Block Tests
  // -----------------------------------------------
  console.log('\nTesting Nether Update Blocks:');
  
  runTest('FireBlock should detect block below for fire type', () => {
    const mockWorld = new MockWorld();
    
    // Set up soul sand block at y=0
    mockWorld.setBlock({ x: 0, y: 0, z: 0 }, { type: 'soul_sand' });
    
    // Try to start fire above it
    const result = FireBlock.startFireAt(mockWorld, { x: 0, y: 1, z: 0 });
    assert.equal(result, true);
    
    // Check if soul fire was created
    const fireBlock = mockWorld.getBlockAt(0, 1, 0);
    assert.equal(fireBlock.type, 'soul_fire');
  });
  
  runTest('FireBlock should start regular fire on normal blocks', () => {
    const mockWorld = new MockWorld();
    
    // Set up stone block at y=0
    mockWorld.setBlock({ x: 0, y: 0, z: 0 }, { type: 'stone' });
    
    // Try to start fire above it
    const result = FireBlock.startFireAt(mockWorld, { x: 0, y: 1, z: 0 });
    assert.equal(result, true);
    
    // Check if regular fire was created
    const fireBlock = mockWorld.getBlockAt(0, 1, 0);
    assert.equal(fireBlock.type, 'fire');
  });
  
  runTest('Soul Fire should do more damage than regular fire', () => {
    const regularFire = new FireBlock({ id: 'fire' });
    const soulFire = new FireBlock({ id: 'soul_fire' });
    
    const regularDamage = regularFire.onPlayerStep({}).amount;
    const soulDamage = soulFire.onPlayerStep({}).amount;
    
    assert.ok(soulDamage > regularDamage);
  });
  
  runTest('Soul Fire Torch should have lower light level', () => {
    const soulTorch = new SoulFireTorch();
    const lightSource = soulTorch.getLightSource();
    
    assert.equal(lightSource.level, 10);
    assert.ok(lightSource.level < 15); // Regular torch is 15
  });
  
  runTest('Soul Fire Torch should have blue flame color', () => {
    const soulTorch = new SoulFireTorch();
    const state = soulTorch.getState();
    
    assert.equal(state.soulFire, true);
    assert.equal(state.flameColor, '#7EB8C4');
  });

  // -----------------------------------------------
  // Structure Tests
  // -----------------------------------------------
  console.log('\nTesting Nether Update Structures:');
  
  runTest('Ruined Portal generator should create valid structure', () => {
    const generator = new StructureGenerator();
    const ruinedPortal = generator.generateRuinedPortal(0, 64, 0, 'overworld', { 
      seed: 12345,
      size: 'medium',
      decay: 0.5,
      buried: false,
      tilted: false
    });
    
    assert.equal(ruinedPortal.type, 'ruined_portal');
    assert.ok(Object.keys(ruinedPortal.blocks).length > 0);
    
    // Check if the structure has obsidian blocks (portal frame)
    const hasObsidian = Object.values(ruinedPortal.blocks).some(
      block => block.type === 'obsidian'
    );
    assert.equal(hasObsidian, true);
    
    // Check if the structure has netherrack
    const hasNetherrack = Object.values(ruinedPortal.blocks).some(
      block => block.type === 'netherrack'
    );
    assert.equal(hasNetherrack, true);
  });
  
  runTest('Nether version of Ruined Portal should use blackstone', () => {
    const generator = new StructureGenerator();
    const ruinedPortal = generator.generateRuinedPortal(0, 64, 0, 'nether', { 
      seed: 12345,
      size: 'medium',
      decay: 0.5,
      buried: false,
      tilted: false,
      hasChest: true
    });
    
    // Check if the structure has blackstone or basalt
    const hasNetherMaterials = Object.values(ruinedPortal.blocks).some(
      block => block.type === 'blackstone' || block.type === 'basalt'
    );
    assert.equal(hasNetherMaterials, true);
    
    // Check if the structure has magma blocks
    const hasMagma = Object.values(ruinedPortal.blocks).some(
      block => block.type === 'magma_block'
    );
    assert.equal(hasMagma, true);
  });
  
  // Print test results
  console.log(`\n${passedTests}/${totalTests} tests passed.`);
  return passedTests === totalTests;
}

// For direct script execution
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests }; 