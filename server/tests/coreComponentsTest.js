/**
 * Core Components Test Suite
 * Tests the core block and smithing components with real implementations
 */

const assert = require('assert');
const TestBase = require('./testBase');
const BlockFace = require('../blocks/blockFace');
const TorchBlock = require('../blocks/torchBlock');
const SmithingManager = require('../blocks/smithingManager');
const BlockBase = require('../blocks/blockBase');
const { ItemStack } = require('../items/itemStack');
const { ItemType } = require('../items/itemType');

class CoreComponentsTest extends TestBase {
  constructor() {
    super('Core Components');
  }

  async runTests() {
    await this.testBlockFace();
    await this.testTorchBlock();
    await this.testSmithingManager();
    await this.testBlockBase();
  }

  async testBlockFace() {
    this.runTest('Block Face Constants', () => {
      assert.strictEqual(BlockFace.UP, 'up');
      assert.strictEqual(BlockFace.DOWN, 'down');
      assert.strictEqual(BlockFace.NORTH, 'north');
      assert.strictEqual(BlockFace.SOUTH, 'south');
      assert.strictEqual(BlockFace.EAST, 'east');
      assert.strictEqual(BlockFace.WEST, 'west');
    });

    this.runTest('Block Face Opposites', () => {
      assert.strictEqual(BlockFace.getOpposite(BlockFace.UP), BlockFace.DOWN);
      assert.strictEqual(BlockFace.getOpposite(BlockFace.NORTH), BlockFace.SOUTH);
      assert.strictEqual(BlockFace.getOpposite(BlockFace.EAST), BlockFace.WEST);
    });

    this.runTest('Block Face Adjacency', () => {
      const upAdjacent = BlockFace.getAdjacentFaces(BlockFace.UP);
      assert.strictEqual(upAdjacent.length, 4);
      assert.strictEqual(upAdjacent.includes(BlockFace.NORTH), true);
      assert.strictEqual(upAdjacent.includes(BlockFace.SOUTH), true);
      assert.strictEqual(upAdjacent.includes(BlockFace.EAST), true);
      assert.strictEqual(upAdjacent.includes(BlockFace.WEST), true);
    });

    this.runTest('Block Face Vectors', () => {
      const upVector = BlockFace.getVectorFromFace(BlockFace.UP);
      assert.deepStrictEqual(upVector, { x: 0, y: 1, z: 0 });

      const northVector = BlockFace.getVectorFromFace(BlockFace.NORTH);
      assert.deepStrictEqual(northVector, { x: 0, y: 0, z: -1 });
    });
  }

  async testTorchBlock() {
    this.runTest('Torch Block Creation', () => {
      const torch = new TorchBlock();
      assert.strictEqual(torch.id, 'torch');
      assert.strictEqual(torch.name, 'Torch');
      assert.strictEqual(torch.type, 'torch');
      assert.strictEqual(torch.isSolid, false);
      assert.strictEqual(torch.isTransparent, true);
      assert.strictEqual(torch.lightLevel, 14);
    });

    this.runTest('Torch Block Properties', () => {
      const torch = new TorchBlock({
        id: 'custom_torch',
        name: 'Custom Torch',
        lightLevel: 15,
        face: BlockFace.NORTH
      });
      assert.strictEqual(torch.id, 'custom_torch');
      assert.strictEqual(torch.name, 'Custom Torch');
      assert.strictEqual(torch.lightLevel, 15);
      assert.strictEqual(torch.face, BlockFace.NORTH);
    });

    this.runTest('Torch Block Bounding Box', () => {
      const torch = new TorchBlock();
      const box = torch.getBoundingBox();
      assert.deepStrictEqual(box, {
        minX: 0.4,
        minY: 0.0,
        minZ: 0.4,
        maxX: 0.6,
        maxY: 0.6,
        maxZ: 0.6
      });
    });

    this.runTest('Torch Block Serialization', () => {
      const torch = new TorchBlock({
        face: BlockFace.NORTH
      });
      const serialized = torch.serialize();
      assert.strictEqual(serialized.face, BlockFace.NORTH);
      assert.strictEqual(serialized.id, 'torch');
      assert.strictEqual(serialized.type, 'torch');
    });
  }

