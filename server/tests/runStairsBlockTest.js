const Mocha = require('mocha');

// Create a new Mocha instance
const mocha = new Mocha({
  timeout: 5000, // 5 second timeout
  reporter: 'spec'
});

// Add the test file
mocha.addFile('tests/stairsBlockTest.js');

// Run the tests
mocha.run((failures) => {
  if (failures > 0) {
    console.error(`${failures} test(s) failed`);
    process.exit(1);
  } else {
    console.log('All tests passed!');
    process.exit(0);
  }
}); 