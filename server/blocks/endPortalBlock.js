/**
 * EndPortalBlock - Represents an End Portal block with teleportation mechanics
 */

class EndPortalBlock {
  /**
   * Creates a new End Portal block
   * @param {Object} options - Portal options
   * @param {String} options.dimension - Current dimension
   * @param {String} options.targetDimension - Target dimension for teleportation
   * @param {Object} options.server - Server instance
   */
  constructor(options = {}) {
    this.type = 'end_portal';
    this.dimension = options.dimension || 'overworld';
    this.targetDimension = options.targetDimension || 'end';
    this.server = options.server;
    this.isActive = true;
    this.lightLevel = 15;
    this.solid = false;
    this.transparent = true;
    this.collidable = false;
    this.activeTeleports = new Map();
  }
  
  /**
   * Handle when an entity enters the portal
   * @param {Object} entity - The entity that entered the portal
   * @param {Object} position - Portal position
   * @param {Object} world - World instance
   * @returns {Boolean} Whether the portal teleport was initiated
   */
  onEntityEnter(entity, position, world) {
    if (!entity || !entity.id || !this.isActive) return false;
    
    // Check if this entity is already being teleported
    if (this.activeTeleports.has(entity.id)) return false;
    
    // Start teleport process
    this.activeTeleports.set(entity.id, {
      entity,
      startTime: Date.now(),
      position,
      world
    });
    
    // Emit event for visual/sound effects
    if (this.server) {
      this.server.emit('entityEnterPortal', {
        entityId: entity.id,
        portalType: this.type,
        position
      });
    }
    
    return true;
  }
  
  /**
   * Process teleportation for entities in the portal
   */
  processTeleportation() {
    const now = Date.now();
    const toRemove = [];
    
    for (const [entityId, data] of this.activeTeleports.entries()) {
      const { entity, startTime, position, world } = data;
      
      // Teleport after 2 seconds in portal
      if (now - startTime >= 2000) {
        this.teleportEntity(entity, world);
        toRemove.push(entityId);
      }
      // If entity left portal area, cancel teleport
      else if (!this.isEntityInPortal(entity, position)) {
        toRemove.push(entityId);
      }
    }
    
    // Remove processed teleports
    for (const entityId of toRemove) {
      this.activeTeleports.delete(entityId);
    }
  }
  
  /**
   * Check if entity is still in the portal
   * @param {Object} entity - The entity to check
   * @param {Object} portalPosition - Position of the portal
   * @returns {Boolean} Whether the entity is in the portal
   */
  isEntityInPortal(entity, portalPosition) {
    if (!entity || !entity.position) return false;
    
    // Define portal area (a bit generous to account for entity size)
    const dx = Math.abs(entity.position.x - portalPosition.x);
    const dy = Math.abs(entity.position.y - portalPosition.y);
    const dz = Math.abs(entity.position.z - portalPosition.z);
    
    return dx < 1 && dy < 1 && dz < 1;
  }
  
  /**
   * Teleport an entity to the target dimension
   * @param {Object} entity - The entity to teleport
   * @param {Object} world - Current world instance
   * @returns {Boolean} Whether the teleport was successful
   */
  teleportEntity(entity, world) {
    if (!entity || !world) return false;
    
    // Determine target position based on dimensions
    let targetPosition;
    
    if (this.dimension === 'overworld' && this.targetDimension === 'end') {
      // To End: Central platform position
      targetPosition = { x: 0, y: 65, z: 0 };
    } else if (this.dimension === 'end' && this.targetDimension === 'overworld') {
      // To Overworld: World spawn point or player spawn point
      if (entity.type === 'player' && entity.spawnPosition) {
        targetPosition = { ...entity.spawnPosition };
      } else if (world.getSpawnPosition) {
        targetPosition = world.getSpawnPosition();
      } else {
        targetPosition = { x: 0, y: 64, z: 0 };
      }
    } else {
      // Default: same coordinates
      targetPosition = { ...entity.position };
    }
    
    // Ensure we have a valid target position
    if (!targetPosition) {
      console.error(`Failed to determine target position for teleport from ${this.dimension} to ${this.targetDimension}`);
      return false;
    }
    
    // Request dimension change
    if (world.server && world.server.dimensionManager) {
      world.server.dimensionManager.teleportEntityToDimension(
        entity,
        this.targetDimension,
        targetPosition
      );
      
      // Play teleport sound
      if (this.server) {
        this.server.emit('playSound', {
          name: 'entity.enderman.teleport',
          position: entity.position,
          volume: 1.0,
          pitch: 1.0,
          dimension: this.dimension
        });
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the state of the block for client rendering
   * @returns {Object} Block state data
   */
  getState() {
    return {
      type: this.type,
      isActive: this.isActive,
      dimension: this.dimension,
      targetDimension: this.targetDimension,
      lightLevel: this.lightLevel
    };
  }
  
  /**
   * Serializes the portal block
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      type: this.type,
      dimension: this.dimension,
      targetDimension: this.targetDimension,
      isActive: this.isActive
    };
  }
  
  /**
   * Creates an End Portal block from serialized data
   * @param {Object} data - Serialized data
   * @param {Object} server - Server instance
   * @returns {EndPortalBlock} New End Portal block
   */
  static deserialize(data, server) {
    return new EndPortalBlock({
      dimension: data.dimension,
      targetDimension: data.targetDimension,
      server,
      isActive: data.isActive
    });
  }
}

module.exports = EndPortalBlock; 