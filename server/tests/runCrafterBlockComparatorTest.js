/**
 * Test runner for CrafterBlock Comparator Tests
 */

const Mocha = require('mocha');
const path = require('path');

// Create a new Mocha instance
const mocha = new Mocha();

// Add the test file
mocha.addFile(path.join(__dirname, 'crafterBlockComparatorTest.js'));

// Run the tests
mocha.run(failures => {
  process.exitCode = failures ? 1 : 0;
}); 