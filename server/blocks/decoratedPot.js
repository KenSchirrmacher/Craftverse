/**
 * DecoratedPot - Block that can display up to 4 sherd patterns
 * Part of the Trails & Tales Update's pottery system
 * Enhanced for the Minecraft 1.24 Update
 */

const Block = require('./block');
const PotteryPatternCombiner = require('../utils/potteryPatternCombiner');

class DecoratedPot extends Block {
  /**
   * Create a new decorated pot block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'decorated_pot',
      name: 'Decorated Pot',
      hardness: 0.5,
      toolType: 'pickaxe',
      requiredToolLevel: 0, // Can break with any tier
      transparent: false,
      solid: true,
      gravity: false,
      ...options
    });
    
    // Make sure type is set correctly
    this.type = 'decorated_pot';
    
    // We need displayName to match the test expectations
    this.displayName = 'Decorated Pot';
    
    // The sherds displayed on each side (north, east, south, west)
    // Each should be a pottery sherd pattern name or null for blank side
    this.sherds = options.sherds || {
      north: null, 
      east: null, 
      south: null, 
      west: null
    };
    
    // Inventory of the decorated pot
    this.inventory = options.inventory || {
      slots: 1, // Can hold one item stack
      items: []
    };
    
    this.rotationY = options.rotationY || 0; // For determining which side faces which direction
    
    // Initialize pattern combiner
    this.patternCombiner = new PotteryPatternCombiner();
    
    // Active effects from pattern combinations
    this.activeEffects = new Map();
  }
  
  /**
   * Get all sherd patterns currently on the pot
   * @returns {Array} - Array of sherd patterns
   */
  getSherdPatterns() {
    return Object.values(this.sherds).filter(pattern => pattern !== null);
  }
  
  /**
   * Update active effects based on current sherd patterns
   * @private
   */
  updateActiveEffects() {
    this.activeEffects.clear();
    
    const patterns = this.getSherdPatterns();
    if (patterns.length < 2) return;
    
    // Get combination effect
    const combination = this.patternCombiner.getCombinationEffect(patterns);
    if (combination) {
      this.activeEffects.set(combination.effect, {
        strength: this.patternCombiner.calculateEffectStrength(patterns),
        description: combination.description
      });
    }
  }
  
  /**
   * Handle right-click interaction with the pot
   * @param {Object} player - The player interacting with the pot
   * @param {Object} itemInHand - Item the player is holding
   * @returns {Object|boolean} - Result of the interaction
   */
  interact(player, itemInHand) {
    // If player is sneaking and holding nothing, pick up the pot
    if (player.sneaking && (!itemInHand || itemInHand.type === 'air')) {
      return this.pickup(player);
    }
    
    // If pot has an item and player is not holding an item, retrieve the item
    if (this.inventory.items.length > 0 && (!itemInHand || itemInHand.type === 'air')) {
      return this.retrieveItem(player);
    }
    
    // If player is holding an item and pot is empty, store it
    if (itemInHand && this.inventory.items.length === 0) {
      return this.storeItem(player, itemInHand);
    }
    
    // Apply pattern combination effects
    this.updateActiveEffects();
    
    return false;
  }
  
  /**
   * Store an item in the pot
   * @param {Object} player - The player storing the item
   * @param {Object} item - The item to store
   * @returns {boolean} - Whether the operation was successful
   */
  storeItem(player, item) {
    if (!player || !item) return false;
    
    // Make a copy of the item to store (just one)
    const itemToStore = {
      ...item,
      count: 1
    };
    
    // Apply pattern effects to stored item
    if (this.activeEffects.size > 0) {
      for (const [effect, data] of this.activeEffects) {
        this.applyEffectToItem(itemToStore, effect, data.strength);
      }
    }
    
    // Add to inventory
    this.inventory.items.push(itemToStore);
    
    // Reduce player's item count
    const remainingCount = Math.max(0, item.count - 1);
    if (remainingCount > 0) {
      return { 
        success: true, 
        itemInHand: { ...item, count: remainingCount } 
      };
    } else {
      return { 
        success: true, 
        itemInHand: null 
      };
    }
  }
  
