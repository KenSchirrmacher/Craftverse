/**
 * Village Reputation System Test
 * Tests player-villager reputation mechanics and effects on trading
 */
const { VillageReputationManager } = require('../villages/villageReputation');
const VillagerNPC = require('../mobs/villagerNPC');
const assert = require('assert');

describe('Village Reputation Tests', () => {
  let reputationManager;
  let testVillage;
  let testPlayer;
  let testVillager;
  
  beforeEach(() => {
    // Setup test environment
    reputationManager = new VillageReputationManager();
    
    // Test data
    testVillage = {
      id: 'test-village-1',
      position: { x: 0, y: 64, z: 0 },
      biome: 'plains'
    };
    
    testPlayer = {
      id: 'test-player-1',
      inventory: {
        'wheat': 100,
        'emerald': 50,
        'iron_ingot': 30,
        'paper': 64
      }
    };
    
    testVillager = new VillagerNPC(
      { x: 10, y: 64, z: 10 },
      {
        profession: 'farmer',
        level: 2,
        villageId: testVillage.id
      }
    );
  });
  
  test('Initial reputation should be neutral', () => {
    const reputation = reputationManager.getReputation(testVillager.id);
    expect(reputation).toBe(0);
  });
  
  test('Reputation should increase when helping villagers', () => {
    reputationManager.helpVillager(testVillager.id);
    const reputation = reputationManager.getReputation(testVillager.id);
    expect(reputation).toBeGreaterThan(0);
  });
  
  test('Reputation should decrease when harming villagers', () => {
    reputationManager.harmVillager(testVillager.id);
    const reputation = reputationManager.getReputation(testVillager.id);
    expect(reputation).toBeLessThan(0);
  });
  
  test('Reputation level should be calculated correctly', () => {
    // Test different reputation levels
    reputationManager.setReputation(testVillager.id, 10);
    expect(reputationManager.getReputationLevel(testVillager.id)).toBe('Hero');

    reputationManager.setReputation(testVillager.id, 0);
    expect(reputationManager.getReputationLevel(testVillager.id)).toBe('Neutral');

    reputationManager.setReputation(testVillager.id, -10);
    expect(reputationManager.getReputationLevel(testVillager.id)).toBe('Outcast');
  });
  
  describe('Reputation Tracking', () => {
    it('should update reputation based on events', () => {
      // Test trading event
      reputationManager.updateReputation(testVillage.id, testPlayer.id, 'TRADE');
      let rep = reputationManager.getReputation(testVillage.id, testPlayer.id);
      assert.equal(rep, 1, 'Reputation should increase by 1 after trading');
      
      // Test defending village
      reputationManager.updateReputation(testVillage.id, testPlayer.id, 'ZOMBIE_ATTACK_DEFENDED');
      rep = reputationManager.getReputation(testVillage.id, testPlayer.id);
      assert.equal(rep, 6, 'Reputation should increase by 5 after defending');
      
      // Test hurting villager
      reputationManager.updateReputation(testVillage.id, testPlayer.id, 'VILLAGER_HURT');
      rep = reputationManager.getReputation(testVillage.id, testPlayer.id);
      assert.equal(rep, 4, 'Reputation should decrease by 2 after hurting villager');
      
      // Test killing villager (severe penalty)
      reputationManager.updateReputation(testVillage.id, testPlayer.id, 'VILLAGER_KILLED');
      rep = reputationManager.getReputation(testVillage.id, testPlayer.id);
      assert.equal(rep, -6, 'Reputation should decrease by 10 after killing villager');
    });
    
    it('should cap reputation within bounds', () => {
      // Reset reputation for test
      reputationManager.reputations[testVillage.id][testPlayer.id] = 0;
      
      // Test upper bound
      reputationManager.updateReputation(testVillage.id, testPlayer.id, 'HERO_OF_THE_VILLAGE');
      reputationManager.updateReputation(testVillage.id, testPlayer.id, 'HERO_OF_THE_VILLAGE');
      reputationManager.updateReputation(testVillage.id, testPlayer.id, 'HERO_OF_THE_VILLAGE');
      
      let rep = reputationManager.getReputation(testVillage.id, testPlayer.id);
      assert.ok(rep <= 50, 'Reputation should be capped at 50');
      
      // Test lower bound
      reputationManager.reputations[testVillage.id][testPlayer.id] = -25;
      reputationManager.updateReputation(testVillage.id, testPlayer.id, 'VILLAGER_KILLED');
      reputationManager.updateReputation(testVillage.id, testPlayer.id, 'VILLAGER_KILLED');
      
      rep = reputationManager.getReputation(testVillage.id, testPlayer.id);
      assert.ok(rep >= -30, 'Reputation should be capped at -30');
    });
    
    it('should decay reputation over time', () => {
      // Set up test reputation
      reputationManager.reputations[testVillage.id][testPlayer.id] = 20;
      
      // Process decay
      reputationManager.processReputationDecay();
      
      // Check reputation decreased
      const rep = reputationManager.getReputation(testVillage.id, testPlayer.id);
      assert.ok(rep < 20, 'Reputation should decay over time');
    });
  });
  
  describe('Reputation Effects', () => {
    it('should provide discounts based on reputation', () => {
      // Low reputation = no discount
      reputationManager.reputations[testVillage.id][testPlayer.id] = 0;
      let discount = reputationManager.getPriceDiscount(testVillage.id, testPlayer.id);
      assert.equal(discount, 0, 'No discount with 0 reputation');
      
      // Medium reputation = small discount
      reputationManager.reputations[testVillage.id][testPlayer.id] = 10;
      discount = reputationManager.getPriceDiscount(testVillage.id, testPlayer.id);
      assert.ok(discount > 0 && discount < 0.3, 'Should have partial discount with medium reputation');
      
      // High reputation = max discount
      reputationManager.reputations[testVillage.id][testPlayer.id] = 40;
      discount = reputationManager.getPriceDiscount(testVillage.id, testPlayer.id);
      assert.equal(discount, 0.3, 'Should have maximum discount with high reputation');
    });
    
    it('should determine gift eligibility based on reputation', () => {
      // Low reputation = no gifts
      reputationManager.reputations[testVillage.id][testPlayer.id] = 5;
      let shouldGift = reputationManager.shouldReceiveGifts(testVillage.id, testPlayer.id);
      assert.equal(shouldGift, false, 'Should not receive gifts with low reputation');
      
      // High reputation = gifts
      reputationManager.reputations[testVillage.id][testPlayer.id] = 20;
      shouldGift = reputationManager.shouldReceiveGifts(testVillage.id, testPlayer.id);
      assert.equal(shouldGift, true, 'Should receive gifts with high reputation');
    });
    
    it('should determine golem hostility based on reputation', () => {
      // Normal reputation = friendly golems
      reputationManager.reputations[testVillage.id][testPlayer.id] = 0;
      let golems = reputationManager.shouldGolemAttack(testVillage.id, testPlayer.id);
      assert.equal(golems, false, 'Golems should be friendly with neutral reputation');
      
      // Very negative reputation = hostile golems
      reputationManager.reputations[testVillage.id][testPlayer.id] = -20;
      golems = reputationManager.shouldGolemAttack(testVillage.id, testPlayer.id);
      assert.equal(golems, true, 'Golems should be hostile with very negative reputation');
    });
  });
  
  describe('Trading with Reputation', () => {
    it('should apply discounts to trades with good reputation', () => {
      // Setup for test
      const emeraldTrade = testVillager.trades.find(t => 
        t.inputItems.some(item => item.id === 'emerald')
      );
      
      if (!emeraldTrade) {
        console.log('No emerald trade found for testing. Skipping discount test.');
        return;
      }
      
      // Save original inventory and trade uses
      const originalInventory = JSON.parse(JSON.stringify(testPlayer.inventory));
      const originalEmeralds = testPlayer.inventory.emerald;
      
      // Trade with neutral reputation
      reputationManager.reputations[testVillage.id][testPlayer.id] = 0;
      testVillager.executeTrade(testPlayer, emeraldTrade.id, reputationManager);
      const emeraldsAfterNormalTrade = originalEmeralds - (testPlayer.inventory.emerald || 0);
      
      // Reset player inventory
      testPlayer.inventory = JSON.parse(JSON.stringify(originalInventory));
      
      // Trade with high reputation
      reputationManager.reputations[testVillage.id][testPlayer.id] = 30;
      testVillager.executeTrade(testPlayer, emeraldTrade.id, reputationManager);
      const emeraldsAfterDiscountTrade = originalEmeralds - (testPlayer.inventory.emerald || 0);
      
      // Verify discount was applied
      assert.ok(emeraldsAfterDiscountTrade < emeraldsAfterNormalTrade, 
                'Should use fewer emeralds with reputation discount');
    });
    
    it('should update reputation after trading', () => {
      // Reset reputation
      reputationManager.reputations[testVillage.id][testPlayer.id] = 5;
      
      // Find a valid trade
      const validTrade = testVillager.trades.find(t => 
        t.inputItems.some(item => testPlayer.inventory[item.id] >= item.count)
      );
      
      if (!validTrade) {
        console.log('No valid trade found for testing. Skipping trade reputation test.');
        return;
      }
      
      // Execute trade
      testVillager.executeTrade(testPlayer, validTrade.id, reputationManager);
      
      // Check reputation increased
      const newRep = reputationManager.getReputation(testVillage.id, testPlayer.id);
      assert.equal(newRep, 6, 'Reputation should increase by 1 after trading');
    });
  });
  
  describe('Serialization', () => {
    it('should serialize and deserialize reputation data', () => {
      // Set up test reputation
      reputationManager.reputations = {
        'village-1': { 'player-1': 10, 'player-2': -5 },
        'village-2': { 'player-1': 20 }
      };
      
      // Serialize
      const data = reputationManager.serialize();
      
      // Create new manager and deserialize
      const newManager = new VillageReputationManager();
      newManager.deserialize(data);
      
      // Verify data
      assert.equal(
        newManager.getReputation('village-1', 'player-1'), 
        10,
        'Deserialized reputation should match original'
      );
      
      assert.equal(
        newManager.getReputation('village-1', 'player-2'), 
        -5,
        'Deserialized reputation should match original'
      );
      
      assert.equal(
        newManager.getReputation('village-2', 'player-1'), 
        20,
        'Deserialized reputation should match original'
      );
    });
  });
}); 