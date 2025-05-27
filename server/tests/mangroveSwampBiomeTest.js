/**
 * Tests for Mangrove Swamp Biome implementation
 * Verifies proper terrain generation, feature placement, and entity spawning
 */

const assert = require('assert');
const MangroveSwampBiome = require('../biomes/mangroveSwampBiome');
const World = require('../world/world');
const Firefly = require('../entities/firefly');

describe('Mangrove Swamp Biome', () => {
  // Test world implementation
  class TestWorld extends World {
    constructor() {
      super();
      this.blocks = new Map();
      this.entities = new Map();
      this.timeOfDay = 0.8; // Start at night
    }
    
    getBlockAt(x, y, z) {
      const key = `${x},${y},${z}`;
      return this.blocks.get(key) || { type: 'air', isSolid: false };
    }
    
    getWaterDepth(x, z) {
      return 1; // Simulate shallow water
    }
    
    addEntity(entity) {
      this.entities.set(entity.id, entity);
    }
    
    getEntitiesInRadius(position, radius) {
      return Array.from(this.entities.values());
    }
  }

  let testWorld;
  let biome;

  beforeEach(() => {
    testWorld = new TestWorld();
    biome = new MangroveSwampBiome();
  });

  it('should have correct biome properties', () => {
    assert.strictEqual(biome.id, 'mangrove_swamp');
    assert.strictEqual(biome.name, 'Mangrove Swamp');
    assert.strictEqual(biome.temperature, 0.8);
    assert.strictEqual(biome.precipitation, 0.9);
    assert.strictEqual(biome.hasMangroves, true);
    assert.strictEqual(biome.hasMudBlocks, true);
    assert.strictEqual(biome.hasFrogs, true);
    assert.strictEqual(biome.hasFireflies, true);
  });

  it('should generate correct terrain height', () => {
    const baseNoise = 0.5;
    const height = biome.getHeightAt(100, 100, baseNoise);
    
    // Height should be within expected range
    assert.ok(height >= 0);
    assert.ok(height <= 1);
  });

  it('should place surface blocks correctly', () => {
    // Test underwater blocks
    const underwaterBlock = biome.getSurfaceBlock(100, 60, 100, 0, true);
    assert.strictEqual(underwaterBlock, 'mud');
    
    // Test above water blocks
    const aboveWaterBlock = biome.getSurfaceBlock(100, 70, 100, 0, false);
    assert.ok(['grass', 'mud'].includes(aboveWaterBlock));
  });

  it('should generate appropriate features', () => {
    const random = () => 0.5; // Consistent random value for testing
    const features = biome.getFeaturesAt(100, 100, random);
    
    // Should have some features
    assert.ok(features.length > 0);
    
    // Check feature types
    const featureTypes = features.map(f => f.type);
    assert.ok(featureTypes.includes('tree') || featureTypes.includes('mangrove_roots') || 
              featureTypes.includes('water_plant') || featureTypes.includes('hanging_vegetation'));
  });

  it('should apply correct entity effects', () => {
    const player = {
      id: 'player1',
      type: 'player',
      position: { x: 100, y: 65, z: 100 }
    };
    
    // Test mud effect
    testWorld.blocks.set('100,64,100', { type: 'mud' });
    const effects = biome.applyEntityEffects(player, 100, testWorld);
    assert.ok(effects.slowness);
    
    // Test shallow water effect
    testWorld.blocks.set('100,64,100', { type: 'water' });
    const waterEffects = biome.applyEntityEffects(player, 100, testWorld);
    assert.ok(waterEffects.slowness);
  });

  it('should spawn fireflies correctly', () => {
    // Generate ambient entities
    const position = { x: 100, y: 65, z: 100 };
    const radius = 16;
    const random = () => 0.5; // Consistent random value for testing
    
    biome.generateAmbientEntities(testWorld, position, radius, random);
    
    // Check if fireflies were spawned
    const entities = testWorld.getEntitiesInRadius(position, radius);
    const fireflies = entities.filter(e => e.type === 'firefly');
    
    assert.ok(fireflies.length > 0, 'Should spawn at least one firefly');
    
    // Verify firefly properties
    const firefly = fireflies[0];
    assert.strictEqual(firefly.type, 'firefly');
    assert.ok(firefly.glowColor);
    assert.ok(firefly.glowIntensity > 0);
    assert.ok(firefly.active);
  });

  it('should handle feature checks correctly', () => {
    assert.ok(biome.hasFeature('mangrove_trees'));
    assert.ok(biome.hasFeature('mud_blocks'));
    assert.ok(biome.hasFeature('frogs'));
    assert.ok(biome.hasFeature('water_pools'));
    assert.ok(!biome.hasFeature('nonexistent_feature'));
  });
}); 