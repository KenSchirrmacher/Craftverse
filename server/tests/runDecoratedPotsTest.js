/**
 * Test runner for Decorated Pots Expansion
 * Part of the Minecraft 1.23 Update
 */

const DecoratedPotsTest = require('./decoratedPotsTest');

// Set up global objects needed for testing
global.console.debug = () => {}; // Suppress debug logs in tests

async function runTests() {
  console.log('=== Decorated Pots Expansion Tests ===');
  console.log('Running tests...\n');
  
  // Initialize and run the test suite
  const testSuite = new DecoratedPotsTest();
  await testSuite.runTests();
  
  // Output results
  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${testSuite.totalTests}`);
  console.log(`Passed: ${testSuite.passedTests}`);
  console.log(`Failed: ${testSuite.failedTests}`);
  
  if (testSuite.failedTests === 0) {
    console.log('\n✅ All tests passed!');
    return true;
  } else {
    console.log('\n❌ Some tests failed. See details above.');
    return false;
  }
}

// Run the tests
runTests().then(success => {
  if (!success) {
    process.exit(1);
  }
}).catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
}); 