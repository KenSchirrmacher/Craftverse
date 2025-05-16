/**
 * Sniffer mob implementation for the Trails & Tales Update
 * Features:
 * - Ancient passive mob
 * - Sniffs the ground to find ancient seeds
 * - Babies grow into adults
 * - Can be bred with Torchflower seeds
 * - Drops Sniffer eggs when sheared
 */

const MobBase = require('./mobBase');
const { getRandomInt } = require('../utils/mathUtils');

class Sniffer extends MobBase {
  /**
   * Create a new Sniffer
   * @param {Object} position - Initial position
   * @param {Object} options - Additional options
   */
  constructor(position, options = {}) {
    super('sniffer', position, 30, 0.4); // type, position, health, speed
    
    // Sniffer-specific properties
    this.isAdult = options.isAdult !== undefined ? options.isAdult : true;
    this.age = options.age || (this.isAdult ? 24000 : 0); // 20 minutes to grow if baby
    this.maxAge = 24000; // 20 minutes (at 20 ticks/second) to grow into adult
    this.growthChance = 0.005; // Chance per tick to grow when age >= maxAge
    
    // Sniffing behavior
    this.isSniffing = false;
    this.sniffCooldown = 0;
    this.sniffMaxCooldown = 200; // 10 seconds between sniffs
    this.sniffProgress = 0;
    this.sniffDuration = 100; // 5 seconds to complete a sniff
    this.digCooldown = 0;
    this.digMaxCooldown = 400; // 20 seconds between digs
    this.isDigging = false;
    this.digProgress = 0;
    this.digDuration = 60; // 3 seconds to complete a dig
    this.foundSeed = false;
    
    // Breeding
    this.loveCooldown = 0;
    this.inLove = false;
    this.breedingPartner = null;
    this.breedingCooldown = 6000; // 5 minutes between breeding
    
    // Physical properties
    this.width = this.isAdult ? 1.9 : 0.9;
    this.height = this.isAdult ? 1.7 : 0.85;
    
    // Prevent mobs from fleeing and make them despawnable 
    this.fleeHealth = 0; // Sniffers don't flee
    this.despawnable = false; // Sniffers don't despawn naturally
    this.persistent = true;
    
    // Animation states
    this.idleTime = 0;
    this.headRaised = false;
    this.headRaiseCooldown = 0;
    
    // Initialize velocity
    this.velocity = { x: 0, y: 0, z: 0 };
    
    // Add mock emitEvent function for testing
    if (!this.emitEvent) {
      this.emitEvent = (eventName, data) => {
        console.log(`Mock event: ${eventName}`, data);
      };
    }
  }
  
