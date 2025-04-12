/**
 * PortalManager - Handles creation, validation, and activation of nether portals
 */

const { EventEmitter } = require('events');

class PortalManager extends EventEmitter {
  /**
   * Create a new portal manager
   * @param {Object} server - Server instance
   */
  constructor(server) {
    super();
    this.server = server;
    this.activationCooldowns = new Map();
    this.pendingPortals = new Map();
    this.minPortalWidth = 2;
    this.minPortalHeight = 3;
    this.maxPortalWidth = 21;
    this.maxPortalHeight = 21;
  }
  
  /**
   * Initialize the portal manager
   */
  init() {
    // Listen for block placements that might trigger portal activation
    this.server.on('blockPlaced', this.handleBlockPlaced.bind(this));
    
    // Listen for fire blocks being placed that might activate portals
    this.server.on('fireCreated', this.handleFireCreated.bind(this));
  }
  
  /**
   * Handle block placed event
   * @param {Object} data - Block placement data
   */
  handleBlockPlaced(data) {
    const { world, position, blockType } = data;
    
    // If obsidian was placed, check if it completes a portal frame
    if (blockType === 'obsidian') {
      this.checkForPortalFrame(world, position);
    }
  }
  
  /**
   * Handle fire created event
   * @param {Object} data - Fire creation data
   */
  handleFireCreated(data) {
    const { world, position } = data;
    
    // When fire is created, check if it's inside a valid portal frame
    this.tryActivatePortal(world, position);
  }
  
  /**
   * Check if the obsidian block completes a portal frame
   * @param {Object} world - World instance
   * @param {Object} position - Position of placed obsidian
   */
  checkForPortalFrame(world, position) {
    // Check if we've recently checked this area
    const posKey = `${position.x},${position.y},${position.z}`;
    if (this.activationCooldowns.has(posKey)) {
      if (Date.now() - this.activationCooldowns.get(posKey) < 1000) {
        return;
      }
    }
    
    // Update cooldown
    this.activationCooldowns.set(posKey, Date.now());
    
    // Look for potential portal frames in X and Z directions
    this.findPortalFrame(world, position, 'x');
    this.findPortalFrame(world, position, 'z');
  }
  
  /**
   * Find a portal frame in a specific orientation
   * @param {Object} world - World instance
   * @param {Object} position - Position to start search from
   * @param {String} orientation - Portal orientation ('x' or 'z')
   * @returns {Object|null} Portal frame data or null if no valid frame
   */
  findPortalFrame(world, position, orientation) {
    const { x, y, z } = position;
    
    // Directions to search for obsidian
    const directions = orientation === 'x' 
      ? [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0]] // X orientation: left, right, down, up
      : [[0, 0, -1], [0, 0, 1], [0, -1, 0], [0, 1, 0]]; // Z orientation: front, back, down, up
    
    // Try to find the bottom-left (or bottom-front) corner of the portal frame
    let startX = x;
    let startY = y;
    let startZ = z;
    
    // Find the start position by moving left/down/front as far as possible along obsidian
    let foundObsidian = true;
    while (foundObsidian) {
      foundObsidian = false;
      
      for (const [dx, dy, dz] of directions) {
        // Only move in one direction at a time, prioritizing downward
        if (dy === -1) {
          const blockType = world.getBlockType(`${startX},${startY + dy},${startZ}`);
          if (blockType === 'obsidian') {
            startY += dy;
            foundObsidian = true;
            break;
          }
        }
      }
      
      if (!foundObsidian) {
        for (const [dx, dy, dz] of directions) {
          // After checking downward, check left or front
          if ((orientation === 'x' && dx === -1) || (orientation === 'z' && dz === -1)) {
            const blockType = world.getBlockType(`${startX + dx},${startY},${startZ + dz}`);
            if (blockType === 'obsidian') {
              startX += dx;
              startZ += dz;
              foundObsidian = true;
              break;
            }
          }
        }
      }
    }
    
    // Now find the width and height of the potential portal
    let width = 0;
    let height = 0;
    
    // Find width by moving right/back until we hit obsidian
    if (orientation === 'x') {
      // Moving right (x+)
      while (world.getBlockType(`${startX + width + 1},${startY},${startZ}`) === 'obsidian') {
        width++;
      }
    } else {
      // Moving back (z+)
      while (world.getBlockType(`${startX},${startY},${startZ + width + 1}`) === 'obsidian') {
        width++;
      }
    }
    
    // Find height by moving up until we hit obsidian
    while (world.getBlockType(`${startX},${startY + height + 1},${startZ}`) === 'obsidian') {
      height++;
    }
    
    // Validate the portal dimensions
    if (width < this.minPortalWidth || height < this.minPortalHeight || 
        width > this.maxPortalWidth || height > this.maxPortalHeight) {
      return null;
    }
    
    // Now validate the entire frame
    const frame = {
      startX,
      startY,
      startZ,
      width,
      height,
      orientation,
      dimension: world.dimensionId || 'overworld'
    };
    
