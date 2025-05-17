/**
 * Armadillo - A passive mob that can roll into a ball for defense
 * Part of the 1.22 Sorcery Update
 */

const MobBase = require('./mobBase');
const { EventEmitter } = require('events');

class Armadillo extends MobBase {
  /**
   * Create a new Armadillo entity
   * @param {Object} position - Position in the world
   */
  constructor(position) {
    super('armadillo', position, 10, 0.3); // type, position, health, speed
    
    // Event emitter for armadillo events
    this.events = new EventEmitter();
    
    // Armadillo specific properties
    this.isRolled = false; // Whether the armadillo is currently rolled into a ball
    this.rollCooldown = 0; // Cooldown until next roll (in ticks)
    this.rollDuration = 0; // Remaining duration of current roll (in ticks)
    this.forceUnrollTimer = 0; // Timer to force unroll after a certain time
    this.scuteGrowth = 0; // Progress toward dropping a scute (0-100)
    this.isBaby = false; // Whether this is a baby armadillo
    this.ageTimer = 0; // Timer for baby growth
    this.isScared = false; // Whether the armadillo is currently scared
    this.preferredBiomes = ['savanna', 'desert', 'badlands']; // Biomes where armadillos naturally spawn
    this.loveTimer = 0; // Timer for breeding state (in ticks)
    
    // Physics properties
    this.velocity = { x: 0, y: 0, z: 0 };
    this.damageResistance = 0; // Percentage of damage to reduce
    
    // AI properties
    this.aiState = 'idle'; // Current AI state: idle, walking, eating, rolling, scared
    this.aiTimer = 0; // Timer for current AI state
    this.targetPosition = null; // Position the armadillo is moving toward
    this.fleeSource = null; // Position the armadillo is fleeing from
    
    // Set initial size based on age
    this.updateSize();
  }
  
  /**
   * Emit an event with data
   * @param {string} eventName - Name of the event
   * @param {Object} data - Event data
   */
  emit(eventName, data = {}) {
    if (this.events) {
      this.events.emit(eventName, {
        entityId: this.id,
        entityType: this.type,
        position: this.position,
        ...data
      });
    }
  }
  
