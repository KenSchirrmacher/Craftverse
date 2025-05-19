const RecipeRegistry = require('../registry/recipeRegistry');
const { TuffBricksBlock, TuffBrickSlabBlock, TuffBrickStairsBlock, TuffBrickWallBlock } = require('../blocks/tuffVariants');

/**
 * Register all Tuff variant crafting recipes
 */
function registerTuffVariantRecipes() {
  // Tuff Bricks recipe (2x2 tuff)
  RecipeRegistry.registerShapedRecipe({
    id: 'tuff_bricks',
    pattern: [
      ['tuff', 'tuff'],
      ['tuff', 'tuff']
    ],
    result: {
      id: 'tuff_bricks',
      count: 4
    }
  });

  // Tuff Brick Slab recipe (3 tuff bricks in a row)
  RecipeRegistry.registerShapedRecipe({
    id: 'tuff_brick_slab',
    pattern: [
      ['tuff_bricks', 'tuff_bricks', 'tuff_bricks']
    ],
    result: {
      id: 'tuff_brick_slab',
      count: 6
    }
  });

  // Tuff Brick Stairs recipe (3 tuff bricks in stairs pattern)
  RecipeRegistry.registerShapedRecipe({
    id: 'tuff_brick_stairs',
    pattern: [
      ['tuff_bricks', '', ''],
      ['tuff_bricks', 'tuff_bricks', ''],
      ['tuff_bricks', 'tuff_bricks', 'tuff_bricks']
    ],
    result: {
      id: 'tuff_brick_stairs',
      count: 4
    }
  });

  // Tuff Brick Wall recipe (6 tuff bricks in wall pattern)
  RecipeRegistry.registerShapedRecipe({
    id: 'tuff_brick_wall',
    pattern: [
      ['tuff_bricks', 'tuff_bricks', 'tuff_bricks'],
      ['tuff_bricks', 'tuff_bricks', 'tuff_bricks']
    ],
    result: {
      id: 'tuff_brick_wall',
      count: 6
    }
  });

  // Chiseled Tuff recipe (2 tuff brick slabs)
  RecipeRegistry.registerShapedRecipe({
    id: 'chiseled_tuff',
    pattern: [
      ['tuff_brick_slab'],
      ['tuff_brick_slab']
    ],
    result: {
      id: 'chiseled_tuff',
      count: 1
    }
  });
}

module.exports = {
  registerTuffVariantRecipes
}; 