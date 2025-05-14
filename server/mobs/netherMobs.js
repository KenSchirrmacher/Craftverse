/**
 * Nether Update Mobs
 * Contains implementations for: Piglin, Hoglin, Strider, Zoglin, and Zombified Piglin
 */

const MobBase = require('./mobBase');
const { calculateDistance, getRandomInt } = require('../utils/mathUtils');

/**
 * Piglin - Neutral mob that attacks players without gold armor
 * Can barter with players using gold ingots
 */
class Piglin extends MobBase {
  /**
   * Create a new Piglin mob
   * @param {Object} position - Initial position {x, y, z}
   */
  constructor(position) {
    super({
      type: 'piglin',
      position,
      health: 16,
      maxHealth: 16,
      attackDamage: 5,
      attackRange: 1.5,
      detectionRange: 16,
      speed: 0.35,
      drops: {
        gold_ingot: { chance: 0.1, min: 0, max: 1 },
        gold_nugget: { chance: 0.5, min: 1, max: 3 },
        cooked_porkchop: { chance: 0.25, min: 1, max: 1 }
      },
      armor: 2,
      hostileTo: ['player'],
      fleeFrom: [],
      isNeutral: true,
      dimension: 'nether'
    });

    // Piglin-specific properties
    this.isAdult = true;
    this.barteringCooldown = 0;
    this.isBartering = false;
    this.barteringItem = null;
    this.barteringProgress = 0;
    this.maxBarteringTime = 100; // 5 seconds at 20 ticks/sec
    this.isZombifying = false;
    this.zombifyingProgress = 0;
    this.maxZombifyingTime = 300; // 15 seconds at 20 ticks/sec
    this.aggroToPlayersWithoutGold = true;
    this.preferredItems = [
      'gold_ingot', 'gold_block', 'golden_helmet', 'golden_chestplate', 
      'golden_leggings', 'golden_boots', 'golden_sword', 'golden_axe',
      'golden_pickaxe', 'golden_shovel', 'golden_hoe'
    ];
    
    // Barter loot table
    this.barterLoot = [
      { item: 'glowstone_dust', chance: 0.1, min: 4, max: 8 },
      { item: 'ender_pearl', chance: 0.05, min: 2, max: 4 },
      { item: 'string', chance: 0.1, min: 3, max: 9 },
      { item: 'nether_quartz', chance: 0.1, min: 5, max: 12 },
      { item: 'obsidian', chance: 0.1, min: 1, max: 3 },
      { item: 'crying_obsidian', chance: 0.05, min: 1, max: 3 },
      { item: 'soul_sand', chance: 0.1, min: 2, max: 8 },
      { item: 'potion_fire_resistance', chance: 0.05, min: 1, max: 1 },
      { item: 'iron_boots', chance: 0.02, min: 1, max: 1 },
      { item: 'iron_nugget', chance: 0.1, min: 4, max: 9 },
      { item: 'splash_potion_fire_resistance', chance: 0.02, min: 1, max: 1 },
      { item: 'golden_sword', chance: 0.05, min: 1, max: 1, enchanted: true },
      { item: 'spectral_arrow', chance: 0.05, min: 6, max: 12 },
      { item: 'blackstone', chance: 0.1, min: 8, max: 16 },
      { item: 'magma_cream', chance: 0.1, min: 2, max: 6 }
    ];
  }

  /**
   * Update the Piglin's state based on game logic
   * @param {Object} world - World object
   * @param {Object} players - Players object
   * @param {Number} deltaTime - Time since last update in ms
   */
  update(world, players, deltaTime) {
    // Convert time to ticks (assuming 20 ticks per second)
    const dt = deltaTime / 50;

    // Check if should zombify (if in Overworld)
    if (this.dimension !== 'nether' && !this.isZombifying) {
      this.isZombifying = true;
      this.zombifyingProgress = 0;
    }

    // Handle zombifying
    if (this.isZombifying) {
      this.zombifyingProgress += dt;
      
      // Spawn zombified version when zombification completes
      if (this.zombifyingProgress >= this.maxZombifyingTime) {
        this.transformToZombifiedPiglin();
        return; // Stop processing after zombification
      }
    }
    
    // Handle bartering if active
    if (this.isBartering) {
      this.barteringProgress += dt;
      
      // Complete bartering
      if (this.barteringProgress >= this.maxBarteringTime) {
        this.completeBarter();
      }
      
      // Don't do other actions while bartering
      return;
    }

    // Decrease bartering cooldown if active
    if (this.barteringCooldown > 0) {
      this.barteringCooldown -= dt;
    }
    
    // Standard mob behavior
    super.update(world, players, deltaTime);
  }

  /**
   * Determines if Piglin should be aggressive to a player
   * @param {Object} player - Player to check
   * @returns {Boolean} - Whether the Piglin should attack
   */
  shouldAttack(player) {
    if (!this.aggroToPlayersWithoutGold) return false;
    
    // Check if player is wearing gold armor
    const hasGoldArmor = this.isPlayerWearingGoldArmor(player);
    return !hasGoldArmor;
  }

  /**
   * Checks if a player is wearing any gold armor
   * @param {Object} player - Player to check
   * @returns {Boolean} - Whether player is wearing gold armor
   */
  isPlayerWearingGoldArmor(player) {
    // Check if player has gold armor in any equipment slot
    if (!player.equipment) return false;
    
    const armor = player.equipment;
    return Object.values(armor).some(item => 
      item && item.id && item.id.startsWith('golden_')
    );
  }