  /**
   * Update the armadillo entity
   * @param {World} world - The world object
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(world, deltaTime) {
    super.update(world, deltaTime);
    
    // Update cooldowns and timers
    if (this.rollCooldown > 0) this.rollCooldown -= deltaTime;
    if (this.rollDuration > 0) this.rollDuration -= deltaTime;
    if (this.forceUnrollTimer > 0) this.forceUnrollTimer -= deltaTime;
    
    // Handle growth for baby armadillos
    if (this.isBaby) {
      this.ageTimer += deltaTime;
      if (this.ageTimer >= 24000) { // Grow up after 20 minutes (24000 ticks)
        this.isBaby = false;
        // Resize hitbox and update other properties
        this.updateSize();
      }
    }
    
    // Update scute growth (only for adult armadillos)
    if (!this.isBaby) {
      this.scuteGrowth += deltaTime * 0.002; // Very slow growth
      if (this.scuteGrowth >= 100) {
        this.dropScute();
        this.scuteGrowth = 0;
      }
    }
    
    // Handle roll state transitions
    if (this.isRolled && this.rollDuration <= 0) {
      this.unroll();
    }
    
    // Force unroll after max duration
    if (this.isRolled && this.forceUnrollTimer <= 0) {
      this.unroll();
      this.rollCooldown = 600; // 30 second cooldown after forced unroll
    }
    
    // Update AI
    this.updateAI(world, deltaTime);
  }
  
  /**
   * Update the armadillo's AI
   * @param {World} world - The world object
   * @param {number} deltaTime - Time elapsed since last update
   * @private
   */
  updateAI(world, deltaTime) {
    // Determine if there are threats nearby
    const nearbyEntities = world.getNearbyEntities(this.position, 8);
    const nearbyThreats = nearbyEntities.filter(entity => this.isThreat(entity));
    
    // Check if the armadillo should be scared
    if (nearbyThreats.length > 0 && !this.isRolled) {
      // Get the closest threat
      const closestThreat = nearbyThreats.reduce((closest, current) => {
        const closestDist = this.getDistanceTo(closest.position);
        const currentDist = this.getDistanceTo(current.position);
        return currentDist < closestDist ? current : closest;
      }, nearbyThreats[0]);
      
      // Decide whether to roll or flee based on distance
      const distanceToThreat = this.getDistanceTo(closestThreat.position);
      
      if (distanceToThreat < 4 && this.rollCooldown <= 0) {
        // Close threat - roll up
        this.roll();
        this.aiState = 'rolling';
        this.fleeSource = null;
        return; // Important to return here after decision is made
      } else {
        // Further threat - run away
        this.aiState = 'scared';
        this.isScared = true;
        this.fleeSource = closestThreat.position;
        return; // Important to return here after decision is made
      }
    } else if (this.isRolled) {
      // Stay rolled up
      this.aiState = 'rolling';
      return; // Important to return here after decision is made
    } else if (this.aiState === 'scared' && this.fleeSource) {
      // Continue fleeing
      const fleeDirection = {
        x: this.position.x - this.fleeSource.x,
        y: this.position.y - this.fleeSource.y,
        z: this.position.z - this.fleeSource.z
      };
      
      // Normalize direction
      const length = Math.sqrt(fleeDirection.x * fleeDirection.x + fleeDirection.z * fleeDirection.z);
      if (length > 0) {
        fleeDirection.x /= length;
        fleeDirection.z /= length;
      }
      
      // Set velocity to flee
      this.velocity.x = fleeDirection.x * this.speed * 1.5; // Faster when scared
      this.velocity.z = fleeDirection.z * this.speed * 1.5;
      
      // Check if far enough away to calm down
      if (this.getDistanceTo(this.fleeSource) > 12) {
        this.aiState = 'idle';
        this.isScared = false;
        this.fleeSource = null;
        this.aiTimer = 0;
      }
      
      return; // Important to return here after handling fleeing
    }
    
    // Normal behavior when not threatened
    this.isScared = false;
    
    // Update timer for current state
    this.aiTimer -= deltaTime;
    
    if (this.aiTimer <= 0) {
      // Choose a new state
      const rand = Math.random();
      if (rand < 0.6) {
        // Idle for 2-5 seconds
        this.aiState = 'idle';
        this.aiTimer = 40 + Math.random() * 60;
        this.velocity.x = 0;
        this.velocity.z = 0;
      } else {
        // Walk around for 3-7 seconds
        this.aiState = 'walking';
        this.aiTimer = 60 + Math.random() * 80;
        
        // Pick a random direction
        const angle = Math.random() * Math.PI * 2;
        this.velocity.x = Math.cos(angle) * this.speed;
        this.velocity.z = Math.sin(angle) * this.speed;
      }
    }
  }
  
  /**
   * Roll the armadillo into a defensive ball
   */
  roll() {
    if (!this.isRolled && this.rollCooldown <= 0) {
      this.isRolled = true;
      this.rollDuration = 200 + Math.random() * 100; // 10-15 seconds
      this.forceUnrollTimer = 600; // Force unroll after 30 seconds max
      
      // Stop moving when rolled
      this.velocity.x = 0;
      this.velocity.z = 0;
      
      // Increase damage resistance when rolled
      this.damageResistance = 0.75; // 75% damage reduction
      
      // Emit roll event for animations and sounds
      this.emit('roll');
    }
  }
  
