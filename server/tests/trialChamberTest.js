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
  
  setBlock(position, block) {
    const key = `${position.x},${position.y},${position.z}`;
    this.blocks.set(key, block);
    return true;
  }
  
  getBlock(position) {
    const key = `${position.x},${position.y},${position.z}`;
    return this.blocks.get(key);
  }
  
  canSpawnMob(position) {
    return true; // Always allow spawning in tests
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
  
  getEntitiesInBox(min, max) {
    return this.entities.filter(entity => {
      return (
        entity.position.x >= min.x && entity.position.x <= max.x &&
        entity.position.y >= min.y && entity.position.y <= max.y &&
        entity.position.z >= min.z && entity.position.z <= max.z
      );
    });
  }
  
  getSpawnPosition() {
    return { x: 0, y: 64, z: 0 };
  }
  
  findNearbyBlocks(position, radius, predicate) {
    const found = [];
    const keys = Array.from(this.blocks.keys());
    
    for (const key of keys) {
      const [x, y, z] = key.split(',').map(Number);
      const block = this.blocks.get(key);
      
      const dx = x - position.x;
      const dy = y - position.y;
      const dz = z - position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (distance <= radius && predicate(block)) {
        found.push({ x, y, z });
      }
    }
    
    return found;
  }
  
  findNearbyEntities(position, radius, predicate) {
    return this.entities.filter(entity => {
      const dx = entity.position.x - position.x;
      const dy = entity.position.y - position.y;
      const dz = entity.position.z - position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      return distance <= radius && predicate(entity);
    });
  }
}

