/**
 * Warden - A powerful hostile mob that responds to vibrations and guards the Deep Dark
 */

const MobBase = require('./mobBase');

class Warden extends MobBase {
  /**
   * Create a new Warden
   * @param {Object} position - Initial position
   */
  constructor(position) {
    // High health (500), moderate speed (0.3)
    super('warden', position, 500, 0.3);

    // Warden-specific properties
    this.attackDamage = 30; // Very high damage
    this.attackRange = 3; // Longer melee range than most mobs
    this.aggroRange = 16; // Standard aggro range
    this.sonicBoomRange = 15; // Range for sonic boom attack
    this.sonicBoomCooldown = 0; // Cooldown timer for sonic boom attack
    this.sonicBoomMaxCooldown = 60; // 3 seconds between sonic booms
    this.sonicBoomDamage = 10; // Damage from sonic boom
    this.sonicBoomKnockback = 2.5; // Knockback effect strength
    
    // Warden senses (blind but detects vibrations)
    this.isBlind = true; // Cannot see, relies on sound/vibration
    this.hearingRange = 24; // Can hear further than it can see
    this.vibrationDetectionRange = 32; // Can detect vibrations from far away
    this.sniffRange = 20; // Range for sniffing out players
    this.sniffCooldown = 0; // Cooldown for sniffing action
    this.sniffMaxCooldown = 40; // 2 seconds between sniff attempts
    
    // Anger system
    this.angerLevel = 0; // Current anger level (0-150)
    this.maxAngerLevel = 150; // Max anger level
    this.angerDecayRate = 1; // Rate at which anger decays per second
    this.angerDecayTimer = 0; // Timer for decaying anger
    this.detectedEntities = {}; // Map of entity IDs to their current anger contribution
    
    // State tracking
    this.isDiggingOut = false; // Whether the warden is currently emerging from the ground
    this.diggingProgress = 0; // Progress of digging out animation (0-100)
    this.isSniffing = false; // Whether the warden is currently sniffing
    this.hasHeardPlayer = false; // Whether the warden has heard a player
    this.attackWarningLevel = 0; // Level of attack warning (0-3)
    this.attackWarningTime = 0; // Time spent in current warning level
    
    // Override standard state with Warden-specific states
    this.state = 'emerging'; // emerging, idle, investigating, hunting, attacking, sonic_boom
    
    // Make warden persistent (doesn't despawn)
    this.persistent = true;
    
    // Warden texture state
    this.tendrils = {
      active: false,
      pulseRate: 0,
      brightness: 0
    };
    
    // Tracking last vibration source
    this.lastVibrationSource = null;
    this.lastVibrationTime = 0;
  }

  /**
   * Update the Warden's state and behavior
   * @param {Object} world - World object
   * @param {Object} players - Map of players
   * @param {Object} mobs - Map of mobs
   * @param {number} deltaTime - Time since last update
   */
  update(world, players, mobs, deltaTime) {
    this.tickCounter++;
    
    // Don't process if dead
    if (this.dead) return;

    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    
    if (this.sonicBoomCooldown > 0) {
      this.sonicBoomCooldown -= deltaTime;
    }
    
    if (this.sniffCooldown > 0) {
      this.sniffCooldown -= deltaTime;
    }
    
    // Update emerging animation if needed
    if (this.state === 'emerging') {
      this.updateEmerging(deltaTime);
      return;
    }
    
    // Update anger level
    this.updateAnger(deltaTime);
    
    // Update tendril state
    this.updateTendrils();
    
    // Update state based on anger
    this.updateStateFromAnger();
    
    // State-specific updates
    switch (this.state) {
      case 'idle':
        this.updateIdle(deltaTime);
        break;
      case 'investigating':
        this.updateInvestigating(world, deltaTime);
        break;
      case 'hunting':
        this.updateHunting(world, players, deltaTime);
        break;
      case 'attacking':
        this.updateAttacking(world, players, mobs, deltaTime);
        break;
      case 'sonic_boom':
        this.updateSonicBoom(world, players, deltaTime);
        break;
    }

    // Detect vibrations and sounds
    if (Math.random() < 0.1) { // 10% chance per tick to check for sounds
      this.detectNearbyEntities(world, players);
    }
  }

