/**
 * Backup System Project Documentation Test Suite
 * Tests for verifying the backup system documentation references in project.txt
 */

const assert = require('assert');
const TestBase = require('./testBase');
const fs = require('fs');
const path = require('path');

class BackupSystemProjectDocTest extends TestBase {
  constructor() {
    super('Backup System Project Documentation');
    this.projectPath = path.join(__dirname, '../../project.txt');
  }

  async runTests() {
    await this.testProjectDocReferences();
    await this.testBackupProcedures();
    await this.testDeploymentSection();
    await this.testMaintenanceSection();
  }

  async testProjectDocReferences() {
    this.test('Project Documentation References', () => {
      const content = fs.readFileSync(this.projectPath, 'utf8');
      
      // Test for documentation reference
      assert.ok(
        content.includes('docs/backup-system.md'),
        'project.txt should reference the backup system documentation'
      );
    });
  }

  async testBackupProcedures() {
    this.test('Backup Procedures Documentation', () => {
      const content = fs.readFileSync(this.projectPath, 'utf8');
      
      const requiredProcedures = [
        'Automated backups run every hour',
        'Manual backups available on demand',
        'Maximum of 10 backups retained',
        'Backup includes world data, player data, and configuration',
        'Backup restoration process documented',
        'Concurrent backups prevented',
        'Backup manifest tracks metadata',
        'Cleanup of old backups automated',
        'Error handling with exponential backoff',
        'Maximum error threshold (3) before system disable',
        'Automatic error recovery with retry mechanism',
        'Failed backup cleanup and manifest tracking',
        'Scheduler control (start/stop/update interval)'
      ];

      for (const procedure of requiredProcedures) {
        assert.ok(
          content.includes(procedure),
          `project.txt should include backup procedure: ${procedure}`
        );
      }
    });
  }

  async testDeploymentSection() {
    this.test('Deployment Section Documentation', () => {
      const content = fs.readFileSync(this.projectPath, 'utf8');
      
      // Test for deployment section
      assert.ok(
        content.includes('## Deployment'),
        'project.txt should include deployment section'
      );

      // Test for backup procedures in deployment section
      assert.ok(
        content.includes('Backup Procedures:'),
        'project.txt should include backup procedures in deployment section'
      );
    });
  }

  async testMaintenanceSection() {
    this.test('Maintenance Section Documentation', () => {
      const content = fs.readFileSync(this.projectPath, 'utf8');
      
      // Test for maintenance section
      assert.ok(
        content.includes('## Maintenance'),
        'project.txt should include maintenance section'
      );

      // Test for backup system in maintenance section
      assert.ok(
        content.includes('Backup System [x] Complete'),
        'project.txt should mark backup system as complete in maintenance section'
      );

      const requiredMaintenance = [
        'Automated backups',
        'Manual backups',
        'Backup restoration',
        'Backup cleanup',
        'Concurrent backup prevention',
        'Comprehensive testing'
      ];

      for (const item of requiredMaintenance) {
        assert.ok(
          content.includes(item),
          `project.txt should include maintenance item: ${item}`
        );
      }
    });
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new BackupSystemProjectDocTest();
  test.runTests().then(() => {
    console.log('Backup System Project Documentation Tests completed successfully');
  }).catch(error => {
    console.error('Backup System Project Documentation Tests failed:', error);
    process.exit(1);
  });
}

module.exports = BackupSystemProjectDocTest; 