  /**
   * Update the sniffer's state and behavior
   * @param {Object} world - The game world
   * @param {Object} players - All players
   * @param {Object} mobs - All mobs
   * @param {number} deltaTime - Time since last update in ticks
   * @returns {Object|null} - Update result or null
   */
  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);
    
    if (this.dead) return null;
    
    // Update age if not adult
    if (!this.isAdult) {
      this.age += deltaTime;
      
      // Force growth for testing with high growth chance
      if (this.age >= this.maxAge && Math.random() < (this.growthChance * deltaTime * 100)) {
        this.isAdult = true;
        this.width = 1.9;
        this.height = 1.7;
        return { type: 'grow_up', entityId: this.id };
      }
    }
    
    // Update cooldowns
    if (this.sniffCooldown > 0) {
      this.sniffCooldown -= deltaTime;
    }
    
    if (this.digCooldown > 0) {
      this.digCooldown -= deltaTime;
    }
    
    if (this.loveCooldown > 0) {
      this.loveCooldown -= deltaTime;
      if (this.loveCooldown <= 0) {
        this.inLove = false;
      }
    }
    
    if (this.headRaiseCooldown > 0) {
      this.headRaiseCooldown -= deltaTime;
      if (this.headRaiseCooldown <= 0) {
        this.headRaised = !this.headRaised;
        this.headRaiseCooldown = getRandomInt(100, 400); // 5-20 seconds
      }
    } else if (Math.random() < 0.005 * deltaTime) {
      this.headRaised = !this.headRaised;
      this.headRaiseCooldown = getRandomInt(100, 400);
    }
    
    // Handle breeding
    if (this.inLove) {
      this.handleBreeding(mobs);
    }
    
    // State-specific behavior
    if (this.isSniffing) {
      this.updateSniffing(world, deltaTime);
    } else if (this.isDigging) {
      this.updateDigging(world, deltaTime);
    } else {
      this.updateIdle(world, deltaTime);
    }
    
    // Apply physics
    this.applyPhysics(world, deltaTime);
    
    return null;
  }
  
  /**
   * Update idle behavior
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update
   */
  updateIdle(world, deltaTime) {
    this.idleTime += deltaTime;
    
    // Randomly start sniffing if cooldown is over
    if (this.isAdult && this.sniffCooldown <= 0 && Math.random() < 0.01 * deltaTime && this.isOnSniffableBlock(world)) {
      this.isSniffing = true;
      this.sniffProgress = 0;
      
      // Play sniffing animation and sound
      this.emitEvent('playAnimation', { entityId: this.id, animation: 'sniffing_start' });
      this.emitEvent('playSound', { sound: 'entity.sniffer.sniffing', position: this.position });
      
      return;
    }
    
    // Random movement
    if (Math.random() < 0.02 * deltaTime) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 5 + Math.random() * 5;
      
      this.wanderTarget = {
        x: this.position.x + Math.cos(angle) * distance,
        y: this.position.y,
        z: this.position.z + Math.sin(angle) * distance
      };
      
      // Make sure the wander target is on solid ground
      if (world) {
        const groundY = this.findGroundAt(world, this.wanderTarget.x, this.wanderTarget.z);
        if (groundY !== null) {
          this.wanderTarget.y = groundY + 0.1;
        }
      }
    }
    
    // Move towards wander target if we have one
    if (this.wanderTarget) {
      const distanceToTarget = Math.sqrt(
        Math.pow(this.wanderTarget.x - this.position.x, 2) +
        Math.pow(this.wanderTarget.z - this.position.z, 2)
      );
      
      if (distanceToTarget < 0.5) {
        this.wanderTarget = null;
      } else {
        // Calculate direction to target
        const dx = this.wanderTarget.x - this.position.x;
        const dz = this.wanderTarget.z - this.position.z;
        const magnitude = Math.sqrt(dx * dx + dz * dz);
        
        // Normalize and apply speed
        if (magnitude > 0) {
          this.velocity.x = (dx / magnitude) * this.speed;
          this.velocity.z = (dz / magnitude) * this.speed;
          
          // Set rotation to face movement direction
          this.rotation.y = Math.atan2(dz, dx) - Math.PI / 2;
        }
      }
    }
  }
  
  /**
   * Update sniffing behavior
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update
   */
  updateSniffing(world, deltaTime) {
    // Stop moving when sniffing
    this.velocity.x = 0;
    this.velocity.z = 0;
    
    this.sniffProgress += deltaTime;
    
    // Intermediate sniff phases for animation
    if (this.sniffProgress === 30) {
      this.emitEvent('playAnimation', { entityId: this.id, animation: 'sniffing_middle' });
    }
    
    if (this.sniffProgress >= this.sniffDuration) {
      this.isSniffing = false;
      this.sniffCooldown = this.sniffMaxCooldown;
      
      // Check if we found a seed
      const foundSeed = Math.random() < 0.4; // 40% chance to find a seed
      
      if (foundSeed) {
        this.foundSeed = true;
        this.isDigging = true;
        this.digProgress = 0;
        
        // Play digging start animation
        this.emitEvent('playAnimation', { entityId: this.id, animation: 'digging_start' });
        this.emitEvent('playSound', { sound: 'entity.sniffer.digging', position: this.position });
      } else {
        // Play end sniffing animation
        this.emitEvent('playAnimation', { entityId: this.id, animation: 'sniffing_end' });
      }
    }
  }
  
  /**
   * Update digging behavior
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update
   */
  updateDigging(world, deltaTime) {
    // Stop moving when digging
    this.velocity.x = 0;
    this.velocity.z = 0;
    
    this.digProgress += deltaTime;
    
    // Intermediate digging animations
    if (this.digProgress === 20) {
      this.emitEvent('playAnimation', { entityId: this.id, animation: 'digging_middle' });
    }
    
    if (this.digProgress >= this.digDuration) {
      this.isDigging = false;
      this.digCooldown = this.digMaxCooldown;
      this.foundSeed = false;
      
      // Play digging end animation
      this.emitEvent('playAnimation', { entityId: this.id, animation: 'digging_end' });
      
      // Spawn the ancient seed
      this.emitEvent('dropItem', {
        item: this.getRandomAncientSeed(),
        count: 1,
        position: {
          x: this.position.x,
          y: this.position.y + 0.2,
          z: this.position.z
        }
      });
    }
  }
  
  /**
   * Check if the block below is sniffable (dirt, grass, or similar)
   * @param {Object} world - The game world
   * @returns {boolean} - Whether the block is sniffable
   */
  isOnSniffableBlock(world) {
    if (!world || !world.getBlockAt) return true;
    
    const blockBelow = world.getBlockAt(
      Math.floor(this.position.x),
      Math.floor(this.position.y) - 1,
      Math.floor(this.position.z)
    );
    
    const sniffableBlocks = [
      'grass_block', 'dirt', 'podzol', 'mud', 'muddy_mangrove_roots',
      'rooted_dirt', 'moss_block', 'farmland'
    ];
    
    return blockBelow && sniffableBlocks.includes(blockBelow.type);
  }
  
  /**
   * Handle breeding behavior
   * @param {Object} mobs - All mobs in the world
   */
  handleBreeding(mobs) {
    if (!this.isAdult) return;
    
    // Look for another sniffer in love
    for (const mobId in mobs) {
      const mob = mobs[mobId];
      
      if (mob.id === this.id) continue;
      
      if (mob.type === 'sniffer' && mob.inLove && mob.isAdult) {
        const distance = this.distanceTo(mob.position);
        
        if (distance < 3) {
          // Found a breeding partner
          this.breedingPartner = mob.id;
          
          // Create baby sniffer
          return {
            type: 'breed',
            entityType: 'sniffer',
            position: {
              x: (this.position.x + mob.position.x) / 2,
              y: (this.position.y + mob.position.y) / 2, 
              z: (this.position.z + mob.position.z) / 2
            },
            options: { isAdult: false, age: 0 }
          };
        }
      }
    }
  }
  
  /**
   * Handle player interaction
   * @param {Object} player - The player
   * @param {Object} interaction - Interaction data
   * @returns {Object} - Interaction result
   */
  interact(player, interaction) {
    if (!interaction || !interaction.item) {
      return { success: false };
    }
    
    // Breeding with torchflower seeds
    if (interaction.item === 'torchflower_seeds' && this.isAdult && this.loveCooldown <= 0) {
      this.inLove = true;
      this.loveCooldown = this.breedingCooldown;
      
      // Play hearts particle effect
      this.emitEvent('playParticle', {
        type: 'heart',
        position: {
          x: this.position.x,
          y: this.position.y + 1,
          z: this.position.z
        },
        count: 7,
        spread: { x: 0.5, y: 0.5, z: 0.5 }
      });
      
      return {
        success: true,
        consumeItem: true
      };
    }
    
    // Shearing to get sniffer eggs (if adult)
    if (interaction.item === 'shears' && this.isAdult) {
      // Only allow shearing once per day cycle
      if (!this.wasSheared) {
        this.wasSheared = true;
        
        // Play shearing sound
        this.emitEvent('playSound', { sound: 'entity.sheep.shear', position: this.position });
        
        // Drop 1-2 sniffer eggs
        return {
          success: true,
          drops: [
            {
              item: 'sniffer_egg',
              count: getRandomInt(1, 2)
            }
          ],
          damageItem: true,
          damage: 1
        };
      }
    }
    
    return { success: false };
  }
  
  /**
   * Find the ground level at the given coordinates
   * @param {Object} world - The game world
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @returns {number|null} - Y coordinate of the ground or null if not found
   */
  findGroundAt(world, x, z) {
    if (!world || !world.getBlockAt) return null;
    
    const startY = Math.floor(this.position.y) + 3;
    
    // Search downward for first non-air block
    for (let y = startY; y > 0; y--) {
      const block = world.getBlockAt(Math.floor(x), y, Math.floor(z));
      const blockAbove = world.getBlockAt(Math.floor(x), y + 1, Math.floor(z));
      
      if (block && !this.isAirOrFluid(block) && (!blockAbove || this.isAirOrFluid(blockAbove))) {
        return y + 1;
      }
    }
    
    return null;
  }
  
  /**
   * Check if a block is air or a fluid (water/lava)
   * @param {Object} block - Block to check
   * @returns {boolean} - Whether the block is air or fluid
   */
  isAirOrFluid(block) {
    return !block || block.type === 'air' || block.type === 'water' || block.type === 'lava';
  }
  
  /**
   * Apply physics to the sniffer
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update
   */
  applyPhysics(world, deltaTime) {
    // Apply gravity
    if (!this.isOnGround(world)) {
      this.velocity.y -= 0.08 * deltaTime;
    } else {
      this.velocity.y = 0;
    }
    
    // Apply drag
    this.velocity.x *= 0.91;
    this.velocity.y *= 0.98;
    this.velocity.z *= 0.91;
    
    // Apply velocity to position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Prevent going below ground
    if (world) {
      const groundY = this.findGroundAt(world, this.position.x, this.position.z);
      if (groundY !== null && this.position.y < groundY) {
        this.position.y = groundY;
        this.velocity.y = 0;
      }
    }
  }
  
  /**
   * Check if the sniffer is on the ground
   * @param {Object} world - The game world
   * @returns {boolean} - Whether the sniffer is on the ground
   */
  isOnGround(world) {
    if (!world || !world.getBlockAt) return true;
    
    const blockBelow = world.getBlockAt(
      Math.floor(this.position.x),
      Math.floor(this.position.y) - 0.1,
      Math.floor(this.position.z)
    );
    
    return blockBelow && blockBelow.type !== 'air' && blockBelow.type !== 'water' && blockBelow.type !== 'lava';
  }
  
  /**
   * Get a random ancient seed type
   * @returns {string} - Seed item ID
   */
  getRandomAncientSeed() {
    const seeds = [
      'torchflower_seeds', // Grows into Torchflower
      'pitcher_pod'        // Grows into Pitcher Plant
    ];
    
    return seeds[Math.floor(Math.random() * seeds.length)];
  }
  
  /**
   * Get the drops when the sniffer dies
   * @returns {Array} - Array of items to drop
   */
  getDrops() {
    return [
      { item: 'experience', count: getRandomInt(1, 3) }
    ];
  }
  
  /**
   * Check if the sniffer is passive
   * @returns {boolean} - Always true for sniffers
   */
  isPassive() {
    return true;
  }
  
  /**
   * Serialize the sniffer's state
   * @returns {Object} - Serialized state
   */
  serialize() {
    return {
      ...super.serialize(),
      isAdult: this.isAdult,
      age: this.age,
      isSniffing: this.isSniffing,
      sniffProgress: this.sniffProgress,
      isDigging: this.isDigging,
      digProgress: this.digProgress,
      inLove: this.inLove,
      loveCooldown: this.loveCooldown,
      wasSheared: this.wasSheared,
      headRaised: this.headRaised
    };
  }
  
  /**
   * Deserialize the sniffer's state
   * @param {Object} data - Serialized state
   */
  deserialize(data) {
    if (data.id !== undefined) this.id = data.id;
    if (data.position !== undefined) this.position = data.position;
    if (data.rotation !== undefined) this.rotation = data.rotation;
    if (data.health !== undefined) this.health = data.health;
    if (data.maxHealth !== undefined) this.maxHealth = data.maxHealth;
    if (data.dead !== undefined) this.dead = data.dead;
    if (data.isAdult !== undefined) this.isAdult = data.isAdult;
    if (data.age !== undefined) this.age = data.age;
    if (data.isSniffing !== undefined) this.isSniffing = data.isSniffing;
    if (data.sniffProgress !== undefined) this.sniffProgress = data.sniffProgress;
    if (data.isDigging !== undefined) this.isDigging = data.isDigging;
    if (data.digProgress !== undefined) this.digProgress = data.digProgress;
    if (data.inLove !== undefined) this.inLove = data.inLove;
    if (data.loveCooldown !== undefined) this.loveCooldown = data.loveCooldown;
    if (data.wasSheared !== undefined) this.wasSheared = data.wasSheared;
    if (data.headRaised !== undefined) this.headRaised = data.headRaised;
  }
}

module.exports = Sniffer; 