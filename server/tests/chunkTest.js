const assert = require('assert');
const { Chunk } = require('../world/Chunk');
const { ChunkManager } = require('../world/ChunkManager');
const { World } = require('../world/World');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');

class ChunkTest {
  constructor() {
    this.world = new World();
    this.chunkManager = new ChunkManager(this.world);
  }

  runTests() {
    this.testChunkCreation();
    this.testBlockPlacement();
    this.testBlockStates();
    this.testChunkLoading();
    this.testTuffVariants();
  }

  testChunkCreation() {
    console.log('Testing chunk creation...');
    
    const chunk = this.chunkManager.createChunk(0, 0, 0);
    assert.strictEqual(chunk !== null, true, 'Chunk creation failed');
    assert.strictEqual(chunk.x, 0, 'Incorrect chunk X coordinate');
    assert.strictEqual(chunk.y, 0, 'Incorrect chunk Y coordinate');
    assert.strictEqual(chunk.z, 0, 'Incorrect chunk Z coordinate');
    assert.strictEqual(chunk.size, 16, 'Incorrect chunk size');
  }

  testBlockPlacement() {
    console.log('Testing block placement...');
    
    const chunk = this.chunkManager.createChunk(0, 0, 0);
    const block = new TuffBricksBlock();
    
    // Test valid placement
    const placed = chunk.setBlock(0, 0, 0, block);
    assert.strictEqual(placed, true, 'Block placement failed');
    assert.strictEqual(chunk.getBlock(0, 0, 0), block, 'Block not found after placement');
    
    // Test invalid placement
    const invalidPlaced = chunk.setBlock(16, 16, 16, block);
    assert.strictEqual(invalidPlaced, false, 'Invalid block placement succeeded');
  }

  testBlockStates() {
    console.log('Testing block states...');
    
    const chunk = this.chunkManager.createChunk(0, 0, 0);
    const block = new TuffBrickStairsBlock();
    
    // Test state setting
    const state = { facing: 'north', half: 'bottom' };
    const stateSet = chunk.setBlockState(0, 0, 0, state);
    assert.strictEqual(stateSet, true, 'State setting failed');
    
    // Test state retrieval
    const retrievedState = chunk.getBlockState(0, 0, 0);
    assert.deepStrictEqual(retrievedState, state, 'State retrieval failed');
  }

  testChunkLoading() {
    console.log('Testing chunk loading...');
    
    const chunk = this.chunkManager.createChunk(0, 0, 0);
    const block = new TuffBrickWallBlock();
    
    // Place block and mark as dirty
    chunk.setBlock(0, 0, 0, block);
    assert.strictEqual(chunk.isDirty, true, 'Chunk not marked as dirty');
    
    // Save chunk
    chunk.save();
    assert.strictEqual(chunk.isDirty, false, 'Chunk still marked as dirty after save');
    
    // Test loading
    const loaded = chunk.load();
    assert.strictEqual(loaded, true, 'Chunk loading failed');
  }

  testTuffVariants() {
    console.log('Testing Tuff variants in chunks...');
    
    const chunk = this.chunkManager.createChunk(0, 0, 0);
    
    // Test all Tuff variants
    const variants = [
      new TuffBricksBlock(),
      new TuffBrickSlabBlock(),
      new TuffBrickStairsBlock(),
      new TuffBrickWallBlock(),
      new ChiseledTuffBlock()
    ];
    
    variants.forEach((variant, index) => {
      const placed = chunk.setBlock(index, 0, 0, variant);
      assert.strictEqual(placed, true, `Failed to place ${variant.constructor.name}`);
      
      const retrieved = chunk.getBlock(index, 0, 0);
      assert.strictEqual(retrieved, variant, `Failed to retrieve ${variant.constructor.name}`);
      
      // Test state persistence
      const state = { variant: index };
      chunk.setBlockState(index, 0, 0, state);
      const retrievedState = chunk.getBlockState(index, 0, 0);
      assert.deepStrictEqual(retrievedState, state, `Failed to persist state for ${variant.constructor.name}`);
    });
  }
}

// Run tests
const test = new ChunkTest();
test.runTests();
console.log('All chunk tests passed!');

module.exports = ChunkTest; 