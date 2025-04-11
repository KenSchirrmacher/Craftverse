// Hostile mobs implementation
const MobBase = require('./mobBase');

// Zombie - basic hostile mob that follows and attacks players
class Zombie extends MobBase {
  constructor(position) {
    super('zombie', position, 20, 0.6); // type, position, health, speed
    this.attackDamage = 3;
    this.attackRange = 1.5;
    this.aggroRange = 16;
    this.burnInSunlight = true;
    this.isBurning = false;
    this.burnDamageTimer = 0;
    this.daytime = false;
  }

  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);

    // Check for nearby players to target
    if (this.state === 'idle' && Math.random() < 0.1) {
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

    // Burn in sunlight if applicable
    if (this.burnInSunlight && this.daytime && this.isExposedToSky()) {
      this.isBurning = true;
      this.burnDamageTimer += deltaTime;
      
      if (this.burnDamageTimer >= 20) { // Every 1 second
        this.takeDamage(1, null); // Sun damage
        this.burnDamageTimer = 0;
      }
    } else {
      this.isBurning = false;
    }
  }

  // Mock implementation - would need actual sky exposure check
  isExposedToSky() {
    // Assume exposed if y coordinate is above some threshold
    return this.position.y > 5;
  }

  // Update day/night status
  updateDaytime(isDaytime) {
    this.daytime = isDaytime;
  }

  getDrops() {
    const drops = [];
    
    // Rotten flesh
    drops.push({
      type: 'rotten_flesh',
      count: Math.floor(Math.random() * 2) + 1 // 1-2 rotten flesh
    });
    
    // Small chance to drop iron ingot, potato, or carrot
    const rareDrop = Math.random();
    if (rareDrop < 0.03) { // 3% chance
      drops.push({
        type: 'iron_ingot',
        count: 1
      });
    } else if (rareDrop < 0.06) { // 3% chance
      drops.push({
        type: 'potato',
        count: 1
      });
    } else if (rareDrop < 0.09) { // 3% chance
      drops.push({
        type: 'carrot',
        count: 1
      });
    }
    
    return drops;
  }

  isHostile() {
    return true;
  }

  serialize() {
    return {
      ...super.serialize(),
      isBurning: this.isBurning
    };
  }
}

// Skeleton - ranged hostile mob
class Skeleton extends MobBase {
  constructor(position) {
    super('skeleton', position, 20, 0.6); // type, position, health, speed
    this.attackDamage = 2;
    this.attackRange = 8; // Longer range for arrows
    this.aggroRange = 16;
    this.burnInSunlight = true;
    this.isBurning = false;
    this.burnDamageTimer = 0;
    this.daytime = false;
    this.lastShotTime = 0;
    this.shootingCooldown = 40; // 2 seconds between shots
  }

  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);

    // Update shooting cooldown
    if (this.lastShotTime > 0) {
      this.lastShotTime -= deltaTime;
    }

    // Check for nearby players to target
    if (this.state === 'idle' && Math.random() < 0.1) {
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
        this.state = 'attack';
      }
    }

    // Burn in sunlight if applicable
    if (this.burnInSunlight && this.daytime && this.isExposedToSky()) {
      this.isBurning = true;
      this.burnDamageTimer += deltaTime;
      
      if (this.burnDamageTimer >= 20) { // Every 1 second
        this.takeDamage(1, null); // Sun damage
        this.burnDamageTimer = 0;
      }
    } else {
      this.isBurning = false;
    }

    // Ranged attack behavior - maintain distance from target
    if (this.state === 'attack' && this.targetEntity) {
      const distanceToTarget = this.distanceTo(this.targetEntity.position);
      
      // Try to maintain ideal shooting distance
      if (distanceToTarget < 5) {
        // Move away
        this.fleeFrom(this.targetEntity.position, deltaTime);
      } else if (distanceToTarget > 12) {
        // Move closer
        this.moveTowards(this.targetEntity.position, deltaTime);
      } else {
        // Shoot if cooldown is complete
        if (this.lastShotTime <= 0) {
          this.shoot(this.targetEntity);
          this.lastShotTime = this.shootingCooldown;
        }
      }
    }
  }

  // Shoot an arrow at the target
  shoot(target) {
    if (!target) return null;
    
    // Calculate direction
    const dirX = target.position.x - this.position.x;
    const dirY = target.position.y - this.position.y;
    const dirZ = target.position.z - this.position.z;
    
    // Normalize
    const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
    const normalizedDir = {
      x: dirX / length,
      y: dirY / length,
      z: dirZ / length
    };
    
    // Add some inaccuracy
    const inaccuracy = 0.1;
    normalizedDir.x += (Math.random() * 2 - 1) * inaccuracy;
    normalizedDir.y += (Math.random() * 2 - 1) * inaccuracy;
    normalizedDir.z += (Math.random() * 2 - 1) * inaccuracy;
    
    // Create arrow projectile data
    const arrowData = {
      type: 'arrow',
      position: { ...this.position },
      direction: normalizedDir,
      shooterId: this.id,
      damage: this.attackDamage,
      speed: 1.5
    };
    
    return arrowData;
  }

  // Mock implementation - would need actual sky exposure check
  isExposedToSky() {
    // Assume exposed if y coordinate is above some threshold
    return this.position.y > 5;
  }

  // Update day/night status
  updateDaytime(isDaytime) {
    this.daytime = isDaytime;
  }

  getDrops() {
    const drops = [];
    
    // Bones
    drops.push({
      type: 'bone',
      count: Math.floor(Math.random() * 2) + 1 // 1-2 bones
    });
    
    // Arrows
    if (Math.random() < 0.5) {
      drops.push({
        type: 'arrow',
        count: Math.floor(Math.random() * 2) + 1 // 1-2 arrows
      });
    }
    
    // Small chance to drop bow
    if (Math.random() < 0.1) { // 10% chance
      drops.push({
        type: 'bow',
        count: 1
      });
    }
    
    return drops;
  }

  isHostile() {
    return true;
  }

  serialize() {
    return {
      ...super.serialize(),
      isBurning: this.isBurning,
      isShooting: this.lastShotTime > this.shootingCooldown - 5 // Is in shooting animation
    };
  }
}

