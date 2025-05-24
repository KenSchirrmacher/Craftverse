/**
 * Crafting recipes for Tuff variants
 * Part of the 1.21 Tricky Trials update
 */

const { recipeRegistry } = require('../registry/recipeRegistry');
const { stonecutterRegistry } = require('../registry/stonecutterRegistry');

// Register crafting recipes
recipeRegistry.registerRecipe({
  id: 'tuff_bricks',
  type: 'shaped',
  pattern: [
    ['tuff', 'tuff'],
    ['tuff', 'tuff']
  ],
  result: {
    id: 'tuff_bricks',
    count: 4
  }
});

recipeRegistry.registerRecipe({
  id: 'tuff_brick_slab',
  type: 'shaped',
  pattern: [
    ['tuff_bricks', 'tuff_bricks', 'tuff_bricks']
  ],
  result: {
    id: 'tuff_brick_slab',
    count: 6
  }
});

recipeRegistry.registerRecipe({
  id: 'tuff_brick_stairs',
  type: 'shaped',
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

recipeRegistry.registerRecipe({
  id: 'tuff_brick_wall',
  type: 'shaped',
  pattern: [
    ['tuff_bricks', 'tuff_bricks', 'tuff_bricks'],
    ['tuff_bricks', 'tuff_bricks', 'tuff_bricks']
  ],
  result: {
    id: 'tuff_brick_wall',
    count: 6
  }
});

recipeRegistry.registerRecipe({
  id: 'chiseled_tuff',
  type: 'shaped',
  pattern: [
    ['tuff_bricks', 'tuff_bricks'],
    ['tuff_bricks', 'tuff_bricks']
  ],
  result: {
    id: 'chiseled_tuff',
    count: 1
  }
});

// Register stonecutter recipes
stonecutterRegistry.registerRecipe({
  id: 'tuff_to_bricks',
  input: 'tuff',
  result: {
    id: 'tuff_bricks',
    count: 1
  }
});

stonecutterRegistry.registerRecipe({
  id: 'tuff_bricks_to_slab',
  input: 'tuff_bricks',
  result: {
    id: 'tuff_brick_slab',
    count: 2
  }
});

stonecutterRegistry.registerRecipe({
  id: 'tuff_bricks_to_stairs',
  input: 'tuff_bricks',
  result: {
    id: 'tuff_brick_stairs',
    count: 1
  }
});

stonecutterRegistry.registerRecipe({
  id: 'tuff_bricks_to_wall',
  input: 'tuff_bricks',
  result: {
    id: 'tuff_brick_wall',
    count: 1
  }
});

stonecutterRegistry.registerRecipe({
  id: 'tuff_bricks_to_chiseled',
  input: 'tuff_bricks',
  result: {
    id: 'chiseled_tuff',
    count: 1
  }
}); 