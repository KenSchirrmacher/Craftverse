/**
 * Aquatic mobs implementation for the Craftverse game
 * Includes Squid and GlowSquid mobs for the Caves & Cliffs update
 */

const MobBase = require('./mobBase');
const { getRandomInt } = require('../utils/mathUtils');

/**
 * Base Squid class - passive aquatic mob that produces ink sacs
 * Swims in water, flees from players when attacked
 */
class Squid extends MobBase {
  /**
   * Create a new Squid
   * @param {Object} position - Initial position
   * @param {Object} options - Additional options
   */
  constructor(position, options = {}) {
    super({
      type: 'squid',
      position,
      health: 10,
      maxHealth: 10,
      movementSpeed: 0.7,
      followRange: 16,
      attackDamage: 0,
      knockbackResistance: 0.2,
      despawnable: true,
      ...options
    });

    // Squid-specific properties
    this.waterLevel = 0; // Current water level
    this.isInWater = false;
    this.inkCooldown = 0;
    this.maxInkCooldown = 600; // 30 seconds @ 20 ticks per second
    this.fleeTimer = 0;
    this.isFloatingUp = false;
    this.swimCycleTimer = 0;
    this.tentacleAngle = 0;
    this.swimSpeed = options.swimSpeed || 0.3;
    this.isJet = false;
    this.jetTimer = 0;
    this.jetDirection = { x: 0, y: 0, z: 0 };
    this.tentacleAnimation = 0;
    this.lastDamageSource = null;
    
    // Movement patterns
    this.movementPattern = 'idle';
    this.movementTimer = 0;
    this.movementDirection = { x: 0, y: 0, z: 0 };
    
    // Set size for collision
    this.width = 0.8;
    this.height = 0.8;
  }

  /**
   * Update the squid's state
   * @param {Object} world - The game world
   * @param {Object} players - All players
   * @param {Object} mobs - All mobs
   * @param {number} deltaTime - Time since last update in ticks
   */
  update(world, players, mobs, deltaTime) {
    super.update();
    
    if (this.dead) return null;
    
    // Update water check
    this.updateWaterState(world);
    
    // Update timers
    if (this.inkCooldown > 0) {
      this.inkCooldown -= deltaTime;
    }
    
    if (this.fleeTimer > 0) {
      this.fleeTimer -= deltaTime;
    }
    
    // Update swim animation cycle
    this.swimCycleTimer = (this.swimCycleTimer + deltaTime) % 200;
    this.tentacleAngle = Math.sin(this.swimCycleTimer * 0.1) * 0.6;
    this.tentacleAnimation = (this.tentacleAnimation + deltaTime * 0.05) % 360;
    
    // Jet propulsion logic
    if (this.isJet) {
      this.handleJetPropulsion(deltaTime);
    }
    
    // Handle basic AI
    if (this.fleeTimer > 0) {
      this.handleFlee(world, players, deltaTime);
    } else {
      this.handleNormalBehavior(world, deltaTime);
    }
    
    // Apply water/gravity physics
    this.applyPhysics(world, deltaTime);
    
    // Return null if no special actions
    return null;
  }
  
  /**
   * Check if the squid is in water
   * @param {Object} world - The game world
   */
  updateWaterState(world) {
    // If world has a method to check water, use it
    if (world && typeof world.isWaterAt === 'function') {
      this.isInWater = world.isWaterAt(
        this.position.x,
        this.position.y,
        this.position.z
      );
      
      // Find water level if we're in water
      if (this.isInWater) {
        let y = this.position.y;
        while (world.isWaterAt(this.position.x, y, this.position.z)) {
          y += 1;
        }
        this.waterLevel = y - 1;
      }
    } else {
      // Fallback: Check block type directly
      if (world && typeof world.getBlockAt === 'function') {
        const block = world.getBlockAt(
          Math.floor(this.position.x),
          Math.floor(this.position.y),
          Math.floor(this.position.z)
        );
        
        this.isInWater = block && block.type === 'water';
      }
    }
  }
  
