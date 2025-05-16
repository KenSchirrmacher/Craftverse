/**
 * Test runner for Hanging Signs feature
 */

// Use Mocha to run the tests
const Mocha = require('mocha');
const mocha = new Mocha();

// Add the test file
mocha.addFile('./tests/hangingSignsTest.js');

// Run the tests
mocha.run(function(failures) {
  process.exitCode = failures ? 1 : 0;
  
  if (failures === 0) {
    console.log('Hanging Signs tests completed successfully!');
  } else {
    console.error(`Hanging Signs tests failed with ${failures} failure(s).`);
  }
}); 