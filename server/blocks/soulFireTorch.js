/**
 * Soul Fire Torch - A darker blue torch with special properties
 */

const TorchBlock = require('./torchBlock');

class SoulFireTorch extends TorchBlock {
  /**
   * Create a new SoulFireTorch instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super({
      ...options,
      id: 'soul_fire_torch',
      lightLevel: 10, // Soul fire torch provides less light than regular torch (15)
      particleColor: '#7EB8C4', // Blue-ish flame color instead of orange
      particleCount: 1, // Fewer particles
      flameHeight: 0.3 // Smaller flame
    });

    this.isSoulFire = true;
  }

  /**
   * Get the block's data for client
   * @returns {Object} - Block data for the client
   */
  getState() {
    const baseState = super.getState();
    return {
      ...baseState,
      soulFire: true,
      flameColor: '#7EB8C4'
    };
  }
  
  /**
   * Get light source properties
   * @returns {Object} - Light source data
   */
  getLightSource() {
    return {
      level: this.lightLevel,
      color: '#7EB8C4', // Blueish tint
      flicker: true
    };
  }
  
  /**
   * Get the block display name
   * @returns {String} - Block name
   */
  getDisplayName() {
    return 'Soul Torch';
  }
}

module.exports = SoulFireTorch; 