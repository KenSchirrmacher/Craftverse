/**
 * EnderDragon - Represents the Ender Dragon boss entity with all its mechanics
 */

const EventEmitter = require('events');

class EnderDragon extends EventEmitter {
  /**
   * Creates a new Ender Dragon entity
   * @param {Object} options - Dragon options
   * @param {String} options.id - Entity ID
   * @param {Object} options.position - Initial position
   * @param {Object} options.world - World instance
   * @param {Object} options.server - Server instance
   */
  constructor(options = {}) {
    super();
    this.id = options.id || `dragon_${Date.now()}`;
    this.type = 'ender_dragon';
    this.position = options.position || { x: 0, y: 70, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.world = options.world;
    this.server = options.server;
    this.dimension = 'end';
    
    // Dragon stats
    this.maxHealth = 200;
    this.health = 200;
    this.damage = 10;
    this.speed = 0.6;
    this.size = { width: 16, height: 8, depth: 8 };
    this.boundingBox = this.calculateBoundingBox();
    
    // AI behavior
    this.phase = 'circling'; // circling, diving, charging, strafing, perching, death
    this.phaseTime = 0;
    this.target = null;
    this.targetPosition = null;
    this.pathPoints = [];
    this.nearestCrystal = null;
    
    // State flags
    this.isFiringDragonBreath = false;
    this.isHovering = false;
    this.isInvulnerable = false;
    this.isAggroed = false;
    
    // Dragon fight mechanics
    this.crystalsDestroyed = 0;
    this.crystalRespawnTime = 0;
    this.damageResistance = 0.5; // 50% damage reduction
    
    // Attack cooldowns
    this.attackCooldown = 0;
    this.breathCooldown = 0;
    
    // Setup phase handlers
    this.phaseHandlers = {
      circling: this.handleCirclingPhase.bind(this),
      diving: this.handleDivingPhase.bind(this),
      charging: this.handleChargingPhase.bind(this),
      strafing: this.handleStrafingPhase.bind(this),
      perching: this.handlePerchingPhase.bind(this),
      death: this.handleDeathPhase.bind(this)
    };
  }
  
  /**
   * Updates the dragon's state and behavior
   * @param {Number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Update phase time
    this.phaseTime += deltaTime;
    
    // Decrement cooldowns
    this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
    this.breathCooldown = Math.max(0, this.breathCooldown - deltaTime);
    
    // Find nearest player as target
    this.findTarget();
    
    // Handle current phase behavior
    if (this.phaseHandlers[this.phase]) {
      this.phaseHandlers[this.phase](deltaTime);
    } else {
      // Default to circling if invalid phase
      this.phase = 'circling';
    }
    
    // Apply movement and physics
    this.applyPhysics(deltaTime);
    
    // Check for crystal connections
    this.updateCrystalConnection();
    
    // Update bounding box
    this.boundingBox = this.calculateBoundingBox();
    
    // Check for player collisions
    this.checkPlayerCollisions();
    
    // Emit update event
    this.emitUpdate();
  }
  
  /**
   * Finds the nearest player as target
   */
  findTarget() {
    if (!this.world) return;
    
    let nearestPlayer = null;
    let minDistance = Infinity;
    
    // Get all players in the End dimension
    const players = Array.from(this.world.getPlayers()).filter(
      player => player.dimension === 'end'
    );
    
    for (const player of players) {
      const distance = this.getDistanceTo(player.position);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPlayer = player;
      }
    }
    
    // Set as target if found and different from current
    if (nearestPlayer && (!this.target || this.target.id !== nearestPlayer.id)) {
      this.target = nearestPlayer;
      this.isAggroed = true;
    }
  }
  
  /**
   * Handle the circling phase
   * @param {Number} deltaTime - Time since last update
   */
  handleCirclingPhase(deltaTime) {
    // Generate path points for circling the center if needed
    if (this.pathPoints.length === 0) {
      this.generateCirclingPath();
    }
    
    // Follow the path
    this.followPath(deltaTime);
    
    // Transition to diving or strafing after a certain time
    if (this.phaseTime > 10 && Math.random() < 0.01) {
      if (Math.random() < 0.5) {
        this.transitionToPhase('diving');
      } else {
        this.transitionToPhase('strafing');
      }
    }
    
    // If a crystal is nearby, transition to charging
    if (this.nearestCrystal && Math.random() < 0.005) {
      this.targetPosition = { ...this.nearestCrystal.position };
      this.transitionToPhase('charging');
    }
    
    // Transition to perching occasionally (more likely with fewer crystals)
    const perchChance = 0.0005 * (1 + this.crystalsDestroyed / 4);
    if (this.phaseTime > 30 && Math.random() < perchChance) {
      this.transitionToPhase('perching');
    }
  }
  
