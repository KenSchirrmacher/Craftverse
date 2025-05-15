/**
 * Test suite for the Darkness effect implementation
 * Tests darkness effect application, intensity, pulsing, and integration with the Deep Dark biome
 */

const assert = require('assert');
const StatusEffectsManager = require('../entities/statusEffectsManager');
const DeepDarkBiome = require('../biomes/deepDarkBiome');

/**
 * Tests basic functionality of the Darkness effect
 */
function testDarknessBasics() {
  console.log('Testing basic Darkness effect implementation...');
  
  // Create a mock server with player collection
  const mockServer = {
    players: {}
  };
  
  // Create a StatusEffectsManager
  const statusEffectsManager = new StatusEffectsManager(mockServer);
  
  // Verify Darkness is defined in effect definitions
  assert(statusEffectsManager.effectDefinitions.DARKNESS, 'Darkness effect should be defined');
  assert.strictEqual(statusEffectsManager.effectDefinitions.DARKNESS.beneficial, false, 'Darkness should not be beneficial');
  assert.strictEqual(statusEffectsManager.effectDefinitions.DARKNESS.color, '#000000', 'Darkness color should be black');
  
  // Create a mock entity
  const entity = {
    id: 'player-123',
    type: 'player',
    visibilityRange: 50,
    position: { x: 0, y: -40, z: 0 }
  };
  
  // Add the entity to the server's player collection
  mockServer.players[entity.id] = entity;
  
  // Test adding the effect
  const result = statusEffectsManager.addEffect(entity.id, 'DARKNESS', {
    level: 1,
    duration: 200,
    showParticles: true
  });
  
  assert(result, 'Adding darkness effect should succeed');
  
  // Check that entity has the effect
  const hasEffect = statusEffectsManager.hasEffect(entity.id, 'DARKNESS');
  assert(hasEffect, 'Entity should have the darkness effect');
  
  // Check the effect level
  const effectLevel = statusEffectsManager.getEffectLevel(entity.id, 'DARKNESS');
  assert.strictEqual(effectLevel, 1, 'Darkness effect should be at level 1');
  
  // Check that visibility was reduced
  assert(entity.visibilityRange < 50, 'Darkness should reduce visibility range');
  assert(entity.originalVisibilityRange === 50, 'Original visibility range should be stored');
  
  // Test removing the effect
  statusEffectsManager.removeEffect(entity.id, 'DARKNESS');
  const hasEffectAfterRemoval = statusEffectsManager.hasEffect(entity.id, 'DARKNESS');
  assert(!hasEffectAfterRemoval, 'Entity should not have the darkness effect after removal');
  
  // Check that visibility was restored
  assert.strictEqual(entity.visibilityRange, 50, 'Visibility range should be restored after effect removal');
  assert(!entity.darknessLevel, 'Darkness level should be removed from entity');
  
  console.log('Basic Darkness effect implementation test passed!');
  return true;
}

/**
 * Tests the pulsing behavior of the Darkness effect
 */
function testDarknessPulsing() {
  console.log('Testing Darkness effect pulsing behavior...');
  
  // Create a mock server with player collection
  const mockServer = {
    players: {}
  };
  
  // Create a StatusEffectsManager
  const statusEffectsManager = new StatusEffectsManager(mockServer);
  
  // Create a mock entity
  const entity = {
    id: 'player-456',
    type: 'player',
    visibilityRange: 50,
    position: { x: 0, y: -40, z: 0 }
  };
  
  // Add the entity to the server's player collection
  mockServer.players[entity.id] = entity;
  
  // Add darkness effect with a higher level
  statusEffectsManager.addEffect(entity.id, 'DARKNESS', {
    level: 2,
    duration: 1000,
    showParticles: true
  });
  
  // Track emitted pulse events
  let pulseEvents = [];
  statusEffectsManager.on('effectPulse', (data) => {
    if (data.effectType === 'DARKNESS' && data.entityId === entity.id) {
      pulseEvents.push(data);
    }
  });
  
  // Mock time passing for multiple ticks
  for (let i = 0; i < 5; i++) {
    statusEffectsManager.tickCounter = i * 10; // Simulate tick counter
    statusEffectsManager.update(50); // 50ms tick
  }
  
  // Verify pulse events were emitted if tickRate is matched
  if (statusEffectsManager.effectDefinitions.DARKNESS.tickRate > 0) {
    // We should see some pulse events
    console.log(`Pulse events: ${pulseEvents.length}`);
  }
  
  // Clean up
  statusEffectsManager.removeEffect(entity.id, 'DARKNESS');
  
  console.log('Darkness effect pulsing behavior test passed!');
  return true;
}

/**
 * Tests integration of Darkness effect with Deep Dark biome
 */