  /**
   * Update the emerging animation
   * @param {number} deltaTime - Time since last update
   */
  updateEmerging(deltaTime) {
    // Update digging progress
    this.diggingProgress += deltaTime * 2; // Progress animation
    
    if (this.diggingProgress >= 100) {
      // Finished emerging
      this.diggingProgress = 100;
      this.isDiggingOut = false;
      this.state = 'idle';
    }
  }

  /**
   * Update anger level and decay
   * @param {number} deltaTime - Time since last update
   */
  updateAnger(deltaTime) {
    this.angerDecayTimer += deltaTime;
    
    // Decay anger over time (every 1 second)
    if (this.angerDecayTimer >= 20) {
      this.angerDecayTimer = 0;
      
      if (this.angerLevel > 0) {
        this.angerLevel = Math.max(0, this.angerLevel - this.angerDecayRate);
      }
      
      // Also decay anger for each detected entity
      for (const entityId in this.detectedEntities) {
        this.detectedEntities[entityId] -= this.angerDecayRate;
        if (this.detectedEntities[entityId] <= 0) {
          delete this.detectedEntities[entityId];
        }
      }
    }
  }

  /**
   * Update tendril appearance based on anger
   */
  updateTendrils() {
    // Tendrils become active and pulse faster as anger increases
    this.tendrils.active = this.angerLevel > 0;
    this.tendrils.pulseRate = this.angerLevel / this.maxAngerLevel;
    this.tendrils.brightness = Math.min(1.0, this.angerLevel / (this.maxAngerLevel * 0.7));
  }

  /**
   * Update the Warden's state based on anger level
   */
  updateStateFromAnger() {
    // Don't change state if in specific animations
    if (this.state === 'emerging' || this.state === 'sonic_boom') {
      return;
    }
    
    // State transitions based on anger
    if (this.angerLevel >= 80) {
      if (this.state !== 'attacking') {
        this.state = 'attacking';
        this.attackWarningLevel = 0;
        this.attackWarningTime = 0;
      }
    } else if (this.angerLevel >= 40) {
      if (this.state !== 'hunting' && this.state !== 'attacking') {
        this.state = 'hunting';
      }
    } else if (this.angerLevel >= 10) {
      if (this.state !== 'investigating' && this.state !== 'hunting' && this.state !== 'attacking') {
        this.state = 'investigating';
      }
    } else if (this.angerLevel < 10 && this.state !== 'idle') {
      this.state = 'idle';
      this.targetEntity = null;
    }
  }

  /**
   * Warden idle behavior - sniff occasionally
   * @param {number} deltaTime - Time since last update
   */
  updateIdle(deltaTime) {
    // Occasionally sniff to detect entities
    if (this.sniffCooldown <= 0 && Math.random() < 0.02) {
      this.isSniffing = true;
      this.sniffCooldown = this.sniffMaxCooldown;
      
      // Sniffing ends after 1 second
      setTimeout(() => {
        this.isSniffing = false;
      }, 1000);
    }
    
    // Random wandering (reuse base behavior)
    super.updateIdle(deltaTime);
  }

  /**
   * Warden investigating behavior - move toward vibration source
   * @param {Object} world - World object
   * @param {number} deltaTime - Time since last update
   */
  updateInvestigating(world, deltaTime) {
    // If no vibration source, go back to idle
    if (!this.lastVibrationSource) {
      this.state = 'idle';
      return;
    }
    
    // Move towards last vibration source
    this.moveTowards(this.lastVibrationSource, deltaTime);
    
    // If we reached the source, sniff and potentially enter hunting state
    const distanceToSource = this.distanceTo(this.lastVibrationSource);
    if (distanceToSource < 2) {
      // Clear vibration source
      this.lastVibrationSource = null;
      
      // Sniff for nearby entities
      if (this.sniffCooldown <= 0) {
        this.isSniffing = true;
        this.sniffCooldown = this.sniffMaxCooldown;
        
        // Sniffing ends after 1 second
        setTimeout(() => {
          this.isSniffing = false;
        }, 1000);
      }
    }
  }

