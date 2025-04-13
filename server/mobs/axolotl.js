/**
 * Axolotl mob implementation
 * Underwater mob with unique behaviors:
 * - Plays dead when attacked
 * - Targets and attacks aquatic hostile mobs
 * - Regenerates health over time
 * - Can be captured in a bucket
 * - Has multiple color variants
 */

const MobBase = require('./mobBase');

class Axolotl extends MobBase {
  /**
   * Create a new Axolotl
   * @param {Object} position - Initial position {x, y, z}
   * @param {Object} options - Additional options
   */
  constructor(position, options = {}) {
    super({
      type: 'axolotl',
      position,
      health: 14,
      maxHealth: 14,
      attackDamage: 2,
      attackRange: 2,
      detectionRange: 16,
      speed: 0.3,
      drops: {
        // No drops by default, just experience
        experience: { min: 1, max: 3 }
      },
      armor: 0,
      isHostile: false, // Neutral toward players
      isWaterMob: true,
      ...options
    });
    
    // Axolotl-specific properties
    this.variant = options.variant || this.getRandomVariant();
    this.isPlayingDead = false;
    this.playDeadTimer = 0;
    this.maxPlayDeadTime = 120; // 6 seconds at 20 ticks/second
    this.lastDamageTime = 0;
    this.regenCooldown = 0;
    this.maxRegenCooldown = 120; // 6 seconds before regeneration starts
    this.isInWater = true; // Start assuming in water, will be updated in first tick
    this.landSuffocationTimer = 0;
    this.maxLandTime = 300; // 15 seconds before starting to take damage
    this.bucketable = true;
    this.targetingCooldown = 0;
    
    // Mobs that axolotls specifically target
    this.targetMobs = [
      'drowned', 'guardian', 'elder_guardian', 'squid', 'glow_squid', 
      'tropical_fish', 'pufferfish', 'salmon', 'cod'
    ];
  }
  
  /**
   * Get a random axolotl color variant
   * @returns {String} - The variant name
   * @private
   */
  getRandomVariant() {
    const variants = [
      'lucy', // Pink, most common (80%)
      'wild', // Brown (16%)
      'gold', // Gold (1.6%)
      'cyan', // Cyan (1.6%)
      'blue'  // Blue (0.8%), rare
    ];
    
    // Random number between 0 and 1
    const rand = Math.random();
    
    // Determine variant based on rarity
    if (rand < 0.008) {
      return 'blue'; // 0.8% chance
    } else if (rand < 0.024) {
      return 'cyan'; // 1.6% chance
    } else if (rand < 0.04) {
      return 'gold'; // 1.6% chance
    } else if (rand < 0.2) {
      return 'wild'; // 16% chance
    } else {
      return 'lucy'; // 80% chance
    }
  }
  
  /**
   * Update the axolotl's state
   * @param {Object} world - The world object
   * @param {Object} players - Players object
   * @param {Number} deltaTime - Time since last update in ms
   */
  update(world, players, deltaTime) {
    // Convert time to ticks (assuming 20 ticks per second)
    const dt = deltaTime / 50;
    
    // Check if axolotl is in water
    this.updateWaterState(world);
    
    // Handle playing dead state
    if (this.isPlayingDead) {
      this.playDeadTimer += dt;
      
      if (this.playDeadTimer >= this.maxPlayDeadTime) {
        this.stopPlayingDead();
      }
      
      // Don't do other updates while playing dead
      return;
    }
    
    // Handle land suffocation
    if (!this.isInWater) {
      this.landSuffocationTimer += dt;
      
      if (this.landSuffocationTimer >= this.maxLandTime) {
        // Take suffocation damage every second after maxLandTime
        if (this.landSuffocationTimer % 20 < dt) {
          this.takeDamage(1, { type: 'suffocation' });
        }
      }
    } else {
      this.landSuffocationTimer = 0;
    }
    
    // Health regeneration
    if (this.health < this.maxHealth) {
      if (this.regenCooldown > 0) {
        this.regenCooldown -= dt;
      } else {
        // Regenerate 1 health every 2 seconds
        this.healTimer = (this.healTimer || 0) + dt;
        if (this.healTimer >= 40) {
          this.healTimer = 0;
          this.health = Math.min(this.health + 1, this.maxHealth);
        }
      }
    }
    
    // Targeting cooldown
    if (this.targetingCooldown > 0) {
      this.targetingCooldown -= dt;
    }
    
    // Find and target aquatic mobs if in water and no active target
    if (this.isInWater && !this.target && this.targetingCooldown <= 0) {
      this.findAndTargetAquaticMob(world);
    }
    
    // Call the parent update method for basic mob behavior
    super.update(world, players, deltaTime);
  }
  
