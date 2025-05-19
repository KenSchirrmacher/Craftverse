const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { NetworkManager } = require('../network/networkManager');
const { Player } = require('../entities/player');

class TuffVariantsNetworkTest {
  constructor() {
    this.world = new TestWorld();
    this.networkManager = new NetworkManager();
    this.player1 = new Player('player1');
    this.player2 = new Player('player2');
  }

  runTests() {
    this.testBlockPlacementSync();
    this.testBlockBreakSync();
    this.testStateUpdateSync();
    this.testMetadataSync();
    this.testChunkSync();
  }

  testBlockPlacementSync() {
    console.log('Testing block placement sync...');
    
    // Test Tuff Bricks placement sync
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Simulate network sync
    const syncData = this.networkManager.serializeBlock(placedBricks);
    const receivedBlock = this.networkManager.deserializeBlock(syncData);
    
    assert.strictEqual(receivedBlock.type === 'tuff_bricks', true);
    assert.strictEqual(receivedBlock.position.x === 0, true);
    assert.strictEqual(receivedBlock.position.y === 0, true);
    assert.strictEqual(receivedBlock.position.z === 0, true);
  }

  testBlockBreakSync() {
    console.log('Testing block break sync...');
    
    // Test Tuff Brick Wall break sync
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Simulate break event
    const breakEvent = this.networkManager.createBlockBreakEvent(placedWall, this.player1);
    const receivedEvent = this.networkManager.deserializeBlockBreakEvent(breakEvent);
    
    assert.strictEqual(receivedEvent.blockType === 'tuff_brick_wall', true);
    assert.strictEqual(receivedEvent.playerId === 'player1', true);
    assert.strictEqual(receivedEvent.position.x === 0, true);
  }

  testStateUpdateSync() {
    console.log('Testing state update sync...');
    
    // Test Tuff Brick Stairs state sync
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Update state
    placedStairs.setState('breaking');
    
    // Simulate state sync
    const stateUpdate = this.networkManager.createStateUpdateEvent(placedStairs);
    const receivedUpdate = this.networkManager.deserializeStateUpdateEvent(stateUpdate);
    
    assert.strictEqual(receivedUpdate.blockType === 'tuff_brick_stairs', true);
    assert.strictEqual(receivedUpdate.newState === 'breaking', true);
  }

  testMetadataSync() {
    console.log('Testing metadata sync...');
    
    // Test Chiseled Tuff metadata sync
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Set metadata
    placedChiseled.setMetadata('customData', { value: 42 });
    
    // Simulate metadata sync
    const metadataUpdate = this.networkManager.createMetadataUpdateEvent(placedChiseled);
    const receivedMetadata = this.networkManager.deserializeMetadataUpdateEvent(metadataUpdate);
    
    assert.strictEqual(receivedMetadata.blockType === 'chiseled_tuff', true);
    assert.strictEqual(receivedMetadata.metadata.customData.value === 42, true);
  }

  testChunkSync() {
    console.log('Testing chunk sync...');
    
    // Test Tuff Brick Slab chunk sync
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Simulate chunk sync
    const chunkData = this.networkManager.serializeChunk(this.world.getChunk(0, 0));
    const receivedChunk = this.networkManager.deserializeChunk(chunkData);
    
    const block = receivedChunk.getBlock(0, 0, 0);
    assert.strictEqual(block.type === 'tuff_brick_slab', true);
    assert.strictEqual(block.position.x === 0, true);
    assert.strictEqual(block.position.y === 0, true);
    assert.strictEqual(block.position.z === 0, true);
  }
}

// Run tests
const test = new TuffVariantsNetworkTest();
test.runTests();
console.log('All Tuff variants network tests passed!');

module.exports = TuffVariantsNetworkTest; 