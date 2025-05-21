const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const LightningRodBlock = require('../blocks/lightningRodBlock');
const WeatherSystem = require('../systems/weatherSystem');
const Player = require('../entities/player');
const CopperBlock = require('../blocks/copperBlock');

class TuffVariantsLightningRodTest {
  constructor() {
    this.world = new World();
    this.weatherSystem = new WeatherSystem(this.world);
  }

  runTests() {
    this.testLightningRodPlacement();
    this.testLightningRodConduction();
    this.testLightningRodProtection();
    this.testLightningRodOxidation();
  }

  testLightningRodPlacement() {
    console.log('Testing lightning rod placement...');
    
    // Test Tuff Bricks lightning rod placement
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create lightning rod
    const rod = new LightningRodBlock();
    const placedRod = rod.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test lightning rod placement
    assert.strictEqual(placedBricks.canSupportLightningRod(), true);
    assert.strictEqual(placedRod.isValidPlacement(), true);
    
    // Test lightning rod properties
    assert.strictEqual(placedRod.getHeight(), 1);
    assert.strictEqual(placedRod.isPowered(), false);
  }

  testLightningRodConduction() {
    console.log('Testing lightning rod conduction...');
    
    // Test Tuff Brick Wall lightning rod conduction
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create lightning rod
    const rod = new LightningRodBlock();
    const placedRod = rod.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Test lightning rod conduction
    assert.strictEqual(placedWall.canConductLightning(), true);
    assert.strictEqual(placedRod.canConductLightning(), true);
    
    // Test lightning strike
    this.weatherSystem.strikeLightning({ x: 0, y: 2, z: 0 });
    assert.strictEqual(placedRod.isPowered(), true);
    assert.strictEqual(placedRod.getPowerLevel(), 15);
  }

  testLightningRodProtection() {
    console.log('Testing lightning rod protection...');
    
    // Test Tuff Brick Slab lightning rod protection
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create lightning rod
    const rod = new LightningRodBlock();
    const placedRod = rod.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create player
    const player = new Player();
    player.position = { x: 0, y: 2, z: 0 };
    
    // Test lightning protection
    assert.strictEqual(placedSlab.canProtectFromLightning(), true);
    assert.strictEqual(placedRod.canProtectFromLightning(), true);
    
    // Test lightning strike protection
    this.weatherSystem.strikeLightning({ x: 0, y: 2, z: 0 });
    assert.strictEqual(player.isProtectedFromLightning(), true);
  }

  testLightningRodOxidation() {
    console.log('Testing lightning rod oxidation...');
    
    // Test Tuff Brick Stairs lightning rod oxidation
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create lightning rod
    const rod = new LightningRodBlock();
    const placedRod = rod.place(this.world, { x: 0, y: 1, z: 0 });
    
    // Create copper block
    const copper = new CopperBlock();
    const placedCopper = copper.place(this.world, { x: 0, y: 2, z: 0 });
    
    // Test oxidation properties
    assert.strictEqual(placedStairs.canSupportOxidation(), true);
    assert.strictEqual(placedRod.canSupportOxidation(), true);
    
    // Test lightning strike oxidation
    this.weatherSystem.strikeLightning({ x: 0, y: 2, z: 0 });
    assert.strictEqual(placedCopper.getOxidationLevel(), 1);
  }
}

// Run tests
const test = new TuffVariantsLightningRodTest();
test.runTests();
console.log('All Tuff variants lightning rod interaction tests passed!');

module.exports = TuffVariantsLightningRodTest; 