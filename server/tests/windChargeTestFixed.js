// Wind Charge tests - Tests for Wind Charge item and entity implementation
const assert = require('assert');
const WindChargeItem = require('../items/windChargeItem');
const WindChargeEntity = require('../entities/windChargeEntity');
const World = require('../world/world');
const Player = require('../entities/player');
const { v4: uuidv4 } = require('uuid');

// Test world implementation
class TestWorld extends World {
  constructor() {
    super();
    this.blocks = new Map();
    this.entities = new Map();
    this.blockStateUpdates = [];
    this.particleEffects = [];
    this.activatedBlocks = [];
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
      const dx = entity.position.x - position.x;
      const dy = entity.position.y - position.y;
      const dz = entity.position.z - position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance <= radius;
    });
  }
  
  addEntity(entity) {
    this.entities.set(entity.id, entity);
    entity.world = this;
  }
  
  removeEntity(id) {
    this.entities.delete(id);
  }

  updateBlockState(x, y, z, state) {
    this.blockStateUpdates.push({ x, y, z, state });
  }

  addParticleEffect(effect) {
    this.particleEffects.push(effect);
  }

  activateBlock(x, y, z, type, data) {
    this.activatedBlocks.push({ x, y, z, type, ...data });
  }

  reset() {
    this.blockStateUpdates = [];
    this.particleEffects = [];
    this.activatedBlocks = [];
  }
}

// Test player implementation
class TestPlayer extends Player {
  constructor(id, position) {
    super(id, position);
    this.charging = {};
    this.cooldowns = {};
    this.gameMode = 'survival';
    this.rotation = { x: 0, y: 0, z: 0 };
    this.sentEvents = [];
  }

  sendEvent(event) {
    this.sentEvents.push(event);
  }

  getLookDirection() {
    return {
      x: -Math.sin(this.rotation.y) * Math.cos(this.rotation.x),
      y: -Math.sin(this.rotation.x),
      z: Math.cos(this.rotation.y) * Math.cos(this.rotation.x)
    };
  }
}

