/**
 * Test runner for gameplay functionality test
 */

const GameplayTest = require('./gameplayTest');

async function runGameplayTest() {
  console.log('='.repeat(60));
  console.log('🎮 CRAFTVERSE GAMEPLAY FUNCTIONALITY TEST');
  console.log('='.repeat(60));
  
  const test = new GameplayTest();
  
  try {
    const success = await test.run();
    
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('🎉 GAMEPLAY FUNCTIONALITY TEST SUITE PASSED! ✅');
      console.log('');
      console.log('🎮 Game is ready for player interaction!');
      console.log('✓ Server starts successfully on port 3000');
      console.log('✓ Player movement coordinates update correctly');
      console.log('✓ Click interactions work properly');
      console.log('✓ Direction keys (WASD) function correctly');
      console.log('✓ All coordinate validations pass');
      console.log('');
      console.log('🚀 Ready to launch the game!');
      process.exit(0);
    } else {
      console.log('❌ GAMEPLAY FUNCTIONALITY TEST SUITE FAILED');
      console.log('');
      console.log('Some gameplay features are not working correctly.');
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
  runGameplayTest();
}

module.exports = runGameplayTest; 