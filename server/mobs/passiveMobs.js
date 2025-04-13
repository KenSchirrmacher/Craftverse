// Passive mobs implementation
const MobBase = require('./mobBase');

// Sheep - a basic passive mob that drops wool when killed
class Sheep extends MobBase {
  constructor(position) {
    super('sheep', position, 8, 0.7); // type, position, health, speed
    this.woolColor = this.getRandomColor();
    this.hasWool = true;
    this.woolRegrowTimer = 0;
    this.eatingGrassTimer = 0;
    this.isEating = false;
    this.fleeHealth = 4; // Flee at half health
  }

  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);

    // Regrow wool over time
    if (!this.hasWool) {
      this.woolRegrowTimer += deltaTime;
      if (this.woolRegrowTimer >= 6000) { // 5 minutes (6000 ticks)
        this.hasWool = true;
        this.woolRegrowTimer = 0;
      }
    }

    // Randomly eat grass
    if (this.state === 'idle' && Math.random() < 0.001 && !this.isEating) {
      this.isEating = true;
      this.eatingGrassTimer = 40; // 2 seconds (40 ticks)
    }

    // Update eating animation
    if (this.isEating) {
      this.eatingGrassTimer -= deltaTime;
      if (this.eatingGrassTimer <= 0) {
        this.isEating = false;
        this.hasWool = true; // Eating grass regrows wool
      }
    }
  }

  getRandomColor() {
    const colors = [
      'white', 'orange', 'magenta', 'light_blue', 
      'yellow', 'lime', 'pink', 'gray', 
      'light_gray', 'cyan', 'purple', 'blue', 
      'brown', 'green', 'red', 'black'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getDrops() {
    const drops = [];
    
    // Drop wool if has wool
    if (this.hasWool) {
      drops.push({
        type: 'wool',
        color: this.woolColor,
        count: 1
      });
    }
    
    // Always drop raw mutton
    drops.push({
      type: 'raw_mutton',
      count: Math.floor(Math.random() * 2) + 1 // 1-2 raw mutton
    });
    
    return drops;
  }

  shear() {
    if (!this.hasWool) return null;
    
    this.hasWool = false;
    return {
      type: 'wool',
      color: this.woolColor,
      count: 1
    };
  }

  isPassive() {
    return true;
  }

  serialize() {
    return {
      ...super.serialize(),
      woolColor: this.woolColor,
      hasWool: this.hasWool,
      isEating: this.isEating
    };
  }
}

// Cow - drops leather and beef
class Cow extends MobBase {
  constructor(position) {
    super('cow', position, 10, 0.7); // type, position, health, speed
    this.fleeHealth = 5; // Flee at half health
  }

  getDrops() {
    return [
      {
        type: 'leather',
        count: Math.floor(Math.random() * 2) + 1 // 1-2 leather
      },
      {
        type: 'raw_beef',
        count: Math.floor(Math.random() * 3) + 1 // 1-3 raw beef
      }
    ];
  }

  isPassive() {
    return true;
  }
}

// Chicken - drops feathers and chicken
class Chicken extends MobBase {
  constructor(position) {
    super('chicken', position, 4, 0.5); // type, position, health, speed
    this.eggLayTimer = Math.floor(Math.random() * 6000) + 6000; // 5-10 minutes
    this.fleeHealth = 2; // Flee at half health
  }

  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);

    // Egg laying logic
    if (this.eggLayTimer > 0) {
      this.eggLayTimer -= deltaTime;
      if (this.eggLayTimer <= 0) {
        // Lay egg (would be implemented with item dropping)
        this.eggLayTimer = Math.floor(Math.random() * 6000) + 6000; // Reset timer
        return { type: 'layEgg', position: { ...this.position } };
      }
    }
  }

  getDrops() {
    return [
      {
        type: 'feather',
        count: Math.floor(Math.random() * 2) + 1 // 1-2 feathers
      },
      {
        type: 'raw_chicken',
        count: 1
      }
    ];
  }

  isPassive() {
    return true;
  }

  serialize() {
    return {
      ...super.serialize(),
      layingEgg: this.eggLayTimer < 20 // Is about to lay an egg
    };
  }
}

// Pig - drops porkchop
class Pig extends MobBase {
  constructor(position) {
    super('pig', position, 10, 0.6); // type, position, health, speed
    this.saddled = false;
    this.fleeHealth = 5; // Flee at half health
  }

