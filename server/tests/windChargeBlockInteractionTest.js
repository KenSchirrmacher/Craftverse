/**
 * Wind Charge Block Interaction Test
 * Tests the enhanced block interactions for Wind Charges
 * Part of the Minecraft 1.24 Update (Trail Tales)
 */

const WindChargeEntity = require('../entities/windChargeEntity');
const assert = require('assert');
const { v4: uuidv4 } = require('uuid');
const World = require('../world/world');
const Player = require('../entities/player');

// Test world implementation
class TestWorld extends World {
  constructor() {
    super();
    this.blocks = new Map();
    this.entities = new Map();
    this.blockStateUpdates = [];
    this.particleEffects = [];
    this.activatedBlocks = [];
  }
  
  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks.get(key) || { type: 'air', isSolid: false };
  }
  
  setBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    this.blocks.set(key, block);
  }
  
  getEntitiesInRadius(position, radius) {
    return Array.from(this.entities.values()).filter(entity => {
      const dx = entity.position.x - position.x;
      const dy = entity.position.y - position.y;
      const dz = entity.position.z - position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance <= radius;
    });
  }
  
  addEntity(entity) {
    this.entities.set(entity.id, entity);
    entity.world = this;
  }
  
  removeEntity(id) {
    this.entities.delete(id);
  }

  updateBlockState(x, y, z, state) {
    this.blockStateUpdates.push({ x, y, z, state });
  }

  addParticleEffect(effect) {
    this.particleEffects.push(effect);
  }

  activateBlock(x, y, z, type, data) {
    this.activatedBlocks.push({ x, y, z, type, ...data });
  }

  reset() {
    this.blockStateUpdates = [];
    this.particleEffects = [];
    this.activatedBlocks = [];
  }
}

// Test player implementation
class TestPlayer extends Player {
  constructor(id, position) {
    super(id, position);
    this.charging = {};
    this.cooldowns = {};
    this.gameMode = 'survival';
    this.rotation = { x: 0, y: 0, z: 0 };
    this.sentEvents = [];
  }

  sendEvent(event) {
    this.sentEvents.push(event);
  }

  getLookDirection() {
    return {
      x: -Math.sin(this.rotation.y) * Math.cos(this.rotation.x),
      y: -Math.sin(this.rotation.x),
      z: Math.cos(this.rotation.y) * Math.cos(this.rotation.x)
    };
  }
}

function createTestWorld() {
  const world = new TestWorld();
  return world;
}

