/**
 * Server Backup Integration Test Runner
 */

const ServerBackupIntegrationTest = require('./serverBackupIntegrationTest');

console.log('Starting Server Backup Integration Tests...');

const test = new ServerBackupIntegrationTest();
test.runTests().then(() => {
  console.log('Server Backup Integration Tests completed successfully');
}).catch(error => {
  console.error('Server Backup Integration Tests failed:', error);
  process.exit(1);
}); 