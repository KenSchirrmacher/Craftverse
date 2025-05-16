/**
 * BaseFeature - Abstract base class for all world generation features
 * Provides common functionality and interface for feature generation
 */

class BaseFeature {
  /**
   * Create a new world generation feature
   * @param {string} id - Unique identifier for this feature
   */
  constructor(id) {
    if (!id) {
      throw new Error('Feature ID is required');
    }
    
    this.id = id;
  }
  
  /**
   * Generate the feature at the given position
   * @param {Object} world - World instance
   * @param {Object} position - Position to generate at
   * @param {Object} random - Random generator
   * @returns {boolean} - Whether generation was successful
   */
  generate(world, position, random) {
    // This is an abstract method that should be overridden by subclasses
    console.warn(`Feature ${this.id} does not implement generate()`);
    return false;
  }
  
  /**
   * Check if the feature can be generated at the given position
   * @param {Object} world - World instance
   * @param {Object} position - Position to check
   * @returns {boolean} - Whether feature can generate
   */
  canGenerate(world, position) {
    // This is an abstract method that should be overridden by subclasses
    console.warn(`Feature ${this.id} does not implement canGenerate()`);
    return false;
  }
  
  /**
   * Get the bounds of this feature if generated at the given position
   * @param {Object} position - Position to generate at
   * @returns {Object} - Bounds (min/max positions) of the feature
   */
  getBounds(position) {
    // Default implementation returns a small bounding box
    return {
      min: { x: position.x - 1, y: position.y, z: position.z - 1 },
      max: { x: position.x + 1, y: position.y + 2, z: position.z + 1 }
    };
  }
  
  /**
   * Shuffle an array in-place using the provided random generator
   * @param {Array} array - Array to shuffle
   * @param {Object} random - Random generator
   */
  shuffleArray(array, random) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(random.nextFloat() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

module.exports = BaseFeature; 