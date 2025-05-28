/**
 * Backup System Documentation Test Suite
 * Tests for verifying the backup system documentation
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const TestBase = require('./testBase');

class BackupSystemDocTest extends TestBase {
  constructor() {
    super('Backup System Documentation');
  }

  async runTests() {
    await this.testDocumentationExistence();
    await this.testDocumentationContent();
    await this.testDocumentationReferences();
  }

  async testDocumentationExistence() {
    this.test('Documentation File Existence', () => {
      const docPath = path.join(__dirname, '../../docs/backup-system.md');
      assert.ok(fs.existsSync(docPath), 'Backup system documentation file should exist');
    });
  }

  async testDocumentationContent() {
    this.test('Documentation Content', () => {
      const docPath = path.join(__dirname, '../../docs/backup-system.md');
      const content = fs.readFileSync(docPath, 'utf8');

      // Test for required sections
      const requiredSections = [
        '# Backup System Documentation',
        '## Overview',
        '## Features',
        '## Configuration',
        '## Usage',
        '## Backup Contents',
        '## Error Handling',
        '## Maintenance',
        '## Security Considerations',
        '## Recovery Procedures',
        '## Monitoring',
        '## Best Practices'
      ];

      requiredSections.forEach(section => {
        assert.ok(content.includes(section), `Documentation should include section: ${section}`);
      });

      // Test for configuration options
      const configOptions = [
        'backupDir',
        'maxBackups',
        'backupInterval',
        'maxErrors',
        'recoveryDelay'
      ];

      configOptions.forEach(option => {
        assert.ok(content.includes(option), `Documentation should include configuration option: ${option}`);
      });

      // Test for code examples
      assert.ok(content.includes('```javascript'), 'Documentation should include code examples');
    });
  }

  async testDocumentationReferences() {
    this.test('Documentation References', () => {
      const projectPath = path.join(__dirname, '../../project.txt');
      const projectContent = fs.readFileSync(projectPath, 'utf8');

      // Test for reference in project.txt
      assert.ok(
        projectContent.includes('docs/backup-system.md'),
        'project.txt should reference the backup system documentation'
      );

      // Test for backup procedures section
      assert.ok(
        projectContent.includes('Backup Procedures:'),
        'project.txt should include backup procedures section'
      );
    });
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new BackupSystemDocTest();
  test.runTests().then(() => {
    console.log('Backup System Documentation Tests completed successfully');
  }).catch(error => {
    console.error('Backup System Documentation Tests failed:', error);
    process.exit(1);
  });
}

module.exports = BackupSystemDocTest; 