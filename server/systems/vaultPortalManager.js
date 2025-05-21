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
    const portalId = this.generatePortalId(portal);
    this.portals.set(portalId, portal);
    this.emit('portalRegistered', portal);
    return portalId;
  }

  unregisterPortal(portalId) {
    const portal = this.portals.get(portalId);
    if (portal) {
      this.portals.delete(portalId);
      this.portalLinks.delete(portalId);
      this.emit('portalUnregistered', portal);
    }
  }

  generatePortalId(portal) {
    return `vault_portal_${portal.position.x}_${portal.position.y}_${portal.position.z}`;
  }

  getPortalCount() {
    return this.portals.size;
  }

  getPortal(portalId) {
    return this.portals.get(portalId);
  }

  linkPortals(portal1, portal2) {
    const id1 = this.generatePortalId(portal1);
    const id2 = this.generatePortalId(portal2);

    portal1.setLinkedPortal(portal2);
    portal2.setLinkedPortal(portal1);

    this.portalLinks.set(id1, id2);
    this.portalLinks.set(id2, id1);

    this.emit('portalsLinked', { portal1, portal2 });
  }

  unlinkPortals(portal1, portal2) {
    const id1 = this.generatePortalId(portal1);
    const id2 = this.generatePortalId(portal2);

    portal1.setLinkedPortal(null);
    portal2.setLinkedPortal(null);

    this.portalLinks.delete(id1);
    this.portalLinks.delete(id2);

    this.emit('portalsUnlinked', { portal1, portal2 });
  }

  arePortalsLinked(portal1, portal2) {
    const id1 = this.generatePortalId(portal1);
    const id2 = this.generatePortalId(portal2);

    return this.portalLinks.get(id1) === id2 && this.portalLinks.get(id2) === id1;
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
      position: { ...player.position }
    };

    // Teleport player to vault dimension
    player.setDimension(this.vaultDimension);
    
    // Generate a new room and set player position
    const room = this.vaultDimension.generateRoom();
    const spawnPoint = room.getCenter();
    player.position = spawnPoint;

    // Apply vault-specific effects
    this.vaultDimension.onPlayerEnter(player);

    this.emit('playerTeleported', {
      player,
      sourcePortal,
      destinationPortal: linkedPortal,
      returnPoint
    });

    return {
      success: true,
      message: 'Successfully teleported to the Vault',
      returnPoint: returnPoint
    };
  }

  returnPlayer(player, returnPoint) {
    if (!returnPoint || !returnPoint.dimension || !returnPoint.position) {
      return { success: false, message: 'Invalid return point' };
    }

    // Remove vault-specific effects
    this.vaultDimension.onPlayerExit(player);

    // Teleport player back
    player.setDimension(returnPoint.dimension);
    player.position = returnPoint.position;

    return {
      success: true,
      message: 'Successfully returned from the Vault'
    };
  }

  update() {
    // Update all registered portals
    for (const [portalId, portal] of this.portals) {
      if (portal.isActive()) {
        portal.createPortalParticles(this.world, portal.position.x, portal.position.y, portal.position.z);
      }
    }
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