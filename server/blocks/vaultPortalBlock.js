const Block = require('./block');
const { BlockRegistry } = require('../registry/blockRegistry');
const { VaultPortalManager } = require('../managers/vaultPortalManager');
const { Vector3 } = require('../math/vector3');

class VaultPortalBlock extends Block {
  constructor() {
    super('vault_portal');
    this.frameBlocks = [];
    this.active = false;
    this.linkedPortal = null;
    this.portalManager = new VaultPortalManager();
  }

  isValidPlacement() {
    return true;
  }

  isActive() {
    return this.active;
  }

  getFrameBlocks() {
    return this.frameBlocks;
  }

  addFrameBlock(position) {
    this.frameBlocks.push(new Vector3(position.x, position.y, position.z));
  }

  activate() {
    if (this.frameBlocks.length >= 4) {
      this.active = true;
      this.emit('activated', this);
    }
  }

  deactivate() {
    this.active = false;
    this.emit('deactivated', this);
  }

  onPlayerInteract(player) {
    if (this.active && this.linkedPortal) {
      this.emit('teleport', { player, destination: this.linkedPortal });
    }
  }

  setLinkedPortal(portal) {
    this.linkedPortal = portal;
  }

  getLinkedPortal() {
    return this.linkedPortal;
  }

  serialize() {
    return {
      ...super.serialize(),
      frameBlocks: this.frameBlocks.map(block => block.serialize()),
      active: this.active,
      linkedPortalId: this.linkedPortal ? this.linkedPortal.getId() : null
    };
  }

  deserialize(data) {
    super.deserialize(data);
    this.frameBlocks = data.frameBlocks.map(block => Vector3.deserialize(block));
    this.active = data.active;
    this.linkedPortalId = data.linkedPortalId;
  }

  onPlace(world, x, y, z, player) {
    // Check if portal frame is valid
    if (this.validatePortalFrame(world, x, y, z)) {
      this.setState(world, x, y, z, { frameComplete: true });
      this.startPortalForming(world, x, y, z);
    }
  }

  validatePortalFrame(world, x, y, z) {
    // Check for 3x3 frame pattern
    const frameBlocks = [
      {x: -1, y: 0, z: -1}, {x: 0, y: 0, z: -1}, {x: 1, y: 0, z: -1},
      {x: -1, y: 0, z: 0}, {x: 1, y: 0, z: 0},
      {x: -1, y: 0, z: 1}, {x: 0, y: 0, z: 1}, {x: 1, y: 0, z: 1}
    ];

    for (const pos of frameBlocks) {
      const block = world.getBlock(x + pos.x, y + pos.y, z + pos.z);
      if (!block || block.id !== 'reinforced_deepslate') {
        return false;
      }
    }

    return true;
  }

  startPortalForming(world, x, y, z) {
    this.setState(world, x, y, z, { forming: true });
    
    // Start formation animation
    this.createFormingParticles(world, x, y, z);
    this.playFormingSound(world, x, y, z);

    // Activate portal after formation
    setTimeout(() => {
      this.activatePortal(world, x, y, z);
    }, 3000);
  }

  activatePortal(world, x, y, z) {
    this.setState(world, x, y, z, { 
      forming: false,
      active: true
    });

    // Create portal effects
    this.createPortalParticles(world, x, y, z);
    this.playPortalSound(world, x, y, z);
  }

  createFormingParticles(world, x, y, z) {
    // Create purple particles in a spiral pattern
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = 1.5;
      const px = x + Math.cos(angle) * radius;
      const pz = z + Math.sin(angle) * radius;
      
      world.addParticleEffect({
        type: 'portal',
        x: px,
        y: y + 0.5,
        z: pz,
        color: [0.5, 0, 0.5]
      });
    }
  }

  createPortalParticles(world, x, y, z) {
    // Create continuous portal particles
    setInterval(() => {
      world.addParticleEffect({
        type: 'portal',
        x: x + (Math.random() - 0.5) * 0.5,
        y: y + Math.random(),
        z: z + (Math.random() - 0.5) * 0.5,
        color: [0.5, 0, 0.5]
      });
    }, 100);
  }

  playFormingSound(world, x, y, z) {
    world.playSound({
      type: 'portal_forming',
      x: x,
      y: y,
      z: z,
      volume: 1.0,
      pitch: 1.0
    });
  }

  playPortalSound(world, x, y, z) {
    world.playSound({
      type: 'portal_active',
      x: x,
      y: y,
      z: z,
      volume: 0.5,
      pitch: 1.0
    });
  }

  getState(world, x, y, z) {
    return world.getBlockState(x, y, z) || this.state;
  }

  setState(world, x, y, z, newState) {
    const currentState = this.getState(world, x, y, z);
    world.setBlockState(x, y, z, { ...currentState, ...newState });
  }
}

// Register the block
BlockRegistry.register(new VaultPortalBlock());

module.exports = VaultPortalBlock; 