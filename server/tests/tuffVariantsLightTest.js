const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { LightManager } = require('../managers/lightManager');
const { BlockFace } = require('../blocks/blockFace');

class TuffVariantsLightTest {
  constructor() {
    this.world = new TestWorld();
    this.lightManager = new LightManager(this.world);
  }

  runTests() {
    this.testLightOpacity();
    this.testLightPropagation();
    this.testLightEmission();
    this.testLightFiltering();
    this.testLightInteraction();
  }

  testLightOpacity() {
    console.log('Testing light opacity...');
    
    // Test Tuff Bricks light opacity
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test light opacity
    assert.strictEqual(placedBricks.getLightOpacity(), 15);
    assert.strictEqual(placedBricks.isTransparent(), false);
    assert.strictEqual(placedBricks.isTranslucent(), false);
  }

  testLightPropagation() {
    console.log('Testing light propagation...');
    
    // Test Chiseled Tuff light propagation
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place light source
    this.lightManager.addLightSource({ x: 2, y: 0, z: 2 }, 15);
    
    // Test light propagation
    const lightLevel = this.lightManager.getLightLevel({ x: 0, y: 0, z: 0 });
    assert.strictEqual(typeof lightLevel, 'number');
    assert.strictEqual(lightLevel < 15, true);
  }

  testLightEmission() {
    console.log('Testing light emission...');
    
    // Test Tuff Brick Stairs light emission
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test light emission
    assert.strictEqual(placedStairs.getLightEmission(), 0);
    assert.strictEqual(placedStairs.isLightSource(), false);
  }

  testLightFiltering() {
    console.log('Testing light filtering...');
    
    // Test Tuff Brick Wall light filtering
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test light filtering through different faces
    const northFace = placedWall.getLightFiltering(BlockFace.NORTH);
    const southFace = placedWall.getLightFiltering(BlockFace.SOUTH);
    
    assert.strictEqual(typeof northFace, 'number');
    assert.strictEqual(typeof southFace, 'number');
    assert.strictEqual(northFace === southFace, true);
  }

  testLightInteraction() {
    console.log('Testing light interaction...');
    
    // Test Tuff Brick Slab light interaction
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test light interaction with adjacent blocks
    const topLight = this.lightManager.getLightLevel({ x: 0, y: 1, z: 0 });
    const bottomLight = this.lightManager.getLightLevel({ x: 0, y: -1, z: 0 });
    
    assert.strictEqual(typeof topLight, 'number');
    assert.strictEqual(typeof bottomLight, 'number');
    assert.strictEqual(topLight !== bottomLight, true);
  }
}

// Run tests
const test = new TuffVariantsLightTest();
test.runTests();
console.log('All Tuff variants light tests passed!');

module.exports = TuffVariantsLightTest; 