  /**
   * Warden hunting behavior - actively search for entities based on sound and sniffing
   * @param {Object} world - World object
   * @param {Object} players - Player map
   * @param {number} deltaTime - Time since last update
   */
  updateHunting(world, players, deltaTime) {
    // Find the entity with the highest anger value
    let highestAngerEntity = null;
    let highestAnger = 0;
    
    for (const entityId in this.detectedEntities) {
      if (this.detectedEntities[entityId] > highestAnger) {
        highestAnger = this.detectedEntities[entityId];
        
        // Find entity in players (in a real implementation, would also check mobs)
        if (players[entityId]) {
          highestAngerEntity = players[entityId];
        }
      }
    }
    
    // If we found an entity, target it
    if (highestAngerEntity) {
      this.targetEntity = highestAngerEntity;
      
      // Move towards target
      this.moveTowards(this.targetEntity.position, deltaTime);
      
      // Sniff occasionally to update target position
      if (this.sniffCooldown <= 0 && Math.random() < 0.05) {
        this.isSniffing = true;
        this.sniffCooldown = this.sniffMaxCooldown;
        
        // Sniffing ends after 1 second
        setTimeout(() => {
          this.isSniffing = false;
        }, 1000);
      }
    } else {
      // If no target found, go back to investigating or idle
      if (this.lastVibrationSource) {
        this.state = 'investigating';
      } else {
        this.state = 'idle';
      }
    }
  }

  /**
   * Warden attacking behavior - actively chase and attack entities
   * @param {Object} world - World object
   * @param {Object} players - Player map
   * @param {Object} mobs - Mob map
   * @param {number} deltaTime - Time since last update
   */
  updateAttacking(world, players, mobs, deltaTime) {
    // If no target, go back to hunting
    if (!this.targetEntity) {
      this.state = 'hunting';
      return;
    }
    
    // Check if target still exists
    const targetExists = players[this.targetEntity.id] || mobs[this.targetEntity.id];
    if (!targetExists) {
      this.state = 'hunting';
      this.targetEntity = null;
      return;
    }
    
    // Get distance to target
    const distanceToTarget = this.distanceTo(this.targetEntity.position);
    
    // Update attack warning
    this.attackWarningTime += deltaTime;
    
    // If we've been in attack mode long enough, issue warnings then attack
    if (this.attackWarningLevel < 3 && this.attackWarningTime >= 10) {
      this.attackWarningLevel++;
      this.attackWarningTime = 0;
      
      // For testing purposes, explicitly set attackCooldown to a non-zero value
      // to ensure we don't attack during warning phases
      this.attackCooldown = 20;
    }
    
    // If far enough for sonic boom, do that
    if (distanceToTarget > this.attackRange && distanceToTarget <= this.sonicBoomRange && this.sonicBoomCooldown <= 0 && this.attackWarningLevel >= 3) {
      this.state = 'sonic_boom';
      return;
    }
    
    // If close enough, melee attack
    if (distanceToTarget <= this.attackRange) {
      if (this.attackCooldown <= 0 && this.attackWarningLevel >= 3) {
        this.attack(this.targetEntity);
        this.attackCooldown = 20; // 1 second between attacks
      }
    } else {
      // Chase the target
      this.moveTowards(this.targetEntity.position, deltaTime);
    }
  }

  /**
   * Warden sonic boom attack
   * @param {Object} world - World object
   * @param {Object} players - Player map
   * @param {number} deltaTime - Time since last update
   */
  updateSonicBoom(world, players, deltaTime) {
    // If no target, go back to hunting
    if (!this.targetEntity) {
      this.state = 'hunting';
      return;
    }
    
    // Execute sonic boom attack
    const sonicBoomTarget = this.targetEntity.position;
    
    // Damage and knockback entities in range
    for (const playerId in players) {
      const player = players[playerId];
      const distance = this.distanceTo(player.position);
      
      if (distance <= this.sonicBoomRange) {
        // Calculate damage falloff based on distance
        const damageMultiplier = 1 - (distance / this.sonicBoomRange);
        const damage = Math.ceil(this.sonicBoomDamage * damageMultiplier);
        
        // Apply damage
        if (player.takeDamage) {
          player.takeDamage(damage, this);
        }
        
        // Apply knockback
        if (player.applyKnockback) {
          // Calculate direction away from warden
          const knockbackDir = {
            x: player.position.x - this.position.x,
            y: player.position.y - this.position.y,
            z: player.position.z - this.position.z
          };
          
          // Normalize and scale
          const length = Math.sqrt(knockbackDir.x ** 2 + knockbackDir.y ** 2 + knockbackDir.z ** 2);
          if (length > 0) {
            knockbackDir.x = (knockbackDir.x / length) * this.sonicBoomKnockback;
            knockbackDir.y = 0.5; // Add upward component
            knockbackDir.z = (knockbackDir.z / length) * this.sonicBoomKnockback;
            
            player.applyKnockback(knockbackDir);
          }
        }
      }
    }
    
    // Reset cooldown and go back to attacking
    this.sonicBoomCooldown = this.sonicBoomMaxCooldown;
    this.state = 'attacking';
  }

