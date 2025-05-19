const assert = require('assert');
const { VaultDimension } = require('../dimensions/vaultDimension');

class TestRoomGenerator {
  generateVaultLayout() {
    return {
      rooms: [
        {
          id: 'room1',
          type: 'entrance',
          x: 0,
          y: 0,
          z: 0,
          width: 7,
          length: 7,
          height: 5
        }
      ],
      connections: []
    };
  }

  generateRoom(layout) {
    return {
      id: layout.id || 'test_room',
      type: layout.type,
      x: layout.x,
      y: layout.y,
      z: layout.z,
      width: layout.width,
      length: layout.length,
      height: layout.height,
      difficulty: 1,
      features: ['test_feature'],
      decorations: ['test_decoration']
    };
  }
}

class TestLootTable {
  generateLoot(difficulty) {
    return [
      { item: 'test_item', count: 1 }
    ];
  }
}

describe('VaultDimension', () => {
  let dimension;
  let roomGenerator;
  let lootTable;

  beforeEach(() => {
    roomGenerator = new TestRoomGenerator();
    lootTable = new TestLootTable();
    
    dimension = new VaultDimension();
    dimension.roomGenerator = roomGenerator;
    dimension.lootTable = lootTable;
  });

  describe('Instance Creation', () => {
    it('should create a new instance with unique ID', () => {
      const instance = dimension.createInstance();
      
      assert.strictEqual(instance.id !== undefined, true);
      assert.strictEqual(dimension.instances.has(instance.id), true);
    });

    it('should generate spawn point in first room', () => {
      const instance = dimension.createInstance();
      
      assert.strictEqual(instance.spawnPoint.x, 3.5); // Center of 7x7 room
      assert.strictEqual(instance.spawnPoint.y, 1); // One block above floor
      assert.strictEqual(instance.spawnPoint.z, 3.5); // Center of 7x7 room
    });

    it('should initialize empty return point', () => {
      const instance = dimension.createInstance();
      
      assert.strictEqual(instance.returnPoint, null);
    });
  });

  describe('Room Generation', () => {
    it('should generate rooms for layout', () => {
      const instance = dimension.createInstance();
      
      assert.strictEqual(instance.rooms.size > 0, true);
      const firstRoom = instance.rooms.values().next().value;
      assert.strictEqual(firstRoom.type, 'entrance');
    });

    it('should generate loot for each room', () => {
      const instance = dimension.createInstance();
      
      assert.strictEqual(instance.loot.size > 0, true);
      const firstLoot = instance.loot.values().next().value;
      assert.strictEqual(firstLoot[0].item, 'test_item');
    });
  });

  describe('Instance Management', () => {
    it('should delete instance', () => {
      const instance = dimension.createInstance();
      const instanceId = instance.id;
      
      dimension.deleteInstance(instanceId);
      
      assert.strictEqual(dimension.instances.has(instanceId), false);
    });

    it('should get instance by ID', () => {
      const instance = dimension.createInstance();
      const retrievedInstance = dimension.getInstance(instance.id);
      
      assert.strictEqual(retrievedInstance, instance);
    });

    it('should set return point', () => {
      const instance = dimension.createInstance();
      const returnPoint = { x: 100, y: 100, z: 100 };
      
      dimension.setReturnPoint(instance.id, returnPoint);
      
      assert.deepStrictEqual(instance.returnPoint, returnPoint);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent instance ID', () => {
      const nonExistentId = 'non_existent';
      
      assert.strictEqual(dimension.getInstance(nonExistentId), undefined);
      assert.doesNotThrow(() => dimension.deleteInstance(nonExistentId));
      assert.doesNotThrow(() => dimension.setReturnPoint(nonExistentId, { x: 0, y: 0, z: 0 }));
    });
  });
}); 