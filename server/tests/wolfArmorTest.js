/**
 * Wolf Armor Test - Tests for the Wolf armor feature
 * Part of the 1.22 Sorcery Update
 */

const assert = require('assert');
const { 
  WolfArmorItem, 
  WolfArmorMaterial,
  LeatherWolfArmorItem,
  IronWolfArmorItem,
  GoldWolfArmorItem,
  DiamondWolfArmorItem,
  NetheriteWolfArmorItem
} = require('../items/wolfArmorItem');
const Wolf = require('../mobs/neutralMobs').Wolf;

// Mock classes
class MockPlayer {
  constructor(id = 'player1') {
    this.id = id;
    this.inventory = {
      addItem: (item) => true,
      removeItem: (itemId) => true
    };
  }
}

/**
 * Test basic wolf armor item creation
 */
function testWolfArmorItemCreation() {
  console.log('Testing wolf armor item creation...');
  
  // Test leather wolf armor
  const leatherArmor = new LeatherWolfArmorItem();
  assert.strictEqual(leatherArmor.id, 'leather_wolf_armor', 'Leather armor has correct ID');
  assert.strictEqual(leatherArmor.armorMaterial, WolfArmorMaterial.LEATHER, 'Leather armor has correct material');
  assert.strictEqual(leatherArmor.armorValue, 2, 'Leather armor has correct armor value');
  assert.strictEqual(leatherArmor.durability, 80, 'Leather armor has correct durability');
  
  // Test iron wolf armor
  const ironArmor = new IronWolfArmorItem();
  assert.strictEqual(ironArmor.id, 'iron_wolf_armor', 'Iron armor has correct ID');
  assert.strictEqual(ironArmor.armorMaterial, WolfArmorMaterial.IRON, 'Iron armor has correct material');
  assert.strictEqual(ironArmor.armorValue, 4, 'Iron armor has correct armor value');
  assert.strictEqual(ironArmor.durability, 160, 'Iron armor has correct durability');
  
  // Test golden wolf armor
  const goldArmor = new GoldWolfArmorItem();
  assert.strictEqual(goldArmor.id, 'golden_wolf_armor', 'Gold armor has correct ID');
  assert.strictEqual(goldArmor.armorMaterial, WolfArmorMaterial.GOLD, 'Gold armor has correct material');
  assert.strictEqual(goldArmor.armorValue, 3, 'Gold armor has correct armor value');
  assert.strictEqual(goldArmor.durability, 112, 'Gold armor has correct durability');
  
  // Test diamond wolf armor
  const diamondArmor = new DiamondWolfArmorItem();
  assert.strictEqual(diamondArmor.id, 'diamond_wolf_armor', 'Diamond armor has correct ID');
  assert.strictEqual(diamondArmor.armorMaterial, WolfArmorMaterial.DIAMOND, 'Diamond armor has correct material');
  assert.strictEqual(diamondArmor.armorValue, 6, 'Diamond armor has correct armor value');
  assert.strictEqual(diamondArmor.durability, 240, 'Diamond armor has correct durability');
  
  // Test netherite wolf armor
  const netheriteArmor = new NetheriteWolfArmorItem();
  assert.strictEqual(netheriteArmor.id, 'netherite_wolf_armor', 'Netherite armor has correct ID');
  assert.strictEqual(netheriteArmor.armorMaterial, WolfArmorMaterial.NETHERITE, 'Netherite armor has correct material');
  assert.strictEqual(netheriteArmor.armorValue, 8, 'Netherite armor has correct armor value');
  assert.strictEqual(netheriteArmor.durability, 320, 'Netherite armor has correct durability');
  
  console.log('✓ Wolf armor items created successfully');
}

/**
 * Test equipping and removing wolf armor
 */