describe('Wind Charge Block Interaction Tests', () => {
  let world;

  beforeEach(() => {
    world = createTestWorld();
  });

  test('Breaking fragile blocks', () => {
    // Place some glass blocks in the world
    world.setBlock(10, 70, 10, { type: 'glass', isSolid: true });
    world.setBlock(10, 70, 11, { type: 'stained_glass', isSolid: true });
    
    // Create and position a wind charge
    const windCharge = new WindChargeEntity('test-id', {
      world: world,
      position: { x: 10.5, y: 70.5, z: 9.5 },
      direction: { x: 0, y: 0, z: 1 },
      chargeLevel: 1
    });
    
    // Explode the wind charge
    windCharge.explode();
    
    // Check if the glass blocks were broken
    assert.strictEqual(world.getBlock(10, 70, 10)?.type, 'air', 'Glass block should be broken');
    assert.strictEqual(world.getBlock(10, 70, 11)?.type, 'air', 'Stained glass block should be broken');
    
    // Verify particle effects were created
    const glassBreakParticles = world.particleEffects.filter(
      effect => effect.particleType === 'block_break' && effect.blockType === 'glass'
    );
    assert(glassBreakParticles.length > 0, 'Glass break particles should be created');
  });

  test('Activating interactable blocks', () => {
    // Place some interactable blocks in the world
    world.setBlock(10, 70, 10, { type: 'button', isSolid: true });
    world.setBlock(10, 70, 11, { type: 'lever', isSolid: true });
    world.setBlock(10, 70, 12, { type: 'door', isSolid: true });
    
    // Create and position a wind charge
    const windCharge = new WindChargeEntity('test-id', {
      world: world,
      position: { x: 10.5, y: 70.5, z: 9.5 },
      direction: { x: 0, y: 0, z: 1 },
      chargeLevel: 1
    });
    
    // Explode the wind charge
    windCharge.explode();
    
    // Check if the blocks were activated
    assert(world.activatedBlocks.some(block => block.x === 10 && block.y === 70 && block.z === 10), 
      'Button should be activated');
    assert(world.activatedBlocks.some(block => block.x === 10 && block.y === 70 && block.z === 11), 
      'Lever should be activated');
    assert(world.activatedBlocks.some(block => block.x === 10 && block.y === 70 && block.z === 12), 
      'Door should be activated');
  });

  test('Transforming dirt blocks', () => {
    // Place dirt blocks in the world
    world.setBlock(10, 70, 10, { type: 'dirt', isSolid: true });
    world.setBlock(10, 70, 11, { type: 'grass_block', isSolid: true });
    
    // Create a strong wind charge (high charge level for strong force)
    const windCharge = new WindChargeEntity('test-id', {
      world: world,
      position: { x: 10.5, y: 70.5, z: 9.5 },
      direction: { x: 0, y: 0, z: 1 },
      chargeLevel: 2, // Strong charge
      explosionRadius: 3 // Larger radius
    });
    
    // Explode the wind charge
    windCharge.explode();
    
    // Check if the blocks were transformed
    assert.strictEqual(world.getBlock(10, 70, 10)?.type, 'dirt_path', 'Dirt should be transformed to dirt_path');
    assert.strictEqual(world.getBlock(10, 70, 11)?.type, 'dirt', 'Grass block should be transformed to dirt');
    
    // Verify transform particle effects
    const transformParticles = world.particleEffects.filter(
      effect => effect.particleType === 'block_transform'
    );
    assert(transformParticles.length > 0, 'Transform particles should be created');
  });

  test('Bell interaction', () => {
    // Place a bell in the world
    world.setBlock(10, 70, 10, { type: 'bell', isSolid: true });
    
    // Create a wind charge
    const windCharge = new WindChargeEntity('test-id', {
      world: world,
      position: { x: 10.5, y: 70.5, z: 9.5 },
      direction: { x: 0, y: 0, z: 1 },
      chargeLevel: 1
    });
    
    // Explode the wind charge
    windCharge.explode();
    
    // Check if the bell was rung
    const bellRung = world.activatedBlocks.some(
      block => block.x === 10 && block.y === 70 && block.z === 10 && block.type === 'bell'
    );
    assert(bellRung, 'Bell should be rung by wind charge');
    
    // Check for bell sound effect
    const bellSound = world.soundEffects.some(sound => sound.sound === 'block.bell.use');
    assert(bellSound, 'Bell sound should be played');
  });

  test('Note block interaction', () => {
    // Place a note block in the world
    world.setBlock(10, 70, 10, { type: 'note_block', isSolid: true });
    
    // Create a wind charge
    const windCharge = new WindChargeEntity('test-id', {
      world: world,
      position: { x: 10.5, y: 70.5, z: 9.5 },
      direction: { x: 0, y: 0, z: 1 },
      chargeLevel: 1
    });
    
    // Explode the wind charge
    windCharge.explode();
    
    // Check if the note block was played
    const notePlayed = world.activatedBlocks.some(
      block => block.x === 10 && block.y === 70 && block.z === 10 && block.type === 'note_block'
    );
    assert(notePlayed, 'Note block should be played by wind charge');
    
    // Check for note particle effects
    const noteParticles = world.particleEffects.filter(
      effect => effect.particleType === 'note'
    );
    assert(noteParticles.length > 0, 'Note particles should be created');
  });

  test('Campfire interaction', () => {
    // Place lit campfires in the world (one for extinguishing, one for flame boost)
    world.setBlock(10, 70, 10, { type: 'campfire', isSolid: true, lit: true });
    world.setBlock(10, 70, 15, { type: 'campfire', isSolid: true, lit: true });
    
    // Create a strong wind charge close to the first campfire (for extinguishing)
    const strongWindCharge = new WindChargeEntity('test-id-1', {
      world: world,
      position: { x: 10.5, y: 70.5, z: 9.5 },
      direction: { x: 0, y: 0, z: 1 },
      chargeLevel: 2 // Strong charge
    });
    
    // Create a weak wind charge near the second campfire (for flame boosting)
    const weakWindCharge = new WindChargeEntity('test-id-2', {
      world: world,
      position: { x: 10.5, y: 70.5, z: 14.5 },
      direction: { x: 0, y: 0, z: 1 },
      chargeLevel: 0 // Weak charge
    });
    
    // Explode both wind charges
    strongWindCharge.explode();
    weakWindCharge.explode();
    
    // Check for campfire state changes
    const campfireStateChanges = world.blockStateUpdates.filter(
      update => update.state.lit === false
    );
    assert(campfireStateChanges.length > 0, 'Strong wind should extinguish campfire');
    
    // Check for flame increase particle effects for the second campfire
    const flameParticles = world.particleEffects.filter(
      effect => effect.particleType === 'flame'
    );
    assert(flameParticles.length > 0, 'Flame increase particles should be created for weak wind');
  });

  test('Wind turbine interaction', () => {
    // Place a wind turbine in the world
    world.setBlock(10, 70, 10, { type: 'wind_turbine', isSolid: true });
    
    // Create wind charges with different charge levels
    const weakWindCharge = new WindChargeEntity('test-id-1', {
      world: world,
      position: { x: 10.5, y: 70.5, z: 9.5 },
      direction: { x: 0, y: 0, z: 1 },
      chargeLevel: 0 // Weak charge
    });
    
    const strongWindCharge = new WindChargeEntity('test-id-2', {
      world: world,
      position: { x: 10.5, y: 70.5, z: 11.5 },
      direction: { x: 0, y: 0, z: -1 },
      chargeLevel: 2 // Strong charge
    });
    
    // Explode both wind charges
    weakWindCharge.explode();
    const weakBoost = world.activatedBlocks.find(
      block => block.x === 10 && block.y === 70 && block.z === 10 && block.type === 'wind_turbine'
    );
    
    world.reset(); // Reset for second test
    world.setBlock(10, 70, 10, { type: 'wind_turbine', isSolid: true });
    world.addEntity(strongWindCharge);
    
    strongWindCharge.explode();
    const strongBoost = world.activatedBlocks.find(
      block => block.x === 10 && block.y === 70 && block.z === 10 && block.type === 'wind_turbine'
    );
    
    // Check if power boost is proportional to charge level
    assert(weakBoost && weakBoost.powerBoost, 'Wind turbine should receive power boost from weak charge');
    assert(strongBoost && strongBoost.powerBoost, 'Wind turbine should receive power boost from strong charge');
    assert(strongBoost.powerBoost > weakBoost.powerBoost, 
      'Strong charge should provide greater power boost than weak charge');
    
    // Check for turbine boost particle effects
    const turbineParticles = world.particleEffects.filter(
      effect => effect.particleType === 'enchant'
    );
    assert(turbineParticles.length > 0, 'Turbine boost particles should be created');
  });

  test('Chain reaction through special blocks', () => {
    // Create a test setup with special blocks and multiple wind charges
    world.setBlock(5, 70, 5, { type: 'glass', isSolid: true }); // Breakable block
    
    // Add three wind charges in a line, with a glass block between the first and second
    const charge1 = new WindChargeEntity('charge-1', {
      world: world,
      position: { x: 3, y: 70, z: 5 },
      direction: { x: 1, y: 0, z: 0 },
      chargeLevel: 2, // Strong charge
      explosionRadius: 3
    });
    
    const charge2 = new WindChargeEntity('charge-2', {
      world: world,
      position: { x: 7, y: 70, z: 5 },
      direction: { x: 1, y: 0, z: 0 },
      chargeLevel: 1
    });
    
    const charge3 = new WindChargeEntity('charge-3', {
      world: world,
      position: { x: 10, y: 70, z: 5 },
      direction: { x: 1, y: 0, z: 0 },
      chargeLevel: 0
    });
    
    world.addEntity(charge1);
    world.addEntity(charge2);
    world.addEntity(charge3);
    
    // Explode the first charge
    charge1.explode();
    
    // Check if the glass block was broken
    assert.strictEqual(world.getBlock(5, 70, 5)?.type, 'air', 'Glass block should be broken');
    
    // Check if both other charges exploded in a chain reaction
    assert(charge2.hasExploded, 'Second wind charge should be triggered');
    assert(charge3.hasExploded, 'Third wind charge should be triggered');
  });

  test('Sand/gravel falling block interaction', () => {
    // Setup world with sand block and air below it
    world.setBlock(10, 70, 10, { type: 'sand', isSolid: true });
    world.setBlock(10, 69, 10, { type: 'air', isSolid: false });
    
    // Create a wind charge with medium-high force
    const windCharge = new WindChargeEntity('test-id', {
      world: world,
      position: { x: 10.5, y: 70.5, z: 9.5 },
      direction: { x: 0, y: 0, z: 1 },
      chargeLevel: 1,
      explosionRadius: 2
    });
    
    // Explode the wind charge
    windCharge.explode();
    
    // Check if the sand block was converted to a falling entity
    assert.strictEqual(world.getBlock(10, 70, 10)?.type, 'air', 'Sand block should be removed');
    
    const fallingEntities = Array.from(world.entities.values()).filter(
      entity => entity.type === 'falling_block' && entity.blockType === 'sand'
    );
    assert(fallingEntities.length > 0, 'Falling sand entity should be created');
  });
});

