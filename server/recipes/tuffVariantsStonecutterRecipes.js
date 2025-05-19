const StonecutterRegistry = require('../registry/stonecutterRegistry');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock } = require('../blocks/tuffVariants');

/**
 * Register all Tuff variant stonecutter recipes
 */
function registerTuffVariantStonecutterRecipes() {
  // Tuff to Tuff Bricks
  StonecutterRegistry.registerRecipe({
    id: 'tuff_to_bricks',
    input: 'tuff',
    result: {
      id: 'tuff_bricks',
      count: 1
    }
  });

  // Tuff Bricks to Slab
  StonecutterRegistry.registerRecipe({
    id: 'tuff_bricks_to_slab',
    input: 'tuff_bricks',
    result: {
      id: 'tuff_brick_slab',
      count: 2
    }
  });

  // Tuff Bricks to Stairs
  StonecutterRegistry.registerRecipe({
    id: 'tuff_bricks_to_stairs',
    input: 'tuff_bricks',
    result: {
      id: 'tuff_brick_stairs',
      count: 1
    }
  });

  // Tuff Bricks to Wall
  StonecutterRegistry.registerRecipe({
    id: 'tuff_bricks_to_wall',
    input: 'tuff_bricks',
    result: {
      id: 'tuff_brick_wall',
      count: 1
    }
  });

  // Tuff Bricks to Chiseled Tuff
  StonecutterRegistry.registerRecipe({
    id: 'tuff_bricks_to_chiseled',
    input: 'tuff_bricks',
    result: {
      id: 'chiseled_tuff',
      count: 1
    }
  });
}

module.exports = {
  registerTuffVariantStonecutterRecipes
}; 