/**
 * ExplorerCompassItem - Points to unexplored areas
 * Part of the Minecraft 1.23 Update (Trailblazer)
 */

const CompassItem = require('./compassItem');

class ExplorerCompassItem extends CompassItem {
  /**
   * Create a new explorer compass item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: 'explorer_compass',
      name: 'Explorer Compass',
      stackable: false,
      maxStackSize: 1,
      type: 'tool',
      subtype: 'compass',
      category: 'tools',
      ...options
    });
    
    // Explorer compass specific properties
    this.searchRadius = options.searchRadius || 2000; // Maximum search radius in blocks
    this.discoveryThreshold = options.discoveryThreshold || 1000; // Blocks traveled before new target
    this.preferBiome = options.preferBiome || null; // Preferred biome type
    this.preferStructure = options.preferStructure || null; // Preferred structure type
    this.lastPlayerPosition = options.lastPlayerPosition || null; // For tracking travel distance
    this.targetType = options.targetType || 'unexplored'; // unexplored, biome, structure
    this.targetLocation = options.targetLocation || null; // Current target
    this.distanceTraveled = options.distanceTraveled || 0; // Distance traveled since last target
  }
  
  /**
   * Update the target location
   * @param {Object} player - Player using the compass
   * @param {Object} world - World reference
   * @returns {boolean} Whether update was successful
   */
  updateTarget(player, world) {
    if (!player || !player.position || !world) return false;
    
    // Calculate distance traveled if we have a previous position
    if (this.lastPlayerPosition) {
      const dx = player.position.x - this.lastPlayerPosition.x;
      const dz = player.position.z - this.lastPlayerPosition.z;
      this.distanceTraveled += Math.sqrt(dx * dx + dz * dz);
    }
    
    // Update last position
    this.lastPlayerPosition = { ...player.position };
    
    // Check if we need a new target (reached current or traveled enough distance)
    const needsNewTarget = !this.targetLocation || 
      (this.targetLocation && this.isTargetReached(player)) ||
      this.distanceTraveled >= this.discoveryThreshold;
    
    if (needsNewTarget) {
      // Reset distance
      this.distanceTraveled = 0;
      
      // Find new target based on type
      switch (this.targetType) {
        case 'biome':
          this.findBiomeTarget(player, world);
          break;
          
        case 'structure':
          this.findStructureTarget(player, world);
          break;
          
        case 'unexplored':
        default:
          this.findUnexploredTarget(player, world);
          break;
      }
      
      return this.targetLocation !== null;
    }
    
    return true;
  }
  
  /**
   * Check if the current target has been reached
   * @param {Object} player - Player to check
   * @returns {boolean} Whether target is reached
   */
  isTargetReached(player) {
    if (!player || !this.targetLocation) return false;
    
    const dx = player.position.x - this.targetLocation.x;
    const dz = player.position.z - this.targetLocation.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // Target is reached if within 20 blocks
    return distance < 20;
  }
  
  /**
   * Find a target in an unexplored area
   * @param {Object} player - Player reference
   * @param {Object} world - World reference
   */
  findUnexploredTarget(player, world) {
    // In a real implementation, this would use the world's exploration data
    // For now, generate a random point in a ring around the player
    
    // Random angle
    const angle = Math.random() * Math.PI * 2;
    
    // Random distance between 500 and search radius
    const distance = 500 + Math.random() * (this.searchRadius - 500);
    
    // Calculate position
    this.targetLocation = {
      x: Math.floor(player.position.x + Math.cos(angle) * distance),
      y: 64, // Approximate surface level
      z: Math.floor(player.position.z + Math.sin(angle) * distance),
      type: 'unexplored'
    };
  }
  
