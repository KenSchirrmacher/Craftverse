/**
 * Tests for the Deep Dark biome implementation
 */

const assert = require('assert');
const DeepDarkBiome = require('../biomes/deepDarkBiome');

describe('Deep Dark Biome', () => {
  let biome;
  
  beforeEach(() => {
    biome = new DeepDarkBiome();
  });
  
  describe('Basic properties', () => {
    it('should have correct identification values', () => {
      assert.strictEqual(biome.id, 'deep_dark');
      assert.strictEqual(biome.name, 'Deep Dark');
    });
    
    it('should have appropriate environmental settings', () => {
      assert.strictEqual(biome.temperature, 0.5);
      assert.strictEqual(biome.rainfall, 0.5);
      assert.strictEqual(biome.depth, -1.2);
      assert.ok(biome.depth < 0, 'Should be deep underground');
      assert.strictEqual(biome.color, '#0A0E14');
      assert.strictEqual(biome.fogColor, '#050505');
    });
    
    it('should use deepslate as main block type', () => {
      assert.strictEqual(biome.surfaceBlock, 'deepslate');
      assert.strictEqual(biome.fillerBlock, 'deepslate');
    });
    
    it('should have darkness and sculk growth enabled', () => {
      assert.strictEqual(biome.hasDarkness, true);
      assert.strictEqual(biome.hasSculkGrowth, true);
      assert.strictEqual(biome.allowsWardenSpawning, true);
    });
  });
  
  describe('Feature generation', () => {
    it('should contain sculk-related features', () => {
      const features = biome.getFeatures();
      
      // Check if sculk features exist
      const hasSculkPatch = features.some(f => f.type === 'sculk_patch');
      const hasSculkVein = features.some(f => f.type === 'sculk_vein');
      const hasSculkCatalyst = features.some(f => f.type === 'sculk_catalyst');
      const hasSculkShrieker = features.some(f => f.type === 'sculk_shrieker');
      const hasSculkSensor = features.some(f => f.type === 'sculk_sensor');
      
      assert.ok(hasSculkPatch, 'Should include sculk patches');
      assert.ok(hasSculkVein, 'Should include sculk veins');
      assert.ok(hasSculkCatalyst, 'Should include sculk catalysts');
      assert.ok(hasSculkShrieker, 'Should include sculk shriekers');
      assert.ok(hasSculkSensor, 'Should include sculk sensors');
    });
    
    it('should have higher diamond ore concentration', () => {
      const features = biome.getFeatures();
      const diamondOre = features.find(f => f.type === 'ore' && f.block === 'diamond_ore');
      
      assert.ok(diamondOre, 'Should have diamond ore generation');
      assert.ok(diamondOre.count >= 3, 'Should have at least 3 diamond ore veins');
    });
  });
  
  describe('Structure generation', () => {
    it('should potentially generate ancient cities', () => {
      // We'll need to mock the random number generation to test this reliably
      const originalRandom = biome.getRandomFromCoords;
      
      // Force structure to generate
      biome.getRandomFromCoords = () => 0.01; // Below the 0.05 threshold
      
      const structures = biome.getStructuresAt(100, 100);
      assert.ok(structures.includes('ancient_city'), 'Should generate ancient city');
      
      // Restore original method
      biome.getRandomFromCoords = originalRandom;
    });
    
    it('should not always generate cities (probability check)', () => {
      // Force structure to NOT generate
      const originalRandom = biome.getRandomFromCoords;
      biome.getRandomFromCoords = () => 0.99; // Above the threshold
      
      const structures = biome.getStructuresAt(100, 100);
      assert.ok(!structures.includes('ancient_city'), 'Should not always generate ancient city');
      
      // Restore original method
      biome.getRandomFromCoords = originalRandom;
    });
  });
  
  describe('Entity effects', () => {
    it('should apply darkness effect to players', () => {
      const mockPlayer = {
        type: 'player',
        statusEffects: [],
        addStatusEffect: function(effect, options) {
          this.statusEffects.push({ effect, ...options });
        }
      };
      
      // Player has been in biome for sufficient time
      biome.applyEntityEffects(mockPlayer, 150);
      
      const hasDarkness = mockPlayer.statusEffects.some(
        effect => effect.effect === 'darkness'
      );
      
      assert.ok(hasDarkness, 'Should apply darkness effect to players');
    });
    
    it('should not apply darkness to non-players', () => {
      const mockMob = {
        type: 'zombie',
        statusEffects: [],
        addStatusEffect: function(effect, options) {
          this.statusEffects.push({ effect, ...options });
        }
      };
      
      biome.applyEntityEffects(mockMob, 150);
      
      const hasDarkness = mockMob.statusEffects.some(
        effect => effect.effect === 'darkness'
      );
      
      assert.ok(!hasDarkness, 'Should not apply darkness to non-players');
    });
  });
  
  describe('Random generation consistency', () => {
    it('should produce consistent random values for the same coordinates', () => {
      const random1 = biome.getRandomFromCoords(100, 200, 'test');
      const random2 = biome.getRandomFromCoords(100, 200, 'test');
      
      assert.strictEqual(random1, random2, 'Random generation should be deterministic for same inputs');
      
      const random3 = biome.getRandomFromCoords(100, 200, 'different');
      assert.notStrictEqual(random1, random3, 'Different salts should produce different results');
    });
  });
}); 