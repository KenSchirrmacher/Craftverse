/**
 * Vault Portal Block
 * Implements secure portal functionality with access control
 */

class VaultPortal {
  constructor() {
    this.isActive = false;
    this.destination = null;
    this.accessList = new Set();
    this.activationCooldown = 0;
  }

  canAccess(player) {
    return player.permissions.includes('vault.access');
  }

  canActivate(player) {
    return this.canAccess(player) && this.activationCooldown <= 0;
  }

  canTeleport(player) {
    return this.canAccess(player) && this.isActive;
  }

  activate(player) {
    if (!this.canActivate(player)) {
      return false;
    }

    this.isActive = true;
    this.activationCooldown = 100; // 5 seconds at 20 ticks per second
    return true;
  }

  deactivate() {
    this.isActive = false;
  }

  update() {
    if (this.activationCooldown > 0) {
      this.activationCooldown--;
    }
  }

  setDestination(destination) {
    this.destination = destination;
  }

  teleport(player) {
    if (!this.canTeleport(player)) {
      return false;
    }

    if (!this.destination) {
      return false;
    }

    player.position = { ...this.destination };
    return true;
  }
}

module.exports = VaultPortal; 