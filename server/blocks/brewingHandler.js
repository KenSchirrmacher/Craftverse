/**
 * BrewingHandler - Manages the brewing process and logic for brewing stands
 */

const EventEmitter = require('events');

class BrewingHandler extends EventEmitter {
  constructor(world, position, potionRegistry) {
    super();
    this.world = world;
    this.position = position;
    this.potionRegistry = potionRegistry;
    
    // Container slots
    this.ingredientSlot = null;
    this.fuelSlot = null;
    this.bottleSlots = [null, null, null];
    
    // Brewing state
    this.brewingTime = 0;
    this.totalBrewingTime = 400; // 20 seconds at 20 ticks per second
    this.fuelLevel = 0;
    this.maxFuelLevel = 20; // Each blaze powder provides 20 brews
    this.isActive = false;
    
    // Valid ingredients map (ingredient item ID -> resulting effect)
    this.validIngredients = {
      'nether_wart': 'base',
      'redstone': 'extend',
      'glowstone': 'enhance',
      'fermented_spider_eye': 'corrupt',
      'dragon_breath': 'lingering',
      'gunpowder': 'splash',
      'sugar': 'speed',
      'rabbit_foot': 'jump_boost',
      'blaze_powder': 'strength',
      'magma_cream': 'fire_resistance',
      'glistering_melon': 'healing',
      'spider_eye': 'poison',
      'ghast_tear': 'regeneration',
      'pufferfish': 'water_breathing',
      'phantom_membrane': 'slow_falling',
      'golden_carrot': 'night_vision',
      'turtle_shell': 'turtle_master'
    };
    
    // Valid bottle items that can be brewed
    this.validBottles = ['glass_bottle', 'potion', 'splash_potion', 'lingering_potion'];
    
    // Last tick time
    this.lastTick = Date.now();
  }
  
  tick() {
    const now = Date.now();
    const deltaTime = now - this.lastTick;
    this.lastTick = now;
    
    // Check if we should start brewing
    if (!this.isActive) {
      this.checkAndStartBrewing();
    }
    
    // Process active brewing
    if (this.isActive) {
      this.processBrewing(deltaTime);
    }
  }
  
  checkAndStartBrewing() {
    // Check if we have ingredient, fuel, and at least one valid bottle
    if (!this.ingredientSlot || this.fuelLevel <= 0) {
      return false;
    }
    
    // Check if ingredient is valid
    if (!this.isValidIngredient(this.ingredientSlot.id)) {
      return false;
    }
    
    // Check if we have at least one valid bottle to brew
    const hasValidBottle = this.bottleSlots.some(slot => 
      slot && this.isValidBottle(slot.id) && this.canApplyIngredient(this.ingredientSlot.id, slot)
    );
    
    if (!hasValidBottle) {
      return false;
    }
    
    // All checks passed, start brewing
    this.isActive = true;
    this.brewingTime = 0;
    this.emit('brewingStarted');
    return true;
  }
  
  processBrewing(deltaTime) {
    // Convert deltaTime from ms to game ticks (assuming 50ms per tick)
    const deltaTicks = deltaTime / 50;
    
    // Increment brewing time
    this.brewingTime += deltaTicks;
    
    // Check if brewing is complete
    if (this.brewingTime >= this.totalBrewingTime) {
      this.completeBrewing();
    }
    
    // Update clients
    this.emit('brewingProgress', this.brewingTime / this.totalBrewingTime);
  }
  
  completeBrewing() {
    // Process the brewing recipe
    let ingredient = this.ingredientSlot;
    let ingredientConsumed = false;
    
    // Apply ingredient effect to each valid bottle
    for (let i = 0; i < this.bottleSlots.length; i++) {
      const bottle = this.bottleSlots[i];
      if (bottle && this.isValidBottle(bottle.id) && this.canApplyIngredient(ingredient.id, bottle)) {
        // Apply the ingredient to the bottle
        const result = this.applyIngredient(ingredient.id, bottle);
        if (result) {
          this.bottleSlots[i] = result;
          ingredientConsumed = true;
        }
      }
    }
    
    // Consume ingredient if used
    if (ingredientConsumed) {
      if (this.ingredientSlot.count > 1) {
        this.ingredientSlot.count--;
      } else {
        this.ingredientSlot = null;
      }
      
      // Consume fuel
      this.fuelLevel--;
    }
    
    // Reset brewing state
    this.isActive = false;
    this.brewingTime = 0;
    
    // Notify clients
    this.emit('brewingComplete', {
      ingredientSlot: this.ingredientSlot,
      bottleSlots: this.bottleSlots,
      fuelLevel: this.fuelLevel
    });
  }
  