  /**
   * Find a target biome
   * @param {Object} player - Player reference
   * @param {Object} world - World reference
   */
  findBiomeTarget(player, world) {
    // In a real implementation, this would query the world's biome data
    // For now, simulate finding a biome
    
    // If we have a preferred biome, use that
    const biomeType = this.preferBiome || this.getRandomBiomeType();
    
    // Random angle
    const angle = Math.random() * Math.PI * 2;
    
    // Random distance between 500 and search radius
    const distance = 500 + Math.random() * (this.searchRadius - 500);
    
    // Calculate position
    this.targetLocation = {
      x: Math.floor(player.position.x + Math.cos(angle) * distance),
      y: 64, // Approximate surface level
      z: Math.floor(player.position.z + Math.sin(angle) * distance),
      type: 'biome',
      biomeType
    };
  }
  
  /**
   * Find a target structure
   * @param {Object} player - Player reference
   * @param {Object} world - World reference
   */
  findStructureTarget(player, world) {
    // In a real implementation, this would query the world's structure data
    // For now, simulate finding a structure
    
    // If we have a preferred structure, use that
    const structureType = this.preferStructure || this.getRandomStructureType();
    
    // Random angle
    const angle = Math.random() * Math.PI * 2;
    
    // Random distance between 500 and search radius
    const distance = 500 + Math.random() * (this.searchRadius - 500);
    
    // Calculate position
    this.targetLocation = {
      x: Math.floor(player.position.x + Math.cos(angle) * distance),
      y: 64, // Approximate surface level
      z: Math.floor(player.position.z + Math.sin(angle) * distance),
      type: 'structure',
      structureType
    };
  }
  
  /**
   * Get a random biome type
   * @returns {string} Random biome type
   */
  getRandomBiomeType() {
    const biomes = [
      'plains', 'forest', 'desert', 'mountains', 'taiga',
      'swamp', 'jungle', 'savanna', 'badlands', 'cherry_grove'
    ];
    
    return biomes[Math.floor(Math.random() * biomes.length)];
  }
  
  /**
   * Get a random structure type
   * @returns {string} Random structure type
   */
  getRandomStructureType() {
    const structures = [
      'village', 'fortress', 'stronghold', 'monument',
      'mansion', 'pyramid', 'temple', 'shipwreck'
    ];
    
    return structures[Math.floor(Math.random() * structures.length)];
  }
  
  /**
   * Set the target type
   * @param {string} type - Target type (unexplored, biome, structure)
   * @param {string} preference - Preferred biome or structure (optional)
   * @returns {boolean} Whether the change was successful
   */
  setTargetType(type, preference = null) {
    if (!['unexplored', 'biome', 'structure'].includes(type)) {
      return false;
    }
    
    this.targetType = type;
    this.targetLocation = null; // Reset target
    
    if (type === 'biome' && preference) {
      this.preferBiome = preference;
      this.preferStructure = null;
    } else if (type === 'structure' && preference) {
      this.preferStructure = preference;
      this.preferBiome = null;
    } else {
      this.preferBiome = null;
      this.preferStructure = null;
    }
    
    return true;
  }
  
  /**
   * Gets the client data for this item, including compass direction data
   * @param {Object} player - The player holding the compass
   * @returns {Object} Client data with compass state
   */
  getClientData(player) {
    // First try to update the target if we have a player
    if (player && player.world) {
      this.updateTarget(player, player.world);
    }
    
    const baseData = super.getClientData();
    
    let state = {
      isTracking: false,
      targetDirection: 0,
      targetDistance: null,
      message: 'Looking for unexplored areas...'
    };
    
    // If we have a target and player position, calculate direction and distance
    if (this.targetLocation && player && player.position) {
      const dx = this.targetLocation.x - player.position.x;
      const dz = this.targetLocation.z - player.position.z;
      
      const distance = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx) * (180 / Math.PI);
      
      let targetTypeText = 'unexplored area';
      if (this.targetLocation.type === 'biome' && this.targetLocation.biomeType) {
        targetTypeText = `${this.targetLocation.biomeType.replace('_', ' ')} biome`;
      } else if (this.targetLocation.type === 'structure' && this.targetLocation.structureType) {
        targetTypeText = `${this.targetLocation.structureType.replace('_', ' ')}`;
      }
      
      state = {
        isTracking: true,
        targetDirection: angle,
        targetDistance: distance,
        message: `Pointing to ${targetTypeText}: ${Math.round(distance)} blocks away`
      };
    }
    
