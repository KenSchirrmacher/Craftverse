const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const MudBlock = require('../blocks/mudBlock');
const PackedMudBlock = require('../blocks/packedMudBlock');
const MudBricksBlock = require('../blocks/mudBricksBlock');
const WaterBlock = require('../blocks/waterBlock');

class TuffVariantsMudTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testMudConversion();
    this.testMudPlacement();
    this.testMudBricksInteraction();
    this.testBlockState();
  }

  testMudConversion() {
    console.log('Testing mud conversion...');
    
    // Test Tuff Bricks mud conversion
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create mud block
    const mud = new MudBlock();
    const placedMud = mud.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test mud placement
    assert.strictEqual(placedBricks.canSupportMud(), true);
    assert.strictEqual(placedMud.isValidPlacement(), true);
    
    // Test mud properties
    assert.strictEqual(placedMud.getMoistureLevel(), 0);
    assert.strictEqual(placedMud.isWaterlogged(), false);
    
    // Test mud waterlogging
    const water = new WaterBlock();
    water.place(this.world, { x: 0, y: 2, z: 0 });
    placedMud.update();
    assert.strictEqual(placedMud.isWaterlogged(), true);
    assert.strictEqual(placedMud.getMoistureLevel(), 1);
  }

  testMudPlacement() {
    console.log('Testing mud placement...');
    
    // Test Tuff Brick Wall mud placement
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create packed mud
    const packedMud = new PackedMudBlock();
    const placedPackedMud = packedMud.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test packed mud placement
    assert.strictEqual(placedWall.canSupportPackedMud(), true);
    assert.strictEqual(placedPackedMud.isValidPlacement(), true);
    
    // Test packed mud properties
    assert.strictEqual(placedPackedMud.getHardness(), 1.5);
    assert.strictEqual(placedPackedMud.getBlastResistance(), 6.0);
    
    // Test packed mud breaking
    const drops = placedPackedMud.break();
    assert.strictEqual(drops.length, 1); // Should drop 1 packed mud
  }

  testMudBricksInteraction() {
    console.log('Testing mud bricks interaction...');
    
    // Test Tuff Brick Slab mud bricks interaction
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create mud bricks
    const mudBricks = new MudBricksBlock();
    const placedMudBricks = mudBricks.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test mud bricks placement
    assert.strictEqual(placedSlab.canSupportMudBricks(), true);
    assert.strictEqual(placedMudBricks.isValidPlacement(), true);
    
    // Test mud bricks properties
    assert.strictEqual(placedMudBricks.getHardness(), 2.0);
    assert.strictEqual(placedMudBricks.getBlastResistance(), 6.0);
    
    // Test mud bricks breaking
    const drops = placedMudBricks.break();
    assert.strictEqual(drops.length, 1); // Should drop 1 mud bricks
  }

  testBlockState() {
    console.log('Testing block state...');
    
    // Test Tuff Brick Stairs block state
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create mud block
    const mud = new MudBlock();
    const placedMud = mud.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test block state
    assert.strictEqual(placedStairs.getMudState(), 'none');
    placedMud.setMoistureLevel(1);
    assert.strictEqual(placedStairs.getMudState(), 'none'); // Tuff should not be affected
    
    // Test state persistence
    const state = placedStairs.serialize();
    const newStairs = new TuffBrickStairsBlock();
    newStairs.deserialize(state);
    assert.strictEqual(newStairs.getMudState(), 'none');
  }
}

// Run tests
const test = new TuffVariantsMudTest();
test.runTests();
console.log('All Tuff variants mud interaction tests passed!');

module.exports = TuffVariantsMudTest; 