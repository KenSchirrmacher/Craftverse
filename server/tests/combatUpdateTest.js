/**
 * Combat Update Test - Tests for new combat mechanics
 */

const assert = require('assert');
const CombatManager = require('../combat/combatManager');
const { SpecialArrow, ArrowType } = require('../items/specialArrows');
const events = require('events');

class MockStatusEffectsManager {
  constructor() {
    this.effects = new Map();
  }
  
  addEffect(entityId, effectId, level, duration) {
    if (!this.effects.has(entityId)) {
      this.effects.set(entityId, new Map());
    }
    
    this.effects.get(entityId).set(effectId, { level, duration });
  }
  
  getEffect(entityId, effectId) {
    if (!this.effects.has(entityId)) return null;
    return this.effects.get(entityId).get(effectId) || null;
  }
  
  hasEffect(entityId, effectId) {
    return this.getEffect(entityId, effectId) !== null;
  }
}

class MockPotionRegistry {
  constructor() {
    this.potions = {
      'poison': {
        type: 'poison',
        effects: [
          { id: 'poison', level: 1, duration: 200 }
        ]
      },
      'strength': {
        type: 'strength',
        effects: [
          { id: 'strength', level: 1, duration: 400 }
        ]
      }
    };
  }
  
  getPotionByType(type) {
    return this.potions[type] || null;
  }
}

class CombatUpdateTest {
  constructor() {
    this.statusEffectsManager = new MockStatusEffectsManager();
    this.combatManager = new CombatManager({ 
      server: new events.EventEmitter(),
      statusEffectsManager: this.statusEffectsManager
    });
    this.potionRegistry = new MockPotionRegistry();
  }
  
  /**
   * Run all combat update tests
   */
  runTests() {
    console.log('Running Combat Update tests...');
    
    this.testAttackCooldown();
    this.testWeaponCooldowns();
    this.testDamageMultipliers();
    this.testOffhandItems();
    this.testShieldBlocking();
    this.testShieldDisabling();
    this.testTippedArrows();
    this.testSpectralArrows();
    
    console.log('All Combat Update tests passed!');
  }
  
  /**
   * Test basic attack cooldown system
   */
  testAttackCooldown() {
    console.log('Testing attack cooldown system...');
    
    const playerId = 'player1';
    const itemId = 'diamond_sword';
    
    // Start a cooldown
    const cooldownTicks = this.combatManager.startAttackCooldown(playerId, itemId);
    
    // Verify cooldown was created
    const cooldown = this.combatManager.getAttackCooldown(playerId);
    assert(cooldown, 'Should have created a cooldown');
    assert.equal(cooldown.maxTicks, cooldownTicks, 'Cooldown max ticks should match');
    assert(cooldown.remainingTicks > 0, 'Cooldown should have positive remaining ticks');
    
    // Simulate a tick
    this.combatManager.tick(50); // 50ms = 1 tick
    
    // Verify cooldown was reduced
    const updatedCooldown = this.combatManager.getAttackCooldown(playerId);
    assert(updatedCooldown, 'Cooldown should still exist');
    assert(updatedCooldown.remainingTicks < cooldown.remainingTicks, 'Cooldown should have decreased');
    
    // Reset cooldowns for next test
    this.combatManager.resetAllCooldowns();
    
    console.log('Attack cooldown test passed!');
  }
  
  /**
   * Test different weapon cooldowns
   */
  testWeaponCooldowns() {
    console.log('Testing weapon cooldowns...');
    
    // Verify different weapons have different cooldowns
    const swordCooldown = this.combatManager.getWeaponCooldown('diamond_sword');
    const axeCooldown = this.combatManager.getWeaponCooldown('diamond_axe');
    
    assert(axeCooldown > swordCooldown, 'Axes should have longer cooldown than swords');
    
    // Test haste effect reducing cooldown
    const playerId = 'player1';
    
    // Add haste effect
    this.statusEffectsManager.addEffect(playerId, 'haste', 1, 100);
    
    // Start cooldown with haste
    const withHasteCooldown = this.combatManager.startAttackCooldown(playerId, 'diamond_sword');
    
    // Remove effect and test again
    this.statusEffectsManager.effects.get(playerId).delete('haste');
    const normalCooldown = this.combatManager.startAttackCooldown(playerId, 'diamond_sword');
    
    assert(withHasteCooldown < normalCooldown, 'Haste should reduce cooldown time');
    
    // Reset cooldowns for next test
    this.combatManager.resetAllCooldowns();
    
    console.log('Weapon cooldowns test passed!');
  }
  
  /**
   * Test damage multipliers based on cooldown progress
   */
  testDamageMultipliers() {
    console.log('Testing damage multipliers...');
    
    const playerId = 'player1';
    const itemId = 'diamond_sword';
    
    // Start a cooldown
    this.combatManager.startAttackCooldown(playerId, itemId);
    
    // Get initial multiplier (should be low)
    const initialMultiplier = this.combatManager.getDamageMultiplier(playerId);
    
    // Let cooldown almost complete
    for (let i = 0; i < 9; i++) {
      this.combatManager.tick(50); // 450ms = 9 ticks
    }
    
    // Get nearly complete multiplier (should be high)
    const laterMultiplier = this.combatManager.getDamageMultiplier(playerId);
    
    // Verify multipliers
    assert(initialMultiplier < laterMultiplier, 'Damage multiplier should increase as cooldown progresses');
    assert(initialMultiplier < 0.5, 'Initial multiplier should be low');
    assert(laterMultiplier > 0.8, 'Later multiplier should be high');
    
    // Reset cooldowns for next test
    this.combatManager.resetAllCooldowns();
    
    console.log('Damage multipliers test passed!');
  }
  
