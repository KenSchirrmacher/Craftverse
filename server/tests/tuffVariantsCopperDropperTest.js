const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperDropperBlock = require('../blocks/copperDropperBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');
const ItemStack = require('../items/itemStack');

class TuffVariantsCopperDropperTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperDropperPlacement();
    this.testCopperDropperRedstone();
    this.testCopperDropperOxidation();
    this.testCopperDropperInteraction();
  }

  testCopperDropperPlacement() {
    console.log('Testing copper dropper placement...');
    
    // Test Tuff Bricks copper dropper placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper dropper
    const dropper = new CopperDropperBlock();
    const placedDropper = dropper.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper dropper placement
    assert.strictEqual(placedBricks.canSupportCopperDropper(), true);
    assert.strictEqual(placedDropper.isValidPlacement(), true);
    
    // Test copper dropper properties
    assert.strictEqual(placedDropper.isPowered(), false);
    assert.strictEqual(placedDropper.getFacing(), 'down');
    assert.strictEqual(placedDropper.getDropSpeed(), 1);
  }

  testCopperDropperRedstone() {
    console.log('Testing copper dropper redstone...');
    
    // Test Tuff Brick Wall copper dropper redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper dropper
    const dropper = new CopperDropperBlock();
    const placedDropper = dropper.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedDropper.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedDropper.isPowered(), true);
    assert.strictEqual(placedDropper.getPowerLevel(), 15);
  }

  testCopperDropperOxidation() {
    console.log('Testing copper dropper oxidation...');
    
    // Test Tuff Brick Slab copper dropper oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper dropper
    const dropper = new CopperDropperBlock();
    const placedDropper = dropper.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedDropper.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedDropper.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedDropper.getOxidationLevel(), 1);
  }

  testCopperDropperInteraction() {
    console.log('Testing copper dropper interaction...');
    
    // Test Tuff Brick Stairs copper dropper interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper dropper
    const dropper = new CopperDropperBlock();
    const placedDropper = dropper.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedDropper.canInteract(), true);
    
    // Test item dropping
    const itemStack = new ItemStack('diamond', 64);
    placedDropper.insertItem(itemStack);
    assert.strictEqual(placedDropper.getInventory().getItemCount('diamond'), 64);
    
    // Test drop functionality
    placedDropper.dropItem();
    assert.strictEqual(placedDropper.getInventory().getItemCount('diamond'), 63);
    
    // Test oxidation effect on drop speed
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedDropper.getDropSpeed(), 0.9);
  }
}

// Run tests
const test = new TuffVariantsCopperDropperTest();
test.runTests();
console.log('All Tuff variants copper dropper interaction tests passed!');

module.exports = TuffVariantsCopperDropperTest; 