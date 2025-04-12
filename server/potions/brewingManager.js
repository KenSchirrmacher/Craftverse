/**
 * Brewing Manager - Handles potion brewing mechanics and brewing stand functionality
 */

const PotionRegistry = require('./potionRegistry');
const { v4: uuidv4 } = require('uuid');

class BrewingManager {
  constructor() {
    this.registry = new PotionRegistry();
    this.brewingStands = {};
    this.tickRate = 1000; // milliseconds per brewing tick
    
    // Register valid ingredients
    this.validIngredients = new Set([
      'NETHER_WART',
      'REDSTONE_DUST',
      'GLOWSTONE_DUST',
      'FERMENTED_SPIDER_EYE',
      'GUNPOWDER',
      'DRAGON_BREATH',
      'GLISTERING_MELON',
      'SPIDER_EYE',
      'BLAZE_POWDER',
      'MAGMA_CREAM',
      'SUGAR',
      'RABBIT_FOOT',
      'GOLDEN_CARROT',
      'PUFFERFISH',
      'PHANTOM_MEMBRANE'
    ]);
    
    // Fuel item (blaze powder)
    this.fuelItem = 'BLAZE_POWDER';
    this.fuelPerItem = 20; // Number of brewing operations per fuel item
  }
  
  /**
   * Register a new brewing stand
   * @param {Object} position - Position in the world
   * @param {string} ownerId - ID of the player who placed the stand
   * @returns {string} - ID of the brewing stand
   */
  registerBrewingStand(position, ownerId) {
    const id = uuidv4();
    
    this.brewingStands[id] = {
      id,
      position,
      ownerId,
      slots: {
        // Ingredient slot
        ingredient: null,
        // Potion slots (0, 1, 2)
        0: null,
        1: null,
        2: null
      },
      fuel: 0, // Number of brews remaining
      brewing: false,
      progress: 0,
      totalTime: 400 // Total brewing time in ticks
    };
    
    return id;
  }
  
  /**
   * Remove a brewing stand
   * @param {string} id - Brewing stand ID
   * @returns {boolean} - Whether the removal was successful
   */
  removeBrewingStand(id) {
    if (!this.brewingStands[id]) {
      return false;
    }
    
    delete this.brewingStands[id];
    return true;
  }
  
  /**
   * Get a brewing stand by ID
   * @param {string} id - Brewing stand ID
   * @returns {Object} - Brewing stand object
   */
  getBrewingStand(id) {
    return this.brewingStands[id] || null;
  }
  
  /**
   * Get a brewing stand by position
   * @param {Object} position - Position in the world
   * @returns {Object} - Brewing stand object
   */
  getBrewingStandByPosition(position) {
    const stands = Object.values(this.brewingStands);
    return stands.find(stand => 
      stand.position.x === position.x && 
      stand.position.y === position.y && 
      stand.position.z === position.z
    ) || null;
  }
  
  /**
   * Add an item to a brewing stand slot
   * @param {string} standId - Brewing stand ID
   * @param {string} slot - Slot name or index
   * @param {Object} item - Item to add
   * @returns {boolean} - Whether the addition was successful
   */
  addItemToSlot(standId, slot, item) {
    const stand = this.brewingStands[standId];
    if (!stand) return false;
    
    // Check if slot is valid
    if (slot !== 'ingredient' && !['0', '1', '2'].includes(slot.toString())) {
      return false;
    }
    
    // Check if slot is empty
    if (stand.slots[slot]) {
      return false;
    }
    
    // Handle fuel (blaze powder)
    if (slot === 'ingredient' && item.id === 'blaze_powder') {
      stand.fuel += 20; // Each blaze powder provides 20 brews
      return true;
    }
    
    // Otherwise add the item to the slot
    stand.slots[slot] = item;
    
    // Check if we can start brewing
    this.checkAndStartBrewing(standId);
    
    return true;
  }
  
  /**
   * Remove an item from a brewing stand slot
   * @param {string} standId - Brewing stand ID
   * @param {string} slot - Slot name or index
   * @returns {Object} - Removed item or null
   */
  removeItemFromSlot(standId, slot) {
    const stand = this.brewingStands[standId];
    if (!stand) return null;
    
    // Check if slot is valid
    if (slot !== 'ingredient' && !['0', '1', '2'].includes(slot.toString())) {
      return null;
    }
    
    // Check if slot has an item
    if (!stand.slots[slot]) {
      return null;
    }
    
    const item = stand.slots[slot];
    stand.slots[slot] = null;
    
    // If brewing, stop brewing
    if (stand.brewing) {
      stand.brewing = false;
      stand.progress = 0;
    }
    
    return item;
  }
  
  /**
   * Check if brewing can start and begin the process
   * @param {string} standId - Brewing stand ID
   * @returns {boolean} - Whether brewing was started
   */
  checkAndStartBrewing(standId) {
    const stand = this.brewingStands[standId];
    if (!stand) return false;
    
    // Check if already brewing
    if (stand.brewing) return false;
    
    // Check if there's fuel
    if (stand.fuel <= 0) return false;
    
    // Check if there's an ingredient
    if (!stand.slots.ingredient) return false;
    
    // Check if there's at least one potion
    const hasPotion = stand.slots['0'] || stand.slots['1'] || stand.slots['2'];
    if (!hasPotion) return false;
    
    // Start brewing
    stand.brewing = true;
    stand.progress = 0;
    
    return true;
  }
  
