// Test runner for Breeze mob tests
const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');

// Create mocha instance
const mocha = new Mocha({
  timeout: 5000,
  color: true
});

// Add the test file
mocha.addFile(path.join(__dirname, 'breezeTest.js'));

// Run the tests
mocha.run(function(failures) {
  // Exit with non-zero status if there were failures
  process.exitCode = failures ? 1 : 0;
}).on('end', function() {
  console.log('Breeze test run complete!');
});

console.log('Running Breeze mob tests...'); 