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
mocha.run(function(failures) {
  process.exitCode = failures ? 1 : 0;
  
  if (failures) {
    console.error(`${failures} tests failed.`);
  } else {
    console.log('✅ All tests passed!');
  }
}); 