const assert = require('assert');
const { LootTable } = require('../loot/lootTable');

describe('LootTable', () => {
  let lootTable;

  beforeEach(() => {
    lootTable = new LootTable();
  });

  describe('Loot Generation', () => {
    it('should generate loot based on difficulty', () => {
      const commonLoot = lootTable.generateLoot(1);
      const uncommonLoot = lootTable.generateLoot(2);
      const rareLoot = lootTable.generateLoot(4);

      assert.strictEqual(commonLoot.length >= 2 && commonLoot.length <= 4, true);
      assert.strictEqual(uncommonLoot.length >= 2 && uncommonLoot.length <= 4, true);
      assert.strictEqual(rareLoot.length >= 2 && rareLoot.length <= 4, true);
    });

    it('should generate items with correct counts', () => {
      const loot = lootTable.generateLoot(1);
      
      for (const item of loot) {
        assert.strictEqual(item.count >= 1, true);
        assert.strictEqual(typeof item.item, 'string');
      }
    });

    it('should use correct loot pool for each difficulty', () => {
      const commonLoot = lootTable.generateLoot(1);
      const uncommonLoot = lootTable.generateLoot(2);
      const rareLoot = lootTable.generateLoot(4);

      // Check that common loot contains common items
      const commonItems = new Set(lootTable.lootPools.common.map(item => item.item));
      for (const item of commonLoot) {
        assert.strictEqual(commonItems.has(item.item), true);
      }

      // Check that uncommon loot contains uncommon items
      const uncommonItems = new Set(lootTable.lootPools.uncommon.map(item => item.item));
      for (const item of uncommonLoot) {
        assert.strictEqual(uncommonItems.has(item.item), true);
      }

      // Check that rare loot contains rare items
      const rareItems = new Set(lootTable.lootPools.rare.map(item => item.item));
      for (const item of rareLoot) {
        assert.strictEqual(rareItems.has(item.item), true);
      }
    });
  });

  describe('Item Selection', () => {
    it('should select items based on weight', () => {
      const pool = [
        { item: 'common', weight: 10 },
        { item: 'uncommon', weight: 5 },
        { item: 'rare', weight: 1 }
      ];

      const selections = new Map();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const selected = lootTable.selectRandomItem(pool);
        selections.set(selected.item, (selections.get(selected.item) || 0) + 1);
      }

      // Check that more common items are selected more often
      assert.strictEqual(selections.get('common') > selections.get('uncommon'), true);
      assert.strictEqual(selections.get('uncommon') > selections.get('rare'), true);
    });

    it('should handle empty pool', () => {
      const emptyPool = [];
      assert.strictEqual(lootTable.selectRandomItem(emptyPool), undefined);
    });
  });

  describe('Count Generation', () => {
    it('should generate counts within specified range', () => {
      const min = 1;
      const max = 5;
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const count = lootTable.getRandomCount(min, max);
        assert.strictEqual(count >= min && count <= max, true);
      }
    });

    it('should handle equal min and max', () => {
      const count = lootTable.getRandomCount(5, 5);
      assert.strictEqual(count, 5);
    });

    it('should handle invalid ranges', () => {
      assert.throws(() => lootTable.getRandomCount(5, 1));
    });
  });
}); 