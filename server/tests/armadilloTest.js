/**
 * Armadillo Test - Tests for the Armadillo mob
 * Part of the 1.22 Sorcery Update
 */

const assert = require('assert');
const Armadillo = require('../mobs/armadillo');
const ArmadilloScuteItem = require('../items/armadilloScuteItem');

// Mock classes
class MockWorld {
  constructor() {
    this.items = [];
    this.entities = [];
  }
  
  dropItem(itemId, position, count = 1) {
    this.items.push({ itemId, position, count });
    return true;
  }
  
  getNearbyEntities(position, radius) {
    return this.entities.filter(entity => {
      const distance = getDistance(position, entity.position);
      return distance <= radius;
    });
  }
  
  spawnEntity(type, position, options = {}) {
    const entity = { 
      id: `entity_${this.entities.length}`,
      type, 
      position,
      ...options
    };
    
    if (type === 'armadillo') {
      const armadillo = new Armadillo(position);
      if (options.isBaby) {
        armadillo.isBaby = true;
        armadillo.updateSize();
      }
      this.entities.push(armadillo);
      return armadillo;
    }
    
    this.entities.push(entity);
    return entity;
  }
}

class MockPlayer {
  constructor(id = 'player1', position = { x: 0, y: 0, z: 0 }) {
    this.id = id;
    this.position = position;
    this.heldItem = null;
    this.isSneaking = false;
    this.isSprinting = false;
    this.type = 'player';
    this.inventory = {
      addItem: (item) => true,
      removeItem: (itemId, count) => true
    };
  }
  
  getHeldItem() {
    return this.heldItem;
  }
  
  setHeldItem(item) {
    this.heldItem = item;
  }
}

// Helper function to calculate distance between positions
function getDistance(pos1, pos2) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Test basic armadillo creation and properties
 */
function testArmadilloCreation() {
  console.log('Testing armadillo creation...');
  
  const position = { x: 10, y: 64, z: 10 };
  const armadillo = new Armadillo(position);
  
  assert.strictEqual(armadillo.type, 'armadillo', 'Entity has correct type');
  assert.deepStrictEqual(armadillo.position, position, 'Entity has correct position');
  assert.strictEqual(armadillo.health, 10, 'Entity has correct health');
  assert.strictEqual(armadillo.maxHealth, 10, 'Entity has correct max health');
  assert.strictEqual(armadillo.speed, 0.3, 'Entity has correct speed');
  
  // Check initial state
  assert.strictEqual(armadillo.isRolled, false, 'Armadillo is not rolled initially');
  assert.strictEqual(armadillo.rollCooldown, 0, 'Roll cooldown starts at 0');
  assert.strictEqual(armadillo.isBaby, false, 'Armadillo is adult by default');
  assert.strictEqual(armadillo.scuteGrowth, 0, 'Scute growth starts at 0');
  
  // Check preferred biomes
  assert.ok(armadillo.preferredBiomes.includes('savanna'), 'Armadillo prefers savanna biome');
  assert.ok(armadillo.preferredBiomes.includes('desert'), 'Armadillo prefers desert biome');
  
  console.log('✓ Armadillo creation test passed');
}

/**
 * Test armadillo rolling defense mechanism
 */
