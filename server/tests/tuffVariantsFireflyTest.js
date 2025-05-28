const assert = require('assert');
const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const World = require('../world/world');
const Firefly = require('../entities/firefly');
const LightBlock = require('../blocks/lightBlock');
const ParticleSystem = require('../particles/particleSystem');

class TuffVariantsFireflyTest {
  constructor() {
    this.world = new World();
    this.world.blocks = new Map();
    this.world.particleSystem = new ParticleSystem();
    this.world.timeOfDay = 0.8; // Start at night
    this.world.entities = new Map();
  }

  runTests() {
    console.log('Running Tuff Variants Firefly Tests...');
    this.testFireflyInteraction();
    this.testFireflyLighting();
    this.testFireflyMovement();
    this.testFireflyBehavior();
    console.log('All Tuff variants firefly tests passed!');
  }

  testFireflyInteraction() {
    console.log('Testing firefly interaction...');
    
    // Test Tuff Bricks firefly interaction
    const bricks = new TuffBricksBlock();
    const placedBricks = bricks.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create firefly
    const firefly = new Firefly(this.world, {
      position: { x: 0, y: 1, z: 0 },
      glowColor: '#FFFF77',
      glowIntensity: 0.8
    });
    
    // Test firefly placement
    assert.strictEqual(placedBricks.canSupportFirefly(), true);
    assert.strictEqual(firefly.isValidPlacement(), true);
    
    // Test firefly properties
    assert.strictEqual(firefly.getLightLevel(), 0);
    assert.strictEqual(firefly.getSize(), 'small');
  }

  testFireflyLighting() {
    console.log('Testing firefly lighting...');
    
    // Test Tuff Brick Wall firefly lighting
    const wall = new TuffBrickWallBlock();
    const placedWall = wall.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create firefly
    const firefly = new Firefly(this.world, {
      position: { x: 0, y: 1, z: 0 },
      glowColor: '#FFFF77',
      glowIntensity: 0.8
    });
    
    // Test firefly lighting
    assert.strictEqual(firefly.canEmitLight(), true);
    firefly.emitLight();
    assert.strictEqual(firefly.getLightLevel(), 3);
    
    // Test light block creation
    const lightBlock = new LightBlock();
    const placedLight = lightBlock.place(this.world, { x: 0, y: 2, z: 0 });
    assert.strictEqual(placedLight.getLightLevel(), 3);
  }

  testFireflyMovement() {
    console.log('Testing firefly movement...');
    
    // Test Tuff Brick Slab firefly movement
    const slab = new TuffBrickSlabBlock();
    const placedSlab = slab.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create firefly
    const firefly = new Firefly(this.world, {
      position: { x: 0, y: 1, z: 0 },
      glowColor: '#FFFF77',
      glowIntensity: 0.8
    });
    
    // Test firefly movement
    assert.strictEqual(firefly.canMove(), true);
    const initialPos = firefly.getPosition();
    firefly.move({ x: 1, y: 0, z: 0 });
    assert.strictEqual(firefly.getPosition().x, initialPos.x + 1);
    
    // Test movement patterns
    assert.strictEqual(firefly.getMovementPattern(), 'random');
    firefly.setMovementPattern('circular');
    assert.strictEqual(firefly.getMovementPattern(), 'circular');
  }

  testFireflyBehavior() {
    console.log('Testing firefly behavior...');
    
    // Test Tuff Brick Stairs firefly behavior
    const stairs = new TuffBrickStairsBlock();
    const placedStairs = stairs.place(this.world, { x: 0, y: 0, z: 0 });
    
    // Create firefly
    const firefly = new Firefly(this.world, {
      position: { x: 0, y: 1, z: 0 },
      glowColor: '#FFFF77',
      glowIntensity: 0.8
    });
    
    // Test firefly behavior
    assert.strictEqual(firefly.getBehavior(), 'idle');
    firefly.setBehavior('mating');
    assert.strictEqual(firefly.getBehavior(), 'mating');
    
    // Test behavior transitions
    assert.strictEqual(firefly.canTransitionBehavior(), true);
    firefly.transitionBehavior('feeding');
    assert.strictEqual(firefly.getBehavior(), 'feeding');
    
    // Test behavior effects
    assert.strictEqual(firefly.getLightPattern(), 'steady');
    firefly.setLightPattern('flashing');
    assert.strictEqual(firefly.getLightPattern(), 'flashing');
  }
}

// Run tests
const test = new TuffVariantsFireflyTest();
test.runTests();

module.exports = TuffVariantsFireflyTest; 