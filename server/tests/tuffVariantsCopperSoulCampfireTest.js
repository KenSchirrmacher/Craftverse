const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperSoulCampfireBlock = require('../blocks/copperSoulCampfireBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');
const ItemStack = require('../items/itemStack');

class TuffVariantsCopperSoulCampfireTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperSoulCampfirePlacement();
    this.testCopperSoulCampfireRedstone();
    this.testCopperSoulCampfireOxidation();
    this.testCopperSoulCampfireInteraction();
  }

  testCopperSoulCampfirePlacement() {
    console.log('Testing copper soul campfire placement...');
    
    // Test Tuff Bricks copper soul campfire placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper soul campfire
    const soulCampfire = new CopperSoulCampfireBlock();
    const placedSoulCampfire = soulCampfire.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper soul campfire placement
    assert.strictEqual(placedBricks.canSupportCopperSoulCampfire(), true);
    assert.strictEqual(placedSoulCampfire.isValidPlacement(), true);
    
    // Test copper soul campfire properties
    assert.strictEqual(placedSoulCampfire.isLit(), true);
    assert.strictEqual(placedSoulCampfire.getSignalStrength(), 0);
    assert.strictEqual(placedSoulCampfire.getCookingSpeed(), 1);
    assert.strictEqual(placedSoulCampfire.getLightLevel(), 10);
  }

  testCopperSoulCampfireRedstone() {
    console.log('Testing copper soul campfire redstone...');
    
    // Test Tuff Brick Wall copper soul campfire redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper soul campfire
    const soulCampfire = new CopperSoulCampfireBlock();
    const placedSoulCampfire = soulCampfire.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedSoulCampfire.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedSoulCampfire.isPowered(), true);
    assert.strictEqual(placedSoulCampfire.getSignalStrength(), 15);
  }

  testCopperSoulCampfireOxidation() {
    console.log('Testing copper soul campfire oxidation...');
    
    // Test Tuff Brick Slab copper soul campfire oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper soul campfire
    const soulCampfire = new CopperSoulCampfireBlock();
    const placedSoulCampfire = soulCampfire.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedSoulCampfire.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedSoulCampfire.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedSoulCampfire.getOxidationLevel(), 1);
  }

  testCopperSoulCampfireInteraction() {
    console.log('Testing copper soul campfire interaction...');
    
    // Test Tuff Brick Stairs copper soul campfire interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper soul campfire
    const soulCampfire = new CopperSoulCampfireBlock();
    const placedSoulCampfire = soulCampfire.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedSoulCampfire.canInteract(), true);
    
    // Test cooking functionality
    const inputStack = new ItemStack('beef', 1);
    placedSoulCampfire.insertItem(inputStack, 'input');
    assert.strictEqual(placedSoulCampfire.getInventory().getItemCount('beef'), 1);
    
    // Test cooking process
    placedSoulCampfire.startCooking();
    assert.strictEqual(placedSoulCampfire.isCooking(), true);
    
    // Test oxidation effect on cooking speed
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedSoulCampfire.getCookingSpeed(), 0.9);
    
    // Test signal strength based on items cooking
    assert.strictEqual(placedSoulCampfire.getSignalStrength(), 3);
    
    // Test soul fire properties
    assert.strictEqual(placedSoulCampfire.getLightLevel(), 10);
    assert.strictEqual(placedSoulCampfire.getSoulSpeedMultiplier(), 1.5);
  }
}

// Run tests
const test = new TuffVariantsCopperSoulCampfireTest();
test.runTests();
console.log('All Tuff variants copper soul campfire interaction tests passed!');

module.exports = TuffVariantsCopperSoulCampfireTest; 