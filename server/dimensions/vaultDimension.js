const Dimension = require('./dimension');
const { Vector3 } = require('../math/vector3');
const RoomGenerator = require('../generators/roomGenerator');
const LootTable = require('../loot/lootTable');

class VaultDimension extends Dimension {
  constructor() {
    super('vault');
    this.lightLevel = 15;
    this.roomGenerator = new RoomGenerator();
    this.lootTable = new LootTable();
  }

  getDimensionId() {
    return this.id;
  }

  getLightLevel() {
    return this.lightLevel;
  }

  generateRoom() {
    const size = new Vector3(
      Math.floor(Math.random() * 10) + 10, // 10-20 blocks wide
      Math.floor(Math.random() * 5) + 5,   // 5-10 blocks tall
      Math.floor(Math.random() * 10) + 10  // 10-20 blocks long
    );

    const room = this.roomGenerator.generateRoom(size);
    room.setDimension(this);
    return room;
  }

  generateLoot(level) {
    return this.lootTable.generateLoot(level);
  }

  onPlayerEnter(player) {
    player.setDimension(this);
    this.emit('playerEntered', player);
  }

  onPlayerExit(player) {
    this.emit('playerExited', player);
  }

  serialize() {
    return {
      ...super.serialize(),
      lightLevel: this.lightLevel
    };
  }

  deserialize(data) {
    super.deserialize(data);
    this.lightLevel = data.lightLevel;
  }
}

module.exports = VaultDimension; 