  isValidIngredient(itemId) {
    return itemId in this.validIngredients || itemId === 'gunpowder' || itemId === 'dragon_breath';
  }
  
  isValidBottle(itemId) {
    return this.validBottles.includes(itemId);
  }
  
  canApplyIngredient(ingredientId, bottle) {
    if (!bottle) return false;
    
    const effect = this.validIngredients[ingredientId];
    
    // Special case for water bottles and nether wart
    if (bottle.id === 'glass_bottle' && bottle.meta?.contains === 'water') {
      return ingredientId === 'nether_wart';
    }
    
    // Special cases for transformations
    if (ingredientId === 'gunpowder' && bottle.id === 'potion') {
      return true; // Regular potion to splash potion
    }
    
    if (ingredientId === 'dragon_breath' && bottle.id === 'splash_potion') {
      return true; // Splash potion to lingering potion
    }
    
    // For actual potions, check if the effect can be applied
    if (bottle.id === 'potion' || bottle.id === 'splash_potion' || bottle.id === 'lingering_potion') {
      if (!bottle.meta?.potionType) return false;
      
      const potionDef = this.potionRegistry.getPotion(bottle.meta.potionType);
      if (!potionDef) return false;
      
      // Fermented spider eye corrupts any potion
      if (ingredientId === 'fermented_spider_eye') return true;
      
      // Redstone extends duration (if not already extended)
      if (ingredientId === 'redstone' && !potionDef.extended) return true;
      
      // Glowstone enhances power (if not already enhanced)
      if (ingredientId === 'glowstone' && !potionDef.enhanced) return true;
      
      // Can't apply the same effect twice
      if (effect && potionDef.effects.some(e => e.type === effect)) return false;
      
      // Can't apply a regular ingredient to a base potion
      if (potionDef.name === 'Awkward Potion' && effect && effect !== 'base') return true;
      
      // Otherwise, can't apply
      return false;
    }
    
    return false;
  }
  
  applyIngredient(ingredientId, bottle) {
    if (!this.canApplyIngredient(ingredientId, bottle)) {
      return null;
    }
    
    // Create a copy of the bottle
    const result = JSON.parse(JSON.stringify(bottle));
    
    // Handle water bottle + nether wart = awkward potion
    if (bottle.id === 'glass_bottle' && bottle.meta?.contains === 'water' && ingredientId === 'nether_wart') {
      return {
        id: 'potion',
        count: 1,
        meta: {
          potionType: 'awkward',
          displayName: 'Awkward Potion'
        }
      };
    }
    
    // Handle potion to splash potion conversion
    if (ingredientId === 'gunpowder' && bottle.id === 'potion') {
      result.id = 'splash_potion';
      return result;
    }
    
    // Handle splash potion to lingering potion conversion
    if (ingredientId === 'dragon_breath' && bottle.id === 'splash_potion') {
      result.id = 'lingering_potion';
      return result;
    }
    
    // Get the effect to apply
    const effect = this.validIngredients[ingredientId];
    
    // Handle special modifiers
    if (effect === 'extend' || effect === 'enhance' || effect === 'corrupt') {
      const potionType = bottle.meta.potionType;
      const potionDef = this.potionRegistry.getPotion(potionType);
      
      if (!potionDef) return null;
      
      // Handle redstone (extend duration)
      if (effect === 'extend' && !potionDef.extended) {
        const extendedType = `${potionType}_extended`;
        const extendedPotion = this.potionRegistry.getPotion(extendedType);
        
        if (extendedPotion) {
          result.meta.potionType = extendedType;
          result.meta.displayName = extendedPotion.name;
        }
      } 
      // Handle glowstone (enhance power)
      else if (effect === 'enhance' && !potionDef.enhanced) {
        const enhancedType = `${potionType}_enhanced`;
        const enhancedPotion = this.potionRegistry.getPotion(enhancedType);
        
        if (enhancedPotion) {
          result.meta.potionType = enhancedType;
          result.meta.displayName = enhancedPotion.name;
        }
      } 
      // Handle fermented spider eye (corrupt/invert effect)
      else if (effect === 'corrupt') {
        const corruptedType = `${potionType}_corrupted`;
        const corruptedPotion = this.potionRegistry.getPotion(corruptedType);
        
        if (corruptedPotion) {
          result.meta.potionType = corruptedType;
          result.meta.displayName = corruptedPotion.name;
        }
      }
      
      return result;
    }
    
    // Handle regular ingredients for awkward potions
    if (bottle.meta.potionType === 'awkward' && effect && effect !== 'base') {
      result.meta.potionType = effect;
      const newPotion = this.potionRegistry.getPotion(effect);
      if (newPotion) {
        result.meta.displayName = newPotion.name;
      }
      return result;
    }
    
    return null;
  }
  
