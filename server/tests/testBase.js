/**
 * Base class for all test suites
 */
class TestBase {
  /**
   * Create a new test suite
   * @param {string} name - Name of the test suite
   */
  constructor(name) {
    this.name = name;
    this.testsRun = 0;
    this.testsPassed = 0;
    this.testsFailed = 0;
    this.currentTest = '';
    
    // Properties for test result reporting
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  /**
   * Run a single test
   * @param {string} testName - Name of the test
   * @param {Function} testFn - Test function
   */
  runTest(testName, testFn) {
    this.testsRun++;
    this.totalTests++;
    this.currentTest = testName;
    
    console.log(`Running test: ${testName}`);
    
    try {
      testFn();
      this.testsPassed++;
      this.passedTests++;
      console.log(`  ✅ Passed`);
    } catch (error) {
      this.testsFailed++;
      this.failedTests++;
      console.error(`  ❌ Failed: ${error.message}`);
      console.error(`    ${error.stack.split('\n').slice(1, 3).join('\n    ')}`);
    }
  }

  /**
   * Run all tests in the suite
   * Should be implemented by subclasses
   */
  async runTests() {
    throw new Error('runTests() must be implemented by subclass');
  }
}

module.exports = TestBase; 