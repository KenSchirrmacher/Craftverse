/**
 * PotionItem class - Represents potions in the game
 */

const Item = require('./item');
const PotionRegistry = require('./potionRegistry');
const PotionRecipes = require('./potionRecipes');

class PotionItem extends Item {
  constructor(id, options = {}) {
    super(id, { 
      ...options,
      stackable: options.stackable !== undefined ? options.stackable : true,
      maxStackSize: options.maxStackSize || 1
    });
    
    this.potionType = options.potionType || 'WATER';
    this.potionRegistry = options.potionRegistry || new PotionRegistry();
    this.potionRecipes = options.potionRecipes || new PotionRecipes();
    
    const potionData = this.potionRegistry.getPotion(this.potionType);
    if (potionData) {
      this.color = potionData.color;
      this.effects = [...potionData.effects];
      this.name = potionData.name;
      this.duration = potionData.duration;
      this.potency = potionData.potency;
      this.isLingering = this.potionType.startsWith('LINGERING_');
      this.isSplash = this.potionType.startsWith('SPLASH_') || this.isLingering;
    } else {
      this.color = '#0000FF'; // Default water color
      this.effects = [];
      this.name = 'Water Bottle';
      this.duration = 0;
      this.potency = 0;
      this.isLingering = false;
      this.isSplash = false;
    }
  }
  
  /**
   * Create a potion item from a potion type
   * @param {string} potionType - The potion type ID
   * @param {PotionRegistry} potionRegistry - Optional registry to use
   * @returns {PotionItem} The created potion item
   */
  static fromType(potionType, potionRegistry = null) {
    if (!potionRegistry) {
      potionRegistry = new PotionRegistry();
    }
    
    const potionData = potionRegistry.getPotion(potionType);
    if (!potionData) {
      return new PotionItem(`potion_${potionType.toLowerCase()}`, { 
        potionType, 
        potionRegistry 
      });
    }
    
    return new PotionItem(`potion_${potionType.toLowerCase()}`, {
      potionType,
      potionRegistry,
      name: potionData.name
    });
  }
  
  /**
   * Apply potion effects to an entity
   * @param {Entity} entity - The entity to apply effects to
   */
  applyEffects(entity) {
    if (!entity || !this.effects || this.effects.length === 0) {
      return;
    }
    
    this.effects.forEach(effect => {
      const duration = this.isLingering ? Math.floor(this.duration * 0.25) : this.duration;
      const potency = this.isLingering ? Math.max(1, Math.floor(this.potency * 0.5)) : this.potency;
      
      entity.addStatusEffect(effect.type, {
        duration: duration,
        level: potency,
        source: this
      });
    });
  }
  
  /**
   * Splash the potion in an area, affecting entities within range
   * @param {World} world - The world
   * @param {Vector3} position - Position to splash at
   * @param {number} radius - Radius of effect
   */
  splash(world, position, radius = 4) {
    if (!this.isSplash || !world) {
      return;
    }
    
    // Create particle effect
    world.addParticleEffect({
      type: 'POTION_SPLASH',
      position: position,
      color: this.color,
      count: 20,
      radius: radius * 0.5
    });
    
    // Get nearby entities
    const entities = world.getEntitiesInRadius(position, radius);
    
    // Apply effect to each entity with distance falloff
    entities.forEach(entity => {
      const distance = entity.position.distanceTo(position);
      if (distance <= radius) {
        // Calculate effect strength based on distance (closer = stronger)
        const effectMultiplier = 1 - (distance / radius);
        
        // Clone this potion with adjusted duration
        const adjustedPotion = new PotionItem(this.id, {
          potionType: this.potionType,
          potionRegistry: this.potionRegistry
        });
        
        // Adjust duration and potency by distance
        adjustedPotion.duration = Math.floor(this.duration * effectMultiplier);
        adjustedPotion.potency = this.potency;
        
        // Apply effects
        adjustedPotion.applyEffects(entity);
      }
    });
    
    // For lingering potions, create an area effect cloud
    if (this.isLingering) {
      this.createAreaEffectCloud(world, position, radius * 0.75);
    }
  }
  
