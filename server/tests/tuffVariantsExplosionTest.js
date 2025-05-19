const assert = require('assert');
const TestWorld = require('./testWorld');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock, ChiseledTuffBlock } = require('../blocks/tuffVariants');
const { Explosion } = require('../entities/explosion');
const { TNT } = require('../entities/tnt');
const { Creeper } = require('../entities/creeper');

class TuffVariantsExplosionTest {
  constructor() {
    this.world = new TestWorld();
  }

  runTests() {
    this.testExplosionResistance();
    this.testTNTBlast();
    this.testCreeperExplosion();
    this.testBlastRadius();
    this.testBlastDamage();
  }

  testExplosionResistance() {
    console.log('Testing explosion resistance...');
    
    // Test Tuff Bricks explosion resistance
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create explosion
    const explosion = new Explosion({ x: 0, y: 0, z: 0 }, 4);
    
    // Test resistance
    const damage = placedBricks.calculateExplosionDamage(explosion);
    assert.strictEqual(typeof damage, 'number');
    assert.strictEqual(damage < explosion.power, true);
  }

  testTNTBlast() {
    console.log('Testing TNT blast...');
    
    // Test Chiseled Tuff with TNT
    const chiseled = new ChiseledTuffBlock();
    const placedChiseled = chiseled.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Place TNT
    const tnt = new TNT({ x: 2, y: 0, z: 2 });
    tnt.ignite();
    
    // Test blast effect
    const blastDamage = placedChiseled.calculateBlastDamage(tnt);
    assert.strictEqual(typeof blastDamage, 'number');
    assert.strictEqual(blastDamage > 0, true);
  }

  testCreeperExplosion() {
    console.log('Testing creeper explosion...');
    
    // Test Tuff Brick Stairs with creeper
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create creeper explosion
    const creeper = new Creeper({ x: 3, y: 0, z: 3 });
    creeper.explode();
    
    // Test explosion effect
    const explosionDamage = placedStairs.calculateExplosionDamage(creeper.explosion);
    assert.strictEqual(typeof explosionDamage, 'number');
    assert.strictEqual(explosionDamage > 0, true);
  }

  testBlastRadius() {
    console.log('Testing blast radius...');
    
    // Test Tuff Brick Wall blast radius
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create explosion at different distances
    const closeExplosion = new Explosion({ x: 1, y: 0, z: 1 }, 4);
    const farExplosion = new Explosion({ x: 5, y: 0, z: 5 }, 4);
    
    // Test radius effect
    const closeDamage = placedWall.calculateExplosionDamage(closeExplosion);
    const farDamage = placedWall.calculateExplosionDamage(farExplosion);
    
    assert.strictEqual(closeDamage > farDamage, true);
  }

  testBlastDamage() {
    console.log('Testing blast damage...');
    
    // Test Tuff Brick Slab blast damage
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create different power explosions
    const weakExplosion = new Explosion({ x: 0, y: 0, z: 0 }, 2);
    const strongExplosion = new Explosion({ x: 0, y: 0, z: 0 }, 6);
    
    // Test damage scaling
    const weakDamage = placedSlab.calculateExplosionDamage(weakExplosion);
    const strongDamage = placedSlab.calculateExplosionDamage(strongExplosion);
    
    assert.strictEqual(strongDamage > weakDamage, true);
  }
}

// Run tests
const test = new TuffVariantsExplosionTest();
test.runTests();
console.log('All Tuff variants explosion tests passed!');

module.exports = TuffVariantsExplosionTest; 