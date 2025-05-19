const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { Player } = require('../entities/player');
const { PhysicsEngine } = require('../physics/physicsEngine');
const { Vector3 } = require('../math/vector3');

class TuffVariantsPhysicsTest {
  constructor() {
    this.world = new TestWorld();
    this.physicsEngine = new PhysicsEngine(this.world);
    this.player = new Player('test_player');
  }

  runTests() {
    this.testCollisionBoxes();
    this.testEntityCollision();
    this.testGravityEffects();
    this.testFrictionProperties();
    this.testBoundingBoxes();
  }

  testCollisionBoxes() {
    console.log('Testing collision boxes...');
    
    // Test Tuff Bricks collision box
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    const collisionBox = placedBricks.getCollisionBox();
    assert.strictEqual(collisionBox.minX === 0, true);
    assert.strictEqual(collisionBox.minY === 0, true);
    assert.strictEqual(collisionBox.minZ === 0, true);
    assert.strictEqual(collisionBox.maxX === 1, true);
    assert.strictEqual(collisionBox.maxY === 1, true);
    assert.strictEqual(collisionBox.maxZ === 1, true);
  }

  testEntityCollision() {
    console.log('Testing entity collision...');
    
    // Test Tuff Brick Wall entity collision
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place player next to wall
    this.player.setPosition(new Vector3(1.5, 0, 0));
    
    // Test collision detection
    const collision = this.physicsEngine.checkCollision(this.player, placedWall);
    assert.strictEqual(collision.collided, true);
    assert.strictEqual(collision.normal.x === -1, true);
  }

  testGravityEffects() {
    console.log('Testing gravity effects...');
    
    // Test Tuff Brick Stairs gravity effects
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place player on stairs
    this.player.setPosition(new Vector3(0.5, 1, 0.5));
    
    // Apply gravity
    this.physicsEngine.applyGravity(this.player);
    
    // Check if player is properly supported
    assert.strictEqual(this.player.position.y < 1, true);
    assert.strictEqual(this.player.position.y > 0, true);
  }

  testFrictionProperties() {
    console.log('Testing friction properties...');
    
    // Test Tuff Brick Slab friction
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Set player velocity
    this.player.setVelocity(new Vector3(1, 0, 0));
    
    // Apply friction
    this.physicsEngine.applyFriction(this.player, placedSlab);
    
    // Check if velocity is reduced by friction
    assert.strictEqual(this.player.velocity.x < 1, true);
  }

  testBoundingBoxes() {
    console.log('Testing bounding boxes...');
    
    // Test Chiseled Tuff bounding box
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    const boundingBox = placedChiseled.getBoundingBox();
    assert.strictEqual(boundingBox.minX === 0, true);
    assert.strictEqual(boundingBox.minY === 0, true);
    assert.strictEqual(boundingBox.minZ === 0, true);
    assert.strictEqual(boundingBox.maxX === 1, true);
    assert.strictEqual(boundingBox.maxY === 1, true);
    assert.strictEqual(boundingBox.maxZ === 1, true);
    
    // Test intersection with player
    this.player.setPosition(new Vector3(0.5, 0.5, 0.5));
    const intersects = boundingBox.intersects(this.player.getBoundingBox());
    assert.strictEqual(intersects, true);
  }
}

// Run tests
const test = new TuffVariantsPhysicsTest();
test.runTests();
console.log('All Tuff variants physics tests passed!');

module.exports = TuffVariantsPhysicsTest; 