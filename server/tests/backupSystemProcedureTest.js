/**
 * Backup System Procedure Test Suite
 * Tests for verifying that the backup system's actual functionality matches documented procedures
 */

const assert = require('assert');
const TestBase = require('./testBase');
const BackupSystem = require('../backup/backupSystem');
const fs = require('fs');
const path = require('path');

class BackupSystemProcedureTest extends TestBase {
  constructor() {
    super('Backup System Procedures');
    
    // Create test directories
    this.testDir = path.join(__dirname, '../../tmp/backup-procedure-test-' + Date.now());
    this.worldDir = path.join(__dirname, '../../world');
    this.playerDir = path.join(__dirname, '../../players');
    this.configDir = path.join(__dirname, '../../config');
    
    // Ensure all directories exist
    const dirs = [
      path.join(__dirname, '../../tmp'),
      this.testDir,
      this.worldDir,
      this.playerDir,
      this.configDir
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        console.log('Creating directory:', dir);
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    // Create test data
    fs.writeFileSync(path.join(this.worldDir, 'test.txt'), 'world data');
    fs.writeFileSync(path.join(this.playerDir, 'test.txt'), 'player data');
    fs.writeFileSync(path.join(this.configDir, 'test.txt'), 'config data');
    
    // Initialize backup system after ensuring directories exist
    this.backupSystem = new BackupSystem({
      backupDir: this.testDir,
      maxBackups: 3,
      backupInterval: 1000, // 1 second for testing
      maxErrors: 3,
      recoveryDelay: 100 // 100ms for testing
    });
  }

  async runTests() {
    try {
      // Verify test directory exists before running tests
      if (!fs.existsSync(this.testDir)) {
        fs.mkdirSync(this.testDir, { recursive: true });
      }
      
      // Add a longer delay to ensure directories are fully created
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await this.testAutomatedBackups();
      await this.testManualBackups();
      await this.testBackupRetention();
      await this.testBackupContents();
      await this.testConcurrentBackupPrevention();
      await this.testErrorHandling();
      await this.testSchedulerControl();
    } finally {
      await this.cleanup();
    }
  }

  async testAutomatedBackups() {
    this.test('Automated Backups', async () => {
      // Wait for automated backup
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const backups = await this.backupSystem.listBackups();
      assert.ok(backups.length > 0, 'Automated backup should be created');
      
      const backup = backups[0];
      assert.ok(backup.type === 'scheduled', 'Backup should be marked as scheduled');
    });
  }

  async testManualBackups() {
    this.test('Manual Backups', async () => {
      const backupId = await this.backupSystem.createBackup({
        type: 'manual',
        description: 'Test manual backup'
      });
      
      assert.ok(backupId, 'Manual backup should be created');
      
      const backups = await this.backupSystem.listBackups();
      const backup = backups.find(b => b.id === backupId);
      assert.ok(backup, 'Manual backup should be listed');
      assert.ok(backup.type === 'manual', 'Backup should be marked as manual');
    });
  }

  async testBackupRetention() {
    this.test('Backup Retention', async () => {
      // Create more backups than maxBackups
      for (let i = 0; i < 5; i++) {
        await this.backupSystem.createBackup({
          type: 'test',
          description: `Test backup ${i}`
        });
      }
      
      const backups = await this.backupSystem.listBackups();
      assert.ok(backups.length <= 3, 'Should not exceed maxBackups limit');
    });
  }

  async testBackupContents() {
    this.test('Backup Contents', async () => {
      const backupId = await this.backupSystem.createBackup({
        type: 'test',
        description: 'Test backup contents'
      });
      
      const backupPath = path.join(this.testDir, backupId);
      
      // Verify backup structure
      assert.ok(fs.existsSync(path.join(backupPath, 'world')), 'World directory should exist');
      assert.ok(fs.existsSync(path.join(backupPath, 'players')), 'Players directory should exist');
      assert.ok(fs.existsSync(path.join(backupPath, 'config')), 'Config directory should exist');
      assert.ok(fs.existsSync(path.join(backupPath, 'manifest.json')), 'Manifest should exist');
    });
  }

  async testConcurrentBackupPrevention() {
    this.test('Concurrent Backup Prevention', async () => {
      // Start a backup
      const backupPromise = this.backupSystem.createBackup({
        type: 'test',
        description: 'Test concurrent prevention'
      });
      
      // Try to start another backup
      try {
        await this.backupSystem.createBackup({
          type: 'test',
          description: 'Test concurrent prevention 2'
        });
        assert.fail('Should not allow concurrent backups');
      } catch (error) {
        assert.ok(error.message.includes('already in progress'), 'Should throw error for concurrent backup');
      }
      
      // Wait for first backup to complete
      await backupPromise;
    });
  }

  async testErrorHandling() {
    this.test('Error Handling', async () => {
      // Create invalid backup directory
      const invalidSystem = new BackupSystem({
        backupDir: '/invalid/path',
        maxBackups: 3
      });
      
      try {
        await invalidSystem.createBackup();
        assert.fail('Should throw error for invalid directory');
      } catch (error) {
        assert.ok(error.message.includes('ENOENT'), 'Should throw ENOENT error');
      }
    });
  }

  async testSchedulerControl() {
    this.test('Scheduler Control', async () => {
      // Stop scheduler
      this.backupSystem.stopScheduler();
      
      // Wait for interval
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verify no new backups
      const initialBackups = await this.backupSystem.listBackups();
      
      // Start scheduler
      this.backupSystem.startScheduler();
      
      // Wait for interval
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const finalBackups = await this.backupSystem.listBackups();
      assert.ok(finalBackups.length > initialBackups.length, 'Should create new backups after starting scheduler');
    });
  }

  async cleanup() {
    // Clean up test directories
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    if (fs.existsSync(this.worldDir)) {
      fs.rmSync(this.worldDir, { recursive: true, force: true });
    }
    if (fs.existsSync(this.playerDir)) {
      fs.rmSync(this.playerDir, { recursive: true, force: true });
    }
    if (fs.existsSync(this.configDir)) {
      fs.rmSync(this.configDir, { recursive: true, force: true });
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new BackupSystemProcedureTest();
  test.runTests().then(() => {
    console.log('Backup System Procedure Tests completed successfully');
  }).catch(error => {
    console.error('Backup System Procedure Tests failed:', error);
    process.exit(1);
  });
}

module.exports = BackupSystemProcedureTest; 