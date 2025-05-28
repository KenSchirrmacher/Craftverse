/**
 * Tests for Mangrove Swamp Biome implementation
 * Verifies proper terrain generation, feature placement, and entity spawning
 */

const assert = require('assert');
const MangroveSwampBiome = require('../biomes/mangroveSwampBiome');
const World = require('../world/world');
const Firefly = require('../entities/firefly');
const ParticleSystem = require('../particles/particleSystem');

describe('Mangrove Swamp Biome', () => {
  // Test world implementation
  class TestWorld extends World {
    constructor() {
      super();
      this.blocks = new Map();
      this.entities = new Map();
      this.timeOfDay = 0.8; // Start at night
      this.particleSystem = new ParticleSystem();
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

    getHighestBlock(x, z) {
      return 64; // Simulate flat terrain
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

  it('should spawn fireflies in appropriate locations', () => {
    // Set up test environment
    testWorld.blocks.set('100,64,100', { type: 'mangrove_log' });
    testWorld.blocks.set('100,65,100', { type: 'mangrove_leaves' });
    
    const position = { x: 100, y: 65, z: 100 };
    const radius = 16;
    const random = () => 0.5;
    
    biome.generateAmbientEntities(testWorld, position, radius, random);
    
    const entities = testWorld.getEntitiesInRadius(position, radius);
    const fireflies = entities.filter(e => e.type === 'firefly');
    
    // Verify firefly positions
    fireflies.forEach(firefly => {
      assert.ok(firefly.position.y >= 65, 'Fireflies should spawn above ground level');
      assert.ok(firefly.position.y <= 70, 'Fireflies should not spawn too high');
      
      // Check if near mangrove trees
      const nearTree = testWorld.getBlockAt(
        Math.floor(firefly.position.x),
        Math.floor(firefly.position.y),
        Math.floor(firefly.position.z)
      ).type === 'mangrove_leaves';
      
      assert.ok(nearTree, 'Fireflies should spawn near mangrove trees');
    });
  });

  it('should handle firefly group behavior', () => {
    const position = { x: 100, y: 65, z: 100 };
    const radius = 16;
    const random = () => 0.5;
    
    biome.generateAmbientEntities(testWorld, position, radius, random);
    
    const entities = testWorld.getEntitiesInRadius(position, radius);
    const fireflies = entities.filter(e => e.type === 'firefly');
    
    // Check for group formation
    const groups = new Map();
    fireflies.forEach(firefly => {
      if (firefly.groupId) {
        if (!groups.has(firefly.groupId)) {
          groups.set(firefly.groupId, []);
        }
        groups.get(firefly.groupId).push(firefly);
      }
    });
    
    // Verify group properties
    groups.forEach((group, groupId) => {
      assert.ok(group.length >= 2, 'Groups should have at least 2 fireflies');
      assert.ok(group.length <= 5, 'Groups should not be too large');
      
      // Check group leader
      const leader = group.find(f => f.isGroupLeader);
      assert.ok(leader, 'Each group should have a leader');
      
      // Check group cohesion
      const leaderPos = leader.position;
      group.forEach(firefly => {
        if (firefly !== leader) {
          const distance = Math.sqrt(
            Math.pow(firefly.position.x - leaderPos.x, 2) +
            Math.pow(firefly.position.y - leaderPos.y, 2) +
            Math.pow(firefly.position.z - leaderPos.z, 2)
          );
          assert.ok(distance <= 3, 'Group members should stay close to leader');
        }
      });
    });
  });

  it('should handle firefly day/night cycle', () => {
    const position = { x: 100, y: 65, z: 100 };
    const radius = 16;
    const random = () => 0.5;
    
    // Spawn fireflies at night
    testWorld.timeOfDay = 0.8;
    biome.generateAmbientEntities(testWorld, position, radius, random);
    
    const entities = testWorld.getEntitiesInRadius(position, radius);
    const fireflies = entities.filter(e => e.type === 'firefly');
    
    // Verify night behavior
    fireflies.forEach(firefly => {
      assert.ok(firefly.active, 'Fireflies should be active at night');
      assert.ok(firefly.glowIntensity > 0, 'Fireflies should glow at night');
    });
    
    // Update to daytime
    testWorld.timeOfDay = 0.5;
    fireflies.forEach(firefly => {
      firefly.update(testWorld, [], [], 100);
      assert.ok(!firefly.active, 'Fireflies should be inactive during day');
      assert.strictEqual(firefly.glowIntensity, 0, 'Fireflies should not glow during day');
    });
  });
}); 