const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperBlastFurnaceBlock = require('../blocks/copperBlastFurnaceBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');
const ItemStack = require('../items/itemStack');

class TuffVariantsCopperBlastFurnaceTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperBlastFurnacePlacement();
    this.testCopperBlastFurnaceRedstone();
    this.testCopperBlastFurnaceOxidation();
    this.testCopperBlastFurnaceInteraction();
  }

  testCopperBlastFurnacePlacement() {
    console.log('Testing copper blast furnace placement...');
    
    // Test Tuff Bricks copper blast furnace placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper blast furnace
    const blastFurnace = new CopperBlastFurnaceBlock();
    const placedBlastFurnace = blastFurnace.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper blast furnace placement
    assert.strictEqual(placedBricks.canSupportCopperBlastFurnace(), true);
    assert.strictEqual(placedBlastFurnace.isValidPlacement(), true);
    
    // Test copper blast furnace properties
    assert.strictEqual(placedBlastFurnace.isPowered(), false);
    assert.strictEqual(placedBlastFurnace.getFacing(), 'north');
    assert.strictEqual(placedBlastFurnace.getSmeltingSpeed(), 2);
  }

  testCopperBlastFurnaceRedstone() {
    console.log('Testing copper blast furnace redstone...');
    
    // Test Tuff Brick Wall copper blast furnace redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper blast furnace
    const blastFurnace = new CopperBlastFurnaceBlock();
    const placedBlastFurnace = blastFurnace.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedBlastFurnace.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedBlastFurnace.isPowered(), true);
    assert.strictEqual(placedBlastFurnace.getPowerLevel(), 15);
  }

  testCopperBlastFurnaceOxidation() {
    console.log('Testing copper blast furnace oxidation...');
    
    // Test Tuff Brick Slab copper blast furnace oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper blast furnace
    const blastFurnace = new CopperBlastFurnaceBlock();
    const placedBlastFurnace = blastFurnace.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedBlastFurnace.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedBlastFurnace.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedBlastFurnace.getOxidationLevel(), 1);
  }

  testCopperBlastFurnaceInteraction() {
    console.log('Testing copper blast furnace interaction...');
    
    // Test Tuff Brick Stairs copper blast furnace interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper blast furnace
    const blastFurnace = new CopperBlastFurnaceBlock();
    const placedBlastFurnace = blastFurnace.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedBlastFurnace.canInteract(), true);
    
    // Test smelting functionality
    const inputStack = new ItemStack('iron_ore', 1);
    const fuelStack = new ItemStack('coal', 1);
    placedBlastFurnace.insertItem(inputStack, 'input');
    placedBlastFurnace.insertItem(fuelStack, 'fuel');
    assert.strictEqual(placedBlastFurnace.getInventory().getItemCount('iron_ore'), 1);
    assert.strictEqual(placedBlastFurnace.getInventory().getItemCount('coal'), 1);
    
    // Test smelting process
    placedBlastFurnace.startSmelting();
    assert.strictEqual(placedBlastFurnace.isSmelting(), true);
    
    // Test oxidation effect on smelting speed
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedBlastFurnace.getSmeltingSpeed(), 1.8);
  }
}

// Run tests
const test = new TuffVariantsCopperBlastFurnaceTest();
test.runTests();
console.log('All Tuff variants copper blast furnace interaction tests passed!');

module.exports = TuffVariantsCopperBlastFurnaceTest; 