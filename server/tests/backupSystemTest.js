/**
 * Backup System Test Suite
 * Tests for the backup system functionality
 */

const assert = require('assert');
const TestBase = require('./testBase');
const BackupSystem = require('../backup/backupSystem');
const fs = require('fs');
const path = require('path');
const os = require('os');

class BackupSystemTest extends TestBase {
  constructor() {
    super('Backup System');
    this.testDir = path.join(os.tmpdir(), 'backup-test-' + Date.now());
  }

  async runTests() {
    await this.testBackupCreation();
    await this.testBackupRestoration();
    await this.testBackupListing();
    await this.testBackupCleanup();
    await this.testConcurrentBackups();
  }

  async testBackupCreation() {
    this.test('Backup Creation', async () => {
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
        description: 'Test backup'
      });

      assert.ok(backupId, 'Backup ID should be returned');
      
      // Verify backup contents
      const backupPath = path.join(this.testDir, backupId);
      assert.ok(fs.existsSync(backupPath), 'Backup directory should exist');
      assert.ok(fs.existsSync(path.join(backupPath, 'world/test.txt')), 'World backup should exist');
      assert.ok(fs.existsSync(path.join(backupPath, 'players/test.txt')), 'Player backup should exist');
      assert.ok(fs.existsSync(path.join(backupPath, 'config/test.txt')), 'Config backup should exist');
      assert.ok(fs.existsSync(path.join(backupPath, 'manifest.json')), 'Manifest should exist');

      // Verify manifest
      const manifest = JSON.parse(fs.readFileSync(path.join(backupPath, 'manifest.json'), 'utf8'));
      assert.strictEqual(manifest.id, backupId, 'Manifest ID should match backup ID');
      assert.strictEqual(manifest.type, 'test', 'Manifest type should match');
      assert.strictEqual(manifest.description, 'Test backup', 'Manifest description should match');
    });
  }

  async testBackupRestoration() {
    this.test('Backup Restoration', async () => {
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
      fs.writeFileSync(path.join(worldPath, 'test.txt'), 'original world data');
      fs.writeFileSync(path.join(playerPath, 'test.txt'), 'original player data');
      fs.writeFileSync(path.join(configPath, 'test.txt'), 'original config data');

      // Create backup
      const backupId = await backupSystem.createBackup();

      // Modify original files
      fs.writeFileSync(path.join(worldPath, 'test.txt'), 'modified world data');
      fs.writeFileSync(path.join(playerPath, 'test.txt'), 'modified player data');
      fs.writeFileSync(path.join(configPath, 'test.txt'), 'modified config data');

      // Restore backup
      await backupSystem.restoreBackup(backupId);

      // Verify restoration
      assert.strictEqual(
        fs.readFileSync(path.join(worldPath, 'test.txt'), 'utf8'),
        'original world data',
        'World data should be restored'
      );
      assert.strictEqual(
        fs.readFileSync(path.join(playerPath, 'test.txt'), 'utf8'),
        'original player data',
        'Player data should be restored'
      );
      assert.strictEqual(
        fs.readFileSync(path.join(configPath, 'test.txt'), 'utf8'),
        'original config data',
        'Config data should be restored'
      );
    });
  }

  async testBackupListing() {
    this.test('Backup Listing', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxBackups: 3
      });

      // Create multiple backups
      await backupSystem.createBackup({ description: 'Backup 1' });
      await backupSystem.createBackup({ description: 'Backup 2' });
      await backupSystem.createBackup({ description: 'Backup 3' });

      // List backups
      const backups = await backupSystem.listBackups();

      assert.strictEqual(backups.length, 3, 'Should list all backups');
      assert.ok(backups[0].timestamp > backups[1].timestamp, 'Backups should be sorted by timestamp');
      assert.ok(backups[1].timestamp > backups[2].timestamp, 'Backups should be sorted by timestamp');
    });
  }

  async testBackupCleanup() {
    this.test('Backup Cleanup', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxBackups: 2
      });

      // Create more backups than maxBackups
      await backupSystem.createBackup({ description: 'Backup 1' });
      await backupSystem.createBackup({ description: 'Backup 2' });
      await backupSystem.createBackup({ description: 'Backup 3' });

      // List backups
      const backups = await backupSystem.listBackups();

      assert.strictEqual(backups.length, 2, 'Should maintain maxBackups limit');
      assert.ok(backups[0].description === 'Backup 3', 'Should keep newest backups');
      assert.ok(backups[1].description === 'Backup 2', 'Should keep newest backups');
    });
  }

  async testConcurrentBackups() {
    this.test('Concurrent Backups', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxBackups: 3
      });

      // Start first backup
      const backup1Promise = backupSystem.createBackup({ description: 'Backup 1' });

      // Try to start second backup immediately
      try {
        await backupSystem.createBackup({ description: 'Backup 2' });
        assert.fail('Should not allow concurrent backups');
      } catch (error) {
        assert.strictEqual(error.message, 'Backup already in progress', 'Should throw correct error');
      }

      // Wait for first backup to complete
      await backup1Promise;

      // Now should be able to create another backup
      const backupId = await backupSystem.createBackup({ description: 'Backup 2' });
      assert.ok(backupId, 'Should be able to create backup after first one completes');
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

// Export the test functions
module.exports = {
  runTests: async () => {
    const test = new BackupSystemTest();
    try {
      await test.runTests();
    } finally {
      await test.cleanup();
    }
  }
};

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running Backup System Tests...');
  module.exports.runTests();
} 