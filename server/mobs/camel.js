/**
 * Camel mob implementation for the Trails & Tales Update
 * Features:
 * - Passive mob that can be used as a mount
 * - Has two seats for two players to ride
 * - Special dash ability when sprinting
 * - Can sit down/stand up with unique movement mechanics
 * - Baby camels grow into adults
 * - Can be bred with cactus
 */

const MobBase = require('./mobBase');
const { getRandomInt } = require('../utils/mathUtils');

class Camel extends MobBase {
  /**
   * Create a new Camel
   * @param {Object} position - Initial position
   * @param {Object} options - Additional options
   */
  constructor(position, options = {}) {
    // Camels are quite tall and have medium speed
    super('camel', position, 32, 0.3); // type, position, health, speed
    
    // Camel-specific properties
    this.isAdult = options.isAdult !== undefined ? options.isAdult : true;
    this.age = options.age || (this.isAdult ? 24000 : 0); // 20 minutes to grow if baby
    this.maxAge = 24000; // 20 minutes (at 20 ticks/second) to grow into adult
    this.growthChance = 0.005; // Chance per tick to grow when age >= maxAge
    
    // Sitting behavior
    this.isSitting = options.isSitting || false;
    this.sitCooldown = 0;
    this.sitMaxCooldown = 40; // 2 seconds between sit/stand transitions
    
    // Dash ability
    this.isDashing = false;
    this.dashCooldown = 0;
    this.dashMaxCooldown = 100; // 5 seconds between dashes
    this.dashDuration = 20; // 1 second dash duration
    this.dashProgress = 0;
    this.dashSpeed = 2.5; // Multiplier for speed when dashing
    
    // Riding
    this.riders = [null, null]; // Can have two riders
    this.lastJumpTime = 0;
    
    // Breeding
    this.loveCooldown = 0;
    this.inLove = false;
    this.breedingPartner = null;
    this.breedingCooldown = 6000; // 5 minutes between breeding
    
    // Physical properties
    this.width = this.isAdult ? 1.7 : 0.85;
    this.height = this.isAdult ? 2.5 : 1.25;
    this.saddled = options.saddled || false;
    
    // Prevent despawning and fleeing
    this.fleeHealth = 0; // Camels don't flee
    this.despawnable = false; // Don't despawn naturally
    this.persistent = true;
    
    // Initialize velocity
    this.velocity = { x: 0, y: 0, z: 0 };
    
    // Add mock emitEvent function for testing
    if (!this.emitEvent) {
      this.emitEvent = (eventName, data) => {
        console.log(`Mock event: ${eventName}`, data);
      };
    }
  }
  
