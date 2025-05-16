/**
 * BrushItem - Used for archaeological excavation
 * Part of the Trails & Tales Update
 */

const Item = require('./item');

class BrushItem extends Item {
  /**
   * Create a new Brush item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      type: 'brush',
      name: 'Brush',
      stackable: false,
      maxStackSize: 1,
      durability: options.durability !== undefined ? options.durability : 64,
      maxDurability: options.maxDurability !== undefined ? options.maxDurability : 64,
      ...options
    });
    
    // Brush-specific properties
    this.brushType = options.brushType || 'wood'; // wood, copper, gold, iron, netherite
    this.excavationParticles = options.excavationParticles || 'dust';
  }
  
  /**
   * Handle right-click action on a block
   * @param {Object} world - World reference
   * @param {Object} player - Player using the item
   * @param {Object} block - Target block
   * @param {Object} position - Block position
   * @returns {boolean} - Whether the action was handled
   */
  onUseOnBlock(world, player, block, position) {
    if (!world || !player || !block || !position) return false;
    
    // Check if the block is a suspicious block
    if (!block.type.includes('suspicious_')) return false;
    
    // The actual excavation will be handled by the ArchaeologyManager
    // This just starts the interaction
    world.emit('blockInteract', {
      player,
      block,
      position,
      item: this
    });
    
    return true;
  }
  
  /**
   * Get information for the item tooltip
   * @returns {Array} - Array of tooltip lines
   */
  getTooltip() {
    const tooltip = super.getTooltip();
    
    // Add brush-specific information
    tooltip.push(`${this.brushType.charAt(0).toUpperCase() + this.brushType.slice(1)} Brush`);
    tooltip.push(`Durability: ${this.durability}/${this.maxDurability}`);
    tooltip.push('');
    tooltip.push('Used to find artifacts in');
    tooltip.push('suspicious blocks.');
    
    return tooltip;
  }
  
  /**
   * Get custom data for client rendering and behavior
   * @returns {Object} - Custom client data
   */
  getClientData() {
    return {
      ...super.getClientData(),
      brushType: this.brushType,
      excavationParticles: this.excavationParticles
    };
  }
  
  /**
   * Calculate how much damage to take when used
   * @returns {number} - Amount of durability damage
   */
  calculateDurabilityDamage() {
    return 1;
  }
  
  /**
   * Check if brush can be repaired with specified material
   * @param {Object} material - Material to repair with
   * @returns {boolean} - Whether the material can repair this item
   */
  canRepairWith(material) {
    if (!material) return false;
    
    // Each brush type has a specific repair material
    switch (this.brushType) {
      case 'wood':
        return material.type.includes('planks');
      case 'copper':
        return material.type === 'copper_ingot';
      case 'gold':
        return material.type === 'gold_ingot';
      case 'iron':
        return material.type === 'iron_ingot';
      case 'netherite':
        return material.type === 'netherite_ingot';
      default:
        return false;
    }
  }
  
  /**
   * Serialize the brush item
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      brushType: this.brushType,
      excavationParticles: this.excavationParticles
    };
  }
  
  /**
   * Create brush from serialized data
   * @param {Object} data - Serialized data
   * @returns {BrushItem} - New brush instance
   */
  static deserialize(data) {
    if (!data) return null;
    
    return new BrushItem({
      id: data.id,
      type: data.type,
      count: data.count,
      durability: data.durability,
      maxDurability: data.maxDurability,
      brushType: data.brushType,
      excavationParticles: data.excavationParticles
    });
  }
}

module.exports = BrushItem; 