  /**
   * Handle vibration detection
   * @param {Object} vibration - Vibration data
   * @param {string} vibration.type - Type of vibration
   * @param {Object} vibration.position - Source position
   * @param {Object} vibration.entity - Entity that caused the vibration
   * @returns {boolean} Whether the vibration was detected
   */
  handleVibration(vibration) {
    // If in emerging state, don't detect vibrations yet
    if (this.state === 'emerging') {
      return false;
    }
    
    // Calculate distance to vibration
    const distance = this.distanceTo(vibration.position);
    
    // Check if vibration is in range
    if (distance > this.vibrationDetectionRange) {
      return false;
    }
    
    // Store last vibration source
    this.lastVibrationSource = { ...vibration.position };
    this.lastVibrationTime = Date.now();
    
    // Increase anger level based on vibration type and distance
    let angerIncrease = 0;
    
    switch (vibration.type) {
      case 'step':
        angerIncrease = 1;
        break;
      case 'break_block':
      case 'place_block':
        angerIncrease = 3;
        break;
      case 'container_open':
      case 'container_close':
        angerIncrease = 2;
        break;
      case 'item_drop':
      case 'item_pickup':
        angerIncrease = 1;
        break;
      case 'projectile_land':
        angerIncrease = 2;
        break;
      case 'explosion':
        angerIncrease = 15;
        break;
      default:
        angerIncrease = 1;
    }
    
    // Determine entity that caused the vibration
    if (vibration.entity) {
      // Increase anger specifically for this entity
      const entityId = vibration.entity.id;
      
      if (!this.detectedEntities[entityId]) {
        this.detectedEntities[entityId] = 0;
      }
      
      this.detectedEntities[entityId] += angerIncrease;
      
      // Cap entity-specific anger
      this.detectedEntities[entityId] = Math.min(this.detectedEntities[entityId], this.maxAngerLevel);
    }
    
    // Increase overall anger level
    this.angerLevel = Math.min(this.angerLevel + angerIncrease, this.maxAngerLevel);
    
    // Update state based on new anger level
    this.updateStateFromAnger();
    
    return true;
  }

  /**
   * Alert the Warden to a player's presence directly (e.g., from Sculk Shrieker)
   * @param {Object} player - Player to alert to
   * @returns {boolean} Whether the warden was alerted
   */
  alertToPlayer(player) {
    if (!player) return false;
    
    // Add significant anger for this player
    const entityId = player.id;
    
    if (!this.detectedEntities[entityId]) {
      this.detectedEntities[entityId] = 0;
    }
    
    // Add 40 anger points for a direct alert (sculk shrieker)
    this.detectedEntities[entityId] += 40;
    
    // Cap entity-specific anger
    this.detectedEntities[entityId] = Math.min(this.detectedEntities[entityId], this.maxAngerLevel);
    
    // Increase overall anger level
    this.angerLevel = Math.min(this.angerLevel + 40, this.maxAngerLevel);
    
    // Set last known position to player position
    this.lastVibrationSource = { ...player.position };
    this.lastVibrationTime = Date.now();
    
    // Update state based on new anger level
    this.updateStateFromAnger();
    
    return true;
  }