  /**
   * Check if the axolotl is in water
   * @param {Object} world - The world object
   * @private
   */
  updateWaterState(world) {
    const blockAt = world.getBlockAt(
      Math.floor(this.position.x),
      Math.floor(this.position.y),
      Math.floor(this.position.z)
    );
    
    this.isInWater = blockAt && (blockAt.type === 'water');
  }
  
  /**
   * Find and target nearby aquatic mobs
   * @param {Object} world - The world object
   * @private
   */
  findAndTargetAquaticMob(world) {
    const nearbyEntities = world.getEntitiesInRange(
      this.position,
      this.detectionRange
    );
    
    // Filter for valid targets - These include Squid and GlowSquid from passiveMobs.js
    const validTargets = nearbyEntities.filter(entity => 
      this.targetMobs.includes(entity.type) && 
      entity.id !== this.id &&
      !entity.dead
    );
    
    if (validTargets.length > 0) {
      // Sort by distance
      validTargets.sort((a, b) => {
        const distA = this.getDistanceTo(a.position);
        const distB = this.getDistanceTo(b.position);
        return distA - distB;
      });
      
      // Target the closest
      this.setTarget(validTargets[0]);
    }
  }
  
  /**
   * Start playing dead
   * @private
   */
  startPlayingDead() {
    this.isPlayingDead = true;
    this.playDeadTimer = 0;
    this.clearPath();
    this.target = null;
    
    // Emit event for client-side animation
    this.emitEvent('play_dead_start', {
      id: this.id,
      position: this.position
    });
  }
  
  /**
   * Stop playing dead
   * @private
   */
  stopPlayingDead() {
    this.isPlayingDead = false;
    
    // Emit event for client-side animation
    this.emitEvent('play_dead_stop', {
      id: this.id,
      position: this.position
    });
  }
  
  /**
   * Handle an attack against this mob
   * @param {Number} damage - Amount of damage
   * @param {Object} source - Source of the damage
   * @returns {Object} - Result of the attack
   */
  takeDamage(damage, source) {
    // Set last damage time for regeneration cooldown
    this.lastDamageTime = Date.now();
    this.regenCooldown = this.maxRegenCooldown;
    
    // Before applying damage, check if we should play dead
    if (!this.isPlayingDead && this.health - damage <= 2 && Math.random() < 0.5) {
      // 50% chance to play dead when health would drop below 2
      this.startPlayingDead();
      
      // Reduce damage significantly when playing dead
      damage = Math.max(0, damage - 3);
    }
    
    // Call parent method to apply actual damage
    return super.takeDamage(damage, source);
  }
  
