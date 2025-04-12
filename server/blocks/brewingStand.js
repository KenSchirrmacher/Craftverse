/**
 * BrewingStand - Server-side implementation of the brewing stand functionality
 * Handles brewing logic, ingredient processing, and potion creation
 */

const EventEmitter = require('events');
const Item = require('../items/item');

class BrewingStand extends EventEmitter {
  constructor(world, position) {
    super();
    this.world = world;
    this.position = position;
    this.ingredients = {
      ingredient: null,
      bottles: [null, null, null],
      fuel: null
    };
    this.fuelLevel = 0;
    this.maxFuel = 20;
    this.brewingTime = 0;
    this.maxBrewingTime = 400; // 20 seconds at 20 ticks per second
    this.isActive = false;
    this.isDirty = true;
    
    // Load potion registry
    this.potionRegistry = world.server.itemRegistry.getPotionRegistry();
  }

  /**
   * Place an item in a specific slot
   * @param {string} slotType - 'ingredient', 'bottle0', 'bottle1', 'bottle2', 'fuel'
   * @param {Item} item - The item to place
   * @returns {Item|null} The item that was in the slot before (if any)
   */
  placeItem(slotType, item) {
    let oldItem = null;
    
    if (slotType === 'ingredient') {
      oldItem = this.ingredients.ingredient;
      this.ingredients.ingredient = item;
    } else if (slotType === 'fuel') {
      if (item && item.type === 'blaze_powder') {
        oldItem = this.ingredients.fuel;
        this.ingredients.fuel = item;
        this.addFuel(item);
      } else {
        return item; // Return the item if it's not valid fuel
      }
    } else if (slotType.startsWith('bottle')) {
      const index = parseInt(slotType.substring(6), 10);
      if (index >= 0 && index < 3) {
        oldItem = this.ingredients.bottles[index];
        
        // Only allow water bottles or existing potions
        if (item && (item.type === 'potion' || item.type === 'glass_bottle')) {
          this.ingredients.bottles[index] = item;
        } else if (item) {
          return item; // Return the item if it's not a valid bottle
        } else {
          this.ingredients.bottles[index] = null;
        }
      }
    }
    
    this.isDirty = true;
    this.checkBrewing();
    return oldItem;
  }

  /**
   * Retrieve an item from a specific slot
   * @param {string} slotType - 'ingredient', 'bottle0', 'bottle1', 'bottle2', 'fuel'
   * @returns {Item|null} The item in the specified slot, or null if empty
   */
  getItem(slotType) {
    if (slotType === 'ingredient') {
      return this.ingredients.ingredient;
    } else if (slotType === 'fuel') {
      return this.ingredients.fuel;
    } else if (slotType.startsWith('bottle')) {
      const index = parseInt(slotType.substring(6), 10);
      if (index >= 0 && index < 3) {
        return this.ingredients.bottles[index];
      }
    }
    return null;
  }

  /**
   * Take an item from a specific slot
   * @param {string} slotType - 'ingredient', 'bottle0', 'bottle1', 'bottle2', 'fuel'
   * @returns {Item|null} The item taken from the slot, or null if empty
   */
  takeItem(slotType) {
    const item = this.getItem(slotType);
    
    if (slotType === 'ingredient') {
      this.ingredients.ingredient = null;
    } else if (slotType === 'fuel') {
      this.ingredients.fuel = null;
    } else if (slotType.startsWith('bottle')) {
      const index = parseInt(slotType.substring(6), 10);
      if (index >= 0 && index < 3) {
        this.ingredients.bottles[index] = null;
      }
    }
    
    this.isDirty = true;
    this.checkBrewing();
    return item;
  }