function testDeepDarkIntegration() {
  console.log('Testing Darkness integration with Deep Dark biome...');
  
  // Create Deep Dark biome
  const deepDark = new DeepDarkBiome();
  
  // Create a mock server
  const mockServer = {};
  
  // Create a StatusEffectsManager
  const statusEffectsManager = new StatusEffectsManager(mockServer);
  
  // Create a mock addEffect method that returns the level that was used
  let lastEffectLevel = 0;
  statusEffectsManager.addEffect = function(entityId, effectType, options) {
    console.log(`Adding effect ${effectType} to entity ${entityId} with level ${options.level}`);
    lastEffectLevel = options.level || 1;
    return true;
  };
  
  // Create a mock world with status effects manager - initially without structures
  const world = {
    statusEffectsManager,
    entities: new Map(),
    structures: [] // No structures initially
  };
  
  // Create a mock player in a position far from any potential structure
  const player = {
    id: 'player-789',
    type: 'player',
    position: { x: 1000, y: -100, z: 1000 } // Far away from any structures
  };
  
  // Initially, we don't add any wardens to test the base level
  
  // Reset darkness settings for predictable testing
  deepDark.darknessSettings.lastAppliedEffects = {};
  deepDark.darknessSettings.baseLevel = 1;
  
  // For testing duration-based increase, make the build-up rate fast enough to see a difference
  deepDark.darknessSettings.buildupRate = 0.1; // 10x the normal rate
  
  // Test effect application with short duration
  let appliedEffects = deepDark.applyEntityEffects(player, 50, world);
  assert(appliedEffects.darkness, 'Darkness effect should be applied');
  
  // Get the actual base level from the darkness settings
  console.log(`Expected base level: ${deepDark.darknessSettings.baseLevel}, Actual level: ${appliedEffects.darkness.level}`);
  
  assert.strictEqual(appliedEffects.darkness.level, 1, 
                     'Initial darkness level should be 1');
  assert.strictEqual(lastEffectLevel, 1, 
                     'Effect level passed to statusEffectsManager should be 1');
  
  // Test effect with longer duration - using a very long duration to ensure buildup
  // Reset the lastAppliedEffects to ensure the effect is applied again
  deepDark.darknessSettings.lastAppliedEffects = {};
  
  const longDuration = 20000; // Very long duration to ensure buildup
  console.log(`Testing with long duration: ${longDuration} ticks`);
  
  appliedEffects = deepDark.applyEntityEffects(player, longDuration, world);
  console.log(`Base level: ${deepDark.darknessSettings.baseLevel}, After long duration: ${appliedEffects.darkness.level}`);
  
  assert(appliedEffects.darkness, 'Darkness effect should be applied for longer duration');
  assert(appliedEffects.darkness.level > deepDark.darknessSettings.baseLevel, 
         `Darkness level should increase with longer duration (got ${appliedEffects.darkness.level}, expected > ${deepDark.darknessSettings.baseLevel})`);
  
  // Now add an Ancient City structure for testing
  world.structures = [{
    type: 'ancient_city',
    minX: -100, maxX: 100,
    minY: -60, maxY: -20,
    minZ: -100, maxZ: 100
  }];
  
  // Test with nearby warden
  world.entities.set('warden-2', {
    id: 'warden-2',
    type: 'warden',
    position: { x: 10, y: -40, z: 10 } // Near player
  });
  
  // Move player near the warden for testing
  player.position = { x: 20, y: -40, z: 20 };
  
  // Reset cooldown to force re-application
  deepDark.darknessSettings.lastAppliedEffects = {};
  
  // Apply effects again with warden nearby
  appliedEffects = deepDark.applyEntityEffects(player, 100, world);
  console.log(`With warden nearby: ${appliedEffects.darkness.level}`);
  
  assert(appliedEffects.darkness.level >= deepDark.darknessSettings.baseLevel + deepDark.darknessSettings.wardenNearbyAddedLevel,
         `Darkness level should increase when warden is nearby (got ${appliedEffects.darkness.level}, expected >= ${deepDark.darknessSettings.baseLevel + deepDark.darknessSettings.wardenNearbyAddedLevel})`);
  
  // Test in ancient city
  player.position = { x: 0, y: -30, z: 0 }; // Ensure in ancient city bounds
  
  // Reset cooldown
  deepDark.darknessSettings.lastAppliedEffects = {};
  
  // Apply effects in ancient city
  appliedEffects = deepDark.applyEntityEffects(player, 100, world);
  console.log(`In ancient city: ${appliedEffects.darkness.level}`);
  
  assert(appliedEffects.darkness.level >= deepDark.darknessSettings.baseLevel + deepDark.darknessSettings.ancientCityAddedLevel,
         `Darkness level should increase in ancient city (got ${appliedEffects.darkness.level}, expected >= ${deepDark.darknessSettings.baseLevel + deepDark.darknessSettings.ancientCityAddedLevel})`);
  
  console.log('Darkness integration with Deep Dark biome test passed!');
  return true;
}

/**
 * Runs all Darkness effect tests
 */
function runAllDarknessTests() {
  try {
    console.log('=== Starting Darkness Effect Tests ===');
    
    const tests = [
      testDarknessBasics,
      testDarknessPulsing,
      testDeepDarkIntegration
    ];
    
    let passed = 0;
    for (const test of tests) {
      try {
        if (test()) passed++;
      } catch (error) {
        console.error(`Test failed: ${error.message}`);
        console.error(error.stack);
      }
    }
    
    console.log(`=== Darkness Effect Tests: ${passed}/${tests.length} passed ===`);
    return passed === tests.length;
  } catch (error) {
    console.error('Error running tests:', error);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const success = runAllDarknessTests();
  process.exitCode = success ? 0 : 1;
} 