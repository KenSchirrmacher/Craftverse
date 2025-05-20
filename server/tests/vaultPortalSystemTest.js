const assert = require('assert');
const World = require('../world/world');
const VaultPortalBlock = require('../blocks/vaultPortalBlock');
const VaultPortalItem = require('../items/vaultPortalItem');
const VaultDimension = require('../dimensions/vaultDimension');
const VaultPortalManager = require('../systems/vaultPortalManager');
const Player = require('../entities/player');
const { BlockRegistry } = require('../registry/blockRegistry');
const { RoomGenerator } = require('../generators/roomGenerator');
const { LootTable } = require('../loot/lootTable');

describe('Vault Portal System', () => {
  let world;
  let dimension;
  let manager;
  let player;
  let roomGenerator;
  let lootTable;

  beforeEach(() => {
    world = new World();
    dimension = new VaultDimension();
    manager = new VaultPortalManager(world, dimension);
    player = new Player();
    roomGenerator = new RoomGenerator();
    lootTable = new LootTable();
  });

  describe('Portal Creation and Activation', () => {
    it('should create and activate a portal with valid frame', () => {
      // Create a valid 3x3 frame
      const frameBlocks = [
        {x: -1, y: 0, z: -1}, {x: 0, y: 0, z: -1}, {x: 1, y: 0, z: -1},
        {x: -1, y: 0, z: 0}, {x: 1, y: 0, z: 0},
        {x: -1, y: 0, z: 1}, {x: 0, y: 0, z: 1}, {x: 1, y: 0, z: 1}
      ];

      // Place reinforced deepslate blocks for the frame
      for (const pos of frameBlocks) {
        const block = BlockRegistry.getBlock('reinforced_deepslate');
        world.setBlock(pos.x, pos.y, pos.z, block);
      }

      // Place portal block
      const portalBlock = new VaultPortalBlock();
      const placedPortal = portalBlock.place(world, { x: 0, y: 0, z: 0 });

      // Verify portal block state
      assert.strictEqual(placedPortal.isValidPlacement(), true);
      assert.strictEqual(placedPortal.isActive(), false);

      // Activate portal
      placedPortal.activate();
      assert.strictEqual(placedPortal.isActive(), true);
    });
  });

  describe('Dimension Generation', () => {
    it('should generate valid vault dimension with rooms', () => {
      const instance = dimension.createInstance();
      
      // Verify instance structure
      assert.strictEqual(instance.id !== undefined, true);
      assert.strictEqual(dimension.instances.has(instance.id), true);
      
      // Verify room generation
      const room = dimension.generateRoom();
      assert.strictEqual(room.isValid(), true);
      assert.strictEqual(room.getSize().x > 0, true);
      assert.strictEqual(room.getSize().y > 0, true);
      assert.strictEqual(room.getSize().z > 0, true);
      
      // Verify loot generation
      const loot = dimension.generateLoot(1);
      assert.strictEqual(loot.length > 0, true);
    });
  });

  describe('Player Teleportation', () => {
    it('should teleport player between linked portals', () => {
      // Create and activate first portal
      const portal1 = new VaultPortalBlock();
      const placedPortal1 = portal1.place(world, { x: 0, y: 0, z: 0 });
      placedPortal1.activate();

      // Create and activate second portal
      const portal2 = new VaultPortalBlock();
      const placedPortal2 = portal2.place(world, { x: 10, y: 0, z: 10 });
      placedPortal2.activate();

      // Link portals
      manager.linkPortals(placedPortal1, placedPortal2);

      // Set up player
      player.position = { x: 0, y: 0, z: 0 };
      player.setDimension(world.getDimension());

      // Test teleportation
      const teleportResult = manager.teleportPlayer(player, placedPortal1);
      assert.strictEqual(teleportResult.success, true);
      assert.strictEqual(player.getDimension().getId(), 'vault');
      assert.deepStrictEqual(player.position, placedPortal2.position);
    });
  });

  describe('Portal Effects', () => {
    it('should create visual and audio effects during portal formation', () => {
      const portalBlock = new VaultPortalBlock();
      const placedPortal = portalBlock.place(world, { x: 0, y: 0, z: 0 });

      // Start portal formation
      placedPortal.startPortalForming(world, 0, 0, 0);

      // Verify particle effects
      const particleCount = world.getParticleCount();
      assert.strictEqual(particleCount > 0, true);

      // Verify sound effects
      const soundCount = world.getSoundCount();
      assert.strictEqual(soundCount > 0, true);
    });
  });

  describe('Time Limit', () => {
    it('should return player after time limit expires', () => {
      // Create and activate portal
      const portal = new VaultPortalBlock();
      const placedPortal = portal.place(world, { x: 0, y: 0, z: 0 });
      placedPortal.activate();

      // Set up player
      player.position = { x: 0, y: 0, z: 0 };
      player.setDimension(world.getDimension());

      // Store return point
      const returnPoint = {
        dimension: world.getDimension(),
        position: player.position.clone()
      };

      // Teleport player
      manager.teleportPlayer(player, placedPortal);

      // Simulate time passing
      manager.update(300000); // 5 minutes in milliseconds

      // Verify player return
      assert.deepStrictEqual(player.position, returnPoint.position);
      assert.strictEqual(player.getDimension().getId(), returnPoint.dimension.getId());
    });
  });
}); 