  /**
   * Apply physics based on environment
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update
   */
  applyPhysics(world, deltaTime) {
    if (!this.isInWater) {
      // Apply gravity when not in water
      this.velocity.y -= 0.08 * deltaTime;
      
      // Apply drag
      this.velocity.x *= 0.91;
      this.velocity.y *= 0.98;
      this.velocity.z *= 0.91;
    } else {
      // In water: buoyancy and drag
      if (!this.isJet) {
        // Gentle floating upwards in water when not jetting
        if (this.isFloatingUp) {
          this.velocity.y += 0.01 * deltaTime;
        } else {
          this.velocity.y *= 0.8;
        }
        
        // Water drag
        this.velocity.x *= 0.8;
        this.velocity.z *= 0.8;
      }
      
      // Maximum speed in water
      const maxSpeed = this.isJet ? this.swimSpeed * 2 : this.swimSpeed;
      this.capVelocity(maxSpeed);
    }
    
    // Apply velocity to position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Prevent going above water surface
    if (this.isInWater && this.position.y > this.waterLevel) {
      this.position.y = this.waterLevel;
      this.velocity.y = 0;
    }
  }
  
  /**
   * Cap velocity to maximum speed
   * @param {number} maxSpeed - Maximum speed
   */
  capVelocity(maxSpeed) {
    const speedSq = 
      this.velocity.x * this.velocity.x + 
      this.velocity.z * this.velocity.z;
    
    if (speedSq > maxSpeed * maxSpeed) {
      const scale = maxSpeed / Math.sqrt(speedSq);
      this.velocity.x *= scale;
      this.velocity.z *= scale;
    }
    
    // Cap vertical speed
    if (Math.abs(this.velocity.y) > maxSpeed) {
      this.velocity.y = Math.sign(this.velocity.y) * maxSpeed;
    }
  }
  
  /**
   * Handle normal swimming behavior
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update
   */
  handleNormalBehavior(world, deltaTime) {
    // Update movement timer
    this.movementTimer -= deltaTime;
    
    // Change movement pattern if timer expires
    if (this.movementTimer <= 0) {
      this.chooseNewMovementPattern();
    }
    
    // Execute current movement pattern
    switch (this.movementPattern) {
      case 'idle':
        // Minimal movement, just slight bobbing
        this.isFloatingUp = Math.sin(this.swimCycleTimer * 0.05) > 0;
        break;
        
      case 'swim':
        // Apply directional swimming forces
        this.velocity.x += this.movementDirection.x * 0.005 * deltaTime;
        this.velocity.z += this.movementDirection.z * 0.005 * deltaTime;
        
        // Occasionally change swimming direction
        if (Math.random() < 0.01 * deltaTime) {
          this.updateSwimDirection();
        }
        break;
        
      case 'dive':
        // Dive downward
        this.velocity.y -= 0.005 * deltaTime;
        this.isFloatingUp = false;
        break;
        
      case 'surface':
        // Rise toward water surface
        this.velocity.y += 0.005 * deltaTime;
        this.isFloatingUp = true;
        break;
    }
  }
  
  /**
   * Choose a new movement pattern
   */
  chooseNewMovementPattern() {
    const patterns = ['idle', 'swim', 'dive', 'surface'];
    this.movementPattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Set a duration for this pattern
    this.movementTimer = 100 + Math.random() * 300; // 5-20 seconds
    
    // If swimming, initialize movement direction
    if (this.movementPattern === 'swim') {
      this.updateSwimDirection();
    }
  }
  
  /**
   * Update swimming direction vector
   */
  updateSwimDirection() {
    const angle = Math.random() * Math.PI * 2;
    this.movementDirection = {
      x: Math.sin(angle) * this.swimSpeed,
      y: (Math.random() - 0.5) * 0.1, // Slight up/down movement
      z: Math.cos(angle) * this.swimSpeed
    };
  }
  
  /**
   * Handle fleeing behavior when threatened
   * @param {Object} world - The game world
   * @param {Object} players - All players
   * @param {number} deltaTime - Time since last update
   */
  handleFlee(world, players, deltaTime) {
    if (!this.lastDamageSource) {
      // No known threat, revert to normal behavior
      this.fleeTimer = 0;
      return;
    }
    
    // Calculate direction away from threat
    const dx = this.position.x - this.lastDamageSource.x;
    const dy = this.position.y - this.lastDamageSource.y;
    const dz = this.position.z - this.lastDamageSource.z;
    
    // Normalize the direction
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist > 0) {
      const scale = 0.01 * deltaTime;
      this.velocity.x += (dx / dist) * scale;
      this.velocity.y += (dy / dist) * scale * 0.5; // Less vertical fleeing
      this.velocity.z += (dz / dist) * scale;
    }
    
