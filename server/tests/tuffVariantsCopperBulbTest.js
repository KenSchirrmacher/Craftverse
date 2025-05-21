const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperBulbBlock = require('../blocks/copperBulbBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');

class TuffVariantsCopperBulbTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperBulbPlacement();
    this.testCopperBulbRedstone();
    this.testCopperBulbOxidation();
    this.testCopperBulbLight();
  }

  testCopperBulbPlacement() {
    console.log('Testing copper bulb placement...');
    
    // Test Tuff Bricks copper bulb placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper bulb
    const bulb = new CopperBulbBlock();
    const placedBulb = bulb.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper bulb placement
    assert.strictEqual(placedBricks.canSupportCopperBulb(), true);
    assert.strictEqual(placedBulb.isValidPlacement(), true);
    
    // Test copper bulb properties
    assert.strictEqual(placedBulb.getLightLevel(), 0);
    assert.strictEqual(placedBulb.isPowered(), false);
  }

  testCopperBulbRedstone() {
    console.log('Testing copper bulb redstone...');
    
    // Test Tuff Brick Wall copper bulb redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper bulb
    const bulb = new CopperBulbBlock();
    const placedBulb = bulb.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedBulb.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedBulb.isPowered(), true);
    assert.strictEqual(placedBulb.getPowerLevel(), 15);
  }

  testCopperBulbOxidation() {
    console.log('Testing copper bulb oxidation...');
    
    // Test Tuff Brick Slab copper bulb oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper bulb
    const bulb = new CopperBulbBlock();
    const placedBulb = bulb.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedBulb.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedBulb.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedBulb.getOxidationLevel(), 1);
  }

  testCopperBulbLight() {
    console.log('Testing copper bulb light...');
    
    // Test Tuff Brick Stairs copper bulb light
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper bulb
    const bulb = new CopperBulbBlock();
    const placedBulb = bulb.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test light properties
    assert.strictEqual(placedStairs.canSupportLight(), true);
    assert.strictEqual(placedBulb.canEmitLight(), true);
    
    // Test light levels
    assert.strictEqual(placedBulb.getLightLevel(), 0);
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedBulb.getLightLevel(), 15);
    
    // Test oxidation effect on light
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedBulb.getLightLevel(), 14);
  }
}

// Run tests
const test = new TuffVariantsCopperBulbTest();
test.runTests();
console.log('All Tuff variants copper bulb interaction tests passed!');

module.exports = TuffVariantsCopperBulbTest; 