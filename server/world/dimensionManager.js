/**
 * DimensionManager - Handles cross-dimension travel and portal linking
 */

const { EventEmitter } = require('events');

class DimensionManager extends EventEmitter {
  /**
   * Create a new dimension manager
   * @param {Object} server - Server instance
   */
  constructor(server) {
    super();
    this.server = server;
    this.dimensions = new Map(); // Maps dimension id to world instance
    this.portals = new Map(); // Maps portal keys to portal data
    this.pendingTeleports = new Map(); // Maps entity id to teleport data
    
    // Default scale factors between dimensions
    this.dimensionScales = {
      'overworld_to_nether': 8, // Overworld coordinates ÷ 8 = Nether coordinates
      'nether_to_overworld': 8  // Nether coordinates × 8 = Overworld coordinates
    };
  }
  
  /**
   * Initialize the dimension manager
   */
  init() {
    // Register event listeners for entity movement through portals
    this.server.on('entityEnterPortal', this.handleEntityEnterPortal.bind(this));
    
    // Listen for world ticks to process pending teleports
    this.server.on('tick', this.processPendingTeleports.bind(this));
    
    // Listen for world unloads to clean up dimension references
    this.server.on('worldUnloaded', this.handleWorldUnloaded.bind(this));
  }
  
  /**
   * Register a world as a dimension
   * @param {String} dimensionId - The dimension identifier
   * @param {Object} world - The world instance
   */
  registerDimension(dimensionId, world) {
    this.dimensions.set(dimensionId, world);
    console.log(`Registered dimension: ${dimensionId}`);
  }
  
  /**
   * Unregister a dimension
   * @param {String} dimensionId - The dimension identifier
   */
  unregisterDimension(dimensionId) {
    this.dimensions.delete(dimensionId);
    
    // Clean up any portals related to this dimension
    for (const [key, portal] of this.portals.entries()) {
      if (portal.dimension === dimensionId || portal.targetDimension === dimensionId) {
        this.portals.delete(key);
      }
    }
  }
  
  /**
   * Handle world unloaded event
   * @param {Object} data - World unload data
   */
  handleWorldUnloaded(data) {
    const { dimensionId } = data;
    if (dimensionId) {
      this.unregisterDimension(dimensionId);
    }
  }
  
  /**
   * Register a portal
   * @param {Object} portalData - Portal information
   */
  registerPortal(portalData) {
    const { dimension, position, orientation } = portalData;
    const portalKey = `${dimension}:${position.x},${position.y},${position.z}:${orientation}`;
    
    this.portals.set(portalKey, portalData);
    
    // Try to find or create a linked portal in the target dimension
    this.createLinkedPortal(portalData);
    
    console.log(`Registered portal: ${portalKey}`);
  }
  
  /**
   * Create or find a linked portal in the target dimension
   * @param {Object} sourcePortalData - The source portal information
   */
  createLinkedPortal(sourcePortalData) {
    const { dimension, targetDimension, position, orientation } = sourcePortalData;
    
    // Get the target world
    const targetWorld = this.dimensions.get(targetDimension);
    if (!targetWorld) {
      console.warn(`Target dimension ${targetDimension} not found for portal linking`);
      return;
    }
    
    // Calculate the target position based on dimension scaling
    let targetX, targetY, targetZ;
    
    if (dimension === 'overworld' && targetDimension === 'nether') {
      // Overworld to Nether (divide by 8)
      targetX = Math.floor(position.x / this.dimensionScales.overworld_to_nether);
      targetZ = Math.floor(position.z / this.dimensionScales.overworld_to_nether);
    } else if (dimension === 'nether' && targetDimension === 'overworld') {
      // Nether to Overworld (multiply by 8)
      targetX = Math.floor(position.x * this.dimensionScales.nether_to_overworld);
      targetZ = Math.floor(position.z * this.dimensionScales.nether_to_overworld);
    } else {
      // Default 1:1 mapping for other dimension pairs
      targetX = position.x;
      targetZ = position.z;
    }
    
    // Try to find a safe Y position
    targetY = this.findSafePortalLocation(targetWorld, targetX, targetZ, orientation);
    
    if (targetY === -1) {
      console.warn(`Could not find safe location for linked portal in ${targetDimension}`);
      return;
    }
    
    // Check if there's already a portal nearby in the target dimension
    const nearbyPortal = this.findNearbyPortal(targetDimension, targetX, targetY, targetZ, 16);
    if (nearbyPortal) {
      // Link to the existing portal
      this.linkPortals(sourcePortalData, nearbyPortal);
      return;
    }
    
    // Create a new portal at the target location
    const targetPortalData = {
      dimension: targetDimension,
      targetDimension: dimension,
      orientation,
      position: { x: targetX, y: targetY, z: targetZ },
      width: sourcePortalData.width,
      height: sourcePortalData.height,
      isLinked: true,
      linkSource: `${dimension}:${position.x},${position.y},${position.z}:${orientation}`
    };
    
    // Build the physical portal in the target world
    this.buildPortalFrame(targetWorld, targetPortalData);
    
    // Register the target portal
    const targetPortalKey = `${targetDimension}:${targetX},${targetY},${targetZ}:${orientation}`;
    this.portals.set(targetPortalKey, targetPortalData);
    
    // Link the portals
    this.linkPortals(sourcePortalData, targetPortalData);
    
    console.log(`Created linked portal in ${targetDimension} at ${targetX},${targetY},${targetZ}`);
  }
  
