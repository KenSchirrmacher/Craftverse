const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperObserverBlock = require('../blocks/copperObserverBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');

class TuffVariantsCopperObserverTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperObserverPlacement();
    this.testCopperObserverRedstone();
    this.testCopperObserverOxidation();
    this.testCopperObserverInteraction();
  }

  testCopperObserverPlacement() {
    console.log('Testing copper observer placement...');
    
    // Test Tuff Bricks copper observer placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper observer
    const observer = new CopperObserverBlock();
    const placedObserver = observer.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper observer placement
    assert.strictEqual(placedBricks.canSupportCopperObserver(), true);
    assert.strictEqual(placedObserver.isValidPlacement(), true);
    
    // Test copper observer properties
    assert.strictEqual(placedObserver.isPowered(), false);
    assert.strictEqual(placedObserver.getFacing(), 'north');
    assert.strictEqual(placedObserver.getDetectionRange(), 1);
  }

  testCopperObserverRedstone() {
    console.log('Testing copper observer redstone...');
    
    // Test Tuff Brick Wall copper observer redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper observer
    const observer = new CopperObserverBlock();
    const placedObserver = observer.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedObserver.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedObserver.isPowered(), true);
    assert.strictEqual(placedObserver.getPowerLevel(), 15);
  }

  testCopperObserverOxidation() {
    console.log('Testing copper observer oxidation...');
    
    // Test Tuff Brick Slab copper observer oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper observer
    const observer = new CopperObserverBlock();
    const placedObserver = observer.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedObserver.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedObserver.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedObserver.getOxidationLevel(), 1);
  }

  testCopperObserverInteraction() {
    console.log('Testing copper observer interaction...');
    
    // Test Tuff Brick Stairs copper observer interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper observer
    const observer = new CopperObserverBlock();
    const placedObserver = observer.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedObserver.canInteract(), true);
    
    // Test block change detection
    const block = new TuffBricksBlock();
    block.place(this.world, { x: 0, y: 2, z: 0 });
    assert.strictEqual(placedObserver.detectBlockChange(), true);
    
    // Test oxidation effect on detection range
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedObserver.getDetectionRange(), 2);
  }
}

// Run tests
const test = new TuffVariantsCopperObserverTest();
test.runTests();
console.log('All Tuff variants copper observer interaction tests passed!');

module.exports = TuffVariantsCopperObserverTest; 