  /**
   * Process a player interaction with the Piglin
   * @param {Object} player - Player interacting
   * @param {Object} interaction - Interaction data
   * @returns {Object} - Result of interaction
   */
  processInteraction(player, interaction) {
    // Handle bartering
    if (interaction.action === 'give_item' && interaction.itemId === 'gold_ingot') {
      return this.startBartering(player, interaction.count || 1);
    }
    
    return super.processInteraction(player, interaction);
  }

  /**
   * Start bartering process
   * @param {Object} player - Player trading with the Piglin
   * @param {Number} count - Number of gold ingots
   * @returns {Object} - Result of interaction
   */
  startBartering(player, count) {
    // Check if Piglin can barter now
    if (this.isBartering || this.barteringCooldown > 0) {
      return { 
        success: false, 
        message: 'Piglin is busy or on cooldown'
      };
    }
    
    // Start bartering
    this.isBartering = true;
    this.barteringProgress = 0;
    this.barteringItem = { id: 'gold_ingot', count };
    this.lookAt(player.position);
    
    // Animation state
    this.setAnimationState('admiring_item');
    
    return { 
      success: true, 
      message: 'Piglin accepted gold ingot'
    };
  }

  /**
   * Complete bartering process and give items
   */
  completeBarter() {
    this.isBartering = false;
    this.barteringProgress = 0;
    this.barteringCooldown = 240; // 12 seconds cooldown
    
    // Clear animation state
    this.setAnimationState('idle');
    
    // Generate barter loot
    const loot = this.generateBarterLoot(this.barteringItem.count);
    
    // Drop items into the world
    this.dropBarterLoot(loot);
    
    // Clear bartering item
    this.barteringItem = null;
  }

  /**
   * Generate loot from bartering
   * @param {Number} count - Number of gold ingots used for bartering
   * @returns {Array} - Array of items to drop
   */
  generateBarterLoot(count) {
    const loot = [];
    
    // Generate loot for each gold ingot
    for (let i = 0; i < count; i++) {
      // Select random item from barter table based on chance
      const rand = Math.random();
      let cumChance = 0;
      
      for (const entry of this.barterLoot) {
        cumChance += entry.chance;
        
        if (rand < cumChance) {
          // Determine quantity
          const quantity = getRandomInt(entry.min, entry.max);
          
          // Create item
          const item = {
            id: entry.item,
            count: quantity
          };
          
          // Add enchantments if applicable
          if (entry.enchanted) {
            item.enchantments = this.generateRandomEnchantments(entry.item);
          }
          
          loot.push(item);
          break;
        }
      }
    }
    
    return loot;
  }

  /**
   * Drop bartered items in the world
   * @param {Array} items - Items to drop
   */
  dropBarterLoot(items) {
    if (!this.world) return;
    
    // Drop all items slightly offset from piglin position
    for (const item of items) {
      const offset = {
        x: (Math.random() - 0.5) * 0.5,
        y: 0.5,
        z: (Math.random() - 0.5) * 0.5
      };
      
      const position = {
        x: this.position.x + offset.x,
        y: this.position.y + offset.y,
        z: this.position.z + offset.z
      };
      
      // Create item entity in world
      this.world.dropItem(item, position);
    }
    
    // Emit event for clients
    this.emit('barter_complete', {
      position: this.position,
      itemCount: items.length
    });
  }

  /**
   * Generate random enchantments for an item
   * @param {String} itemId - Item ID to enchant
   * @returns {Array} - Array of enchantments
   */
  generateRandomEnchantments(itemId) {
    const enchantments = [];
    
    // Only process items that can be enchanted
    if (itemId.includes('sword')) {
      // Add sharpness (50% chance)
      if (Math.random() < 0.5) {
        const level = getRandomInt(1, 3);
        enchantments.push({ id: 'sharpness', level });
      }
      
      // Add knockback (30% chance)
      if (Math.random() < 0.3) {
        const level = getRandomInt(1, 2);
        enchantments.push({ id: 'knockback', level });
      }
      
      // Add fire aspect (20% chance)
      if (Math.random() < 0.2) {
        enchantments.push({ id: 'fire_aspect', level: 1 });
      }
    }
    
    return enchantments;
  }

  /**
   * Transform this Piglin into a Zombified Piglin
   */
  transformToZombifiedPiglin() {
    if (!this.world) return;
    
    // Spawn a zombified piglin at this location
    const zombifiedPiglin = this.world.spawnMob('zombified_piglin', this.position);
    
    // Transfer relevant properties
    if (zombifiedPiglin) {
      zombifiedPiglin.health = this.health;
      zombifiedPiglin.target = this.target;
      zombifiedPiglin.lookDir = this.lookDir;
    }
    
    // Remove this piglin
    this.world.removeMob(this.id);
  }

  /**
   * Sets animation state for the Piglin
   * @param {String} state - Animation state name
   */
  setAnimationState(state) {
    this.animationState = state;
    
    // Emit animation event for clients
    this.emit('animation_change', {
      mobId: this.id,
      animation: state
    });
  }

  /**
   * Serialize the Piglin for storage or transmission
   * @returns {Object} - Serialized data
   */
  serialize() {
    const data = super.serialize();
    
    // Add Piglin-specific properties
    return {
      ...data,
      isAdult: this.isAdult,
      barteringCooldown: this.barteringCooldown,
      isBartering: this.isBartering,
      barteringProgress: this.barteringProgress,
      isZombifying: this.isZombifying,
      zombifyingProgress: this.zombifyingProgress
    };
  }