  /**
   * Find a safe location for a portal
   * @param {Object} world - The target world
   * @param {Number} x - The target X coordinate
   * @param {Number} z - The target Z coordinate
   * @param {String} orientation - Portal orientation
   * @returns {Number} The Y coordinate, or -1 if no safe location found
   */
  findSafePortalLocation(world, x, z, orientation) {
    // First check if there's already a portal frame nearby
    const existingY = this.findExistingPortalFrame(world, x, z, 16);
    if (existingY !== -1) {
      return existingY;
    }
    
    // Try to find a safe open area
    // Start from sea level and go down to y=10
    for (let y = 64; y >= 10; y--) {
      // Need at least 3 blocks of vertical clearance
      let hasClearance = true;
      
      // Check for solid ground below
      if (world.getBlockType(`${x},${y-1},${z}`) === 'air') {
        continue;
      }
      
      // Check for enough space for the portal (minimum 4x5)
      const width = orientation === 'x' ? 4 : 1;
      const depth = orientation === 'z' ? 4 : 1;
      
      for (let dx = -width; dx <= width; dx++) {
        for (let dz = -depth; dz <= depth; dz++) {
          for (let dy = 0; dy < 5; dy++) {
            const blockType = world.getBlockType(`${x+dx},${y+dy},${z+dz}`);
            if (blockType && blockType !== 'air') {
              hasClearance = false;
              break;
            }
          }
          if (!hasClearance) break;
        }
        if (!hasClearance) break;
      }
      
      if (hasClearance) {
        return y;
      }
    }
    
    // If no suitable location found, force it at y=64
    return 64;
  }
  
