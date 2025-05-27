/**
 * Test runner for Test Infrastructure Tests
 * Executes tests for the core test infrastructure components
 */

const { runTests } = require('./testInfrastructureTest');

console.log('=== Test Infrastructure Tests ===');
console.log('Running tests for core test infrastructure components...\n');

runTests().then(() => {
  console.log('\nTest Infrastructure Tests completed.');
}).catch(error => {
  console.error('Error running Test Infrastructure Tests:', error);
  process.exit(1);
}); 