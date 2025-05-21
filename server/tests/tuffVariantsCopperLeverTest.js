const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperLeverBlock = require('../blocks/copperLeverBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');

class TuffVariantsCopperLeverTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperLeverPlacement();
    this.testCopperLeverRedstone();
    this.testCopperLeverOxidation();
    this.testCopperLeverInteraction();
  }

  testCopperLeverPlacement() {
    console.log('Testing copper lever placement...');
    
    // Test Tuff Bricks copper lever placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper lever
    const lever = new CopperLeverBlock();
    const placedLever = lever.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper lever placement
    assert.strictEqual(placedBricks.canSupportCopperLever(), true);
    assert.strictEqual(placedLever.isValidPlacement(), true);
    
    // Test copper lever properties
    assert.strictEqual(placedLever.isPowered(), false);
    assert.strictEqual(placedLever.getFacing(), 'north');
  }

  testCopperLeverRedstone() {
    console.log('Testing copper lever redstone...');
    
    // Test Tuff Brick Wall copper lever redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper lever
    const lever = new CopperLeverBlock();
    const placedLever = lever.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedLever.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedLever.isPowered(), true);
    assert.strictEqual(placedLever.getPowerLevel(), 15);
  }

  testCopperLeverOxidation() {
    console.log('Testing copper lever oxidation...');
    
    // Test Tuff Brick Slab copper lever oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper lever
    const lever = new CopperLeverBlock();
    const placedLever = lever.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedLever.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedLever.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedLever.getOxidationLevel(), 1);
  }

  testCopperLeverInteraction() {
    console.log('Testing copper lever interaction...');
    
    // Test Tuff Brick Stairs copper lever interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper lever
    const lever = new CopperLeverBlock();
    const placedLever = lever.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedLever.canInteract(), true);
    
    // Test lever interaction
    placedLever.onInteract(player);
    assert.strictEqual(placedLever.isPowered(), true);
    assert.strictEqual(placedLever.getPowerLevel(), 15);
    
    // Test lever toggle
    placedLever.onInteract(player);
    assert.strictEqual(placedLever.isPowered(), false);
    assert.strictEqual(placedLever.getPowerLevel(), 0);
    
    // Test oxidation effect on toggle speed
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedLever.getToggleSpeed(), 0.9);
  }
}

// Run tests
const test = new TuffVariantsCopperLeverTest();
test.runTests();
console.log('All Tuff variants copper lever interaction tests passed!');

module.exports = TuffVariantsCopperLeverTest; 