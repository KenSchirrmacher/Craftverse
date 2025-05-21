const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperGrateBlock = require('../blocks/copperGrateBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');
const Item = require('../items/item');

class TuffVariantsCopperGrateTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperGratePlacement();
    this.testCopperGrateRedstone();
    this.testCopperGrateOxidation();
    this.testCopperGrateFiltering();
  }

  testCopperGratePlacement() {
    console.log('Testing copper grate placement...');
    
    // Test Tuff Bricks copper grate placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper grate
    const grate = new CopperGrateBlock();
    const placedGrate = grate.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper grate placement
    assert.strictEqual(placedBricks.canSupportCopperGrate(), true);
    assert.strictEqual(placedGrate.isValidPlacement(), true);
    
    // Test copper grate properties
    assert.strictEqual(placedGrate.isPowered(), false);
    assert.strictEqual(placedGrate.getFilterMode(), 'none');
  }

  testCopperGrateRedstone() {
    console.log('Testing copper grate redstone...');
    
    // Test Tuff Brick Wall copper grate redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper grate
    const grate = new CopperGrateBlock();
    const placedGrate = grate.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedGrate.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedGrate.isPowered(), true);
    assert.strictEqual(placedGrate.getPowerLevel(), 15);
  }

  testCopperGrateOxidation() {
    console.log('Testing copper grate oxidation...');
    
    // Test Tuff Brick Slab copper grate oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper grate
    const grate = new CopperGrateBlock();
    const placedGrate = grate.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedGrate.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedGrate.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedGrate.getOxidationLevel(), 1);
  }

  testCopperGrateFiltering() {
    console.log('Testing copper grate filtering...');
    
    // Test Tuff Brick Stairs copper grate filtering
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper grate
    const grate = new CopperGrateBlock();
    const placedGrate = grate.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create test items
    const item1 = new Item('diamond');
    const item2 = new Item('iron_ingot');
    
    // Test filtering properties
    assert.strictEqual(placedStairs.canSupportFilter(), true);
    assert.strictEqual(placedGrate.canFilter(), true);
    
    // Test item filtering
    placedGrate.setFilterMode('whitelist');
    placedGrate.addToFilter('diamond');
    assert.strictEqual(placedGrate.canPassItem(item1), true);
    assert.strictEqual(placedGrate.canPassItem(item2), false);
    
    // Test oxidation effect on filtering
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedGrate.getFilterEfficiency(), 0.9);
  }
}

// Run tests
const test = new TuffVariantsCopperGrateTest();
test.runTests();
console.log('All Tuff variants copper grate interaction tests passed!');

module.exports = TuffVariantsCopperGrateTest; 