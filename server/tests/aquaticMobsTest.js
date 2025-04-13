/**
 * Test file for aquatic mobs implementation
 * Tests Squid and GlowSquid functionality
 */

const { Squid, GlowSquid } = require('../mobs/passiveMobs');
const assert = require('assert');

describe('Aquatic Mobs Tests', () => {
  // Mock world for testing
  const mockWorld = {
    getBlockAt: (position) => {
      // Make blocks at y < 60 water, blocks at y >= 60 air
      return {
        type: position.y < 60 ? 'water' : 'air'
      };
    }
  };

  // Mock players for testing
  const mockPlayers = {};

  // Mock mobs for testing
  const mockMobs = {};

  describe('Squid Tests', () => {
    it('should initialize with correct properties', () => {
      const squid = new Squid({ x: 100, y: 50, z: 100 });
      
      // Check type and basic properties
      assert.strictEqual(squid.type, 'squid');
      assert.strictEqual(squid.health, 10);
      assert.strictEqual(squid.maxHealth, 10);
      assert.strictEqual(squid.speed, 0.7);
      assert.strictEqual(squid.isHostile, false);
      assert.strictEqual(squid.isWaterMob, true);
      assert.strictEqual(squid.waterBreathingOnly, true);
      
      // Check squid-specific properties
      assert.strictEqual(squid.inkCooldown, 0);
      assert.strictEqual(squid.maxInkCooldown, 600);
      assert.strictEqual(squid.outOfWaterTimer, 0);
      assert.strictEqual(squid.maxOutOfWaterTime, 300);
    });

    it('should take damage out of water', () => {
      const squid = new Squid({ x: 100, y: 70, z: 100 }); // Above water
      
      // Fast-forward to cause out of water damage
      squid.update(mockWorld, mockPlayers, mockMobs, 15000); // 15 seconds in ms
      
      // Check that out of water timer is running
      assert(squid.outOfWaterTimer > 0);
      
      // Fast-forward more to exceed maxOutOfWaterTime
      squid.update(mockWorld, mockPlayers, mockMobs, 15000); // Another 15 seconds
      
      // Should have taken damage and health should be less than max
      assert(squid.health < squid.maxHealth);
    });

    it('should release ink when damaged', () => {
      const squid = new Squid({ x: 100, y: 50, z: 100 }); // In water
      
      // Mock damage source
      const damageSource = {
        entityId: 'player1',
        position: { x: 105, y: 50, z: 100 }
      };
      
      // Damage the squid
      const result = squid.takeDamage(2, damageSource);
      
      // Should have released ink
      assert.strictEqual(squid.inkCooldown, squid.maxInkCooldown);
      
      // Ink cooldown should prevent releasing ink again
      squid.inkCooldown = squid.maxInkCooldown;
      squid.takeDamage(2, damageSource);
      
      // Should still be on cooldown
      assert.strictEqual(squid.inkCooldown, squid.maxInkCooldown);
    });

    it('should flee from damage source', () => {
      const squid = new Squid({ x: 100, y: 50, z: 100 });
      
      // Mock damage source to the right of squid
      const damageSource = {
        entityId: 'player1',
        position: { x: 105, y: 50, z: 100 }
      };
      
      // Damage the squid
      squid.takeDamage(2, damageSource);
      
      // Should flee in opposite direction (negative x direction)
      assert(squid.swimDirection.x < 0);
      
      // Should have set a flee timer
      assert(squid.swimTimer > 0);
    });

    it('should serialize and deserialize correctly', () => {
      const squid = new Squid({ x: 100, y: 50, z: 100 });
      
      // Set some values to test
      squid.inkCooldown = 300;
      squid.outOfWaterTimer = 50;
      squid.swimDirection = { x: 0.5, y: -0.3, z: 0.1 };
      
      // Serialize
      const data = squid.serialize();
      
      // Create a new squid to deserialize into
      const newSquid = new Squid({ x: 0, y: 0, z: 0 });
      newSquid.deserialize(data);
      
      // Check deserialized values
      assert.strictEqual(newSquid.inkCooldown, 300);
      assert.strictEqual(newSquid.outOfWaterTimer, 50);
      assert.deepStrictEqual(newSquid.swimDirection, { x: 0.5, y: -0.3, z: 0.1 });
    });
  });

  describe('GlowSquid Tests', () => {
    it('should initialize with correct properties', () => {
      const glowSquid = new GlowSquid({ x: 100, y: 50, z: 100 });
      
      // Check type and basic properties
      assert.strictEqual(glowSquid.type, 'glow_squid');
      assert.strictEqual(glowSquid.health, 10);
      assert.strictEqual(glowSquid.maxHealth, 10);
      assert.strictEqual(glowSquid.isHostile, false);
      assert.strictEqual(glowSquid.isWaterMob, true);
      
      // Check glow squid-specific properties
      assert.strictEqual(glowSquid.glowing, true);
      assert.strictEqual(glowSquid.glowIntensity, 1.0);
      assert.strictEqual(glowSquid.flashTimer, 0);
      
      // Check drops are glow ink sacs
      assert.deepStrictEqual(glowSquid.drops, {
        'glow_ink_sac': { chance: 1.0, min: 1, max: 3 }
      });
    });

    it('should flash when damaged', () => {
      const glowSquid = new GlowSquid({ x: 100, y: 50, z: 100 });
      
      // Initial glow intensity should be 1.0
      assert.strictEqual(glowSquid.glowIntensity, 1.0);
      
      // Damage the glow squid
      glowSquid.takeDamage(2, {});
      
      // Should have started flashing
      assert(glowSquid.flashTimer > 0);
      
      // Update to see flash effect
      glowSquid.update(mockWorld, mockPlayers, mockMobs, 1000); // 1 second
      
      // Glow intensity should have changed
      assert(glowSquid.glowIntensity !== 1.0);
      
      // Fast-forward to end flashing
      glowSquid.update(mockWorld, mockPlayers, mockMobs, 3000); // 3 seconds
      
      // Glow intensity should be back to normal
      assert.strictEqual(glowSquid.glowIntensity, 1.0);
    });

    it('should release glow ink when damaged', () => {
      const glowSquid = new GlowSquid({ x: 100, y: 50, z: 100 });
      
      // Damage the glow squid
      const result = glowSquid.takeDamage(2, {});
      
      // Should have released ink
      assert.strictEqual(glowSquid.inkCooldown, glowSquid.maxInkCooldown);
      
      // Check ink release result
      const inkRelease = glowSquid.releaseInk({});
      assert.strictEqual(inkRelease.type, 'releaseGlowInk');
    });

    it('should serialize and deserialize correctly', () => {
      const glowSquid = new GlowSquid({ x: 100, y: 50, z: 100 });
      
      // Set some values to test
      glowSquid.glowIntensity = 0.5;
      glowSquid.flashTimer = 30;
      
      // Serialize
      const data = glowSquid.serialize();
      
      // Create a new glow squid to deserialize into
      const newGlowSquid = new GlowSquid({ x: 0, y: 0, z: 0 });
      newGlowSquid.deserialize(data);
      
      // Check deserialized values
      assert.strictEqual(newGlowSquid.glowIntensity, 0.5);
      assert.strictEqual(newGlowSquid.flashTimer, 30);
    });
  });
}); 