/**
 * Run Ocean Monument Tests
 * 
 * This script runs the tests for ocean monument functionality.
 */

const oceanMonumentTest = require('./oceanMonumentTest');

console.log('Running Ocean Monument Tests...');

try {
  oceanMonumentTest.runTests();
  console.log('All Ocean Monument Tests completed!');
} catch (error) {
  console.error('Error running Ocean Monument Tests:', error);
  process.exit(1);
} 