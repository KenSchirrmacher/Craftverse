const EventEmitter = require('events');
const VaultPortalBlock = require('../blocks/vaultPortalBlock');

class VaultPortalManager extends EventEmitter {
  constructor(world, vaultDimension) {
    super();
    this.world = world;
    this.vaultDimension = vaultDimension;
    this.portals = new Map();
    this.portalLinks = new Map();
  }

  registerPortal(portal) {
    if (!(portal instanceof VaultPortalBlock)) {
      throw new Error('Invalid portal block');
    }

    const portalId = portal.getId();
    this.portals.set(portalId, portal);
    this.emit('portalRegistered', portal);
  }

  unregisterPortal(portalId) {
    const portal = this.portals.get(portalId);
    if (portal) {
      this.portals.delete(portalId);
      this.portalLinks.delete(portalId);
      this.emit('portalUnregistered', portal);
    }
  }

  getPortalCount() {
    return this.portals.size;
  }

  linkPortals(portal1, portal2) {
    if (!(portal1 instanceof VaultPortalBlock) || !(portal2 instanceof VaultPortalBlock)) {
      throw new Error('Invalid portal blocks');
    }

    const portal1Id = portal1.getId();
    const portal2Id = portal2.getId();

    portal1.setLinkedPortal(portal2);
    portal2.setLinkedPortal(portal1);

    this.portalLinks.set(portal1Id, portal2Id);
    this.portalLinks.set(portal2Id, portal1Id);

    this.emit('portalsLinked', { portal1, portal2 });
  }

  unlinkPortals(portal1, portal2) {
    const portal1Id = portal1.getId();
    const portal2Id = portal2.getId();

    portal1.setLinkedPortal(null);
    portal2.setLinkedPortal(null);

    this.portalLinks.delete(portal1Id);
    this.portalLinks.delete(portal2Id);

    this.emit('portalsUnlinked', { portal1, portal2 });
  }

  arePortalsLinked(portal1, portal2) {
    const portal1Id = portal1.getId();
    const portal2Id = portal2.getId();

    return this.portalLinks.get(portal1Id) === portal2Id &&
           this.portalLinks.get(portal2Id) === portal1Id;
  }

  teleportPlayer(player, sourcePortal) {
    if (!sourcePortal.isActive()) {
      return { success: false, message: 'Portal is not active' };
    }

    const linkedPortal = sourcePortal.getLinkedPortal();
    if (!linkedPortal) {
      return { success: false, message: 'Portal is not linked' };
    }

    // Store return point
    const returnPoint = {
      dimension: player.getDimension(),
      position: player.position.clone()
    };

    // Teleport player
    player.setPosition(linkedPortal.position);
    player.setDimension(this.vaultDimension);

    this.emit('playerTeleported', {
      player,
      sourcePortal,
      destinationPortal: linkedPortal,
      returnPoint
    });

    return { success: true };
  }

  serialize() {
    return {
      portals: Array.from(this.portals.entries()),
      portalLinks: Array.from(this.portalLinks.entries())
    };
  }

  deserialize(data) {
    this.portals = new Map(data.portals);
    this.portalLinks = new Map(data.portalLinks);
  }
}

module.exports = VaultPortalManager; 