  /**
   * Add fuel to the brewing stand
   * @param {Item} fuelItem - The fuel item (should be blaze powder)
   */
  addFuel(fuelItem) {
    if (fuelItem && fuelItem.type === 'blaze_powder') {
      const fuelPerItem = 20; // Each blaze powder provides 20 fuel units
      
      if (this.fuelLevel < this.maxFuel) {
        this.fuelLevel = Math.min(this.maxFuel, this.fuelLevel + fuelPerItem);
        
        // Consume one blaze powder
        if (fuelItem.count > 1) {
          fuelItem.count--;
        } else {
          this.ingredients.fuel = null;
        }
        
        this.isDirty = true;
      }
    }
  }

  /**
   * Check if brewing can start and initiate if conditions are met
   */
  checkBrewing() {
    const canBrew = this.canBrew();
    
    if (canBrew && !this.isActive && this.fuelLevel > 0) {
      this.isActive = true;
      this.brewingTime = 0;
      this.isDirty = true;
    } else if (!canBrew && this.isActive) {
      this.isActive = false;
      this.brewingTime = 0;
      this.isDirty = true;
    }
  }

  /**
   * Check if brewing can occur based on current ingredients
   * @returns {boolean} True if brewing can occur
   */
  canBrew() {
    // Need ingredient and at least one water bottle or existing potion
    if (!this.ingredients.ingredient) {
      return false;
    }
    
    // Check if any bottle slots have valid bottles
    const hasValidBottle = this.ingredients.bottles.some(bottle => 
      bottle && (bottle.type === 'potion' || bottle.type === 'glass_bottle'));
    
    return hasValidBottle;
  }

  /**
   * Process the current brewing operation
   * @param {number} deltaTime - Time in milliseconds since last update
   */
  update(deltaTime) {
    if (!this.isActive) {
      return;
    }
    
    if (this.fuelLevel <= 0) {
      this.isActive = false;
      this.brewingTime = 0;
      this.isDirty = true;
      return;
    }
    
    this.brewingTime += deltaTime;
    this.isDirty = true;
    
    if (this.brewingTime >= this.maxBrewingTime) {
      this.finishBrewing();
      this.fuelLevel--;
      this.checkBrewing();
    }
  }

  /**
   * Complete the brewing process and create the resulting potions
   */
  finishBrewing() {
    if (!this.ingredients.ingredient) {
      return;
    }
    
    const ingredient = this.ingredients.ingredient;
    let ingredientConsumed = false;
    
    // Process each bottle
    for (let i = 0; i < 3; i++) {
      const bottle = this.ingredients.bottles[i];
      
      if (!bottle) {
        continue;
      }
      
      if (bottle.type === 'glass_bottle' && ingredient.type === 'water_bucket') {
        // Convert glass bottle to water bottle
        this.ingredients.bottles[i] = new Item('potion', 1, { 
          potionType: 'water' 
        });
        ingredientConsumed = true;
      } else if (bottle.type === 'potion') {
        const potionData = bottle.metadata ? bottle.metadata : { potionType: 'water' };
        const newPotion = this.brewPotion(potionData.potionType, ingredient.type);
        
        if (newPotion) {
          this.ingredients.bottles[i] = new Item('potion', 1, { 
            potionType: newPotion 
          });
          ingredientConsumed = true;
        }
      }
    }
    
    // Consume the ingredient if used
    if (ingredientConsumed) {
      if (ingredient.count > 1) {
        ingredient.count--;
      } else {
        this.ingredients.ingredient = null;
      }
    }
    
    this.brewingTime = 0;
    this.isActive = false;
    this.isDirty = true;
    
    // Notify clients of the brewing completion
    this.emit('brewingComplete', this.getStateForClient());
  }

