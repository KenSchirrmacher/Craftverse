// Neutral mobs implementation
const MobBase = require('./mobBase');

// Wolf - can be tamed or will attack when provoked
class Wolf extends MobBase {
  constructor(position) {
    super('wolf', position, 8, 0.9); // type, position, health, speed
    this.tamed = false;
    this.owner = null;
    this.sitting = false;
    this.angry = false;
    this.attackDamage = 2;
    this.attackRange = 1.5;
    this.aggroRange = 8;
    this.collarColor = 'red'; // Default collar color
    
    // Wolf armor properties - part of 1.22 Sorcery Update
    this.armor = null; // The equipped armor item
    this.armorValue = 0; // Current armor protection value
  }

  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);

    // If sitting, don't move
    if (this.sitting) {
      this.state = 'idle';
      return;
    }

    // If tamed, follow owner
    if (this.tamed && this.owner && !this.sitting) {
      const owner = players[this.owner];
      if (owner) {
        const distanceToOwner = this.distanceTo(owner.position);
        
        // Follow owner if too far away
        if (distanceToOwner > 3 && distanceToOwner < 20) {
          this.targetEntity = owner;
          this.state = 'follow';
        } else if (distanceToOwner <= 3) {
          // Stay close to owner but don't follow too closely
          this.state = 'idle';
        }
        
        // Teleport to owner if too far away
        if (distanceToOwner > 20) {
          this.position = {
            x: owner.position.x + (Math.random() * 2 - 1),
            y: owner.position.y,
            z: owner.position.z + (Math.random() * 2 - 1)
          };
        }
      }
    }

    // Check for potential targets (sheep, rabbits)
    if (!this.tamed && this.state === 'idle' && Math.random() < 0.01) {
      let nearestPrey = null;
      let shortestDistance = this.aggroRange;
      
      for (const mobId in mobs) {
        const mob = mobs[mobId];
        if ((mob.type === 'sheep' || mob.type === 'rabbit') && !mob.dead) {
          const distance = this.distanceTo(mob.position);
          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestPrey = mob;
          }
        }
      }
      
      if (nearestPrey) {
        this.targetEntity = nearestPrey;
        this.state = 'follow';
      }
    }
  }

  // Try to tame the wolf with a bone
  tryTame(playerId) {
    if (this.tamed) return false;
    
    // 1/3 chance to tame
    if (Math.random() < 0.33) {
      this.tamed = true;
      this.owner = playerId;
      this.angry = false;
      return true;
    }
    
    return false;
  }

  // Set sitting state
  toggleSitting() {
    if (!this.tamed) return false;
    
    this.sitting = !this.sitting;
    return this.sitting;
  }

  // Set collar color
  setCollarColor(color) {
    if (!this.tamed) return false;
    
    this.collarColor = color;
    return true;
  }

  /**
   * Equip armor on the wolf
   * @param {WolfArmorItem} armorItem - The armor item to equip
   * @returns {boolean} Whether the armor was successfully equipped
   */
  equipArmor(armorItem) {
    // Can only equip armor if tamed
    if (!this.tamed) return false;
    
    // Check if it's a valid wolf armor item
    if (!armorItem || armorItem.type !== 'wolf_armor') return false;
    
    // Remove current armor if any
    const oldArmor = this.armor;
    
    // Equip the new armor
    this.armor = armorItem;
    this.armorValue = armorItem.armorValue;
    
    // Return the old armor if any
    return true;
  }
  
  /**
   * Remove armor from the wolf
   * @returns {Object|null} The removed armor item or null if no armor was equipped
   */
  removeArmor() {
    // Can only remove armor if tamed
    if (!this.tamed || !this.armor) return null;
    
    const oldArmor = this.armor;
    this.armor = null;
    this.armorValue = 0;
    
    return oldArmor;
  }
  
  /**
   * Check if the wolf has armor equipped
   * @returns {boolean} Whether the wolf has armor equipped
   */
  hasArmor() {
    return this.armor !== null;
  }
  
  /**
   * Get information about the equipped armor
   * @returns {Object|null} Armor information or null if no armor is equipped
   */
  getArmorInfo() {
    if (!this.armor) return null;
    
    return {
      id: this.armor.id,
      name: this.armor.name,
      armorValue: this.armor.armorValue,
      durability: this.armor.durability,
      maxDurability: this.armor.maxDurability,
      material: this.armor.armorMaterial,
      trim: this.armor.trim
    };
  }

  takeDamage(amount, attacker) {
    // If tamed, become angry at attacker unless it's the owner
    if (this.tamed && attacker.id !== this.owner) {
      this.angry = true;
      this.targetEntity = attacker;
      this.state = 'attack';
    } 
    
    // If not tamed, always become angry
    if (!this.tamed) {
      this.angry = true;
      this.targetEntity = attacker;
      this.state = 'attack';
    }
    
    // Apply damage reduction from armor if equipped
    let reducedAmount = amount;
    if (this.armorValue > 0) {
      // Calculate damage reduction (similar to player armor formula)
      // Each armor point reduces damage by 4%
      const damageReduction = Math.min(0.8, this.armorValue * 0.04); // Cap at 80% reduction
      reducedAmount = Math.max(1, Math.floor(amount * (1 - damageReduction)));
      
      // Damage the armor
      if (this.armor) {
        const armorDamaged = this.armor.reduceDurability(1);
        
        // If armor broke, remove it
        if (armorDamaged) {
          this.armor = null;
          this.armorValue = 0;
        }
      }
    }
    
    return super.takeDamage(reducedAmount, attacker);
  }

  getDrops() {
    return [];
  }

  isNeutral() {
    return true;
  }

  serialize() {
    const armorData = this.armor ? this.armor.toJSON() : null;
    
    return {
      ...super.serialize(),
      tamed: this.tamed,
      owner: this.owner,
      sitting: this.sitting,
      angry: this.angry,
      collarColor: this.collarColor,
      armor: armorData,
      armorValue: this.armorValue
    };
  }
  
  /**
   * Deserialize wolf data
   * @param {Object} data - The serialized data
   */
  static deserialize(data) {
    const wolf = new Wolf(data.position);
    wolf.id = data.id;
    wolf.tamed = data.tamed;
    wolf.owner = data.owner;
    wolf.sitting = data.sitting;
    wolf.angry = data.angry;
    wolf.collarColor = data.collarColor;
    wolf.health = data.health;
    wolf.maxHealth = data.maxHealth;
    
    // Deserialize armor if present
    if (data.armor) {
      // Temporarily set armor value (armor item will be loaded separately)
      wolf.armorValue = data.armorValue;
    }
    
    return wolf;
  }
}

