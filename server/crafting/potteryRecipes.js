/**
 * PotteryRecipes - Defines crafting recipes for the pottery system
 * Part of the Trails & Tales Update
 */

/**
 * Register pottery system crafting recipes
 * @param {Object} craftingManager - The crafting manager instance
 */
function registerPotteryRecipes(craftingManager) {
  if (!craftingManager) return;
  
  // Register recipe for pot base (4 clay balls)
  craftingManager.registerRecipe({
    id: 'pot_base_recipe',
    type: 'shaped',
    pattern: [
      'C C',
      'C C',
      '   '
    ],
    ingredients: {
      'C': { type: 'clay_ball' }
    },
    result: {
      item: 'pot_base',
      count: 1
    }
  });
  
  // Register recipe for basic decorated pot (1 pot base)
  craftingManager.registerRecipe({
    id: 'decorated_pot_basic_recipe',
    type: 'shaped',
    pattern: [
      '   ',
      ' P ',
      '   '
    ],
    ingredients: {
      'P': { type: 'pot_base' }
    },
    result: {
      item: 'decorated_pot',
      count: 1
    }
  });
  
  // Register recipe for decorated pot with 1 sherd (north position)
  craftingManager.registerRecipe({
    id: 'decorated_pot_north_recipe',
    type: 'shaped',
    pattern: [
      ' S ',
      ' P ',
      '   '
    ],
    ingredients: {
      'P': { type: 'pot_base' },
      'S': { type: 'pottery_sherd', isGeneric: true }
    },
    result: {
      item: 'decorated_pot',
      count: 1,
      configureItem: (output, inputs) => configurePotWithSherds(output, inputs, 'north')
    }
  });
  
  // Register recipe for decorated pot with 1 sherd (east position)
  craftingManager.registerRecipe({
    id: 'decorated_pot_east_recipe',
    type: 'shaped',
    pattern: [
      '   ',
      ' PS',
      '   '
    ],
    ingredients: {
      'P': { type: 'pot_base' },
      'S': { type: 'pottery_sherd', isGeneric: true }
    },
    result: {
      item: 'decorated_pot',
      count: 1,
      configureItem: (output, inputs) => configurePotWithSherds(output, inputs, 'east')
    }
  });
  
  // Register recipe for decorated pot with 1 sherd (south position)
  craftingManager.registerRecipe({
    id: 'decorated_pot_south_recipe',
    type: 'shaped',
    pattern: [
      '   ',
      ' P ',
      ' S '
    ],
    ingredients: {
      'P': { type: 'pot_base' },
      'S': { type: 'pottery_sherd', isGeneric: true }
    },
    result: {
      item: 'decorated_pot',
      count: 1,
      configureItem: (output, inputs) => configurePotWithSherds(output, inputs, 'south')
    }
  });
  
  // Register recipe for decorated pot with 1 sherd (west position)
  craftingManager.registerRecipe({
    id: 'decorated_pot_west_recipe',
    type: 'shaped',
    pattern: [
      '   ',
      'SP ',
      '   '
    ],
    ingredients: {
      'P': { type: 'pot_base' },
      'S': { type: 'pottery_sherd', isGeneric: true }
    },
    result: {
      item: 'decorated_pot',
      count: 1,
      configureItem: (output, inputs) => configurePotWithSherds(output, inputs, 'west')
    }
  });
  
  // Register recipe for fully decorated pot (4 sherds)
  craftingManager.registerRecipe({
    id: 'decorated_pot_full_recipe',
    type: 'shaped',
    pattern: [
      ' N ',
      'WPE',
      ' S '
    ],
    ingredients: {
      'P': { type: 'pot_base' },
      'N': { type: 'pottery_sherd', isGeneric: true },
      'E': { type: 'pottery_sherd', isGeneric: true },
      'S': { type: 'pottery_sherd', isGeneric: true },
      'W': { type: 'pottery_sherd', isGeneric: true }
    },
    result: {
      item: 'decorated_pot',
      count: 1,
      configureItem: (output, inputs) => configurePotWithSherds(output, inputs, 'all')
    }
  });
}

/**
 * Configure a decorated pot item with the appropriate sherds
 * @param {Object} output - The output item
 * @param {Array} inputs - The input items from the crafting grid
 * @param {string} position - Which position to apply the sherd to (north, east, south, west, or all)
 * @returns {Object} - The configured decorated pot item
 * @private
 */
function configurePotWithSherds(output, inputs, position) {
  // Default sherds (all blank)
  const sherds = {
    north: null,
    east: null,
    south: null,
    west: null
  };
  
  // If applying to all sides
  if (position === 'all') {
    // Find the sherd in each position
    for (const input of inputs) {
      if (!input || !input.type.startsWith('pottery_sherd_')) continue;
      
      const position = getPositionFromCraftingGrid(input.gridPosition);
      if (position) {
        sherds[position] = input.type.replace('pottery_sherd_', '');
      }
    }
  } 
  // If applying to a specific side
  else if (position === 'north' || position === 'east' || 
           position === 'south' || position === 'west') {
    // Find the sherd in any position
    for (const input of inputs) {
      if (!input || !input.type.startsWith('pottery_sherd_')) continue;
      
      sherds[position] = input.type.replace('pottery_sherd_', '');
      break;
    }
  }
  
  // Return the configured pot
  return {
    ...output,
    sherds,
    hasCustomSherds: true
  };
}

/**
 * Get the pot position from a grid position
 * @param {Object} gridPosition - The position in the crafting grid
 * @returns {string|null} - The side of the pot (north, east, south, west) or null
 * @private
 */
function getPositionFromCraftingGrid(gridPosition) {
  if (!gridPosition) return null;
  
  // Middle row, left position
  if (gridPosition.row === 1 && gridPosition.col === 0) {
    return 'west';
  }
  // Middle row, right position
  else if (gridPosition.row === 1 && gridPosition.col === 2) {
    return 'east';
  }
  // Top row, middle position
  else if (gridPosition.row === 0 && gridPosition.col === 1) {
    return 'north';
  }
  // Bottom row, middle position
  else if (gridPosition.row === 2 && gridPosition.col === 1) {
    return 'south';
  }
  
  return null;
}

module.exports = {
  registerPotteryRecipes
}; 