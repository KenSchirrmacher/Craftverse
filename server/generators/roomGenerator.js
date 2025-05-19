const { v4: uuidv4 } = require('uuid');

class RoomGenerator {
  constructor() {
    this.roomTypes = {
      ENTRANCE: 'entrance',
      TREASURE: 'treasure',
      CHALLENGE: 'challenge',
      BOSS: 'boss'
    };
  }

  generateVaultLayout() {
    const layout = {
      rooms: [],
      connections: []
    };

    // Generate entrance room
    const entranceRoom = this.generateRoom({
      type: this.roomTypes.ENTRANCE,
      x: 0,
      y: 0,
      z: 0,
      width: 7,
      length: 7,
      height: 5
    });
    layout.rooms.push(entranceRoom);

    // Generate main path
    const mainPathLength = 3 + Math.floor(Math.random() * 3); // 3-5 rooms
    let lastRoom = entranceRoom;
    
    for (let i = 0; i < mainPathLength; i++) {
      const room = this.generateRoom({
        type: i === mainPathLength - 1 ? this.roomTypes.BOSS : this.roomTypes.CHALLENGE,
        x: lastRoom.x + lastRoom.width + 2,
        y: lastRoom.y,
        z: lastRoom.z,
        width: 7 + Math.floor(Math.random() * 4),
        length: 7 + Math.floor(Math.random() * 4),
        height: 5 + Math.floor(Math.random() * 3)
      });
      
      layout.rooms.push(room);
      layout.connections.push({
        from: lastRoom.id,
        to: room.id,
        type: 'corridor'
      });
      
      lastRoom = room;
    }

    // Generate treasure rooms
    const treasureRoomCount = 2 + Math.floor(Math.random() * 2); // 2-3 rooms
    for (let i = 0; i < treasureRoomCount; i++) {
      const connectedRoom = layout.rooms[1 + Math.floor(Math.random() * (layout.rooms.length - 2))];
      const room = this.generateRoom({
        type: this.roomTypes.TREASURE,
        x: connectedRoom.x + (Math.random() > 0.5 ? connectedRoom.width + 2 : -7),
        y: connectedRoom.y,
        z: connectedRoom.z + (Math.random() > 0.5 ? connectedRoom.length + 2 : -7),
        width: 5 + Math.floor(Math.random() * 3),
        length: 5 + Math.floor(Math.random() * 3),
        height: 4 + Math.floor(Math.random() * 2)
      });
      
      layout.rooms.push(room);
      layout.connections.push({
        from: connectedRoom.id,
        to: room.id,
        type: 'secret'
      });
    }

    return layout;
  }

  generateRoom(layout) {
    const room = {
      id: uuidv4(),
      type: layout.type,
      x: layout.x,
      y: layout.y,
      z: layout.z,
      width: layout.width,
      length: layout.length,
      height: layout.height,
      difficulty: this.calculateDifficulty(layout.type),
      features: this.generateFeatures(layout.type),
      decorations: this.generateDecorations(layout.type)
    };

    return room;
  }

  calculateDifficulty(roomType) {
    switch (roomType) {
      case this.roomTypes.ENTRANCE:
        return 1;
      case this.roomTypes.TREASURE:
        return 2;
      case this.roomTypes.CHALLENGE:
        return 3;
      case this.roomTypes.BOSS:
        return 4;
      default:
        return 1;
    }
  }

  generateFeatures(roomType) {
    const features = [];
    
    switch (roomType) {
      case this.roomTypes.ENTRANCE:
        features.push('spawn_point', 'exit_portal');
        break;
      case this.roomTypes.TREASURE:
        features.push('chest', 'traps', 'puzzles');
        break;
      case this.roomTypes.CHALLENGE:
        features.push('mob_spawners', 'traps', 'puzzles');
        break;
      case this.roomTypes.BOSS:
        features.push('boss_arena', 'boss_spawner', 'treasure_chest');
        break;
    }

    return features;
  }

  generateDecorations(roomType) {
    const decorations = [];
    
    switch (roomType) {
      case this.roomTypes.ENTRANCE:
        decorations.push('torches', 'pillars', 'archway');
        break;
      case this.roomTypes.TREASURE:
        decorations.push('gold_blocks', 'emerald_blocks', 'diamond_blocks');
        break;
      case this.roomTypes.CHALLENGE:
        decorations.push('traps', 'pressure_plates', 'redstone_mechanisms');
        break;
      case this.roomTypes.BOSS:
        decorations.push('boss_throne', 'trophies', 'special_lighting');
        break;
    }

    return decorations;
  }
}

module.exports = { RoomGenerator }; 