/**
 * Test runner for Mace Weapon tests
 */

const path = require('path');
const Mocha = require('mocha');

// Create a new mocha instance
const mocha = new Mocha({
  reporter: 'spec'
});

// Add the test file
mocha.addFile(path.join(__dirname, 'maceTest.js'));

// Run the tests
console.log('Running Mace Weapon tests...');
mocha.run(failures => {
  process.exitCode = failures ? 1 : 0;
})
.on('end', () => {
  console.log('Mace Weapon test run complete!');
}); 