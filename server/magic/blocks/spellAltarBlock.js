/**
 * Spell Altar Block - Used for crafting and enhancing spells
 * Part of the Minecraft 1.22 "Sorcery Update" features
 */

const { SpellElement, SpellRarity } = require('../spellRegistry');

class SpellAltarBlock {
  constructor(options = {}) {
    this.id = options.id || 'spell_altar';
    this.name = options.name || 'Spell Altar';
    this.description = options.description || 'A mystical altar for crafting and enhancing spells';
    this.inventory = options.inventory || {
      size: 5,  // Center + 4 cardinal directions
      items: new Array(5).fill(null)
    };
    this.activationStatus = options.activationStatus || {
      active: false,
      remainingTime: 0,
      recipeId: null
    };
    this.position = options.position || { x: 0, y: 0, z: 0 };
    this.recipes = new Map(); // Will be populated in initialize()
    this.hardness = 3.5;
    this.toolType = 'pickaxe';
    this.minToolLevel = 'iron';
    this.lightLevel = 0;
  }
  
  /**
   * Initialize the block with server reference and register recipes
   * @param {Object} server - Server instance
   */
  initialize(server) {
    this.server = server;
    this.registerRecipes();
  }
  
  /**
   * Register all available spell crafting recipes
   */
  registerRecipes() {
    // Format: [center, north, east, south, west]
    
    // Fireball Spell Book
    this.registerRecipe({
      id: 'fireball_spell_book',
      ingredients: [
        { type: 'book', metadata: {} },
        { type: 'blaze_powder', metadata: {} },
        { type: 'redstone', metadata: {} },
        { type: 'gunpowder', metadata: {} },
        { type: 'fire_charge', metadata: {} }
      ],
      result: {
        type: 'spell_book',
        metadata: {
          spellId: 'fireball',
          spellLevel: 1,
          element: SpellElement.FIRE,
          rarity: SpellRarity.COMMON,
          durability: 50,
          maxDurability: 50
        }
      },
      craftingTime: 60, // seconds
      requiredPlayerLevel: 1
    });
    
    // Ice Spike Spell Book
    this.registerRecipe({
      id: 'ice_spike_spell_book',
      ingredients: [
        { type: 'book', metadata: {} },
        { type: 'ice', metadata: {} },
        { type: 'redstone', metadata: {} },
        { type: 'prismarine_shard', metadata: {} },
        { type: 'diamond', metadata: {} }
      ],
      result: {
        type: 'spell_book',
        metadata: {
          spellId: 'ice_spike',
          spellLevel: 1,
          element: SpellElement.WATER,
          rarity: SpellRarity.UNCOMMON,
          durability: 50,
          maxDurability: 50
        }
      },
      craftingTime: 90, // seconds
      requiredPlayerLevel: 5
    });
    
    // Blink Spell Book
    this.registerRecipe({
      id: 'blink_spell_book',
      ingredients: [
        { type: 'book', metadata: {} },
        { type: 'ender_pearl', metadata: {} },
        { type: 'redstone', metadata: {} },
        { type: 'chorus_fruit', metadata: {} },
        { type: 'feather', metadata: {} }
      ],
      result: {
        type: 'spell_book',
        metadata: {
          spellId: 'blink',
          spellLevel: 1,
          element: SpellElement.NEUTRAL,
          rarity: SpellRarity.UNCOMMON,
          durability: 50,
          maxDurability: 50
        }
      },
      craftingTime: 90, // seconds
      requiredPlayerLevel: 8
    });
    
    // Fireball Scroll
    this.registerRecipe({
      id: 'fireball_scroll',
      ingredients: [
        { type: 'paper', metadata: {} },
        { type: 'blaze_powder', metadata: {} },
        { type: 'redstone', metadata: {} },
        { type: 'gunpowder', metadata: {} },
        { type: 'fire_charge', metadata: {} }
      ],
      result: {
        type: 'spell_scroll',
        metadata: {
          spellId: 'fireball',
          spellLevel: 1,
          element: SpellElement.FIRE,
          rarity: SpellRarity.COMMON,
          usedWithoutMana: true
        },
        count: 3 // Scrolls are created in batches
      },
      craftingTime: 30, // seconds
      requiredPlayerLevel: 1
    });
    
    // Upgrade Recipe: Fireball Level 2
    this.registerRecipe({
      id: 'upgrade_fireball_lvl2',
      ingredients: [
        { type: 'spell_book', metadata: { spellId: 'fireball', spellLevel: 1 } },
        { type: 'blaze_powder', metadata: {} },
        { type: 'glowstone_dust', metadata: {} },
        { type: 'blaze_powder', metadata: {} },
        { type: 'fire_charge', metadata: {} }
      ],
      result: {
        type: 'spell_book',
        metadata: {
          spellId: 'fireball',
          spellLevel: 2,
          element: SpellElement.FIRE,
          rarity: SpellRarity.COMMON,
          durability: 50,
          maxDurability: 50
        }
      },
      craftingTime: 120, // seconds
      requiredPlayerLevel: 3
    });
  }
  
