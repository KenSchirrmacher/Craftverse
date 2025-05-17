/**
 * BiomeMapItem - Map that shows biome information
 * Part of the Minecraft 1.23 Update (Trailblazer)
 */

const MapItem = require('./mapItem');

class BiomeMapItem extends MapItem {
  /**
   * Create a new biome map item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'biome_map',
      name: options.name || 'Biome Map',
      mapColor: options.mapColor || '#add8e6', // Light blue color for biome maps
      ...options
    });
    
    // Biome-specific properties
    this.targetBiome = options.targetBiome || null;
    this.biomeHighlightColor = options.biomeHighlightColor || '#55ff55'; // Green highlight for target biome
    this.showAllBiomes = options.showAllBiomes !== undefined ? options.showAllBiomes : true;
    this.biomeColors = options.biomeColors || {
      'desert': '#edd9af',
      'plains': '#90814d',
      'forest': '#28753b',
      'taiga': '#31554a',
      'swamp': '#4c763c',
      'ocean': '#3656cd',
      'mountains': '#6f6f6f',
      'jungle': '#2c4205',
      'savanna': '#bfb755',
      'badlands': '#d57e34',
      'beach': '#faf0c5',
      'snow': '#f0f0ff',
      'cherry_grove': '#ffb7c5',
      'mangrove_swamp': '#6a7039'
    };
  }
  
  /**
   * Set the target biome for this map
   * @param {string} biomeName - Name of biome to target
   * @returns {boolean} Success
   */
  setTargetBiome(biomeName) {
    if (!biomeName) return false;
    
    this.targetBiome = biomeName;
    
    // Add a marker for the biome if it's known
    if (this.targetBiome) {
      // This would normally check a biome registry or world data
      // For now, just add a marker at the map center
      this.addMarker({
        position: { x: this.centerX, y: 64, z: this.centerZ },
        type: 'biome',
        name: `${this.targetBiome.charAt(0).toUpperCase() + this.targetBiome.slice(1)} Biome`,
        color: this.biomeHighlightColor,
        icon: 'biome'
      });
    }
    
    return true;
  }
  
  /**
   * Use the biome map - shows biome information
   * @param {Object} player - Player using the item
   * @param {Object} context - Use context
   * @returns {boolean} Whether use was successful
   */
  use(player, context) {
    if (!player) return false;
    
    // Standard map functionality first
    super.use(player, context);
    
    // Add biome-specific information
    if (player.sendMessage) {
      if (this.targetBiome) {
        player.sendMessage(`Biome Map: ${this.targetBiome.charAt(0).toUpperCase() + this.targetBiome.slice(1)}`);
      } else {
        player.sendMessage('General Biome Map');
      }
      
      // In a real implementation, this would show actual biome data
      if (context && context.world && player.position) {
        const currentBiome = context.world.getBiomeAt ? 
          context.world.getBiomeAt(player.position) : 'unknown';
          
        if (currentBiome) {
          player.sendMessage(`You are currently in: ${currentBiome.charAt(0).toUpperCase() + currentBiome.slice(1)}`);
          
          if (this.targetBiome && currentBiome === this.targetBiome) {
            player.sendMessage('You have reached the target biome!');
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * Gets the client data for this item, including biome information
   * @param {Object} player - The player holding the map
   * @returns {Object} Client data with map state
   */
  getClientData(player) {
    const baseData = super.getClientData(player);
    
    // Add biome-specific data
    const biomeData = {
      targetBiome: this.targetBiome,
      biomeHighlightColor: this.biomeHighlightColor,
      showAllBiomes: this.showAllBiomes,
      biomeColors: this.biomeColors
    };
    
    // If we have a player and world, we could add current biome info
    if (player && player.position && player.world) {
      const currentBiome = player.world.getBiomeAt ? 
        player.world.getBiomeAt(player.position) : 'unknown';
        
      biomeData.currentBiome = currentBiome;
    }
    
    // Return combined data
    return {
      ...baseData,
      mapState: {
        ...baseData.mapState,
        biomeData
      }
    };
  }
  
  /**
   * Serialize biome map item
   * @returns {Object} - Serialized data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      targetBiome: this.targetBiome,
      biomeHighlightColor: this.biomeHighlightColor,
      showAllBiomes: this.showAllBiomes,
      biomeColors: this.biomeColors
    };
  }
  
  /**
   * Create biome map from JSON data
   * @param {Object} data - JSON data
   * @returns {BiomeMapItem} Item instance
   */
  static fromJSON(data) {
    return new BiomeMapItem({
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
      targetBiome: data.targetBiome,
      biomeHighlightColor: data.biomeHighlightColor,
      showAllBiomes: data.showAllBiomes,
      biomeColors: data.biomeColors,
      data: data.data
    });
  }
}

module.exports = BiomeMapItem; 