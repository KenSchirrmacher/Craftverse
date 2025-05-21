const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperRepeaterBlock = require('../blocks/copperRepeaterBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');

class TuffVariantsCopperRepeaterTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperRepeaterPlacement();
    this.testCopperRepeaterRedstone();
    this.testCopperRepeaterOxidation();
    this.testCopperRepeaterInteraction();
  }

  testCopperRepeaterPlacement() {
    console.log('Testing copper repeater placement...');
    
    // Test Tuff Bricks copper repeater placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper repeater
    const repeater = new CopperRepeaterBlock();
    const placedRepeater = repeater.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper repeater placement
    assert.strictEqual(placedBricks.canSupportCopperRepeater(), true);
    assert.strictEqual(placedRepeater.isValidPlacement(), true);
    
    // Test copper repeater properties
    assert.strictEqual(placedRepeater.isPowered(), false);
    assert.strictEqual(placedRepeater.getFacing(), 'north');
    assert.strictEqual(placedRepeater.getDelay(), 1);
  }

  testCopperRepeaterRedstone() {
    console.log('Testing copper repeater redstone...');
    
    // Test Tuff Brick Wall copper repeater redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper repeater
    const repeater = new CopperRepeaterBlock();
    const placedRepeater = repeater.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedRepeater.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedRepeater.isPowered(), true);
    assert.strictEqual(placedRepeater.getPowerLevel(), 15);
  }

  testCopperRepeaterOxidation() {
    console.log('Testing copper repeater oxidation...');
    
    // Test Tuff Brick Slab copper repeater oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper repeater
    const repeater = new CopperRepeaterBlock();
    const placedRepeater = repeater.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedRepeater.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedRepeater.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedRepeater.getOxidationLevel(), 1);
  }

  testCopperRepeaterInteraction() {
    console.log('Testing copper repeater interaction...');
    
    // Test Tuff Brick Stairs copper repeater interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper repeater
    const repeater = new CopperRepeaterBlock();
    const placedRepeater = repeater.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedRepeater.canInteract(), true);
    
    // Test repeater interaction
    placedRepeater.onInteract(player);
    assert.strictEqual(placedRepeater.getDelay(), 2);
    
    // Test repeater locking
    placedRepeater.onLock();
    assert.strictEqual(placedRepeater.isLocked(), true);
    
    // Test oxidation effect on delay
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedRepeater.getDelayMultiplier(), 0.9);
  }
}

// Run tests
const test = new TuffVariantsCopperRepeaterTest();
test.runTests();
console.log('All Tuff variants copper repeater interaction tests passed!');

module.exports = TuffVariantsCopperRepeaterTest; 