/**
 * CompassItem - Basic compass pointing to spawn or lodestone
 * Part of the Minecraft 1.23 Update (Trailblazer)
 */

const Item = require('./item');

class CompassItem extends Item {
  /**
   * Create a new compass item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'compass',
      name: options.name || 'Compass',
      stackable: options.stackable !== undefined ? options.stackable : false,
      maxStackSize: 1,
      type: 'tool',
      subtype: 'compass',
      category: 'tools',
      ...options
    });
    
    // Compass properties
    this.targetType = options.targetType || 'spawn'; // spawn, lodestone, player, custom
    this.targetLocation = options.targetLocation || null; // {x, y, z} if not null
    this.trackingPlayer = options.trackingPlayer || null; // Player ID if tracking player
    this.dimension = options.dimension || 'overworld';
    this.lodestoneTracked = options.lodestoneTracked !== undefined ? options.lodestoneTracked : false;
    this.lodestoneId = options.lodestoneId || null;
    
    // Visual properties
    this.compassColor = options.compassColor || '#b87333'; // Copper/bronze color
    this.needleColor = options.needleColor || '#ff0000'; // Red needle
  }
  
  /**
   * Set the compass to point to spawn
   * @param {Object} world - World reference
   */
  pointToSpawn(world) {
    this.targetType = 'spawn';
    this.targetLocation = null;
    this.trackingPlayer = null;
    this.lodestoneTracked = false;
    this.lodestoneId = null;
    
    // If we have a world, get the spawn position
    if (world && world.getSpawnPosition) {
      this.targetLocation = world.getSpawnPosition();
    }
  }
  
  /**
   * Set the compass to point to a fixed location
   * @param {Object} location - Target location {x, y, z}
   * @param {string} dimension - Dimension (overworld, nether, end)
   * @returns {boolean} Whether the location was set
   */
  pointToLocation(location, dimension = 'overworld') {
    if (!location || location.x === undefined || location.z === undefined) {
      return false;
    }
    
    this.targetType = 'custom';
    this.targetLocation = {
      x: location.x,
      y: location.y !== undefined ? location.y : 64,
      z: location.z
    };
    this.dimension = dimension || 'overworld';
    this.trackingPlayer = null;
    this.lodestoneTracked = false;
    this.lodestoneId = null;
    
    return true;
  }
  
  /**
   * Set the compass to track a player
   * @param {Object} player - Player to track
   * @returns {boolean} Whether player tracking was set
   */
  trackPlayer(player) {
    if (!player || !player.id || !player.position) {
      return false;
    }
    
    this.targetType = 'player';
    this.trackingPlayer = player.id;
    this.dimension = player.dimension || 'overworld';
    this.targetLocation = { ...player.position };
    this.lodestoneTracked = false;
    this.lodestoneId = null;
    
    return true;
  }
  
  /**
   * Set the compass to track a lodestone
   * @param {Object} lodestone - Lodestone block
   * @returns {boolean} Whether lodestone tracking was set
   */
  trackLodestone(lodestone) {
    if (!lodestone || !lodestone.id || !lodestone.position) {
      return false;
    }
    
    this.targetType = 'lodestone';
    this.lodestoneTracked = true;
    this.lodestoneId = lodestone.id;
    this.dimension = lodestone.dimension || 'overworld';
    this.targetLocation = { ...lodestone.position };
    this.trackingPlayer = null;
    
    return true;
  }
  
  /**
   * Update the compass target position
   * @param {Object} world - World reference
   * @param {Object} player - Player using the compass
   * @returns {boolean} Whether the update was successful
   */
  updateTargetPosition(world, player) {
    if (!world) return false;
    
    // Different behavior based on target type
    switch (this.targetType) {
      case 'spawn':
        if (world.getSpawnPosition) {
          this.targetLocation = world.getSpawnPosition();
        }
        break;
        
      case 'player':
        if (this.trackingPlayer && world.getPlayerById) {
          const target = world.getPlayerById(this.trackingPlayer);
          if (target && target.position) {
            this.targetLocation = { ...target.position };
            this.dimension = target.dimension || 'overworld';
          }
        }
        break;
        
      case 'lodestone':
        if (this.lodestoneId && world.getBlockById) {
          const lodestone = world.getBlockById(this.lodestoneId);
          if (lodestone && lodestone.position) {
            this.targetLocation = { ...lodestone.position };
          } else {
            // Lodestone was removed
            this.lodestoneTracked = false;
          }
        }
        break;
        
      case 'custom':
        // Custom location doesn't need updates
        break;
    }
    
    return true;
  }
  
