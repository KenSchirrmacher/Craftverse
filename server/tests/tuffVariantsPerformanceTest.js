const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { PerformanceMonitor } = require('../systems/performanceMonitor');
const { ChunkManager } = require('../world/chunkManager');
const { BlockRegistry } = require('../registry/blockRegistry');

class TuffVariantsPerformanceTest {
  constructor() {
    this.world = new TestWorld();
    this.performanceMonitor = new PerformanceMonitor();
    this.chunkManager = new ChunkManager();
    this.blockRegistry = new BlockRegistry();
  }

  runTests() {
    this.testBlockPlacementPerformance();
    this.testChunkLoadingPerformance();
    this.testBlockUpdatePerformance();
    this.testMemoryUsage();
    this.testRenderingOptimization();
  }

  testBlockPlacementPerformance() {
    console.log('Testing block placement performance...');
    
    const startTime = this.performanceMonitor.getCurrentTime();
    const iterations = 1000;
    
    // Test bulk placement of Tuff Bricks
    for (let i = 0; i < iterations; i++) {
      const bricks = new TuffBricksBlock();
      bricks.place(this.world, { x: i, y: 0, z: 0 });
    }
    
    const endTime = this.performanceMonitor.getCurrentTime();
    const placementTime = endTime - startTime;
    
    // Verify performance meets requirements
    assert.strictEqual(placementTime < 1000, true, 'Block placement too slow');
    assert.strictEqual(this.performanceMonitor.getAveragePlacementTime() < 1, true, 'Average placement time too high');
  }

  testChunkLoadingPerformance() {
    console.log('Testing chunk loading performance...');
    
    const startTime = this.performanceMonitor.getCurrentTime();
    
    // Test loading chunks with Tuff variants
    const chunk = this.chunkManager.generateChunk(0, 0);
    chunk.addBlock(new TuffBrickWallBlock(), { x: 0, y: 0, z: 0 });
    chunk.addBlock(new TuffBrickStairsBlock(), { x: 1, y: 0, z: 0 });
    chunk.addBlock(new ChiseledTuffBlock(), { x: 2, y: 0, z: 0 });
    
    const loadTime = this.performanceMonitor.getCurrentTime() - startTime;
    
    // Verify chunk loading performance
    assert.strictEqual(loadTime < 100, true, 'Chunk loading too slow');
    assert.strictEqual(this.performanceMonitor.getAverageChunkLoadTime() < 50, true, 'Average chunk load time too high');
  }

  testBlockUpdatePerformance() {
    console.log('Testing block update performance...');
    
    const startTime = this.performanceMonitor.getCurrentTime();
    const iterations = 100;
    
    // Test updating Tuff Brick Slab states
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    for (let i = 0; i < iterations; i++) {
      placedSlab.update();
    }
    
    const updateTime = this.performanceMonitor.getCurrentTime() - startTime;
    
    // Verify update performance
    assert.strictEqual(updateTime < 100, true, 'Block updates too slow');
    assert.strictEqual(this.performanceMonitor.getAverageUpdateTime() < 1, true, 'Average update time too high');
  }

  testMemoryUsage() {
    console.log('Testing memory usage...');
    
    const initialMemory = this.performanceMonitor.getMemoryUsage();
    
    // Create large number of Tuff variants
    const blocks = [];
    for (let i = 0; i < 1000; i++) {
      blocks.push(new TuffBricksBlock());
      blocks.push(new TuffBrickWallBlock());
      blocks.push(new TuffBrickStairsBlock());
    }
    
    const finalMemory = this.performanceMonitor.getMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;
    
    // Verify memory usage is within acceptable limits
    assert.strictEqual(memoryIncrease < 1000000, true, 'Memory usage too high');
    assert.strictEqual(this.performanceMonitor.getAverageMemoryPerBlock() < 1000, true, 'Average memory per block too high');
  }

  testRenderingOptimization() {
    console.log('Testing rendering optimization...');
    
    const startTime = this.performanceMonitor.getCurrentTime();
    
    // Test rendering optimization for Tuff variants
    const renderData = this.blockRegistry.getOptimizedRenderData([
      new TuffBricksBlock(),
      new TuffBrickWallBlock(),
      new TuffBrickStairsBlock(),
      new ChiseledTuffBlock()
    ]);
    
    const optimizationTime = this.performanceMonitor.getCurrentTime() - startTime;
    
    // Verify rendering optimization
    assert.strictEqual(optimizationTime < 50, true, 'Rendering optimization too slow');
    assert.strictEqual(renderData.optimized, true, 'Render data not optimized');
    assert.strictEqual(renderData.batchSize > 0, true, 'Invalid batch size');
  }
}

// Run tests
const test = new TuffVariantsPerformanceTest();
test.runTests();
console.log('All Tuff variants performance tests passed!');

module.exports = TuffVariantsPerformanceTest; 