  /**
   * Find an existing portal frame
   * @param {Object} world - The world to search in
   * @param {Number} x - The X coordinate center
   * @param {Number} z - The Z coordinate center
   * @param {Number} radius - The search radius
   * @returns {Number} The Y coordinate of the found frame, or -1 if none found
   */
  findExistingPortalFrame(world, x, z, radius) {
    // Search in a square around the target location
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        // Search from top to bottom
        for (let y = 100; y >= 10; y--) {
          const blockType = world.getBlockType(`${x+dx},${y},${z+dz}`);
          if (blockType === 'obsidian') {
            // Found potential obsidian, check if it's part of a portal frame
            // This is simplified - in a real implementation, you'd want more thorough checking
            return y;
          }
        }
      }
    }
    
    return -1;
  }
  
  /**
   * Find a nearby portal in a dimension
   * @param {String} dimensionId - The dimension to search in
   * @param {Number} x - The X coordinate
   * @param {Number} y - The Y coordinate
   * @param {Number} z - The Z coordinate
   * @param {Number} radius - The search radius
   * @returns {Object|null} The portal data if found, or null
   */
  findNearbyPortal(dimensionId, x, y, z, radius) {
    for (const portal of this.portals.values()) {
      if (portal.dimension !== dimensionId) continue;
      
      const dx = portal.position.x - x;
      const dy = portal.position.y - y;
      const dz = portal.position.z - z;
      const distanceSquared = dx*dx + dy*dy + dz*dz;
      
      if (distanceSquared <= radius*radius) {
        return portal;
      }
    }
    
    return null;
  }
  
  /**
   * Build a physical portal frame and activate it
   * @param {Object} world - The world to build in
   * @param {Object} portalData - The portal data
   */
  buildPortalFrame(world, portalData) {
    const { position, orientation, width, height } = portalData;
    const { x, y, z } = position;
    
    // Default dimensions if not specified
    const portalWidth = width || 2;
    const portalHeight = height || 3;
    
    // Calculate corner positions
    const startX = orientation === 'x' ? x - Math.floor(portalWidth/2) : x;
    const startZ = orientation === 'z' ? z - Math.floor(portalWidth/2) : z;
    const startY = y;
    
    // Build the obsidian frame
    
    // Bottom row
    for (let i = 0; i <= portalWidth + 1; i++) {
      const bx = orientation === 'x' ? startX - 1 + i : startX;
      const bz = orientation === 'z' ? startZ - 1 + i : startZ;
      world.setBlock(`${bx},${startY-1},${bz}`, { type: 'obsidian' });
    }
    
    // Top row
    for (let i = 0; i <= portalWidth + 1; i++) {
      const bx = orientation === 'x' ? startX - 1 + i : startX;
      const bz = orientation === 'z' ? startZ - 1 + i : startZ;
      world.setBlock(`${bx},${startY+portalHeight},${bz}`, { type: 'obsidian' });
    }
    
    // Left/front pillar
    for (let i = 0; i <= portalHeight; i++) {
      world.setBlock(`${startX-1},${startY+i-1},${startZ-1}`, { type: 'obsidian' });
    }
    
    // Right/back pillar
    const endX = orientation === 'x' ? startX + portalWidth + 1 : startX;
    const endZ = orientation === 'z' ? startZ + portalWidth + 1 : startZ;
    for (let i = 0; i <= portalHeight; i++) {
      world.setBlock(`${endX-1},${startY+i-1},${endZ-1}`, { type: 'obsidian' });
    }
    
    // Fill the portal blocks
    for (let i = 0; i < portalWidth; i++) {
      for (let j = 0; j < portalHeight; j++) {
        const px = orientation === 'x' ? startX + i : startX;
        const pz = orientation === 'z' ? startZ + i : startZ;
        const py = startY + j;
        
        world.setBlock(`${px},${py},${pz}`, { 
          type: 'nether_portal',
          orientation 
        });
      }
    }
  }
  
  /**
   * Link two portals together
   * @param {Object} portalA - First portal data
   * @param {Object} portalB - Second portal data
   */
  linkPortals(portalA, portalB) {
    const keyA = `${portalA.dimension}:${portalA.position.x},${portalA.position.y},${portalA.position.z}:${portalA.orientation}`;
    const keyB = `${portalB.dimension}:${portalB.position.x},${portalB.position.y},${portalB.position.z}:${portalB.orientation}`;
    
    // Update portal data with link information
    portalA.linkedPortalKey = keyB;
    portalB.linkedPortalKey = keyA;
    
    // Update the portals in the map
    this.portals.set(keyA, portalA);
    this.portals.set(keyB, portalB);
  }
  
  /**
   * Handle entity entering a portal
   * @param {Object} data - Entity and portal data
   */
  handleEntityEnterPortal(data) {
    const { entity, portalPosition, dimension, portalType } = data;
    
    // Only handle nether portals
    if (portalType !== 'nether_portal') return;
    
    // Find the portal based on position
    const portal = this.findPortalAt(dimension, portalPosition);
    if (!portal) return;
    
    // Check if we already have a pending teleport for this entity
    if (this.pendingTeleports.has(entity.id)) return;
    
    // Add to pending teleports with a delay
    this.pendingTeleports.set(entity.id, {
      entity,
      sourcePortal: portal,
      startTime: Date.now(),
      delayMs: 4000, // 4 seconds in portal before teleporting
      completionCallback: () => {
        // Teleport the entity
        this.teleportEntity(entity, portal);
      }
    });
  }
  
  /**
   * Find a portal at a specific position
   * @param {String} dimension - The dimension to search in
   * @param {Object} position - The position to search at
   * @returns {Object|null} The portal data if found, or null
   */
  findPortalAt(dimension, position) {
    const { x, y, z } = position;
    
    for (const portal of this.portals.values()) {
      if (portal.dimension !== dimension) continue;
      
      const { position: portalPos, width, height, orientation } = portal;
      
      // Check if the position is within the portal bounds
      if (orientation === 'x') {
        if (x >= portalPos.x - width/2 && x <= portalPos.x + width/2 &&
            y >= portalPos.y && y <= portalPos.y + height &&
            z >= portalPos.z - 1 && z <= portalPos.z + 1) {
          return portal;
        }
      } else { // orientation === 'z'
        if (x >= portalPos.x - 1 && x <= portalPos.x + 1 &&
            y >= portalPos.y && y <= portalPos.y + height &&
            z >= portalPos.z - width/2 && z <= portalPos.z + width/2) {
          return portal;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Process pending teleports
   */
  processPendingTeleports() {
    const now = Date.now();
    const toRemove = [];
    
    for (const [entityId, teleportData] of this.pendingTeleports.entries()) {
      const { entity, startTime, delayMs, completionCallback } = teleportData;
      
      // Check if the entity is still in the game
      if (!entity || !entity.isActive) {
        toRemove.push(entityId);
        continue;
      }
      
      // Check if the entity is still in a portal
      if (!entity.isInPortal) {
        toRemove.push(entityId);
        continue;
      }
      
      // Check if the delay has elapsed
      if (now - startTime >= delayMs) {
        completionCallback();
        toRemove.push(entityId);
      }
    }
    
    // Remove completed teleports
    for (const entityId of toRemove) {
      this.pendingTeleports.delete(entityId);
    }
  }
  
  /**
   * Teleport an entity to the linked dimension
   * @param {Object} entity - The entity to teleport
   * @param {Object} sourcePortal - The source portal
   */
  teleportEntity(entity, sourcePortal) {
    // Get the linked portal
    const linkedPortalKey = sourcePortal.linkedPortalKey;
    if (!linkedPortalKey) {
      console.warn(`Portal has no linked portal: ${sourcePortal.dimension}:${sourcePortal.position.x},${sourcePortal.position.y},${sourcePortal.position.z}`);
      return;
    }
    
    const targetPortal = this.portals.get(linkedPortalKey);
    if (!targetPortal) {
      console.warn(`Linked portal not found: ${linkedPortalKey}`);
      return;
    }
    
    // Get the target world
    const targetWorld = this.dimensions.get(targetPortal.dimension);
    if (!targetWorld) {
      console.warn(`Target dimension not loaded: ${targetPortal.dimension}`);
      return;
    }
    
    // Calculate target position
    const { position: targetPos, orientation } = targetPortal;
    
    // Adjust position to be in front of the portal based on orientation
    let targetX = targetPos.x;
    let targetY = targetPos.y;
    let targetZ = targetPos.z;
    
    // Add a small offset in front of the portal
    if (orientation === 'x') {
      targetZ += 1;  // Step out in front of Z-facing portal
    } else {
      targetX += 1;  // Step out in front of X-facing portal
    }
    
    // Trigger the teleport
    entity.teleport({
      dimension: targetPortal.dimension,
      position: { x: targetX, y: targetY, z: targetZ },
      preserveMomentum: true
    });
    
    // Emit event for the teleport
    this.emit('entityTeleported', {
      entity,
      sourceDimension: sourcePortal.dimension,
      targetDimension: targetPortal.dimension,
      sourcePosition: entity.position,
      targetPosition: { x: targetX, y: targetY, z: targetZ }
    });
    
    // Play teleport sound
    targetWorld.playSound({
      name: 'portal_travel',
      position: { x: targetX, y: targetY, z: targetZ },
      volume: 1.0,
      pitch: 1.0,
      radius: 32
    });
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    this.pendingTeleports.clear();
  }
}

module.exports = DimensionManager; 