  getDrops() {
    const drops = [
      {
        type: 'raw_porkchop',
        count: Math.floor(Math.random() * 3) + 1 // 1-3 raw porkchop
      }
    ];
    
    // Drop saddle if saddled
    if (this.saddled) {
      drops.push({
        type: 'saddle',
        count: 1
      });
    }
    
    return drops;
  }

  applySaddle() {
    if (!this.saddled) {
      this.saddled = true;
      return true;
    }
    return false;
  }

  isPassive() {
    return true;
  }

  serialize() {
    return {
      ...super.serialize(),
      saddled: this.saddled
    };
  }
}

// Squid - basic aquatic passive mob
class Squid extends MobBase {
  constructor(position) {
    super({
      type: 'squid',
      position,
      health: 10,
      maxHealth: 10,
      attackDamage: 0, // Passive mob, no attack
      attackRange: 0,
      detectionRange: 8,
      speed: 0.7, // Fast in water
      drops: {
        'ink_sac': { chance: 1.0, min: 1, max: 3 }
      },
      isHostile: false,
      isWaterMob: true
    });
    
    // Squid-specific properties
    this.swimTimer = 0;
    this.swimDirection = { x: 0, y: 0, z: 0 };
    this.inkCooldown = 0;
    this.maxInkCooldown = 600; // 30 seconds
    this.fleeingFrom = null;
    this.waterBreathingOnly = true; // Can only survive in water
    this.outOfWaterTimer = 0;
    this.maxOutOfWaterTime = 300; // 15 seconds before death
  }

  /**
   * Update the squid's state
   * @param {Object} world - The world object
   * @param {Object} players - Players object
   * @param {Number} deltaTime - Time since last update in ms
   */
  update(world, players, mobs, deltaTime) {
    // Convert time to ticks (assuming 20 ticks per second)
    const dt = deltaTime / 50;
    
    // Check if squid is in water
    const currentBlock = world.getBlockAt(this.position);
    const isInWater = currentBlock && currentBlock.type === 'water';
    
    // Handle out of water damage
    if (!isInWater) {
      this.outOfWaterTimer += dt;
      
      // After maxOutOfWaterTime, take damage every second
      if (this.outOfWaterTimer >= this.maxOutOfWaterTime && this.outOfWaterTimer % 20 < dt) {
        this.takeDamage(1, { type: 'suffocation' });
      }
      
      // Severely reduced movement out of water
      this.currentSpeed = 0.1;
    } else {
      this.outOfWaterTimer = 0;
      this.currentSpeed = this.speed;
    }
    
    // Ink cooldown
    if (this.inkCooldown > 0) {
      this.inkCooldown -= dt;
    }
    
    // Update swimming direction periodically
    this.swimTimer -= dt;
    if (this.swimTimer <= 0) {
      // Random swim direction
      if (!this.fleeingFrom) {
        this.swimDirection = {
          x: Math.random() * 2 - 1,
          y: Math.random() * 2 - 1,
          z: Math.random() * 2 - 1
        };
        this.swimTimer = Math.random() * 100 + 50; // 2.5-7.5 seconds
      }
    }
    
    // Apply swimming direction to movement
    if (isInWater && !this.dead) {
      this.velocity.x = this.swimDirection.x * this.currentSpeed;
      this.velocity.y = this.swimDirection.y * this.currentSpeed;
      this.velocity.z = this.swimDirection.z * this.currentSpeed;
    }
    
    // Call the parent update method for basic mob behavior
    super.update(world, players, mobs, deltaTime);
  }
  
  /**
   * Handle damage and fleeing when hit
   * @param {Number} amount - Damage amount
   * @param {Object} source - Damage source
   */
  takeDamage(amount, source) {
    const result = super.takeDamage(amount, source);
    
    // Release ink when damaged and cooldown is ready
    if (amount > 0 && this.inkCooldown <= 0 && !this.dead) {
      this.releaseInk(source);
    }
    
    // Start fleeing from damage source
    if (source && source.entityId) {
      this.fleeingFrom = source.entityId;
      
      // Flee in opposite direction
      if (source.position) {
        const directionToSource = {
          x: source.position.x - this.position.x,
          y: source.position.y - this.position.y,
          z: source.position.z - this.position.z
        };
        
        // Normalize and invert
        const length = Math.sqrt(
          directionToSource.x * directionToSource.x +
          directionToSource.y * directionToSource.y +
          directionToSource.z * directionToSource.z
        );
        
        if (length > 0) {
          this.swimDirection = {
            x: -directionToSource.x / length,
            y: -directionToSource.y / length,
            z: -directionToSource.z / length
          };
        }
        
        this.swimTimer = 100; // 5 seconds of fleeing
      }
    }
    
    return result;
  }
  
