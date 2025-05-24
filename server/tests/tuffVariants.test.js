/**
 * Tests for Tuff Variant Blocks implementation
 * Verifies the functionality of tuff variants for the 1.21 Tricky Trials update
 */

const { blockRegistry } = require('../blocks/blockRegistry');
const ChiseledTuffBlock = require('../blocks/tuffVariantsBlocks').ChiseledTuffBlock;
const TuffBricksBlock = require('../blocks/tuffVariantsBlocks').TuffBricksBlock;
const TuffBrickSlabBlock = require('../blocks/tuffVariantsBlocks').TuffBrickSlabBlock;
const TuffBrickStairsBlock = require('../blocks/tuffVariantsBlocks').TuffBrickStairsBlock;
const TuffBrickWallBlock = require('../blocks/tuffVariantsBlocks').TuffBrickWallBlock;

describe('Tuff Variants Tests', () => {
  beforeEach(() => {
    // Reset block registry before each test
    blockRegistry.blocks.clear();
    blockRegistry.blockClasses.clear();
  });

  describe('Chiseled Tuff Block', () => {
    it('should have correct properties', () => {
      const block = new ChiseledTuffBlock();
      expect(block.id).toBe('chiseled_tuff');
      expect(block.name).toBe('Chiseled Tuff');
      expect(block.hardness).toBe(1.5);
      expect(block.blastResistance).toBe(6.0);
      expect(block.transparent).toBe(false);
      expect(block.lightLevel).toBe(0);
      expect(block.getDrops()).toHaveLength(1);
      expect(block.getDrops()[0].type).toBe('chiseled_tuff');
      expect(block.getDrops()[0].count).toBe(1);
    });
  });

  describe('Tuff Bricks Block', () => {
    it('should have correct properties', () => {
      const block = new TuffBricksBlock();
      expect(block.id).toBe('tuff_bricks');
      expect(block.name).toBe('Tuff Bricks');
      expect(block.hardness).toBe(1.5);
      expect(block.blastResistance).toBe(6.0);
      expect(block.transparent).toBe(false);
      expect(block.lightLevel).toBe(0);
      expect(block.getDrops()).toHaveLength(1);
      expect(block.getDrops()[0].type).toBe('tuff_bricks');
      expect(block.getDrops()[0].count).toBe(1);
    });
  });

  describe('Tuff Brick Slab Block', () => {
    it('should have correct properties', () => {
      const block = new TuffBrickSlabBlock();
      expect(block.id).toBe('tuff_brick_slab');
      expect(block.name).toBe('Tuff Brick Slab');
      expect(block.hardness).toBe(1.5);
      expect(block.blastResistance).toBe(6.0);
      expect(block.transparent).toBe(true);
      expect(block.lightLevel).toBe(0);
      expect(block.getDrops()).toHaveLength(1);
      expect(block.getDrops()[0].type).toBe('tuff_brick_slab');
      expect(block.getDrops()[0].count).toBe(1);
    });
  });

  describe('Tuff Brick Stairs Block', () => {
    it('should have correct properties', () => {
      const block = new TuffBrickStairsBlock();
      expect(block.id).toBe('tuff_brick_stairs');
      expect(block.name).toBe('Tuff Brick Stairs');
      expect(block.hardness).toBe(1.5);
      expect(block.blastResistance).toBe(6.0);
      expect(block.transparent).toBe(true);
      expect(block.lightLevel).toBe(0);
      expect(block.getDrops()).toHaveLength(1);
      expect(block.getDrops()[0].type).toBe('tuff_brick_stairs');
      expect(block.getDrops()[0].count).toBe(1);
    });
  });

  describe('Tuff Brick Wall Block', () => {
    it('should have correct properties', () => {
      const block = new TuffBrickWallBlock();
      expect(block.id).toBe('tuff_brick_wall');
      expect(block.name).toBe('Tuff Brick Wall');
      expect(block.hardness).toBe(1.5);
      expect(block.blastResistance).toBe(6.0);
      expect(block.transparent).toBe(true);
      expect(block.lightLevel).toBe(0);
      expect(block.getDrops()).toHaveLength(1);
      expect(block.getDrops()[0].type).toBe('tuff_brick_wall');
      expect(block.getDrops()[0].count).toBe(1);
    });
  });

  describe('Block Registry Integration', () => {
    it('should register and retrieve tuff variant blocks', () => {
      // Register the blocks
      blockRegistry.registerBlock(new ChiseledTuffBlock());
      blockRegistry.registerBlock(new TuffBricksBlock());
      blockRegistry.registerBlock(new TuffBrickSlabBlock());
      blockRegistry.registerBlock(new TuffBrickStairsBlock());
      blockRegistry.registerBlock(new TuffBrickWallBlock());

      // Verify blocks are registered
      expect(blockRegistry.getBlock('chiseled_tuff')).toBeInstanceOf(ChiseledTuffBlock);
      expect(blockRegistry.getBlock('tuff_bricks')).toBeInstanceOf(TuffBricksBlock);
      expect(blockRegistry.getBlock('tuff_brick_slab')).toBeInstanceOf(TuffBrickSlabBlock);
      expect(blockRegistry.getBlock('tuff_brick_stairs')).toBeInstanceOf(TuffBrickStairsBlock);
      expect(blockRegistry.getBlock('tuff_brick_wall')).toBeInstanceOf(TuffBrickWallBlock);
    });

    it('should create new instances of tuff variant blocks', () => {
      // Register the blocks
      blockRegistry.registerBlock(new ChiseledTuffBlock());
      blockRegistry.registerBlock(new TuffBricksBlock());
      blockRegistry.registerBlock(new TuffBrickSlabBlock());
      blockRegistry.registerBlock(new TuffBrickStairsBlock());
      blockRegistry.registerBlock(new TuffBrickWallBlock());

      // Create new instances
      const chiseledTuff = blockRegistry.createBlock('chiseled_tuff');
      const tuffBricks = blockRegistry.createBlock('tuff_bricks');
      const tuffBrickSlab = blockRegistry.createBlock('tuff_brick_slab');
      const tuffBrickStairs = blockRegistry.createBlock('tuff_brick_stairs');
      const tuffBrickWall = blockRegistry.createBlock('tuff_brick_wall');

      // Verify instances
      expect(chiseledTuff).toBeInstanceOf(ChiseledTuffBlock);
      expect(tuffBricks).toBeInstanceOf(TuffBricksBlock);
      expect(tuffBrickSlab).toBeInstanceOf(TuffBrickSlabBlock);
      expect(tuffBrickStairs).toBeInstanceOf(TuffBrickStairsBlock);
      expect(tuffBrickWall).toBeInstanceOf(TuffBrickWallBlock);
    });
  });
}); 