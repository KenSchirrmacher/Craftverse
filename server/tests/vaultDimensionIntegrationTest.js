const assert = require('assert');
const { VaultDimension } = require('../dimensions/vaultDimension');
const { RoomGenerator } = require('../generators/roomGenerator');
const { LootTable } = require('../loot/lootTable');
const { World } = require('../world/world');

describe('Vault Dimension Integration', () => {
  let dimension;
  let world;

  beforeEach(() => {
    dimension = new VaultDimension();
    world = new World();
  });

  describe('Instance Management', () => {
    it('should create and manage vault instances', () => {
      const instance = dimension.createInstance();
      
      assert.strictEqual(instance.id !== undefined, true);
      assert.strictEqual(dimension.instances.has(instance.id), true);
      
      // Verify instance structure
      assert.strictEqual(instance.layout !== undefined, true);
      assert.strictEqual(instance.spawnPoint !== undefined, true);
      assert.strictEqual(instance.rooms.size > 0, true);
      assert.strictEqual(instance.loot.size > 0, true);
    });

    it('should handle multiple instances', () => {
      const instance1 = dimension.createInstance();
      const instance2 = dimension.createInstance();
      
      assert.notStrictEqual(instance1.id, instance2.id);
      assert.strictEqual(dimension.instances.size, 2);
    });

    it('should clean up instances properly', () => {
      const instance = dimension.createInstance();
      dimension.deleteInstance(instance.id);
      
      assert.strictEqual(dimension.instances.has(instance.id), false);
    });
  });

  describe('Room Generation', () => {
    it('should generate valid room layouts', () => {
      const instance = dimension.createInstance();
      
      // Verify room types
      const roomTypes = new Set();
      for (const room of instance.rooms.values()) {
        roomTypes.add(room.type);
      }
      
      assert.strictEqual(roomTypes.has('entrance'), true);
      assert.strictEqual(roomTypes.has('treasure'), true);
      assert.strictEqual(roomTypes.has('challenge'), true);
      assert.strictEqual(roomTypes.has('boss'), true);
    });

    it('should generate connected rooms', () => {
      const instance = dimension.createInstance();
      
      // Verify room connections
      const connections = instance.layout.connections;
      assert.strictEqual(connections.length > 0, true);
      
      // Verify all connections reference valid rooms
      const roomIds = new Set(instance.rooms.keys());
      for (const conn of connections) {
        assert.strictEqual(roomIds.has(conn.from), true);
        assert.strictEqual(roomIds.has(conn.to), true);
      }
    });
  });

  describe('Loot Generation', () => {
    it('should generate appropriate loot for each room', () => {
      const instance = dimension.createInstance();
      
      for (const [roomId, room] of instance.rooms) {
        const loot = instance.loot.get(roomId);
        assert.strictEqual(Array.isArray(loot), true);
        assert.strictEqual(loot.length > 0, true);
        
        // Verify loot items have correct properties
        for (const item of loot) {
          assert.strictEqual(item.item !== undefined, true);
          assert.strictEqual(typeof item.count === 'number', true);
          assert.strictEqual(item.count > 0, true);
        }
      }
    });

    it('should scale loot with room difficulty', () => {
      const instance = dimension.createInstance();
      
      // Find rooms of different difficulties
      const easyRoom = Array.from(instance.rooms.values()).find(r => r.difficulty === 1);
      const hardRoom = Array.from(instance.rooms.values()).find(r => r.difficulty === 4);
      
      const easyLoot = instance.loot.get(easyRoom.id);
      const hardLoot = instance.loot.get(hardRoom.id);
      
      // Verify harder rooms have better loot
      const easyItems = new Set(easyLoot.map(item => item.item));
      const hardItems = new Set(hardLoot.map(item => item.item));
      
      // Check for presence of rare items in hard room
      const hasRareItems = Array.from(hardItems).some(item => 
        item.includes('netherite') || item.includes('elytra')
      );
      
      assert.strictEqual(hasRareItems, true);
    });
  });

  describe('Player Return Points', () => {
    it('should store and retrieve return points', () => {
      const instance = dimension.createInstance();
      const returnPoint = { x: 100, y: 100, z: 100 };
      
      dimension.setReturnPoint(instance.id, returnPoint);
      const retrievedInstance = dimension.getInstance(instance.id);
      
      assert.deepStrictEqual(retrievedInstance.returnPoint, returnPoint);
    });
  });
}); 