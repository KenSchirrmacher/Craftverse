const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { Player } = require('../entities/player');
const { DiamondPickaxe, IronPickaxe, WoodenPickaxe } = require('../items/tools');

class TuffVariantsDurabilityTest {
  constructor() {
    this.world = new TestWorld();
    this.player = new Player({ x: 0, y: 0, z: 0 });
  }

  runTests() {
    this.testBlockDurability();
    this.testToolEfficiency();
    this.testToolDamage();
    this.testBreakingTime();
    this.testToolRequirements();
  }

  testBlockDurability() {
    console.log('Testing block durability...');
    
    // Test Tuff Bricks durability
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Verify durability properties
    assert.strictEqual(placedBricks.getDurability(), 30);
    assert.strictEqual(placedBricks.getBlastResistance(), 6);
    assert.strictEqual(placedBricks.getHardness(), 1.5);
  }

  testToolEfficiency() {
    console.log('Testing tool efficiency...');
    
    // Test Chiseled Tuff with different tools
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    const diamondPick = new DiamondPickaxe();
    const ironPick = new IronPickaxe();
    const woodenPick = new WoodenPickaxe();
    
    // Test efficiency multipliers
    assert.strictEqual(placedChiseled.getToolEfficiency(diamondPick) > placedChiseled.getToolEfficiency(ironPick), true);
    assert.strictEqual(placedChiseled.getToolEfficiency(ironPick) > placedChiseled.getToolEfficiency(woodenPick), true);
  }

  testToolDamage() {
    console.log('Testing tool damage...');
    
    // Test Tuff Brick Stairs tool damage
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    const diamondPick = new DiamondPickaxe();
    
    // Test damage calculation
    const damage = placedStairs.calculateToolDamage(diamondPick, this.player);
    assert.strictEqual(typeof damage, 'number');
    assert.strictEqual(damage > 0, true);
  }

  testBreakingTime() {
    console.log('Testing breaking time...');
    
    // Test Tuff Brick Wall breaking time
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    const diamondPick = new DiamondPickaxe();
    const ironPick = new IronPickaxe();
    
    // Test breaking time calculation
    const diamondTime = placedWall.calculateBreakingTime(diamondPick, this.player);
    const ironTime = placedWall.calculateBreakingTime(ironPick, this.player);
    
    assert.strictEqual(typeof diamondTime, 'number');
    assert.strictEqual(typeof ironTime, 'number');
    assert.strictEqual(diamondTime < ironTime, true);
  }

  testToolRequirements() {
    console.log('Testing tool requirements...');
    
    // Test Tuff Brick Slab tool requirements
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    const diamondPick = new DiamondPickaxe();
    const ironPick = new IronPickaxe();
    const woodenPick = new WoodenPickaxe();
    
    // Test tool requirements
    assert.strictEqual(placedSlab.canBeMinedWith(diamondPick), true);
    assert.strictEqual(placedSlab.canBeMinedWith(ironPick), true);
    assert.strictEqual(placedSlab.canBeMinedWith(woodenPick), false);
  }
}

// Run tests
const test = new TuffVariantsDurabilityTest();
test.runTests();
console.log('All Tuff variants durability tests passed!');

module.exports = TuffVariantsDurabilityTest; 