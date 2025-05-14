/**
 * Goat mob implementation
 * Mountain mob with unique behaviors:
 * - Ram attacks against players and mobs
 * - Can jump high distances
 * - Makes screaming sounds
 * - Can drop goat horns when ramming into hard blocks
 */

const MobBase = require('./mobBase');
const Vector3 = require('../utils/vector3');

class Goat extends MobBase {
  /**
   * Create a new Goat
   * @param {Object} position - Initial position {x, y, z}
   * @param {Object} options - Additional options
   */
  constructor(position, options = {}) {
    super({
      type: 'goat',
      position,
      health: 10,
      maxHealth: 10,
      attackDamage: 2,
      attackRange: 1.5,
      detectionRange: 16,
      speed: 0.3,
      drops: {
        milk: { chance: 1.0, min: 1, max: 1 }, // Can be milked
        experience: { min: 1, max: 3 }
      },
      armor: 0,
      isHostile: false, // Generally passive, but can ram
      ...options
    });
    
    // Goat-specific properties
    this.isScreaming = options.isScreaming || (Math.random() < 0.02); // 2% chance of screaming goat
    this.rammingCooldown = 0;
    this.maxRammingCooldown = 200; // 10 seconds
    this.rammingChargeTime = 0;
    this.isCharging = false;
    this.maxChargeTime = 20; // 1 second
    this.ramTarget = null;
    this.ramDirection = null;
    this.rammingSpeed = 1.5; // Speed multiplier when ramming
    this.lastRammedEntityId = null;
    this.rammedEntities = new Set(); // Track entities rammed in current charge
    this.jumpCooldown = 0;
    this.maxJumpCooldown = 100; // 5 seconds
    this.hornsLeft = options.hornsLeft !== undefined ? options.hornsLeft : 2;
    this.canBreed = true;
    this.eatingGrass = false;
    this.eatingTimer = 0;
  }
  
  /**
   * Update the goat's state
   * @param {Object} world - The world object
   * @param {Object} players - Players object
   * @param {Number} deltaTime - Time since last update in ms
   */
  update(world, players, deltaTime) {
    // Convert time to ticks (assuming 20 ticks per second)
    const dt = deltaTime / 50;
    
    // Update cooldowns
    if (this.rammingCooldown > 0) {
      this.rammingCooldown -= dt;
    }
    
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= dt;
    }
    
    // Handle ramming behavior
    if (this.isCharging) {
      this.updateRamming(world, players, dt);
    } else if (this.rammingCooldown <= 0 && !this.eatingGrass) {
      // Check for potential ram targets
      this.checkForRamTargets(world, players);
    }
    
    // Handle eating grass
    if (this.eatingGrass) {
      this.eatingTimer += dt;
      
      if (this.eatingTimer >= 40) { // 2 seconds to eat grass
        this.eatingGrass = false;
        this.eatingTimer = 0;
        
        // Find grass block below
        const blockBelow = world.getBlockAt(
          Math.floor(this.position.x),
          Math.floor(this.position.y) - 1,
          Math.floor(this.position.z)
        );
        
        // If eating grass block, convert to dirt
        if (blockBelow && blockBelow.type === 'grass_block') {
          world.setBlock(
            Math.floor(this.position.x),
            Math.floor(this.position.y) - 1,
            Math.floor(this.position.z),
            'dirt'
          );
        }
      }
    } else if (Math.random() < 0.001 * dt) {
      // Small chance to start eating grass
      const blockBelow = world.getBlockAt(
        Math.floor(this.position.x),
        Math.floor(this.position.y) - 1,
        Math.floor(this.position.z)
      );
      
      if (blockBelow && blockBelow.type === 'grass_block') {
        this.eatingGrass = true;
        this.eatingTimer = 0;
        
        // Emit eating grass event
        this.emitEvent('start_eating', {
          id: this.id,
          position: this.position
        });
      }
    }
    
    // Random bleating
    if (Math.random() < 0.0005 * dt) {
      this.emitEvent('goat_sound', {
        id: this.id,
        position: this.position,
        isScreaming: this.isScreaming
      });
    }
    
