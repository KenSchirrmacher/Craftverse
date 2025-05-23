const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { blockRegistry } = require('../blocks/blockRegistry');
const serializationManager = require('../systems/serializationManager');
const dataManager = require('../systems/dataManager');
const blockStateManager = require('../systems/blockStateManager');

class TuffVariantsSerializationTest {
  constructor() {
    this.world = new TestWorld();
    this.serializationManager = serializationManager;
    this.dataManager = dataManager;
    this.blockStateManager = blockStateManager;
    this.blockRegistry = blockRegistry;
    
    // Register blocks before testing
    this.registerBlocks();
  }

  registerBlocks() {
    // Create and register block instances
    const chiseledTuff = new ChiseledTuffBlock();
    const tuffBricks = new TuffBricksBlock();
    const tuffBrickSlab = new TuffBrickSlabBlock();
    const tuffBrickStairs = new TuffBrickStairsBlock();
    const tuffBrickWall = new TuffBrickWallBlock();

    // Register blocks with their correct types
    this.blockRegistry.registerBlock(chiseledTuff);
    this.blockRegistry.registerBlock(tuffBricks);
    this.blockRegistry.registerBlock(tuffBrickSlab);
    this.blockRegistry.registerBlock(tuffBrickStairs);
    this.blockRegistry.registerBlock(tuffBrickWall);
  }

  runTests() {
    this.testBlockSerialization();
    this.testStatePersistence();
    this.testDataMigration();
    this.testVersionCompatibility();
    this.testCompression();
  }

  testBlockSerialization() {
    console.log('Testing block serialization...');
    
    // First verify the block is registered
    const registeredBlock = this.blockRegistry.getBlock('tuff_bricks');
    assert(registeredBlock, 'Tuff Bricks block not found in registry');
    
    // Create a new instance for testing
    const bricks = new TuffBricksBlock();
    assert(bricks instanceof TuffBricksBlock, 'Failed to create TuffBricksBlock instance');
    
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    assert(placedBricks, 'Failed to place Tuff Bricks block');
    
    const serializedData = this.serializationManager.serializeBlock(placedBricks);
    const deserializedBlock = this.serializationManager.deserializeBlock(serializedData);
    
    // Debug output
    console.log('Original block:', placedBricks);
    console.log('Deserialized block:', deserializedBlock);
    
    // Verify serialization
    assert.strictEqual(deserializedBlock.id, placedBricks.id, 'Block ID mismatch after serialization');
    assert.strictEqual(deserializedBlock.type, placedBricks.type, 'Block type mismatch after serialization');
    assert.deepStrictEqual(deserializedBlock.position, placedBricks.position, 'Position mismatch after serialization');
    assert.deepStrictEqual(deserializedBlock.properties, placedBricks.properties, 'Properties mismatch after serialization');
    assert.deepStrictEqual(deserializedBlock.metadata, placedBricks.metadata, 'Metadata mismatch after serialization');
  }

  testStatePersistence() {
    console.log('Testing state persistence...');
    
    // Create a new instance for testing
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    placedWall.setState('north', true);
    placedWall.setState('east', true);
    
    const stateData = this.blockStateManager.saveBlockState(placedWall);
    const restoredWall = new TuffBrickWallBlock();
    this.blockStateManager.loadBlockState(restoredWall, stateData);
    
    // Verify state persistence
    assert.strictEqual(restoredWall.getState('north'), true, 'North state not persisted');
    assert.strictEqual(restoredWall.getState('east'), true, 'East state not persisted');
  }

  testDataMigration() {
    console.log('Testing data migration...');
    
    // Create a new instance for testing
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    const oldFormatData = this.serializationManager.serializeBlock(placedStairs, 'v1');
    const migratedData = this.dataManager.migrateBlockData(oldFormatData, 'v1', 'v2');
    const migratedBlock = this.serializationManager.deserializeBlock(migratedData);
    
    // Verify data migration
    assert.strictEqual(migratedBlock !== null, true, 'Migration failed');
    assert.strictEqual(migratedBlock.version === 'v2', true, 'Version not updated');
  }

  testVersionCompatibility() {
    console.log('Testing version compatibility...');
    
    // Create a new instance for testing
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    const v1Data = this.serializationManager.serializeBlock(placedChiseled, 'v1');
    const v2Data = this.serializationManager.serializeBlock(placedChiseled, 'v2');
    
    const v1Block = this.serializationManager.deserializeBlock(v1Data);
    const v2Block = this.serializationManager.deserializeBlock(v2Data);
    
    // Verify version compatibility
    assert.strictEqual(v1Block !== null, true, 'V1 deserialization failed');
    assert.strictEqual(v2Block !== null, true, 'V2 deserialization failed');
    assert.strictEqual(v1Block.type === v2Block.type, true, 'Type mismatch between versions');
  }

  testCompression() {
    console.log('Testing data compression...');
    
    // Create a new instance for testing
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    const uncompressedData = this.serializationManager.serializeBlock(placedSlab);
    const compressedData = this.dataManager.compressBlockData(uncompressedData);
    const decompressedData = this.dataManager.decompressBlockData(compressedData);
    const restoredBlock = this.serializationManager.deserializeBlock(decompressedData);
    
    // Verify compression
    assert.strictEqual(compressedData.length < uncompressedData.length, true, 'Compression not effective');
    assert.strictEqual(restoredBlock !== null, true, 'Decompression failed');
    assert.strictEqual(restoredBlock.type === placedSlab.type, true, 'Block type mismatch after compression');
  }
}

// Run tests
const test = new TuffVariantsSerializationTest();
test.runTests();
console.log('All Tuff variants serialization tests passed!');

module.exports = TuffVariantsSerializationTest; 