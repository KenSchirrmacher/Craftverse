/**
 * Runner script for the Allay tests
 * This script executes the comprehensive test suite for the Allay mob
 */

console.log('Starting test runner...');

// Import the test file
const allayTest = require('./allayTest');

console.log('Test file imported, running tests...');

// Run the tests
allayTest.runTests();

console.log('Allay test complete!'); 