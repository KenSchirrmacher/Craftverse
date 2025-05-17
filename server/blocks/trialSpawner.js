/**
 * TrialSpawnerBlock - Block that spawns waves of mobs in Trial Chambers
 * Part of the Minecraft 1.21 (Tricky Trials) Update
 */

const { Block } = require('./baseBlock');
const { EventEmitter } = require('events');

class TrialSpawnerBlock extends Block {
  /**
   * Create a new Trial Spawner block
   * @param {Object} options - Block configuration options
   */
  constructor(options = {}) {
    // Set default options for trial spawner block
    const defaultOptions = {
      id: 'trial_spawner',
      name: 'Trial Spawner',
      hardness: 50.0, // Very hard to break
      resistance: 1200.0, // Extremely blast resistant
      requiresTool: true,
      toolType: 'pickaxe',
      transparent: false,
      solid: true,
      gravity: false,
      luminance: 7, // Emits light
      ...options
    };
    
    super(defaultOptions);
    
    // Ensure properties are set correctly
    this.toolType = defaultOptions.toolType;
    this.transparent = defaultOptions.transparent;
    this.gravity = defaultOptions.gravity;
    this.luminance = defaultOptions.luminance; // Explicitly set luminance property
    
    // Trial spawner specific properties
    this.active = false;
    this.waveCount = 0;
    this.totalWaves = options.totalWaves || 3;
    this.currentMobCount = 0;
    this.maxMobsPerWave = options.maxMobsPerWave || 5;
    this.mobTypes = options.mobTypes || ['zombie', 'skeleton', 'spider'];
    this.spawnRadius = options.spawnRadius || 8;
    this.rewardGenerated = false;
    this.allowedMobTypes = [
      'zombie', 'skeleton', 'spider', 'creeper', 'witch', 
      'breeze', 'vindicator', 'evoker'
    ];
    this.world = null;
    this.position = { x: 0, y: 0, z: 0 };
    
    // Use EventEmitter for trial events
    this.events = new EventEmitter();
  }
  
  /**
   * Get the world this block is in
   * @returns {Object|null} World object or null if not in a world
   */
  getWorld() {
    return this.world;
  }
  
  /**
   * Set the world for this block
   * @param {Object} world - World object
   */
  setWorld(world) {
    this.world = world;
  }
  
  /**
   * Set the block position
   * @param {Object} position - Position object with x, y, z coordinates
   */
  setPosition(position) {
    this.position = position;
  }
  
  /**
   * Activate the trial spawner
   * @returns {boolean} Whether activation was successful
   */
  activate() {
    if (this.active) {
      return false;
    }
    
    this.active = true;
    this.waveCount = 0;
    this.currentMobCount = 0;
    this.rewardGenerated = false;
    
    // Emit activation event
    this.events.emit('trial_activated', {
      position: this.position,
      totalWaves: this.totalWaves
    });
    
    // Start the first wave
    this.startNextWave();
    
    return true;
  }
  
  /**
   * Start the next wave of mobs
   * @returns {boolean} Whether a new wave was started
   */
  startNextWave() {
    if (!this.active || this.waveCount >= this.totalWaves) {
      return false;
    }
    
    this.waveCount++;
    this.currentMobCount = 0;
    
    // Calculate number of mobs for this wave
    // More mobs in later waves
    const mobsToSpawn = Math.min(
      this.maxMobsPerWave,
      Math.ceil(this.maxMobsPerWave * (0.7 + (this.waveCount * 0.3) / this.totalWaves))
    );
    
    // Spawn mobs
    for (let i = 0; i < mobsToSpawn; i++) {
      this.spawnMob();
    }
    
    // Emit wave start event
    this.events.emit('wave_started', {
      position: this.position,
      waveNumber: this.waveCount,
      totalWaves: this.totalWaves,
      mobCount: mobsToSpawn
    });
    
    return true;
  }
  
