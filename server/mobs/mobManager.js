// Mob Manager - handles spawning, updating, and interactions with all mobsconst passiveMobs = require('./passiveMobs');const neutralMobs = require('./neutralMobs');const hostileMobs = require('./hostileMobs');const netherMobs = require('./netherMobs');const aquaticMobs = require('./aquaticMobs');const VillagerNPC = require('./villagerNPC');const ZombieVillager = require('./zombieVillager');const Warden = require('./warden');const { Frog, Tadpole } = require('./frogAndTadpole');const Allay = require('./allay');const Sniffer = require('./sniffer');const Camel = require('./camel');const Breeze = require('./breeze');

class MobManager {
  constructor() {
    this.mobs = {};
    this.projectiles = {};
    this.mobCap = {
      passive: 10,  // Max passive mobs
      neutral: 10,  // Max neutral mobs
      hostile: 15,  // Max hostile mobs
      villager: 20  // Max villagers
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
      'squid': aquaticMobs.Squid,
      'glow_squid': aquaticMobs.GlowSquid,
      'frog': Frog,
      'tadpole': Tadpole,
      'allay': Allay,
      'sniffer': Sniffer,
      'camel': Camel,
      
      // Neutral mobs
      'wolf': neutralMobs.Wolf,
      'spider': neutralMobs.Spider,
      'enderman': neutralMobs.Enderman,
      'goat': neutralMobs.Goat,
      
      // Hostile mobs
      'zombie': hostileMobs.Zombie,
      'skeleton': hostileMobs.Skeleton,
      'creeper': hostileMobs.Creeper,
      'guardian': hostileMobs.Guardian,
      'elder_guardian': hostileMobs.ElderGuardian,
      'silverfish': hostileMobs.Silverfish,
      'warden': Warden,
      'breeze': Breeze,
      
      // Nether mobs
      'piglin': netherMobs.Piglin,
      'zombified_piglin': netherMobs.ZombifiedPiglin,
      'hoglin': netherMobs.Hoglin,
      'strider': netherMobs.Strider,
      'zoglin': netherMobs.Zoglin,
      
      // Villagers
      'villager': VillagerNPC
    };
    this.daytime = true;
    this.worldTime = 0;
    this.lastSpawnTime = 0;
    this.spawnCooldown = 200; // Ticks between spawn attempts (10 seconds)
    
    // Reference to the biome manager (set by server when initializing)
    this.biomeManager = null;
    
    // World seed (set by server when initializing)
    this.worldSeed = 0;
    
    // Weather conditions
    this.isRaining = false;
    this.moonPhase = 0; // 0-7, with 0 being full moon
    
    // Villages
    this.villages = {};
  }

  // Set the biome manager reference
  setBiomeManager(biomeManager) {
    this.biomeManager = biomeManager;
  }
  
  // Set the world seed
  setWorldSeed(seed) {
    this.worldSeed = seed;
  }
  
  // Set weather conditions
  setWeather(isRaining) {
    this.isRaining = isRaining;
  }
  
