const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const CopperSmokerBlock = require('../blocks/copperSmokerBlock');
const RedstoneSystem = require('../systems/redstoneSystem');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');
const ItemStack = require('../items/itemStack');

class TuffVariantsCopperSmokerTest {
  constructor() {
    this.world = new World();
    this.redstoneSystem = new RedstoneSystem(this.world);
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testCopperSmokerPlacement();
    this.testCopperSmokerRedstone();
    this.testCopperSmokerOxidation();
    this.testCopperSmokerInteraction();
  }

  testCopperSmokerPlacement() {
    console.log('Testing copper smoker placement...');
    
    // Test Tuff Bricks copper smoker placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper smoker
    const smoker = new CopperSmokerBlock();
    const placedSmoker = smoker.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test copper smoker placement
    assert.strictEqual(placedBricks.canSupportCopperSmoker(), true);
    assert.strictEqual(placedSmoker.isValidPlacement(), true);
    
    // Test copper smoker properties
    assert.strictEqual(placedSmoker.isPowered(), false);
    assert.strictEqual(placedSmoker.getFacing(), 'north');
    assert.strictEqual(placedSmoker.getSmokingSpeed(), 1);
  }

  testCopperSmokerRedstone() {
    console.log('Testing copper smoker redstone...');
    
    // Test Tuff Brick Wall copper smoker redstone
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper smoker
    const smoker = new CopperSmokerBlock();
    const placedSmoker = smoker.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test redstone properties
    assert.strictEqual(placedWall.canConductRedstone(), true);
    assert.strictEqual(placedSmoker.canConductRedstone(), true);
    
    // Test redstone power
    this.redstoneSystem.setPower({ x: 0, y: 1, z: 0 }, 15);
    assert.strictEqual(placedSmoker.isPowered(), true);
    assert.strictEqual(placedSmoker.getPowerLevel(), 15);
  }

  testCopperSmokerOxidation() {
    console.log('Testing copper smoker oxidation...');
    
    // Test Tuff Brick Slab copper smoker oxidation
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper smoker
    const smoker = new CopperSmokerBlock();
    const placedSmoker = smoker.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedSlab.canSupportOxidation(), true);
    assert.strictEqual(placedSmoker.canSupportOxidation(), true);
    
    // Test oxidation levels
    assert.strictEqual(placedSmoker.getOxidationLevel(), 0);
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedSmoker.getOxidationLevel(), 1);
  }

  testCopperSmokerInteraction() {
    console.log('Testing copper smoker interaction...');
    
    // Test Tuff Brick Stairs copper smoker interaction
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create copper smoker
    const smoker = new CopperSmokerBlock();
    const placedSmoker = smoker.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 1, z: 1 };
    
    // Test interaction properties
    assert.strictEqual(placedStairs.canSupportInteraction(), true);
    assert.strictEqual(placedSmoker.canInteract(), true);
    
    // Test smoking functionality
    const inputStack = new ItemStack('beef', 1);
    const fuelStack = new ItemStack('coal', 1);
    placedSmoker.insertItem(inputStack, 'input');
    placedSmoker.insertItem(fuelStack, 'fuel');
    assert.strictEqual(placedSmoker.getInventory().getItemCount('beef'), 1);
    assert.strictEqual(placedSmoker.getInventory().getItemCount('coal'), 1);
    
    // Test smoking process
    placedSmoker.startSmoking();
    assert.strictEqual(placedSmoker.isSmoking(), true);
    
    // Test oxidation effect on smoking speed
    this.weatherSystem.simulateTime(1000);
    assert.strictEqual(placedSmoker.getSmokingSpeed(), 0.9);
  }
}

// Run tests
const test = new TuffVariantsCopperSmokerTest();
test.runTests();
console.log('All Tuff variants copper smoker interaction tests passed!');

module.exports = TuffVariantsCopperSmokerTest; 