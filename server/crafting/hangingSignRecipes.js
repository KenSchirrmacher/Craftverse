/**
 * HangingSignRecipes - Defines crafting recipes for hanging signs
 * Part of the Trails & Tales Update
 */

/**
 * Register hanging sign crafting recipes
 * @param {Object} craftingManager - The crafting manager instance
 */
function registerHangingSignRecipes(craftingManager) {
  if (!craftingManager) return;
  
  // Wood types supported for hanging signs
  const woodTypes = [
    'oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 
    'mangrove', 'cherry', 'bamboo', 'crimson', 'warped'
  ];
  
  // Register a recipe for each wood type
  for (const woodType of woodTypes) {
    registerHangingSignRecipe(craftingManager, woodType);
  }
}

/**
 * Register a crafting recipe for a specific wood type hanging sign
 * @param {Object} craftingManager - The crafting manager instance
 * @param {string} woodType - The type of wood (oak, spruce, etc.)
 * @private
 */
function registerHangingSignRecipe(craftingManager, woodType) {
  // Hanging sign recipe: 2 chains + 6 planks/stripped logs
  // Pattern:
  // C C
  // SSS
  // SSS
  // Where C = chain, S = stripped_log or planks
  
  craftingManager.registerRecipe({
    id: `${woodType}_hanging_sign_recipe`,
    type: 'shaped',
    pattern: [
      'C C',
      'SSS',
      'SSS'
    ],
    ingredients: {
      // Chains for hanging
      'C': { type: 'chain' },
      // Either stripped logs or planks can be used
      'S': [
        { type: `stripped_${woodType}_log` },
        { type: `${woodType}_planks` }
      ]
    },
    result: {
      item: `${woodType}_hanging_sign`,
      count: 6 // Yields 6 signs per craft
    },
    category: 'DECORATION'
  });
}

module.exports = {
  registerHangingSignRecipes
}; 