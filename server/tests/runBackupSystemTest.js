/**
 * Backup System Test Runner
 * Runs the backup system test suite
 */

const { runTests } = require('./backupSystemTest');

console.log('Starting Backup System Tests...');

runTests()
  .then(() => {
    console.log('Backup System Tests completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Backup System Tests failed:', error);
    process.exit(1);
  }); 