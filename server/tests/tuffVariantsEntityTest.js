const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { Player } = require('../entities/player');
const { Zombie } = require('../entities/zombie');
const { EntityManager } = require('../managers/entityManager');

class TuffVariantsEntityTest {
  constructor() {
    this.world = new TestWorld();
    this.entityManager = new EntityManager(this.world);
  }

  runTests() {
    this.testEntityCollision();
    this.testEntityMovement();
    this.testEntityInteraction();
    this.testEntityPlacement();
    this.testEntityDamage();
  }

  testEntityCollision() {
    console.log('Testing entity collision...');
    
    // Test Tuff Bricks entity collision
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create player
    const player = new Player({ x: 1, y: 0, z: 0 });
    this.entityManager.addEntity(player);
    
    // Test collision
    const canMove = this.entityManager.canEntityMove(player, { x: 0, y: 0, z: 0 });
    assert.strictEqual(canMove, false);
  }

  testEntityMovement() {
    console.log('Testing entity movement...');
    
    // Test Chiseled Tuff entity movement
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create zombie
    const zombie = new Zombie({ x: 2, y: 0, z: 0 });
    this.entityManager.addEntity(zombie);
    
    // Test movement
    const movementSpeed = this.entityManager.getEntityMovementSpeed(zombie, { x: 0, y: 0, z: 0 });
    assert.strictEqual(typeof movementSpeed, 'number');
    assert.strictEqual(movementSpeed > 0, true);
  }

  testEntityInteraction() {
    console.log('Testing entity interaction...');
    
    // Test Tuff Brick Stairs entity interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create player
    const player = new Player({ x: 1, y: 0, z: 0 });
    this.entityManager.addEntity(player);
    
    // Test interaction
    const canInteract = this.entityManager.canEntityInteract(player, { x: 0, y: 0, z: 0 });
    assert.strictEqual(canInteract, true);
  }

  testEntityPlacement() {
    console.log('Testing entity placement...');
    
    // Test Tuff Brick Wall entity placement
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create player
    const player = new Player({ x: 1, y: 0, z: 0 });
    this.entityManager.addEntity(player);
    
    // Test placement
    const canPlace = this.entityManager.canEntityPlaceBlock(player, { x: 0, y: 0, z: 0 });
    assert.strictEqual(canPlace, false);
  }

  testEntityDamage() {
    console.log('Testing entity damage...');
    
    // Test Tuff Brick Slab entity damage
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create player
    const player = new Player({ x: 1, y: 0, z: 0 });
    this.entityManager.addEntity(player);
    
    // Test damage
    const damage = this.entityManager.getEntityDamage(player, { x: 0, y: 0, z: 0 });
    assert.strictEqual(typeof damage, 'number');
    assert.strictEqual(damage, 0);
  }
}

// Run tests
const test = new TuffVariantsEntityTest();
test.runTests();
console.log('All Tuff variants entity tests passed!');

module.exports = TuffVariantsEntityTest; 