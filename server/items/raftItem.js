/**
 * RaftItem - Base class for raft items
 * Part of the 1.20 Update
 */
const BoatItem = require('./boatItem');

class RaftItem extends BoatItem {
  /**
   * Create a new raft item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    // Whether this is a raft with chest
    const hasChest = options.hasChest || false;
    const woodType = options.woodType || 'oak';

    // Generate the correct item ID and name
    const itemId = hasChest ? `${woodType}_chest_raft` : `${woodType}_raft`;
    const displayName = `${capitalizeFirstLetter(woodType)} ${hasChest ? 'Chest ' : ''}Raft`;
    
    super({
      id: options.id || itemId,
      name: options.name || displayName,
      stackable: true,
      maxStackSize: 1,
      type: 'tool',
      subtype: 'raft',
      category: 'transportation',
      ...options
    });
    
    // Set raft-specific properties
    this.isRaft = true;
    this.description = options.description || `A ${woodType} raft for water travel${hasChest ? ' with storage' : ''}`;
    this.speed = options.speed || 0.08; // Slower than boats
    this.maxHealth = options.maxHealth || 60; // More durability than boats
  }
  
  /**
   * Use the raft item to place a raft in the world
   * @param {Object} player - Player using the item
   * @param {Object} context - Use context (contains targetBlock, face, etc.)
   * @returns {boolean} Whether placement was successful
   */
  use(player, context) {
    if (!player || !context || !context.world) {
      return false;
    }
    
    // Find water position (using parent method)
    let targetPos = findWaterPosition(player, context);
    if (!targetPos) {
      return false; // No valid water position found
    }
    
    // Create the raft entity
    const entityFactory = require('../entities/entityFactory');
    const raft = entityFactory(this.hasChest ? `${this.woodType}_chest_raft` : `${this.woodType}_raft`, null, {
      world: context.world,
      position: targetPos,
      woodType: this.woodType,
      hasChest: this.hasChest,
      isRaft: true,
      speed: this.speed,
      maxHealth: this.maxHealth
    });
    
    // Add raft to world
    if (context.world.addEntity) {
      context.world.addEntity(raft);
      
      // Emit raft placed event
      if (player.emit) {
        player.emit('placed_raft', {
          playerId: player.id,
          position: targetPos,
          raftId: raft.id,
          woodType: this.woodType,
          hasChest: this.hasChest 
        });
      }
      
      // Remove one raft item from inventory
      return true; // Signal to reduce item count
    }
    
    return false;
  }
  
  /**
   * Get detailed description of the raft
   * @returns {string} Raft description
   */
  getDescription() {
    let desc = this.description;
    
    // Add details about raft properties
    desc += ` Made from ${this.woodType} wood.`;
    
    if (this.hasChest) {
      desc += ' Includes a chest for storage.';
    }
    
    desc += ' Can carry up to two players.';
    
    return desc;
  }
  
  /**
   * Serialize raft item
   * @returns {Object} Serialized data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      isRaft: true,
      speed: this.speed,
      maxHealth: this.maxHealth
    };
  }
  
  /**
   * Create raft item from serialized data
   * @param {Object} data - Serialized data
   * @returns {RaftItem} Item instance
   */
  static fromJSON(data) {
    return new RaftItem({
      id: data.id,
      name: data.name,
      woodType: data.woodType || 'oak',
      hasChest: data.hasChest || false,
      isRaft: true,
      speed: data.speed,
      maxHealth: data.maxHealth,
      data: data.data
    });
  }
}

/**
 * Find a valid water position for raft placement
 * @param {Object} player - Player placing the raft
 * @param {Object} context - Use context
 * @returns {Object|null} Water position or null if none found
 */
function findWaterPosition(player, context) {
  // Check if there is water at or near the target position
  let targetPos = null;
  
  if (context.targetBlock) {
    const { position, face } = context.targetBlock;
    
    // Calculate target position based on the clicked face
    const offsetX = face === 'west' ? -1 : (face === 'east' ? 1 : 0);
    const offsetY = face === 'bottom' ? -1 : (face === 'top' ? 1 : 0);
    const offsetZ = face === 'north' ? -1 : (face === 'south' ? 1 : 0);
    
    targetPos = {
      x: position.x + offsetX,
      y: position.y + offsetY,
      z: position.z + offsetZ
    };
    
    // Check if water is at or one block below the target position
    const waterAtTarget = isWater(context.world, targetPos);
    const waterBelow = isWater(context.world, {
      x: targetPos.x,
      y: targetPos.y - 1,
      z: targetPos.z 
    });
    
    if (!waterAtTarget && !waterBelow) {
      // No water found, can't place raft
      return null;
    }
    
    // If water is one block below, adjust target position
    if (!waterAtTarget && waterBelow) {
      targetPos.y -= 1;
    }
  } else {
    // Player clicked in the air, use raycast to find water
    const waterPos = findWaterInFront(player, context.world);
    if (!waterPos) {
      return null; // No water found in front of player
    }
    
    targetPos = waterPos;
  }
  
  return targetPos;
}

/**
 * Check if water is at the given position
 * @param {Object} world - Game world
 * @param {Object} position - Position to check
 * @returns {boolean} Whether water is at the position
 */
function isWater(world, position) {
  if (!world || !world.getBlock) return false;
  
  const block = world.getBlock(
    Math.floor(position.x),
    Math.floor(position.y),
    Math.floor(position.z)
  );
  
  return block && block.material === 'water';
}

/**
 * Find water in front of the player using raycast
 * @param {Object} player - Player entity
 * @param {Object} world - Game world
 * @param {number} maxDistance - Maximum distance to check
 * @returns {Object|null} Water position or null if none found
 */
function findWaterInFront(player, world, maxDistance = 5) {
  if (!player || !world || !world.getBlock) return null;
  
  const { position, rotation } = player;
  const startX = position.x;
  const startY = position.y + 1.6; // Eye level
  const startZ = position.z;
  
  // Convert rotation to radians
  const yaw = rotation.y * (Math.PI / 180);
  const pitch = rotation.x * (Math.PI / 180);
  
  // Calculate direction vector
  const dirX = -Math.sin(yaw) * Math.cos(pitch);
  const dirY = -Math.sin(pitch);
  const dirZ = Math.cos(yaw) * Math.cos(pitch);
  
  // Normalize direction
  const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
  const normDirX = dirX / length;
  const normDirY = dirY / length;
  const normDirZ = dirZ / length;
  
  // Raycast with small steps
  const step = 0.2;
  for (let dist = 0; dist <= maxDistance; dist += step) {
    const x = startX + normDirX * dist;
    const y = startY + normDirY * dist;
    const z = startZ + normDirZ * dist;
    
    // Check if the current position contains water
    if (isWater(world, { x, y, z })) {
      return { x, y, z };
    }
  }
  
  return null;
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - Input string
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = RaftItem; 