/**
 * Test file for Goat mob implementation
 */

const { Goat } = require('../mobs/neutralMobs');
const assert = require('assert');

describe('Goat Tests', () => {
  // Mock world for testing
  const mockWorld = {
    getBlockAt: (x, y, z) => {
      // Simulate mountains for blocks below y=60
      if (y < 60) {
        return {
          type: 'stone',
          isSolid: true
        };
      }
      // Air above y=60
      return {
        type: 'air',
        isSolid: false
      };
    },
    getEntitiesInRange: () => []
  };

  // Mock players for testing
  const mockPlayers = {};

  // Mock mobs for testing
  const mockMobs = {};

  describe('Basic Properties', () => {
    it('should initialize with correct base properties', () => {
      const goat = new Goat({ x: 100, y: 80, z: 100 });
      
      // Check type and basic properties
      assert.strictEqual(goat.type, 'goat');
      assert.strictEqual(goat.health, 10);
      assert.strictEqual(goat.maxHealth, 10);
      assert.strictEqual(goat.attackDamage, 2);
      assert.strictEqual(goat.attackRange, 1.5);
      assert.strictEqual(goat.speed, 0.4);
      assert.strictEqual(goat.isHostile, false);
      
      // Check goat-specific properties
      assert.strictEqual(typeof goat.isScreamer, 'boolean');
      assert.strictEqual(goat.ramCooldown, 0);
      assert.strictEqual(goat.jumpCooldown, 0);
      assert.strictEqual(goat.jumpStrength, 0.7);
      assert.strictEqual(goat.hasHorns, true);
      assert.strictEqual(goat.isBaby, false);
    });

    it('should initialize with correct screamer properties', () => {
      const goat = new Goat({ x: 100, y: 80, z: 100 }, { isScreamer: true });
      
      // Check screamer-specific properties
      assert.strictEqual(goat.isScreamer, true);
      assert.strictEqual(goat.attackDamage, 4);
      assert.strictEqual(goat.maxRamCooldown, 200);
    });

    it('should initialize with correct baby properties', () => {
      const goat = new Goat({ x: 100, y: 80, z: 100 }, { isBaby: true });
      
      // Check baby-specific properties
      assert.strictEqual(goat.isBaby, true);
      assert.strictEqual(goat.health, 5);
      assert.strictEqual(goat.maxHealth, 5);
      assert.strictEqual(goat.attackDamage, 1);
      assert.strictEqual(goat.speed, 0.5);
      assert.strictEqual(goat.jumpStrength, 0.9);
      assert.strictEqual(goat.scale, 0.5);
    });
  });

  describe('Ramming Behavior', () => {
    it('should set up ramming state correctly', () => {
      const goat = new Goat({ x: 100, y: 80, z: 100 });
      
      // Create mock target
      const target = {
        id: 'test-id',
        position: { x: 105, y: 80, z: 100 },
        type: 'player'
      };
      
      // Start ramming
      goat.startRamming(target);
      
      // Check ramming state
      assert.strictEqual(goat.isRamming, true);
      assert.deepStrictEqual(goat.ramTarget, {
        id: 'test-id',
        position: { x: 105, y: 80, z: 100 },
        type: 'player'
      });
      assert.strictEqual(goat.ramChargeTime, 0);
    });

    it('should stop ramming correctly', () => {
      const goat = new Goat({ x: 100, y: 80, z: 100 });
      
      // Create mock target
      const target = {
        id: 'test-id',
        position: { x: 105, y: 80, z: 100 },
        type: 'player'
      };
      
      // Start ramming
      goat.startRamming(target);
      
      // Stop ramming
      goat.stopRamming();
      
      // Check ramming state
      assert.strictEqual(goat.isRamming, false);
      assert.strictEqual(goat.ramTarget, null);
      assert.deepStrictEqual(goat.velocity, { x: 0, y: 0, z: 0 });
    });

    it('should check ram path correctly', () => {
      const goat = new Goat({ x: 100, y: 80, z: 100 });
      
      // Create custom world mock for this test
      const customWorld = {
        getBlockAt: (x, y, z) => {
          // Place an obstacle at (102, 80, 100)
          if (x === 102 && y === 80 && z === 100) {
            return { type: 'stone', isSolid: true };
          }
          return { type: 'air', isSolid: false };
        }
      };
      
      // Target position with obstacle in path
      const blockedTarget = { x: 105, y: 80, z: 100 };
      assert.strictEqual(goat.checkRamPath(customWorld, blockedTarget), false);
      
      // Target position without obstacle
      const clearTarget = { x: 100, y: 80, z: 105 };
      assert.strictEqual(goat.checkRamPath(customWorld, clearTarget), true);
      
      // Target position too far
      const farTarget = { x: 150, y: 80, z: 100 };
      assert.strictEqual(goat.checkRamPath(customWorld, farTarget), false);
    });
  });

  describe('Jumping Behavior', () => {
    it('should jump correctly', () => {
      const goat = new Goat({ x: 100, y: 80, z: 100 });
      
      // Initial velocity
      goat.velocity = { x: 0, y: 0, z: 0 };
      
      // Execute jump
      goat.jump();
      
      // Verify vertical velocity increased
      assert.strictEqual(goat.velocity.y, goat.jumpStrength);
      
      // Verify horizontal velocity changed (within range)
      assert(Math.abs(goat.velocity.x) <= 0.2);
      assert(Math.abs(goat.velocity.z) <= 0.2);
    });
  });

  describe('Interaction', () => {
    it('should process milking interaction correctly', () => {
      const goat = new Goat({ x: 100, y: 80, z: 100 }, { canBeMilked: true });
      
      // Mock player
      const player = { id: 'player1' };
      
      // Mock interaction with bucket
      const interaction = {
        action: 'use_item',
        itemId: 'bucket'
      };
      
      // Process interaction
      const result = goat.processInteraction(player, interaction);
      
      // Verify result
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.message, 'Filled bucket with goat milk');
      assert.strictEqual(result.consumeItem, true);
      assert.strictEqual(result.replacementItem, 'milk_bucket');
      
      // Verify goat state
      assert.strictEqual(goat.canBeMilked, false);
      assert.strictEqual(goat.milkTimer, 0);
    });
  });

  describe('Milk Regeneration', () => {
    it('should regenerate milk over time', () => {
      const goat = new Goat({ x: 100, y: 80, z: 100 });
      
      // Initial state
      assert.strictEqual(goat.canBeMilked, false);
      
      // Fast-forward milk timer
      goat.milkTimer = 5990;
      goat.update(mockWorld, mockPlayers, mockMobs, 600); // 30 ticks, enough to pass 6000
      
      // Verify milk regenerated
      assert.strictEqual(goat.canBeMilked, true);
      assert.strictEqual(goat.milkTimer, 0);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const goat = new Goat({ x: 100, y: 80, z: 100 }, {
        isScreamer: true,
        isBaby: true,
        hasHorns: false,
        canBeMilked: true
      });
      
      // Set some values to test
      goat.ramCooldown = 150;
      goat.jumpCooldown = 50;
      goat.milkTimer = 2000;
      goat.hornTimer = 1000;
      
      // Serialize
      const data = goat.serialize();
      
      // Create a new goat to deserialize into
      const newGoat = new Goat({ x: 0, y: 0, z: 0 });
      newGoat.deserialize(data);
      
      // Check deserialized values
      assert.strictEqual(newGoat.isScreamer, true);
      assert.strictEqual(newGoat.isBaby, true);
      assert.strictEqual(newGoat.hasHorns, false);
      assert.strictEqual(newGoat.canBeMilked, true);
      assert.strictEqual(newGoat.ramCooldown, 150);
      assert.strictEqual(newGoat.jumpCooldown, 50);
      assert.strictEqual(newGoat.milkTimer, 2000);
      assert.strictEqual(newGoat.hornTimer, 1000);
      
      // Check that properties were adjusted correctly
      assert.strictEqual(newGoat.maxHealth, 5); // Baby goat health
      assert.strictEqual(newGoat.attackDamage, 4); // Screamer goat attack (takes precedence)
      assert.strictEqual(newGoat.speed, 0.5); // Baby goat speed
      assert.strictEqual(newGoat.jumpStrength, 0.9); // Baby goat jump
      assert.strictEqual(newGoat.scale, 0.5); // Baby goat scale
    });
  });

  describe('Defensive Behavior', () => {
    it('should have a chance to ram when attacked', () => {
      // Use custom Math.random to force ram behavior
      const originalRandom = Math.random;
      Math.random = () => 0.3; // This will return 0.3, which is < 0.5, so it should trigger ramming
      
      const goat = new Goat({ x: 100, y: 80, z: 100 });
      
      // Mock attacker
      const attacker = {
        entityId: 'attacker1',
        position: { x: 105, y: 80, z: 100 },
        type: 'player'
      };
      
      // Take damage and verify ramming started
      goat.takeDamage(2, attacker);
      
      // Check ram state
      assert.strictEqual(goat.isRamming, true);
      assert.deepStrictEqual(goat.ramTarget, {
        id: 'attacker1',
        position: { x: 105, y: 80, z: 100 },
        type: 'player'
      });
      
      // Restore original Math.random
      Math.random = originalRandom;
    });
  });
  
  describe('Screamer Goat Behavior', () => {
    it('should emit scream event when starting to ram', () => {
      const goat = new Goat({ x: 100, y: 80, z: 100 }, { isScreamer: true });
      
      // Track events
      let emittedEvent = null;
      goat.emitEvent = (event, data) => {
        emittedEvent = { event, data };
      };
      
      // Create mock target
      const target = {
        id: 'test-id',
        position: { x: 105, y: 80, z: 100 },
        type: 'player'
      };
      
      // Start ramming
      goat.startRamming(target);
      
      // Verify scream event was emitted
      assert.strictEqual(emittedEvent.event, 'goat_scream');
      assert.deepStrictEqual(emittedEvent.data.position, { x: 100, y: 80, z: 100 });
    });
  });
}); 