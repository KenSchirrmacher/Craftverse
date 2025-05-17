/**
 * Ominous Bottle Test - Tests for the Ominous Bottle item
 * Part of the 1.22 Sorcery Update
 */

const assert = require('assert');
const OminousBottleItem = require('../items/ominousBottleItem');

// Mock classes
class MockPlayer {
  constructor(id = 'player1') {
    this.id = id;
    this.inventory = {
      addItem: (item) => true,
      removeItem: (itemId) => true
    };
    this.statusEffects = {};
  }
  
  addStatusEffect(type, level, duration) {
    this.statusEffects[type] = { level: level, duration, active: true };
    return true;
  }
  
  hasStatusEffect(type) {
    return this.statusEffects[type] && this.statusEffects[type].active;
  }
  
  getStatusEffectLevel(type) {
    return this.statusEffects[type] ? this.statusEffects[type].level : 0;
  }
  
  removeStatusEffect(type) {
    if (this.statusEffects[type]) {
      this.statusEffects[type].active = false;
    }
    return true;
  }
}

class MockRaidCaptain {
  constructor(type, carryingBanner = true, level = 1) {
    this.id = 'enemy1';
    this.type = type;
    this.carryingBanner = carryingBanner;
    this.badOmenLevel = level;
  }
  
  getBadOmenLevel() {
    return this.badOmenLevel;
  }
}

/**
 * Test basic ominous bottle creation
 */
function testOminousBottleCreation() {
  console.log('Testing ominous bottle creation...');
  
  // Test empty bottle
  const emptyBottle = new OminousBottleItem();
  assert.strictEqual(emptyBottle.id, 'ominous_bottle', 'Empty bottle has correct ID');
  assert.strictEqual(emptyBottle.name, 'Ominous Bottle', 'Empty bottle has correct name');
  assert.strictEqual(emptyBottle.type, 'ominous_bottle', 'Empty bottle has correct type');
  assert.strictEqual(emptyBottle.subtype, 'potion', 'Empty bottle has correct subtype');
  assert.strictEqual(emptyBottle.category, 'brewing', 'Empty bottle has correct category');
  assert.strictEqual(emptyBottle.stackable, true, 'Empty bottle is stackable');
  assert.strictEqual(emptyBottle.maxStackSize, 16, 'Empty bottle has correct max stack size');
  assert.strictEqual(emptyBottle.filled, false, 'Empty bottle is not filled initially');
  assert.strictEqual(emptyBottle.capturedEffect, null, 'Empty bottle has no captured effect');
  assert.strictEqual(emptyBottle.capturedFrom, null, 'Empty bottle has no capture source');
  
  // Test filled bottle
  const filledBottle = new OminousBottleItem({ 
    filled: true,
    capturedFrom: 'pillager'
  });
  assert.strictEqual(filledBottle.filled, true, 'Filled bottle is marked as filled');
  assert.notStrictEqual(filledBottle.capturedEffect, null, 'Filled bottle has a captured effect');
  assert.strictEqual(filledBottle.capturedEffect.type, 'bad_omen', 'Filled bottle has bad omen effect');
  assert.strictEqual(filledBottle.capturedEffect.level, 1, 'Filled bottle has level 1 effect');
  assert.strictEqual(filledBottle.capturedEffect.duration, 6000, 'Filled bottle has correct duration');
  assert.strictEqual(filledBottle.capturedFrom, 'pillager', 'Filled bottle has correct capture source');
  
  console.log('✓ Ominous bottle creation tests passed');
}

/**
 * Test capturing Bad Omen effect from raid captains
 */
