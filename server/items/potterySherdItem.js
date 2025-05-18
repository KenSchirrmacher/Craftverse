/**
 * PotterySherdItem - Archaeological artifact collected through excavation
 * Part of the Trails & Tales Update
 * Enhanced for the Minecraft 1.23 Update's Decorated Pots Expansion
 */

const Item = require('./item');
const PotPatternRegistry = require('./potPatternRegistry');

class PotterySherdItem extends Item {
  /**
   * Create a new pottery sherd item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    // Pattern determines the appearance and name
    const pattern = options.pattern || 'arms_up';
    
    // Format the name with proper capitalization
    const formattedPattern = pattern
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    super({
      type: `pottery_sherd_${pattern}`,
      name: `${formattedPattern} Pottery Sherd`,
      stackable: true,
      maxStackSize: 64,
      ...options
    });
    
    // Pottery sherd properties
    this.pattern = pattern;
    this.origin = options.origin || 'unknown'; // Where it was found
    this.category = this.getCategoryFromPattern(pattern);
    this.rarity = this.getRarityFromPattern(pattern);
    this.effect = this.getEffectFromPattern(pattern);
    
    // Initialize registry if needed (singleton pattern)
    if (!PotterySherdItem.patternRegistry) {
      PotterySherdItem.patternRegistry = new PotPatternRegistry();
    }
  }
  
  /**
   * Determine the category based on the pattern
   * @private
   * @param {string} pattern - Pattern name
   * @returns {string} - Category name
   */
  getCategoryFromPattern(pattern) {
    // Use registry if available
    if (PotterySherdItem.patternRegistry) {
      const patternInfo = PotterySherdItem.patternRegistry.getPattern(pattern);
      if (patternInfo) {
        return patternInfo.category;
      }
    }
    
    // Fallback to hardcoded categories for original patterns
    const categories = {
      'decoration': ['prize', 'heartbreak', 'explorer', 'skull', 'archer', 'flowery', 'royal', 'ancient'],
      'storytelling': ['arms_up', 'friend', 'howl'],
      'crafting': ['brewer', 'angler', 'shelter', 'danger', 'miner'],
      'magical': ['enchanted', 'mystical', 'alchemical', 'runic'],
      'musical': ['musical', 'melodic', 'harmonic'],
      'technical': ['redstone', 'clockwork', 'compass']
    };
    
    for (const [category, patterns] of Object.entries(categories)) {
      if (patterns.includes(pattern)) {
        return category;
      }
    }
    
    return 'miscellaneous';
  }
  
  /**
   * Determine the rarity based on the pattern
   * @private
   * @param {string} pattern - Pattern name
   * @returns {string} - Rarity level
   */
  getRarityFromPattern(pattern) {
    // Use registry if available
    if (PotterySherdItem.patternRegistry) {
      const patternInfo = PotterySherdItem.patternRegistry.getPattern(pattern);
      if (patternInfo) {
        return patternInfo.rarity;
      }
    }
    
    // Fallback to default rarity for unknown patterns
    return 'common';
  }
  
  /**
   * Get special effect from pattern
   * @private
   * @param {string} pattern - Pattern name
   * @returns {string|null} - Effect name or null if none
   */
  getEffectFromPattern(pattern) {
    // Use registry if available
    if (PotterySherdItem.patternRegistry) {
      const patternInfo = PotterySherdItem.patternRegistry.getPattern(pattern);
      if (patternInfo && patternInfo.effect) {
        return patternInfo.effect;
      }
    }
    
    // Hardcoded effects for new patterns
    const effects = {
      'enchanted': 'magical_storage',
      'mystical': 'item_preservation',
      'alchemical': 'brew_amplification',
      'runic': 'ender_resonance',
      'flowery': 'visual_particles',
      'royal': 'prestige',
      'ancient': 'historical_resonance',
      'musical': 'sound_emission',
      'melodic': 'note_block_resonance',
      'harmonic': 'sound_amplification',
      'redstone': 'signal_output',
      'clockwork': 'timer',
      'compass': 'direction_sensing'
    };
    
    return effects[pattern] || null;
  }
  