  /**
   * Test offhand items
   */
  testOffhandItems() {
    console.log('Testing offhand items...');
    
    const playerId = 'player1';
    const shield = { id: 'shield', durability: 100 };
    
    // Set offhand item
    this.combatManager.setOffhandItem(playerId, shield);
    
    // Verify item was set
    const offhandItem = this.combatManager.getOffhandItem(playerId);
    assert(offhandItem, 'Should have set offhand item');
    assert.equal(offhandItem.id, shield.id, 'Offhand item should match');
    
    console.log('Offhand items test passed!');
  }
  
  /**
   * Test shield blocking
   */
  testShieldBlocking() {
    console.log('Testing shield blocking...');
    
    const playerId = 'player1';
    const shield = { id: 'shield', durability: 100 };
    
    // Set offhand item and activate shield
    this.combatManager.setOffhandItem(playerId, shield);
    this.combatManager.activateShield(playerId, shield);
    
    // Verify shield is active
    assert(this.combatManager.isShieldActive(playerId), 'Shield should be active');
    
    // Test blocking damage
    const incomingDamage = 10;
    const blockResult = this.combatManager.handleShieldBlock(playerId, incomingDamage);
    
    // Verify damage reduction
    assert(blockResult.blocked, 'Attack should have been blocked');
    assert(blockResult.damage < incomingDamage, 'Damage should be reduced');
    
    // Verify shield durability loss
    const updatedOffhand = this.combatManager.getOffhandItem(playerId);
    assert(updatedOffhand.durability < shield.durability, 'Shield should lose durability');
    
    // Deactivate shield
    this.combatManager.deactivateShield(playerId);
    assert(!this.combatManager.isShieldActive(playerId), 'Shield should be deactivated');
    
    console.log('Shield blocking test passed!');
  }
  
  /**
   * Test shield disabling by axe
   */
  testShieldDisabling() {
    console.log('Testing shield disabling...');
    
    const attackerId = 'player1';
    const targetId = 'player2';
    const shield = { id: 'shield', durability: 100 };
    
    // Set up target's shield
    this.combatManager.setOffhandItem(targetId, shield);
    this.combatManager.activateShield(targetId, shield);
    
    // Process attack with axe
    const attackData = {
      itemId: 'diamond_axe',
      baseDamage: 8,
      knockback: 1,
      effects: []
    };
    
    const resultData = this.combatManager.processAttack(attackerId, targetId, attackData);
    
    // Verify shield was disabled
    assert(!this.combatManager.isShieldActive(targetId), 'Shield should be disabled after axe hit');
    
    // Verify cannot reactivate shield immediately
    const reactivated = this.combatManager.activateShield(targetId, shield);
    assert(!reactivated, 'Should not be able to reactivate disabled shield');
    
    console.log('Shield disabling test passed!');
  }
  
  /**
   * Test tipped arrows
   */
  testTippedArrows() {
    console.log('Testing tipped arrows...');
    
    // Create a tipped arrow with poison
    const tippedArrow = SpecialArrow.createTippedArrow('poison', this.potionRegistry);
    
    // Verify arrow properties
    assert.equal(tippedArrow.type, ArrowType.TIPPED, 'Should be a tipped arrow');
    assert(tippedArrow.effects.length > 0, 'Should have effects');
    assert.equal(tippedArrow.effects[0].id, 'poison', 'Should have poison effect');
    
    // Test applying effects to entity
    const entityId = 'target1';
    tippedArrow.applyEffects({ id: entityId }, this.statusEffectsManager);
    
    // Verify effect was applied
    assert(this.statusEffectsManager.hasEffect(entityId, 'poison'), 'Effect should be applied to entity');
    
    console.log('Tipped arrows test passed!');
  }
  
  /**
   * Test spectral arrows
   */
  testSpectralArrows() {
    console.log('Testing spectral arrows...');
    
    // Create a spectral arrow
    const spectralArrow = SpecialArrow.createSpectralArrow();
    
    // Verify arrow properties
    assert.equal(spectralArrow.type, ArrowType.SPECTRAL, 'Should be a spectral arrow');
    
    // Test applying effects to entity
    const entityId = 'target2';
    spectralArrow.applyEffects({ id: entityId }, this.statusEffectsManager);
    
    // Verify glowing effect was applied
    assert(this.statusEffectsManager.hasEffect(entityId, 'glowing'), 'Glowing effect should be applied to entity');
    
    console.log('Spectral arrows test passed!');
  }
}

// Run the tests
const tester = new CombatUpdateTest();
tester.runTests();

module.exports = CombatUpdateTest; 