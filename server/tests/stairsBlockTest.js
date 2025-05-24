const assert = require('assert');
const StairsBlock = require('../blocks/stairsBlock');

class MockWorld {
  constructor() {
    this.blocks = new Map();
  }

  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks.get(key) || null;
  }

  setBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    this.blocks.set(key, block);
  }
}

describe('StairsBlock', () => {
  let world;
  let stairsBlock;

  beforeEach(() => {
    world = new MockWorld();
    stairsBlock = new StairsBlock({
      id: 'test_stairs',
      name: 'Test Stairs',
      hardness: 2.0,
      resistance: 6.0,
      material: 'stone'
    });
  });

  describe('constructor', () => {
    it('should create a proper stairs instance', () => {
      assert.strictEqual(stairsBlock.id, 'test_stairs');
      assert.strictEqual(stairsBlock.name, 'Test Stairs');
      assert.strictEqual(stairsBlock.hardness, 2.0);
      assert.strictEqual(stairsBlock.resistance, 6.0);
      assert.strictEqual(stairsBlock.material, 'stone');
      assert.strictEqual(stairsBlock.facing, 'north');
      assert.strictEqual(stairsBlock.half, 'bottom');
      assert.strictEqual(stairsBlock.shape, 'straight');
      assert.strictEqual(stairsBlock.waterlogged, false);
    });
  });

  describe('getState', () => {
    it('should return the current state', () => {
      const state = stairsBlock.getState();
      assert.deepStrictEqual(state, {
        id: 'test_stairs',
        name: 'Test Stairs',
        hardness: 2.0,
        resistance: 6.0,
        material: 'stone',
        isTransparent: false,
        isSolid: true,
        isStairs: true,
        facing: 'north',
        half: 'bottom',
        shape: 'straight',
        waterlogged: false
      });
    });
  });

  describe('setState', () => {
    it('should update the state', () => {
      stairsBlock.setState({
        facing: 'east',
        half: 'top',
        shape: 'inner_left',
        waterlogged: true
      });

      assert.strictEqual(stairsBlock.facing, 'east');
      assert.strictEqual(stairsBlock.half, 'top');
      assert.strictEqual(stairsBlock.shape, 'inner_left');
      assert.strictEqual(stairsBlock.waterlogged, true);
    });
  });

  describe('canPlaceAt', () => {
    it('should allow placement on air', () => {
      assert.strictEqual(stairsBlock.canPlaceAt(world, 0, 0, 0, 0), true);
    });

    it('should not allow placement on non-solid blocks', () => {
      const nonSolidBlock = { isSolid: false };
      world.setBlock(0, 0, 0, nonSolidBlock);
      assert.strictEqual(stairsBlock.canPlaceAt(world, 0, 0, 0, 0), false);
    });
  });

  describe('onPlace', () => {
    it('should set facing based on cursor position', () => {
      stairsBlock.onPlace(world, 0, 0, 0, 0, 1, 0, 0);
      assert.strictEqual(stairsBlock.facing, 'east');

      stairsBlock.onPlace(world, 0, 0, 0, 0, -1, 0, 0);
      assert.strictEqual(stairsBlock.facing, 'west');

      stairsBlock.onPlace(world, 0, 0, 0, 0, 0, 0, 1);
      assert.strictEqual(stairsBlock.facing, 'south');

      stairsBlock.onPlace(world, 0, 0, 0, 0, 0, 0, -1);
      assert.strictEqual(stairsBlock.facing, 'north');
    });

    it('should set half based on cursor Y position', () => {
      stairsBlock.onPlace(world, 0, 0, 0, 0, 0, 0.6, 0);
      assert.strictEqual(stairsBlock.half, 'top');

      stairsBlock.onPlace(world, 0, 0, 0, 0, 0, 0.4, 0);
      assert.strictEqual(stairsBlock.half, 'bottom');
    });
  });

  describe('updateShape', () => {
    it('should set shape to straight by default', () => {
      stairsBlock.updateShape(world, 0, 0, 0);
      assert.strictEqual(stairsBlock.shape, 'straight');
    });

    it('should set shape to inner_left when adjacent to right-facing stairs', () => {
      const rightStairs = new StairsBlock({ facing: 'east' });
      world.setBlock(-1, 0, 0, rightStairs);
      stairsBlock.facing = 'north';
      stairsBlock.half = 'bottom';
      stairsBlock.updateShape(world, 0, 0, 0);
      assert.strictEqual(stairsBlock.shape, 'inner_left');
    });

    it('should set shape to outer_left when adjacent to right-facing stairs and half is top', () => {
      const rightStairs = new StairsBlock({ facing: 'east' });
      world.setBlock(-1, 0, 0, rightStairs);
      stairsBlock.facing = 'north';
      stairsBlock.half = 'top';
      stairsBlock.updateShape(world, 0, 0, 0);
      assert.strictEqual(stairsBlock.shape, 'outer_left');
    });
  });

  describe('getCollisionBox', () => {
    it('should return full height for inner corners', () => {
      stairsBlock.shape = 'inner_left';
      const box = stairsBlock.getCollisionBox();
      assert.strictEqual(box.maxY, 1);
    });

    it('should return half height for outer corners', () => {
      stairsBlock.shape = 'outer_left';
      const box = stairsBlock.getCollisionBox();
      assert.strictEqual(box.maxY, 0.5);
    });

    it('should return half height for straight stairs', () => {
      stairsBlock.shape = 'straight';
      const box = stairsBlock.getCollisionBox();
      assert.strictEqual(box.maxY, 0.5);
    });
  });

  describe('getSelectionBox', () => {
    it('should return the same box as getCollisionBox', () => {
      const collisionBox = stairsBlock.getCollisionBox();
      const selectionBox = stairsBlock.getSelectionBox();
      assert.deepStrictEqual(selectionBox, collisionBox);
    });
  });

  describe('getBoundingBox', () => {
    it('should return the same box as getCollisionBox', () => {
      const collisionBox = stairsBlock.getCollisionBox();
      const boundingBox = stairsBlock.getBoundingBox();
      assert.deepStrictEqual(boundingBox, collisionBox);
    });
  });
}); 