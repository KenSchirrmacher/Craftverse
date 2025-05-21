const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const DripstoneBlock = require('../blocks/dripstoneBlock');
const PointedDripstoneBlock = require('../blocks/pointedDripstoneBlock');
const WaterBlock = require('../blocks/waterBlock');
const LavaBlock = require('../blocks/lavaBlock');
const CauldronBlock = require('../blocks/cauldronBlock');

class TuffVariantsDripstoneTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testDripstoneGrowth();
    this.testPointedDripstoneInteraction();
    this.testDripstoneDripping();
    this.testDripstoneDamage();
  }

  testDripstoneGrowth() {
    console.log('Testing dripstone growth...');
    
    // Test Tuff Bricks dripstone growth
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create dripstone block
    const dripstone = new DripstoneBlock();
    const placedDripstone = dripstone.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test dripstone placement
    assert.strictEqual(placedBricks.canSupportDripstone(), true);
    assert.strictEqual(placedDripstone.isValidPlacement(), true);
    
    // Test dripstone properties
    assert.strictEqual(placedDripstone.getGrowthStage(), 0);
    assert.strictEqual(placedDripstone.canGrow(), true);
    
    // Test dripstone growth
    placedDripstone.grow();
    assert.strictEqual(placedDripstone.getGrowthStage(), 1);
  }

  testPointedDripstoneInteraction() {
    console.log('Testing pointed dripstone interaction...');
    
    // Test Tuff Brick Wall pointed dripstone interaction
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create pointed dripstone
    const pointedDripstone = new PointedDripstoneBlock();
    const placedPointed = pointedDripstone.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test pointed dripstone placement
    assert.strictEqual(placedWall.canSupportPointedDripstone(), true);
    assert.strictEqual(placedPointed.isValidPlacement(), true);
    
    // Test pointed dripstone properties
    assert.strictEqual(placedPointed.getThickness(), 'tip');
    assert.strictEqual(placedPointed.getVerticalDirection(), 'down');
    
    // Test pointed dripstone breaking
    const drops = placedPointed.break();
    assert.strictEqual(drops.length, 1); // Should drop 1 pointed dripstone
  }

  testDripstoneDripping() {
    console.log('Testing dripstone dripping...');
    
    // Test Tuff Brick Slab dripstone dripping
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create pointed dripstone
    const pointedDripstone = new PointedDripstoneBlock();
    const placedPointed = pointedDripstone.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create water source
    const water = new WaterBlock();
    water.place(this.world, { x: 0, y: 2, z: 0 });
    
    // Create cauldron
    const cauldron = new CauldronBlock();
    const placedCauldron = cauldron.place(this.world, { x: 0, y: -1, z: 0 });
    
    // Test dripping mechanics
    assert.strictEqual(placedPointed.canDrip(), true);
    placedPointed.update();
    assert.strictEqual(placedCauldron.getFluidLevel(), 1);
  }

  testDripstoneDamage() {
    console.log('Testing dripstone damage...');
    
    // Test Tuff Brick Stairs dripstone damage
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create pointed dripstone
    const pointedDripstone = new PointedDripstoneBlock();
    const placedPointed = pointedDripstone.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test damage properties
    assert.strictEqual(placedPointed.getDamage(), 2);
    assert.strictEqual(placedPointed.canDamageEntities(), true);
    
    // Test falling damage
    const entity = { health: 20, takeDamage: function(amount) { this.health -= amount; } };
    placedPointed.onEntityCollision(entity);
    assert.strictEqual(entity.health, 18);
  }
}

// Run tests
const test = new TuffVariantsDripstoneTest();
test.runTests();
console.log('All Tuff variants dripstone interaction tests passed!');

module.exports = TuffVariantsDripstoneTest; 