// Run the tests
function runTests() {
  let passedTests = 0;
  let failedTests = 0;
  let currentBeforeEach = null;
  let currentAfterEach = null;

  function describe(suiteName, testFn) {
    console.log(`\n${suiteName}`);
    testFn();
  }

  function test(testName, testFn) {
    try {
      if (currentBeforeEach) currentBeforeEach();
      
      testFn();
      
      if (currentAfterEach) currentAfterEach();
      
      console.log(`✓ ${testName}`);
      passedTests++;
    } catch (error) {
      console.error(`✗ ${testName}`);
      console.error(`  ${error.message}`);
      failedTests++;
    }
  }

  function beforeEach(fn) {
    currentBeforeEach = fn;
  }

  function afterEach(fn) {
    currentAfterEach = fn;
  }

  const startTime = Date.now();
  
  // Run the test suite
  describe('Wind Charge Block Interaction Tests', () => {
    let world;

    beforeEach(() => {
      world = createTestWorld();
    });

    test('Breaking fragile blocks', () => {
      // Place some glass blocks in the world
      world.setBlock(10, 70, 10, { type: 'glass', isSolid: true });
      world.setBlock(10, 70, 11, { type: 'stained_glass', isSolid: true });
      
      // Create and position a wind charge
      const windCharge = new WindChargeEntity('test-id', {
        world: world,
        position: { x: 10.5, y: 70.5, z: 9.5 },
        direction: { x: 0, y: 0, z: 1 },
        chargeLevel: 1
      });
      
      // Explode the wind charge
      windCharge.explode();
      
      // Check if the glass blocks were broken
      assert.strictEqual(world.getBlock(10, 70, 10)?.type, 'air', 'Glass block should be broken');
      assert.strictEqual(world.getBlock(10, 70, 11)?.type, 'air', 'Stained glass block should be broken');
      
      // Verify particle effects were created
      const glassBreakParticles = world.particleEffects.filter(
        effect => effect.particleType === 'block_break' && effect.blockType === 'glass'
      );
      assert(glassBreakParticles.length > 0, 'Glass break particles should be created');
    });

    test('Activating interactable blocks', () => {
      // Place some interactable blocks in the world
      world.setBlock(10, 70, 10, { type: 'button', isSolid: true });
      world.setBlock(10, 70, 11, { type: 'lever', isSolid: true });
      world.setBlock(10, 70, 12, { type: 'door', isSolid: true });
      
      // Create and position a wind charge
      const windCharge = new WindChargeEntity('test-id', {
        world: world,
        position: { x: 10.5, y: 70.5, z: 9.5 },
        direction: { x: 0, y: 0, z: 1 },
        chargeLevel: 1
      });
      
      // Explode the wind charge
      windCharge.explode();
      
      // Check if the blocks were activated
      assert(world.activatedBlocks.some(block => block.x === 10 && block.y === 70 && block.z === 10), 
        'Button should be activated');
      assert(world.activatedBlocks.some(block => block.x === 10 && block.y === 70 && block.z === 11), 
        'Lever should be activated');
      assert(world.activatedBlocks.some(block => block.x === 10 && block.y === 70 && block.z === 12), 
        'Door should be activated');
    });

    test('Bell interaction', () => {
      // Place a bell in the world
      world.setBlock(10, 70, 10, { type: 'bell', isSolid: true });
      
      // Create a wind charge
      const windCharge = new WindChargeEntity('test-id', {
        world: world,
        position: { x: 10.5, y: 70.5, z: 9.5 },
        direction: { x: 0, y: 0, z: 1 },
        chargeLevel: 1
      });
      
      // Explode the wind charge
      windCharge.explode();
      
      // Check if the bell was rung
      const bellRung = world.activatedBlocks.some(
        block => block.x === 10 && block.y === 70 && block.z === 10 && block.type === 'bell'
      );
      assert(bellRung, 'Bell should be rung by wind charge');
      
      // Check for bell sound effect
      const bellSound = world.soundEffects.some(sound => sound.sound === 'block.bell.use');
      assert(bellSound, 'Bell sound should be played');
    });

    test('Wind turbine interaction', () => {
      // Place a wind turbine in the world
      world.setBlock(10, 70, 10, { type: 'wind_turbine', isSolid: true });
      
      // Create wind charges with different charge levels
      const weakWindCharge = new WindChargeEntity('test-id-1', {
        world: world,
        position: { x: 10.5, y: 70.5, z: 9.5 },
        direction: { x: 0, y: 0, z: 1 },
        chargeLevel: 0 // Weak charge
      });
      
      // Explode the wind charge
      weakWindCharge.explode();
      
      // Check if the turbine was activated
      const turbineActivated = world.activatedBlocks.some(
        block => block.x === 10 && block.y === 70 && block.z === 10 && block.type === 'wind_turbine'
      );
      assert(turbineActivated, 'Wind turbine should be activated by wind charge');
      
      // Check for turbine boost particle effects
      const turbineParticles = world.particleEffects.filter(
        effect => effect.particleType === 'enchant'
      );
      assert(turbineParticles.length > 0, 'Turbine boost particles should be created');
    });
  });

  const endTime = Date.now();
  
  console.log(`\nTests completed in ${endTime - startTime}ms`);
  console.log(`${passedTests} passed, ${failedTests} failed`);
  
  if (failedTests > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests }; 