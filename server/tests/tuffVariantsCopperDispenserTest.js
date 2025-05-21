const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperDispenserBlock = require('../blocks/copperDispenserBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');
const ItemStack = require('../items/itemStack');

class TuffVariantsCopperDispenserTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperDispenserPlacement();
    this.testCopperDispenserRedstone();
    this.testCopperDispenserOxidation();
    this.testCopperDispenserInteraction();
  }

  testCopperDispenserPlacement() {
    console.log('Testing copper dispenser placement...');
    
    // Test Tuff Bricks copper dispenser placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper dispenser
    const dispenser = new CopperDispenserBlock();
    const placedDispenser = dispenser.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper dispenser placement
    assert.strictEqual(placedBricks.canSupportCopperDispenser(), true);
    assert.strictEqual(placedDispenser.isValidPlacement(), true);
    
    // Test copper dispenser properties
    assert.strictEqual(placedDispenser.isPowered(), false);
    assert.strictEqual(placedDispenser.getFacing(), 'north');
    assert.strictEqual(placedDispenser.getDispenseSpeed(), 1);
  }

  testCopperDispenserRedstone() {
    console.log('Testing copper dispenser redstone...');
    
    // Test Tuff Brick Wall copper dispenser redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper dispenser
    const dispenser = new CopperDispenserBlock();
    const placedDispenser = dispenser.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedDispenser.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedDispenser.isPowered(), true);
    assert.strictEqual(placedDispenser.getPowerLevel(), 15);
  }

  testCopperDispenserOxidation() {
    console.log('Testing copper dispenser oxidation...');
    
    // Test Tuff Brick Slab copper dispenser oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper dispenser
    const dispenser = new CopperDispenserBlock();
    const placedDispenser = dispenser.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedDispenser.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedDispenser.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedDispenser.getOxidationLevel(), 1);
  }

  testCopperDispenserInteraction() {
    console.log('Testing copper dispenser interaction...');
    
    // Test Tuff Brick Stairs copper dispenser interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper dispenser
    const dispenser = new CopperDispenserBlock();
    const placedDispenser = dispenser.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedDispenser.canInteract(), true);
    
    // Test item dispensing
    const itemStack = new ItemStack('arrow', 64);
    placedDispenser.insertItem(itemStack);
    assert.strictEqual(placedDispenser.getInventory().getItemCount('arrow'), 64);
    
    // Test dispense functionality
    placedDispenser.dispenseItem();
    assert.strictEqual(placedDispenser.getInventory().getItemCount('arrow'), 63);
    
    // Test oxidation effect on dispense speed
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedDispenser.getDispenseSpeed(), 0.9);
  }
}

// Run tests
const test = new TuffVariantsCopperDispenserTest();
test.runTests();
console.log('All Tuff variants copper dispenser interaction tests passed!');

module.exports = TuffVariantsCopperDispenserTest; 