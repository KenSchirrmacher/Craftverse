const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperComparatorBlock = require('../blocks/copperComparatorBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');
const ItemStack = require('../items/itemStack');

class TuffVariantsCopperComparatorTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperComparatorPlacement();
    this.testCopperComparatorRedstone();
    this.testCopperComparatorOxidation();
    this.testCopperComparatorInteraction();
  }

  testCopperComparatorPlacement() {
    console.log('Testing copper comparator placement...');
    
    // Test Tuff Bricks copper comparator placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper comparator
    const comparator = new CopperComparatorBlock();
    const placedComparator = comparator.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper comparator placement
    assert.strictEqual(placedBricks.canSupportCopperComparator(), true);
    assert.strictEqual(placedComparator.isValidPlacement(), true);
    
    // Test copper comparator properties
    assert.strictEqual(placedComparator.isPowered(), false);
    assert.strictEqual(placedComparator.getFacing(), 'north');
    assert.strictEqual(placedComparator.getMode(), 'compare');
  }

  testCopperComparatorRedstone() {
    console.log('Testing copper comparator redstone...');
    
    // Test Tuff Brick Wall copper comparator redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper comparator
    const comparator = new CopperComparatorBlock();
    const placedComparator = comparator.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedComparator.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedComparator.isPowered(), true);
    assert.strictEqual(placedComparator.getPowerLevel(), 15);
  }

  testCopperComparatorOxidation() {
    console.log('Testing copper comparator oxidation...');
    
    // Test Tuff Brick Slab copper comparator oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper comparator
    const comparator = new CopperComparatorBlock();
    const placedComparator = comparator.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedComparator.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedComparator.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedComparator.getOxidationLevel(), 1);
  }

  testCopperComparatorInteraction() {
    console.log('Testing copper comparator interaction...');
    
    // Test Tuff Brick Stairs copper comparator interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper comparator
    const comparator = new CopperComparatorBlock();
    const placedComparator = comparator.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedComparator.canInteract(), true);
    
    // Test comparator mode toggle
    placedComparator.onInteract(player);
    assert.strictEqual(placedComparator.getMode(), 'subtract');
    
    // Test item comparison
    const itemStack = new ItemStack('diamond', 64);
    assert.strictEqual(placedComparator.compareItems(itemStack), 15);
    
    // Test oxidation effect on comparison speed
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedComparator.getComparisonSpeed(), 0.9);
  }
}

// Run tests
const test = new TuffVariantsCopperComparatorTest();
test.runTests();
console.log('All Tuff variants copper comparator interaction tests passed!');

module.exports = TuffVariantsCopperComparatorTest; 