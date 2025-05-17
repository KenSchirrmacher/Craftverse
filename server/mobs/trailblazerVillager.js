/**
 * TrailblazerVillager - Exploration-focused villager profession
 * Part of the Minecraft 1.23 Update
 */

const VillagerNPC = require('./villagerNPC');
const { v4: uuidv4 } = require('uuid');

class TrailblazerVillager extends VillagerNPC {
  /**
   * Create a new Trailblazer villager
   * @param {Object} position - Initial position
   * @param {Object} options - Optional configuration
   */
  constructor(position, options = {}) {
    // Always set profession to trailblazer
    const trailblazerOptions = {
      ...options,
      profession: 'trailblazer'
    };
    
    super(position, trailblazerOptions);
    
    // Trailblazer-specific properties
    this.explorationRadius = options.explorationRadius || 2000; // Radius of exploration (blocks)
    this.discoveredLocations = options.discoveredLocations || []; // Locations this trailblazer knows about
    this.specialItemChance = options.specialItemChance || 0.25; // Chance to offer special items
    this.workstationType = 'trailblazer_table'; // Type of workstation needed (cartography table)
    
    // Custom trades for a trailblazer
    this.trades = this.generateTrailblazerTrades();
  }
  
  /**
   * Generate trades specific to the Trailblazer profession
   * @returns {Array} - List of trades
   */
  generateTrailblazerTrades() {
    const trades = [];
    
    // Basic trades always available (emerald for paper/compass materials)
    trades.push({
      id: uuidv4(),
      inputItems: [{ id: 'paper', count: 24 }],
      outputItem: { id: 'emerald', count: 1 },
      maxUses: this.maxTradeUses,
      rewardExperience: 2
    });
    
    trades.push({
      id: uuidv4(),
      inputItems: [{ id: 'iron_ingot', count: 4 }],
      outputItem: { id: 'emerald', count: 1 },
      maxUses: this.maxTradeUses,
      rewardExperience: 2
    });
    
    // Level-specific trades
    if (this.level >= 1) { // Novice
      trades.push({
        id: uuidv4(),
        inputItems: [{ id: 'emerald', count: 1 }],
        outputItem: { id: 'compass', count: 1 },
        maxUses: this.maxTradeUses,
        rewardExperience: 3
      });
      
      trades.push({
        id: uuidv4(),
        inputItems: [{ id: 'emerald', count: 7 }],
        outputItem: { id: 'empty_map', count: 1 },
        maxUses: this.maxTradeUses,
        rewardExperience: 4
      });
    }
    
    if (this.level >= 2) { // Apprentice
      trades.push({
        id: uuidv4(),
        inputItems: [{ id: 'emerald', count: 12 }],
        outputItem: { id: 'biome_map', count: 1 },
        maxUses: this.maxTradeUses,
        rewardExperience: 6
      });
      
      trades.push({
        id: uuidv4(),
        inputItems: [{ id: 'emerald', count: 8 }, { id: 'map', count: 1 }],
        outputItem: { id: 'trail_marker', count: 3 },
        maxUses: this.maxTradeUses,
        rewardExperience: 5
      });
    }
    
    if (this.level >= 3) { // Journeyman
      trades.push({
        id: uuidv4(),
        inputItems: [{ id: 'emerald', count: 18 }],
        outputItem: { id: 'structure_map', count: 1 },
        maxUses: this.maxTradeUses,
        rewardExperience: 10
      });
      
      trades.push({
        id: uuidv4(),
        inputItems: [{ id: 'emerald', count: 10 }, { id: 'compass', count: 1 }],
        outputItem: { id: 'explorer_compass', count: 1 },
        maxUses: this.maxTradeUses,
        rewardExperience: 15
      });
    }
    
    if (this.level >= 4) { // Expert
      trades.push({
        id: uuidv4(),
        inputItems: [{ id: 'emerald', count: 24 }],
        outputItem: { id: 'rare_structure_map', count: 1 },
        maxUses: this.maxTradeUses,
        rewardExperience: 20
      });
      
      trades.push({
        id: uuidv4(),
        inputItems: [{ id: 'emerald', count: 16 }, { id: 'map', count: 1 }],
        outputItem: { id: 'map_updater', count: 1 },
        maxUses: this.maxTradeUses,
        rewardExperience: 18
      });
    }
    
    if (this.level >= 5) { // Master
      trades.push({
        id: uuidv4(),
        inputItems: [{ id: 'emerald', count: 32 }],
        outputItem: { id: 'treasure_map', count: 1 },
        maxUses: this.maxTradeUses,
        rewardExperience: 30
      });
      
      trades.push({
        id: uuidv4(),
        inputItems: [{ id: 'emerald', count: 64 }, { id: 'diamond', count: 1 }],
        outputItem: { id: 'trailblazer_backpack', count: 1 },
        maxUses: 3, // Rare item with limited uses
        rewardExperience: 50
      });
    }
    
    return trades;
  }
  