function testRollingMechanism() {
  console.log('Testing armadillo rolling mechanism...');
  
  const armadillo = new Armadillo({ x: 0, y: 0, z: 0 });
  
  // Test rolling up
  armadillo.roll();
  assert.strictEqual(armadillo.isRolled, true, 'Armadillo is now rolled up');
  assert.ok(armadillo.rollDuration > 0, 'Roll duration is set');
  assert.ok(armadillo.forceUnrollTimer > 0, 'Force unroll timer is set');
  assert.strictEqual(armadillo.damageResistance, 0.75, 'Armadillo has 75% damage resistance when rolled');
  
  // Test damage reduction
  const player = { id: 'player1', type: 'player', position: { x: 1, y: 0, z: 1 } };
  const damageDealt = armadillo.takeDamage(4, player);
  assert.strictEqual(damageDealt, 1, 'Damage is reduced by 75% when rolled');
  assert.strictEqual(armadillo.health, 9, 'Health is reduced correctly');
  
  // Test unrolling
  armadillo.unroll();
  assert.strictEqual(armadillo.isRolled, false, 'Armadillo is now unrolled');
  assert.strictEqual(armadillo.damageResistance, 0, 'Damage resistance is reset');
  assert.ok(armadillo.rollCooldown > 0, 'Roll cooldown is set after unrolling');
  
  // Test rolling cooldown
  armadillo.roll(); // Should not work due to cooldown
  assert.strictEqual(armadillo.isRolled, false, 'Armadillo cannot roll during cooldown');
  
  // Reset cooldown
  armadillo.rollCooldown = 0;
  
  // Test automatic roll on damage
  armadillo.takeDamage(2, player);
  assert.strictEqual(armadillo.isRolled, true, 'Armadillo automatically rolls when attacked');
  
  console.log('✓ Armadillo rolling mechanism test passed');
}

/**
 * Test armadillo AI behavior
 */
function testArmadilloAI() {
  console.log('Testing armadillo AI behavior...');
  
  const armadillo = new Armadillo({ x: 0, y: 0, z: 0 });
  const world = new MockWorld();
  
  // Give armadillo a reference to the world
  armadillo.world = world;
  armadillo.rollCooldown = 0; // Make sure roll cooldown is reset
  
  // Test idle state
  armadillo.aiState = 'idle';
  armadillo.aiTimer = 0;
  armadillo.updateAI(world, 10);
  assert.ok(['idle', 'walking'].includes(armadillo.aiState), 'Armadillo chooses new state after timer expires');
  
  // Reset state for next test
  armadillo.aiState = 'idle';
  armadillo.isRolled = false;
  armadillo.isScared = false;
  armadillo.rollCooldown = 0;
  
  // Add a player far away - shouldn't cause fear
  const farPlayer = new MockPlayer('player_far', { x: 20, y: 0, z: 20 });
  world.entities = [farPlayer]; // Reset entities list
  
  armadillo.updateAI(world, 10);
  assert.strictEqual(armadillo.isScared, false, 'Armadillo is not scared of distant player');
  
  // Reset state for next test
  armadillo.aiState = 'idle';
  armadillo.isRolled = false;
  armadillo.isScared = false;
  armadillo.rollCooldown = 0;
  
  // Add a nearby player with a sword (close threat)
  const nearbyPlayer = new MockPlayer('player_near', { x: 2, y: 0, z: 2 });
  nearbyPlayer.setHeldItem({ type: 'sword', id: 'iron_sword' });
  world.entities = [nearbyPlayer]; // Reset entities list
  
  // Update AI - should be scared and roll up (because distance < 4)
  armadillo.updateAI(world, 10);
  
  // Check that armadillo rolled up
  assert.strictEqual(armadillo.isRolled, true, 'Armadillo rolls up when close to armed player');
  assert.strictEqual(armadillo.aiState, 'rolling', 'Armadillo enters rolling state');
  
  // Reset state for next test
  armadillo.aiState = 'idle';
  armadillo.isRolled = false;
  armadillo.isScared = false;
  armadillo.rollCooldown = 0;
  
  // Add a player at medium distance with a weapon (should flee instead of roll)
  const mediumPlayer = new MockPlayer('player_medium', { x: 5, y: 0, z: 5 });
  mediumPlayer.setHeldItem({ type: 'sword', id: 'iron_sword' });
  world.entities = [mediumPlayer]; // Reset entities list
  
  // Update AI - should be scared and flee (because distance >= 4)
  armadillo.updateAI(world, 10);
  
  // Check that armadillo is fleeing
  assert.strictEqual(armadillo.isRolled, false, 'Armadillo does not roll when at medium distance');
  assert.strictEqual(armadillo.isScared, true, 'Armadillo is scared at medium distance');
  assert.strictEqual(armadillo.aiState, 'scared', 'Armadillo enters scared state');
  assert.ok(armadillo.fleeSource !== null, 'Armadillo has a flee source');
  
  // Test with a player who is sneaking
  world.entities = []; // Clear entities
  const sneakingPlayer = new MockPlayer('player_sneaking', { x: 2, y: 0, z: 2 });
  sneakingPlayer.isSneaking = true;
  world.entities = [sneakingPlayer]; // Reset entities list
  
  // Reset armadillo state
  armadillo.aiState = 'idle';
  armadillo.isRolled = false;
  armadillo.isScared = false;
  armadillo.rollCooldown = 0;
  armadillo.fleeSource = null;
  
  // Update AI - should not be scared of sneaking player
  armadillo.updateAI(world, 10);
  assert.strictEqual(armadillo.isScared, false, 'Armadillo is not scared of sneaking player');
  assert.strictEqual(armadillo.isRolled, false, 'Armadillo does not roll for sneaking player');
  
  console.log('✓ Armadillo AI behavior test passed');
}

