const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const HoneyBlock = require('../blocks/honeyBlock');
const MudBlock = require('../blocks/mudBlock');

class TuffVariantsSpecialFluidTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testHoneyInteraction();
    this.testMudInteraction();
    this.testFluidViscosity();
    this.testFluidMixing();
  }

  testHoneyInteraction() {
    console.log('Testing honey interaction...');
    
    // Test Tuff Bricks honey interaction
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place honey
    const honey = new HoneyBlock();
    honey.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test honey interaction
    assert.strictEqual(placedBricks.isHoneyLogged(), false);
    assert.strictEqual(placedBricks.canBeHoneyLogged(), true);
    
    // Test honey viscosity effect
    assert.strictEqual(placedBricks.getHoneyViscosity(), 0);
    placedBricks.setHoneyLogged(true);
    assert.strictEqual(placedBricks.getHoneyViscosity(), 0.8);
  }

  testMudInteraction() {
    console.log('Testing mud interaction...');
    
    // Test Tuff Brick Wall mud interaction
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place mud
    const mud = new MudBlock();
    mud.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test mud interaction
    assert.strictEqual(placedWall.isMudLogged(), false);
    assert.strictEqual(placedWall.canBeMudLogged(), true);
    
    // Test mud effects
    assert.strictEqual(placedWall.getMudEffect(), 'none');
    placedWall.setMudLogged(true);
    assert.strictEqual(placedWall.getMudEffect(), 'slowing');
  }

  testFluidViscosity() {
    console.log('Testing fluid viscosity...');
    
    // Test Tuff Brick Slab fluid viscosity
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place honey
    const honey = new HoneyBlock();
    honey.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test viscosity effects
    assert.strictEqual(placedSlab.getFluidViscosity(), 0);
    placedSlab.setHoneyLogged(true);
    assert.strictEqual(placedSlab.getFluidViscosity(), 0.8);
    
    // Test mud viscosity
    const mud = new MudBlock();
    mud.place(this.world, { x: 1, y: 1, z: 0 });
    placedSlab.setMudLogged(true);
    assert.strictEqual(placedSlab.getFluidViscosity(), 0.6);
  }

  testFluidMixing() {
    console.log('Testing fluid mixing...');
    
    // Test Tuff Brick Stairs fluid mixing
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place honey and mud
    const honey = new HoneyBlock();
    const mud = new MudBlock();
    honey.place(this.world, { x: 0, y: 1, z: 0 });
    mud.place(this.world, { x: 1, y: 1, z: 0 });
    
    // Test fluid mixing
    assert.strictEqual(placedStairs.getFluidMix(), 'none');
    placedStairs.setHoneyLogged(true);
    placedStairs.setMudLogged(true);
    assert.strictEqual(placedStairs.getFluidMix(), 'honey_mud');
    
    // Test mixed fluid effects
    const mixedEffects = placedStairs.getMixedFluidEffects();
    assert.strictEqual(mixedEffects.viscosity, 0.7);
    assert.strictEqual(mixedEffects.slowing, true);
  }
}

// Run tests
const test = new TuffVariantsSpecialFluidTest();
test.runTests();
console.log('All Tuff variants special fluid interaction tests passed!');

module.exports = TuffVariantsSpecialFluidTest; 