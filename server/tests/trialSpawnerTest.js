/**
 * Test suite for TrialSpawnerBlock implementation
 * Tests the trial spawner block functionality for the 1.21 Update (Tricky Trials)
 */

const assert = require('assert');
const TrialSpawnerBlock = require('../blocks/trialSpawner');
const World = require('../world');

describe('TrialSpawnerBlock Tests', () => {
  let world;
  let spawner;
  
  beforeEach(() => {
    world = new World();
    world.initialize();
    
    spawner = new TrialSpawnerBlock({
      totalWaves: 3,
      maxMobsPerWave: 5,
      mobTypes: ['zombie', 'skeleton']
    });
    
    spawner.setPosition({ x: 0, y: 0, z: 0 });
    spawner.setWorld(world);
  });
  
  describe('Basic Properties', () => {
    it('should initialize with correct properties', () => {
      assert.strictEqual(spawner.id, 'trial_spawner');
      assert.strictEqual(spawner.name, 'Trial Spawner');
      assert.strictEqual(spawner.hardness, 50.0);
      assert.strictEqual(spawner.resistance, 1200.0);
      assert.strictEqual(spawner.requiresTool, true);
      assert.strictEqual(spawner.toolType, 'pickaxe');
      assert.strictEqual(spawner.transparent, false);
      assert.strictEqual(spawner.solid, true);
      assert.strictEqual(spawner.gravity, false);
      assert.strictEqual(spawner.luminance, 7);
    });
    
    it('should have correct trial spawner properties', () => {
      assert.strictEqual(spawner.active, false);
      assert.strictEqual(spawner.waveCount, 0);
      assert.strictEqual(spawner.totalWaves, 3);
      assert.strictEqual(spawner.currentMobCount, 0);
      assert.strictEqual(spawner.maxMobsPerWave, 5);
      assert.deepStrictEqual(spawner.mobTypes, ['zombie', 'skeleton']);
      assert.strictEqual(spawner.spawnRadius, 8);
      assert.strictEqual(spawner.rewardGenerated, false);
    });
  });
  
  describe('Activation and Wave Management', () => {
    it('should activate properly', () => {
      const activated = spawner.activate();
      assert.strictEqual(activated, true);
      assert.strictEqual(spawner.active, true);
      assert.strictEqual(spawner.waveCount, 0);
      assert.strictEqual(spawner.currentMobCount, 0);
      assert.strictEqual(spawner.rewardGenerated, false);
    });
    
    it('should not activate if already active', () => {
      spawner.activate();
      const activated = spawner.activate();
      assert.strictEqual(activated, false);
    });
    
    it('should handle wave progression', () => {
      spawner.activate();
      assert.strictEqual(spawner.waveCount, 0);
      
      // Simulate wave completion
      spawner.currentMobCount = 0;
      spawner.startNextWave();
      assert.strictEqual(spawner.waveCount, 1);
      
      // Complete all waves
      spawner.currentMobCount = 0;
      spawner.startNextWave();
      assert.strictEqual(spawner.waveCount, 2);
      
      spawner.currentMobCount = 0;
      spawner.startNextWave();
      assert.strictEqual(spawner.waveCount, 3);
    });
  });
  
  describe('Mob Spawning', () => {
    it('should spawn mobs within radius', () => {
      spawner.activate();
      const mob = spawner.spawnMob();
      
      assert.ok(mob);
      assert.ok(mob.position.x >= -8 && mob.position.x <= 8);
      assert.ok(mob.position.z >= -8 && mob.position.z <= 8);
      assert.ok(['zombie', 'skeleton'].includes(mob.type));
    });
    
    it('should handle mob death', () => {
      spawner.activate();
      const mob = spawner.spawnMob();
      
      const initialCount = spawner.currentMobCount;
      mob.events.emit('death');
      
      assert.strictEqual(spawner.currentMobCount, initialCount - 1);
    });
  });
  
  describe('Reward Generation', () => {
    it('should generate rewards on trial completion', () => {
      spawner.activate();
      spawner.waveCount = spawner.totalWaves;
      spawner.currentMobCount = 0;
      
      // Create a test reward chest
      world.setBlock({ x: 5, y: 0, z: 5 }, {
        id: 'reward_chest',
        fillWithLoot: (table, options) => {
          assert.strictEqual(table, 'trial_reward');
          assert.strictEqual(options.waveCount, spawner.totalWaves);
          assert.strictEqual(options.difficultyFactor, 1);
        }
      });
      
      spawner.generateRewards();
      assert.strictEqual(spawner.rewardGenerated, true);
    });
  });
  
  describe('Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      spawner.activate();
      spawner.waveCount = 2;
      spawner.currentMobCount = 3;
      
      const data = spawner.serialize();
      const newSpawner = new TrialSpawnerBlock();
      newSpawner.deserialize(data, world);
      
      assert.strictEqual(newSpawner.active, true);
      assert.strictEqual(newSpawner.waveCount, 2);
      assert.strictEqual(newSpawner.currentMobCount, 3);
      assert.strictEqual(newSpawner.totalWaves, 3);
      assert.strictEqual(newSpawner.maxMobsPerWave, 5);
      assert.deepStrictEqual(newSpawner.mobTypes, ['zombie', 'skeleton']);
    });
  });
  
  describe('Block Interaction', () => {
    it('should handle player interaction', () => {
      const player = { id: 'test_player' };
      const action = { type: 'right_click' };
      
      const handled = spawner.interact(player, action);
      assert.strictEqual(handled, true);
      assert.strictEqual(spawner.active, true);
    });
    
    it('should not handle non-right-click actions', () => {
      const player = { id: 'test_player' };
      const action = { type: 'left_click' };
      
      const handled = spawner.interact(player, action);
      assert.strictEqual(handled, false);
      assert.strictEqual(spawner.active, false);
    });
  });
}); 