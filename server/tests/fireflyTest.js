/**
 * Tests for Firefly entity implementation
 * Verifies proper movement, particle generation, light emission, and serialization
 */

const assert = require('assert');
const Firefly = require('../entities/firefly');
const World = require('../world/world');
const ParticleSystem = require('../particles/particleSystem');

describe('Firefly Entity', () => {
  // Test world implementation
  class TestWorld extends World {
    constructor() {
      super();
      this.blocks = new Map();
      this.particleSystem = new ParticleSystem();
      this.timeOfDay = 0.8; // Start at night
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
  }

  let testWorld;
  let testPlayers;

  beforeEach(() => {
    testWorld = new TestWorld();
    testPlayers = [
      {
        id: 'player1',
        position: { x: 100, y: 65, z: 100 }, // Far from the firefly
        size: { width: 0.6, height: 1.8, depth: 0.6 }
      }
    ];
  });

  it('should pass all firefly entity behaviors', () => {
    // Create firefly instance for testing
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
    assert.strictEqual(typeof firefly.glowCycleSpeed, 'number');
    assert.strictEqual(typeof firefly.hoverHeight, 'number');
    assert.strictEqual(typeof firefly.moveSpeed, 'number');
    
    // Size test
    assert.ok(firefly.size.width < 0.3, 'Firefly should be small');
    assert.ok(firefly.size.height < 0.3, 'Firefly should be small');
    assert.ok(firefly.size.depth < 0.3, 'Firefly should be small');
    
    // Lifecycle Tests
    console.log('Testing lifecycle behavior...');
    // Test daytime inactivity
    testWorld.timeOfDay = 0.5; // Daytime
    firefly.update(testWorld, testPlayers, [], 100);
    assert.strictEqual(firefly.active, false, 'Firefly should be inactive during the day');
    
    // Test nighttime activity
    testWorld.timeOfDay = 0.8; // Nighttime
    firefly.update(testWorld, testPlayers, [], 100);
    assert.strictEqual(firefly.active, true, 'Firefly should be active during the night');
    
    console.log('Testing spawn position behavior...');
    // Test distance from spawn
    firefly.position = { x: 50, y: 70, z: 50 };
    firefly.spawnPosition = { x: 10, y: 66, z: 10 };
    firefly.maxDistanceFromSpawn = 5; // Very short distance
    
    const initialDistance = firefly.getDistanceFromSpawn();
    
    // Update several times
    for (let i = 0; i < 10; i++) {
      firefly.update(testWorld, testPlayers, [], 100);
    }
    
    const newDistance = firefly.getDistanceFromSpawn();
    assert.ok(newDistance < initialDistance, 'Firefly should move closer to spawn when too far away');
    
    console.log('Testing glow cycle...');
    // Test glow cycle
    const initialIntensity = firefly.glowIntensity;
    firefly.glowCycleSpeed = 1.0;
    firefly.glowState = 0;
    
    firefly.update(testWorld, testPlayers, [], 100);
    firefly.update(testWorld, testPlayers, [], 100);
    firefly.update(testWorld, testPlayers, [], 100);
    
    assert.notStrictEqual(initialIntensity, firefly.glowIntensity, 'Glow intensity should change over time');
    
    console.log('Testing flee behavior...');
    // Test fleeing from players
    firefly.position = { x: 10, y: 66, z: 10 };
    
    // Create a player very close to the firefly
    const nearbyPlayer = {
      id: 'player2',
      position: { x: 11, y: 66, z: 11 }, // 1.4 blocks away
      size: { width: 0.6, height: 1.8, depth: 0.6 }
    };
    
    // Add the nearby player to the players array
    testPlayers.push(nearbyPlayer);
    
    // Get initial position
    const initialPosition = { ...firefly.position };
    
    // Update the firefly
    firefly.update(testWorld, testPlayers, [], 200);
    
    // Calculate direction of movement
    const moveVectorX = firefly.position.x - initialPosition.x;
    const moveVectorZ = firefly.position.z - initialPosition.z;
    
    // Should have moved away from player
    // Direction should be approximately away from player position
    const awayVectorX = initialPosition.x - nearbyPlayer.position.x;
    const awayVectorZ = initialPosition.z - nearbyPlayer.position.z;
    
    // Check if directions are similar (dot product should be positive)
    const dotProduct = moveVectorX * awayVectorX + moveVectorZ * awayVectorZ;
    assert.ok(dotProduct > 0, 'Firefly should move away from nearby players');
    
    console.log('Testing particle emission...');
    // Test particle emission
    firefly.lastParticleTime = 0; // Reset to force emission
    firefly.glowIntensity = 1.0; // Maximum glow
    
    // Clear any existing particles
    testWorld.particleSystem.clearParticles();
    
    firefly.update(testWorld, testPlayers, [], 1000);
    
    // Check if particles were emitted
    const particles = testWorld.particleSystem.getParticles();
    assert.ok(particles.length > 0, 'Firefly should emit particles');
    
    // Verify particle properties
    const particle = particles[0];
    assert.strictEqual(particle.type, 'firefly_glow', 'Particle type should be firefly_glow');
    assert.strictEqual(particle.color, firefly.glowColor, 'Particle color should match firefly glow color');
    
    console.log('Testing light emission...');
    // Test light emission
    firefly.active = true;
    firefly.glowIntensity = 0.8;
    
    const lightSource = firefly.getLightSource();
    
    assert.ok(lightSource, 'Firefly should provide a light source');
    assert.strictEqual(lightSource.color, firefly.glowColor, 'Light color should match glow color');
    assert.ok(lightSource.intensity > 0, 'Light intensity should be positive');
    assert.ok(lightSource.radius > 0, 'Light radius should be positive');
    assert.strictEqual(lightSource.flicker, true, 'Light should flicker');
    
    console.log('Testing inactivity behavior...');
    // Test inactive light
    firefly.active = false;
    const inactiveLight = firefly.getLightSource();
    assert.strictEqual(inactiveLight, null, 'Inactive firefly should not emit light');
    
    console.log('Testing serialization...');
    // Test serialization
    const serializedData = firefly.serialize();
    assert.strictEqual(serializedData.type, 'firefly', 'Serialized data should preserve type');
    assert.deepStrictEqual(serializedData.position, firefly.position, 'Serialized data should preserve position');
    assert.strictEqual(serializedData.glowColor, firefly.glowColor, 'Serialized data should preserve glow color');
    
    // Test deserialization
    const restoredFirefly = Firefly.fromJSON(serializedData, testWorld);
    assert.strictEqual(restoredFirefly.type, 'firefly', 'Deserialized firefly should preserve type');
    assert.deepStrictEqual(restoredFirefly.position, firefly.position, 'Deserialized firefly should preserve position');
    assert.strictEqual(restoredFirefly.glowColor, firefly.glowColor, 'Deserialized firefly should preserve glow color');
  });
}); 