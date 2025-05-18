/**
 * PotPatternRegistry - Manages pottery patterns for the Decorated Pots Expansion
 * Part of the Minecraft 1.23 Update
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
    
    // New patterns for 1.23 Update
    const newPatterns = [
      // Magical category patterns
      { id: 'enchanted', name: 'Enchanted', category: 'magical', rarity: 'rare', effect: 'magical_storage' },
      { id: 'mystical', name: 'Mystical', category: 'magical', rarity: 'rare', effect: 'item_preservation' },
      { id: 'alchemical', name: 'Alchemical', category: 'magical', rarity: 'epic', effect: 'brew_amplification' },
      { id: 'runic', name: 'Runic', category: 'magical', rarity: 'epic', effect: 'ender_resonance' },
      
      // Decorative category additions
      { id: 'flowery', name: 'Flowery', category: 'decoration', rarity: 'common', effect: 'visual_particles' },
      { id: 'royal', name: 'Royal', category: 'decoration', rarity: 'rare', effect: 'prestige' },
      { id: 'ancient', name: 'Ancient', category: 'decoration', rarity: 'epic', effect: 'historical_resonance' },
      
      // New musical category
      { id: 'musical', name: 'Musical', category: 'musical', rarity: 'uncommon', effect: 'sound_emission' },
      { id: 'melodic', name: 'Melodic', category: 'musical', rarity: 'rare', effect: 'note_block_resonance' },
      { id: 'harmonic', name: 'Harmonic', category: 'musical', rarity: 'epic', effect: 'sound_amplification' },
      
      // Technical category (redstone interaction)
      { id: 'redstone', name: 'Redstone', category: 'technical', rarity: 'rare', effect: 'signal_output' },
      { id: 'clockwork', name: 'Clockwork', category: 'technical', rarity: 'epic', effect: 'timer' },
      { id: 'compass', name: 'Compass', category: 'technical', rarity: 'rare', effect: 'direction_sensing' }
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