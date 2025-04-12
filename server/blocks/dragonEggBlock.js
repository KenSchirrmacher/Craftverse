/**
 * DragonEggBlock - Represents a Dragon Egg block with teleportation properties
 */

class DragonEggBlock {
  /**
   * Creates a new Dragon Egg block
   * @param {Object} options - Block options
   * @param {Object} options.server - Server instance
   */
  constructor(options = {}) {
    this.type = 'dragon_egg';
    this.server = options.server;
    this.solid = true;
    this.transparent = false;
    this.hardness = 3.0;
    this.blastResistance = 9.0;
    this.requiresTool = true;
    this.toolType = 'pickaxe';
    this.minToolLevel = 'wood';
    this.lightLevel = 1;
    this.gravity = true;
    
    // Last teleport time to prevent spam
    this.lastTeleport = 0;
  }
  
  /**
   * Handle interaction with the egg
   * @param {Object} player - Player interacting with the egg
   * @param {Object} position - Block position
   * @param {Object} world - World instance
   * @param {String} hand - Hand used (main or off)
   * @returns {Boolean} Whether the interaction was successful
   */
  onInteract(player, position, world, hand = 'main') {
    if (!world) return false;
    
    // Teleport the egg when interacted with
    this.teleport(position, world);
    
    return true;
  }
  
  /**
   * Handle block being damaged/mined
   * @param {Object} player - Player mining the block
   * @param {Object} position - Block position
   * @param {Object} world - World instance
   * @returns {Boolean} Whether mining was successful
   */
  onMine(player, position, world) {
    if (!world) return false;
    
    // Creative mode players can mine it
    if (player && player.gameMode === 'creative') {
      // Remove the block
      world.removeBlock(position);
      
      // Add to player inventory if not in creative
      if (player.inventory && player.gameMode !== 'creative') {
        player.inventory.addItem({ type: 'dragon_egg', count: 1 });
      }
      
      return true;
    }
    
    // Survival mode players cause it to teleport
    this.teleport(position, world);
    
    return false;
  }
  
  /**
   * Teleport the egg to a nearby position
   * @param {Object} position - Current position
   * @param {Object} world - World instance
   * @returns {Boolean} Whether the teleport was successful
   */
  teleport(position, world) {
    if (!world) return false;
    
    // Check teleport cooldown
    const now = Date.now();
    if (now - this.lastTeleport < 2000) return false;
    this.lastTeleport = now;
    
    // Remove the egg from its current position
    world.removeBlock(position);
    
    // Find a new position within 8 blocks
    const maxDistance = 8;
    let newPosition = null;
    
    // Try up to 10 times to find a valid position
    for (let attempt = 0; attempt < 10; attempt++) {
      const dx = Math.floor(Math.random() * (maxDistance * 2 + 1)) - maxDistance;
      const dy = Math.floor(Math.random() * 3) - 1; // Slight vertical movement
      const dz = Math.floor(Math.random() * (maxDistance * 2 + 1)) - maxDistance;
      
      const testPos = {
        x: position.x + dx,
        y: position.y + dy,
        z: position.z + dz
      };
      
      // Check if there's air above the target position 
      // and a solid block below to place the egg on
      const abovePos = { ...testPos, y: testPos.y + 1 };
      const belowPos = { ...testPos, y: testPos.y - 1 };
      
      const blockAbove = world.getBlock(abovePos);
      const blockAt = world.getBlock(testPos);
      const blockBelow = world.getBlock(belowPos);
      
      if (
        (!blockAt || !blockAt.solid) &&
        (!blockAbove || !blockAbove.solid) &&
        (blockBelow && blockBelow.solid)
      ) {
        newPosition = testPos;
        break;
      }
    }
    
    // If we found a valid position, place the egg there
    if (newPosition) {
      world.setBlock(newPosition, this);
      
      // Play teleport sound
      if (this.server) {
        this.server.emit('playSound', {
          name: 'entity.enderman.teleport',
          position,
          volume: 1.0,
          pitch: 0.8,
          dimension: world.dimension
        });
        
        // Also play sound at destination
        this.server.emit('playSound', {
          name: 'entity.enderman.teleport',
          position: newPosition,
          volume: 1.0,
          pitch: 0.8,
          dimension: world.dimension
        });
        
        // Visual effect
        this.server.emit('particleEffect', {
          type: 'portal',
          position,
          count: 40,
          spread: { x: 0.5, y: 0.5, z: 0.5 },
          dimension: world.dimension
        });
        
        this.server.emit('particleEffect', {
          type: 'portal',
          position: newPosition,
          count: 40,
          spread: { x: 0.5, y: 0.5, z: 0.5 },
          dimension: world.dimension
        });
      }
      
      return true;
    }
    
    // If we couldn't find a valid position, place it back
    world.setBlock(position, this);
    return false;
  }
  
  /**
   * Check if the block should fall due to gravity
   * @param {Object} position - Block position
   * @param {Object} world - World instance
   * @returns {Boolean} Whether the block should fall
   */
  checkFall(position, world) {
    if (!world || !this.gravity) return false;
    
    // Check if there's a solid block below
    const belowPos = { ...position, y: position.y - 1 };
    const blockBelow = world.getBlock(belowPos);
    
    // Fall if no solid block below
    if (!blockBelow || !blockBelow.solid) {
      // Remove from current position
      world.removeBlock(position);
      
      // Place at new position or create a falling block entity
      if (world.createFallingBlock) {
        world.createFallingBlock(position, this);
      } else {
        // Simple implementation: just move down
        world.setBlock(belowPos, this);
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
      solid: this.solid,
      transparent: this.transparent,
      lightLevel: this.lightLevel
    };
  }
  
  /**
   * Serializes the dragon egg block
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      type: this.type
    };
  }
  
  /**
   * Creates a Dragon Egg block from serialized data
   * @param {Object} data - Serialized data
   * @param {Object} server - Server instance
   * @returns {DragonEggBlock} New Dragon Egg block
   */
  static deserialize(data, server) {
    return new DragonEggBlock({
      server
    });
  }
}

module.exports = DragonEggBlock; 