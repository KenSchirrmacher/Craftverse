const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { WaterBlock } = require('../blocks/water');
const { LavaBlock } = require('../blocks/lava');
const { FluidManager } = require('../managers/fluidManager');

class TuffVariantsFluidTest {
  constructor() {
    this.world = new TestWorld();
    this.fluidManager = new FluidManager(this.world);
  }

  runTests() {
    this.testFluidPermeability();
    this.testWaterInteraction();
    this.testLavaInteraction();
    this.testFluidFlow();
    this.testFluidDisplacement();
  }

  testFluidPermeability() {
    console.log('Testing fluid permeability...');
    
    // Test Tuff Bricks fluid permeability
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test permeability properties
    assert.strictEqual(placedBricks.isPermeable(), false);
    assert.strictEqual(placedBricks.canFluidPass(), false);
    assert.strictEqual(placedBricks.getFluidResistance(), 100);
  }

  testWaterInteraction() {
    console.log('Testing water interaction...');
    
    // Test Chiseled Tuff water interaction
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place water
    const water = new WaterBlock();
    water.place(this.world, { x: 1, y: 0, z: 0 });
    
    // Test water interaction
    const waterLevel = this.fluidManager.getFluidLevel({ x: 0, y: 0, z: 0 });
    assert.strictEqual(typeof waterLevel, 'number');
    assert.strictEqual(waterLevel, 0);
  }

  testLavaInteraction() {
    console.log('Testing lava interaction...');
    
    // Test Tuff Brick Stairs lava interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place lava
    const lava = new LavaBlock();
    lava.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test lava interaction
    const lavaLevel = this.fluidManager.getFluidLevel({ x: 0, y: 0, z: 0 });
    assert.strictEqual(typeof lavaLevel, 'number');
    assert.strictEqual(lavaLevel, 0);
  }

  testFluidFlow() {
    console.log('Testing fluid flow...');
    
    // Test Tuff Brick Wall fluid flow
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place water source
    const water = new WaterBlock();
    water.place(this.world, { x: 2, y: 0, z: 0 });
    
    // Test fluid flow around block
    const flowDirections = this.fluidManager.getFluidFlowDirections({ x: 0, y: 0, z: 0 });
    assert.strictEqual(Array.isArray(flowDirections), true);
    assert.strictEqual(flowDirections.length > 0, true);
  }

  testFluidDisplacement() {
    console.log('Testing fluid displacement...');
    
    // Test Tuff Brick Slab fluid displacement
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place water
    const water = new WaterBlock();
    water.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test fluid displacement
    const displacedFluid = this.fluidManager.getDisplacedFluid({ x: 0, y: 0, z: 0 });
    assert.strictEqual(displacedFluid !== null, true);
    assert.strictEqual(displacedFluid.type, 'water');
  }
}

// Run tests
const test = new TuffVariantsFluidTest();
test.runTests();
console.log('All Tuff variants fluid tests passed!');

module.exports = TuffVariantsFluidTest; 