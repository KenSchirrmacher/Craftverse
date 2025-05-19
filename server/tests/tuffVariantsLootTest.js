const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { Player } = require('../entities/player');
const { DiamondPickaxe, IronPickaxe, WoodenPickaxe } = require('../items/tools');
const { FortuneEnchantment, SilkTouchEnchantment } = require('../items/enchantments');

class TuffVariantsLootTest {
  constructor() {
    this.world = new TestWorld();
    this.player = new Player('test_player');
  }

  runTests() {
    this.testBasicDrops();
    this.testToolDrops();
    this.testEnchantmentDrops();
    this.testSilkTouchDrops();
    this.testFortuneDrops();
  }

  testBasicDrops() {
    console.log('Testing basic drops...');
    
    // Test Tuff Bricks basic drops
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    const drops = placedBricks.getDrops(this.player);
    assert.strictEqual(Array.isArray(drops), true);
    assert.strictEqual(drops.length > 0, true);
    assert.strictEqual(drops[0].type === 'tuff_bricks', true);
  }

  testToolDrops() {
    console.log('Testing tool drops...');
    
    // Test Tuff Brick Wall drops with different tools
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test with diamond pickaxe
    this.player.setHeldItem(new DiamondPickaxe());
    const diamondDrops = placedWall.getDrops(this.player);
    assert.strictEqual(diamondDrops.length > 0, true);
    
    // Test with wooden pickaxe
    this.player.setHeldItem(new WoodenPickaxe());
    const woodenDrops = placedWall.getDrops(this.player);
    assert.strictEqual(woodenDrops.length === 0, true);
  }

  testEnchantmentDrops() {
    console.log('Testing enchantment drops...');
    
    // Test Tuff Brick Stairs with enchantments
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test with Fortune III
    const fortunePickaxe = new DiamondPickaxe();
    fortunePickaxe.addEnchantment(new FortuneEnchantment(3));
    this.player.setHeldItem(fortunePickaxe);
    
    const fortuneDrops = placedStairs.getDrops(this.player);
    assert.strictEqual(fortuneDrops.length > 1, true);
  }

  testSilkTouchDrops() {
    console.log('Testing Silk Touch drops...');
    
    // Test Chiseled Tuff with Silk Touch
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    const silkTouchPickaxe = new DiamondPickaxe();
    silkTouchPickaxe.addEnchantment(new SilkTouchEnchantment());
    this.player.setHeldItem(silkTouchPickaxe);
    
    const silkTouchDrops = placedChiseled.getDrops(this.player);
    assert.strictEqual(silkTouchDrops.length === 1, true);
    assert.strictEqual(silkTouchDrops[0].type === 'chiseled_tuff', true);
  }

  testFortuneDrops() {
    console.log('Testing Fortune drops...');
    
    // Test Tuff Brick Slab with Fortune
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    const fortunePickaxe = new IronPickaxe();
    fortunePickaxe.addEnchantment(new FortuneEnchantment(3));
    this.player.setHeldItem(fortunePickaxe);
    
    const fortuneDrops = placedSlab.getDrops(this.player);
    assert.strictEqual(fortuneDrops.length > 1, true);
    assert.strictEqual(fortuneDrops.every(drop => drop.type === 'tuff_brick_slab'), true);
  }
}

// Run tests
const test = new TuffVariantsLootTest();
test.runTests();
console.log('All Tuff variants loot tests passed!');

module.exports = TuffVariantsLootTest; 