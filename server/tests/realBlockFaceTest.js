/**
 * Real BlockFace Test Suite
 * Tests the BlockFace implementation with real components
 */

const assert = require('assert');
const TestBase = require('./testBase');
const BlockFace = require('../blocks/blockFace');

class RealBlockFaceTest extends TestBase {
  constructor() {
    super('Real BlockFace');
  }

  async runTests() {
    await this.testBlockFaceConstants();
    await this.testBlockFaceOpposites();
    await this.testBlockFaceAdjacency();
    await this.testBlockFaceVectors();
  }

  async testBlockFaceConstants() {
    this.test('Block Face Constants', () => {
      assert.strictEqual(BlockFace.UP, 'up');
      assert.strictEqual(BlockFace.DOWN, 'down');
      assert.strictEqual(BlockFace.NORTH, 'north');
      assert.strictEqual(BlockFace.SOUTH, 'south');
      assert.strictEqual(BlockFace.EAST, 'east');
      assert.strictEqual(BlockFace.WEST, 'west');
    });
  }

  async testBlockFaceOpposites() {
    this.test('Block Face Opposites', () => {
      assert.strictEqual(BlockFace.getOpposite(BlockFace.UP), BlockFace.DOWN);
      assert.strictEqual(BlockFace.getOpposite(BlockFace.DOWN), BlockFace.UP);
      assert.strictEqual(BlockFace.getOpposite(BlockFace.NORTH), BlockFace.SOUTH);
      assert.strictEqual(BlockFace.getOpposite(BlockFace.SOUTH), BlockFace.NORTH);
      assert.strictEqual(BlockFace.getOpposite(BlockFace.EAST), BlockFace.WEST);
      assert.strictEqual(BlockFace.getOpposite(BlockFace.WEST), BlockFace.EAST);
    });
  }

  async testBlockFaceAdjacency() {
    this.test('Block Face Adjacency', () => {
      const upAdjacent = BlockFace.getAdjacentFaces(BlockFace.UP);
      assert.strictEqual(upAdjacent.length, 4);
      assert.strictEqual(upAdjacent.includes(BlockFace.NORTH), true);
      assert.strictEqual(upAdjacent.includes(BlockFace.SOUTH), true);
      assert.strictEqual(upAdjacent.includes(BlockFace.EAST), true);
      assert.strictEqual(upAdjacent.includes(BlockFace.WEST), true);

      const northAdjacent = BlockFace.getAdjacentFaces(BlockFace.NORTH);
      assert.strictEqual(northAdjacent.length, 4);
      assert.strictEqual(northAdjacent.includes(BlockFace.UP), true);
      assert.strictEqual(northAdjacent.includes(BlockFace.DOWN), true);
      assert.strictEqual(northAdjacent.includes(BlockFace.EAST), true);
      assert.strictEqual(northAdjacent.includes(BlockFace.WEST), true);
    });
  }

  async testBlockFaceVectors() {
    this.test('Block Face Vectors', () => {
      const upVector = BlockFace.getVectorFromFace(BlockFace.UP);
      assert.deepStrictEqual(upVector, { x: 0, y: 1, z: 0 });

      const downVector = BlockFace.getVectorFromFace(BlockFace.DOWN);
      assert.deepStrictEqual(downVector, { x: 0, y: -1, z: 0 });

      const northVector = BlockFace.getVectorFromFace(BlockFace.NORTH);
      assert.deepStrictEqual(northVector, { x: 0, y: 0, z: -1 });

      const southVector = BlockFace.getVectorFromFace(BlockFace.SOUTH);
      assert.deepStrictEqual(southVector, { x: 0, y: 0, z: 1 });

      const eastVector = BlockFace.getVectorFromFace(BlockFace.EAST);
      assert.deepStrictEqual(eastVector, { x: 1, y: 0, z: 0 });

      const westVector = BlockFace.getVectorFromFace(BlockFace.WEST);
      assert.deepStrictEqual(westVector, { x: -1, y: 0, z: 0 });
    });
  }
}

// Export the test functions
module.exports = {
  runTests: async () => {
    const test = new RealBlockFaceTest();
    await test.runTests();
  }
};

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running Real BlockFace Tests...');
  module.exports.runTests();
} 