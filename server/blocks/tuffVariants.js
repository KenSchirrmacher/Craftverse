const Block = require('./block');
const BlockRegistry = require('../registry/blockRegistry');

/**
 * Base class for Tuff variant blocks
 */
class TuffVariantBlock extends Block {
  constructor(id, name, properties = {}) {
    super(id, name, {
      hardness: 1.5,
      resistance: 6.0,
      ...properties
    });
  }
}

/**
 * Chiseled Tuff block
 */
class ChiseledTuffBlock extends TuffVariantBlock {
  constructor() {
    super('chiseled_tuff', 'Chiseled Tuff', {
      transparent: false,
      lightLevel: 0,
      blastResistance: 6.0
    });
  }

  getDrops() {
    return [{ id: 'chiseled_tuff', count: 1 }];
  }
}

/**
 * Tuff Bricks block
 */
class TuffBricksBlock extends TuffVariantBlock {
  constructor() {
    super('tuff_bricks', 'Tuff Bricks', {
      transparent: false,
      lightLevel: 0,
      blastResistance: 6.0
    });
  }

  getDrops() {
    return [{ id: 'tuff_bricks', count: 1 }];
  }
}

/**
 * Tuff Brick Slab block
 */
class TuffBrickSlabBlock extends TuffVariantBlock {
  constructor() {
    super('tuff_brick_slab', 'Tuff Brick Slab', {
      transparent: false,
      lightLevel: 0,
      blastResistance: 6.0,
      isSlab: true
    });
  }

  getDrops() {
    return [{ id: 'tuff_brick_slab', count: 1 }];
  }
}

/**
 * Tuff Brick Stairs block
 */
class TuffBrickStairsBlock extends TuffVariantBlock {
  constructor() {
    super('tuff_brick_stairs', 'Tuff Brick Stairs', {
      transparent: false,
      lightLevel: 0,
      blastResistance: 6.0,
      isStairs: true
    });
  }

  getDrops() {
    return [{ id: 'tuff_brick_stairs', count: 1 }];
  }
}

/**
 * Tuff Brick Wall block
 */
class TuffBrickWallBlock extends TuffVariantBlock {
  constructor() {
    super('tuff_brick_wall', 'Tuff Brick Wall', {
      transparent: false,
      lightLevel: 0,
      blastResistance: 6.0,
      isWall: true
    });
  }

  getDrops() {
    return [{ id: 'tuff_brick_wall', count: 1 }];
  }
}

// Register all Tuff variant blocks
BlockRegistry.register(new ChiseledTuffBlock());
BlockRegistry.register(new TuffBricksBlock());
BlockRegistry.register(new TuffBrickSlabBlock());
BlockRegistry.register(new TuffBrickStairsBlock());
BlockRegistry.register(new TuffBrickWallBlock());

module.exports = {
  ChiseledTuffBlock,
  TuffBricksBlock,
  TuffBrickSlabBlock,
  TuffBrickStairsBlock,
  TuffBrickWallBlock
}; 