const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { ErrorHandler } = require('../systems/errorHandler');
const { RecoveryManager } = require('../systems/recoveryManager');
const { ValidationManager } = require('../systems/validationManager');

class TuffVariantsErrorHandlingTest {
  constructor() {
    this.world = new TestWorld();
    this.errorHandler = new ErrorHandler();
    this.recoveryManager = new RecoveryManager();
    this.validationManager = new ValidationManager();
  }

  runTests() {
    this.testInvalidStateRecovery();
    this.testCorruptedDataHandling();
    this.testValidationErrors();
    this.testRecoveryMechanisms();
    this.testErrorPropagation();
  }

  testInvalidStateRecovery() {
    console.log('Testing invalid state recovery...');
    
    // Test Tuff Bricks invalid state recovery
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Simulate invalid state
    placedBricks.setState('invalid_state', true);
    
    // Attempt recovery
    const recovered = this.recoveryManager.recoverBlockState(placedBricks);
    
    // Verify recovery
    assert.strictEqual(recovered !== null, true, 'Recovery failed');
    assert.strictEqual(recovered.getState('invalid_state'), undefined, 'Invalid state not removed');
    assert.strictEqual(recovered.isValid(), true, 'Block not in valid state after recovery');
  }

  testCorruptedDataHandling() {
    console.log('Testing corrupted data handling...');
    
    // Test Tuff Brick Wall corrupted data handling
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Simulate corrupted data
    const corruptedData = { type: 'corrupted', position: { x: 'invalid', y: 0, z: 0 } };
    
    // Attempt to handle corrupted data
    const handled = this.errorHandler.handleCorruptedData(placedWall, corruptedData);
    
    // Verify handling
    assert.strictEqual(handled !== null, true, 'Corrupted data handling failed');
    assert.strictEqual(handled.position.x === 0, true, 'Position not reset to default');
    assert.strictEqual(handled.isValid(), true, 'Block not in valid state after handling');
  }

  testValidationErrors() {
    console.log('Testing validation errors...');
    
    // Test Tuff Brick Stairs validation errors
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Simulate validation error
    placedStairs.setState('facing', 'invalid_direction');
    
    // Validate and handle errors
    const validationResult = this.validationManager.validateBlock(placedStairs);
    const handled = this.errorHandler.handleValidationError(placedStairs, validationResult);
    
    // Verify validation handling
    assert.strictEqual(handled !== null, true, 'Validation error handling failed');
    assert.strictEqual(handled.getState('facing') === 'north', true, 'Invalid state not reset to default');
    assert.strictEqual(handled.isValid(), true, 'Block not in valid state after handling');
  }

  testRecoveryMechanisms() {
    console.log('Testing recovery mechanisms...');
    
    // Test Chiseled Tuff recovery mechanisms
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Simulate multiple errors
    placedChiseled.setState('invalid_state1', true);
    placedChiseled.setState('invalid_state2', true);
    placedChiseled.position = { x: 'invalid', y: 'invalid', z: 'invalid' };
    
    // Attempt recovery
    const recovered = this.recoveryManager.recoverBlock(placedChiseled);
    
    // Verify recovery
    assert.strictEqual(recovered !== null, true, 'Recovery failed');
    assert.strictEqual(recovered.getState('invalid_state1'), undefined, 'Invalid state 1 not removed');
    assert.strictEqual(recovered.getState('invalid_state2'), undefined, 'Invalid state 2 not removed');
    assert.strictEqual(recovered.position.x === 0, true, 'Position not reset to default');
    assert.strictEqual(recovered.isValid(), true, 'Block not in valid state after recovery');
  }

  testErrorPropagation() {
    console.log('Testing error propagation...');
    
    // Test Tuff Brick Slab error propagation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Simulate error in dependent systems
    const error = new Error('Test error');
    placedSlab.triggerError(error);
    
    // Verify error propagation
    const propagated = this.errorHandler.handlePropagatedError(placedSlab, error);
    assert.strictEqual(propagated !== null, true, 'Error propagation handling failed');
    assert.strictEqual(propagated.isValid(), true, 'Block not in valid state after error handling');
    assert.strictEqual(this.errorHandler.getErrorCount() > 0, true, 'Error not logged');
  }
}

// Run tests
const test = new TuffVariantsErrorHandlingTest();
test.runTests();
console.log('All Tuff variants error handling tests passed!');

module.exports = TuffVariantsErrorHandlingTest; 