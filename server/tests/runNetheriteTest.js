/**
 * Run Netherite Tests
 * Executes tests for Netherite items and crafting implementation
 */

const { runTests } = require('./netheriteTest');

try {
  console.log('Starting Netherite implementation tests...');
  const success = runTests();
  
  if (success) {
    console.log('✅ All Netherite tests passed successfully!');
  } else {
    console.log('❌ Some Netherite tests failed.');
    process.exit(1);
  }
} catch (error) {
  console.error('Error running Netherite tests:', error);
  process.exit(1);
} 