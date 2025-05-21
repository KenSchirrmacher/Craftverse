const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperCampfireBlock = require('../blocks/copperCampfireBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');
const ItemStack = require('../items/itemStack');

class TuffVariantsCopperCampfireTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperCampfirePlacement();
    this.testCopperCampfireRedstone();
    this.testCopperCampfireOxidation();
    this.testCopperCampfireInteraction();
  }

  testCopperCampfirePlacement() {
    console.log('Testing copper campfire placement...');
    
    // Test Tuff Bricks copper campfire placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper campfire
    const campfire = new CopperCampfireBlock();
    const placedCampfire = campfire.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper campfire placement
    assert.strictEqual(placedBricks.canSupportCopperCampfire(), true);
    assert.strictEqual(placedCampfire.isValidPlacement(), true);
    
    // Test copper campfire properties
    assert.strictEqual(placedCampfire.isLit(), true);
    assert.strictEqual(placedCampfire.getSignalStrength(), 0);
    assert.strictEqual(placedCampfire.getCookingSpeed(), 1);
  }

  testCopperCampfireRedstone() {
    console.log('Testing copper campfire redstone...');
    
    // Test Tuff Brick Wall copper campfire redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper campfire
    const campfire = new CopperCampfireBlock();
    const placedCampfire = campfire.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedCampfire.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedCampfire.isPowered(), true);
    assert.strictEqual(placedCampfire.getSignalStrength(), 15);
  }

  testCopperCampfireOxidation() {
    console.log('Testing copper campfire oxidation...');
    
    // Test Tuff Brick Slab copper campfire oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper campfire
    const campfire = new CopperCampfireBlock();
    const placedCampfire = campfire.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedCampfire.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedCampfire.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedCampfire.getOxidationLevel(), 1);
  }

  testCopperCampfireInteraction() {
    console.log('Testing copper campfire interaction...');
    
    // Test Tuff Brick Stairs copper campfire interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper campfire
    const campfire = new CopperCampfireBlock();
    const placedCampfire = campfire.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedCampfire.canInteract(), true);
    
    // Test cooking functionality
    const inputStack = new ItemStack('beef', 1);
    placedCampfire.insertItem(inputStack, 'input');
    assert.strictEqual(placedCampfire.getInventory().getItemCount('beef'), 1);
    
    // Test cooking process
    placedCampfire.startCooking();
    assert.strictEqual(placedCampfire.isCooking(), true);
    
    // Test oxidation effect on cooking speed
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedCampfire.getCookingSpeed(), 0.9);
    
    // Test signal strength based on items cooking
    assert.strictEqual(placedCampfire.getSignalStrength(), 3);
  }
}

// Run tests
const test = new TuffVariantsCopperCampfireTest();
test.runTests();
console.log('All Tuff variants copper campfire interaction tests passed!');

module.exports = TuffVariantsCopperCampfireTest; 