const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const Firefly = require('../entities/firefly');
const LightBlock = require('../blocks/lightBlock');

class TuffVariantsFireflyTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testFireflyInteraction();
    this.testFireflyLighting();
    this.testFireflyMovement();
    this.testFireflyBehavior();
  }

  testFireflyInteraction() {
    console.log('Testing firefly interaction...');
    
    // Test Tuff Bricks firefly interaction
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create firefly
    const firefly = new Firefly();
    const placedFirefly = firefly.spawn(this.world, { x: 0, y: 1, z: 0 });
    
    // Test firefly placement
    assert.strictEqual(placedBricks.canSupportFirefly(), true);
    assert.strictEqual(placedFirefly.isValidPlacement(), true);
    
    // Test firefly properties
    assert.strictEqual(placedFirefly.getLightLevel(), 0);
    assert.strictEqual(placedFirefly.getSize(), 'small');
  }

  testFireflyLighting() {
    console.log('Testing firefly lighting...');
    
    // Test Tuff Brick Wall firefly lighting
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create firefly
    const firefly = new Firefly();
    const placedFirefly = firefly.spawn(this.world, { x: 0, y: 1, z: 0 });
    
    // Test firefly lighting
    assert.strictEqual(placedFirefly.canEmitLight(), true);
    placedFirefly.emitLight();
    assert.strictEqual(placedFirefly.getLightLevel(), 3);
    
    // Test light block creation
    const lightBlock = new LightBlock();
    const placedLight = lightBlock.place(this.world, { x: 0, y: 2, z: 0 });
    assert.strictEqual(placedLight.getLightLevel(), 3);
  }

  testFireflyMovement() {
    console.log('Testing firefly movement...');
    
    // Test Tuff Brick Slab firefly movement
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create firefly
    const firefly = new Firefly();
    const placedFirefly = firefly.spawn(this.world, { x: 0, y: 1, z: 0 });
    
    // Test firefly movement
    assert.strictEqual(placedFirefly.canMove(), true);
    const initialPos = placedFirefly.getPosition();
    placedFirefly.move({ x: 1, y: 0, z: 0 });
    assert.strictEqual(placedFirefly.getPosition().x, initialPos.x + 1);
    
    // Test movement patterns
    assert.strictEqual(placedFirefly.getMovementPattern(), 'random');
    placedFirefly.setMovementPattern('circular');
    assert.strictEqual(placedFirefly.getMovementPattern(), 'circular');
  }

  testFireflyBehavior() {
    console.log('Testing firefly behavior...');
    
    // Test Tuff Brick Stairs firefly behavior
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create firefly
    const firefly = new Firefly();
    const placedFirefly = firefly.spawn(this.world, { x: 0, y: 1, z: 0 });
    
    // Test firefly behavior
    assert.strictEqual(placedFirefly.getBehavior(), 'idle');
    placedFirefly.setBehavior('mating');
    assert.strictEqual(placedFirefly.getBehavior(), 'mating');
    
    // Test behavior transitions
    assert.strictEqual(placedFirefly.canTransitionBehavior(), true);
    placedFirefly.transitionBehavior('feeding');
    assert.strictEqual(placedFirefly.getBehavior(), 'feeding');
    
    // Test behavior effects
    assert.strictEqual(placedFirefly.getLightPattern(), 'steady');
    placedFirefly.setLightPattern('flashing');
    assert.strictEqual(placedFirefly.getLightPattern(), 'flashing');
  }
}

// Run tests
const test = new TuffVariantsFireflyTest();
test.runTests();
console.log('All Tuff variants firefly interaction tests passed!');

module.exports = TuffVariantsFireflyTest; 