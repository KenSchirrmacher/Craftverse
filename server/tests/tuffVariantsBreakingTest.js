const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { DiamondPickaxeItem } = require('../items/tools');
const { SilkTouchEnchantment } = require('../items/enchantments');

class TuffVariantsBreakingTest {
  constructor() {
    this.world = new TestWorld();
  }

  runTests() {
    this.testNormalBreaking();
    this.testSilkTouchBreaking();
    this.testToolBreaking();
    this.testDropRates();
    this.testExperienceDrops();
  }

  testNormalBreaking() {
    console.log('Testing normal breaking...');
    
    // Test Tuff Bricks normal breaking
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Break block without tool
    const drops = placedBricks.break();
    
    // Verify drops
    assert.strictEqual(drops.length, 1);
    assert.strictEqual(drops[0].id, 'tuff_bricks');
    assert.strictEqual(drops[0].count, 1);
  }

  testSilkTouchBreaking() {
    console.log('Testing silk touch breaking...');
    
    // Test Chiseled Tuff silk touch breaking
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Apply silk touch enchantment
    const silkTouch = new SilkTouchEnchantment();
    silkTouch.apply(placedChiseled);
    
    // Break block with silk touch
    const drops = placedChiseled.break();
    
    // Verify drops
    assert.strictEqual(drops.length, 1);
    assert.strictEqual(drops[0].id, 'chiseled_tuff');
    assert.strictEqual(drops[0].count, 1);
  }

  testToolBreaking() {
    console.log('Testing tool breaking...');
    
    // Test Tuff Brick Stairs tool breaking
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create diamond pickaxe
    const pickaxe = new DiamondPickaxeItem();
    
    // Break block with pickaxe
    const drops = placedStairs.break(pickaxe);
    
    // Verify drops
    assert.strictEqual(drops.length, 1);
    assert.strictEqual(drops[0].id, 'tuff_brick_stairs');
    assert.strictEqual(drops[0].count, 1);
  }

  testDropRates() {
    console.log('Testing drop rates...');
    
    // Test Tuff Brick Wall drop rates
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Break multiple blocks and count drops
    let totalDrops = 0;
    const iterations = 1000;
    
    for (let i = 0; i < iterations; i++) {
      const drops = placedWall.break();
      totalDrops += drops.length;
      placedWall.place(this.world, { x: 0, y: 0, z: 0 });
    }
    
    // Verify drop rate is approximately 1.0
    const dropRate = totalDrops / iterations;
    assert.ok(dropRate >= 0.95 && dropRate <= 1.05);
  }

  testExperienceDrops() {
    console.log('Testing experience drops...');
    
    // Test Tuff Brick Slab experience drops
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Break block and check experience
    const experience = placedSlab.getExperienceDrop();
    
    // Verify experience drop
    assert.strictEqual(typeof experience, 'number');
    assert.ok(experience >= 0);
  }
}

// Run tests
const test = new TuffVariantsBreakingTest();
test.runTests();
console.log('All Tuff variants breaking tests passed!');

module.exports = TuffVariantsBreakingTest; 