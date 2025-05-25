/**
 * Chain Reaction Test
 * Tests for chain reactions triggered by Wind Charge
 */
const { expect } = require('chai');
const BaseWorld = require('../world/baseWorld');
const { WindChargeEntity } = require('../entity/windChargeEntity');
const { Player } = require('../player/player');
const { BlockRegistry } = require('../blocks/blockRegistry');

class TestWorld extends BaseWorld {
  constructor() {
    super();
    this.events = [];
  }

  emit(event, data) {
    this.events.push({ event, data });
  }

  getEvents() {
    return this.events;
  }

  activateBlock(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (block && block.onActivate) {
      block.onActivate(this, x, y, z);
    }
  }
}

class TestPlayer extends Player {
  constructor() {
    super();
    this.lookDirection = { x: 0, y: 0, z: 1 };
  }

  getLookDirection() {
    return this.lookDirection;
  }
}

describe('Wind Charge Chain Reactions', () => {
  let world;
  let player;

  beforeEach(() => {
    world = new TestWorld();
    player = new TestPlayer();
  });

  afterEach(() => {
    world = null;
    player = null;
  });

  it('should trigger TNT chain reactions', () => {
    // Place TNT blocks in a chain
    const tnt = BlockRegistry.getBlock('tnt');
    world.setBlock(0, 0, 1, tnt);
    world.setBlock(0, 0, 2, tnt);
    world.setBlock(0, 0, 3, tnt);

    const windCharge = new WindChargeEntity(world, player);
    windCharge.position = { x: 0, y: 0, z: 0 };
    windCharge.velocity = { x: 0, y: 0, z: 1 };

    // Simulate impact
    windCharge.tick();

    // Check for multiple explosion effects
    const events = world.getEvents();
    const explosionEvents = events.filter(e => e.event === 'explosion');
    expect(explosionEvents.length).to.be.greaterThan(1);
  });

  it('should trigger redstone chain reactions', () => {
    // Place redstone components in a chain
    const redstone = BlockRegistry.getBlock('redstone_wire');
    const repeater = BlockRegistry.getBlock('repeater');
    world.setBlock(0, 0, 1, redstone);
    world.setBlock(0, 0, 2, repeater);
    world.setBlock(0, 0, 3, redstone);

    const windCharge = new WindChargeEntity(world, player);
    windCharge.position = { x: 0, y: 0, z: 0 };
    windCharge.velocity = { x: 0, y: 0, z: 1 };

    // Simulate impact
    windCharge.tick();

    // Check for redstone activation events
    const events = world.getEvents();
    const activationEvents = events.filter(e => e.event === 'redstoneActivated');
    expect(activationEvents.length).to.be.greaterThan(1);
  });

  it('should trigger block transformation chains', () => {
    // Place transformable blocks in a chain
    const grass = BlockRegistry.getBlock('grass_block');
    world.setBlock(0, 0, 1, grass);
    world.setBlock(0, 0, 2, grass);
    world.setBlock(0, 0, 3, grass);

    const windCharge = new WindChargeEntity(world, player);
    windCharge.position = { x: 0, y: 0, z: 0 };
    windCharge.velocity = { x: 0, y: 0, z: 1 };

    // Simulate impact
    windCharge.tick();

    // Check for block transformation events
    const events = world.getEvents();
    const transformEvents = events.filter(e => e.event === 'blockTransformed');
    expect(transformEvents.length).to.be.greaterThan(1);
  });
}); 