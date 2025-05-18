const assert = require('assert');
const DecoratedPotItem = require('../items/decoratedPotItem');
const DecoratedPot = require('../blocks/decoratedPot');
const PotterySherdItem = require('../items/potterySherdItem');
const PotPatternRegistry = require('../items/potPatternRegistry');
const EnhancedPot = require('../blocks/enhancedPot');
const TestBase = require('./testBase');

/**
 * Test suite for the Decorated Pots Expansion feature
 * Part of the Minecraft 1.23 Update
 */
class DecoratedPotsTest extends TestBase {
  constructor() {
    super('Decorated Pots Expansion Tests');
    
    this.mockPlayer = {
      id: 'player-1',
      position: { x: 0, y: 64, z: 0 },
      inventory: {
        addItem: (item) => true,
        removeItem: (item) => true,
        hasItem: (itemType) => true
      },
      giveItem: (item) => true,
      emitSound: (sound, options) => true,
      rotation: { y: 0 }
    };
    
    this.mockWorld = {
      blocks: {},
      getBlockState: (x, y, z) => this.blocks[`${x},${y},${z}`] || null,
      setBlockState: (x, y, z, block) => {
        this.blocks[`${x},${y},${z}`] = block;
        return true;
      }
    };
  }

  async runTests() {
    // Run all tests
    await this.testPotPatternRegistry();
    await this.testNewSherdPatterns();
    await this.testEnhancedPot();
    await this.testPotSorting();
    await this.testPotDyeing();
    await this.testSoundInteractions();
    await this.testRedstoneSignal();
    await this.testComparatorOutput();
  }
  
  async testPotPatternRegistry() {
    this.runTest('PotPatternRegistry initialization', () => {
      const registry = new PotPatternRegistry();
      assert.ok(registry, 'Pattern registry should be initialized');
      assert.strictEqual(typeof registry.getPattern, 'function', 'Registry should have getPattern method');
      assert.strictEqual(typeof registry.registerPattern, 'function', 'Registry should have registerPattern method');
      assert.strictEqual(typeof registry.getPatternCategories, 'function', 'Registry should have getPatternCategories method');
    });
    
    this.runTest('PotPatternRegistry pattern registration', () => {
      const registry = new PotPatternRegistry();
      
      // Register a custom pattern
      const customPattern = {
        id: 'custom_spiral',
        name: 'Custom Spiral',
        category: 'decoration',
        rarity: 'rare'
      };
      
      registry.registerPattern(customPattern);
      
      // Check if pattern was registered
      const retrievedPattern = registry.getPattern('custom_spiral');
      assert.deepStrictEqual(retrievedPattern, customPattern, 'Retrieved pattern should match registered pattern');
      
      // Check category listing
      const decorationPatterns = registry.getPatternsByCategory('decoration');
      assert.ok(decorationPatterns.includes('custom_spiral'), 'Custom pattern should be in its category');
    });
  }
  
  async testNewSherdPatterns() {
    this.runTest('New pottery sherd patterns', () => {
      // Test new patterns
      const enchantedSherd = new PotterySherdItem({ pattern: 'enchanted' });
      assert.strictEqual(enchantedSherd.pattern, 'enchanted', 'Pattern should be set correctly');
      assert.strictEqual(enchantedSherd.type, 'pottery_sherd_enchanted', 'Type should be set correctly');
      assert.strictEqual(enchantedSherd.category, 'magical', 'Category should be assigned correctly');
      
      const flowerySherd = new PotterySherdItem({ pattern: 'flowery' });
      assert.strictEqual(flowerySherd.pattern, 'flowery', 'Pattern should be set correctly');
      assert.strictEqual(flowerySherd.category, 'decoration', 'Category should be assigned correctly');
      
      const musicalSherd = new PotterySherdItem({ pattern: 'musical' });
      assert.strictEqual(musicalSherd.pattern, 'musical', 'Pattern should be set correctly');
      assert.strictEqual(musicalSherd.category, 'musical', 'Category should be assigned correctly');
    });
    
    this.runTest('Sherd categories functionality', () => {
      const registry = new PotPatternRegistry();
      
      // Check for magical category
      const magicalPatterns = registry.getPatternsByCategory('magical');
      assert.ok(Array.isArray(magicalPatterns), 'Should return an array of patterns');
      assert.ok(magicalPatterns.includes('enchanted'), 'Enchanted pattern should be in magical category');
      assert.ok(magicalPatterns.includes('mystical'), 'Mystical pattern should be in magical category');
    });
  }
  
  async testEnhancedPot() {
    this.runTest('EnhancedPot base functionality', () => {
      const enhancedPot = new EnhancedPot();
      assert.strictEqual(enhancedPot.type, 'enhanced_pot', 'Type should be set correctly');
      assert.strictEqual(enhancedPot.inventory.slots, 3, 'Should have 3 inventory slots');
      assert.strictEqual(typeof enhancedPot.getEffectsFromSherds, 'function', 'Should have getEffectsFromSherds method');
    });
    
    this.runTest('EnhancedPot effects', () => {
      // Create enhanced pot with magical sherds
      const enhancedPot = new EnhancedPot({
        sherds: {
          north: 'enchanted',
          east: 'mystical',
          south: 'musical',
          west: 'flowery'
        }
      });
      
      // Check effect calculation
      const effects = enhancedPot.getEffectsFromSherds();
      assert.strictEqual(effects.length, 2, 'Should have 2 effects (from magical sherds)');
      
      // Check for specific effects
      const hasMagicalEffect = effects.some(effect => effect.type === 'magical_storage');
      assert.ok(hasMagicalEffect, 'Should have magical storage effect');
      
      // Check for slot expansion based on pattern matching
      assert.strictEqual(enhancedPot.inventory.slots, 5, 'Slots should be expanded to 5 due to magical effects');
    });
    
    this.runTest('EnhancedPot category bonus', () => {
      // Create enhanced pot with matching categories (all decoration)
      const decorationPot = new EnhancedPot({
        sherds: {
          north: 'flowery',
          east: 'prize',
          south: 'explorer',
          west: 'flowery'
        }
      });
      
      // Check for category bonus
      const hasBonus = decorationPot.hasMatchingCategoryBonus();
      assert.ok(hasBonus, 'Should have category bonus');
      
      // Create enhanced pot with mixed categories
      const mixedPot = new EnhancedPot({
        sherds: {
          north: 'flowery',
          east: 'mystical',
          south: 'musical',
          west: 'arms_up'
        }
      });
      
      // Check for no category bonus
      const hasNoBonus = mixedPot.hasMatchingCategoryBonus();
      assert.ok(!hasNoBonus, 'Should not have category bonus');
    });
  }
  
