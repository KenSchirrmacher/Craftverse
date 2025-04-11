// Mob Manager - handles spawning, updating, and interactions with all mobs
const passiveMobs = require('./passiveMobs');
const neutralMobs = require('./neutralMobs');
const hostileMobs = require('./hostileMobs');

class MobManager {
  constructor() {
    this.mobs = {};
    this.projectiles = {};
    this.mobCap = {
      passive: 10,  // Max passive mobs
      neutral: 10,  // Max neutral mobs
      hostile: 15   // Max hostile mobs
    };
    this.spawnRanges = {
      passive: { min: 24, max: 48 },    // Spawn 24-48 blocks from player
      neutral: { min: 24, max: 48 },    // Spawn 24-48 blocks from player
      hostile: { min: 24, max: 64 }     // Spawn 24-64 blocks from player
    };
    this.despawnRange = 128;  // Despawn if > 128 blocks from player
    this.mobRegistry = {
      // Passive mobs
      'sheep': passiveMobs.Sheep,
      'cow': passiveMobs.Cow,
      'pig': passiveMobs.Pig,
      'chicken': passiveMobs.Chicken,
      
      // Neutral mobs
      'wolf': neutralMobs.Wolf,
      'spider': neutralMobs.Spider,
      'enderman': neutralMobs.Enderman,
      
      // Hostile mobs
      'zombie': hostileMobs.Zombie,
      'skeleton': hostileMobs.Skeleton,
      'creeper': hostileMobs.Creeper
    };
    this.daytime = true;
    this.worldTime = 0;
    this.lastSpawnTime = 0;
    this.spawnCooldown = 200; // Ticks between spawn attempts (10 seconds)
  }

  // Update all mobs
  update(world, players, deltaTime) {
    // Update world time
    this.worldTime += deltaTime;
    
    // Update day/night cycle (24000 ticks = 20 minutes real time)
    const previousDaytime = this.daytime;
    this.daytime = (this.worldTime % 24000) < 12000;
    
    // If day/night status changed, update mobs
    if (previousDaytime !== this.daytime) {
      this.updateMobsDayNightStatus();
    }
    
    // Update existing mobs
    for (const mobId in this.mobs) {
      const mob = this.mobs[mobId];
      
      // Update mob
      const updateResult = mob.update(world, players, this.mobs, deltaTime);
      
      // Handle special update results (like explosions, projectiles)
      if (updateResult) {
        this.handleMobUpdateResult(mob, updateResult);
      }
      
      // Check if mob should despawn
      if (mob.dead || (mob.despawnable && mob.checkDespawn(players))) {
        // If dead, drop items
        if (mob.dead && mob.getDrops) {
          this.dropLoot(mob);
        }
        
        // Remove mob
        delete this.mobs[mobId];
      }
    }
    
    // Update projectiles
    this.updateProjectiles(world, players, deltaTime);
    
    // Check if new mobs should spawn
    this.lastSpawnTime += deltaTime;
    if (this.lastSpawnTime >= this.spawnCooldown) {
      this.spawnMobs(world, players);
      this.lastSpawnTime = 0;
    }
  }

  // Handle special update results from mobs
  handleMobUpdateResult(mob, updateResult) {
    switch (updateResult.type) {
      case 'layEgg':
        // Chicken laid an egg, would create an egg item
        console.log('Chicken laid an egg at', updateResult.position);
        break;
        
      case 'arrow':
        // Skeleton shot an arrow, create projectile
        this.createProjectile(updateResult);
        break;
        
      default:
        // Unknown update result
        console.log('Unknown update result:', updateResult);
    }
  }

  // Update day/night status for all mobs
  updateMobsDayNightStatus() {
    for (const mobId in this.mobs) {
      const mob = this.mobs[mobId];
      
      if (typeof mob.updateDaytime === 'function') {
        mob.updateDaytime(this.daytime);
      }
    }
  }