  /**
   * Deserialize data to restore Piglin state
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    super.deserialize(data);
    
    // Restore Piglin-specific properties
    if (data.isAdult !== undefined) this.isAdult = data.isAdult;
    if (data.barteringCooldown !== undefined) this.barteringCooldown = data.barteringCooldown;
    if (data.isBartering !== undefined) this.isBartering = data.isBartering;
    if (data.barteringProgress !== undefined) this.barteringProgress = data.barteringProgress;
    if (data.isZombifying !== undefined) this.isZombifying = data.isZombifying;
    if (data.zombifyingProgress !== undefined) this.zombifyingProgress = data.zombifyingProgress;
  }
}

/**
 * ZombifiedPiglin - Neutral mob converted from Piglins in the Overworld
 * Hostile when provoked, can spawn with gold sword
 */
class ZombifiedPiglin extends MobBase {
  /**
   * Create a new Zombified Piglin mob
   * @param {Object} position - Initial position {x, y, z}
   */
  constructor(position) {
    super({
      type: 'zombified_piglin',
      position,
      health: 20,
      maxHealth: 20,
      attackDamage: 5,
      attackRange: 1.5,
      detectionRange: 16,
      speed: 0.25,
      drops: {
        rotten_flesh: { chance: 0.5, min: 0, max: 2 },
        gold_nugget: { chance: 0.4, min: 0, max: 1 },
        gold_ingot: { chance: 0.05, min: 0, max: 1 },
        golden_sword: { chance: 0.025, min: 0, max: 1, durability: 0.1 }
      },
      armor: 2,
      hostileTo: [],
      fleeFrom: [],
      isNeutral: true
    });

    // Zombified Piglin specific properties
    this.angerLevel = 0;
    this.maxAngerLevel = 600; // 30 seconds at 20 ticks/sec
    this.alertRadius = 16; // Other zombified piglins in this radius will also be angered
    this.hasGoldenSword = Math.random() < 0.5; // 50% chance to spawn with a golden sword
    
    // If has sword, increase damage
    if (this.hasGoldenSword) {
      this.attackDamage = 9; // Base damage + golden sword damage
    }
  }

  /**
   * Update the Zombified Piglin's state based on game logic
   * @param {Object} world - World object
   * @param {Object} players - Players object
   * @param {Number} deltaTime - Time since last update in ms
   */
  update(world, players, deltaTime) {
    // Convert time to ticks (assuming 20 ticks per second)
    const dt = deltaTime / 50;

    // Handle anger cooldown
    if (this.angerLevel > 0) {
      this.angerLevel = Math.max(0, this.angerLevel - dt);
      
      // Reset hostility when no longer angry
      if (this.angerLevel === 0) {
        this.hostileTo = [];
        this.target = null;
        
        // Emit calmed down event
        this.emit('calmed_down', {
          mobId: this.id
        });
      }
    }
    
    // Standard mob behavior
    super.update(world, players, deltaTime);
  }

  /**
   * Handle when this mob takes damage
   * @param {Number} amount - Amount of damage taken
   * @param {Object} source - Source of the damage
   * @returns {Object} - Result of taking damage
   */
  takeDamage(amount, source) {
    const result = super.takeDamage(amount, source);
    
    // Become hostile when damaged
    if (result.damage > 0 && source) {
      this.becomeAngry(source.id);
      
      // Alert nearby zombified piglins
      this.alertNearbyPiglins(source.id);
    }
    
    return result;
  }

  /**
   * Make this zombified piglin angry at a specific entity
   * @param {String} targetId - ID of the entity to be angry at
   */
  becomeAngry(targetId) {
    this.angerLevel = this.maxAngerLevel;
    this.hostileTo = [targetId.includes('player') ? 'player' : targetId];
    
    // Emit angry event for client animations
    this.emit('became_angry', {
      mobId: this.id,
      targetId
    });
  }

  /**
   * Alert nearby zombified piglins to become angry at the same target
   * @param {String} targetId - ID of the entity to be angry at
   */
  alertNearbyPiglins(targetId) {
    if (!this.world) return;
    
    // Find nearby zombified piglins
    const nearbyPiglins = this.world.getNearbyMobsByType(
      'zombified_piglin', 
      this.position, 
      this.alertRadius
    );
    
    // Make them all angry at the same target
    for (const piglin of nearbyPiglins) {
      if (piglin.id !== this.id && piglin.becomeAngry) {
        piglin.becomeAngry(targetId);
      }
    }
  }

  /**
   * Serialize the Zombified Piglin for storage or transmission
   * @returns {Object} - Serialized data
   */
  serialize() {
    const data = super.serialize();
    
    // Add Zombified Piglin-specific properties
    return {
      ...data,
      angerLevel: this.angerLevel,
      hasGoldenSword: this.hasGoldenSword
    };
  }

