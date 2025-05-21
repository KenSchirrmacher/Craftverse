const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const PowderSnowBlock = require('../blocks/powderSnowBlock');
const Player = require('../entities/player');

class TuffVariantsPowderSnowTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testPowderSnowInteraction();
    this.testEntitySinking();
    this.testFreezingEffect();
    this.testBlockState();
  }

  testPowderSnowInteraction() {
    console.log('Testing powdered snow interaction...');
    
    // Test Tuff Bricks powdered snow interaction
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place powdered snow
    const powderSnow = new PowderSnowBlock();
    powderSnow.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test powdered snow interaction
    assert.strictEqual(placedBricks.isPowderSnowLogged(), false);
    assert.strictEqual(placedBricks.canBePowderSnowLogged(), true);
    
    // Test powdered snow effects
    assert.strictEqual(placedBricks.getPowderSnowEffect(), 'none');
    placedBricks.setPowderSnowLogged(true);
    assert.strictEqual(placedBricks.getPowderSnowEffect(), 'freezing');
  }

  testEntitySinking() {
    console.log('Testing entity sinking...');
    
    // Test Tuff Brick Wall entity sinking
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place powdered snow
    const powderSnow = new PowderSnowBlock();
    powderSnow.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.setPosition({ x: 0, y: 1, z: 0 });
    
    // Test entity sinking
    assert.strictEqual(placedWall.canEntitySink(player), false);
    assert.strictEqual(powderSnow.canEntitySink(player), true);
    
    // Test sinking speed
    assert.strictEqual(powderSnow.getSinkingSpeed(player), 0.05);
  }

  testFreezingEffect() {
    console.log('Testing freezing effect...');
    
    // Test Tuff Brick Slab freezing effect
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place powdered snow
    const powderSnow = new PowderSnowBlock();
    powderSnow.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.setPosition({ x: 0, y: 1, z: 0 });
    
    // Test freezing effect
    assert.strictEqual(player.hasFreezingEffect(), false);
    powderSnow.applyFreezingEffect(player);
    assert.strictEqual(player.hasFreezingEffect(), true);
    
    // Test freezing damage
    const initialHealth = player.getHealth();
    powderSnow.applyFreezingDamage(player);
    assert.strictEqual(player.getHealth(), initialHealth - 1);
  }

  testBlockState() {
    console.log('Testing block state...');
    
    // Test Tuff Brick Stairs block state
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place powdered snow
    const powderSnow = new PowderSnowBlock();
    powderSnow.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test block state
    assert.strictEqual(placedStairs.getPowderSnowState(), 'none');
    placedStairs.setPowderSnowLogged(true);
    assert.strictEqual(placedStairs.getPowderSnowState(), 'logged');
    
    // Test state persistence
    const state = placedStairs.serialize();
    const newStairs = new TuffBrickStairsBlock();
    newStairs.deserialize(state);
    assert.strictEqual(newStairs.getPowderSnowState(), 'logged');
  }
}

// Run tests
const test = new TuffVariantsPowderSnowTest();
test.runTests();
console.log('All Tuff variants powdered snow interaction tests passed!');

module.exports = TuffVariantsPowderSnowTest; 