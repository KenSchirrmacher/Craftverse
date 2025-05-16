/**
 * Test runner for Armor Trims feature
 */

// Use Mocha to run the tests
const Mocha = require('mocha');
const mocha = new Mocha();

// Add the test file
mocha.addFile('./tests/armorTrimsTest.js');

// Run the tests
mocha.run(function(failures) {
  process.exitCode = failures ? 1 : 0;
  
  if (failures === 0) {
    console.log('Armor Trims tests completed successfully!');
  }
}); 