  /**
   * Deserialize data to restore Zombified Piglin state
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    super.deserialize(data);
    
    // Restore Zombified Piglin-specific properties
    if (data.angerLevel !== undefined) this.angerLevel = data.angerLevel;
    if (data.hasGoldenSword !== undefined) this.hasGoldenSword = data.hasGoldenSword;
    
    // Restore increased damage if has sword
    if (this.hasGoldenSword) {
      this.attackDamage = 9;
    }
  }
}

/**
 * Hoglin - Hostile mob that attacks players and can be hunted by Piglins
 * Can be bred with crimson fungi and transforms into Zoglin in the Overworld
 */
class Hoglin extends MobBase {
  /**
   * Create a new Hoglin mob
   * @param {Object} position - Initial position {x, y, z}
   */
  constructor(position) {
    super({
      type: 'hoglin',
      position,
      health: 40,
      maxHealth: 40,
      attackDamage: 6,
      attackRange: 2.0,
      detectionRange: 16,
      speed: 0.3,
      drops: {
        porkchop: { chance: 1.0, min: 2, max: 4 },
        leather: { chance: 0.5, min: 0, max: 2 }
      },
      armor: 4,
      hostileTo: ['player'],
      fleeFrom: ['warped_fungus'],
      isNeutral: false,
      dimension: 'nether'
    });

    // Hoglin-specific properties
    this.isAdult = true;
    this.isBreedingCooldown = 0;
    this.isZombifying = false;
    this.zombifyingProgress = 0;
    this.maxZombifyingTime = 300; // 15 seconds at 20 ticks/sec
    this.breedingItems = ['crimson_fungus'];
    this.attackCooldown = 0;
    this.maxAttackCooldown = 60; // 3 seconds at 20 ticks/sec
    this.fearWarped = true; // Flees from warped fungus
    this.knockbackStrength = 1.5;
    
    // Younger hoglins have less health
    if (!this.isAdult) {
      this.health = 20;
      this.maxHealth = 20;
      this.attackDamage = 0; // Baby hoglins don't attack
    }
  }

  /**
   * Update the Hoglin's state based on game logic
   * @param {Object} world - World object
   * @param {Object} players - Players object
   * @param {Number} deltaTime - Time since last update in ms
   */
  update(world, players, deltaTime) {
    // Convert time to ticks (assuming 20 ticks per second)
    const dt = deltaTime / 50;

    // Check if should zombify (if in Overworld)
    if (this.dimension !== 'nether' && !this.isZombifying) {
      this.isZombifying = true;
      this.zombifyingProgress = 0;
    }

    // Handle zombifying
    if (this.isZombifying) {
      this.zombifyingProgress += dt;
      
      // Transform to Zoglin when zombification completes
      if (this.zombifyingProgress >= this.maxZombifyingTime) {
        this.transformToZoglin();
        return; // Stop processing after zombification
      }
    }
    
    // Decrease breeding cooldown
    if (this.breedingCooldown > 0) {
      this.breedingCooldown -= dt;
    }
    
    // Decrease attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }
    
    // Check for warped fungus nearby if fearful
    if (this.fearWarped) {
      this.checkForWarpedFungus(world);
    }
    
    // Standard mob behavior
    super.update(world, players, deltaTime);
  }

  /**
   * Checks for warped fungus nearby and flees if found
   * @param {Object} world - World object
   */
  checkForWarpedFungus(world) {
    if (!world) return;
    
    // Look for warped fungus blocks in a 8 block radius
    const warpedFungi = world.getNearbyBlocksByType(
      'warped_fungus',
      this.position,
      8
    );
    
    if (warpedFungi.length > 0) {
      // Find closest warped fungus
      let closestFungus = warpedFungi[0];
      let closestDistance = calculateDistance(this.position, closestFungus.position);
      
      for (let i = 1; i < warpedFungi.length; i++) {
        const distance = calculateDistance(this.position, warpedFungi[i].position);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestFungus = warpedFungi[i];
        }
      }
      
      // Flee from the closest warped fungus
      this.fleeFrom(closestFungus.position);
    }
  }

  /**
   * Handle when this mob takes damage
   * @param {Number} amount - Amount of damage taken
   * @param {Object} source - Source of the damage
   * @returns {Object} - Result of taking damage
   */
  takeDamage(amount, source) {
    const result = super.takeDamage(amount, source);
    
    // Play hurt sound and animation
    if (result.damage > 0) {
      this.emit('hoglin_hurt', {
        mobId: this.id,
        health: this.health,
        maxHealth: this.maxHealth
      });
    }
    
    return result;
  }

  /**
   * Attack a target
   * @param {Object} target - Target to attack
   */
  attack(target) {
    // Check if on cooldown
    if (this.attackCooldown > 0) {
      return;
    }
    
    // Execute the attack
    if (target && this.isAdult) {
      // Base damage calculation
      const damage = this.attackDamage;
      
      // Apply damage to target
      if (target.takeDamage) {
        target.takeDamage(damage, this);
      }
      
      // Apply knockback
      if (target.applyKnockback) {
        const knockbackDirection = {
          x: target.position.x - this.position.x,
          y: 0.5, // Upward component
          z: target.position.z - this.position.z
        };
        
        // Normalize direction
        const magnitude = Math.sqrt(
          knockbackDirection.x * knockbackDirection.x + 
          knockbackDirection.z * knockbackDirection.z
        );
        
        if (magnitude > 0) {
          knockbackDirection.x = (knockbackDirection.x / magnitude) * this.knockbackStrength;
          knockbackDirection.z = (knockbackDirection.z / magnitude) * this.knockbackStrength;
          
          target.applyKnockback(knockbackDirection);
        }
      }
      
      // Start cooldown
      this.attackCooldown = this.maxAttackCooldown;
      
      // Animation and sound effects
      this.emit('hoglin_attack', {
        mobId: this.id,
        targetId: target.id
      });
    }
  }

