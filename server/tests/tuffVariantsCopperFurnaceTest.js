const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperFurnaceBlock = require('../blocks/copperFurnaceBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');
const ItemStack = require('../items/itemStack');

class TuffVariantsCopperFurnaceTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperFurnacePlacement();
    this.testCopperFurnaceRedstone();
    this.testCopperFurnaceOxidation();
    this.testCopperFurnaceInteraction();
  }

  testCopperFurnacePlacement() {
    console.log('Testing copper furnace placement...');
    
    // Test Tuff Bricks copper furnace placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper furnace
    const furnace = new CopperFurnaceBlock();
    const placedFurnace = furnace.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper furnace placement
    assert.strictEqual(placedBricks.canSupportCopperFurnace(), true);
    assert.strictEqual(placedFurnace.isValidPlacement(), true);
    
    // Test copper furnace properties
    assert.strictEqual(placedFurnace.isPowered(), false);
    assert.strictEqual(placedFurnace.getFacing(), 'north');
    assert.strictEqual(placedFurnace.getSmeltingSpeed(), 1);
  }

  testCopperFurnaceRedstone() {
    console.log('Testing copper furnace redstone...');
    
    // Test Tuff Brick Wall copper furnace redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper furnace
    const furnace = new CopperFurnaceBlock();
    const placedFurnace = furnace.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedFurnace.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedFurnace.isPowered(), true);
    assert.strictEqual(placedFurnace.getPowerLevel(), 15);
  }

  testCopperFurnaceOxidation() {
    console.log('Testing copper furnace oxidation...');
    
    // Test Tuff Brick Slab copper furnace oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper furnace
    const furnace = new CopperFurnaceBlock();
    const placedFurnace = furnace.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedFurnace.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedFurnace.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedFurnace.getOxidationLevel(), 1);
  }

  testCopperFurnaceInteraction() {
    console.log('Testing copper furnace interaction...');
    
    // Test Tuff Brick Stairs copper furnace interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper furnace
    const furnace = new CopperFurnaceBlock();
    const placedFurnace = furnace.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedFurnace.canInteract(), true);
    
    // Test smelting functionality
    const inputStack = new ItemStack('iron_ore', 1);
    const fuelStack = new ItemStack('coal', 1);
    placedFurnace.insertItem(inputStack, 'input');
    placedFurnace.insertItem(fuelStack, 'fuel');
    assert.strictEqual(placedFurnace.getInventory().getItemCount('iron_ore'), 1);
    assert.strictEqual(placedFurnace.getInventory().getItemCount('coal'), 1);
    
    // Test smelting process
    placedFurnace.startSmelting();
    assert.strictEqual(placedFurnace.isSmelting(), true);
    
    // Test oxidation effect on smelting speed
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedFurnace.getSmeltingSpeed(), 0.9);
  }
}

// Run tests
const test = new TuffVariantsCopperFurnaceTest();
test.runTests();
console.log('All Tuff variants copper furnace interaction tests passed!');

module.exports = TuffVariantsCopperFurnaceTest; 