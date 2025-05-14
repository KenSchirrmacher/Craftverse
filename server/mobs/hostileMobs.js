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

// Guardian - underwater hostile mob with ranged laser attack
class Guardian extends MobBase {
  constructor(position) {
    super('guardian', position, 30, 0.5); // type, position, health, speed
    this.attackDamage = 5;
    this.attackRange = 8; // Ranged attack
    this.aggroRange = 16;
    this.laserCooldown = 0;
    this.firingLaser = false;
    this.laserTarget = null;
    this.laserChargeTime = 2000; // 2 seconds to charge laser
    this.laserChargingProgress = 0;
    this.waterBreathingOnly = true; // Can only survive in water
    this.outOfWaterTimer = 0;
  }

  update(world, players, deltaTime) {
    super.update(world, players, deltaTime);
    
    // Check if guardian is in water
    const blockAtPosition = world.getBlockAt(
      Math.floor(this.position.x),
      Math.floor(this.position.y),
      Math.floor(this.position.z)
    );
    
    const inWater = blockAtPosition && blockAtPosition.type === 'water';
    
    if (this.waterBreathingOnly && !inWater) {
      this.outOfWaterTimer += deltaTime;
      
      // Take damage if out of water for too long
      if (this.outOfWaterTimer >= 1000) { // 1 second
        this.takeDamage(1);
        this.outOfWaterTimer = 0;
      }
    } else {
      this.outOfWaterTimer = 0;
    }
    
    // Handle laser attack
    if (this.targetEntity && this.state === 'attack' && inWater) {
      this.laserCooldown -= deltaTime;
      
      if (this.laserCooldown <= 0 && !this.firingLaser) {
        // Start charging laser
        this.firingLaser = true;
        this.laserTarget = this.targetEntity;
        this.laserChargingProgress = 0;
      }
      
      if (this.firingLaser) {
        // Update laser charging
        this.laserChargingProgress += deltaTime;
        
        // Fire laser when charged
        if (this.laserChargingProgress >= this.laserChargeTime) {
          this.fireLaser(this.laserTarget);
          this.firingLaser = false;
          this.laserCooldown = 3000; // 3 seconds between attacks
        }
      }
    } else if (this.firingLaser) {
      // Cancel laser if target lost
      this.firingLaser = false;
    }
  }

  // Fire laser at target
  fireLaser(target) {
    // Calculate direction to target
    const dx = target.position.x - this.position.x;
    const dy = target.position.y - this.position.y;
    const dz = target.position.z - this.position.z;
    
    // Check if target is visible
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance > this.attackRange) {
      return null; // Target too far
    }
    
    // Deal damage to target
    target.takeDamage(this.attackDamage, this);
    
    // Return laser effect data for client
    return {
      type: 'laser',
      start: {
        x: this.position.x,
        y: this.position.y + 0.5, // Laser comes from middle of guardian
        z: this.position.z
      },
      end: {
        x: target.position.x,
        y: target.position.y + 1, // Target at head level
        z: target.position.z
      },
      duration: 500 // Half second beam effect
    };
  }

  getClientData() {
    const data = super.getClientData();
    data.firingLaser = this.firingLaser;
    data.laserCharge = this.firingLaser ? (this.laserChargingProgress / this.laserChargeTime) : 0;
    
    if (this.firingLaser && this.laserTarget) {
      data.laserTarget = {
        id: this.laserTarget.id,
        type: this.laserTarget.type
      };
    }
    
    return data;
  }

  getDrops() {
    const loot = [];
    
    // Drops prismarine shards
    if (Math.random() < 0.8) {
      loot.push({
        type: 'item',
        itemType: 'prismarine_shard',
        count: Math.floor(Math.random() * 2) + 1
      });
    }
    
    // Chance to drop prismarine crystals
    if (Math.random() < 0.3) {
      loot.push({
        type: 'item',
        itemType: 'prismarine_crystal',
        count: Math.floor(Math.random() * 2) + 1
      });
    }
    
    // Chance to drop raw fish
    if (Math.random() < 0.4) {
      loot.push({
        type: 'item',
        itemType: 'raw_fish',
        count: 1
      });
    }
    
    return loot;
  }

  isHostile() {
    return true;
  }
}