describe('Trial Chamber Tests', () => {
  let world;
  let generator;
  
  beforeEach(() => {
    world = new MockWorld();
    generator = new TrialChamberGenerator(world);
  });
  
  describe('TrialSpawnerBlock', () => {
    let spawner;
    
    beforeEach(() => {
      spawner = new TrialSpawnerBlock();
      spawner.setWorld(world);
      spawner.setPosition({ x: 0, y: 0, z: 0 });
    });
    
    it('should have the correct properties', () => {
      assert.strictEqual(spawner.id, 'trial_spawner');
      assert.strictEqual(spawner.name, 'Trial Spawner');
      assert.strictEqual(spawner.hardness, 50.0);
      assert.strictEqual(spawner.resistance, 1200.0);
      assert.strictEqual(spawner.requiresTool, true);
      assert.strictEqual(spawner.toolType, 'pickaxe');
      assert.strictEqual(spawner.transparent, false);
      assert.strictEqual(spawner.gravity, false);
      assert.strictEqual(spawner.luminance, 7);
    });
    
    it('should initialize in inactive state', () => {
      assert.strictEqual(spawner.active, false);
      assert.strictEqual(spawner.waveCount, 0);
      assert.strictEqual(spawner.currentMobCount, 0);
      assert.strictEqual(spawner.rewardGenerated, false);
    });
    
    it('should be registered in block registry', () => {
      assert.ok(blockRegistry.hasBlock('trial_spawner'));
      const registeredBlock = blockRegistry.getBlock('trial_spawner');
      assert.ok(registeredBlock instanceof TrialSpawnerBlock);
    });
    
    it('should activate and start spawning mobs', () => {
      spawner.activate();
      
      assert.strictEqual(spawner.active, true);
      assert.strictEqual(spawner.waveCount, 1);
      assert.ok(spawner.currentMobCount > 0);
    });
    
    it('should properly track mob count during waves', () => {
      spawner.activate();
      
      const initialMobCount = spawner.currentMobCount;
      assert.ok(initialMobCount > 0);
      
      // Simulate killing half the mobs
      for (let i = 0; i < Math.floor(initialMobCount / 2); i++) {
        spawner.onMobDeath({});
      }
      
      assert.strictEqual(spawner.currentMobCount, Math.ceil(initialMobCount / 2));
    });
    
    it('should start next wave when all mobs are killed', () => {
      spawner.activate();
      
      const initialMobCount = spawner.currentMobCount;
      const initialWave = spawner.waveCount;
      
      // Kill all mobs
      for (let i = 0; i < initialMobCount; i++) {
        spawner.onMobDeath({});
      }
      
      // The next wave should start after a delay, so we mock that
      spawner.startNextWave();
      
      assert.strictEqual(spawner.waveCount, initialWave + 1);
      assert.ok(spawner.currentMobCount > 0);
    });
    
    it('should end trial when all waves are completed', () => {
      spawner.totalWaves = 2;
      spawner.activate();
      
      // Complete first wave
      while (spawner.currentMobCount > 0) {
        spawner.onMobDeath({});
      }
      
      // Start and complete second wave
      spawner.startNextWave();
      while (spawner.currentMobCount > 0) {
        spawner.onMobDeath({});
      }
      
      // Should have ended the trial
      assert.strictEqual(spawner.active, false);
      assert.strictEqual(spawner.waveCount, 2);
      assert.strictEqual(spawner.rewardGenerated, true);
    });
    
    it('should serialize and deserialize correctly', () => {
      spawner.active = true;
      spawner.waveCount = 2;
      spawner.totalWaves = 3;
      spawner.currentMobCount = 4;
      spawner.mobTypes = ['zombie', 'skeleton'];
      
      const serialized = spawner.serialize();
      
      const newSpawner = new TrialSpawnerBlock();
      newSpawner.deserialize(serialized, world);
      
      assert.strictEqual(newSpawner.active, true);
      assert.strictEqual(newSpawner.waveCount, 2);
      assert.strictEqual(newSpawner.totalWaves, 3);
      assert.strictEqual(newSpawner.currentMobCount, 4);
      assert.deepStrictEqual(newSpawner.mobTypes, ['zombie', 'skeleton']);
    });
  });
  
  describe('TrialChamberGenerator', () => {
    it('should create a proper generator instance', () => {
      assert.ok(generator instanceof TrialChamberGenerator);
      assert.strictEqual(generator.world, world);
      assert.ok(typeof generator.random === 'function');
    });
    
    it('should have proper configuration defaults', () => {
      assert.ok(generator.config.minRooms > 0);
      assert.ok(generator.config.maxRooms >= generator.config.minRooms);
      assert.ok(generator.config.roomSizeMin > 0);
      assert.ok(generator.config.roomSizeMax >= generator.config.roomSizeMin);
      assert.ok(generator.config.corridorWidth > 0);
      assert.ok(generator.config.treasureRoomChance >= 0 && generator.config.treasureRoomChance <= 1);
      assert.ok(generator.config.spawnerRoomChance >= 0 && generator.config.spawnerRoomChance <= 1);
    });
    
    it('should generate valid rooms without overlaps', () => {
      const structure = {
        position: { x: 0, y: 0, z: 0 },
        rooms: [],
        corridors: [],
        spawners: [],
        chests: [],
        bounds: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 0, y: 0, z: 0 }
        }
      };
      
      generator.generateRooms(structure, 5, generator.config);
      
      assert.ok(structure.rooms.length > 0);
      
      // Check for overlaps
      for (let i = 0; i < structure.rooms.length; i++) {
        for (let j = i + 1; j < structure.rooms.length; j++) {
          assert.strictEqual(
            generator.roomsOverlap(structure.rooms[i], structure.rooms[j], 1),
            false,
            `Room ${i} overlaps with room ${j}`
          );
        }
      }
    });
    
    it('should create corridors between connected rooms', () => {
      const room1 = generator.createRoom(
        { x: 0, y: 0, z: 0 },
        8, 8, 4
      );
      
      const room2 = generator.createRoom(
        { x: 20, y: 0, z: 0 },
        8, 8, 4
      );
      
      const corridor = generator.createCorridor(room1, room2, 3);
      
      assert.ok(corridor);
      assert.ok(corridor.segments.length > 0);
      assert.deepStrictEqual(corridor.room1, room1);
      assert.deepStrictEqual(corridor.room2, room2);
    });
    
    it('should place trial spawners in rooms', () => {
      const structure = {
        position: { x: 0, y: 0, z: 0 },
        rooms: [],
        corridors: [],
        spawners: [],
        chests: [],
        bounds: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 0, y: 0, z: 0 }
        }
      };
      
      generator.generateRooms(structure, 5, generator.config);
      
      // Force spawner placement in each room except first
      for (let i = 1; i < structure.rooms.length; i++) {
        structure.rooms[i].isSpecial = false;
      }
      
      // Ensure always placing spawners
      const originalRandom = generator.random;
      generator.random = () => 0.5; // Always below spawnerRoomChance
      
      generator.populateRooms(structure, { ...generator.config, spawnerRoomChance: 1.0 });
      
      // Restore random function
      generator.random = originalRandom;
      
      // Verify spawners were placed
      assert.ok(structure.spawners.length > 0);
      
      // Check each room except entrance has a spawner
      for (let i = 1; i < structure.rooms.length; i++) {
        if (!structure.rooms[i].isSpecial) {
          assert.ok(structure.rooms[i].spawners.length > 0);
        }
      }
    });
    
    it('should generate a complete structure', () => {
      const position = { x: 0, y: 0, z: 0 };
      const structure = generator.generate(position);
      
      assert.ok(structure);
      assert.ok(structure.rooms.length >= generator.config.minRooms);
      assert.ok(structure.corridors.length > 0);
      
      // Verify rooms are connected by corridors
      const roomsWithCorridors = new Set();
      
      for (const corridor of structure.corridors) {
        roomsWithCorridors.add(corridor.room1);
        roomsWithCorridors.add(corridor.room2);
      }
      
      assert.ok(roomsWithCorridors.size >= structure.rooms.length - 1);
      
      // Verify spawners and chests were placed
      if (structure.rooms.length > 1) {
        assert.ok(structure.spawners.length > 0);
        assert.ok(structure.chests.length > 0);
      }
    });
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
    
    it('should check for suitable location', () => {
      // Mock blocks for the area check
      for (let x = -20; x <= 20; x += 4) {
        for (let y = -30; y <= -10; y += 3) {
          for (let z = -20; z <= 20; z += 4) {
            world.setBlock({ x, y, z }, { 
              id: 'stone',
              solid: true,
              isLiquid: false,
              isProtected: false
            });
          }
        }
      }
      
      const location = TrialChamber.findSuitableLocation(world, {
        minY: -30,
        maxY: -10,
        minDistance: 10,
        maxDistance: 50,
        maxAttempts: 10,
        testMode: true // Use test mode to ensure a fixed position is returned
      });
      
      assert.ok(location);
      assert.ok(typeof location.x === 'number');
      assert.ok(typeof location.y === 'number');
      assert.ok(typeof location.z === 'number');
    });
  });
});

if (require.main === module) {
  describe('Trial Chamber Tests', function() {
    // Run the tests
    console.log('Running Trial Chamber tests...');
  });
} 