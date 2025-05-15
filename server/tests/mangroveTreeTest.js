/**
 * Simple Test for Mangrove Tree blocks
 */

const assert = require('assert');
const MangroveLogBlock = require('../blocks/mangroveLogBlock');
const MangroveRootsBlock = require('../blocks/mangroveRootsBlock');
const MangroveLeavesBlock = require('../blocks/mangroveLeavesBlock');
const MangrovePropaguleBlock = require('../blocks/mangrovePropaguleBlock');

console.log('Starting Mangrove Tree Components Test');

// Mock objects
const mockWorld = {
  blocks: {},
  waterBlocks: {},
  particles: [],
  sounds: [],
  droppedItems: [],
  
  setBlock(position, blockType, options = {}) {
    const key = `${position.x},${position.y},${position.z}`;
    this.blocks[key] = { type: blockType, options };
    return true;
  },
  
  getBlockAt(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks[key];
  },
  
  addParticle(particleData) {
    this.particles.push(particleData);
  },
  
  playSound(sound, position, volume, pitch) {
    this.sounds.push({ sound, position, volume, pitch });
  },
  
  dropItem(item, position) {
    this.droppedItems.push({ item, position });
  }
};

const mockPlayer = {
  gameMode: 'survival',
  heldItem: null,
  damagedItems: [],
  
  getHeldItem() {
    return this.heldItem;
  },
  
  setHeldItem(item) {
    this.heldItem = item;
  },
  
  damageHeldItem(amount) {
    if (this.heldItem) {
      this.damagedItems.push({ 
        item: this.heldItem, 
        amount 
      });
      
      if (this.heldItem.durability) {
        this.heldItem.durability -= amount;
      }
    }
  }
};