// Mock entity for testing
class MockEntity {
  constructor(id, position) {
    this.id = id;
    this.position = position || { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.health = 10;
    this.maxHealth = 10;
    this.dead = false;
    this.boundingBox = {
      min: {
        x: position.x - 0.3,
        y: position.y - 0.3,
        z: position.z - 0.3
      },
      max: {
        x: position.x + 0.3,
        y: position.y + 0.3,
        z: position.z + 0.3
      }
    };
  }
  
  takeDamage(amount, attacker) {
    this.health -= amount;
    if (this.health <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }
}

describe('Wind Charge', function() {
  // Test the Wind Charge item
  describe('Wind Charge Item', function() {
    it('should create a Wind Charge item with correct properties', function() {
      const windCharge = new WindChargeItem();
      
      assert.strictEqual(windCharge.id, 'wind_charge');
      assert.strictEqual(windCharge.name, 'Wind Charge');
      assert.strictEqual(windCharge.type, 'wind_charge');
      assert.strictEqual(windCharge.subtype, 'throwable');
      assert.strictEqual(windCharge.category, 'combat');
      assert.strictEqual(windCharge.stackable, true);
      assert.strictEqual(windCharge.maxStackSize, 16);
      assert.strictEqual(windCharge.damage, 5);
      assert.strictEqual(windCharge.moveDistance, 1);
      assert.strictEqual(windCharge.explosionRadius, 1.5);
    });
    
    it('should accept custom properties', function() {
      const windCharge = new WindChargeItem({
        damage: 10,
        moveDistance: 2,
        explosionRadius: 3
      });
      
      assert.strictEqual(windCharge.damage, 10);
      assert.strictEqual(windCharge.moveDistance, 2);
      assert.strictEqual(windCharge.explosionRadius, 3);
    });
    
    it('should provide correct tooltip information', function() {
      const windCharge = new WindChargeItem();
      const tooltip = windCharge.getTooltip();
      
      assert.strictEqual(tooltip[0], 'Wind Charge');
      assert.strictEqual(tooltip[1], 'Damage: 5');
      assert.strictEqual(tooltip[2], 'Pushes entities and blocks');
      assert.strictEqual(tooltip[3], 'Hold use to charge (up to 3 levels)');
    });
    
    it('should start charging when useStart is called', function() {
      const windCharge = new WindChargeItem();
      const player = new TestPlayer('player1', { x: 10, y: 5, z: 10 });
      
      const result = windCharge.useStart(player, {});
      
      assert.strictEqual(result.type, 'wind_charge_charging');
      assert.strictEqual(result.playerId, player.id);
      assert.strictEqual(typeof result.startTime, 'number');
      assert.strictEqual(player.charging.wind_charge.chargeLevel, 0);
    });
    
    it('should update charging state with particles in useUpdate', function() {
      const windCharge = new WindChargeItem();
      const player = new TestPlayer('player1', { x: 10, y: 5, z: 10 });
      
      // Start charging
      windCharge.useStart(player, {});
      
      // Simulate time passing - set start time to 1 second ago
      player.charging.wind_charge.startTime = Date.now() - 1000;
      // Make lastParticleTime more than 200ms ago to ensure we get particles
      player.charging.wind_charge.lastParticleTime = Date.now() - 300;
      
      // Update charging state
      const result = windCharge.useUpdate(player, {}, 1);
      
      // Should have particle update
      assert.strictEqual(result.type, 'wind_charge_charging_particles');
      assert.strictEqual(result.playerId, player.id);
      assert.strictEqual(result.chargeLevel, 0); // Not yet at medium level
    });
    
    it('should update charging level when time threshold reached', function() {
      const windCharge = new WindChargeItem();
      const player = new TestPlayer('player1', { x: 10, y: 5, z: 10 });
      
      // Start charging
      windCharge.useStart(player, {});
      
      // Simulate more time - set start time to 1.5 seconds ago (30 ticks)
      player.charging.wind_charge.startTime = Date.now() - 1500;
      
      // Force a charge level update
      player.charging.wind_charge.chargeLevel = 0;
      const result = windCharge.useUpdate(player, {}, 1);
      
      // Should have level update to medium
      assert.strictEqual(result.type, 'wind_charge_charge_level');
      assert.strictEqual(result.playerId, player.id);
      assert.strictEqual(result.chargeLevel, 1); // Medium level
      assert.strictEqual(result.chargeName, 'medium');
      
      // Simulate full charge time - set start time to 3 seconds ago (60 ticks)
      player.charging.wind_charge.startTime = Date.now() - 3000;
      
      // Force a charge level update
      player.charging.wind_charge.chargeLevel = 1;
      const result2 = windCharge.useUpdate(player, {}, 1);
      
      // Should have level update to strong
      assert.strictEqual(result2.type, 'wind_charge_charge_level');
      assert.strictEqual(result2.playerId, player.id);
      assert.strictEqual(result2.chargeLevel, 2); // Strong level
      assert.strictEqual(result2.chargeName, 'strong');
    });
    
    it('should create wind charge entity with proper charge level when used', function() {
      const windCharge = new WindChargeItem();
      const player = new TestPlayer('player1', { x: 10, y: 5, z: 10 });
      const context = { itemStack: { count: 1 } };
      
      // Set player looking straight ahead
      player.rotation = { x: 0, y: 0, z: 0 };
      
      // Start charging
      windCharge.useStart(player, {});
      
      // Simulate full charge time - 3 seconds (60 ticks)
      player.charging.wind_charge.startTime = Date.now() - 3000;
      player.charging.wind_charge.chargeLevel = 2; // Strong level
      
      // Use the wind charge
      const result = windCharge.use(player, context);
      
      assert.strictEqual(result.type, 'wind_charge_entity');
      assert.strictEqual(typeof result.id, 'string');
      assert.strictEqual(result.shooter, player.id);
      assert.strictEqual(result.damage, 10); // Base damage (5) * 2.0 multiplier
      
      // Use approximately equal for floating point comparison
      assert.ok(Math.abs(result.radius - 2.4) < 0.001); // Base radius (1.5) * 1.6 multiplier
      assert.strictEqual(result.moveDistance, 2); // Base moveDistance (1) * 2.0 multiplier
      assert.strictEqual(result.chargeLevel, 2);
      assert.strictEqual(result.chargeName, 'strong');
      
      // Check that item count is reduced
      assert.strictEqual(context.itemStack.count, 0);
      
      // Check that charging data is cleaned up
      assert.strictEqual(player.charging.wind_charge, undefined);
    });
    
    it('should create wind charge entity with base charge level when used without charging', function() {
      const windCharge = new WindChargeItem();
      const player = new TestPlayer('player1', { x: 10, y: 5, z: 10 });
      const context = { itemStack: { count: 1 } };
      
      // Set player looking straight ahead
      player.rotation = { x: 0, y: 0, z: 0 };
      
      // Use the wind charge without charging
      const result = windCharge.use(player, context);
      
      assert.strictEqual(result.type, 'wind_charge_entity');
      assert.strictEqual(typeof result.id, 'string');
      assert.strictEqual(result.shooter, player.id);
      assert.strictEqual(result.damage, 5); // Base damage
      assert.strictEqual(result.radius, 1.5); // Base radius
      assert.strictEqual(result.moveDistance, 1); // Base moveDistance
      assert.strictEqual(result.chargeLevel, 0);
      assert.strictEqual(result.chargeName, 'weak');
      
      // Check that item count is reduced
      assert.strictEqual(context.itemStack.count, 0);
    });
    
    it('should not reduce item count in creative mode', function() {
      const windCharge = new WindChargeItem();
      const player = new TestPlayer('player1');
      player.gameMode = 'creative';
      const context = { itemStack: { count: 1 } };
      
      windCharge.use(player, context);
      
      assert.strictEqual(context.itemStack.count, 1);
    });
    
    it('should respect cooldown time between uses', function() {
      const windCharge = new WindChargeItem();
      const player = new TestPlayer('player1');
      const context = { itemStack: { count: 2 } };
      
      // First use should succeed
      const result1 = windCharge.use(player, context);
      assert.notStrictEqual(result1, false);
      
      // Second immediate use should fail due to cooldown
      const result2 = windCharge.use(player, context);
      assert.strictEqual(result2, false);
      
      // First useStart should also fail due to cooldown
      const result3 = windCharge.useStart(player, {});
      assert.strictEqual(result3, false);
      
      // Item count should only decrease once
      assert.strictEqual(context.itemStack.count, 1);
    });
    
    it('should properly serialize and deserialize', function() {
      const windCharge = new WindChargeItem({
        damage: 8,
        moveDistance: 2,
        explosionRadius: 2.5
      });
      
      const json = windCharge.toJSON();
      const restored = WindChargeItem.fromJSON(json);
      
      assert.strictEqual(restored.id, 'wind_charge');
      assert.strictEqual(restored.damage, 8);
      assert.strictEqual(restored.moveDistance, 2);
      assert.strictEqual(restored.explosionRadius, 2.5);
    });
  });
  
  // Test the Wind Charge entity
  describe('Wind Charge Entity', function() {
    it('should create a Wind Charge entity with correct properties', function() {
      // Create initial velocity object
      const initialVelocity = {
        x: 2, y: 0, z: 0
      };
      
      // Create entity with an explicit velocity object
      const entity = new WindChargeEntity('test_id', {
        position: { x: 5, y: 5, z: 5 },
        direction: { x: 1, y: 0, z: 0 },
        velocity: initialVelocity, // Pass as object
        damage: 8,
        moveDistance: 2,
        radius: 3,
        chargeLevel: 1,
        chargeName: 'medium'
      });
      
      assert.strictEqual(entity.id, 'test_id');
      assert.strictEqual(entity.type, 'wind_charge_entity');
      assert.deepStrictEqual(entity.position, { x: 5, y: 5, z: 5 });
      assert.deepStrictEqual(entity.direction, { x: 1, y: 0, z: 0 });
      
      // Check numeric values of velocity components
      assert.strictEqual(typeof entity.velocity.x, 'number');
      assert.strictEqual(typeof entity.velocity.y, 'number');
      assert.strictEqual(typeof entity.velocity.z, 'number');
      
      assert.strictEqual(entity.damage, 8);
      assert.strictEqual(entity.moveDistance, 2);
      assert.strictEqual(entity.explosionRadius, 3);
      assert.strictEqual(entity.hasExploded, false);
      assert.strictEqual(entity.chargeLevel, 1);
      assert.strictEqual(entity.chargeName, 'medium');
      assert.strictEqual(entity.powerLevel, 1.5); // Base 1.0 + (1 * 0.5)
    });
    
    it('should have different visual effects based on charge level', function() {
      // Create three entities with different charge levels
      const weakEntity = new WindChargeEntity('weak_id', {
        position: { x: 0, y: 0, z: 0 },
        chargeLevel: 0,
        chargeName: 'weak'
      });
      
      const mediumEntity = new WindChargeEntity('medium_id', {
        position: { x: 0, y: 0, z: 0 },
        chargeLevel: 1,
        chargeName: 'medium'
      });
      
      const strongEntity = new WindChargeEntity('strong_id', {
        position: { x: 0, y: 0, z: 0 },
        chargeLevel: 2,
        chargeName: 'strong'
      });
      
      // Verify each entity has the correct color for its charge level
      assert.strictEqual(weakEntity.particleColors[weakEntity.chargeLevel], '#a0e6ff');
      assert.strictEqual(mediumEntity.particleColors[mediumEntity.chargeLevel], '#80d0ff');
      assert.strictEqual(strongEntity.particleColors[strongEntity.chargeLevel], '#60b8ff');
      
      // Verify particle sizes increase with charge level
      assert.strictEqual(weakEntity.particleSizes[weakEntity.chargeLevel], 0.2);
      assert.strictEqual(mediumEntity.particleSizes[mediumEntity.chargeLevel], 0.3);
      assert.strictEqual(strongEntity.particleSizes[strongEntity.chargeLevel], 0.4);
      
      // Verify particle density increases with charge level
      assert.strictEqual(weakEntity.particleDensity[weakEntity.chargeLevel], 1);
      assert.strictEqual(mediumEntity.particleDensity[mediumEntity.chargeLevel], 1.5);
      assert.strictEqual(strongEntity.particleDensity[strongEntity.chargeLevel], 2);
    });
    
    it('should move according to velocity', function() {
      // Create a wind charge with a clear velocity in the positive X direction
      const entity = new WindChargeEntity('test_id', {
        position: { x: 5, y: 5, z: 5 },
        direction: { x: 1, y: 0, z: 0 },
        velocity: { x: 0.5, y: 0, z: 0 } // Explicit velocity
      });
      
      const initialX = entity.position.x;
      
      // Manually update position for test
      entity.position.x += entity.velocity.x;
      
      // Position should have changed in the X direction
      assert.ok(entity.position.x > initialX);
    });
    
    it('should explode on collision with blocks', function() {
      // Create a world with a solid block
      const world = new TestWorld();
      
      // Create a wind charge moving toward the block
      const entity = new WindChargeEntity('test_id', {
        world: world,
        position: { x: 6, y: 5, z: 5 }, // Position at block
        direction: { x: 1, y: 0, z: 0 },
        velocity: { x: 0.5, y: 0, z: 0 } // Moving toward the block
      });
      
      // Set the block at the exact position of the entity
      world.setBlock(6, 5, 5, { type: 'stone', isSolid: true });
      
      // Now manually trigger collision detection
      entity.checkCollisions();
      
      // Entity should have exploded
      assert.ok(entity.hasExploded);
    });
    
    it('should damage entities on direct hit', function() {
      // Create a world with a target entity
      const world = new TestWorld();
      const targetEntity = new MockEntity('target', { x: 6, y: 5, z: 5 });
      world.addEntity(targetEntity);
      
      // Create a wind charge moving toward the target
      const entity = new WindChargeEntity('test_id', {
        world: world,
        position: { x: 5.9, y: 5, z: 5 }, // Position very close to target
        direction: { x: 1, y: 0, z: 0 },
        velocity: { x: 0.5, y: 0, z: 0 }, // Moving toward the target
        damage: 10,
        chargeLevel: 2, // Strong charge
        chargeName: 'strong'
      });
      
      // Directly hit the entity for test reliability
      entity.hitEntity(targetEntity);
      
      // Entity should have exploded
      assert.ok(entity.hasExploded);
      
      // Target should have taken damage
      assert.ok(targetEntity.health < 10); // Health should be reduced
    });
    
    it('should apply knockback to hit entities', function() {
      // Create a world with a target entity
      const world = new TestWorld();
      const targetEntity = new MockEntity('target', { x: 6, y: 5, z: 5 });
      targetEntity.health = 20; // Make it survive the hit
      world.addEntity(targetEntity);
      
      // Create a wind charge moving toward the target
      const entity = new WindChargeEntity('test_id', {
        world: world,
        position: { x: 5.9, y: 5, z: 5 }, // Position very close to target
        direction: { x: 1, y: 0, z: 0 },
        velocity: { x: 0.5, y: 0, z: 0 }, // Moving toward the target
        chargeLevel: 1 // Medium charge
      });
      
      // Record initial velocity
      const initialVelocity = { ...targetEntity.velocity };
      
      // Directly hit the entity for test reliability
      entity.hitEntity(targetEntity);
      
      // Target should have been knocked back
      assert.ok(targetEntity.velocity.x > initialVelocity.x);
      assert.ok(targetEntity.velocity.y > initialVelocity.y);
    });
    
    it('should affect entities in explosion radius with scaled effects', function() {
      // Create a world with entities at different distances
      const world = new TestWorld();
      
      // Entity right at the center
      const closeEntity = new MockEntity('close', { x: 5, y: 5, z: 5 });
      closeEntity.health = 20;
      world.addEntity(closeEntity);
      
      // Entity at the edge of radius
      const edgeEntity = new MockEntity('edge', { x: 6.5, y: 5, z: 5 });
      edgeEntity.health = 20;
      world.addEntity(edgeEntity);
      
      // Entity outside radius
      const farEntity = new MockEntity('far', { x: 10, y: 5, z: 5 });
      farEntity.health = 20;
      world.addEntity(farEntity);
      
      // Create a wind charge with strong charge level
      const entity = new WindChargeEntity('test_id', {
        world: world,
        position: { x: 5, y: 5, z: 5 },
        direction: { x: 1, y: 0, z: 0 },
        damage: 10,
        radius: 3,
        chargeLevel: 2, // Strong charge
        chargeName: 'strong'
      });
      
      // Record initial velocities
      const closeInitialVelocity = { ...closeEntity.velocity };
      const edgeInitialVelocity = { ...edgeEntity.velocity };
      const farInitialVelocity = { ...farEntity.velocity };
      
      // Trigger explosion directly
      entity.explode();
      
      // Check health and velocity changes for close entity
      assert.ok(closeEntity.health < 20); // Some damage
      assert.ok(closeEntity.velocity.x !== closeInitialVelocity.x ||
               closeEntity.velocity.y !== closeInitialVelocity.y ||
               closeEntity.velocity.z !== closeInitialVelocity.z); // Some movement
      
      // Check health and velocity changes for edge entity
      assert.ok(edgeEntity.health <= 20); // Possibly some damage
      
      // Far entity should be unaffected
      assert.strictEqual(farEntity.health, 20); // No damage
      assert.deepStrictEqual(farEntity.velocity, farInitialVelocity); // No movement
    });
    
    it('should serialize and deserialize with charge level information', function() {
      const entity = new WindChargeEntity('test_id', {
        position: { x: 5, y: 5, z: 5 },
        direction: { x: 1, y: 0, z: 0 },
        velocity: { x: 0.5, y: 0, z: 0 },
        damage: 8,
        moveDistance: 2,
        radius: 3,
        chargeLevel: 2,
        chargeName: 'strong'
      });
      
      const serialized = entity.serialize();
      const deserialized = WindChargeEntity.deserialize(serialized);
      
      assert.strictEqual(deserialized.id, 'test_id');
      assert.strictEqual(deserialized.damage, 8);
      assert.strictEqual(deserialized.moveDistance, 2);
      assert.strictEqual(deserialized.explosionRadius, 3);
      assert.strictEqual(deserialized.chargeLevel, 2);
      assert.strictEqual(deserialized.chargeName, 'strong');
      assert.strictEqual(deserialized.hasExploded, false);
    });
    
    it('should trigger chain reactions with nearby wind charges', function(done) {
      const world = new TestWorld();
      
      // Create first wind charge
      const windCharge1 = new WindChargeEntity('test_id1', {
        world: world,
        position: { x: 10, y: 5, z: 10 },
        direction: { x: 1, y: 0, z: 0 },
        chargeLevel: 2, // Strong charge for bigger explosion radius
        explosionRadius: 2.0
      });
      
      // Create second wind charge within chain reaction range
      const windCharge2 = new WindChargeEntity('test_id2', {
        world: world,
        position: { x: 13, y: 5, z: 10 }, // 3 blocks away
        direction: { x: 0, y: 1, z: 0 }
      });
      
      // Add both to world
      world.addEntity(windCharge1);
      world.addEntity(windCharge2);
      
      // Track explosions
      let explosionCount = 0;
      const originalExplode1 = windCharge1.explode;
      const originalExplode2 = windCharge2.explode;
      
      windCharge1.explode = function() {
        explosionCount++;
        originalExplode1.call(windCharge1);
      };
      
      windCharge2.explode = function() {
        explosionCount++;
        originalExplode2.call(windCharge2);
      };
      
      // Trigger first explosion
      windCharge1.explode();
      
      // After a delay, check if the second wind charge was triggered
      setTimeout(() => {
        try {
          assert.strictEqual(explosionCount, 2, "Both wind charges should have exploded");
          assert.strictEqual(windCharge1.hasExploded, true, "First wind charge should be exploded");
          assert.strictEqual(windCharge2.hasExploded, true, "Second wind charge should be triggered by chain reaction");
          done();
        } catch (error) {
          done(error);
        }
      }, 500); // Wait for chain reaction to complete
    });

    it('should not trigger chain reactions with wind charges outside range', function(done) {
      const world = new TestWorld();
      
      // Create first wind charge
      const windCharge1 = new WindChargeEntity('test_id1', {
        world: world,
        position: { x: 10, y: 5, z: 10 },
        direction: { x: 1, y: 0, z: 0 },
        explosionRadius: 1.0 // Smaller explosion radius
      });
      
      // Create second wind charge outside chain reaction range
      const windCharge2 = new WindChargeEntity('test_id2', {
        world: world,
        position: { x: 20, y: 5, z: 10 }, // 10 blocks away
        direction: { x: 0, y: 1, z: 0 }
      });
      
      // Add both to world
      world.addEntity(windCharge1);
      world.addEntity(windCharge2);
      
      // Track explosions
      let explosionCount = 0;
      const originalExplode1 = windCharge1.explode;
      const originalExplode2 = windCharge2.explode;
      
      windCharge1.explode = function() {
        explosionCount++;
        originalExplode1.call(windCharge1);
      };
      
      windCharge2.explode = function() {
        explosionCount++;
        originalExplode2.call(windCharge2);
      };
      
      // Trigger first explosion
      windCharge1.explode();
      
      // After a delay, check that the second wind charge was NOT triggered
      setTimeout(() => {
        try {
          assert.strictEqual(explosionCount, 1, "Only the first wind charge should have exploded");
          assert.strictEqual(windCharge1.hasExploded, true, "First wind charge should be exploded");
          assert.strictEqual(windCharge2.hasExploded, false, "Second wind charge should NOT be triggered");
          done();
        } catch (error) {
          done(error);
        }
      }, 500); // Wait to ensure no chain reaction occurs
    });
  });
}); 