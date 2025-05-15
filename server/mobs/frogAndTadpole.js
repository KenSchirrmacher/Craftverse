/**
 * Frog and Tadpole mob implementation for the Wild Update
 * Features:
 * - Tadpoles that grow into frogs over time
 * - Multiple frog variants based on biome
 * - Frog jumping behavior
 * - Frog tongue attack for certain small mobs
 * - Frog floating on water
 * - Bucket interaction with tadpoles
 */

const MobBase = require('./mobBase');
const { getRandomInt } = require('../utils/mathUtils');

/**
 * Tadpole class - baby frogs that swim in water
 * Will grow into frogs over time
 */
class Tadpole extends MobBase {
  /**
   * Create a new Tadpole
   * @param {Object} position - Initial position
   * @param {Object} options - Additional options
   */
  constructor(position, options = {}) {
    super('tadpole', position, 6, 0.3);
    
    // Tadpole-specific properties
    this.age = options.age || 0;
    this.maxAge = 24000; // 20 minutes (at 20 ticks/second) to grow into a frog
    this.growthChance = 0.005; // Chance per tick to grow when age >= maxAge
    this.isInWater = true; // Will be checked on first update
    this.waterSuffocationTimer = 0;
    this.maxLandTime = 200; // 10 seconds before suffocation on land
    this.variant = options.variant || null; // Will be determined upon growth
    this.bucketable = true; // Can be caught in a bucket
    this.target = null;
    this.swimSpeed = 0.5;
    this.swimCycleTimer = 0;
    this.tailWiggle = 0;
    
    // Tadpoles are passive
    this.despawnable = true;
    this.attackDamage = 0;
    this.fleeHealth = 3; // Will flee when health <= 3
    
    // Set size for collision
    this.width = 0.4;
    this.height = 0.3;
    
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
   * Update tadpole's state
   * @param {Object} world - The game world
   * @param {Object} players - All players
   * @param {Object} mobs - All mobs
   * @param {number} deltaTime - Time since last update in ticks
   */
  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);
    
    if (this.dead) return null;
    
    // Update water check
    this.updateWaterState(world);
    
    // Handle suffocation on land
    if (!this.isInWater) {
      this.waterSuffocationTimer += deltaTime;
      
      if (this.waterSuffocationTimer >= this.maxLandTime) {
        // Take suffocation damage every second after maxLandTime
        if (this.waterSuffocationTimer % 20 < deltaTime) {
          this.takeDamage(1, { type: 'suffocation' });
        }
      }
    } else {
      this.waterSuffocationTimer = 0;
    }
    
    // Update swimming animation
    this.swimCycleTimer = (this.swimCycleTimer + deltaTime) % 200;
    this.tailWiggle = Math.sin(this.swimCycleTimer * 0.1) * 0.6;
    
    // Apply water physics
    this.applyPhysics(world, deltaTime);
    
    // Growth logic
    this.age += deltaTime;
    
    // Check for growth into a frog
    if (this.age >= this.maxAge && Math.random() < this.growthChance * deltaTime) {
      return { type: 'grow_into_frog', position: this.position, variant: this.determineVariant(world) };
    }
    