function testCapturingBadOmen() {
  console.log('Testing capturing Bad Omen from raid captains...');
  
  const player = new MockPlayer();
  const bottle = new OminousBottleItem();
  
  // Test capturing from pillager with banner
  const pillager = new MockRaidCaptain('pillager', true, 1);
  const context = { target: pillager };
  
  const captured = bottle.use(player, context);
  assert.strictEqual(captured, true, 'Successfully captured from pillager with banner');
  assert.strictEqual(bottle.filled, true, 'Bottle is now filled');
  assert.strictEqual(bottle.capturedEffect.type, 'bad_omen', 'Captured effect is bad omen');
  assert.strictEqual(bottle.capturedEffect.level, 1, 'Captured effect has correct level');
  assert.strictEqual(bottle.capturedFrom, 'pillager', 'Captured from correct source');
  
  // Test capturing from pillager without banner
  const bottle2 = new OminousBottleItem();
  const pillagerNoBanner = new MockRaidCaptain('pillager', false, 1);
  const context2 = { target: pillagerNoBanner };
  
  const captured2 = bottle2.use(player, context2);
  assert.strictEqual(captured2, false, 'Cannot capture from pillager without banner');
  assert.strictEqual(bottle2.filled, false, 'Bottle remains empty');
  
  // Test capturing from vindicator
  const bottle3 = new OminousBottleItem();
  const vindicator = new MockRaidCaptain('vindicator', false, 2);
  const context3 = { target: vindicator };
  
  const captured3 = bottle3.use(player, context3);
  assert.strictEqual(captured3, true, 'Successfully captured from vindicator');
  assert.strictEqual(bottle3.filled, true, 'Bottle is now filled');
  assert.strictEqual(bottle3.capturedEffect.level, 2, 'Captured effect has correct level (2)');
  assert.strictEqual(bottle3.capturedFrom, 'vindicator', 'Captured from correct source');
  
  // Test capturing from non-raid captain
  const bottle4 = new OminousBottleItem();
  const zombie = { id: 'enemy2', type: 'zombie' };
  const context4 = { target: zombie };
  
  const captured4 = bottle4.use(player, context4);
  assert.strictEqual(captured4, false, 'Cannot capture from non-raid captain');
  assert.strictEqual(bottle4.filled, false, 'Bottle remains empty');
  
  // Test capturing with already filled bottle
  const filledBottle = new OminousBottleItem({ filled: true });
  const context5 = { target: pillager };
  
  const captured5 = filledBottle.use(player, context5);
  assert.strictEqual(captured5, false, 'Cannot capture with already filled bottle');
  
  console.log('✓ Capturing Bad Omen tests passed');
}

/**
 * Test applying Bad Omen effect to players
 */
function testApplyingBadOmen() {
  console.log('Testing applying Bad Omen effect to players...');
  
  const player = new MockPlayer();
  
  // Test applying from filled bottle
  const filledBottle = new OminousBottleItem({ 
    filled: true,
    capturedEffect: { type: 'bad_omen', level: 2, duration: 6000 },
    capturedFrom: 'vindicator'
  });
  
  const applied = filledBottle.applyEffect(player);
  
  assert.strictEqual(applied, true, 'Successfully applied effect');
  assert.strictEqual(player.hasStatusEffect('bad_omen'), true, 'Player has bad omen effect');
  assert.strictEqual(player.getStatusEffectLevel('bad_omen'), 2, 'Player has correct effect level');
  assert.strictEqual(filledBottle.filled, false, 'Bottle is now empty');
  assert.strictEqual(filledBottle.capturedEffect, null, 'Bottle no longer has captured effect');
  
  // Test applying from empty bottle
  const emptyBottle = new OminousBottleItem();
  const applied2 = emptyBottle.applyEffect(player);
  assert.strictEqual(applied2, false, 'Cannot apply from empty bottle');
  
  console.log('✓ Applying Bad Omen tests passed');
}

/**
 * Test tooltip and client data
 */
function testTooltipAndClientData() {
  console.log('Testing tooltip and client data...');
  
  // Test empty bottle tooltip
  const emptyBottle = new OminousBottleItem();
  const emptyTooltip = emptyBottle.getTooltip();
  assert.ok(Array.isArray(emptyTooltip), 'Tooltip is an array');
  assert.ok(emptyTooltip.length > 1, 'Empty bottle tooltip has multiple lines');
  assert.ok(emptyTooltip.some(line => line.includes('Empty')), 'Empty bottle tooltip mentions "Empty"');
  
  // Test filled bottle tooltip
  const filledBottle = new OminousBottleItem({ 
    filled: true,
    capturedEffect: { type: 'bad_omen', level: 3, duration: 6000 },
    capturedFrom: 'evoker'
  });
  
  const filledTooltip = filledBottle.getTooltip();
  assert.ok(filledTooltip.some(line => line.includes('Contains: Bad Omen')), 'Filled bottle tooltip mentions effect');
  assert.ok(filledTooltip.some(line => line.includes('Level 3')), 'Filled bottle tooltip mentions level');
  assert.ok(filledTooltip.some(line => line.includes('evoker')), 'Filled bottle tooltip mentions source');
  
  // Test client data
  const emptyClientData = emptyBottle.getClientData();
  assert.strictEqual(emptyClientData.filled, false, 'Empty bottle client data shows not filled');
  assert.strictEqual(emptyClientData.glowing, false, 'Empty bottle is not glowing');
  assert.strictEqual(emptyClientData.texture, 'ominous_bottle', 'Empty bottle has correct texture');
  
  const filledClientData = filledBottle.getClientData();
  assert.strictEqual(filledClientData.filled, true, 'Filled bottle client data shows filled');
  assert.strictEqual(filledClientData.glowing, true, 'Filled bottle is glowing');
  assert.strictEqual(filledClientData.texture, 'ominous_bottle_filled', 'Filled bottle has correct texture');
  
  console.log('✓ Tooltip and client data tests passed');
}

