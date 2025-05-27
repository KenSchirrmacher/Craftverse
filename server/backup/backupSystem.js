/**
 * Backup System
 * Handles automated and manual backups of the server state
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class BackupSystem {
  constructor(options = {}) {
    this.backupDir = options.backupDir || path.join(__dirname, '../../backups');
    this.maxBackups = options.maxBackups || 10;
    this.backupInterval = options.backupInterval || 3600000; // 1 hour in milliseconds
    this.lastBackup = null;
    this.isBackingUp = false;
    this.scheduler = null;
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // Start automated backup scheduler
    this.startScheduler();
  }

  /**
   * Start the automated backup scheduler
   */
  startScheduler() {
    if (this.scheduler) {
      clearInterval(this.scheduler);
    }

    this.scheduler = setInterval(async () => {
      try {
        await this.createBackup({
          type: 'scheduled',
          description: 'Automated backup'
        });
      } catch (error) {
        console.error('Automated backup failed:', error);
      }
    }, this.backupInterval);
  }

  /**
   * Stop the automated backup scheduler
   */
  stopScheduler() {
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
  }

  /**
   * Update the backup interval
   * @param {number} interval - New interval in milliseconds
   */
  updateBackupInterval(interval) {
    this.backupInterval = interval;
    this.startScheduler();
  }

  /**
   * Create a new backup
   * @param {Object} options - Backup options
   * @returns {Promise<string>} Backup ID
   */
  async createBackup(options = {}) {
    if (this.isBackingUp) {
      throw new Error('Backup already in progress');
    }

    this.isBackingUp = true;
    const backupId = uuidv4();
    const timestamp = new Date().toISOString();
    const backupPath = path.join(this.backupDir, `${backupId}_${timestamp}`);

    try {
      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });

      // Backup world data
      await this.backupWorldData(backupPath);

      // Backup player data
      await this.backupPlayerData(backupPath);

      // Backup configuration
      await this.backupConfiguration(backupPath);

      // Create backup manifest
      await this.createBackupManifest(backupPath, {
        id: backupId,
        timestamp,
        type: options.type || 'scheduled',
        description: options.description || 'Automated backup'
      });

      // Clean up old backups
      await this.cleanupOldBackups();

      this.lastBackup = timestamp;
      return backupId;
    } catch (error) {
      // Clean up failed backup
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      throw error;
    } finally {
      this.isBackingUp = false;
    }
  }

  /**
   * Backup world data
   * @param {string} backupPath - Path to backup directory
   */
  async backupWorldData(backupPath) {
    const worldPath = path.join(__dirname, '../../world');
    const worldBackupPath = path.join(backupPath, 'world');

    if (fs.existsSync(worldPath)) {
      fs.mkdirSync(worldBackupPath, { recursive: true });
      await this.copyDirectory(worldPath, worldBackupPath);
    }
  }

  /**
   * Backup player data
   * @param {string} backupPath - Path to backup directory
   */
  async backupPlayerData(backupPath) {
    const playerPath = path.join(__dirname, '../../players');
    const playerBackupPath = path.join(backupPath, 'players');

    if (fs.existsSync(playerPath)) {
      fs.mkdirSync(playerBackupPath, { recursive: true });
      await this.copyDirectory(playerPath, playerBackupPath);
    }
  }

  /**
   * Backup configuration files
   * @param {string} backupPath - Path to backup directory
   */
  async backupConfiguration(backupPath) {
    const configPath = path.join(__dirname, '../../config');
    const configBackupPath = path.join(backupPath, 'config');

    if (fs.existsSync(configPath)) {
      fs.mkdirSync(configBackupPath, { recursive: true });
      await this.copyDirectory(configPath, configBackupPath);
    }
  }

  /**
   * Create backup manifest
   * @param {string} backupPath - Path to backup directory
   * @param {Object} manifest - Manifest data
   */
  async createBackupManifest(backupPath, manifest) {
    const manifestPath = path.join(backupPath, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups() {
    const backups = await this.listBackups();
    
    if (backups.length > this.maxBackups) {
      const toDelete = backups.slice(0, backups.length - this.maxBackups);
      
      for (const backup of toDelete) {
        const backupPath = path.join(this.backupDir, backup.id);
        if (fs.existsSync(backupPath)) {
          fs.rmSync(backupPath, { recursive: true, force: true });
        }
      }
    }
  }

  /**
   * List all backups
   * @returns {Promise<Array>} List of backups
   */
  async listBackups() {
    const backups = [];
    
    if (fs.existsSync(this.backupDir)) {
      const entries = fs.readdirSync(this.backupDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const manifestPath = path.join(this.backupDir, entry.name, 'manifest.json');
          
          if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            backups.push({
              id: manifest.id,
              timestamp: manifest.timestamp,
              type: manifest.type,
              description: manifest.description
            });
          }
        }
      }
    }
    
    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Restore from backup
   * @param {string} backupId - Backup ID to restore from
   */
  async restoreBackup(backupId) {
    const backups = await this.listBackups();
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) {
      throw new Error('Backup not found');
    }

    const backupPath = path.join(this.backupDir, backup.id);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup directory not found');
    }

    // Restore world data
    const worldPath = path.join(__dirname, '../../world');
    const worldBackupPath = path.join(backupPath, 'world');
    if (fs.existsSync(worldBackupPath)) {
      if (fs.existsSync(worldPath)) {
        fs.rmSync(worldPath, { recursive: true, force: true });
      }
      await this.copyDirectory(worldBackupPath, worldPath);
    }

    // Restore player data
    const playerPath = path.join(__dirname, '../../players');
    const playerBackupPath = path.join(backupPath, 'players');
    if (fs.existsSync(playerBackupPath)) {
      if (fs.existsSync(playerPath)) {
        fs.rmSync(playerPath, { recursive: true, force: true });
      }
      await this.copyDirectory(playerBackupPath, playerPath);
    }

    // Restore configuration
    const configPath = path.join(__dirname, '../../config');
    const configBackupPath = path.join(backupPath, 'config');
    if (fs.existsSync(configBackupPath)) {
      if (fs.existsSync(configPath)) {
        fs.rmSync(configPath, { recursive: true, force: true });
      }
      await this.copyDirectory(configBackupPath, configPath);
    }
  }

  /**
   * Copy directory recursively
   * @param {string} src - Source directory
   * @param {string} dest - Destination directory
   */
  async copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

module.exports = BackupSystem; 