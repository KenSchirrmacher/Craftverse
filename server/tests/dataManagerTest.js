const { TestBase } = require('./testBase');
const dataManager = require('../systems/dataManager');
const fs = require('fs').promises;
const path = require('path');

class DataManagerTest extends TestBase {
  constructor() {
    super('DataManagerTest');
  }

  async runTests() {
    await this.testDataDirectoryCreation();
    await this.testSaveAndLoadData();
    await this.testDeleteData();
    await this.testListData();
    await this.testClearAll();
    await this.testErrorHandling();
  }

  async testDataDirectoryCreation() {
    const dataPath = path.join(__dirname, '../../data');
    try {
      await fs.access(dataPath);
      this.pass('Data directory exists');
    } catch {
      this.fail('Data directory should be created');
    }
  }

  async testSaveAndLoadData() {
    const testData = {
      key: 'test',
      value: 42,
      nested: { data: 'test' }
    };

    // Test saving data
    await dataManager.saveData('test', testData);
    this.pass('Data saved successfully');

    // Test loading data
    const loadedData = await dataManager.loadData('test');
    this.assert(loadedData.key === testData.key, 'Loaded data key should match');
    this.assert(loadedData.value === testData.value, 'Loaded data value should match');
    this.assert(loadedData.nested.data === testData.nested.data, 'Loaded nested data should match');

    // Test loading non-existent data
    const nonExistentData = await dataManager.loadData('non_existent');
    this.assert(nonExistentData === null, 'Loading non-existent data should return null');
  }

  async testDeleteData() {
    // Save test data
    await dataManager.saveData('delete_test', { test: true });

    // Test deleting data
    await dataManager.deleteData('delete_test');
    const deletedData = await dataManager.loadData('delete_test');
    this.assert(deletedData === null, 'Deleted data should not exist');

    // Test deleting non-existent data
    try {
      await dataManager.deleteData('non_existent');
      this.pass('Deleting non-existent data should not throw error');
    } catch (error) {
      this.fail('Deleting non-existent data should not throw error');
    }
  }

  async testListData() {
    // Save multiple test files
    await dataManager.saveData('list_test_1', { test: 1 });
    await dataManager.saveData('list_test_2', { test: 2 });

    // Test listing data
    const files = await dataManager.listData();
    this.assert(files.includes('list_test_1'), 'list_test_1 should be in file list');
    this.assert(files.includes('list_test_2'), 'list_test_2 should be in file list');

    // Clean up
    await dataManager.deleteData('list_test_1');
    await dataManager.deleteData('list_test_2');
  }

  async testClearAll() {
    // Save multiple test files
    await dataManager.saveData('clear_test_1', { test: 1 });
    await dataManager.saveData('clear_test_2', { test: 2 });

    // Test clearing all data
    await dataManager.clearAll();
    const files = await dataManager.listData();
    this.assert(files.length === 0, 'No files should remain after clearAll');
  }

  async testErrorHandling() {
    // Test saving invalid data
    try {
      await dataManager.saveData('error_test', undefined);
      this.fail('Should throw error for invalid data');
    } catch (error) {
      this.pass('Error thrown for invalid data');
    }

    // Test saving with invalid key
    try {
      await dataManager.saveData('', { test: true });
      this.fail('Should throw error for invalid key');
    } catch (error) {
      this.pass('Error thrown for invalid key');
    }
  }
}

module.exports = DataManagerTest; 