  /**
   * Process a brewing tick
   * @param {string} standId - Brewing stand ID
   * @returns {Object} - Status update object
   */
  processTick(standId) {
    const stand = this.brewingStands[standId];
    if (!stand || !stand.brewing) return null;
    
    // Increment progress
    stand.progress += 1;
    
    // Check if brewing is complete
    if (stand.progress >= stand.totalTime) {
      return this.finishBrewing(standId);
    }
    
    // Return progress update
    return {
      standId,
      progress: stand.progress,
      totalTime: stand.totalTime,
      completed: false
    };
  }
  
  /**
   * Finish the brewing process
   * @param {string} standId - Brewing stand ID
   * @returns {Object} - Brewing results
   */
  finishBrewing(standId) {
    const stand = this.brewingStands[standId];
    if (!stand) return null;
    
    // Update brewing state
    stand.brewing = false;
    stand.progress = 0;
    
    // Consume fuel
    stand.fuel -= 1;
    
    // Process brewing recipe for each potion
    const ingredientId = stand.slots.ingredient.id;
    const results = {
      standId,
      completed: true,
      results: {}
    };
    
    for (let i = 0; i < 3; i++) {
      const slot = stand.slots[i];
      if (!slot) continue;
      
      // Determine input potion ID
      const inputId = slot.id;
      
      // Check if there's a valid recipe
      const recipe = this.registry.getRecipe(inputId, ingredientId);
      if (!recipe) continue;
      
      // Apply recipe
      const outputPotion = this.registry.getPotionDefinition(recipe.output);
      if (!outputPotion) continue;
      
      // Update slot with new potion
      stand.slots[i] = {
        id: outputPotion.id,
        name: outputPotion.name,
        count: slot.count,
        metadata: {
          color: outputPotion.color,
          effects: outputPotion.effects,
          bottleType: outputPotion.bottleType || "regular"
        }
      };
      
      // Record result
      results.results[i] = {
        oldItem: inputId,
        newItem: stand.slots[i]
      };
    }
    
    // Consume ingredient
    stand.slots.ingredient = null;
    
    return results;
  }
  
  /**
   * Apply potion effects to an entity
   * @param {string} potionId - Potion ID
   * @param {Object} entity - Target entity
   * @param {number} effectiveLevel - Effective level (for splash potions with distance falloff)
   * @returns {Array} - Applied effects
   */
  applyPotionEffects(potionId, entity, effectiveLevel = 1) {
    const potion = this.registry.getPotionDefinition(potionId);
    if (!potion) return [];
    
    const appliedEffects = [];
    
    for (const effect of potion.effects) {
      // Calculate actual effect level based on effective level
      let actualLevel = effect.level;
      if (effectiveLevel < 1) {
        actualLevel = Math.max(1, Math.floor(effect.level * effectiveLevel));
      }
      
      // Apply effect to entity
      const appliedEffect = {
        type: effect.type,
        level: actualLevel,
        duration: effect.duration,
        source: potionId
      };
      
      // Add effect to entity
      if (entity.addStatusEffect) {
        entity.addStatusEffect(appliedEffect);
      }
      
      appliedEffects.push(appliedEffect);
    }
    
    return appliedEffects;
  }
  
  /**
   * Apply splash potion effects in an area
   * @param {string} potionId - Potion ID
   * @param {Object} position - Splash position
   * @param {Array} entitiesInRange - Array of entities in range
   * @param {number} radius - Effect radius
   * @returns {Object} - Effects applied to entities
   */
  applySplashPotionEffects(potionId, position, entitiesInRange, radius = 4) {
    const potion = this.registry.getPotionDefinition(potionId);
    if (!potion || !potion.isSplash) return {};
    
    const results = {};
    
    for (const entity of entitiesInRange) {
      // Calculate distance from splash point
      const distance = Math.sqrt(
        Math.pow(entity.position.x - position.x, 2) +
        Math.pow(entity.position.y - position.y, 2) +
        Math.pow(entity.position.z - position.z, 2)
      );
      
      // Skip if too far
      if (distance > radius) continue;
      
      // Calculate effect level based on distance
      const effectiveLevel = 1 - (distance / radius);
      
      // Apply effects
      const appliedEffects = this.applyPotionEffects(potionId, entity, effectiveLevel);
      
      if (appliedEffects.length > 0) {
        results[entity.id] = {
          entity: entity.id,
          distance,
          effectiveLevel,
          effects: appliedEffects
        };
      }
    }
    
    return results;
  }
  
  /**
   * Update all brewing stands
   * @returns {Array} - Array of updates
   */
  update() {
    const updates = [];
    
    for (const standId in this.brewingStands) {
      const stand = this.brewingStands[standId];
      
      if (stand.brewing) {
        const update = this.processTick(standId);
        if (update) {
          updates.push(update);
        }
      }
    }
    
    return updates;
  }
}

module.exports = BrewingManager; 