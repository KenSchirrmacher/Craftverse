const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperPressurePlateBlock = require('../blocks/copperPressurePlateBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');
const Entity = require('../entities/entity');

class TuffVariantsCopperPressurePlateTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperPressurePlatePlacement();
    this.testCopperPressurePlateRedstone();
    this.testCopperPressurePlateOxidation();
    this.testCopperPressurePlateInteraction();
  }

  testCopperPressurePlatePlacement() {
    console.log('Testing copper pressure plate placement...');
    
    // Test Tuff Bricks copper pressure plate placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper pressure plate
    const plate = new CopperPressurePlateBlock();
    const placedPlate = plate.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper pressure plate placement
    assert.strictEqual(placedBricks.canSupportCopperPressurePlate(), true);
    assert.strictEqual(placedPlate.isValidPlacement(), true);
    
    // Test copper pressure plate properties
    assert.strictEqual(placedPlate.isPressed(), false);
    assert.strictEqual(placedPlate.isPowered(), false);
  }

  testCopperPressurePlateRedstone() {
    console.log('Testing copper pressure plate redstone...');
    
    // Test Tuff Brick Wall copper pressure plate redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper pressure plate
    const plate = new CopperPressurePlateBlock();
    const placedPlate = plate.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedPlate.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedPlate.isPowered(), true);
    assert.strictEqual(placedPlate.getPowerLevel(), 15);
  }

  testCopperPressurePlateOxidation() {
    console.log('Testing copper pressure plate oxidation...');
    
    // Test Tuff Brick Slab copper pressure plate oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper pressure plate
    const plate = new CopperPressurePlateBlock();
    const placedPlate = plate.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedPlate.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedPlate.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedPlate.getOxidationLevel(), 1);
  }

  testCopperPressurePlateInteraction() {
    console.log('Testing copper pressure plate interaction...');
    
    // Test Tuff Brick Stairs copper pressure plate interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper pressure plate
    const plate = new CopperPressurePlateBlock();
    const placedPlate = plate.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create test entities
    const player = new Player();
    player.position = { x: 0, y: 1, z: 0 };
    const entity = new Entity();
    entity.position = { x: 0, y: 1, z: 0 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedPlate.canInteract(), true);
    
    // Test pressure plate interaction
    placedPlate.onEntityStep(player);
    assert.strictEqual(placedPlate.isPressed(), true);
    assert.strictEqual(placedPlate.getPowerLevel(), 15);
    
    // Test multiple entities
    placedPlate.onEntityStep(entity);
    assert.strictEqual(placedPlate.getPowerLevel(), 15);
    
    // Test oxidation effect on sensitivity
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedPlate.getSensitivity(), 0.9);
  }
}

// Run tests
const test = new TuffVariantsCopperPressurePlateTest();
test.runTests();
console.log('All Tuff variants copper pressure plate interaction tests passed!');

module.exports = TuffVariantsCopperPressurePlateTest; 