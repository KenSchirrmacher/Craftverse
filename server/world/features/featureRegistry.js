/**
 * FeatureRegistry - Manages registration and lookup of all world generation features
 * Handles features like trees, structures, plants, and other natural generation
 */

// Import features
const CherryTree = require('./cherryTree');
const BaseFeature = require('./baseFeature');

class FeatureRegistry {
  /**
   * Create a new feature registry
   */
  constructor() {
    // Map of feature types by ID
    this.features = new Map();
    
    // Register default features
    this.registerDefaultFeatures();
  }
  
  /**
   * Register a feature
   * @param {BaseFeature} feature - Feature instance to register
   */
  registerFeature(feature) {
    if (!feature || !feature.id) {
      console.error('Attempted to register invalid feature:', feature);
      return false;
    }
    
    if (this.features.has(feature.id)) {
      console.warn(`Feature type '${feature.id}' already registered, overwriting`);
    }
    
    this.features.set(feature.id, feature);
    return true;
  }
  
  /**
   * Get a feature by ID
   * @param {string} id - Feature ID
   * @returns {BaseFeature|null} Feature instance or null if not found
   */
  getFeature(id) {
    return this.features.get(id) || null;
  }
  
  /**
   * Check if a feature is registered
   * @param {string} id - Feature ID
   * @returns {boolean} Whether feature is registered
   */
  hasFeature(id) {
    return this.features.has(id);
  }
  
  /**
   * Get all registered features
   * @returns {Array} Array of feature instances
   */
  getAllFeatures() {
    return Array.from(this.features.values());
  }
  
  /**
   * Get features by property
   * @param {string} property - Property name to check
   * @param {*} value - Value to match
   * @returns {BaseFeature[]} Array of matching feature instances
   */
  getFeaturesByProperty(property, value) {
    const result = [];
    for (const feature of this.features.values()) {
      if (feature[property] === value) {
        result.push(feature);
      }
    }
    return result;
  }
  
  /**
   * Register all default features
   * @private
   */
  registerDefaultFeatures() {
    // Register tree features
    this.registerFeature(new CherryTree());
    
    // Future: Register other world generation features
    // this.registerFeature(new OakTree());
    // this.registerFeature(new BirchTree());
    // this.registerFeature(new Boulder());
    // etc.
  }
  
  /**
   * Create a new feature instance
   * @param {string} type - Feature type ID
   * @param {Object} options - Additional feature options
   * @returns {BaseFeature|null} New feature instance or null if type not found
   */
  createFeature(type, options = {}) {
    const featureType = this.getFeature(type);
    if (!featureType) {
      console.error(`Feature type '${type}' not found`);
      return null;
    }
    
    // Create a new instance of this feature type
    try {
      const FeatureConstructor = featureType.constructor;
      return new FeatureConstructor(options);
    } catch (error) {
      console.error(`Error creating feature of type '${type}':`, error);
      return null;
    }
  }
  
  /**
   * Generate a feature in the world
   * @param {string} type - Feature type ID
   * @param {Object} world - World instance
   * @param {Object} position - Position to generate at
   * @param {Object} random - Random generator
   * @returns {boolean} Whether generation was successful
   */
  generateFeature(type, world, position, random) {
    const feature = this.getFeature(type);
    if (!feature) {
      console.error(`Feature type '${type}' not found for generation`);
      return false;
    }
    
    return feature.generate(world, position, random);
  }
}

// Export a singleton instance
module.exports = new FeatureRegistry(); 