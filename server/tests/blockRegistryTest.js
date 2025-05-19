const assert = require('assert');
const { BlockRegistry } = require('../blocks/blockRegistry');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariantsBlocks');

class BlockRegistryTest {
  constructor() {
    this.registry = new BlockRegistry();
  }

  runTests() {
    this.testBlockRegistration();
    this.testBlockRetrieval();
    this.testBlockValidation();
    this.testBlockProperties();
    this.testTuffVariants();
  }

  testBlockRegistration() {
    console.log('Testing block registration...');
    
    const block = new TuffBricksBlock();
    
    // Test registration
    const result = this.registry.registerBlock(block);
    assert.strictEqual(result, true, 'Block registration failed');
    assert.strictEqual(this.registry.hasBlock(block.id), true, 'Block not registered');
    
    // Test duplicate registration
    const duplicateBlock = new TuffBricksBlock();
    const duplicateResult = this.registry.registerBlock(duplicateBlock);
    assert.strictEqual(duplicateResult, true, 'Duplicate registration should overwrite');
  }

  testBlockRetrieval() {
    console.log('Testing block retrieval...');
    
    const block = new TuffBrickSlabBlock();
    this.registry.registerBlock(block);
    
    // Test retrieval
    const retrievedBlock = this.registry.getBlock(block.id);
    assert.strictEqual(retrievedBlock, block, 'Block not retrieved correctly');
    
    // Test non-existent block
    const nonExistentBlock = this.registry.getBlock('non_existent');
    assert.strictEqual(nonExistentBlock, null, 'Non-existent block not handled correctly');
  }

  testBlockValidation() {
    console.log('Testing block validation...');
    
    const block = new TuffBrickStairsBlock();
    
    // Test valid block
    const result = this.registry.registerBlock(block);
    assert.strictEqual(result, true, 'Valid block registration failed');
    
    // Test invalid block
    const invalidBlock = { type: 'invalid' };
    const invalidResult = this.registry.registerBlock(invalidBlock);
    assert.strictEqual(invalidResult, false, 'Invalid block registration not prevented');
  }

  testBlockProperties() {
    console.log('Testing block properties...');
    
    const block = new TuffBrickWallBlock();
    this.registry.registerBlock(block);
    
    // Test property setting
    block.hardness = 2.0;
    block.resistance = 6.0;
    block.requiresTool = true;
    
    const retrievedBlock = this.registry.getBlock(block.id);
    assert.strictEqual(retrievedBlock.hardness, 2.0, 'Block property not set correctly');
    assert.strictEqual(retrievedBlock.resistance, 6.0, 'Block property not set correctly');
    assert.strictEqual(retrievedBlock.requiresTool, true, 'Block property not set correctly');
  }

  testTuffVariants() {
    console.log('Testing Tuff variants in registry...');
    
    const variants = [
      new TuffBricksBlock(),
      new TuffBrickSlabBlock(),
      new TuffBrickStairsBlock(),
      new TuffBrickWallBlock(),
      new ChiseledTuffBlock()
    ];
    
    variants.forEach(block => {
      // Test registration
      const result = this.registry.registerBlock(block);
      assert.strictEqual(result, true, `Failed to register ${block.id}`);
      assert.strictEqual(this.registry.hasBlock(block.id), true, `Failed to register ${block.id}`);
      
      // Test retrieval
      const retrievedBlock = this.registry.getBlock(block.id);
      assert.strictEqual(retrievedBlock, block, `Failed to retrieve ${block.id}`);
      
      // Test properties
      block.hardness = 2.0;
      block.resistance = 6.0;
      block.requiresTool = true;
      
      const finalBlock = this.registry.getBlock(block.id);
      assert.strictEqual(finalBlock.hardness, 2.0, `Incorrect hardness for ${block.id}`);
      assert.strictEqual(finalBlock.resistance, 6.0, `Incorrect resistance for ${block.id}`);
      assert.strictEqual(finalBlock.requiresTool, true, `Incorrect requiresTool for ${block.id}`);
    });
  }
}

// Run tests
const test = new BlockRegistryTest();
test.runTests();
console.log('All block registry tests passed!');

module.exports = BlockRegistryTest; 