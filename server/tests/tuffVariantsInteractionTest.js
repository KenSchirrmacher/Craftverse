const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { blockRegistry } = require('../blocks/blockRegistry');
const RedstoneManager = require('../systems/redstoneManager');
const PistonManager = require('../systems/pistonManager');
const ObserverManager = require('../systems/observerManager');

class TuffVariantsInteractionTest {
  constructor() {
    this.world = new TestWorld();
    this.redstoneManager = new RedstoneManager();
    this.pistonManager = new PistonManager();
    this.observerManager = new ObserverManager();
    this.blockRegistry = blockRegistry;
    
    // Register blocks before testing
    this.registerBlocks();
  }

  registerBlocks() {
    const chiseledTuff = new ChiseledTuffBlock();
    const tuffBricks = new TuffBricksBlock();
    const tuffBrickSlab = new TuffBrickSlabBlock();
    const tuffBrickStairs = new TuffBrickStairsBlock();
    const tuffBrickWall = new TuffBrickWallBlock();

    this.blockRegistry.registerBlock(chiseledTuff);
    this.blockRegistry.registerBlock(tuffBricks);
    this.blockRegistry.registerBlock(tuffBrickSlab);
    this.blockRegistry.registerBlock(tuffBrickStairs);
    this.blockRegistry.registerBlock(tuffBrickWall);
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
    
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test redstone power conduction
    this.redstoneManager.setPower(placedBricks, 15);
    assert.strictEqual(this.redstoneManager.getPower(placedBricks), 15, 'Redstone power not properly conducted');
    
    // Test redstone power decay
    this.redstoneManager.update();
    assert.strictEqual(this.redstoneManager.getPower(placedBricks), 14, 'Redstone power not properly decaying');
  }

  testPistonInteraction() {
    console.log('Testing piston interaction...');
    
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test piston pushing
    const canPush = this.pistonManager.canPush(placedWall);
    assert.strictEqual(canPush, true, 'Wall should be pushable by piston');
    
    // Test piston pulling
    const canPull = this.pistonManager.canPull(placedWall);
    assert.strictEqual(canPull, true, 'Wall should be pullable by piston');
  }

  testObserverDetection() {
    console.log('Testing observer detection...');
    
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test observer detection of block update
    const observer = this.observerManager.createObserver({ x: 1, y: 0, z: 0 });
    this.observerManager.faceBlock(observer, placedStairs);
    
    // Update block state
    placedStairs.setState('facing', 'north');
    const detected = this.observerManager.checkDetection(observer);
    assert.strictEqual(detected, true, 'Observer should detect block state change');
  }

  testWallConnections() {
    console.log('Testing wall connections...');
    
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test wall connection to solid block
    const solidBlock = this.blockRegistry.getBlock('stone');
    solidBlock.place(this.world, { x: 0, y: 0, z: 1 });
    
    const connections = wall.getConnections(this.world, { x: 0, y: 0, z: 0 });
    assert.strictEqual(connections.south, true, 'Wall should connect to solid block');
  }

  testStairPlacement() {
    console.log('Testing stair placement...');
    
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test stair placement against wall
    const wall = this.blockRegistry.getBlock('stone');
    wall.place(this.world, { x: 0, y: 0, z: 1 });
    
    const canPlace = stairs.canPlace(this.world, { x: 0, y: 0, z: 0 });
    assert.strictEqual(canPlace, true, 'Stairs should be placeable against wall');
  }

  testSlabPlacement() {
    console.log('Testing slab placement...');
    
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test slab placement on top of block
    const block = this.blockRegistry.getBlock('stone');
    block.place(this.world, { x: 0, y: -1, z: 0 });
    
    const canPlace = slab.canPlace(this.world, { x: 0, y: 0, z: 0 });
    assert.strictEqual(canPlace, true, 'Slab should be placeable on top of block');
  }
}

// Run tests
const test = new TuffVariantsInteractionTest();
test.runTests();
console.log('All Tuff variants interaction tests passed!');

module.exports = TuffVariantsInteractionTest; 