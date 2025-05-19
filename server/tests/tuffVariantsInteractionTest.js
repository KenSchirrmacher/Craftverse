const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { RedstoneBlock, PistonBlock, ObserverBlock } = require('../blocks/redstone');
const { WallBlock } = require('../blocks/walls');

class TuffVariantsInteractionTest {
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
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place redstone block adjacent
    const redstone = new RedstoneBlock();
    redstone.place(this.world, { x: 1, y: 0, z: 0 });
    
    // Verify redstone conduction
    assert.strictEqual(placedBricks.isRedstoneConductor(), true);
    assert.strictEqual(placedBricks.getRedstonePower(), 15);
  }

  testPistonInteraction() {
    console.log('Testing piston interaction...');
    
    // Test Tuff Brick Stairs piston interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place piston adjacent
    const piston = new PistonBlock();
    piston.place(this.world, { x: 1, y: 0, z: 0 });
    
    // Test piston pushing
    assert.strictEqual(placedStairs.isPushable(), true);
    piston.extend();
    assert.strictEqual(this.world.getBlock({ x: 0, y: 0, z: 0 }), null);
    assert.strictEqual(this.world.getBlock({ x: 2, y: 0, z: 0 }), placedStairs);
  }

  testObserverDetection() {
    console.log('Testing observer detection...');
    
    // Test Chiseled Tuff observer detection
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place observer adjacent
    const observer = new ObserverBlock();
    observer.place(this.world, { x: 1, y: 0, z: 0 });
    
    // Test state change detection
    let detectionCount = 0;
    observer.onBlockUpdate = () => detectionCount++;
    
    placedChiseled.setState('pattern', 'zigzag');
    assert.strictEqual(detectionCount, 1);
  }

  testWallConnections() {
    console.log('Testing wall connections...');
    
    // Test Tuff Brick Wall connections
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place connecting walls
    const wall2 = new WallBlock();
    wall2.place(this.world, { x: 1, y: 0, z: 0 });
    
    // Verify wall connections
    assert.strictEqual(placedWall.getState('east'), 'tall');
    assert.strictEqual(wall2.getState('west'), 'tall');
  }

  testStairPlacement() {
    console.log('Testing stair placement...');
    
    // Test Tuff Brick Stairs placement
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test stair connection
    const stairs2 = new TuffBrickStairsBlock();
    stairs2.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Verify stair connection
    assert.strictEqual(placedStairs.getState('shape'), 'straight');
    assert.strictEqual(stairs2.getState('shape'), 'straight');
  }

  testSlabPlacement() {
    console.log('Testing slab placement...');
    
    // Test Tuff Brick Slab placement
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test double slab formation
    const slab2 = new TuffBrickSlabBlock();
    slab2.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Verify double slab formation
    assert.strictEqual(this.world.getBlock({ x: 0, y: 0, z: 0 }).getState('type'), 'double');
  }
}

// Run tests
const test = new TuffVariantsInteractionTest();
test.runTests();
console.log('All Tuff variants interaction tests passed!');

module.exports = TuffVariantsInteractionTest; 