    // Squirt ink if cooldown is ready
    if (this.inkCooldown <= 0 && this.isInWater) {
      this.squirtInk();
      
      // Start jet propulsion
      this.startJetPropulsion(dx, dy, dz, dist);
    }
  }
  
  /**
   * Start jet propulsion in a particular direction
   * @param {number} dx - X direction
   * @param {number} dy - Y direction
   * @param {number} dz - Z direction
   * @param {number} dist - Distance for normalization
   */
  startJetPropulsion(dx, dy, dz, dist) {
    this.isJet = true;
    this.jetTimer = 20; // 1 second of jetting
    
    // Set jet direction away from threat (normalized)
    this.jetDirection = {
      x: dx / dist,
      y: dy / dist,
      z: dz / dist
    };
    
    // Initial burst of speed
    this.velocity.x = this.jetDirection.x * this.swimSpeed * 2;
    this.velocity.y = this.jetDirection.y * this.swimSpeed;
    this.velocity.z = this.jetDirection.z * this.swimSpeed * 2;
  }
  
  /**
   * Handle jet propulsion physics
   * @param {number} deltaTime - Time since last update
   */
  handleJetPropulsion(deltaTime) {
    // Update jet timer
    this.jetTimer -= deltaTime;
    
    if (this.jetTimer <= 0) {
      // End jet propulsion
      this.isJet = false;
      return;
    }
    
    // Apply jet force
    const force = 0.02 * deltaTime;
    this.velocity.x += this.jetDirection.x * force;
    this.velocity.y += this.jetDirection.y * force;
    this.velocity.z += this.jetDirection.z * force;
  }
  
  /**
   * Squirt defensive ink
   */
  squirtInk() {
    // Reset ink cooldown
    this.inkCooldown = this.maxInkCooldown;
    
    // Emit a special event for ink effect
    this.emitEvent('squid_ink', {
      position: { ...this.position },
      radius: 3,
      duration: 100 // 5 seconds
    });
  }
  
  /**
   * Handle taking damage
   * @param {number} amount - Amount of damage
   * @param {Object} attacker - The attacking entity
   * @returns {boolean} Whether the squid died
   */
  takeDamage(amount, attacker) {
    // Get damage result from parent
    const died = super.takeDamage(amount, attacker);
    
    if (!died) {
      // Store attacker position for fleeing
      if (attacker && attacker.position) {
        this.lastDamageSource = { ...attacker.position };
        this.fleeTimer = 400; // 20 seconds
      }
    }
    
    return died;
  }
  
  /**
   * Get drops when killed
   * @returns {Array} Array of item drops
   */
  getDrops() {
    // 1-3 ink sacs
    const count = 1 + Math.floor(Math.random() * 3);
    return [
      { id: 'ink_sac', count: count }
    ];
  }
  
  /**
   * Check if this mob is passive
   * @returns {boolean} true
   */
  isPassive() {
    return true;
  }
  
  /**
   * Serialize for sending to client/saving
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      swimCycleTimer: this.swimCycleTimer,
      tentacleAngle: this.tentacleAngle,
      tentacleAnimation: this.tentacleAnimation,
      isInWater: this.isInWater,
      isJet: this.isJet
    };
  }
  
  /**
   * Deserialize from saved data
   * @param {Object} data - The data to deserialize from
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.swimCycleTimer !== undefined) this.swimCycleTimer = data.swimCycleTimer;
    if (data.tentacleAngle !== undefined) this.tentacleAngle = data.tentacleAngle;
    if (data.tentacleAnimation !== undefined) this.tentacleAnimation = data.tentacleAnimation;
    if (data.isInWater !== undefined) this.isInWater = data.isInWater;
    if (data.isJet !== undefined) this.isJet = data.isJet;
  }
}

/**
 * GlowSquid class - a glowing variant of the squid 
 * Added in the Caves & Cliffs Update
 */
class GlowSquid extends Squid {
  /**
   * Create a new GlowSquid
   * @param {Object} position - Initial position
   * @param {Object} options - Additional options
   */
  constructor(position, options = {}) {
    super(position, {
      type: 'glow_squid',
      ...options
    });
    
    // GlowSquid-specific properties
    this.glowIntensity = 1.0;
    this.glowTimer = 0;
    this.glowColor = options.glowColor || { r: 0.3, g: 0.7, b: 0.9 };
    this.particleSpawnTimer = 0;
    this.isHypnotized = false;
    this.hypnotizeTimer = 0;
    
    // Light level emitted by the GlowSquid
    this.lightLevel = 3;
  }
  
