/**
 * Tests for the base SculkBlock functionality
 */

const assert = require('assert');
const SculkBlock = require('../blocks/sculkBlock');

describe('SculkBlock', () => {
  let sculkBlock;
  let mockWorld;
  let mockPlayer;
  
  beforeEach(() => {
    // Create a basic sculk block
    sculkBlock = new SculkBlock();
    
    // Mock world with drop tracking
    mockWorld = {
      drops: [],
      experience: [],
      dropItem: function(item, position) {
        this.drops.push({ item, position });
      },
      addExperience: function(amount, position) {
        this.experience.push({ amount, position });
      }
    };
    
    // Mock player with equipment
    mockPlayer = {
      gameMode: 'survival',
      getEquippedItem: function() {
        return this.equippedItem;
      },
      equippedItem: null
    };
  });
  
  describe('Basic Properties', () => {
    it('should have correct identification values', () => {
      assert.strictEqual(sculkBlock.id, 'sculk');
      assert.strictEqual(sculkBlock.name, 'Sculk');
    });
    
    it('should have appropriate block properties', () => {
      assert.strictEqual(sculkBlock.hardness, 0.6);
      assert.strictEqual(sculkBlock.resistance, 0.6);
      assert.strictEqual(sculkBlock.requiresTool, true);
      assert.strictEqual(sculkBlock.isCorrectTool({ type: 'hoe' }), true);
      assert.strictEqual(sculkBlock.isCorrectTool({ type: 'pickaxe' }), false);
    });
    
    it('should be spreadable', () => {
      assert.strictEqual(sculkBlock.spreadable, true);
    });
    
    it('should drop experience when mined', () => {
      assert.strictEqual(sculkBlock.xpDropAmount, 1);
    });
  });
  
  describe('Mining Behavior', () => {
    it('should drop nothing with a normal tool', () => {
      // Give player a stone pickaxe without silk touch
      mockPlayer.equippedItem = {
        type: 'stone_pickaxe',
        enchantments: {}
      };
      
      // Break the block
      const breakResult = sculkBlock.onBreak(mockWorld, { x: 0, y: 0, z: 0 }, mockPlayer);
      
      // Verify
      assert.strictEqual(breakResult, true, 'Block should break successfully');
      assert.strictEqual(mockWorld.drops.length, 0, 'Should not drop any items');
      assert.strictEqual(mockWorld.experience.length, 1, 'Should drop experience');
      assert.strictEqual(mockWorld.experience[0].amount, 1, 'Should drop 1 XP');
    });
    
    it('should drop itself with silk touch', () => {
      // Give player a tool with silk touch
      mockPlayer.equippedItem = {
        type: 'diamond_pickaxe',
        enchantments: { silkTouch: 1 }
      };
      
      // Break the block
      sculkBlock.onBreak(mockWorld, { x: 0, y: 0, z: 0 }, mockPlayer);
      
      // Verify
      assert.strictEqual(mockWorld.drops.length, 1, 'Should drop one item');
      assert.strictEqual(mockWorld.drops[0].item.id, 'sculk', 'Should drop a sculk block');
      assert.strictEqual(mockWorld.drops[0].item.count, 1, 'Should drop 1 sculk block');
      assert.strictEqual(mockWorld.experience.length, 0, 'Should not drop experience with silk touch');
    });
    
    it('should drop nothing in creative mode', () => {
      // Set player to creative mode
      mockPlayer.gameMode = 'creative';
      mockPlayer.equippedItem = {
        type: 'diamond_pickaxe',
        enchantments: {}
      };
      
      // Break the block
      sculkBlock.onBreak(mockWorld, { x: 0, y: 0, z: 0 }, mockPlayer);
      
      // Verify
      assert.strictEqual(mockWorld.drops.length, 0, 'Should not drop items in creative');
      assert.strictEqual(mockWorld.experience.length, 0, 'Should not drop experience in creative');
    });
  });
  
  describe('Tool Efficiency', () => {
    it('should mine faster with hoes', () => {
      // Mining time with different tools
      const hoeMiningTime = sculkBlock.getMiningTime({ 
        miningSpeedModifier: 1 
      }, { 
        tool: { type: 'hoe', efficiency: 1.0 } 
      });
      
      const pickaxeMiningTime = sculkBlock.getMiningTime({ 
        miningSpeedModifier: 1 
      }, { 
        tool: { type: 'pickaxe', efficiency: 1.0 } 
      });
      
      // Hoe should be faster than other tools
      assert.ok(hoeMiningTime < pickaxeMiningTime, 'Hoes should mine sculk faster');
    });
    
    it('should mine very slowly with incorrect tools', () => {
      // Base mining time with no tool
      const baseTime = sculkBlock.getMiningTime({}, {});
      
      // Mining time with wrong tool
      const wrongToolTime = sculkBlock.getMiningTime({}, { 
        tool: { type: 'sword' } 
      });
      
      // Wrong tool should be slower
      assert.ok(wrongToolTime > baseTime, 'Incorrect tools should mine slower');
    });
    
    it('should respect efficiency enchantment', () => {
      // Get mining time with regular hoe
      const regularHoeTime = sculkBlock.getMiningTime({}, { 
        tool: { type: 'hoe', efficiency: 1.0 } 
      });
      
      // Get mining time with efficiency V hoe
      const efficiencyHoeTime = sculkBlock.getMiningTime({}, { 
        tool: { type: 'hoe', efficiency: 5.0 } 
      });
      
      // Efficiency should make mining faster
      assert.ok(efficiencyHoeTime < regularHoeTime, 'Efficiency should speed up mining');
    });
  });
  
  describe('Serialization', () => {
    it('should serialize and deserialize properly', () => {
      // Customize some properties
      sculkBlock.spreadable = false;
      sculkBlock.xpDropAmount = 2;
      
      // Serialize
      const serialized = sculkBlock.toJSON();
      
      // Deserialize
      const deserialized = SculkBlock.fromJSON(serialized);
      
      // Check properties
      assert.strictEqual(deserialized.id, 'sculk');
      assert.strictEqual(deserialized.spreadable, false);
      assert.strictEqual(deserialized.xpDropAmount, 2);
    });
  });
}); 