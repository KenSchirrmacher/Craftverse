/**
 * Test Runner for Minecraft 1.24 Update (Trail Tales)
 * Runs the test framework for all or specific features
 */

const Minecraft124TestFramework = require('./minecraft124TestFramework');

/**
 * Parse command line arguments to get test suite names
 * @returns {Array|null} - Array of suite names or null for all
 */
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    return null; // Run all tests
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node runMinecraft124Tests.js [suite1] [suite2] ...');
    console.log('Available suites:');
    console.log('  windChargeImprovements - Wind Charge Improvements tests');
    console.log('  potteryPatterns - Pottery Patterns tests');
    console.log('  crafterEnhancements - Crafter Enhancements tests');
    console.log('  trailRuins - Trail Ruins tests');
    console.log('  vaultPortal - Vault Portal tests');
    console.log('\nOptions:');
    console.log('  --help, -h - Show this help message');
    process.exit(0);
  }
  
  return args;
}

/**
 * Run the tests
 */
async function runTests() {
  console.log('=== Minecraft 1.24 Update (Trail Tales) Tests ===');
  
  const suites = parseArgs();
  if (suites) {
    console.log(`Running specific test suites: ${suites.join(', ')}`);
  } else {
    console.log('Running all test suites');
  }
  
  const framework = new Minecraft124TestFramework();
  
  try {
    const results = await framework.runTests(suites);
    framework.printSummary(results);
    
    if (results.failedTests > 0 || Object.values(results.suiteResults).some(r => r.error)) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests }; 