    // Random jump when in mountains (if not charging or eating)
    if (!this.isCharging && !this.eatingGrass && 
        this.jumpCooldown <= 0 && 
        Math.random() < 0.001 * dt) {
      
      // Check if in mountainous terrain
      const blockBelow = world.getBlockAt(
        Math.floor(this.position.x),
        Math.floor(this.position.y) - 1,
        Math.floor(this.position.z)
      );
      
      // Check blocks around to see if it's good to jump
      const hasMountainousBlocks = this.checkMountainousTerrain(world);
      
      if (blockBelow && hasMountainousBlocks) {
        this.performJump();
        this.jumpCooldown = this.maxJumpCooldown;
      }
    }
    
    // Call parent update method for basic mob behavior
    if (!this.isCharging && !this.eatingGrass) {
      super.update(world, players, deltaTime);
    }
  }
  
  /**
   * Check if the surrounding terrain is mountainous
   * @param {Object} world - The world object
   * @returns {Boolean} - Whether terrain is mountainous
   * @private
   */
  checkMountainousTerrain(world) {
    // Check blocks in a small area around the goat
    const mountainBlocks = ['stone', 'andesite', 'diorite', 'granite', 
                           'deepslate', 'tuff', 'calcite'];
    
    let mountainBlockCount = 0;
    
    // Check a 5x5 area around the goat
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        // Check various y levels
        for (let y = -2; y <= 2; y++) {
          const block = world.getBlockAt(
            Math.floor(this.position.x + x),
            Math.floor(this.position.y + y),
            Math.floor(this.position.z + z)
          );
          
          if (block && mountainBlocks.includes(block.type)) {
            mountainBlockCount++;
          }
        }
      }
    }
    
    // If at least 5 mountain blocks are found, consider it mountainous
    return mountainBlockCount >= 5;
  }
  
  /**
   * Perform a jump action
   * @private
   */
  performJump() {
    // Apply upward velocity for jump
    this.velocity.y = 0.8;
    
    // Apply horizontal velocity in current movement direction
    const jumpDirection = this.movementDirection || { x: 0, z: 0 };
    this.velocity.x += jumpDirection.x * 0.5;
    this.velocity.z += jumpDirection.z * 0.5;
    
    // Emit jump event
    this.emitEvent('goat_jump', {
      id: this.id,
      position: this.position,
      velocity: this.velocity
    });
  }
  
  /**
   * Check for potential ram targets
   * @param {Object} world - The world object
   * @param {Object} players - Players object
   * @private
   */
  checkForRamTargets(world, players) {
    // Only initiate ram with a small random chance
    if (Math.random() > 0.005) return;
    
    // Get nearby entities
    const nearbyEntities = world.getEntitiesInRange(
      this.position,
      16
    );
    
    // Get all players
    const allPlayers = Object.values(players);
    
    // Combine entities and players
    const potentialTargets = [
      ...nearbyEntities.filter(e => e.id !== this.id),
      ...allPlayers.filter(p => {
        const dx = p.position.x - this.position.x;
        const dy = p.position.y - this.position.y;
        const dz = p.position.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return distance <= 16;
      })
    ];
    
    if (potentialTargets.length === 0) return;
    
    // Filter for targets in line of sight
    const validTargets = potentialTargets.filter(target => {
      // Check line of sight
      return this.hasLineOfSight(world, target.position);
    });
    
    if (validTargets.length === 0) return;
    
    // Select a random target
    const target = validTargets[Math.floor(Math.random() * validTargets.length)];
    
    // Start charging
    this.startCharging(target);
  }
  
  /**
   * Start charging toward a target
   * @param {Object} target - Target entity or player
   * @private
   */
  startCharging(target) {
    this.isCharging = true;
    this.rammingChargeTime = 0;
    this.ramTarget = target;
    
    // Calculate direction to target
    const dx = target.position.x - this.position.x;
    const dy = target.position.y - this.position.y;
    const dz = target.position.z - this.position.z;
    
    // Normalize direction
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    this.ramDirection = {
      x: dx / distance,
      y: 0, // Don't charge up or down
      z: dz / distance
    };
    
    // Reset rammed entities set
    this.rammedEntities.clear();
    
    // Emit charging start event
    this.emitEvent('goat_start_ram', {
      id: this.id,
      position: this.position,
      targetId: target.id,
      direction: this.ramDirection
    });
    
    // Play screaming sound if this is a screaming goat
    if (this.isScreaming) {
      this.emitEvent('goat_scream', {
        id: this.id,
        position: this.position
      });
    }
  }
  
  /**
   * Update the ramming behavior
   * @param {Object} world - The world object
   * @param {Object} players - Players object
   * @param {Number} dt - Time delta in ticks
   * @private
   */
  updateRamming(world, players, dt) {
    if (this.rammingChargeTime < this.maxChargeTime) {
      // Still in preparatory charge phase
      this.rammingChargeTime += dt;
      return;
    }
    
    // Move in ram direction
    const moveDistance = this.speed * this.rammingSpeed * dt;
    const newPosition = {
      x: this.position.x + this.ramDirection.x * moveDistance,
      y: this.position.y,
      z: this.position.z + this.ramDirection.z * moveDistance
    };
    
    // Check for collision with blocks
    const blockCollision = this.checkBlockCollision(world, newPosition);
    if (blockCollision) {
      this.handleBlockCollision(world, blockCollision);
      return;
    }
    
    // Update position
    this.position = newPosition;
    
    // Check for collisions with entities
    this.checkEntityCollisions(world, players);
    
    // Check if ram should end (distance or time)
    this.checkEndRam(dt);
  }
  
  /**
   * Check for collisions with blocks during ramming
   * @param {Object} world - The world object
   * @param {Object} newPosition - Potential new position
   * @returns {Object|null} - Collision info or null
   * @private
   */
  checkBlockCollision(world, newPosition) {
    // Check block at new position
    const blockX = Math.floor(newPosition.x);
    const blockY = Math.floor(newPosition.y);
    const blockZ = Math.floor(newPosition.z);
    
    const block = world.getBlockAt(blockX, blockY, blockZ);
    const blockAbove = world.getBlockAt(blockX, blockY + 1, blockZ);
    
    // If solid block in the way
    if (block && block.isSolid) {
      return {
        block,
        position: { x: blockX, y: blockY, z: blockZ }
      };
    }
    
    // If solid block above (head collision)
    if (blockAbove && blockAbove.isSolid) {
      return {
        block: blockAbove,
        position: { x: blockX, y: blockY + 1, z: blockZ }
      };
    }
    
    return null;
  }
  
  /**
   * Handle collision with a block during ramming
   * @param {Object} world - The world object
   * @param {Object} collision - Collision information
   * @private
   */
  handleBlockCollision(world, collision) {
    // End ramming
    this.isCharging = false;
    this.rammingCooldown = this.maxRammingCooldown;
    
    // Check if the block is hard enough to drop horn
    const hardBlocks = ['stone', 'deepslate', 'andesite', 'diorite', 'granite',
                        'iron_ore', 'copper_ore', 'gold_ore', 'diamond_ore',
                        'obsidian', 'netherrack', 'blackstone'];
    
    if (this.hornsLeft > 0 && hardBlocks.includes(collision.block.type)) {
      // 30% chance to drop a horn
      if (Math.random() < 0.3) {
        this.dropHorn(world, collision.position);
      }
    }
    
    // Emit ram collision event
    this.emitEvent('goat_ram_block', {
      id: this.id,
      position: this.position,
      blockPosition: collision.position,
      blockType: collision.block.type
    });
  }
  
  /**
   * Drop a goat horn
   * @param {Object} world - The world object
   * @param {Object} position - Position to drop at
   * @private
   */
  dropHorn(world, position) {
    // Decrease horns left
    this.hornsLeft--;
    
    // Drop a horn item
    world.dropItem({
      id: 'goat_horn',
      count: 1,
      position: {
        x: position.x + 0.5,
        y: position.y + 0.5,
        z: position.z + 0.5
      }
    });
    
    // Emit horn drop event
    this.emitEvent('goat_horn_drop', {
      id: this.id,
      position: position
    });
  }
  
  /**
   * Check for collisions with entities during ramming
   * @param {Object} world - The world object
   * @param {Object} players - Players object
   * @private
   */
  checkEntityCollisions(world, players) {
    // Get nearby entities
    const nearbyEntities = world.getEntitiesInRange(
      this.position,
      2
    );
    
    // Get all players
    const allPlayers = Object.values(players).filter(p => {
      const dx = p.position.x - this.position.x;
      const dy = p.position.y - this.position.y;
      const dz = p.position.z - this.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance <= 2;
    });
    
    // Combine entities and players
    const potentialHits = [
      ...nearbyEntities.filter(e => e.id !== this.id),
      ...allPlayers
    ];
    
    for (const target of potentialHits) {
      // Skip if already rammed this entity in this charge
      if (this.rammedEntities.has(target.id)) {
        continue;
      }
      
      // Calculate distance
      const dx = target.position.x - this.position.x;
      const dy = target.position.y - this.position.y;
      const dz = target.position.z - this.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // If close enough, ram them
      if (distance <= 1.5) {
        this.ramEntity(target);
        this.rammedEntities.add(target.id);
      }
    }
  }
  
  /**
   * Ram an entity or player
   * @param {Object} target - Target entity or player
   * @private
   */
  ramEntity(target) {
    // Calculate damage (more for screaming goats)
    const damage = this.isScreaming ? this.attackDamage * 2 : this.attackDamage;
    
    // Apply damage to target
    if (target.takeDamage) {
      target.takeDamage(damage, {
        type: 'ram',
        source: this
      });
    }
    
    // Apply knockback
    if (target.velocity) {
      target.velocity.x += this.ramDirection.x * 1.5;
      target.velocity.y += 0.4; // Vertical knockback
      target.velocity.z += this.ramDirection.z * 1.5;
    }
    
    // Emit ram hit event
    this.emitEvent('goat_ram_entity', {
      id: this.id,
      position: this.position,
      targetId: target.id,
      damage: damage
    });
  }
  
  /**
   * Check if the ram should end
   * @param {Number} dt - Time delta in ticks
   * @private
   */
  checkEndRam(dt) {
    // Ram for a maximum of 3 seconds
    this.ramTimer = (this.ramTimer || 0) + dt;
    
    if (this.ramTimer > 60) { // 3 seconds at 20 ticks/second
      this.stopRamming();
      return;
    }
    
    // If target is too far or no longer exists, stop ramming
    if (this.ramTarget) {
      // Check if target still exists (might have been removed)
      if (!this.ramTarget.position) {
        this.stopRamming();
        return;
      }
      
      // Calculate distance to target
      const dx = this.ramTarget.position.x - this.position.x;
      const dy = this.ramTarget.position.y - this.position.y;
      const dz = this.ramTarget.position.z - this.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // If we've gone past the target, stop ramming
      if (distance > 20) {
        this.stopRamming();
      }
    }
  }
  
  /**
   * Stop ramming
   * @private
   */
  stopRamming() {
    this.isCharging = false;
    this.rammingCooldown = this.maxRammingCooldown;
    this.ramTarget = null;
    this.ramDirection = null;
    this.ramTimer = 0;
    
    // Emit ram end event
    this.emitEvent('goat_end_ram', {
      id: this.id,
      position: this.position
    });
  }
  
  /**
   * Check if entity has line of sight to position
   * @param {Object} world - The world object
   * @param {Object} targetPosition - Position to check
   * @returns {Boolean} - Whether line of sight exists
   * @private
   */
  hasLineOfSight(world, targetPosition) {
    // Simple ray-casting to check line of sight
    const startPos = {
      x: this.position.x,
      y: this.position.y + 0.8, // Eye level
      z: this.position.z
    };
    
    const endPos = {
      x: targetPosition.x,
      y: targetPosition.y + 0.8, // Target eye level
      z: targetPosition.z
    };
    
    // Direction vector
    const direction = {
      x: endPos.x - startPos.x,
      y: endPos.y - startPos.y,
      z: endPos.z - startPos.z
    };
    
    // Distance
    const distance = Math.sqrt(
      direction.x * direction.x +
      direction.y * direction.y +
      direction.z * direction.z
    );
    
    // Normalize direction
    direction.x /= distance;
    direction.y /= distance;
    direction.z /= distance;
    
    // Check blocks along line
    const steps = Math.ceil(distance * 2); // 2 checks per block
    const stepSize = distance / steps;
    
    for (let i = 1; i < steps; i++) {
      const checkPos = {
        x: startPos.x + direction.x * stepSize * i,
        y: startPos.y + direction.y * stepSize * i,
        z: startPos.z + direction.z * stepSize * i
      };
      
      const blockX = Math.floor(checkPos.x);
      const blockY = Math.floor(checkPos.y);
      const blockZ = Math.floor(checkPos.z);
      
      const block = world.getBlockAt(blockX, blockY, blockZ);
      
      if (block && block.isSolid) {
        return false; // Line of sight blocked
      }
    }
    
    return true; // Line of sight clear
  }
  
  /**
   * Process an interaction with the goat
   * @param {Object} player - Player interacting
   * @param {Object} interaction - Interaction data
   * @returns {Object} - Result of interaction
   */
  processInteraction(player, interaction) {
    // Handle milking
    if (interaction.action === 'use_item' && interaction.itemId === 'bucket') {
      return {
        success: true,
        message: 'Milked goat',
        consumeItem: true,
        replacementItem: 'milk_bucket'
      };
    }
    
    // Handle breeding
    if (interaction.action === 'feed' && interaction.itemId === 'wheat') {
      return this.processBreeding(player, interaction);
    }
    
    return super.processInteraction(player, interaction);
  }
  
  /**
   * Process breeding interaction
   * @param {Object} player - Player interacting
   * @param {Object} interaction - Interaction data
   * @returns {Object} - Result of interaction
   * @private
   */
  processBreeding(player, interaction) {
    // Check if this goat can breed
    if (this.age < 0) {
      return { 
        success: false, 
        message: 'This goat is too young to breed'
      };
    }
    
    if (this.breedingCooldown > 0) {
      return { 
        success: false, 
        message: 'This goat cannot breed right now'
      };
    }
    
    // Set in love mode
    this.loveMode = true;
    this.loveTimer = 0;
    this.maxLoveTime = 30 * 20; // 30 seconds at 20 ticks/second
    
    // Emit love particles
    this.emitEvent('love_particles', {
      id: this.id,
      position: {
        x: this.position.x,
        y: this.position.y + 0.5,
        z: this.position.z
      }
    });
    
    // Check for nearby goats in love mode
    const world = player.world;
    const nearbyGoats = world.getEntitiesInRange(
      this.position,
      8,
      entity => entity.type === 'goat' && 
                entity.id !== this.id && 
                entity.loveMode && 
                !entity.isBreeding
    );
    
    // If found another goat in love mode, breed
    if (nearbyGoats.length > 0) {
      const partner = nearbyGoats[0];
      
      // Set breeding flags
      this.isBreeding = true;
      partner.isBreeding = true;
      
      // Set cooldowns
      this.breedingCooldown = 5 * 60 * 20; // 5 minutes
      partner.breedingCooldown = 5 * 60 * 20;
      
      // Create baby goat
      const babyPosition = {
        x: (this.position.x + partner.position.x) / 2,
        y: (this.position.y + partner.position.y) / 2,
        z: (this.position.z + partner.position.z) / 2
      };
      
      // 20% chance for screaming baby if either parent is screaming
      const isScreamingBaby = (this.isScreaming || partner.isScreaming) && Math.random() < 0.2;
      
      world.spawnEntity('goat', babyPosition, {
        age: -24000, // Baby
        isScreaming: isScreamingBaby
      });
      
      // Exit love mode
      this.loveMode = false;
      partner.loveMode = false;
      
      // Emit breeding particles
      this.emitEvent('breeding_particles', {
        position: babyPosition
      });
      
      // Give player breeding XP
      player.addExperience(7);
      
      return {
        success: true,
        message: 'Goats bred successfully',
        consumeItem: true
      };
    }
    
    return {
      success: true,
      message: 'Goat is ready to breed',
      consumeItem: true
    };
  }
  
  /**
   * Serialize the goat for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      isScreaming: this.isScreaming,
      rammingCooldown: this.rammingCooldown,
      jumpCooldown: this.jumpCooldown,
      hornsLeft: this.hornsLeft,
      eatingGrass: this.eatingGrass,
      eatingTimer: this.eatingTimer
    };
  }
  
  /**
   * Deserialize data to restore the goat's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.isScreaming !== undefined) {
      this.isScreaming = data.isScreaming;
    }
    if (data.rammingCooldown !== undefined) {
      this.rammingCooldown = data.rammingCooldown;
    }
    if (data.jumpCooldown !== undefined) {
      this.jumpCooldown = data.jumpCooldown;
    }
    if (data.hornsLeft !== undefined) {
      this.hornsLeft = data.hornsLeft;
    }
    if (data.eatingGrass !== undefined) {
      this.eatingGrass = data.eatingGrass;
    }
    if (data.eatingTimer !== undefined) {
      this.eatingTimer = data.eatingTimer;
    }
  }
}

module.exports = Goat; 