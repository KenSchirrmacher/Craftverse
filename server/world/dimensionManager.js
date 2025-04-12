/**
 * DimensionManager - Handles dimension loading, teleportation between dimensions,
 * and coordinates dimension-specific world generation
 */

const EventEmitter = require('events');

class DimensionManager extends EventEmitter {
  /**
   * Creates a new Dimension Manager
   * @param {Object} options - Configuration options
   * @param {Object} options.server - Server instance
   * @param {Object} options.dimensions - Initial dimensions to load
   */
  constructor(options = {}) {
    super();
    this.server = options.server;
    
    // Store loaded dimensions
    this.dimensions = new Map();
    
    // Dimensions configuration
    this.dimensionConfig = {
      overworld: {
        name: 'overworld',
        skyColor: '#87CEEB',
        fogColor: '#C0D8FF',
        gravity: 1.0,
        timeSpeed: 1.0,
        skyLight: true,
        buildHeight: {
          min: 0,
          max: 256
        }
      },
      nether: {
        name: 'nether',
        skyColor: '#330808',
        fogColor: '#330808',
        gravity: 1.0,
        timeSpeed: 0,
        skyLight: false,
        buildHeight: {
          min: 0,
          max: 128
        }
      },
      end: {
        name: 'end',
        skyColor: '#000000',
        fogColor: '#0B0B19',
        gravity: 1.0,
        timeSpeed: 0,
        skyLight: false,
        buildHeight: {
          min: 0,
          max: 256
        }
      }
    };
    
    // Map of pending teleports with cooldowns
    this.pendingTeleports = new Map();
    
    // Set the default spawn points for each dimension
    this.spawnPoints = {
      overworld: { x: 0, y: 64, z: 0 },
      nether: { x: 0, y: 32, z: 0 },
      end: { x: 0, y: 64, z: 0 }
    };
    
    // Portal scaling factor (for nether portals)
    this.netherScaleFactor = 8;
    
    // Initialize dimensions
    if (options.dimensions) {
      for (const [name, dimension] of Object.entries(options.dimensions)) {
        this.addDimension(name, dimension);
      }
    }
  }
  
  /**
   * Adds a dimension to the manager
   * @param {String} name - Dimension name
   * @param {Object} dimension - Dimension object
   */
  addDimension(name, dimension) {
    if (this.dimensions.has(name)) {
      console.warn(`Dimension ${name} already exists, replacing.`);
    }
    
    this.dimensions.set(name, dimension);
    this.emit('dimensionAdded', { name, dimension });
  }
  
  /**
   * Gets a dimension by name
   * @param {String} name - Dimension name
   * @returns {Object|null} Dimension object or null if not found
   */
  getDimension(name) {
    return this.dimensions.get(name) || null;
  }
  
  /**
   * Gets the configuration for a dimension
   * @param {String} name - Dimension name
   * @returns {Object|null} Dimension configuration or null if not found
   */
  getDimensionConfig(name) {
    return this.dimensionConfig[name] || null;
  }
  
  /**
   * Sets a spawn point for a dimension
   * @param {String} dimension - Dimension name
   * @param {Object} position - Spawn position
   */
  setSpawnPoint(dimension, position) {
    if (!this.spawnPoints[dimension]) {
      this.spawnPoints[dimension] = {};
    }
    
    this.spawnPoints[dimension] = { ...position };
  }
  
  /**
   * Gets the spawn point for a dimension
   * @param {String} dimension - Dimension name
   * @returns {Object} Spawn position
   */
  getSpawnPoint(dimension) {
    return this.spawnPoints[dimension] || this.spawnPoints.overworld;
  }
  