/**
 * Test scute dropping behavior
 */
function testScuteDropping() {
  console.log('Testing scute dropping behavior...');
  
  const armadillo = new Armadillo({ x: 0, y: 0, z: 0 });
  const world = new MockWorld();
  
  // Give armadillo a reference to the world
  armadillo.world = world;
  
  // Test scute growth for adult armadillo
  armadillo.isBaby = false;
  armadillo.scuteGrowth = 99; // Almost ready to drop
  
  // Update armadillo - should drop a scute
  armadillo.update(world, 1000); // Large delta to ensure it crosses threshold
  
  // Check if scute was dropped
  assert.strictEqual(world.items.length, 1, 'An item was dropped');
  assert.strictEqual(world.items[0].itemId, 'armadillo_scute', 'The dropped item is an armadillo scute');
  assert.strictEqual(armadillo.scuteGrowth, 0, 'Scute growth is reset after dropping');
  
  // Test that baby armadillos don't drop scutes
  const babyArmadillo = new Armadillo({ x: 5, y: 0, z: 5 });
  babyArmadillo.world = world;
  babyArmadillo.isBaby = true;
  babyArmadillo.scuteGrowth = 99;
  
  // Clear previous drops
  world.items = [];
  
  // Update baby armadillo
  babyArmadillo.update(world, 1000);
  
  // Check that no scute was dropped
  assert.strictEqual(world.items.length, 0, 'Baby armadillo does not drop scutes');
  
  console.log('✓ Scute dropping behavior test passed');
}

/**
 * Test breeding and baby growth
 */
