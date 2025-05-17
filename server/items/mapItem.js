/**
 * MapItem - Basic map that displays the world
 * Part of the Minecraft 1.23 Update (Trailblazer)
 */

const Item = require('./item');
const { v4: uuidv4 } = require('uuid');

class MapItem extends Item {
  /**
   * Create a new map item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'map',
      name: options.name || 'Map',
      stackable: options.stackable !== undefined ? options.stackable : false,
      maxStackSize: 1,
      type: 'tool',
      subtype: 'map',
      category: 'tools',
      ...options
    });
    
    // Map coordinates and properties
    this.centerX = options.centerX || 0;
    this.centerZ = options.centerZ || 0;
    this.scale = options.scale || 1; // 1 = 1:1 scale, 2 = 1:2 scale, etc.
    this.explored = options.explored || false;
    this.lockedCoordinates = options.lockedCoordinates || false;
    this.dimension = options.dimension || 'overworld';
    
    // Visual and behavior properties
    this.showCoordinates = options.showCoordinates !== undefined ? options.showCoordinates : true;
    this.decorations = options.decorations || {}; // Icons and markers
    this.showPlayers = options.showPlayers !== undefined ? options.showPlayers : true;
    this.locationMarkers = options.locationMarkers || []; // Points of interest
    this.exploredAreas = options.exploredAreas || []; // Areas the player has seen
    
    // Item appearance
    this.mapColor = options.mapColor || '#e6d4a0'; // Default map color
    this.borderColor = options.borderColor || '#7d6642';
  }
  
  /**
   * Calculate map boundaries based on center coordinates and scale
   * @returns {Object} Map boundaries
   */
  getBoundaries() {
    const size = 128 * this.scale; // 128 blocks at scale 1
    return {
      minX: this.centerX - size,
      maxX: this.centerX + size,
      minZ: this.centerZ - size,
      maxZ: this.centerZ + size
    };
  }
  
  /**
   * Calculate if a position is within map boundaries
   * @param {Object} position - Position to check
   * @returns {boolean} Whether position is within map
   */
  isPositionInBounds(position) {
    const boundaries = this.getBoundaries();
    return position.x >= boundaries.minX && 
           position.x <= boundaries.maxX && 
           position.z >= boundaries.minZ && 
           position.z <= boundaries.maxZ;
  }
  
  /**
   * Add a marker to the map
   * @param {Object} marker - Marker data
   */
  addMarker(marker) {
    if (!marker || !marker.position || !marker.type) return;
    
    const newMarker = {
      id: marker.id || uuidv4(),
      position: marker.position,
      type: marker.type,
      name: marker.name || `Marker ${this.locationMarkers.length + 1}`,
      color: marker.color || '#ff0000',
      icon: marker.icon || 'dot'
    };
    
    this.locationMarkers.push(newMarker);
  }
  
  /**
   * Remove a marker from the map
   * @param {string} markerId - ID of marker to remove
   * @returns {boolean} Success
   */
  removeMarker(markerId) {
    const initialLength = this.locationMarkers.length;
    this.locationMarkers = this.locationMarkers.filter(marker => marker.id !== markerId);
    return this.locationMarkers.length < initialLength;
  }
  
  /**
   * Update explored areas when a player views the map
   * @param {Object} player - Player viewing the map
   * @param {Object} world - World reference
   */
  updateExploration(player, world) {
    if (!player || !player.position || this.lockedCoordinates) return;
    
    // Only update if player is in the same dimension as the map
    if (player.dimension !== this.dimension) return;
    
    // Check if player's position is within map boundaries
    if (!this.isPositionInBounds(player.position)) return;
    
    // Calculate chunk coordinates
    const chunkX = Math.floor(player.position.x / 16);
    const chunkZ = Math.floor(player.position.z / 16);
    
    // Check if chunk is already marked as explored
    const explored = this.exploredAreas.some(area => 
      area.chunkX === chunkX && area.chunkZ === chunkZ
    );
    
    if (!explored) {
      // Add the chunk to explored areas
      this.exploredAreas.push({
        chunkX,
        chunkZ,
        timestamp: Date.now()
      });
      
      // Mark map as explored if more than 50% is explored
      const boundaries = this.getBoundaries();
      const totalChunks = Math.ceil((boundaries.maxX - boundaries.minX) / 16) * 
                         Math.ceil((boundaries.maxZ - boundaries.minZ) / 16);
      
      if (this.exploredAreas.length > totalChunks * 0.5) {
        this.explored = true;
      }
    }
  }
  