  /**
   * Spawn a mob around the trial spawner
   * @returns {Object|null} The spawned mob or null if spawning failed
   */
  spawnMob() {
    const world = this.getWorld();
    if (!world) {
      return null;
    }
    
    // Select random mob type based on difficulty
    // Higher waves have chance for more difficult mobs
    const difficultyFactor = this.waveCount / this.totalWaves;
    let availableMobs = [...this.mobTypes];
    
    // Add breeze mobs in later waves
    if (difficultyFactor > 0.5 && !availableMobs.includes('breeze')) {
      availableMobs.push('breeze');
    }
    
    // Add illager mobs in final wave
    if (difficultyFactor > 0.8) {
      if (!availableMobs.includes('vindicator')) availableMobs.push('vindicator');
      if (!availableMobs.includes('evoker') && difficultyFactor > 0.9) {
        availableMobs.push('evoker');
      }
    }
    
    // Select random mob type
    const mobType = availableMobs[Math.floor(Math.random() * availableMobs.length)];
    
    // Generate random position within spawn radius
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.spawnRadius;
    const spawnPos = {
      x: this.position.x + Math.cos(angle) * distance,
      y: this.position.y,
      z: this.position.z + Math.sin(angle) * distance
    };
    
    // Check if position is valid for spawning
    if (!world.canSpawnMob(spawnPos)) {
      // Try up to 5 different positions
      for (let i = 0; i < 5; i++) {
        const newAngle = Math.random() * Math.PI * 2;
        const newDistance = Math.random() * this.spawnRadius;
        spawnPos.x = this.position.x + Math.cos(newAngle) * newDistance;
        spawnPos.z = this.position.z + Math.sin(newAngle) * newDistance;
        
        if (world.canSpawnMob(spawnPos)) {
          break;
        }
        
        // If we tried 5 times and failed, return null
        if (i === 4) {
          return null;
        }
      }
    }
    
    // Spawn the mob
    const mob = world.spawnMob(mobType, spawnPos);
    
    if (mob) {
      this.currentMobCount++;
      
      // Register mob death listener
      mob.events.once('death', () => {
        this.onMobDeath(mob);
      });
    }
    
    return mob;
  }
  
  /**
   * Handle mob death during a trial
   * @param {Object} mob - The mob that died
   */
  onMobDeath(mob) {
    if (!this.active) {
      return;
    }
    
    this.currentMobCount--;
    
    // If all mobs are defeated, start next wave or end trial
    if (this.currentMobCount <= 0) {
      if (this.waveCount < this.totalWaves) {
        // Start next wave after a short delay
        setTimeout(() => {
          this.startNextWave();
        }, 3000); // 3 second delay between waves
      } else {
        // All waves completed
        this.endTrial(true);
      }
    }
  }
  
  /**
   * End the trial
   * @param {boolean} success - Whether the trial was completed successfully
   */
  endTrial(success) {
    if (!this.active) {
      return;
    }
    
    this.active = false;
    
    // Emit trial end event
    this.events.emit('trial_completed', {
      position: this.position,
      success: success,
      wavesCompleted: this.waveCount
    });
    
    // Generate rewards if trial was successful
    if (success && !this.rewardGenerated) {
      this.generateRewards();
    }
  }
  
  /**
   * Generate rewards for completing the trial
   */
  generateRewards() {
    const world = this.getWorld();
    if (!world) {
      return;
    }
    
    this.rewardGenerated = true;
    
    // Find chest positions near the spawner
    const chestPositions = world.findNearbyBlocks(
      this.position,
      10,
      (block) => block && block.id === 'reward_chest'
    );
    
    // Fill chests with loot
    for (const chestPos of chestPositions) {
      const chest = world.getBlock(chestPos);
      if (chest && chest.fillWithLoot) {
        chest.fillWithLoot('trial_reward', {
          waveCount: this.waveCount,
          difficultyFactor: this.waveCount / this.totalWaves
        });
      }
    }
    
    // Emit reward generated event
    this.events.emit('rewards_generated', {
      position: this.position,
      chestCount: chestPositions.length
    });
  }
  