// Spider - hostile at night, neutral during day
class Spider extends MobBase {
  constructor(position) {
    super('spider', position, 16, 1.1); // type, position, health, speed
    this.attackDamage = 2;
    this.attackRange = 1.2;
    this.aggroRange = 12;
    this.canClimb = true;
    this.daytime = true; // Track if it's day or night
  }

  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);

    // If it's night time, actively hunt players
    if (!this.daytime && this.state === 'idle' && Math.random() < 0.05) {
      // Find the closest player
      let closestPlayer = null;
      let shortestDistance = this.aggroRange;
      
      for (const playerId in players) {
        const player = players[playerId];
        const distance = this.distanceTo(player.position);
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          closestPlayer = player;
        }
      }
      
      if (closestPlayer) {
        this.targetEntity = closestPlayer;
        this.state = 'follow';
      }
    }
  }

  // Update day/night status
  updateDaytime(isDaytime) {
    this.daytime = isDaytime;
    
    // If becoming day and currently attacking, reset state
    if (isDaytime && (this.state === 'attack' || this.state === 'follow')) {
      this.state = 'idle';
      this.targetEntity = null;
    }
  }

  getDrops() {
    const drops = [
      {
        type: 'string',
        count: Math.floor(Math.random() * 2) + 1 // 1-2 string
      }
    ];
    
    // Small chance to drop spider eye
    if (Math.random() < 0.33) {
      drops.push({
        type: 'spider_eye',
        count: 1
      });
    }
    
    return drops;
  }

  isNeutral() {
    return this.daytime; // Neutral during day
  }

  isHostile() {
    return !this.daytime; // Hostile at night
  }

  serialize() {
    return {
      ...super.serialize(),
      daytime: this.daytime,
      canClimb: this.canClimb
    };
  }
}

