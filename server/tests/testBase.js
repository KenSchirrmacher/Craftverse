/**
 * Base class for all test suites
 * Provides common functionality for running tests and reporting results
 */

class TestBase {
  /**
   * Creates a new test suite
   * @param {string} name - The name of the test suite
   */
  constructor(name) {
    this.name = name;
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.skippedTests = 0;
    
    console.log(`\n=== ${this.name} ===`);
  }
  
  /**
   * Runs a test case
   * @param {string} name - The name of the test case
   * @param {Function} testFn - The test function to run
   */
  runTest(name, testFn) {
    this.totalTests++;
    console.log(`\nRunning test: ${name}`);
    
    try {
      testFn();
      console.log(`✓ Test "${name}" passed`);
      this.passedTests++;
    } catch (error) {
      console.error(`✗ Test "${name}" failed: ${error.message}`);
      if (error.stack) {
        console.error(error.stack.split('\n').slice(1).join('\n'));
      }
      this.failedTests++;
    }
  }
  
  /**
   * Skips a test case
   * @param {string} name - The name of the test case
   * @param {string} reason - The reason for skipping
   */
  skipTest(name, reason) {
    this.totalTests++;
    this.skippedTests++;
    console.log(`⚠ Test "${name}" skipped: ${reason}`);
  }
  
  /**
   * Asserts that the condition is true
   * @param {boolean} condition - The condition to check
   * @param {string} message - The error message if the condition is false
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
  
  /**
   * Runs all tests in the suite
   * To be implemented by subclasses
   */
  async runTests() {
    throw new Error('runTests() must be implemented by subclasses');
  }
}

module.exports = TestBase; 