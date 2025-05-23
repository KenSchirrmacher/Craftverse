/**
 * Village and Trading System Test Suite
 * Tests village generation, villager spawning, and trading mechanics
 */
const { VillageGenerator } = require('../villages/villageGenerator');
const { MobManager } = require('../mobs/mobManager');
const { TradingSystem } = require('../villages/tradingSystem');
const assert = require('assert');

describe('Village Trading Tests', () => {
  let villageGenerator;
  let mobManager;
  let tradingSystem;
  let testVillage;
  let testVillager;
  let testPlayer;

  beforeEach(() => {
    // Setup test environment
    villageGenerator = new VillageGenerator({ seed: 12345 });
    mobManager = new MobManager();
    tradingSystem = new TradingSystem();

    // Create test village and villager
    testVillage = villageGenerator.generateVillage({ x: 0, y: 0, z: 0 });
    testVillager = mobManager.spawnVillager(testVillage, { x: 0, y: 0, z: 0 });
    testPlayer = {
      id: 'test_player',
      name: 'Test Player',
      inventory: []
    };
  });

  test('Villager should have valid trades', () => {
    const trades = tradingSystem.getVillagerTrades(testVillager);
    expect(trades).toBeDefined();
    expect(trades.length).toBeGreaterThan(0);
  });

  test('Player should be able to trade with villager', () => {
    const trade = tradingSystem.getVillagerTrades(testVillager)[0];
    const result = tradingSystem.executeTrade(testVillager, testPlayer, trade);
    expect(result.success).toBe(true);
  });

  test('Trade should fail if player lacks required items', () => {
    const trade = tradingSystem.getVillagerTrades(testVillager)[0];
    testPlayer.inventory = []; // Empty inventory
    const result = tradingSystem.executeTrade(testVillager, testPlayer, trade);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('insufficient_items');
  });

  test('Trade should update villager inventory', () => {
    const trade = tradingSystem.getVillagerTrades(testVillager)[0];
    const initialInventory = [...testVillager.inventory];
    tradingSystem.executeTrade(testVillager, testPlayer, trade);
    expect(testVillager.inventory).not.toEqual(initialInventory);
  });

  test('Trade should update player inventory', () => {
    const trade = tradingSystem.getVillagerTrades(testVillager)[0];
    const initialInventory = [...testPlayer.inventory];
    tradingSystem.executeTrade(testVillager, testPlayer, trade);
    expect(testPlayer.inventory).not.toEqual(initialInventory);
  });
});

