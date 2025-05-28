/**
 * Runner script for the Firefly tests
 * This script executes the comprehensive test suite for the Firefly entity
 */

const assert = require('assert');
const Firefly = require('../entities/firefly');
const World = require('../world/world');
const ParticleSystem = require('../particles/particleSystem');
const MangroveSwampBiome = require('../biomes/mangroveSwampBiome');

// Test world implementation
class TestWorld extends World {
  constructor() {
    super();
    this.blocks = new Map();
    this.particleSystem = new ParticleSystem();
    this.timeOfDay = 0.8; // Start at night
    this.entities = new Map();
  }
  
  getBlockAt(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks.get(key) || { type: 'air', isSolid: false };
  }
  
  getHighestBlock(x, z) {
    return 64; // Simulate flat terrain
  }
  
  setBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    this.blocks.set(key, block);
  }

  addEntity(entity) {
    this.entities.set(entity.id, entity);
  }
  
  getEntitiesInRadius(position, radius) {
    return Array.from(this.entities.values());
  }
}

// Run all test suites
function runTests() {
  console.log('Starting Firefly test suite...');
  
  let passed = 0;
  let failed = 0;
  let errors = [];

  // Test basic firefly properties and behavior
  try {
    const testWorld = new TestWorld();
    const firefly = new Firefly(testWorld, {
      position: { x: 10, y: 66, z: 10 },
      glowColor: '#FFFF77',
      glowIntensity: 0.8
    });

    // Basic Properties Tests
    assert.strictEqual(firefly.type, 'firefly');
    assert.deepStrictEqual(firefly.position, { x: 10, y: 66, z: 10 });
    assert.strictEqual(firefly.glowColor, '#FFFF77');
    assert.strictEqual(firefly.active, true);
    assert.strictEqual(firefly.health, 1);
    assert.strictEqual(firefly.maxHealth, 1);
    passed++;
  } catch (error) {
    failed++;
    errors.push(`Basic properties test failed: ${error.message}`);
  }

  // Test lifecycle behavior
  try {
    const testWorld = new TestWorld();
    const firefly = new Firefly(testWorld, {
      position: { x: 10, y: 66, z: 10 }
    });

    // Test daytime inactivity
    testWorld.timeOfDay = 0.5; // Daytime
    firefly.update(testWorld, [], [], 100);
    assert.strictEqual(firefly.active, false, 'Firefly should be inactive during the day');
    
    // Test nighttime activity
    testWorld.timeOfDay = 0.8; // Nighttime
    firefly.update(testWorld, [], [], 100);
    assert.strictEqual(firefly.active, true, 'Firefly should be active during the night');
    passed++;
  } catch (error) {
    failed++;
    errors.push(`Lifecycle behavior test failed: ${error.message}`);
  }

  // Test biome integration
  try {
    const testWorld = new TestWorld();
    const biome = new MangroveSwampBiome();
    
    // Generate ambient entities
    const position = { x: 100, y: 65, z: 100 };
    const radius = 16;
    const random = () => 0.5; // Consistent random value for testing
    
    biome.generateAmbientEntities(testWorld, position, radius, random);
    
    // Check if fireflies were spawned
    const entities = testWorld.getEntitiesInRadius(position, radius);
    const fireflies = entities.filter(e => e.type === 'firefly');
    
    assert.ok(fireflies.length > 0, 'Should spawn at least one firefly');
    passed++;
  } catch (error) {
    failed++;
    errors.push(`Biome integration test failed: ${error.message}`);
  }

  // Print test results
  console.log('\nTest Results:');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(error => console.log(`- ${error}`));
  }

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests(); 