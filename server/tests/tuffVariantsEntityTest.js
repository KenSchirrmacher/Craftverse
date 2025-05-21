const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const Player = require('../entities/player');
const Zombie = require('../entities/zombie');
const ItemEntity = require('../entities/itemEntity');

class TuffVariantsEntityTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testPlayerInteraction();
    this.testMobInteraction();
    this.testItemEntityInteraction();
    this.testEntityCollision();
  }

  testPlayerInteraction() {
    console.log('Testing player interaction...');
    
    // Test Tuff Bricks player interaction
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create player
    const player = new Player();
    player.setPosition({ x: 0, y: 1, z: 0 });
    
    // Test player collision
    assert.strictEqual(placedBricks.canEntityCollide(player), true);
    assert.strictEqual(placedBricks.getCollisionBox().intersects(player.getBoundingBox()), true);
    
    // Test player interaction
    const interactionResult = placedBricks.onPlayerInteract(player);
    assert.strictEqual(interactionResult.success, true);
  }

  testMobInteraction() {
    console.log('Testing mob interaction...');
    
    // Test Tuff Brick Wall mob interaction
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create zombie
    const zombie = new Zombie();
    zombie.setPosition({ x: 0, y: 1, z: 0 });
    
    // Test mob collision
    assert.strictEqual(placedWall.canEntityCollide(zombie), true);
    assert.strictEqual(placedWall.getCollisionBox().intersects(zombie.getBoundingBox()), true);
    
    // Test mob pathfinding
    const path = zombie.findPath({ x: 2, y: 0, z: 0 });
    assert.strictEqual(Array.isArray(path), true);
    assert.strictEqual(path.length > 0, true);
  }

  testItemEntityInteraction() {
    console.log('Testing item entity interaction...');
    
    // Test Tuff Brick Slab item entity interaction
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create item entity
    const itemEntity = new ItemEntity({ id: 'diamond', count: 1 });
    itemEntity.setPosition({ x: 0, y: 1, z: 0 });
    
    // Test item entity collision
    assert.strictEqual(placedSlab.canEntityCollide(itemEntity), true);
    assert.strictEqual(placedSlab.getCollisionBox().intersects(itemEntity.getBoundingBox()), true);
    
    // Test item entity physics
    itemEntity.applyGravity();
    assert.strictEqual(itemEntity.getPosition().y < 1, true);
  }

  testEntityCollision() {
    console.log('Testing entity collision...');
    
    // Test Tuff Brick Stairs entity collision
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create entities
    const player = new Player();
    const zombie = new Zombie();
    
    // Position entities
    player.setPosition({ x: 0, y: 1, z: 0 });
    zombie.setPosition({ x: 0, y: 1, z: 1 });
    
    // Test entity collision with block
    assert.strictEqual(placedStairs.canEntityCollide(player), true);
    assert.strictEqual(placedStairs.canEntityCollide(zombie), true);
    
    // Test entity collision resolution
    const playerCollision = placedStairs.resolveEntityCollision(player);
    const zombieCollision = placedStairs.resolveEntityCollision(zombie);
    
    assert.strictEqual(playerCollision.resolved, true);
    assert.strictEqual(zombieCollision.resolved, true);
  }
}

// Run tests
const test = new TuffVariantsEntityTest();
test.runTests();
console.log('All Tuff variants entity interaction tests passed!');

module.exports = TuffVariantsEntityTest; 