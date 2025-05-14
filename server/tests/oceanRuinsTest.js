/**
 * Ocean Ruins Test - Tests for the generation of ocean ruins structures
 */

const StructureGenerator = require('../utils/structureGenerator');
const assert = require('assert');

class OceanRuinsTest {
  constructor() {
    this.structureGenerator = new StructureGenerator({ seed: 12345 });
    this.blocks = {};
    
    // Block setter function for testing
    this.blockSetter = (key, block) => {
      this.blocks[key] = block;
    };
  }
  
  /**
   * Run all ocean ruins tests
   */
  runTests() {
    console.log('Running Ocean Ruins tests...');
    
    this.testSmallStoneRuins();
    this.testLargeSandstoneRuins();
    this.testVariations();
    this.testDegradation();
    this.testLootGeneration();
    
    console.log('All Ocean Ruins tests passed!');
  }
  
  /**
   * Test generation of small stone ruins
   */
  testSmallStoneRuins() {
    console.log('Testing small stone ruins...');
    this.blocks = {};
    
    const position = { x: 0, y: 40, z: 0 };
    const options = {
      size: 'small',
      type: 'stone',
      degradation: 0.5
    };
    
    const result = this.structureGenerator.generateOceanRuins(position, options, this.blockSetter);
    
    // Verify basics of the structure
    assert(result, 'Should return a result object');
    assert.equal(result.type, 'ocean_ruins', 'Should be of type ocean_ruins');
    assert.equal(result.variant, 'stone', 'Should be stone variant');
    assert.equal(result.size, 'small', 'Should be small size');
    
    // Count blocks to verify structure was generated
    const blockCount = Object.keys(this.blocks).length;
    assert(blockCount > 10, `Should generate at least 10 blocks, got ${blockCount}`);
    
    // Verify materials
    let hasStoneBlocks = false;
    for (const key in this.blocks) {
      const block = this.blocks[key];
      if (block.type === 'stone_bricks' || block.type === 'cracked_stone_bricks' || block.type === 'mossy_stone_bricks') {
        hasStoneBlocks = true;
        break;
      }
    }
    assert(hasStoneBlocks, 'Should use stone brick materials');
    
    console.log('Small stone ruins test passed!');
  }
  
  /**
   * Test generation of large sandstone ruins
   */
  testLargeSandstoneRuins() {
    console.log('Testing large sandstone ruins...');
    this.blocks = {};
    
    const position = { x: 0, y: 40, z: 0 };
    const options = {
      size: 'large',
      type: 'sandstone',
      degradation: 0.5
    };
    
    const result = this.structureGenerator.generateOceanRuins(position, options, this.blockSetter);
    
    // Verify basics of the structure
    assert(result, 'Should return a result object');
    assert.equal(result.type, 'ocean_ruins', 'Should be of type ocean_ruins');
    assert.equal(result.variant, 'sandstone', 'Should be sandstone variant');
    assert.equal(result.size, 'large', 'Should be large size');
    
    // Count blocks to verify structure was generated
    const blockCount = Object.keys(this.blocks).length;
    assert(blockCount > 50, `Should generate at least 50 blocks for large structure, got ${blockCount}`);
    
    // Verify materials
    let hasSandstoneBlocks = false;
    for (const key in this.blocks) {
      const block = this.blocks[key];
      if (block.type === 'sandstone' || block.type === 'smooth_sandstone' || block.type === 'chiseled_sandstone') {
        hasSandstoneBlocks = true;
        break;
      }
    }
    assert(hasSandstoneBlocks, 'Should use sandstone materials');
    
    console.log('Large sandstone ruins test passed!');
  }
  
  /**
   * Test generation of different variations
   */
  testVariations() {
    console.log('Testing variations...');
    
    // Test multiple generations to check for variation in the generated structures
    const results = [];
    for (let i = 0; i < 5; i++) {
      this.blocks = {};
      const position = { x: i * 20, y: 40, z: 0 };
      const result = this.structureGenerator.generateOceanRuins(
        position, 
        {}, // Use default random options
        this.blockSetter
      );
      results.push(result);
      
      // Verify the structure was generated
      assert(result, `Should return a result object for iteration ${i}`);
    }
    
    // Check that we have at least some variation in size or type
    const uniqueTypes = new Set(results.map(r => r.variant));
    const uniqueSizes = new Set(results.map(r => r.size));
    
    assert(uniqueTypes.size > 1 || uniqueSizes.size > 1, 
      'Should generate different variations of ruins (type or size)');
    
    console.log('Variations test passed!');
  }
  
  /**
   * Test degradation parameter
   */
  testDegradation() {
    console.log('Testing degradation...');
    
    // Generate ruins with low degradation (more intact)
    this.blocks = {};
    const lowDegPosition = { x: 0, y: 40, z: 0 };
    const lowDegOptions = {
      size: 'large',
      type: 'stone',
      degradation: 0.2
    };
    
    this.structureGenerator.generateOceanRuins(lowDegPosition, lowDegOptions, this.blockSetter);
    const lowDegBlockCount = Object.keys(this.blocks).length;
    
    // Generate ruins with high degradation (more destroyed)
    this.blocks = {};
    const highDegPosition = { x: 30, y: 40, z: 0 };
    const highDegOptions = {
      size: 'large',
      type: 'stone',
      degradation: 0.8
    };
    
    this.structureGenerator.generateOceanRuins(highDegPosition, highDegOptions, this.blockSetter);
    const highDegBlockCount = Object.keys(this.blocks).length;
    
    // Low degradation should result in more blocks
    assert(lowDegBlockCount > highDegBlockCount, 
      `Low degradation should generate more blocks (${lowDegBlockCount}) than high degradation (${highDegBlockCount})`);
    
    console.log('Degradation test passed!');
  }
  
  /**
   * Test loot generation
   */
  testLootGeneration() {
    console.log('Testing loot generation...');
    
    // Test multiple large ruins to ensure chests are generated
    let foundChest = false;
    
    for (let i = 0; i < 5; i++) {
      this.blocks = {};
      const position = { x: i * 20, y: 40, z: 0 };
      const options = {
        size: 'large',
        type: 'stone',
        degradation: 0.3 // Lower degradation to ensure more complete ruins
      };
      
      this.structureGenerator.generateOceanRuins(position, options, this.blockSetter);
      
      // Check if a chest with ocean_ruin loot table was generated
      for (const key in this.blocks) {
        const block = this.blocks[key];
        if (block.type === 'chest' && block.metadata && block.metadata.loot === 'ocean_ruin') {
          foundChest = true;
          break;
        }
      }
      
      if (foundChest) break;
    }
    
    assert(foundChest, 'Should generate a chest with ocean_ruin loot table in large ruins');
    
    console.log('Loot generation test passed!');
  }
}

// Run the tests
const tester = new OceanRuinsTest();
tester.runTests();

module.exports = OceanRuinsTest; 