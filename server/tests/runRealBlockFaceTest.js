/**
 * Real BlockFace Test Runner
 * Executes tests for the BlockFace implementation with real components
 */

console.log('=== Real BlockFace Tests ===');
console.log('Running tests for BlockFace implementation...\n');

const { runTests } = require('./realBlockFaceTest');

runTests()
  .then(() => {
    console.log('\nReal BlockFace Tests completed successfully');
  })
  .catch(error => {
    console.error('Error running Real BlockFace Tests:', error);
    process.exit(1);
  }); 