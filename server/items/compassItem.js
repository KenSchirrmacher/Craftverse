/**
 * CompassItem - Standard compass that points to world spawn or lodestone
 */
const Item = require('./item');

class CompassItem extends Item {
  /**
   * Create a new compass item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: 'compass',
      name: 'Compass',
      stackable: true,
      maxStackSize: 1,
      type: 'tool',
      subtype: 'compass',
      category: 'tools',
      ...options
    });
    
    this.lodestoneTracking = options.lodestoneTracking || false;
    this.lodestonePos = options.lodestonePos || null;
    this.lodestoneDimension = options.lodestoneDimension || null;
  }
  
  /**
   * Gets the client data for this item, including pointing direction data
   * @param {Object} player - The player holding the compass
   * @returns {Object} Client data with compass state
   */
  getClientData(player) {
    const baseData = super.getClientData();
    
    let state = {
      isTracking: true,
      targetDirection: 0, // Default to north
      targetDistance: null,
      message: 'Pointing to world spawn'
    };
    
    // If lodestone tracking is enabled, point to the lodestone instead
    if (this.lodestoneTracking && this.lodestonePos) {
      // Only track if in the same dimension
      const sameDimension = (!player.dimension && this.lodestoneDimension === 'overworld') || 
                           (player.dimension === this.lodestoneDimension);
      
      if (sameDimension) {
        const dx = this.lodestonePos.x - player.position.x;
        const dz = this.lodestonePos.z - player.position.z;
        
        const distance = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx) * (180 / Math.PI);
        
        state = {
          isTracking: true,
          targetDirection: angle,
          targetDistance: distance,
          message: `Pointing to lodestone: ${Math.round(distance)} blocks away`
        };
      } else {
        state = {
          isTracking: false,
          targetDirection: null,
          targetDistance: null,
          message: 'Lodestone is in another dimension'
        };
      }
    } else if (player) {
      // Point to world spawn (0,0)
      const dx = 0 - player.position.x;
      const dz = 0 - player.position.z;
      
      const distance = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx) * (180 / Math.PI);
      
      state = {
        isTracking: true,
        targetDirection: angle,
        targetDistance: distance,
        message: `Pointing to world spawn: ${Math.round(distance)} blocks away`
      };
    }
    
    // Return combined data
    return {
      ...baseData,
      compassState: state
    };
  }
  
  /**
   * Use the compass - shows information about target location
   * @param {Object} player - Player using the item
   * @param {Object} context - Use context
   * @returns {boolean} Whether use was successful
   */
  use(player, context) {
    if (!player) return false;
    
    if (this.lodestoneTracking && this.lodestonePos) {
      const sameDimension = (!player.dimension && this.lodestoneDimension === 'overworld') || 
                           (player.dimension === this.lodestoneDimension);
      
      if (sameDimension) {
        // Calculate distance to lodestone
        const dx = this.lodestonePos.x - player.position.x;
        const dy = this.lodestonePos.y - player.position.y;
        const dz = this.lodestonePos.z - player.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Send information to player
        if (player.sendMessage) {
          player.sendMessage(`Lodestone location: X=${Math.round(this.lodestonePos.x)}, Y=${Math.round(this.lodestonePos.y)}, Z=${Math.round(this.lodestonePos.z)}`);
          player.sendMessage(`Distance: ${Math.round(distance)} blocks`);
        }
      } else {
        // Lodestone is in another dimension
        if (player.sendMessage) {
          player.sendMessage(`Lodestone is in the ${this.lodestoneDimension}, you are in the ${player.dimension || 'overworld'}`);
        }
      }
    } else {
      // Calculate distance to world spawn
      const dx = 0 - player.position.x;
      const dz = 0 - player.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      // Send information to player
      if (player.sendMessage) {
        player.sendMessage(`World spawn: X=0, Z=0`);
        player.sendMessage(`Distance: ${Math.round(distance)} blocks`);
      }
    }
    
    return true;
  }
  
  /**
   * Convert compass to JSON representation for serialization
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON(),
      lodestoneTracking: this.lodestoneTracking,
      lodestonePos: this.lodestonePos,
      lodestoneDimension: this.lodestoneDimension
    };
  }
  
  /**
   * Create compass from JSON data
   * @param {Object} data - JSON data
   * @returns {CompassItem} Item instance
   */
  static fromJSON(data) {
    return new CompassItem({
      id: data.id,
      name: data.name,
      lodestoneTracking: data.lodestoneTracking,
      lodestonePos: data.lodestonePos,
      lodestoneDimension: data.lodestoneDimension,
      data: data.data
    });
  }
}

module.exports = CompassItem; 