  /**
   * Calculate if the compass needle should spin randomly
   * @param {Object} player - Player using the compass
   * @returns {boolean} Whether the needle should spin
   */
  shouldSpin(player) {
    if (!player || !this.targetLocation) return true;
    
    // Compass spins if in different dimension than target
    if (player.dimension !== this.dimension) {
      return true;
    }
    
    // Lodestone compass doesn't work if the lodestone is removed
    if (this.targetType === 'lodestone' && !this.lodestoneTracked) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Calculate the direction to point
   * @param {Object} player - Player using the compass
   * @returns {number} Direction in degrees (0-360) or null if should spin
   */
  getDirection(player) {
    if (!player || !player.position || !this.targetLocation) {
      return null;
    }
    
    // Check if the compass should spin
    if (this.shouldSpin(player)) {
      return null;
    }
    
    // Calculate angle between player and target
    const dx = this.targetLocation.x - player.position.x;
    const dz = this.targetLocation.z - player.position.z;
    
    // Convert to degrees (0 = north, 90 = east, etc.)
    let angle = Math.atan2(dz, dx) * (180 / Math.PI);
    
    // Normalize to 0-360 range
    angle = (angle + 360) % 360;
    
    return angle;
  }
  
  /**
   * Get distance to target
   * @param {Object} player - Player using the compass
   * @returns {number} Distance in blocks or null if unavailable
   */
  getDistance(player) {
    if (!player || !player.position || !this.targetLocation || 
        player.dimension !== this.dimension) {
      return null;
    }
    
    const dx = this.targetLocation.x - player.position.x;
    const dz = this.targetLocation.z - player.position.z;
    
    return Math.sqrt(dx * dx + dz * dz);
  }
  
  /**
   * Use the compass - updates and shows information
   * @param {Object} player - Player using the item
   * @param {Object} context - Use context
   * @returns {boolean} Whether use was successful
   */
  use(player, context) {
    if (!player) return false;
    
    // Update target if we have a world
    if (context && context.world) {
      this.updateTargetPosition(context.world, player);
    }
    
    // Show compass information to player
    if (player.sendMessage) {
      let message;
      
      switch (this.targetType) {
        case 'spawn':
          message = 'Pointing to world spawn';
          break;
          
        case 'player':
          const targetPlayerName = context && context.world && this.trackingPlayer ?
            (context.world.getPlayerById(this.trackingPlayer)?.name || 'unknown player') :
            'unknown player';
          message = `Tracking ${targetPlayerName}`;
          break;
          
        case 'lodestone':
          message = this.lodestoneTracked ?
            'Linked to Lodestone' :
            'Lodestone link broken';
          break;
          
        case 'custom':
        default:
          message = 'Pointing to location';
          break;
      }
      
      player.sendMessage(message);
      
      // Show direction and distance if available
      const direction = this.getDirection(player);
      const distance = this.getDistance(player);
      
      if (direction !== null) {
        // Convert angle to cardinal direction
        const directions = [
          'North', 'Northeast', 'East', 'Southeast',
          'South', 'Southwest', 'West', 'Northwest'
        ];
        const directionIndex = Math.round(direction / 45) % 8;
        player.sendMessage(`Direction: ${directions[directionIndex]}`);
      } else {
        player.sendMessage('Needle is spinning...');
      }
      
      if (distance !== null) {
        player.sendMessage(`Distance: ${Math.round(distance)} blocks`);
      }
    }
    
    return true;
  }
  
  /**
   * Gets the client data for this item
   * @param {Object} player - The player holding the compass
   * @returns {Object} Client data with compass state
   */
  getClientData(player) {
    const baseData = super.getClientData();
    
    let state = {
      isTracking: false,
      targetDirection: null,
      targetDistance: null,
      message: 'Compass is inactive'
    };
    
    // If we have a player, calculate the direction and distance
    if (player) {
      const direction = this.getDirection(player);
      const distance = this.getDistance(player);
      
      let message;
      switch (this.targetType) {
        case 'spawn':
          message = 'Pointing to world spawn';
          break;
        case 'player':
          message = 'Tracking player';
          break;
        case 'lodestone':
          message = this.lodestoneTracked ? 'Linked to Lodestone' : 'Lodestone link broken';
          break;
        case 'custom':
        default:
          message = 'Pointing to location';
          break;
      }
      
      state = {
        isTracking: direction !== null,
        targetDirection: direction,
        targetDistance: distance,
        message: direction !== null ? message : 'Needle is spinning...'
      };
    }
    
    // Return combined data
    return {
      ...baseData,
      compassState: state
    };
  }
  
  /**
   * Serialize compass item
   * @returns {Object} - Serialized data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      targetType: this.targetType,
      targetLocation: this.targetLocation,
      trackingPlayer: this.trackingPlayer,
      dimension: this.dimension,
      lodestoneTracked: this.lodestoneTracked,
      lodestoneId: this.lodestoneId,
      compassColor: this.compassColor,
      needleColor: this.needleColor
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
      targetType: data.targetType,
      targetLocation: data.targetLocation,
      trackingPlayer: data.trackingPlayer,
      dimension: data.dimension,
      lodestoneTracked: data.lodestoneTracked,
      lodestoneId: data.lodestoneId,
      compassColor: data.compassColor,
      needleColor: data.needleColor,
      data: data.data
    });
  }
}

module.exports = CompassItem; 