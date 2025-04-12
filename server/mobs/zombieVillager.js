/**
 * Zombie Villager - A villager that has been converted to a zombie
 * Can be cured back to a villager
 */
const HostileMob = require('./mobBase');
const { v4: uuidv4 } = require('uuid');

class ZombieVillager extends HostileMob {
  /**
   * Create a new zombie villager
   * @param {Object} position - Initial position
   * @param {Object} options - Optional configuration
   */
  constructor(position, options = {}) {
    super('zombie_villager', position, 20, 0.23); // type, position, health, speed
    
    // Villager attributes to retain
    this.profession = options.profession || 'nitwit';
    this.level = options.level || 1;
    this.trades = options.trades || [];
    this.villageId = options.villageId || null;
    this.originalVillagerId = options.originalVillagerId || null;
    this.isChild = options.isChild || false;
    
    // Cure-related properties
    this.isCuring = false;
    this.cureTime = 0; // Total time needed to cure
    this.cureTimer = 0; // Current cure progress
    this.curerId = null; // Player who started the cure
    
    // Zombie properties
    this.burnInDaylight = true;
    this.targetRange = 16;
    this.attackDamage = 3;
    this.attackCooldown = 20; // 1 second cooldown
    this.aggroTime = 100; // Time to remain aggressive after losing sight of player
  }
  
  /**
   * Update zombie villager behavior
   */
  update(world, players, mobs, deltaTime) {
    // Call parent update method for basic behaviors
    super.update(world, players, mobs, deltaTime);
    
    // If curing, process cure timer
    if (this.isCuring) {
      this.cureTimer += deltaTime;
      
      // Check if cure is complete
      if (this.cureTimer >= this.cureTime) {
        return { type: 'cure_complete', id: this.id, curerId: this.curerId };
      }
      
      // Apply visual effects during curing
      if (this.cureTimer % 40 < 5) { // Periodically show effects
        return { type: 'cure_effect', id: this.id, progress: this.cureTimer / this.cureTime };
      }
    }
    
    // Check for daylight burning
    if (this.burnInDaylight && world.isDaytime && !this.isInShade(world)) {
      this.takeDamage(1, null); // 1 damage per tick in sunlight
      return { type: 'burning', id: this.id };
    }
    
    return null; // No special update result
  }
  
  /**
   * Start the curing process
   * @param {string} playerId - ID of the player who initiated the cure
   */
  startCuring(playerId) {
    this.isCuring = true;
    this.curerId = playerId;
    
    // Curing takes 3-5 minutes (3600-6000 ticks)
    this.cureTime = 3600 + Math.floor(Math.random() * 2400);
    this.cureTimer = 0;
    
    // Make zombie stop attacking
    this.state = 'idle';
    this.targetEntity = null;
    
    // Reduce movement speed during curing
    this.speed = 0.05;
    
    console.log(`Zombie villager ${this.id} is being cured by player ${playerId}`);
  }
  
  /**
   * Check if curing is in progress
   * @returns {boolean} - Whether curing is in progress
   */
  isCuringInProgress() {
    return this.isCuring;
  }
  
  /**
   * Get cure progress as percentage
   * @returns {number} - Progress percentage (0-100)
   */
  getCureProgress() {
    if (!this.isCuring) return 0;
    return Math.min(100, Math.round((this.cureTimer / this.cureTime) * 100));
  }
  
  /**
   * Check if zombie is in shade (protected from sunlight)
   * @param {Object} world - World object for block checking
   * @returns {boolean} - Whether zombie is in shade
   */
  isInShade(world) {
    // Check if there are blocks above
    for (let y = Math.ceil(this.position.y); y < world.maxHeight; y++) {
      const blockKey = `${Math.floor(this.position.x)},${y},${Math.floor(this.position.z)}`;
      const block = world.getBlock ? world.getBlock(blockKey) : null;
      
      if (block && block.type !== 'air' && block.type !== 'glass') {
        return true; // Found a solid block above
      }
    }
    
    // Check if in water
    const feetPos = `${Math.floor(this.position.x)},${Math.floor(this.position.y)},${Math.floor(this.position.z)}`;
    const block = world.getBlock ? world.getBlock(feetPos) : null;
    
    return block && block.type === 'water';
  }
  
  /**
   * Handle special behaviors on death
   * @param {Object} attacker - Entity that killed this zombie
   * @returns {Object|null} - Death events or null
   */
  onDeath(attacker) {
    // If curing, don't drop loot
    if (this.isCuring) return null;
    
    // Drop loot
    return {
      type: 'drops',
      items: this.getDrops()
    };
  }
  
  /**
   * Get drops when this zombie villager dies
   * @returns {Array} - Items to drop
   */
  getDrops() {
    const drops = [];
    
    // Common zombie drops
    if (Math.random() < 0.025) {
      drops.push({ id: 'iron_ingot', count: 1 });
    }
    
    if (Math.random() < 0.08) {
      drops.push({ id: 'carrot', count: 1 });
    }
    
    if (Math.random() < 0.08) {
      drops.push({ id: 'potato', count: 1 });
    }
    
    // Add rotten flesh
    const fleshCount = Math.floor(Math.random() * 2) + 1;
    drops.push({ id: 'rotten_flesh', count: fleshCount });
    
    return drops;
  }
  
  /**
   * Check if this mob is hostile
   * @returns {boolean} - True if hostile
   */
  isHostile() {
    return true;
  }
  
  /**
   * Serialize zombie villager data
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      profession: this.profession,
      level: this.level,
      villageId: this.villageId,
      isChild: this.isChild,
      isCuring: this.isCuring,
      cureProgress: this.getCureProgress()
    };
  }
}

module.exports = ZombieVillager; 