  /**
   * Handle the diving phase (diving attack on player)
   * @param {Number} deltaTime - Time since last update
   */
  handleDivingPhase(deltaTime) {
    // If no target, go back to circling
    if (!this.target) {
      this.transitionToPhase('circling');
      return;
    }
    
    // Set target position slightly above player
    this.targetPosition = {
      x: this.target.position.x,
      y: this.target.position.y + 15,
      z: this.target.position.z
    };
    
    // Move toward target position
    this.moveToward(this.targetPosition, this.speed * 1.5, deltaTime);
    
    // When close to target position, dive down
    if (this.getDistanceTo(this.targetPosition) < 20) {
      this.targetPosition = {
        x: this.target.position.x,
        y: this.target.position.y,
        z: this.target.position.z
      };
      
      // Increase speed for the dive
      this.moveToward(this.targetPosition, this.speed * 2, deltaTime);
      
      // If close to the ground, transition back to circling
      if (this.position.y < 10 || this.getDistanceTo(this.targetPosition) < 5) {
        // Deal damage to nearby players
        this.attackNearbyPlayers();
        
        // Return to circling
        this.transitionToPhase('circling');
      }
    }
    
    // If diving phase lasts too long, go back to circling
    if (this.phaseTime > 15) {
      this.transitionToPhase('circling');
    }
  }
  
  /**
   * Handle the charging phase (charging at crystal or target)
   * @param {Number} deltaTime - Time since last update
   */
  handleChargingPhase(deltaTime) {
    // If no target position, go back to circling
    if (!this.targetPosition) {
      this.transitionToPhase('circling');
      return;
    }
    
    // Move toward target position
    this.moveToward(this.targetPosition, this.speed * 1.8, deltaTime);
    
    // If reached target position, fire dragon breath
    if (this.getDistanceTo(this.targetPosition) < 5) {
      if (this.breathCooldown === 0) {
        this.fireBreath();
        this.breathCooldown = 2;
      }
      
      // After a short delay, transition back to circling
      if (this.phaseTime > 5) {
        this.transitionToPhase('circling');
      }
    }
    
    // If charging phase lasts too long, go back to circling
    if (this.phaseTime > 15) {
      this.transitionToPhase('circling');
    }
  }
  
  /**
   * Handle the strafing phase (flying past the player)
   * @param {Number} deltaTime - Time since last update
   */
  handleStrafingPhase(deltaTime) {
    // If no target, go back to circling
    if (!this.target) {
      this.transitionToPhase('circling');
      return;
    }
    
    // If start of phase, calculate strafe target
    if (this.phaseTime < 0.1 && !this.targetPosition) {
      const strafeOffset = {
        x: Math.random() * 60 - 30,
        y: Math.random() * 20 + 20,
        z: Math.random() * 60 - 30
      };
      
      this.targetPosition = {
        x: this.target.position.x + strafeOffset.x,
        y: this.target.position.y + strafeOffset.y,
        z: this.target.position.z + strafeOffset.z
      };
    }
    
    // Move toward target position
    this.moveToward(this.targetPosition, this.speed * 1.5, deltaTime);
    
    // If close to target or strafing for too long, return to circling
    if (this.getDistanceTo(this.targetPosition) < 10 || this.phaseTime > 8) {
      this.transitionToPhase('circling');
    }
    
    // Fire breath occasionally during strafe
    if (Math.random() < 0.02 && this.breathCooldown === 0) {
      this.fireBreath();
      this.breathCooldown = 2;
    }
  }
  
  /**
   * Handle the perching phase (landing on the exit portal)
   * @param {Number} deltaTime - Time since last update
   */
  handlePerchingPhase(deltaTime) {
    // Set perch position (center of the island, on the portal)
    const perchPosition = { x: 0, y: 5, z: 0 };
    
    // Move toward perch position if not close
    if (this.getDistanceTo(perchPosition) > 5) {
      this.moveToward(perchPosition, this.speed, deltaTime);
    } else {
      // Once perched, stay in place
      this.velocity = { x: 0, y: 0, z: 0 };
      this.position.y = Math.max(perchPosition.y, this.position.y);
      
      // Fire breath occasionally while perched
      if (Math.random() < 0.05 && this.breathCooldown === 0) {
        this.fireBreath();
        this.breathCooldown = 1;
      }
      
      // Stay perched for a while, then take off
      if (this.phaseTime > 15) {
        // Return to circling
        this.transitionToPhase('circling');
      }
    }
  }
  