// Enderman - neutral until provoked or looked at
class Enderman extends MobBase {
  constructor(position) {
    super('enderman', position, 40, 1.0); // type, position, health, speed
    this.attackDamage = 4;
    this.attackRange = 1.5;
    this.aggroRange = 64; // Can see player from far away
    this.heldBlock = Math.random() < 0.1 ? this.getRandomBlock() : null;
    this.staredAt = false;
    this.stareTimer = 0;
    this.teleportCooldown = 0;
  }

  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);

    // Update teleport cooldown
    if (this.teleportCooldown > 0) {
      this.teleportCooldown -= deltaTime;
    }

    // Check if any player is looking at the enderman
    for (const playerId in players) {
      const player = players[playerId];
      
      // Skip if player is too far
      if (this.distanceTo(player.position) > this.aggroRange) continue;
      
      // Check if player is looking at enderman
      const lookingAt = this.isPlayerLookingAt(player);
      
      if (lookingAt && !this.staredAt) {
        this.staredAt = true;
        this.stareTimer = 40; // 2 second stare timer
      } else if (lookingAt && this.staredAt) {
        this.stareTimer -= deltaTime;
        if (this.stareTimer <= 0) {
          // Become aggressive
          this.targetEntity = player;
          this.state = 'attack';
          this.teleportBehindPlayer(player);
        }
      } else if (this.staredAt) {
        // Player looked away
        this.staredAt = false;
      }
    }

    // Random teleport when taking damage
    if (this.health < this.maxHealth && Math.random() < 0.05 && this.teleportCooldown <= 0) {
      this.teleportRandomly();
      this.teleportCooldown = 100; // 5 seconds cooldown
    }

    // Random block picking/placing
    if (this.state === 'idle' && Math.random() < 0.001) {
      if (this.heldBlock) {
        // Place block
        this.heldBlock = null;
      } else {
        // Pick up block
        this.heldBlock = this.getRandomBlock();
      }
    }
  }

  isPlayerLookingAt(player) {
    // Calculate vector from player to enderman
    const dx = this.position.x - player.position.x;
    const dy = this.position.y - player.position.y;
    const dz = this.position.z - player.position.z;
    
    // Calculate distance
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Check if player is looking in the direction of the enderman
    // This is simplified - would need vector dot product in a real impl
    const playerLookingAt = Math.abs(Math.atan2(dx, dz) - player.rotation.y) < 0.2;
    
    return playerLookingAt && distance < 32;
  }

  teleportBehindPlayer(player) {
    // Get player direction
    const angle = player.rotation.y;
    
    // Calculate position behind player
    const distance = 2; // 2 blocks behind
    const x = player.position.x - Math.sin(angle) * distance;
    const z = player.position.z - Math.cos(angle) * distance;
    
    // Teleport
    this.position = {
      x,
      y: player.position.y,
      z
    };
    
    // Face player
    this.rotation.y = (angle + Math.PI) % (2 * Math.PI);
    
    return true;
  }

  teleportRandomly() {
    // Teleport to a random position within 32 blocks
    const range = 32;
    this.position = {
      x: this.position.x + (Math.random() * 2 - 1) * range,
      y: this.position.y,
      z: this.position.z + (Math.random() * 2 - 1) * range
    };
    
    return true;
  }

  getRandomBlock() {
    const blocks = ['grass', 'dirt', 'sand', 'gravel', 'clay', 'stone'];
    return blocks[Math.floor(Math.random() * blocks.length)];
  }

  takeDamage(amount, attacker) {
    // Teleport away when taking damage
    if (Math.random() < 0.5 && this.teleportCooldown <= 0) {
      this.teleportRandomly();
      this.teleportCooldown = 100; // 5 seconds cooldown
    }
    
    return super.takeDamage(amount, attacker);
  }

  getDrops() {
    const drops = [
      {
        type: 'ender_pearl',
        count: Math.random() < 0.5 ? 1 : 0 // 50% chance to drop 1 ender pearl
      }
    ];
    
    return drops;
  }

  isNeutral() {
    return !this.staredAt;
  }

  isHostile() {
    return this.staredAt;
  }

  serialize() {
    return {
      ...super.serialize(),
      heldBlock: this.heldBlock,
      staredAt: this.staredAt
    };
  }
}