function testWolfArmorEquipping() {
  console.log('Testing wolf armor equipping and removal...');
  
  // Create a wolf and tame it
  const wolf = new Wolf({ x: 0, y: 0, z: 0 });
  const player = new MockPlayer('player1');
  
  // Initialize wolf properties
  wolf.id = 'wolf1';
  wolf.angry = false;
  
  // Tame the wolf
  wolf.tamed = true;
  wolf.owner = player.id;
  
  // Verify wolf has no armor initially
  assert.strictEqual(wolf.armor, null, 'Wolf has no armor initially');
  assert.strictEqual(wolf.armorValue, 0, 'Wolf has no armor value initially');
  assert.strictEqual(wolf.hasArmor(), false, 'Wolf hasArmor() returns false initially');
  
  // Create an iron wolf armor
  const armor = new IronWolfArmorItem();
  
  // Equip the armor
  const equipped = wolf.equipArmor(armor);
  assert.strictEqual(equipped, true, 'Wolf armor was equipped successfully');
  assert.strictEqual(wolf.hasArmor(), true, 'Wolf hasArmor() returns true after equipping');
  assert.strictEqual(wolf.armorValue, 4, 'Wolf has correct armor value after equipping');
  
  // Get armor info
  const armorInfo = wolf.getArmorInfo();
  assert.strictEqual(armorInfo.id, 'iron_wolf_armor', 'Armor info has correct ID');
  assert.strictEqual(armorInfo.armorValue, 4, 'Armor info has correct armor value');
  assert.strictEqual(armorInfo.material, WolfArmorMaterial.IRON, 'Armor info has correct material');
  
  // Remove the armor
  const removedArmor = wolf.removeArmor();
  assert.notStrictEqual(removedArmor, null, 'Removed armor is not null');
  assert.strictEqual(removedArmor.id, 'iron_wolf_armor', 'Removed armor has correct ID');
  assert.strictEqual(wolf.hasArmor(), false, 'Wolf hasArmor() returns false after removal');
  assert.strictEqual(wolf.armorValue, 0, 'Wolf has no armor value after removal');
  
  // Try to remove armor when none is equipped
  const noArmor = wolf.removeArmor();
  assert.strictEqual(noArmor, null, 'Removing armor when none is equipped returns null');
  
  console.log('✓ Wolf armor equipping and removal works correctly');
}

/**
 * Test armor damage reduction
 */
function testArmorDamageReduction() {
  console.log('Testing wolf armor damage reduction...');
  
  // Create a wolf and tame it
  const wolf = new Wolf({ x: 0, y: 0, z: 0 });
  
  // Create a proper attacker object with required properties
  const attacker = {
    id: 'attacker1',
    type: 'player',
    position: { x: 5, y: 0, z: 5 }
  };
  
  // Initialize wolf properties
  wolf.id = 'wolf1';
  wolf.tamed = true;
  wolf.health = wolf.maxHealth = 10;
  
  // Take damage with no armor
  const originalHealth = wolf.health;
  wolf.takeDamage(5, attacker);
  assert.strictEqual(wolf.health, originalHealth - 5, 'Wolf takes full damage without armor');
  
  // Reset health
  wolf.health = wolf.maxHealth;
  
  // Equip diamond armor
  const armor = new DiamondWolfArmorItem();
  wolf.equipArmor(armor);
  
  // Diamond armor has value 6, which should reduce damage by 24% (6 * 4%)
  const expectedReduction = 0.24;
  const damageAmount = 10;
  const expectedDamage = Math.floor(damageAmount * (1 - expectedReduction));
  
  // Take damage with armor
  wolf.takeDamage(damageAmount, attacker);
  assert.strictEqual(wolf.health, wolf.maxHealth - expectedDamage, 'Wolf takes reduced damage with armor');
  
  // Verify armor durability decreased
  assert.strictEqual(armor.durability, 239, 'Armor durability decreased after taking damage');
  
  console.log('✓ Wolf armor damage reduction works correctly');
}

/**
 * Test armor durability and breaking
 */
function testArmorDurability() {
  console.log('Testing wolf armor durability and breaking...');
  
  // Create a wolf and equip armor with low durability
  const wolf = new Wolf({ x: 0, y: 0, z: 0 });
  wolf.id = 'wolf1';
  wolf.tamed = true;
  wolf.health = wolf.maxHealth = 10;
  
  const armor = new IronWolfArmorItem();
  armor.durability = 2; // Set low durability for testing
  
  wolf.equipArmor(armor);
  
  // Create a proper attacker object with required properties
  const attacker = {
    id: 'attacker1',
    type: 'player',
    position: { x: 5, y: 0, z: 5 }
  };
  
  // Take damage to reduce durability
  wolf.takeDamage(5, attacker);
  
  // Armor should still be equipped with durability 1
  assert.strictEqual(wolf.hasArmor(), true, 'Wolf still has armor after first hit');
  assert.strictEqual(wolf.armor.durability, 1, 'Armor durability decreased to 1');
  
  // Take damage again to break armor
  wolf.takeDamage(5, attacker);
  
  // Armor should be broken and removed
  assert.strictEqual(wolf.hasArmor(), false, 'Wolf armor was removed after breaking');
  assert.strictEqual(wolf.armor, null, 'Wolf armor is null after breaking');
  assert.strictEqual(wolf.armorValue, 0, 'Wolf armor value is 0 after breaking');
  
  console.log('✓ Wolf armor durability and breaking works correctly');
}

