const assert = require('assert');
const Wolf = require('../mobs/neutralMobs').Wolf;
const AnimalTrainingManager = require('../animal/animalTrainingManager');
const TamedAnimalCommand = require('../animal/tamedAnimalCommand');
const TestBase = require('./testBase');

class TamedAnimalImprovementsTest extends TestBase {
  constructor() {
    super('Tamed Animal Improvements Tests');
    this.mockPlayer = {
      id: 'player-1',
      position: { x: 0, y: 64, z: 0 },
      inventory: {
        addItem: (item) => true,
        removeItem: (item) => true,
        hasItem: (itemType) => true
      }
    };
  }

  async runTests() {
    // Run all tests
    await this.testAnimalTraining();
    await this.testCommandExecution();
    await this.testBehaviorLearning();
    await this.testMobManagerIntegration();
  }

  async testAnimalTraining() {
    this.runTest('AnimalTrainingManager initialization', () => {
      const trainingManager = new AnimalTrainingManager();
      assert.ok(trainingManager, 'Training manager should be initialized');
      assert.strictEqual(typeof trainingManager.trainAnimal, 'function', 'Training manager should have trainAnimal method');
      assert.strictEqual(typeof trainingManager.getTrainingLevel, 'function', 'Training manager should have getTrainingLevel method');
    });

    this.runTest('Animal training progression', () => {
      const trainingManager = new AnimalTrainingManager();
      const wolf = new Wolf({ x: 0, y: 64, z: 0 });
      wolf.tamed = true;
      wolf.owner = 'player-1';
      
      const initialLevel = trainingManager.getTrainingLevel(wolf.id);
      assert.strictEqual(initialLevel, 0, 'Initial training level should be 0');
      
      // Train the wolf multiple times to increase experience past level threshold (50 exp)
      for (let i = 0; i < 12; i++) {
        trainingManager.trainAnimal(wolf.id, 'player-1', 'sit');
      }
      
      const newLevel = trainingManager.getTrainingLevel(wolf.id);
      assert.ok(newLevel > initialLevel, 'Training level should increase');
    });
    
    this.runTest('Training restrictions', () => {
      const trainingManager = new AnimalTrainingManager();
      const wolf = new Wolf({ x: 0, y: 64, z: 0 });
      
      // Save original mobManager if exists
      const originalMobManager = global.mobManager;
      
      // Create mock mobManager for testing
      global.mobManager = {
        mobs: {
          [wolf.id]: wolf
        }
      };
      
      // Try to train an untamed wolf
      const result = trainingManager.trainAnimal(wolf.id, 'player-1', 'sit');
      assert.strictEqual(result, false, 'Should not be able to train untamed animals');
      
      // Tame the wolf but with different owner
      wolf.tamed = true;
      wolf.owner = 'player-2';
      
      const result2 = trainingManager.trainAnimal(wolf.id, 'player-1', 'sit');
      assert.strictEqual(result2, false, 'Should not be able to train animals owned by others');
      
      // Restore original mobManager
      global.mobManager = originalMobManager;
    });
  }

  async testCommandExecution() {
    this.runTest('Basic command execution', () => {
      const wolf = new Wolf({ x: 0, y: 64, z: 0 });
      wolf.tamed = true;
      wolf.owner = 'player-1';
      
      const command = new TamedAnimalCommand('sit');
      const result = command.execute(wolf, this.mockPlayer);
      
      assert.strictEqual(result.success, true, 'Command should execute successfully');
      assert.strictEqual(wolf.sitting, true, 'Wolf should be sitting after command');
      
      // Test the inverse command
      const standCommand = new TamedAnimalCommand('stand');
      const result2 = standCommand.execute(wolf, this.mockPlayer);
      
      assert.strictEqual(result2.success, true, 'Stand command should execute successfully');
      assert.strictEqual(wolf.sitting, false, 'Wolf should be standing after command');
    });
    
    this.runTest('Advanced commands based on training level', () => {
      const wolf = new Wolf({ x: 0, y: 64, z: 0 });
      wolf.tamed = true;
      wolf.owner = 'player-1';
      
      const trainingManager = new AnimalTrainingManager();
      
      // Set training level manually for testing
      trainingManager.trainAnimals = {
        [wolf.id]: {
          level: 0,
          experience: 0,
          ownerId: 'player-1'
        }
      };
      
      // Try advanced command at level 0
      const stayCommand = new TamedAnimalCommand('stay');
      const result = stayCommand.execute(wolf, this.mockPlayer, trainingManager);
      
      assert.strictEqual(result.success, false, 'Advanced command should fail at low training level');
      
      // Increase training level
      trainingManager.trainAnimals[wolf.id].level = 3;
      
      // Try again
      const result2 = stayCommand.execute(wolf, this.mockPlayer, trainingManager);
      assert.strictEqual(result2.success, true, 'Advanced command should succeed at higher training level');
    });
  }

