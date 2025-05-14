/**
 * Zoglin Implementation Test
 * Tests the Zoglin mob's functionality and interaction with Hoglin transformation
 */

const assert = require('assert');
const { Hoglin, Zoglin } = require('../mobs/netherMobs');
const MobBase = require('../mobs/mobBase');

// Mock world for testing
class MockWorld {
  constructor() {
    this.mobs = {};
    this.mobIdCounter = 0;
    this.events = [];
  }

  spawnMob(type, position) {
    let mob = null;
    
    if (type === 'zoglin') {
      mob = new Zoglin(position);
      mob.id = `zoglin_${this.mobIdCounter++}`;
      mob.world = this;
      this.mobs[mob.id] = mob;

      // Register event handlers
      mob.on = (event, data) => {
        this.events.push({ type: event, data });
      };
      mob.emit = (event, data) => {
        this.events.push({ type: event, data });
      };
    }
    
    return mob;
  }

  removeMob(id) {
    if (this.mobs[id]) {
      delete this.mobs[id];
      return true;
    }
    return false;
  }

  getBlockAt() {
    return null; // No blocks for this test
  }
}

// Test Runners
let currentSuite = null;

function describe(title, fn) {
  const suite = { title, suites: [], tests: [], beforeEachFn: null };
  if (fn) {
    currentSuite = suite;
    fn();
    currentSuite = null;
  }
  return suite;
}

describe.skip = (title, fn) => {};

function it(title, fn) {
  if (currentSuite) {
    currentSuite.tests.push({ title, run: fn });
  }
}

it.skip = (title, fn) => {};

function beforeEach(fn) {
  if (currentSuite) {
    currentSuite.beforeEachFn = fn;
  }
}

// Test Suites
let zoglin;
let mockWorld;
let testSuite;

