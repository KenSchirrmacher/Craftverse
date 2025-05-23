const fs = require('fs').promises;
const path = require('path');

class DataManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data');
    this.ensureDataDirectory();
  }

  async ensureDataDirectory() {
    try {
      await fs.access(this.dataPath);
    } catch {
      await fs.mkdir(this.dataPath, { recursive: true });
    }
  }

  async saveData(key, data) {
    const filePath = path.join(this.dataPath, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async loadData(key) {
    const filePath = path.join(this.dataPath, `${key}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async deleteData(key) {
    const filePath = path.join(this.dataPath, `${key}.json`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async listData() {
    try {
      const files = await fs.readdir(this.dataPath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async clearAll() {
    const files = await this.listData();
    await Promise.all(files.map(file => this.deleteData(file)));
  }
}

// Create singleton instance
const dataManager = new DataManager();
module.exports = dataManager; 