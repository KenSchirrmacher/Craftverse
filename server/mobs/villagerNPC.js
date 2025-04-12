// Villager NPC implementation
const MobBase = require('./mobBase');
const { v4: uuidv4 } = require('uuid');

/**
 * Villager NPC
 * Implements villager behavior and trading mechanics
 */
class VillagerNPC extends MobBase {
  /**
   * Create a new villager
   * @param {Object} position - Initial position
   * @param {Object} options - Optional configuration
   */
  constructor(position, options = {}) {
    super('villager', position, 20, 0.5); // type, position, health, speed
    
    // Villager profession
    this.profession = options.profession || this.getRandomProfession();
    this.level = options.level || 1; // Novice (1) to Master (5)
    this.experience = options.experience || 0;
    this.experienceNeeded = this.calculateExperienceNeeded();
    
    // Trading related
    this.trades = options.trades || this.generateTrades();
    this.restockTimer = 0;
    this.nextRestockTime = 0;
    this.tradeUses = {}; // Track uses of each trade
    this.maxTradeUses = 12; // Max uses before restock needed
    
    // Village related
    this.villageId = options.villageId || null;
    this.homePosition = options.homePosition || { ...position };
    this.workstation = options.workstation || null;
    this.bedPosition = options.bedPosition || null;
    
    // Behavior flags
    this.isSleeping = false;
    this.isWorking = false;
    this.persistent = true; // Villagers don't despawn naturally
    this.fleeHealth = 10; // Flee at half health
    
    // Breeding related
    this.canBreed = options.canBreed !== undefined ? options.canBreed : true;
    this.isChild = options.isChild || false;
    this.growthTimer = this.isChild ? 0 : -1;
    this.growthTimeNeeded = 24000; // 20 min in ticks
    this.breedingCooldown = 0;
    this.willingness = 0; // 0-100, increases when fed
    
    // Zombie conversion
    this.isConverting = false;
    this.conversionTimer = 0;
    this.conversionTime = 0;
    
    // Schedule
    this.schedule = {
      wake: 2000,      // 6:00 AM (2000 ticks after midnight)
      workStart: 2000, // 6:00 AM
      workEnd: 9000,   // 6:00 PM
      sleep: 10000     // 8:00 PM
    };
    
    // Last player traded with
    this.lastTradedPlayer = null;
  }
  
  /**
   * Update villager behavior
   */
  update(world, players, mobs, deltaTime) {
    super.update(world, players, mobs, deltaTime);
    
    // Handle growth for child villagers
    if (this.isChild) {
      this.growthTimer += deltaTime;
      if (this.growthTimer >= this.growthTimeNeeded) {
        this.isChild = false;
        this.growthTimer = -1;
        // Adjust size and other properties after growth
        this.speed = 0.5; // Adult speed
      }
    }
    
    // Handle breeding cooldown
    if (this.breedingCooldown > 0) {
      this.breedingCooldown -= deltaTime;
      if (this.breedingCooldown < 0) {
        this.breedingCooldown = 0;
      }
    }
    
    // Handle zombie conversion
    if (this.isConverting) {
      this.conversionTimer += deltaTime;
      if (this.conversionTimer >= this.conversionTime) {
        this.completeZombieConversion();
      }
    }
    
    // Handle daily schedule based on world time
    this.updateDailySchedule(world.worldTime % 24000);
    
    // Handle restock timer
    if (this.nextRestockTime > 0) {
      this.restockTimer += deltaTime;
      if (this.restockTimer >= this.nextRestockTime) {
        this.restockTrades();
        this.restockTimer = 0;
        this.nextRestockTime = 0;
      }
    }
    
    return null; // No special update result
  }
  
  /**
   * Update behavior based on time of day
   * @param {number} worldTime - Current world time (0-24000)
   */
  updateDailySchedule(worldTime) {
    // Determine if villager should be sleeping
    if (worldTime >= this.schedule.sleep || worldTime < this.schedule.wake) {
      if (!this.isSleeping && this.bedPosition) {
        this.isSleeping = true;
        
        // Try to go to bed
        if (this.state === 'idle' || this.state === 'wander') {
          this.targetEntity = { position: this.bedPosition };
          this.state = 'follow';
        }
      }
    } else {
      this.isSleeping = false;
      
      // Determine if should be working
      if (worldTime >= this.schedule.workStart && worldTime < this.schedule.workEnd) {
        if (!this.isWorking && this.workstation) {
          this.isWorking = true;
          
          // Try to go to workstation
          if (this.state === 'idle' || this.state === 'wander') {
            this.targetEntity = { position: this.workstation };
            this.state = 'follow';
          }
        }
      } else {
        this.isWorking = false;
      }
    }
  }
  