  /**
   * Apply a pattern effect to an item
   * @param {Object} item - The item to modify
   * @param {string} effect - The effect to apply
   * @param {number} strength - The effect strength
   * @private
   */
  applyEffectToItem(item, effect, strength) {
    switch (effect) {
      case 'time_anomaly':
        // Preserve item durability
        if (item.durability) {
          item.durability = Math.max(item.durability, item.maxDurability);
        }
        break;
        
      case 'mythical_convergence':
        // Enhance item enchantments
        if (item.enchantments) {
          for (const enchant of item.enchantments) {
            enchant.level = Math.min(enchant.level + strength, 5);
          }
        }
        break;
        
      case 'nature_harmony':
        // Enhance natural items
        if (item.type.includes('plant') || item.type.includes('seed')) {
          item.growthRate = (item.growthRate || 1) * (1 + strength * 0.2);
        }
        break;
        
      case 'pattern_resonance':
        // Add visual effects
        item.particleEffects = item.particleEffects || [];
        item.particleEffects.push({
          type: 'geometric',
          strength: strength
        });
        break;
        
      // Add more effect handlers as needed
    }
  }
  
  /**
   * Retrieve an item from the pot
   * @param {Object} player - The player retrieving the item
   * @returns {boolean} - Whether the operation was successful
   */
  retrieveItem(player) {
    if (!player || this.inventory.items.length === 0) return false;
    
    // Get the item from the pot
    const item = this.inventory.items.pop();
    
    // Add to player's inventory or drop if full
    if (player.giveItem) {
      player.giveItem(item);
    }
    
    return true;
  }
  
  /**
   * Pick up the decorated pot as an item
   * @param {Object} player - The player picking up the pot
   * @returns {boolean} - Whether the operation was successful
   */
  pickup(player) {
    if (!player) return false;
    
    // Create a decorated pot item with the current sherd configuration
    const potItem = {
      type: 'decorated_pot',
      name: 'Decorated Pot',
      count: 1,
      sherds: { ...this.sherds },
      inventory: { ...this.inventory }
    };
    
    // Add to player's inventory or drop if full
    if (player.giveItem) {
      player.giveItem(potItem);
    }
    
    // Return true to indicate the block should be removed
    return { success: true, removeBlock: true };
  }
  
  /**
   * Handle breaking the decorated pot
   * @returns {Array} - Array of items to drop
   */
  getDrops() {
    const drops = [];
    
    // Always drop a pot base
    drops.push({
      type: 'pot_base',
      count: 1
    });
    
    // Drop any sherds that were used
    for (const side in this.sherds) {
      if (this.sherds[side]) {
        drops.push({
          type: `pottery_sherd_${this.sherds[side]}`,
          count: 1
        });
      }
    }
    
    // Drop any items stored inside
    if (this.inventory.items.length > 0) {
      drops.push(...this.inventory.items);
    }
    
    return drops;
  }
  
  /**
   * Get data for rendering the block
   * @returns {Object} - Render data
   */
  getRenderData() {
    return {
      ...super.getRenderData(),
      sherds: this.sherds,
      rotationY: this.rotationY,
      activeEffects: Array.from(this.activeEffects.entries())
    };
  }
  
  /**
   * Serialize the decorated pot data
   * @returns {Object} - Serialized data
   */
  serialize() {
    const data = {
      id: this.id,
      type: this.type,
      sherds: this.sherds,
      inventory: this.inventory,
      rotationY: this.rotationY,
      activeEffects: Array.from(this.activeEffects.entries())
    };
    return data;
  }
  
  /**
   * Create decorated pot from serialized data
   * @param {Object} data - Serialized data
   * @returns {DecoratedPot} - New decorated pot instance
   * @static
   */
  static deserialize(data) {
    if (!data) return null;
    
    const pot = new DecoratedPot({
      id: data.id,
      sherds: data.sherds,
      inventory: data.inventory,
      rotationY: data.rotationY
    });
    
    if (data.activeEffects) {
      pot.activeEffects = new Map(data.activeEffects);
    }
    
    return pot;
  }
}

module.exports = DecoratedPot; 