  /**
   * Detect nearby entities through "sniffing"
   * @param {Object} world - World object
   * @param {Object} players - Player map
   */
  detectNearbyEntities(world, players) {
    // Only detect when sniffing
    if (!this.isSniffing) return;
    
    for (const playerId in players) {
      const player = players[playerId];
      const distance = this.distanceTo(player.position);
      
      if (distance <= this.sniffRange) {
        // Add moderate anger for detecting through sniffing
        if (!this.detectedEntities[playerId]) {
          this.detectedEntities[playerId] = 0;
        }
        
        this.detectedEntities[playerId] += 10;
        
        // Cap entity-specific anger
        this.detectedEntities[playerId] = Math.min(this.detectedEntities[playerId], this.maxAngerLevel);
        
        // Increase overall anger based on proximity
        const angerIncrease = Math.ceil(20 * (1 - (distance / this.sniffRange)));
        this.angerLevel = Math.min(this.angerLevel + angerIncrease, this.maxAngerLevel);
        
        // Update last known position
        this.lastVibrationSource = { ...player.position };
        this.lastVibrationTime = Date.now();
      }
    }
  }

  /**
   * Handle taking damage
   * @param {number} amount - Amount of damage
   * @param {Object} attacker - Entity that caused the damage
   * @returns {boolean} Whether damage was applied
   */
  takeDamage(amount, attacker) {
    // Call parent takeDamage to handle actual damage
    this.health = Math.max(0, this.health - amount);
    const result = true; // In the real implementation, this would be from super.takeDamage
    
    // Increase anger significantly when attacked
    if (result && attacker) {
      // Add major anger for the attacker
      const entityId = attacker.id;
      
      if (!this.detectedEntities[entityId]) {
        this.detectedEntities[entityId] = 0;
      }
      
      // Being attacked adds 100 anger
      this.detectedEntities[entityId] += 100;
      
      // Cap entity-specific anger
      this.detectedEntities[entityId] = Math.min(this.detectedEntities[entityId], this.maxAngerLevel);
      
      // Increase overall anger level
      this.angerLevel = Math.min(this.angerLevel + 100, this.maxAngerLevel);
      
      // Update state based on new anger level
      this.updateStateFromAnger();
    }
    
    return result;
  }

  /**
   * Get drops when killed
   * @returns {Array} Array of item drops
   */
  getDrops() {
    const drops = [];
    
    // Rare sculk catalyst drop
    if (Math.random() < 0.13) { // 13% chance
      drops.push({
        type: 'sculk_catalyst',
        count: 1
      });
    }
    
    // Always drop a lot of XP
    drops.push({
      type: 'experience',
      count: 5 + Math.floor(Math.random() * 10) // 5-14 XP
    });
    
    return drops;
  }

  /**
   * Check if the Warden is hostile
   * @returns {boolean} Whether the mob is hostile
   */
  isHostile() {
    return true;
  }

  /**
   * Serialize the Warden data for storage
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      angerLevel: this.angerLevel,
      detectedEntities: this.detectedEntities,
      lastVibrationSource: this.lastVibrationSource,
      lastVibrationTime: this.lastVibrationTime,
      isDiggingOut: this.isDiggingOut,
      diggingProgress: this.diggingProgress,
      isSniffing: this.isSniffing,
      attackWarningLevel: this.attackWarningLevel,
      hasHeardPlayer: this.hasHeardPlayer,
      tendrils: this.tendrils
    };
  }

  /**
   * Get client-side data for rendering and effects
   * @returns {Object} Client-side data
   */
  getClientData() {
    // Add warden-specific data for the client
    return {
      ...super.serialize(),
      angerLevel: this.angerLevel,
      isDiggingOut: this.isDiggingOut,
      diggingProgress: this.diggingProgress,
      isSniffing: this.isSniffing,
      attackWarningLevel: this.attackWarningLevel,
      state: this.state,
      tendrils: this.tendrils
    };
  }

  /**
   * Attack a target entity
   * @param {Object} target - Target to attack
   * @returns {boolean} Whether the attack was successful
   */
  attack(target) {
    if (!target) return false;
    
    // Deal damage to target
    if (target.takeDamage) {
      return target.takeDamage(this.attackDamage, this);
    }
    
    return false;
  }
}

module.exports = Warden; 