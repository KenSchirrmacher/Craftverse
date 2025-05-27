/**
 * Project Documentation Test Runner
 * Runs the project documentation test suite
 */

const { runTests } = require('./projectDocumentationTest');

console.log('=== Project Documentation Tests ===');
console.log('Running project documentation tests...\n');

runTests()
  .then(() => {
    console.log('\nProject Documentation Tests completed successfully');
  })
  .catch(error => {
    console.error('Error running project documentation tests:', error);
    process.exit(1);
  }); 