const { v4: uuidv4 } = require('uuid');
const { RoomGenerator } = require('../generators/roomGenerator');
const { LootTable } = require('../loot/lootTable');

class VaultDimension {
  constructor() {
    this.id = 'vault';
    this.name = 'Vault Dimension';
    this.instances = new Map();
    this.roomGenerator = new RoomGenerator();
    this.lootTable = new LootTable();
  }

  createInstance() {
    const instanceId = uuidv4();
    
    // Generate vault layout
    const layout = this.roomGenerator.generateVaultLayout();
    
    // Generate spawn point
    const spawnPoint = this.generateSpawnPoint(layout);
    
    // Create instance
    const instance = {
      id: instanceId,
      layout,
      spawnPoint,
      returnPoint: null, // Set when player enters
      rooms: new Map(),
      loot: new Map()
    };

    // Generate rooms and loot
    this.generateRooms(instance);
    this.generateLoot(instance);

    // Store instance
    this.instances.set(instanceId, instance);
    
    return instance;
  }

  generateSpawnPoint(layout) {
    // Find a suitable spawn point in the first room
    const firstRoom = layout.rooms[0];
    return {
      x: firstRoom.x + firstRoom.width / 2,
      y: firstRoom.y + 1,
      z: firstRoom.z + firstRoom.length / 2
    };
  }

  generateRooms(instance) {
    for (const roomLayout of instance.layout.rooms) {
      const room = this.roomGenerator.generateRoom(roomLayout);
      instance.rooms.set(room.id, room);
    }
  }

  generateLoot(instance) {
    for (const [roomId, room] of instance.rooms) {
      const loot = this.lootTable.generateLoot(room.difficulty);
      instance.loot.set(roomId, loot);
    }
  }

  deleteInstance(instanceId) {
    this.instances.delete(instanceId);
  }

  getInstance(instanceId) {
    return this.instances.get(instanceId);
  }

  setReturnPoint(instanceId, point) {
    const instance = this.getInstance(instanceId);
    if (instance) {
      instance.returnPoint = point;
    }
  }
}

module.exports = { VaultDimension }; 