  async testSmithingManager() {
    this.runTest('Smithing Manager Creation', () => {
      const manager = new SmithingManager();
      assert.strictEqual(manager.templates instanceof Map, true);
      assert.strictEqual(manager.upgrades instanceof Map, true);
    });

    this.runTest('Template Registration', () => {
      const manager = new SmithingManager();
      const template = {
        id: 'netherite_upgrade',
        materials: [
          { type: 'sword', material: 'diamond' }
        ],
        upgradeId: 'netherite_sword'
      };
      
      manager.registerTemplate('netherite_upgrade', template);
      const registered = manager.getTemplate('netherite_upgrade');
      assert.deepStrictEqual(registered, template);
    });

    this.runTest('Upgrade Registration', () => {
      const manager = new SmithingManager();
      const upgrade = {
        id: 'netherite_sword',
        resultType: 'sword',
        resultMaterial: 'netherite',
        durability: 2031
      };
      
      manager.registerUpgrade('netherite_sword', upgrade);
      const registered = manager.getUpgrade('netherite_sword');
      assert.deepStrictEqual(registered, upgrade);
    });

    this.runTest('Item Upgrade Process', () => {
      const manager = new SmithingManager();
      
      // Register template and upgrade
      manager.registerTemplate('netherite_upgrade', {
        id: 'netherite_upgrade',
        materials: [
          { type: 'sword', material: 'diamond' }
        ],
        upgradeId: 'netherite_sword'
      });
      
      manager.registerUpgrade('netherite_sword', {
        id: 'netherite_sword',
        resultType: 'sword',
        resultMaterial: 'netherite',
        durability: 2031
      });
      
      // Create test item
      const item = new ItemStack({
        type: 'sword',
        material: 'diamond',
        count: 1,
        durability: 1561
      });
      
      // Test upgrade
      const canUpgrade = manager.canUpgrade(item, 'netherite_upgrade');
      assert.strictEqual(canUpgrade, true);
      
      const upgradedItem = manager.applyUpgrade(item, 'netherite_upgrade');
      assert.strictEqual(upgradedItem.type, 'sword');
      assert.strictEqual(upgradedItem.material, 'netherite');
      assert.strictEqual(upgradedItem.durability, 2031);
    });
  }

  async testBlockBase() {
    this.runTest('Block Base Creation', () => {
      const block = new BlockBase({
        id: 'test_block',
        name: 'Test Block',
        type: 'test'
      });
      
      assert.strictEqual(block.id, 'test_block');
      assert.strictEqual(block.name, 'Test Block');
      assert.strictEqual(block.type, 'test');
      assert.strictEqual(block.isSolid, true);
      assert.strictEqual(block.isTransparent, false);
      assert.strictEqual(block.lightLevel, 0);
    });

    this.runTest('Block Properties', () => {
      const block = new BlockBase();
      block.setProperty('hardness', 1.5);
      block.setProperty('resistance', 3.0);
      
      assert.strictEqual(block.getProperty('hardness'), 1.5);
      assert.strictEqual(block.getProperty('resistance'), 3.0);
    });

    this.runTest('Block State', () => {
      const block = new BlockBase();
      block.setState('powered', true);
      block.setState('waterlogged', false);
      
      assert.strictEqual(block.getState('powered'), true);
      assert.strictEqual(block.getState('waterlogged'), false);
    });

    this.runTest('Block Bounding Box', () => {
      const block = new BlockBase();
      const box = block.getBoundingBox();
      assert.deepStrictEqual(box, {
        minX: 0,
        minY: 0,
        minZ: 0,
        maxX: 1,
        maxY: 1,
        maxZ: 1
      });
    });

    this.runTest('Block Serialization', () => {
      const block = new BlockBase({
        id: 'test_block',
        name: 'Test Block',
        type: 'test'
      });
      
      block.setProperty('hardness', 1.5);
      block.setState('powered', true);
      
      const serialized = block.serialize();
      assert.strictEqual(serialized.id, 'test_block');
      assert.strictEqual(serialized.name, 'Test Block');
      assert.strictEqual(serialized.type, 'test');
      assert.strictEqual(serialized.isSolid, true);
      assert.strictEqual(serialized.isTransparent, false);
      assert.strictEqual(serialized.lightLevel, 0);
      assert.strictEqual(serialized.hardness, 1.0);
      assert.strictEqual(serialized.resistance, 1.0);
    });
  }
}

// Export the test functions
module.exports = {
  runTests: async () => {
    const test = new CoreComponentsTest();
    await test.runTests();
  }
};

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log('Running Core Components Tests...');
  module.exports.runTests();
} 