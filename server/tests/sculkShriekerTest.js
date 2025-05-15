/**
 * Tests for the Sculk Shrieker block implementation
 */

const assert = require('assert');
const SculkShriekerBlock = require('../blocks/sculkShriekerBlock');

describe('SculkShriekerBlock', () => {
  let shriekerBlock;
  let mockWorld;
  let mockPlayer;
  
  beforeEach(() => {
    // Create a mock world
    mockWorld = {
      blocks: new Map(),
      entities: [],
      getBlock: function(x, y, z) {
        const key = `${x},${y},${z}`;
        return this.blocks.get(key);
      },
      getEntitiesOfTypeInRange: function(type, x, y, z, range) {
        return this.entities.filter(entity => {
          if (entity.type !== type) return false;
          
          const dx = entity.x - x;
          const dy = entity.y - y;
          const dz = entity.z - z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          return distance <= range;
        });
      },
      spawnEntity: function(type, position) {
        const entity = {
          type,
          x: position.x,
          y: position.y,
          z: position.z,
          id: `${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        };
        
        if (type === 'warden') {
          entity.alertToPlayer = function(player) {
            this.alertedTo = player;
            return true;
          };
        }
        
        this.entities.push(entity);
        return entity;
      },
      dropItem: function(item, position) {
        this.drops = this.drops || [];
        this.drops.push({ item, position });
      }
    };
    
    // Create mock blocks for world
    mockWorld.blocks.set('50,50,50', { id: 'stone', solid: true });
    mockWorld.blocks.set('50,51,50', { id: 'air' });
    mockWorld.blocks.set('50,52,50', { id: 'air' });
    mockWorld.blocks.set('50,53,50', { id: 'air' });
    
    // Create a mock player
    mockPlayer = {
      id: 'player_1',
      type: 'player',
      x: 50,
      y: 51,
      z: 50,
      gameMode: 'survival',
      inventory: [],
      statusEffects: [],
      getEquippedItem: function() {
        return this.equippedItem;
      },
      addStatusEffect: function(effect, options) {
        this.statusEffects.push({ effect, ...options });
        return true;
      }
    };
    
    // Create a sculk shrieker block
    shriekerBlock = new SculkShriekerBlock({
      canSummonWarden: true
    });
    
    // Set position and world
    shriekerBlock.x = 50;
    shriekerBlock.y = 50;
    shriekerBlock.z = 50;
    shriekerBlock.world = mockWorld;
  });
  
  describe('Basic properties', () => {
    it('should have correct identification values', () => {
      assert.strictEqual(shriekerBlock.id, 'sculk_shrieker');
      assert.strictEqual(shriekerBlock.name, 'Sculk Shrieker');
    });
    
    it('should have appropriate hardness and resistance', () => {
      assert.strictEqual(shriekerBlock.hardness, 3.0);
      assert.strictEqual(shriekerBlock.resistance, 3.0);
    });
    
    it('should require a hoe to mine efficiently', () => {
      assert.strictEqual(shriekerBlock.requiresTool, true);
      assert.ok(shriekerBlock.toolType === 'hoe', 'Should require a hoe to mine efficiently');
    });
  });
  
  describe('Vibration handling', () => {
    it('should respond to nearby vibrations', () => {
      const vibration = {
        type: 'step',
        position: {
          x: 52,
          y: 50,
          z: 50
        },
        player: mockPlayer
      };
      
      const result = shriekerBlock.handleVibration(vibration, 100);
      
      assert.strictEqual(result, true, 'Should respond to nearby vibrations');
      assert.strictEqual(shriekerBlock.active, true, 'Should become active');
      assert.strictEqual(shriekerBlock.shriekCooldown, 40, 'Should start cooldown');
    });
    
    it('should not respond to vibrations outside range', () => {
      const vibration = {
        type: 'step',
        position: {
          x: 60,
          y: 50,
          z: 50
        },
        player: mockPlayer
      };
      
      const result = shriekerBlock.handleVibration(vibration, 100);
      
      assert.strictEqual(result, false, 'Should not respond to distant vibrations');
      assert.strictEqual(shriekerBlock.active, false, 'Should remain inactive');
      assert.strictEqual(shriekerBlock.shriekCooldown, 0, 'Should have no cooldown');
    });
    
    it('should not respond to non-player vibrations', () => {
      const vibration = {
        type: 'step',
        position: {
          x: 52,
          y: 50,
          z: 50
        },
        player: null
      };
      
      const result = shriekerBlock.handleVibration(vibration, 100);
      
      assert.strictEqual(result, false, 'Should not respond to non-player vibrations');
    });
    
    it('should not respond while on cooldown', () => {
      // Activate once
      shriekerBlock.shriek(mockPlayer, 100);
      
      // Try to activate again
      const vibration = {
        type: 'step',
        position: {
          x: 52,
          y: 50,
          z: 50
        },
        player: mockPlayer
      };
      
      const result = shriekerBlock.handleVibration(vibration, 110);
      
      assert.strictEqual(result, false, 'Should not respond while on cooldown');
    });
  });
  
  describe('Shriek functionality', () => {
    it('should apply darkness effect to players', () => {
      shriekerBlock.shriek(mockPlayer, 100);
      
      const hasDarkness = mockPlayer.statusEffects.some(
        effect => effect.effect === 'darkness'
      );
      
      assert.strictEqual(hasDarkness, true, 'Should apply darkness effect');
    });
    
    it('should increment warning level', () => {
      assert.strictEqual(shriekerBlock.warningLevel, 0, 'Should start at warning level 0');
      
      shriekerBlock.shriek(mockPlayer, 100);
      assert.strictEqual(shriekerBlock.warningLevel, 1, 'Should increase to warning level 1');
      
      // Update to simulate time passing and cooldown expiring
      for (let i = 0; i < 50; i++) {
        shriekerBlock.update(mockWorld, { x: 50, y: 50, z: 50 }, 100 + i);
      }
      
      shriekerBlock.shriek(mockPlayer, 150);
      assert.strictEqual(shriekerBlock.warningLevel, 2, 'Should increase to warning level 2');
    });
    
    it('should emit shriek events', (done) => {
      shriekerBlock.shriekEmitter.once('shriek', (event) => {
        assert.strictEqual(event.warningLevel, 1);
        assert.strictEqual(event.player, mockPlayer);
        assert.ok(event.position);
        assert.ok(event.time);
        done();
      });
      
      shriekerBlock.shriek(mockPlayer, 100);
    });
  });
  
  describe('Warden summoning', () => {
    it('should summon a Warden at maximum warning level', () => {
      // Set warning level close to max
      shriekerBlock.warningLevel = 3;
      
      // Trigger one more shriek to reach max
      shriekerBlock.shriek(mockPlayer, 100);
      
      // Check if a Warden was spawned
      const wardens = mockWorld.entities.filter(e => e.type === 'warden');
      assert.strictEqual(wardens.length, 1, 'Should have spawned a Warden');
      
      // Warning level should reset
      assert.strictEqual(shriekerBlock.warningLevel, 0, 'Warning level should reset');
    });
    
    it('should not summon a Warden if one already exists nearby', () => {
      // Add a Warden to the world
      mockWorld.spawnEntity('warden', { x: 60, y: 50, z: 60 });
      
      // Set warning level close to max
      shriekerBlock.warningLevel = 3;
      
      // Trigger one more shriek to reach max
      shriekerBlock.shriek(mockPlayer, 100);
      
      // Check if another Warden was spawned
      const wardens = mockWorld.entities.filter(e => e.type === 'warden');
      assert.strictEqual(wardens.length, 1, 'Should not spawn additional Warden');
      
      // The existing Warden should be alerted
      assert.strictEqual(wardens[0].alertedTo, mockPlayer, 'Existing Warden should be alerted');
    });
  });
  
  describe('Block drop mechanics', () => {
    it('should drop nothing when broken without silk touch', () => {
      // Create mock tool without silk touch
      mockPlayer.equippedItem = {
        type: 'diamond_pickaxe',
        enchantments: {}
      };
      
      // Break the block
      shriekerBlock.onBreak(mockWorld, { x: 50, y: 50, z: 50 }, mockPlayer);
      
      // Check drops
      assert.strictEqual(!mockWorld.drops || mockWorld.drops.length === 0, true, 'Should not drop anything');
    });
    
    it('should drop itself when broken with silk touch', () => {
      // Create mock tool with silk touch
      mockPlayer.equippedItem = {
        type: 'diamond_pickaxe',
        enchantments: { silkTouch: 1 }
      };
      
      // Break the block
      shriekerBlock.onBreak(mockWorld, { x: 50, y: 50, z: 50 }, mockPlayer);
      
      // Check drops
      assert.ok(mockWorld.drops && mockWorld.drops.length === 1, 'Should drop one item');
      assert.strictEqual(mockWorld.drops[0].item.id, 'sculk_shrieker', 'Should drop a sculk shrieker');
    });
  });
  
  describe('Serialization', () => {
    it('should properly serialize state', () => {
      // Set some state
      shriekerBlock.canSummonWarden = true;
      shriekerBlock.shriekCooldown = 20;
      shriekerBlock.warningLevel = 2;
      shriekerBlock.active = true;
      
      // Serialize
      const data = shriekerBlock.toJSON();
      
      // Verify
      assert.strictEqual(data.canSummonWarden, true);
      assert.strictEqual(data.shriekCooldown, 20);
      assert.strictEqual(data.warningLevel, 2);
      assert.strictEqual(data.active, true);
    });
    
    it('should properly deserialize state', () => {
      // Prepare data
      const data = {
        id: 'sculk_shrieker',
        canSummonWarden: true,
        shriekCooldown: 15,
        warningLevel: 3,
        active: true
      };
      
      // Deserialize
      const block = SculkShriekerBlock.fromJSON(data);
      
      // Verify
      assert.strictEqual(block.id, 'sculk_shrieker');
      assert.strictEqual(block.canSummonWarden, true);
      assert.strictEqual(block.shriekCooldown, 15);
      assert.strictEqual(block.warningLevel, 3);
      assert.strictEqual(block.active, true);
    });
  });
}); 