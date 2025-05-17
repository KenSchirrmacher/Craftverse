/**
 * OminousBottleItem - Bottle that can capture and store the Bad Omen effect
 * Part of the 1.22 Sorcery Update
 */

const Item = require('./item');

class OminousBottleItem extends Item {
  /**
   * Create a new Ominous Bottle item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    const defaults = {
      id: 'ominous_bottle',
      name: 'Ominous Bottle',
      description: 'Captures the Bad Omen effect from raid captains',
      type: 'ominous_bottle',
      subtype: 'potion',
      category: 'brewing',
      stackable: true,
      maxStackSize: 16,
      filled: false // Whether the bottle contains a captured Bad Omen effect
    };
    
    super({...defaults, ...options});
    
    // Item-specific properties
    this.filled = options.filled || defaults.filled;
    
    // Use provided capturedEffect if it exists, otherwise create default or null
    if (options.capturedEffect) {
      this.capturedEffect = options.capturedEffect;
    } else if (this.filled) {
      this.capturedEffect = { type: 'bad_omen', level: 1, duration: 6000 }; // 5 minutes in ticks
    } else {
      this.capturedEffect = null;
    }
    
    this.capturedFrom = options.capturedFrom || null; // The entity type the effect was captured from
  }
  
  /**
   * Use the bottle on a raid captain to capture its Bad Omen effect
   * @param {Player} player - The player using the item
   * @param {Object} context - Use context with target entity
   * @returns {boolean} Whether the effect was captured successfully
   */
  use(player, context) {
    // Can't use a filled bottle
    if (this.filled) return false;
    
    // Check if target is valid
    if (!context || !context.target) return false;
    
    // Check if target is a raid captain (pillager with banner, etc.)
    const isRaidCaptain = this.isRaidCaptain(context.target);
    if (!isRaidCaptain) return false;
    
    // Capture the Bad Omen effect
    this.filled = true;
    this.capturedEffect = { 
      type: 'bad_omen', 
      level: context.target.getBadOmenLevel ? context.target.getBadOmenLevel() : 1,
      duration: 6000 // 5 minutes in ticks
    };
    this.capturedFrom = context.target.type;
    
    // Visual and sound effects would be handled on the client side
    
    return true;
  }
  
  /**
   * Apply the captured Bad Omen effect to the player
   * @param {Player} player - The player to apply the effect to
   * @returns {boolean} Whether the effect was applied successfully
   */
  applyEffect(player) {
    // Can only apply effect if the bottle is filled
    if (!this.filled || !this.capturedEffect) return false;
    
    // Apply the Bad Omen effect to the player
    if (player.addStatusEffect) {
      player.addStatusEffect(
        this.capturedEffect.type,
        this.capturedEffect.level,
        this.capturedEffect.duration
      );
      
      // Empty the bottle after use
      this.filled = false;
      this.capturedEffect = null;
      
      // Return an empty bottle to the player's inventory
      // (This would be handled by the game engine)
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if an entity is a raid captain
   * @param {Object} entity - The entity to check
   * @returns {boolean} Whether the entity is a raid captain
   * @private
   */
  isRaidCaptain(entity) {
    // These are the mob types that can be raid captains
    const raidCaptainTypes = [
      'pillager',
      'vindicator',
      'evoker',
      'ravager'
    ];
    
    // Basic check for raid captain type
    if (!raidCaptainTypes.includes(entity.type)) return false;
    
    // For pillagers, check if they're carrying a banner
    if (entity.type === 'pillager') {
      return entity.carryingBanner === true;
    }
    
    // For other types, they're always considered captains
    return true;
  }
  
  /**
   * Get the tooltip text for the item
   * @returns {string[]} Array of tooltip lines
   */
  getTooltip() {
    const tooltip = [this.name];
    
    if (this.filled) {
      tooltip.push(`Contains: Bad Omen (Level ${this.capturedEffect.level})`);
      tooltip.push(`Captured from: ${this.capturedFrom}`);
    } else {
      tooltip.push('Empty');
      tooltip.push('Use on a raid captain to capture the Bad Omen effect');
    }
    
    return tooltip;
  }
  
  /**
   * Get client-side data for this item
   * @returns {Object} Data for the client
   */
  getClientData() {
    const data = super.getClientData();
    
    return {
      ...data,
      filled: this.filled,
      glowing: this.filled, // Filled bottles emit a slight glow
      capturedEffect: this.capturedEffect,
      capturedFrom: this.capturedFrom,
      texture: this.filled ? 'ominous_bottle_filled' : 'ominous_bottle'
    };
  }
  
  /**
   * Serialize to JSON
   * @returns {Object} Serialized data
   * @override
   */
  toJSON() {
    const data = super.toJSON();
    return {
      ...data,
      filled: this.filled,
      capturedEffect: this.capturedEffect,
      capturedFrom: this.capturedFrom
    };
  }
  
  /**
   * Deserialize from JSON
   * @param {Object} data - Serialized data
   * @returns {OminousBottleItem} New ominous bottle item
   * @static
   */
  static fromJSON(data) {
    return new OminousBottleItem({
      ...data,
      filled: data.filled,
      capturedEffect: data.capturedEffect,
      capturedFrom: data.capturedFrom
    });
  }
}

// Export the ominous bottle item class
module.exports = OminousBottleItem; 