/**
 * Run Boat with Chest tests
 */
try {
  console.log('Loading boat with chest test module...');
  const runBoatWithChestTests = require('./boatWithChestTest');

  console.log('Starting Boat with Chest test...');
  runBoatWithChestTests();
  console.log('Boat with Chest test complete!');
} catch (error) {
  console.error('Error running boat with chest tests:', error);
} 