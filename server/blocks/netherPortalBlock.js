/**
 * NetherPortalBlock - Represents a nether portal block that allows travel between dimensions
 */

const Block = require('./block');
const { EventEmitter } = require('events');

class NetherPortalBlock extends Block {
  /**
   * Create a new nether portal block
   * @param {Object} options - Block options
   * @param {String} options.orientation - Portal orientation ('x' or 'z')
   */
  constructor(options = {}) {
    super({
      type: 'nether_portal',
      solid: false,
      transparent: true,
      light: 11, // Portal emits light
      ...options
    });
    
    this.orientation = options.orientation || 'x';
    this.collisionBox = this.orientation === 'x' 
      ? { x: 0, y: 0, z: 0.375, width: 1, height: 1, depth: 0.25 } 
      : { x: 0.375, y: 0, z: 0, width: 0.25, height: 1, depth: 1 };
  }
  
  /**
   * Handle entity entering the portal
   * @param {Object} world - World instance
   * @param {Object} entity - Entity entering the portal
   * @param {Object} position - Portal position
   */
  onEntityEnter(world, entity, position) {
    if (!entity.inPortal) {
      entity.inPortal = true;
      entity.portalCooldown = 0;
      entity.portalTimer = 0;
      entity.lastPortalPosition = { ...position };
    }
  }
  
  /**
   * Handle entity staying in the portal
   * @param {Object} world - World instance
   * @param {Object} entity - Entity in the portal
   * @param {Object} position - Portal position
   * @param {Number} deltaTime - Time since last tick in ms
   */
  onEntityStay(world, entity, position, deltaTime) {
    // If entity has a portal cooldown, reduce it
    if (entity.portalCooldown > 0) {
      entity.portalCooldown -= deltaTime;
      return;
    }
    
    // Track time spent in portal
    entity.portalTimer += deltaTime;
    
    // After 4 seconds (4000ms), teleport the entity
    if (entity.portalTimer >= 4000) {
      this.teleportEntity(world, entity, position);
      entity.portalTimer = 0;
      entity.portalCooldown = 10000; // 10 second cooldown
    }
  }
  
  /**
   * Handle entity leaving the portal
   * @param {Object} world - World instance
   * @param {Object} entity - Entity leaving the portal
   */
  onEntityLeave(world, entity) {
    entity.inPortal = false;
    entity.portalTimer = 0;
  }
  
  /**
   * Teleport entity to another dimension
   * @param {Object} world - World instance
   * @param {Object} entity - Entity to teleport
   * @param {Object} position - Portal position
   * @returns {Boolean} True if teleport was successful
   */
  teleportEntity(world, entity, position) {
    const server = world.server;
    if (!server || !server.dimensionManager) {
      console.error('Cannot teleport: No dimension manager available');
      return false;
    }
    
    // Find the source dimension
    const sourceDimension = entity.dimension || 'overworld';
    
    // Determine target dimension
    const targetDimension = sourceDimension === 'overworld' ? 'nether' : 'overworld';
    
    // Use the dimension manager to handle teleportation
    return server.dimensionManager.teleportEntity(entity, targetDimension, position);
  }
  