    return null;
  }
  
  /**
   * Determine what variant of frog to grow into based on biome
   * @param {Object} world - The game world
   * @returns {string} - Frog variant type
   */
  determineVariant(world) {
    if (!world || !world.getBiomeAt) {
      return 'temperate'; // Default variant
    }
    
    const biome = world.getBiomeAt(this.position.x, this.position.y, this.position.z);
    
    if (!biome) {
      return 'temperate';
    }
    
    // Determine variant based on biome
    if (biome.temperature >= 1.0) {
      return 'warm'; // Warm biomes like desert, savanna (orange variant)
    } else if (biome.temperature <= 0.2) {
      return 'cold'; // Cold biomes like snowy taiga, frozen peaks (green variant)
    } else {
      return 'temperate'; // Temperate biomes like forest, plains (white-yellow variant)
    }
  }
  
  /**
   * Check if the tadpole is in water
   * @param {Object} world - The game world
   */
  updateWaterState(world) {
    if (world && typeof world.isWaterAt === 'function') {
      this.isInWater = world.isWaterAt(
        this.position.x,
        this.position.y,
        this.position.z
      );
    } else if (world && typeof world.getBlockAt === 'function') {
      const block = world.getBlockAt(
        Math.floor(this.position.x),
        Math.floor(this.position.y),
        Math.floor(this.position.z)
      );
      
      this.isInWater = block && block.type === 'water';
    }
  }
  
  /**
   * Apply physics based on environment
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update
   */
  applyPhysics(world, deltaTime) {
    if (!this.isInWater) {
      // Apply gravity when not in water
      this.velocity.y -= 0.08 * deltaTime;
      
      // Apply drag
      this.velocity.x *= 0.91;
      this.velocity.y *= 0.98;
      this.velocity.z *= 0.91;
    } else {
      // Buoyancy and drag in water
      this.velocity.y *= 0.8;
      this.velocity.y += 0.01 * deltaTime;
      
      // Water drag
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
      
      // Random movement in water
      if (Math.random() < 0.05 * deltaTime) {
        this.velocity.x += (Math.random() - 0.5) * 0.1;
        this.velocity.z += (Math.random() - 0.5) * 0.1;
      }
    }
    
    // Apply velocity to position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
  }
  
  /**
   * Handle player interaction (like bucket capture)
   * @param {Object} player - The player
   * @param {Object} interaction - Interaction data
   * @returns {boolean} - Whether the interaction was successful
   */
  interact(player, interaction) {
    if (interaction.item === 'water_bucket') {
      // Convert empty bucket to tadpole bucket
      return {
        success: true,
        result: 'tadpole_bucket',
        consumeItem: true
      };
    }
    
    return { success: false };
  }
  
  /**
   * Tadpoles are passive
   * @returns {boolean} - true
   */
  isPassive() {
    return true;
  }
  
  /**
   * Get drops when tadpole dies
   * @returns {Array} - Array of drop objects
   */
  getDrops() {
    return [
      { item: 'experience', count: getRandomInt(1, 2) }
    ];
  }
  
  /**
   * Serialize tadpole data for saving/networking
   * @returns {Object} - Serialized tadpole data
   */
  serialize() {
    return {
      ...super.serialize(),
      age: this.age,
      isInWater: this.isInWater,
      waterSuffocationTimer: this.waterSuffocationTimer
    };
  }
  
  /**
   * Deserialize tadpole data
   * @param {Object} data - Serialized tadpole data
   */
  deserialize(data) {
    // MobBase deserialize might not exist in this test context
    // Only copy properties that exist in data
    if (data.id !== undefined) this.id = data.id;
    if (data.type !== undefined) this.type = data.type;
    if (data.position !== undefined) this.position = data.position;
    if (data.rotation !== undefined) this.rotation = data.rotation;
    if (data.health !== undefined) this.health = data.health;
    if (data.maxHealth !== undefined) this.maxHealth = data.maxHealth;
    if (data.speed !== undefined) this.speed = data.speed;
    if (data.dead !== undefined) this.dead = data.dead;
    
    // Tadpole-specific properties
    if (data.age !== undefined) this.age = data.age;
    if (data.isInWater !== undefined) this.isInWater = data.isInWater;
    if (data.waterSuffocationTimer !== undefined) this.waterSuffocationTimer = data.waterSuffocationTimer;
  }
}

/**
 * Frog class - amphibian mob with unique movement and attack patterns
 * Features different variants based on the biome they grew up in
 */
