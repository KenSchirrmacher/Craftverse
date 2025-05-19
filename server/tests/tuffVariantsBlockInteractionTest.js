const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const RedstoneBlock = require('../blocks/redstoneBlock');
const PistonBlock = require('../blocks/pistonBlock');
const ObserverBlock = require('../blocks/observerBlock');

class TuffVariantsBlockInteractionTest {
  constructor() {
    this.world = new TestWorld();
  }

  runTests() {
    this.testRedstoneConduction();
    this.testPistonInteraction();
    this.testObserverDetection();
    this.testWallConnections();
    this.testStairPlacement();
    this.testSlabPlacement();
  }

  testRedstoneConduction() {
    console.log('Testing redstone conduction...');
    
    // Test Tuff Bricks redstone conduction
    const bricks = new TuffBricksBlock();
    const redstone = new RedstoneBlock();
    
    // Place blocks
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    const placedRedstone = redstone.place(this.world, { x: 1, y: 0, z: 0 });
    
    // Test redstone conduction
    assert.strictEqual(placedBricks.canConductRedstone(), false);
    assert.strictEqual(placedRedstone.canConductRedstone(), true);
    
    // Test redstone power level
    placedRedstone.setPowerLevel(15);
    assert.strictEqual(placedBricks.getPowerLevel(), 0);
  }

  testPistonInteraction() {
    console.log('Testing piston interaction...');
    
    // Test Tuff Bricks piston interaction
    const bricks = new TuffBricksBlock();
    const piston = new PistonBlock();
    
    // Place blocks
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    const placedPiston = piston.place(this.world, { x: 1, y: 0, z: 0 });
    
    // Test piston pushing
    assert.strictEqual(placedBricks.canBePushed(), true);
    assert.strictEqual(placedBricks.canBePulled(), true);
    
    // Test piston behavior
    placedPiston.extend();
    assert.strictEqual(placedBricks.isBeingPushed(), true);
  }

  testObserverDetection() {
    console.log('Testing observer detection...');
    
    // Test Tuff Bricks observer detection
    const bricks = new TuffBricksBlock();
    const observer = new ObserverBlock();
    
    // Place blocks
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    const placedObserver = observer.place(this.world, { x: 1, y: 0, z: 0 });
    
    // Test observer detection
    assert.strictEqual(placedBricks.canBeObserved(), true);
    placedBricks.onBlockUpdate();
    assert.strictEqual(placedObserver.hasDetectedChange(), true);
  }

  testWallConnections() {
    console.log('Testing wall connections...');
    
    // Test Tuff Brick Wall connections
    const wall = new TuffBrickWallBlock();
    const bricks = new TuffBricksBlock();
    
    // Place blocks
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    const placedBricks = bricks.place(this.world, { x: 1, y: 0, z: 0 });
    
    // Test wall connections
    assert.strictEqual(placedWall.hasConnection('north'), false);
    assert.strictEqual(placedWall.hasConnection('east'), true);
    assert.strictEqual(placedWall.hasConnection('south'), false);
    assert.strictEqual(placedWall.hasConnection('west'), false);
  }

  testStairPlacement() {
    console.log('Testing stair placement...');
    
    // Test Tuff Brick Stairs placement
    const stairs = new TuffBrickStairsBlock();
    
    // Test different orientations
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    assert.strictEqual(placedStairs.getFacing(), 'north');
    
    // Test stair shape
    assert.strictEqual(placedStairs.getShape(), 'straight');
    
    // Test stair waterlogging
    assert.strictEqual(placedStairs.isWaterlogged(), false);
    placedStairs.setWaterlogged(true);
    assert.strictEqual(placedStairs.isWaterlogged(), true);
  }

  testSlabPlacement() {
    console.log('Testing slab placement...');
    
    // Test Tuff Brick Slab placement
    const slab = new TuffBrickSlabBlock();
    
    // Test different positions
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    assert.strictEqual(placedSlab.getPosition(), 'bottom');
    
    // Test slab type
    assert.strictEqual(placedSlab.getType(), 'single');
    
    // Test slab waterlogging
    assert.strictEqual(placedSlab.isWaterlogged(), false);
    placedSlab.setWaterlogged(true);
    assert.strictEqual(placedSlab.isWaterlogged(), true);
  }
}

// Run tests
const test = new TuffVariantsBlockInteractionTest();
test.runTests();
console.log('All Tuff variants block interaction tests passed!');

module.exports = TuffVariantsBlockInteractionTest; 