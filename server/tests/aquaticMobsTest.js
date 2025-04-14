/**
 * Test file for Aquatic Mobs implementation
 * Tests Squid and GlowSquid functionality
 */

const { Squid, GlowSquid } = require('../mobs/aquaticMobs');
const assert = require('assert');

describe('Aquatic Mobs Tests', () => {
  // Create a mock world for testing
  const mockWorld = {
    isWaterAt: (x, y, z) => y < 60, // Water below y=60
    getBlockAt: (x, y, z) => ({ 
      type: y < 60 ? 'water' : 'air'
    }),
    particles: [],
    spawnParticles: function(type, x, y, z, count, spread, options) {
      this.particles.push({ type, x, y, z, count, spread, options });
    }
  };

  // Mock players for testing
  const mockPlayers = {};

  // Mock mobs for testing
  const mockMobs = {};

  describe('Squid', () => {
    it('should initialize with correct properties', () => {
      const position = { x: 100, y: 50, z: 100 }; // Underwater
      const squid = new Squid(position);
      
      // Check type and basic properties
      assert.strictEqual(squid.type, 'squid');
      assert.strictEqual(squid.health, 10);
      assert.strictEqual(squid.maxHealth, 10);
      
      // Check squid-specific properties
      assert.strictEqual(squid.inkCooldown, 0);
      assert.strictEqual(squid.maxInkCooldown, 600);
      assert.strictEqual(squid.fleeTimer, 0);
      assert.strictEqual(squid.swimSpeed, 0.3);
    });

    it('should detect water correctly', () => {
      // Create a squid in water
      const underwaterSquid = new Squid({ x: 100, y: 50, z: 100 });
      underwaterSquid.updateWaterState(mockWorld);
      assert.strictEqual(underwaterSquid.isInWater, true);
      
      // Create a squid out of water
      const aboveWaterSquid = new Squid({ x: 100, y: 70, z: 100 });
      aboveWaterSquid.updateWaterState(mockWorld);
      assert.strictEqual(aboveWaterSquid.isInWater, false);
    });

    it('should handle different physics in/out of water', () => {
      // Create squids for testing
      const underwaterSquid = new Squid({ x: 100, y: 50, z: 100 });
      underwaterSquid.isInWater = true;
      underwaterSquid.velocity = { x: 0.5, y: 0.2, z: 0.5 };
      
      const aboveWaterSquid = new Squid({ x: 100, y: 70, z: 100 });
      aboveWaterSquid.isInWater = false;
      aboveWaterSquid.velocity = { x: 0.5, y: 0.2, z: 0.5 };
      
      // Apply one tick of physics
      underwaterSquid.applyPhysics(mockWorld, 1);
      aboveWaterSquid.applyPhysics(mockWorld, 1);
      
      // Check that water squid has water drag applied
      assert(Math.abs(underwaterSquid.velocity.x) < Math.abs(aboveWaterSquid.velocity.x));
      assert(Math.abs(underwaterSquid.velocity.z) < Math.abs(aboveWaterSquid.velocity.z));
      
      // Check that non-water squid has gravity applied
      assert(aboveWaterSquid.velocity.y < 0);
    });

    it('should squirt ink when threatened', () => {
      // Create a squid for testing
      const squid = new Squid({ x: 100, y: 50, z: 100 });
      squid.isInWater = true;
      squid.inkCooldown = 0;
      
      // Track emitted events
      let emittedEvent = null;
      squid.emitEvent = (event, data) => {
        emittedEvent = { event, data };
      };
      
      // Trigger ink defense
      squid.squirtInk();
      
      // Verify ink event was emitted
      assert.strictEqual(emittedEvent.event, 'squid_ink');
      assert.deepStrictEqual(emittedEvent.data.position, { x: 100, y: 50, z: 100 });
      assert(emittedEvent.data.radius > 0);
      assert(emittedEvent.data.duration > 0);
      
      // Verify cooldown was set
      assert.strictEqual(squid.inkCooldown, squid.maxInkCooldown);
    });

    it('should flee when attacked', () => {
      // Create a squid for testing
      const squid = new Squid({ x: 100, y: 50, z: 100 });
      squid.velocity = { x: 0, y: 0, z: 0 };
      
      // Simulate taking damage from an attacker
      const attacker = {
        id: 'player1',
        position: { x: 105, y: 50, z: 100 } // 5 blocks to the east
      };
      
      squid.takeDamage(2, attacker);
      
      // Verify squid recorded damage source
      assert.deepStrictEqual(squid.lastDamageSource, { x: 105, y: 50, z: 100 });
      assert(squid.fleeTimer > 0);
      
      // Simulate fleeing behavior for one tick
      squid.isInWater = true;
      squid.inkCooldown = 0;
      squid.handleFlee(mockWorld, {}, 1);
      
      // Should be moving away from attacker (to the west)
      assert(squid.velocity.x < 0);
    });

    it('should drop ink sacs when killed', () => {
      const squid = new Squid({ x: 100, y: 50, z: 100 });
      const drops = squid.getDrops();
      
      // Should drop ink sacs
      assert(drops.length > 0);
      assert.strictEqual(drops[0].id, 'ink_sac');
      assert(drops[0].count >= 1);
    });
  });

  describe('GlowSquid', () => {
    it('should initialize with correct properties', () => {
      const position = { x: 100, y: 50, z: 100 };
      const glowSquid = new GlowSquid(position);
      
      // Check inheritance from Squid
      assert.strictEqual(glowSquid.type, 'glow_squid');
      assert.strictEqual(glowSquid.health, 10);
      
      // Check glow squid specific properties
      assert(glowSquid.glowIntensity > 0);
      assert.strictEqual(glowSquid.isHypnotized, false);
      assert(glowSquid.lightLevel > 0);
      assert(glowSquid.glowColor !== undefined);
    });

    it('should spawn glowing particles', () => {
      const position = { x: 100, y: 50, z: 100 };
      const glowSquid = new GlowSquid(position);
      glowSquid.isInWater = true;
      
      // Reset test world's particle tracking
      mockWorld.particles = [];
      
      // Force particle spawn timer to trigger
      glowSquid.particleSpawnTimer = 0;
      
      // Update to spawn particles
      glowSquid.spawnGlowParticles(mockWorld, 1);
      
      // Check particles were spawned
      assert(mockWorld.particles.length > 0);
      assert.strictEqual(mockWorld.particles[0].type, 'glow');
      assert.strictEqual(mockWorld.particles[0].x, position.x);
      assert(mockWorld.particles[0].options.color !== undefined);
      assert(mockWorld.particles[0].options.intensity > 0);
    });

    it('should update glow intensity over time', () => {
      const glowSquid = new GlowSquid({ x: 100, y: 50, z: 100 });
      const initialIntensity = glowSquid.glowIntensity;
      
      // Update glow several times
      for (let i = 0; i < 10; i++) {
        glowSquid.updateGlow(1);
      }
      
      // Intensity should change due to pulsation
      assert(glowSquid.glowIntensity !== initialIntensity);
      
      // Intensity should be within valid range
      assert(glowSquid.glowIntensity >= 0.7);
      assert(glowSquid.glowIntensity <= 1.0);
    });

    it('should have hypnotize effect', () => {
      const glowSquid = new GlowSquid({ x: 100, y: 50, z: 100 });
      
      // Mock player
      const player = {
        id: 'player1',
        position: { x: 101, y: 50, z: 100 }, // 1 block away
        socket: {
          emit: (event, data) => {
            player.lastEvent = { event, data };
          }
        },
        lastEvent: null
      };
      
      // Track emitted events
      let emittedEvent = null;
      glowSquid.emitEvent = (event, data) => {
        emittedEvent = { event, data };
      };
      
      // Hypnotize player
      glowSquid.hypnotizePlayer(player);
      
      // Check hypnotized state
      assert.strictEqual(glowSquid.isHypnotized, true);
      assert(glowSquid.hypnotizeTimer > 0);
      
      // Check event was emitted to player
      assert(player.lastEvent !== null);
      assert.strictEqual(player.lastEvent.event, 'screen_effect');
      assert.strictEqual(player.lastEvent.data.type, 'hypnosis');
      
      // Check world event was emitted
      assert(emittedEvent !== null);
      assert.strictEqual(emittedEvent.event, 'glow_squid_hypnosis');
      assert.strictEqual(emittedEvent.data.player, 'player1');
    });

    it('should drop glow ink sacs when killed', () => {
      const glowSquid = new GlowSquid({ x: 100, y: 50, z: 100 });
      const drops = glowSquid.getDrops();
      
      // Should drop glow ink sacs
      assert(drops.length > 0);
      assert.strictEqual(drops[0].id, 'glow_ink_sac');
      assert(drops[0].count >= 1);
    });
  });
}); 