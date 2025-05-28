/**
 * Test runner for CrafterBlock tests
 */

// Import Mocha for testing
const Mocha = require('mocha');
const path = require('path');
const mocha = new Mocha({
  reporter: 'spec',
  timeout: 5000
});

// Add test files
mocha.addFile(path.join(__dirname, 'crafterBlockComparatorTest.js'));
mocha.addFile(path.join(__dirname, 'crafterBlockRecipeTest.js'));

// Run the tests
console.log('Starting CrafterBlock tests...');
mocha.run(failures => {
  process.exitCode = failures ? 1 : 0;
}); 