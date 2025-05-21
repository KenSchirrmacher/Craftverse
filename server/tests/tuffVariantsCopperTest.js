const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperBlock = require('../blocks/copperBlock');
const CopperBulbBlock = require('../blocks/copperBulbBlock');
const CopperGrateBlock = require('../blocks/copperGrateBlock');
const RedstoneBlock = require('../blocks/redstoneBlock');
const WaterBlock = require('../blocks/waterBlock');

class TuffVariantsCopperTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testCopperOxidation();
    this.testCopperBulbInteraction();
    this.testCopperGrateInteraction();
    this.testRedstoneConduction();
  }

  testCopperOxidation() {
    console.log('Testing copper oxidation...');
    
    // Test Tuff Bricks copper oxidation
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper block
    const copper = new CopperBlock();
    const placedCopper = copper.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper placement
    assert.strictEqual(placedBricks.canSupportCopper(), true);
    assert.strictEqual(placedCopper.isValidPlacement(), true);
    
    // Test copper properties
    assert.strictEqual(placedCopper.getOxidationLevel(), 0);
    assert.strictEqual(placedCopper.isWaxed(), false);
    
    // Test copper oxidation
    placedCopper.oxidize();
    assert.strictEqual(placedCopper.getOxidationLevel(), 1);
    
    // Test copper waxing
    placedCopper.wax();
    assert.strictEqual(placedCopper.isWaxed(), true);
    placedCopper.oxidize();
    assert.strictEqual(placedCopper.getOxidationLevel(), 1); // Should not oxidize when waxed
  }

  testCopperBulbInteraction() {
    console.log('Testing copper bulb interaction...');
    
    // Test Tuff Brick Wall copper bulb interaction
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper bulb
    const copperBulb = new CopperBulbBlock();
    const placedBulb = copperBulb.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper bulb placement
    assert.strictEqual(placedWall.canSupportCopperBulb(), true);
    assert.strictEqual(placedBulb.isValidPlacement(), true);
    
    // Test copper bulb properties
    assert.strictEqual(placedBulb.getLightLevel(), 0);
    assert.strictEqual(placedBulb.isPowered(), false);
    
    // Test copper bulb power
    const redstone = new RedstoneBlock();
    redstone.place(this.world, { x: 0, y: 2, z: 0 });
    placedBulb.update();
    assert.strictEqual(placedBulb.isPowered(), true);
    assert.strictEqual(placedBulb.getLightLevel(), 15);
  }

  testCopperGrateInteraction() {
    console.log('Testing copper grate interaction...');
    
    // Test Tuff Brick Slab copper grate interaction
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper grate
    const copperGrate = new CopperGrateBlock();
    const placedGrate = copperGrate.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper grate placement
    assert.strictEqual(placedSlab.canSupportCopperGrate(), true);
    assert.strictEqual(placedGrate.isValidPlacement(), true);
    
    // Test copper grate properties
    assert.strictEqual(placedGrate.isWaterlogged(), false);
    assert.strictEqual(placedGrate.getOxidationLevel(), 0);
    
    // Test copper grate waterlogging
    const water = new WaterBlock();
    water.place(this.world, { x: 0, y: 2, z: 0 });
    placedGrate.update();
    assert.strictEqual(placedGrate.isWaterlogged(), true);
  }

  testRedstoneConduction() {
    console.log('Testing redstone conduction...');
    
    // Test Tuff Brick Stairs redstone conduction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper block
    const copper = new CopperBlock();
    const placedCopper = copper.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone conduction
    assert.strictEqual(placedStairs.canConductRedstone(), true);
    assert.strictEqual(placedCopper.canConductRedstone(), true);
    
    // Test redstone power
    const redstone = new RedstoneBlock();
    redstone.place(this.world, { x: 0, y: 2, z: 0 });
    placedCopper.update();
    assert.strictEqual(placedCopper.isPowered(), true);
    assert.strictEqual(placedCopper.getPowerLevel(), 15);
  }
}

// Run tests
const test = new TuffVariantsCopperTest();
test.runTests();
console.log('All Tuff variants copper interaction tests passed!');

module.exports = TuffVariantsCopperTest; 