  /**
   * Process a player interaction with the Hoglin
   * @param {Object} player - Player interacting
   * @param {Object} interaction - Interaction data
   * @returns {Object} - Result of interaction
   */
  processInteraction(player, interaction) {
    // Check for feeding with crimson fungi
    if (interaction.action === 'feed' && 
        this.breedingItems.includes(interaction.itemId) && 
        this.isAdult) {
      
      return this.feed(player, interaction.itemId);
    }
    
    return super.processInteraction(player, interaction);
  }

  /**
   * Feed the Hoglin
   * @param {Object} player - Player feeding
   * @param {String} itemId - Item used for feeding
   * @returns {Object} - Result of feeding
   */
  feed(player, itemId) {
    // Check if can breed
    if (this.breedingCooldown > 0) {
      return {
        success: false,
        message: 'Hoglin cannot breed yet'
      };
    }
    
    // Apply breeding effect
    this.startBreeding();
    
    return {
      success: true,
      message: 'Hoglin fed',
      consumeItem: true
    };
  }

  /**
   * Start breeding process
   */
  startBreeding() {
    this.breedingCooldown = 6000; // 5 minutes cooldown (6000 ticks)
    
    // Find another bred Hoglin nearby
    if (this.world) {
      const nearbyHoglins = this.world.getNearbyMobsByType(
        'hoglin',
        this.position,
        8
      );
      
      for (const hoglin of nearbyHoglins) {
        if (hoglin.id !== this.id && 
            hoglin.isAdult &&
            hoglin.breedingCooldown > 0 && 
            hoglin.breedingCooldown < 5950) {
          
          // Spawn a baby hoglin
          this.spawnBaby(hoglin);
          break;
        }
      }
    }
    
    // Emit breeding effect
    this.emit('hoglin_breeding', {
      mobId: this.id
    });
  }

  /**
   * Spawn a baby Hoglin
   * @param {Object} partner - Partner Hoglin
   */
  spawnBaby(partner) {
    if (!this.world) return;
    
    // Determine position between parents
    const babyPosition = {
      x: (this.position.x + partner.position.x) / 2,
      y: this.position.y,
      z: (this.position.z + partner.position.z) / 2
    };
    
    // Spawn baby
    const baby = this.world.spawnMob('hoglin', babyPosition);
    
    // Set baby properties
    if (baby) {
      baby.isAdult = false;
      baby.health = 20;
      baby.maxHealth = 20;
      baby.attackDamage = 0;
      baby.growthAge = 0;
      baby.scale = 0.5;
      
      // Emit baby spawn event
      this.emit('hoglin_baby_spawn', {
        mobId: baby.id,
        parentIds: [this.id, partner.id]
      });
    }
  }

  /**
   * Transform this Hoglin into a Zoglin
   */
  transformToZoglin() {
    if (!this.world) return;
    
    // Spawn a Zoglin at this location
    const zoglin = this.world.spawnMob('zoglin', this.position);
    
    // Transfer relevant properties
    if (zoglin) {
      zoglin.health = this.health;
      zoglin.target = this.target;
      zoglin.lookDir = this.lookDir;
      zoglin.isAdult = this.isAdult;
      
      // Copy scale for baby hoglins
      if (!this.isAdult) {
        zoglin.isAdult = false;
        zoglin.scale = 0.5;
        zoglin.health = Math.min(zoglin.maxHealth, this.health);
      }
    }
    
    // Remove this hoglin
    this.world.removeMob(this.id);
  }

  /**
   * Serialize the Hoglin for storage or transmission
   * @returns {Object} - Serialized data
   */
  serialize() {
    const data = super.serialize();
    
    // Add Hoglin-specific properties
    return {
      ...data,
      isAdult: this.isAdult,
      breedingCooldown: this.breedingCooldown,
      isZombifying: this.isZombifying,
      zombifyingProgress: this.zombifyingProgress,
      attackCooldown: this.attackCooldown
    };
  }

  /**
   * Deserialize data to restore Hoglin state
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    super.deserialize(data);
    
    // Restore Hoglin-specific properties
    if (data.isAdult !== undefined) this.isAdult = data.isAdult;
    if (data.breedingCooldown !== undefined) this.breedingCooldown = data.breedingCooldown;
    if (data.isZombifying !== undefined) this.isZombifying = data.isZombifying;
    if (data.zombifyingProgress !== undefined) this.zombifyingProgress = data.zombifyingProgress;
    if (data.attackCooldown !== undefined) this.attackCooldown = data.attackCooldown;
    
    // Adjust properties for baby hoglins
    if (!this.isAdult) {
      this.maxHealth = 20;
      this.health = Math.min(this.health, this.maxHealth);
      this.attackDamage = 0;
      this.scale = 0.5;
    }
  }
}

/**
 * Strider - Passive mob that can walk on lava
 * Can be ridden by player and controlled with warped fungus on a stick
 */
class Strider extends MobBase {
  /**
   * Create a new Strider mob
   * @param {Object} position - Initial position {x, y, z}
   */
  constructor(position) {
    super({
      type: 'strider',
      position,
      health: 20,
      maxHealth: 20,
      attackDamage: 0, // Passive mob, no attack
      attackRange: 0,
      detectionRange: 8,
      speed: 0.25, // Base speed
      drops: {
        string: { chance: 1.0, min: 2, max: 5 }
      },
      hostileTo: [], // Passive mob
      isNeutral: false,
      dimension: 'nether'
    });

    // Strider-specific properties
    this.isAdult = true;
    this.breedingCooldown = 0;
    this.isShivering = false; // True when not in lava
    this.isBeingRidden = false;
    this.rider = null;
    this.breedingItems = ['warped_fungus'];
    this.lavaWalker = true; // Can walk on lava
    this.lavaSpeed = 0.4; // Faster in lava
    this.drySpeed = 0.1; // Slower when cold/dry
    this.lastLavaCheck = 0;
    this.saddle = false; // Has saddle equipped
    
    // Adjust child properties
    if (!this.isAdult) {
      this.health = 15;
      this.maxHealth = 15;
      this.scale = 0.5;
    }
  }

