/**
 * Deployment Backup Test Suite
 * Tests for the deployment backup procedures
 */

const assert = require('assert');
const TestBase = require('./testBase');
const BackupSystem = require('../backup/backupSystem');
const fs = require('fs');
const path = require('path');
const os = require('os');

class DeploymentBackupTest extends TestBase {
  constructor() {
    super('Deployment Backup');
    this.testDir = path.join(os.tmpdir(), 'deployment-backup-test-' + Date.now());
  }

  async runTests() {
    await this.testAutomatedBackupSchedule();
    await this.testManualBackupCreation();
    await this.testBackupRetention();
    await this.testBackupContents();
    await this.testBackupRestoration();
    await this.testConcurrentBackupPrevention();
    await this.testBackupManifest();
    await this.testBackupCleanup();
  }

  async testAutomatedBackupSchedule() {
    this.test('Automated Backup Schedule', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        backupInterval: 1000 // 1 second for testing
      });

      // Wait for first automated backup
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const backups = await backupSystem.listBackups();
      assert.ok(backups.length > 0, 'Automated backup should be created');
      assert.strictEqual(backups[0].type, 'scheduled', 'Backup should be of type scheduled');
    });
  }

  async testManualBackupCreation() {
    this.test('Manual Backup Creation', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir
      });

      const backupId = await backupSystem.createBackup({
        type: 'manual',
        description: 'Manual test backup'
      });

      const backups = await backupSystem.listBackups();
      const backup = backups.find(b => b.id === backupId);
      
      assert.ok(backup, 'Manual backup should exist');
      assert.strictEqual(backup.type, 'manual', 'Backup should be of type manual');
      assert.strictEqual(backup.description, 'Manual test backup', 'Backup description should match');
    });
  }

  async testBackupRetention() {
    this.test('Backup Retention', async () => {
      const maxBackups = 3;
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxBackups
      });

      // Create more backups than maxBackups
      for (let i = 0; i < maxBackups + 2; i++) {
        await backupSystem.createBackup({ description: `Backup ${i}` });
      }

      const backups = await backupSystem.listBackups();
      assert.strictEqual(backups.length, maxBackups, 'Should maintain maxBackups limit');
    });
  }

  async testBackupContents() {
    this.test('Backup Contents', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir
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

      const backupId = await backupSystem.createBackup();

      // Verify backup contents
      const backupPath = path.join(this.testDir, backupId);
      assert.ok(fs.existsSync(path.join(backupPath, 'world/test.txt')), 'World data should be backed up');
      assert.ok(fs.existsSync(path.join(backupPath, 'players/test.txt')), 'Player data should be backed up');
      assert.ok(fs.existsSync(path.join(backupPath, 'config/test.txt')), 'Config data should be backed up');
    });
  }

  async testBackupRestoration() {
    this.test('Backup Restoration', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir
      });

      // Create test data
      const worldPath = path.join(__dirname, '../../world');
      const playerPath = path.join(__dirname, '../../players');
      const configPath = path.join(__dirname, '../../config');

      fs.mkdirSync(worldPath, { recursive: true });
      fs.mkdirSync(playerPath, { recursive: true });
      fs.mkdirSync(configPath, { recursive: true });

      // Create test files
      fs.writeFileSync(path.join(worldPath, 'test.txt'), 'original data');
      fs.writeFileSync(path.join(playerPath, 'test.txt'), 'original data');
      fs.writeFileSync(path.join(configPath, 'test.txt'), 'original data');

      const backupId = await backupSystem.createBackup();

      // Modify files
      fs.writeFileSync(path.join(worldPath, 'test.txt'), 'modified data');
      fs.writeFileSync(path.join(playerPath, 'test.txt'), 'modified data');
      fs.writeFileSync(path.join(configPath, 'test.txt'), 'modified data');

      // Restore backup
      await backupSystem.restoreBackup(backupId);

      // Verify restoration
      assert.strictEqual(
        fs.readFileSync(path.join(worldPath, 'test.txt'), 'utf8'),
        'original data',
        'World data should be restored'
      );
      assert.strictEqual(
        fs.readFileSync(path.join(playerPath, 'test.txt'), 'utf8'),
        'original data',
        'Player data should be restored'
      );
      assert.strictEqual(
        fs.readFileSync(path.join(configPath, 'test.txt'), 'utf8'),
        'original data',
        'Config data should be restored'
      );
    });
  }

  async testConcurrentBackupPrevention() {
    this.test('Concurrent Backup Prevention', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir
      });

      // Start first backup
      const backup1Promise = backupSystem.createBackup();

      // Try to start second backup immediately
      try {
        await backupSystem.createBackup();
        assert.fail('Should not allow concurrent backups');
      } catch (error) {
        assert.strictEqual(error.message, 'Backup already in progress', 'Should throw correct error');
      }

      // Wait for first backup to complete
      await backup1Promise;
    });
  }

  async testBackupManifest() {
    this.test('Backup Manifest', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir
      });

      const backupId = await backupSystem.createBackup({
        type: 'test',
        description: 'Test manifest'
      });

      const backupPath = path.join(this.testDir, backupId);
      const manifestPath = path.join(backupPath, 'manifest.json');
      
      assert.ok(fs.existsSync(manifestPath), 'Manifest should exist');
      
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      assert.strictEqual(manifest.id, backupId, 'Manifest ID should match backup ID');
      assert.strictEqual(manifest.type, 'test', 'Manifest type should match');
      assert.strictEqual(manifest.description, 'Test manifest', 'Manifest description should match');
      assert.ok(manifest.timestamp, 'Manifest should have timestamp');
    });
  }

  async testBackupCleanup() {
    this.test('Backup Cleanup', async () => {
      const maxBackups = 2;
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxBackups
      });

      // Create multiple backups
      await backupSystem.createBackup({ description: 'Backup 1' });
      await backupSystem.createBackup({ description: 'Backup 2' });
      await backupSystem.createBackup({ description: 'Backup 3' });

      const backups = await backupSystem.listBackups();
      assert.strictEqual(backups.length, maxBackups, 'Should maintain maxBackups limit');
      assert.ok(backups[0].description === 'Backup 3', 'Should keep newest backups');
      assert.ok(backups[1].description === 'Backup 2', 'Should keep newest backups');
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
    const test = new DeploymentBackupTest();
    try {
      await test.runTests();
    } finally {
      await test.cleanup();
    }
  }
};

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running Deployment Backup Tests...');
  module.exports.runTests();
} 