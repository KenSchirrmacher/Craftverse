/**
 * Tests for Firefly entity implementation
 * Verifies proper movement, particle generation, light emission, and serialization
 */

const assert = require('assert');
const Firefly = require('../entities/firefly');

function runTests() {
  console.log('Running Firefly entity tests...');
  
  // Create mock world with essential methods
  const mockWorld = {
    timeOfDay: 0.8, // Night time
    particleSystem: {
      emitParticles: (options) => {
        mockWorld.lastParticleOptions = options;
        return [1]; // Return mock particle ID
      }
    },
    getBlockAt: (x, y, z) => {
      // Default to air blocks
      return { type: 'air' };
    },
    getHighestBlock: (x, z) => {
      // Simulate flat terrain at y=64
      return 64;
    }
  };
  
  // Create mock players for testing interactions
  const mockPlayers = [
    {
      id: 'player1',
      position: { x: 100, y: 65, z: 100 }, // Far from the firefly
      size: { width: 0.6, height: 1.8, depth: 0.6 }
    }
  ];
  
  try {
    console.log('Testing basic properties...');
    // Create firefly instance for testing
    const firefly = new Firefly(mockWorld, {
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
    
    console.log('Testing lifecycle behavior...');
    // Lifecycle Tests
    
    // Test daytime inactivity
    mockWorld.timeOfDay = 0.5; // Daytime
    firefly.update(mockWorld, mockPlayers, [], 100);
    assert.strictEqual(firefly.active, false, 'Firefly should be inactive during the day');
    
    // Test nighttime activity
    mockWorld.timeOfDay = 0.8; // Nighttime
    firefly.update(mockWorld, mockPlayers, [], 100);
    assert.strictEqual(firefly.active, true, 'Firefly should be active during the night');
    
    console.log('Testing spawn position behavior...');
    // Test distance from spawn
    firefly.position = { x: 50, y: 70, z: 50 };
    firefly.spawnPosition = { x: 10, y: 66, z: 10 };
    firefly.maxDistanceFromSpawn = 5; // Very short distance
    
    const initialDistance = firefly.getDistanceFromSpawn();
    
    // Update several times
    for (let i = 0; i < 10; i++) {
      firefly.update(mockWorld, mockPlayers, [], 100);
    }
    
    const newDistance = firefly.getDistanceFromSpawn();
    assert.ok(newDistance < initialDistance, 'Firefly should move closer to spawn when too far away');
    
    console.log('Testing glow cycle...');
    // Test glow cycle
    const initialIntensity = firefly.glowIntensity;
    firefly.glowCycleSpeed = 1.0;
    firefly.glowState = 0;
    
    firefly.update(mockWorld, mockPlayers, [], 100);
    firefly.update(mockWorld, mockPlayers, [], 100);
    firefly.update(mockWorld, mockPlayers, [], 100);
    
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
    mockPlayers.push(nearbyPlayer);
    
    // Get initial position
    const initialPosition = { ...firefly.position };
    
    // Update the firefly
    firefly.update(mockWorld, mockPlayers, [], 200);
    
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
    mockWorld.lastParticleOptions = null;
    
    firefly.update(mockWorld, mockPlayers, [], 1000);
    
    assert.ok(mockWorld.lastParticleOptions, 'Firefly should emit particles');
    assert.strictEqual(mockWorld.lastParticleOptions.type, 'firefly_glow', 'Particle type should be firefly_glow');
    assert.strictEqual(mockWorld.lastParticleOptions.color, firefly.glowColor, 'Particle color should match firefly glow color');
    
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
    const restoredFirefly = Firefly.fromJSON(serializedData, mockWorld);
    assert.strictEqual(restoredFirefly.type, 'firefly', 'Deserialized firefly should preserve type');
    assert.deepStrictEqual(restoredFirefly.position, firefly.position, 'Deserialized firefly should preserve position');
    assert.strictEqual(restoredFirefly.glowColor, firefly.glowColor, 'Deserialized firefly should preserve glow color');
    
    console.log('All Firefly tests passed!');
  } catch (error) {
    console.error('Firefly test failed:', error);
    throw error;
  }
}

module.exports = runTests; 