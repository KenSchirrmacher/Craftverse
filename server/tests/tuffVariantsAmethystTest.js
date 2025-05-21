const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const AmethystBlock = require('../blocks/amethystBlock');
const AmethystClusterBlock = require('../blocks/amethystClusterBlock');
const AmethystBudBlock = require('../blocks/amethystBudBlock');
const AmethystShardItem = require('../items/amethystShardItem');

class TuffVariantsAmethystTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testAmethystGrowth();
    this.testAmethystClusterInteraction();
    this.testAmethystBudInteraction();
    this.testAmethystShardDrops();
  }

  testAmethystGrowth() {
    console.log('Testing amethyst growth...');
    
    // Test Tuff Bricks amethyst growth
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create amethyst block
    const amethyst = new AmethystBlock();
    const placedAmethyst = amethyst.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test amethyst placement
    assert.strictEqual(placedBricks.canSupportAmethyst(), true);
    assert.strictEqual(placedAmethyst.isValidPlacement(), true);
    
    // Test amethyst properties
    assert.strictEqual(placedAmethyst.getGrowthStage(), 0);
    assert.strictEqual(placedAmethyst.canGrow(), true);
    
    // Test amethyst growth
    placedAmethyst.grow();
    assert.strictEqual(placedAmethyst.getGrowthStage(), 1);
  }

  testAmethystClusterInteraction() {
    console.log('Testing amethyst cluster interaction...');
    
    // Test Tuff Brick Wall amethyst cluster interaction
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create amethyst cluster
    const cluster = new AmethystClusterBlock();
    const placedCluster = cluster.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test amethyst cluster placement
    assert.strictEqual(placedWall.canSupportAmethystCluster(), true);
    assert.strictEqual(placedCluster.isValidPlacement(), true);
    
    // Test amethyst cluster properties
    assert.strictEqual(placedCluster.getLightLevel(), 5);
    assert.strictEqual(placedCluster.isFullyGrown(), true);
    
    // Test amethyst cluster breaking
    const drops = placedCluster.break();
    assert.strictEqual(drops.length, 4); // Should drop 4 amethyst shards
  }

  testAmethystBudInteraction() {
    console.log('Testing amethyst bud interaction...');
    
    // Test Tuff Brick Slab amethyst bud interaction
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create amethyst bud
    const bud = new AmethystBudBlock();
    const placedBud = bud.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test amethyst bud placement
    assert.strictEqual(placedSlab.canSupportAmethystBud(), true);
    assert.strictEqual(placedBud.isValidPlacement(), true);
    
    // Test amethyst bud properties
    assert.strictEqual(placedBud.getGrowthStage(), 0);
    assert.strictEqual(placedBud.canGrow(), true);
    
    // Test amethyst bud growth
    placedBud.grow();
    assert.strictEqual(placedBud.getGrowthStage(), 1);
  }

  testAmethystShardDrops() {
    console.log('Testing amethyst shard drops...');
    
    // Test Tuff Brick Stairs amethyst shard drops
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create amethyst block
    const amethyst = new AmethystBlock();
    const placedAmethyst = amethyst.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test amethyst shard drops
    const drops = placedAmethyst.break();
    assert.strictEqual(drops.length, 4); // Should drop 4 amethyst shards
    
    // Test amethyst shard properties
    const shard = new AmethystShardItem();
    assert.strictEqual(shard.getMaxStackSize(), 64);
    assert.strictEqual(shard.isStackable(), true);
  }
}

// Run tests
const test = new TuffVariantsAmethystTest();
test.runTests();
console.log('All Tuff variants amethyst interaction tests passed!');

module.exports = TuffVariantsAmethystTest; 