describe('Village and Trading System', () => {
  let villageGenerator;
  let mobManager;
  let village;
  let testVillager;
  
  // Mock functions for testing
  const mockBlockSetter = (position, blockData) => {
    // In a real test, would set blocks in a test world
    console.log(`Set block at ${JSON.stringify(position)}: ${blockData.type}`);
    return true;
  };
  
  const mockEntitySpawner = (type, position, options) => {
    // Create a real villager for testing trades
    if (type === 'villager') {
      const villager = new VillagerNPC(position, options);
      return villager;
    }
    return null;
  };
  
  before(() => {
    // Setup test environment
    villageGenerator = new VillageGenerator({ seed: 12345 });
    mobManager = new MobManager();
  });
  
  describe('Village Generation', () => {
    it('should generate a village with proper structure', () => {
      // Generate a test village
      village = villageGenerator.generateVillage(
        { x: 0, y: 64, z: 0 },
        'plains',
        mockBlockSetter,
        mockEntitySpawner
      );
      
      // Verify village structure
      assert.ok(village.id, 'Village should have an ID');
      assert.ok(village.buildings.length > 0, 'Village should have buildings');
      assert.ok(village.villagers.length > 0, 'Village should have villagers');
      assert.equal(village.biome, 'plains', 'Village should have correct biome');
      
      // Verify building types
      const buildingTypes = village.buildings.map(b => b.type);
      assert.ok(buildingTypes.includes('well') || buildingTypes.includes('meeting_point'), 
                'Village should have a center structure');
                
      // Store a villager for trade testing
      testVillager = village.villagers[0];
    });
    
    it('should create buildings with appropriate workstations', () => {
      // Check if buildings have workstations based on their type
      const buildingsWithWorkstations = village.buildings.filter(b => 
        b.workstations && b.workstations.length > 0
      );
      
      assert.ok(buildingsWithWorkstations.length > 0, 'Some buildings should have workstations');
    });
    
    it('should assign villagers to buildings', () => {
      // Verify villagers have home positions
      const villagersWithHomes = village.villagers.filter(v => v.homePosition);
      assert.equal(villagersWithHomes.length, village.villagers.length, 
                  'All villagers should have homes');
    });
  });
  
  describe('Villager Trading', () => {
    it('should create villagers with professions', () => {
      assert.ok(testVillager.profession, 'Villager should have a profession');
      assert.ok(['farmer', 'librarian', 'smith', 'shepherd', 'nitwit', 'butcher', 'fletcher', 'cleric'].includes(testVillager.profession) ||
                testVillager.profession.includes('smith'), 'Profession should be valid');
    });
    
    it('should generate trades for villagers', () => {
      const trades = testVillager.getAvailableTrades();
      assert.ok(trades.length > 0, 'Villager should have trades');
      
      // Verify trade structure
      const firstTrade = trades[0];
      assert.ok(firstTrade.id, 'Trade should have an ID');
      assert.ok(Array.isArray(firstTrade.inputItems), 'Trade should have input items');
      assert.ok(firstTrade.outputItem, 'Trade should have output items');
    });
    
    it('should handle trade execution', () => {
      // Create mock player
      const mockPlayer = {
        id: 'test-player-1',
        inventory: {
          'wheat': 25,
          'emerald': 10,
          'iron_ingot': 20,
          'paper': 30
        }
      };
      
      // Get available trades
      const trades = testVillager.getAvailableTrades();
      const tradeToTest = trades.find(t => 
        t.inputItems.some(item => mockPlayer.inventory[item.id] >= item.count)
      );
      
      if (tradeToTest) {
        // Execute the trade
        const result = testVillager.executeTrade(mockPlayer, tradeToTest.id);
        
        // Verify trade execution
        assert.ok(result.success, 'Trade should succeed with valid items');
        
        // Check inventory changes
        tradeToTest.inputItems.forEach(item => {
          assert.ok(mockPlayer.inventory[item.id] !== undefined, 
                    `Player should still have ${item.id} in inventory`);
        });
        
        // Check for output item
        assert.ok(mockPlayer.inventory[tradeToTest.outputItem.id] !== undefined,
                 'Player should receive output item');
      } else {
        console.log('No suitable trade found for testing. Skipping trade execution test.');
      }
    });
    
    it('should increase villager experience after trading', () => {
      // Create mock player
      const mockPlayer = {
        id: 'test-player-2',
        inventory: {
          'wheat': 25,
          'emerald': 10,
          'iron_ingot': 20,
          'paper': 30
        }
      };
      
      // Get villager's initial experience
      const initialExp = testVillager.experience;
      
      // Get available trades
      const trades = testVillager.getAvailableTrades();
      const tradeToTest = trades.find(t => 
        t.inputItems.some(item => mockPlayer.inventory[item.id] >= item.count)
      );
      
      if (tradeToTest) {
        // Execute the trade
        testVillager.executeTrade(mockPlayer, tradeToTest.id);
        
        // Check if experience increased
        assert.ok(testVillager.experience > initialExp, 
                 'Villager experience should increase after trading');
      } else {
        console.log('No suitable trade found for testing. Skipping experience test.');
      }
    });
    
    it('should handle trade restock', () => {
      // Force a restock
      testVillager.restockTrades();
      
      // Check if trades are available again
      const trades = testVillager.getAvailableTrades();
      const availableTrades = trades.filter(t => !t.disabled);
      
      assert.ok(availableTrades.length > 0, 'Villager should have available trades after restock');
    });
  });
  
  describe('Villager Trading Integration', () => {
    it('should handle villager trades through mob manager', () => {
      // Add test villager to mob manager
      mobManager.mobs[testVillager.id] = testVillager;
      
      // Create mock player
      const mockPlayerId = 'test-player-3';
      
      // Get trades via mob manager
      const tradeData = mobManager.handleVillagerTrade(mockPlayerId, testVillager.id, {
        action: 'get_trades'
      });
      
      // Verify trade data
      assert.ok(tradeData.success, 'Should successfully get trades');
      assert.ok(Array.isArray(tradeData.trades), 'Should return array of trades');
      assert.ok(tradeData.villagerInfo, 'Should return villager info');
      assert.equal(tradeData.villagerInfo.profession, testVillager.profession, 
                  'Should return correct profession');
    });
  });
}); 