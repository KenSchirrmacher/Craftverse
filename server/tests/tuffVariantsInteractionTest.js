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
    try {
      console.log('Starting Tuff variants interaction tests...');
      this.testRedstoneConduction();
      this.testPistonInteraction();
      this.testObserverDetection();
      this.testWallConnections();
      this.testStairPlacement();
      this.testSlabPlacement();
      console.log('All Tuff variants interaction tests passed!');
      process.exit(0);
    } catch (error) {
      console.error('Test failed:', error);
      process.exit(1);
    }
  }

  testRedstoneConduction() {
    console.log('Testing redstone conduction...');
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    assert(placedBricks, 'Failed to place Tuff Bricks block');
    this.redstoneManager.setPower(placedBricks, 15);
    assert.strictEqual(this.redstoneManager.getPower(placedBricks), 15, 'Redstone power not properly conducted');
    this.redstoneManager.update();
    assert.strictEqual(this.redstoneManager.getPower(placedBricks), 14, 'Redstone power not properly decaying');
  }

  testPistonInteraction() {
    console.log('Testing piston interaction...');
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    assert(placedWall, 'Failed to place Tuff Brick Wall block');
    const canPush = this.pistonManager.canPush(placedWall);
    assert.strictEqual(canPush, true, 'Wall should be pushable by piston');
    const canPull = this.pistonManager.canPull(placedWall);
    assert.strictEqual(canPull, true, 'Wall should be pullable by piston');
  }

  testObserverDetection() {
    console.log('Testing observer detection...');
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    assert(placedStairs, 'Failed to place Tuff Brick Stairs block');
    const observer = this.observerManager.createObserver({ x: 1, y: 0, z: 0 });
    this.observerManager.faceBlock(observer, placedStairs);
    placedStairs.setState('facing', 'north');
    const detected = this.observerManager.checkDetection(observer);
    assert.strictEqual(detected, true, 'Observer should detect block state change');
  }

  testWallConnections() {
    console.log('Testing wall connections...');
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    assert(placedWall, 'Failed to place Tuff Brick Wall block');
    const solidBlock = {
      id: 'stone',
      type: 'stone',
      position: { x: 0, y: 0, z: 1 },
      properties: { solid: true }
    };
    this.world.setBlock(0, 0, 1, solidBlock);
    const connections = wall.getConnections(this.world, { x: 0, y: 0, z: 0 });
    assert.strictEqual(connections.south, true, 'Wall should connect to solid block');
  }

  testStairPlacement() {
    console.log('Testing stair placement...');
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    assert(placedStairs, 'Failed to place Tuff Brick Stairs block');
    const solidBlock = {
      id: 'stone',
      type: 'stone',
      position: { x: 0, y: -1, z: 0 },
      properties: { solid: true }
    };
    this.world.setBlock(0, -1, 0, solidBlock);
    const canPlace = stairs.canPlace(this.world, { x: 0, y: 0, z: 0 });
    assert.strictEqual(canPlace, true, 'Stairs should be placeable on solid block');
  }

  testSlabPlacement() {
    console.log('Testing slab placement...');
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    assert(placedSlab, 'Failed to place Tuff Brick Slab block');
    const solidBlock = {
      id: 'stone',
      type: 'stone',
      position: { x: 0, y: -1, z: 0 },
      properties: { solid: true }
    };
    this.world.setBlock(0, -1, 0, solidBlock);
    const canPlace = slab.canPlace(this.world, { x: 0, y: 0, z: 0 });
    assert.strictEqual(canPlace, true, 'Slab should be placeable on solid block');
  }
}

// Run tests
const test = new TuffVariantsInteractionTest();
test.runTests(); 