  /**
   * Generate trades for a specific level
   * @param {number} level - Villager level (1-5)
   * @returns {Array} - New trades for this level
   */
  generateTradesForLevel(level) {
    // For Trailblazer, we'll override with our own implementation
    // that considers player exploration data
    
    // This base implementation is similar to the parent class
    const newTrades = [];
    
    switch (level) {
      case 1: // Novice
        newTrades.push({
          id: uuidv4(),
          inputItems: [{ id: 'emerald', count: 3 }],
          outputItem: { id: 'empty_map', count: 1 },
          maxUses: this.maxTradeUses,
          rewardExperience: 3
        });
        break;
        
      case 2: // Apprentice
        newTrades.push({
          id: uuidv4(),
          inputItems: [{ id: 'emerald', count: 7 }],
          outputItem: { id: 'biome_map', count: 1 },
          maxUses: this.maxTradeUses,
          rewardExperience: 5
        });
        break;
        
      case 3: // Journeyman
        newTrades.push({
          id: uuidv4(),
          inputItems: [{ id: 'emerald', count: 12 }],
          outputItem: { id: 'structure_map', count: 1 },
          maxUses: this.maxTradeUses,
          rewardExperience: 10
        });
        break;
        
      case 4: // Expert
        newTrades.push({
          id: uuidv4(),
          inputItems: [{ id: 'emerald', count: 20 }],
          outputItem: { id: 'rare_structure_map', count: 1 },
          maxUses: this.maxTradeUses,
          rewardExperience: 15
        });
        break;
        
      case 5: // Master
        newTrades.push({
          id: uuidv4(),
          inputItems: [{ id: 'emerald', count: 30 }],
          outputItem: { id: 'treasure_map', count: 1 },
          maxUses: this.maxTradeUses,
          rewardExperience: 25
        });
        break;
    }
    
    // Add chance for special item
    if (Math.random() < this.specialItemChance) {
      // Special items by level
      const specialItems = {
        1: { id: 'trail_marker', count: 2, price: 5 },
        2: { id: 'explorer_compass', count: 1, price: 10 },
        3: { id: 'map_updater', count: 1, price: 15 },
        4: { id: 'map_bundle', count: 1, price: 20 },
        5: { id: 'trailblazer_backpack', count: 1, price: 40 }
      };
      
      const specialItem = specialItems[level] || specialItems[1];
      
      newTrades.push({
        id: uuidv4(),
        inputItems: [{ id: 'emerald', count: specialItem.price }],
        outputItem: { id: specialItem.id, count: specialItem.count },
        maxUses: Math.max(1, Math.floor(this.maxTradeUses / 4)), // Limited uses for special items
        rewardExperience: level * 5
      });
    }
    
    return newTrades;
  }
  
  /**
   * Add a discovered location
   * @param {Object} location - Location info
   */
  addDiscoveredLocation(location) {
    if (!location || !location.type || !location.position) return;
    
    // Check if location is already known
    const exists = this.discoveredLocations.some(loc => 
      loc.type === location.type && 
      loc.position.x === location.position.x &&
      loc.position.z === location.position.z
    );
    
    if (!exists) {
      this.discoveredLocations.push({
        id: uuidv4(),
        type: location.type,
        position: location.position,
        name: location.name || `${location.type.charAt(0).toUpperCase() + location.type.slice(1)} Point`,
        discovered: new Date().toISOString()
      });
    }
  }
  
  /**
   * Generate a map to a specific location type
   * @param {string} locationType - Type of location
   * @returns {Object} Map data or null if no location available
   */
  generateLocationMap(locationType) {
    // Find locations of the requested type
    const matchingLocations = this.discoveredLocations.filter(loc => loc.type === locationType);
    
    if (matchingLocations.length === 0) {
      return null;
    }
    
    // Pick a random location
    const location = matchingLocations[Math.floor(Math.random() * matchingLocations.length)];
    
    // Generate map data
    return {
      id: uuidv4(),
      name: `Map to ${location.name}`,
      centerX: location.position.x,
      centerZ: location.position.z,
      scale: 1,
      locationMarkers: [{
        position: location.position,
        type: locationType,
        name: location.name
      }]
    };
  }
  
  /**
   * Serialize trailblazer data
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      explorationRadius: this.explorationRadius,
      discoveredLocations: this.discoveredLocations,
      specialItemChance: this.specialItemChance,
      workstationType: this.workstationType
    };
  }
  
  /**
   * Create a trailblazer from serialized data
   * @param {Object} data - Serialized data
   * @returns {TrailblazerVillager} Villager instance
   */
  static deserialize(data) {
    const villager = new TrailblazerVillager(
      data.position, 
      {
        level: data.level,
        experience: data.experience,
        experienceNeeded: data.experienceNeeded,
        explorationRadius: data.explorationRadius,
        discoveredLocations: data.discoveredLocations || [],
        specialItemChance: data.specialItemChance,
        canBreed: data.canBreed,
        isChild: data.isChild
      }
    );
    
    // Restore base entity properties
    villager.id = data.id;
    villager.health = data.health;
    villager.maxHealth = data.maxHealth;
    
    return villager;
  }
}

module.exports = TrailblazerVillager; 