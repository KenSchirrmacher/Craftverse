/**
 * Test Infrastructure Test Suite
 * Tests the core test infrastructure components
 */

const assert = require('assert');
const TestBase = require('./testBase');
const BlockFace = require('./blockFace');
const TorchBlock = require('./torchBlock');
const SmithingManager = require('./smithingManager');
const BlockBase = require('./blockBase');

class TestInfrastructureTest extends TestBase {
  constructor() {
    super('Test Infrastructure');
  }

  async runTests() {
    await this.testBlockFace();
    await this.testTorchBlock();
    await this.testSmithingManager();
    await this.testBlockBase();
  }

  async testBlockFace() {
    this.runTest('Block Face Enumeration', () => {
      assert.strictEqual(BlockFace.UP !== undefined, true);
      assert.strictEqual(BlockFace.DOWN !== undefined, true);
      assert.strictEqual(BlockFace.NORTH !== undefined, true);
      assert.strictEqual(BlockFace.SOUTH !== undefined, true);
      assert.strictEqual(BlockFace.EAST !== undefined, true);
      assert.strictEqual(BlockFace.WEST !== undefined, true);
    });

    this.runTest('Block Face Utilities', () => {
      const opposite = BlockFace.getOpposite(BlockFace.UP);
      assert.strictEqual(opposite, BlockFace.DOWN);
      
      const adjacent = BlockFace.getAdjacentFaces(BlockFace.UP);
      assert.strictEqual(adjacent.length, 4);
      assert.strictEqual(adjacent.includes(BlockFace.NORTH), true);
      assert.strictEqual(adjacent.includes(BlockFace.SOUTH), true);
      assert.strictEqual(adjacent.includes(BlockFace.EAST), true);
      assert.strictEqual(adjacent.includes(BlockFace.WEST), true);
    });
  }

  async testTorchBlock() {
    this.runTest('Torch Block Creation', () => {
      const torch = new TorchBlock();
      assert.strictEqual(torch !== undefined, true);
      assert.strictEqual(torch.getLightLevel(), 14);
    });

    this.runTest('Torch Block Placement', () => {
      const torch = new TorchBlock();
      const world = new TestWorld();
      const position = { x: 0, y: 0, z: 0 };
      
      const placed = torch.place(world, position, BlockFace.UP);
      assert.strictEqual(placed, true);
      assert.strictEqual(world.getBlock(position).type, 'torch');
    });

    this.runTest('Torch Block Breaking', () => {
      const torch = new TorchBlock();
      const world = new TestWorld();
      const position = { x: 0, y: 0, z: 0 };
      
      torch.place(world, position, BlockFace.UP);
      const broken = torch.break(world, position);
      assert.strictEqual(broken, true);
      assert.strictEqual(world.getBlock(position), null);
    });
  }

  async testSmithingManager() {
    this.runTest('Smithing Manager Creation', () => {
      const manager = new SmithingManager();
      assert.strictEqual(manager !== undefined, true);
    });

    this.runTest('Smithing Template Registration', () => {
      const manager = new SmithingManager();
      const template = {
        id: 'test_template',
        name: 'Test Template',
        description: 'A test template'
      };
      
      manager.registerTemplate(template);
      const registered = manager.getTemplate('test_template');
      assert.strictEqual(registered.id, template.id);
    });

    this.runTest('Smithing Upgrade Process', () => {
      const manager = new SmithingManager();
      const template = {
        id: 'test_template',
        name: 'Test Template',
        description: 'A test template'
      };
      
      manager.registerTemplate(template);
      const result = manager.upgradeItem('diamond_sword', 'test_template');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.item.type, 'netherite_sword');
    });
  }

  async testBlockBase() {
    this.runTest('Block Base Creation', () => {
      const block = new BlockBase('test_block');
      assert.strictEqual(block !== undefined, true);
      assert.strictEqual(block.type, 'test_block');
    });

    this.runTest('Block Properties', () => {
      const block = new BlockBase('test_block');
      block.setProperty('hardness', 1.5);
      block.setProperty('resistance', 3.0);
      
      assert.strictEqual(block.getProperty('hardness'), 1.5);
      assert.strictEqual(block.getProperty('resistance'), 3.0);
    });

    this.runTest('Block State Management', () => {
      const block = new BlockBase('test_block');
      block.setState('powered', true);
      
      assert.strictEqual(block.getState('powered'), true);
      assert.strictEqual(block.hasState('powered'), true);
    });
  }
}

// Export the test functions
module.exports = {
  runTests: async () => {
    const test = new TestInfrastructureTest();
    await test.runTests();
  }
};

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running Test Infrastructure Tests...');
  module.exports.runTests();
} 