  addFuel(item) {
    if (item.id === 'blaze_powder') {
      this.fuelLevel = Math.min(this.maxFuelLevel, this.fuelLevel + 20);
      return true;
    }
    return false;
  }
  
  setItem(slotType, index, item) {
    if (slotType === 'ingredient') {
      this.ingredientSlot = item;
      return true;
    } else if (slotType === 'fuel') {
      // For fuel slot, automatically consume the item if it's valid fuel
      if (item && item.id === 'blaze_powder') {
        if (this.addFuel(item)) {
          if (item.count > 1) {
            item.count--;
            this.fuelSlot = item;
          } else {
            this.fuelSlot = null;
          }
        } else {
          this.fuelSlot = item;
        }
      } else {
        this.fuelSlot = item;
      }
      return true;
    } else if (slotType === 'bottle' && index >= 0 && index < 3) {
      this.bottleSlots[index] = item;
      return true;
    }
    return false;
  }
  
  getItem(slotType, index) {
    if (slotType === 'ingredient') {
      return this.ingredientSlot;
    } else if (slotType === 'fuel') {
      return this.fuelSlot;
    } else if (slotType === 'bottle' && index >= 0 && index < 3) {
      return this.bottleSlots[index];
    }
    return null;
  }
  
  getState() {
    return {
      ingredientSlot: this.ingredientSlot,
      fuelSlot: this.fuelSlot,
      bottleSlots: this.bottleSlots,
      brewingProgress: this.isActive ? this.brewingTime / this.totalBrewingTime : 0,
      fuelLevel: this.fuelLevel,
      maxFuelLevel: this.maxFuelLevel,
      isActive: this.isActive
    };
  }
  
  handleInteraction(player, action, data) {
    if (action === 'moveItem') {
      const { fromType, fromIndex, toType, toIndex, count } = data;
      const sourceItem = this.getItem(fromType, fromIndex);
      const targetItem = this.getItem(toType, toIndex);
      
      if (!sourceItem) return false;
      
      // Handle item movement
      if (targetItem === null) {
        // Move to empty slot
        if (count >= sourceItem.count) {
          // Move entire stack
          this.setItem(toType, toIndex, sourceItem);
          this.setItem(fromType, fromIndex, null);
        } else {
          // Split stack
          const newItem = { ...sourceItem, count };
          sourceItem.count -= count;
          this.setItem(toType, toIndex, newItem);
        }
      } else {
        // Check if items can stack
        if (sourceItem.id === targetItem.id) {
          // Same item type, stack them
          const maxTransfer = Math.min(sourceItem.count, 64 - targetItem.count);
          if (maxTransfer > 0) {
            targetItem.count += maxTransfer;
            sourceItem.count -= maxTransfer;
            
            if (sourceItem.count <= 0) {
              this.setItem(fromType, fromIndex, null);
            }
          }
        } else {
          // Different items, swap them
          this.setItem(toType, toIndex, sourceItem);
          this.setItem(fromType, fromIndex, targetItem);
        }
      }
      
      // Update clients
      this.emit('stateChanged', this.getState());
      return true;
    }
    
    return false;
  }
  
  toJSON() {
    return {
      position: this.position,
      ingredientSlot: this.ingredientSlot,
      fuelSlot: this.fuelSlot,
      bottleSlots: this.bottleSlots,
      brewingTime: this.brewingTime,
      fuelLevel: this.fuelLevel,
      isActive: this.isActive
    };
  }
  
  static fromJSON(world, data, potionRegistry) {
    const handler = new BrewingHandler(world, data.position, potionRegistry);
    handler.ingredientSlot = data.ingredientSlot;
    handler.fuelSlot = data.fuelSlot;
    handler.bottleSlots = data.bottleSlots;
    handler.brewingTime = data.brewingTime;
    handler.fuelLevel = data.fuelLevel;
    handler.isActive = data.isActive;
    return handler;
  }
}

module.exports = BrewingHandler; 