  /**
   * Unroll the armadillo from its defensive ball
   */
  unroll() {
    if (this.isRolled) {
      this.isRolled = false;
      
      // Reset damage resistance
      this.damageResistance = 0;
      
      // Start cooldown
      this.rollCooldown = 100; // 5 second cooldown before can roll again
      
      // Emit unroll event for animations and sounds
      this.emit('unroll');
    }
  }
  
  /**
   * Drop an armadillo scute
   * @private
   */
  dropScute() {
    // Drop scute item
    if (this.world) {
      this.world.dropItem('armadillo_scute', this.position, 1);
    }
    
    // Emit event for sound/particle effects
    this.emit('drop_scute');
  }
  
  /**
   * Check if an entity is a threat to this armadillo
   * @param {Entity} entity - The entity to check
   * @returns {boolean} Whether the entity is a threat
   * @private
   */
  isThreat(entity) {
    // These entity types are considered threats
    const threatTypes = [
      'player',
      'wolf',
      'zombie',
      'skeleton',
      'creeper',
      'spider'
    ];
    
    // Check if it's a player
    if (entity.type === 'player') {
      // If player is holding a weapon, consider them a threat
      const heldItem = entity.getHeldItem ? entity.getHeldItem() : null;
      
      // If player is sneaking, they're not a threat (allows interaction)
      if (entity.isSneaking) {
        return false;
      }
      
      // Check if player is holding a weapon
      if (heldItem && 
         (heldItem.type === 'sword' || 
          heldItem.type === 'axe' || 
          heldItem.type === 'trident' ||
          heldItem.type === 'mace')) {
        return true;
      }
      
      // If player is running or too close, consider them a threat
      return entity.isSprinting || this.getDistanceTo(entity.position) < 3;
    }
    
    // For other entity types, just check if they're in the threat list
    return threatTypes.includes(entity.type);
  }
  
