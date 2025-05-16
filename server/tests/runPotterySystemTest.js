/**
 * Test runner for Pottery System feature
 */

// Use Mocha to run the tests
const Mocha = require('mocha');
const mocha = new Mocha();

// Add the test file
mocha.addFile('./tests/potterySystemTest.js');

// Run the tests
mocha.run(function(failures) {
  process.exitCode = failures ? 1 : 0;
  
  if (failures === 0) {
    console.log('Pottery System tests completed successfully!');
  }
}); 