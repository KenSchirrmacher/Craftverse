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
    
    return super.takeDamage(amount, attacker);
  }

  getDrops() {
    return [];
  }

  isNeutral() {
    return true;
  }

  serialize() {
    return {
      ...super.serialize(),
      tamed: this.tamed,
      owner: this.owner,
      sitting: this.sitting,
      angry: this.angry,
      collarColor: this.collarColor
    };
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

module.exports = {
  Wolf,
  Spider,
  Enderman
}; 