/**
 * Trail Ruins Test - Tests for the Trail Ruins structure feature
 * Part of the Minecraft 1.24 Update (Trail Tales)
 */

// Mock world implementation for testing
class MockWorld {
  constructor() {
    this.blocks = {};
    this.entities = [];
    this.biome = 'plains';
  }
  
  setBlock(position, block) {
    const key = `${position.x},${position.y},${position.z}`;
    this.blocks[key] = block;
  }
  
  getBlock(position) {
    const key = `${position.x},${position.y},${position.z}`;
    return this.blocks[key] || null;
  }
  
  getBiome() {
    return { type: this.biome };
  }
  
  getHighestBlock() {
    return 64; // Default height
  }
  
  getHighestBlockType() {
    return 'grass_block'; // Default block
  }
  
  getSpawnPosition() {
    return { x: 0, y: 64, z: 0 };
  }
  
  getEntitiesInBounds() {
    return [];
  }

  random() {
    return Math.random();
  }
}

// Run tests
function runTrailRuinsTests() {
  console.log('Running Trail Ruins Structure Tests...');
  
  const TrailRuins = require('../structures/trailRuins');
  const TrailRuinsGenerator = require('../utils/structures/trailRuinsGenerator');
  
  // Test 1: Verify structure creation
  console.log('Test 1: Structure Creation');
  try {
    const trailRuins = new TrailRuins({
      id: 'test_trail_ruins',
      position: { x: 0, y: 64, z: 0 }
    });
    
    console.log('- Created Trail Ruins instance successfully');
    console.log(`- ID: ${trailRuins.id}`);
    console.log(`- Position: ${JSON.stringify(trailRuins.position)}`);
    
    if (trailRuins.buildings && Array.isArray(trailRuins.buildings)) {
      console.log('- Buildings array initialized correctly');
    } else {
      throw new Error('Buildings array not initialized correctly');
    }
    
    console.log('✅ Test 1 Passed');
  } catch (error) {
    console.error(`❌ Test 1 Failed: ${error.message}`);
  }
  
  // Test 2: Verify biome checks
  console.log('\nTest 2: Biome Validation');
  try {
    const validBiomes = ['plains', 'forest', 'taiga', 'savanna', 'snowy_plains'];
    const invalidBiomes = ['nether_wastes', 'the_end', 'ocean'];
    
    let allValid = true;
    let allInvalid = true;
    
    for (const biome of validBiomes) {
      const isValid = TrailRuins.canGenerateInBiome(biome);
      console.log(`- ${biome}: ${isValid ? 'Valid' : 'Invalid'}`);
      if (!isValid) allValid = false;
    }
    
    for (const biome of invalidBiomes) {
      const isValid = TrailRuins.canGenerateInBiome(biome);
      console.log(`- ${biome}: ${isValid ? 'Valid' : 'Invalid'}`);
      if (isValid) allInvalid = false;
    }
    
    if (allValid && allInvalid) {
      console.log('✅ Test 2 Passed');
    } else {
      throw new Error('Biome validation not working correctly');
    }
  } catch (error) {
    console.error(`❌ Test 2 Failed: ${error.message}`);
  }
  
  // Test 3: Test generation
  console.log('\nTest 3: Structure Generation');
  try {
    const mockWorld = new MockWorld();
    const position = { x: 0, y: 64, z: 0 };
    
    // Set test mode to true for reliable generation
    const ruins = TrailRuins.generate(mockWorld, position, { testMode: true });
    
    console.log('- Generated Trail Ruins successfully');
    console.log(`- Number of buildings: ${ruins.buildings.length}`);
    console.log(`- Number of pathways: ${ruins.pathways.length}`);
    console.log(`- Has plazas: ${ruins.plazas.length > 0 ? 'Yes' : 'No'}`);
    
    if (ruins.buildings.length > 0 && 
        (ruins.pathways.length > 0 || ruins.buildings.length === 1)) {
      console.log('✅ Test 3 Passed');
    } else {
      throw new Error('Structure generation is incomplete');
    }
  } catch (error) {
    console.error(`❌ Test 3 Failed: ${error.message}`);
  }
  
  // Test 4: Test suitable location finding
  console.log('\nTest 4: Find Suitable Location');
  try {
    const mockWorld = new MockWorld();
    
    // Set test mode to true for reliable location finding
    const location = TrailRuins.findSuitableLocation(mockWorld, { testMode: true });
    
    console.log(`- Found location: ${JSON.stringify(location)}`);
    
    if (location && location.x !== undefined && location.y !== undefined && location.z !== undefined) {
      console.log('✅ Test 4 Passed');
    } else {
      throw new Error('Failed to find suitable location');
    }
  } catch (error) {
    console.error(`❌ Test 4 Failed: ${error.message}`);
  }
  
  // Test 5: Serialization and deserialization
  console.log('\nTest 5: Serialization and Deserialization');
  try {
    const mockWorld = new MockWorld();
    const originalRuins = new TrailRuins({
      id: 'test_ruins',
      position: { x: 100, y: 64, z: 100 },
      buildings: [
        {
          position: { x: 100, y: 64, z: 100 },
          size: { width: 5, length: 5, height: 3 },
          type: 'house',
          blocks: [],
          features: [],
          buried: 0.3
        }
      ],
      pathways: [],
      plazas: [],
      archaeologySites: [],
      treasureChests: [],
      decoratedPots: [],
      biomeType: 'plains'
    });
    
    originalRuins.setWorld(mockWorld);
    
    const serialized = originalRuins.serialize();
    console.log('- Serialized structure successfully');
    
    const deserialized = TrailRuins.deserialize(serialized, mockWorld);
    console.log('- Deserialized structure successfully');
    
    const isEqual = 
      deserialized.id === originalRuins.id &&
      deserialized.position.x === originalRuins.position.x &&
      deserialized.position.y === originalRuins.position.y &&
      deserialized.position.z === originalRuins.position.z &&
      deserialized.buildings.length === originalRuins.buildings.length &&
      deserialized.biomeType === originalRuins.biomeType;
    
    if (isEqual) {
      console.log('✅ Test 5 Passed');
    } else {
      throw new Error('Serialization/deserialization did not preserve data');
    }
  } catch (error) {
    console.error(`❌ Test 5 Failed: ${error.message}`);
  }
  
  // Test 6: Test different biome variants
  console.log('\nTest 6: Biome Variants');
  try {
    const biomeTypes = ['plains', 'forest', 'taiga', 'desert', 'savanna', 'snowy'];
    const results = {};
    
    for (const biomeType of biomeTypes) {
      const mockWorld = new MockWorld();
      mockWorld.biome = biomeType === 'snowy' ? 'snowy_plains' : biomeType;
      
      const generator = new TrailRuinsGenerator(mockWorld);
      const config = generator.config;
      
      console.log(`- Checking block types for ${biomeType} biome`);
      const blocks = config.biomeBlocks[biomeType] || config.biomeBlocks.plains;
      
      results[biomeType] = {
        primary: blocks.primary,
        secondary: blocks.secondary,
        accent: blocks.accent,
        detail: blocks.detail
      };
      
      console.log(`  Primary: ${blocks.primary}`);
      console.log(`  Secondary: ${blocks.secondary}`);
    }
    
    // Verify each biome has unique block combinations
    const uniqueCombinations = new Set();
    for (const biome in results) {
      const combination = `${results[biome].primary},${results[biome].secondary}`;
      uniqueCombinations.add(combination);
    }
    
    if (uniqueCombinations.size >= 3) { // At least 3 unique variants
      console.log('✅ Test 6 Passed');
    } else {
      throw new Error('Not enough biome variants');
    }
  } catch (error) {
    console.error(`❌ Test 6 Failed: ${error.message}`);
  }
  
  console.log('\nTrail Ruins Structure Tests Complete!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTrailRuinsTests();
}

module.exports = { runTrailRuinsTests }; 