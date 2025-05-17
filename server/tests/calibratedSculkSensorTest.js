/**
 * Tests for the CalibratedSculkSensorBlock functionality
 * Tests vibration filtering and all calibrated sculk sensor features
 */

const assert = require('assert');
const CalibratedSculkSensorBlock = require('../blocks/calibratedSculkSensorBlock');
const SculkSensorBlock = require('../blocks/sculkSensorBlock');

/**
 * Run tests for the CalibratedSculkSensorBlock
 */
function runTests() {
  console.log('Testing CalibratedSculkSensorBlock - Basic Properties');
  
  // Create test instance
  const calibratedSensor = new CalibratedSculkSensorBlock();
  
  // Test identification values
  assert.strictEqual(calibratedSensor.id, 'calibrated_sculk_sensor', 'Block ID should be correct');
  assert.strictEqual(calibratedSensor.name, 'Calibrated Sculk Sensor', 'Block name should be correct');
  
  // Test inheritance
  assert.ok(calibratedSensor instanceof SculkSensorBlock, 'Should extend SculkSensorBlock');
  
  // Test block properties - just check hardness which is in base Block class
  assert.strictEqual(calibratedSensor.hardness, 1.5, 'Hardness should be 1.5');
  
  // Test filter settings
  assert.strictEqual(calibratedSensor.filterType, 'none', 'Default filter should be none');
  assert.ok(Array.isArray(calibratedSensor.availableFilters), 'Available filters should be an array');
  assert.ok(calibratedSensor.availableFilters.includes('none'), 'Available filters should include none');
  assert.ok(calibratedSensor.availableFilters.includes('break_block'), 'Available filters should include break_block');
  
  // Test extended range
  assert.strictEqual(calibratedSensor.vibrationRadius, 12, 'Should have extended range');
  const regularSensor = new SculkSensorBlock();
  assert.ok(calibratedSensor.vibrationRadius > regularSensor.vibrationRadius, 'Range should be greater than regular sensor');
  
  console.log('Testing CalibratedSculkSensorBlock - Filter Management');
  
  // Test filter setting
  assert.strictEqual(calibratedSensor.getFilter(), 'none', 'Initial filter should be none');
  const setResult = calibratedSensor.setFilter('break_block');
  assert.strictEqual(setResult, true, 'Setting valid filter should return true');
  assert.strictEqual(calibratedSensor.getFilter(), 'break_block', 'Filter should be updated');
  
  // Test invalid filter
  const invalidResult = calibratedSensor.setFilter('invalid_type');
  assert.strictEqual(invalidResult, false, 'Setting invalid filter should return false');
  assert.strictEqual(calibratedSensor.getFilter(), 'break_block', 'Filter should remain unchanged');
  
  // Test filter cycling
  calibratedSensor.setFilter('none'); // Reset filter
  assert.strictEqual(calibratedSensor.getFilter(), 'none', 'Filter should be reset to none');
  
  // Simulate interaction
  const mockPlayer = { sendMessage: () => {} };
  calibratedSensor.interact(mockPlayer);
  assert.strictEqual(calibratedSensor.getFilter(), calibratedSensor.availableFilters[1], 'Interaction should cycle filter');
  
  calibratedSensor.interact(mockPlayer);
  assert.strictEqual(calibratedSensor.getFilter(), calibratedSensor.availableFilters[2], 'Second interaction should cycle filter again');
  
  console.log('Testing CalibratedSculkSensorBlock - Vibration Filtering');
  
  // Set position for tests
  calibratedSensor.x = 0;
  calibratedSensor.y = 0;
  calibratedSensor.z = 0;
  
  // Test unfiltered mode
  calibratedSensor.setFilter('none');
  
  const vibrationTypes = ['step', 'break_block', 'explosion'];
  
  for (const type of vibrationTypes) {
    calibratedSensor.active = false;
    calibratedSensor.redstonePower = 0;
    calibratedSensor.cooldown = 0;
    
    const vibration = {
      type: type,
      position: { x: 5, y: 0, z: 0 },
      data: {}
    };
    
    const result = calibratedSensor.handleVibration(vibration, 0);
    assert.strictEqual(result, true, `Should detect ${type} vibration with no filter`);
  }
  
  // Test filtered mode
  calibratedSensor.setFilter('break_block');
  
  // Test matching vibration type
  calibratedSensor.active = false;
  calibratedSensor.redstonePower = 0;
  calibratedSensor.cooldown = 0;
  
  const matchingVibration = {
    type: 'break_block',
    position: { x: 5, y: 0, z: 0 },
    data: {}
  };
  
  const matchResult = calibratedSensor.handleVibration(matchingVibration, 0);
  assert.strictEqual(matchResult, true, 'Should detect matching vibration type');
  assert.strictEqual(calibratedSensor.active, true, 'Should be activated by matching vibration');
  assert.strictEqual(calibratedSensor.redstonePower, calibratedSensor.maxRedstonePower, 'Should output max power');
  
  // Test non-matching vibration type
  calibratedSensor.active = false;
  calibratedSensor.redstonePower = 0;
  calibratedSensor.cooldown = 0;
  
  const nonMatchingVibration = {
    type: 'step',
    position: { x: 5, y: 0, z: 0 },
    data: {}
  };
  
  const nonMatchResult = calibratedSensor.handleVibration(nonMatchingVibration, 0);
  assert.strictEqual(nonMatchResult, false, 'Should not detect non-matching vibration type');
  assert.strictEqual(calibratedSensor.active, false, 'Should not be activated by non-matching vibration');
  
  // Test power output
  calibratedSensor.setFilter('step');
  calibratedSensor.active = false;
  calibratedSensor.redstonePower = 0;
  calibratedSensor.cooldown = 0;
  
  const stepVibration = {
    type: 'step',
    position: { x: 2, y: 0, z: 0 },
    data: {}
  };
  
  calibratedSensor.handleVibration(stepVibration, 0);
  assert.strictEqual(calibratedSensor.redstonePower, calibratedSensor.maxRedstonePower, 'Should output max power for filtered vibration');
  
  // Compare with regular sensor
  regularSensor.x = 0;
  regularSensor.y = 0;
  regularSensor.z = 0;
  regularSensor.active = false;
  regularSensor.redstonePower = 0;
  regularSensor.cooldown = 0;
  regularSensor.handleVibration(stepVibration, 0);
  
  assert.strictEqual(regularSensor.redstonePower, 1, 'Regular sensor should use normal power level');
  assert.ok(calibratedSensor.redstonePower > regularSensor.redstonePower, 'Calibrated sensor should output higher power');
  
  // Test range detection
  calibratedSensor.setFilter('break_block');
  calibratedSensor.active = false;
  calibratedSensor.redstonePower = 0;
  calibratedSensor.cooldown = 0;
  
  const distantVibration = {
    type: 'break_block',
    position: { x: 20, y: 0, z: 0 },
    data: {}
  };
  
  const distantResult = calibratedSensor.handleVibration(distantVibration, 0);
  assert.strictEqual(distantResult, false, 'Should not detect vibration outside range');
  
  // Test cooldown
  calibratedSensor.setFilter('break_block');
  calibratedSensor.active = false;
  calibratedSensor.redstonePower = 0;
  calibratedSensor.cooldown = 10;
  
  const cooldownVibration = {
    type: 'break_block',
    position: { x: 2, y: 0, z: 0 },
    data: {}
  };
  
  const cooldownResult = calibratedSensor.handleVibration(cooldownVibration, 0);
  assert.strictEqual(cooldownResult, false, 'Should ignore vibrations during cooldown');
  
  console.log('Testing CalibratedSculkSensorBlock - Serialization');
  
  // Test serialization
  const serialSensor = new CalibratedSculkSensorBlock();
  serialSensor.setFilter('explosion');
  serialSensor.active = true;
  serialSensor.redstonePower = 8;
  
  const serialized = serialSensor.toJSON();
  const deserialized = CalibratedSculkSensorBlock.fromJSON(serialized);
  
  assert.strictEqual(deserialized.filterType, 'explosion', 'Deserialized filter should match');
  assert.strictEqual(deserialized.active, true, 'Deserialized active state should match');
  assert.strictEqual(deserialized.redstonePower, 8, 'Deserialized power should match');
  
  console.log('All CalibratedSculkSensorBlock tests passed!');
}

// Export the test functions
module.exports = {
  runTests
};

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running CalibratedSculkSensorBlock Tests directly...');
  runTests();
} 