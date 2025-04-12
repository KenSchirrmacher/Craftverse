/**
 * EndPortalFrameBlock - Represents an End Portal Frame block
 * Used to build End Portals when arranged in a specific pattern with Eyes of Ender
 */

class EndPortalFrameBlock {
  /**
   * Creates a new End Portal Frame block
   * @param {Object} options - Block options
   * @param {Boolean} options.hasEye - Whether this frame has an Eye of Ender
   * @param {Number} options.facing - Direction the frame is facing (0-3)
   * @param {Object} options.server - Server instance
   */
  constructor(options = {}) {
    this.type = 'end_portal_frame';
    this.hasEye = options.hasEye || false;
    this.facing = options.facing !== undefined ? options.facing : 0;
    this.server = options.server;
    this.solid = true;
    this.transparent = false;
    this.hardness = 3.0;
    this.blastResistance = 18.0;
    this.requiresTool = true;
    this.toolType = 'pickaxe';
    this.minToolLevel = 'stone';
  }
  
  /**
   * Handle interaction with the frame
   * @param {Object} player - Player interacting with the frame
   * @param {Object} position - Block position
   * @param {Object} world - World instance
   * @param {String} hand - Hand used (main or off)
   * @returns {Boolean} Whether the interaction was successful
   */
  onInteract(player, position, world, hand = 'main') {
    if (!player || !world) return false;
    
    // Get the item in the player's hand
    const heldItem = player.getHeldItem(hand);
    
    // If already has an eye, ignore interaction
    if (this.hasEye) return false;
    
    // Check if player is holding an Eye of Ender
    if (heldItem && heldItem.type === 'ender_eye') {
      // Add eye to the frame
      this.hasEye = true;
      
      // Consume the eye of ender
      if (!player.creative) {
        player.inventory.removeItemFromHand(hand, 1);
      }
      
      // Update block state
      world.setBlock(position, this);
      
      // Play place sound
      if (this.server) {
        this.server.emit('playSound', {
          name: 'block.end_portal_frame.fill',
          position,
          volume: 1.0,
          pitch: 1.0,
          dimension: world.dimension
        });
      }
      
      // Check if this completes a portal
      this.checkPortalCompletion(position, world);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if a portal has been completed and activate it if so
   * @param {Object} position - Frame position
   * @param {Object} world - World instance
   */
  checkPortalCompletion(position, world) {
    if (!world) return;
    
    // Portal requires a 3x3 square with frames on the perimeter (12 frames total)
    // Each frame must have an eye of ender and be properly oriented
    
    // First, find the bottom-left corner of the potential portal
    let portalCorner = this.findPortalCorner(position, world);
    if (!portalCorner) return;
    
    // Check if all frames are present and have eyes
    if (this.validatePortalFrames(portalCorner, world)) {
      // Create portal blocks in the 3x3 inner area
      this.createPortal(portalCorner, world);
    }
  }
  
  /**
   * Find the corner of a potential portal based on a frame block position
   * @param {Object} position - A frame position
   * @param {Object} world - World instance
   * @returns {Object|null} Portal corner position or null if not found
   */
  findPortalCorner(position, world) {
    // Try to find the bottom-left corner of the potential portal
    // Need to check in all four directions since we don't know which corner this frame is
    
    const directions = [
      { x: -1, z: -1 }, // Northwest
      { x: 2, z: -1 },  // Northeast
      { x: -1, z: 2 },  // Southwest
      { x: 2, z: 2 }    // Southeast
    ];
    
    for (const dir of directions) {
      const cornerX = position.x - dir.x;
      const cornerZ = position.z - dir.z;
      
      // Check if this corner works
      const testCorner = { x: cornerX, y: position.y, z: cornerZ };
      if (this.isValidPortalCorner(testCorner, world)) {
        return testCorner;
      }
    }
    
    return null;
  }
  
  /**
   * Check if a position is a valid portal corner
   * @param {Object} corner - Corner position to check
   * @param {Object} world - World instance
   * @returns {Boolean} Whether this is a valid portal corner
   */
  isValidPortalCorner(corner, world) {
    // A valid corner has frame blocks at all required positions
    // For a portal, we need frames in a 3x3 square perimeter
    
    for (let x = 0; x < 3; x++) {
      for (let z = 0; z < 3; z++) {
        // Skip the inner part
        if (x > 0 && x < 2 && z > 0 && z < 2) continue;
        
        const pos = {
          x: corner.x + x,
          y: corner.y,
          z: corner.z + z
        };
        
        const block = world.getBlock(pos);
        
        // If any perimeter position doesn't have a frame block, this isn't a valid corner
        if (!block || block.type !== 'end_portal_frame') {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Validate that all portal frames have eyes and proper orientation
   * @param {Object} corner - Corner position of the portal
   * @param {Object} world - World instance
   * @returns {Boolean} Whether all frames are valid
   */
  validatePortalFrames(corner, world) {
    const expectedFacings = {
      // North side frames facing north (0)
      '0,0': 0, '1,0': 0, '2,0': 0,
      // East side frames facing east (1)
      '2,0': 1, '2,1': 1, '2,2': 1,
      // South side frames facing south (2)
      '0,2': 2, '1,2': 2, '2,2': 2,
      // West side frames facing west (3)
      '0,0': 3, '0,1': 3, '0,2': 3
    };
    
    for (let x = 0; x < 3; x++) {
      for (let z = 0; z < 3; z++) {
        // Skip the inner part
        if (x > 0 && x < 2 && z > 0 && z < 2) continue;
        
        const pos = {
          x: corner.x + x,
          y: corner.y,
          z: corner.z + z
        };
        
        const block = world.getBlock(pos);
        
        // Check if block is a frame and has an eye
        if (!block || block.type !== 'end_portal_frame' || !block.hasEye) {
          return false;
        }
        
        // Optionally check orientation (can be omitted for simplicity)
        // const expectedFacing = expectedFacings[`${x},${z}`];
        // if (block.facing !== expectedFacing) {
        //   return false;
        // }
      }
    }
    
    return true;
  }
  
  /**
   * Create portal blocks in the center of a completed frame
   * @param {Object} corner - Corner position of the portal
   * @param {Object} world - World instance
   */
  createPortal(corner, world) {
    // Create portal blocks in the inner 2x2 area
    for (let x = 1; x < 2; x++) {
      for (let z = 1; z < 2; z++) {
        const pos = {
          x: corner.x + x,
          y: corner.y,
          z: corner.z + z
        };
        
        // Create portal block
        const EndPortalBlock = require('./endPortalBlock');
        const portalBlock = new EndPortalBlock({
          dimension: world.dimension,
          targetDimension: 'end',
          server: this.server
        });
        
        world.setBlock(pos, portalBlock);
      }
    }
    
    // Play activation sound
    if (this.server) {
      this.server.emit('playSound', {
        name: 'block.end_portal.spawn',
        position: {
          x: corner.x + 1,
          y: corner.y,
          z: corner.z + 1
        },
        volume: 1.0,
        pitch: 1.0,
        dimension: world.dimension
      });
      
      // Notify clients about portal activation
      this.server.emit('portalActivated', {
        type: 'end_portal',
        position: {
          x: corner.x + 1,
          y: corner.y,
          z: corner.z + 1
        },
        dimension: world.dimension
      });
    }
  }
  
  /**
   * Get the state of the block for client rendering
   * @returns {Object} Block state data
   */
  getState() {
    return {
      type: this.type,
      hasEye: this.hasEye,
      facing: this.facing
    };
  }
  
  /**
   * Serializes the frame block
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      type: this.type,
      hasEye: this.hasEye,
      facing: this.facing
    };
  }
  
  /**
   * Creates an End Portal Frame block from serialized data
   * @param {Object} data - Serialized data
   * @param {Object} server - Server instance
   * @returns {EndPortalFrameBlock} New End Portal Frame block
   */
  static deserialize(data, server) {
    return new EndPortalFrameBlock({
      hasEye: data.hasEye,
      facing: data.facing,
      server
    });
  }
}

module.exports = EndPortalFrameBlock; 