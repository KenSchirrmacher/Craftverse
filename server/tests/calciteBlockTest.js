/**
 * Tests for CalciteBlock implementation
 * Verifies the functionality of calcite blocks for Caves & Cliffs update
 */

const assert = require('assert');
const CalciteBlock = require('../blocks/calciteBlock');

describe('Calcite Block Tests', () => {
  // Mock world for testing
  const mockWorld = {
    getBlockAt: (x, y, z) => {
      return null; // Mock function
    }
  };

  describe('Basic Properties', () => {
    it('should initialize with correct properties', () => {
      const block = new CalciteBlock();
      
      // Verify basic properties
      assert.strictEqual(block.id, 'calcite');
      assert.strictEqual(block.name, 'Calcite');
      assert.strictEqual(block.hardness, 0.75); // Softer than regular stone
      assert.strictEqual(block.miningLevel, 'stone');
      assert.strictEqual(block.blast_resistance, 0.75);
      
      // Verify textures
      assert.strictEqual(block.textures.all, 'blocks/calcite');
      
      // Verify generation properties
      assert.strictEqual(block.generateOnlyInGeodes, true);
      assert.strictEqual(block.geodePriority, 1); // Middle layer
      assert.ok(block.geodeLayerThickness.min > 0);
      assert.ok(block.geodeLayerThickness.max >= block.geodeLayerThickness.min);
    });
    
    it('should have slippery characteristics', () => {
      const block = new CalciteBlock();
      const slipperiness = block.getSlipperiness();
      
      // Should be more slippery than default blocks (0.5)
      assert.ok(slipperiness > 0.5);
      // But less slippery than ice (0.9)
      assert.ok(slipperiness < 0.9);
    });
    
    it('should have correct sound properties', () => {
      const block = new CalciteBlock();
      const sounds = block.getSounds();
      
      assert.strictEqual(sounds.break, 'block.calcite.break');
      assert.strictEqual(sounds.step, 'block.calcite.step');
      assert.strictEqual(sounds.place, 'block.calcite.place');
      assert.strictEqual(sounds.hit, 'block.calcite.hit');
      assert.strictEqual(sounds.fall, 'block.calcite.fall');
    });
  });

  describe('Mining and Drops', () => {
    it('should drop nothing when mined with wrong tool', () => {
      const block = new CalciteBlock();
      const drops = block.getDrops({ type: 'sword' });
      
      assert.strictEqual(drops.length, 0);
    });

    it('should drop itself when mined with correct tool', () => {
      const block = new CalciteBlock();
      const drops = block.getDrops({ type: 'stone_pickaxe' });
      
      assert.strictEqual(drops.length, 1);
      assert.strictEqual(drops[0].id, 'calcite');
      assert.strictEqual(drops[0].count, 1);
    });

    it('should drop itself when mined with silk touch', () => {
      const block = new CalciteBlock();
      const drops = block.getDrops({ 
        type: 'stone_pickaxe',
        enchantments: { silk_touch: 1 }
      });
      
      assert.strictEqual(drops.length, 1);
      assert.strictEqual(drops[0].id, 'calcite');
      assert.strictEqual(drops[0].count, 1);
    });
  });

  describe('Geode Generation', () => {
    it('should generate in the middle layer of geodes', () => {
      const block = new CalciteBlock();
      const geodeCenter = { x: 0, y: 0, z: 0 };
      const geodeRadius = 10;
      
      // Test points at different distances from center
      
      // Inside inner boundary (too close to center - should be amethyst)
      const tooClose = block.shouldGenerateInGeode(
        mockWorld, 
        geodeCenter, 
        geodeRadius, 
        0, 0, 7 // Distance = 7, inside inner radius (8)
      );
      assert.strictEqual(tooClose, false);
      
      // Inside calcite layer (middle layer)
      const correctDistance = block.shouldGenerateInGeode(
        mockWorld, 
        geodeCenter, 
        geodeRadius, 
        0, 0, 8.5 // Distance = 8.5, between inner (8) and outer (9) radius
      );
      assert.strictEqual(correctDistance, true);
      
      // Outside outer boundary (should be smooth basalt)
      const tooFar = block.shouldGenerateInGeode(
        mockWorld, 
        geodeCenter, 
        geodeRadius, 
        0, 0, 9.5 // Distance = 9.5, outside outer radius (9)
      );
      assert.strictEqual(tooFar, false);
    });
    
    it('should not generate if geode parameters are invalid', () => {
      const block = new CalciteBlock();
      
      // Null geode center
      const nullCenter = block.shouldGenerateInGeode(
        mockWorld,
        null,
        10,
        5, 5, 5
      );
      assert.strictEqual(nullCenter, false);
      
      // Zero radius
      const zeroRadius = block.shouldGenerateInGeode(
        mockWorld,
        { x: 0, y: 0, z: 0 },
        0,
        5, 5, 5
      );
      assert.strictEqual(zeroRadius, false);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const block = new CalciteBlock();
      
      const serialized = block.serialize();
      const deserialized = CalciteBlock.deserialize(serialized);
      
      assert.strictEqual(deserialized.id, 'calcite');
      assert.strictEqual(deserialized.name, 'Calcite');
    });
  });
}); 