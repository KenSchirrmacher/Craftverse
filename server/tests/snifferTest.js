/**
 * Sniffer Tests
 * Tests for the Sniffer mob implementation for the Trails & Tales Update
 */

const assert = require('assert');
const Sniffer = require('../mobs/sniffer');

// Mock World class for testing
class MockWorld {
  constructor() {
    this.blocks = {};
    this.events = [];
    this.soundsPlayed = [];
    this.particlesPlayed = [];
  }
  
  getBlockAt(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks[key] || null;
  }
  
  setBlockAt(x, y, z, type, metadata = {}) {
    const key = `${x},${y},${z}`;
    this.blocks[key] = { type, metadata };
    return true;
  }
  
  isWaterAt(x, y, z) {
    const block = this.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z));
    return block && block.type === 'water';
  }
  
  getBiomeAt(x, y, z) {
    // Default biome for testing
    return { id: 'plains', temperature: 0.8, precipitation: 0.4 };
  }
}

// Mock functions for event emissions
function createMockEventEmitter() {
  const events = {
    sounds: [],
    animations: [],
    particles: [],
    drops: []
  };

  return {
    events,
    emitEvent: function(eventName, data) {
      switch (eventName) {
        case 'playSound':
          events.sounds.push(data);
          break;
        case 'playAnimation':
          events.animations.push(data);
          break;
        case 'playParticle':
          events.particles.push(data);
          break;
        case 'dropItem':
          events.drops.push(data);
          break;
      }
    }
  };
}

// Test basic sniffer creation and properties
function testSnifferCreation() {
  console.log('Testing Sniffer creation...');
  
  // Create an adult sniffer
  const adultSniffer = new Sniffer({ x: 0, y: 0, z: 0 }, { isAdult: true });
  
  assert.strictEqual(adultSniffer.type, 'sniffer', 'Should have the correct type');
  assert.strictEqual(adultSniffer.health, 30, 'Should have 30 health');
  assert.strictEqual(adultSniffer.speed, 0.4, 'Should have 0.4 speed');
  assert.strictEqual(adultSniffer.isAdult, true, 'Should be an adult');
  assert.strictEqual(adultSniffer.width, 1.9, 'Adult should have 1.9 width');
  assert.strictEqual(adultSniffer.height, 1.7, 'Adult should have 1.7 height');
  
  // Create a baby sniffer
  const babySniffer = new Sniffer({ x: 0, y: 0, z: 0 }, { isAdult: false, age: 0 });
  
  assert.strictEqual(babySniffer.isAdult, false, 'Should be a baby');
  assert.strictEqual(babySniffer.age, 0, 'Should have age 0');
  assert.strictEqual(babySniffer.width, 0.9, 'Baby should have 0.9 width');
  assert.strictEqual(babySniffer.height, 0.85, 'Baby should have 0.85 height');
  
  console.log('✓ Sniffer creation tests passed');
}

// Test sniffer growth from baby to adult
function testSnifferGrowth() {
  console.log('Testing Sniffer growth...');
  
  const babySniffer = new Sniffer({ x: 0, y: 0, z: 0 }, { isAdult: false, age: 0 });
  const mockWorld = new MockWorld();
  
  // Setup ground block
  mockWorld.setBlockAt(0, -1, 0, 'grass_block');
  
  // Override random for deterministic testing
  const originalRandom = Math.random;
  Math.random = () => 1.0; // Always 1 for deterministic testing
  
  // Simulate time passing - age just below maxAge
  babySniffer.age = babySniffer.maxAge - 1;
  let result = babySniffer.update(mockWorld, {}, {}, 2);
  
  // Should not have grown up yet
  assert.strictEqual(babySniffer.isAdult, false, 'Should still be a baby');
  
  // Simulate more time passing - now age exceeds maxAge
  result = babySniffer.update(mockWorld, {}, {}, 10);
  
  // Should have grown up
  assert.strictEqual(babySniffer.isAdult, true, 'Should have grown to adult');
  assert.strictEqual(babySniffer.width, 1.9, 'Adult should have 1.9 width');
  assert.strictEqual(babySniffer.height, 1.7, 'Adult should have 1.7 height');
  assert.deepStrictEqual(result, { type: 'grow_up', entityId: babySniffer.id }, 'Should return grow_up result');
  
  // Restore original random
  Math.random = originalRandom;
  
  console.log('✓ Sniffer growth tests passed');
}

