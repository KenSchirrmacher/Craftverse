const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperHopperBlock = require('../blocks/copperHopperBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');
const ItemStack = require('../items/itemStack');

class TuffVariantsCopperHopperTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperHopperPlacement();
    this.testCopperHopperRedstone();
    this.testCopperHopperOxidation();
    this.testCopperHopperInteraction();
  }

  testCopperHopperPlacement() {
    console.log('Testing copper hopper placement...');
    
    // Test Tuff Bricks copper hopper placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper hopper
    const hopper = new CopperHopperBlock();
    const placedHopper = hopper.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper hopper placement
    assert.strictEqual(placedBricks.canSupportCopperHopper(), true);
    assert.strictEqual(placedHopper.isValidPlacement(), true);
    
    // Test copper hopper properties
    assert.strictEqual(placedHopper.isPowered(), false);
    assert.strictEqual(placedHopper.getFacing(), 'down');
    assert.strictEqual(placedHopper.getTransferSpeed(), 1);
  }

  testCopperHopperRedstone() {
    console.log('Testing copper hopper redstone...');
    
    // Test Tuff Brick Wall copper hopper redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper hopper
    const hopper = new CopperHopperBlock();
    const placedHopper = hopper.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedHopper.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedHopper.isPowered(), true);
    assert.strictEqual(placedHopper.getPowerLevel(), 15);
  }

  testCopperHopperOxidation() {
    console.log('Testing copper hopper oxidation...');
    
    // Test Tuff Brick Slab copper hopper oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper hopper
    const hopper = new CopperHopperBlock();
    const placedHopper = hopper.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedHopper.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedHopper.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedHopper.getOxidationLevel(), 1);
  }

  testCopperHopperInteraction() {
    console.log('Testing copper hopper interaction...');
    
    // Test Tuff Brick Stairs copper hopper interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper hopper
    const hopper = new CopperHopperBlock();
    const placedHopper = hopper.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedHopper.canInteract(), true);
    
    // Test item transfer
    const itemStack = new ItemStack('diamond', 64);
    placedHopper.insertItem(itemStack);
    assert.strictEqual(placedHopper.getInventory().getItemCount('diamond'), 64);
    
    // Test oxidation effect on transfer speed
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedHopper.getTransferSpeed(), 0.9);
  }
}

// Run tests
const test = new TuffVariantsCopperHopperTest();
test.runTests();
console.log('All Tuff variants copper hopper interaction tests passed!');

module.exports = TuffVariantsCopperHopperTest; 