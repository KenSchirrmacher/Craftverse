/**
 * Allay mob implementation for the Wild Update
 * Features:
 * - Flying movement
 * - Item collection behavior
 * - Note block attraction
 * - Dancing to music
 * - Following players who give it items
 */

const MobBase = require('./mobBase');
const { getRandomInt, distance } = require('../utils/mathUtils');

/**
 * Allay class - a friendly flying mob that collects items
 */
class Allay extends MobBase {
  /**
   * Create a new Allay
   * @param {Object} position - Initial position
   * @param {Object} options - Additional options
   */
  constructor(position, options = {}) {
    super('allay', position, 20, 0); // Allays don't deal damage
    
    // Allay-specific properties
    this.flying = true;
    this.heldItem = options.heldItem || null;
    this.homeNoteBlock = options.homeNoteBlock || null; // Position of note block it likes
    this.followingPlayer = options.followingPlayer || null;
    this.collectingItems = false;
    this.dancingTimer = 0;
    this.isDancing = false;
    this.noteBlockTimer = 0;
    this.canDuplicate = options.canDuplicate !== undefined ? options.canDuplicate : true;
    this.duplicateCooldown = options.duplicateCooldown || 0;
    this.maxDuplicateCooldown = 300 * 20; // 5 minutes (300 seconds at 20 ticks/second)
    
    // Movement properties
    this.flyHeight = options.flyHeight || 1.5; // Preferred height above ground
    this.moveSpeed = 0.6;
    this.hoverOffset = 0;
    this.hoverDirection = 1;
    this.searchRadius = 32; // Radius to search for items
    this.minPlayerFollowDistance = 2;
    this.maxPlayerFollowDistance = 16;
    
    // AI state
    this.state = options.state || 'idle'; // idle, following, collecting, returning, dancing
    this.stateTimer = 0;
    this.targetItem = null;
    this.targetPosition = null;
    
    // Set size for collision
    this.width = 0.6;
    this.height = 0.6;
    
    // Initialize velocity
    this.velocity = { x: 0, y: 0, z: 0 };
    
    // Add mock emitEvent function for testing if needed
    if (!this.emitEvent) {
      this.emitEvent = (eventName, data) => {
        console.log(`Mock event: ${eventName}`, data);
      };
    }
  }
  
