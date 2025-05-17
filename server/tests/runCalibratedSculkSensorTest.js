/**
 * Run Calibrated Sculk Sensor Tests
 * Test runner for the Calibrated Sculk Sensor implementation for 1.20 Update
 */

const { runTests } = require('./calibratedSculkSensorTest');

console.log('Starting Calibrated Sculk Sensor tests...');

try {
  runTests();
  console.log('✅ All Calibrated Sculk Sensor tests completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Calibrated Sculk Sensor test failed:');
  console.error(error);
  process.exit(1);
} 