  /**
   * Register a spell crafting recipe
   * @param {Object} recipe - Recipe definition
   */
  registerRecipe(recipe) {
    if (!recipe.id) {
      console.error('[SpellAltarBlock] Cannot register recipe without an ID');
      return false;
    }
    
    if (this.recipes.has(recipe.id)) {
      console.warn(`[SpellAltarBlock] Recipe '${recipe.id}' is already registered`);
      return false;
    }
    
    this.recipes.set(recipe.id, recipe);
    return true;
  }
  
  /**
   * Handle right-click interaction with the altar
   * @param {Object} player - Player interacting with the altar
   * @param {Object} options - Interaction options
   * @returns {Object} - Interaction result
   */
  onInteract(player, options = {}) {
    if (!player) {
      return { success: false, message: 'Invalid player' };
    }
    
    // If altar is active, show status
    if (this.activationStatus.active) {
      return {
        success: true,
        message: `Altar is active. Time remaining: ${Math.ceil(this.activationStatus.remainingTime)}s`,
        inventory: this.getInventoryInfo(),
        activationStatus: this.activationStatus
      };
    }
    
    // If a slot is specified, handle item placement/removal
    if (options.slot !== undefined) {
      const slot = options.slot;
      
      // Validate slot index
      if (slot < 0 || slot >= this.inventory.size) {
        return { success: false, message: 'Invalid altar slot' };
      }
      
      // If player is holding an item, place it in the altar
      if (options.heldItem) {
        // Check if slot is empty
        if (this.inventory.items[slot]) {
          return { success: false, message: 'Slot is already occupied' };
        }
        
        // Place item in altar
        this.inventory.items[slot] = options.heldItem;
        
        // Validate if current arrangement can form a recipe
        const matchingRecipe = this.findMatchingRecipe();
        
        // Return success and updated inventory info
        return {
          success: true,
          message: matchingRecipe ? 'Recipe matched! You can activate the altar.' : 'Item placed in altar.',
          inventory: this.getInventoryInfo(),
          matchingRecipe: matchingRecipe ? matchingRecipe.id : null
        };
      }
      // If no item is specified, remove the item from the slot
      else {
        // Check if slot has an item
        if (!this.inventory.items[slot]) {
          return { success: false, message: 'Slot is empty' };
        }
        
        // Return the item to the player
        const item = this.inventory.items[slot];
        this.inventory.items[slot] = null;
        
        // Return success, updated inventory info, and the removed item
        return {
          success: true,
          message: 'Item removed from altar.',
          inventory: this.getInventoryInfo(),
          returnedItem: item
        };
      }
    }
    // If no slot is specified but player is trying to activate the altar
    else if (options.activate) {
      return this.activateAltar(player);
    }
    
    // Default: just show the altar inventory
    return {
      success: true,
      message: 'Opened altar.',
      inventory: this.getInventoryInfo()
    };
  }
  
  /**
   * Activate the altar to begin a crafting process
   * @param {Object} player - Player activating the altar
   * @returns {Object} - Activation result
   */
  activateAltar(player) {
    if (!player) {
      return { success: false, message: 'Invalid player' };
    }
    
    // Check if all slots are filled
    const emptySlots = this.inventory.items.filter(item => !item).length;
    if (emptySlots > 0) {
      return { success: false, message: `Altar needs ${emptySlots} more item(s) to activate` };
    }
    
    // Find a matching recipe
    const matchingRecipe = this.findMatchingRecipe();
    if (!matchingRecipe) {
      return { success: false, message: 'No valid recipe found for these ingredients' };
    }
    
    // Check player level requirement
    if (matchingRecipe.requiredPlayerLevel && player.level < matchingRecipe.requiredPlayerLevel) {
      return { 
        success: false, 
        message: `You need to be level ${matchingRecipe.requiredPlayerLevel} to craft this spell` 
      };
    }
    
    // Set activation status
    this.activationStatus = {
      active: true,
      remainingTime: matchingRecipe.craftingTime,
      recipeId: matchingRecipe.id
    };
    
    // Start the crafting process
    this.startCraftingProcess(player);
    
    // Return activation result
    return {
      success: true,
      message: `Altar activated! Crafting will complete in ${matchingRecipe.craftingTime} seconds.`,
      activationStatus: this.activationStatus
    };
  }
  
  /**
   * Start the crafting process
   * @param {Object} player - Player who activated the altar
   */
  startCraftingProcess(player) {
    // Set up visual effects
    if (this.server && this.server.particleSystem) {
      this.server.particleSystem.addEffect({
        type: 'enchantment_table',
        position: this.position,
        count: 10,
        spread: 1.5,
        duration: this.activationStatus.remainingTime * 1000, // Convert to milliseconds
        interval: 200 // Emit particles every 200ms
      });
    }
    
    // Emit crafting started event
    if (this.server && this.server.eventEmitter) {
      this.server.eventEmitter.emit('spellCraftingStarted', {
        position: this.position,
        player: player.id,
        recipe: this.activationStatus.recipeId,
        timeRemaining: this.activationStatus.remainingTime
      });
    }
  }
  