  // Set moon phase
  setMoonPhase(phase) {
    this.moonPhase = phase % 8; // Ensure it's between 0-7
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
        
      case 'grow_into_frog':
        // Tadpole grew into a frog
        const { position, variant } = updateResult;
        console.log(`Tadpole grew into a ${variant} frog at`, position);
        
        // Remove the tadpole and spawn a frog
        this.spawnMob('frog', position, { variant });
        mob.dead = true;
        break;
        
      case 'allay_duplicated':
        // Allay has duplicated after interacting with a note block while holding an item
        const newAllayData = updateResult.newAllay;
        console.log('Allay duplicated at', newAllayData.position);
        
        // Spawn the new Allay
        this.spawnMob('allay', newAllayData.position, newAllayData.options);
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
    
    // If biome manager is available, use biome-specific spawning
    if (this.biomeManager) {
      return this.trySpawnBiomeSpecificMob(spawnPos, mobCategory);
    } else {
      // Fall back to original spawning if no biome manager
      const mobType = this.selectMobType(mobCategory);
      
      if (mobType) {
        this.spawnMob(mobType, spawnPos);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Try to spawn a biome-specific mob at the given position
   * @param {Object} position - Spawn position
   * @param {string} category - Mob category (passive, neutral, hostile)
   * @returns {boolean} - Whether a mob was spawned
   */
  trySpawnBiomeSpecificMob(position, category) {
    // Make sure biome manager is set
    if (!this.biomeManager) return false;
    
    // Get biome at spawn position
    const biome = this.biomeManager.getBiomeAt(position.x, position.z);
    if (!biome) return false;
    
    // Handle different biomes
    const biomeId = biome.id || '';
    
    switch (category) {
      case 'passive':
        // Deep ocean biomes have squids
        if (biomeId.includes('ocean') && position.y < 60) {
          // 70% chance of regular squid, 30% chance of glow squid in deep ocean
          const squidType = (Math.random() < 0.3 && position.y < 40) ? 'glow_squid' : 'squid';
          this.spawnMob(squidType, position);
          return true;
        }
        
        // Wolves in forests
        if ((biomeId.includes('forest') || biomeId.includes('taiga')) && Math.random() < 0.2) {
          this.spawnMob('wolf', position);
          return true;
        }
        
        // Goats in mountain biomes
        if (biomeId.includes('mountain') && Math.random() < 0.2) {
          this.spawnMob('goat', position);
          return true;
        }
        
        // Frogs in swamp biomes
        if (biomeId.includes('swamp') && Math.random() < 0.15) {
          // 30% chance of tadpole instead of frog near water
          const nearWater = position.y <= 62;
          if (nearWater && Math.random() < 0.3) {
            this.spawnMob('tadpole', position);
          } else {
            this.spawnMob('frog', position);
          }
          return true;
        }
        
        // Camels in desert and savanna biomes
        if ((biomeId.includes('desert') || biomeId.includes('savanna')) && Math.random() < 0.15) {
          // Camels are rare, and sometimes spawn as a pair
          const isBaby = Math.random() < 0.1; // 10% chance of baby
          this.spawnMob('camel', position, { isAdult: !isBaby });
          
          // 25% chance to spawn a second camel nearby (possibly to form a family)
          if (Math.random() < 0.25) {
            const offset = {
              x: position.x + (Math.random() * 4 - 2),
              y: position.y,
              z: position.z + (Math.random() * 4 - 2)
            };
            const secondIsBaby = Math.random() < 0.3; // Higher chance of baby for second camel
            this.spawnMob('camel', offset, { isAdult: !secondIsBaby });
          }
          
          return true;
        }
        
        // Sniffers in cherry grove biomes
        if (biomeId.includes('cherry_grove') && Math.random() < 0.05) {
          // Sniffers are rare, sometimes spawn as a baby
          const isBaby = Math.random() < 0.2; // 20% chance of baby
          this.spawnMob('sniffer', position, { isAdult: !isBaby });
          return true;
        }
        
        break;
        
      case 'neutral':
        // ... existing code ...
        break;
        
      case 'hostile':
        // ... existing code ...
        break;
        
      default:
        // Unknown category
        console.log('Unknown category:', category);
        return false;
    }
    
    return false;
  }

  // Original method kept for backwards compatibility
  selectMobType(category) {
    const mobTypes = {
      passive: ['sheep', 'cow', 'pig', 'chicken', 'frog', 'tadpole', 'allay'],
      neutral: ['wolf', 'spider', 'enderman', 'goat'],
      hostile: ['zombie', 'skeleton', 'creeper'],
      villager: ['villager']
    };
    
    const availableTypes = mobTypes[category];
    
    if (!availableTypes || availableTypes.length === 0) {
      return null;
    }
    
    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }

  // Spawn a specific mob type
  spawnMob(mobType, position, options = {}) {
    const MobClass = this.mobRegistry[mobType];
    
    if (!MobClass) {
      console.error(`Unknown mob type: ${mobType}`);
      return null;
    }
    
    // Create a new mob instance
    const mob = new MobClass(position, options);
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
        } else if (data.action === 'equip_armor' && mob.tamed) {
          // Wolf armor interaction - part of 1.22 Sorcery Update
          // Get the armor item from player inventory (handled on client side)
          const armorItem = data.armorItem;
          
          // Check if wolf is owned by this player
          if (mob.owner !== playerId) {
            return {
              success: false,
              error: 'You can only equip armor on your own wolf'
            };
          }
          
          // Try to equip the armor
          const success = mob.equipArmor(armorItem);
          return {
            success: success,
            armorInfo: mob.getArmorInfo()
          };
        } else if (data.action === 'remove_armor' && mob.tamed) {
          // Wolf armor removal - part of 1.22 Sorcery Update
          // Check if wolf is owned by this player
          if (mob.owner !== playerId) {
            return {
              success: false,
              error: 'You can only remove armor from your own wolf'
            };
          }
          
          // Check if wolf has armor equipped
          if (!mob.hasArmor()) {
            return {
              success: false,
              error: 'This wolf has no armor equipped'
            };
          }
          
          // Remove the armor
          const armorItem = mob.removeArmor();
          return {
            success: true,
            armorItem: armorItem
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

  /**
   * Add a village to track
   * @param {Object} village - Village data
   */
  addVillage(village) {
    this.villages[village.id] = village;
  }
  
  /**
   * Get village by ID
   * @param {string} villageId - Village ID
   * @returns {Object|null} - Village data or null if not found
   */
  getVillage(villageId) {
    return this.villages[villageId] || null;
  }
  
  /**
   * Get all villages
   * @returns {Object} - All villages
   */
  getVillages() {
    return this.villages;
  }
  
  /**
   * Handle player interaction with a villager for trading
   * @param {string} playerId - Player ID
   * @param {string} mobId - Mob ID
   * @param {Object} data - Interaction data
   * @returns {Object} - Interaction result
   */
  handleVillagerTrade(playerId, mobId, data) {
    const mob = this.mobs[mobId];
    const player = this.getPlayerById(playerId);
    
    if (!mob || mob.type !== 'villager') {
      return { success: false, error: 'Not a villager' };
    }
    
    if (data.action === 'get_trades') {
      // Return available trades
      return {
        success: true,
        trades: mob.getAvailableTrades(),
        villagerInfo: {
          profession: mob.profession,
          level: mob.level,
          experience: mob.experience,
          experienceNeeded: mob.experienceNeeded,
          villageId: mob.villageId
        }
      };
    } else if (data.action === 'execute_trade') {
      // Execute a trade using the reputation manager if available
      if (global.villageReputationManager && mob.villageId) {
        return mob.executeTrade(player, data.tradeId, global.villageReputationManager);
      } else {
        return mob.executeTrade(player, data.tradeId);
      }
    }
    
    return { success: false, error: 'Unknown action' };
  }

  /**
   * Get a player by ID
   * @param {string} playerId - Player ID to find
   * @returns {Object|null} - Player object or null if not found
   */
  getPlayerById(playerId) {
    // This relies on the server setting players on the mobManager
    // If that's not happening, this would need to be implemented differently
    if (this.players && this.players[playerId]) {
      return this.players[playerId];
    }
    
    // Fallback to simple player with ID
    return { id: playerId };
  }

  /**
   * Register players with the mob manager
   * @param {Object} players - Object mapping player IDs to player objects
   */
  registerPlayers(players) {
    this.players = players;
  }

  /**
   * Handle zombie villager curing
   * @param {string} zombieId - Zombie villager ID
   * @param {string} playerId - Player ID who cured
   * @returns {Object} - The new villager created or null
   */
  handleZombieVillagerCure(zombieId, playerId) {
    const zombieVillager = this.mobs[zombieId];
    if (!zombieVillager || zombieVillager.type !== 'zombie_villager') {
      return null;
    }
    
    // Get zombie villager data before removing it
    const {
      position,
      profession,
      level,
      trades,
      villageId,
      isChild
    } = zombieVillager;
    
    // Remove the zombie villager
    delete this.mobs[zombieId];
    
    // Create a new villager at the same position
    const villager = this.spawnMob('villager', position, {
      profession,
      level,
      trades,
      villageId,
      isChild,
      // The new villager is created with the same properties
    });
    
    // Update reputation if applicable
    if (global.villageReputationManager && villageId) {
      global.villageReputationManager.updateReputation(
        villageId,
        playerId,
        'ZOMBIE_CURED'
      );
    }
    
    return villager;
  }

  /**
   * Handle villager conversion to zombie
   * @param {string} villagerId - Villager ID
   * @returns {Object} - The new zombie villager or null
   */
  handleVillagerConversion(villagerId) {
    const villager = this.mobs[villagerId];
    if (!villager || villager.type !== 'villager') {
      return null;
    }
    
    // Start conversion process on villager
    villager.startZombieConversion();
    
    // The rest of the conversion will happen in the villager's update method
    return villager;
  }

  /**
   * Spawn a villager with profession and attributes
   * @param {Object} position - Spawn position
   * @param {Object} options - Villager options (profession, level, etc.)
   * @param {string} villageId - Village this villager belongs to
   * @returns {Object} - New villager mob
   */
  spawnVillager(position, options = {}, villageId = null) {
    if (villageId) {
      options.villageId = villageId;
    }
    
    return this.spawnMob('villager', position, options);
  }

  /**
   * Complete villager to zombie villager conversion
   * @param {string} villagerId - Villager ID
   * @returns {Object} - The new zombie villager or null
   */
  completeVillagerConversion(villagerId) {
    const villager = this.mobs[villagerId];
    if (!villager || villager.type !== 'villager' || !villager.isConverting) {
      return null;
    }
    
    // Get conversion data
    const conversionData = villager.completeZombieConversion();
    
    // Remove the villager
    delete this.mobs[villagerId];
    
    // Spawn a zombie villager
    const zombieVillager = this.spawnMob('zombie_villager', conversionData.position, {
      profession: conversionData.profession,
      level: conversionData.level,
      trades: conversionData.trades,
      villageId: conversionData.villageId,
      isChild: conversionData.isChild,
      originalVillagerId: conversionData.originalVillagerId
    });
    
    return zombieVillager;
  }
}

module.exports = MobManager; 