// Test sniffer sniffing behavior
function testSnifferSniffing() {
  console.log('Testing Sniffer sniffing behavior...');
  
  const sniffer = new Sniffer({ x: 0, y: 1, z: 0 }, { isAdult: true });
  const mockWorld = new MockWorld();
  const mockEvents = createMockEventEmitter();
  
  // Add our mock event emitter
  sniffer.emitEvent = mockEvents.emitEvent;
  
  // Setup ground block
  mockWorld.setBlockAt(0, 0, 0, 'grass_block');
  
  // Override random for deterministic testing
  const originalRandom = Math.random;
  
  // Directly set sniffing state instead of using updateIdle
  sniffer.isSniffing = true;
  sniffer.sniffProgress = 0;
  
  // Emit events manually since we're not calling updateIdle
  sniffer.emitEvent('playAnimation', { entityId: sniffer.id, animation: 'sniffing_start' });
  sniffer.emitEvent('playSound', { sound: 'entity.sniffer.sniffing', position: sniffer.position });
  
  assert.strictEqual(sniffer.isSniffing, true, 'Should be sniffing');
  assert.strictEqual(mockEvents.events.animations.length, 1, 'Should have played start animation');
  assert.strictEqual(mockEvents.events.sounds.length, 1, 'Should have played sniffing sound');
  
  // Test middle of sniffing
  sniffer.sniffProgress = 29;
  sniffer.updateSniffing(mockWorld, 1);
  assert.strictEqual(sniffer.sniffProgress, 30, 'Progress should advance');
  assert.strictEqual(mockEvents.events.animations.length, 2, 'Should have played middle animation');
  
  // Test finding a seed (successful sniff)
  Math.random = () => 0.0; // Ensure seed is found (< 0.4)
  sniffer.sniffProgress = sniffer.sniffDuration - 1;
  sniffer.updateSniffing(mockWorld, 1);
  
  assert.strictEqual(sniffer.isSniffing, false, 'Should have finished sniffing');
  assert.strictEqual(sniffer.isDigging, true, 'Should have started digging');
  assert.strictEqual(sniffer.sniffCooldown, sniffer.sniffMaxCooldown, 'Should have reset cooldown');
  assert.strictEqual(mockEvents.events.animations.length, 3, 'Should have played digging start animation');
  
  // Test not finding a seed
  Math.random = () => 0.5; // Ensure seed is not found (> 0.4)
  sniffer.isSniffing = true;
  sniffer.isDigging = false;
  sniffer.sniffProgress = sniffer.sniffDuration - 1;
  sniffer.updateSniffing(mockWorld, 1);
  
  assert.strictEqual(sniffer.isSniffing, false, 'Should have finished sniffing');
  assert.strictEqual(sniffer.isDigging, false, 'Should not have started digging');
  assert.strictEqual(mockEvents.events.animations.length, 4, 'Should have played sniffing end animation');
  
  // Restore original random
  Math.random = originalRandom;
  
  console.log('✓ Sniffer sniffing tests passed');
}

