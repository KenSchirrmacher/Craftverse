/**
 * Simple Mangrove Tree Blocks Test
 * Just verifies that blocks can be instantiated with correct properties
 */

const assert = require('assert');
const MangroveLogBlock = require('../blocks/mangroveLogBlock');
const MangroveRootsBlock = require('../blocks/mangroveRootsBlock');
const MangroveLeavesBlock = require('../blocks/mangroveLeavesBlock');
const MangrovePropaguleBlock = require('../blocks/mangrovePropaguleBlock');

console.log('Starting Simple Mangrove Tree Components Test');

// Flag to track test status
let allTestsPassed = true;

// Helper function to run a test and track success
function test(name, testFn) {
  console.log(`\nTesting: ${name}`);
  try {
    testFn();
    console.log(`✓ PASSED: ${name}`);
    return true;
  } catch (error) {
    console.error(`✗ FAILED: ${name}`);
    console.error(`  Error: ${error.message}`);
    console.error(`  Stack: ${error.stack}`);
    allTestsPassed = false;
    return false;
  }
}

// Test MangroveLogBlock
test('MangroveLogBlock properties', () => {
  const log = new MangroveLogBlock();
  assert.strictEqual(log.id, 'mangrove_log');
  assert.strictEqual(log.name, 'Mangrove Log');
  assert.strictEqual(log.hardness, 2.0);
  assert.strictEqual(log.flammable, true);
  assert.strictEqual(log.preferredTool, 'axe');
  assert.strictEqual(log.axis, 'y');
  assert.strictEqual(log.stripped, false);
  
  // Test a stripped variant
  const strippedLog = new MangroveLogBlock({ stripped: true });
  assert.strictEqual(strippedLog.stripped, true);
});

// Test MangroveRootsBlock
test('MangroveRootsBlock properties', () => {
  const roots = new MangroveRootsBlock();
  assert.strictEqual(roots.id, 'mangrove_roots');
  assert.strictEqual(roots.name, 'Mangrove Roots');
  assert.strictEqual(roots.hardness, 0.7);
  assert.strictEqual(roots.transparent, true);
  assert.strictEqual(roots.solid, true);
  assert.strictEqual(roots.preferredTool, 'axe');
  assert.strictEqual(roots.waterlogged, false);
  assert.strictEqual(roots.canGrowThrough, true);
  assert.ok(roots.canPlaceOn.includes('mud'), 'Should be placeable on mud');
  
  // Test a waterlogged variant
  const waterloggedRoots = new MangroveRootsBlock({ waterlogged: true });
  assert.strictEqual(waterloggedRoots.waterlogged, true);
  assert.strictEqual(waterloggedRoots.getFluidType(), 'water');
});

// Test MangroveLeavesBlock
test('MangroveLeavesBlock properties', () => {
  const leaves = new MangroveLeavesBlock();
  assert.strictEqual(leaves.id, 'mangrove_leaves');
  assert.strictEqual(leaves.name, 'Mangrove Leaves');
  assert.strictEqual(leaves.hardness, 0.2);
  assert.strictEqual(leaves.transparent, true);
  assert.strictEqual(leaves.flammable, true);
  assert.strictEqual(leaves.preferredTool, 'shears');
  assert.strictEqual(leaves.persistent, false);
  assert.strictEqual(leaves.distance, 7);
  assert.strictEqual(leaves.waterlogged, false);
  assert.strictEqual(typeof leaves.propaguleDropChance, 'number');
  
  // Test persistent variant
  const persistentLeaves = new MangroveLeavesBlock({ persistent: true });
  assert.strictEqual(persistentLeaves.persistent, true);
});

// Test MangrovePropaguleBlock
test('MangrovePropaguleBlock properties', () => {
  const propagule = new MangrovePropaguleBlock();
  assert.strictEqual(propagule.id, 'mangrove_propagule');
  assert.strictEqual(propagule.name, 'Mangrove Propagule');
  assert.strictEqual(propagule.hardness, 0.0);
  assert.strictEqual(propagule.transparent, true);
  assert.strictEqual(propagule.solid, false);
  assert.strictEqual(propagule.flammable, true);
  assert.strictEqual(propagule.waterlogged, false);
  assert.strictEqual(propagule.stage, 0);
  assert.strictEqual(propagule.hanging, true);
  
  // Test planted propagule variant
  const plantedPropagule = new MangrovePropaguleBlock({ hanging: false, stage: 3 });
  assert.strictEqual(plantedPropagule.hanging, false);
  assert.strictEqual(plantedPropagule.stage, 3);
});

// Skip BlockRegistry test for now as it might be crashing
try {
  console.log('\nTesting: BlockRegistry integration');
  const blockRegistry = require('../blocks/blockRegistry');
  
  console.log('- Checking if blocks are registered');
  console.log(`  mangrove_log: ${blockRegistry.hasBlock('mangrove_log')}`);
  console.log(`  stripped_mangrove_log: ${blockRegistry.hasBlock('stripped_mangrove_log')}`);
  console.log(`  mangrove_leaves: ${blockRegistry.hasBlock('mangrove_leaves')}`);
  console.log(`  mangrove_roots: ${blockRegistry.hasBlock('mangrove_roots')}`);
  console.log(`  mangrove_propagule: ${blockRegistry.hasBlock('mangrove_propagule')}`);
  
  assert.ok(blockRegistry.hasBlock('mangrove_log'), 'BlockRegistry should have mangrove_log');
  assert.ok(blockRegistry.hasBlock('stripped_mangrove_log'), 'BlockRegistry should have stripped_mangrove_log');
  assert.ok(blockRegistry.hasBlock('mangrove_leaves'), 'BlockRegistry should have mangrove_leaves');
  assert.ok(blockRegistry.hasBlock('mangrove_roots'), 'BlockRegistry should have mangrove_roots');
  assert.ok(blockRegistry.hasBlock('mangrove_propagule'), 'BlockRegistry should have mangrove_propagule');
  
  console.log('- Testing block instance creation');
  const log = blockRegistry.createBlock('mangrove_log');
  console.log(`  Created log: ${log ? 'success' : 'failure'}`);
  if (log) {
    console.log(`  log instanceof MangroveLogBlock: ${log instanceof MangroveLogBlock}`);
  }
  
  const leaves = blockRegistry.createBlock('mangrove_leaves');
  console.log(`  Created leaves: ${leaves ? 'success' : 'failure'}`);
  if (leaves) {
    console.log(`  leaves instanceof MangroveLeavesBlock: ${leaves instanceof MangroveLeavesBlock}`);
  }
  
  assert.ok(log instanceof MangroveLogBlock, 'Should create MangroveLogBlock instance');
  assert.ok(leaves instanceof MangroveLeavesBlock, 'Should create MangroveLeavesBlock instance');
  
  console.log('✓ PASSED: BlockRegistry integration');
} catch (error) {
  console.error(`✗ FAILED: BlockRegistry integration`);
  console.error(`  Error: ${error.message}`);
  console.error(`  Stack: ${error.stack}`);
  allTestsPassed = false;
}

// Print summary
if (allTestsPassed) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.error('\n❌ Some tests failed!');
  process.exit(1);
} 