/**
 * Tests for the SculkCatalystBlock functionality
 */

const assert = require('assert');
const SculkCatalystBlock = require('../blocks/sculkCatalystBlock');

describe('SculkCatalystBlock', () => {
  let catalyst;
  
  beforeEach(() => {
    catalyst = new SculkCatalystBlock();
    catalyst.x = 0;
    catalyst.y = 0;
    catalyst.z = 0;
  });
  
  describe('Basic Properties', () => {
    it('should have correct identification values', () => {
      assert.strictEqual(catalyst.id, 'sculk_catalyst');
      assert.strictEqual(catalyst.name, 'Sculk Catalyst');
    });
    
    it('should have appropriate block properties', () => {
      assert.strictEqual(catalyst.hardness, 3.0);
      assert.strictEqual(catalyst.resistance, 3.0);
      assert.strictEqual(catalyst.requiresTool, true);
      assert.strictEqual(catalyst.lightLevel, 6);
    });
    
    it('should initialize with inactive state', () => {
      assert.strictEqual(catalyst.active, false);
      assert.strictEqual(catalyst.bloomTimer, 0);
      assert.deepStrictEqual(catalyst.chargeEvents, []);
    });
    
    it('should have proper catalysis properties', () => {
      assert.strictEqual(catalyst.maxChargeDistance, 8);
      assert.strictEqual(catalyst.bloomDuration, 20);
      assert.strictEqual(catalyst.maxChargeEvents, 5);
      assert.strictEqual(typeof catalyst.catalystEmitter, 'object');
    });
  });
  
  describe('Mob Death Handling', () => {
    it('should collect charge from mob deaths within range', () => {
      const event = {
        position: { x: 5, y: 0, z: 0 },
        xpAmount: 10,
        mobType: 'zombie'
      };
      
      const result = catalyst.handleMobDeath(event, 0);
      assert.strictEqual(result, true, 'Should collect charge from mob within range');
      assert.strictEqual(catalyst.active, true, 'Should activate bloom effect');
      assert.strictEqual(catalyst.chargeEvents.length, 1, 'Should add a charge event');
      assert.strictEqual(catalyst.chargeEvents[0].processed, false, 'Charge event should be unprocessed');
    });
    
    it('should not collect charge from mob deaths outside range', () => {
      const event = {
        position: { x: 20, y: 0, z: 0 },
        xpAmount: 10,
        mobType: 'zombie'
      };
      
      const result = catalyst.handleMobDeath(event, 0);
      assert.strictEqual(result, false, 'Should not collect charge from mob outside range');
      assert.strictEqual(catalyst.active, false, 'Should not activate bloom effect');
      assert.strictEqual(catalyst.chargeEvents.length, 0, 'Should not add a charge event');
    });
    
    it('should limit stored charge events', () => {
      // Add max + 1 charge events
      for (let i = 0; i < catalyst.maxChargeEvents + 1; i++) {
        const event = {
          position: { x: 1, y: 0, z: 0 },
          xpAmount: i + 1,
          mobType: 'zombie'
        };
        
        catalyst.handleMobDeath(event, i);
      }
      
      assert.strictEqual(catalyst.chargeEvents.length, catalyst.maxChargeEvents, 
        'Should limit number of stored charge events');
      
      // First event should be removed
      assert.strictEqual(catalyst.chargeEvents[0].xpAmount, 2, 
        'Should remove oldest charge event');
    });
    
    it('should emit events when collecting charge', (done) => {
      const event = {
        position: { x: 3, y: 0, z: 0 },
        xpAmount: 10,
        mobType: 'zombie'
      };
      
      // Listen for the charge collected event
      catalyst.catalystEmitter.once('chargeCollected', (data) => {
        assert.deepStrictEqual(data.position, event.position);
        assert.ok(data.chargeAmount > 0);
        assert.deepStrictEqual(data.catalyst, { x: 0, y: 0, z: 0 });
        done();
      });
      
      catalyst.handleMobDeath(event, 0);
    });
  });
  
  describe('Bloom Effect', () => {
    it('should activate bloom effect when collecting charge', () => {
      const event = {
        position: { x: 2, y: 0, z: 0 },
        xpAmount: 5,
        mobType: 'skeleton'
      };
      
      catalyst.handleMobDeath(event, 0);
      assert.strictEqual(catalyst.active, true);
      assert.strictEqual(catalyst.bloomTimer, catalyst.bloomDuration);
    });
    
    it('should increase light level during bloom', () => {
      const normalLight = catalyst.getLightLevel();
      
      // Activate bloom
      catalyst.active = true;
      
      const bloomLight = catalyst.getLightLevel();
      assert.ok(bloomLight > normalLight, 'Should increase light level during bloom');
      assert.strictEqual(bloomLight, 14, 'Should have correct bloom light level');
    });
    
    it('should deactivate after bloom duration', () => {
      // Activate bloom
      catalyst.active = true;
      catalyst.bloomTimer = 2;
      
      // Update for first tick
      catalyst.update(null, null, 0);
      assert.strictEqual(catalyst.bloomTimer, 1);
      assert.strictEqual(catalyst.active, true);
      
      // Update for second tick
      catalyst.update(null, null, 1);
      assert.strictEqual(catalyst.bloomTimer, 0);
      assert.strictEqual(catalyst.active, false);
    });
    
    it('should emit events for bloom start and end', () => {
      let bloomStarted = false;
      let bloomEnded = false;
      
      // Listen for bloom events
      catalyst.catalystEmitter.on('bloomStarted', () => {
        bloomStarted = true;
      });
      
      catalyst.catalystEmitter.on('bloomEnded', () => {
        bloomEnded = true;
      });
      
      // Start bloom
      catalyst.activateBloom(0);
      assert.strictEqual(bloomStarted, true);
      
      // End bloom
      catalyst.bloomTimer = 1;
      catalyst.update(null, null, 1);
      assert.strictEqual(bloomEnded, true);
    });
  });
  
  describe('Sculk Spreading', () => {
    it('should process unprocessed charge events', () => {
      // Create mock world
      const mockWorld = {
        getBlock: () => ({ id: 'stone' }),
        setBlock: () => {}
      };
      
      // Create unprocessed charge event
      catalyst.chargeEvents.push({
        position: { x: 1, y: 0, z: 1 },
        chargeAmount: 5,
        time: 0,
        mobType: 'zombie',
        processed: false
      });
      
      // Process charge events
      catalyst.update(mockWorld, { x: 0, y: 0, z: 0 }, 0);
      
      // Event should be processed
      assert.strictEqual(catalyst.chargeEvents[0].processed, true);
    });
    
    it('should determine replaceable blocks correctly', () => {
      // Test replaceable blocks
      const replaceableIds = [
        'stone', 'dirt', 'grass_block', 'deepslate', 'tuff'
      ];
      
      for (const id of replaceableIds) {
        assert.strictEqual(catalyst.canReplace({ id }), true, 
          `Block ${id} should be replaceable`);
      }
      
      // Test non-replaceable blocks
      const nonReplaceableIds = [
        'obsidian', 'bedrock', 'sculk', 'sculk_catalyst', 'sculk_sensor'
      ];
      
      for (const id of nonReplaceableIds) {
        assert.strictEqual(catalyst.canReplace({ id }), false, 
          `Block ${id} should not be replaceable`);
      }
    });
  });
  
  describe('Serialization', () => {
    it('should serialize and deserialize properly', () => {
      // Set up a catalyst with custom state
      catalyst.active = true;
      catalyst.bloomTimer = 10;
      catalyst.chargeEvents = [
        {
          position: { x: 1, y: 0, z: 1 },
          chargeAmount: 5,
          time: 0,
          mobType: 'zombie',
          processed: true
        }
      ];
      
      // Serialize
      const serialized = catalyst.toJSON();
      
      // Deserialize
      const deserialized = SculkCatalystBlock.fromJSON(serialized);
      
      // Check state was preserved
      assert.strictEqual(deserialized.active, true);
      assert.strictEqual(deserialized.bloomTimer, 10);
      assert.strictEqual(deserialized.chargeEvents.length, 1);
      assert.strictEqual(deserialized.chargeEvents[0].chargeAmount, 5);
      assert.strictEqual(deserialized.id, 'sculk_catalyst');
    });
  });
}); 