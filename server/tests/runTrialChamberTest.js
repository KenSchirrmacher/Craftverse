/**
 * Test runner for Trial Chamber tests
 */

// Import Mocha for testing
const Mocha = require('mocha');
const mocha = new Mocha({
  reporter: 'spec',
  timeout: 5000
});

console.log('Starting Trial Chamber tests...');

// Add the test file
mocha.addFile('tests/trialChamberTest.js');

// Run the tests
mocha.run(failures => {
  if (failures > 0) {
    console.error(`${failures} test(s) failed`);
    process.exit(1);
  } else {
    console.log('All tests passed!');
    process.exit(0);
  }
}); 