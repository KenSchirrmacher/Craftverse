const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const Frog = require('../entities/frog');
const Tadpole = require('../entities/tadpole');
const WaterBlock = require('../blocks/waterBlock');

class TuffVariantsFrogTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testFrogInteraction();
    this.testTadpoleInteraction();
    this.testFrogJumping();
    this.testTadpoleGrowth();
  }

  testFrogInteraction() {
    console.log('Testing frog interaction...');
    
    // Test Tuff Bricks frog interaction
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create frog
    const frog = new Frog();
    const placedFrog = frog.spawn(this.world, { x: 0, y: 1, z: 0 });
    
    // Test frog placement
    assert.strictEqual(placedBricks.canSupportFrog(), true);
    assert.strictEqual(placedFrog.isValidPlacement(), true);
    
    // Test frog properties
    assert.strictEqual(placedFrog.getVariant(), 'temperate');
    assert.strictEqual(placedFrog.getSize(), 'normal');
  }

  testTadpoleInteraction() {
    console.log('Testing tadpole interaction...');
    
    // Test Tuff Brick Wall tadpole interaction
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create tadpole
    const tadpole = new Tadpole();
    const placedTadpole = tadpole.spawn(this.world, { x: 0, y: 1, z: 0 });
    
    // Test tadpole placement
    assert.strictEqual(placedWall.canSupportTadpole(), true);
    assert.strictEqual(placedTadpole.isValidPlacement(), true);
    
    // Test tadpole properties
    assert.strictEqual(placedTadpole.getAge(), 0);
    assert.strictEqual(placedTadpole.getSize(), 'small');
  }

  testFrogJumping() {
    console.log('Testing frog jumping...');
    
    // Test Tuff Brick Slab frog jumping
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create frog
    const frog = new Frog();
    const placedFrog = frog.spawn(this.world, { x: 0, y: 1, z: 0 });
    
    // Test frog jumping
    assert.strictEqual(placedFrog.canJump(), true);
    const initialY = placedFrog.getPosition().y;
    placedFrog.jump();
    assert.strictEqual(placedFrog.getPosition().y, initialY + 1);
    
    // Test jump landing
    assert.strictEqual(placedFrog.isJumping(), true);
    placedFrog.land();
    assert.strictEqual(placedFrog.isJumping(), false);
  }

  testTadpoleGrowth() {
    console.log('Testing tadpole growth...');
    
    // Test Tuff Brick Stairs tadpole growth
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create tadpole
    const tadpole = new Tadpole();
    const placedTadpole = tadpole.spawn(this.world, { x: 0, y: 1, z: 0 });
    
    // Place water block
    const water = new WaterBlock();
    const placedWater = water.place(this.world, { x: 0, y: 2, z: 0 });
    
    // Test tadpole growth
    assert.strictEqual(placedTadpole.canGrow(), true);
    const initialAge = placedTadpole.getAge();
    placedTadpole.grow();
    assert.strictEqual(placedTadpole.getAge(), initialAge + 1);
    
    // Test growth stages
    assert.strictEqual(placedTadpole.getGrowthStage(), 'tadpole');
    placedTadpole.setAge(20);
    assert.strictEqual(placedTadpole.getGrowthStage(), 'froglet');
    placedTadpole.setAge(40);
    assert.strictEqual(placedTadpole.getGrowthStage(), 'adult');
  }
}

// Run tests
const test = new TuffVariantsFrogTest();
test.runTests();
console.log('All Tuff variants frog interaction tests passed!');

module.exports = TuffVariantsFrogTest; 