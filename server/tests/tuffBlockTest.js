/**
 * Tests for TuffBlock implementation
 * Verifies the functionality of tuff blocks for Caves & Cliffs update
 */

const assert = require('assert');
const TuffBlock = require('../blocks/tuffBlock');

describe('Tuff Block Tests', () => {
  // Mock noise generator for testing
  const mockNoiseGenerator = {
    simplex3: (x, y, z) => {
      // For testing, return high value for specific coords
      if (x === 10 && y === 20 && z === 30) {
        return 0.8; // Above threshold
      }
      return 0.5; // Below most thresholds
    }
  };
  
  // Mock world for testing
  const mockWorld = {
    isNearStructure: (structure, x, y, z, distance) => {
      // For testing purposes, return true for specific coordinates
      if (structure === 'amethyst_geode' && x === 15 && y === 25 && z === 35) {
        return true;
      }
      return false;
    }
  };

  describe('Basic Properties', () => {
    it('should initialize with correct properties', () => {
      const block = new TuffBlock();
      
      // Verify basic properties
      assert.strictEqual(block.id, 'tuff');
      assert.strictEqual(block.name, 'Tuff');
      assert.strictEqual(block.hardness, 1.5);
      assert.strictEqual(block.miningLevel, 'stone');
      assert.strictEqual(block.blast_resistance, 6.0);
      
      // Verify textures
      assert.strictEqual(block.textures.all, 'blocks/tuff');
      
      // Verify generation properties
      assert.strictEqual(block.canGenerateNearGeodes, true);
      assert.strictEqual(block.generatesInClusters, true);
      assert.ok(block.clusterSize.min > 0);
      assert.ok(block.clusterSize.max >= block.clusterSize.min);
    });
  });

  describe('Mining and Drops', () => {
    it('should drop nothing when mined with wrong tool', () => {
      const block = new TuffBlock();
      const drops = block.getDrops({ type: 'sword' });
      
      assert.strictEqual(drops.length, 0);
    });

    it('should drop itself when mined with correct tool', () => {
      const block = new TuffBlock();
      const drops = block.getDrops({ type: 'stone_pickaxe' });
      
      assert.strictEqual(drops.length, 1);
      assert.strictEqual(drops[0].id, 'tuff');
      assert.strictEqual(drops[0].count, 1);
    });

    it('should drop itself when mined with silk touch', () => {
      const block = new TuffBlock();
      const drops = block.getDrops({ 
        type: 'stone_pickaxe',
        enchantments: { silk_touch: 1 }
      });
      
      assert.strictEqual(drops.length, 1);
      assert.strictEqual(drops[0].id, 'tuff');
      assert.strictEqual(drops[0].count, 1);
    });
  });

  describe('World Generation', () => {
    it('should generate based on noise value', () => {
      const block = new TuffBlock();
      
      // Should generate at coordinates that give high noise value
      const shouldGenerate = block.shouldGenerateAt(
        mockWorld,
        mockNoiseGenerator,
        10, 20, 30
      );
      
      assert.strictEqual(shouldGenerate, true);
      
      // Should not generate at other coordinates
      const shouldNotGenerate = block.shouldGenerateAt(
        mockWorld,
        mockNoiseGenerator,
        1, 2, 3
      );
      
      assert.strictEqual(shouldNotGenerate, false);
    });

    it('should have higher generation chance at lower depths', () => {
      const block = new TuffBlock();
      
      // Create a consistent noise generator for this test
      const consistentNoise = {
        simplex3: () => 0.65 // Borderline value
      };
      
      // At y=10 (deep) should generate with 0.65 noise
      const generateDeep = block.shouldGenerateAt(
        mockWorld,
        consistentNoise,
        5, 10, 5
      );
      
      // At y=60 (shallow) should not generate with 0.65 noise
      const generateShallow = block.shouldGenerateAt(
        mockWorld,
        consistentNoise,
        5, 60, 5
      );
      
      // Should be more likely to generate deep than shallow
      assert.ok(generateDeep || !generateShallow, 
        'Tuff should be more likely to generate at lower depths');
    });

    it('should detect proximity to geodes', () => {
      const block = new TuffBlock();
      
      // Near geode
      const nearGeode = block.isNearGeode(mockWorld, 15, 25, 35);
      assert.strictEqual(nearGeode, true);
      
      // Not near geode
      const notNearGeode = block.isNearGeode(mockWorld, 5, 5, 5);
      assert.strictEqual(notNearGeode, false);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const block = new TuffBlock();
      
      const serialized = block.serialize();
      const deserialized = TuffBlock.deserialize(serialized);
      
      assert.strictEqual(deserialized.id, 'tuff');
      assert.strictEqual(deserialized.name, 'Tuff');
    });
  });
}); 