  /**
   * Update the Strider's state based on game logic
   * @param {Object} world - World object
   * @param {Object} players - Players object
   * @param {Number} deltaTime - Time since last update in ms
   */
  update(world, players, deltaTime) {
    // Convert time to ticks (assuming 20 ticks per second)
    const dt = deltaTime / 50;
    
    // Update temperature state (check if in lava)
    this.updateTemperature(world);
    
    // Decrease breeding cooldown
    if (this.breedingCooldown > 0) {
      this.breedingCooldown -= dt;
    }
    
    // If being ridden, process rider inputs
    if (this.isBeingRidden && this.rider) {
      this.processRiderInput();
    }
    
    // Call parent update with adjusted speed
    const currentSpeed = this.getCurrentSpeed();
    const originalSpeed = this.speed;
    this.speed = currentSpeed;
    
    super.update(world, players, deltaTime);
    
    // Restore original base speed
    this.speed = originalSpeed;
  }

  /**
   * Get current speed based on temperature and riding state
   * @returns {Number} - Current speed value
   */
  getCurrentSpeed() {
    if (this.isShivering) {
      return this.drySpeed;
    } else {
      return this.lavaSpeed;
    }
  }

  /**
   * Update temperature state based on block beneath
   * @param {Object} world - World object
   */
  updateTemperature(world) {
    if (!world) return;
    
    // Only check every second (20 ticks)
    this.lastLavaCheck++;
    if (this.lastLavaCheck < 20) return;
    
    this.lastLavaCheck = 0;
    
    // Check if standing on lava
    const blockBelow = world.getBlockAt({
      x: Math.floor(this.position.x),
      y: Math.floor(this.position.y - 0.1),
      z: Math.floor(this.position.z)
    });
    
    const wasShivering = this.isShivering;
    this.isShivering = !(blockBelow && blockBelow.type === 'lava');
    
    // If temperature state changed, emit an event
    if (wasShivering !== this.isShivering) {
      this.emit('strider_temperature_change', {
        mobId: this.id,
        isShivering: this.isShivering
      });
    }
  }

  /**
   * Process input from the rider
   */
  processRiderInput() {
    if (!this.rider || !this.rider.getInput) return;
    
    const input = this.rider.getInput();
    
    // Check if player is holding warped fungus on a stick
    const isHoldingFungusStick = this.rider.getHeldItem && 
                                this.rider.getHeldItem().type === 'warped_fungus_on_a_stick';
    
    // Apply movement based on rider input
    if (input) {
      // Calculate direction based on rider's look direction
      let moveDir = {
        x: 0,
        z: 0
      };
      
      if (input.forward) {
        const riderLookDir = this.rider.getLookDir();
        moveDir.x += riderLookDir.x;
        moveDir.z += riderLookDir.z;
      }
      
      if (input.backward) {
        const riderLookDir = this.rider.getLookDir();
        moveDir.x -= riderLookDir.x;
        moveDir.z -= riderLookDir.z;
      }
      
      if (input.left) {
        const riderLookDir = this.rider.getLookDir();
        moveDir.x += riderLookDir.z;
        moveDir.z -= riderLookDir.x;
      }
      
      if (input.right) {
        const riderLookDir = this.rider.getLookDir();
        moveDir.x -= riderLookDir.z;
        moveDir.z += riderLookDir.x;
      }
      
      // Normalize direction
      const magnitude = Math.sqrt(moveDir.x * moveDir.x + moveDir.z * moveDir.z);
      if (magnitude > 0) {
        moveDir.x /= magnitude;
        moveDir.z /= magnitude;
        
        // Apply speed boost if using fungus on a stick
        const speedMultiplier = isHoldingFungusStick ? 1.5 : 1.0;
        
        // Set movement direction
        this.setMoveDir({
          x: moveDir.x * speedMultiplier,
          y: 0,
          z: moveDir.z * speedMultiplier
        });
        
        // Update look direction to match movement
        this.lookDir = {
          x: moveDir.x,
          y: 0,
          z: moveDir.z
        };
      }
    }
  }

  /**
   * Process a player interaction with the Strider
   * @param {Object} player - Player interacting
   * @param {Object} interaction - Interaction data
   * @returns {Object} - Result of interaction
   */
  processInteraction(player, interaction) {
    // Check for feeding with warped fungus
    if (interaction.action === 'feed' && 
        this.breedingItems.includes(interaction.itemId) && 
        this.isAdult) {
      
      return this.feed(player, interaction.itemId);
    }
    
    // Check for adding a saddle
    if (interaction.action === 'use' && 
        interaction.itemId === 'saddle' && 
        !this.saddle && 
        this.isAdult) {
      
      this.saddle = true;
      this.emit('strider_saddle', {
        mobId: this.id,
        hasSaddle: true
      });
      
      return {
        success: true,
        message: 'Saddle added to Strider',
        consumeItem: true
      };
    }
    
    // Check for mounting the Strider
    if (interaction.action === 'mount' && 
        this.saddle && 
        !this.isBeingRidden && 
        this.isAdult) {
      
      return this.mount(player);
    }
    
    return super.processInteraction(player, interaction);
  }

