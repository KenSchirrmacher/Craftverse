/**
 * Run Nether Update Tests
 * Executes tests for all Nether Update features
 */

const { runTests } = require('./netherUpdateTest');

try {
  console.log('Starting Nether Update implementation tests...');
  const success = runTests();
  
  if (success) {
    console.log('✅ All Nether Update tests passed successfully!');
    console.log('The Nether Update implementation is complete!');
  } else {
    console.log('❌ Some Nether Update tests failed.');
    process.exit(1);
  }
} catch (error) {
  console.error('Error running Nether Update tests:', error);
  process.exit(1);
} 