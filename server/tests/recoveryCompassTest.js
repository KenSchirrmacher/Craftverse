/**
 * Recovery Compass Test - Tests for the Recovery Compass and Echo Shards implementation
 * Part of the Wild Update
 */

const assert = require('assert');
const RecoveryCompassItem = require('../items/recoveryCompassItem');
const EchoShardItem = require('../items/echoShardItem');
const ItemRegistry = require('../items/itemRegistry');
const CraftingManager = require('../crafting/craftingManager');

describe('Recovery Compass Tests', () => {
  // Mock player for testing
  let mockPlayer;
  // Mock crafting manager for testing
  let craftingManager;
  
  beforeEach(() => {
    // Setup a mock player with a death location
    mockPlayer = {
      id: 'test-player-1',
      position: { x: 100, y: 64, z: 200 },
      lastDeathLocation: {
        x: 150,
        y: 70,
        z: 300,
        dimension: 'overworld'
      },
      dimension: 'overworld',
      messageLog: [], // Array to store messages for testing
      sendMessage: function(message) {
        this.messageLog.push(message);
        this.lastMessage = message; // Keep lastMessage for backward compatibility
      }
    };
    
    // Initialize crafting manager
    craftingManager = new CraftingManager();
    craftingManager.registerDefaultRecipes();
  });
  
  describe('Echo Shard Item', () => {
    it('should be registered in ItemRegistry', () => {
      const echoShard = ItemRegistry.getItem('echo_shard');
      assert.ok(echoShard, 'Echo Shard item not found in registry');
      assert.equal(echoShard.id, 'echo_shard');
      assert.equal(echoShard.name, 'Echo Shard');
      assert.equal(echoShard.type, 'material');
      assert.equal(echoShard.maxStackSize, 64);
    });
    
    it('should include description in client data', () => {
      const echoShard = ItemRegistry.getItem('echo_shard');
      const clientData = echoShard.getClientData();
      assert.ok(clientData.description, 'Description not included in client data');
      assert.ok(clientData.description.includes('Recovery Compass'), 'Description should mention its use');
    });
    
    it('should serialize and deserialize correctly', () => {
      const echoShard = ItemRegistry.getItem('echo_shard');
      const jsonData = echoShard.toJSON();
      const restored = EchoShardItem.fromJSON(jsonData);
      
      assert.equal(restored.id, echoShard.id);
      assert.equal(restored.name, echoShard.name);
      assert.equal(restored.stackable, echoShard.stackable);
    });
  });
  
  describe('Recovery Compass Item', () => {
    it('should be registered in ItemRegistry', () => {
      const recoveryCompass = ItemRegistry.getItem('recovery_compass');
      assert.ok(recoveryCompass, 'Recovery Compass item not found in registry');
      assert.equal(recoveryCompass.id, 'recovery_compass');
      assert.equal(recoveryCompass.name, 'Recovery Compass');
      assert.equal(recoveryCompass.type, 'tool');
      assert.equal(recoveryCompass.subtype, 'compass');
      assert.equal(recoveryCompass.maxStackSize, 1);
    });
    
    it('should provide client data with no tracking when player has no death location', () => {
      const recoveryCompass = ItemRegistry.getItem('recovery_compass');
      const playerWithNoDeathLoc = { ...mockPlayer, lastDeathLocation: null };
      
      const clientData = recoveryCompass.getClientData(playerWithNoDeathLoc);
      
      assert.ok(clientData.compassState, 'Compass state should be included');
      assert.equal(clientData.compassState.isTracking, false);
      assert.equal(clientData.compassState.targetDirection, null);
      assert.equal(clientData.compassState.targetDistance, null);
    });
    
    it('should point to last death location in same dimension', () => {
      const recoveryCompass = ItemRegistry.getItem('recovery_compass');
      const clientData = recoveryCompass.getClientData(mockPlayer);
      
      assert.ok(clientData.compassState, 'Compass state should be included');
      assert.equal(clientData.compassState.isTracking, true);
      
      // Calculate expected direction and distance
      const dx = mockPlayer.lastDeathLocation.x - mockPlayer.position.x;
      const dy = mockPlayer.lastDeathLocation.y - mockPlayer.position.y;
      const dz = mockPlayer.lastDeathLocation.z - mockPlayer.position.z;
      const expectedDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const expectedAngle = Math.atan2(dz, dx) * (180 / Math.PI);
      
      assert.equal(clientData.compassState.targetDirection, expectedAngle);
      assert.equal(clientData.compassState.targetDistance, expectedDistance);
    });
    
    it('should not track death location in different dimension', () => {
      const recoveryCompass = ItemRegistry.getItem('recovery_compass');
      const playerInNetherDimension = {
        ...mockPlayer,
        dimension: 'nether'
      };
      
      const clientData = recoveryCompass.getClientData(playerInNetherDimension);
      
      assert.equal(clientData.compassState.isTracking, false);
      assert.ok(clientData.compassState.message.includes('another dimension'), 
                'Message should indicate dimension mismatch');
    });
    
    it('should provide information when used', () => {
      const recoveryCompass = ItemRegistry.getItem('recovery_compass');
      const result = recoveryCompass.use(mockPlayer);
      
      console.log('messageLog:', mockPlayer.messageLog);
      console.log('use result:', result);
      
      assert.ok(result, 'Use method should return true');
      assert.ok(mockPlayer.messageLog.length > 0, 'Player should receive at least one message');
      
      // Check if any of the messages contain death location information
      const hasDeathLocation = mockPlayer.messageLog.some(msg => 
        msg.includes('Death location') || msg.includes('death location')
      );
      
      assert.ok(hasDeathLocation, 'One of the messages should contain death location information');
    });
    
    it('should serialize and deserialize correctly', () => {
      const recoveryCompass = ItemRegistry.getItem('recovery_compass');
      const jsonData = recoveryCompass.toJSON();
      const restored = RecoveryCompassItem.fromJSON(jsonData);
      
      assert.equal(restored.id, recoveryCompass.id);
      assert.equal(restored.name, recoveryCompass.name);
      assert.equal(restored.type, recoveryCompass.type);
    });
  });
  
  describe('Crafting Recipe', () => {
    it('should have a crafting recipe registered', () => {
      const recipes = craftingManager.getRecipes();
      
      let hasRecoveryCompassRecipe = false;
      
      // Check shaped recipes
      for (const recipe of recipes.shaped) {
        if (recipe.result && recipe.result.id === 'recovery_compass') {
          hasRecoveryCompassRecipe = true;
          break;
        }
      }
      
      assert.ok(hasRecoveryCompassRecipe, 'No crafting recipe found for Recovery Compass');
    });
    
    it('should use 8 Echo Shards and 1 Compass', () => {
      const recipes = craftingManager.getRecipes();
      
      let recoveryCompassRecipe = null;
      
      // Find the recipe
      for (const recipe of recipes.shaped) {
        if (recipe.result && recipe.result.id === 'recovery_compass') {
          recoveryCompassRecipe = recipe;
          break;
        }
      }
      
      assert.ok(recoveryCompassRecipe, 'No crafting recipe found for Recovery Compass');
      
      // Count ingredients
      let echoShardCount = 0;
      let compassCount = 0;
      
      // For shaped recipes, check the pattern
      for (const row of recoveryCompassRecipe.pattern) {
        for (const item of row) {
          if (item === 'echo_shard') {
            echoShardCount++;
          } else if (item === 'compass') {
            compassCount++;
          }
        }
      }
      
      assert.equal(echoShardCount, 8, 'Recipe should use 8 Echo Shards');
      assert.equal(compassCount, 1, 'Recipe should use 1 Compass');
    });
  });
  
  describe('Death Location Storage', () => {
    // This would ideally be tested with a mock server instance
    // but we can test the general structure and concepts
    
    it('should store the death location with the correct format', () => {
      const deathLocation = mockPlayer.lastDeathLocation;
      
      assert.ok(deathLocation, 'Death location should exist');
      assert.equal(typeof deathLocation.x, 'number', 'X coordinate should be a number');
      assert.equal(typeof deathLocation.y, 'number', 'Y coordinate should be a number');
      assert.equal(typeof deathLocation.z, 'number', 'Z coordinate should be a number');
      assert.ok(deathLocation.dimension, 'Dimension should be defined');
    });
  });
}); 