  /**
   * Process an interaction with the axolotl
   * @param {Object} player - Player interacting
   * @param {Object} interaction - Interaction data
   * @returns {Object} - Result of interaction
   */
  processInteraction(player, interaction) {
    if (interaction.action === 'use_item' && interaction.itemId === 'water_bucket') {
      // Capture in water bucket
      return {
        success: true,
        message: 'Captured axolotl in bucket',
        removeEntity: true,
        giveItem: {
          id: 'axolotl_bucket',
          count: 1,
          variant: this.variant
        },
        consumeItem: true,
        replacementItem: 'bucket'
      };
    }
    
    // Handle breeding
    if (interaction.action === 'feed' && 
        (interaction.itemId === 'tropical_fish' || 
         interaction.itemId === 'tropical_fish_bucket')) {
      
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
    // Check if this axolotl can breed
    if (this.age < 0) {
      return { 
        success: false, 
        message: 'This axolotl is too young to breed'
      };
    }
    
    if (this.breedingCooldown > 0) {
      return { 
        success: false, 
        message: 'This axolotl cannot breed right now'
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
    
    // Check for nearby axolotls in love mode
    const world = player.world;
    const nearbyAxolotls = world.getEntitiesInRange(
      this.position,
      8,
      entity => entity.type === 'axolotl' && 
                entity.id !== this.id && 
                entity.loveMode && 
                !entity.isBreeding
    );
    
    // If found another axolotl in love mode, breed
    if (nearbyAxolotls.length > 0) {
      const partner = nearbyAxolotls[0];
      
      // Set breeding flags
      this.isBreeding = true;
      partner.isBreeding = true;
      
      // Set cooldowns
      this.breedingCooldown = 5 * 60 * 20; // 5 minutes
      partner.breedingCooldown = 5 * 60 * 20;
      
      // Create baby axolotl
      const babyPosition = {
        x: (this.position.x + partner.position.x) / 2,
        y: (this.position.y + partner.position.y) / 2,
        z: (this.position.z + partner.position.z) / 2
      };
      
      // Spawn baby with random variant from parents (10% chance for different variant)
      const parentVariants = [this.variant, partner.variant];
      const randomVariant = Math.random() < 0.1 ? this.getRandomVariant() : 
        parentVariants[Math.floor(Math.random() * 2)];
      
      world.spawnEntity('axolotl', babyPosition, {
        age: -24000, // Baby
        variant: randomVariant
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
        message: 'Axolotls bred successfully',
        consumeItem: true
      };
    }
    
    return {
      success: true,
      message: 'Axolotl is ready to breed',
      consumeItem: true
    };
  }
  
  /**
   * Get distance to another position
   * @param {Object} otherPos - Position to measure distance to
   * @returns {Number} - Distance
   * @private
   */
  getDistanceTo(otherPos) {
    const dx = this.position.x - otherPos.x;
    const dy = this.position.y - otherPos.y;
    const dz = this.position.z - otherPos.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Set target for the axolotl
   * @param {Object} target - Target entity
   * @private
   */
  setTarget(target) {
    this.target = target;
    this.isHostile = true; // Become hostile when targeting
    
    // Emit targeting event
    this.emitEvent('target_entity', {
      id: this.id,
      targetId: target.id
    });
  }
  
  /**
   * Attack the target
   * @param {Object} target - Target to attack
   * @returns {Object} - Attack result
   */
  attack(target) {
    // If target is an aquatic hostile mob, get temporary regeneration
    if (target && this.targetMobs.includes(target.type)) {
      // Apply regeneration effect to self
      this.applyStatusEffect({
        type: 'regeneration',
        duration: 100, // 5 seconds
        amplifier: 1    // Regeneration II
      });
    }
    
    // Call parent method for actual attack
    return super.attack(target);
  }
  
  /**
   * Serialize the axolotl for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      variant: this.variant,
      isPlayingDead: this.isPlayingDead,
      playDeadTimer: this.playDeadTimer,
      lastDamageTime: this.lastDamageTime,
      regenCooldown: this.regenCooldown,
      isInWater: this.isInWater,
      landSuffocationTimer: this.landSuffocationTimer
    };
  }
  
  /**
   * Deserialize data to restore the axolotl's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.variant) {
      this.variant = data.variant;
    }
    if (data.isPlayingDead !== undefined) {
      this.isPlayingDead = data.isPlayingDead;
    }
    if (data.playDeadTimer !== undefined) {
      this.playDeadTimer = data.playDeadTimer;
    }
    if (data.lastDamageTime !== undefined) {
      this.lastDamageTime = data.lastDamageTime;
    }
    if (data.regenCooldown !== undefined) {
      this.regenCooldown = data.regenCooldown;
    }
    if (data.isInWater !== undefined) {
      this.isInWater = data.isInWater;
    }
    if (data.landSuffocationTimer !== undefined) {
      this.landSuffocationTimer = data.landSuffocationTimer;
    }
  }
}

module.exports = Axolotl; 