/**
 * Tests for SoundManager implementation
 */

const assert = require('assert');
const { SoundManager } = require('../sound/SoundManager');
const TestWorld = require('./testWorld');

class SoundManagerTest {
  constructor() {
    this.world = new TestWorld();
    this.soundManager = new SoundManager(this.world);
  }

  runTests() {
    this.testSoundCreation();
    this.testSoundRetrieval();
    this.testSoundStopping();
    this.testSoundRegion();
    this.testSoundUpdate();
    this.testSoundClear();
  }

  testSoundCreation() {
    console.log('Testing sound creation...');
    
    // Test basic sound creation
    const soundId = this.soundManager.playSound('block.break', 0, 0, 0);
    assert.strictEqual(typeof soundId, 'string', 'Sound ID should be a string');
    assert.strictEqual(soundId.startsWith('sound_'), true, 'Sound ID should start with sound_');
    
    // Test sound with options
    const soundWithOptions = this.soundManager.playSound('block.place', 1, 1, 1, {
      volume: 0.5,
      pitch: 1.2,
      attenuation: 8.0,
      category: 'blocks'
    });
    
    const sound = this.soundManager.getSound(soundWithOptions);
    assert.strictEqual(sound.volume, 0.5, 'Volume should be set correctly');
    assert.strictEqual(sound.pitch, 1.2, 'Pitch should be set correctly');
    assert.strictEqual(sound.attenuation, 8.0, 'Attenuation should be set correctly');
    assert.strictEqual(sound.category, 'blocks', 'Category should be set correctly');
  }

  testSoundRetrieval() {
    console.log('Testing sound retrieval...');
    
    const soundId = this.soundManager.playSound('block.break', 0, 0, 0);
    
    // Test getting existing sound
    const sound = this.soundManager.getSound(soundId);
    assert.strictEqual(sound !== null, true, 'Should retrieve existing sound');
    assert.strictEqual(sound.type, 'block.break', 'Sound type should match');
    
    // Test getting non-existent sound
    const nonExistentSound = this.soundManager.getSound('non_existent');
    assert.strictEqual(nonExistentSound, null, 'Should return null for non-existent sound');
  }

  testSoundStopping() {
    console.log('Testing sound stopping...');
    
    const soundId = this.soundManager.playSound('block.break', 0, 0, 0);
    
    // Test stopping existing sound
    const stopResult = this.soundManager.stopSound(soundId);
    assert.strictEqual(stopResult, true, 'Should successfully stop sound');
    assert.strictEqual(this.soundManager.getSound(soundId), null, 'Sound should be removed');
    
    // Test stopping non-existent sound
    const nonExistentStop = this.soundManager.stopSound('non_existent');
    assert.strictEqual(nonExistentStop, false, 'Should return false for non-existent sound');
  }

  testSoundRegion() {
    console.log('Testing sound region...');
    
    // Create sounds in different positions
    this.soundManager.playSound('block.break', 0, 0, 0);
    this.soundManager.playSound('block.place', 5, 5, 5);
    this.soundManager.playSound('block.hit', 10, 10, 10);
    
    // Test getting sounds in region
    const soundsInRegion = this.soundManager.getSoundsInRegion(0, 0, 0, 5, 5, 5);
    assert.strictEqual(soundsInRegion.length, 2, 'Should find 2 sounds in region');
    
    // Test getting sounds in empty region
    const soundsInEmptyRegion = this.soundManager.getSoundsInRegion(20, 20, 20, 25, 25, 25);
    assert.strictEqual(soundsInEmptyRegion.length, 0, 'Should find no sounds in empty region');
  }

  testSoundUpdate() {
    console.log('Testing sound update...');
    
    // Create a sound with duration
    const soundId = this.soundManager.playSound('block.break', 0, 0, 0, {
      data: { duration: 1.0, age: 0 }
    });
    
    // Update sound
    this.soundManager.update(0.5);
    let sound = this.soundManager.getSound(soundId);
    assert.strictEqual(sound.data.age, 0.5, 'Sound age should be updated');
    
    // Update until sound expires
    this.soundManager.update(0.6);
    sound = this.soundManager.getSound(soundId);
    assert.strictEqual(sound, null, 'Sound should be removed after duration');
  }

  testSoundClear() {
    console.log('Testing sound clear...');
    
    // Create multiple sounds
    this.soundManager.playSound('block.break', 0, 0, 0);
    this.soundManager.playSound('block.place', 1, 1, 1);
    this.soundManager.playSound('block.hit', 2, 2, 2);
    
    // Clear all sounds
    this.soundManager.clear();
    assert.strictEqual(this.soundManager.getAllSounds().length, 0, 'All sounds should be cleared');
  }
}

// Run tests
const test = new SoundManagerTest();
test.runTests();
console.log('All sound manager tests passed!');

module.exports = SoundManagerTest; 