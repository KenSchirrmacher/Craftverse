/**
 * Backup System Test Runner
 * Runs the backup system test suite
 */

const mocha = require('mocha');
const chai = require('chai');
const path = require('path');

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.TEST_DIR = path.join(__dirname, '../../tmp/backup-test');

// Run tests
require('./backupSystemTest'); 