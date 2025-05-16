/**
 * Netherite Upgrade Template Tests
 * Tests the Netherite Upgrade Template implementation for the 1.20 Update
 */

const assert = require('assert');
const { NetheriteUpgradeTemplate } = require('../items/netheriteUpgradeTemplate');
const SmithingTable = require('../crafting/smithingTable');
const { NetheriteIngotItem } = require('../items/netheriteItems');

/**
 * Run the Netherite Upgrade Template tests
 */
function runTests() {
  console.log('Testing NetheriteUpgradeTemplate Properties...');
  
  // Create instances for testing
  const netheriteTemplate = new NetheriteUpgradeTemplate();
  const smithingTable = new SmithingTable();
  
  // Test basic properties
  assert.equal(netheriteTemplate.id, 'netherite_upgrade_template', 'Template ID should be correct');
  assert.equal(netheriteTemplate.name, 'Netherite Upgrade Smithing Template', 'Template name should be correct');
  assert.equal(netheriteTemplate.type, 'netherite_upgrade_template', 'Template type should be correct');
  
  // Test template-specific flags
  assert.equal(netheriteTemplate.isNetheriteUpgradeTemplate, true, 'isNetheriteUpgradeTemplate flag should be true');
  
  // Test applicableTo list
  assert.ok(Array.isArray(netheriteTemplate.applicableTo), 'applicableTo should be an array');
  assert.ok(netheriteTemplate.applicableTo.includes('diamond_helmet'), 'Should apply to diamond helmet');
  assert.ok(netheriteTemplate.applicableTo.includes('diamond_sword'), 'Should apply to diamond sword');
  
  // Test canApplyTo method
  assert.equal(netheriteTemplate.canApplyTo({ type: 'diamond_helmet' }), true, 'Should apply to diamond helmet');
  assert.equal(netheriteTemplate.canApplyTo({ type: 'iron_helmet' }), false, 'Should not apply to iron helmet');
  assert.equal(netheriteTemplate.canApplyTo({ type: 'diamond_carrot' }), false, 'Should not apply to non-equipment');
  assert.equal(netheriteTemplate.canApplyTo(null), false, 'Should handle null items');
  
  console.log('Testing Smithing Table Integration...');
  
  // Test requiring template for upgrades
  
  // Create a diamond helmet and netherite ingot
  const diamondHelmet = { 
    id: 'diamond_helmet', 
    type: 'diamond_helmet', 
    name: 'Diamond Helmet', 
    durability: 100
  };
  
  const netheriteIngot = { 
    id: 'netherite_ingot', 
    type: 'netherite_ingot', 
    name: 'Netherite Ingot'
  };
  
  // Try to upgrade without a template (should fail when template required)
  smithingTable.setRequireNetheriteTemplate(true);
  const resultWithoutTemplate = smithingTable.process(diamondHelmet, null, netheriteIngot);
  assert.equal(resultWithoutTemplate, null, 'Should not upgrade without a template when required');
  
  // Try with a template (should succeed)
  const resultWithTemplate = smithingTable.process(diamondHelmet, netheriteTemplate, netheriteIngot);
  assert.ok(resultWithTemplate, 'Should return a result with template');
  assert.equal(resultWithTemplate.type, 'netherite_helmet', 'Should upgrade to netherite helmet');
  
  // Test backward compatibility mode
  // Set compatibility mode
  smithingTable.setRequireNetheriteTemplate(false);
  
  // Try to upgrade without a template (should succeed in compatibility mode)
  const compatResultWithoutTemplate = smithingTable.process(diamondHelmet, null, netheriteIngot);
  assert.ok(compatResultWithoutTemplate, 'Should upgrade in compatibility mode');
  assert.equal(compatResultWithoutTemplate.type, 'netherite_helmet', 'Should be a netherite helmet');
  
  // Test property preservation
  // Create a diamond helmet with enchantments and custom name
  const enchantedHelmet = { 
    id: 'diamond_helmet', 
    type: 'diamond_helmet', 
    name: 'Diamond Helmet', 
    customName: 'Helmet of Protection',
    durability: 100,
    enchantments: [
      { id: 'protection', level: 4 },
      { id: 'unbreaking', level: 3 }
    ]
  };
  
  // Upgrade with a template
  smithingTable.setRequireNetheriteTemplate(true);
  const enchantedResult = smithingTable.process(enchantedHelmet, netheriteTemplate, netheriteIngot);
  
  // Check properties are preserved
  assert.equal(enchantedResult.customName, 'Helmet of Protection', 'Custom name should be preserved');
  assert.equal(enchantedResult.durability, 100, 'Durability should be preserved');
  assert.equal(enchantedResult.enchantments.length, 2, 'Enchantments should be preserved');
  assert.equal(enchantedResult.enchantments[0].id, 'protection', 'Enchantment ID should be preserved');
  assert.equal(enchantedResult.enchantments[0].level, 4, 'Enchantment level should be preserved');
  
  // Test all equipment types
  console.log('Testing all diamond equipment types...');
  
  const equipmentTypes = [
    'helmet', 'chestplate', 'leggings', 'boots',
    'sword', 'pickaxe', 'axe', 'shovel', 'hoe'
  ];
  
  for (const itemType of equipmentTypes) {
    const diamondItem = { 
      id: `diamond_${itemType}`, 
      type: `diamond_${itemType}`, 
      name: `Diamond ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}` 
    };
    
    const result = smithingTable.process(diamondItem, netheriteTemplate, netheriteIngot);
    assert.ok(result, `Should upgrade diamond_${itemType}`);
    assert.equal(result.type, `netherite_${itemType}`, `Should upgrade to netherite_${itemType}`);
  }
  
  console.log('Testing serialization...');
  
  // Test serialization
  const json = netheriteTemplate.toJSON();
  assert.equal(json.id, 'netherite_upgrade_template', 'Serialized ID should be correct');
  assert.equal(json.isNetheriteUpgradeTemplate, true, 'Serialized flag should be correct');
  assert.ok(Array.isArray(json.applicableTo), 'Serialized applicableTo should be an array');
  
  // Test deserialization
  const deserialized = NetheriteUpgradeTemplate.fromJSON(json);
  assert.equal(deserialized.id, 'netherite_upgrade_template', 'Deserialized ID should be correct');
  assert.equal(deserialized.isNetheriteUpgradeTemplate, true, 'Deserialized flag should be correct');
  assert.ok(Array.isArray(deserialized.applicableTo), 'Deserialized applicableTo should be an array');
  assert.equal(deserialized.applicableTo.length, netheriteTemplate.applicableTo.length, 'Deserialized array length should match');
  
  console.log('All Netherite Upgrade Template tests passed!');
}

// Export the test functions
module.exports = {
  runTests
};

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running Netherite Upgrade Template Tests...');
  runTests();
} 