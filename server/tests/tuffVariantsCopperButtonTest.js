const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperButtonBlock = require('../blocks/copperButtonBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');

class TuffVariantsCopperButtonTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperButtonPlacement();
    this.testCopperButtonRedstone();
    this.testCopperButtonOxidation();
    this.testCopperButtonInteraction();
  }

  testCopperButtonPlacement() {
    console.log('Testing copper button placement...');
    
    // Test Tuff Bricks copper button placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper button
    const button = new CopperButtonBlock();
    const placedButton = button.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper button placement
    assert.strictEqual(placedBricks.canSupportCopperButton(), true);
    assert.strictEqual(placedButton.isValidPlacement(), true);
    
    // Test copper button properties
    assert.strictEqual(placedButton.isPressed(), false);
    assert.strictEqual(placedButton.isPowered(), false);
  }

  testCopperButtonRedstone() {
    console.log('Testing copper button redstone...');
    
    // Test Tuff Brick Wall copper button redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper button
    const button = new CopperButtonBlock();
    const placedButton = button.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedButton.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedButton.isPowered(), true);
    assert.strictEqual(placedButton.getPowerLevel(), 15);
  }

  testCopperButtonOxidation() {
    console.log('Testing copper button oxidation...');
    
    // Test Tuff Brick Slab copper button oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper button
    const button = new CopperButtonBlock();
    const placedButton = button.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedButton.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedButton.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedButton.getOxidationLevel(), 1);
  }

  testCopperButtonInteraction() {
    console.log('Testing copper button interaction...');
    
    // Test Tuff Brick Stairs copper button interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper button
    const button = new CopperButtonBlock();
    const placedButton = button.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedButton.canInteract(), true);
    
    // Test button interaction
    placedButton.onInteract(player);
    assert.strictEqual(placedButton.isPressed(), true);
    assert.strictEqual(placedButton.getPowerLevel(), 15);
    
    // Test button release
    placedButton.onRelease();
    assert.strictEqual(placedButton.isPressed(), false);
    assert.strictEqual(placedButton.getPowerLevel(), 0);
    
    // Test oxidation effect on press duration
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedButton.getPressDuration(), 20);
  }
}

// Run tests
const test = new TuffVariantsCopperButtonTest();
test.runTests();
console.log('All Tuff variants copper button interaction tests passed!');

module.exports = TuffVariantsCopperButtonTest; 