  /**
   * Get information for the item tooltip
   * @returns {Array} - Array of tooltip lines
   */
  getTooltip() {
    const tooltip = super.getTooltip();
    
    // Add pottery sherd-specific information
    tooltip.push('');
    tooltip.push(`Category: ${this.category.charAt(0).toUpperCase() + this.category.slice(1)}`);
    tooltip.push(`Rarity: ${this.rarity.charAt(0).toUpperCase() + this.rarity.slice(1)}`);
    
    // Add effect information if present
    if (this.effect) {
      tooltip.push('');
      tooltip.push('Special Effect:');
      
      // Format effect description based on effect type
      switch (this.effect) {
        case 'magical_storage':
          tooltip.push('Increases storage capacity when used on a pot');
          break;
        case 'item_preservation':
          tooltip.push('Preserves item enchantments and durability');
          break;
        case 'brew_amplification':
          tooltip.push('Enhances potions stored inside the pot');
          break;
        case 'ender_resonance':
          tooltip.push('Creates a connection to the player\'s ender chest');
          break;
        case 'visual_particles':
          tooltip.push('Emits decorative particles when a player is nearby');
          break;
        case 'sound_emission':
          tooltip.push('Plays musical notes when interacted with');
          break;
        case 'signal_output':
          tooltip.push('Outputs redstone signal based on contents');
          break;
        case 'timer':
          tooltip.push('Periodically emits redstone pulses');
          break;
        default:
          tooltip.push(`${this.effect.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`);
      }
    } else {
      tooltip.push('');
      tooltip.push('Can be used to decorate');
      tooltip.push('pottery or create decorated pots.');
    }
    
    return tooltip;
  }
  
  /**
   * Get custom data for client rendering
   * @returns {Object} - Custom client data
   */
  getClientData() {
    return {
      ...super.getClientData(),
      pattern: this.pattern,
      category: this.category,
      rarity: this.rarity,
      effect: this.effect
    };
  }
  
  /**
   * Handle crafting with pottery
   * @param {Object} craftingGrid - Crafting grid data
   * @returns {boolean} - Whether this item can be used in the given recipe
   */
  canCraftWith(craftingGrid) {
    // Check if crafting with clay or pot base
    if (!craftingGrid) return false;
    
    let hasClay = false;
    let hasPotBase = false;
    let hasEnhancedPotBase = false;
    
    for (const item of craftingGrid) {
      if (!item) continue;
      if (item.type === 'clay_ball') hasClay = true;
      if (item.type === 'pot_base') hasPotBase = true;
      if (item.type === 'enhanced_pot_base') hasEnhancedPotBase = true;
    }
    
    return hasClay || hasPotBase || hasEnhancedPotBase;
  }
  
  /**
   * Get the pot effect for this sherd
   * @returns {Object|null} - Effect data or null if no effect
   */
  getPotEffect() {
    if (!this.effect) return null;
    
    // Create effect data based on sherd pattern
    return {
      type: this.effect,
      strength: this.getEffectStrength(),
      source: this.pattern
    };
  }
  
  /**
   * Get the strength of this sherd's effect
   * @returns {number} - Effect strength (1-3)
   * @private
   */
  getEffectStrength() {
    // Base effect strength on rarity
    switch (this.rarity) {
      case 'common': return 1;
      case 'uncommon': return 1;
      case 'rare': return 2;
      case 'epic': return 3;
      default: return 1;
    }
  }
  
  /**
   * Serialize pottery sherd data
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      pattern: this.pattern,
      origin: this.origin,
      category: this.category,
      rarity: this.rarity,
      effect: this.effect
    };
  }
  
  /**
   * Create pottery sherd from serialized data
   * @param {Object} data - Serialized data
   * @returns {PotterySherdItem} - New pottery sherd instance
   */
  static deserialize(data) {
    if (!data) return null;
    
    return new PotterySherdItem({
      id: data.id,
      type: data.type,
      count: data.count,
      pattern: data.pattern,
      origin: data.origin
    });
  }
}

// Static property for pattern registry (singleton)
PotterySherdItem.patternRegistry = null;

module.exports = PotterySherdItem; 