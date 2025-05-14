/**
 * Run Zoglin Tests
 * 
 * This script runs the tests for Zoglin functionality.
 */

const zoglinTest = require('./zoglinTest');

console.log('Running Zoglin Tests...');

try {
  const result = zoglinTest.runTests();
  if (result) {
    console.log('All Zoglin Tests passed!');
  } else {
    console.log('Some Zoglin Tests failed.');
    process.exit(1);
  }
} catch (error) {
  console.error('Error running Zoglin Tests:', error);
  process.exit(1);
} 