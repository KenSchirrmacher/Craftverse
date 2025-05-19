const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { BlockState } = require('../blocks/blockState');

class TuffVariantsStateTest {
  constructor() {
    this.world = new TestWorld();
  }

  runTests() {
    this.testStateTransitions();
    this.testMetadataPersistence();
    this.testStateValidation();
    this.testStateSerialization();
    this.testStateDeserialization();
  }

  testStateTransitions() {
    console.log('Testing state transitions...');
    
    // Test Tuff Bricks state transitions
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test initial state
    assert.strictEqual(placedBricks.getState(), BlockState.SOLID);
    
    // Test state transition
    placedBricks.setState(BlockState.BREAKING);
    assert.strictEqual(placedBricks.getState(), BlockState.BREAKING);
    
    // Test invalid state transition
    assert.throws(() => {
      placedBricks.setState('INVALID_STATE');
    });
  }

  testMetadataPersistence() {
    console.log('Testing metadata persistence...');
    
    // Test Chiseled Tuff metadata
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Set metadata
    placedChiseled.setMetadata('customData', { value: 42 });
    
    // Test metadata persistence
    const metadata = placedChiseled.getMetadata('customData');
    assert.strictEqual(metadata.value, 42);
    
    // Test metadata update
    placedChiseled.setMetadata('customData', { value: 43 });
    const updatedMetadata = placedChiseled.getMetadata('customData');
    assert.strictEqual(updatedMetadata.value, 43);
  }

  testStateValidation() {
    console.log('Testing state validation...');
    
    // Test Tuff Brick Stairs state validation
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test valid state
    assert.strictEqual(placedStairs.isValidState(BlockState.SOLID), true);
    
    // Test invalid state
    assert.strictEqual(placedStairs.isValidState('INVALID_STATE'), false);
    
    // Test state constraints
    assert.strictEqual(placedStairs.canTransitionTo(BlockState.BREAKING), true);
    assert.strictEqual(placedStairs.canTransitionTo('INVALID_STATE'), false);
  }

  testStateSerialization() {
    console.log('Testing state serialization...');
    
    // Test Tuff Brick Wall state serialization
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Set state and metadata
    placedWall.setState(BlockState.SOLID);
    placedWall.setMetadata('wallData', { height: 3 });
    
    // Test serialization
    const serialized = placedWall.serializeState();
    assert.strictEqual(typeof serialized, 'string');
    assert.strictEqual(serialized.includes('"state":"SOLID"'), true);
    assert.strictEqual(serialized.includes('"height":3'), true);
  }

  testStateDeserialization() {
    console.log('Testing state deserialization...');
    
    // Test Tuff Brick Slab state deserialization
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create serialized state
    const serializedState = '{"state":"SOLID","metadata":{"slabData":{"type":"bottom"}}}';
    
    // Test deserialization
    placedSlab.deserializeState(serializedState);
    assert.strictEqual(placedSlab.getState(), BlockState.SOLID);
    assert.strictEqual(placedSlab.getMetadata('slabData').type, 'bottom');
    
    // Test invalid deserialization
    assert.throws(() => {
      placedSlab.deserializeState('invalid json');
    });
  }
}

// Run tests
const test = new TuffVariantsStateTest();
test.runTests();
console.log('All Tuff variants state tests passed!');

module.exports = TuffVariantsStateTest; 