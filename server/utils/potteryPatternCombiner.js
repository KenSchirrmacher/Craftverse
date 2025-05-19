/**
 * PotteryPatternCombiner - Handles pattern combination mechanics for decorated pots
 * Part of the Minecraft 1.24 Update
 */

class PotteryPatternCombiner {
  constructor() {
    this.combinationEffects = new Map();
    this.initializeCombinationEffects();
  }
  
  /**
   * Initialize the combination effects
   * @private
   */
  initializeCombinationEffects() {
    // Historical category combinations
    this.combinationEffects.set('historical_historical', {
      effect: 'time_anomaly',
      description: 'Creates a localized time distortion field',
      strength: 2
    });
    
    // Mythological category combinations
    this.combinationEffects.set('mythological_mythological', {
      effect: 'mythical_convergence',
      description: 'Summons a temporary mythical creature',
      strength: 3
    });
    
    // Natural category combinations
    this.combinationEffects.set('natural_natural', {
      effect: 'nature_harmony',
      description: 'Enhances all natural processes in the area',
      strength: 2
    });
    
    // Abstract category combinations
    this.combinationEffects.set('abstract_abstract', {
      effect: 'pattern_resonance',
      description: 'Creates a field of geometric energy',
      strength: 2
    });
    
    // Cross-category combinations
    this.combinationEffects.set('historical_mythological', {
      effect: 'legendary_echo',
      description: 'Reveals ancient mythical knowledge',
      strength: 3
    });
    
    this.combinationEffects.set('historical_natural', {
      effect: 'ancient_growth',
      description: 'Accelerates growth of ancient plants',
      strength: 2
    });
    
    this.combinationEffects.set('historical_abstract', {
      effect: 'temporal_pattern',
      description: 'Creates time-based geometric patterns',
      strength: 3
    });
    
    this.combinationEffects.set('mythological_natural', {
      effect: 'beast_essence',
      description: 'Enhances animal abilities',
      strength: 2
    });
    
    this.combinationEffects.set('mythological_abstract', {
      effect: 'mystical_geometry',
      description: 'Creates magical geometric patterns',
      strength: 3
    });
    
    this.combinationEffects.set('natural_abstract', {
      effect: 'organic_pattern',
      description: 'Creates living geometric patterns',
      strength: 2
    });
  }
  
  /**
   * Get the combination effect for a set of patterns
   * @param {Array} patterns - Array of pattern objects
   * @returns {Object|null} - Combination effect or null if none
   */
  getCombinationEffect(patterns) {
    if (!patterns || patterns.length < 2) return null;
    
    // Get unique categories from patterns
    const categories = [...new Set(patterns.map(p => p.category))];
    
    // Check for same-category combinations
    if (categories.length === 1) {
      const key = `${categories[0]}_${categories[0]}`;
      const effect = this.combinationEffects.get(key);
      if (effect) {
        return {
          ...effect,
          strength: effect.strength || 2 // Default strength for same-category combinations
        };
      }
    }
    
    // Check for cross-category combinations
    const key = categories.sort().join('_');
    return this.combinationEffects.get(key) || null;
  }
  
  /**
   * Calculate the total effect strength for a combination
   * @param {Array} patterns - Array of pattern objects
   * @returns {number} - Total effect strength
   */
  calculateEffectStrength(patterns) {
    if (!patterns || patterns.length === 0) return 0;
    
    // Base strength from individual patterns
    const baseStrength = patterns.reduce((sum, pattern) => {
      return sum + (pattern.getEffectStrength ? pattern.getEffectStrength() : 1);
    }, 0);
    
    // Get combination effect
    const combination = this.getCombinationEffect(patterns);
    if (!combination) return baseStrength;
    
    // Add combination bonus
    return baseStrength + (combination.strength || 2); // Default to 2 if not specified
  }
  
  /**
   * Get the description for a combination effect
   * @param {Array} patterns - Array of pattern objects
   * @returns {string|null} - Effect description or null if none
   */
  getCombinationDescription(patterns) {
    if (!this.canCombine(patterns)) return null;
    
    const combination = this.getCombinationEffect(patterns);
    return combination ? combination.description : null;
  }
  
  /**
   * Check if patterns can be combined
   * @param {Array} patterns - Array of pattern objects
   * @returns {boolean} - Whether the patterns can be combined
   */
  canCombine(patterns) {
    if (!patterns || patterns.length < 2) return false;
    
    // Get unique categories
    const categories = [...new Set(patterns.map(p => p.category))];
    
    // Check if we have a valid combination
    if (categories.length === 1) {
      return this.combinationEffects.has(`${categories[0]}_${categories[0]}`);
    }
    
    return this.combinationEffects.has(categories.sort().join('_'));
  }
}

module.exports = PotteryPatternCombiner; 