  /**
   * Get random profession for this villager
   * @returns {string} - Random profession
   */
  getRandomProfession() {
    const professions = [
      'farmer', 'fisherman', 'shepherd', 'fletcher', 
      'librarian', 'cartographer', 'cleric', 'armorer', 
      'weaponsmith', 'toolsmith', 'butcher', 'leatherworker', 
      'mason', 'nitwit'
    ];
    return professions[Math.floor(Math.random() * professions.length)];
  }
  
  /**
   * Generate trades based on profession and level
   * @returns {Array} - List of trades
   */
  generateTrades() {
    const trades = [];
    
    // Common trades for all villagers (emerald for items)
    trades.push({
      id: uuidv4(),
      inputItems: [{ id: 'emerald', count: 1 }],
      outputItem: { id: 'bread', count: 6 },
      maxUses: this.maxTradeUses,
      rewardExperience: 2
    });
    
    // Add profession-specific trades based on level
    switch (this.profession) {
      case 'farmer':
        trades.push({
          id: uuidv4(),
          inputItems: [{ id: 'wheat', count: 20 }],
          outputItem: { id: 'emerald', count: 1 },
          maxUses: this.maxTradeUses,
          rewardExperience: 2
        });
        
        if (this.level >= 2) {
          trades.push({
            id: uuidv4(),
            inputItems: [{ id: 'emerald', count: 3 }],
            outputItem: { id: 'bread', count: 6 },
            maxUses: this.maxTradeUses,
            rewardExperience: 5
          });
        }
        break;
        
      case 'librarian':
        trades.push({
          id: uuidv4(),
          inputItems: [{ id: 'paper', count: 24 }],
          outputItem: { id: 'emerald', count: 1 },
          maxUses: this.maxTradeUses,
          rewardExperience: 2
        });
        
        if (this.level >= 3) {
          trades.push({
            id: uuidv4(),
            inputItems: [{ id: 'emerald', count: 7 }, { id: 'book', count: 1 }],
            outputItem: { id: 'enchanted_book', count: 1 },
            maxUses: this.maxTradeUses,
            rewardExperience: 10
          });
        }
        break;
        
      case 'weaponsmith':
        trades.push({
          id: uuidv4(),
          inputItems: [{ id: 'iron_ingot', count: 15 }],
          outputItem: { id: 'emerald', count: 1 },
          maxUses: this.maxTradeUses,
          rewardExperience: 2
        });
        
        if (this.level >= 2) {
          trades.push({
            id: uuidv4(),
            inputItems: [{ id: 'emerald', count: 5 }],
            outputItem: { id: 'iron_sword', count: 1 },
            maxUses: this.maxTradeUses,
            rewardExperience: 5
          });
        }
        break;
        
      // Add other professions here...
    }
    
    return trades;
  }
  
