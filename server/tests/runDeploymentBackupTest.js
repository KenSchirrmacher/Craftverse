/**
 * Deployment Backup Test Runner
 * Runs the deployment backup test suite
 */

const { runTests } = require('./deploymentBackupTest');

console.log('Starting Deployment Backup Tests...');

runTests()
  .then(() => {
    console.log('Deployment Backup Tests completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Deployment Backup Tests failed:', error);
    process.exit(1);
  }); 