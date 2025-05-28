/**
 * Test runner for CrafterBlock Recipe Tests
 */

const Mocha = require('mocha');
const path = require('path');

// Create a new Mocha instance
const mocha = new Mocha({
  reporter: 'spec',
  timeout: 5000
});

// Add the test file
mocha.addFile(path.join(__dirname, 'crafterBlockRecipeTest.js'));

// Run the tests
mocha.run(failures => {
  process.exitCode = failures ? 1 : 0;
}); 