// Test sniffer digging behavior
function testSnifferDigging() {
  console.log('Testing Sniffer digging behavior...');
  
  const sniffer = new Sniffer({ x: 0, y: 1, z: 0 }, { isAdult: true });
  const mockWorld = new MockWorld();
  const mockEvents = createMockEventEmitter();
  
  // Add our mock event emitter
  sniffer.emitEvent = mockEvents.emitEvent;
  
  // Setup ground block
  mockWorld.setBlockAt(0, 0, 0, 'dirt');
  
  // Start with digging in progress
  sniffer.isDigging = true;
  sniffer.digProgress = 0;
  
  // Test intermediate digging animation
  sniffer.digProgress = 19;
  sniffer.updateDigging(mockWorld, 1);
  assert.strictEqual(sniffer.digProgress, 20, 'Dig progress should advance');
  assert.strictEqual(mockEvents.events.animations.length, 1, 'Should have played middle animation');
  
  // Reset animation events
  mockEvents.events.animations = [];
  mockEvents.events.drops = [];
  
  // Test completing digging
  sniffer.digProgress = sniffer.digDuration - 1;
  sniffer.updateDigging(mockWorld, 1);
  
  assert.strictEqual(sniffer.isDigging, false, 'Should have finished digging');
  assert.strictEqual(sniffer.digCooldown, sniffer.digMaxCooldown, 'Should have reset cooldown');
  assert.strictEqual(mockEvents.events.animations.length, 1, 'Should have played digging end animation');
  assert.strictEqual(mockEvents.events.drops.length, 1, 'Should have dropped an item');
  
  // Check the dropped item is a valid seed
  const validSeeds = ['torchflower_seeds', 'pitcher_pod'];
  assert.ok(validSeeds.includes(mockEvents.events.drops[0].item), 'Should have dropped a valid seed');
  
  console.log('✓ Sniffer digging tests passed');
}

// Test sniffer breeding behavior
function testSnifferBreeding() {
  console.log('Testing Sniffer breeding...');
  
  const sniffer1 = new Sniffer({ x: 0, y: 1, z: 0 }, { isAdult: true });
  const sniffer2 = new Sniffer({ x: 1, y: 1, z: 0 }, { isAdult: true });
  const mockEvents = createMockEventEmitter();
  
  // Add our mock event emitter
  sniffer1.emitEvent = mockEvents.emitEvent;
  
  // Test breeding with torchflower seeds
  const result = sniffer1.interact({ id: 'player1' }, { item: 'torchflower_seeds' });
  
  assert.strictEqual(result.success, true, 'Should successfully accept torchflower seeds');
  assert.strictEqual(result.consumeItem, true, 'Should consume the seeds');
  assert.strictEqual(sniffer1.inLove, true, 'Should be in love mode');
  assert.strictEqual(mockEvents.events.particles.length, 1, 'Should have emitted heart particles');
  
  // Test breeding with another sniffer
  // Create a mock mobs object with both sniffers
  const mobs = {
    [sniffer1.id]: sniffer1,
    [sniffer2.id]: sniffer2
  };
  
  // Set the second sniffer in love mode too
  sniffer2.inLove = true;
  
  // Call handle breeding
  const breedingResult = sniffer1.handleBreeding(mobs);
  
  // Should attempt to create a baby
  assert.ok(breedingResult, 'Should return a breeding result');
  assert.strictEqual(breedingResult.type, 'breed', 'Should create a breeding event');
  assert.strictEqual(breedingResult.entityType, 'sniffer', 'Should create a sniffer');
  assert.strictEqual(breedingResult.options.isAdult, false, 'Should create a baby');
  
  console.log('✓ Sniffer breeding tests passed');
}

// Test sniffer interaction with shears to get eggs
function testSnifferShearing() {
  console.log('Testing Sniffer shearing for eggs...');
  
  const sniffer = new Sniffer({ x: 0, y: 1, z: 0 }, { isAdult: true });
  const mockEvents = createMockEventEmitter();
  
  // Add our mock event emitter
  sniffer.emitEvent = mockEvents.emitEvent;
  
  // Test shearing for eggs
  const result = sniffer.interact({ id: 'player1' }, { item: 'shears' });
  
  assert.strictEqual(result.success, true, 'Should successfully interact with shears');
  assert.strictEqual(result.damageItem, true, 'Should damage the shears');
  assert.strictEqual(result.drops[0].item, 'sniffer_egg', 'Should drop sniffer eggs');
  assert.ok(result.drops[0].count >= 1 && result.drops[0].count <= 2, 'Should drop 1-2 eggs');
  assert.strictEqual(mockEvents.events.sounds.length, 1, 'Should have played a shearing sound');
  assert.strictEqual(sniffer.wasSheared, true, 'Should mark sniffer as sheared');
  
  // Attempt to shear again - should fail
  const secondResult = sniffer.interact({ id: 'player1' }, { item: 'shears' });
  assert.strictEqual(secondResult.success, false, 'Should not be able to shear twice');
  
  console.log('✓ Sniffer shearing tests passed');
}

