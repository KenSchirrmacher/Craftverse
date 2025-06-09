/**
 * Test runner for BrewingSystem functionality test
 */

const BrewingSystemTest = require('./brewingSystemTest');

async function runBrewingSystemTest() {
  console.log('='.repeat(60));
  console.log('🧪 CRAFTVERSE BREWING SYSTEM FUNCTIONALITY TEST');
  console.log('='.repeat(60));
  
  const test = new BrewingSystemTest();
  
  try {
    const success = await test.run();
    
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('🎉 BREWING SYSTEM FUNCTIONALITY TEST SUITE PASSED! ✅');
      console.log('');
      console.log('🧪 Brewing System is fully operational!');
      console.log('✓ BrewingManager methods working correctly');
      console.log('✓ activeBrewingStands property functional');
      console.log('✓ Brewing stand registration working');
      console.log('✓ Progress calculation operational');
      console.log('✓ BrewingSystem integration successful');
      console.log('✓ Save/Load functionality working');
      console.log('✓ Item slot management operational');
      console.log('✓ No mock implementations detected');
      console.log('');
      console.log('🚀 BrewingSystem ready for production use!');
      process.exit(0);
    } else {
      console.log('❌ BREWING SYSTEM FUNCTIONALITY TEST SUITE FAILED');
      console.log('');
      console.log('Some brewing system features are not working correctly.');
      console.log('Please check the test output above for details.');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test runner error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runBrewingSystemTest();
}

module.exports = runBrewingSystemTest; 