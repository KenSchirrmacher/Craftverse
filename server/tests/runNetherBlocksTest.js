/**
 * Run Nether Blocks Tests
 * 
 * This script runs the tests for Nether blocks functionality.
 */

const netherBlocksTest = require('./netherBlocksTest');

console.log('Running Nether Blocks Tests...');

try {
  const result = netherBlocksTest.runTests();
  if (result) {
    console.log('All Nether Blocks Tests passed!');
  } else {
    console.log('Some Nether Blocks Tests failed.');
    process.exit(1);
  }
} catch (error) {
  console.error('Error running Nether Blocks Tests:', error);
  process.exit(1);
} 