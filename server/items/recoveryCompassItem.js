/**
 * RecoveryCompassItem - Specialized compass that points to the player's last death location
 * Part of the Wild Update features
 */
const Item = require('./item');

class RecoveryCompassItem extends Item {
  /**
   * Create a new recovery compass item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: 'recovery_compass',
      name: 'Recovery Compass',
      stackable: true,
      maxStackSize: 1,
      type: 'tool',
      subtype: 'compass',
      category: 'tools',
      ...options
    });
  }
  
  /**
   * Gets the client data for this item, including pointing direction data
   * @param {Object} player - The player holding the compass
   * @returns {Object} Client data with compass state
   */
  getClientData(player) {
    const baseData = super.getClientData();
    
    let state = {
      isTracking: false,
      targetDirection: null,
      targetDistance: null,
      message: 'No death location recorded'
    };
    
    // Only track if we have a player and they have a death location
    if (player && player.lastDeathLocation) {
      const deathLoc = player.lastDeathLocation;
      
      // Check if player is in the same dimension as their death
      const sameDimension = (!player.dimension && deathLoc.dimension === 'overworld') || 
                           (player.dimension === deathLoc.dimension);
      
      if (sameDimension) {
        // Calculate distance and direction to death point
        const dx = deathLoc.x - player.position.x;
        const dy = deathLoc.y - player.position.y;
        const dz = deathLoc.z - player.position.z;
        
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const angle = Math.atan2(dz, dx) * (180 / Math.PI);
        
        state = {
          isTracking: true,
          targetDirection: angle,
          targetDistance: distance,
          message: `Pointing to death location: ${Math.round(distance)} blocks away`
        };
      } else {
        state = {
          isTracking: false,
          targetDirection: null,
          targetDistance: null,
          message: `Death location is in another dimension: ${deathLoc.dimension}`
        };
      }
    }
    
    // Return combined data
    return {
      ...baseData,
      compassState: state
    };
  }
  
  /**
   * Use the recovery compass - shows information about death location
   * @param {Object} player - Player using the item
   * @param {Object} context - Use context
   * @returns {boolean} Whether use was successful
   */
  use(player, context) {
    if (!player) return false;
    
    if (!player.lastDeathLocation) {
      // No death location recorded
      const message = 'No death location recorded';
      
      if (typeof player.sendMessage === 'function') {
        player.sendMessage(message);
      } else if (player.lastMessage !== undefined) {
        player.lastMessage = message;
      }
      
      return false;
    }
    
    const deathLoc = player.lastDeathLocation;
    
    // Check if player is in the same dimension
    const sameDimension = (!player.dimension && deathLoc.dimension === 'overworld') || 
                         (player.dimension === deathLoc.dimension);
    
    if (sameDimension) {
      // Calculate distance to death location
      const dx = deathLoc.x - player.position.x;
      const dy = deathLoc.y - player.position.y;
      const dz = deathLoc.z - player.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Build messages
      const locationMessage = `Death location: X=${Math.round(deathLoc.x)}, Y=${Math.round(deathLoc.y)}, Z=${Math.round(deathLoc.z)}`;
      const distanceMessage = `Distance: ${Math.round(distance)} blocks`;
      
      // Send information to player
      if (typeof player.sendMessage === 'function') {
        player.sendMessage(locationMessage);
        player.sendMessage(distanceMessage);
      } else {
        // Handle direct property assignment for testing
        if (player.lastMessage !== undefined) {
          player.lastMessage = locationMessage;
        }
        
        // If messageLog exists, use it for testing
        if (Array.isArray(player.messageLog)) {
          player.messageLog.push(locationMessage);
          player.messageLog.push(distanceMessage);
        }
      }
    } else {
      // Death was in another dimension
      const message = `Death location is in the ${deathLoc.dimension}, you are in the ${player.dimension || 'overworld'}`;
      
      if (typeof player.sendMessage === 'function') {
        player.sendMessage(message);
      } else {
        // Handle direct property assignment for testing
        if (player.lastMessage !== undefined) {
          player.lastMessage = message;
        }
        
        // If messageLog exists, use it for testing
        if (Array.isArray(player.messageLog)) {
          player.messageLog.push(message);
        }
      }
    }
    
    return true;
  }
  
  /**
   * Convert recovery compass to JSON representation for serialization
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON()
    };
  }
  
  /**
   * Create recovery compass from JSON data
   * @param {Object} data - JSON data
   * @returns {RecoveryCompassItem} Item instance
   */
  static fromJSON(data) {
    return new RecoveryCompassItem({
      id: data.id,
      name: data.name,
      data: data.data
    });
  }
}

module.exports = RecoveryCompassItem; 