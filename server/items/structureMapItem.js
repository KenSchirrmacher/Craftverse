/**
 * StructureMapItem - Map that shows and locates structures
 * Part of the Minecraft 1.23 Update (Trailblazer)
 */

const MapItem = require('./mapItem');
const { v4: uuidv4 } = require('uuid');

class StructureMapItem extends MapItem {
  /**
   * Create a new structure map item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'structure_map',
      name: options.name || 'Structure Map',
      mapColor: options.mapColor || '#ffd37f', // Light orange color for structure maps
      ...options
    });
    
    // Structure-specific properties
    this.targetStructure = options.targetStructure || null;
    this.isRare = options.isRare !== undefined ? options.isRare : false;
    this.revealDistance = options.revealDistance || 128; // Distance at which structures are revealed
    this.structureHighlightColor = options.structureHighlightColor || '#ff0000'; // Red for structure
    
    // Pre-discover structure if one is specified
    if (options.targetStructureLocation) {
      this.setTargetStructureLocation(options.targetStructureLocation);
    }
    
    // Set map name based on structure type
    if (this.targetStructure) {
      this.name = `Map to ${this.formatStructureName(this.targetStructure)}`;
    }
  }
  
  /**
   * Format structure name for display
   * @param {string} structureType - Type of structure
   * @returns {string} Formatted name
   */
  formatStructureName(structureType) {
    if (!structureType) return 'Unknown Structure';
    
    // Replace underscores with spaces and capitalize words
    return structureType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Set the target structure type and look for nearest structure
   * @param {string} structureType - Type of structure to target
   * @param {Object} player - Player to use as reference
   * @param {Object} world - World reference
   * @returns {boolean} Success
   */
  setTargetStructure(structureType, player, world) {
    if (!structureType) return false;
    
    this.targetStructure = structureType;
    this.name = `Map to ${this.formatStructureName(structureType)}`;
    
    // If we have player and world, try to find nearest structure
    if (player && player.position && world && world.findNearestStructure) {
      const structure = world.findNearestStructure(
        structureType,
        player.position,
        this.isRare ? 10000 : 5000 // Search radius
      );
      
      if (structure) {
        this.setTargetStructureLocation(structure);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Set the target structure location directly
   * @param {Object} structure - Structure data
   * @returns {boolean} Success
   */
  setTargetStructureLocation(structure) {
    if (!structure || !structure.position) return false;
    
    // If structure type not set, use the type from structure
    if (!this.targetStructure && structure.type) {
      this.targetStructure = structure.type;
      this.name = `Map to ${this.formatStructureName(structure.type)}`;
    }
    
    // Center map on structure
    this.centerX = structure.position.x;
    this.centerZ = structure.position.z;
    
    // Add marker for structure
    this.addMarker({
      id: uuidv4(),
      position: structure.position,
      type: 'structure',
      name: structure.name || this.formatStructureName(this.targetStructure || 'unknown'),
      color: this.structureHighlightColor,
      icon: 'structure'
    });
    
    return true;
  }
  
  /**
   * Reveal nearby structures when the player explores with this map
   * @param {Object} player - Player exploring with the map
   * @param {Object} world - World reference
   */
  revealNearbyStructures(player, world) {
    if (!player || !player.position || !world) return;
    
    // Only update if player is in the same dimension as the map
    if (player.dimension !== this.dimension) return;
    
    // If we have a target structure, check if player is close enough to reveal it
    if (this.targetStructure && this.locationMarkers.length === 0) {
      // In a real implementation, this would use world.findNearestStructure
      // For now, simulate finding it
      const simulatedStructure = {
        type: this.targetStructure,
        position: {
          x: this.centerX + (Math.random() * 200 - 100),
          y: 64,
          z: this.centerZ + (Math.random() * 200 - 100)
        },
        name: this.formatStructureName(this.targetStructure)
      };
      
      this.setTargetStructureLocation(simulatedStructure);
    }
    
    // For non-targeted maps, reveal various structures in range
    if (!this.targetStructure && world.getStructuresInRange) {
      const structures = world.getStructuresInRange(
        player.position,
        this.revealDistance,
        this.isRare // If true, include rare structures
      );
      
      if (structures && structures.length > 0) {
        for (const structure of structures) {
          // Add marker if not already present
          const exists = this.locationMarkers.some(marker => 
            marker.type === 'structure' &&
            marker.position.x === structure.position.x &&
            marker.position.z === structure.position.z
          );
          
          if (!exists) {
            this.addMarker({
              position: structure.position,
              type: 'structure',
              name: this.formatStructureName(structure.type),
              color: this.structureHighlightColor,
              icon: 'structure'
            });
          }
        }
      }
    }
  }
  
  /**
   * Use the structure map - shows structure information
   * @param {Object} player - Player using the item
   * @param {Object} context - Use context
   * @returns {boolean} Whether use was successful
   */
  use(player, context) {
    if (!player) return false;
    
    // Standard map functionality first
    super.use(player, context);
    
    // Try to reveal any nearby structures
    if (context && context.world) {
      this.revealNearbyStructures(player, context.world);
    }
    
    // Add structure-specific information
    if (player.sendMessage) {
      if (this.targetStructure) {
        player.sendMessage(`Structure Map: ${this.formatStructureName(this.targetStructure)}`);
      } else {
        player.sendMessage(this.isRare ? 
          'Rare Structure Explorer Map' : 'Structure Explorer Map');
      }
      
      // If there are markers, provide distance information
      if (this.locationMarkers.length > 0 && player.position) {
        // Find closest marker
        let closestMarker = null;
        let closestDistance = Infinity;
        
        for (const marker of this.locationMarkers) {
          if (marker.type === 'structure') {
            const dx = marker.position.x - player.position.x;
            const dz = marker.position.z - player.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestMarker = marker;
            }
          }
        }
        
        if (closestMarker) {
          player.sendMessage(`Nearest structure: ${closestMarker.name}`);
          player.sendMessage(`Distance: approximately ${Math.floor(closestDistance)} blocks`);
          
          // Give a hint about direction
          const dx = closestMarker.position.x - player.position.x;
          const dz = closestMarker.position.z - player.position.z;
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
        }
      }
    }
    
    return true;
  }
  
  /**
   * Gets the client data for this item, including structure information
   * @param {Object} player - The player holding the map
   * @returns {Object} Client data with map state
   */
  getClientData(player) {
    const baseData = super.getClientData(player);
    
    // Add structure-specific data
    const structureData = {
      targetStructure: this.targetStructure,
      isRare: this.isRare,
      revealDistance: this.revealDistance,
      structureHighlightColor: this.structureHighlightColor
    };
    
    // Return combined data
    return {
      ...baseData,
      mapState: {
        ...baseData.mapState,
        structureData
      }
    };
  }
  
  /**
   * Serialize structure map item
   * @returns {Object} - Serialized data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      targetStructure: this.targetStructure,
      isRare: this.isRare,
      revealDistance: this.revealDistance,
      structureHighlightColor: this.structureHighlightColor
    };
  }
  
  /**
   * Create structure map from JSON data
   * @param {Object} data - JSON data
   * @returns {StructureMapItem} Item instance
   */
  static fromJSON(data) {
    return new StructureMapItem({
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
      targetStructure: data.targetStructure,
      isRare: data.isRare,
      revealDistance: data.revealDistance,
      structureHighlightColor: data.structureHighlightColor,
      data: data.data
    });
  }
}

module.exports = StructureMapItem; 