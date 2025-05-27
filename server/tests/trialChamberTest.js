/**
 * Test suite for Trial Chamber implementation
 * Tests the TrialChamber structure and TrialSpawnerBlock for the 1.21 Update (Tricky Trials)
 */

const assert = require('assert');
const TrialChamber = require('../structures/trialChamber');
const TrialChamberGenerator = require('../utils/structures/trialChamberGenerator');
const TrialSpawnerBlock = require('../blocks/trialSpawner');
const blockRegistry = require('../blocks/blockRegistry');
const World = require('../world');

describe('Trial Chamber Tests', () => {
  let world;
  
  beforeEach(() => {
    world = new World();
    world.initialize();
  });
  
  describe('TrialChamber', () => {
    let chamber;
    
    beforeEach(() => {
      chamber = new TrialChamber({
        id: 'test_chamber',
        position: { x: 0, y: 0, z: 0 },
        bounds: {
          min: { x: -10, y: -10, z: -10 },
          max: { x: 10, y: 10, z: 10 }
        }
      });
      
      chamber.setWorld(world);
    });
    
    it('should create a proper chamber instance', () => {
      assert.strictEqual(chamber.id, 'test_chamber');
      assert.deepStrictEqual(chamber.position, { x: 0, y: 0, z: 0 });
      assert.deepStrictEqual(chamber.bounds.min, { x: -10, y: -10, z: -10 });
      assert.deepStrictEqual(chamber.bounds.max, { x: 10, y: 10, z: 10 });
      assert.strictEqual(chamber.world, world);
    });
    
    it('should serialize and deserialize correctly', () => {
      // Add some test data
      chamber.rooms.push({
        center: { x: 0, y: 0, z: 0 },
        size: { x: 10, y: 5, z: 10 },
        bounds: {
          min: { x: -5, y: -2, z: -5 },
          max: { x: 5, y: 3, z: 5 }
        },
        isSpecial: false,
        specialType: null
      });
      
      chamber.spawners.push({
        position: { x: 0, y: 0, z: 0 },
        totalWaves: 3,
        maxMobsPerWave: 5,
        mobTypes: ['zombie', 'skeleton']
      });
      
      chamber.chests.push({
        position: { x: 3, y: 0, z: 3 },
        lootTable: 'trial_chambers/common',
        isReward: true,
        spawnerId: 'spawner1'
      });
      
      const serialized = chamber.serialize();
      
      const deserializedChamber = TrialChamber.deserialize(serialized, world);
      
      assert.strictEqual(deserializedChamber.id, chamber.id);
      assert.deepStrictEqual(deserializedChamber.position, chamber.position);
      assert.deepStrictEqual(deserializedChamber.bounds, chamber.bounds);
      assert.strictEqual(deserializedChamber.rooms.length, chamber.rooms.length);
      assert.strictEqual(deserializedChamber.spawners.length, chamber.spawners.length);
      assert.strictEqual(deserializedChamber.chests.length, chamber.chests.length);
    });
    
    it('should generate a trial chamber', () => {
      const generatedChamber = TrialChamber.generate(world, { x: 0, y: 0, z: 0 });
      
      assert.ok(generatedChamber instanceof TrialChamber);
      assert.ok(generatedChamber.rooms.length > 0);
      assert.ok(generatedChamber.world === world);
      
      // If we have at least 2 rooms, there should be corridors
      if (generatedChamber.rooms.length > 1) {
        assert.ok(generatedChamber.corridors.length > 0);
      }
    });
    
    it('should find suitable locations for trial chambers', () => {
      const position = TrialChamber.findSuitableLocation(world, { testMode: true });
      
      assert.ok(position);
      assert.strictEqual(typeof position.x, 'number');
      assert.strictEqual(typeof position.y, 'number');
      assert.strictEqual(typeof position.z, 'number');
      
      // Test position should be within y range
      assert.ok(position.y >= -45 && position.y <= -20);
    });
    
    it('should check area suitability correctly', () => {
      // Create a suitable area
      for (let x = -5; x <= 5; x++) {
        for (let y = -5; y <= 5; y++) {
          for (let z = -5; z <= 5; z++) {
            world.setBlock({ x, y, z }, { id: 'stone', solid: true });
          }
        }
      }
      
      const isSuitable = TrialChamber.checkAreaSuitability(world, { x: 0, y: 0, z: 0 }, {
        width: 10,
        height: 10,
        length: 10
      });
      
      assert.ok(isSuitable);
    });
    
    it('should get entities and mobs in the chamber', () => {
      // Add some test entities
      world.entities.push({
        position: { x: 0, y: 0, z: 0 },
        isMob: true
      });
      
      world.entities.push({
        position: { x: 0, y: 0, z: 0 },
        isMob: false
      });
      
      const entities = chamber.getEntities();
      const mobs = chamber.getMobs();
      
      assert.strictEqual(entities.length, 2);
      assert.strictEqual(mobs.length, 1);
    });
    
    it('should track active spawners', () => {
      // Add a test spawner
      const spawner = new TrialSpawnerBlock({
        totalWaves: 3,
        maxMobsPerWave: 5,
        mobTypes: ['zombie', 'skeleton']
      });
      
      spawner.setPosition({ x: 0, y: 0, z: 0 });
      spawner.setWorld(world);
      
      world.setBlock({ x: 0, y: 0, z: 0 }, spawner);
      
      chamber.spawners.push({
        position: { x: 0, y: 0, z: 0 },
        totalWaves: 3,
        maxMobsPerWave: 5,
        mobTypes: ['zombie', 'skeleton']
      });
      
      // Activate spawner
      spawner.activate();
      
      const activeSpawners = chamber.getActiveSpawners();
      assert.strictEqual(activeSpawners.length, 1);
      
      // Deactivate spawner
      spawner.endTrial(true);
      
      const inactiveSpawners = chamber.getActiveSpawners();
      assert.strictEqual(inactiveSpawners.length, 0);
    });
    
    it('should check completion status', () => {
      // Add a test spawner
      const spawner = new TrialSpawnerBlock({
        totalWaves: 3,
        maxMobsPerWave: 5,
        mobTypes: ['zombie', 'skeleton']
      });
      
      spawner.setPosition({ x: 0, y: 0, z: 0 });
      spawner.setWorld(world);
      
      world.setBlock({ x: 0, y: 0, z: 0 }, spawner);
      
      chamber.spawners.push({
        position: { x: 0, y: 0, z: 0 },
        totalWaves: 3,
        maxMobsPerWave: 5,
        mobTypes: ['zombie', 'skeleton']
      });
      
      // Initially not completed
      assert.ok(!chamber.isCompleted());
      
      // Activate and complete spawner
      spawner.activate();
      spawner.endTrial(true);
      
      // Now should be completed
      assert.ok(chamber.isCompleted());
    });
  });

  describe('TrialSpawnerBlock', () => {
    let spawner;
    
    beforeEach(() => {
      spawner = new TrialSpawnerBlock({
        totalWaves: 3,
        maxMobsPerWave: 5,
        mobTypes: ['zombie', 'skeleton']
      });
      
      spawner.setPosition({ x: 0, y: 0, z: 0 });
      spawner.setWorld(world);
    });
    
    it('should create a proper spawner instance', () => {
      assert.strictEqual(spawner.type, 'trial_spawner');
      assert.strictEqual(spawner.totalWaves, 3);
      assert.strictEqual(spawner.maxMobsPerWave, 5);
      assert.deepStrictEqual(spawner.mobTypes, ['zombie', 'skeleton']);
      assert.strictEqual(spawner.currentWave, 0);
      assert.strictEqual(spawner.isActive, false);
      assert.strictEqual(spawner.isCompleted, false);
    });
    
    it('should activate when powered', () => {
      spawner.onRedstonePower(15);
      assert.strictEqual(spawner.isActive, true);
      assert.strictEqual(spawner.currentWave, 1);
    });
    
    it('should spawn mobs for each wave', () => {
      spawner.activate();
      
      // First wave
      assert.strictEqual(spawner.currentWave, 1);
      const firstWaveMobs = spawner.spawnWave();
      assert.ok(firstWaveMobs.length > 0);
      assert.ok(firstWaveMobs.length <= spawner.maxMobsPerWave);
      
      // Second wave
      spawner.completeWave();
      assert.strictEqual(spawner.currentWave, 2);
      const secondWaveMobs = spawner.spawnWave();
      assert.ok(secondWaveMobs.length > 0);
      assert.ok(secondWaveMobs.length <= spawner.maxMobsPerWave);
      
      // Third wave
      spawner.completeWave();
      assert.strictEqual(spawner.currentWave, 3);
      const thirdWaveMobs = spawner.spawnWave();
      assert.ok(thirdWaveMobs.length > 0);
      assert.ok(thirdWaveMobs.length <= spawner.maxMobsPerWave);
    });
    
    it('should complete when all waves are done', () => {
      spawner.activate();
      
      // Complete all waves
      for (let i = 0; i < spawner.totalWaves; i++) {
        spawner.completeWave();
      }
      
      assert.strictEqual(spawner.isCompleted, true);
      assert.strictEqual(spawner.isActive, false);
    });
    
    it('should fail if too many mobs are killed', () => {
      spawner.activate();
      spawner.spawnWave();
      
      // Kill more mobs than allowed
      spawner.onMobKilled();
      spawner.onMobKilled();
      spawner.onMobKilled();
      spawner.onMobKilled();
      spawner.onMobKilled();
      spawner.onMobKilled();
      
      assert.strictEqual(spawner.isFailed, true);
      assert.strictEqual(spawner.isActive, false);
    });
    
    it('should emit events for state changes', () => {
      let activationEvent = false;
      let completionEvent = false;
      let failureEvent = false;
      
      spawner.on('activation', () => activationEvent = true);
      spawner.on('completion', () => completionEvent = true);
      spawner.on('failure', () => failureEvent = true);
      
      // Test activation
      spawner.activate();
      assert.strictEqual(activationEvent, true);
      
      // Test completion
      for (let i = 0; i < spawner.totalWaves; i++) {
        spawner.completeWave();
      }
      assert.strictEqual(completionEvent, true);
      
      // Test failure
      spawner.activate();
      spawner.spawnWave();
      for (let i = 0; i < 6; i++) {
        spawner.onMobKilled();
      }
      assert.strictEqual(failureEvent, true);
    });
    
    it('should serialize and deserialize correctly', () => {
      spawner.activate();
      spawner.completeWave();
      
      const serialized = spawner.serialize();
      const deserializedSpawner = TrialSpawnerBlock.deserialize(serialized);
      
      assert.strictEqual(deserializedSpawner.type, spawner.type);
      assert.strictEqual(deserializedSpawner.totalWaves, spawner.totalWaves);
      assert.strictEqual(deserializedSpawner.maxMobsPerWave, spawner.maxMobsPerWave);
      assert.deepStrictEqual(deserializedSpawner.mobTypes, spawner.mobTypes);
      assert.strictEqual(deserializedSpawner.currentWave, spawner.currentWave);
      assert.strictEqual(deserializedSpawner.isActive, spawner.isActive);
      assert.strictEqual(deserializedSpawner.isCompleted, spawner.isCompleted);
    });
  });
});

if (require.main === module) {
  describe('Trial Chamber Tests', function() {
    // Run the tests
    console.log('Running Trial Chamber tests...');
  });
} 