  /**
   * Handle the death phase
   * @param {Number} deltaTime - Time since last update
   */
  handleDeathPhase(deltaTime) {
    // Slow descent to the ground
    if (this.position.y > 5) {
      this.velocity.y = -0.2;
    } else {
      this.velocity = { x: 0, y: 0, z: 0 };
      this.position.y = 5;
      
      // Emit death event once landed
      if (this.phaseTime > 2 && !this.deathEventEmitted) {
        this.deathEventEmitted = true;
        this.emitDeath();
      }
    }
  }
  
  /**
   * Apply physics and movement to the dragon
   * @param {Number} deltaTime - Time since last update
   */
  applyPhysics(deltaTime) {
    // Apply velocity to position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Apply drag
    const drag = 0.98;
    this.velocity.x *= drag;
    this.velocity.z *= drag;
    
    // Apply gravity if not in death phase
    if (this.phase !== 'death') {
      // Weak gravity for flying
      this.velocity.y -= 0.01; 
    }
    
    // Keep dragon above void
    if (this.position.y < 5) {
      this.position.y = 5;
      this.velocity.y = 0;
    }
    
    // Update rotation to face movement direction
    if (this.velocity.x !== 0 || this.velocity.z !== 0) {
      this.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
    }
    
    // Pitch based on vertical movement
    this.rotation.x = -Math.atan2(this.velocity.y, 
      Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z)) * 0.5;
  }
  
  /**
   * Move toward a target position
   * @param {Object} targetPos - Position to move toward
   * @param {Number} speed - Speed multiplier
   * @param {Number} deltaTime - Time since last update
   */
  moveToward(targetPos, speed, deltaTime) {
    // Calculate direction vector
    const dx = targetPos.x - this.position.x;
    const dy = targetPos.y - this.position.y;
    const dz = targetPos.z - this.position.z;
    
    // Normalize direction
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance > 0.1) {
      // Calculate normalized direction
      const dirX = dx / distance;
      const dirY = dy / distance;
      const dirZ = dz / distance;
      
      // Set velocity based on direction and speed
      this.velocity.x = dirX * speed;
      this.velocity.y = dirY * speed;
      this.velocity.z = dirZ * speed;
    }
  }
  
  /**
   * Generate path points for circling the center of the island
   */
  generateCirclingPath() {
    this.pathPoints = [];
    
    // Generate points in a circle around the center
    const radius = 50 + Math.random() * 20;
    const height = 50 + Math.random() * 20;
    const points = 12;
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      this.pathPoints.push({
        x: Math.cos(angle) * radius,
        y: height,
        z: Math.sin(angle) * radius
      });
    }
  }
  
  /**
   * Follow the current path
   * @param {Number} deltaTime - Time since last update
   */
  followPath(deltaTime) {
    if (this.pathPoints.length === 0) return;
    
    // Get current target point
    const targetPoint = this.pathPoints[0];
    
    // Move toward it
    this.moveToward(targetPoint, this.speed, deltaTime);
    
    // If reached the point, move to the next one
    if (this.getDistanceTo(targetPoint) < 5) {
      this.pathPoints.shift();
      
      // If path is empty, wrap around to the first point
      if (this.pathPoints.length === 0) {
        this.generateCirclingPath();
      }
    }
  }
  
  /**
   * Update connection to nearest crystal
   */
  updateCrystalConnection() {
    if (!this.world) return;
    
    // Check for end crystals in the world
    const crystals = Array.from(this.world.getEntities())
      .filter(entity => entity.type === 'end_crystal');
    
    // Find nearest crystal
    let nearest = null;
    let minDistance = Infinity;
    
    for (const crystal of crystals) {
      const distance = this.getDistanceTo(crystal.position);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = crystal;
      }
    }
    
    // If found a crystal, heal the dragon
    if (nearest && minDistance < 100) {
      this.nearestCrystal = nearest;
      
      // Heal if dragon is not at full health
      if (this.health < this.maxHealth) {
        this.health = Math.min(this.maxHealth, this.health + 0.1);
      }
      
      // Emit heal beam effect
      if (this.server) {
        this.server.emit('dragonCrystalConnection', {
          dragonId: this.id,
          crystalId: nearest.id,
          healing: true
        });
      }
    } else {
      this.nearestCrystal = null;
    }
  }
  
  /**
   * Attack nearby players
   */
  attackNearbyPlayers() {
    if (!this.world || this.attackCooldown > 0) return;
    
    // Get all players in the End dimension
    const players = Array.from(this.world.getPlayers()).filter(
      player => player.dimension === 'end'
    );
    
    for (const player of players) {
      const distance = this.getDistanceTo(player.position);
      
      // Attack if player is close
      if (distance < 8) {
        this.attackEntity(player);
      }
    }
    
    // Set attack cooldown
    this.attackCooldown = 0.5;
  }
  
  /**
   * Attack a specific entity
   * @param {Object} entity - Entity to attack
   */
  attackEntity(entity) {
    if (!entity || !entity.damage) return;
    
    // Calculate damage based on difficulty
    const damage = this.damage;
    
    // Apply knockback
    const dx = entity.position.x - this.position.x;
    const dz = entity.position.z - this.position.z;
    const knockbackStrength = 1.5;
    
    // Normalize direction for knockback
    const dist = Math.sqrt(dx * dx + dz * dz);
    const kbx = dx / dist * knockbackStrength;
    const kbz = dz / dist * knockbackStrength;
    
    // Apply damage and knockback
    entity.damage(damage, this);
    entity.applyKnockback(kbx, 0.5, kbz);
    
    // Play attack sound
    if (this.server) {
      this.server.emit('playSound', {
        name: 'entity.ender_dragon.hurt',
        position: entity.position,
        volume: 1.0,
        pitch: 1.0,
        dimension: 'end'
      });
    }
  }
  
  /**
   * Fire dragon breath at current target or position
   */
  fireBreath() {
    if (!this.target) return;
    
    this.isFiringDragonBreath = true;
    
    // Calculate breath target position
    const breathTarget = this.targetPosition || {
      x: this.target.position.x,
      y: this.target.position.y,
      z: this.target.position.z
    };
    
    // Emit breath attack event
    if (this.server) {
      this.server.emit('dragonBreathAttack', {
        dragonId: this.id,
        sourcePosition: {
          x: this.position.x,
          y: this.position.y - 2,
          z: this.position.z
        },
        targetPosition: breathTarget
      });
    }
    
    // After a short delay, stop breathing
    setTimeout(() => {
      this.isFiringDragonBreath = false;
    }, 2000);
  }
  
  /**
   * Take damage from an entity or source
   * @param {Number} amount - Amount of damage
   * @param {Object} source - Damage source
   * @returns {Boolean} Whether damage was applied
   */
  damage(amount, source) {
    if (this.isInvulnerable || this.health <= 0) return false;
    
    // Apply damage resistance
    const actualDamage = amount * (1 - this.damageResistance);
    this.health -= actualDamage;
    
    // Play hurt sound
    if (this.server) {
      this.server.emit('playSound', {
        name: 'entity.ender_dragon.hurt',
        position: this.position,
        volume: 1.0,
        pitch: 1.0,
        dimension: 'end'
      });
    }
    
    // Check if health is depleted
    if (this.health <= 0) {
      this.die();
      return true;
    }
    
    // Emit damage event
    this.emit('damaged', {
      entity: this,
      amount: actualDamage,
      source
    });
    
    return true;
  }
  
  /**
   * Die and trigger death sequence
   */
  die() {
    if (this.phase === 'death') return;
    
    // Set health to 0
    this.health = 0;
    
    // Transition to death phase
    this.transitionToPhase('death');
    
    // Play death sound
    if (this.server) {
      this.server.emit('playSound', {
        name: 'entity.ender_dragon.death',
        position: this.position,
        volume: 1.0,
        pitch: 1.0,
        dimension: 'end',
        global: true
      });
    }
  }
  
  /**
   * Emit death event and give rewards
   */
  emitDeath() {
    // Emit death event
    this.emit('death', {
      entity: this,
      position: this.position
    });
    
    // Notify server about dragon defeat
    if (this.server) {
      this.server.emit('dragonDefeated', {
        dragonId: this.id,
        position: this.position
      });
    }
    
    // If world exists, trigger defeat handling
    if (this.world && typeof this.world.handleDragonDefeat === 'function') {
      this.world.handleDragonDefeat();
    }
  }
  
  /**
   * Transition to a new phase
   * @param {String} newPhase - Phase to transition to
   */
  transitionToPhase(newPhase) {
    // Emit phase change event
    this.emit('phaseChange', {
      entity: this,
      oldPhase: this.phase,
      newPhase
    });
    
    // Update phase
    this.phase = newPhase;
    this.phaseTime = 0;
    
    // Clear path points for new phase
    this.pathPoints = [];
    
    // Reset flags
    this.isFiringDragonBreath = false;
    
    // If transitioning to death, make invulnerable
    if (newPhase === 'death') {
      this.isInvulnerable = true;
    }
  }
  
  /**
   * Calculate the dragon's bounding box
   * @returns {Object} Bounding box with min/max coordinates
   */
  calculateBoundingBox() {
    const halfWidth = this.size.width / 2;
    const halfDepth = this.size.depth / 2;
    
    return {
      min: {
        x: this.position.x - halfWidth,
        y: this.position.y,
        z: this.position.z - halfDepth
      },
      max: {
        x: this.position.x + halfWidth,
        y: this.position.y + this.size.height,
        z: this.position.z + halfDepth
      }
    };
  }
  
  /**
   * Check for collisions with players
   */
  checkPlayerCollisions() {
    if (!this.world) return;
    
    // Get all players in the End dimension
    const players = Array.from(this.world.getPlayers()).filter(
      player => player.dimension === 'end'
    );
    
    for (const player of players) {
      // Simple distance check first for efficiency
      const distance = this.getDistanceTo(player.position);
      
      if (distance < 10) {
        // Then do a more precise bounding box check
        if (this.isCollidingWith(player)) {
          this.attackEntity(player);
        }
      }
    }
  }
  
  /**
   * Check if the dragon is colliding with another entity
   * @param {Object} entity - Entity to check collision with
   * @returns {Boolean} Whether collision is detected
   */
  isCollidingWith(entity) {
    if (!entity || !entity.boundingBox) return false;
    
    const bb1 = this.boundingBox;
    const bb2 = entity.boundingBox;
    
    return (
      bb1.min.x <= bb2.max.x &&
      bb1.max.x >= bb2.min.x &&
      bb1.min.y <= bb2.max.y &&
      bb1.max.y >= bb2.min.y &&
      bb1.min.z <= bb2.max.z &&
      bb1.max.z >= bb2.min.z
    );
  }
  
  /**
   * Get distance to a position
   * @param {Object} position - Position to measure distance to
   * @returns {Number} Distance
   */
  getDistanceTo(position) {
    if (!position) return Infinity;
    
    const dx = this.position.x - position.x;
    const dy = this.position.y - position.y;
    const dz = this.position.z - position.z;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Emit update event with current state
   */
  emitUpdate() {
    this.emit('update', {
      id: this.id,
      type: this.type,
      position: { ...this.position },
      rotation: { ...this.rotation },
      velocity: { ...this.velocity },
      health: this.health,
      maxHealth: this.maxHealth,
      phase: this.phase,
      isFiringDragonBreath: this.isFiringDragonBreath
    });
  }
  
  /**
   * Serializes the dragon entity
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      position: { ...this.position },
      rotation: { ...this.rotation },
      velocity: { ...this.velocity },
      health: this.health,
      maxHealth: this.maxHealth,
      phase: this.phase,
      phaseTime: this.phaseTime,
      crystalsDestroyed: this.crystalsDestroyed
    };
  }
  
  /**
   * Creates an Ender Dragon entity from serialized data
   * @param {Object} data - Serialized data
   * @param {Object} world - World instance
   * @param {Object} server - Server instance
   * @returns {EnderDragon} New Ender Dragon entity
   */
  static deserialize(data, world, server) {
    const dragon = new EnderDragon({
      id: data.id,
      position: data.position,
      world,
      server
    });
    
    dragon.rotation = data.rotation || dragon.rotation;
    dragon.velocity = data.velocity || dragon.velocity;
    dragon.health = data.health !== undefined ? data.health : dragon.health;
    dragon.maxHealth = data.maxHealth || dragon.maxHealth;
    dragon.phase = data.phase || dragon.phase;
    dragon.phaseTime = data.phaseTime || 0;
    dragon.crystalsDestroyed = data.crystalsDestroyed || 0;
    
    return dragon;
  }
}

module.exports = EnderDragon; 