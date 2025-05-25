/**
 * Block Interactions Test
 * Tests for block interactions with Wind Charge
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

describe('Wind Charge Block Interactions', () => {
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

  it('should break breakable blocks on impact', () => {
    const dirt = BlockRegistry.getBlock('dirt');
    world.setBlock(0, 0, 1, dirt);

    const windCharge = new WindChargeEntity(world, player);
    windCharge.position = { x: 0, y: 0, z: 0 };
    windCharge.velocity = { x: 0, y: 0, z: 1 };

    // Simulate impact
    windCharge.tick();

    // Check that block was broken
    expect(world.getBlock(0, 0, 1)).to.be.null;
    
    // Check for particle effects
    const events = world.getEvents();
    const particleEvents = events.filter(e => e.event === 'particle');
    expect(particleEvents.length).to.be.greaterThan(0);
  });

  it('should not break unbreakable blocks', () => {
    const bedrock = BlockRegistry.getBlock('bedrock');
    world.setBlock(0, 0, 1, bedrock);

    const windCharge = new WindChargeEntity(world, player);
    windCharge.position = { x: 0, y: 0, z: 0 };
    windCharge.velocity = { x: 0, y: 0, z: 1 };

    // Simulate impact
    windCharge.tick();

    // Check that block was not broken
    expect(world.getBlock(0, 0, 1)).to.equal(bedrock);
  });

  it('should activate blocks on impact', () => {
    const lever = BlockRegistry.getBlock('lever');
    world.setBlock(0, 0, 1, lever);

    const windCharge = new WindChargeEntity(world, player);
    windCharge.position = { x: 0, y: 0, z: 0 };
    windCharge.velocity = { x: 0, y: 0, z: 1 };

    // Simulate impact
    windCharge.tick();

    // Check that block was activated
    const events = world.getEvents();
    const activationEvents = events.filter(e => e.event === 'blockActivated');
    expect(activationEvents.length).to.be.greaterThan(0);
  });
}); 