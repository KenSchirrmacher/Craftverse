/**
 * Test runner for Minecraft 1.23 Update Integration Tests
 * This runs all integration tests for the 1.23 Update features
 */

try {
  console.log('=== Minecraft 1.23 Update Integration Tests ===');
  console.log('Loading test suite...\n');
  
  // Check for TestBase first
  let TestBase;
  try {
    TestBase = require('./testBase');
    console.log('✓ TestBase loaded successfully');
  } catch (error) {
    console.error('✗ Error loading TestBase:', error.message);
    console.log('Creating basic TestBase for testing...');
    
    // Create a minimal TestBase if missing
    TestBase = class TestBase {
      constructor(name) {
        this.name = name;
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
      }
      
      runTest(name, testFn) {
        this.totalTests++;
        console.log(`Running test: ${name}`);
        try {
          testFn();
          console.log(`✓ Test "${name}" passed`);
          this.passedTests++;
        } catch (error) {
          console.error(`✗ Test "${name}" failed:`, error.message);
          this.failedTests++;
        }
      }
    };
  }
  
  // Load the test file
  const Minecraft123IntegrationTest = require('./minecraft123IntegrationTest');
  console.log('✓ Integration test module loaded successfully');
  
  // Set up global objects needed for testing
  global.console.debug = () => {}; // Suppress debug logs in tests
  
  // Run the tests
  async function runTests() {
    console.log('Running tests...\n');
    
    // Initialize and run the test suite
    const testSuite = new Minecraft123IntegrationTest();
    try {
      await testSuite.runTests();
      
      // Output results
      console.log('\n=== Test Summary ===');
      console.log(`Total tests: ${testSuite.totalTests}`);
      console.log(`Passed: ${testSuite.passedTests}`);
      console.log(`Failed: ${testSuite.failedTests}`);
      
      if (testSuite.failedTests === 0) {
        console.log('\n✅ All tests passed!');
        return true;
      } else {
        console.log('\n❌ Some tests failed. See details above.');
        return false;
      }
    } catch (error) {
      console.error(`\n❌ Error running tests: ${error.message}`);
      console.error(error.stack);
      return false;
    }
  }
  
  // Run the tests
  runTests().then(success => {
    if (!success) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('Fatal error during test initialization:');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
} 