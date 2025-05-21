const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const MangroveLogBlock = require('../blocks/mangroveLogBlock');
const MangroveRootsBlock = require('../blocks/mangroveRootsBlock');
const MangroveLeavesBlock = require('../blocks/mangroveLeavesBlock');
const MangrovePropaguleBlock = require('../blocks/mangrovePropaguleBlock');

class TuffVariantsMangroveTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testMangroveLogInteraction();
    this.testMangroveRootsInteraction();
    this.testMangroveLeavesInteraction();
    this.testMangrovePropaguleInteraction();
  }

  testMangroveLogInteraction() {
    console.log('Testing mangrove log interaction...');
    
    // Test Tuff Bricks mangrove log interaction
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create mangrove log
    const log = new MangroveLogBlock();
    const placedLog = log.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test log placement
    assert.strictEqual(placedBricks.canSupportMangroveLog(), true);
    assert.strictEqual(placedLog.isValidPlacement(), true);
    
    // Test log properties
    assert.strictEqual(placedLog.getAxis(), 'y');
    assert.strictEqual(placedLog.getStripped(), false);
    
    // Test log stripping
    placedLog.strip();
    assert.strictEqual(placedLog.getStripped(), true);
  }

  testMangroveRootsInteraction() {
    console.log('Testing mangrove roots interaction...');
    
    // Test Tuff Brick Wall mangrove roots interaction
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create mangrove roots
    const roots = new MangroveRootsBlock();
    const placedRoots = roots.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test roots placement
    assert.strictEqual(placedWall.canSupportMangroveRoots(), true);
    assert.strictEqual(placedRoots.isValidPlacement(), true);
    
    // Test roots properties
    assert.strictEqual(placedRoots.getWaterlogged(), false);
    assert.strictEqual(placedRoots.getAge(), 0);
    
    // Test roots growth
    placedRoots.grow();
    assert.strictEqual(placedRoots.getAge(), 1);
  }

  testMangroveLeavesInteraction() {
    console.log('Testing mangrove leaves interaction...');
    
    // Test Tuff Brick Slab mangrove leaves interaction
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create mangrove leaves
    const leaves = new MangroveLeavesBlock();
    const placedLeaves = leaves.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test leaves placement
    assert.strictEqual(placedSlab.canSupportMangroveLeaves(), true);
    assert.strictEqual(placedLeaves.isValidPlacement(), true);
    
    // Test leaves properties
    assert.strictEqual(placedLeaves.getDistance(), 1);
    assert.strictEqual(placedLeaves.getPersistent(), false);
    
    // Test leaves decay
    placedLeaves.decay();
    assert.strictEqual(placedLeaves.isValid(), false);
  }

  testMangrovePropaguleInteraction() {
    console.log('Testing mangrove propagule interaction...');
    
    // Test Tuff Brick Stairs mangrove propagule interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create mangrove propagule
    const propagule = new MangrovePropaguleBlock();
    const placedPropagule = propagule.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test propagule placement
    assert.strictEqual(placedStairs.canSupportMangrovePropagule(), true);
    assert.strictEqual(placedPropagule.isValidPlacement(), true);
    
    // Test propagule properties
    assert.strictEqual(placedPropagule.getAge(), 0);
    assert.strictEqual(placedPropagule.getHanging(), false);
    
    // Test propagule growth
    placedPropagule.grow();
    assert.strictEqual(placedPropagule.getAge(), 1);
  }
}

// Run tests
const test = new TuffVariantsMangroveTest();
test.runTests();
console.log('All Tuff variants mangrove interaction tests passed!');

module.exports = TuffVariantsMangroveTest; 