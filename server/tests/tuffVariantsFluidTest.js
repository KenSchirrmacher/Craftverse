const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const WaterBlock = require('../blocks/waterBlock');
const LavaBlock = require('../blocks/lavaBlock');

class TuffVariantsFluidTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testWaterInteraction();
    this.testLavaInteraction();
    this.testFluidFlow();
    this.testFluidSource();
  }

  testWaterInteraction() {
    console.log('Testing water interaction...');
    
    // Test Tuff Bricks water interaction
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place water
    const water = new WaterBlock();
    water.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test water interaction
    assert.strictEqual(placedBricks.isWaterlogged(), false);
    assert.strictEqual(placedBricks.canBeWaterlogged(), true);
    
    // Test waterlogging
    placedBricks.setWaterlogged(true);
    assert.strictEqual(placedBricks.isWaterlogged(), true);
  }

  testLavaInteraction() {
    console.log('Testing lava interaction...');
    
    // Test Tuff Brick Wall lava interaction
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place lava
    const lava = new LavaBlock();
    lava.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test lava interaction
    assert.strictEqual(placedWall.isLavaLogged(), false);
    assert.strictEqual(placedWall.canBeLavaLogged(), false);
    
    // Test lava damage
    assert.strictEqual(placedWall.isLavaResistant(), true);
  }

  testFluidFlow() {
    console.log('Testing fluid flow...');
    
    // Test Tuff Brick Slab fluid flow
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place water source
    const water = new WaterBlock();
    water.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test fluid flow
    assert.strictEqual(placedSlab.blocksFluidFlow(), true);
    assert.strictEqual(placedSlab.getFluidLevel(), 0);
  }

  testFluidSource() {
    console.log('Testing fluid source...');
    
    // Test Tuff Brick Stairs fluid source
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place water source
    const water = new WaterBlock();
    water.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test fluid source interaction
    assert.strictEqual(placedStairs.blocksFluidSource(), true);
    assert.strictEqual(placedStairs.getFluidSourceLevel(), 0);
  }
}

// Run tests
const test = new TuffVariantsFluidTest();
test.runTests();
console.log('All Tuff variants fluid interaction tests passed!');

module.exports = TuffVariantsFluidTest; 