  /**
   * Update the glow squid's state
   * @param {Object} world - The game world
   * @param {Object} players - All players
   * @param {Object} mobs - All mobs
   * @param {number} deltaTime - Time since last update
   */
  update(world, players, mobs, deltaTime) {
    // Call parent update logic
    const result = super.update(world, players, mobs, deltaTime);
    
    if (this.dead) return result;
    
    // Update glow effect
    this.updateGlow(deltaTime);
    
    // Update hypnotized state
    if (this.isHypnotized) {
      this.hypnotizeTimer -= deltaTime;
      if (this.hypnotizeTimer <= 0) {
        this.isHypnotized = false;
      }
    }
    
    // Spawn glow particles
    this.spawnGlowParticles(world, deltaTime);
    
    return result;
  }
  
  /**
   * Update glow effect
   * @param {number} deltaTime - Time since last update
   */
  updateGlow(deltaTime) {
    // Pulsate glow
    this.glowTimer = (this.glowTimer + deltaTime * 0.05) % 360;
    
    // Glow intensity pulsation (between 0.7 and 1.0)
    this.glowIntensity = 0.7 + 0.3 * Math.sin(this.glowTimer) * Math.sin(this.glowTimer);
    
    // If hypnotized, increase glow intensity
    if (this.isHypnotized) {
      this.glowIntensity = Math.min(1.5, this.glowIntensity * 1.5);
    }
  }
  
  /**
   * Spawn glow particles around the squid
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update
   */
  spawnGlowParticles(world, deltaTime) {
    // Update particle timer
    this.particleSpawnTimer -= deltaTime;
    
    // Spawn particles periodically
    if (this.particleSpawnTimer <= 0 && world && this.isInWater) {
      // Reset timer (slower when hypnotized)
      this.particleSpawnTimer = this.isHypnotized ? 5 : 10;
      
      // Number of particles based on glow intensity
      const particleCount = Math.floor(1 + this.glowIntensity * 2);
      
      // Spawn particles if world has the method
      if (typeof world.spawnParticles === 'function') {
        world.spawnParticles(
          'glow',
          this.position.x,
          this.position.y + 0.5,
          this.position.z,
          particleCount,
          0.5,
          {
            color: this.glowColor,
            intensity: this.glowIntensity
          }
        );
      }
    }
  }
  
  /**
   * Handle taking damage
   * @param {number} amount - Amount of damage
   * @param {Object} attacker - The attacking entity
   * @returns {boolean} Whether the glow squid died
   */
  takeDamage(amount, attacker) {
    // End hypnotized state when damaged
    this.isHypnotized = false;
    
    // Temporarily increase glow when hit
    this.glowIntensity = 1.5;
    
    // Call parent damage handling
    return super.takeDamage(amount, attacker);
  }
  
  /**
   * Get drops when killed
   * @returns {Array} Array of item drops
   */
  getDrops() {
    // 1-3 glow ink sacs
    const count = 1 + Math.floor(Math.random() * 3);
    return [
      { id: 'glow_ink_sac', count: count }
    ];
  }
  
  /**
   * Handle when a player looks at the glow squid
   * @param {Object} player - The player
   */
  onPlayerLook(player) {
    // Only hypnotize if player is close enough
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const dz = player.position.z - this.position.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    
    if (distSq < 25) { // Within 5 blocks
      // Random chance of hypnosis effect
      if (Math.random() < 0.01) {
        this.hypnotizePlayer(player);
      }
    }
  }
  
  /**
   * Hypnotize a player
   * @param {Object} player - The player to hypnotize
   */
  hypnotizePlayer(player) {
    // Enter hypnotized state
    this.isHypnotized = true;
    this.hypnotizeTimer = 100; // 5 seconds
    
    // Send hypnosis effect to player
    if (player.socket) {
      player.socket.emit('screen_effect', {
        type: 'hypnosis',
        duration: 5,
        intensity: 0.7
      });
    }
    
    // Emit event for other systems
    this.emitEvent('glow_squid_hypnosis', {
      position: { ...this.position },
      player: player.id,
      duration: 5
    });
  }
  
  /**
   * Serialize for sending to client/saving
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      glowIntensity: this.glowIntensity,
      isHypnotized: this.isHypnotized,
      glowColor: this.glowColor
    };
  }
  
  /**
   * Deserialize from saved data
   * @param {Object} data - The data to deserialize from
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.glowIntensity !== undefined) this.glowIntensity = data.glowIntensity;
    if (data.isHypnotized !== undefined) this.isHypnotized = data.isHypnotized;
    if (data.glowColor !== undefined) this.glowColor = data.glowColor;
  }
}

// Export mob classes
module.exports = {
  Squid,
  GlowSquid
}; 