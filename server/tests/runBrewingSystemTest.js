/**
 * Test Runner for BrewingSystem Functionality
 * Runs all brewing system tests and reports results
 */

const BrewingSystemTest = require('./brewingSystemTest');

async function runBrewingSystemTest() {
  console.log('🧪 Starting BrewingSystem functionality tests...\n');
  
  const test = new BrewingSystemTest();
  const success = await test.run();
  
  if (success) {
    console.log('🎉 All BrewingSystem functionality tests PASSED!');
    return true;
  } else {
    console.log('💥 Some BrewingSystem tests FAILED');
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runBrewingSystemTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error running BrewingSystem tests:', error);
      process.exit(1);
    });
}

module.exports = runBrewingSystemTest; 