  /**
   * Create an area effect cloud for lingering potions
   * @param {World} world - The world
   * @param {Vector3} position - Position to create cloud
   * @param {number} radius - Radius of cloud
   */
  createAreaEffectCloud(world, position, radius) {
    if (!this.isLingering || !world) {
      return;
    }
    
    // Duration for the cloud (in ticks)
    const cloudDuration = 30 * 20; // 30 seconds
    
    // Create the cloud entity
    world.createEntity('AREA_EFFECT_CLOUD', {
      position: position,
      radius: radius,
      color: this.color,
      duration: cloudDuration,
      effects: this.effects.map(effect => ({
        type: effect.type,
        duration: Math.floor(this.duration * 0.25),
        level: Math.max(1, Math.floor(this.potency * 0.5))
      })),
      particlesPerTick: 2
    });
  }
  
  /**
   * Use the potion item
   * @param {Player} player - The player using the item
   * @param {Object} context - Use context
   * @returns {boolean} Whether the use was successful
   */
  use(player, context) {
    if (!player) {
      return false;
    }
    
    if (context.type === 'RIGHT_CLICK') {
      if (this.isSplash) {
        // Throw the potion
        const throwVelocity = player.getLookDirection().multiply(1.5);
        const projectile = player.world.createEntity('THROWN_POTION', {
          position: player.position.add({ x: 0, y: 1.5, z: 0 }),
          velocity: throwVelocity,
          potion: this
        });
        
        // Remove one potion from inventory
        player.inventory.removeItem(this.id, 1);
        return true;
      } else {
        // Drink the potion
        this.applyEffects(player);
        
        // Play drinking sound
        player.world.playSound({
          sound: 'ENTITY_PLAYER_DRINK',
          position: player.position,
          volume: 1.0,
          pitch: 1.0
        });
        
        // Give empty bottle
        player.inventory.addItem('GLASS_BOTTLE', 1);
        
        // Remove one potion from inventory
        player.inventory.removeItem(this.id, 1);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if this potion can be brewed from a base potion and ingredient
   * @param {string} basePotion - Base potion type
   * @param {string} ingredient - Ingredient item ID
   * @returns {boolean} Whether brewing is possible
   */
  static canBrewFrom(basePotion, ingredient, potionRecipes = null) {
    if (!potionRecipes) {
      potionRecipes = new PotionRecipes();
    }
    
    const recipe = potionRecipes.getRecipe(basePotion, ingredient);
    return recipe !== null;
  }
  
  /**
   * Brew a potion from a base potion and ingredient
   * @param {string} basePotion - Base potion type
   * @param {string} ingredient - Ingredient item ID
   * @param {PotionRegistry} potionRegistry - Optional registry to use
   * @param {PotionRecipes} potionRecipes - Optional recipes to use
   * @returns {PotionItem|null} The brewed potion or null if recipe doesn't exist
   */
  static brew(basePotion, ingredient, potionRegistry = null, potionRecipes = null) {
    if (!potionRegistry) {
      potionRegistry = new PotionRegistry();
    }
    
    if (!potionRecipes) {
      potionRecipes = new PotionRecipes();
    }
    
    const recipe = potionRecipes.getRecipe(basePotion, ingredient);
    if (!recipe) {
      return null;
    }
    
    return PotionItem.fromType(recipe.result, potionRegistry);
  }
  
  /**
   * Get the tooltip for this potion
   * @returns {Array} Array of tooltip lines
   */
  getTooltip() {
    const tooltip = [this.name];
    
    // Add effect descriptions
    if (this.effects && this.effects.length > 0) {
      tooltip.push('');
      
      this.effects.forEach(effect => {
        let duration = this.duration;
        
        // Format duration
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        tooltip.push(`${effect.name} (${formattedDuration})`);
      });
    }
    
    return tooltip;
  }
}

module.exports = PotionItem; 