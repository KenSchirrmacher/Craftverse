/**
 * Tests for DeepslateVariants implementation
 * Verifies the functionality of deepslate blocks for Caves & Cliffs update
 */

const assert = require('assert');
const {
  DeepslateBlock,
  CobbledDeepslateBlock,
  DeepslateBricksBlock,
  CrackedDeepslateBricksBlock,
  DeepslateTilesBlock,
  CrackedDeepslateTilesBlock,
  ChiseledDeepslateBlock,
  PolishedDeepslateBlock,
  DeepslateCoalOreBlock
} = require('../blocks/deepslateVariants');

describe('Deepslate Variants Tests', () => {
  // Mock world object for testing
  const mockWorld = {
    setBlock: (x, y, z, block) => {
      // Mock function
    },
    getBlockAt: (x, y, z) => {
      return null; // Mock function
    }
  };

  // Mock player object for testing
  const mockPlayer = {
    position: { x: 0, y: 0, z: 0 },
    direction: { x: 0, y: 0, z: 1 } // Facing north
  };

  describe('DeepslateBlock', () => {
    it('should initialize with correct properties', () => {
      const block = new DeepslateBlock();
      
      // Verify basic properties
      assert.strictEqual(block.id, 'deepslate');
      assert.strictEqual(block.name, 'Deepslate');
      assert.strictEqual(block.hardness, 3.0);
      assert.strictEqual(block.miningLevel, 'stone');
      assert.strictEqual(block.blast_resistance, 6.0);
      
      // Verify it's a directional/pillar block
      assert.strictEqual(block.directional, true);
      assert.strictEqual(block.pillarBlock, true);
      
      // Verify textures
      assert.strictEqual(block.textures.top, 'blocks/deepslate_top');
      assert.strictEqual(block.textures.sides, 'blocks/deepslate');
    });

    it('should drop cobbled deepslate when mined without silk touch', () => {
      const block = new DeepslateBlock();
      const drops = block.getDrops({ enchantments: {} });
      
      assert.strictEqual(drops.length, 1);
      assert.strictEqual(drops[0].id, 'cobbled_deepslate');
      assert.strictEqual(drops[0].count, 1);
    });

    it('should drop itself when mined with silk touch', () => {
      const block = new DeepslateBlock();
      const drops = block.getDrops({ enchantments: { silk_touch: 1 } });
      
      assert.strictEqual(drops.length, 1);
      assert.strictEqual(drops[0].id, 'deepslate');
      assert.strictEqual(drops[0].count, 1);
    });

    it('should be placed with correct orientation', () => {
      const block = new DeepslateBlock();
      
      // Place on top face (y+)
      block.onPlace(mockWorld, 0, 0, 0, mockPlayer, 1);
      assert.strictEqual(block.orientation, 'vertical');
      
      // Place on north face (z-)
      block.onPlace(mockWorld, 0, 0, 0, mockPlayer, 2);
      assert.strictEqual(block.orientation, 'vertical'); // Should default to vertical as a pillar block
    });

    it('should serialize and deserialize correctly', () => {
      const block = new DeepslateBlock();
      block.orientation = 'vertical';
      
      const serialized = block.serialize();
      const deserialized = DeepslateBlock.deserialize(serialized);
      
      assert.strictEqual(deserialized.id, 'deepslate');
      assert.strictEqual(deserialized.orientation, 'vertical');
    });
  });

  describe('CobbledDeepslateBlock', () => {
    it('should initialize with correct properties', () => {
      const block = new CobbledDeepslateBlock();
      
      assert.strictEqual(block.id, 'cobbled_deepslate');
      assert.strictEqual(block.name, 'Cobbled Deepslate');
      assert.strictEqual(block.hardness, 3.5);
      assert.strictEqual(block.miningLevel, 'stone');
      
      // Verify texture
      assert.strictEqual(block.textures.all, 'blocks/cobbled_deepslate');
    });

    it('should serialize and deserialize correctly', () => {
      const block = new CobbledDeepslateBlock();
      
      const serialized = block.serialize();
      const deserialized = CobbledDeepslateBlock.deserialize(serialized);
      
      assert.strictEqual(deserialized.id, 'cobbled_deepslate');
    });
  });

  describe('DeepslateBricksBlock', () => {
    it('should initialize with correct properties', () => {
      const block = new DeepslateBricksBlock();
      
      assert.strictEqual(block.id, 'deepslate_bricks');
      assert.strictEqual(block.name, 'Deepslate Bricks');
      assert.strictEqual(block.hardness, 3.5);
      
      // Verify texture
      assert.strictEqual(block.textures.all, 'blocks/deepslate_bricks');
    });
  });

  describe('DeepslateCoalOreBlock', () => {
    it('should initialize with correct properties', () => {
      const block = new DeepslateCoalOreBlock();
      
      assert.strictEqual(block.id, 'deepslate_coal_ore');
      assert.strictEqual(block.name, 'Deepslate Coal Ore');
      assert.strictEqual(block.hardness, 4.5); // Harder than regular coal ore
    });

    it('should drop coal when mined without silk touch', () => {
      const block = new DeepslateCoalOreBlock();
      const drops = block.getDrops({ enchantments: {} });
      
      assert.strictEqual(drops.length, 1);
      assert.strictEqual(drops[0].id, 'coal');
      assert.strictEqual(drops[0].count, 1);
    });

    it('should drop itself when mined with silk touch', () => {
      const block = new DeepslateCoalOreBlock();
      const drops = block.getDrops({ enchantments: { silk_touch: 1 } });
      
      assert.strictEqual(drops.length, 1);
      assert.strictEqual(drops[0].id, 'deepslate_coal_ore');
      assert.strictEqual(drops[0].count, 1);
    });

    it('should increase drops with fortune enchantment', () => {
      const block = new DeepslateCoalOreBlock();
      
      // Run multiple tests to account for randomness
      let hasIncreasedDrops = false;
      
      for (let i = 0; i < 50; i++) {
        const drops = block.getDrops({ enchantments: { fortune: 3 } });
        
        // Fortune 3 can increase drops
        if (drops[0].count > 1) {
          hasIncreasedDrops = true;
          break;
        }
      }
      
      assert.strictEqual(hasIncreasedDrops, true, 'Fortune enchantment should increase drops');
    });
  });

  // Test for other variants to ensure they exist with correct properties
  describe('Other Deepslate Variants', () => {
    it('should have all variant types implemented', () => {
      // Create instances of all variants
      const variants = [
        new CrackedDeepslateBricksBlock(),
        new DeepslateTilesBlock(),
        new CrackedDeepslateTilesBlock(),
        new ChiseledDeepslateBlock(),
        new PolishedDeepslateBlock()
      ];
      
      // Verify each variant has the correct basic properties
      variants.forEach(block => {
        assert.ok(block.id, 'Block should have an id');
        assert.ok(block.name, 'Block should have a name');
        assert.ok(block.hardness >= 3.0, 'Deepslate variants should have hardness >= 3.0');
        assert.ok(block.textures, 'Block should have textures defined');
      });
    });
  });
}); 