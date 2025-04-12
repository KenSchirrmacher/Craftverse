/**
 * EndGatewayBlock - Represents an End Gateway block with teleportation mechanics
 * Used to teleport players between the main End island and the outer islands
 */

class EndGatewayBlock {
  /**
   * Creates a new End Gateway block
   * @param {Object} options - Gateway options
   * @param {Object} options.exitPosition - Position to teleport entities to
   * @param {Boolean} options.exactTeleport - Whether to teleport to exact coordinates or to find safe location
   * @param {Number} options.age - Age of the gateway (in ticks)
   * @param {Object} options.server - Server instance
   */
  constructor(options = {}) {
    this.type = 'end_gateway';
    this.exitPosition = options.exitPosition || null;
    this.exactTeleport = options.exactTeleport || false;
    this.age = options.age || 0;
    this.cooldown = 0; // Cooldown until next teleport
    this.server = options.server;
    this.isActive = true;
    this.lightLevel = 15;
    this.solid = false;
    this.transparent = true;
    this.collidable = false;
    this.activeTeleports = new Map();
    this.ready = this.age > 200; // Gateway becomes ready after 200 ticks (10 seconds)
  }
  
  /**
   * Update the gateway state
   */
  update() {
    // Increment age until gateway is ready
    if (!this.ready) {
      this.age++;
      if (this.age >= 200) {
        this.ready = true;
        
        // Play activation sound
        if (this.server) {
          this.server.emit('playSound', {
            name: 'block.end_gateway.spawn',
            position: this.position,
            volume: 1.0,
            pitch: 1.0,
            dimension: 'end'
          });
        }
      }
    }
    
    // Decrement cooldown
    if (this.cooldown > 0) {
      this.cooldown--;
    }
    
    // Process teleportation
    this.processTeleportation();
  }
  
  /**
   * Handle when an entity enters the gateway
   * @param {Object} entity - The entity that entered the gateway
   * @param {Object} position - Gateway position
   * @param {Object} world - World instance
   * @returns {Boolean} Whether the gateway teleport was initiated
   */
  onEntityEnter(entity, position, world) {
    if (!entity || !entity.id || !this.isActive || !this.ready || this.cooldown > 0) return false;
    
    // Check if this entity is already being teleported
    if (this.activeTeleports.has(entity.id)) return false;
    
    // Store position for reference
    this.position = position;
    
    // Start teleport process
    this.activeTeleports.set(entity.id, {
      entity,
      startTime: Date.now(),
      position,
      world
    });
    
    // Emit event for visual/sound effects
    if (this.server) {
      this.server.emit('entityEnterGateway', {
        entityId: entity.id,
        position
      });
    }
    
    return true;
  }
  
  /**
   * Process teleportation for entities in the gateway
   */
  processTeleportation() {
    const now = Date.now();
    const toRemove = [];
    
    for (const [entityId, data] of this.activeTeleports.entries()) {
      const { entity, startTime, position, world } = data;
      
      // Teleport after a very brief delay (0.5 seconds)
      if (now - startTime >= 500) {
        this.teleportEntity(entity, world);
        toRemove.push(entityId);
      }
      // If entity left portal area, cancel teleport
      else if (!this.isEntityInGateway(entity, position)) {
        toRemove.push(entityId);
      }
    }
    
    // Remove processed teleports
    for (const entityId of toRemove) {
      this.activeTeleports.delete(entityId);
    }
  }
  
  /**
   * Check if entity is still in the gateway
   * @param {Object} entity - The entity to check
   * @param {Object} gatewayPosition - Position of the gateway
   * @returns {Boolean} Whether the entity is in the gateway
   */
  isEntityInGateway(entity, gatewayPosition) {
    if (!entity || !entity.position) return false;
    
    // Define gateway area (a bit generous to account for entity size)
    const dx = Math.abs(entity.position.x - gatewayPosition.x);
    const dy = Math.abs(entity.position.y - gatewayPosition.y);
    const dz = Math.abs(entity.position.z - gatewayPosition.z);
    
    return dx < 1 && dy < 1 && dz < 1;
  }
  
