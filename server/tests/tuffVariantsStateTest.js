const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const BlockStateManager = require('../managers/blockStateManager');

class TuffVariantsStateTest {
  constructor() {
    this.world = new TestWorld();
    this.stateManager = new BlockStateManager();
  }

  runTests() {
    this.testBlockStatePersistence();
    this.testStateSerialization();
    this.testStateDeserialization();
    this.testStateUpdates();
    this.testStateValidation();
  }

  testBlockStatePersistence() {
    console.log('Testing block state persistence...');
    
    // Test Tuff Bricks state persistence
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Set and verify state
    placedBricks.setState('cracked', true);
    assert.strictEqual(placedBricks.getState('cracked'), true);
    
    // Verify state persistence after world save/load
    this.world.save();
    this.world.load();
    const loadedBricks = this.world.getBlock({ x: 0, y: 0, z: 0 });
    assert.strictEqual(loadedBricks.getState('cracked'), true);
  }

  testStateSerialization() {
    console.log('Testing state serialization...');
    
    // Test Tuff Brick Stairs state serialization
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Set multiple states
    placedStairs.setState('facing', 'north');
    placedStairs.setState('shape', 'straight');
    placedStairs.setState('waterlogged', true);
    
    // Serialize state
    const serialized = this.stateManager.serializeBlockState(placedStairs);
    assert.strictEqual(typeof serialized, 'string');
    assert.strictEqual(serialized.includes('facing'), true);
    assert.strictEqual(serialized.includes('shape'), true);
    assert.strictEqual(serialized.includes('waterlogged'), true);
  }

  testStateDeserialization() {
    console.log('Testing state deserialization...');
    
    // Test Tuff Brick Wall state deserialization
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Set states and serialize
    placedWall.setState('north', 'low');
    placedWall.setState('east', 'tall');
    placedWall.setState('south', 'none');
    placedWall.setState('west', 'low');
    
    const serialized = this.stateManager.serializeBlockState(placedWall);
    
    // Create new wall and deserialize state
    const newWall = new TuffBrickWallBlock();
    this.stateManager.deserializeBlockState(newWall, serialized);
    
    // Verify states
    assert.strictEqual(newWall.getState('north'), 'low');
    assert.strictEqual(newWall.getState('east'), 'tall');
    assert.strictEqual(newWall.getState('south'), 'none');
    assert.strictEqual(newWall.getState('west'), 'low');
  }

  testStateUpdates() {
    console.log('Testing state updates...');
    
    // Test Tuff Brick Slab state updates
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test state update events
    let updateCount = 0;
    placedSlab.onStateUpdate = () => updateCount++;
    
    // Update states
    placedSlab.setState('type', 'double');
    assert.strictEqual(updateCount, 1);
    
    placedSlab.setState('waterlogged', true);
    assert.strictEqual(updateCount, 2);
    
    // Verify final states
    assert.strictEqual(placedSlab.getState('type'), 'double');
    assert.strictEqual(placedSlab.getState('waterlogged'), true);
  }

  testStateValidation() {
    console.log('Testing state validation...');
    
    // Test Chiseled Tuff state validation
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test valid state
    assert.strictEqual(placedChiseled.validateState('pattern', 'zigzag'), true);
    placedChiseled.setState('pattern', 'zigzag');
    assert.strictEqual(placedChiseled.getState('pattern'), 'zigzag');
    
    // Test invalid state
    assert.strictEqual(placedChiseled.validateState('pattern', 'invalid_pattern'), false);
    placedChiseled.setState('pattern', 'invalid_pattern');
    assert.strictEqual(placedChiseled.getState('pattern'), 'zigzag'); // Should retain previous valid state
  }
}

// Run tests
const test = new TuffVariantsStateTest();
test.runTests();
console.log('All Tuff variants state tests passed!');

module.exports = TuffVariantsStateTest; 