// Test functions
function runAllTests() {
  let testsPassed = 0;
  let testsFailed = 0;
  
  function runTest(name, testFn) {
    console.log(`\n- Testing: ${name}`);
    try {
      testFn();
      console.log(`  ✓ Passed: ${name}`);
      testsPassed++;
    } catch (error) {
      console.error(`  ✗ Failed: ${name}`);
      console.error(`    Error: ${error.message}`);
      testsFailed++;
    }
    
    // Reset mocks for next test
    mockWorld.blocks = {};
    mockWorld.waterBlocks = {};
    mockWorld.particles = [];
    mockWorld.sounds = [];
    mockWorld.droppedItems = [];
    mockPlayer.heldItem = null;
    mockPlayer.damagedItems = [];
  }
  
  // MangroveLogBlock Tests
  console.log('\nTesting MangroveLogBlock:');
  
  runTest('log properties', () => {
    const log = new MangroveLogBlock();
    
    assert.strictEqual(log.id, 'mangrove_log');
    assert.strictEqual(log.hardness, 2.0);
    assert.strictEqual(log.flammable, true);
    assert.strictEqual(log.preferredTool, 'axe');
    assert.strictEqual(log.axis, 'y');
    assert.strictEqual(log.stripped, false);
  });
  
  runTest('log stripping', () => {
    const log = new MangroveLogBlock();
    mockPlayer.setHeldItem({ type: 'axe' });
    
    const position = { x: 10, y: 10, z: 10 };
    log.onInteract(mockWorld, position, mockPlayer);
    
    // Check if block was replaced with stripped variant
    const blockKey = '10,10,10';
    assert.strictEqual(mockWorld.blocks[blockKey].type, 'stripped_mangrove_log');
    
    // Check if sound was played
    const stripSound = mockWorld.sounds.find(s => s.sound === 'item.axe.strip');
    assert.ok(stripSound, 'Strip sound should be played');
    
    // Check if axe was damaged
    assert.strictEqual(mockPlayer.damagedItems.length, 1);
    assert.strictEqual(mockPlayer.damagedItems[0].amount, 1);
  });
  
  runTest('log drops', () => {
    const log = new MangroveLogBlock();
    const drops = log.getDrops();
    
    assert.strictEqual(drops.length, 1);
    assert.strictEqual(drops[0].id, 'mangrove_log');
    assert.strictEqual(drops[0].count, 1);
  });
  
  // MangroveRootsBlock Tests
  console.log('\nTesting MangroveRootsBlock:');
  
  runTest('roots properties', () => {
    const roots = new MangroveRootsBlock();
    
    assert.strictEqual(roots.id, 'mangrove_roots');
    assert.strictEqual(roots.hardness, 0.7);
    assert.strictEqual(roots.transparent, true);
    assert.strictEqual(roots.solid, true);
    assert.strictEqual(roots.preferredTool, 'axe');
    assert.strictEqual(roots.waterlogged, false);
    assert.strictEqual(roots.canGrowThrough, true);
    assert.ok(roots.canPlaceOn.includes('mud'), 'Should be placeable on mud');
  });
  
  runTest('roots waterlogging', () => {
    const roots = new MangroveRootsBlock();
    const position = { x: 10, y: 10, z: 10 };
    
    // Mock water at the position
    mockWorld.setBlock(position, 'water');
    
    // Place the roots
    roots.onPlace(mockWorld, position, mockPlayer);
    
    // Should become waterlogged
    assert.strictEqual(roots.waterlogged, true);
    assert.strictEqual(roots.getFluidType(), 'water');
  });
  
  runTest('roots support breaking', () => {
    const roots = new MangroveRootsBlock();
    const position = { x: 10, y: 10, z: 10 };
    const belowPosition = { x: 10, y: 9, z: 10 };
    
    // Set a supporting block (mud) below
    mockWorld.setBlock(belowPosition, 'mud');
    
    // Place the roots
    mockWorld.setBlock(position, 'mangrove_roots');
    mockWorld.blocks[`${position.x},${position.y},${position.z}`].instance = roots;
    
    // Simulate block update when block below is removed
    mockWorld.setBlock(belowPosition, 'air');
    roots.onNeighborUpdate(mockWorld, position, belowPosition);
    
    // Check if roots were removed
    assert.strictEqual(mockWorld.blocks[`${position.x},${position.y},${position.z}`].type, 'air');
    
    // Check if item was dropped
    assert.strictEqual(mockWorld.droppedItems.length, 1);
    assert.strictEqual(mockWorld.droppedItems[0].item.id, 'mangrove_roots');
  });
  
  // MangroveLeavesBlock Tests
  console.log('\nTesting MangroveLeavesBlock:');
  
  runTest('leaves properties', () => {
    const leaves = new MangroveLeavesBlock();
    
    assert.strictEqual(leaves.id, 'mangrove_leaves');
    assert.strictEqual(leaves.hardness, 0.2);
    assert.strictEqual(leaves.transparent, true);
    assert.strictEqual(leaves.flammable, true);
    assert.strictEqual(leaves.preferredTool, 'shears');
    assert.strictEqual(leaves.persistent, false);
    assert.strictEqual(leaves.distance, 7);
  });
  
  runTest('leaves persistence', () => {
    const leaves = new MangroveLeavesBlock();
    const position = { x: 10, y: 10, z: 10 };
    
    leaves.onPlace(mockWorld, position, mockPlayer);
    
    assert.strictEqual(leaves.persistent, true);
    assert.strictEqual(leaves.distance, 0);
  });
  
  runTest('leaves distance calculation', () => {
    const leaves = new MangroveLeavesBlock({ persistent: false, distance: 7 });
    const position = { x: 10, y: 10, z: 10 };
    const logPosition = { x: 10, y: 10, z: 11 }; // Adjacent log
    
    // Place a log nearby
    mockWorld.setBlock(logPosition, 'mangrove_log');
    
    // Place the leaves
    mockWorld.setBlock(position, 'mangrove_leaves');
    mockWorld.blocks[`${position.x},${position.y},${position.z}`].instance = leaves;
    
    // Update leaf distance
    leaves.updateLeafDistance(mockWorld, position);
    
    // Distance should now be 1 (adjacent to log)
    assert.strictEqual(leaves.distance, 1);
  });
  
  runTest('leaves drops with shears', () => {
    const leaves = new MangroveLeavesBlock();
    
    const drops = leaves.getDrops(mockPlayer, { tool: { type: 'shears' } });
    assert.strictEqual(drops.length, 1);
    assert.strictEqual(drops[0].id, 'mangrove_leaves');
  });
  
  // MangrovePropaguleBlock Tests
  console.log('\nTesting MangrovePropaguleBlock:');
  
  runTest('propagule properties', () => {
    const propagule = new MangrovePropaguleBlock();
    
    assert.strictEqual(propagule.id, 'mangrove_propagule');
    assert.strictEqual(propagule.hardness, 0.0);
    assert.strictEqual(propagule.transparent, true);
    assert.strictEqual(propagule.solid, false);
    assert.strictEqual(propagule.flammable, true);
    assert.strictEqual(propagule.waterlogged, false);
    assert.strictEqual(propagule.stage, 0);
    assert.strictEqual(propagule.hanging, true);
  });
  
  runTest('propagule states', () => {
    // Test hanging propagule
    const hangingPropagule = new MangrovePropaguleBlock({ hanging: true });
    assert.strictEqual(hangingPropagule.hanging, true);
    
    // Test planted propagule
    const plantedPropagule = new MangrovePropaguleBlock({ hanging: false });
    assert.strictEqual(plantedPropagule.hanging, false);
  });
  
  runTest('propagule growth', () => {
    const propagule = new MangrovePropaguleBlock({ hanging: false, stage: 0 });
    const position = { x: 10, y: 10, z: 10 };
    
    // Mock conditions for guaranteed growth
    const originalRandom = Math.random;
    Math.random = () => 0.01; // Always grow
    
    // Place the propagule
    mockWorld.setBlock(position, 'mangrove_propagule');
    mockWorld.blocks[`${position.x},${position.y},${position.z}`].instance = propagule;
    
    // Simulate a random tick
    propagule.onRandomTick(mockWorld, position);
    assert.strictEqual(propagule.stage, 1);
    
    // Restore Math.random
    Math.random = originalRandom;
  });
  
  runTest('propagule bone meal', () => {
    const propagule = new MangrovePropaguleBlock({ hanging: false, stage: 2 });
    const position = { x: 10, y: 10, z: 10 };
    
    // Place the propagule
    mockWorld.setBlock(position, 'mangrove_propagule');
    mockWorld.blocks[`${position.x},${position.y},${position.z}`].instance = propagule;
    
    // Apply bone meal
    const result = propagule.onBoneMeal(mockWorld, position, mockPlayer);
    
    // Should succeed and advance a stage
    assert.strictEqual(result, true);
    assert.strictEqual(propagule.stage, 3);
    
    // Should produce particles
    assert.ok(mockWorld.particles.length > 0);
    assert.strictEqual(mockWorld.particles[0].type, 'bonemeal');
  });
  
  runTest('propagule tree growth', () => {
    // Create a propagule at max growth stage
    const propagule = new MangrovePropaguleBlock({ 
      hanging: false, 
      stage: 4 // Fully grown
    });
    
    const position = { x: 10, y: 10, z: 10 };
    
    // Place the propagule
    mockWorld.setBlock(position, 'mangrove_propagule');
    mockWorld.blocks[`${position.x},${position.y},${position.z}`].instance = propagule;
    
    // Override tree space check for testing
    propagule.checkTreeSpace = () => true;
    
    // Let it grow via random tick
    Math.random = () => 0.01; // Ensure growth
    propagule.onRandomTick(mockWorld, position);
    
    // Check if tree components were created
    // Should have logs, roots and leaves
    let hasLogs = false;
    let hasRoots = false;
    let hasLeaves = false;
    
    for (const key in mockWorld.blocks) {
      const block = mockWorld.blocks[key];
      if (block.type === 'mangrove_log') hasLogs = true;
      if (block.type === 'mangrove_roots') hasRoots = true;
      if (block.type === 'mangrove_leaves') hasLeaves = true;
    }
    
    assert.ok(hasLogs, 'Tree should have logs');
    assert.ok(hasRoots, 'Tree should have roots');
    assert.ok(hasLeaves, 'Tree should have leaves');
    
    // Restore original Math.random
    Math.random = originalRandom;
  });
  
  // Print summary
  console.log(`\nTest Summary: ${testsPassed} passed, ${testsFailed} failed`);
  return testsFailed === 0;
}

try {
  const originalRandom = Math.random;
  const result = runAllTests();
  Math.random = originalRandom;
  
  console.log('\nMangrove tree blocks tests completed.');
  
  // Exit with appropriate code
  process.exit(result ? 0 : 1);
} catch (error) {
  console.error('\nTest runner error:', error);
  process.exit(1);
} 