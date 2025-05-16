/**
 * Simple test for Cherry Grove biome implementation
 */

const assert = require('assert');

// Import the classes to test
const CherryGroveBiome = require('../biomes/cherryGroveBiome');
const CherryTree = require('../world/features/cherryTree');
const CherryLog = require('../blocks/cherryLog');
const CherryLeaves = require('../blocks/cherryLeaves');
const CherrySapling = require('../blocks/cherrySapling');

// Test the Cherry Grove biome
console.log('=== Testing Cherry Grove Biome Implementation ===');

// Test Cherry Grove biome
console.log('\nTesting Cherry Grove biome...');
const cherryGrove = new CherryGroveBiome();
assert.strictEqual(cherryGrove.id, 'cherry_grove', 'Biome should have correct ID');
assert.strictEqual(cherryGrove.name, 'Cherry Grove', 'Biome should have correct name');
assert.strictEqual(cherryGrove.color, '#ffb7c5', 'Biome should have pink color');
assert.strictEqual(cherryGrove.hasPetalParticles, true, 'Biome should have petal particles');
console.log('✓ Cherry Grove biome properties validated');

// Test Cherry tree feature
console.log('\nTesting Cherry Tree feature...');
const cherryTree = new CherryTree();
assert.strictEqual(cherryTree.id, 'cherry', 'Feature should have correct ID');
assert.strictEqual(cherryTree.trunkBlock, 'cherry_log', 'Feature should use correct trunk block');
assert.strictEqual(cherryTree.leavesBlock, 'cherry_leaves', 'Feature should use correct leaves block');
console.log('✓ Cherry Tree feature properties validated');

// Test Cherry blocks
console.log('\nTesting Cherry blocks...');
const cherryLog = new CherryLog();
assert.strictEqual(cherryLog.id, 'cherry_log', 'Cherry log should have correct ID');
assert.strictEqual(cherryLog.name, 'Cherry Log', 'Cherry log should have correct name');
assert.strictEqual(cherryLog.woodType, 'cherry', 'Cherry log should have correct wood type');

const cherryLeaves = new CherryLeaves();
assert.strictEqual(cherryLeaves.id, 'cherry_leaves', 'Cherry leaves should have correct ID');
assert.strictEqual(cherryLeaves.name, 'Cherry Leaves', 'Cherry leaves should have correct name');
assert.strictEqual(cherryLeaves.color, '#ffb7c5', 'Cherry leaves should have correct color');

const cherrySapling = new CherrySapling();
assert.strictEqual(cherrySapling.id, 'cherry_sapling', 'Cherry sapling should have correct ID');
assert.strictEqual(cherrySapling.name, 'Cherry Sapling', 'Cherry sapling should have correct name');
assert.strictEqual(cherrySapling.treeType, 'cherry', 'Cherry sapling should grow correct tree type');
console.log('✓ Cherry blocks properties validated');

console.log('\n✅ All Cherry Grove tests passed! The feature is complete.'); 