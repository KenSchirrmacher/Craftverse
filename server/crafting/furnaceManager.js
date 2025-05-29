/**
 * FurnaceManager - Handles furnace operations including smelting, fuel consumption, and recipe management
 */

const { ItemStack } = require('../items/itemStack');
const { ItemType } = require('../items/itemType');

class FurnaceManager {
  constructor() {
    this.recipes = new Map();
    this.fuelTypes = new Map();
    this.registerDefaultRecipes();
    this.registerDefaultFuelTypes();
  }

  /**
   * Register a smelting recipe
   * @param {string} inputId - Input item ID
   * @param {string} outputId - Output item ID
   * @param {number} cookTime - Time in ticks to cook
   * @param {number} experience - Experience gained
   */
  registerRecipe(inputId, outputId, cookTime = 200, experience = 0.1) {
    this.recipes.set(inputId, {
      outputId,
      cookTime,
      experience
    });
  }

  /**
   * Register a fuel type
   * @param {string} itemId - Item ID
   * @param {number} burnTime - Burn time in ticks
   */
  registerFuelType(itemId, burnTime) {
    this.fuelTypes.set(itemId, burnTime);
  }

  /**
   * Get the burn time for a fuel item
   * @param {string} itemId - Item ID
   * @returns {number} Burn time in ticks, or 0 if not a fuel
   */
  getBurnTime(itemId) {
    return this.fuelTypes.get(itemId) || 0;
  }

  /**
   * Get the recipe for an input item
   * @param {string} inputId - Input item ID
   * @returns {Object|null} Recipe object or null if no recipe
   */
  getRecipe(inputId) {
    return this.recipes.get(inputId) || null;
  }

  /**
   * Check if an item can be smelted
   * @param {string} itemId - Item ID
   * @returns {boolean} Whether the item can be smelted
   */
  canSmelt(itemId) {
    return this.recipes.has(itemId);
  }

  /**
   * Check if an item can be used as fuel
   * @param {string} itemId - Item ID
   * @returns {boolean} Whether the item can be used as fuel
   */
  canUseAsFuel(itemId) {
    return this.fuelTypes.has(itemId);
  }

  /**
   * Register default smelting recipes
   * @private
   */
  registerDefaultRecipes() {
    // Ores
    this.registerRecipe('iron_ore', 'iron_ingot');
    this.registerRecipe('gold_ore', 'gold_ingot');
    this.registerRecipe('copper_ore', 'copper_ingot');
    this.registerRecipe('nether_gold_ore', 'gold_ingot');
    this.registerRecipe('nether_quartz_ore', 'quartz');
    this.registerRecipe('ancient_debris', 'netherite_scrap');

    // Food
    this.registerRecipe('beef', 'cooked_beef');
    this.registerRecipe('porkchop', 'cooked_porkchop');
    this.registerRecipe('chicken', 'cooked_chicken');
    this.registerRecipe('mutton', 'cooked_mutton');
    this.registerRecipe('rabbit', 'cooked_rabbit');
    this.registerRecipe('potato', 'baked_potato');

    // Other
    this.registerRecipe('cobblestone', 'stone');
    this.registerRecipe('stone', 'smooth_stone');
    this.registerRecipe('sand', 'glass');
    this.registerRecipe('clay_ball', 'brick');
    this.registerRecipe('netherrack', 'nether_brick');
    this.registerRecipe('cactus', 'green_dye');
    this.registerRecipe('sea_pickle', 'lime_dye');
    this.registerRecipe('wet_sponge', 'sponge');
  }

  /**
   * Register default fuel types
   * @private
   */
  registerDefaultFuelTypes() {
    // Coal types
    this.registerFuelType('coal', 1600);
    this.registerFuelType('charcoal', 1600);
    this.registerFuelType('coal_block', 16000);

    // Wood types
    this.registerFuelType('oak_planks', 300);
    this.registerFuelType('birch_planks', 300);
    this.registerFuelType('spruce_planks', 300);
    this.registerFuelType('jungle_planks', 300);
    this.registerFuelType('acacia_planks', 300);
    this.registerFuelType('dark_oak_planks', 300);
    this.registerFuelType('mangrove_planks', 300);
    this.registerFuelType('cherry_planks', 300);
    this.registerFuelType('bamboo_planks', 300);

    // Logs
    this.registerFuelType('oak_log', 300);
    this.registerFuelType('birch_log', 300);
    this.registerFuelType('spruce_log', 300);
    this.registerFuelType('jungle_log', 300);
    this.registerFuelType('acacia_log', 300);
    this.registerFuelType('dark_oak_log', 300);
    this.registerFuelType('mangrove_log', 300);
    this.registerFuelType('cherry_log', 300);
    this.registerFuelType('bamboo_block', 300);

    // Other
    this.registerFuelType('lava_bucket', 20000);
    this.registerFuelType('blaze_rod', 2400);
    this.registerFuelType('dried_kelp_block', 4000);
  }
}

module.exports = FurnaceManager; 