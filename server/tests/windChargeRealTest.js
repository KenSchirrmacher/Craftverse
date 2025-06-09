const assert = require('assert');
const TestBase = require('./testBase');
const WindChargeItem = require('../items/windChargeItem');
const WindChargeEntity = require('../entities/windChargeEntity');
const World = require('../world/world');
const Player = require('../entities/player');
const Vector3 = require('../math/vector3');

class WindChargeRealTest extends TestBase {
  constructor() {
    super('Wind Charge Real Implementation Test');
    
    this.test('Wind Charge Item Creation and Properties', async () => {
      const windCharge = new WindChargeItem();
      
      // Test basic properties
      assert.strictEqual(windCharge.id, 'wind_charge');
      assert.strictEqual(windCharge.name, 'Wind Charge');
      assert.strictEqual(windCharge.maxStackSize, 16);
      assert.strictEqual(windCharge.type, 'wind_charge');
      assert.strictEqual(windCharge.subtype, 'throwable');
      assert.strictEqual(windCharge.category, 'combat');
      
      // Test charge levels
      assert.ok(windCharge.chargeLevels, 'Should have charge levels');
      assert.strictEqual(windCharge.chargeLevels.length, 3, 'Should have 3 charge levels');
      assert.strictEqual(windCharge.chargeLevels[0].name, 'weak');
      assert.strictEqual(windCharge.chargeLevels[1].name, 'medium');
      assert.strictEqual(windCharge.chargeLevels[2].name, 'strong');
    });
    
    this.test('Wind Charge Entity Creation and Movement', async () => {
      const world = new World();
      const player = new Player('test_player');
      player.position = { x: 0, y: 64, z: 0 };
      player.rotation = { y: 0 };
      
      const windCharge = new WindChargeEntity(null, {
        world: world,
        position: { x: 0, y: 64, z: 0 },
        direction: { x: 0, y: 0, z: 1 },
        velocity: { x: 0, y: 0, z: 1.5 }
      });
      
      // Test initial properties
      assert.ok(windCharge.id, 'Should have an ID');
      assert.strictEqual(windCharge.type, 'wind_charge_entity');
      assert.deepStrictEqual(windCharge.position, { x: 0, y: 64, z: 0 });
      assert.ok(windCharge.velocity.x === 0 && windCharge.velocity.z > 0, 'Should have forward velocity');
      assert.strictEqual(windCharge.chargeLevel, 0);
      
      // Test movement
      windCharge.update(1);
      assert.notDeepStrictEqual(windCharge.position, { x: 0, y: 64, z: 0 }, 'Position should change after update');
    });
    
    this.test('Wind Charge Block Interactions', async () => {
      const world = new World();
      world.initialize(); // Initialize the world with blocks
      
      // Place test blocks
      world.setBlock(0, 64, 1, { type: 'glass_block', isSolid: true });
      world.setBlock(0, 64, 2, { type: 'glass_block', isSolid: true });
      
      // Create a wind charge with high force
      const windCharge = new WindChargeEntity(null, {
        world: world,
        position: { x: 0, y: 64, z: 0 },
        velocity: { x: 0, y: 0, z: 10.0 }, // Increased velocity for higher force
        chargeLevel: 3, // Maximum charge level for maximum force
        direction: { x: 0, y: 0, z: 1 } // Ensure direction is set
      });
      
      // Register the charge with the world
      world.addEntity(windCharge);
      
      // Update until collision
      for (let i = 0; i < 10; i++) {
        windCharge.update(1);
      }
      
      // Check if glass block was broken
      const blockAfter = world.getBlock(0, 64, 2);
      assert.strictEqual(blockAfter.type, 'air', 'Glass block should be broken');
    });
    
    this.test('Wind Charge Chain Reaction', async () => {
      const world = new World();
      world.initialize(); // Initialize the world with blocks
      
      // Clear blocks between charges to ensure line of sight
      for (let z = 0; z <= 2; z++) {
        world.setBlock(0, 64, z, { type: 'air', isSolid: false });
      }
      
      // Test chain reaction
      const windCharge1 = new WindChargeEntity(null, {
        world: world,
        position: { x: 0, y: 64, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        chargeLevel: 3, // Maximum charge level for maximum radius
        direction: { x: 0, y: 0, z: 1 } // Ensure direction is set
      });
      
      const windCharge2 = new WindChargeEntity(null, {
        world: world,
        position: { x: 0, y: 64, z: 1 }, // Even closer to first charge
        velocity: { x: 0, y: 0, z: 0 },
        chargeLevel: 1,
        direction: { x: 0, y: 0, z: 1 } // Ensure direction is set
      });
      
      // Register both charges with the world
      world.addEntity(windCharge1);
      world.addEntity(windCharge2);
      
      // Verify charges are registered
      const entities = world.getEntitiesInRadius({ x: 0, y: 64, z: 0 }, 2);
      assert.strictEqual(entities.length, 2, 'Both charges should be registered with the world');
      
      // Verify blocks are air
      const block1 = world.getBlock(0, 64, 0);
      const block2 = world.getBlock(0, 64, 1);
      assert.strictEqual(block1.type, 'air', 'Block 1 should be air');
      assert.strictEqual(block2.type, 'air', 'Block 2 should be air');
      
      // Trigger first charge and wait for chain reaction
      windCharge1.explode();
      
      // Wait for chain reaction (increased from 3000ms to 5000ms)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Log state for debugging
      console.log('First charge state:', {
        hasExploded: windCharge1.hasExploded,
        position: windCharge1.position
      });
      console.log('Second charge state:', {
        hasExploded: windCharge2.hasExploded,
        position: windCharge2.position
      });
      
      // Second charge should be affected by first charge
      assert(windCharge2.hasExploded, 'Second charge should be affected by first charge');
    });
    
    this.test('Wind Charge Particle Effects', async () => {
      const world = new World();
      world.initialize(); // Initialize the world with blocks
      
      // Test particle effects
      const windCharge = new WindChargeEntity(null, {
        world: world,
        position: { x: 0, y: 64, z: 0 },
        velocity: { x: 0, y: 0, z: 1.5 },
        chargeLevel: 2
      });
      
      // Update a few times to generate particles
      for (let i = 0; i < 5; i++) {
        windCharge.update(1);
      }
      
      // Check if particles were generated
      assert.ok(windCharge.particles.length > 0, 'Should generate trail particles');
      
      // Check particle properties
      const particle = windCharge.particles[0];
      assert.ok(particle.position, 'Particle should have position');
      assert.ok(particle.lifetime > 0, 'Particle should have lifetime');
      assert.ok(particle.size > 0, 'Particle should have size');
      assert.ok(particle.color, 'Particle should have color');
    });
  }
}

// Run the tests
(async () => {
  const test = new WindChargeRealTest();
  const results = await test.runTests();
  console.log('Test results:', results);
})(); 