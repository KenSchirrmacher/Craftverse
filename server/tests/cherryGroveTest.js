/**
 * Cherry Grove Biome Test Suite
 * Validates the implementation of the Cherry Grove biome, tree features, and related blocks
 */

const assert = require('assert');
const CherryGroveBiome = require('../biomes/cherryGroveBiome');
const CherryTree = require('../world/features/cherryTree');
const blockRegistry = require('../blocks/blockRegistry');
const featureRegistry = require('../world/features/featureRegistry');

// Mock world for testing
class MockWorld {
  constructor() {
    this.blocks = {};
    this.particles = [];
    this.sounds = [];
  }

  getBlockState(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks[key] || null;
  }

  setBlockState(x, y, z, state) {
    const key = `${x},${y},${z}`;
    this.blocks[key] = state;
    return true;
  }

  addParticle(particle) {
    this.particles.push(particle);
    return true;
  }

  playSound(position, sound, volume, pitch) {
    this.sounds.push({ position, sound, volume, pitch });
    return true;
  }

  getLightLevel(position) {
    // Default to full daylight for testing
    return 15;
  }

  getRandom() {
    return new MockRandom();
  }

  generateFeature(type, position, random) {
    // Simulate successful feature generation
    return true;
  }
}

// Mock random number generator for deterministic tests
class MockRandom {
  constructor(seed = 12345) {
    this.seed = seed;
  }

  nextFloat() {
    // Simple PRNG
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max) {
    return Math.floor(this.nextFloat() * max);
  }
}

/**
 * Test the Cherry Grove biome implementation
 */
function testCherryGroveBiome() {
  console.log('Testing Cherry Grove biome...');
  
  // Create biome instance
  const cherryGrove = new CherryGroveBiome();
  
  // Test basic properties
  assert.strictEqual(cherryGrove.id, 'cherry_grove', 'Biome should have correct ID');
  assert.strictEqual(cherryGrove.name, 'Cherry Grove', 'Biome should have correct name');
  assert.strictEqual(cherryGrove.color, '#ffb7c5', 'Biome should have pink color');
  assert.strictEqual(cherryGrove.hasPetalParticles, true, 'Biome should have petal particles');
  
  // Test features
  const random = new MockRandom();
  const features = cherryGrove.getFeaturesAt(100, 100, random);
  assert.ok(Array.isArray(features), 'getFeaturesAt should return an array');
  
  // Test block selection
  const surfaceBlock = cherryGrove.getBlockAt(64, 64, 64);
  assert.strictEqual(surfaceBlock, 'grass_block', 'Surface block should be grass');
  
  console.log('✓ Cherry Grove biome tests passed');
}

/**
 * Test the Cherry Tree feature implementation
 */
function testCherryTreeFeature() {
  console.log('Testing Cherry Tree feature...');
  
  // Create feature instance
  const cherryTree = new CherryTree();
  
  // Test basic properties
  assert.strictEqual(cherryTree.id, 'cherry', 'Feature should have correct ID');
  assert.strictEqual(cherryTree.trunkBlock, 'cherry_log', 'Tree trunk should use cherry logs');
  assert.strictEqual(cherryTree.leavesBlock, 'cherry_leaves', 'Tree leaves should use cherry leaves');
  
  // Test generation
  const world = new MockWorld();
  
  // Setup: Add grass block at y-1 for tree to grow on
  world.setBlockState(0, -1, 0, { type: 'grass_block' });
  
  // Generate tree
  const result = cherryTree.generate(world, { x: 0, y: 0, z: 0 }, new MockRandom());
  assert.strictEqual(result, true, 'Tree generation should succeed');
  
  // Check if trunk was generated
  const hasTrunk = world.getBlockState(0, 0, 0)?.type === 'cherry_log';
  assert.strictEqual(hasTrunk, true, 'Tree trunk should be generated');
  
  // Check if at least some leaves were generated
  let leafCount = 0;
  for (let key in world.blocks) {
    if (world.blocks[key]?.type === 'cherry_leaves') {
      leafCount++;
    }
  }
  assert.ok(leafCount > 0, 'Tree should have generated leaves');
  
  console.log('✓ Cherry Tree feature tests passed');
}

/**
 * Test Cherry log, leaves, and sapling blocks
 */
function testCherryBlocks() {
  console.log('Testing Cherry blocks registration...');
  
  // Check if Cherry blocks are registered
  assert.ok(blockRegistry.hasBlock('cherry_log'), 'Cherry log should be registered');
  assert.ok(blockRegistry.hasBlock('stripped_cherry_log'), 'Stripped cherry log should be registered');
  assert.ok(blockRegistry.hasBlock('cherry_leaves'), 'Cherry leaves should be registered');
  assert.ok(blockRegistry.hasBlock('cherry_sapling'), 'Cherry sapling should be registered');
  
  // Test block instances
  const cherryLog = blockRegistry.getBlock('cherry_log');
  assert.strictEqual(cherryLog.name, 'Cherry Log', 'Cherry log should have correct name');
  assert.strictEqual(cherryLog.woodType, 'cherry', 'Cherry log should have correct wood type');
  
  const cherryLeaves = blockRegistry.getBlock('cherry_leaves');
  assert.strictEqual(cherryLeaves.name, 'Cherry Leaves', 'Cherry leaves should have correct name');
  assert.strictEqual(cherryLeaves.color, '#ffb7c5', 'Cherry leaves should have pink color');
  
  const cherrySapling = blockRegistry.getBlock('cherry_sapling');
  assert.strictEqual(cherrySapling.name, 'Cherry Sapling', 'Cherry sapling should have correct name');
  assert.strictEqual(cherrySapling.treeType, 'cherry', 'Cherry sapling should grow cherry trees');
  
  console.log('✓ Cherry blocks tests passed');
}

/**
 * Test feature registry integration
 */
function testFeatureRegistry() {
  console.log('Testing Feature Registry integration...');
  
  // Check if Cherry Tree feature is registered
  assert.ok(featureRegistry.hasFeature('cherry'), 'Cherry tree feature should be registered');
  
  // Get cherry tree feature
  const cherryTree = featureRegistry.getFeature('cherry');
  assert.ok(cherryTree instanceof CherryTree, 'Should get CherryTree instance from registry');
  
  console.log('✓ Feature Registry tests passed');
}

/**
 * Run all Cherry Grove biome tests
 */
function runTests() {
  console.log('=== Starting Cherry Grove Biome Test Suite ===');
  
  try {
    testCherryBlocks();
    testFeatureRegistry();
    testCherryTreeFeature();
    testCherryGroveBiome();
    
    console.log('✅ ALL TESTS PASSED: Cherry Grove Biome implementation is complete!');
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    process.exit(1);
  }
}

// Run the tests if this module is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests }; 