  async testPotSorting() {
    this.runTest('Pot item sorting functionality', () => {
      const enhancedPot = new EnhancedPot({
        sherds: {
          north: 'enchanted',
          east: 'mystical',
          south: null,
          west: null
        }
      });
      
      // Insert mixed items
      const items = [
        { type: 'stone', count: 64 },
        { type: 'diamond', count: 5 },
        { type: 'cobblestone', count: 32 }
      ];
      
      for (const item of items) {
        enhancedPot.storeItem(this.mockPlayer, item);
      }
      
      // Test sorting
      enhancedPot.sortInventory();
      
      // Check order (should be alphabetical by default)
      const sortedItems = enhancedPot.inventory.items;
      assert.strictEqual(sortedItems[0].type, 'cobblestone', 'First item should be cobblestone');
      assert.strictEqual(sortedItems[1].type, 'diamond', 'Second item should be diamond');
      assert.strictEqual(sortedItems[2].type, 'stone', 'Third item should be stone');
    });
  }
  
  async testPotDyeing() {
    this.runTest('Pot dyeing functionality', () => {
      const enhancedPot = new EnhancedPot();
      
      // Apply dye
      enhancedPot.applyDye('blue');
      
      // Check color
      assert.strictEqual(enhancedPot.color, 'blue', 'Color should be set to blue');
      
      // Check render data includes color
      const renderData = enhancedPot.getRenderData();
      assert.strictEqual(renderData.color, 'blue', 'Render data should include color');
    });
  }
  
  async testSoundInteractions() {
    this.runTest('Pot sound effects', () => {
      const enhancedPot = new EnhancedPot({
        sherds: {
          north: 'musical',
          east: 'musical',
          south: null,
          west: null
        }
      });
      
      // Check for sound capability
      assert.strictEqual(typeof enhancedPot.playSound, 'function', 'Should have playSound method');
      
      // Test sound trigger on interaction
      let soundPlayed = null;
      const mockPlayer = {
        ...this.mockPlayer,
        emitSound: (sound, options) => {
          soundPlayed = sound;
          return true;
        }
      };
      
      enhancedPot.interact(mockPlayer, { type: 'stick', count: 1 });
      
      // Musical pots should play notes when interacted with
      assert.strictEqual(soundPlayed, 'block.note_block.harp', 'Should play note sound when interacted with');
    });
  }
  
  async testRedstoneSignal() {
    this.runTest('Pot redstone signal output', () => {
      const enhancedPot = new EnhancedPot({
        sherds: {
          north: 'enchanted',
          east: 'enchanted',
          south: 'enchanted',
          west: 'enchanted'
        }
      });
      
      // Test redstone output methods
      assert.strictEqual(typeof enhancedPot.hasRedstoneOutput, 'function', 'Should have hasRedstoneOutput method');
      assert.strictEqual(typeof enhancedPot.getRedstoneOutput, 'function', 'Should have getRedstoneOutput method');
      
      // Magical pots should have redstone output
      assert.ok(enhancedPot.hasRedstoneOutput(), 'Magical pot should have redstone output');
      
      // Empty pot should output signal strength 0
      assert.strictEqual(enhancedPot.getRedstoneOutput(), 0, 'Empty pot should have 0 signal strength');
      
      // Add items and check signal strength increases
      enhancedPot.storeItem(this.mockPlayer, { type: 'diamond', count: 64 });
      assert.ok(enhancedPot.getRedstoneOutput() > 0, 'Signal strength should increase with items');
    });
  }
  
  async testComparatorOutput() {
    this.runTest('Pot comparator output', () => {
      const enhancedPot = new EnhancedPot();
      
      // Test comparator output method
      assert.strictEqual(typeof enhancedPot.getComparatorOutput, 'function', 'Should have getComparatorOutput method');
      
      // Empty pot should have minimal output
      assert.strictEqual(enhancedPot.getComparatorOutput(), 0, 'Empty pot should have 0 comparator output');
      
      // Add items and check comparator output
      enhancedPot.storeItem(this.mockPlayer, { type: 'diamond', count: 64 });
      assert.strictEqual(enhancedPot.getComparatorOutput(), 15, 'Full slot should have maximum comparator output');
      
      // Test partial filling
      const partialPot = new EnhancedPot();
      partialPot.storeItem(this.mockPlayer, { type: 'diamond', count: 1 });
      assert.ok(partialPot.getComparatorOutput() > 0 && partialPot.getComparatorOutput() < 15, 
                'Partially filled pot should have intermediate comparator output');
    });
  }
}

module.exports = DecoratedPotsTest; 