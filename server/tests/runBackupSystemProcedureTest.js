/**
 * Backup System Procedure Test Runner
 */

const BackupSystemProcedureTest = require('./backupSystemProcedureTest');

console.log('Starting Backup System Procedure Tests...');

const test = new BackupSystemProcedureTest();
test.runTests().then(() => {
  console.log('Backup System Procedure Tests completed successfully');
}).catch(error => {
  console.error('Backup System Procedure Tests failed:', error);
  process.exit(1);
}); 