    // Return combined data
    return {
      ...baseData,
      compassState: state,
      explorerData: {
        targetType: this.targetType,
        searchRadius: this.searchRadius,
        preferBiome: this.preferBiome,
        preferStructure: this.preferStructure,
        distanceTraveled: this.distanceTraveled
      }
    };
  }
  
  /**
   * Use the explorer compass - shows information and potentially updates target
   * @param {Object} player - Player using the item
   * @param {Object} context - Use context
   * @returns {boolean} Whether use was successful
   */
  use(player, context) {
    if (!player) return false;
    
    // Update target if we have a world
    if (context && context.world) {
      this.updateTarget(player, context.world);
    }
    
    // Show explorer compass information
    if (player.sendMessage) {
      player.sendMessage(`Explorer Compass - ${this.targetType.charAt(0).toUpperCase() + this.targetType.slice(1)} Mode`);
      
      if (this.preferBiome) {
        player.sendMessage(`Preferred biome: ${this.preferBiome.replace('_', ' ')}`);
      } else if (this.preferStructure) {
        player.sendMessage(`Preferred structure: ${this.preferStructure.replace('_', ' ')}`);
      }
      
      if (this.targetLocation) {
        // Calculate distance
        const dx = this.targetLocation.x - player.position.x;
        const dz = this.targetLocation.z - player.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        let targetTypeText = 'unexplored area';
        if (this.targetLocation.type === 'biome' && this.targetLocation.biomeType) {
          targetTypeText = `${this.targetLocation.biomeType.replace('_', ' ')} biome`;
        } else if (this.targetLocation.type === 'structure' && this.targetLocation.structureType) {
          targetTypeText = `${this.targetLocation.structureType.replace('_', ' ')}`;
        }
        
        player.sendMessage(`Target: ${targetTypeText} at X=${Math.round(this.targetLocation.x)}, Z=${Math.round(this.targetLocation.z)}`);
        player.sendMessage(`Distance: ${Math.round(distance)} blocks`);
        
        // Give a hint about direction
        const angle = Math.atan2(dz, dx) * (180 / Math.PI);
        const directions = [
          'North', 'Northeast', 'East', 'Southeast',
          'South', 'Southwest', 'West', 'Northwest'
        ];
        
        // Convert angle to 0-360 range
        const normalizedAngle = (angle + 360) % 360;
        // Convert to 0-7 index (N=0, NE=1, etc.)
        const directionIndex = Math.round(normalizedAngle / 45) % 8;
        
        player.sendMessage(`Direction: ${directions[directionIndex]}`);
      } else {
        player.sendMessage('Searching for a suitable target...');
      }
    }
    
    return true;
  }
  
  /**
   * Convert explorer compass to JSON representation for serialization
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON(),
      searchRadius: this.searchRadius,
      discoveryThreshold: this.discoveryThreshold,
      preferBiome: this.preferBiome,
      preferStructure: this.preferStructure,
      lastPlayerPosition: this.lastPlayerPosition,
      targetType: this.targetType,
      targetLocation: this.targetLocation,
      distanceTraveled: this.distanceTraveled
    };
  }
  
  /**
   * Create explorer compass from JSON data
   * @param {Object} data - JSON data
   * @returns {ExplorerCompassItem} Item instance
   */
  static fromJSON(data) {
    return new ExplorerCompassItem({
      id: data.id,
      name: data.name,
      searchRadius: data.searchRadius,
      discoveryThreshold: data.discoveryThreshold,
      preferBiome: data.preferBiome,
      preferStructure: data.preferStructure,
      lastPlayerPosition: data.lastPlayerPosition,
      targetType: data.targetType,
      targetLocation: data.targetLocation,
      distanceTraveled: data.distanceTraveled,
      data: data.data
    });
  }
}

module.exports = ExplorerCompassItem; 