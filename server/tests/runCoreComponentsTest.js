/**
 * Core Components Test Runner
 * Executes tests for core block and smithing components
 */

console.log('Starting Core Components Tests...');

const { runTests } = require('./coreComponentsTest');

runTests()
  .then(() => {
    console.log('Core Components Tests completed successfully');
  })
  .catch(error => {
    console.error('Error running Core Components Tests:', error);
    process.exit(1);
  }); 