/**
 * Tests for Tuff Variants Rendering
 * Verifies the rendering functionality of tuff variants
 */

const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const RenderManager = require('../rendering/renderManager');

class TuffVariantsRenderingTest {
  constructor() {
    this.world = new World();
    this.renderManager = new RenderManager(this.world);
  }

  runTests() {
    this.testChiseledTuffRendering();
    this.testTuffBricksRendering();
    this.testTuffBrickSlabRendering();
    this.testTuffBrickStairsRendering();
    this.testTuffBrickWallRendering();
  }

  testChiseledTuffRendering() {
    console.log('Testing Chiseled Tuff Rendering...');
    const block = new ChiseledTuffBlock();
    this.world.setBlockAt(0, 0, 0, 'chiseled_tuff');
    
    const renderData = this.renderManager.getBlockRenderData(0, 0, 0);
    assert.strictEqual(renderData.model, 'chiseled_tuff');
    assert.strictEqual(renderData.texture, 'chiseled_tuff');
    assert.strictEqual(renderData.transparent, false);
  }

  testTuffBricksRendering() {
    console.log('Testing Tuff Bricks Rendering...');
    const block = new TuffBricksBlock();
    this.world.setBlockAt(0, 0, 0, 'tuff_bricks');
    
    const renderData = this.renderManager.getBlockRenderData(0, 0, 0);
    assert.strictEqual(renderData.model, 'tuff_bricks');
    assert.strictEqual(renderData.texture, 'tuff_bricks');
    assert.strictEqual(renderData.transparent, false);
  }

  testTuffBrickSlabRendering() {
    console.log('Testing Tuff Brick Slab Rendering...');
    const block = new TuffBrickSlabBlock();
    this.world.setBlockAt(0, 0, 0, 'tuff_brick_slab');
    
    const renderData = this.renderManager.getBlockRenderData(0, 0, 0);
    assert.strictEqual(renderData.model, 'tuff_brick_slab');
    assert.strictEqual(renderData.texture, 'tuff_brick_slab');
    assert.strictEqual(renderData.transparent, false);
  }

  testTuffBrickStairsRendering() {
    console.log('Testing Tuff Brick Stairs Rendering...');
    const block = new TuffBrickStairsBlock();
    this.world.setBlockAt(0, 0, 0, 'tuff_brick_stairs');
    
    const renderData = this.renderManager.getBlockRenderData(0, 0, 0);
    assert.strictEqual(renderData.model, 'tuff_brick_stairs');
    assert.strictEqual(renderData.texture, 'tuff_brick_stairs');
    assert.strictEqual(renderData.transparent, false);
  }

  testTuffBrickWallRendering() {
    console.log('Testing Tuff Brick Wall Rendering...');
    const block = new TuffBrickWallBlock();
    this.world.setBlockAt(0, 0, 0, 'tuff_brick_wall');
    
    const renderData = this.renderManager.getBlockRenderData(0, 0, 0);
    assert.strictEqual(renderData.model, 'tuff_brick_wall');
    assert.strictEqual(renderData.texture, 'tuff_brick_wall');
    assert.strictEqual(renderData.transparent, false);
  }
}

module.exports = TuffVariantsRenderingTest; 