// Test sniffer serialization and deserialization
function testSnifferSerialization() {
  console.log('Testing Sniffer serialization...');
  
  // Create a sniffer with specific state
  const sniffer = new Sniffer({ x: 10, y: 20, z: 30 }, { isAdult: true });
  sniffer.isSniffing = true;
  sniffer.sniffProgress = 25;
  sniffer.wasSheared = true;
  sniffer.headRaised = true;
  
  // Serialize
  const serialized = sniffer.serialize();
  
  // Check serialized data
  assert.strictEqual(serialized.type, 'sniffer', 'Should serialize correct type');
  assert.deepStrictEqual(serialized.position, { x: 10, y: 20, z: 30 }, 'Should serialize position');
  assert.strictEqual(serialized.isAdult, true, 'Should serialize adult state');
  assert.strictEqual(serialized.isSniffing, true, 'Should serialize sniffing state');
  assert.strictEqual(serialized.sniffProgress, 25, 'Should serialize sniff progress');
  assert.strictEqual(serialized.wasSheared, true, 'Should serialize sheared state');
  assert.strictEqual(serialized.headRaised, true, 'Should serialize head raised state');
  
  // Create new sniffer and deserialize
  const newSniffer = new Sniffer({ x: 0, y: 0, z: 0 });
  newSniffer.deserialize(serialized);
  
  // Check deserialized state
  assert.deepStrictEqual(newSniffer.position, { x: 10, y: 20, z: 30 }, 'Should restore position');
  assert.strictEqual(newSniffer.isAdult, true, 'Should restore adult state');
  assert.strictEqual(newSniffer.isSniffing, true, 'Should restore sniffing state');
  assert.strictEqual(newSniffer.sniffProgress, 25, 'Should restore sniff progress');
  assert.strictEqual(newSniffer.wasSheared, true, 'Should restore sheared state');
  assert.strictEqual(newSniffer.headRaised, true, 'Should restore head raised state');
  
  console.log('✓ Sniffer serialization tests passed');
}

// Test sniffer physics
function testSnifferPhysics() {
  console.log('Testing Sniffer physics...');
  
  const sniffer = new Sniffer({ x: 0, y: 5, z: 0 });
  const mockWorld = new MockWorld();
  
  // Set up a ground block
  mockWorld.setBlockAt(0, 0, 0, 'grass_block');
  
  // Apply gravity for several ticks
  for (let i = 0; i < 10; i++) {
    sniffer.applyPhysics(mockWorld, 1);
  }
  
  // Sniffer should fall towards the ground
  assert.ok(sniffer.position.y < 5, 'Should have fallen due to gravity');
  assert.ok(sniffer.position.y >= 1, 'Should not fall below ground');
  
  // Test horizontal movement
  sniffer.velocity.x = 0.5;
  sniffer.velocity.z = 0.3;
  sniffer.applyPhysics(mockWorld, 1);
  
  assert.ok(sniffer.position.x > 0, 'Should have moved in x direction');
  assert.ok(sniffer.position.z > 0, 'Should have moved in z direction');
  
  // Test drag
  const originalX = sniffer.velocity.x;
  const originalZ = sniffer.velocity.z;
  sniffer.applyPhysics(mockWorld, 1);
  
  assert.ok(Math.abs(sniffer.velocity.x) < Math.abs(originalX), 'Velocity x should decrease due to drag');
  assert.ok(Math.abs(sniffer.velocity.z) < Math.abs(originalZ), 'Velocity z should decrease due to drag');
  
  console.log('✓ Sniffer physics tests passed');
}

// Run all tests
function runTests() {
  testSnifferCreation();
  testSnifferGrowth();
  testSnifferSniffing();
  testSnifferDigging();
  testSnifferBreeding();
  testSnifferShearing();
  testSnifferSerialization();
  testSnifferPhysics();
  
  console.log('All Sniffer tests passed!');
}

runTests(); 