// Goat - mountain dwelling neutral mob added in Caves & Cliffs update
class Goat extends MobBase {
  /**
   * Create a new Goat mob
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
      speed: 0.4, // Base speed
      drops: {
        'milk_bucket': { chance: 0.0 }, // Can be milked but doesn't drop anything when killed
        'experience': { min: 1, max: 3 }
      },
      isHostile: false, // Neutral by default, becomes hostile if attacked
      ...options
    });
    
    // Goat-specific properties
    this.isScreamer = options.isScreamer || Math.random() < 0.02; // 2% chance of being a screamer goat
    this.ramCooldown = 0;
    this.maxRamCooldown = 300; // 15 seconds
    this.ramChargeTime = 0;
    this.isRamming = false;
    this.ramTarget = null;
    this.jumpCooldown = 0;
    this.maxJumpCooldown = 100; // 5 seconds
    this.jumpStrength = 0.7;
    this.hornTimer = 0; // Timer to track horn growth
    this.hasHorns = options.hasHorns !== undefined ? options.hasHorns : true; // Most goats have horns
    this.milkTimer = options.milkTimer || 0;
    this.canBeMilked = options.canBeMilked || false;
    this.isBaby = options.isBaby || false;
    
    // Adjust properties for baby goats
    if (this.isBaby) {
      this.health = 5;
      this.maxHealth = 5;
      this.attackDamage = 1;
      this.speed = 0.5; // Babies are slightly faster
      this.jumpStrength = 0.9; // And jump higher
      this.scale = 0.5;
    }
    
    // Adjust properties for screamer goats
    if (this.isScreamer) {
      this.attackDamage = 4; // Screamer goats do more damage
      this.ramCooldown = 200; // And ram more frequently
      this.maxRamCooldown = 200;
    }
  }
  
  /**
   * Update the goat's state
   * @param {Object} world - The world object
   * @param {Object} players - Players object
   * @param {Object} mobs - Other mobs in the world
   * @param {Number} deltaTime - Time since last update in ms
   */
  update(world, players, mobs, deltaTime) {
    // Convert time to ticks (assuming 20 ticks per second)
    const dt = deltaTime / 50;
    
    // Handle ram cooldown
    if (this.ramCooldown > 0) {
      this.ramCooldown -= dt;
    }
    
    // Handle jump cooldown
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= dt;
    }
    
    // Handle ramming logic
    if (this.isRamming) {
      this.handleRamming(world, players, mobs, dt);
    } else {
      // If not ramming, consider initiating a ram attack
      this.considerRamming(world, players, mobs);
    }
    
    // Randomly jump if on a hill and cooldown is ready
    if (!this.isRamming && this.jumpCooldown <= 0 && Math.random() < 0.005) {
      const standingBlock = world.getBlockAt(
        Math.floor(this.position.x),
        Math.floor(this.position.y) - 1,
        Math.floor(this.position.z)
      );
      
      // Check if standing on a sloped surface (mountain)
      const isMountain = standingBlock && (
        standingBlock.type === 'stone' ||
        standingBlock.type === 'grass_block' ||
        standingBlock.type === 'snow_block' ||
        standingBlock.type === 'powder_snow'
      );
      
      if (isMountain) {
        this.jump();
        this.jumpCooldown = this.maxJumpCooldown;
      }
    }
    
    // Horn growth for babies
    if (this.isBaby && this.hasHorns) {
      this.hornTimer += dt;
      if (this.hornTimer >= 24000) { // 20 minutes
        this.hornTimer = 0;
      }
    }
    
    // Milk regeneration
    this.milkTimer += dt;
    if (this.milkTimer >= 6000) { // 5 minutes
      this.canBeMilked = true;
      this.milkTimer = 0;
    }
    
