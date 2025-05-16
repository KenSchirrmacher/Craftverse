const JungleBiome = require('./jungleBiome');

/**
 * Bamboo Jungle Biome - A special jungle variant with dense bamboo growth
 * Part of the 1.20 Update
 */
class BambooJungleBiome extends JungleBiome {
  /**
   * Create a new Bamboo Jungle biome
   * @param {Object} props - Optional properties to override defaults
   */
  constructor(props = {}) {
    // Call parent constructor with bamboo jungle specific properties
    super({
      id: 'bamboo_jungle',
      name: 'Bamboo Jungle',
      
      // Similar climate to jungle but slightly modified
      temperatureRange: { min: 0.75, max: 1.0 },
      precipitationRange: { min: 0.85, max: 1.0 },
      
      // Different feature weights for bamboo-heavy generation
      features: [
        { id: 'jungle_tree', weight: 0.3 },
        { id: 'jungle_tree_large', weight: 0.1 },
        { id: 'bamboo', weight: 0.7 },   // Much higher bamboo density
        { id: 'vines', weight: 0.4 },
        { id: 'cocoa_beans', weight: 0.05 },
        { id: 'melon', weight: 0.01 },
        { id: 'fern', weight: 0.2 }
      ],
      
      // Override any provided properties
      ...props
    });
  }
  
  /**
   * Get features at specified coordinates with bamboo jungle-specific generation
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Seeded random function
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Array} - Array of features to place at this position
   */
  getFeaturesAt(x, z, random, noiseGenerators) {
    const features = super.getFeaturesAt(x, z, random, noiseGenerators);
    
    // Additional bamboo clusters
    if (random() < 0.5) {  // Much higher chance for bamboo
      features.push({
        type: 'bamboo',
        height: 6 + Math.floor(random() * 8),
        count: 5 + Math.floor(random() * 15)  // Larger bamboo clusters
      });
    }
    
    return features;
  }
  
  /**
   * Get the fitness score for this biome based on climate parameters
   * Higher scores make this biome more likely to be selected
   * @param {Object} climate - Climate parameters
   * @returns {number} - Fitness score
   */
  getFitnessScore(climate) {
    // Get base score from parent class
    let score = super.getFitnessScore(climate);
    
    // Bamboo jungle should be rarer than regular jungle
    // Reduce score based on distance from ideal conditions
    const idealTemp = 0.9;
    const idealPrecip = 0.95;
    
    // Calculate distance from ideal conditions
    const tempDistance = Math.abs(climate.temperature - idealTemp);
    const precipDistance = Math.abs(climate.precipitation - idealPrecip);
    
    // Reduce score based on distances
    score *= (1 - tempDistance * 0.5) * (1 - precipDistance * 0.5);
    
    return score;
  }
}

module.exports = BambooJungleBiome; 