/**
 * Backup-Save Integration Test Suite
 * Tests for verifying the integration between backup system and save system
 */

const assert = require('assert');
const TestBase = require('./testBase');
const BackupSystem = require('../backup/backupSystem');
const saveSystem = require('../saveSystem');
const fs = require('fs');
const path = require('path');
const os = require('os');

class BackupSaveIntegrationTest extends TestBase {
  constructor() {
    super('Backup-Save Integration');
    this.testDir = path.join(os.tmpdir(), 'backup-save-test-' + Date.now());
    this.worldName = 'test-world';
  }

  async runTests() {
    await this.testSaveAndBackup();
    await this.testBackupAndRestore();
    await this.testConcurrentSaveAndBackup();
    await this.testBackupWithSaveData();
  }

  async testSaveAndBackup() {
    this.test('Save and Backup Integration', async () => {
      // Initialize systems
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxBackups: 3
      });

      // Create test data
      const players = {
        'player1': { id: 'player1', position: { x: 0, y: 0, z: 0 } },
        'player2': { id: 'player2', position: { x: 10, y: 0, z: 10 } }
      };

      const blocks = {
        '0,0,0': { type: 'stone', x: 0, y: 0, z: 0 },
        '1,0,0': { type: 'dirt', x: 1, y: 0, z: 0 }
      };

      const mobData = {
        'mob1': { id: 'mob1', type: 'zombie', position: { x: 5, y: 0, z: 5 } }
      };

      // Save game state
      const saveResult = saveSystem.saveGame(this.worldName, players, blocks, mobData);
      assert.ok(saveResult, 'Game should be saved successfully');

      // Create backup
      const backupId = await backupSystem.createBackup({
        type: 'save',
        description: 'Backup after save'
      });

      // Verify backup contains save data
      const backupPath = path.join(this.testDir, backupId);
      const worldPath = path.join(backupPath, 'world');
      assert.ok(fs.existsSync(worldPath), 'World directory should exist in backup');
      assert.ok(fs.existsSync(path.join(worldPath, this.worldName)), 'Save directory should exist in backup');
    });
  }

  async testBackupAndRestore() {
    this.test('Backup and Restore Integration', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxBackups: 3
      });

      // Create initial save
      const initialPlayers = { 'player1': { id: 'player1', position: { x: 0, y: 0, z: 0 } } };
      const initialBlocks = { '0,0,0': { type: 'stone', x: 0, y: 0, z: 0 } };
      saveSystem.saveGame(this.worldName, initialPlayers, initialBlocks, {});

      // Create backup
      const backupId = await backupSystem.createBackup();

      // Modify save data
      const modifiedPlayers = { 'player1': { id: 'player1', position: { x: 10, y: 0, z: 10 } } };
      const modifiedBlocks = { '0,0,0': { type: 'dirt', x: 0, y: 0, z: 0 } };
      saveSystem.saveGame(this.worldName, modifiedPlayers, modifiedBlocks, {});

      // Restore backup
      await backupSystem.restoreBackup(backupId);

      // Verify restored data matches initial state
      const restoredData = saveSystem.loadGame(this.worldName);
      assert.deepStrictEqual(restoredData.players, initialPlayers, 'Players should be restored to initial state');
      assert.deepStrictEqual(restoredData.blocks, initialBlocks, 'Blocks should be restored to initial state');
    });
  }

  async testConcurrentSaveAndBackup() {
    this.test('Concurrent Save and Backup', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxBackups: 3
      });

      // Start backup
      const backupPromise = backupSystem.createBackup();

      // Attempt save during backup
      const players = { 'player1': { id: 'player1', position: { x: 0, y: 0, z: 0 } } };
      const blocks = { '0,0,0': { type: 'stone', x: 0, y: 0, z: 0 } };
      const saveResult = saveSystem.saveGame(this.worldName, players, blocks, {});
      assert.ok(saveResult, 'Save should succeed during backup');

      // Wait for backup to complete
      await backupPromise;

      // Verify both operations completed successfully
      const backups = await backupSystem.listBackups();
      assert.ok(backups.length > 0, 'Backup should be created');
      const loadedData = saveSystem.loadGame(this.worldName);
      assert.ok(loadedData, 'Save data should be accessible');
    });
  }

  async testBackupWithSaveData() {
    this.test('Backup with Save Data', async () => {
      const backupSystem = new BackupSystem({
        backupDir: this.testDir,
        maxBackups: 3
      });

      // Create multiple saves
      for (let i = 0; i < 3; i++) {
        const players = { [`player${i}`]: { id: `player${i}`, position: { x: i, y: 0, z: i } } };
        const blocks = { [`${i},0,${i}`]: { type: 'stone', x: i, y: 0, z: i } };
        saveSystem.saveGame(`${this.worldName}_${i}`, players, blocks, {});
      }

      // Create backup
      const backupId = await backupSystem.createBackup({
        type: 'multi-save',
        description: 'Backup with multiple saves'
      });

      // Verify all save data is in backup
      const backupPath = path.join(this.testDir, backupId);
      const worldPath = path.join(backupPath, 'world');
      
      for (let i = 0; i < 3; i++) {
        const savePath = path.join(worldPath, `${this.worldName}_${i}`);
        assert.ok(fs.existsSync(savePath), `Save ${i} should exist in backup`);
      }
    });
  }

  async cleanup() {
    // Clean up test directories
    const dirs = [
      this.testDir,
      path.join(__dirname, '../../world'),
      path.join(__dirname, '../../saves')
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
  const test = new BackupSaveIntegrationTest();
  test.runTests().then(() => {
    console.log('Backup-Save Integration Tests completed successfully');
  }).catch(error => {
    console.error('Backup-Save Integration Tests failed:', error);
    process.exit(1);
  });
}

module.exports = BackupSaveIntegrationTest; 