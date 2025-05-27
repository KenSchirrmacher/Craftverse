/**
 * Tests for Mace weapon implementation
 * Tests weapon properties, heavy attacks, armor piercing, and damage calculations
 */

const assert = require('assert');
const { 
  MaceItem, 
  WoodenMaceItem, 
  StoneMaceItem, 
  IronMaceItem, 
  GoldenMaceItem, 
  DiamondMaceItem, 
  NetheriteMaceItem 
} = require('../items/maceItem');
const CombatManager = require('../combat/combatManager');
const Player = require('../entities/player');
const Entity = require('../entities/entity');
const World = require('../world/world');

console.log('Running Mace Weapon Tests...');

// Test world implementation
class TestWorld extends World {
  constructor() {
    super();
    this.blocks = new Map();
  }
  
  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks.get(key) || { type: 'air', isSolid: false };
  }
  
  setBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    this.blocks.set(key, block);
  }
}

// Test player implementation
class TestPlayer extends Player {
  constructor(id = 'player1') {
    super(id);
    this.health = 20;
    this.maxHealth = 20;
    this.inventory = [];
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.cooldowns = {};
    this.heavyAttackCharging = null;
    this.heavyAttackCooldown = null;
  }
  
  getLookDirection() {
    return { x: 0, y: 0, z: 1 };
  }
}

// Test target implementation
class TestTarget extends Entity {
  constructor(id = 'target1') {
    super(id);
    this.health = 20;
    this.maxHealth = 20;
    this.armor = 0;
    this.position = { x: 0, y: 0, z: 0 };
  }
}

// Run tests
try {
  run();
  console.log('\n✅ ALL TESTS PASSED: Mace Weapon tests completed successfully');
} catch (err) {
  console.error('\n❌ TEST FAILED:', err.message);
  throw err;
}

function run() {
  // Basic Properties Tests
  console.log('\nTesting: Basic Properties');
  testBasicProperties();
  console.log('- Basic properties tests passed');
  
  // Heavy Attack Tests
  console.log('\nTesting: Heavy Attack');
  testHeavyAttack();
  console.log('- Heavy attack tests passed');
  
  // Armor Piercing Tests
  console.log('\nTesting: Armor Piercing');
  testArmorPiercing();
  console.log('- Armor piercing tests passed');
  
  // Durability Tests
  console.log('\nTesting: Durability');
  testDurability();
  console.log('- Durability tests passed');
  
  // Netherite Special Properties Tests
  console.log('\nTesting: Netherite Special Properties');
  testNetheriteProperties();
  console.log('- Netherite special properties tests passed');
  
  // Combat Manager Integration Tests
  console.log('\nTesting: Combat Manager Integration');
  testCombatManagerIntegration();
  console.log('- Combat manager integration tests passed');
  
  // Serialization Tests
  console.log('\nTesting: Serialization');
  testSerialization();
  console.log('- Serialization tests passed');
}

function testBasicProperties() {
  // Test basic mace properties
  const mace = new MaceItem();
  assert.strictEqual(mace.id, 'mace', 'id should match');
  assert.strictEqual(mace.type, 'mace', 'type should match');
  assert.strictEqual(mace.subtype, 'weapon', 'subtype should match');
  assert.strictEqual(mace.category, 'combat', 'category should match');
  assert.strictEqual(mace.stackable, false, 'stackable should be false');
  assert.strictEqual(mace.maxStackSize, 1, 'maxStackSize should be 1');
  assert.strictEqual(typeof mace.attackDamage, 'number', 'attackDamage should be a number');
  assert.strictEqual(typeof mace.attackSpeed, 'number', 'attackSpeed should be a number');
  assert.strictEqual(typeof mace.heavyAttackMultiplier, 'number', 'heavyAttackMultiplier should be a number');
  assert.strictEqual(typeof mace.armorPiercingPercent, 'number', 'armorPiercingPercent should be a number');
  
  // Test attack damage by material
  const woodenMace = new WoodenMaceItem();
  const stoneMace = new StoneMaceItem();
  const ironMace = new IronMaceItem();
  const goldenMace = new GoldenMaceItem();
  const diamondMace = new DiamondMaceItem();
  const netheriteMace = new NetheriteMaceItem();
  
  assert.strictEqual(woodenMace.attackDamage, 5, 'wooden mace damage should be 5');
  assert.strictEqual(stoneMace.attackDamage, 6, 'stone mace damage should be 6');
  assert.strictEqual(ironMace.attackDamage, 7, 'iron mace damage should be 7');
  assert.strictEqual(goldenMace.attackDamage, 5, 'golden mace damage should be 5');
  assert.strictEqual(diamondMace.attackDamage, 8, 'diamond mace damage should be 8');
  assert.strictEqual(netheriteMace.attackDamage, 9, 'netherite mace damage should be 9');
  
  // Test durability by material
  assert.strictEqual(woodenMace.durability, 59, 'wooden mace durability should be 59');
  assert.strictEqual(stoneMace.durability, 131, 'stone mace durability should be 131');
  assert.strictEqual(ironMace.durability, 250, 'iron mace durability should be 250');
  assert.strictEqual(diamondMace.durability, 1561, 'diamond mace durability should be 1561');
  assert.strictEqual(netheriteMace.durability, 2031, 'netherite mace durability should be 2031');
  
  // Test armor piercing by material
  assert.strictEqual(woodenMace.armorPiercingPercent, 20, 'wooden mace armor piercing should be 20%');
  assert.strictEqual(stoneMace.armorPiercingPercent, 25, 'stone mace armor piercing should be 25%');
  assert.strictEqual(ironMace.armorPiercingPercent, 30, 'iron mace armor piercing should be 30%');
  assert.strictEqual(diamondMace.armorPiercingPercent, 35, 'diamond mace armor piercing should be 35%');
  assert.strictEqual(netheriteMace.armorPiercingPercent, 40, 'netherite mace armor piercing should be 40%');
  
  // Test heavy attack multiplier
  assert.strictEqual(ironMace.heavyAttackMultiplier, 2.5, 'heavy attack multiplier should be 2.5');
}