  // Spawn new mobs
  spawnMobs(world, players) {
    // Count current mobs by type
    const mobCounts = {
      passive: 0,
      neutral: 0,
      hostile: 0
    };
    
    for (const mobId in this.mobs) {
      const mob = this.mobs[mobId];
      
      if (mob.isPassive()) {
        mobCounts.passive++;
      } else if (mob.isNeutral()) {
        mobCounts.neutral++;
      } else if (mob.isHostile()) {
        mobCounts.hostile++;
      }
    }
    
    // Try to spawn new mobs if under cap
    for (const playerID in players) {
      const player = players[playerID];
      
      // Spawn passive mobs
      if (mobCounts.passive < this.mobCap.passive) {
        this.trySpawnMobNearPlayer(player, 'passive');
        mobCounts.passive++;
      }
      
      // Spawn neutral mobs
      if (mobCounts.neutral < this.mobCap.neutral) {
        this.trySpawnMobNearPlayer(player, 'neutral');
        mobCounts.neutral++;
      }
      
      // Spawn hostile mobs (only at night or in dark areas)
      if (mobCounts.hostile < this.mobCap.hostile && (!this.daytime || Math.random() < 0.3)) {
        this.trySpawnMobNearPlayer(player, 'hostile');
        mobCounts.hostile++;
      }
    }
  }

  // Try to spawn a mob near a player
  trySpawnMobNearPlayer(player, mobCategory) {
    // Get spawn range for this category
    const range = this.spawnRanges[mobCategory];
    
    // Calculate random distance within range
    const distance = range.min + Math.random() * (range.max - range.min);
    
    // Calculate random angle
    const angle = Math.random() * Math.PI * 2;
    
    // Calculate spawn position
    const spawnPos = {
      x: player.position.x + Math.sin(angle) * distance,
      y: player.position.y,
      z: player.position.z + Math.cos(angle) * distance
    };
    
    // Select a mob type to spawn based on category
    const mobType = this.selectMobType(mobCategory);
    
    // Spawn the mob
    if (mobType) {
      this.spawnMob(mobType, spawnPos);
      return true;
    }
    
    return false;
  }

  // Select a random mob type based on category
  selectMobType(category) {
    const mobTypes = {
      passive: ['sheep', 'cow', 'pig', 'chicken'],
      neutral: ['wolf', 'spider', 'enderman'],
      hostile: ['zombie', 'skeleton', 'creeper']
    };
    
    const availableTypes = mobTypes[category];
    
    if (!availableTypes || availableTypes.length === 0) {
      return null;
    }
    
    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }

  // Spawn a specific mob type
  spawnMob(mobType, position) {
    const MobClass = this.mobRegistry[mobType];
    
    if (!MobClass) {
      console.error(`Unknown mob type: ${mobType}`);
      return null;
    }
    
    const mob = new MobClass(position);
    this.mobs[mob.id] = mob;
    
    console.log(`Spawned ${mobType} at`, position);
    
    return mob;
  }

  // Handle loot dropping from mob death
  dropLoot(mob) {
    if (!mob.getDrops) return;
    
    const drops = mob.getDrops();
    
    if (drops && drops.length > 0) {
      // Would normally create item entities
      console.log(`${mob.type} dropped:`, drops);
    }
  }