  /**
   * Feed the Strider
   * @param {Object} player - Player feeding
   * @param {String} itemId - Item used for feeding
   * @returns {Object} - Result of feeding
   */
  feed(player, itemId) {
    // Check if can breed
    if (this.breedingCooldown > 0) {
      return {
        success: false,
        message: 'Strider cannot breed yet'
      };
    }
    
    // Apply breeding effect
    this.startBreeding();
    
    return {
      success: true,
      message: 'Strider fed',
      consumeItem: true
    };
  }

  /**
   * Start breeding process
   */
  startBreeding() {
    this.breedingCooldown = 6000; // 5 minutes cooldown (6000 ticks)
    
    // Find another bred Strider nearby
    if (this.world) {
      const nearbyStriders = this.world.getNearbyMobsByType(
        'strider',
        this.position,
        8
      );
      
      for (const strider of nearbyStriders) {
        if (strider.id !== this.id && 
            strider.isAdult &&
            strider.breedingCooldown > 0 && 
            strider.breedingCooldown < 5950) {
          
          // Spawn a baby strider
          this.spawnBaby(strider);
          break;
        }
      }
    }
    
    // Emit breeding effect
    this.emit('strider_breeding', {
      mobId: this.id
    });
  }

  /**
   * Spawn a baby Strider
   * @param {Object} partner - Partner Strider
   */
  spawnBaby(partner) {
    if (!this.world) return;
    
    // Determine position between parents
    const babyPosition = {
      x: (this.position.x + partner.position.x) / 2,
      y: this.position.y,
      z: (this.position.z + partner.position.z) / 2
    };
    
    // Spawn baby
    const baby = this.world.spawnMob('strider', babyPosition);
    
    // Set baby properties
    if (baby) {
      baby.isAdult = false;
      baby.health = 15;
      baby.maxHealth = 15;
      baby.scale = 0.5;
      
      // Emit baby spawn event
      this.emit('strider_baby_spawn', {
        mobId: baby.id,
        parentIds: [this.id, partner.id]
      });
    }
  }

  /**
   * Mount a player on this Strider
   * @param {Object} player - Player mounting
   * @returns {Object} - Result of mounting
   */
  mount(player) {
    if (!this.saddle || this.isBeingRidden) {
      return {
        success: false,
        message: 'Cannot mount this Strider'
      };
    }
    
    // Set rider
    this.rider = player;
    this.isBeingRidden = true;
    
    // Set player as riding
    if (player.setRiding) {
      player.setRiding(this);
    }
    
    // Emit mounted event
    this.emit('strider_mounted', {
      mobId: this.id,
      riderId: player.id
    });
    
    return {
      success: true,
      message: 'Mounted Strider'
    };
  }

  /**
   * Dismount the rider from this Strider
   * @returns {Object} - Result of dismounting
   */
  dismount() {
    if (!this.isBeingRidden || !this.rider) {
      return {
        success: false,
        message: 'No rider to dismount'
      };
    }
    
    // Clear rider's riding state
    if (this.rider.clearRiding) {
      this.rider.clearRiding();
    }
    
    // Clear rider reference
    const rider = this.rider;
    this.rider = null;
    this.isBeingRidden = false;
    
    // Emit dismounted event
    this.emit('strider_dismounted', {
      mobId: this.id,
      riderId: rider.id
    });
    
    return {
      success: true,
      message: 'Dismounted Strider'
    };
  }

  /**
   * Handle when this mob takes damage
   * @param {Number} amount - Amount of damage taken
   * @param {Object} source - Source of the damage
   * @returns {Object} - Result of taking damage
   */
  takeDamage(amount, source) {
    const result = super.takeDamage(amount, source);
    
    // Dismount rider if taking significant damage
    if (result.damage > 0 && this.isBeingRidden && this.health < this.maxHealth / 3) {
      this.dismount();
    }
    
    // Play hurt sound and animation
    if (result.damage > 0) {
      this.emit('strider_hurt', {
        mobId: this.id,
        health: this.health,
        maxHealth: this.maxHealth
      });
    }
    
    return result;
  }

  /**
   * Serialize the Strider for storage or transmission
   * @returns {Object} - Serialized data
   */
  serialize() {
    const data = super.serialize();
    
    // Add Strider-specific properties
    return {
      ...data,
      isAdult: this.isAdult,
      breedingCooldown: this.breedingCooldown,
      isShivering: this.isShivering,
      isBeingRidden: this.isBeingRidden,
      riderId: this.rider ? this.rider.id : null,
      saddle: this.saddle
    };
  }

