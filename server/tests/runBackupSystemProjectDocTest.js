/**
 * Backup System Project Documentation Test Runner
 */

const BackupSystemProjectDocTest = require('./backupSystemProjectDocTest');

console.log('Starting Backup System Project Documentation Tests...');

const test = new BackupSystemProjectDocTest();
test.runTests().then(() => {
  console.log('Backup System Project Documentation Tests completed successfully');
}).catch(error => {
  console.error('Backup System Project Documentation Tests failed:', error);
  process.exit(1);
}); 