// Define the test suite
testSuite = describe('Zoglin Tests', () => {
  beforeEach(() => {
    mockWorld = new MockWorld();
    zoglin = new Zoglin({ x: 0, y: 0, z: 0 });
    zoglin.id = 'zoglin_test';
    zoglin.world = mockWorld;
    zoglin.emit = (event, data) => {
      mockWorld.events.push({ type: event, data });
    };
  });

  it('should be an instance of MobBase', () => {
    assert(zoglin instanceof MobBase, 'Zoglin should be an instance of MobBase');
  });

  it('should have correct health values', () => {
    assert.equal(zoglin.health, 40, 'Health should be 40');
    assert.equal(zoglin.maxHealth, 40, 'Max health should be 40');
  });

  it('should have hostile properties', () => {
    assert.equal(zoglin.attackDamage, 6, 'Attack damage should be 6');
    assert.equal(zoglin.isNeutral, false, 'Should not be neutral');
    // Should be hostile to players, villagers, piglins, etc.
    assert(zoglin.hostileTo.includes('player'), 'Should be hostile to players');
    assert(zoglin.hostileTo.includes('villager'), 'Should be hostile to villagers');
    assert(zoglin.hostileTo.includes('piglin'), 'Should be hostile to piglins');
  });

  it('should be marked as undead', () => {
    assert.equal(zoglin.isUndead, true, 'Should be marked as undead');
  });

  it('should have different properties as a baby', () => {
    // Create a baby zoglin
    zoglin.isAdult = false;
    // Recalculate baby properties
    zoglin.deserialize({ isAdult: false });
    
    assert.equal(zoglin.maxHealth, 20, 'Baby max health should be 20');
    assert.equal(zoglin.attackDamage, 3, 'Baby attack damage should be 3');
    assert.equal(zoglin.scale, 0.5, 'Baby scale should be 0.5');
    assert.equal(zoglin.knockbackStrength, 0.75, 'Baby knockback strength should be 0.75');
  });

  it('should have attack cooldown', () => {
    assert.equal(zoglin.attackCooldown, 0, 'Initial cooldown should be 0');
    assert.equal(zoglin.maxAttackCooldown, 60, 'Max cooldown should be 60');
    
    // Mock attack
    const mockTarget = {
      id: 'player_1',
      position: { x: 1, y: 0, z: 1 },
      takeDamage: (amount, source) => {
        return { damage: amount, alive: true };
      },
      applyKnockback: () => {}
    };
    
    zoglin.attack(mockTarget);
    assert(zoglin.attackCooldown > 0, 'Cooldown should be activated after attack');
  });

  it('should handle undead damage types correctly', () => {
    // Regular damage
    const regularDamageResult = zoglin.takeDamage(10, { type: 'physical' });
    assert.equal(regularDamageResult.damage, 10, 'Regular damage should be normal');
    
    // Healing effect should harm
    const healingDamageResult = zoglin.takeDamage(5, { type: 'effect', effect: 'instant_health' });
    assert.equal(healingDamageResult.damage, 10, 'Healing effect should do double damage');
    
    // Harming effect should heal (do nothing)
    const harmingDamageResult = zoglin.takeDamage(5, { type: 'effect', effect: 'instant_damage' });
    assert.equal(harmingDamageResult.damage, 0, 'Harming effect should do no damage');
  });

  it('should be created when a Hoglin is transformed', () => {
    // Create a mock hoglin
    const hoglin = new Hoglin({ x: 10, y: 0, z: 10 });
    hoglin.id = 'hoglin_test';
    hoglin.health = 30; // Set health below max
    hoglin.world = mockWorld;
    
    // Transform hoglin to zoglin
    hoglin.transformToZoglin();
    
    // Check if a zoglin was spawned
    const zoglins = Object.values(mockWorld.mobs).filter(mob => mob instanceof Zoglin);
    assert.equal(zoglins.length, 1, 'Should spawn one zoglin');
    
    // Check if properties were transferred
    const newZoglin = zoglins[0];
    assert.equal(newZoglin.health, 30, 'Health should be transferred');
    assert.equal(newZoglin.position.x, 10, 'Position X should be transferred');
    assert.equal(newZoglin.position.z, 10, 'Position Z should be transferred');
    
    // Check if hoglin was removed
    assert(!mockWorld.mobs['hoglin_test'], 'Original hoglin should be removed');
  });

  it('should properly serialize its state', () => {
    zoglin.attackCooldown = 30;
    
    const serialized = zoglin.serialize();
    
    assert.equal(serialized.type, 'zoglin', 'Type should be zoglin');
    assert.equal(serialized.isAdult, true, 'IsAdult should be serialized');
    assert.equal(serialized.attackCooldown, 30, 'AttackCooldown should be serialized');
  });

  it('should properly deserialize state', () => {
    const data = {
      isAdult: false,
      attackCooldown: 45,
      health: 15
    };
    
    zoglin.deserialize(data);
    
    assert.equal(zoglin.isAdult, false, 'IsAdult should be deserialized');
    assert.equal(zoglin.attackCooldown, 45, 'AttackCooldown should be deserialized');
    assert.equal(zoglin.health, 15, 'Health should be deserialized');
    assert.equal(zoglin.maxHealth, 20, 'MaxHealth should be adjusted for baby');
    assert.equal(zoglin.scale, 0.5, 'Scale should be adjusted for baby');
  });
});

// Export test functions
module.exports = {
  runTests: function() {
    console.log('Running Zoglin Tests...');
    let passedTests = 0;
    let failedTests = 0;
    
    // Run all tests in the test suite
    console.log(`\n${testSuite.title}:`);
    
    for (const test of testSuite.tests) {
      try {
        if (testSuite.beforeEachFn) {
          testSuite.beforeEachFn();
        }
        test.run();
        passedTests++;
        console.log(`  ✓ ${test.title}`);
      } catch (error) {
        failedTests++;
        console.log(`  ✗ ${test.title}`);
        console.log(`    ${error.message}`);
        console.log(`    ${error.stack}`);
      }
    }
    
    const totalTests = passedTests + failedTests;
    console.log(`\n${passedTests}/${totalTests} tests passed.`);
    
    return failedTests === 0;
  }
};

// For direct script execution
if (require.main === module) {
  const success = module.exports.runTests();
  process.exit(success ? 0 : 1);
} 