/**
 * Netherite Recipes
 * Implements recipes for Netherite materials and equipment:
 * - Smelting Ancient Debris into Netherite Scrap
 * - Crafting Netherite Ingots from Netherite Scrap + Gold Ingots
 * - Smithing table recipes to upgrade Diamond gear to Netherite
 */

const CraftingManager = require('./craftingManager');
const SmithingManager = require('./smithingManager');
const FurnaceManager = require('./furnaceManager');

/**
 * Register all Netherite-related recipes
 * @param {CraftingManager} craftingManager - The crafting manager instance
 * @param {FurnaceManager} furnaceManager - The furnace manager instance
 * @param {SmithingManager} smithingManager - The smithing table manager instance
 */
function registerNetheriteRecipes(craftingManager, furnaceManager, smithingManager) {
  // Check if all managers are available
  if (!craftingManager || !furnaceManager || !smithingManager) {
    console.error('Cannot register Netherite recipes: One or more managers are missing');
    return;
  }
  
  registerSmeltingRecipes(furnaceManager);
  registerCraftingRecipes(craftingManager);
  registerSmithingRecipes(smithingManager);
}

/**
 * Register Netherite smelting recipes
 * @param {FurnaceManager} furnaceManager - The furnace manager instance
 */
function registerSmeltingRecipes(furnaceManager) {
  // Smelt Ancient Debris into Netherite Scrap
  furnaceManager.registerRecipe({
    input: 'ancient_debris',
    output: { id: 'netherite_scrap', count: 1 },
    experience: 2.0, // High XP reward
    cookingTime: 200 // Takes longer to smelt
  });
  
  // Register the same recipe for blast furnace (faster smelting)
  furnaceManager.registerBlastFurnaceRecipe({
    input: 'ancient_debris',
    output: { id: 'netherite_scrap', count: 1 },
    experience: 2.0,
    cookingTime: 100 // Blast furnace is 2x faster
  });
}

/**
 * Register Netherite crafting recipes
 * @param {CraftingManager} craftingManager - The crafting manager instance
 */
function registerCraftingRecipes(craftingManager) {
  // Craft Netherite Ingot (4 Netherite Scrap + 4 Gold Ingots)
  craftingManager.registerShapelessRecipe({
    ingredients: [
      { id: 'netherite_scrap', count: 4 },
      { id: 'gold_ingot', count: 4 }
    ],
    result: { id: 'netherite_ingot', count: 1 },
    category: 'MISC'
  });
}

/**
 * Register Netherite smithing recipes
 * @param {SmithingManager} smithingManager - The smithing table manager instance
 */
function registerSmithingRecipes(smithingManager) {
  // Smithing table recipes - Base item + Netherite Ingot = Netherite item
  // Tools
  smithingManager.registerRecipe({
    baseItem: 'diamond_sword',
    additionItem: 'netherite_ingot',
    result: 'netherite_sword'
  });
  
  smithingManager.registerRecipe({
    baseItem: 'diamond_pickaxe',
    additionItem: 'netherite_ingot',
    result: 'netherite_pickaxe'
  });
  
  smithingManager.registerRecipe({
    baseItem: 'diamond_axe',
    additionItem: 'netherite_ingot',
    result: 'netherite_axe'
  });
  
  smithingManager.registerRecipe({
    baseItem: 'diamond_shovel',
    additionItem: 'netherite_ingot',
    result: 'netherite_shovel'
  });
  
  smithingManager.registerRecipe({
    baseItem: 'diamond_hoe',
    additionItem: 'netherite_ingot',
    result: 'netherite_hoe'
  });
  
  // Armor
  smithingManager.registerRecipe({
    baseItem: 'diamond_helmet',
    additionItem: 'netherite_ingot',
    result: 'netherite_helmet'
  });
  
  smithingManager.registerRecipe({
    baseItem: 'diamond_chestplate',
    additionItem: 'netherite_ingot',
    result: 'netherite_chestplate'
  });
  
  smithingManager.registerRecipe({
    baseItem: 'diamond_leggings',
    additionItem: 'netherite_ingot',
    result: 'netherite_leggings'
  });
  
  smithingManager.registerRecipe({
    baseItem: 'diamond_boots',
    additionItem: 'netherite_ingot',
    result: 'netherite_boots'
  });
}

/**
 * Special handling for preserving enchantments and durability when upgrading
 * to Netherite equipment through the smithing table
 * @param {Object} baseItem - The original Diamond item
 * @param {Object} resultItem - The new Netherite item
 * @returns {Object} The modified result item with transferred properties
 */
function transferItemProperties(baseItem, resultItem) {
  if (!baseItem || !resultItem) return resultItem;
  
  // Copy enchantments
  if (baseItem.enchantments) {
    resultItem.enchantments = { ...baseItem.enchantments };
  }
  
  // Transfer custom name if present
  if (baseItem.customName) {
    resultItem.customName = baseItem.customName;
  }
  
  // Calculate proportional durability
  if (baseItem.durability !== undefined && baseItem.maxDurability !== undefined) {
    const durabilityPercentage = baseItem.durability / baseItem.maxDurability;
    resultItem.durability = Math.floor(resultItem.maxDurability * durabilityPercentage);
  }
  
  // Transfer lore/description
  if (baseItem.lore) {
    resultItem.lore = [...baseItem.lore];
  }
  
  return resultItem;
}

/**
 * Initialize the smithing recipe handlers to preserve enchantments and durability
 * @param {SmithingManager} smithingManager - The smithing table manager instance
 */
function initializeSmithingHandlers(smithingManager) {
  // Register a pre-craft handler to transfer properties from base item to result
  smithingManager.registerPreCraftHandler((recipe, baseItem) => {
    // Only handle Netherite upgrade recipes
    if (recipe.additionItem === 'netherite_ingot') {
      // Register that this recipe should transfer properties
      recipe.transferProperties = true;
    }
    return true; // Allow crafting to proceed
  });
  
  // Register a post-craft handler to apply the property transfer
  smithingManager.registerPostCraftHandler((recipe, baseItem, resultItem) => {
    if (recipe.transferProperties) {
      return transferItemProperties(baseItem, resultItem);
    }
    return resultItem;
  });
}

module.exports = {
  registerNetheriteRecipes,
  registerSmeltingRecipes,
  registerCraftingRecipes,
  registerSmithingRecipes,
  initializeSmithingHandlers,
  transferItemProperties
}; 