/**
 * Test runner for CrafterBlock real implementation tests
 */

// Import Mocha for testing
const Mocha = require('mocha');
const mocha = new Mocha({
  reporter: 'spec',
  timeout: 5000
});

console.log('Starting CrafterBlock real implementation tests...');

// Add the test file
mocha.addFile('./server/tests/crafterBlockRealTest.js');

// Run the tests
mocha.run(failures => {
  process.exitCode = failures ? 1 : 0;  // exit with appropriate code
  if (failures) {
    console.error(`❌ ${failures} tests failed.`);
  } else {
    console.log('✅ All tests passed!');
  }
}); 