  /**
   * Teleport an entity to the target position
   * @param {Object} entity - The entity to teleport
   * @param {Object} world - Current world instance
   * @returns {Boolean} Whether the teleport was successful
   */
  teleportEntity(entity, world) {
    if (!entity || !world || !this.exitPosition) return false;
    
    // Get target position
    let targetPosition = { ...this.exitPosition };
    
    // If not exact teleport, find a safe position
    if (!this.exactTeleport) {
      targetPosition = this.findSafePosition(world, targetPosition);
    }
    
    // Update entity position
    const oldPosition = { ...entity.position };
    entity.position = targetPosition;
    
    // Set cooldown (2 seconds)
    this.cooldown = 40;
    
    // Play teleport sound
    if (this.server) {
      this.server.emit('playSound', {
        name: 'entity.enderman.teleport',
        position: oldPosition,
        volume: 1.0,
        pitch: 1.0,
        dimension: 'end'
      });
      
      // Also play sound at destination
      this.server.emit('playSound', {
        name: 'entity.enderman.teleport',
        position: targetPosition,
        volume: 1.0,
        pitch: 1.0,
        dimension: 'end'
      });
      
      // Notify clients about the teleport
      this.server.emit('entityTeleported', {
        entityId: entity.id,
        fromPosition: oldPosition,
        toPosition: targetPosition
      });
    }
    
    return true;
  }
  
  /**
   * Find a safe position near the target
   * @param {Object} world - World instance
   * @param {Object} position - Target position
   * @returns {Object} Safe position
   */
  findSafePosition(world, position) {
    // Start at the target position and search upward/downward for a safe spot
    const { x, y, z } = position;
    
    // Check if the target position is already safe
    if (this.isPositionSafe(world, position)) {
      return position;
    }
    
    // Search upward first (up to 10 blocks)
    for (let dy = 1; dy <= 10; dy++) {
      const checkPos = { x, y: y + dy, z };
      if (this.isPositionSafe(world, checkPos)) {
        return checkPos;
      }
    }
    
    // Then search downward (up to 10 blocks)
    for (let dy = 1; dy <= 10; dy++) {
      const checkPos = { x, y: y - dy, z };
      if (this.isPositionSafe(world, checkPos)) {
        return checkPos;
      }
    }
    
    // If no safe position is found, create a platform
    this.createSafePlatform(world, position);
    
    // Return a position above the platform
    return { x, y: y + 1, z };
  }
  
  /**
   * Check if a position is safe for teleportation
   * @param {Object} world - World instance
   * @param {Object} position - Position to check
   * @returns {Boolean} Whether the position is safe
   */
  isPositionSafe(world, position) {
    const { x, y, z } = position;
    
    // Position should have air for the entity's body (2 blocks high)
    const blockAtFeet = world.getBlock({ x, y, z });
    const blockAtHead = world.getBlock({ x, y: y + 1, z });
    
    // Should have solid ground below
    const blockBelow = world.getBlock({ x, y: y - 1, z });
    
    return (!blockAtFeet || !blockAtFeet.solid) && 
           (!blockAtHead || !blockAtHead.solid) && 
           (blockBelow && blockBelow.solid);
  }
  
  /**
   * Create a safe platform for teleportation
   * @param {Object} world - World instance
   * @param {Object} position - Position to create platform at
   */
  createSafePlatform(world, position) {
    const { x, y, z } = position;
    
    // Create a 3x3 platform of end stone
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        world.setBlock({ x: x + dx, y: y - 1, z: z + dz }, { type: 'end_stone' });
      }
    }
    
    // Clear any blocks at entity position and above
    world.removeBlock({ x, y, z });
    world.removeBlock({ x, y: y + 1, z });
  }
  
  /**
   * Get the state of the block for client rendering
   * @returns {Object} Block state data
   */
  getState() {
    return {
      type: this.type,
      isActive: this.isActive,
      ready: this.ready,
      age: this.age,
      lightLevel: this.lightLevel,
      exitPosition: this.exitPosition ? { ...this.exitPosition } : null
    };
  }
  
  /**
   * Serializes the gateway block
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      type: this.type,
      exitPosition: this.exitPosition ? { ...this.exitPosition } : null,
      exactTeleport: this.exactTeleport,
      age: this.age,
      ready: this.ready
    };
  }
  
  /**
   * Creates an End Gateway block from serialized data
   * @param {Object} data - Serialized data
   * @param {Object} server - Server instance
   * @returns {EndGatewayBlock} New End Gateway block
   */
  static deserialize(data, server) {
    return new EndGatewayBlock({
      exitPosition: data.exitPosition,
      exactTeleport: data.exactTeleport,
      age: data.age,
      server
    });
  }
}

module.exports = EndGatewayBlock; 