    // Call the parent update method for basic mob behavior
    super.update(world, players, mobs, deltaTime);
  }
  
  /**
   * Consider if the goat should start ramming
   * @param {Object} world - The world object
   * @param {Object} players - Players object
   * @param {Object} mobs - Other mobs in the world
   * @private
   */
  considerRamming(world, players, mobs) {
    // Only ram if cooldown is ready
    if (this.ramCooldown > 0) return;
    
    // Find potential targets
    let targets = [];
    
    // Check for players
    for (const playerId in players) {
      const player = players[playerId];
      
      // Only target players within detection range
      if (this.getDistanceTo(player.position) <= this.detectionRange) {
        targets.push(player);
      }
    }
    
    // Check for other mobs (not other goats)
    for (const mobId in mobs) {
      const mob = mobs[mobId];
      
      // Don't target self or other goats
      if (mob.id === this.id || mob.type === 'goat') continue;
      
      // Only target mobs within detection range
      if (this.getDistanceTo(mob.position) <= this.detectionRange) {
        targets.push(mob);
      }
    }
    
    // Randomly decide to ram based on aggressiveness
    // Screamer goats are more aggressive
    const ramChance = this.isScreamer ? 0.1 : 0.02;
    
    if (targets.length > 0 && Math.random() < ramChance) {
      // Pick a random target
      const target = targets[Math.floor(Math.random() * targets.length)];
      
      // Check if there's a clear path for ramming
      const canRam = this.checkRamPath(world, target.position);
      
      if (canRam) {
        this.startRamming(target);
      }
    }
  }
  
  /**
   * Check if there's a clear path for ramming
   * @param {Object} world - The world object
   * @param {Object} targetPos - Target position
   * @returns {Boolean} - Whether ramming is possible
   * @private
   */
  checkRamPath(world, targetPos) {
    const distance = this.getDistanceTo(targetPos);
    
    // Too far for ramming
    if (distance > 10) return false;
    
    // Check if there are blocks in the way
    const dirX = targetPos.x - this.position.x;
    const dirY = targetPos.y - this.position.y;
    const dirZ = targetPos.z - this.position.z;
    
    // Normalize direction
    const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
    const normDirX = dirX / length;
    const normDirY = dirY / length;
    const normDirZ = dirZ / length;
    
    // Check 5 points along the path
    for (let i = 1; i <= 5; i++) {
      const checkX = this.position.x + normDirX * i;
      const checkY = this.position.y + normDirY * i;
      const checkZ = this.position.z + normDirZ * i;
      
      const block = world.getBlockAt(
        Math.floor(checkX),
        Math.floor(checkY),
        Math.floor(checkZ)
      );
      
      // If there's a solid block in the way, can't ram
      if (block && block.isSolid) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Start the ramming action
   * @param {Object} target - Target to ram
   * @private
   */
  startRamming(target) {
    this.isRamming = true;
    this.ramTarget = {
      id: target.id,
      position: { ...target.position },
      type: target.type
    };
    this.ramChargeTime = 0;
    
    // If this is a screamer goat, emit a scream sound
    if (this.isScreamer) {
      this.emitEvent('goat_scream', {
        position: this.position
      });
    }
  }
  
  /**
   * Handle ramming logic during update
   * @param {Object} world - The world object
   * @param {Object} players - Players object
   * @param {Object} mobs - Other mobs in the world
   * @param {Number} dt - Time since last update in ticks
   * @private
   */
  handleRamming(world, players, mobs, dt) {
    // Increase charge time
    this.ramChargeTime += dt;
    
    // First phase: prepare for 1 second
    if (this.ramChargeTime < 20) {
      // Just prepare, no movement
      return;
    }
    
    // Second phase: charge toward target
    const target = this.ramTarget.type === 'player' 
      ? players[this.ramTarget.id] 
      : mobs[this.ramTarget.id];
    
    // Update target position if target still exists
    if (target) {
      this.ramTarget.position = { ...target.position };
    }
    
    // Calculate direction to target
    const dirX = this.ramTarget.position.x - this.position.x;
    const dirY = this.ramTarget.position.y - this.position.y;
    const dirZ = this.ramTarget.position.z - this.position.z;
    
    // Normalize direction
    const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
    
    // Ram charge speed
    const ramSpeed = 0.8; // Faster than normal movement
    
    // Move toward target
    if (length > 0) {
      this.velocity.x = (dirX / length) * ramSpeed;
      this.velocity.y = (dirY / length) * ramSpeed;
      this.velocity.z = (dirZ / length) * ramSpeed;
    }
    
    // Check if ram hit target
    if (length < 1.5) {
      this.ramHit(target);
      return;
    }
    
    // Check if ram has been going for too long (3 seconds max)
    if (this.ramChargeTime > 60) {
      this.stopRamming();
    }
  }
  
  /**
   * Handle a successful ram hit
   * @param {Object} target - The hit target
   * @private
   */
  ramHit(target) {
    // Only deal damage if target exists
    if (target) {
      // Deal damage based on goat type
      const damage = this.isScreamer ? 4 : 2;
      
      // Apply knockback
      const knockbackStrength = 2.0;
      const knockbackY = 0.4;
      
      // Create knockback effect
      const dirX = target.position.x - this.position.x;
      const dirZ = target.position.z - this.position.z;
      
      // Normalize direction
      const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
      const normDirX = length > 0 ? dirX / length : 0;
      const normDirZ = length > 0 ? dirZ / length : 0;
      
      // Apply damage to target with knockback data
      target.takeDamage(damage, {
        type: 'ram',
        entityId: this.id,
        position: this.position,
        knockback: {
          x: normDirX * knockbackStrength,
          y: knockbackY,
          z: normDirZ * knockbackStrength
        }
      });
      
      // Emit hit sound
      this.emitEvent('goat_ram_hit', {
        position: target.position
      });
    }
    
    // End ramming and set cooldown
    this.stopRamming();
    this.ramCooldown = this.maxRamCooldown;
  }
  
  /**
   * Stop the ramming action
   * @private
   */
  stopRamming() {
    this.isRamming = false;
    this.ramTarget = null;
    this.velocity = { x: 0, y: 0, z: 0 };
  }
  
  /**
   * Handle a jump action
   * @private
   */
  jump() {
    // Increase Y velocity for jump
    this.velocity.y = this.jumpStrength;
    
    // Random horizontal velocity for jump direction
    this.velocity.x += (Math.random() * 0.4) - 0.2;
    this.velocity.z += (Math.random() * 0.4) - 0.2;
    
    // Emit jump sound
    this.emitEvent('goat_jump', {
      position: this.position
    });
  }
  
  /**
   * Process an interaction with the goat
   * @param {Object} player - Player interacting
   * @param {Object} interaction - Interaction data
   * @returns {Object} - Result of interaction
   */
  processInteraction(player, interaction) {
    // Milk the goat if player has a bucket
    if (interaction.action === 'use_item' && interaction.itemId === 'bucket' && this.canBeMilked) {
      this.canBeMilked = false;
      this.milkTimer = 0;
      
      return {
        success: true,
        message: 'Filled bucket with goat milk',
        consumeItem: true,
        replacementItem: 'milk_bucket'
      };
    }
    
    // Handle breeding
    if (interaction.action === 'feed' && 
        (interaction.itemId === 'wheat')) {
      
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
    if (this.isBaby) {
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
      
      // 50% chance for baby to have horns
      const hasHorns = Math.random() < 0.5;
      
      // Determine if baby is a screamer - higher chance if parent is a screamer
      const isScreamer = 
        (this.isScreamer || partner.isScreamer) ? 
        Math.random() < 0.5 : // 50% chance if parent is screamer
        Math.random() < 0.02; // Normal 2% chance otherwise
      
      world.spawnEntity('goat', babyPosition, {
        isBaby: true,
        hasHorns,
        isScreamer
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
   * Handle an attack against this mob
   * @param {Number} damage - Amount of damage
   * @param {Object} source - Source of the damage
   * @returns {Object} - Result of the attack
   */
  takeDamage(damage, source) {
    // When damaged, goats try to ram the attacker
    if (source && source.entityId && this.ramCooldown <= 0 && !this.isRamming) {
      // 50% chance to immediately try to ram attacker
      if (Math.random() < 0.5) {
        const attacker = {
          id: source.entityId,
          position: source.position || { x: 0, y: 0, z: 0 },
          type: source.type || 'unknown'
        };
        
        this.startRamming(attacker);
      }
    }
    
    // Call parent method to apply actual damage
    return super.takeDamage(damage, source);
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
   * Check if the mob is neutral
   * @returns {Boolean} - Always true for goats
   */
  isNeutral() {
    return true;
  }
  
  /**
   * Serialize the goat for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      isScreamer: this.isScreamer,
      hasHorns: this.hasHorns,
      isBaby: this.isBaby,
      ramCooldown: this.ramCooldown,
      jumpCooldown: this.jumpCooldown,
      milkTimer: this.milkTimer,
      canBeMilked: this.canBeMilked,
      hornTimer: this.hornTimer
    };
  }
  
  /**
   * Deserialize data to restore the goat's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    super.deserialize(data);
    
    if (data.isScreamer !== undefined) this.isScreamer = data.isScreamer;
    if (data.hasHorns !== undefined) this.hasHorns = data.hasHorns;
    if (data.isBaby !== undefined) this.isBaby = data.isBaby;
    if (data.ramCooldown !== undefined) this.ramCooldown = data.ramCooldown;
    if (data.jumpCooldown !== undefined) this.jumpCooldown = data.jumpCooldown;
    if (data.milkTimer !== undefined) this.milkTimer = data.milkTimer;
    if (data.canBeMilked !== undefined) this.canBeMilked = data.canBeMilked;
    if (data.hornTimer !== undefined) this.hornTimer = data.hornTimer;
    
    // Adjust properties for baby goats after deserialization
    if (this.isBaby) {
      this.maxHealth = 5;
      this.attackDamage = 1;
      this.speed = 0.5;
      this.jumpStrength = 0.9;
      this.scale = 0.5;
    }
    
    // Adjust properties for screamer goats after deserialization
    if (this.isScreamer) {
      this.attackDamage = 4;
      this.maxRamCooldown = 200;
    }
  }
}

module.exports = {
  Wolf,
  Spider,
  Enderman,
  Goat
}; 