  /**
   * Release ink as a defense mechanism
   * @param {Object} source - Source of the damage
   */
  releaseInk(source) {
    // Create a "cloud" of ink around the squid
    // This would be implemented with a particle effect or status effect in the game
    
    // Set cooldown
    this.inkCooldown = this.maxInkCooldown;
    
    // Return an event that the server can handle
    return {
      type: 'releaseInk',
      position: { ...this.position },
      radius: 3
    };
  }
  
  /**
   * Check if the squid is passive
   * @returns {Boolean} - Always true for squid
   */
  isPassive() {
    return true;
  }
  
  /**
   * Serialize the squid for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      swimDirection: this.swimDirection,
      inkCooldown: this.inkCooldown,
      outOfWaterTimer: this.outOfWaterTimer
    };
  }
  
  /**
   * Deserialize data into this squid
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.swimDirection) this.swimDirection = data.swimDirection;
    if (data.inkCooldown !== undefined) this.inkCooldown = data.inkCooldown;
    if (data.outOfWaterTimer !== undefined) this.outOfWaterTimer = data.outOfWaterTimer;
  }
}

// GlowSquid - glowing variant of squid added in Caves & Cliffs update
class GlowSquid extends Squid {
  constructor(position) {
    super(position);
    
    // Override squid properties to make it a glow squid
    this.type = 'glow_squid';
    
    // Glow squid specific properties
    this.glowing = true;
    this.glowIntensity = 1.0; // Full brightness
    this.flashTimer = 0;
    
    // Glow squids drop glow ink sacs instead of regular ink sacs
    this.drops = {
      'glow_ink_sac': { chance: 1.0, min: 1, max: 3 }
    };
  }
  
  /**
   * Update the glow squid's state, adding glowing behavior
   * @param {Object} world - The world object
   * @param {Object} players - Players object
   * @param {Number} deltaTime - Time since last update in ms
   */
  update(world, players, mobs, deltaTime) {
    // Call parent update method
    super.update(world, players, mobs, deltaTime);
    
    // Convert time to ticks (assuming 20 ticks per second)
    const dt = deltaTime / 50;
    
    // Handle flash effect when damaged
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      
      // Pulsing glow effect during flash
      this.glowIntensity = 0.5 + 0.5 * Math.sin(this.flashTimer * 0.2);
      
      if (this.flashTimer <= 0) {
        this.glowIntensity = 1.0; // Reset to normal brightness
      }
    }
  }
  
  /**
   * Handle damage with special flashing effect
   * @param {Number} amount - Damage amount
   * @param {Object} source - Damage source
   */
  takeDamage(amount, source) {
    const result = super.takeDamage(amount, source);
    
    // Flash when damaged
    if (amount > 0 && !this.dead) {
      this.flashTimer = 60; // 3 seconds of flashing
    }
    
    return result;
  }
  
  /**
   * Release glow ink as a defense mechanism
   * @param {Object} source - Source of the damage
   */
  releaseInk(source) {
    // Create a "cloud" of glowing ink around the squid
    // This would be implemented with a particle effect in the game
    
    // Set cooldown
    this.inkCooldown = this.maxInkCooldown;
    
    // Return an event that the server can handle
    return {
      type: 'releaseGlowInk',
      position: { ...this.position },
      radius: 3
    };
  }
  
  /**
   * Serialize the glow squid for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      glowIntensity: this.glowIntensity,
      flashTimer: this.flashTimer
    };
  }
  
  /**
   * Deserialize data into this glow squid
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.glowIntensity !== undefined) this.glowIntensity = data.glowIntensity;
    if (data.flashTimer !== undefined) this.flashTimer = data.flashTimer;
  }
}

module.exports = {
  Sheep,
  Cow,
  Chicken,
  Pig,
  Squid,
  GlowSquid
}; 