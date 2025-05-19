/**
 * Run Wind Charge Chain Reaction Test
 * Simple runner for Wind Charge chain reaction tests
 * Part of the Minecraft 1.24 Update (Trail Tales)
 */

const { runTests } = require('./windChargeChainReactionTest');

console.log('==========================================');
console.log('Wind Charge Chain Reaction Test Runner');
console.log('==========================================');

try {
  runTests();
  console.log('==========================================');
  console.log('Chain Reaction Tests Completed Successfully');
  console.log('==========================================');
} catch (error) {
  console.error('==========================================');
  console.error('Chain Reaction Tests Failed:');
  console.error(error);
  console.error('==========================================');
  process.exit(1);
} 