  /**
   * Update the camel's state and behavior
   * @param {Object} world - The game world
   * @param {Object} players - All players
   * @param {Object} mobs - All mobs
   * @param {number} deltaTime - Time since last update in ticks
   * @returns {Object|null} - Update result or null
   */
  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);
    
    if (this.dead) return null;
    
    // Update age if not adult
    if (!this.isAdult) {
      this.age += deltaTime;
      
      if (this.age >= this.maxAge && Math.random() < (this.growthChance * deltaTime * 100)) {
        this.isAdult = true;
        this.width = 1.7;
        this.height = 2.5;
        return { type: 'grow_up', entityId: this.id };
      }
    }
    
    // Update cooldowns
    if (this.sitCooldown > 0) {
      this.sitCooldown -= deltaTime;
    }
    
    if (this.dashCooldown > 0) {
      this.dashCooldown -= deltaTime;
    }
    
    if (this.loveCooldown > 0) {
      this.loveCooldown -= deltaTime;
      if (this.loveCooldown <= 0) {
        this.inLove = false;
      }
    }
    
    // Handle dash ability
    if (this.isDashing) {
      this.updateDashing(deltaTime);
    }
    
    // Handle breeding
    if (this.inLove) {
      this.handleBreeding(mobs);
    }
    
    // Process rider input if being ridden
    if (this.hasRiders()) {
      this.processRiderInput(players);
    } else if (!this.isSitting) {
      // Only wander when not sitting and not being ridden
      this.updateWandering(world, deltaTime);
    }
    
    // Apply physics
    this.applyPhysics(world, deltaTime);
    
    return null;
  }
  
  /**
   * Update dashing behavior
   * @param {number} deltaTime - Time since last update
   */
  updateDashing(deltaTime) {
    this.dashProgress += deltaTime;
    
    // End dash if duration is over
    if (this.dashProgress >= this.dashDuration) {
      this.isDashing = false;
      this.dashProgress = 0;
      this.dashCooldown = this.dashMaxCooldown;
      return;
    }
    
    // Apply dash velocity
    const dashDirection = this.getDirectionVector();
    this.velocity.x += dashDirection.x * this.speed * this.dashSpeed * 0.05;
    this.velocity.z += dashDirection.z * this.speed * this.dashSpeed * 0.05;
  }
  
  /**
   * Update wandering behavior
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update
   */
  updateWandering(world, deltaTime) {
    // Camels are more likely to stand still than other mobs
    if (this.wanderTarget == null) {
      if (Math.random() < 0.005 * deltaTime) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 5;
        
        this.wanderTarget = {
          x: this.position.x + Math.cos(angle) * distance,
          y: this.position.y,
          z: this.position.z + Math.sin(angle) * distance
        };
        
        // Make sure the wander target is on solid ground
        if (world) {
          const groundY = this.findGroundAt(world, this.wanderTarget.x, this.wanderTarget.z);
          if (groundY !== null) {
            this.wanderTarget.y = groundY + 0.1;
          }
        }
      }
    }
    
    // Move towards wander target if we have one
    if (this.wanderTarget) {
      const distanceToTarget = Math.sqrt(
        Math.pow(this.wanderTarget.x - this.position.x, 2) +
        Math.pow(this.wanderTarget.z - this.position.z, 2)
      );
      
      if (distanceToTarget < 0.5) {
        this.wanderTarget = null;
        
        // Random chance to sit after reaching destination
        if (Math.random() < 0.3 && this.sitCooldown <= 0) {
          this.toggleSitting();
        }
      } else {
        // Calculate direction to target
        const dx = this.wanderTarget.x - this.position.x;
        const dz = this.wanderTarget.z - this.position.z;
        const magnitude = Math.sqrt(dx * dx + dz * dz);
        
        // Normalize and apply movement
        if (magnitude > 0 && !this.isSitting) {
          const moveSpeed = this.speed * (this.isDashing ? this.dashSpeed : 1.0) * deltaTime / 20;
          
          this.velocity.x += (dx / magnitude) * moveSpeed;
          this.velocity.z += (dz / magnitude) * moveSpeed;
          
          // Update rotation to face direction of movement
          this.rotation.y = Math.atan2(dx, dz);
        }
      }
    }
  }
  
  /**
   * Process input from riders
   * @param {Object} players - All players
   */
  processRiderInput(players) {
    // Only front rider can control the camel
    const frontRider = this.riders[0] ? players[this.riders[0]] : null;
    if (!frontRider) return;
    
    // Skip if sitting (must stand up first)
    if (this.isSitting) return;
    
    // Get rider's input
    const input = frontRider.input || {};
    
    // Movement
    if (input.forward || input.back || input.left || input.right) {
      // Calculate movement direction based on rider's rotation
      const rotY = frontRider.rotation.y;
      let dx = 0;
      let dz = 0;
      
      if (input.forward) {
        dx += Math.sin(rotY);
        dz += Math.cos(rotY);
      }
      if (input.back) {
        dx -= Math.sin(rotY);
        dz -= Math.cos(rotY);
      }
      if (input.left) {
        dx -= Math.sin(rotY + Math.PI/2);
        dz -= Math.cos(rotY + Math.PI/2);
      }
      if (input.right) {
        dx += Math.sin(rotY + Math.PI/2);
        dz += Math.cos(rotY + Math.PI/2);
      }
      
      // Normalize direction
      const magnitude = Math.sqrt(dx * dx + dz * dz);
      if (magnitude > 0) {
        dx /= magnitude;
        dz /= magnitude;
        
        // Update rotation to face direction of movement
        this.rotation.y = Math.atan2(dx, dz);
        
        // Apply movement
        const moveSpeed = this.speed * (this.isDashing ? this.dashSpeed : 1.0) * 0.5;
        this.velocity.x += dx * moveSpeed;
        this.velocity.z += dz * moveSpeed;
      }
    }
    
    // Jumping/dashing
    if (input.jump && !this.isDashing && this.dashCooldown <= 0) {
      const currentTime = Date.now();
      
      // Double-tap jump to dash
      if (currentTime - this.lastJumpTime < 300) {
        this.startDash();
      }
      
      this.lastJumpTime = currentTime;
    }
  }
  
  /**
   * Start a dash (sprint)
   */
  startDash() {
    if (this.isSitting || this.isDashing || this.dashCooldown > 0) return;
    
    this.isDashing = true;
    this.dashProgress = 0;
    
    // Play dash animation and sound
    this.emitEvent('playAnimation', { entityId: this.id, animation: 'dash' });
    this.emitEvent('playSound', { sound: 'entity.camel.dash', position: this.position });
  }
  
  /**
   * Toggle between sitting and standing
   */
  toggleSitting() {
    if (this.sitCooldown > 0) return;
    
    this.isSitting = !this.isSitting;
    this.sitCooldown = this.sitMaxCooldown;
    
    // Play sit/stand animation and sound
    const animation = this.isSitting ? 'sit' : 'stand';
    const sound = this.isSitting ? 'entity.camel.sit' : 'entity.camel.stand';
    
    this.emitEvent('playAnimation', { entityId: this.id, animation });
    this.emitEvent('playSound', { sound, position: this.position });
    
    // Reset velocity when sitting
    if (this.isSitting) {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }
  }
  
  /**
   * Handle interaction with players
   * @param {Object} player - The player interacting with the camel
   * @param {Object} interaction - Interaction data
   * @returns {boolean} - Whether the interaction was successful
   */
  interact(player, interaction) {
    // Handle item use
    if (interaction.type === 'use_item') {
      const item = interaction.item;
      
      // Feeding
      if (item && item.type === 'cactus') {
        // Accelerate baby growth
        if (!this.isAdult) {
          // Add significant growth when fed cactus
          this.age += 240; // +12 seconds of growth
          
          // Consume item
          player.inventory.removeItem(item.id, 1);
          
          // Growth particles
          this.emitEvent('spawnParticle', {
            type: 'happy_villager',
            position: this.position,
            count: 5
          });
          
          return true;
        }
        
        // Breeding
        if (this.isAdult && !this.inLove) {
          this.inLove = true;
          this.loveCooldown = 600; // 30 seconds in love state
          
          // Consume item
          player.inventory.removeItem(item.id, 1);
          
          // Hearts effect
          this.emitEvent('spawnParticle', {
            type: 'heart',
            position: this.position,
            count: 7
          });
          
          return true;
        }
      }
      
      // Saddle (only for adults)
      if (this.isAdult && item && item.type === 'saddle' && !this.saddled) {
        this.saddled = true;
        
        // Consume saddle
        player.inventory.removeItem(item.id, 1);
        
        return true;
      }
    }
    
    // Mount/dismount (only for adults)
    if (this.isAdult && interaction.type === 'ride') {
      return this.handleRiding(player);
    }
    
    // Toggle sitting (only for adults)
    if (this.isAdult && interaction.type === 'sneak_interact' && this.sitCooldown <= 0) {
      this.toggleSitting();
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle player mounting/dismounting
   * @param {Object} player - The player
   * @returns {boolean} - Whether the action was successful
   */
  handleRiding(player) {
    // Must be saddled and adult to ride
    if (!this.isAdult || !this.saddled) return false;
    
    // Check if player is already riding
    const riderIndex = this.riders.indexOf(player.id);
    
    if (riderIndex >= 0) {
      // Dismount
      this.riders[riderIndex] = null;
      player.riding = null;
      
      // Dismount sound
      this.emitEvent('playSound', {
        sound: 'entity.camel.dismount',
        position: this.position
      });
      
      return true;
    } else {
      // Try to mount
      // First check if camel is sitting
      if (this.isSitting) {
        // Stand up first
        this.toggleSitting();
        return true;
      }
      
      // Find empty seat
      const emptyIndex = this.riders.findIndex(r => r === null);
      if (emptyIndex >= 0) {
        this.riders[emptyIndex] = player.id;
        player.riding = this.id;
        
        // Mount sound
        this.emitEvent('playSound', {
          sound: 'entity.camel.mount',
          position: this.position
        });
        
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Find the ground level at the given coordinates
   * @param {Object} world - The game world
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @returns {number|null} - Y coordinate of ground or null if not found
   */
  findGroundAt(world, x, z) {
    const MAX_SEARCH_DEPTH = 10;
    const startY = Math.round(this.position.y);
    
    // Search downward
    for (let y = startY; y > startY - MAX_SEARCH_DEPTH; y--) {
      const block = world.getBlockState(x, y, z);
      const blockAbove = world.getBlockState(x, y + 1, z);
      
      if (block && !this.isAirOrFluid(block) && 
          (!blockAbove || this.isAirOrFluid(blockAbove))) {
        return y + 1;
      }
    }
    
    // Search upward
    for (let y = startY; y < startY + MAX_SEARCH_DEPTH; y++) {
      const block = world.getBlockState(x, y, z);
      const blockAbove = world.getBlockState(x, y + 1, z);
      
      if (block && !this.isAirOrFluid(block) && 
          (!blockAbove || this.isAirOrFluid(blockAbove))) {
        return y + 1;
      }
    }
    
    return null;
  }
  
  /**
   * Check if a block is air or fluid (water/lava)
   * @param {Object} block - Block state
   * @returns {boolean} - Whether the block is air or fluid
   */
  isAirOrFluid(block) {
    return !block || block.type === 'air' || 
           block.type === 'water' || block.type === 'lava';
  }
  
  /**
   * Apply physics to the camel
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update
   */
  applyPhysics(world, deltaTime) {
    // No physics when sitting
    if (this.isSitting) {
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.velocity.z = 0;
      return;
    }
    
    // Apply gravity
    if (world && !this.isOnGround(world)) {
      this.velocity.y -= 0.04 * deltaTime;
    } else if (this.velocity.y < 0) {
      this.velocity.y = 0;
    }
    
    // Apply additional dash velocity if dashing
    if (this.isDashing) {
      const dirVector = this.getDirectionVector();
      this.velocity.x += dirVector.x * 0.1 * deltaTime;
      this.velocity.z += dirVector.z * 0.1 * deltaTime;
    }
    
    // Apply friction
    this.velocity.x *= 0.9;
    this.velocity.z *= 0.9;
    
    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Keep velocity in reasonable bounds
    const maxSpeed = this.isDashing ? 2.0 : 0.5;
    const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    
    if (horizontalSpeed > maxSpeed) {
      const scale = maxSpeed / horizontalSpeed;
      this.velocity.x *= scale;
      this.velocity.z *= scale;
    }
  }
  
  /**
   * Check if the camel is on the ground
   * @param {Object} world - The game world
   * @returns {boolean} - Whether the camel is on the ground
   */
  isOnGround(world) {
    const feetY = this.position.y - 0.1;
    const block = world.getBlockState(
      Math.floor(this.position.x),
      Math.floor(feetY),
      Math.floor(this.position.z)
    );
    
    return block && !this.isAirOrFluid(block);
  }
  
  /**
   * Get the camel's forward direction vector
   * @returns {Object} - Direction vector
   */
  getDirectionVector() {
    return {
      x: Math.sin(this.rotation.y),
      z: Math.cos(this.rotation.y)
    };
  }
  
  /**
   * Check if camel has any riders
   * @returns {boolean} - Whether the camel has riders
   */
  hasRiders() {
    return this.riders.some(r => r !== null);
  }
  
  /**
   * Handle breeding mechanics
   * @param {Object} mobs - All mobs
   */
  handleBreeding(mobs) {
    if (!this.inLove || !this.isAdult) return;
    
    // Find another camel in love within range
    for (const id in mobs) {
      const mob = mobs[id];
      
      if (mob.type === 'camel' && mob.inLove && mob.isAdult && 
          mob.id !== this.id && !mob.breedingPartner) {
        
        const distance = Math.sqrt(
          Math.pow(mob.position.x - this.position.x, 2) +
          Math.pow(mob.position.y - this.position.y, 2) +
          Math.pow(mob.position.z - this.position.z, 2)
        );
        
        if (distance < 3) {
          // Found breeding partner
          this.breedingPartner = mob.id;
          mob.breedingPartner = this.id;
          
          // Reset love state
          this.inLove = false;
          this.loveCooldown = this.breedingCooldown;
          mob.inLove = false;
          mob.loveCooldown = mob.breedingCooldown;
          
          // Create baby camel
          const babyPosition = {
            x: (this.position.x + mob.position.x) / 2,
            y: this.position.y,
            z: (this.position.z + mob.position.z) / 2
          };
          
          const babyCamel = new Camel(babyPosition, { isAdult: false });
          
          // Emit event for spawning the baby
          this.emitEvent('spawnEntity', { entity: babyCamel });
          
          // Award XP
          this.emitEvent('giveExperience', {
            position: babyPosition,
            amount: getRandomInt(1, 7)
          });
          
          break;
        }
      }
    }
  }
  
  /**
   * Get items that drop when the camel dies
   * @returns {Array} - Array of item drops
   */
  getDrops() {
    const drops = [];
    
    // Drop leather
    drops.push({
      type: 'leather',
      count: getRandomInt(0, 2)
    });
    
    // Drop saddle if saddled
    if (this.saddled) {
      drops.push({
        type: 'saddle',
        count: 1
      });
    }
    
    return drops;
  }
  
  /**
   * Check if this mob is passive
   * @returns {boolean} - Whether this mob is passive
   */
  isPassive() {
    return true;
  }
  
  /**
   * Serialize the camel state for saving/networking
   * @returns {Object} - Serialized state
   */
  serialize() {
    return {
      ...super.serialize(),
      isAdult: this.isAdult,
      age: this.age,
      isSitting: this.isSitting,
      saddled: this.saddled,
      riders: this.riders,
      inLove: this.inLove,
      loveCooldown: this.loveCooldown,
      breedingPartner: this.breedingPartner,
      isDashing: this.isDashing,
      dashCooldown: this.dashCooldown,
      dashProgress: this.dashProgress,
      velocity: this.velocity
    };
  }
  
  /**
   * Deserialize state data
   * @param {Object} data - Serialized state
   */
  static deserialize(data) {
    const camel = new Camel(data.position || { x: 0, y: 0, z: 0 }, {
      isAdult: data.isAdult,
      age: data.age,
      isSitting: data.isSitting,
      saddled: data.saddled
    });
    
    // Copy basic properties from parent class
    Object.assign(camel, {
      id: data.id,
      health: data.health,
      maxHealth: data.maxHealth,
      dead: data.dead,
      position: data.position,
      rotation: data.rotation,
      state: data.state
    });
    
    // Copy camel-specific properties
    camel.riders = data.riders || [null, null];
    camel.inLove = data.inLove || false;
    camel.loveCooldown = data.loveCooldown || 0;
    camel.breedingPartner = data.breedingPartner || null;
    camel.isDashing = data.isDashing || false;
    camel.dashCooldown = data.dashCooldown || 0;
    camel.dashProgress = data.dashProgress || 0;
    camel.velocity = data.velocity || { x: 0, y: 0, z: 0 };
    
    return camel;
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

module.exports = Camel; 