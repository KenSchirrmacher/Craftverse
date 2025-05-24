/**
 * Test suite for Trial Chamber implementation
 * Tests the TrialChamber structure and TrialSpawnerBlock for the 1.21 Update (Tricky Trials)
 */

const assert = require('assert');
const TrialChamber = require('../structures/trialChamber');
const TrialChamberGenerator = require('../utils/structures/trialChamberGenerator');
const TrialSpawnerBlock = require('../blocks/trialSpawner');
const blockRegistry = require('../blocks/blockRegistry');

// Mock world implementation for testing
class MockWorld {
  constructor() {
    this.blocks = new Map();
    this.entities = [];
    this.random = Math.random; // Deterministic for tests
  }
  
  getBlock(position) {
    const key = `${position.x},${position.y},${position.z}`;
    return this.blocks.get(key) || null;
  }
  
  setBlock(position, block) {
    const key = `${position.x},${position.y},${position.z}`;
    this.blocks.set(key, block);
  }
  
  getEntitiesInBox(min, max) {
    return this.entities.filter(entity => {
      return entity.position.x >= min.x && entity.position.x <= max.x &&
             entity.position.y >= min.y && entity.position.y <= max.y &&
             entity.position.z >= min.z && entity.position.z <= max.z;
    });
  }
  
  getSpawnPosition() {
    return { x: 0, y: 64, z: 0 };
  }
  
  spawnMob(type, position) {
    const mob = {
      id: `${type}_${Date.now()}`,
      type: type,
      position: { ...position },
      events: {
        once: (event, callback) => {}
      },
      isHostile: ['zombie', 'skeleton', 'creeper', 'spider', 'witch', 'vindicator', 'evoker', 'breeze'].includes(type),
      trialSpawnerId: null
    };
    
    this.entities.push(mob);
    return mob;
  }
  
  canSpawnMob(position) {
    const block = this.getBlock(position);
    return block && !block.solid;
  }
}

describe('Trial Chamber Tests', () => {
  let world;
  
  beforeEach(() => {
    world = new MockWorld();
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
});

if (require.main === module) {
  describe('Trial Chamber Tests', function() {
    // Run the tests
    console.log('Running Trial Chamber tests...');
  });
} 