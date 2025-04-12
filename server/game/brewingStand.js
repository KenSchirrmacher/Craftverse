const { Item } = require('../items/item');
const { PotionRegistry } = require('../items/potionRegistry');

/**
 * Class representing a brewing stand in the game world
 * Handles the brewing process, item management, and client synchronization
 */
class BrewingStand {
  /**
   * Create a new brewing stand
   * @param {Object} options - The brewing stand options
   * @param {string} options.id - Unique identifier for this brewing stand
   * @param {Object} options.position - World position {x, y, z}
   * @param {GameServer} options.gameServer - Reference to the game server
   */
  constructor(options) {
    this.id = options.id || `brewing_stand_${Date.now()}`;
    this.position = options.position || { x: 0, y: 0, z: 0 };
    this.gameServer = options.gameServer;
    this.potionRegistry = new PotionRegistry();
    
    // Brewing stand state
    this.ingredient = null;
    this.bottles = [null, null, null]; // Up to 3 bottles can be placed
    this.fuel = null;
    this.fuelLevel = 0;
    this.maxFuelLevel = 20; // One blaze powder provides 20 brewing operations
    
    // Brewing process
    this.isActive = false;
    this.brewingTime = 0;
    this.brewingDuration = 400; // 20 seconds at 20 ticks per second
    
    this.lastUpdateTime = Date.now();
    this.dirty = true; // Flag to indicate if state needs to be synced
  }
  
  /**
   * Update the brewing stand state
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   */
  update(deltaTime) {
    const now = Date.now();
    deltaTime = deltaTime || now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    
    // Only update if there's an active brewing process
    if (this.isActive) {
      this.brewingTime += deltaTime;
      
      // Check if brewing is complete
      if (this.brewingTime >= this.brewingDuration) {
        this.completeBrewing();
      }
      
      this.dirty = true;
    }
  }
  
  /**
   * Start the brewing process if conditions are met
   * @returns {boolean} Whether brewing started successfully
   */
  startBrewing() {
    // Check if we have the necessary items and fuel
    if (!this.canBrew()) {
      return false;
    }
    
    // Start brewing
    this.isActive = true;
    this.brewingTime = 0;
    this.fuelLevel--;
    this.dirty = true;
    
    return true;
  }
  
  /**
   * Check if brewing can begin
   * @returns {boolean} Whether brewing can start
   */
  canBrew() {
    // Need an ingredient, at least one bottle, and fuel
    if (!this.ingredient || this.bottles.every(bottle => bottle === null) || this.fuelLevel <= 0) {
      return false;
    }
    
    // Check if the ingredient can be used for brewing
    const ingredientId = this.ingredient.id;
    
    // Check if any bottles can be brewed with this ingredient
    const canBrewAny = this.bottles.some(bottle => {
      if (!bottle) return false;
      return this.potionRegistry.canBrewWithIngredient(bottle.id, ingredientId);
    });
    
    return canBrewAny;
  }
  
  /**
   * Complete the brewing process and update the bottles
   */
  completeBrewing() {
    if (!this.ingredient) return;
    
    const ingredientId = this.ingredient.id;
    
    // Apply brewing effects to each bottle
    for (let i = 0; i < this.bottles.length; i++) {
      const bottle = this.bottles[i];
      if (!bottle) continue;
      
      const resultPotionId = this.potionRegistry.getBrewingResult(bottle.id, ingredientId);
      if (resultPotionId) {
        // Replace the bottle with the resulting potion
        const resultPotion = this.createPotionItem(resultPotionId);
        this.bottles[i] = resultPotion;
      }
    }
    
    // Consume the ingredient (reduce count or remove)
    this.ingredient.count--;
    if (this.ingredient.count <= 0) {
      this.ingredient = null;
    }
    
    // Reset brewing state
    this.isActive = false;
    this.brewingTime = 0;
    this.dirty = true;
    
    // Check if we can start another brewing cycle
    if (this.canBrew()) {
      this.startBrewing();
    }
  }
  
  /**
   * Create a potion item instance from a potion ID
   * @param {string} potionId - The ID of the potion to create
   * @returns {Item} The created potion item
   */
  createPotionItem(potionId) {
    const potionData = this.potionRegistry.getPotion(potionId);
    if (!potionData) return null;
    
    return new Item({
      id: potionId,
      name: potionData.name,
      type: 'potion',
      stackSize: 1,
      metadata: {
        effects: potionData.effects,
        duration: potionData.duration,
        color: potionData.color,
        splash: potionData.splash,
        lingering: potionData.lingering
      }
    });
  }
  
  /**
   * Add fuel to the brewing stand
   * @param {Item} item - The fuel item to add
   * @returns {boolean} Whether the fuel was added successfully
   */
  addFuel(item) {
    // Check if the item is valid fuel (blaze powder)
    if (item.id !== 'blaze_powder') {
      return false;
    }
    
    // Add fuel
    const fuelToAdd = item.count;
    this.fuelLevel = Math.min(this.fuelLevel + fuelToAdd, this.maxFuelLevel);
    this.dirty = true;
    
    return true;
  }
  
