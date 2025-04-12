/**
 * Village Reputation Manager
 * Handles reputation between players and villages, affecting trading prices and villager behavior
 */
const EventEmitter = require('events');

class VillageReputationManager extends EventEmitter {
  /**
   * Create a new VillageReputationManager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super();
    
    this.reputations = {}; // Stores village-player reputations
    this.gossipDecayTime = options.gossipDecayTime || 24000; // 20 min in ticks
    this.lastDecayTime = 0;
    this.reputationEvents = {
      ZOMBIE_CURED: { delta: 20, decay: 0.5 },
      TRADE: { delta: 1, decay: 2.0 }, 
      VILLAGER_HURT: { delta: -2, decay: 1.0 },
      VILLAGER_KILLED: { delta: -10, decay: 0.0 }, // Permanent penalty
      HERO_OF_THE_VILLAGE: { delta: 30, decay: 1.0 },
      ZOMBIE_ATTACK_DEFENDED: { delta: 5, decay: 1.5 }
    };
    
    // Reputation thresholds for effects
    this.thresholds = {
      DISCOUNT_MIN: 5,   // Min rep for minor discounts
      DISCOUNT_MAX: 30,  // Rep for max discounts
      HOSTILITY: -15,    // Below this, iron golems may become hostile
      GIFTS: 15          // Above this, villagers may give gifts
    };
  }
  
  /**
   * Get the reputation value for a player in a village
   * @param {string} villageId - Village ID
   * @param {string} playerId - Player ID
   * @returns {number} - Reputation value (default 0)
   */
  getReputation(villageId, playerId) {
    if (!this.reputations[villageId]) {
      return 0;
    }
    
    return this.reputations[villageId][playerId] || 0;
  }
  
  /**
   * Update reputation for a player in a village based on an event
   * @param {string} villageId - Village ID
   * @param {string} playerId - Player ID
   * @param {string} eventType - Type of reputation event
   * @returns {number} - New reputation value
   */
  updateReputation(villageId, playerId, eventType) {
    // Check if the event type is valid
    const reputationEvent = this.reputationEvents[eventType];
    if (!reputationEvent) {
      console.warn(`Unknown reputation event type: ${eventType}`);
      return this.getReputation(villageId, playerId);
    }
    
    // Initialize reputation objects if they don't exist
    if (!this.reputations[villageId]) {
      this.reputations[villageId] = {};
    }
    
    if (this.reputations[villageId][playerId] === undefined) {
      this.reputations[villageId][playerId] = 0;
    }
    
    // Update reputation
    this.reputations[villageId][playerId] += reputationEvent.delta;
    
    // Cap reputation between -30 and 50
    this.reputations[villageId][playerId] = Math.max(-30, Math.min(50, this.reputations[villageId][playerId]));
    
    // Emit reputation change event
    this.emit('reputationChange', {
      villageId,
      playerId,
      eventType,
      newReputation: this.reputations[villageId][playerId]
    });
    
    return this.reputations[villageId][playerId];
  }
  
  /**
   * Update the reputation system (decay values, process effects)
   * @param {number} deltaTime - Time since last update in ticks
   */
  update(deltaTime) {
    this.lastDecayTime += deltaTime;
    
    // Process reputation decay every minute (1200 ticks)
    if (this.lastDecayTime >= 1200) {
      this.processReputationDecay();
      this.lastDecayTime = 0;
    }
  }
  
  /**
   * Process reputation decay over time
   */
  processReputationDecay() {
    for (const villageId in this.reputations) {
      for (const playerId in this.reputations[villageId]) {
        let currentRep = this.reputations[villageId][playerId];
        
        // Skip if already at 0
        if (currentRep === 0) continue;
        
        // Calculate decay (toward 0)
        let decay = 0;
        
        if (currentRep > 0) {
          // Positive reputation decay
          decay = -0.1; // Base decay
          
          // Event-specific decay rates for positive reputation
          for (const eventType in this.reputationEvents) {
            if (this.reputationEvents[eventType].delta > 0) {
              decay -= this.reputationEvents[eventType].decay / 100;
            }
          }
          
          // Ensure we don't go below 0 with decay
          decay = Math.max(decay, -currentRep);
        } else if (currentRep < 0) {
          // Negative reputation decay (much slower)
          decay = 0.05; // Base decay
          
          // Event-specific decay rates for negative reputation
          for (const eventType in this.reputationEvents) {
            if (this.reputationEvents[eventType].delta < 0 && 
                this.reputationEvents[eventType].decay > 0) {
              decay += this.reputationEvents[eventType].decay / 200;
            }
          }
          
          // Ensure we don't go above 0 with decay
          decay = Math.min(decay, -currentRep);
        }
        
        // Apply decay
        this.reputations[villageId][playerId] += decay;
        
        // Round to 2 decimal places for cleanliness
        this.reputations[villageId][playerId] = Math.round(this.reputations[villageId][playerId] * 100) / 100;
      }
    }
  }
  
  /**
   * Calculate price discount factor based on reputation
   * @param {string} villageId - Village ID
   * @param {string} playerId - Player ID
   * @returns {number} - Price discount factor (0.0 to 0.3)
   */
  getPriceDiscount(villageId, playerId) {
    const reputation = this.getReputation(villageId, playerId);
    
    if (reputation <= this.thresholds.DISCOUNT_MIN) {
      return 0.0; // No discount
    }
    
    if (reputation >= this.thresholds.DISCOUNT_MAX) {
      return 0.3; // Maximum 30% discount
    }
    
    // Linear scaling between min and max thresholds
    const scale = (reputation - this.thresholds.DISCOUNT_MIN) / 
                  (this.thresholds.DISCOUNT_MAX - this.thresholds.DISCOUNT_MIN);
    
    return Math.round(scale * 30) / 100; // 0% to 30% discount
  }
  
  /**
   * Determine if a player should receive gifts from villagers
   * @param {string} villageId - Village ID
   * @param {string} playerId - Player ID 
   * @returns {boolean} - Whether player should receive gifts
   */
  shouldReceiveGifts(villageId, playerId) {
    return this.getReputation(villageId, playerId) >= this.thresholds.GIFTS;
  }
  
  /**
   * Determine if iron golems should be hostile to a player
   * @param {string} villageId - Village ID
   * @param {string} playerId - Player ID
   * @returns {boolean} - Whether iron golems should be hostile
   */
  shouldGolemAttack(villageId, playerId) {
    return this.getReputation(villageId, playerId) <= this.thresholds.HOSTILITY;
  }
  
  /**
   * Serialize the reputation data for storage
   * @returns {Object} - Serialized reputation data
   */
  serialize() {
    return {
      reputations: { ...this.reputations }
    };
  }
  
  /**
   * Deserialize reputation data
   * @param {Object} data - Serialized reputation data
   */
  deserialize(data) {
    if (data && data.reputations) {
      this.reputations = { ...data.reputations };
    }
  }
}

module.exports = VillageReputationManager; 