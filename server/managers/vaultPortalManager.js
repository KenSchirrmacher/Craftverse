const { DimensionRegistry } = require('../registry/dimensionRegistry');
const { VaultDimension } = require('../dimensions/vaultDimension');

class VaultPortalManager {
  constructor() {
    this.activePortals = new Map();
    this.playerTimers = new Map();
    this.dimensionRegistry = new DimensionRegistry();
    
    // Register vault dimension
    this.dimensionRegistry.register(new VaultDimension());
  }

  teleportPlayer(player) {
    const playerId = player.id;
    
    // Check if player is already in a vault
    if (this.playerTimers.has(playerId)) {
      player.sendMessage('You are already in a vault!');
      return;
    }

    // Create new vault instance
    const vaultDimension = this.dimensionRegistry.getDimension('vault');
    const vaultInstance = vaultDimension.createInstance();

    // Teleport player
    player.teleport({
      dimension: 'vault',
      x: vaultInstance.spawnPoint.x,
      y: vaultInstance.spawnPoint.y,
      z: vaultInstance.spawnPoint.z
    });

    // Start timer
    this.startPlayerTimer(playerId, vaultInstance);
  }

  startPlayerTimer(playerId, vaultInstance) {
    const timeLimit = 300000; // 5 minutes in milliseconds
    
    this.playerTimers.set(playerId, {
      vaultInstance,
      startTime: Date.now(),
      timeLimit
    });

    // Send initial message
    const player = this.getPlayerById(playerId);
    if (player) {
      player.sendMessage('You have 5 minutes to explore the vault!');
    }

    // Set up timer
    setTimeout(() => {
      this.handleTimeExpired(playerId);
    }, timeLimit);
  }

  handleTimeExpired(playerId) {
    const timerData = this.playerTimers.get(playerId);
    if (!timerData) return;

    const player = this.getPlayerById(playerId);
    if (player) {
      // Teleport player back
      player.teleport({
        dimension: 'overworld',
        x: timerData.vaultInstance.returnPoint.x,
        y: timerData.vaultInstance.returnPoint.y,
        z: timerData.vaultInstance.returnPoint.z
      });

      player.sendMessage('Time\'s up! You have been returned to the overworld.');
    }

    // Clean up
    this.playerTimers.delete(playerId);
    this.dimensionRegistry.deleteInstance(timerData.vaultInstance.id);
  }

  getPlayerById(playerId) {
    // This would be implemented to get the player object from your game's player management system
    return global.gameServer.getPlayer(playerId);
  }

  getRemainingTime(playerId) {
    const timerData = this.playerTimers.get(playerId);
    if (!timerData) return 0;

    const elapsed = Date.now() - timerData.startTime;
    return Math.max(0, timerData.timeLimit - elapsed);
  }
}

module.exports = { VaultPortalManager }; 