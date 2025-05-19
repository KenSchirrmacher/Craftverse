const assert = require('assert');
const { VaultPortalManager } = require('../managers/vaultPortalManager');

class TestDimension {
  constructor() {
    this.id = 'vault';
    this.instances = new Map();
  }

  createInstance() {
    const instance = {
      id: 'test_instance',
      spawnPoint: { x: 0, y: 0, z: 0 },
      returnPoint: { x: 100, y: 100, z: 100 }
    };
    this.instances.set(instance.id, instance);
    return instance;
  }

  deleteInstance(id) {
    this.instances.delete(id);
  }
}

class TestDimensionRegistry {
  constructor() {
    this.dimensions = new Map();
  }

  register(dimension) {
    this.dimensions.set(dimension.id, dimension);
  }

  getDimension(id) {
    return this.dimensions.get(id);
  }
}

describe('VaultPortalManager', () => {
  let manager;
  let player;
  let dimensionRegistry;

  beforeEach(() => {
    dimensionRegistry = new TestDimensionRegistry();
    dimensionRegistry.register(new TestDimension());
    
    manager = new VaultPortalManager();
    manager.dimensionRegistry = dimensionRegistry;

    player = {
      id: 'test_player',
      sendMessage: (msg) => {},
      teleport: (data) => {}
    };
  });

  describe('Player Teleportation', () => {
    it('should teleport player to vault dimension', () => {
      let teleportData = null;
      player.teleport = (data) => { teleportData = data; };

      manager.teleportPlayer(player);

      assert.strictEqual(teleportData.dimension, 'vault');
      assert.strictEqual(teleportData.x, 0);
      assert.strictEqual(teleportData.y, 0);
      assert.strictEqual(teleportData.z, 0);
    });

    it('should not allow multiple vault entries', () => {
      let messageReceived = false;
      player.sendMessage = (msg) => { messageReceived = true; };

      // First teleport
      manager.teleportPlayer(player);
      
      // Second teleport attempt
      manager.teleportPlayer(player);

      assert.strictEqual(messageReceived, true);
    });
  });

  describe('Timer Management', () => {
    it('should start timer when player enters', () => {
      manager.teleportPlayer(player);
      
      const timerData = manager.playerTimers.get(player.id);
      assert.strictEqual(timerData !== undefined, true);
      assert.strictEqual(timerData.timeLimit, 300000);
    });

    it('should return player after time expires', (done) => {
      let returnTeleport = false;
      player.teleport = (data) => {
        if (data.dimension === 'overworld') {
          returnTeleport = true;
        }
      };

      manager.teleportPlayer(player);
      
      // Fast forward time
      setTimeout(() => {
        assert.strictEqual(returnTeleport, true);
        assert.strictEqual(manager.playerTimers.has(player.id), false);
        done();
      }, 100);
    });
  });

  describe('Time Tracking', () => {
    it('should track remaining time correctly', () => {
      manager.teleportPlayer(player);
      
      const initialTime = manager.getRemainingTime(player.id);
      assert.strictEqual(initialTime > 0, true);
      assert.strictEqual(initialTime <= 300000, true);
    });

    it('should return 0 for non-existent timer', () => {
      assert.strictEqual(manager.getRemainingTime('non_existent_player'), 0);
    });
  });

  describe('Instance Management', () => {
    it('should create new instance for each player', () => {
      const player2 = {
        id: 'test_player_2',
        sendMessage: (msg) => {},
        teleport: (data) => {}
      };

      manager.teleportPlayer(player);
      manager.teleportPlayer(player2);

      const instance1 = manager.playerTimers.get(player.id).vaultInstance;
      const instance2 = manager.playerTimers.get(player2.id).vaultInstance;

      assert.notStrictEqual(instance1.id, instance2.id);
    });

    it('should clean up instance after time expires', (done) => {
      manager.teleportPlayer(player);
      const instanceId = manager.playerTimers.get(player.id).vaultInstance.id;

      setTimeout(() => {
        assert.strictEqual(
          manager.dimensionRegistry.getDimension('vault').instances.has(instanceId),
          false
        );
        done();
      }, 100);
    });
  });
}); 