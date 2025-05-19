const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { RenderManager } = require('../rendering/renderManager');
const { TextureManager } = require('../rendering/textureManager');
const { ShaderManager } = require('../rendering/shaderManager');

class TuffVariantsRenderingTest {
  constructor() {
    this.world = new TestWorld();
    this.renderManager = new RenderManager();
    this.textureManager = new TextureManager();
    this.shaderManager = new ShaderManager();
  }

  runTests() {
    this.testBlockRendering();
    this.testTextureMapping();
    this.testShaderEffects();
    this.testModelVariants();
    this.testAnimationStates();
  }

  testBlockRendering() {
    console.log('Testing block rendering...');
    
    // Test Tuff Bricks rendering
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    const renderData = this.renderManager.getBlockRenderData(placedBricks);
    assert.strictEqual(renderData.vertices.length > 0, true);
    assert.strictEqual(renderData.indices.length > 0, true);
    assert.strictEqual(renderData.uvs.length > 0, true);
  }

  testTextureMapping() {
    console.log('Testing texture mapping...');
    
    // Test Tuff Brick Wall texture mapping
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    const textureData = this.textureManager.getBlockTextureData(placedWall);
    assert.strictEqual(textureData.textureId !== null, true);
    assert.strictEqual(textureData.uvCoordinates.length > 0, true);
    assert.strictEqual(textureData.textureAtlas !== null, true);
  }

  testShaderEffects() {
    console.log('Testing shader effects...');
    
    // Test Tuff Brick Stairs shader effects
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    const shaderData = this.shaderManager.getBlockShaderData(placedStairs);
    assert.strictEqual(shaderData.shaderProgram !== null, true);
    assert.strictEqual(shaderData.uniforms !== null, true);
    assert.strictEqual(shaderData.attributes !== null, true);
  }

  testModelVariants() {
    console.log('Testing model variants...');
    
    // Test Chiseled Tuff model variants
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    const modelData = this.renderManager.getBlockModelData(placedChiseled);
    assert.strictEqual(modelData.modelId !== null, true);
    assert.strictEqual(modelData.variants.length > 0, true);
    assert.strictEqual(modelData.animations !== null, true);
  }

  testAnimationStates() {
    console.log('Testing animation states...');
    
    // Test Tuff Brick Slab animation states
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    const animationData = this.renderManager.getBlockAnimationData(placedSlab);
    assert.strictEqual(animationData.animations !== null, true);
    assert.strictEqual(animationData.currentState !== null, true);
    assert.strictEqual(animationData.transitions !== null, true);
    
    // Test state transition
    placedSlab.setState('breaking');
    const updatedAnimationData = this.renderManager.getBlockAnimationData(placedSlab);
    assert.strictEqual(updatedAnimationData.currentState === 'breaking', true);
  }
}

// Run tests
const test = new TuffVariantsRenderingTest();
test.runTests();
console.log('All Tuff variants rendering tests passed!');

module.exports = TuffVariantsRenderingTest; 