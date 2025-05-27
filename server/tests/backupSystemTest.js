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
    await this.testSchedulerFunctionality();
    await this.testErrorHandling();
    await this.testErrorRecovery();
    await this.testFailedBackupManifest();
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

  async testSchedulerFunctionality() {
    this.test('Scheduler Functionality', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        backupInterval: 1000 // 1 second for testing
      });

      // Wait for first automated backup
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const backups = await backupSystem.listBackups();
      assert.ok(backups.length > 0, 'Automated backup should be created');
      assert.strictEqual(backups[0].type, 'scheduled', 'Backup should be of type scheduled');

      // Test scheduler stop
      backupSystem.stopScheduler();
      const backupCount = backups.length;
      await new Promise(resolve => setTimeout(resolve, 1100));
      const newBackups = await backupSystem.listBackups();
      assert.strictEqual(newBackups.length, backupCount, 'No new backups should be created after stopping scheduler');

      // Test scheduler restart
      backupSystem.startScheduler();
      await new Promise(resolve => setTimeout(resolve, 1100));
      const finalBackups = await backupSystem.listBackups();
      assert.ok(finalBackups.length > backupCount, 'New backup should be created after restarting scheduler');

      // Test interval update
      backupSystem.updateBackupInterval(2000);
      const updatedBackupCount = finalBackups.length;
      await new Promise(resolve => setTimeout(resolve, 1100));
      const afterUpdateBackups = await backupSystem.listBackups();
      assert.strictEqual(afterUpdateBackups.length, updatedBackupCount, 'No new backup should be created before new interval');

      await new Promise(resolve => setTimeout(resolve, 1100));
      const finalBackupsAfterUpdate = await backupSystem.listBackups();
      assert.ok(finalBackupsAfterUpdate.length > updatedBackupCount, 'New backup should be created after new interval');
    });
  }

  async testErrorHandling() {
    this.test('Error Handling and Recovery', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxErrors: 2,
        recoveryDelay: 100 // 100ms for testing
      });

      // Simulate backup failure
      const originalBackupWorldData = backupSystem.backupWorldData;
      backupSystem.backupWorldData = async () => {
        throw new Error('Simulated backup failure');
      };

      // First failure should trigger recovery
      try {
        await backupSystem.createBackup();
        assert.fail('Should throw error');
      } catch (error) {
        assert.strictEqual(error.message, 'Simulated backup failure');
        assert.strictEqual(backupSystem.errorCount, 1);
      }

      // Second failure should also trigger recovery
      try {
        await backupSystem.createBackup();
        assert.fail('Should throw error');
      } catch (error) {
        assert.strictEqual(error.message, 'Simulated backup failure');
        assert.strictEqual(backupSystem.errorCount, 2);
      }

      // Third failure should disable the system
      try {
        await backupSystem.createBackup();
        assert.fail('Should throw error');
      } catch (error) {
        assert.strictEqual(error.message, 'Backup system disabled due to repeated errors');
        assert.strictEqual(backupSystem.errorCount, 3);
        assert.strictEqual(backupSystem.scheduler, null);
      }

      // Restore original method
      backupSystem.backupWorldData = originalBackupWorldData;
    });
  }

  async testErrorRecovery() {
    this.test('Error Recovery', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxErrors: 2,
        recoveryDelay: 100 // 100ms for testing
      });

      // Simulate temporary failure
      let failCount = 0;
      const originalBackupWorldData = backupSystem.backupWorldData;
      backupSystem.backupWorldData = async () => {
        if (failCount < 2) {
          failCount++;
          throw new Error('Temporary failure');
        }
        return originalBackupWorldData.call(backupSystem);
      };

      // First failure
      try {
        await backupSystem.createBackup();
        assert.fail('Should throw error');
      } catch (error) {
        assert.strictEqual(error.message, 'Temporary failure');
        assert.strictEqual(backupSystem.errorCount, 1);
      }

      // Second failure
      try {
        await backupSystem.createBackup();
        assert.fail('Should throw error');
      } catch (error) {
        assert.strictEqual(error.message, 'Temporary failure');
        assert.strictEqual(backupSystem.errorCount, 2);
      }

      // Should succeed on third attempt
      const backupId = await backupSystem.createBackup();
      assert.ok(backupId, 'Backup should succeed after recovery');
      assert.strictEqual(backupSystem.errorCount, 0, 'Error count should be reset after success');

      // Restore original method
      backupSystem.backupWorldData = originalBackupWorldData;
    });
  }

  async testFailedBackupManifest() {
    this.test('Failed Backup Manifest', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir
      });

      // Simulate backup failure
      const originalBackupWorldData = backupSystem.backupWorldData;
      backupSystem.backupWorldData = async () => {
        throw new Error('Simulated backup failure');
      };

      try {
        await backupSystem.createBackup();
        assert.fail('Should throw error');
      } catch (error) {
        assert.strictEqual(error.message, 'Simulated backup failure');
      }

      // Verify no backup directory exists (should be cleaned up)
      const backups = await backupSystem.listBackups();
      assert.strictEqual(backups.length, 0, 'Failed backup should be cleaned up');

      // Restore original method
      backupSystem.backupWorldData = originalBackupWorldData;
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