/**
 * Test serialization
 */
function testSerialization() {
  console.log('Testing serialization...');
  
  // Test serializing empty bottle
  const emptyBottle = new OminousBottleItem();
  const emptyData = emptyBottle.toJSON();
  
  assert.strictEqual(emptyData.id, 'ominous_bottle', 'Serialized empty bottle has correct ID');
  assert.strictEqual(emptyData.filled, false, 'Serialized empty bottle is not filled');
  assert.strictEqual(emptyData.capturedEffect, null, 'Serialized empty bottle has no effect');
  assert.strictEqual(emptyData.capturedFrom, null, 'Serialized empty bottle has no source');
  
  // Test serializing filled bottle
  const filledBottle = new OminousBottleItem({ 
    filled: true,
    capturedEffect: { type: 'bad_omen', level: 2, duration: 6000 },
    capturedFrom: 'ravager'
  });
  
  const filledData = filledBottle.toJSON();
  assert.strictEqual(filledData.id, 'ominous_bottle', 'Serialized filled bottle has correct ID');
  assert.strictEqual(filledData.filled, true, 'Serialized filled bottle is filled');
  assert.strictEqual(filledData.capturedEffect.type, 'bad_omen', 'Serialized filled bottle has correct effect');
  assert.strictEqual(filledData.capturedEffect.level, 2, 'Serialized filled bottle has correct level');
  assert.strictEqual(filledData.capturedFrom, 'ravager', 'Serialized filled bottle has correct source');
  
  // Test deserializing empty bottle
  const deserializedEmpty = OminousBottleItem.fromJSON(emptyData);
  assert.strictEqual(deserializedEmpty.id, 'ominous_bottle', 'Deserialized empty bottle has correct ID');
  assert.strictEqual(deserializedEmpty.filled, false, 'Deserialized empty bottle is not filled');
  assert.strictEqual(deserializedEmpty.capturedEffect, null, 'Deserialized empty bottle has no effect');
  
  // Test deserializing filled bottle
  const deserializedFilled = OminousBottleItem.fromJSON(filledData);
  assert.strictEqual(deserializedFilled.id, 'ominous_bottle', 'Deserialized filled bottle has correct ID');
  assert.strictEqual(deserializedFilled.filled, true, 'Deserialized filled bottle is filled');
  assert.strictEqual(deserializedFilled.capturedEffect.type, 'bad_omen', 'Deserialized filled bottle has correct effect');
  assert.strictEqual(deserializedFilled.capturedEffect.level, 2, 'Deserialized filled bottle has correct level');
  assert.strictEqual(deserializedFilled.capturedFrom, 'ravager', 'Deserialized filled bottle has correct source');
  
  console.log('✓ Serialization tests passed');
}

/**
 * Run all tests
 */
function runTests() {
  console.log('Starting Ominous Bottle tests...');
  
  testOminousBottleCreation();
  testCapturingBadOmen();
  testApplyingBadOmen();
  testTooltipAndClientData();
  testSerialization();
  
  console.log('✓✓✓ All Ominous Bottle tests passed successfully');
}

// Export test functions
module.exports = {
  testOminousBottleCreation,
  testCapturingBadOmen,
  testApplyingBadOmen,
  testTooltipAndClientData,
  testSerialization,
  runTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
} 