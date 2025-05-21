const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperTrapdoorBlock = require('../blocks/copperTrapdoorBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');

class TuffVariantsCopperTrapdoorTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperTrapdoorPlacement();
    this.testCopperTrapdoorRedstone();
    this.testCopperTrapdoorOxidation();
    this.testCopperTrapdoorInteraction();
  }

  testCopperTrapdoorPlacement() {
    console.log('Testing copper trapdoor placement...');
    
    // Test Tuff Bricks copper trapdoor placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper trapdoor
    const trapdoor = new CopperTrapdoorBlock();
    const placedTrapdoor = trapdoor.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper trapdoor placement
    assert.strictEqual(placedBricks.canSupportCopperTrapdoor(), true);
    assert.strictEqual(placedTrapdoor.isValidPlacement(), true);
    
    // Test copper trapdoor properties
    assert.strictEqual(placedTrapdoor.isOpen(), false);
    assert.strictEqual(placedTrapdoor.isPowered(), false);
  }

  testCopperTrapdoorRedstone() {
    console.log('Testing copper trapdoor redstone...');
    
    // Test Tuff Brick Wall copper trapdoor redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper trapdoor
    const trapdoor = new CopperTrapdoorBlock();
    const placedTrapdoor = trapdoor.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedTrapdoor.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedTrapdoor.isPowered(), true);
    assert.strictEqual(placedTrapdoor.isOpen(), true);
  }

  testCopperTrapdoorOxidation() {
    console.log('Testing copper trapdoor oxidation...');
    
    // Test Tuff Brick Slab copper trapdoor oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper trapdoor
    const trapdoor = new CopperTrapdoorBlock();
    const placedTrapdoor = trapdoor.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedTrapdoor.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedTrapdoor.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedTrapdoor.getOxidationLevel(), 1);
  }

  testCopperTrapdoorInteraction() {
    console.log('Testing copper trapdoor interaction...');
    
    // Test Tuff Brick Stairs copper trapdoor interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper trapdoor
    const trapdoor = new CopperTrapdoorBlock();
    const placedTrapdoor = trapdoor.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedTrapdoor.canInteract(), true);
    
    // Test trapdoor interaction
    placedTrapdoor.onInteract(player);
    assert.strictEqual(placedTrapdoor.isOpen(), true);
    
    // Test oxidation effect on interaction
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedTrapdoor.getInteractionSpeed(), 0.9);
  }
}

// Run tests
const test = new TuffVariantsCopperTrapdoorTest();
test.runTests();
console.log('All Tuff variants copper trapdoor interaction tests passed!');

module.exports = TuffVariantsCopperTrapdoorTest; 