function testHeavyAttack() {
  const mace = new IronMaceItem();
  const player = new TestPlayer();
  const target = new TestTarget();
  
  // Test start charging
  const chargeData = mace.startHeavyAttackCharge(player);
  assert.ok(player.heavyAttackCharging, 'should start charging');
  assert.strictEqual(player.heavyAttackCharging.itemId, mace.id, 'charging itemId should match');
  assert.strictEqual(player.heavyAttackCharging.chargeTicks, 0, 'chargeTicks should start at 0');
  assert.strictEqual(player.heavyAttackCharging.maxChargeTicks, mace.heavyAttackChargeTicks, 'maxChargeTicks should match');
  assert.strictEqual(player.heavyAttackCharging.ready, false, 'ready should start as false');
  
  // Test update charging with less than required ticks
  const partialCharge = mace.updateHeavyAttackCharge(player, 10);
  assert.strictEqual(partialCharge.chargeTicks, 10, 'chargeTicks should update correctly');
  assert.strictEqual(partialCharge.ready, false, 'ready should still be false after partial charge');
  
  // Test trying to release before fully charged
  const failedAttack = mace.releaseHeavyAttack(player, target);
  assert.strictEqual(failedAttack, null, 'release should fail if not fully charged');
  
  // Test update to full charge
  const fullCharge = mace.updateHeavyAttackCharge(player, mace.heavyAttackChargeTicks);
  assert.strictEqual(fullCharge.ready, true, 'ready should be true after full charge');
  
  // Test successful release
  const successfulAttack = mace.releaseHeavyAttack(player, target);
  assert.ok(successfulAttack, 'release should succeed when fully charged');
  assert.strictEqual(successfulAttack.damage, mace.attackDamage * mace.heavyAttackMultiplier, 'damage should be multiplied');
  assert.strictEqual(successfulAttack.armorPiercing, mace.armorPiercingPercent / 100, 'armor piercing should be applied');
  assert.strictEqual(successfulAttack.isCritical, true, 'attack should be critical');
  assert.strictEqual(successfulAttack.heavyAttack, true, 'should be marked as heavy attack');
  
  // Test charging state is cleared
  assert.strictEqual(player.heavyAttackCharging, null, 'charging state should be cleared after release');
  
  // Test cooldown is set
  assert.ok(player.heavyAttackCooldown, 'cooldown should be set after release');
  assert.strictEqual(player.heavyAttackCooldown.itemId, mace.id, 'cooldown itemId should match');
  assert.strictEqual(player.heavyAttackCooldown.ticksRemaining, mace.heavyAttackCooldownTicks, 'cooldown ticks should match');
  
  // Test falling damage bonus
  const fallingPlayer = new TestPlayer();
  fallingPlayer.velocity.y = -2.0;
  
  mace.startHeavyAttackCharge(fallingPlayer);
  mace.updateHeavyAttackCharge(fallingPlayer, mace.heavyAttackChargeTicks + 5);
  const fallingAttack = mace.releaseHeavyAttack(fallingPlayer, target);
  
  assert.ok(fallingAttack.additionalFallDamage > 0, 'falling attack should have additional damage');
  assert.strictEqual(fallingAttack.damage, 
    (mace.attackDamage * mace.heavyAttackMultiplier) + fallingAttack.additionalFallDamage, 
    'total damage should include fall damage');
}

function testArmorPiercing() {
  const mace = new IronMaceItem();
  const player = new TestPlayer();
  const target = new TestTarget();
  
  // Test regular attack armor piercing (half effect)
  const regularAttack = mace.attack(player, target);
  assert.strictEqual(regularAttack.armorPiercing, mace.armorPiercingPercent / 200, 'regular attack should have half armor piercing');
  
  // Test heavy attack armor piercing (full effect)
  mace.startHeavyAttackCharge(player);
  mace.updateHeavyAttackCharge(player, mace.heavyAttackChargeTicks + 5);
  const heavyAttack = mace.releaseHeavyAttack(player, target);
  
  assert.strictEqual(heavyAttack.armorPiercing, mace.armorPiercingPercent / 100, 'heavy attack should have full armor piercing');
}