  /**
   * Update allay's state
   * @param {Object} world - The game world
   * @param {Object} players - All players
   * @param {Object} mobs - All mobs
   * @param {number} deltaTime - Time since last update in ticks
   */
  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);
    
    if (this.dead) return null;
    
    // Update timers
    this.stateTimer += deltaTime;
    this.updateHoverAnimation(deltaTime);
    
    // Update duplication cooldown
    if (this.duplicateCooldown > 0) {
      this.duplicateCooldown -= deltaTime;
      if (this.duplicateCooldown < 0) {
        this.duplicateCooldown = 0;
        this.canDuplicate = true;
      }
    }
    
    // Check for note block sounds
    if (this.noteBlockTimer > 0) {
      this.noteBlockTimer -= deltaTime;
    }
    
    // Update dancing state
    if (this.isDancing) {
      this.dancingTimer += deltaTime;
      
      // Dance for 6 seconds (120 ticks)
      if (this.dancingTimer >= 120) {
        this.isDancing = false;
        this.dancingTimer = 0;
        
        // If a note block is played while the allay already has an item 
        // and the cooldown is finished, the allay can duplicate
        if (this.canDuplicate && this.heldItem && this.duplicateCooldown === 0) {
          this.duplicate(world);
        }
      }
    }
    
    // Handle states
    switch (this.state) {
      case 'idle':
        this.handleIdleState(world, players, deltaTime);
        break;
      case 'following':
        this.handleFollowingState(world, players, deltaTime);
        break;
      case 'collecting':
        this.handleCollectingState(world, deltaTime);
        break;
      case 'returning':
        this.handleReturningState(world, players, deltaTime);
        break;
      case 'dancing':
        this.handleDancingState(deltaTime);
        break;
    }
    
    // Apply physics
    this.applyPhysics(world, deltaTime);
    
    return null;
  }
  
  /**
   * Update hover animation for flying
   * @param {number} deltaTime - Time since last update in ticks
   */
  updateHoverAnimation(deltaTime) {
    // Simple sine wave for hovering effect
    this.hoverOffset += 0.01 * deltaTime * this.hoverDirection;
    
    // Change direction at peaks
    if (this.hoverOffset > 0.5) {
      this.hoverDirection = -1;
    } else if (this.hoverOffset < -0.5) {
      this.hoverDirection = 1;
    }
  }
  
  /**
   * Handle idle state behavior
   * @param {Object} world - The game world
   * @param {Object} players - All players
   * @param {number} deltaTime - Time since last update in ticks
   */
  handleIdleState(world, players, deltaTime) {
    // Change to random position occasionally
    if (this.stateTimer > 100 || !this.targetPosition) {
      // Move to a random position around current location
      const randomX = Math.random() * 10 - 5;
      const randomZ = Math.random() * 10 - 5;
      
      this.targetPosition = {
        x: this.position.x + randomX,
        y: this.position.y + (Math.random() * 3 - 1),
        z: this.position.z + randomZ
      };
      
      this.stateTimer = 0;
    }
    
    // If it has a home note block, stay relatively close to it
    if (this.homeNoteBlock) {
      const distToHome = distance(this.position, this.homeNoteBlock);
      
      if (distToHome > 16) {
        // Move closer to home
        this.targetPosition = {
          x: this.homeNoteBlock.x + (Math.random() * 10 - 5),
          y: this.homeNoteBlock.y + 2 + (Math.random() * 2 - 1),
          z: this.homeNoteBlock.z + (Math.random() * 10 - 5)
        };
      }
    }
    
    // If it has a following player, change to following state
    if (this.followingPlayer && players[this.followingPlayer]) {
      this.state = 'following';
      this.stateTimer = 0;
      return;
    }
    
    // If it has an item and a home note block, check if should return
    if (this.heldItem && this.homeNoteBlock) {
      this.state = 'returning';
      this.stateTimer = 0;
      return;
    }
    
    // If it doesn't have an item, check for items to collect
    if (!this.heldItem) {
      const nearbyItem = this.findNearbyItem(world);
      if (nearbyItem) {
        this.targetItem = nearbyItem;
        this.targetPosition = nearbyItem.position;
        this.state = 'collecting';
        this.stateTimer = 0;
        return;
      }
    }
    
    // Move toward target position
    this.moveToward(this.targetPosition, this.moveSpeed * 0.5 * deltaTime);
  }
  
  /**
   * Handle following state behavior
   * @param {Object} world - The game world
   * @param {Object} players - All players
   * @param {number} deltaTime - Time since last update in ticks
   */
  handleFollowingState(world, players, deltaTime) {
    // If no longer has a valid player to follow, go back to idle
    if (!this.followingPlayer || !players[this.followingPlayer]) {
      this.followingPlayer = null;
      this.state = 'idle';
      this.stateTimer = 0;
      return;
    }
    
    const player = players[this.followingPlayer];
    
    // Calculate distance to player
    const distToPlayer = distance(this.position, player.position);
    
    // If player is too far away, try to catch up
    if (distToPlayer > this.maxPlayerFollowDistance) {
      this.targetPosition = {
        x: player.position.x,
        y: player.position.y + this.flyHeight,
        z: player.position.z
      };
    } 
    // If close enough, just hover nearby
    else if (distToPlayer < this.minPlayerFollowDistance) {
      // Stay at current position or move slightly away
      const angle = Math.random() * Math.PI * 2;
      this.targetPosition = {
        x: this.position.x + Math.cos(angle) * 2,
        y: this.position.y + (Math.random() * 2 - 1),
        z: this.position.z + Math.sin(angle) * 2
      };
    } 
    // Stay near player
    else {
      // Orbit around the player
      const angle = (this.stateTimer * 0.02) % (Math.PI * 2);
      const radius = 2 + Math.random() * 2;
      
      this.targetPosition = {
        x: player.position.x + Math.cos(angle) * radius,
        y: player.position.y + this.flyHeight + this.hoverOffset,
        z: player.position.z + Math.sin(angle) * radius
      };
    }
    
    // If it doesn't have an item, check for items to collect
    if (!this.heldItem) {
      const nearbyItem = this.findNearbyItem(world);
      if (nearbyItem) {
        this.targetItem = nearbyItem;
        this.targetPosition = nearbyItem.position;
        this.state = 'collecting';
        this.stateTimer = 0;
        return;
      }
    }
    
    // Move toward target position
    this.moveToward(this.targetPosition, this.moveSpeed * deltaTime);
  }
  
  /**
   * Handle collecting state behavior
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update in ticks
   */
  handleCollectingState(world, deltaTime) {
    // If target item is gone or we already have an item, go back to previous state
    if (!this.targetItem || this.heldItem) {
      this.targetItem = null;
      this.state = this.followingPlayer ? 'following' : 'idle';
      this.stateTimer = 0;
      return;
    }
    
    // Move toward the item
    this.moveToward(this.targetItem.position, this.moveSpeed * deltaTime);
    
    // Check if close enough to pick up
    const distToItem = distance(this.position, this.targetItem.position);
    if (distToItem < 1.0) {
      // Collect the item
      this.heldItem = {
        type: this.targetItem.type,
        count: 1,
        metadata: this.targetItem.metadata
      };
      
      // Remove item from world
      if (this.targetItem.remove) {
        this.targetItem.remove();
      }
      
      this.targetItem = null;
      
      // After collecting, decide what to do next
      if (this.homeNoteBlock) {
        // If has home note block, return to it
        this.state = 'returning';
      } else if (this.followingPlayer) {
        // If following a player, continue following
        this.state = 'following';
      } else {
        // Otherwise go back to idle
        this.state = 'idle';
      }
      
      this.stateTimer = 0;
      
      // Emit item collected event
      this.emitEvent('allay_collected_item', {
        id: this.id,
        item: this.heldItem,
        position: { ...this.position }
      });
    }
  }
  
  /**
   * Handle returning state behavior
   * @param {Object} world - The game world
   * @param {Object} players - All players
   * @param {number} deltaTime - Time since last update in ticks
   */
  handleReturningState(world, players, deltaTime) {
    // If no home note block or no item, go back to idle
    if (!this.homeNoteBlock || !this.heldItem) {
      this.state = 'idle';
      this.stateTimer = 0;
      return;
    }
    
    // Move toward home note block
    this.targetPosition = {
      x: this.homeNoteBlock.x,
      y: this.homeNoteBlock.y + 1.5,
      z: this.homeNoteBlock.z
    };
    
    this.moveToward(this.targetPosition, this.moveSpeed * deltaTime);
    
    // Check if close enough to drop item
    const distToHome = distance(this.position, this.homeNoteBlock);
    if (distToHome < 1.5) {
      // Drop the item at the note block
      this.dropItemAtNoteBlock();
      
      // After dropping, go back to appropriate state
      if (this.followingPlayer && players[this.followingPlayer]) {
        this.state = 'following';
      } else {
        this.state = 'idle';
      }
      
      this.stateTimer = 0;
    }
  }
  
  /**
   * Handle dancing state behavior
   * @param {number} deltaTime - Time since last update in ticks
   */
  handleDancingState(deltaTime) {
    // Spinning and bouncing animation - in a real implementation, this would
    // be handled by the client, but we track the state
    
    // After dance timer expires, go back to previous state
    if (this.dancingTimer >= 120) {
      this.isDancing = false;
      this.dancingTimer = 0;
      
      if (this.followingPlayer) {
        this.state = 'following';
      } else {
        this.state = 'idle';
      }
      
      this.stateTimer = 0;
    }
  }
  
  /**
   * Drop held item at note block location
   */
  dropItemAtNoteBlock() {
    if (!this.heldItem || !this.homeNoteBlock) return;
    
    // In a real implementation, this would create an actual item entity in the world
    
    // Emit drop event
    this.emitEvent('allay_dropped_item', {
      id: this.id,
      item: this.heldItem,
      position: { ...this.homeNoteBlock }
    });
    
    // Clear held item
    this.heldItem = null;
  }
  
  /**
   * Find nearby item to collect
   * @param {Object} world - The game world
   * @returns {Object|null} - Found item or null
   */
  findNearbyItem(world) {
    if (!world || !world.getItemsInRange) return null;
    
    // Filter to only include matching items if we already have a specific type
    const items = world.getItemsInRange(this.position, this.searchRadius)
      .filter(item => {
        // If we already have a preferred item type, only collect matching items
        if (this.heldItem) {
          return item.type === this.heldItem.type;
        }
        return true;
      });
    
    if (items.length === 0) return null;
    
    // Find closest item
    let closest = null;
    let closestDist = Infinity;
    
    for (const item of items) {
      const dist = distance(this.position, item.position);
      if (dist < closestDist) {
        closest = item;
        closestDist = dist;
      }
    }
    
    return closest;
  }
  
  /**
   * Handle when a note block is played nearby
   * @param {Object} noteBlockPosition - Position of the played note block
   * @param {number} note - Note played (0-24)
   */
  onNoteBlockPlayed(noteBlockPosition, note) {
    // Don't respond if already dancing
    if (this.isDancing) return;
    
    // Check if close enough to hear
    const dist = distance(this.position, noteBlockPosition);
    if (dist > 64) return; // Note blocks can be heard up to 64 blocks away
    
    // Set this note block as home if it doesn't already have one
    if (!this.homeNoteBlock) {
      this.homeNoteBlock = { ...noteBlockPosition };
    }
    
    // Start dancing
    this.isDancing = true;
    this.dancingTimer = 0;
    this.state = 'dancing';
    this.stateTimer = 0;
    
    // Reset note block timer
    this.noteBlockTimer = 30 * 20; // 30 seconds
    
    // Emit dancing event
    this.emitEvent('allay_dancing', {
      id: this.id,
      noteBlockPosition,
      note
    });
  }
  
  /**
   * Duplicate allay when conditions are met
   * @param {Object} world - The game world
   */
  duplicate(world) {
    if (!this.canDuplicate || !this.heldItem) return null;
    
    // Create duplicated allay data
    const newAllayData = {
      position: { ...this.position },
      options: {
        homeNoteBlock: this.homeNoteBlock ? { ...this.homeNoteBlock } : null,
        followingPlayer: null, // New allay doesn't inherit following player
        heldItem: null, // New allay doesn't get a copy of the item
        canDuplicate: false, // New allay can't immediately duplicate
      }
    };
    
    // Start cooldown
    this.duplicateCooldown = this.maxDuplicateCooldown;
    this.canDuplicate = false;
    
    // Emit duplication event
    this.emitEvent('allay_duplicated', {
      id: this.id,
      newAllay: newAllayData
    });
    
    return newAllayData;
  }
  
  /**
   * Apply physics for flying movement
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update
   */
  applyPhysics(world, deltaTime) {
    // Apply gravity at a reduced rate (floaty)
    this.velocity.y -= 0.03 * deltaTime;
    
    // Apply drag/resistance in air
    this.velocity.x *= 0.91;
    this.velocity.y *= 0.94;
    this.velocity.z *= 0.91;
    
    // Apply velocity to position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Prevent going below ground
    if (world && typeof world.getHeightAt === 'function') {
      const groundHeight = world.getHeightAt(this.position.x, this.position.z);
      if (this.position.y < groundHeight + 0.5) {
        this.position.y = groundHeight + 0.5;
        this.velocity.y = 0;
      }
    }
  }
  
  /**
   * Move toward a target position
   * @param {Object} target - Target position {x, y, z}
   * @param {number} speed - Movement speed
   */
  moveToward(target, speed) {
    if (!target) return;
    
    // Calculate direction to target
    const dx = target.x - this.position.x;
    const dy = target.y - this.position.y;
    const dz = target.z - this.position.z;
    
    // Calculate distance to target
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    if (dist > 0.1) {
      // Normalize direction and apply speed
      this.velocity.x += (dx / dist) * speed;
      this.velocity.y += (dy / dist) * speed;
      this.velocity.z += (dz / dist) * speed;
    } else {
      // Slow down when close to target
      this.velocity.x *= 0.7;
      this.velocity.y *= 0.7;
      this.velocity.z *= 0.7;
    }
  }
  
  /**
   * Handle player interaction
   * @param {Object} player - The player
   * @param {Object} interaction - Interaction data
   * @returns {Object} - Result of interaction
   */
  interact(player, interaction) {
    // If player gives item to allay
    if (interaction.type === 'give_item' && interaction.item) {
      // If allay already has an item, don't take another one
      if (this.heldItem) {
        return { success: false, message: 'Allay already has an item' };
      }
      
      // Take the item
      this.heldItem = {
        type: interaction.item.type,
        count: 1,
        metadata: interaction.item.metadata
      };
      
      // Set this player as the following player
      this.followingPlayer = player.id;
      this.state = 'following';
      this.stateTimer = 0;
      
      // Emit event
      this.emitEvent('allay_received_item', {
        id: this.id,
        playerId: player.id,
        item: this.heldItem
      });
      
      return { 
        success: true, 
        consumeItem: true,
        message: 'Allay took the item and will follow you'
      };
    }
    
    return { success: false };
  }
  
  /**
   * Allays are passive
   * @returns {boolean} - true
   */
  isPassive() {
    return true;
  }
  
  /**
   * Get drops when allay dies
   * @returns {Array} - Array of drop objects
   */
  getDrops() {
    const drops = [
      { item: 'experience', count: getRandomInt(1, 3) }
    ];
    
    // Drop held item if it has one
    if (this.heldItem) {
      drops.push(this.heldItem);
    }
    
    return drops;
  }
  
  /**
   * Serialize allay data for saving/networking
   * @returns {Object} - Serialized allay data
   */
  serialize() {
    return {
      ...super.serialize(),
      heldItem: this.heldItem,
      homeNoteBlock: this.homeNoteBlock,
      followingPlayer: this.followingPlayer,
      isDancing: this.isDancing,
      state: this.state,
      canDuplicate: this.canDuplicate,
      duplicateCooldown: this.duplicateCooldown
    };
  }
  
  /**
   * Deserialize allay data
   * @param {Object} data - Serialized allay data
   */
  deserialize(data) {
    if (data.type !== 'allay') return;
    
    // Call parent deserialize if available
    if (super.deserialize) {
      super.deserialize(data);
    } else {
      // Otherwise copy properties manually
      if (data.id !== undefined) this.id = data.id;
      if (data.position !== undefined) this.position = { ...data.position };
      if (data.health !== undefined) this.health = data.health;
      if (data.velocity !== undefined) this.velocity = { ...data.velocity };
    }
    
    // Copy allay-specific properties
    if (data.heldItem !== undefined) this.heldItem = data.heldItem;
    if (data.homeNoteBlock !== undefined) this.homeNoteBlock = data.homeNoteBlock;
    if (data.followingPlayer !== undefined) this.followingPlayer = data.followingPlayer;
    if (data.isDancing !== undefined) this.isDancing = data.isDancing;
    if (data.state !== undefined) this.state = data.state;
    if (data.canDuplicate !== undefined) this.canDuplicate = data.canDuplicate;
    if (data.duplicateCooldown !== undefined) this.duplicateCooldown = data.duplicateCooldown;
  }
  
  emitEvent(eventName, data) {
    if (this.world && this.world.emit) {
      this.world.emit(eventName, {
        entityId: this.id,
        ...data
      });
    }
  }
}

module.exports = Allay; 