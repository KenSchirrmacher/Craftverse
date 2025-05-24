/**
 * Tests for Tuff Variant Blocks implementation
 * Verifies the functionality of tuff variants for the 1.21 Tricky Trials update
 */

const { 
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
} = require('../blocks/tuffVariantsBlocks');
const BlockRegistry = require('../blocks/blockRegistry');
const World = require('../world/world');

describe('Tuff Variants Tests', () => {
  let world;

  beforeEach(() => {
    world = new World();
  });

  test('Chiseled Tuff block properties and behavior', () => {
    const block = new ChiseledTuffBlock();

    // Test basic properties
    expect(block.id).toBe('chiseled_tuff');
    expect(block.name).toBe('Chiseled Tuff');
    expect(block.hardness).toBe(1.5);
    expect(block.resistance).toBe(6.0);
    expect(block.transparent).toBe(false);
    expect(block.lightLevel).toBe(0);

    // Test drops
    const drops = block.getDrops();
    expect(drops.length).toBe(1);
    expect(drops[0].id).toBe('chiseled_tuff');
    expect(drops[0].count).toBe(1);

    // Test placement
    world.setBlockAt(0, 0, 0, 'chiseled_tuff');
    const placedBlock = world.getBlockAt(0, 0, 0);
    expect(placedBlock.type).toBe('chiseled_tuff');
  });

  test('Tuff Bricks block properties and behavior', () => {
    const block = new TuffBricksBlock();

    // Test basic properties
    expect(block.id).toBe('tuff_bricks');
    expect(block.name).toBe('Tuff Bricks');
    expect(block.hardness).toBe(1.5);
    expect(block.resistance).toBe(6.0);
    expect(block.transparent).toBe(false);
    expect(block.lightLevel).toBe(0);

    // Test drops
    const drops = block.getDrops();
    expect(drops.length).toBe(1);
    expect(drops[0].id).toBe('tuff_bricks');
    expect(drops[0].count).toBe(1);

    // Test placement
    world.setBlockAt(0, 0, 0, 'tuff_bricks');
    const placedBlock = world.getBlockAt(0, 0, 0);
    expect(placedBlock.type).toBe('tuff_bricks');
  });

  test('Tuff Brick Slab block properties and behavior', () => {
    const block = new TuffBrickSlabBlock();

    // Test basic properties
    expect(block.id).toBe('tuff_brick_slab');
    expect(block.name).toBe('Tuff Brick Slab');
    expect(block.hardness).toBe(1.5);
    expect(block.resistance).toBe(6.0);
    expect(block.transparent).toBe(false);
    expect(block.lightLevel).toBe(0);
    expect(block.isSlab).toBe(true);

    // Test drops
    const drops = block.getDrops();
    expect(drops.length).toBe(1);
    expect(drops[0].id).toBe('tuff_brick_slab');
    expect(drops[0].count).toBe(1);

    // Test placement
    world.setBlockAt(0, 0, 0, 'tuff_brick_slab');
    const placedBlock = world.getBlockAt(0, 0, 0);
    expect(placedBlock.type).toBe('tuff_brick_slab');
  });

  test('Tuff Brick Stairs block properties and behavior', () => {
    const block = new TuffBrickStairsBlock();

    // Test basic properties
    expect(block.id).toBe('tuff_brick_stairs');
    expect(block.name).toBe('Tuff Brick Stairs');
    expect(block.hardness).toBe(1.5);
    expect(block.resistance).toBe(6.0);
    expect(block.transparent).toBe(false);
    expect(block.lightLevel).toBe(0);
    expect(block.isStairs).toBe(true);

    // Test drops
    const drops = block.getDrops();
    expect(drops.length).toBe(1);
    expect(drops[0].id).toBe('tuff_brick_stairs');
    expect(drops[0].count).toBe(1);

    // Test placement
    world.setBlockAt(0, 0, 0, 'tuff_brick_stairs');
    const placedBlock = world.getBlockAt(0, 0, 0);
    expect(placedBlock.type).toBe('tuff_brick_stairs');
  });

  test('Tuff Brick Wall block properties and behavior', () => {
    const block = new TuffBrickWallBlock();

    // Test basic properties
    expect(block.id).toBe('tuff_brick_wall');
    expect(block.name).toBe('Tuff Brick Wall');
    expect(block.hardness).toBe(1.5);
    expect(block.resistance).toBe(6.0);
    expect(block.transparent).toBe(false);
    expect(block.lightLevel).toBe(0);
    expect(block.isWall).toBe(true);

    // Test drops
    const drops = block.getDrops();
    expect(drops.length).toBe(1);
    expect(drops[0].id).toBe('tuff_brick_wall');
    expect(drops[0].count).toBe(1);

    // Test placement
    world.setBlockAt(0, 0, 0, 'tuff_brick_wall');
    const placedBlock = world.getBlockAt(0, 0, 0);
    expect(placedBlock.type).toBe('tuff_brick_wall');
  });

  test('Block Registry Integration', () => {
    // Test block registration
    expect(BlockRegistry.getBlock('chiseled_tuff')).toBeDefined();
    expect(BlockRegistry.getBlock('tuff_bricks')).toBeDefined();
    expect(BlockRegistry.getBlock('tuff_brick_slab')).toBeDefined();
    expect(BlockRegistry.getBlock('tuff_brick_stairs')).toBeDefined();
    expect(BlockRegistry.getBlock('tuff_brick_wall')).toBeDefined();

    // Test block instantiation
    const chiseledTuff = BlockRegistry.createBlock('chiseled_tuff');
    const tuffBricks = BlockRegistry.createBlock('tuff_bricks');
    const tuffBrickSlab = BlockRegistry.createBlock('tuff_brick_slab');
    const tuffBrickStairs = BlockRegistry.createBlock('tuff_brick_stairs');
    const tuffBrickWall = BlockRegistry.createBlock('tuff_brick_wall');

    expect(chiseledTuff).toBeInstanceOf(ChiseledTuffBlock);
    expect(tuffBricks).toBeInstanceOf(TuffBricksBlock);
    expect(tuffBrickSlab).toBeInstanceOf(TuffBrickSlabBlock);
    expect(tuffBrickStairs).toBeInstanceOf(TuffBrickStairsBlock);
    expect(tuffBrickWall).toBeInstanceOf(TuffBrickWallBlock);
  });
}); 