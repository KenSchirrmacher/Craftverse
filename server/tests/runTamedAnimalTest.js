const TamedAnimalImprovementsTest = require('./tamedAnimalImprovementsTest');

console.log('=== Running Tamed Animal Improvements Tests ===');

const testSuite = new TamedAnimalImprovementsTest();
testSuite.runTests()
  .then(() => {
    console.log('\nTest Results:');
    console.log(`Tests run: ${testSuite.testsRun}`);
    console.log(`Tests passed: ${testSuite.testsPassed}`);
    console.log(`Tests failed: ${testSuite.testsFailed}`);
    
    if (testSuite.testsFailed === 0) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.error('\n❌ Some tests failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  }); 