class Frog extends MobBase {
  /**
   * Create a new Frog
   * @param {Object} position - Initial position
   * @param {Object} options - Additional options
   */
  constructor(position, options = {}) {
    super('frog', position, 10, 0.4);
    
    // Frog-specific properties
    this.variant = options.variant || 'temperate'; // temperate (default), warm, cold
    this.jumpCooldown = 0;
    this.maxJumpCooldown = getRandomInt(60, 100); // 3-5 seconds between jumps
    this.jumpHeight = 0.5;
    this.jumpDistance = 1.5;
    this.isJumping = false;
    this.jumpTarget = null;
    this.tongueAttackCooldown = 0;
    this.maxTongueAttackCooldown = 200; // 10 seconds between tongue attacks
    this.tongueRange = 7;
    this.isAttacking = false;
    this.attackAnimationTimer = 0;
    this.isInWater = false;
    this.isOnLily = false;
    this.croakCooldown = 0;
    this.maxCroakCooldown = getRandomInt(400, 800); // 20-40 seconds between croaks
    
    // Set size for collision
    this.width = 0.5;
    this.height = 0.5;
    
    // Initialize velocity
    this.velocity = { x: 0, y: 0, z: 0 };
    
    // List of mobs that frogs can eat
    this.preyMobs = ['slime', 'magma_cube'];
    
    // Drops based on variant
    this.drops = this.getDropsByVariant();
    
    // Add mock emitEvent function for testing
    if (!this.emitEvent) {
      this.emitEvent = (eventName, data) => {
        console.log(`Mock event: ${eventName}`, data);
      };
    }
  }
  
