/**
 * Backup System
 * Handles automated and manual backups of the server state
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { execSync } = require('child_process');

class BackupSystem {
  constructor(options = {}) {
    this.backupDir = options.backupDir || path.join(__dirname, '../../backups');
    this.maxBackups = options.maxBackups || 10;
    this.backupInterval = options.backupInterval || 3600000; // 1 hour in milliseconds
    this.lastBackup = null;
    this.isBackingUp = false;
    this.scheduler = null;
    this.errorCount = 0;
    this.maxErrors = options.maxErrors || 3;
    this.recoveryDelay = options.recoveryDelay || 5000; // 5 seconds
    this.directoryLock = false;
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      this.createDirectoryWindows(this.backupDir);
    }

    // Start automated backup scheduler
    this.startScheduler();
  }

  /**
   * Create directory using Windows command
   * @param {string} dir - Directory path
   */
  createDirectoryWindows(dir) {
    try {
      // Convert path to Windows format
      const windowsPath = dir.replace(/\//g, '\\');
      // Use Windows mkdir command with /p flag for parent directories
      execSync(`mkdir "${windowsPath}" /p`, { shell: 'cmd.exe' });
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  }

  /**
   * Handle backup errors and implement recovery
   * @param {Error} error - The error that occurred
   * @returns {Promise<void>}
   */
  async handleBackupError(error) {
    this.errorCount++;
    console.error(`Backup error (${this.errorCount}/${this.maxErrors}):`, error);

    if (this.errorCount >= this.maxErrors) {
      console.error('Maximum error count reached. Stopping backup scheduler.');
      this.stopScheduler();
      throw new Error('Backup system disabled due to repeated errors');
    }

    // Implement exponential backoff
    const delay = this.recoveryDelay * Math.pow(2, this.errorCount - 1);
    console.log(`Waiting ${delay}ms before retrying...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Reset error count on successful backup
   */
  resetErrorCount() {
    this.errorCount = 0;
  }

  /**
   * Start the automated backup scheduler
   */
  startScheduler() {
    if (this.scheduler) {
      clearInterval(this.scheduler);
    }

    this.scheduler = setInterval(async () => {
      if (this.isBackingUp) {
        console.log('Skipping scheduled backup - backup already in progress');
        return;
      }
      
      try {
        await this.createBackup({
          type: 'scheduled',
          description: 'Automated backup'
        });
        this.resetErrorCount();
      } catch (error) {
        await this.handleBackupError(error);
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
   * Wait for directory to be ready
   * @param {string} dir - Directory path
   * @param {number} timeout - Maximum time to wait in milliseconds
   * @returns {Promise<boolean>} Whether directory is ready
   */
  async waitForDirectoryReady(dir, timeout = 2000) {
    const startTime = Date.now();
    const checkInterval = 100; // Check every 100ms
    
    while (Date.now() - startTime < timeout) {
      try {
        if (fs.existsSync(dir)) {
          // Try to create a test file to verify write access
          const testFile = path.join(dir, '.test_' + Date.now());
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          return true;
        }
      } catch (error) {
        // Ignore errors and continue checking
      }
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    return false;
  }

  /**
   * Ensure directory exists with retries
   * @param {string} dir - Directory path
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<void>}
   */
  async ensureDirectoryExists(dir, maxRetries = 3) {
    let retries = maxRetries;
    while (retries > 0) {
      try {
        if (!fs.existsSync(dir)) {
          console.log('Creating directory:', dir);
          this.createDirectoryWindows(dir);
          
          // Wait for directory to be ready
          let ready = false;
          for (let i = 0; i < 20; i++) { // Try for 2 seconds
            if (fs.existsSync(dir)) {
              try {
                // Try to create a test file
                const testFile = path.join(dir, '.test_' + Date.now());
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                ready = true;
                break;
              } catch (error) {
                // Ignore error and continue checking
              }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          if (!ready) {
            throw new Error(`Directory not ready after creation: ${dir}`);
          }
        }
        return;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        console.log(`Retrying directory creation (${retries} attempts left)...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  /**
   * Sanitize timestamp for Windows compatibility
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Windows-compatible timestamp
   */
  sanitizeTimestamp(timestamp) {
    return timestamp.replace(/:/g, '-').replace(/\./g, '-');
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
    const timestamp = this.sanitizeTimestamp(new Date().toISOString());
    const backupPath = path.join(this.backupDir, `${backupId}_${timestamp}`);

    try {
      // Debug logging
      console.log('Creating backup directory:', backupPath);
      console.log('Parent directory exists:', fs.existsSync(path.dirname(backupPath)));
      console.log('Parent directory path:', path.dirname(backupPath));
      
      // Ensure all parent directories exist
      const dirs = [
        path.join(__dirname, '../../tmp'),
        this.backupDir,
        path.dirname(backupPath)
      ];
      
      // Create directories sequentially
      for (const dir of dirs) {
        await this.ensureDirectoryExists(dir);
      }
      
      // Create backup directory
      await this.ensureDirectoryExists(backupPath);

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
        description: options.description || 'Automated backup',
        status: 'success'
      });

      // Clean up old backups
      await this.cleanupOldBackups();

      this.lastBackup = timestamp;
      return backupId;
    } catch (error) {
      // Debug logging for error
      console.error('Backup creation error:', error);
      console.error('Error details:', {
        code: error.code,
        path: error.path,
        syscall: error.syscall
      });

      // Update manifest with error information
      if (fs.existsSync(backupPath)) {
        await this.createBackupManifest(backupPath, {
          id: backupId,
          timestamp,
          type: options.type || 'scheduled',
          description: options.description || 'Automated backup',
          status: 'failed',
          error: error.message
        });
      }

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