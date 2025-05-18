/**
 * EnhancedPotItem - Enhanced Decorated Pot item with additional features
 * Part of the Minecraft 1.23 Update's Decorated Pots Expansion
 */

const DecoratedPotItem = require('./decoratedPotItem');
const PotPatternRegistry = require('./potPatternRegistry');

class EnhancedPotItem extends DecoratedPotItem {
  /**
   * Create a new enhanced pot item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'enhanced_pot',
      type: 'enhanced_pot',
      name: 'Enhanced Pot',
      stackable: true,
      maxStackSize: 1,
      ...options
    });
    
    // Mark as placeable directly
    this.placeable = true;
    
    // Enhanced pot specific properties
    this.color = options.color || null;
    this.effects = options.effects || [];
    
    // Extended inventory
    this.inventory = options.inventory || {
      slots: 3,
      items: []
    };
    
    // Modified custom property check
    this.hasCustomSherds = this.checkForCustomSherds();
    this.hasActiveEffects = this.effects.length > 0;
  }
  
  /**
   * Get the name of the item, with customization if present
   * @returns {string} - The name to display
   */
  getDisplayName() {
    let name = 'Enhanced Pot';
    
    if (this.color) {
      // Format color name
      const formattedColor = this.color.charAt(0).toUpperCase() + this.color.slice(1);
      name = `${formattedColor} ${name}`;
    }
    
    if (!this.hasCustomSherds && !this.color) {
      return 'Enhanced Pot';
    }
    
    return name;
  }
  
  /**
   * Get information for the item tooltip
   * @returns {Array} - Array of tooltip lines
   */
  getTooltip() {
    const tooltip = super.getTooltip();
    
    // Add color information if present
    if (this.color) {
      const formattedColor = this.color.charAt(0).toUpperCase() + this.color.slice(1);
      tooltip.push(`Color: ${formattedColor}`);
    }
    
    // Add effect information
    if (this.hasActiveEffects) {
      tooltip.push('');
      tooltip.push('Active Effects:');
      
      // Group similar effects
      const effectCounts = {};
      
      for (const effect of this.effects) {
        if (!effectCounts[effect.type]) {
          effectCounts[effect.type] = 0;
        }
        effectCounts[effect.type]++;
      }
      
      // Display each effect type
      for (const [effectType, count] of Object.entries(effectCounts)) {
        // Format effect name
        const formattedEffect = effectType
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Show count if more than one
        const effectText = count > 1 ? `${formattedEffect} (x${count})` : formattedEffect;
        tooltip.push(` - ${effectText}`);
      }
    }
    
    // Show storage capacity
    tooltip.push('');
    tooltip.push(`Storage Capacity: ${this.inventory.slots} slots`);
    
    // Show if it contains items
    if (this.inventory.items.length > 0) {
      tooltip.push('');
      tooltip.push('Contains:');
      for (const item of this.inventory.items) {
        tooltip.push(` - ${item.name || item.type} x${item.count}`);
      }
    }
    
    return tooltip;
  }
  
  /**
   * Handle placement of the enhanced pot
   * @param {Object} world - The game world
   * @param {Object} position - The position to place at
   * @param {Object} player - The player placing the pot
   * @returns {Object|boolean} - Result of placement
   */
  place(world, position, player) {
    if (!world || !position) return false;
    
    // Get the facing direction based on player rotation
    const rotationY = player ? calculateRotation(player.rotation.y) : 0;
    
    // Check if we can place a block here
    if (world.getBlockState(position.x, position.y, position.z)) {
      const currentBlock = world.getBlockState(position.x, position.y, position.z);
      if (currentBlock && currentBlock.type !== 'air') {
        return false;
      }
    }
    
    // Create the enhanced pot block
    const potBlock = {
      type: 'enhanced_pot',
      sherds: { ...this.sherds },
      inventory: { ...this.inventory },
      color: this.color,
      effects: [...this.effects],
      rotationY
    };
    
    // Place it in the world
    world.setBlockState(position.x, position.y, position.z, potBlock);
    
    // Play placement sound
    if (player && player.emitSound) {
      player.emitSound('block.decorated_pot.place', { position, volume: 1.0, pitch: 1.0 });
    }
    
    return true;
  }
  
  /**
   * Get custom data for client rendering
   * @returns {Object} - Custom client data
   */
  getClientData() {
    return {
      ...super.getClientData(),
      color: this.color,
      effects: this.effects.map(e => e.type)
    };
  }
  
  /**
   * Serialize enhanced pot item data
   * @returns {Object} - Serialized data
   */
  serialize() {
    const data = super.serialize();
    return {
      ...data,
      color: this.color,
      effects: this.effects,
      hasActiveEffects: this.hasActiveEffects
    };
  }
  
  /**
   * Create enhanced pot item from serialized data
   * @param {Object} data - Serialized data
   * @returns {EnhancedPotItem} - New enhanced pot item instance
   * @static
   */
  static deserialize(data) {
    if (!data) return null;
    
    return new EnhancedPotItem({
      id: data.id,
      count: data.count,
      sherds: data.sherds,
      inventory: data.inventory,
      color: data.color,
      effects: data.effects
    });
  }
}

/**
 * Calculate block rotation from player rotation
 * @param {number} playerRotation - Player's y rotation in radians
 * @returns {number} - Block rotation (0, 1, 2, 3) for N, E, S, W
 * @private
 */
function calculateRotation(playerRotation) {
  // Convert to degrees for easier math
  const degrees = ((playerRotation * (180 / Math.PI)) + 360) % 360;
  
  // The player is facing the opposite direction from the block front
  // Map to N, E, S, W (0, 1, 2, 3)
  if (degrees >= 315 || degrees < 45) {
    return 2; // North
  } else if (degrees >= 45 && degrees < 135) {
    return 3; // East
  } else if (degrees >= 135 && degrees < 225) {
    return 0; // South
  } else {
    return 1; // West
  }
}

module.exports = EnhancedPotItem; 