/**
 * Backup-Save Integration Test Runner
 */

const BackupSaveIntegrationTest = require('./backupSaveIntegrationTest');

console.log('Starting Backup-Save Integration Tests...');

const test = new BackupSaveIntegrationTest();
test.runTests().then(() => {
  console.log('Backup-Save Integration Tests completed successfully');
}).catch(error => {
  console.error('Backup-Save Integration Tests failed:', error);
  process.exit(1);
}); 