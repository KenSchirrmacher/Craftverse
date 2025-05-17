/**
 * Minecraft 1.23 Test Runner
 * Run tests for all Minecraft 1.23 features
 */

const CopperGolemTest = require('./copperGolemTest');
const TrailblazerTest = require('./trailblazerTest');
const DecoratedPotsTest = require('./decoratedPotsTest');
const TamedAnimalImprovementsTest = require('./tamedAnimalImprovementsTest');
const AncientSeedsTest = require('./ancientSeedsTest');

// Results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  features: {}
};

// Helper to run tests
function runFeatureTests(featureName, TestClass) {
  console.log(`\n=== Running ${featureName} Tests ===\n`);
  
  try {
    const tester = new TestClass();
    const results = tester.runTests ? tester.runTests() : { total: 0, passed: 0, failed: 0, skipped: 0 };
    
    testResults.features[featureName] = results;
    testResults.total += results.total;
    testResults.passed += results.passed;
    testResults.failed += results.failed;
    testResults.skipped += results.skipped;
    
    console.log(`\n=== ${featureName} Tests Complete ===\n`);
    
    return results.failed === 0;
  } catch (error) {
    console.error(`Error running ${featureName} tests:`, error);
    testResults.features[featureName] = { total: 1, passed: 0, failed: 1, skipped: 0, error: error.message };
    testResults.total += 1;
    testResults.failed += 1;
    
    return false;
  }
}

// Run tests for each feature
let allTestsPassed = true;

// 1. Copper Golem
try {
  const copperGolemTestsPassed = runFeatureTests('Copper Golem', CopperGolemTest);
  allTestsPassed = allTestsPassed && copperGolemTestsPassed;
} catch (error) {
  console.error('Failed to load Copper Golem tests:', error);
  testResults.features['Copper Golem'] = { total: 1, passed: 0, failed: 1, skipped: 0, error: error.message };
  testResults.total += 1;
  testResults.failed += 1;
  allTestsPassed = false;
}

// 2. Trailblazer Villager Profession
try {
  const trailblazerTestsPassed = runFeatureTests('Trailblazer Villager', TrailblazerTest);
  allTestsPassed = allTestsPassed && trailblazerTestsPassed;
} catch (error) {
  console.error('Failed to load Trailblazer Villager tests:', error);
  testResults.features['Trailblazer Villager'] = { total: 1, passed: 0, failed: 1, skipped: 0, error: error.message };
  testResults.total += 1;
  testResults.failed += 1;
  allTestsPassed = false;
}

// 3. Decorated Pots Expansion
try {
  const decoratedPotsTestsPassed = runFeatureTests('Decorated Pots Expansion', DecoratedPotsTest);
  allTestsPassed = allTestsPassed && decoratedPotsTestsPassed;
} catch (error) {
  console.error('Failed to load Decorated Pots tests:', error);
  testResults.features['Decorated Pots Expansion'] = { total: 1, passed: 0, failed: 1, skipped: 0, error: error.message };
  testResults.total += 1;
  testResults.failed += 1;
  allTestsPassed = false;
}

// 4. Tamed Animal Improvements
try {
  const tamedAnimalTestsPassed = runFeatureTests('Tamed Animal Improvements', TamedAnimalImprovementsTest);
  allTestsPassed = allTestsPassed && tamedAnimalTestsPassed;
} catch (error) {
  console.error('Failed to load Tamed Animal Improvements tests:', error);
  testResults.features['Tamed Animal Improvements'] = { total: 1, passed: 0, failed: 1, skipped: 0, error: error.message };
  testResults.total += 1;
  testResults.failed += 1;
  allTestsPassed = false;
}

// 5. Ancient Seeds
try {
  const ancientSeedsTestsPassed = runFeatureTests('Ancient Seeds', AncientSeedsTest);
  allTestsPassed = allTestsPassed && ancientSeedsTestsPassed;
} catch (error) {
  console.error('Failed to load Ancient Seeds tests:', error);
  testResults.features['Ancient Seeds'] = { total: 1, passed: 0, failed: 1, skipped: 0, error: error.message };
  testResults.total += 1;
  testResults.failed += 1;
  allTestsPassed = false;
}

// Print summary
console.log('\n=== Minecraft 1.23 Test Summary ===\n');
console.log(`Total Tests: ${testResults.total}`);
console.log(`Passed: ${testResults.passed}`);
console.log(`Failed: ${testResults.failed}`);
console.log(`Skipped: ${testResults.skipped}`);

// Feature breakdown
console.log('\nFeature Status:');
for (const [feature, results] of Object.entries(testResults.features)) {
  const status = results.failed === 0 ? '✓ PASS' : '✗ FAIL';
  console.log(`${feature}: ${status} (${results.passed}/${results.total} tests passed)`);
}

// Exit with appropriate code
process.exit(allTestsPassed ? 0 : 1); 