  /**
   * Process a time tick for the altar
   * @param {number} deltaTime - Time passed in seconds
   */
  tick(deltaTime) {
    // If altar is not active, do nothing
    if (!this.activationStatus.active) {
      return;
    }
    
    // Reduce remaining time
    this.activationStatus.remainingTime -= deltaTime;
    
    // Check if crafting is complete
    if (this.activationStatus.remainingTime <= 0) {
      this.completeCrafting();
    }
  }
  
  /**
   * Complete the crafting process
   */
  completeCrafting() {
    // Get the recipe
    const recipe = this.recipes.get(this.activationStatus.recipeId);
    if (!recipe) {
      console.error(`[SpellAltarBlock] Recipe '${this.activationStatus.recipeId}' not found`);
      this.resetAltar();
      return;
    }
    
    // Create the result item
    const result = this.createResultItem(recipe.result);
    
    // Clear the altar
    this.inventory.items = new Array(this.inventory.size).fill(null);
    
    // Place the result in the center
    this.inventory.items[0] = result;
    
    // Reset activation status
    this.activationStatus = {
      active: false,
      remainingTime: 0,
      recipeId: null
    };
    
    // Emit crafting completed event
    if (this.server && this.server.eventEmitter) {
      this.server.eventEmitter.emit('spellCraftingCompleted', {
        position: this.position,
        recipe: recipe.id,
        result: result
      });
    }
    
    // Add visual effects
    if (this.server && this.server.particleSystem) {
      this.server.particleSystem.addEffect({
        type: 'explosion',
        position: this.position,
        count: 20,
        spread: 1.0,
        duration: 500
      });
    }
  }
  
  /**
   * Create a result item from a recipe result definition
   * @param {Object} resultDef - Result definition
   * @returns {Object} - Created item
   */
  createResultItem(resultDef) {
    if (!this.server) {
      return null;
    }
    
    // Get the item creator function based on type
    let itemCreator;
    switch (resultDef.type) {
      case 'spell_book':
        itemCreator = this.server.itemRegistry?.createSpellBook;
        break;
      case 'spell_scroll':
        itemCreator = this.server.itemRegistry?.createSpellScroll;
        break;
      default:
        itemCreator = this.server.itemRegistry?.createItem;
    }
    
    if (!itemCreator) {
      console.error(`[SpellAltarBlock] Item creator for type '${resultDef.type}' not found`);
      return null;
    }
    
    // Create the item
    const item = itemCreator.call(this.server.itemRegistry, resultDef.metadata);
    
    // Set count if specified
    if (resultDef.count && item.stackable) {
      item.count = resultDef.count;
    }
    
    return item;
  }
  
  /**
   * Find a recipe that matches the current items in the altar
   * @returns {Object|null} - Matching recipe or null
   */
  findMatchingRecipe() {
    // Check if all slots are filled
    if (this.inventory.items.some(item => !item)) {
      return null;
    }
    
    // Check each recipe
    for (const [recipeId, recipe] of this.recipes.entries()) {
      if (this.checkRecipeMatch(recipe)) {
        return recipe;
      }
    }
    
    return null;
  }
  
  /**
   * Check if the current items match a specific recipe
   * @param {Object} recipe - Recipe to check
   * @returns {boolean} - Whether the recipe matches
   */
  checkRecipeMatch(recipe) {
    // Check each ingredient slot
    for (let i = 0; i < this.inventory.size; i++) {
      const altarItem = this.inventory.items[i];
      const recipeIngredient = recipe.ingredients[i];
      
      // Check if item type matches the ingredient
      if (altarItem.type !== recipeIngredient.type) {
        return false;
      }
      
      // For special items like spell books, check additional metadata
      if (recipeIngredient.metadata) {
        for (const key in recipeIngredient.metadata) {
          if (altarItem[key] !== recipeIngredient.metadata[key]) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * Reset the altar to its default state
   */
  resetAltar() {
    this.inventory.items = new Array(this.inventory.size).fill(null);
    this.activationStatus = {
      active: false,
      remainingTime: 0,
      recipeId: null
    };
  }
  
  /**
   * Get information about the altar's inventory
   * @returns {Object} - Inventory information
   */
  getInventoryInfo() {
    return {
      size: this.inventory.size,
      items: this.inventory.items.map(item => item ? {
        id: item.id,
        name: item.name,
        type: item.type
      } : null)
    };
  }
  
  /**
   * Serialize the block for storage
   * @returns {Object} - Serialized data
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      inventory: {
        size: this.inventory.size,
        items: this.inventory.items
      },
      activationStatus: this.activationStatus
    };
  }
  
  /**
   * Deserialize the block from storage
   * @param {Object} data - Serialized data
   * @returns {SpellAltarBlock} - Deserialized block
   */
  static fromJSON(data) {
    return new SpellAltarBlock({
      id: data.id,
      name: data.name,
      position: data.position,
      inventory: data.inventory,
      activationStatus: data.activationStatus
    });
  }
}

module.exports = SpellAltarBlock; 