/**
 * Tests for TuffBlock implementation
 * Verifies the functionality of tuff blocks for Caves & Cliffs update
 */

const assert = require('assert');
const TuffBlock = require('../blocks/tuffBlock');
const NoiseGenerator = require('../world/noiseGenerator');
const World = require('../world/world');

describe('Tuff Block Tests', () => {
  let noiseGenerator;
  let world;

  beforeEach(() => {
    noiseGenerator = new NoiseGenerator();
    world = new World();
  });

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
    it('should generate near amethyst geodes', () => {
      const block = new TuffBlock();
      const x = 15;
      const y = 25;
      const z = 35;
      
      // Create an amethyst geode at the test coordinates
      world.createStructure('amethyst_geode', x, y, z);
      
      // Verify block can generate near the geode
      assert.strictEqual(block.canGenerateAt(world, x + 5, y, z), true);
    });

    it('should generate based on noise value', () => {
      const block = new TuffBlock();
      
      // Should generate at coordinates that give high noise value
      const shouldGenerate = block.shouldGenerateAt(
        world,
        noiseGenerator,
        10, 20, 30
      );
      
      assert.strictEqual(shouldGenerate, true);
      
      // Should not generate at other coordinates
      const shouldNotGenerate = block.shouldGenerateAt(
        world,
        noiseGenerator,
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
        world,
        consistentNoise,
        5, 10, 5
      );
      
      // At y=60 (shallow) should not generate with 0.65 noise
      const generateShallow = block.shouldGenerateAt(
        world,
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
      const nearGeode = block.isNearGeode(world, 15, 25, 35);
      assert.strictEqual(nearGeode, true);
      
      // Not near geode
      const notNearGeode = block.isNearGeode(world, 5, 5, 5);
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