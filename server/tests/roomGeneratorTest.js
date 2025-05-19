const assert = require('assert');
const { RoomGenerator } = require('../generators/roomGenerator');

describe('RoomGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new RoomGenerator();
  });

  describe('Vault Layout Generation', () => {
    it('should generate layout with entrance room', () => {
      const layout = generator.generateVaultLayout();
      
      assert.strictEqual(layout.rooms.length > 0, true);
      assert.strictEqual(layout.rooms[0].type, generator.roomTypes.ENTRANCE);
    });

    it('should generate main path with correct room types', () => {
      const layout = generator.generateVaultLayout();
      
      // Check that we have at least one challenge room and one boss room
      const hasChallengeRoom = layout.rooms.some(room => room.type === generator.roomTypes.CHALLENGE);
      const hasBossRoom = layout.rooms.some(room => room.type === generator.roomTypes.BOSS);
      
      assert.strictEqual(hasChallengeRoom, true);
      assert.strictEqual(hasBossRoom, true);
    });

    it('should generate treasure rooms with connections', () => {
      const layout = generator.generateVaultLayout();
      
      // Check for treasure rooms
      const treasureRooms = layout.rooms.filter(room => room.type === generator.roomTypes.TREASURE);
      assert.strictEqual(treasureRooms.length >= 2, true);
      
      // Check for secret connections
      const secretConnections = layout.connections.filter(conn => conn.type === 'secret');
      assert.strictEqual(secretConnections.length >= 2, true);
    });

    it('should generate valid room connections', () => {
      const layout = generator.generateVaultLayout();
      
      // Check that all connections reference valid rooms
      const roomIds = new Set(layout.rooms.map(room => room.id));
      for (const conn of layout.connections) {
        assert.strictEqual(roomIds.has(conn.from), true);
        assert.strictEqual(roomIds.has(conn.to), true);
      }
    });
  });

  describe('Room Generation', () => {
    it('should generate room with correct properties', () => {
      const layout = {
        type: generator.roomTypes.ENTRANCE,
        x: 0,
        y: 0,
        z: 0,
        width: 7,
        length: 7,
        height: 5
      };
      
      const room = generator.generateRoom(layout);
      
      assert.strictEqual(room.type, layout.type);
      assert.strictEqual(room.x, layout.x);
      assert.strictEqual(room.y, layout.y);
      assert.strictEqual(room.z, layout.z);
      assert.strictEqual(room.width, layout.width);
      assert.strictEqual(room.length, layout.length);
      assert.strictEqual(room.height, layout.height);
      assert.strictEqual(room.id !== undefined, true);
    });

    it('should calculate correct difficulty based on room type', () => {
      const testCases = [
        { type: generator.roomTypes.ENTRANCE, expected: 1 },
        { type: generator.roomTypes.TREASURE, expected: 2 },
        { type: generator.roomTypes.CHALLENGE, expected: 3 },
        { type: generator.roomTypes.BOSS, expected: 4 }
      ];

      for (const testCase of testCases) {
        const room = generator.generateRoom({ type: testCase.type });
        assert.strictEqual(room.difficulty, testCase.expected);
      }
    });

    it('should generate appropriate features for each room type', () => {
      const testCases = [
        { type: generator.roomTypes.ENTRANCE, expected: ['spawn_point', 'exit_portal'] },
        { type: generator.roomTypes.TREASURE, expected: ['chest', 'traps', 'puzzles'] },
        { type: generator.roomTypes.CHALLENGE, expected: ['mob_spawners', 'traps', 'puzzles'] },
        { type: generator.roomTypes.BOSS, expected: ['boss_arena', 'boss_spawner', 'treasure_chest'] }
      ];

      for (const testCase of testCases) {
        const room = generator.generateRoom({ type: testCase.type });
        for (const feature of testCase.expected) {
          assert.strictEqual(room.features.includes(feature), true);
        }
      }
    });

    it('should generate appropriate decorations for each room type', () => {
      const testCases = [
        { type: generator.roomTypes.ENTRANCE, expected: ['torches', 'pillars', 'archway'] },
        { type: generator.roomTypes.TREASURE, expected: ['gold_blocks', 'emerald_blocks', 'diamond_blocks'] },
        { type: generator.roomTypes.CHALLENGE, expected: ['traps', 'pressure_plates', 'redstone_mechanisms'] },
        { type: generator.roomTypes.BOSS, expected: ['boss_throne', 'trophies', 'special_lighting'] }
      ];

      for (const testCase of testCases) {
        const room = generator.generateRoom({ type: testCase.type });
        for (const decoration of testCase.expected) {
          assert.strictEqual(room.decorations.includes(decoration), true);
        }
      }
    });
  });
}); 