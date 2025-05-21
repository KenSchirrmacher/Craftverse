const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const SculkBlock = require('../blocks/sculkBlock');
const SculkVeinBlock = require('../blocks/sculkVeinBlock');
const SculkCatalystBlock = require('../blocks/sculkCatalystBlock');
const SculkSensorBlock = require('../blocks/sculkSensorBlock');
const SculkShriekerBlock = require('../blocks/sculkShriekerBlock');
const Player = require('../entities/player');

class TuffVariantsSculkTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testSculkSpreading();
    this.testSculkVeinInteraction();
    this.testSculkCatalystInteraction();
    this.testSculkSensorInteraction();
    this.testSculkShriekerInteraction();
  }

  testSculkSpreading() {
    console.log('Testing sculk spreading...');
    
    // Test Tuff Bricks sculk spreading
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create sculk block
    const sculk = new SculkBlock();
    const placedSculk = sculk.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test sculk placement
    assert.strictEqual(placedBricks.canSupportSculk(), true);
    assert.strictEqual(placedSculk.isValidPlacement(), true);
    
    // Test sculk properties
    assert.strictEqual(placedSculk.getSpreadLevel(), 0);
    assert.strictEqual(placedSculk.canSpread(), true);
    
    // Test sculk spreading
    placedSculk.spread();
    assert.strictEqual(placedSculk.getSpreadLevel(), 1);
  }

  testSculkVeinInteraction() {
    console.log('Testing sculk vein interaction...');
    
    // Test Tuff Brick Wall sculk vein interaction
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create sculk vein
    const vein = new SculkVeinBlock();
    const placedVein = vein.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test sculk vein placement
    assert.strictEqual(placedWall.canSupportSculkVein(), true);
    assert.strictEqual(placedVein.isValidPlacement(), true);
    
    // Test sculk vein properties
    assert.strictEqual(placedVein.getFace(), 'north');
    assert.strictEqual(placedVein.canSpread(), true);
    
    // Test sculk vein spreading
    placedVein.spread();
    assert.strictEqual(placedVein.getSpreadLevel(), 1);
  }

  testSculkCatalystInteraction() {
    console.log('Testing sculk catalyst interaction...');
    
    // Test Tuff Brick Slab sculk catalyst interaction
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create sculk catalyst
    const catalyst = new SculkCatalystBlock();
    const placedCatalyst = catalyst.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test sculk catalyst placement
    assert.strictEqual(placedSlab.canSupportSculkCatalyst(), true);
    assert.strictEqual(placedCatalyst.isValidPlacement(), true);
    
    // Test sculk catalyst properties
    assert.strictEqual(placedCatalyst.isActive(), true);
    assert.strictEqual(placedCatalyst.getRange(), 8);
    
    // Test sculk catalyst activation
    const player = new Player();
    player.position = { x: 0, y: 2, z: 0 };
    placedCatalyst.onEntityDeath(player);
    assert.strictEqual(placedCatalyst.getSpreadLevel(), 1);
  }

  testSculkSensorInteraction() {
    console.log('Testing sculk sensor interaction...');
    
    // Test Tuff Brick Stairs sculk sensor interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create sculk sensor
    const sensor = new SculkSensorBlock();
    const placedSensor = sensor.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test sculk sensor placement
    assert.strictEqual(placedStairs.canSupportSculkSensor(), true);
    assert.strictEqual(placedSensor.isValidPlacement(), true);
    
    // Test sculk sensor properties
    assert.strictEqual(placedSensor.isActive(), false);
    assert.strictEqual(placedSensor.getRange(), 8);
    
    // Test sculk sensor activation
    const player = new Player();
    player.position = { x: 0, y: 2, z: 0 };
    placedSensor.onVibration(player);
    assert.strictEqual(placedSensor.isActive(), true);
  }

  testSculkShriekerInteraction() {
    console.log('Testing sculk shrieker interaction...');
    
    // Test Chiseled Tuff sculk shrieker interaction
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create sculk shrieker
    const shrieker = new SculkShriekerBlock();
    const placedShrieker = shrieker.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test sculk shrieker placement
    assert.strictEqual(placedChiseled.canSupportSculkShrieker(), true);
    assert.strictEqual(placedShrieker.isValidPlacement(), true);
    
    // Test sculk shrieker properties
    assert.strictEqual(placedShrieker.isActive(), false);
    assert.strictEqual(placedShrieker.getWarningLevel(), 0);
    
    // Test sculk shrieker activation
    const player = new Player();
    player.position = { x: 0, y: 2, z: 0 };
    placedShrieker.onVibration(player);
    assert.strictEqual(placedShrieker.isActive(), true);
    assert.strictEqual(placedShrieker.getWarningLevel(), 1);
  }
}

// Run tests
const test = new TuffVariantsSculkTest();
test.runTests();
console.log('All Tuff variants sculk interaction tests passed!');

module.exports = TuffVariantsSculkTest; 