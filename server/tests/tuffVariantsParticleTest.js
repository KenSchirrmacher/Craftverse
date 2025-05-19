const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { ParticleManager } = require('../managers/particleManager');

class TuffVariantsParticleTest {
  constructor() {
    this.world = new TestWorld();
    this.particleManager = new ParticleManager(this.world);
  }

  runTests() {
    this.testBreakingParticles();
    this.testStepParticles();
    this.testPlaceParticles();
    this.testInteractionParticles();
    this.testAmbientParticles();
  }

  testBreakingParticles() {
    console.log('Testing breaking particles...');
    
    // Test Tuff Bricks breaking particles
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Break block and check particles
    const particles = this.particleManager.getBreakingParticles({ x: 0, y: 0, z: 0 });
    assert.strictEqual(Array.isArray(particles), true);
    assert.strictEqual(particles.length > 0, true);
    assert.strictEqual(particles[0].type, 'block_crack');
    assert.strictEqual(particles[0].blockType, 'tuff_bricks');
  }

  testStepParticles() {
    console.log('Testing step particles...');
    
    // Test Chiseled Tuff step particles
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Trigger step and check particles
    const particles = this.particleManager.getStepParticles({ x: 0, y: 0, z: 0 });
    assert.strictEqual(Array.isArray(particles), true);
    assert.strictEqual(particles.length > 0, true);
    assert.strictEqual(particles[0].type, 'block_dust');
    assert.strictEqual(particles[0].blockType, 'chiseled_tuff');
  }

  testPlaceParticles() {
    console.log('Testing place particles...');
    
    // Test Tuff Brick Stairs place particles
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Check placement particles
    const particles = this.particleManager.getPlaceParticles({ x: 0, y: 0, z: 0 });
    assert.strictEqual(Array.isArray(particles), true);
    assert.strictEqual(particles.length > 0, true);
    assert.strictEqual(particles[0].type, 'block_place');
    assert.strictEqual(particles[0].blockType, 'tuff_brick_stairs');
  }

  testInteractionParticles() {
    console.log('Testing interaction particles...');
    
    // Test Tuff Brick Wall interaction particles
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Trigger interaction and check particles
    const particles = this.particleManager.getInteractionParticles({ x: 0, y: 0, z: 0 });
    assert.strictEqual(Array.isArray(particles), true);
    assert.strictEqual(particles.length > 0, true);
    assert.strictEqual(particles[0].type, 'block_interaction');
    assert.strictEqual(particles[0].blockType, 'tuff_brick_wall');
  }

  testAmbientParticles() {
    console.log('Testing ambient particles...');
    
    // Test Tuff Brick Slab ambient particles
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Check ambient particles
    const particles = this.particleManager.getAmbientParticles({ x: 0, y: 0, z: 0 });
    assert.strictEqual(Array.isArray(particles), true);
    assert.strictEqual(particles.length > 0, true);
    assert.strictEqual(particles[0].type, 'block_ambient');
    assert.strictEqual(particles[0].blockType, 'tuff_brick_slab');
  }
}

// Run tests
const test = new TuffVariantsParticleTest();
test.runTests();
console.log('All Tuff variants particle tests passed!');

module.exports = TuffVariantsParticleTest; 