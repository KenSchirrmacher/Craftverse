/**
 * Security Patches Test Runner
 * Runs the security patches test suite
 */

const { runTests } = require('./securityPatchesTest');

console.log('=== Security Patches Tests ===');
console.log('Running security patches tests...\n');

runTests()
  .then(() => {
    console.log('\nSecurity Patches Tests completed successfully');
  })
  .catch(error => {
    console.error('Error running security patches tests:', error);
    process.exit(1);
  }); 