  /**
   * Deserialize data to restore Strider state
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    super.deserialize(data);
    
    // Restore Strider-specific properties
    if (data.isAdult !== undefined) this.isAdult = data.isAdult;
    if (data.breedingCooldown !== undefined) this.breedingCooldown = data.breedingCooldown;
    if (data.isShivering !== undefined) this.isShivering = data.isShivering;
    if (data.saddle !== undefined) this.saddle = data.saddle;
    
    // Rider will be restored by entity manager
    this.isBeingRidden = false;
    this.rider = null;
    
    // Adjust properties for baby striders
    if (!this.isAdult) {
      this.maxHealth = 15;
      this.health = Math.min(this.health, this.maxHealth);
      this.scale = 0.5;
    }
  }
}

/**
 * Zoglin - Hostile mob created when a Hoglin is zombified in the Overworld
 * Attacks all mobs and players, and cannot be tamed or bred
 */
class Zoglin extends MobBase {
  /**
   * Create a new Zoglin mob
   * @param {Object} position - Initial position {x, y, z}
   */
  constructor(position) {
    super({
      type: 'zoglin',
      position,
      health: 40,
      maxHealth: 40,
      attackDamage: 6,
      attackRange: 2.0,
      detectionRange: 16,
      speed: 0.3,
      drops: {
        rotten_flesh: { chance: 1.0, min: 1, max: 3 }
      },
      armor: 2,
      hostileTo: ['player', 'villager', 'iron_golem', 'piglin', 'zombified_piglin'],
      fleeFrom: [],
      isNeutral: false
    });

    // Zoglin-specific properties
    this.isAdult = true;
    this.attackCooldown = 0;
    this.maxAttackCooldown = 60; // 3 seconds at 20 ticks/sec
    this.knockbackStrength = 1.5;
    this.isUndead = true; // Affected by healing/harming differently
    
    // Properties for younger zoglins
    if (!this.isAdult) {
      this.health = 20;
      this.maxHealth = 20;
      this.attackDamage = 3; // Baby zoglins do attack, unlike baby hoglins
      this.scale = 0.5;
      this.knockbackStrength = 0.75;
    }
  }

  /**
   * Update the Zoglin's state based on game logic
   * @param {Object} world - World object
   * @param {Object} players - Players object
   * @param {Number} deltaTime - Time since last update in ms
   */
  update(world, players, deltaTime) {
    // Convert time to ticks (assuming 20 ticks per second)
    const dt = deltaTime / 50;
    
    // Decrease attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }
    
    // Standard mob behavior
    super.update(world, players, deltaTime);
  }

  /**
   * Attack a target
   * @param {Object} target - Target to attack
   */
  attack(target) {
    // Check if on cooldown
    if (this.attackCooldown > 0) {
      return;
    }
    
    // Execute the attack
    if (target) {
      // Base damage calculation
      const damage = this.attackDamage;
      
      // Apply damage to target
      if (target.takeDamage) {
        target.takeDamage(damage, this);
      }
      
      // Apply knockback
      if (target.applyKnockback) {
        const knockbackDirection = {
          x: target.position.x - this.position.x,
          y: 0.5, // Upward component
          z: target.position.z - this.position.z
        };
        
        // Normalize direction
        const magnitude = Math.sqrt(
          knockbackDirection.x * knockbackDirection.x + 
          knockbackDirection.z * knockbackDirection.z
        );
        
        if (magnitude > 0) {
          knockbackDirection.x = (knockbackDirection.x / magnitude) * this.knockbackStrength;
          knockbackDirection.z = (knockbackDirection.z / magnitude) * this.knockbackStrength;
          
          target.applyKnockback(knockbackDirection);
        }
      }
      
      // Start cooldown
      this.attackCooldown = this.maxAttackCooldown;
      
      // Animation and sound effects
      this.emit('zoglin_attack', {
        mobId: this.id,
        targetId: target.id
      });
    }
  }

  /**
   * Handle when this mob takes damage
   * @param {Number} amount - Amount of damage taken
   * @param {Object} source - Source of the damage
   * @returns {Object} - Result of taking damage
   */
  takeDamage(amount, source) {
    // Special handling for undead mobs
    let adjustedAmount = amount;
    
    // If the damage is from a healing effect, it should harm instead
    if (source && source.type === 'effect' && source.effect === 'instant_health') {
      adjustedAmount = amount * 2; // Double damage from healing
    }
    
    // If the damage is from a harming effect, it should heal instead
    if (source && source.type === 'effect' && source.effect === 'instant_damage') {
      return { damage: 0, health: this.health, alive: true }; // No damage
    }
    
    const result = super.takeDamage(adjustedAmount, source);
    
    // Play hurt sound and animation
    if (result.damage > 0) {
      this.emit('zoglin_hurt', {
        mobId: this.id,
        health: this.health,
        maxHealth: this.maxHealth
      });
    }
    
    return result;
  }

  /**
   * Process a player interaction with the Zoglin
   * @param {Object} player - Player interacting
   * @param {Object} interaction - Interaction data
   * @returns {Object} - Result of interaction
   */
  processInteraction(player, interaction) {
    // Zoglins are always hostile and cannot be interacted with
    // This will just initiate an attack on the player
    this.setTarget(player);
    
    return {
      success: false,
      message: 'Zoglin is hostile'
    };
  }

  /**
   * Serialize the Zoglin for storage or transmission
   * @returns {Object} - Serialized data
   */
  serialize() {
    const data = super.serialize();
    
    // Add Zoglin-specific properties
    return {
      ...data,
      isAdult: this.isAdult,
      attackCooldown: this.attackCooldown
    };
  }

  /**
   * Deserialize data to restore Zoglin state
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    super.deserialize(data);
    
    // Restore Zoglin-specific properties
    if (data.isAdult !== undefined) this.isAdult = data.isAdult;
    if (data.attackCooldown !== undefined) this.attackCooldown = data.attackCooldown;
    
    // Adjust properties for baby zoglins
    if (!this.isAdult) {
      this.maxHealth = 20;
      this.health = Math.min(this.health, this.maxHealth);
      this.attackDamage = 3;
      this.scale = 0.5;
      this.knockbackStrength = 0.75;
    }
  }
}

module.exports = {
  Piglin,
  ZombifiedPiglin,
  Hoglin,
  Strider,
  Zoglin
}; 