/**
 * Test armor serialization
 */
function testSerialization() {
  console.log('Testing wolf armor serialization...');
  
  // Create a wolf and equip armor
  const wolf = new Wolf({ x: 0, y: 0, z: 0 });
  wolf.tamed = true;
  wolf.owner = 'player1';
  
  const armor = new DiamondWolfArmorItem();
  wolf.equipArmor(armor);
  
  // Serialize the wolf
  const serialized = wolf.serialize();
  
  // Check that armor data was serialized
  assert.ok(serialized.armor, 'Armor data exists in serialized wolf');
  assert.strictEqual(serialized.armor.id, 'diamond_wolf_armor', 'Serialized armor has correct ID');
  assert.strictEqual(serialized.armor.armorMaterial, WolfArmorMaterial.DIAMOND, 'Serialized armor has correct material');
  assert.strictEqual(serialized.armor.armorValue, 6, 'Serialized armor has correct value');
  assert.strictEqual(serialized.armorValue, 6, 'Serialized wolf has correct armor value');
  
  // Create a new wolf from serialized data
  const newWolf = Wolf.deserialize(serialized);
  
  // Check the deserialized data
  assert.strictEqual(newWolf.tamed, true, 'Deserialized wolf is tamed');
  assert.strictEqual(newWolf.owner, 'player1', 'Deserialized wolf has correct owner');
  assert.strictEqual(newWolf.armorValue, 6, 'Deserialized wolf has correct armor value');
  
  // Note: The actual armor object would be loaded separately in the real game
  // as part of the item loading process
  
  console.log('✓ Wolf armor serialization works correctly');
}

/**
 * Test armor trim functionality
 */
function testArmorTrims() {
  console.log('Testing wolf armor trims...');
  
  // Create a wolf armor item
  const armor = new DiamondWolfArmorItem();
  
  // Apply a trim
  const trim = {
    pattern: 'coast',
    material: 'gold'
  };
  
  const applied = armor.applyTrim(trim);
  assert.strictEqual(applied, true, 'Trim was applied successfully');
  assert.strictEqual(armor.hasTrim(), true, 'hasTrim() returns true after applying');
  
  // Check trim data
  const trimData = armor.getTrim();
  assert.strictEqual(trimData.pattern, 'coast', 'Trim has correct pattern');
  assert.strictEqual(trimData.material, 'gold', 'Trim has correct material');
  
  // Check trim names
  assert.strictEqual(armor.getTrimPatternName(), 'Coast', 'Trim pattern name is correct');
  assert.strictEqual(armor.getTrimMaterialName(), 'Gold', 'Trim material name is correct');
  
  // Remove the trim
  const removed = armor.removeTrim();
  assert.strictEqual(removed, true, 'Trim was removed successfully');
  assert.strictEqual(armor.hasTrim(), false, 'hasTrim() returns false after removal');
  assert.strictEqual(armor.getTrim(), null, 'getTrim() returns null after removal');
  
  console.log('✓ Wolf armor trims work correctly');
}

/**
 * Run all wolf armor tests
 */
function runTests() {
  console.log('Starting Wolf Armor Tests...');
  
  try {
    testWolfArmorItemCreation();
    testWolfArmorEquipping();
    testArmorDamageReduction();
    testArmorDurability();
    testSerialization();
    testArmorTrims();
    
    console.log('All Wolf Armor tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Export the test functions
module.exports = {
  runTests,
  testWolfArmorItemCreation,
  testWolfArmorEquipping,
  testArmorDamageReduction,
  testArmorDurability,
  testSerialization,
  testArmorTrims
}; 