function testBreedingAndGrowth() {
  console.log('Testing breeding and baby growth...');
  
  const world = new MockWorld();
  const position1 = { x: 0, y: 0, z: 0 };
  const position2 = { x: 1, y: 0, z: 1 };
  
  // Create two adult armadillos
  const armadillo1 = new Armadillo(position1);
  const armadillo2 = new Armadillo(position2);
  
  armadillo1.world = world;
  armadillo2.world = world;
  
  world.entities.push(armadillo1);
  world.entities.push(armadillo2);
  
  // Test breeding mechanics
  const player = new MockPlayer('player1', { x: 2, y: 0, z: 2 });
  player.setHeldItem({ id: 'carrot', type: 'carrot' });
  
  // Feed the first armadillo
  const interacted1 = armadillo1.interact(player, {});
  assert.strictEqual(interacted1, true, 'Interaction with food is successful');
  assert.ok(armadillo1.loveTimer > 0, 'Armadillo enters love mode when fed');
  
  // Feed the second armadillo
  player.setHeldItem({ id: 'carrot', type: 'carrot' }); // Refresh held item
  const interacted2 = armadillo2.interact(player, {});
  assert.strictEqual(interacted2, true, 'Interaction with second armadillo is successful');
  
  // Manually set the second armadillo's love timer for testing
  armadillo2.loveTimer = 600;
  
  // Get initial entity count
  const initialEntityCount = world.entities.length;
  
  // Manually trigger breeding logic
  armadillo1.findMate();
  
  // Check that a new entity was created
  assert.ok(world.entities.length > initialEntityCount, 'At least one new entity was created');
  
  // Find the baby
  const babies = world.entities.filter(
    entity => entity.type === 'armadillo' && 
    entity !== armadillo1 && 
    entity !== armadillo2 && 
    entity.isBaby === true
  );
  
  assert.ok(babies.length > 0, 'A baby armadillo was created');
  const baby = babies[0];
  assert.strictEqual(baby.isBaby, true, 'New armadillo is a baby');
  
  // Test baby growth
  const initialHeight = baby.height;
  
  // Update baby to simulate partial growth
  baby.ageTimer = 12000; // Half the time to grow up
  baby.update(world, 0); // Update without time passing
  
  // Still should be a baby
  assert.strictEqual(baby.isBaby, true, 'Armadillo is still a baby after partial growth');
  
  // Complete growth
  baby.ageTimer = 24000; // Full time to grow up
  baby.update(world, 0); // Update without time passing
  
  // Should now be an adult
  assert.strictEqual(baby.isBaby, false, 'Armadillo is now an adult after growth');
  assert.ok(baby.height > initialHeight, 'Grown armadillo has larger size');
  
  console.log('✓ Breeding and growth test passed');
}

/**
 * Test serialization and deserialization
 */
function testSerialization() {
  console.log('Testing serialization and deserialization...');
  
  const armadillo = new Armadillo({ x: 10, y: 64, z: 10 });
  
  // Set some custom state
  armadillo.isRolled = true;
  armadillo.rollCooldown = 50;
  armadillo.rollDuration = 100;
  armadillo.scuteGrowth = 45;
  armadillo.aiState = 'walking';
  
  // Serialize
  const serialized = armadillo.serialize();
  
  // Check serialized data
  assert.strictEqual(serialized.type, 'armadillo', 'Serialized data has correct type');
  assert.deepStrictEqual(serialized.position, { x: 10, y: 64, z: 10 }, 'Serialized data has correct position');
  assert.strictEqual(serialized.isRolled, true, 'Serialized data has correct roll state');
  assert.strictEqual(serialized.scuteGrowth, 45, 'Serialized data has correct scute growth');
  assert.strictEqual(serialized.aiState, 'walking', 'Serialized data has correct AI state');
  
  // Deserialize
  const newArmadillo = Armadillo.deserialize(serialized);
  
  // Check deserialized entity
  assert.strictEqual(newArmadillo.type, 'armadillo', 'Deserialized entity has correct type');
  assert.deepStrictEqual(newArmadillo.position, { x: 10, y: 64, z: 10 }, 'Deserialized entity has correct position');
  assert.strictEqual(newArmadillo.isRolled, true, 'Deserialized entity has correct roll state');
  assert.strictEqual(newArmadillo.scuteGrowth, 45, 'Deserialized entity has correct scute growth');
  assert.strictEqual(newArmadillo.aiState, 'walking', 'Deserialized entity has correct AI state');
  
  // Check that damage resistance is correctly restored for rolled armadillos
  assert.strictEqual(newArmadillo.damageResistance, 0.75, 'Damage resistance is restored for rolled armadillo');
  
  console.log('✓ Serialization test passed');
}

/**
 * Run all tests
 */
function runTests() {
  console.log('Starting Armadillo tests...');
  
  testArmadilloCreation();
  testRollingMechanism();
  testArmadilloAI();
  testScuteDropping();
  testBreedingAndGrowth();
  testSerialization();
  
  console.log('✓✓✓ All Armadillo tests passed successfully');
}

// Export test functions
module.exports = {
  testArmadilloCreation,
  testRollingMechanism,
  testArmadilloAI,
  testScuteDropping,
  testBreedingAndGrowth,
  testSerialization,
  runTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
} 