  // Create a new projectile (arrow, etc)
  createProjectile(projectileData) {
    // Create a unique ID for the projectile
    projectileData.id = `proj_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Add to projectiles
    this.projectiles[projectileData.id] = projectileData;
    
    return projectileData;
  }

  // Update projectiles
  updateProjectiles(world, players, deltaTime) {
    for (const projId in this.projectiles) {
      const proj = this.projectiles[projId];
      
      // Update position based on direction and speed
      proj.position.x += proj.direction.x * proj.speed * deltaTime / 20;
      proj.position.y += proj.direction.y * proj.speed * deltaTime / 20;
      proj.position.z += proj.direction.z * proj.speed * deltaTime / 20;
      
      // Track lifetime
      if (!proj.lifetime) {
        proj.lifetime = 0;
      }
      proj.lifetime += deltaTime;
      
      // Check for collision with players
      for (const playerId in players) {
        const player = players[playerId];
        
        // Skip if this is the shooter
        if (player.id === proj.shooterId) continue;
        
        // Calculate distance to player
        const dx = proj.position.x - player.position.x;
        const dy = proj.position.y - player.position.y;
        const dz = proj.position.z - player.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // If hit, apply damage
        if (distance < 0.5) {
          player.health -= proj.damage;
          
          // Check for player death
          if (player.health <= 0) {
            player.health = 0;
            // Handle player death
          }
          
          // Remove projectile
          delete this.projectiles[projId];
          break;
        }
      }
      
      // Check for collision with mobs
      for (const mobId in this.mobs) {
        const mob = this.mobs[mobId];
        
        // Skip if this is the shooter
        if (mobId === proj.shooterId) continue;
        
        // Calculate distance to mob
        const dx = proj.position.x - mob.position.x;
        const dy = proj.position.y - mob.position.y;
        const dz = proj.position.z - mob.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // If hit, apply damage
        if (distance < 0.5) {
          // Find the shooter
          const shooter = this.mobs[proj.shooterId] || players[proj.shooterId];
          
          // Apply damage
          mob.takeDamage(proj.damage, shooter);
          
          // Remove projectile
          delete this.projectiles[projId];
          break;
        }
      }
      
      // Remove projectile if it's been alive too long
      if (proj.lifetime > 100) { // 5 seconds (100 ticks)
        delete this.projectiles[projId];
      }
    }
  }

  // Handle player attacking a mob
  handlePlayerAttack(playerId, mobId, damage) {
    const mob = this.mobs[mobId];
    const player = { id: playerId }; // Simplified player reference
    
    if (mob) {
      const died = mob.takeDamage(damage, player);
      
      if (died) {
        this.dropLoot(mob);
        delete this.mobs[mobId];
      }
      
      return {
        success: true,
        died: died,
        health: mob.health,
        maxHealth: mob.maxHealth
      };
    }
    
    return { success: false };
  }

  // Handle interactions with mobs (right-click)
  handlePlayerInteraction(playerId, mobId, data) {
    const mob = this.mobs[mobId];
    
    if (!mob) {
      return { success: false, error: 'Mob not found' };
    }
    
    // Different interactions based on mob type
    switch (mob.type) {
      case 'sheep':
        // Shear the sheep
        if (data.action === 'shear') {
          const wool = mob.shear();
          return {
            success: !!wool,
            wool: wool
          };
        }
        break;
        
      case 'cow':
        // Milk the cow
        if (data.action === 'milk') {
          return {
            success: true,
            item: { type: 'milk_bucket', count: 1 }
          };
        }
        break;
        
      case 'pig':
        // Apply saddle
        if (data.action === 'saddle') {
          const success = mob.applySaddle();
          return {
            success: success
          };
        }
        break;
        
      case 'wolf':
        // Different wolf interactions
        if (data.action === 'tame' && !mob.tamed) {
          const success = mob.tryTame(playerId);
          return {
            success: success,
            tamed: mob.tamed
          };
        } else if (data.action === 'sit' && mob.tamed) {
          const sitting = mob.toggleSitting();
          return {
            success: true,
            sitting: sitting
          };
        } else if (data.action === 'color' && mob.tamed) {
          const success = mob.setCollarColor(data.color);
          return {
            success: success,
            color: mob.collarColor
          };
        }
        break;
    }
    
    return { success: false, error: 'Invalid interaction' };
  }

  // Get all mob data for sending to clients
  getMobData() {
    const mobData = {};
    
    for (const mobId in this.mobs) {
      mobData[mobId] = this.mobs[mobId].serialize();
    }
    
    return mobData;
  }

  // Get all projectile data for sending to clients
  getProjectileData() {
    return { ...this.projectiles };
  }
}

module.exports = MobManager; 