  /**
   * Determine the resulting potion type based on ingredient and base potion
   * @param {string} basePotion - The current potion type
   * @param {string} ingredient - The ingredient being used
   * @returns {string|null} The resulting potion type, or null if no valid transformation
   */
  brewPotion(basePotion, ingredient) {
    // Get potential transformations from potion registry
    const potionDef = this.potionRegistry.getPotion(basePotion);
    if (!potionDef) return null;
    
    // Check if this ingredient can transform the potion
    switch (ingredient) {
      case 'nether_wart':
        return basePotion === 'water' ? 'awkward' : null;
      case 'redstone':
        // Extends duration for existing potions
        return potionDef.extendedVersion || null;
      case 'glowstone_dust':
        // Amplifies effect for existing potions
        return potionDef.amplifiedVersion || null;
      case 'fermented_spider_eye':
        // Corrupts/inverts potion effects
        return potionDef.corruptedVersion || null;
      case 'gunpowder':
        // Converts to splash potion
        return potionDef.splashVersion || null;
      case 'dragon_breath':
        // Converts to lingering potion 
        return potionDef.lingeringVersion || null;
      // Ingredients for specific potion effects
      case 'sugar':
        return basePotion === 'awkward' ? 'swiftness' : null;
      case 'rabbit_foot':
        return basePotion === 'awkward' ? 'leaping' : null;
      case 'blaze_powder':
        return basePotion === 'awkward' ? 'strength' : null;
      case 'glistering_melon':
        return basePotion === 'awkward' ? 'healing' : null;
      case 'spider_eye':
        return basePotion === 'awkward' ? 'poison' : null;
      case 'ghast_tear':
        return basePotion === 'awkward' ? 'regeneration' : null;
      case 'magma_cream':
        return basePotion === 'awkward' ? 'fire_resistance' : null;
      case 'pufferfish':
        return basePotion === 'awkward' ? 'water_breathing' : null;
      case 'golden_carrot':
        return basePotion === 'awkward' ? 'night_vision' : null;
      case 'turtle_shell':
        return basePotion === 'awkward' ? 'turtle_master' : null;
      case 'phantom_membrane':
        return basePotion === 'awkward' ? 'slow_falling' : null;
      default:
        return null;
    }
  }

  /**
   * Get the current state of the brewing stand for client updates
   * @returns {Object} The brewing stand state
   */
  getStateForClient() {
    return {
      position: this.position,
      ingredient: this.ingredients.ingredient ? this.ingredients.ingredient.getClientData() : null,
      bottles: this.ingredients.bottles.map(bottle => 
        bottle ? bottle.getClientData() : null
      ),
      fuel: this.ingredients.fuel ? this.ingredients.fuel.getClientData() : null,
      fuelLevel: this.fuelLevel,
      maxFuel: this.maxFuel,
      brewingProgress: this.isActive ? this.brewingTime / this.maxBrewingTime : 0,
      isActive: this.isActive
    };
  }

  /**
   * Serialize the brewing stand for saving
   * @returns {Object} Serialized brewing stand data
   */
  serialize() {
    return {
      position: this.position,
      ingredients: {
        ingredient: this.ingredients.ingredient ? this.ingredients.ingredient.serialize() : null,
        bottles: this.ingredients.bottles.map(bottle => 
          bottle ? bottle.serialize() : null
        ),
        fuel: this.ingredients.fuel ? this.ingredients.fuel.serialize() : null
      },
      fuelLevel: this.fuelLevel,
      brewingTime: this.brewingTime,
      isActive: this.isActive
    };
  }

  /**
   * Deserialize and load brewing stand data
   * @param {Object} data - Serialized brewing stand data
   */
  deserialize(data) {
    this.position = data.position;
    
    if (data.ingredients) {
      this.ingredients.ingredient = data.ingredients.ingredient 
        ? Item.deserialize(data.ingredients.ingredient) 
        : null;
      
      this.ingredients.bottles = data.ingredients.bottles.map(bottleData => 
        bottleData ? Item.deserialize(bottleData) : null
      );
      
      this.ingredients.fuel = data.ingredients.fuel 
        ? Item.deserialize(data.ingredients.fuel) 
        : null;
    }
    
    this.fuelLevel = data.fuelLevel || 0;
    this.brewingTime = data.brewingTime || 0;
    this.isActive = data.isActive || false;
    this.isDirty = true;
  }
}

module.exports = BrewingStand; 