// Elder Guardian - stronger guardian with mining fatigue effect
class ElderGuardian extends Guardian {
  constructor(position) {
    super(position);
    this.type = 'elder_guardian'; // Override type
    this.health = 80;
    this.maxHealth = 80;
    this.attackDamage = 8;
    this.attackRange = 10;
    this.aggroRange = 20;
    this.miningFatigueRange = 50; // Range to apply mining fatigue effect
    this.miningFatigueTimer = 0;
    this.miningFatigueInterval = 60000; // Apply effect every minute
  }

  update(world, players, deltaTime) {
    super.update(world, players, deltaTime);
    
    // Apply mining fatigue effect to nearby players
    this.miningFatigueTimer += deltaTime;
    
    if (this.miningFatigueTimer >= this.miningFatigueInterval) {
      this.applyMiningFatigue(players);
      this.miningFatigueTimer = 0;
    }
  }

  // Apply mining fatigue status effect to nearby players
  applyMiningFatigue(players) {
    const affectedPlayers = [];
    
    for (const playerId in players) {
      const player = players[playerId];
      
      // Calculate distance to player
      const dx = player.position.x - this.position.x;
      const dy = player.position.y - this.position.y;
      const dz = player.position.z - this.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Apply effect if player is in range
      if (distance <= this.miningFatigueRange) {
        // Apply mining fatigue effect
        const effect = {
          type: 'mining_fatigue',
          duration: 300000, // 5 minutes
          level: 1,
          source: this.id
        };
        
        player.applyStatusEffect(effect);
        affectedPlayers.push(playerId);
      }
    }
    
    return affectedPlayers;
  }

  // Generate loot drops (improved from regular guardian)
  getLoot() {
    const loot = [];
    
    // Always drop prismarine shards
    loot.push({
      type: 'item',
      itemType: 'prismarine_shard',
      count: Math.floor(Math.random() * 2) + 2
    });
    
    // Always drop prismarine crystals
    loot.push({
      type: 'item',
      itemType: 'prismarine_crystal',
      count: Math.floor(Math.random() * 2) + 1
    });
    
    // Chance to drop wet sponge
    if (Math.random() < 0.33) {
      loot.push({
        type: 'item',
        itemType: 'wet_sponge',
        count: 1
      });
    }
    
    // Chance to drop raw fish
    if (Math.random() < 0.5) {
      loot.push({
        type: 'item',
        itemType: 'raw_fish',
        count: Math.floor(Math.random() * 2) + 1
      });
    }
    
    return loot;
  }
}

// Silverfish - small hostile mob that hides in blocks and calls for allies
class Silverfish extends MobBase {
  constructor(position) {
    super('silverfish', position, 8, 0.7); // type, position, health, speed (faster than other mobs)
    this.attackDamage = 1;
    this.attackRange = 1;
    this.aggroRange = 12;
    this.canHideInBlock = true;
    this.isHiding = false;
    this.hiddenBlock = null;
    this.lastCalledAllies = 0;
    this.callingCooldown = 5000; // 5 seconds cooldown between calling allies
  }

