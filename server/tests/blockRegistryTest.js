/**
 * Tests for Block Registry
 * Verifies the functionality of the block registry
 */

const assert = require('assert');
const BlockRegistry = require('../registry/blockRegistry');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');

class BlockRegistryTest {
  constructor() {
    this.registry = BlockRegistry.getInstance();
  }

  runTests() {
    this.testRegistration();
    this.testRetrieval();
    this.testCreation();
    this.testListing();
    this.testTuffVariants();
  }

  testRegistration() {
    console.log('Testing block registration...');
    
    const block = new TuffBricksBlock();
    this.registry.register('tuff_bricks', block);
    assert.strictEqual(this.registry.has('tuff_bricks'), true);
  }

  testRetrieval() {
    console.log('Testing block retrieval...');
    
    const block = this.registry.get('tuff_bricks');
    assert.strictEqual(block !== undefined, true);
    assert.strictEqual(block instanceof TuffBricksBlock, true);
  }

  testCreation() {
    console.log('Testing block creation...');
    
    const block = this.registry.create('tuff_bricks', 0, 0, 0);
    assert.strictEqual(block !== undefined, true);
    assert.strictEqual(block instanceof TuffBricksBlock, true);
    assert.strictEqual(block.x, 0);
    assert.strictEqual(block.y, 0);
    assert.strictEqual(block.z, 0);
  }

  testListing() {
    console.log('Testing block listing...');
    
    const blocks = this.registry.list();
    assert.strictEqual(Array.isArray(blocks), true);
    assert.strictEqual(blocks.includes('tuff_bricks'), true);
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
      this.registry.register(block.id, block);
      assert.strictEqual(this.registry.has(block.id), true, `Failed to register ${block.id}`);
      
      // Test retrieval
      const retrievedBlock = this.registry.get(block.id);
      assert.strictEqual(retrievedBlock, block, `Failed to retrieve ${block.id}`);
      
      // Test properties
      block.hardness = 2.0;
      block.resistance = 6.0;
      block.requiresTool = true;
      
      const finalBlock = this.registry.get(block.id);
      assert.strictEqual(finalBlock.hardness, 2.0, `Incorrect hardness for ${block.id}`);
      assert.strictEqual(finalBlock.resistance, 6.0, `Incorrect resistance for ${block.id}`);
      assert.strictEqual(finalBlock.requiresTool, true, `Incorrect requiresTool for ${block.id}`);
    });
  }
}

module.exports = BlockRegistryTest; 