  /**
   * Handle trading with a player
   * @param {Object} player - Player object
   * @param {string} tradeId - ID of the trade to perform
   * @param {Object} reputationManager - Optional reputation manager
   * @returns {Object} - Result of the trade
   */
  executeTrade(player, tradeId, reputationManager = null) {
    // Find the trade
    const trade = this.trades.find(t => t.id === tradeId);
    if (!trade) {
      return { success: false, error: 'Trade not found' };
    }
    
    // Check if trade is maxed out
    if (this.tradeUses[tradeId] >= trade.maxUses) {
      return { success: false, error: 'Trade unavailable' };
    }
    
    // Check if player has required items
    for (const inputItem of trade.inputItems) {
      const playerItemCount = player.inventory[inputItem.id] || 0;
      if (playerItemCount < inputItem.count) {
        return { 
          success: false, 
          error: `Insufficient ${inputItem.id}. Need ${inputItem.count}, have ${playerItemCount}.` 
        };
      }
    }
    
    // Apply reputation discount if available
    let priceDiscount = 0;
    if (reputationManager && this.villageId) {
      priceDiscount = reputationManager.getPriceDiscount(this.villageId, player.id);
    }
    
    // Process the trade
    // Remove input items from player inventory
    for (const inputItem of trade.inputItems) {
      // Apply discount to emerald costs
      let countToRemove = inputItem.count;
      if (inputItem.id === 'emerald' && priceDiscount > 0) {
        countToRemove = Math.max(1, Math.floor(countToRemove * (1 - priceDiscount)));
      }
      
      player.inventory[inputItem.id] -= countToRemove;
      
      // Remove item if count is 0
      if (player.inventory[inputItem.id] <= 0) {
        delete player.inventory[inputItem.id];
      }
    }
    
    // Add output item to player inventory
    if (!player.inventory[trade.outputItem.id]) {
      player.inventory[trade.outputItem.id] = 0;
    }
    player.inventory[trade.outputItem.id] += trade.outputItem.count;
    
    // Track trade use
    if (!this.tradeUses[tradeId]) {
      this.tradeUses[tradeId] = 0;
    }
    this.tradeUses[tradeId]++;
    
    // Add experience to villager
    this.addExperience(trade.rewardExperience || 1);
    
    // Update reputation
    if (reputationManager && this.villageId) {
      reputationManager.updateReputation(this.villageId, player.id, 'TRADE');
    }
    
    // Store last traded player
    this.lastTradedPlayer = player.id;
    
    // Queue trade restock if needed
    if (this.nextRestockTime <= 0) {
      // Restock after 20 minutes (24000 ticks)
      this.nextRestockTime = 24000;
      this.restockTimer = 0;
    }
    
    return { 
      success: true, 
      message: 'Trade successful!',
      newPlayerInventory: player.inventory,
      itemReceived: trade.outputItem,
      tradeUses: this.tradeUses[tradeId],
      tradeMaxUses: trade.maxUses
    };
  }
  
