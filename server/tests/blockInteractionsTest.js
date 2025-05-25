/**
 * Block Interactions Test
 * Tests for block interactions with Wind Charge
 */
const assert = require('assert');
const WindChargeEntity = require('../entities/windChargeEntity');
const World = require('../world/world');
const Player = require('../entities/player');
const Vector3 = require('../math/vector3');

// Test world implementation
class TestWorld extends World {
  constructor() {
    super();
    this.blocks = new Map();
    this.entities = new Map();
    this.events = [];
  }
  
  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks.get(key) || { type: 'air', isSolid: false };
  }
  
  setBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    this.blocks.set(key, block);
  }
  
  getEntitiesInRadius(position, radius) {
    return Array.from(this.entities.values()).filter(entity => {
      const distance = Vector3.distance(position, entity.position);
      return distance <= radius;
    });
  }
  
  addEntity(entity) {
    this.entities.set(entity.id, entity);
  }
  
  removeEntity(entity) {
    this.entities.delete(entity.id);
  }
  
  emitEntityUpdate(entity) {
    this.events.push({
      type: 'entity_update',
      entityId: entity.id,
      position: entity.position,
      velocity: entity.velocity
    });
  }
  
  addParticleEffect(position, type, data) {
    this.events.push({
      type: 'particle_effect',
      position,
      particleType: type,
      ...data
    });
  }
  
  addSoundEffect(position, sound, volume, pitch) {
    this.events.push({
      type: 'sound_effect',
      position,
      sound,
      volume,
      pitch
    });
  }
  
  activateBlock(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (block.onActivate) {
      block.onActivate(this, x, y, z);
    }
  }
  
  reset() {
    this.blocks.clear();
    this.entities.clear();
    this.events = [];
  }
}

// Test player implementation
class TestPlayer extends Player {
  constructor(id, position = { x: 0, y: 0, z: 0 }) {
    super(id, {
      position,
      world: null,
      gameMode: 'survival'
    });
    this.rotation = { x: 0, y: 0, z: 0 };
    this.health = 20;
    this.maxHealth = 20;
  }

  getLookDirection() {
    return {
      x: -Math.sin(this.rotation.y) * Math.cos(this.rotation.x),
      y: -Math.sin(this.rotation.x),
      z: Math.cos(this.rotation.y) * Math.cos(this.rotation.x)
    };
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health;
  }
}

describe('Wind Charge Block Interactions', function() {
  let world;
  let player;
  let windCharge;
  
  beforeEach(function() {
    world = new TestWorld();
    player = new TestPlayer('test', { x: 0, y: 5, z: 0 });
    windCharge = new WindChargeEntity(world, { x: 0, y: 5, z: 0 });
  });
  
  afterEach(function() {
    world.reset();
  });
  
  describe('Block Breaking', function() {
    it('should break blocks on impact', function() {
      // Place a breakable block
      world.setBlock(0, 5, 5, { 
        type: 'stone',
        isSolid: true,
        hardness: 1.5,
        onBreak: function(world, x, y, z) {
          world.setBlock(x, y, z, { type: 'air', isSolid: false });
        }
      });
      
      // Set wind charge velocity towards block
      windCharge.velocity = { x: 0, y: 0, z: 5 };
      
      // Update until collision
      for (let i = 0; i < 10; i++) {
        windCharge.update();
      }
      
      // Block should be broken
      const block = world.getBlock(0, 5, 5);
      assert.strictEqual(block.type, 'air');
      
      // Should have particle effects
      const particleEvents = world.events.filter(e => e.type === 'particle_effect');
      assert(particleEvents.length > 0);
    });
    
    it('should not break unbreakable blocks', function() {
      // Place an unbreakable block
      world.setBlock(0, 5, 5, { 
        type: 'bedrock',
        isSolid: true,
        hardness: -1
      });
      
      // Set wind charge velocity towards block
      windCharge.velocity = { x: 0, y: 0, z: 5 };
      
      // Update until collision
      for (let i = 0; i < 10; i++) {
        windCharge.update();
      }
      
      // Block should still be there
      const block = world.getBlock(0, 5, 5);
      assert.strictEqual(block.type, 'bedrock');
    });
  });
  
  describe('Block Activation', function() {
    it('should activate blocks on impact', function() {
      let activated = false;
      
      // Place an activatable block
      world.setBlock(0, 5, 5, { 
        type: 'lever',
        isSolid: true,
        onActivate: function(world, x, y, z) {
          activated = true;
        }
      });
      
      // Set wind charge velocity towards block
      windCharge.velocity = { x: 0, y: 0, z: 5 };
      
      // Update until collision
      for (let i = 0; i < 10; i++) {
        windCharge.update();
      }
      
      // Block should be activated
      assert(activated);
    });
  });
  
  describe('Chain Reactions', function() {
    it('should trigger chain reactions with TNT', function() {
      // Place TNT blocks in a chain
      world.setBlock(0, 5, 5, { 
        type: 'tnt',
        isSolid: true,
        onActivate: function(world, x, y, z) {
          // Simulate TNT activation
          world.addParticleEffect({ x, y, z }, 'explosion', { size: 1 });
          world.addSoundEffect({ x, y, z }, 'tnt_primed', 1, 1);
          
          // Activate neighboring TNT
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dy === 0 && dz === 0) continue;
                
                const block = world.getBlock(x + dx, y + dy, z + dz);
                if (block.type === 'tnt') {
                  block.onActivate(world, x + dx, y + dy, z + dz);
                }
              }
            }
          }
        }
      });
      
      world.setBlock(0, 5, 6, { type: 'tnt', isSolid: true });
      world.setBlock(0, 5, 7, { type: 'tnt', isSolid: true });
      
      // Set wind charge velocity towards first TNT
      windCharge.velocity = { x: 0, y: 0, z: 5 };
      
      // Update until collision
      for (let i = 0; i < 10; i++) {
        windCharge.update();
      }
      
      // Should have multiple explosion effects
      const explosionEvents = world.events.filter(e => 
        e.type === 'particle_effect' && e.particleType === 'explosion'
      );
      assert(explosionEvents.length >= 3);
    });
  });
}); 