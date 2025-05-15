/**
 * Run Ancient City structure tests
 */

const { testAncientCityGeneration } = require('./ancientCityTest');

console.log('============================================');
console.log('Running Ancient City Structure Tests');
console.log('============================================');

try {
  const result = testAncientCityGeneration();
  
  if (result) {
    console.log('✅ Ancient City tests PASSED');
  } else {
    console.log('❌ Ancient City tests FAILED');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Ancient City tests FAILED with error:');
  console.error(error);
  process.exit(1);
}

console.log('============================================'); 