  /**
   * Teleports an entity between dimensions
   * @param {Object} entity - Entity to teleport
   * @param {String} targetDimension - Target dimension name
   * @param {Object} targetPosition - Target position (optional)
   * @returns {Boolean} Whether teleportation was successful
   */
  teleportEntityToDimension(entity, targetDimension, targetPosition = null) {
    if (!entity || !targetDimension) return false;
    
    // Check if dimension exists
    const targetWorld = this.getDimension(targetDimension);
    if (!targetWorld) {
      console.error(`Target dimension ${targetDimension} does not exist.`);
      return false;
    }
    
    // Check cooldown to prevent spam
    const entityId = entity.id || entity.uuid || `entity_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    if (this.pendingTeleports.has(entityId)) {
      const lastTeleport = this.pendingTeleports.get(entityId);
      if (now - lastTeleport < 2000) { // 2 second cooldown
        return false;
      }
    }
    
    // Get current dimension
    const currentDimension = entity.dimension || 'overworld';
    const currentWorld = this.getDimension(currentDimension);
    if (!currentWorld) {
      console.error(`Current dimension ${currentDimension} does not exist.`);
      return false;
    }
    
    // Calculate target position if not provided
    if (!targetPosition) {
      targetPosition = this.calculateTargetPosition(entity, currentDimension, targetDimension);
    }
    
    // Remove entity from current dimension
    currentWorld.removeEntity(entity);
    
    // Update entity properties
    const oldPosition = { ...entity.position };
    entity.dimension = targetDimension;
    entity.position = targetPosition;
    
    // Add entity to target dimension
    targetWorld.addEntity(entity);
    
    // Set teleport cooldown
    this.pendingTeleports.set(entityId, now);
    
    // Clean up old cooldowns occasionally
    if (Math.random() < 0.1) {
      this.cleanupTeleportCooldowns();
    }
    
    // Emit teleport event
    this.emit('entityTeleported', {
      entity,
      fromDimension: currentDimension,
      toDimension: targetDimension,
      fromPosition: oldPosition,
      toPosition: targetPosition
    });
    
    return true;
  }
  
  /**
   * Calculate the target position for teleportation
   * @param {Object} entity - Entity being teleported
   * @param {String} fromDimension - Source dimension
   * @param {String} toDimension - Target dimension
   * @returns {Object} Target position
   */
  calculateTargetPosition(entity, fromDimension, toDimension) {
    const position = { ...entity.position };
    
    // For nether/overworld scaling
    if ((fromDimension === 'overworld' && toDimension === 'nether') ||
        (fromDimension === 'nether' && toDimension === 'overworld')) {
      
      // Scale coordinates for nether/overworld conversion
      if (fromDimension === 'overworld' && toDimension === 'nether') {
        position.x = Math.floor(position.x / this.netherScaleFactor);
        position.z = Math.floor(position.z / this.netherScaleFactor);
        position.y = Math.min(Math.max(position.y, 30), 100); // Safe Y in nether
      } else {
        position.x = Math.floor(position.x * this.netherScaleFactor);
        position.z = Math.floor(position.z * this.netherScaleFactor);
        // Find safe Y in overworld
        position.y = 64; // Default to sea level
      }
    } else if (toDimension === 'end') {
      // End dimension has a fixed spawn platform
      return { ...this.spawnPoints.end };
    } else if (fromDimension === 'end' && toDimension === 'overworld') {
      // Returning from end puts you at world spawn or bed
      if (entity.type === 'player' && entity.spawnPosition) {
        return { ...entity.spawnPosition };
      } else {
        return { ...this.spawnPoints.overworld };
      }
    }
    
    // Ensure position is safe (not in a block)
    const targetWorld = this.getDimension(toDimension);
    if (targetWorld) {
      position.y = this.findSafeY(targetWorld, position);
    }
    
    return position;
  }
  
  /**
   * Find a safe Y coordinate at the given X,Z position
   * @param {Object} world - World to check
   * @param {Object} position - Position to check
   * @returns {Number} Safe Y coordinate
   */
  findSafeY(world, position) {
    const { x, y, z } = position;
    const buildHeight = this.dimensionConfig[world.dimension]?.buildHeight || { min: 0, max: 256 };
    
    // Start checking from y position and look up/down for safe spot
    let startY = Math.min(Math.max(y, buildHeight.min), buildHeight.max);
    
    // Check up for air
    for (let checkY = startY; checkY < buildHeight.max - 1; checkY++) {
      const block1 = world.getBlock({ x, y: checkY, z });
      const block2 = world.getBlock({ x, y: checkY + 1, z });
      
      if ((!block1 || !block1.solid) && (!block2 || !block2.solid)) {
        return checkY;
      }
    }
    
    // Check down for solid ground with air above
    for (let checkY = startY; checkY > buildHeight.min + 1; checkY--) {
      const blockBelow = world.getBlock({ x, y: checkY - 1, z });
      const block1 = world.getBlock({ x, y: checkY, z });
      const block2 = world.getBlock({ x, y: checkY + 1, z });
      
      if (blockBelow && blockBelow.solid && 
          (!block1 || !block1.solid) && 
          (!block2 || !block2.solid)) {
        return checkY;
      }
    }
    
    // If all else fails, return a default Y based on dimension
    if (world.dimension === 'nether') {
      return 32;
    } else if (world.dimension === 'end') {
      return 64;
    } else {
      return 64; // Overworld default
    }
  }
  
  /**
   * Cleanup old teleport cooldowns
   */
  cleanupTeleportCooldowns() {
    const now = Date.now();
    for (const [entityId, timestamp] of this.pendingTeleports.entries()) {
      if (now - timestamp > 10000) { // 10 seconds
        this.pendingTeleports.delete(entityId);
      }
    }
  }
  
  /**
   * Get all dimension names
   * @returns {Array} Array of dimension names
   */
  getDimensionNames() {
    return Array.from(this.dimensions.keys());
  }
  
  /**
   * Saves dimension data
   * @returns {Object} Serialized dimension data
   */
  serialize() {
    // Only serialize configuration that needs to be persisted
    return {
      spawnPoints: { ...this.spawnPoints }
    };
  }
  
  /**
   * Loads dimension data
   * @param {Object} data - Serialized dimension data
   */
  deserialize(data) {
    if (data.spawnPoints) {
      this.spawnPoints = { ...data.spawnPoints };
    }
  }
}

module.exports = DimensionManager; 