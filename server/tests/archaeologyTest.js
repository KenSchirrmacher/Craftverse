/**
 * Tests for the archaeology system
 */

const assert = require('assert');
const ArchaeologyManager = require('../archaeology/archaeologyManager');
const BrushItem = require('../archaeology/brushItem');
const SuspiciousSandBlock = require('../archaeology/suspiciousSandBlock');
const SuspiciousGravelBlock = require('../archaeology/suspiciousGravelBlock');

describe('Archaeology System', () => {
  let archaeologyManager;
  let brush;
  let sandBlock;
  let gravelBlock;

  beforeEach(() => {
    archaeologyManager = new ArchaeologyManager();
    brush = new BrushItem();
    sandBlock = new SuspiciousSandBlock();
    gravelBlock = new SuspiciousGravelBlock();
  });

  describe('ArchaeologyManager', () => {
    it('should initialize with correct properties', () => {
      assert.strictEqual(archaeologyManager.brushDurability, 64);
      assert.strictEqual(archaeologyManager.excavationTime, 2.5);
      assert.ok(archaeologyManager.lootTables);
    });

    it('should validate suspicious blocks correctly', () => {
      assert.strictEqual(archaeologyManager.isValidBlock(sandBlock), true);
      assert.strictEqual(archaeologyManager.isValidBlock(gravelBlock), true);
      assert.strictEqual(archaeologyManager.isValidBlock({ type: 'dirt' }), false);
    });

    it('should generate loot with correct rarity distribution', () => {
      const results = {
        common: 0,
        uncommon: 0,
        rare: 0
      };

      // Generate 1000 loot items to test distribution
      for (let i = 0; i < 1000; i++) {
        const loot = archaeologyManager.generateLoot('suspicious_sand');
        if (loot) {
          results[loot.rarity]++;
        }
      }

      // Check if distribution is roughly correct (with some margin for randomness)
      assert.ok(results.common > 500 && results.common < 700); // ~60%
      assert.ok(results.uncommon > 250 && results.uncommon < 350); // ~30%
      assert.ok(results.rare > 50 && results.rare < 150); // ~10%
    });
  });

  describe('BrushItem', () => {
    it('should initialize with correct properties', () => {
      assert.strictEqual(brush.id, 'brush');
      assert.strictEqual(brush.name, 'Brush');
      assert.strictEqual(brush.maxStackSize, 1);
      assert.strictEqual(brush.durability, 64);
      assert.strictEqual(brush.maxDurability, 64);
    });

    it('should damage correctly', () => {
      brush.damage();
      assert.strictEqual(brush.durability, 63);
    });

    it('should break when durability reaches 0', () => {
      let breakEventEmitted = false;
      brush.on('break', () => {
        breakEventEmitted = true;
      });

      for (let i = 0; i < 64; i++) {
        brush.damage();
      }

      assert.strictEqual(brush.durability, 0);
      assert.strictEqual(breakEventEmitted, true);
    });

    it('should repair correctly', () => {
      brush.durability = 50;
      brush.repair(10);
      assert.strictEqual(brush.durability, 60);
    });

    it('should not repair beyond max durability', () => {
      brush.durability = 60;
      brush.repair(10);
      assert.strictEqual(brush.durability, 64);
    });
  });

  describe('Suspicious Blocks', () => {
    it('should initialize with correct properties', () => {
      assert.strictEqual(sandBlock.id, 'suspicious_sand');
      assert.strictEqual(sandBlock.name, 'Suspicious Sand');
      assert.strictEqual(sandBlock.hardness, 0.5);
      assert.strictEqual(sandBlock.blastResistance, 0.5);
      assert.strictEqual(sandBlock.isExcavated, false);
      assert.strictEqual(sandBlock.loot, null);

      assert.strictEqual(gravelBlock.id, 'suspicious_gravel');
      assert.strictEqual(gravelBlock.name, 'Suspicious Gravel');
      assert.strictEqual(gravelBlock.hardness, 0.6);
      assert.strictEqual(gravelBlock.blastResistance, 0.6);
      assert.strictEqual(gravelBlock.isExcavated, false);
      assert.strictEqual(gravelBlock.loot, null);
    });

    it('should handle excavation state correctly', () => {
      const testLoot = { type: 'pottery_shard', rarity: 'common' };
      
      sandBlock.setExcavated(testLoot);
      assert.strictEqual(sandBlock.isExcavated, true);
      assert.deepStrictEqual(sandBlock.getLoot(), testLoot);
      assert.strictEqual(sandBlock.canBeExcavated(), false);

      gravelBlock.setExcavated(testLoot);
      assert.strictEqual(gravelBlock.isExcavated, true);
      assert.deepStrictEqual(gravelBlock.getLoot(), testLoot);
      assert.strictEqual(gravelBlock.canBeExcavated(), false);
    });
  });

  describe('Serialization', () => {
    it('should correctly serialize and deserialize brush state', () => {
      brush.durability = 50;
      const serialized = brush.toJSON();
      const deserialized = BrushItem.fromJSON(serialized);
      
      assert.strictEqual(deserialized.durability, 50);
      assert.strictEqual(deserialized.maxDurability, 64);
    });

    it('should correctly serialize and deserialize block state', () => {
      const testLoot = { type: 'diamond', rarity: 'rare' };
      
      sandBlock.setExcavated(testLoot);
      const serializedSand = sandBlock.toJSON();
      const deserializedSand = SuspiciousSandBlock.fromJSON(serializedSand);
      
      assert.strictEqual(deserializedSand.isExcavated, true);
      assert.deepStrictEqual(deserializedSand.loot, testLoot);

      gravelBlock.setExcavated(testLoot);
      const serializedGravel = gravelBlock.toJSON();
      const deserializedGravel = SuspiciousGravelBlock.fromJSON(serializedGravel);
      
      assert.strictEqual(deserializedGravel.isExcavated, true);
      assert.deepStrictEqual(deserializedGravel.loot, testLoot);
    });
  });
}); 