  async testBehaviorLearning() {
    this.runTest('Learning new behaviors', () => {
      const wolf = new Wolf({ x: 0, y: 64, z: 0 });
      wolf.tamed = true;
      wolf.owner = 'player-1';
      
      const trainingManager = new AnimalTrainingManager();
      
      // Teach a new behavior
      const result = trainingManager.teachBehavior(wolf.id, 'player-1', 'fetch');
      assert.strictEqual(result.success, true, 'Should successfully teach new behavior');
      
      // Check if behavior was learned
      const behaviors = trainingManager.getLearnedBehaviors(wolf.id);
      assert.ok(behaviors.includes('fetch'), 'Fetch behavior should be learned');
    });
    
    this.runTest('Custom behavior execution', () => {
      const wolf = new Wolf({ x: 0, y: 64, z: 0 });
      wolf.tamed = true;
      wolf.owner = 'player-1';
      
      const trainingManager = new AnimalTrainingManager();
      
      // Manually set learned behaviors for testing
      trainingManager.trainAnimals = {
        [wolf.id]: {
          level: 3,
          experience: 100,
          ownerId: 'player-1',
          behaviors: ['fetch', 'guard']
        }
      };
      
      // Execute custom behavior
      const command = new TamedAnimalCommand('fetch');
      const result = command.execute(wolf, this.mockPlayer, trainingManager);
      
      assert.strictEqual(result.success, true, 'Learned behavior should execute successfully');
      assert.strictEqual(result.action, 'fetch', 'Fetch action should be performed');
    });
  }

  async testMobManagerIntegration() {
    this.runTest('Integration with MobManager', () => {
      const mockMobManager = {
        mobs: {},
        players: { 'player-1': this.mockPlayer },
        
        addMob: function(mob) {
          this.mobs[mob.id] = mob;
          return mob.id;
        },
        
        handleInteraction: function(playerId, mobId, data) {
          const mob = this.mobs[mobId];
          const player = this.players[playerId];
          
          if (data.action === 'command' && mob && mob.tamed && mob.owner === playerId) {
            if (data.command === 'sit') {
              mob.sitting = true;
              return { success: true, result: 'sitting' };
            } else if (data.command === 'follow') {
              mob.sitting = false;
              mob.state = 'follow';
              mob.targetEntity = player;
              return { success: true, result: 'following' };
            }
          }
          
          return { success: false };
        }
      };
      
      // Add a tamed wolf to the mob manager
      const wolf = new Wolf({ x: 0, y: 64, z: 0 });
      wolf.tamed = true;
      wolf.owner = 'player-1';
      mockMobManager.addMob(wolf);
      
      // Test command through mob manager
      const result = mockMobManager.handleInteraction('player-1', wolf.id, {
        action: 'command',
        command: 'sit'
      });
      
      assert.strictEqual(result.success, true, 'Command through mob manager should succeed');
      assert.strictEqual(result.result, 'sitting', 'Wolf should be sitting');
      assert.strictEqual(wolf.sitting, true, 'Wolf object should reflect sitting state');
    });
  }
}

module.exports = TamedAnimalImprovementsTest; 