/**
 * TrailMarkerItem - Used to mark exploration paths
 * Part of the Minecraft 1.23 Update (Trailblazer)
 */

const Item = require('./item');
const { v4: uuidv4 } = require('uuid');

class TrailMarkerItem extends Item {
  /**
   * Create a new trail marker item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: 'trail_marker',
      name: 'Trail Marker',
      stackable: true,
      maxStackSize: 16,
      type: 'placeable',
      subtype: 'marker',
      category: 'tools',
      ...options
    });
    
    // Trail marker specific properties
    this.markerColor = options.markerColor || '#ff0000'; // Default to red
    this.markerVisibleDistance = options.markerVisibleDistance || 64; // How far it can be seen
    this.markerHeight = options.markerHeight || 1.5; // Height above ground
    this.allowsLabeling = options.allowsLabeling !== undefined ? options.allowsLabeling : true;
    this.glowInDark = options.glowInDark !== undefined ? options.glowInDark : true;
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
    
    // Create a marker entity at the position
    const markerEntity = this.createMarkerEntity(world, position, player);
    
    if (markerEntity && world.addEntity) {
      world.addEntity(markerEntity);
      
      // Consume one marker if player is not in creative mode
      if (player.gameMode !== 'creative') {
        this.reduceStackSize(1);
      }
      
      // Notify player
      if (player.sendMessage) {
        player.sendMessage('Trail marker placed');
        
        if (this.allowsLabeling) {
          player.sendMessage('Use /label_marker command to add a custom label');
        }
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Create a marker entity at the specified position
   * @param {Object} world - World reference
   * @param {Object} position - Block position
   * @param {Object} player - Player placing the marker
   * @returns {Object} Marker entity data
   */
  createMarkerEntity(world, position, player) {
    // Calculate marker position (center of block, at marker height)
    const markerPosition = {
      x: position.x + 0.5,
      y: position.y + this.markerHeight,
      z: position.z + 0.5
    };
    
    // Create marker entity
    return {
      id: uuidv4(),
      type: 'trail_marker',
      position: markerPosition,
      placedBy: player.id,
      placedByName: player.name || 'Unknown Player',
      placedAt: Date.now(),
      color: this.markerColor,
      visibleDistance: this.markerVisibleDistance,
      glowInDark: this.glowInDark,
      label: null, // Can be set later with command
      dimension: player.dimension || 'overworld'
    };
  }
  
  /**
   * Set the marker color
   * @param {string} color - Color in hex format
   * @returns {boolean} Whether color was set successfully
   */
  setColor(color) {
    if (!color || typeof color !== 'string') return false;
    
    // Check if it's a valid hex color
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      this.markerColor = color;
      return true;
    }
    
    // Handle named colors
    const namedColors = {
      'red': '#ff0000',
      'green': '#00ff00',
      'blue': '#0000ff',
      'yellow': '#ffff00',
      'purple': '#800080',
      'orange': '#ffa500',
      'white': '#ffffff',
      'black': '#000000'
    };
    
    if (namedColors[color.toLowerCase()]) {
      this.markerColor = namedColors[color.toLowerCase()];
      return true;
    }
    
    return false;
  }
  
  /**
   * Toggle glow in dark property
   * @returns {boolean} New glow state
   */
  toggleGlow() {
    this.glowInDark = !this.glowInDark;
    return this.glowInDark;
  }
  
  /**
   * Use the trail marker - shows information about the marker
   * @param {Object} player - Player using the item
   * @param {Object} context - Use context
   * @returns {boolean} Whether use was successful
   */
  use(player, context) {
    if (!player) return false;
    
    // Show marker information
    if (player.sendMessage) {
      player.sendMessage(`Trail Marker (${this.markerColor})`);
      player.sendMessage(`Visible up to ${this.markerVisibleDistance} blocks away`);
      
      if (this.glowInDark) {
        player.sendMessage('Glows in the dark');
      }
      
      if (this.allowsLabeling) {
        player.sendMessage('Can be labeled with /label_marker command');
      }
      
      player.sendMessage('Place on a block to mark your trail');
    }
    
    return true;
  }
  
  /**
   * Gets the client data for this item
   * @returns {Object} Client data
   */
  getClientData() {
    const baseData = super.getClientData();
    
    // Add trail marker specific data
    return {
      ...baseData,
      markerData: {
        color: this.markerColor,
        visibleDistance: this.markerVisibleDistance,
        height: this.markerHeight,
        allowsLabeling: this.allowsLabeling,
        glowInDark: this.glowInDark
      }
    };
  }
  
  /**
   * Serialize trail marker item
   * @returns {Object} - Serialized data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      markerColor: this.markerColor,
      markerVisibleDistance: this.markerVisibleDistance,
      markerHeight: this.markerHeight,
      allowsLabeling: this.allowsLabeling,
      glowInDark: this.glowInDark
    };
  }
  
  /**
   * Create trail marker from JSON data
   * @param {Object} data - JSON data
   * @returns {TrailMarkerItem} Item instance
   */
  static fromJSON(data) {
    return new TrailMarkerItem({
      id: data.id,
      name: data.name,
      markerColor: data.markerColor,
      markerVisibleDistance: data.markerVisibleDistance,
      markerHeight: data.markerHeight,
      allowsLabeling: data.allowsLabeling,
      glowInDark: data.glowInDark,
      data: data.data
    });
  }
}

module.exports = TrailMarkerItem; 