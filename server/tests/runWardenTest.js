/**
 * Run Warden tests
 */

const Mocha = require('mocha');
const mocha = new Mocha();

// Add the test file
mocha.addFile('server/tests/wardenTest.js');

// Run the tests
mocha.run((failures) => {
  process.exitCode = failures ? 1 : 0;
}); 