  /**
   * Check if the portal is still valid (has a complete obsidian frame)
   * @param {Object} world - World instance
   * @param {Object} position - Portal position
   * @returns {Boolean} True if portal is valid
   */
  isValidPortal(world, position) {
    // Check if this portal still has a valid frame
    const { x, y, z } = position;
    
    // Find the bounds of this portal by searching in all directions
    let minX = x, maxX = x;
    let minY = y, maxY = y;
    let minZ = z, maxZ = z;
    
    // Find portal dimensions based on orientation
    if (this.orientation === 'x') {
      // Search left and right
      while (world.getBlockType(`${minX - 1},${y},${z}`) === 'nether_portal') minX--;
      while (world.getBlockType(`${maxX + 1},${y},${z}`) === 'nether_portal') maxX++;
      
      // Search up and down
      while (world.getBlockType(`${x},${minY - 1},${z}`) === 'nether_portal') minY--;
      while (world.getBlockType(`${x},${maxY + 1},${z}`) === 'nether_portal') maxY++;
      
      // Check for obsidian frame
      for (let px = minX; px <= maxX; px++) {
        // Check top and bottom
        if (world.getBlockType(`${px},${minY - 1},${z}`) !== 'obsidian' ||
            world.getBlockType(`${px},${maxY + 1},${z}`) !== 'obsidian') {
          return false;
        }
      }
      
      for (let py = minY; py <= maxY; py++) {
        // Check left and right sides
        if (world.getBlockType(`${minX - 1},${py},${z}`) !== 'obsidian' ||
            world.getBlockType(`${maxX + 1},${py},${z}`) !== 'obsidian') {
          return false;
        }
      }
    } else { // 'z' orientation
      // Search front and back
      while (world.getBlockType(`${x},${y},${minZ - 1}`) === 'nether_portal') minZ--;
      while (world.getBlockType(`${x},${y},${maxZ + 1}`) === 'nether_portal') maxZ++;
      
      // Search up and down
      while (world.getBlockType(`${x},${minY - 1},${z}`) === 'nether_portal') minY--;
      while (world.getBlockType(`${x},${maxY + 1},${z}`) === 'nether_portal') maxY++;
      
      // Check for obsidian frame
      for (let pz = minZ; pz <= maxZ; pz++) {
        // Check top and bottom
        if (world.getBlockType(`${x},${minY - 1},${pz}`) !== 'obsidian' ||
            world.getBlockType(`${x},${maxY + 1},${pz}`) !== 'obsidian') {
          return false;
        }
      }
      
      for (let py = minY; py <= maxY; py++) {
        // Check front and back sides
        if (world.getBlockType(`${x},${py},${minZ - 1}`) !== 'obsidian' ||
            world.getBlockType(`${x},${py},${maxZ + 1}`) !== 'obsidian') {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Handle block update (break the portal if the frame is broken)
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   */
  onNeighborUpdate(world, position) {
    // If the portal is no longer valid, break it
    if (!this.isValidPortal(world, position)) {
      // Break this portal block
      world.setBlock(`${position.x},${position.y},${position.z}`, { type: 'air' });
      
      // Trigger event to update dimension manager
      if (world.server && world.server.dimensionManager) {
        world.server.dimensionManager.emit('portalDestroyed', {
          dimension: world.dimensionId || 'overworld',
          targetDimension: world.dimensionId === 'overworld' ? 'nether' : 'overworld',
          position
        });
      }
      
      // Break any adjacent portal blocks
      if (this.orientation === 'x') {
        // Check left and right
        this.breakAdjacentPortal(world, { x: position.x - 1, y: position.y, z: position.z });
        this.breakAdjacentPortal(world, { x: position.x + 1, y: position.y, z: position.z });
        // Check up and down
        this.breakAdjacentPortal(world, { x: position.x, y: position.y - 1, z: position.z });
        this.breakAdjacentPortal(world, { x: position.x, y: position.y + 1, z: position.z });
      } else {
        // Check front and back
        this.breakAdjacentPortal(world, { x: position.x, y: position.y, z: position.z - 1 });
        this.breakAdjacentPortal(world, { x: position.x, y: position.y, z: position.z + 1 });
        // Check up and down
        this.breakAdjacentPortal(world, { x: position.x, y: position.y - 1, z: position.z });
        this.breakAdjacentPortal(world, { x: position.x, y: position.y + 1, z: position.z });
      }
    }
  }
  
  /**
   * Break an adjacent portal block
   * @param {Object} world - World instance
   * @param {Object} position - Adjacent position
   */
  breakAdjacentPortal(world, position) {
    const block = world.getBlock(`${position.x},${position.y},${position.z}`);
    if (block && block.type === 'nether_portal') {
      world.setBlock(`${position.x},${position.y},${position.z}`, { type: 'air' });
    }
  }
  
  /**
   * Get client data for this block
   * @returns {Object} Client-side block data
   */
  getClientData() {
    return {
      ...super.getClientData(),
      orientation: this.orientation,
      animationSpeed: 0.25,
      particleEmitter: {
        type: 'portal',
        rate: 0.2,
        speed: 0.1,
        color: '#5A3FD6',
        size: 0.3
      },
      soundEffect: {
        name: 'portal_ambient',
        volume: 0.2,
        pitch: 1.0,
        loop: true
      }
    };
  }
  
  /**
   * Serialize this block
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      orientation: this.orientation
    };
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {NetherPortalBlock} New block instance
   */
  static deserialize(data) {
    return new NetherPortalBlock({
      orientation: data.orientation
    });
  }
}

module.exports = NetherPortalBlock; 