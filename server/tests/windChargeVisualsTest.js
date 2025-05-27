/**
 * Wind Charge Visuals Test - Test the visual and audio enhancements for Wind Charge entities
 * Part of the Minecraft 1.24 Update
 */

const assert = require('assert');
const Mocha = require('mocha');
const mocha = new Mocha();
const WindChargeEntity = require('../entities/windChargeEntity');
const Vector3 = require('../math/vector3');
const AABB = require('../physics/aabb');
const TestWorld = require('./testWorld');

// Create isolated test suite
mocha.suite.emit('pre-require', global, 'windChargeVisualsTest', mocha);

describe('Wind Charge Visual and Audio Enhancements', () => {
  let world;
  
  // Setup test environment
  before(() => {
    world = new TestWorld();
    world.initialize();
  });
  
  // Clean up after tests
  afterEach(() => {
    world.clearEffects();
  });
  
  describe('Explosion Visual Effects', () => {
    it('should create visual effects when the wind charge explodes', () => {
      // Create a weak wind charge
      const weakCharge = new WindChargeEntity('test-weak', {
        world: world,
        position: { x: 0, y: 0, z: 0 },
        chargeLevel: 0,
        chargeName: 'weak'
      });
      
      // Trigger explosion
      weakCharge.createExplosionVisuals();
      
      // Check if particle effects were created
      const effects = world.getParticleEffects();
      assert.ok(effects.length > 0, 'No particle effects were created');
      
      const effect = effects[0];
      assert.ok(effect.position, 'Particle effect missing position');
      assert.strictEqual(effect.position.x, 0, 'Incorrect particle effect position X');
      assert.strictEqual(effect.position.y, 0, 'Incorrect particle effect position Y');
      assert.strictEqual(effect.position.z, 0, 'Incorrect particle effect position Z');
      assert.ok(effect.type, 'Particle effect missing type');
      assert.ok(effect.color, 'Particle effect missing color');
    });
    
    it('should scale visual effects based on charge level', () => {
      // Create charges with different levels
      const weakCharge = new WindChargeEntity('test-weak', {
        world: world,
        position: { x: 0, y: 0, z: 0 },
        chargeLevel: 0
      });
      
      const mediumCharge = new WindChargeEntity('test-medium', {
        world: world,
        position: { x: 0, y: 0, z: 0 },
        chargeLevel: 1
      });
      
      const strongCharge = new WindChargeEntity('test-strong', {
        world: world,
        position: { x: 0, y: 0, z: 0 },
        chargeLevel: 2
      });
      
      // Trigger explosions
      weakCharge.createExplosionVisuals();
      const weakEffects = world.getParticleEffects();
      world.clearEffects();
      
      mediumCharge.createExplosionVisuals();
      const mediumEffects = world.getParticleEffects();
      world.clearEffects();
      
      strongCharge.createExplosionVisuals();
      const strongEffects = world.getParticleEffects();
      
      // Check that stronger charges have more intensive effects
      assert.ok(mediumEffects.length >= weakEffects.length, 
        'Medium charge should have more particle effects than weak charge');
      assert.ok(strongEffects.length >= mediumEffects.length, 
        'Strong charge should have more particle effects than medium charge');
      
      // Check particle properties
      const weakEffect = weakEffects[0];
      const mediumEffect = mediumEffects[0];
      const strongEffect = strongEffects[0];
      
      assert.ok(mediumEffect.radius >= weakEffect.radius, 
        'Medium charge should have larger particle radius');
      assert.ok(strongEffect.radius >= mediumEffect.radius, 
        'Strong charge should have larger particle radius');
      
      assert.ok(mediumEffect.duration >= weakEffect.duration, 
        'Medium charge should have longer particle duration');
      assert.ok(strongEffect.duration >= mediumEffect.duration, 
        'Strong charge should have longer particle duration');
    });
  });
  
  describe('Explosion Sound Effects', () => {
    it('should play sound effects when the wind charge explodes', () => {
      // Create a wind charge
      const charge = new WindChargeEntity('test-sound', {
        world: world,
        position: { x: 0, y: 0, z: 0 },
        chargeLevel: 1
      });
      
      // Trigger sound
      charge.playExplosionSound();
      
      // Check if sound was played
      const sounds = world.getSoundEffects();
      assert.ok(sounds.length > 0, 'No sound effects were played');
      
      const sound = sounds[0];
      assert.ok(sound.position, 'Sound effect missing position');
      assert.strictEqual(sound.position.x, 0, 'Incorrect sound position X');
      assert.strictEqual(sound.position.y, 0, 'Incorrect sound position Y');
      assert.strictEqual(sound.position.z, 0, 'Incorrect sound position Z');
      assert.ok(sound.sound, 'Sound name is missing');
      assert.ok(sound.volume > 0, 'Sound volume should be positive');
      assert.ok(sound.pitch > 0, 'Sound pitch should be positive');
    });
    
    it('should scale sound volume and pitch based on charge level', () => {
      // Create charges with different levels
      const weakCharge = new WindChargeEntity('test-weak-sound', {
        world: world,
        position: { x: 0, y: 0, z: 0 },
        chargeLevel: 0
      });
      
      const strongCharge = new WindChargeEntity('test-strong-sound', {
        world: world,
        position: { x: 0, y: 0, z: 0 },
        chargeLevel: 2
      });
      
      // Trigger sounds
      weakCharge.playExplosionSound();
      const weakSounds = world.getSoundEffects();
      world.clearEffects();
      
      strongCharge.playExplosionSound();
      const strongSounds = world.getSoundEffects();
      
      // Check that stronger charges have louder/different sounds
      const weakSound = weakSounds[0];
      const strongSound = strongSounds[0];
      
      assert.ok(strongSound.volume > weakSound.volume, 
        'Strong charge should have louder sound');
      assert.ok(strongSound.pitch !== weakSound.pitch, 
        'Strong charge should have different pitch');
    });
  });
  
  describe('Trail Particle Effects', () => {
    it('should create trail particles during flight', () => {
      const charge = new WindChargeEntity('test-trail', {
        world: world,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 1, y: 0, z: 0 },
        chargeLevel: 1
      });
      
      // Update the charge to generate trail particles
      charge.update(1);
      
      // Check if trail particles were created
      const effects = world.getParticleEffects();
      assert.ok(effects.length > 0, 'No trail particles were created');
      
      const effect = effects[0];
      assert.ok(effect.position, 'Trail particle missing position');
      assert.ok(effect.color, 'Trail particle missing color');
      assert.ok(effect.size > 0, 'Trail particle missing size');
      assert.ok(effect.lifetime > 0, 'Trail particle missing lifetime');
    });
    
    it('should scale trail particle density with charge level', () => {
      const weakCharge = new WindChargeEntity('test-weak-trail', {
        world: world,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 1, y: 0, z: 0 },
        chargeLevel: 0
      });
      
      const strongCharge = new WindChargeEntity('test-strong-trail', {
        world: world,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 1, y: 0, z: 0 },
        chargeLevel: 2
      });
      
      // Update both charges
      weakCharge.update(1);
      const weakEffects = world.getParticleEffects();
      world.clearEffects();
      
      strongCharge.update(1);
      const strongEffects = world.getParticleEffects();
      
      // Strong charge should have more particles
      assert.ok(strongEffects.length >= weakEffects.length, 
        'Strong charge should have more trail particles');
      
      // Check particle properties
      const weakEffect = weakEffects[0];
      const strongEffect = strongEffects[0];
      
      assert.ok(strongEffect.size >= weakEffect.size, 
        'Strong charge should have larger trail particles');
      assert.ok(strongEffect.lifetime >= weakEffect.lifetime, 
        'Strong charge should have longer-lasting trail particles');
    });
  });
});

// Run the tests programmatically
mocha.run(); 