  /**
   * Handle interaction with the armadillo
   * @param {Player} player - The player interacting with this entity
   * @param {Object} context - Interaction context
   * @returns {boolean} Whether the interaction was handled
   */
  interact(player, context) {
    // Don't allow interaction when rolled up
    if (this.isRolled) {
      return false;
    }
    
    // Check for breeding items (carrots or beetroots for armadillos)
    const heldItem = player.getHeldItem();
    if (heldItem && (heldItem.type === 'carrot' || heldItem.type === 'beetroot')) {
      // Enter love mode if adult
      if (!this.isBaby) {
        this.enterLoveMode();
        
        // Consume one item
        if (player.inventory && player.inventory.removeItem) {
          player.inventory.removeItem(heldItem.id, 1);
        }
        
        return true;
      }
      
      // Speed up growth if baby
      if (this.isBaby) {
        this.ageTimer += 200; // About 10% of total growth time
        
        // Consume one item
        if (player.inventory && player.inventory.removeItem) {
          player.inventory.removeItem(heldItem.id, 1);
        }
        
        // Baby particles
        this.emit('feed_baby');
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Enter love mode for breeding
   * @private
   */
  enterLoveMode() {
    if (this.loveTimer > 0 || this.isBaby) return;
    
    this.loveTimer = 600; // 30 seconds
    this.emit('enter_love_mode');
    
    // Try to find a mate
    this.findMate();
  }
  
  /**
   * Find a mate for breeding
   * @private
   */
  findMate() {
    if (!this.world) return;
    
    // Find nearby armadillos
    const nearbyEntities = this.world.getNearbyEntities(this.position, 8);
    const nearbyArmadillos = nearbyEntities.filter(entity => {
      return entity.type === 'armadillo' && 
             entity !== this && 
             !entity.isBaby && 
             entity.loveTimer > 0;
    });
    
    if (nearbyArmadillos.length > 0) {
      // Choose the closest armadillo
      const mate = nearbyArmadillos.reduce((closest, current) => {
        const closestDist = this.getDistanceTo(closest.position);
        const currentDist = this.getDistanceTo(current.position);
        return currentDist < closestDist ? current : closest;
      }, nearbyArmadillos[0]);
      
      // Breed with the mate
      this.breed(mate);
    }
  }
  
  /**
   * Breed with another armadillo
   * @param {Armadillo} mate - The mate to breed with
   * @private
   */
  breed(mate) {
    // Reset love timers
    this.loveTimer = 0;
    mate.loveTimer = 0;
    
    // Create a baby armadillo
    if (this.world) {
      // Position between parents
      const babyPos = {
        x: (this.position.x + mate.position.x) / 2,
        y: this.position.y,
        z: (this.position.z + mate.position.z) / 2
      };
      
      // Spawn baby
      const baby = this.world.spawnEntity('armadillo', babyPos);
      if (baby) {
        baby.isBaby = true;
        baby.updateSize();
      }
      
      // Emit events
      this.emit('breed');
      mate.emit('breed');
    }
  }
  
  /**
   * Update entity size based on age
   * @private
   */
  updateSize() {
    if (this.isBaby) {
      // Baby size (smaller hitbox)
      this.width = 0.6;
      this.height = 0.5;
    } else {
      // Adult size
      this.width = 0.9;
      this.height = 0.8;
    }
  }
  
  /**
   * Handle damage to this entity
   * @param {number} amount - Amount of damage
   * @param {Entity} attacker - Entity that caused the damage
   * @returns {number} Actual damage dealt
   * @override
   */
  takeDamage(amount, attacker) {
    // If rolled up, reduce damage
    let actualDamage = amount;
    
    if (this.isRolled) {
      actualDamage = amount * (1 - this.damageResistance);
    } else if (attacker) {
      // Roll up when attacked if not already rolled
      this.roll();
    }
    
    // Apply damage using parent method
    this.health -= actualDamage;
    
    // Check if entity is now dead
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
    }
    
    return actualDamage;
  }
  
  /**
   * Get distance to a position
   * @param {Object} pos - Position to measure to
   * @returns {number} Distance
   * @private
   */
  getDistanceTo(pos) {
    const dx = this.position.x - pos.x;
    const dy = this.position.y - pos.y;
    const dz = this.position.z - pos.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Serialize armadillo data
   * @returns {Object} Serialized data
   * @override
   */
  serialize() {
    const data = super.serialize();
    return {
      ...data,
      isRolled: this.isRolled,
      rollCooldown: this.rollCooldown,
      rollDuration: this.rollDuration,
      forceUnrollTimer: this.forceUnrollTimer,
      scuteGrowth: this.scuteGrowth,
      isBaby: this.isBaby,
      ageTimer: this.ageTimer,
      isScared: this.isScared,
      aiState: this.aiState,
      aiTimer: this.aiTimer
    };
  }
  
  /**
   * Deserialize armadillo data
   * @param {Object} data - Serialized data
   * @returns {Armadillo} Deserialized armadillo
   * @static
   */
  static deserialize(data) {
    const armadillo = new Armadillo(data.position);
    armadillo.id = data.id;
    armadillo.health = data.health;
    armadillo.maxHealth = data.maxHealth;
    armadillo.velocity = data.velocity;
    armadillo.isRolled = data.isRolled;
    armadillo.rollCooldown = data.rollCooldown;
    armadillo.rollDuration = data.rollDuration;
    armadillo.forceUnrollTimer = data.forceUnrollTimer;
    armadillo.scuteGrowth = data.scuteGrowth;
    armadillo.isBaby = data.isBaby;
    armadillo.ageTimer = data.ageTimer;
    armadillo.isScared = data.isScared;
    armadillo.aiState = data.aiState;
    armadillo.aiTimer = data.aiTimer;
    
    // Update size based on age
    armadillo.updateSize();
    
    // Update damage resistance if rolled
    if (armadillo.isRolled) {
      armadillo.damageResistance = 0.75;
    }
    
    return armadillo;
  }
}

// Export the armadillo class
module.exports = Armadillo; 