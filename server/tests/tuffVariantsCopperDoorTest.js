const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperDoorBlock = require('../blocks/copperDoorBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');

class TuffVariantsCopperDoorTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperDoorPlacement();
    this.testCopperDoorRedstone();
    this.testCopperDoorOxidation();
    this.testCopperDoorInteraction();
  }

  testCopperDoorPlacement() {
    console.log('Testing copper door placement...');
    
    // Test Tuff Bricks copper door placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper door
    const door = new CopperDoorBlock();
    const placedDoor = door.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper door placement
    assert.strictEqual(placedBricks.canSupportCopperDoor(), true);
    assert.strictEqual(placedDoor.isValidPlacement(), true);
    
    // Test copper door properties
    assert.strictEqual(placedDoor.isOpen(), false);
    assert.strictEqual(placedDoor.isPowered(), false);
  }

  testCopperDoorRedstone() {
    console.log('Testing copper door redstone...');
    
    // Test Tuff Brick Wall copper door redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper door
    const door = new CopperDoorBlock();
    const placedDoor = door.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedDoor.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedDoor.isPowered(), true);
    assert.strictEqual(placedDoor.isOpen(), true);
  }

  testCopperDoorOxidation() {
    console.log('Testing copper door oxidation...');
    
    // Test Tuff Brick Slab copper door oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper door
    const door = new CopperDoorBlock();
    const placedDoor = door.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedDoor.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedDoor.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedDoor.getOxidationLevel(), 1);
  }

  testCopperDoorInteraction() {
    console.log('Testing copper door interaction...');
    
    // Test Tuff Brick Stairs copper door interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper door
    const door = new CopperDoorBlock();
    const placedDoor = door.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedDoor.canInteract(), true);
    
    // Test door interaction
    placedDoor.onInteract(player);
    assert.strictEqual(placedDoor.isOpen(), true);
    
    // Test oxidation effect on interaction
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedDoor.getInteractionSpeed(), 0.9);
  }
}

// Run tests
const test = new TuffVariantsCopperDoorTest();
test.runTests();
console.log('All Tuff variants copper door interaction tests passed!');

module.exports = TuffVariantsCopperDoorTest; 