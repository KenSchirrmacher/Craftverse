/**
 * Special Arrows - Implementation for tipped and spectral arrows
 */

/**
 * Arrow types
 * @enum {string}
 */
const ArrowType = {
  NORMAL: 'arrow',
  SPECTRAL: 'spectral_arrow',
  TIPPED: 'tipped_arrow'
};

/**
 * Special Arrow class for handling tipped and spectral arrows
 */
class SpecialArrow {
  /**
   * Create a new special arrow
   * @param {Object} options - Arrow options
   * @param {string} options.type - Arrow type (normal, spectral, tipped)
   * @param {Object} options.effects - Effects to apply (for tipped arrows)
   * @param {number} options.duration - Effect duration in ticks
   */
  constructor(options = {}) {
    this.type = options.type || ArrowType.NORMAL;
    this.effects = options.effects || [];
    this.duration = options.duration || 200; // 10 seconds by default
    this.damage = options.damage || 1;
    this.critical = options.critical || false;
  }
  
  /**
   * Create a spectral arrow
   * @returns {SpecialArrow} - New spectral arrow
   */
  static createSpectralArrow() {
    return new SpecialArrow({
      type: ArrowType.SPECTRAL,
      effects: [{
        id: 'glowing',
        level: 1,
        duration: 200 // 10 seconds
      }],
      duration: 200
    });
  }
  
  /**
   * Create a tipped arrow with potion effects
   * @param {string} potionType - Potion type to apply
   * @param {Object} potionRegistry - Registry of potion types
   * @returns {SpecialArrow} - New tipped arrow
   */
  static createTippedArrow(potionType, potionRegistry) {
    // Get potion from registry
    const potion = potionRegistry ? potionRegistry.getPotionByType(potionType) : null;
    
    if (!potion) {
      console.warn(`Unknown potion type for tipped arrow: ${potionType}`);
      return new SpecialArrow(); // Return normal arrow
    }
    
    // Create tipped arrow with potion effects
    return new SpecialArrow({
      type: ArrowType.TIPPED,
      effects: potion.effects.map(effect => ({
        ...effect,
        duration: Math.floor(effect.duration * 0.5) // Tipped arrows have half duration
      })),
      damage: 1,
      duration: potion.effects[0]?.duration || 100
    });
  }
  
  /**
   * Apply arrow effects to an entity
   * @param {Object} entity - Entity to apply effects to
   * @param {Object} statusEffectsManager - Status effects manager
   */
  applyEffects(entity, statusEffectsManager) {
    if (!entity || !statusEffectsManager) return;
    
    // Apply all effects
    for (const effect of this.effects) {
      statusEffectsManager.addEffect(entity.id, effect.id, effect.level, effect.duration);
    }
    
    // For spectral arrows, apply the glowing effect
    if (this.type === ArrowType.SPECTRAL) {
      statusEffectsManager.addEffect(entity.id, 'glowing', 1, this.duration);
    }
  }
  
  /**
   * Get the color of the arrow (for rendering)
   * @returns {string} - Hex color code
   */
  getColor() {
    // For tipped arrows, get color from first effect
    if (this.type === ArrowType.TIPPED && this.effects && this.effects.length > 0) {
      const effectId = this.effects[0].id;
      return getPotionEffectColor(effectId);
    }
    
    // Default colors
    switch (this.type) {
      case ArrowType.SPECTRAL:
        return '#FFFFAA'; // Light yellow
      case ArrowType.TIPPED:
        return '#FF0000'; // Default red for unknown potions
      default:
        return '#AAAAAA'; // Gray for normal arrows
    }
  }
  
  /**
   * Convert arrow to data for sending to client
   * @returns {Object} - Arrow data
   */
  toJSON() {
    return {
      type: this.type,
      effects: this.effects,
      duration: this.duration,
      damage: this.damage,
      critical: this.critical,
      color: this.getColor()
    };
  }
  
  /**
   * Create an arrow from JSON data
   * @param {Object} data - Arrow data
   * @returns {SpecialArrow} - New arrow
   */
  static fromJSON(data) {
    return new SpecialArrow({
      type: data.type,
      effects: data.effects,
      duration: data.duration,
      damage: data.damage,
      critical: data.critical
    });
  }
}

/**
 * Get potion effect color
 * @param {string} effectId - Effect ID
 * @returns {string} - Hex color code
 */
function getPotionEffectColor(effectId) {
  // Common effect colors
  const effectColors = {
    regeneration: '#F9ABEF', // Pink
    strength: '#932423', // Red
    swiftness: '#7CAFC6', // Light blue
    fire_resistance: '#E49A3A', // Orange
    poison: '#4E9331', // Green
    healing: '#F82423', // Bright red
    night_vision: '#1F1FA1', // Dark blue
    weakness: '#484D48', // Gray
    harming: '#430A09', // Dark red
    water_breathing: '#2E5299', // Blue
    invisibility: '#7F8392', // Light gray
    slowness: '#5A6C81', // Dark gray
    leaping: '#22FF4C', // Bright green
    slow_falling: '#F7F8E0', // Cream
    glowing: '#FFFF99', // Yellow
    luck: '#339900', // Dark green
    wither: '#352A27', // Black
    haste: '#D9C043', // Gold
    mining_fatigue: '#4A4217', // Brown
  };
  
  return effectColors[effectId] || '#FF0000'; // Default to red
}

module.exports = {
  SpecialArrow,
  ArrowType
}; 