/**
 * Armor Trims Test Suite
 * Tests the armor trims feature from the Trails & Tales Update
 */

const assert = require('assert');
const itemRegistry = require('../items/itemRegistry');
const { ArmorItem, ArmorType, ArmorMaterial, ArmorTrimPatterns, ArmorTrimMaterials } = require('../items/armorItem');
const { ArmorTrimItem } = require('../items/armorTrimItem');
const SmithingTable = require('../crafting/smithingTable');

describe('Armor Trims', () => {
  let ironHelmet;
  let coastTrimTemplate;
  let goldIngot;
  let smithingTable;
  
  beforeEach(() => {
    // Create test items
    ironHelmet = new ArmorItem({
      id: 'iron_helmet',
      name: 'Iron Helmet',
      armorType: ArmorType.HELMET,
      armorMaterial: ArmorMaterial.IRON
    });
    
    coastTrimTemplate = new ArmorTrimItem({
      pattern: 'coast'
    });
    
    goldIngot = {
      id: 'gold_ingot',
      type: 'gold_ingot',
      name: 'Gold Ingot',
      count: 1
    };
    
    // Create smithing table for processing
    smithingTable = new SmithingTable();
  });
  
  describe('ArmorItem with trim functionality', () => {
    it('should initialize with no trim applied', () => {
      assert.strictEqual(ironHelmet.trim, null, 'New armor should have no trim');
      assert.strictEqual(ironHelmet.hasTrim(), false, 'hasTrim() should return false');
    });
    
    it('should be able to apply a valid trim', () => {
      const result = ironHelmet.applyTrim({
        pattern: 'coast',
        material: 'gold'
      });
      
      assert.strictEqual(result, true, 'applyTrim should succeed with valid values');
      assert.deepStrictEqual(ironHelmet.trim, { pattern: 'coast', material: 'gold' }, 'Trim should be set correctly');
      assert.strictEqual(ironHelmet.hasTrim(), true, 'hasTrim() should return true');
    });
    
    it('should reject invalid trim patterns', () => {
      const result = ironHelmet.applyTrim({
        pattern: 'invalid_pattern',
        material: 'gold'
      });
      
      assert.strictEqual(result, false, 'applyTrim should fail with invalid pattern');
      assert.strictEqual(ironHelmet.trim, null, 'Trim should not be set');
    });
    
    it('should reject invalid trim materials', () => {
      const result = ironHelmet.applyTrim({
        pattern: 'coast',
        material: 'invalid_material'
      });
      
      assert.strictEqual(result, false, 'applyTrim should fail with invalid material');
      assert.strictEqual(ironHelmet.trim, null, 'Trim should not be set');
    });
    
    it('should be able to remove a trim', () => {
      // First apply a trim
      ironHelmet.applyTrim({
        pattern: 'coast',
        material: 'gold'
      });
      
      // Then remove it
      const result = ironHelmet.removeTrim();
      
      assert.strictEqual(result, true, 'removeTrim should succeed');
      assert.strictEqual(ironHelmet.trim, null, 'Trim should be removed');
      assert.strictEqual(ironHelmet.hasTrim(), false, 'hasTrim() should return false');
    });
    
    it('should provide trim details via getter methods', () => {
      // Apply a trim
      ironHelmet.applyTrim({
        pattern: 'coast',
        material: 'gold'
      });
      
      assert.deepStrictEqual(ironHelmet.getTrim(), { pattern: 'coast', material: 'gold' }, 'getTrim() should return trim data');
      assert.strictEqual(ironHelmet.getTrimPatternName(), 'Coast', 'getTrimPatternName() should return formatted name');
      assert.strictEqual(ironHelmet.getTrimMaterialName(), 'Gold', 'getTrimMaterialName() should return formatted name');
      assert.strictEqual(ironHelmet.getTrimColor(), '#FDCF41', 'getTrimColor() should return correct color');
    });
    
    it('should include trim in serialized data', () => {
      // Apply a trim
      ironHelmet.applyTrim({
        pattern: 'coast',
        material: 'gold'
      });
      
      const serialized = ironHelmet.toJSON();
      assert.deepStrictEqual(serialized.trim, { pattern: 'coast', material: 'gold' }, 'Trim should be included in serialized data');
      
      // Test deserialization
      const deserialized = ArmorItem.fromJSON(serialized);
      assert.deepStrictEqual(deserialized.trim, { pattern: 'coast', material: 'gold' }, 'Trim should be preserved when deserialized');
    });
  });
  
  describe('ArmorTrimItem templates', () => {
    it('should have correct properties', () => {
      assert.strictEqual(coastTrimTemplate.id, 'coast_armor_trim', 'ID should be correctly formatted');
      assert.strictEqual(coastTrimTemplate.pattern, 'coast', 'Pattern should be set');
      assert.strictEqual(coastTrimTemplate.isArmorTrimTemplate, true, 'Should be marked as template');
    });
    
    it('should provide pattern information', () => {
      assert.strictEqual(coastTrimTemplate.getPatternId(), 'coast', 'getPatternId() should return pattern ID');
      assert.strictEqual(coastTrimTemplate.getPatternDisplayName(), 'Coast', 'getPatternDisplayName() should return formatted name');
    });
    
    it('should provide source information', () => {
      const source = coastTrimTemplate.getSource();
      assert.ok(source && source.length > 0, 'getSource() should return non-empty string');
      assert.ok(source.includes('Beach'), 'Source should mention correct structure');
    });
    
    it('should provide usage instructions', () => {
      const instructions = coastTrimTemplate.getUsageInstructions();
      assert.ok(instructions && instructions.length > 0, 'getUsageInstructions() should return non-empty string');
      assert.ok(instructions.includes('smithing table'), 'Instructions should mention smithing table');
      assert.ok(instructions.includes('Coast'), 'Instructions should mention the pattern name');
    });
  });
  
  describe('SmithingTable with trim functionality', () => {
    it('should apply a trim to an armor piece', () => {
      const result = smithingTable.applyArmorTrim(ironHelmet, coastTrimTemplate, goldIngot);
      
      assert.ok(result, 'Result should be truthy');
      assert.deepStrictEqual(result.trim, { pattern: 'coast', material: 'gold' }, 'Trim should be applied correctly');
    });
    
    it('should process a trim recipe correctly', () => {
      const result = smithingTable.process(ironHelmet, coastTrimTemplate, goldIngot);
      
      assert.ok(result, 'Result should be truthy');
      assert.strictEqual(result.id, 'iron_helmet', 'Item ID should be preserved');
      assert.deepStrictEqual(result.trim, { pattern: 'coast', material: 'gold' }, 'Trim should be applied correctly');
    });
    
    it('should refuse to trim with invalid materials', () => {
      const invalidMaterial = { id: 'stick', type: 'stick', name: 'Stick', count: 1 };
      const result = smithingTable.process(ironHelmet, coastTrimTemplate, invalidMaterial);
      
      assert.strictEqual(result, null, 'Should reject invalid material');
    });
    
    it('should handle regular upgrade recipes', () => {
      const diamondHelmet = new ArmorItem({
        id: 'diamond_helmet',
        name: 'Diamond Helmet',
        armorType: ArmorType.HELMET,
        armorMaterial: ArmorMaterial.DIAMOND
      });
      
      const netheriteIngot = { id: 'netherite_ingot', type: 'netherite_ingot', name: 'Netherite Ingot', count: 1 };
      
      const result = smithingTable.process(diamondHelmet, null, netheriteIngot);
      
      assert.ok(result, 'Result should be truthy');
      assert.strictEqual(result.type, 'netherite_helmet', 'Should upgrade to netherite');
    });
    
    it('should preserve enchantments when upgrading', () => {
      const diamondHelmet = new ArmorItem({
        id: 'diamond_helmet',
        name: 'Diamond Helmet',
        armorType: ArmorType.HELMET,
        armorMaterial: ArmorMaterial.DIAMOND,
        enchantments: [{ id: 'protection', level: 4 }]
      });
      
      const netheriteIngot = { id: 'netherite_ingot', type: 'netherite_ingot', name: 'Netherite Ingot', count: 1 };
      
      const result = smithingTable.process(diamondHelmet, null, netheriteIngot);
      
      assert.ok(result, 'Result should be truthy');
      assert.deepStrictEqual(result.enchantments, [{ id: 'protection', level: 4 }], 'Enchantments should be preserved');
    });
  });
  
  describe('ItemRegistry registration', () => {
    it('should register all armor trim templates', () => {
      // Check if all patterns are registered
      for (const pattern of ArmorTrimPatterns) {
        const templateId = `${pattern}_armor_trim`;
        const template = itemRegistry.getItem(templateId);
        
        assert.ok(template, `Template for pattern '${pattern}' should be registered`);
        assert.strictEqual(template.pattern, pattern, 'Pattern should match');
      }
    });
    
    it('should register basic armor items', () => {
      // Check if some armor items are registered
      const materials = ['iron', 'gold', 'diamond', 'netherite'];
      const types = ['helmet', 'chestplate', 'leggings', 'boots'];
      
      for (const material of materials) {
        for (const type of types) {
          const itemId = `${material}_${type}`;
          const armorItem = itemRegistry.getItem(itemId);
          
          assert.ok(armorItem, `Armor item '${itemId}' should be registered`);
          assert.strictEqual(armorItem.armorMaterial.toLowerCase(), material, 'Material should match');
        }
      }
    });
  });
});

// Run the tests if this file is executed directly
if (require.main === module) {
  describe('Armor Trims Test Suite', () => {
    before(() => {
      console.log('Running Armor Trims tests...');
    });
    
    after(() => {
      console.log('Armor Trims tests completed!');
    });
  });
} 