  /**
   * Center the map on the player's current position
   * @param {Object} player - Player using the map
   * @returns {boolean} Whether centering was successful
   */
  centerOnPlayer(player) {
    if (!player || !player.position) return false;
    
    this.centerX = Math.floor(player.position.x);
    this.centerZ = Math.floor(player.position.z);
    this.dimension = player.dimension || 'overworld';
    
    // Clear existing exploration data when re-centering
    this.exploredAreas = [];
    this.explored = false;
    
    return true;
  }
  
  /**
   * Update the map scale
   * @param {number} newScale - New scale value
   * @returns {boolean} Whether scale update was successful
   */
  updateScale(newScale) {
    if (newScale < 1 || newScale > 8) return false;
    
    this.scale = newScale;
    
    // Clear existing exploration data when scaling
    this.exploredAreas = [];
    this.explored = false;
    
    return true;
  }
  
  /**
   * Use the map - shows information about the map
   * @param {Object} player - Player using the item
   * @param {Object} context - Use context
   * @returns {boolean} Whether use was successful
   */
  use(player, context) {
    if (!player) return false;
    
    // Update exploration data
    if (context && context.world) {
      this.updateExploration(player, context.world);
    }
    
    // Send map information to player
    if (player.sendMessage) {
      const boundaries = this.getBoundaries();
      
      player.sendMessage(`Map centered at X=${this.centerX}, Z=${this.centerZ}`);
      player.sendMessage(`Scale: 1:${this.scale}`);
      player.sendMessage(`Covers area: X(${boundaries.minX} to ${boundaries.maxX}), Z(${boundaries.minZ} to ${boundaries.maxZ})`);
      
      if (this.locationMarkers.length > 0) {
        player.sendMessage(`Contains ${this.locationMarkers.length} marked locations`);
      }
      
      if (this.explored) {
        player.sendMessage('This map is fully explored');
      } else {
        const percentage = this.exploredAreas.length / 
          (Math.ceil((boundaries.maxX - boundaries.minX) / 16) * 
           Math.ceil((boundaries.maxZ - boundaries.minZ) / 16)) * 100;
           
        player.sendMessage(`Exploration: ${Math.floor(percentage)}% complete`);
      }
    }
    
    return true;
  }
  
  /**
   * Gets the client data for this item
   * @param {Object} player - The player holding the map
   * @returns {Object} Client data with map state
   */
  getClientData(player) {
    const baseData = super.getClientData();
    
    let mapState = {
      centerX: this.centerX,
      centerZ: this.centerZ,
      scale: this.scale,
      markers: this.locationMarkers,
      explored: this.explored,
      exploredAreas: this.exploredAreas,
      boundaries: this.getBoundaries(),
      mapColor: this.mapColor,
      borderColor: this.borderColor
    };
    
    // If we have a player, add player position to the map data if appropriate
    if (player && this.showPlayers && player.dimension === this.dimension) {
      mapState.playerPosition = {
        x: player.position.x,
        z: player.position.z,
        inBounds: this.isPositionInBounds(player.position)
      };
    }
    
    // Return combined data
    return {
      ...baseData,
      mapState
    };
  }
  
  /**
   * Serialize map item
   * @returns {Object} - Serialized data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      centerX: this.centerX,
      centerZ: this.centerZ,
      scale: this.scale,
      explored: this.explored,
      lockedCoordinates: this.lockedCoordinates,
      dimension: this.dimension,
      showCoordinates: this.showCoordinates,
      decorations: this.decorations,
      showPlayers: this.showPlayers,
      locationMarkers: this.locationMarkers,
      exploredAreas: this.exploredAreas,
      mapColor: this.mapColor,
      borderColor: this.borderColor
    };
  }
  
  /**
   * Create map from JSON data
   * @param {Object} data - JSON data
   * @returns {MapItem} Item instance
   */
  static fromJSON(data) {
    return new MapItem({
      id: data.id,
      name: data.name,
      centerX: data.centerX,
      centerZ: data.centerZ,
      scale: data.scale,
      explored: data.explored,
      lockedCoordinates: data.lockedCoordinates,
      dimension: data.dimension,
      showCoordinates: data.showCoordinates,
      decorations: data.decorations,
      showPlayers: data.showPlayers,
      locationMarkers: data.locationMarkers,
      exploredAreas: data.exploredAreas,
      mapColor: data.mapColor,
      borderColor: data.borderColor,
      data: data.data
    });
  }
}

module.exports = MapItem; 