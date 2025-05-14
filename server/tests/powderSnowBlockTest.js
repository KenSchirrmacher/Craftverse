/**
 * Test file for Powder Snow Block implementation
 * Tests the special features of the Powder Snow Block:
 * - Entities sinking into it
 * - Freezing damage to non-cold-resistant mobs
 * - Special movement for goats
 * - Melting behavior
 */

const PowderSnowBlock = require('../blocks/powderSnowBlock');
const { Goat } = require('../mobs/neutralMobs');
const assert = require('assert');

describe('Powder Snow Block Tests', () => {
  describe('Block Properties', () => {
    it('should have correct basic properties', () => {
      const block = new PowderSnowBlock();
      
      // Check basic properties
      assert.strictEqual(block.id, 'powder_snow');
      assert.strictEqual(block.name, 'Powder Snow');
      assert.strictEqual(block.transparent, true);
      assert.strictEqual(block.solid, false);
      
      // Should be easily breakable
      assert(block.hardness < 0.5);
      
      // Should have proper textures
      assert(block.textures && block.textures.top);
      
      // Should have light filtering properties
      assert(block.lightFilter > 0);
    });

    it('should have correct collision properties', () => {
      const block = new PowderSnowBlock();
      
      // Should have reduced collision box
      assert.strictEqual(block.collisionReduction, 0.9);
      
      // Should allow entities to sink
      assert.strictEqual(block.allowEntitySinking, true);
      
      // Should slow movement
      assert(block.movementFactor < 1.0);
    });
  });

  describe('Entity Interactions', () => {
    it('should apply sinking to most entities', () => {
      const block = new PowderSnowBlock();
      
      // Create mock entities
      const mockHuman = {
        type: 'player',
        id: 'player_1',
        wearingBoots: false,
        hasLeatherBoots: false,
        position: { y: 100 },
        velocity: { y: 0 }
      };
      
      const mockZombie = {
        type: 'zombie',
        id: 'zombie_1',
        position: { y: 100 },
        velocity: { y: 0 }
      };
      
      // Test sinking behavior
      block.onEntityCollision(mockHuman);
      block.onEntityCollision(mockZombie);
      
      // Should apply downward velocity
      assert(mockHuman.velocity.y < 0);
      assert(mockZombie.velocity.y < 0);
      
      // Velocity should be based on sinking rate
      assert.strictEqual(mockHuman.velocity.y, -block.sinkRate);
    });

    it('should not apply sinking to special entities', () => {
      const block = new PowderSnowBlock();
      
      // Create a mock goat entity
      const mockGoat = {
        type: 'goat',
        id: 'goat_1',
        position: { y: 100 },
        velocity: { y: 0 }
      };
      
      // Create a mock player with leather boots
      const mockPlayerWithBoots = {
        type: 'player',
        id: 'player_2',
        wearingBoots: true,
        hasLeatherBoots: true,
        position: { y: 100 },
        velocity: { y: 0 }
      };
      
      // Test resistance to sinking
      block.onEntityCollision(mockGoat);
      block.onEntityCollision(mockPlayerWithBoots);
      
      // Should not apply downward velocity
      assert.strictEqual(mockGoat.velocity.y, 0);
      assert.strictEqual(mockPlayerWithBoots.velocity.y, 0);
    });

    it('should apply freezing damage to non-resistant entities', () => {
      const block = new PowderSnowBlock();
      
      // Create mock entities
      const mockHuman = {
        type: 'player',
        id: 'player_1',
        wearingBoots: false,
        hasLeatherBoots: false,
        hasLeatherArmor: false,
        frozenTime: 0,
        damage: 0,
        applyDamage: function(amount, source) {
          this.damage += amount;
          return amount;
        }
      };
      
      const mockPolarBear = {
        type: 'polar_bear',
        id: 'polar_bear_1',
        coldResistant: true,
        frozenTime: 0,
        damage: 0,
        applyDamage: function(amount, source) {
          this.damage += amount;
          return amount;
        }
      };
      
      // Simulate being in powder snow for multiple ticks
      for (let i = 0; i < 60; i++) {
        block.onEntityInside(mockHuman);
        block.onEntityInside(mockPolarBear);
      }
      
      // Human should have taken freezing damage
      assert(mockHuman.damage > 0);
      assert(mockHuman.frozenTime > 0);
      
      // Polar bear should be immune due to cold resistance
      assert.strictEqual(mockPolarBear.damage, 0);
      assert.strictEqual(mockPolarBear.frozenTime, 0);
    });
  });

  describe('Environmental Interactions', () => {
    it('should melt under certain conditions', () => {
      const block = new PowderSnowBlock();
      
      // Create a mock world with temperature data
      const mockWorld = {
        getTemperatureAt: (x, y, z) => 1.2, // Hot temperature
        setBlockAt: function(x, y, z, blockId) {
          this.lastChanged = { x, y, z, blockId };
        },
        lastChanged: null
      };
      
      // Test position
      const pos = { x: 10, y: 70, z: 10 };
      
      // Simulate a random tick
      block.onRandomTick(mockWorld, pos.x, pos.y, pos.z);
      
      // Should have melted to water or air in high temperature
      assert(mockWorld.lastChanged !== null);
      assert.strictEqual(mockWorld.lastChanged.x, pos.x);
      assert.strictEqual(mockWorld.lastChanged.y, pos.y);
      assert.strictEqual(mockWorld.lastChanged.z, pos.z);
      assert(mockWorld.lastChanged.blockId === 'water' || mockWorld.lastChanged.blockId === 'air');
    });

    it('should generate particles when entities move through it', () => {
      const block = new PowderSnowBlock();
      
      // Create a mock world that tracks particle spawns
      const mockWorld = {
        spawnParticles: function(type, x, y, z, count, spread) {
          this.particles.push({ type, x, y, z, count, spread });
        },
        particles: []
      };
      
      // Create a mock entity
      const mockEntity = {
        type: 'player',
        id: 'player_1',
        position: { x: 10, y: 70, z: 10 },
        velocity: { x: 0.5, y: 0, z: 0.3 }
      };
      
      // Simulate movement through the block
      block.onEntityCollision(mockEntity, mockWorld);
      
      // Should spawn snow particles
      assert(mockWorld.particles.length > 0);
      
      // Particles should be of the correct type
      const snowParticles = mockWorld.particles.filter(p => 
        p.type === 'snow' || p.type === 'snow_puff'
      );
      assert(snowParticles.length > 0);
      
      // Particles should spawn at entity position
      const particle = snowParticles[0];
      assert.strictEqual(particle.x, mockEntity.position.x);
      assert.strictEqual(particle.y, mockEntity.position.y);
      assert.strictEqual(particle.z, mockEntity.position.z);
    });
  });
}); 