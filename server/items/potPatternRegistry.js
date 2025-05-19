/**
 * PotPatternRegistry - Manages pottery patterns for the Decorated Pots Expansion
 * Part of the Minecraft 1.24 Update
 */

class PotPatternRegistry {
  constructor() {
    this.patterns = new Map();
    this.categories = new Map();
    
    // Initialize with default patterns
    this.initializeDefaultPatterns();
  }
  
  /**
   * Initialize the registry with default patterns
   * @private
   */
  initializeDefaultPatterns() {
    // Original patterns from Trails & Tales Update
    const originalPatterns = [
      { id: 'arms_up', name: 'Arms Up', category: 'storytelling', rarity: 'common' },
      { id: 'skull', name: 'Skull', category: 'decoration', rarity: 'common' },
      { id: 'prize', name: 'Prize', category: 'decoration', rarity: 'uncommon' },
      { id: 'heartbreak', name: 'Heartbreak', category: 'decoration', rarity: 'uncommon' },
      { id: 'howl', name: 'Howl', category: 'storytelling', rarity: 'rare' },
      { id: 'explorer', name: 'Explorer', category: 'decoration', rarity: 'rare' },
      { id: 'archer', name: 'Archer', category: 'decoration', rarity: 'rare' },
      { id: 'friend', name: 'Friend', category: 'storytelling', rarity: 'uncommon' },
      { id: 'miner', name: 'Miner', category: 'crafting', rarity: 'uncommon' },
      { id: 'danger', name: 'Danger', category: 'crafting', rarity: 'rare' },
      { id: 'brewer', name: 'Brewer', category: 'crafting', rarity: 'uncommon' },
      { id: 'angler', name: 'Angler', category: 'crafting', rarity: 'uncommon' },
      { id: 'shelter', name: 'Shelter', category: 'crafting', rarity: 'common' }
    ];
    
    // New patterns for 1.24 Update
    const newPatterns = [
      // Historical category patterns
      { id: 'pharaoh', name: 'Pharaoh', category: 'historical', rarity: 'rare', effect: 'time_manipulation' },
      { id: 'dynasty', name: 'Dynasty', category: 'historical', rarity: 'epic', effect: 'ancient_wisdom' },
      { id: 'empire', name: 'Empire', category: 'historical', rarity: 'rare', effect: 'civilization_boost' },
      { id: 'legacy', name: 'Legacy', category: 'historical', rarity: 'epic', effect: 'historical_resonance' },
      
      // Mythological category patterns
      { id: 'dragon', name: 'Dragon', category: 'mythological', rarity: 'epic', effect: 'dragon_essence' },
      { id: 'phoenix', name: 'Phoenix', category: 'mythological', rarity: 'rare', effect: 'rebirth' },
      { id: 'griffin', name: 'Griffin', category: 'mythological', rarity: 'rare', effect: 'flight_essence' },
      { id: 'unicorn', name: 'Unicorn', category: 'mythological', rarity: 'epic', effect: 'magical_purity' },
      
      // Natural category patterns
      { id: 'oak', name: 'Oak', category: 'natural', rarity: 'common', effect: 'growth_boost' },
      { id: 'rose', name: 'Rose', category: 'natural', rarity: 'uncommon', effect: 'beauty_essence' },
      { id: 'wolf', name: 'Wolf', category: 'natural', rarity: 'rare', effect: 'pack_mentality' },
      { id: 'eagle', name: 'Eagle', category: 'natural', rarity: 'rare', effect: 'keen_vision' },
      
      // Abstract category patterns
      { id: 'spiral', name: 'Spiral', category: 'abstract', rarity: 'uncommon', effect: 'energy_flow' },
      { id: 'mandala', name: 'Mandala', category: 'abstract', rarity: 'rare', effect: 'balance' },
      { id: 'fractal', name: 'Fractal', category: 'abstract', rarity: 'epic', effect: 'infinite_pattern' },
      { id: 'zen', name: 'Zen', category: 'abstract', rarity: 'rare', effect: 'inner_peace' }
    ];
    
    // Register all patterns
    for (const pattern of [...originalPatterns, ...newPatterns]) {
      this.registerPattern(pattern);
    }
  }
  
  /**
   * Register a new pattern
   * @param {Object} pattern - The pattern definition
   * @param {string} pattern.id - Unique identifier for the pattern
   * @param {string} pattern.name - Display name
   * @param {string} pattern.category - Category the pattern belongs to
   * @param {string} pattern.rarity - Rarity of the pattern
   * @param {string} [pattern.effect] - Special effect of the pattern (if any)
   * @returns {boolean} - Success of registration
   */
  registerPattern(pattern) {
    if (!pattern || !pattern.id || !pattern.name || !pattern.category) {
      return false;
    }
    
    // Register the pattern
    this.patterns.set(pattern.id, pattern);
    
    // Update category mapping
    if (!this.categories.has(pattern.category)) {
      this.categories.set(pattern.category, []);
    }
    
    const categoryPatterns = this.categories.get(pattern.category);
    if (!categoryPatterns.includes(pattern.id)) {
      categoryPatterns.push(pattern.id);
    }
    
    return true;
  }
  
  /**
   * Get a pattern by ID
   * @param {string} patternId - The pattern ID
   * @returns {Object|null} - The pattern or null if not found
   */
  getPattern(patternId) {
    return this.patterns.get(patternId) || null;
  }
  
  /**
   * Get all available pattern categories
   * @returns {Array} - List of category names
   */
  getPatternCategories() {
    return Array.from(this.categories.keys());
  }
  
  /**
   * Get all patterns in a category
   * @param {string} category - The category name
   * @returns {Array} - Array of pattern IDs in the category
   */
  getPatternsByCategory(category) {
    return this.categories.get(category) || [];
  }
  
  /**
   * Get patterns by rarity
   * @param {string} rarity - The rarity level
   * @returns {Array} - Array of pattern IDs with the specified rarity
   */
  getPatternsByRarity(rarity) {
    const result = [];
    for (const [id, pattern] of this.patterns.entries()) {
      if (pattern.rarity === rarity) {
        result.push(id);
      }
    }
    return result;
  }
  
  /**
   * Get patterns with a specific effect
   * @param {string} effect - The effect name
   * @returns {Array} - Array of pattern IDs with the specified effect
   */
  getPatternsWithEffect(effect) {
    const result = [];
    for (const [id, pattern] of this.patterns.entries()) {
      if (pattern.effect === effect) {
        result.push(id);
      }
    }
    return result;
  }
  
  /**
   * Check if a pattern exists
   * @param {string} patternId - The pattern ID
   * @returns {boolean} - Whether the pattern exists
   */
  hasPattern(patternId) {
    return this.patterns.has(patternId);
  }
  
  /**
   * Serialize the registry data
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      patterns: Array.from(this.patterns.entries()),
      categories: Array.from(this.categories.entries())
    };
  }
  
  /**
   * Create registry from serialized data
   * @param {Object} data - Serialized data
   * @returns {PotPatternRegistry} - New registry instance
   * @static
   */
  static deserialize(data) {
    if (!data) return new PotPatternRegistry();
    
    const registry = new PotPatternRegistry();
    registry.patterns = new Map(data.patterns);
    registry.categories = new Map(data.categories);
    
    return registry;
  }
}

module.exports = PotPatternRegistry; 