  /**
   * Handle block updates
   */
  update() {
    // Check if any mobs remain but are stuck or too far away
    if (this.active && this.currentMobCount > 0) {
      const world = this.getWorld();
      if (world) {
        const nearbyMobs = world.findNearbyEntities(
          this.position,
          this.spawnRadius * 2,
          (entity) => entity.isHostile && entity.trialSpawnerId === this.id
        );
        
        // If mobs are missing, assume they got stuck or despawned
        if (nearbyMobs.length < this.currentMobCount) {
          this.currentMobCount = nearbyMobs.length;
          
          // If all mobs are gone, proceed to next wave
          if (this.currentMobCount <= 0) {
            if (this.waveCount < this.totalWaves) {
              this.startNextWave();
            } else {
              this.endTrial(true);
            }
          }
        }
      }
    }
  }
  
  /**
   * Handle interaction with the block
   * @param {Object} player - Player interacting with the block
   * @param {Object} action - Interaction details
   * @returns {boolean} Whether the interaction was handled
   */
  interact(player, action) {
    // Only handle right-click actions
    if (!player || action.type !== 'right_click') {
      return false;
    }
    
    // If not active, activate the trial spawner
    if (!this.active) {
      this.activate();
      return true;
    }
    
    return false;
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} Serialized block data
   */
  serialize() {
    // Create a base data object, with a fallback if super.serialize() is not available
    let data;
    try {
      data = super.serialize();
    } catch (error) {
      // Create a basic block data object if super.serialize fails
      data = {
        id: this.id,
        name: this.name,
        hardness: this.hardness,
        resistance: this.resistance,
        requiresTool: this.requiresTool,
        toolType: this.toolType, 
        transparent: this.transparent,
        solid: this.solid,
        gravity: this.gravity,
        luminance: this.luminance
      };
    }
    
    // Add trial spawner specific data
    data.active = this.active;
    data.waveCount = this.waveCount;
    data.totalWaves = this.totalWaves;
    data.currentMobCount = this.currentMobCount;
    data.maxMobsPerWave = this.maxMobsPerWave;
    data.mobTypes = this.mobTypes;
    data.spawnRadius = this.spawnRadius;
    data.rewardGenerated = this.rewardGenerated;
    data.position = this.position;
    
    return data;
  }
  
  /**
   * Deserialize data to restore the block
   * @param {Object} data - Serialized block data
   * @param {Object} world - World instance for reference
   * @returns {TrialSpawnerBlock} This block instance
   */
  deserialize(data, world) {
    // Handle base block properties with a fallback if super.deserialize is not available
    try {
      super.deserialize(data, world);
    } catch (error) {
      // Set basic block properties if super.deserialize fails
      this.id = data.id || 'trial_spawner';
      this.name = data.name || 'Trial Spawner';
      this.hardness = data.hardness || 50.0;
      this.resistance = data.resistance || 1200.0;
      this.requiresTool = data.requiresTool !== undefined ? data.requiresTool : true;
      this.toolType = data.toolType || 'pickaxe';
      this.transparent = data.transparent !== undefined ? data.transparent : false;
      this.solid = data.solid !== undefined ? data.solid : true;
      this.gravity = data.gravity !== undefined ? data.gravity : false;
      this.luminance = data.luminance !== undefined ? data.luminance : 7;
    }
    
    // Restore trial spawner specific data
    this.active = data.active || false;
    this.waveCount = data.waveCount || 0;
    this.totalWaves = data.totalWaves || 3;
    this.currentMobCount = data.currentMobCount || 0;
    this.maxMobsPerWave = data.maxMobsPerWave || 5;
    this.mobTypes = data.mobTypes || ['zombie', 'skeleton', 'spider'];
    this.spawnRadius = data.spawnRadius || 8;
    this.rewardGenerated = data.rewardGenerated || false;
    this.position = data.position || { x: 0, y: 0, z: 0 };
    
    this.setWorld(world);
    
    return this;
  }
  
  /**
   * Get the items that should be dropped when the block is broken
   * @returns {Array} Array of items to drop
   */
  getDrops() {
    // Trial spawners are not intended to be broken normally in survival mode
    // If broken, drops nothing by default
    return [];
  }
}

module.exports = TrialSpawnerBlock; 