  /**
   * Place an item in the brewing stand
   * @param {string} slotType - The type of slot ('ingredient', 'bottle', 'fuel')
   * @param {number} slotIndex - The index of the slot
   * @param {Item} item - The item to place
   * @returns {Item|null} The previous item in the slot, or null if the slot was empty
   */
  placeItem(slotType, slotIndex, item) {
    if (!item) return null;
    
    let previousItem = null;
    
    switch (slotType) {
      case 'ingredient':
        previousItem = this.ingredient;
        this.ingredient = item;
        break;
        
      case 'bottle':
        if (slotIndex >= 0 && slotIndex < this.bottles.length) {
          // Check if the item is a valid bottle/potion
          if (!this.isValidBottle(item)) {
            return null;
          }
          
          previousItem = this.bottles[slotIndex];
          this.bottles[slotIndex] = item;
        }
        break;
        
      case 'fuel':
        // Special case for fuel - we don't store the item, just add to fuel level
        if (this.addFuel(item)) {
          // Return null as we consumed the fuel
          return null;
        }
        break;
        
      default:
        return null;
    }
    
    this.dirty = true;
    
    // Check if we can now start brewing
    if (!this.isActive && this.canBrew()) {
      this.startBrewing();
    }
    
    return previousItem;
  }
  
  /**
   * Check if an item is a valid bottle for brewing
   * @param {Item} item - The item to check
   * @returns {boolean} Whether the item is a valid bottle
   */
  isValidBottle(item) {
    if (!item) return false;
    
    // Check if it's a water bottle or potion
    return item.id === 'water_bottle' || item.type === 'potion';
  }
  
  /**
   * Remove an item from the brewing stand
   * @param {string} slotType - The type of slot ('ingredient', 'bottle')
   * @param {number} slotIndex - The index of the slot
   * @returns {Item|null} The removed item, or null if the slot was empty
   */
  removeItem(slotType, slotIndex) {
    let removedItem = null;
    
    switch (slotType) {
      case 'ingredient':
        removedItem = this.ingredient;
        this.ingredient = null;
        break;
        
      case 'bottle':
        if (slotIndex >= 0 && slotIndex < this.bottles.length) {
          removedItem = this.bottles[slotIndex];
          this.bottles[slotIndex] = null;
        }
        break;
        
      default:
        return null;
    }
    
    this.dirty = true;
    return removedItem;
  }
  
  /**
   * Get the current state of the brewing stand for client syncing
   * @returns {Object} The brewing stand state
   */
  getState() {
    return {
      id: this.id,
      position: this.position,
      ingredient: this.ingredient,
      bottles: this.bottles,
      fuelLevel: this.fuelLevel,
      maxFuelLevel: this.maxFuelLevel,
      isActive: this.isActive,
      brewingProgress: this.isActive ? this.brewingTime / this.brewingDuration : 0
    };
  }
  
  /**
   * Handle a player interaction with the brewing stand
   * @param {Player} player - The player interacting with the brewing stand
   * @param {Object} data - Interaction data
   */
  handleInteraction(player, data) {
    const { action, slotType, slotIndex, item } = data;
    
    switch (action) {
      case 'open':
        // Send initial state to client
        this.sendStateToPlayer(player);
        break;
        
      case 'place':
        // Handle item placement
        const previousItem = this.placeItem(slotType, slotIndex, item);
        if (previousItem) {
          // Return the previous item to the player's inventory
          player.inventory.addItem(previousItem);
        }
        // Sync state with all nearby players
        this.broadcastState();
        break;
        
      case 'remove':
        // Handle item removal
        const removedItem = this.removeItem(slotType, slotIndex);
        if (removedItem) {
          // Add the removed item to the player's inventory
          player.inventory.addItem(removedItem);
        }
        // Sync state with all nearby players
        this.broadcastState();
        break;
        
      default:
        console.warn(`Unknown brewing stand action: ${action}`);
    }
  }
  
  /**
   * Send the current state to a specific player
   * @param {Player} player - The player to send the state to
   */
  sendStateToPlayer(player) {
    const state = this.getState();
    this.gameServer.sendToPlayer(player, 'brewing_stand_state', state);
  }
  
  /**
   * Broadcast the brewing stand state to all nearby players
   */
  broadcastState() {
    if (!this.dirty) return;
    
    const state = this.getState();
    this.gameServer.broadcastToNearby(this.position, 'brewing_stand_state', state);
    this.dirty = false;
  }
  
  /**
   * Save the brewing stand state to be persisted
   * @returns {Object} The state to persist
   */
  serialize() {
    return {
      id: this.id,
      position: this.position,
      ingredient: this.ingredient,
      bottles: this.bottles,
      fuelLevel: this.fuelLevel
    };
  }
  
  /**
   * Load a persisted brewing stand state
   * @param {Object} data - The persisted state
   */
  deserialize(data) {
    this.id = data.id || this.id;
    this.position = data.position || this.position;
    this.ingredient = data.ingredient || null;
    this.bottles = data.bottles || [null, null, null];
    this.fuelLevel = data.fuelLevel || 0;
    
    this.dirty = true;
  }
}

module.exports = { BrewingStand }; 