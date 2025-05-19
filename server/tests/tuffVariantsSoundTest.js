const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { SoundManager } = require('../managers/soundManager');
const { Player } = require('../entities/player');

class TuffVariantsSoundTest {
  constructor() {
    this.world = new TestWorld();
    this.soundManager = new SoundManager();
    this.player = new Player({ x: 0, y: 0, z: 0 });
  }

  runTests() {
    this.testPlacementSounds();
    this.testBreakingSounds();
    this.testStepSounds();
    this.testInteractionSounds();
    this.testSoundAttenuation();
  }

  testPlacementSounds() {
    console.log('Testing placement sounds...');
    
    // Test Tuff Bricks placement sound
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Get placement sound
    const placementSound = this.soundManager.getBlockPlacementSound(placedBricks);
    
    // Verify sound properties
    assert.strictEqual(placementSound.soundId, 'block.stone.place');
    assert.strictEqual(typeof placementSound.volume, 'number');
    assert.strictEqual(typeof placementSound.pitch, 'number');
  }

  testBreakingSounds() {
    console.log('Testing breaking sounds...');
    
    // Test Chiseled Tuff breaking sound
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Get breaking sound
    const breakingSound = this.soundManager.getBlockBreakingSound(placedChiseled);
    
    // Verify sound properties
    assert.strictEqual(breakingSound.soundId, 'block.stone.break');
    assert.strictEqual(typeof breakingSound.volume, 'number');
    assert.strictEqual(typeof breakingSound.pitch, 'number');
  }

  testStepSounds() {
    console.log('Testing step sounds...');
    
    // Test Tuff Brick Stairs step sound
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Simulate player stepping on block
    const stepSound = this.soundManager.getBlockStepSound(placedStairs, this.player);
    
    // Verify sound properties
    assert.strictEqual(stepSound.soundId, 'block.stone.step');
    assert.strictEqual(typeof stepSound.volume, 'number');
    assert.strictEqual(typeof stepSound.pitch, 'number');
  }

  testInteractionSounds() {
    console.log('Testing interaction sounds...');
    
    // Test Tuff Brick Wall interaction sound
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Simulate player interaction
    const interactionSound = this.soundManager.getBlockInteractionSound(placedWall, this.player);
    
    // Verify sound properties
    assert.strictEqual(interactionSound.soundId, 'block.stone.hit');
    assert.strictEqual(typeof interactionSound.volume, 'number');
    assert.strictEqual(typeof interactionSound.pitch, 'number');
  }

  testSoundAttenuation() {
    console.log('Testing sound attenuation...');
    
    // Test Tuff Brick Slab sound attenuation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test sound at different distances
    const closeSound = this.soundManager.getBlockPlacementSound(placedSlab, { x: 1, y: 0, z: 1 });
    const farSound = this.soundManager.getBlockPlacementSound(placedSlab, { x: 10, y: 0, z: 10 });
    
    // Verify attenuation
    assert.strictEqual(closeSound.volume > farSound.volume, true);
    assert.strictEqual(typeof closeSound.attenuation, 'number');
    assert.strictEqual(typeof farSound.attenuation, 'number');
  }
}

// Run tests
const test = new TuffVariantsSoundTest();
test.runTests();
console.log('All Tuff variants sound tests passed!');

module.exports = TuffVariantsSoundTest; 