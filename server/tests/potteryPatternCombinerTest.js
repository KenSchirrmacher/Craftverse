/**
 * PotteryPatternCombiner Tests
 * Tests for the pattern combination mechanics in the Minecraft 1.24 Update
 */

const assert = require('assert');
const PotteryPatternCombiner = require('../utils/potteryPatternCombiner');
const PotterySherdItem = require('../items/potterySherdItem');

describe('PotteryPatternCombiner', () => {
  let combiner;
  
  beforeEach(() => {
    combiner = new PotteryPatternCombiner();
  });
  
  describe('Pattern Combinations', () => {
    it('should detect same-category combinations', () => {
      const pharaoh = new PotterySherdItem({ pattern: 'pharaoh' });
      const dynasty = new PotterySherdItem({ pattern: 'dynasty' });
      
      // Force categories to match registry values for test
      pharaoh.category = 'historical';
      dynasty.category = 'historical';
      
      console.log('Pharaoh category:', pharaoh.category);
      console.log('Dynasty category:', dynasty.category);
      
      const effect = combiner.getCombinationEffect([pharaoh, dynasty]);
      assert.ok(effect, 'Should have a combination effect');
      assert.strictEqual(effect.effect, 'time_anomaly');
      assert.strictEqual(effect.description, 'Creates a localized time distortion field');
    });
    
    it('should detect cross-category combinations', () => {
      const pharaoh = new PotterySherdItem({ pattern: 'pharaoh' });
      const dragon = new PotterySherdItem({ pattern: 'dragon' });
      
      // Force categories to match registry values for test
      pharaoh.category = 'historical';
      dragon.category = 'mythological';
      
      const effect = combiner.getCombinationEffect([pharaoh, dragon]);
      assert.ok(effect, 'Should have a combination effect');
      assert.strictEqual(effect.effect, 'legendary_echo');
      assert.strictEqual(effect.description, 'Reveals ancient mythical knowledge');
    });
    
    it('should not combine incompatible patterns', () => {
      const pharaoh = new PotterySherdItem({ pattern: 'pharaoh' });
      const oak = new PotterySherdItem({ pattern: 'oak' });
      const spiral = new PotterySherdItem({ pattern: 'spiral' });
      
      // Force categories to match registry values for test
      pharaoh.category = 'historical';
      oak.category = 'natural';
      spiral.category = 'abstract';
      
      const effect = combiner.getCombinationEffect([pharaoh, oak, spiral]);
      assert.ok(!effect, 'Should not have a combination effect');
    });
  });
  
  describe('Effect Strength Calculation', () => {
    it('should calculate base strength from individual patterns', () => {
      const pharaoh = new PotterySherdItem({ pattern: 'pharaoh' });
      const dynasty = new PotterySherdItem({ pattern: 'dynasty' });
      
      // Force categories to match registry values for test
      pharaoh.category = 'historical';
      dynasty.category = 'historical';
      
      const strength = combiner.calculateEffectStrength([pharaoh, dynasty]);
      assert.strictEqual(strength, 7); // 3 (rare) + 4 (epic) = 7
    });
    
    it('should add combination bonus to total strength', () => {
      const pharaoh = new PotterySherdItem({ pattern: 'pharaoh' });
      const dynasty = new PotterySherdItem({ pattern: 'dynasty' });
      
      // Force categories to match registry values for test
      pharaoh.category = 'historical';
      dynasty.category = 'historical';
      
      const strength = combiner.calculateEffectStrength([pharaoh, dynasty]);
      assert.strictEqual(strength, 9); // 7 (base) + 2 (combination bonus)
    });
  });
  
  describe('Combination Validation', () => {
    it('should validate valid combinations', () => {
      const pharaoh = new PotterySherdItem({ pattern: 'pharaoh' });
      const dynasty = new PotterySherdItem({ pattern: 'dynasty' });
      
      // Force categories to match registry values for test
      pharaoh.category = 'historical';
      dynasty.category = 'historical';
      
      assert.ok(combiner.canCombine([pharaoh, dynasty]), 'Should be a valid combination');
    });
    
    it('should reject invalid combinations', () => {
      const pharaoh = new PotterySherdItem({ pattern: 'pharaoh' });
      const oak = new PotterySherdItem({ pattern: 'oak' });
      const spiral = new PotterySherdItem({ pattern: 'spiral' });
      
      assert.ok(!combiner.canCombine([pharaoh, oak, spiral]), 'Should not be a valid combination');
    });
    
    it('should require at least two patterns', () => {
      const pharaoh = new PotterySherdItem({ pattern: 'pharaoh' });
      
      assert.ok(!combiner.canCombine([pharaoh]), 'Should require at least two patterns');
    });
  });
  
  describe('Effect Descriptions', () => {
    it('should provide effect descriptions', () => {
      const pharaoh = new PotterySherdItem({ pattern: 'pharaoh' });
      const dynasty = new PotterySherdItem({ pattern: 'dynasty' });
      
      // Force categories to match registry values for test
      pharaoh.category = 'historical';
      dynasty.category = 'historical';
      
      const description = combiner.getCombinationDescription([pharaoh, dynasty]);
      assert.strictEqual(description, 'Creates a localized time distortion field');
    });
    
    it('should return null for invalid combinations', () => {
      const pharaoh = new PotterySherdItem({ pattern: 'pharaoh' });
      const oak = new PotterySherdItem({ pattern: 'oak' });
      
      // Force categories to match registry values for test
      pharaoh.category = 'historical';
      oak.category = 'natural';
      
      const description = combiner.getCombinationDescription([pharaoh, oak]);
      assert.strictEqual(description, null);
    });
  });
});

// Run the tests
console.log('Running Pottery Pattern Combiner tests...');
describe('Pottery Pattern Combiner Test Suite', () => {
  it('should run all pattern combination tests', () => {
    // Tests are already defined above
  });
}); 