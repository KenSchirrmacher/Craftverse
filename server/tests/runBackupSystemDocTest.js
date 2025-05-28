/**
 * Backup System Documentation Test Runner
 */

const BackupSystemDocTest = require('./backupSystemDocTest');

console.log('Starting Backup System Documentation Tests...');

const test = new BackupSystemDocTest();
test.runTests().then(() => {
  console.log('Backup System Documentation Tests completed successfully');
}).catch(error => {
  console.error('Backup System Documentation Tests failed:', error);
  process.exit(1);
}); 