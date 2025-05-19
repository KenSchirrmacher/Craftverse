const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { RenderManager } = require('../managers/renderManager');
const { ParticleSystem } = require('../systems/particleSystem');

class TuffVariantsRenderingTest {
  constructor() {
    this.world = new TestWorld();
    this.renderManager = new RenderManager();
    this.particleSystem = new ParticleSystem();
  }

  runTests() {
    this.testBlockRendering();
    this.testParticleEffects();
    this.testVisualStates();
    this.testTextureMapping();
    this.testAnimationStates();
  }

  testBlockRendering() {
    console.log('Testing block rendering...');
    
    // Test Tuff Bricks rendering
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Get render data
    const renderData = this.renderManager.getBlockRenderData(placedBricks);
    
    // Verify render properties
    assert.strictEqual(renderData.texture, 'tuff_bricks');
    assert.strictEqual(renderData.model, 'block');
    assert.strictEqual(renderData.transparent, false);
    assert.strictEqual(renderData.cullFace, true);
  }

  testParticleEffects() {
    console.log('Testing particle effects...');
    
    // Test Chiseled Tuff particle effects
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Trigger particle effect
    const particles = this.particleSystem.createBlockBreakParticles(placedChiseled);
    
    // Verify particles
    assert.strictEqual(particles.length > 0, true);
    assert.strictEqual(particles[0].texture, 'tuff_particle');
    assert.strictEqual(typeof particles[0].lifetime, 'number');
  }

  testVisualStates() {
    console.log('Testing visual states...');
    
    // Test Tuff Brick Stairs visual states
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test different states
    placedStairs.setState('facing', 'north');
    let renderData = this.renderManager.getBlockRenderData(placedStairs);
    assert.strictEqual(renderData.rotation.y, 0);
    
    placedStairs.setState('facing', 'east');
    renderData = this.renderManager.getBlockRenderData(placedStairs);
    assert.strictEqual(renderData.rotation.y, 90);
  }

  testTextureMapping() {
    console.log('Testing texture mapping...');
    
    // Test Tuff Brick Wall texture mapping
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Get texture coordinates
    const textureCoords = this.renderManager.getBlockTextureCoords(placedWall);
    
    // Verify texture mapping
    assert.strictEqual(textureCoords.length, 6); // All six faces
    assert.strictEqual(typeof textureCoords[0].u, 'number');
    assert.strictEqual(typeof textureCoords[0].v, 'number');
  }

  testAnimationStates() {
    console.log('Testing animation states...');
    
    // Test Tuff Brick Slab animation states
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Test placement animation
    const placementAnim = this.renderManager.getBlockPlacementAnimation(placedSlab);
    assert.strictEqual(placementAnim !== null, true);
    assert.strictEqual(typeof placementAnim.duration, 'number');
    
    // Test breaking animation
    const breakingAnim = this.renderManager.getBlockBreakingAnimation(placedSlab);
    assert.strictEqual(breakingAnim !== null, true);
    assert.strictEqual(typeof breakingAnim.duration, 'number');
  }
}

// Run tests
const test = new TuffVariantsRenderingTest();
test.runTests();
console.log('All Tuff variants rendering tests passed!');

module.exports = TuffVariantsRenderingTest; 