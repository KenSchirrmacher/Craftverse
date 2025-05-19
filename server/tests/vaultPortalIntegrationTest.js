const assert = require('assert');
const { VaultPortalItem } = require('../items/vaultPortalItem');
const { VaultPortalBlock } = require('../blocks/vaultPortalBlock');
const { World } = require('../world/world');
const { Player } = require('../entities/player');
const { BlockRegistry } = require('../registry/blockRegistry');
const { ItemRegistry } = require('../registry/itemRegistry');

describe('Vault Portal Integration', () => {
  let world;
  let player;
  let portalItem;
  let portalBlock;

  beforeEach(() => {
    world = new World();
    player = new Player('test-player', 'TestPlayer');
    portalItem = ItemRegistry.getItem('vault_portal');
    portalBlock = BlockRegistry.getBlock('vault_portal');
  });

  describe('Portal Creation and Activation', () => {
    it('should create a complete portal frame and activate it', () => {
      // Create portal frame
      const frameBlocks = [
        { x: 0, y: 0, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 1, y: 0, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 2, y: 0, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 0, y: 1, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 2, y: 1, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 0, y: 2, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 1, y: 2, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 2, y: 2, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') }
      ];

      frameBlocks.forEach(({ x, y, z, block }) => {
        world.setBlock(x, y, z, block);
      });

      // Place portal block
      const result = portalItem.use(player, world, 1, 0, 1);
      assert.strictEqual(result.success, true);

      // Verify portal block state
      const placedBlock = world.getBlock(1, 0, 1);
      assert.strictEqual(placedBlock instanceof VaultPortalBlock, true);
      assert.strictEqual(placedBlock.isActivated(), false);

      // Activate portal
      placedBlock.activate();
      assert.strictEqual(placedBlock.isActivated(), true);
    });
  });

  describe('Player Teleportation', () => {
    it('should teleport player to vault dimension', () => {
      // Create and activate portal
      const portal = new VaultPortalBlock();
      world.setBlock(1, 0, 1, portal);
      portal.activate();

      // Store original position
      const originalPosition = player.getPosition();
      const originalDimension = player.getDimension();

      // Interact with portal
      portal.onInteract(player);

      // Verify teleportation
      assert.notDeepStrictEqual(player.getPosition(), originalPosition);
      assert.strictEqual(player.getDimension(), 'vault');
      assert.deepStrictEqual(player.getReturnPoint(), originalPosition);
    });
  });

  describe('Portal Time Limit', () => {
    it('should return player to overworld after time limit', () => {
      // Create and activate portal
      const portal = new VaultPortalBlock();
      world.setBlock(1, 0, 1, portal);
      portal.activate();

      // Store return point
      const returnPoint = { x: 0, y: 64, z: 0 };
      player.setReturnPoint(returnPoint);

      // Simulate time passing
      portal.update(300000); // 5 minutes in milliseconds

      // Verify player return
      assert.deepStrictEqual(player.getPosition(), returnPoint);
      assert.strictEqual(player.getDimension(), 'overworld');
    });
  });

  describe('Portal Frame Validation', () => {
    it('should validate complete portal frame', () => {
      // Create complete frame
      const frameBlocks = [
        { x: 0, y: 0, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 1, y: 0, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 2, y: 0, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 0, y: 1, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 2, y: 1, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 0, y: 2, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 1, y: 2, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 2, y: 2, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') }
      ];

      frameBlocks.forEach(({ x, y, z, block }) => {
        world.setBlock(x, y, z, block);
      });

      // Place portal block
      const result = portalItem.use(player, world, 1, 0, 1);
      assert.strictEqual(result.success, true);
    });

    it('should reject incomplete portal frame', () => {
      // Create incomplete frame
      const frameBlocks = [
        { x: 0, y: 0, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 1, y: 0, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') },
        { x: 2, y: 0, z: 0, block: BlockRegistry.getBlock('reinforced_deepslate') }
      ];

      frameBlocks.forEach(({ x, y, z, block }) => {
        world.setBlock(x, y, z, block);
      });

      // Attempt to place portal block
      const result = portalItem.use(player, world, 1, 0, 1);
      assert.strictEqual(result.success, false);
    });

    it('should reject frame with incorrect blocks', () => {
      // Create frame with incorrect blocks
      const frameBlocks = [
        { x: 0, y: 0, z: 0, block: BlockRegistry.getBlock('stone') },
        { x: 1, y: 0, z: 0, block: BlockRegistry.getBlock('stone') },
        { x: 2, y: 0, z: 0, block: BlockRegistry.getBlock('stone') },
        { x: 0, y: 1, z: 0, block: BlockRegistry.getBlock('stone') },
        { x: 2, y: 1, z: 0, block: BlockRegistry.getBlock('stone') },
        { x: 0, y: 2, z: 0, block: BlockRegistry.getBlock('stone') },
        { x: 1, y: 2, z: 0, block: BlockRegistry.getBlock('stone') },
        { x: 2, y: 2, z: 0, block: BlockRegistry.getBlock('stone') }
      ];

      frameBlocks.forEach(({ x, y, z, block }) => {
        world.setBlock(x, y, z, block);
      });

      // Attempt to place portal block
      const result = portalItem.use(player, world, 1, 0, 1);
      assert.strictEqual(result.success, false);
    });
  });
}); 