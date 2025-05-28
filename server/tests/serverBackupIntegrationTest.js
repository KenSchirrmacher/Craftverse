/**
 * Server Backup Integration Test Suite
 * Tests for verifying the backup system's integration with the server
 */

const assert = require('assert');
const TestBase = require('./testBase');
const BackupSystem = require('../backup/backupSystem');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ServerBackupIntegrationTest extends TestBase {
  constructor() {
    super('Server Backup Integration');
    this.testDir = path.join(os.tmpdir(), 'server-backup-test-' + Date.now());
  }

  async runTests() {
    await this.testServerInitialization();
    await this.testBackupSystemGlobal();
    await this.testBackupSystemConfiguration();
    await this.testBackupSystemIntegration();
  }

  async testServerInitialization() {
    this.test('Server Initialization', () => {
      // Verify backup system is imported
      assert.ok(require('../backup/backupSystem'), 'Backup system module should be available');
    });
  }

  async testBackupSystemGlobal() {
    this.test('Backup System Global', () => {
      // Create backup system instance
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxBackups: 3
      });

      // Set as global
      global.backupSystem = backupSystem;

      // Verify global instance
      assert.ok(global.backupSystem, 'Backup system should be available globally');
      assert.strictEqual(global.backupSystem, backupSystem, 'Global instance should match created instance');
    });
  }

  async testBackupSystemConfiguration() {
    this.test('Backup System Configuration', () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxBackups: 10,
        backupInterval: 3600000,
        maxErrors: 3,
        recoveryDelay: 5000
      });

      // Verify configuration
      assert.strictEqual(backupSystem.maxBackups, 10, 'maxBackups should be configured');
      assert.strictEqual(backupSystem.backupInterval, 3600000, 'backupInterval should be configured');
      assert.strictEqual(backupSystem.maxErrors, 3, 'maxErrors should be configured');
      assert.strictEqual(backupSystem.recoveryDelay, 5000, 'recoveryDelay should be configured');
    });
  }

  async testBackupSystemIntegration() {
    this.test('Backup System Integration', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxBackups: 3
      });

      // Create test data
      const worldPath = path.join(__dirname, '../../world');
      const playerPath = path.join(__dirname, '../../players');
      const configPath = path.join(__dirname, '../../config');

      fs.mkdirSync(worldPath, { recursive: true });
      fs.mkdirSync(playerPath, { recursive: true });
      fs.mkdirSync(configPath, { recursive: true });

      // Create test files
      fs.writeFileSync(path.join(worldPath, 'test.txt'), 'world data');
      fs.writeFileSync(path.join(playerPath, 'test.txt'), 'player data');
      fs.writeFileSync(path.join(configPath, 'test.txt'), 'config data');

      // Create backup
      const backupId = await backupSystem.createBackup({
        type: 'test',
        description: 'Integration test backup'
      });

      // Verify backup
      const backups = await backupSystem.listBackups();
      const backup = backups.find(b => b.id === backupId);
      
      assert.ok(backup, 'Backup should exist');
      assert.strictEqual(backup.type, 'test', 'Backup type should match');
      assert.strictEqual(backup.description, 'Integration test backup', 'Backup description should match');

      // Verify backup contents
      const backupPath = path.join(this.testDir, backupId);
      assert.ok(fs.existsSync(path.join(backupPath, 'world/test.txt')), 'World data should be backed up');
      assert.ok(fs.existsSync(path.join(backupPath, 'players/test.txt')), 'Player data should be backed up');
      assert.ok(fs.existsSync(path.join(backupPath, 'config/test.txt')), 'Config data should be backed up');
    });
  }

  async cleanup() {
    // Clean up test directories
    const dirs = [
      this.testDir,
      path.join(__dirname, '../../world'),
      path.join(__dirname, '../../players'),
      path.join(__dirname, '../../config')
    ];

    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new ServerBackupIntegrationTest();
  test.runTests().then(() => {
    console.log('Server Backup Integration Tests completed successfully');
  }).catch(error => {
    console.error('Server Backup Integration Tests failed:', error);
    process.exit(1);
  });
}

module.exports = ServerBackupIntegrationTest; 