  /**
   * Add experience to the villager, potentially leveling up
   * @param {number} amount - Amount of experience to add
   * @returns {boolean} - Whether the villager leveled up
   */
  addExperience(amount) {
    // Cap at max level (5)
    if (this.level >= 5) {
      return false;
    }
    
    this.experience += amount;
    
    // Check for level up
    if (this.experience >= this.experienceNeeded) {
      this.level++;
      this.experience -= this.experienceNeeded;
      this.experienceNeeded = this.calculateExperienceNeeded();
      
      // Add new trades for the new level
      const newTrades = this.generateTradesForLevel(this.level);
      this.trades.push(...newTrades);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Calculate experience needed for next level
   * @returns {number} - Experience points needed
   */
  calculateExperienceNeeded() {
    // Experience required for each level
    const expNeeded = [0, 10, 20, 30, 50];
    return expNeeded[Math.min(this.level, 4)];
  }
  
  /**
   * Generate trades specific to a villager level
   * @param {number} level - Villager level (1-5)
   * @returns {Array} - New trades for this level
   */
  generateTradesForLevel(level) {
    // Implementation would vary based on profession and level
    // This is a simplified version
    const newTrades = [];
    
    // Add trades based on profession and level
    // More complex trade generation logic would go here
    
    // Example trade for level
    newTrades.push({
      id: uuidv4(),
      inputItems: [{ id: 'emerald', count: level * 2 + 1 }],
      outputItem: { 
        id: level >= 3 ? 'enchanted_book' : 'book',
        count: 1
      },
      maxUses: this.maxTradeUses,
      rewardExperience: level * 2
    });
    
    return newTrades;
  }
  
  /**
   * Restock all trades
   */
  restockTrades() {
    this.tradeUses = {};
    console.log(`Villager ${this.id} restocked trades`);
  }
  
  /**
   * Get available trades for this villager
   * @returns {Array} - List of available trades with usage info
   */
  getAvailableTrades() {
    return this.trades.map(trade => {
      const uses = this.tradeUses[trade.id] || 0;
      const available = uses < trade.maxUses;
      
      return {
        ...trade,
        uses,
        available
      };
    });
  }
  
  /**
   * Set home position for the villager
   * @param {Object} position - Home position
   */
  setHome(position) {
    this.homePosition = { ...position };
  }
  
  /**
   * Set workstation position for the villager
   * @param {Object} position - Workstation position
   */
  setWorkstation(position) {
    this.workstation = { ...position };
  }
  
  /**
   * Set bed position for the villager
   * @param {Object} position - Bed position
   */
  setBed(position) {
    this.bedPosition = { ...position };
  }
  
  /**
   * Get drops when this villager dies
   * @returns {Array} - Items to drop
   */
  getDrops() {
    // Villagers don't drop items by default
    return [];
  }
  
  /**
   * Check if this mob is passive
   * @returns {boolean} - True if passive
   */
  isPassive() {
    return true;
  }
  
  /**
   * Feed the villager to increase breeding willingness
   * @param {string} foodId - ID of the food item
   * @returns {boolean} - Whether feeding was successful
   */
  feed(foodId) {
    // Only certain foods increase breeding willingness
    const validFoods = ['bread', 'carrot', 'potato', 'beetroot'];
    
    if (!validFoods.includes(foodId)) {
      return false;
    }
    
    // Cannot feed if child or in breeding cooldown
    if (this.isChild || this.breedingCooldown > 0) {
      return false;
    }
    
    // Increase willingness (each food has different values)
    let willingnessIncrease = 0;
    switch (foodId) {
      case 'bread': willingnessIncrease = 30; break;
      case 'carrot': willingnessIncrease = 20; break;
      case 'potato': willingnessIncrease = 20; break;
      case 'beetroot': willingnessIncrease = 15; break;
      default: willingnessIncrease = 10;
    }
    
    this.willingness = Math.min(100, this.willingness + willingnessIncrease);
    
    // Return true if villager is ready to breed
    return this.willingness >= 70;
  }
  
  /**
   * Attempt to breed with another villager
   * @param {VillagerNPC} partner - Partner villager
   * @returns {boolean} - Whether breeding was successful
   */
  breed(partner) {
    // Validate breeding conditions
    if (this.isChild || partner.isChild || 
        this.breedingCooldown > 0 || partner.breedingCooldown > 0 ||
        this.willingness < 70 || partner.willingness < 70) {
      return false;
    }
    
    // Reset willingness
    this.willingness = 0;
    partner.willingness = 0;
    
    // Set breeding cooldown (6000 ticks = 5 minutes)
    this.breedingCooldown = 6000;
    partner.breedingCooldown = 6000;
    
    // Breeding successful, return true to indicate a baby should be spawned
    return true;
  }
  
  /**
   * Start the zombie conversion process
   */
  startZombieConversion() {
    this.isConverting = true;
    // Conversion takes 2-5 minutes
    this.conversionTime = 2400 + Math.floor(Math.random() * 3600);
    this.conversionTimer = 0;
  }
  
  /**
   * Complete the zombie conversion process
   * @returns {Object} - Result of conversion for spawning a zombie villager
   */
  completeZombieConversion() {
    this.isConverting = false;
    this.conversionTimer = 0;
    this.conversionTime = 0;
    this.health = 0;
    this.dead = true;
    
    // Return data for zombie villager spawning
    return {
      type: 'zombie_villager',
      profession: this.profession,
      level: this.level,
      trades: this.trades,
      position: { ...this.position },
      villageId: this.villageId,
      isChild: this.isChild,
      originalVillagerId: this.id
    };
  }
  
  /**
   * Serialize villager data
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      profession: this.profession,
      level: this.level,
      experience: this.experience,
      experienceNeeded: this.experienceNeeded,
      villageId: this.villageId,
      homePosition: this.homePosition,
      workstation: this.workstation,
      bedPosition: this.bedPosition,
      isSleeping: this.isSleeping,
      isWorking: this.isWorking,
      isChild: this.isChild,
      canBreed: this.canBreed,
      isConverting: this.isConverting,
      // Don't include trades for bandwidth efficiency
      // Clients can request trades when needed
    };
  }
  
  /**
   * Handle player interaction with the villager
   * @param {Object} player - Player who is interacting
   * @param {string} action - Action being performed
   * @param {Object} data - Additional data for the action
   * @returns {Object} - Result of the interaction
   */
  handleInteraction(player, action, data = {}) {
    switch (action) {
      case 'trade':
        // Open trading UI
        return {
          success: true,
          action: 'open_trading',
          villagerId: this.id
        };
        
      case 'feed':
        // Feed the villager
        const feedResult = this.feed(data.foodId);
        return {
          success: feedResult,
          action: 'feed',
          readyToBreed: feedResult && this.willingness >= 70
        };
        
      default:
        return {
          success: false,
          error: 'Invalid action'
        };
    }
  }
}

module.exports = VillagerNPC; 