    if (this.validatePortalFrame(world, frame)) {
      // Store this as a pending portal that needs activation
      const frameKey = `${startX},${startY},${startZ},${orientation}`;
      this.pendingPortals.set(frameKey, frame);
      return frame;
    }
    
    return null;
  }
  
  /**
   * Validate that a portal frame is complete
   * @param {Object} world - World instance
   * @param {Object} frame - Portal frame data
   * @returns {Boolean} True if frame is valid
   */
  validatePortalFrame(world, frame) {
    const { startX, startY, startZ, width, height, orientation } = frame;
    
    // Check bottom and top borders
    for (let i = 0; i <= width; i++) {
      const x = orientation === 'x' ? startX + i : startX;
      const z = orientation === 'z' ? startZ + i : startZ;
      
      // Check bottom border
      if (world.getBlockType(`${x},${startY},${z}`) !== 'obsidian') {
        return false;
      }
      
      // Check top border
      if (world.getBlockType(`${x},${startY + height},${z}`) !== 'obsidian') {
        return false;
      }
    }
    
    // Check left and right borders
    for (let i = 0; i <= height; i++) {
      const x1 = startX;
      const x2 = orientation === 'x' ? startX + width : startX;
      const z1 = startZ;
      const z2 = orientation === 'z' ? startZ + width : startZ;
      const y = startY + i;
      
      // Check left/front border
      if (world.getBlockType(`${x1},${y},${z1}`) !== 'obsidian') {
        return false;
      }
      
      // Check right/back border
      if (world.getBlockType(`${x2},${y},${z2}`) !== 'obsidian') {
        return false;
      }
    }
    
    // Check that the interior is empty
    for (let i = 1; i < width; i++) {
      for (let j = 1; j < height; j++) {
        const x = orientation === 'x' ? startX + i : startX;
        const z = orientation === 'z' ? startZ + i : startZ;
        const y = startY + j;
        
        const blockType = world.getBlockType(`${x},${y},${z}`);
        if (blockType !== 'air' && blockType !== 'fire') {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Try to activate a portal using fire
   * @param {Object} world - World instance
   * @param {Object} position - Fire position
   */
  tryActivatePortal(world, position) {
    const { x, y, z } = position;
    
    // Check if fire is inside a pending portal frame
    for (const [frameKey, frame] of this.pendingPortals.entries()) {
      const { startX, startY, startZ, width, height, orientation } = frame;
      
      // Check if fire is inside the frame
      if (orientation === 'x') {
        if (x > startX && x < startX + width && 
            y > startY && y < startY + height && 
            z === startZ) {
          this.activatePortal(world, frame);
          this.pendingPortals.delete(frameKey);
          return;
        }
      } else { // orientation === 'z'
        if (x === startX && 
            y > startY && y < startY + height && 
            z > startZ && z < startZ + width) {
          this.activatePortal(world, frame);
          this.pendingPortals.delete(frameKey);
          return;
        }
      }
    }
  }
  
  /**
   * Activate a portal by filling it with portal blocks
   * @param {Object} world - World instance
   * @param {Object} frame - Portal frame data
   */
  activatePortal(world, frame) {
    const { startX, startY, startZ, width, height, orientation, dimension } = frame;
    
    // Fill the interior with portal blocks
    for (let i = 1; i < width; i++) {
      for (let j = 1; j < height; j++) {
        const x = orientation === 'x' ? startX + i : startX;
        const z = orientation === 'z' ? startZ + i : startZ;
        const y = startY + j;
        
        // Set block to nether portal with correct orientation
        world.setBlock(`${x},${y},${z}`, { 
          type: 'nether_portal',
          orientation
        });
      }
    }
    
    // Calculate the center of the portal
    const centerX = startX + width / 2;
    const centerY = startY + height / 2;
    const centerZ = startZ + width / 2;
    
    // Create portal data
    const portalData = {
      dimension,
      targetDimension: dimension === 'overworld' ? 'nether' : 'overworld',
      orientation,
      position: { 
        x: Math.floor(centerX), 
        y: Math.floor(centerY), 
        z: Math.floor(centerZ) 
      },
      width,
      height
    };
    
    // Emit portal created event for the dimension manager
    this.emit('portalCreated', portalData);
    
    // If server has a dimension manager, register the portal
    if (this.server.dimensionManager) {
      this.server.dimensionManager.registerPortal(portalData);
    }
    
    // Play portal activation sound
    world.playSound({
      name: 'portal_trigger',
      position: portalData.position,
      volume: 1.0,
      pitch: 1.0,
      radius: 32
    });
  }
  
  /**
   * Cleanup old portal data
   */
  cleanup() {
    // Remove old cooldowns
    const now = Date.now();
    for (const [key, time] of this.activationCooldowns.entries()) {
      if (now - time > 10000) { // 10 seconds
        this.activationCooldowns.delete(key);
      }
    }
    
    // Clear very old pending portals
    for (const [key, frame] of this.pendingPortals.entries()) {
      if (!frame.timestamp) {
        frame.timestamp = now;
      } else if (now - frame.timestamp > 300000) { // 5 minutes
        this.pendingPortals.delete(key);
      }
    }
  }
}

module.exports = PortalManager; 