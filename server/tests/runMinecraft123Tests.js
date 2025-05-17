/**
 * Test Runner for Minecraft 1.23 Update Features
 * 
 * This script runs the test framework for all Minecraft 1.23 features.
 * As features are implemented, the tests will be populated with actual tests.
 */

const { runAllTests } = require('./minecraft123TestFramework');

console.log('Starting Minecraft 1.23 update feature tests...');
runAllTests();
console.log('All Minecraft 1.23 tests completed.'); 