function testDurability() {
  const mace = new IronMaceItem();
  const player = new TestPlayer();
  const target = new TestTarget();
  
  const initialDurability = mace.durability;
  
  // Test regular attack durability loss
  mace.attack(player, target);
  assert.strictEqual(mace.durability, initialDurability - 1, 'regular attack should reduce durability by 1');
  
  // Test heavy attack durability loss
  mace.startHeavyAttackCharge(player);
  mace.updateHeavyAttackCharge(player, mace.heavyAttackChargeTicks + 5);
  mace.releaseHeavyAttack(player, target);
  
  assert.strictEqual(mace.durability, initialDurability - 3, 'heavy attack should reduce durability by 2 (total 3)');
  
  // Test manual damage method
  const durabilityMace = new IronMaceItem();
  const startDurability = durabilityMace.durability;
  
  durabilityMace.damage(5);
  assert.strictEqual(durabilityMace.durability, startDurability - 5, 'damage method should reduce durability by specified amount');
}

function testNetheriteProperties() {
  const netheriteMace = new NetheriteMaceItem();
  
  // Test fire resistance
  assert.strictEqual(netheriteMace.isFireResistant(), true, 'netherite mace should be fire resistant');
  
  // Test floating in lava
  assert.strictEqual(netheriteMace.floatsInLava(), true, 'netherite mace should float in lava');
  
  // Test other maces don't behave like netherite maces
  const diamondMace = new DiamondMaceItem();
  assert.strictEqual(diamondMace.isFireResistant && diamondMace.isFireResistant(), false, 'diamond mace should not be fire resistant');
  assert.strictEqual(diamondMace.floatsInLava && diamondMace.floatsInLava(), false, 'diamond mace should not float in lava');
}

function testCombatManagerIntegration() {
  const combatManager = new CombatManager();
  const mace = new IronMaceItem();
  const playerId = 'player1';
  const targetId = 'target1';
  
  // Initialize the combat manager's cooldown maps
  if (!combatManager.heavyAttackCooldowns) {
    combatManager.heavyAttackCooldowns = new Map();
  }
  if (!combatManager.heavyAttackCharges) {
    combatManager.heavyAttackCharges = new Map();
  }
  
  // Test starting charge
  const chargeData = combatManager.startHeavyAttackCharge(playerId, mace.id);
  assert.ok(chargeData, 'combat manager should start charging');
  assert.strictEqual(chargeData.itemId, mace.id, 'charging itemId should match');
  
  // Test getting charge info
  const chargeInfo = combatManager.getHeavyAttackCharge(playerId);
  assert.ok(chargeInfo, 'combat manager should return charge info');
  
  // Since we can't easily test events without a real server, we'll just verify the charge is tracked
  assert.ok(combatManager.heavyAttackCharges.has(playerId), 'combat manager should track the charge');
  
  // Manually set the charge to ready
  const charge = combatManager.heavyAttackCharges.get(playerId);
  charge.ready = true;
  
  // Test releasing attack
  const attackResult = combatManager.releaseHeavyAttack(playerId, targetId, {
    damage: mace.attackDamage,
    damageMultiplier: mace.heavyAttackMultiplier,
    knockbackMultiplier: mace.knockbackMultiplier,
    armorPiercing: mace.armorPiercingPercent / 100,
    itemId: mace.id
  });
  
  assert.ok(attackResult, 'combat manager should release attack');
  assert.strictEqual(attackResult.finalDamage, mace.attackDamage * mace.heavyAttackMultiplier, 'damage calculation should match');
  
  // Verify cooldown is active
  assert.ok(combatManager.heavyAttackCooldowns.has(playerId), 'combat manager should track cooldown');
  const cooldown = combatManager.heavyAttackCooldowns.get(playerId);
  assert.strictEqual(cooldown.itemId, mace.id, 'cooldown itemId should match');
}

function testSerialization() {
  const mace = new DiamondMaceItem();
  
  // Reduce durability
  mace.damage(10);
  
  // Serialize
  const serialized = mace.toJSON();
  assert.strictEqual(typeof serialized, 'object', 'serialized data should be an object');
  assert.strictEqual(serialized.id, mace.id, 'serialized id should match');
  assert.strictEqual(serialized.durability, mace.durability, 'serialized durability should match');
  assert.strictEqual(serialized.armorPiercingPercent, mace.armorPiercingPercent, 'serialized armorPiercingPercent should match');
  
  // Deserialize
  const deserialized = DiamondMaceItem.fromJSON(serialized);
  assert.strictEqual(deserialized.id, mace.id, 'deserialized id should match');
  assert.strictEqual(deserialized.attackDamage, mace.attackDamage, 'deserialized attackDamage should match');
  assert.strictEqual(deserialized.durability, mace.durability, 'deserialized durability should match');
  assert.strictEqual(deserialized.armorPiercingPercent, mace.armorPiercingPercent, 'deserialized armorPiercingPercent should match');
  assert.strictEqual(deserialized.heavyAttackMultiplier, mace.heavyAttackMultiplier, 'deserialized heavyAttackMultiplier should match');
} 