  update(world, players, mobs, deltaTime) {
    if (this.isHiding) {
      // Check for nearby players while hiding
      for (const playerId in players) {
        const player = players[playerId];
        const distance = this.distanceTo(player.position);
        
        if (distance < 3) {
          this.emerge(world);
          break;
        }
      }
      return; // Skip normal update logic while hiding
    }

    super.update(world, players, mobs, deltaTime);

    // Check for nearby players to target
    if (this.state === 'idle' && Math.random() < 0.15) { // More aggressive detection rate
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

    // If damaged, try to call for allies
    if (this.lastDamaged && this.lastDamaged + 2000 > Date.now() && 
        this.lastCalledAllies + this.callingCooldown < Date.now()) {
      this.callAllies(world, mobs);
      this.lastCalledAllies = Date.now();
    }

    // Check for suitable blocks to hide in when not in combat
    if (this.state === 'idle' && this.canHideInBlock && Math.random() < 0.005) {
      this.tryHideInBlock(world);
    }
  }

  tryHideInBlock(world) {
    // Check current block position
    const blockX = Math.floor(this.position.x);
    const blockY = Math.floor(this.position.y);
    const blockZ = Math.floor(this.position.z);
    
    // Check for valid blocks to hide in
    const validBlocks = ['stone', 'cobblestone', 'stone_bricks', 'infested_stone'];
    
    // Look for a suitable block in nearby positions
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const block = world.getBlockAt(blockX + x, blockY + y, blockZ + z);
          
          if (block && validBlocks.includes(block.type)) {
            // Found a suitable block
            this.hide(world, {
              x: blockX + x,
              y: blockY + y,
              z: blockZ + z
            }, block.type);
            return;
          }
        }
      }
    }
  }

  hide(world, blockPos, blockType) {
    // Replace block with infested version
    const infestedVersion = 'infested_stone';
    world.setBlock(blockPos.x, blockPos.y, blockPos.z, infestedVersion);
    
    // Store the original block type for later
    this.hiddenBlock = {
      position: blockPos,
      type: blockType
    };
    
    // Set mob to hiding state
    this.isHiding = true;
    this.position = { ...blockPos };
    
    // Notify clients that the mob is no longer visible
    return {
      mobId: this.id,
      action: 'hide',
      blockPosition: blockPos
    };
  }

  emerge(world) {
    if (!this.isHiding || !this.hiddenBlock) return;
    
    // Restore original position
    this.position = { 
      x: this.hiddenBlock.position.x + 0.5, 
      y: this.hiddenBlock.position.y, 
      z: this.hiddenBlock.position.z + 0.5 
    };
    
    // Restore block to its original type
    world.setBlock(
      this.hiddenBlock.position.x,
      this.hiddenBlock.position.y,
      this.hiddenBlock.position.z,
      this.hiddenBlock.type
    );
    
    // Reset hiding state
    this.isHiding = false;
    this.hiddenBlock = null;
    
    // Notify clients that the mob is visible again
    return {
      mobId: this.id,
      action: 'emerge',
      position: this.position
    };
  }

  callAllies(world, mobs) {
    // Find nearby silverfish
    const allyRange = 8;
    const allies = [];
    
    for (const mobId in mobs) {
      const mob = mobs[mobId];
      
      if (mob.type === 'silverfish' && mob.id !== this.id) {
        const distance = this.distanceTo(mob.position);
        
        if (distance < allyRange) {
          allies.push(mob);
        }
      }
    }
    
    // Alert allies to the player
    for (const ally of allies) {
      if (ally.state === 'idle' || ally.isHiding) {
        if (ally.isHiding) {
          ally.emerge(world);
        }
        
        ally.targetEntity = this.targetEntity;
        ally.state = 'follow';
      }
    }
    
    // Notify clients of calling behavior
    return {
      mobId: this.id,
      action: 'call_allies',
      position: this.position,
      alliedIds: allies.map(ally => ally.id)
    };
  }

  // Called when a block with a silverfish inside is broken
  static emergeFromBlock(world, blockPos) {
    // Create a new silverfish
    const silverfish = new Silverfish({
      x: blockPos.x + 0.5,
      y: blockPos.y,
      z: blockPos.z + 0.5
    });
    
    // Set to aggro state immediately
    silverfish.state = 'follow';
    
    return silverfish;
  }

  takeDamage(amount, attacker) {
    this.lastDamaged = Date.now();
    
    // If hiding, emerge first
    if (this.isHiding) {
      this.emerge(world);
    }
    
    return super.takeDamage(amount, attacker);
  }

  getDrops() {
    // Silverfish don't drop anything in vanilla
    return [];
  }

  isHostile() {
    return true;
  }

  serialize() {
    return {
      ...super.serialize(),
      isHiding: this.isHiding,
      hiddenBlock: this.hiddenBlock ? {
        x: this.hiddenBlock.position.x,
        y: this.hiddenBlock.position.y,
        z: this.hiddenBlock.position.z,
        type: this.hiddenBlock.type
      } : null
    };
  }

  deserialize(data) {
    super.deserialize(data);
    this.isHiding = data.isHiding || false;
    this.hiddenBlock = data.hiddenBlock || null;
  }
}

module.exports = {
  Zombie,
  Skeleton,
  Creeper,
  Guardian,
  ElderGuardian,
  Silverfish
}; 