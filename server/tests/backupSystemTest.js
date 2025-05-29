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
const { expect } = require('chai');

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
      const backupIds = [];
      for (let i = 0; i < 3; i++) {
        const backupId = await backupSystem.createBackup({
          type: 'test',
          description: `Test backup ${i}`
        });
        backupIds.push(backupId);
      }

      // List backups
      const backups = await backupSystem.listBackups();
      assert.strictEqual(backups.length, 3, 'Should list all backups');
      
      // Verify backup order (newest first)
      assert.strictEqual(backups[0].id, backupIds[2], 'Should list newest backup first');
      assert.strictEqual(backups[1].id, backupIds[1], 'Should list second newest backup second');
      assert.strictEqual(backups[2].id, backupIds[0], 'Should list oldest backup last');
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
        maxBackups: 3,
        backupInterval: 1000 // 1 second for testing
      });

      // Wait for scheduled backup
      await new Promise(resolve => setTimeout(resolve, 1500));

      // List backups
      const backups = await backupSystem.listBackups();
      assert.ok(backups.length > 0, 'Scheduled backup should be created');

      // Stop scheduler
      backupSystem.stopScheduler();
      const initialCount = backups.length;

      // Wait for another interval
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verify no new backups were created
      const newBackups = await backupSystem.listBackups();
      assert.strictEqual(newBackups.length, initialCount, 'No new backups should be created after stopping scheduler');
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

describe('BackupSystem', () => {
  let backupSystem;
  const testBackupDir = path.join(__dirname, '../../tmp/backup-test');
  const testWorldDir = path.join(__dirname, '../../tmp/backup-test/world');
  const testPlayersDir = path.join(__dirname, '../../tmp/backup-test/players');
  const testConfigDir = path.join(__dirname, '../../tmp/backup-test/config');

  beforeEach(async () => {
    // Clean up test directories
    if (fs.existsSync(testBackupDir)) {
      fs.rmSync(testBackupDir, { recursive: true, force: true });
    }

    // Create test directories
    fs.mkdirSync(testBackupDir, { recursive: true });
    fs.mkdirSync(testWorldDir, { recursive: true });
    fs.mkdirSync(testPlayersDir, { recursive: true });
    fs.mkdirSync(testConfigDir, { recursive: true });

    // Create test files
    fs.writeFileSync(path.join(testWorldDir, 'test.txt'), 'world data');
    fs.writeFileSync(path.join(testPlayersDir, 'player.json'), '{"name": "test"}');
    fs.writeFileSync(path.join(testConfigDir, 'config.json'), '{"setting": "value"}');

    // Initialize backup system
    backupSystem = new BackupSystem({
      backupDir: testBackupDir,
      maxBackups: 3,
      backupInterval: 1000
    });
  });

  afterEach(async () => {
    // Clean up
    backupSystem.stopScheduler();
    if (fs.existsSync(testBackupDir)) {
      fs.rmSync(testBackupDir, { recursive: true, force: true });
    }
  });

  describe('Windows Compatibility', () => {
    it('should create backup directories with Windows-compatible names', async () => {
      const backupId = await backupSystem.createBackup({
        type: 'test',
        description: 'Windows compatibility test'
      });

      const backups = await backupSystem.listBackups();
      const backup = backups.find(b => b.id === backupId);
      
      expect(backup).to.exist;
      expect(backup.timestamp).to.not.include(':');
      expect(backup.timestamp).to.not.include('.');
      
      const backupPath = path.join(testBackupDir, `${backupId}_${backup.timestamp}`);
      expect(fs.existsSync(backupPath)).to.be.true;
    });
  });

  describe('Backup Creation', () => {
    it('should create a backup with all required data', async () => {
      const backupId = await backupSystem.createBackup({
        type: 'test',
        description: 'Test backup'
      });

      const backups = await backupSystem.listBackups();
      const backup = backups.find(b => b.id === backupId);
      
      expect(backup).to.exist;
      expect(backup.type).to.equal('test');
      expect(backup.description).to.equal('Test backup');
      
      const backupPath = path.join(testBackupDir, `${backupId}_${backup.timestamp}`);
      expect(fs.existsSync(path.join(backupPath, 'world/test.txt'))).to.be.true;
      expect(fs.existsSync(path.join(backupPath, 'players/player.json'))).to.be.true;
      expect(fs.existsSync(path.join(backupPath, 'config/config.json'))).to.be.true;
    });

    it('should prevent concurrent backups', async () => {
      backupSystem.isBackingUp = true;
      
      try {
        await backupSystem.createBackup();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Backup already in progress');
      }
    });
  });

  describe('Backup Restoration', () => {
    it('should restore a backup correctly', async () => {
      // Create initial backup
      const backupId = await backupSystem.createBackup({
        type: 'test',
        description: 'Test backup for restoration'
      });

      // Modify original files
      fs.writeFileSync(path.join(testWorldDir, 'test.txt'), 'modified data');
      
      // Restore backup
      await backupSystem.restoreBackup(backupId);
      
      // Verify restoration
      const worldData = fs.readFileSync(path.join(testWorldDir, 'test.txt'), 'utf8');
      expect(worldData).to.equal('world data');
    });
  });

  describe('Backup Cleanup', () => {
    it('should maintain maximum number of backups', async () => {
      // Create more backups than maxBackups
      for (let i = 0; i < 5; i++) {
        await backupSystem.createBackup({
          type: 'test',
          description: `Test backup ${i}`
        });
      }

      const backups = await backupSystem.listBackups();
      expect(backups.length).to.equal(3); // maxBackups is set to 3
    });
  });

  describe('Error Handling', () => {
    it('should handle directory creation errors gracefully', async () => {
      // Create an invalid path
      const invalidBackupSystem = new BackupSystem({
        backupDir: 'C:\\invalid\\path\\with\\colons:in:it',
        maxBackups: 3
      });

      try {
        await invalidBackupSystem.createBackup();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Error creating directory');
      }
    });

    it('should implement exponential backoff for retries', async () => {
      // Mock fs.existsSync to fail first two times
      let attempts = 0;
      const originalExistsSync = fs.existsSync;
      fs.existsSync = () => {
        attempts++;
        return attempts > 2;
      };

      try {
        await backupSystem.ensureDirectoryExists(testBackupDir);
        expect(attempts).to.be.greaterThan(2);
      } finally {
        fs.existsSync = originalExistsSync;
      }
    });
  });
}); 