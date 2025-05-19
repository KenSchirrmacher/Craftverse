const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { Player } = require('../entities/player');
const { Vector3 } = require('../math/vector3');

class TuffVariantsPlacementTest {
  constructor() {
    this.world = new TestWorld();
  }

  runTests() {
    this.testValidPlacement();
    this.testInvalidPlacement();
    this.testCollisionDetection();
    this.testPlacementValidation();
    this.testPlacementEvents();
  }

  testValidPlacement() {
    console.log('Testing valid placement...');
    
    // Test Tuff Bricks valid placement
    const bricks = new TuffBricksBlock();
    const player = new Player();
    player.position = new Vector3(0, 0, 2);
    
    // Test placement on solid block
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 }, player);
    assert.strictEqual(placedBricks !== null, true);
    assert.strictEqual(this.world.getBlock({ x: 0, y: 0, z: 0 }), placedBricks);
  }

  testInvalidPlacement() {
    console.log('Testing invalid placement...');
    
    // Test Tuff Brick Stairs invalid placement
    const stairs = new TuffBrickStairsBlock();
    const player = new Player();
    player.position = new Vector3(0, 0, 2);
    
    // Test placement in air
    const placedStairs = stairs.place(this.world, { x: 0, y: 10, z: 0 }, player);
    assert.strictEqual(placedStairs, null);
    assert.strictEqual(this.world.getBlock({ x: 0, y: 10, z: 0 }), null);
    
    // Test placement inside another block
    const existingBlock = new TuffBricksBlock();
    existingBlock.place(this.world, { x: 0, y: 0, z: 0 });
    const placedStairs2 = stairs.place(this.world, { x: 0, y: 0, z: 0 }, player);
    assert.strictEqual(placedStairs2, null);
  }

  testCollisionDetection() {
    console.log('Testing collision detection...');
    
    // Test Tuff Brick Wall collision
    const wall = new TuffBrickWallBlock();
    const player = new Player();
    player.position = new Vector3(0, 0, 2);
    
    // Place wall
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 }, player);
    
    // Test player collision
    player.position = new Vector3(0, 0, 0);
    const collision = placedWall.checkCollision(player);
    assert.strictEqual(collision, true);
    
    // Test entity collision
    const entity = new Player();
    entity.position = new Vector3(0, 0, 0);
    const entityCollision = placedWall.checkCollision(entity);
    assert.strictEqual(entityCollision, true);
  }

  testPlacementValidation() {
    console.log('Testing placement validation...');
    
    // Test Tuff Brick Slab placement validation
    const slab = new TuffBrickSlabBlock();
    const player = new Player();
    player.position = new Vector3(0, 0, 2);
    
    // Test valid placement conditions
    const validPlacement = slab.validatePlacement(this.world, { x: 0, y: 0, z: 0 }, player);
    assert.strictEqual(validPlacement, true);
    
    // Test invalid placement conditions
    const invalidPlacement = slab.validatePlacement(this.world, { x: 0, y: 10, z: 0 }, player);
    assert.strictEqual(invalidPlacement, false);
  }

  testPlacementEvents() {
    console.log('Testing placement events...');
    
    // Test Chiseled Tuff placement events
    const chiseled = new ChiseledTuffBlock();
    const player = new Player();
    player.position = new Vector3(0, 0, 2);
    
    // Track placement events
    let placementCount = 0;
    let updateCount = 0;
    
    chiseled.onPlace = () => placementCount++;
    chiseled.onUpdate = () => updateCount++;
    
    // Place block
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 }, player);
    
    // Verify events
    assert.strictEqual(placementCount, 1);
    assert.strictEqual(updateCount, 1);
  }
}

// Run tests
const test = new TuffVariantsPlacementTest();
test.runTests();
console.log('All Tuff variants placement tests passed!');

module.exports = TuffVariantsPlacementTest; 