// Creeper - explodes when near player
class Creeper extends MobBase {
  constructor(position) {
    super('creeper', position, 20, 0.6); // type, position, health, speed
    this.attackRange = 3; // Explosion radius
    this.aggroRange = 16;
    this.fuseTime = 30; // 1.5 seconds
    this.fuseLit = false;
    this.fuseTimer = 0;
    this.powered = Math.random() < 0.01; // 1% chance of charged creeper
    if (this.powered) {
      this.attackRange = 6; // Larger explosion radius
    }
  }

  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);

    // Check for nearby players to target
    if (this.state === 'idle' && Math.random() < 0.1) {
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

    // Check if close enough to player to start fuse
    if (this.targetEntity && this.state === 'follow') {
      const distance = this.distanceTo(this.targetEntity.position);
      
      if (distance <= 3) {
        // Start fuse
        this.fuseLit = true;
        this.state = 'attack';
      }
    }

    // Update fuse timer
    if (this.fuseLit) {
      this.fuseTimer += deltaTime;
      
      // Check if fuse is complete
      if (this.fuseTimer >= this.fuseTime) {
        // Explode
        this.explode();
      }
    } else {
      this.fuseTimer = 0;
    }
  }

  // Explode
  explode() {
    this.dead = true;
    
    // Calculate explosion damage to nearby entities
    const explosionData = {
      position: { ...this.position },
      radius: this.attackRange,
      damage: this.powered ? 49 : 25,
      sourceId: this.id
    };
    
    return explosionData;
  }

  // Creeper stops fuse if target gets too far
  updateFollow(world, deltaTime) {
    super.updateFollow(world, deltaTime);
    
    // If target is too far, stop fuse
    if (this.targetEntity) {
      const distance = this.distanceTo(this.targetEntity.position);
      if (distance > 3 && this.fuseLit) {
        this.fuseLit = false;
        this.fuseTimer = 0;
      }
    }
  }

  getDrops() {
    const drops = [];
    
    // Gunpowder
    drops.push({
      type: 'gunpowder',
      count: Math.floor(Math.random() * 2) + 1 // 1-2 gunpowder
    });
    
    // Music discs if killed by skeleton
    if (this.lastDamageDealer && (
        this.lastDamageDealer.type === 'skeleton' || 
        this.lastDamageDealer.type === 'stray')) {
      const discTypes = [
        'music_disc_13',
        'music_disc_cat',
        'music_disc_blocks',
        'music_disc_chirp',
        'music_disc_far',
        'music_disc_mall',
        'music_disc_mellohi',
        'music_disc_stal',
        'music_disc_strad',
        'music_disc_ward',
        'music_disc_11',
        'music_disc_wait'
      ];
      drops.push({
        type: discTypes[Math.floor(Math.random() * discTypes.length)],
        count: 1
      });
    }
    
    return drops;
  }

  takeDamage(amount, attacker) {
    // Record last damage dealer for potential music disc drops
    if (attacker) {
      this.lastDamageDealer = attacker;
    }
    
    return super.takeDamage(amount, attacker);
  }

  isHostile() {
    return true;
  }

  serialize() {
    return {
      ...super.serialize(),
      fuseLit: this.fuseLit,
      fuseProgress: this.fuseLit ? this.fuseTimer / this.fuseTime : 0,
      powered: this.powered
    };
  }
}

module.exports = {
  Zombie,
  Skeleton,
  Creeper
}; 