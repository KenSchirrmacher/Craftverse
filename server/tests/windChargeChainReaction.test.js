const { WindChargeEntity } = require('../entities/windCharge');
const World = require('../world/world');
const { BlockRegistry } = require('../blocks/blockRegistry');
const Block = require('../blocks/baseBlock');

describe('Wind Charge Chain Reaction Tests', () => {
  let world;
  let blockRegistry;
  let windCharge;

  beforeEach(() => {
    world = new World();
    blockRegistry = new BlockRegistry();
    world.blockRegistry = blockRegistry; // Connect block registry to world
    windCharge = new WindChargeEntity(world, { x: 0, y: 0, z: 0 });
  });

  test('should create chain reaction when hitting multiple wind charges', () => {
    // Place multiple wind charges in a line
    const positions = [
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 }
    ];

    const windCharges = positions.map(pos => {
      const charge = new WindChargeEntity(world, pos);
      world.addEntity(charge);
      return charge;
    });

    // Trigger the first wind charge
    windCharge.explode();

    // Verify that all wind charges in the chain exploded
    windCharges.forEach(charge => {
      expect(charge.hasExploded).toBe(true);
    });
  });

  test('should not create chain reaction through solid blocks', () => {
    // Create a solid stone block
    const stoneBlock = new Block({
      id: 'stone',
      name: 'Stone',
      solid: true,
      hardness: 1.5,
      blastResistance: 6.0
    });

    // Register the block
    blockRegistry.registerBlock(stoneBlock);

    // Place the solid block between wind charges
    world.setBlock(1, 0, 0, stoneBlock);

    // Place wind charges on both sides of the block
    const windCharge1 = new WindChargeEntity(world, { x: 0, y: 0, z: 0 });
    const windCharge2 = new WindChargeEntity(world, { x: 2, y: 0, z: 0 });
    world.addEntity(windCharge1);
    world.addEntity(windCharge2);

    // Verify the block is solid
    const placedBlock = world.getBlock(1, 0, 0);
    expect(placedBlock).toBeDefined();
    expect(placedBlock.solid).toBe(true);

    // Trigger the first wind charge
    windCharge1.explode();

    // Verify that only the first wind charge exploded
    expect(windCharge1.hasExploded).toBe(true);
    expect(windCharge2.hasExploded).toBe(false);
  });

  test('should create visual and audio effects during chain reaction', () => {
    // Place multiple wind charges
    const positions = [
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 }
    ];

    const windCharges = positions.map(pos => {
      const charge = new WindChargeEntity(world, pos);
      world.addEntity(charge);
      return charge;
    });

    // Mock the visual and audio effect methods
    const visualEffects = [];
    const audioEffects = [];
    windCharges.forEach(charge => {
      charge.createVisualEffect = jest.fn();
      charge.createAudioEffect = jest.fn();
    });

    // Trigger the chain reaction
    windCharge.explode();

    // Verify that visual and audio effects were created for each explosion
    windCharges.forEach(charge => {
      expect(charge.createVisualEffect).toHaveBeenCalled();
      expect(charge.createAudioEffect).toHaveBeenCalled();
    });
  });
}); 