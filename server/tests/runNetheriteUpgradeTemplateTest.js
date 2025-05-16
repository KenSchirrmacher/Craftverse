/**
 * Run Netherite Upgrade Template Tests
 * Executes tests for Netherite Upgrade Template implementation
 */

const { runTests } = require('./netheriteUpgradeTemplateTest');

console.log('Starting Netherite Upgrade Template tests...');

try {
  runTests();
  console.log('✅ All Netherite Upgrade Template tests completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Netherite Upgrade Template test failed:');
  console.error(error);
  process.exit(1);
} 