  /**
   * Update frog's state
   * @param {Object} world - The game world
   * @param {Object} players - All players
   * @param {Object} mobs - All mobs
   * @param {number} deltaTime - Time since last update in ticks
   */
  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);
    
    if (this.dead) return null;
    
    // Update environment state
    this.updateEnvironmentState(world);
    
    // Update cooldowns
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= deltaTime;
    }
    
    if (this.tongueAttackCooldown > 0) {
      this.tongueAttackCooldown -= deltaTime;
    }
    
    if (this.croakCooldown > 0) {
      this.croakCooldown -= deltaTime;
    }
    
    // Handle jumping
    if (!this.isJumping && this.jumpCooldown <= 0) {
      this.startJump(world);
    }
    
    // Handle jump physics if currently jumping
    if (this.isJumping) {
      this.updateJump(world, deltaTime);
    } else {
      // If not jumping, check for prey
      this.lookForPrey(mobs);
    }
    
    // Handle random croaking
    if (this.croakCooldown <= 0 && Math.random() < 0.01 * deltaTime) {
      this.croak();
      this.croakCooldown = this.maxCroakCooldown;
    }
    
    // Apply physics
    this.applyPhysics(world, deltaTime);
    
    return null;
  }
  
  /**
   * Update environmental state (water, lily pads)
   * @param {Object} world - The game world
   */
  updateEnvironmentState(world) {
    if (!world) return;
    
    // Check if in water
    if (typeof world.isWaterAt === 'function') {
      this.isInWater = world.isWaterAt(
        this.position.x,
        this.position.y,
        this.position.z
      );
    } else if (typeof world.getBlockAt === 'function') {
      const block = world.getBlockAt(
        Math.floor(this.position.x),
        Math.floor(this.position.y),
        Math.floor(this.position.z)
      );
      
      this.isInWater = block && block.type === 'water';
      
      // Check if on lily pad
      if (!this.isInWater) {
        const blockBelow = world.getBlockAt(
          Math.floor(this.position.x),
          Math.floor(this.position.y) - 1,
          Math.floor(this.position.z)
        );
        
        this.isOnLily = blockBelow && blockBelow.type === 'lily_pad';
      } else {
        this.isOnLily = false;
      }
    }
  }
  
  /**
   * Start a jump
   * @param {Object} world - The game world
   */
  startJump(world) {
    if (!world) return;
    
    // Don't jump if in the air
    if (this.velocity.y !== 0) return;
    
    // Set jump cooldown
    this.isJumping = true;
    this.jumpCooldown = this.maxJumpCooldown;
    
    // Determine jump direction (random or towards prey)
    let jumpAngle = Math.random() * Math.PI * 2;
    let jumpDistance = this.jumpDistance * (0.7 + Math.random() * 0.6);
    
    // Set jump target
    this.jumpTarget = {
      x: this.position.x + Math.sin(jumpAngle) * jumpDistance,
      y: this.position.y,
      z: this.position.z + Math.cos(jumpAngle) * jumpDistance
    };
    
    // Check if target is valid (not inside blocks)
    if (world.getBlockAt && world.isBlockSolid) {
      const targetBlock = world.getBlockAt(
        Math.floor(this.jumpTarget.x),
        Math.floor(this.jumpTarget.y),
        Math.floor(this.jumpTarget.z)
      );
      
      if (targetBlock && world.isBlockSolid(targetBlock)) {
        // Target is inside solid block, cancel jump
        this.isJumping = false;
        return;
      }
    }
    
    // Apply jump velocity
    const dx = this.jumpTarget.x - this.position.x;
    const dz = this.jumpTarget.z - this.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const jumpTime = distance / this.jumpDistance * 20; // Approx time to reach target
    
    // Calculate velocity needed to reach target
    this.velocity.x = dx / jumpTime;
    this.velocity.z = dz / jumpTime;
    this.velocity.y = this.jumpHeight;
    
    // Face jump direction
    this.rotation.y = Math.atan2(dx, dz);
    
    // Emit jump sound
    this.emitEvent('frog_jump', {
      id: this.id,
      position: this.position,
      variant: this.variant
    });
  }
  
  /**
   * Update jumping physics
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update
   */
  updateJump(world, deltaTime) {
    // If we've reached the target or hit the ground after jumping
    if (
      (this.jumpTarget && 
       Math.abs(this.position.x - this.jumpTarget.x) < 0.1 && 
       Math.abs(this.position.z - this.jumpTarget.z) < 0.1) || 
      (this.velocity.y <= 0 && this.isOnGround(world))
    ) {
      // End jump
      this.isJumping = false;
      this.jumpTarget = null;
      this.velocity.x = 0;
      this.velocity.z = 0;
      this.velocity.y = 0;
    }
  }
  
  /**
   * Check if the frog is on the ground
   * @param {Object} world - The game world
   * @returns {boolean} - Whether the frog is on the ground
   */
  isOnGround(world) {
    if (!world || !world.getBlockAt) return true;
    
    const blockBelow = world.getBlockAt(
      Math.floor(this.position.x),
      Math.floor(this.position.y) - 1,
      Math.floor(this.position.z)
    );
    
    return blockBelow && world.isBlockSolid(blockBelow);
  }
  
  /**
   * Look for prey to attack with tongue
   * @param {Object} mobs - All mobs
   */
  lookForPrey(mobs) {
    if (this.tongueAttackCooldown > 0 || this.isJumping) return;
    
    // Look for valid prey in range
    for (const mobId in mobs) {
      const mob = mobs[mobId];
      
      if (!mob || mob.dead || !this.preyMobs.includes(mob.type)) continue;
      
      // Calculate distance
      const dx = mob.position.x - this.position.x;
      const dy = mob.position.y - this.position.y;
      const dz = mob.position.z - this.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Check if in range
      if (distance <= this.tongueRange) {
        // Attack with tongue
        this.attackWithTongue(mob);
        break;
      }
    }
  }
  
  /**
   * Attack a mob with tongue
   * @param {Object} target - Target mob
   */
  attackWithTongue(target) {
    this.isAttacking = true;
    this.attackAnimationTimer = 0;
    this.tongueAttackCooldown = this.maxTongueAttackCooldown;
    
    // Face target
    const dx = target.position.x - this.position.x;
    const dz = target.position.z - this.position.z;
    this.rotation.y = Math.atan2(dx, dz);
    
    // Emit tongue attack event
    this.emitEvent('frog_tongue_attack', {
      id: this.id,
      targetId: target.id,
      position: this.position,
      targetPosition: target.position
    });
    
    // Kill the target and get item based on variant
    target.health = 0;
    target.dead = true;
    
    // Drop frog light item based on variant
    const dropItem = this.getFrogLightByVariant();
    if (dropItem) {
      // Would normally add this to world drops
      console.log(`Frog consumed ${target.type} and produced ${dropItem}`);
    }
  }
  
  /**
   * Get frog light item based on variant
   * @returns {string} - Frog light item type
   */
  getFrogLightByVariant() {
    switch (this.variant) {
      case 'warm':
        return 'ochre_froglight';
      case 'cold':
        return 'verdant_froglight';
      case 'temperate':
      default:
        return 'pearlescent_froglight';
    }
  }
  
  /**
   * Croak (make sound)
   */
  croak() {
    this.emitEvent('frog_croak', {
      id: this.id,
      position: this.position,
      variant: this.variant
    });
  }
  
  /**
   * Apply physics based on environment
   * @param {Object} world - The game world
   * @param {number} deltaTime - Time since last update
   */
  applyPhysics(world, deltaTime) {
    if (!this.isJumping) {
      // Only apply gravity if not jumping
      if (!this.isInWater && !this.isOnLily) {
        // Apply gravity when not in water or on lily pad
        this.velocity.y -= 0.08 * deltaTime;
      } else if (this.isInWater) {
        // Float in water
        this.velocity.y = 0;
      }
    } else {
      // Apply gravity during jump
      this.velocity.y -= 0.04 * deltaTime;
    }
    
    // Apply velocity to position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Don't fall below ground
    if (this.position.y < 0) {
      this.position.y = 0;
      this.velocity.y = 0;
    }
  }
  
  /**
   * Get drops by variant
   * @returns {Array} - Array of drop objects
   */
  getDropsByVariant() {
    return [
      { item: 'experience', count: getRandomInt(1, 3) }
    ];
  }
  
  /**
   * Frogs are passive
   * @returns {boolean} - true
   */
  isPassive() {
    return true;
  }
  
  /**
   * Get drops when frog dies
   * @returns {Array} - Array of drop objects
   */
  getDrops() {
    return this.drops;
  }
  
  /**
   * Serialize frog data for saving/networking
   * @returns {Object} - Serialized frog data
   */
  serialize() {
    return {
      ...super.serialize(),
      variant: this.variant,
      isJumping: this.isJumping,
      jumpCooldown: this.jumpCooldown,
      tongueAttackCooldown: this.tongueAttackCooldown,
      isInWater: this.isInWater,
      isOnLily: this.isOnLily
    };
  }
  
  /**
   * Deserialize frog data
   * @param {Object} data - Serialized frog data
   */
  deserialize(data) {
    // MobBase deserialize might not exist in this test context
    // Only copy properties that exist in data
    if (data.id !== undefined) this.id = data.id;
    if (data.type !== undefined) this.type = data.type;
    if (data.position !== undefined) this.position = data.position;
    if (data.rotation !== undefined) this.rotation = data.rotation;
    if (data.health !== undefined) this.health = data.health;
    if (data.maxHealth !== undefined) this.maxHealth = data.maxHealth;
    if (data.speed !== undefined) this.speed = data.speed;
    if (data.dead !== undefined) this.dead = data.dead;
    
    // Frog-specific properties
    if (data.variant !== undefined) this.variant = data.variant;
    if (data.isJumping !== undefined) this.isJumping = data.isJumping;
    if (data.jumpCooldown !== undefined) this.jumpCooldown = data.jumpCooldown;
    if (data.tongueAttackCooldown !== undefined) this.tongueAttackCooldown = data.tongueAttackCooldown;
    if (data.isInWater !== undefined) this.isInWater = data.isInWater;
    if (data.isOnLily !== undefined) this.isOnLily = data.isOnLily;
  }
}

module.exports = {
  Frog,
  Tadpole
}; 