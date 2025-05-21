/**
 * Tests for Tuff Variants Random Tick functionality
 * Verifies that blocks properly handle random ticks
 */

const assert = require('assert');
const World = require('../world/world');
const { TuffBrickWallBlock } = require('../blocks/tuffVariantsBlocks');

class TuffVariantsTickTest {
  constructor() {
    this.world = new World();
  }

  runTests() {
    this.testWallRandomTick();
  }

  testWallRandomTick() {
    console.log('Testing Tuff Brick Wall Random Tick...');

    // Create and place wall block
    const wall = new TuffBrickWallBlock();
    this.world.setBlockAt(0, 0, 0, 'tuff_brick_wall');

    // Test random tick with no adjacent blocks
    const initialState = wall.getState();
    wall.onRandomTick(this.world, { x: 0, y: 0, z: 0 }, initialState, Math.random());
    const stateAfterTick = wall.getState();
    assert.strictEqual(stateAfterTick.connections.north, false);
    assert.strictEqual(stateAfterTick.connections.south, false);
    assert.strictEqual(stateAfterTick.connections.east, false);
    assert.strictEqual(stateAfterTick.connections.west, false);

    // Test random tick with adjacent blocks
    this.world.setBlockAt(0, 0, 1, 'stone'); // North
    this.world.setBlockAt(0, 0, -1, 'stone'); // South
    wall.onRandomTick(this.world, { x: 0, y: 0, z: 0 }, stateAfterTick, Math.random());
    const stateWithAdjacent = wall.getState();
    assert.strictEqual(stateWithAdjacent.connections.north, true);
    assert.strictEqual(stateWithAdjacent.connections.south, true);
    assert.strictEqual(stateWithAdjacent.connections.east, false);
    assert.strictEqual(stateWithAdjacent.connections.west, false);

    // Test random tick with diagonal blocks
    this.world.setBlockAt(1, 0, 1, 'stone'); // Northeast
    this.world.setBlockAt(-1, 0, -1, 'stone'); // Southwest
    wall.onRandomTick(this.world, { x: 0, y: 0, z: 0 }, stateWithAdjacent, Math.random());
    const stateWithDiagonal = wall.getState();
    assert.strictEqual(stateWithDiagonal.connections.north, true);
    assert.strictEqual(stateWithDiagonal.connections.south, true);
    assert.strictEqual(stateWithDiagonal.connections.east, false);
    assert.strictEqual(stateWithDiagonal.connections.west, false);

    // Test random tick with vertical blocks
    this.world.setBlockAt(0, 1, 0, 'stone'); // Above
    this.world.setBlockAt(0, -1, 0, 'stone'); // Below
    wall.onRandomTick(this.world, { x: 0, y: 0, z: 0 }, stateWithDiagonal, Math.random());
    const stateWithVertical = wall.getState();
    assert.strictEqual(stateWithVertical.connections.north, true);
    assert.strictEqual(stateWithVertical.connections.south, true);
    assert.strictEqual(stateWithVertical.connections.east, false);
    assert.strictEqual(stateWithVertical.connections.west, false);
  }
}

module.exports = TuffVariantsTickTest; 