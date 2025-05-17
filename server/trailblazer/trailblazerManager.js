/**
 * TrailblazerManager - Manages Trailblazer villagers and related systems
 * Part of the Minecraft 1.23 Update
 */

const TrailblazerVillager = require('../mobs/trailblazerVillager');
const TrailblazerItemRegistry = require('./trailblazerItemRegistry');
const { v4: uuidv4 } = require('uuid');

class TrailblazerManager {
  /**
   * Initialize the Trailblazer manager
   * @param {Object} options - Manager options
   */
  constructor(options = {}) {
    this.gameContext = options.gameContext || null;
    this.villagerManager = options.villagerManager || null;
    this.initialized = false;
    
    // Trailblazer-specific systems
    this.itemRegistry = new TrailblazerItemRegistry();
    
    // Active Trailblazer villagers in the world
    this.activeTrailblazers = {};
    
    // Known locations available to Trailblazers
    this.knownLocations = options.knownLocations || [];
    
    // Workstation block ID
    this.workstationBlockId = 'cartography_table';
    
    // Percentage chance for a villager to be a Trailblazer
    this.trailblazerChance = options.trailblazerChance || 0.15; // 15% chance
    
    // Validation of required discovery data on loaded chunks
    this.chunkValidationEnabled = options.chunkValidationEnabled !== undefined ? 
      options.chunkValidationEnabled : true;
  }
  
  /**
   * Initialize the Trailblazer manager
   * @param {Object} gameContext - Game context containing required managers
   * @returns {boolean} Success status
   */
  initialize(gameContext) {
    if (this.initialized) return true;
    
    this.gameContext = gameContext || this.gameContext;
    
    if (!this.gameContext) {
      console.error('Cannot initialize TrailblazerManager: gameContext required');
      return false;
    }
    
    // Get the villager manager
    this.villagerManager = this.gameContext.villagerManager || this.villagerManager;
    
    if (!this.villagerManager) {
      console.error('Cannot initialize TrailblazerManager: villagerManager required');
      return false;
    }
    
    // Initialize object properties
    this.activeTrailblazers = this.activeTrailblazers || {};
    this.knownLocations = this.knownLocations || [];
    
    // Initialize the item registry
    this.itemRegistry.initialize(this.gameContext);
    
    // Register the Trailblazer profession with the villager manager
    this.registerTrailblazerProfession();
    
    // Register event handlers
    this.registerEventHandlers();
    
    this.initialized = true;
    return true;
  }
  
  /**
   * Register the Trailblazer profession with the villager manager
   */
  registerTrailblazerProfession() {
    if (!this.villagerManager || !this.villagerManager.registerProfession) {
      console.error('Cannot register Trailblazer profession: villagerManager.registerProfession not available');
      return;
    }
    
    // Register the Trailblazer profession
    this.villagerManager.registerProfession({
      id: 'trailblazer',
      name: 'Trailblazer',
      workstationBlockId: this.workstationBlockId,
      villagerClass: TrailblazerVillager,
      spawnWeight: 15, // Relative spawn weight compared to other professions
      allowNaturalSpawn: true,
      defaultSkin: {
        texture: 'textures/entity/villager/trailblazer.png',
        model: 'models/entity/villager/trailblazer.json'
      }
    });
  }
  
  /**
   * Register event handlers for Trailblazer-related functionality
   */
  registerEventHandlers() {
    const eventManager = this.gameContext.eventManager;
    if (!eventManager) return;
    
    // When a villager selects a profession, check if it should be a Trailblazer
    eventManager.on('villager.selectProfession', (villager, profession) => {
      if (profession === null && villager.canSelectProfession && 
          Math.random() < this.trailblazerChance) {
        this.tryConvertToTrailblazer(villager);
      }
    });
    
    // When a village is generated, add Trailblazers
    eventManager.on('village.generated', (village) => {
      this.addTrailblazersToVillage(village);
    });
    
    // When a chunk is loaded, validate it for locations
    if (this.chunkValidationEnabled) {
      eventManager.on('chunk.loaded', (chunk) => {
        this.validateChunkForLocations(chunk);
      });
    }
    
    // When a player discovers a new structure or significant location
    eventManager.on('player.discoverLocation', (player, location) => {
      this.handleLocationDiscovery(player, location);
    });
    
    // When a player trades with a Trailblazer
    eventManager.on('villager.trade', (villager, player, trade) => {
      if (villager instanceof TrailblazerVillager) {
        this.handleTrailblazerTrade(villager, player, trade);
      }
    });
  }
  
  /**
   * Try to convert a villager to a Trailblazer if appropriate
   * @param {Object} villager - The villager to convert
   * @returns {boolean} Whether the conversion was successful
   */
  tryConvertToTrailblazer(villager) {
    if (!villager || !this.villagerManager) return false;
    
    // Check if there's a cartography table nearby
    const hasWorkstation = this.villagerManager.hasNearbyBlock(
      villager, 
      this.workstationBlockId,
      10 // Search radius
    );
    
    if (!hasWorkstation) return false;
    
    // Create a new Trailblazer villager to replace this one
    const trailblazer = new TrailblazerVillager(
      villager.position,
      {
        level: villager.level || 1,
        experience: villager.experience || 0,
        experienceNeeded: villager.experienceNeeded || 10,
        canBreed: villager.canBreed !== undefined ? villager.canBreed : true,
        isChild: villager.isChild !== undefined ? villager.isChild : false
      }
    );
    
    // Copy over entity properties
    if (villager.id) {
      trailblazer.id = villager.id;
    }
    
    if (villager.health !== undefined && villager.maxHealth !== undefined) {
      trailblazer.health = villager.health;
      trailblazer.maxHealth = villager.maxHealth;
    }
    
    // Register the new Trailblazer
    this.registerTrailblazer(trailblazer);
    
    // Replace the old villager with the Trailblazer
    if (this.gameContext.world && this.gameContext.world.replaceEntity) {
      this.gameContext.world.replaceEntity(villager.id, trailblazer);
      return true;
    }
    
    return false;
  }
  
  /**
   * Add Trailblazers to a village
   * @param {Object} village - Village data
   */
  addTrailblazersToVillage(village) {
    if (!village || !village.villagers || !this.gameContext.world) return;
    
    // Check if the village has any cartography tables
    const hasCartographyTable = village.specialBuildings && 
      village.specialBuildings.some(building => building.type === 'cartography');
    
    if (!hasCartographyTable) return;
    
    // Determine how many Trailblazers to add (1-2)
    const count = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < count; i++) {
      // Create a new Trailblazer
      const position = { ...village.center };
      position.x += Math.floor(Math.random() * 20) - 10;
      position.z += Math.floor(Math.random() * 20) - 10;
      
      const trailblazer = new TrailblazerVillager(
        position,
        {
          level: Math.floor(Math.random() * 3) + 1, // Level 1-3
          canBreed: true,
          isChild: false
        }
      );
      
      // Add some known locations based on village surroundings
      if (village.nearbyStructures) {
        village.nearbyStructures.forEach(structure => {
          trailblazer.addDiscoveredLocation({
            type: structure.type,
            position: structure.position,
            name: structure.name
          });
        });
      }
      
      // Add the Trailblazer to the world
      this.registerTrailblazer(trailblazer);
      this.gameContext.world.addEntity(trailblazer);
    }
  }
  
  /**
   * Register a Trailblazer villager
   * @param {Object} trailblazer - Trailblazer to register
   * @returns {boolean} Success status
   */
  registerTrailblazer(trailblazer) {
    if (!trailblazer) return false;
    
    // Initialize activeTrailblazers if not already initialized
    if (!this.activeTrailblazers) {
      this.activeTrailblazers = {};
    }
    
    // Ensure trailblazer has an ID
    if (!trailblazer.id) {
      console.error('Cannot register Trailblazer: missing ID');
      return false;
    }
    
    // Add to active Trailblazers
    this.activeTrailblazers[trailblazer.id] = trailblazer;
    
    // Share known locations with this Trailblazer
    this.shareDiscoveredLocations(trailblazer);
    
    return true;
  }
  
  /**
   * Remove a Trailblazer from the registry
   * @param {string} trailblazerId - ID of the Trailblazer to remove
   */
  unregisterTrailblazer(trailblazerId) {
    if (this.activeTrailblazers[trailblazerId]) {
      delete this.activeTrailblazers[trailblazerId];
    }
  }
  
  /**
   * Share discovered locations with a Trailblazer
   * @param {Object} trailblazer - Trailblazer to share with
   */
  shareDiscoveredLocations(trailblazer) {
    if (!trailblazer || !trailblazer.addDiscoveredLocation) return;
    
    // Initialize knownLocations if not already initialized
    if (!this.knownLocations) {
      this.knownLocations = [];
    }
    
    // Give the Trailblazer some known locations (if at least journeyman)
    if (trailblazer.level >= 3 && this.knownLocations.length > 0) {
      // Share a random subset of known locations
      const locationsToShare = Math.min(
        Math.floor(Math.random() * 3) + 1, // 1-3 locations
        this.knownLocations.length
      );
      
      // Shuffle and take a subset of locations
      const shuffled = [...this.knownLocations].sort(() => 0.5 - Math.random());
      const selectedLocations = shuffled.slice(0, locationsToShare);
      
      // Add each location to the Trailblazer
      selectedLocations.forEach(location => {
        trailblazer.addDiscoveredLocation(location);
      });
    }
  }
  
  /**
   * Validate a chunk for interesting locations
   * @param {Object} chunk - Chunk data
   */
  validateChunkForLocations(chunk) {
    if (!chunk || !chunk.x || !chunk.z || !this.gameContext.world) return;
    
    // Check if this chunk has any interesting structures or biomes
    const structures = this.gameContext.world.getStructuresInChunk?.(chunk.x, chunk.z);
    
    if (structures && structures.length > 0) {
      structures.forEach(structure => {
        // Add to known locations if not already present
        const exists = this.knownLocations.some(loc => 
          loc.type === structure.type && 
          loc.position.x === structure.position.x &&
          loc.position.z === structure.position.z
        );
        
        if (!exists) {
          const location = {
            id: uuidv4(),
            type: structure.type,
            position: structure.position,
            name: structure.name || `${structure.type.charAt(0).toUpperCase() + structure.type.slice(1)}`,
            discovered: new Date().toISOString(),
            discoveredBy: 'world_generation'
          };
          
          this.knownLocations.push(location);
        }
      });
    }
    
    // Check for interesting biomes
    const biome = this.gameContext.world.getBiomeAt?.({
      x: chunk.x * 16 + 8,
      y: 64,
      z: chunk.z * 16 + 8
    });
    
    if (biome && ['jungle', 'mushroom_fields', 'badlands', 'cherry_grove'].includes(biome)) {
      const position = {
        x: chunk.x * 16 + 8,
        y: 64,
        z: chunk.z * 16 + 8
      };
      
      // Add to known locations if not already present
      const exists = this.knownLocations.some(loc => 
        loc.type === biome && 
        Math.abs(loc.position.x - position.x) < 64 &&
        Math.abs(loc.position.z - position.z) < 64
      );
      
      if (!exists) {
        const location = {
          id: uuidv4(),
          type: biome,
          position,
          name: `${biome.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Biome`,
          discovered: new Date().toISOString(),
          discoveredBy: 'world_generation'
        };
        
        this.knownLocations.push(location);
      }
    }
  }
  
  /**
   * Handle a player discovering a new location
   * @param {Object} player - Player who made the discovery
   * @param {Object} location - Location data
   */
  handleLocationDiscovery(player, location) {
    if (!player || !location || !location.type || !location.position) return;
    
    // Add to known locations if not already present
    const exists = this.knownLocations.some(loc => 
      loc.type === location.type && 
      loc.position.x === location.position.x &&
      loc.position.z === location.position.z
    );
    
    if (!exists) {
      const newLocation = {
        id: uuidv4(),
        type: location.type,
        position: location.position,
        name: location.name || `${location.type.charAt(0).toUpperCase() + location.type.slice(1)}`,
        discovered: new Date().toISOString(),
        discoveredBy: player.name || player.id
      };
      
      this.knownLocations.push(newLocation);
    }
    
    // Inform nearby Trailblazers about this discovery
    this.informNearbyTrailblazers(player, location);
  }
  
  /**
   * Inform nearby Trailblazers about a discovery
   * @param {Object} player - Player who made the discovery
   * @param {Object} location - Location data
   */
  informNearbyTrailblazers(player, location) {
    if (!player || !player.position || !location) return;
    
    const INFORM_RADIUS = 64; // Blocks
    
    // Find nearby Trailblazers
    Object.values(this.activeTrailblazers).forEach(trailblazer => {
      if (!trailblazer.position) return;
      
      // Calculate distance to player
      const dx = trailblazer.position.x - player.position.x;
      const dz = trailblazer.position.z - player.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      // If within range, inform this Trailblazer
      if (distance <= INFORM_RADIUS) {
        trailblazer.addDiscoveredLocation(location);
        
        // Possibly give the Trailblazer some experience for this discovery
        if (trailblazer.addExperience) {
          const experienceGain = Math.floor(Math.random() * 3) + 1; // 1-3 XP
          trailblazer.addExperience(experienceGain);
        }
      }
    });
  }
  
  /**
   * Handle a trade with a Trailblazer villager
   * @param {Object} villager - Trailblazer villager
   * @param {Object} player - Player trading
   * @param {Object} trade - Trade data
   */
  handleTrailblazerTrade(villager, player, trade) {
    if (!villager || !player || !trade || !trade.outputItem) return;
    
    // Handle map trades - customize maps for the player
    if (['biome_map', 'structure_map', 'rare_structure_map', 'treasure_map'].includes(trade.outputItem.id) &&
        this.gameContext.world) {
          
      // Try to customize the map based on nearby features
      this.customizeMapForPlayer(player, trade.outputItem.id);
      
      // Award extra XP to the villager for map trades
      if (villager.addExperience) {
        const experienceGain = Math.floor(Math.random() * 2) + 1; // 1-2 XP
        villager.addExperience(experienceGain);
      }
    }
    
    // Add player to trusted traders for this Trailblazer
    if (!villager.trustedTraders) {
      villager.trustedTraders = [];
    }
    
    if (!villager.trustedTraders.includes(player.id)) {
      villager.trustedTraders.push(player.id);
    }
  }
  
  /**
   * Customize a map for a player based on their location
   * @param {Object} player - Player to customize for
   * @param {string} mapId - Type of map to customize
   */
  customizeMapForPlayer(player, mapId) {
    if (!player || !player.position || !mapId || !this.gameContext.world || !player.inventory) {
      return;
    }
    
    // Find the map in the player's inventory
    const mapItem = player.inventory.findItem(item => item.id === mapId);
    if (!mapItem) return;
    
    // Customize based on map type
    switch (mapId) {
      case 'biome_map':
        // Find interesting biomes near the player
        const biomes = this.gameContext.world.getBiomesInRadius?.(
          player.position,
          2000 // Search radius
        );
        
        if (biomes && biomes.length > 0) {
          // Pick a random interesting biome
          const interestingBiomes = biomes.filter(b => 
            ['jungle', 'mushroom_fields', 'badlands', 'cherry_grove', 'swamp', 'desert'].includes(b.type)
          );
          
          if (interestingBiomes.length > 0) {
            const biome = interestingBiomes[Math.floor(Math.random() * interestingBiomes.length)];
            
            if (mapItem.setTargetBiome) {
              mapItem.setTargetBiome(biome.type);
            }
          }
        }
        break;
        
      case 'structure_map':
      case 'rare_structure_map':
        // Find structures near the player
        const isRare = mapId === 'rare_structure_map';
        
        const structures = this.gameContext.world.getStructuresInRadius?.(
          player.position,
          isRare ? 5000 : 2000, // Search radius
          isRare // Include rare structures
        );
        
        if (structures && structures.length > 0) {
          // Pick a random suitable structure
          const suitableStructures = isRare ? 
            structures.filter(s => ['mansion', 'ruins', 'ancient_city'].includes(s.type)) :
            structures.filter(s => ['village', 'temple', 'shipwreck'].includes(s.type));
            
          if (suitableStructures.length > 0) {
            const structure = suitableStructures[Math.floor(Math.random() * suitableStructures.length)];
            
            if (mapItem.setTargetStructureLocation) {
              mapItem.setTargetStructureLocation(structure);
            }
          }
        }
        break;
        
      case 'treasure_map':
        // Generate a random treasure location
        const treasurePos = {
          x: player.position.x + (Math.random() * 1000 - 500),
          y: 64,
          z: player.position.z + (Math.random() * 1000 - 500),
        };
        
        const treasureStructure = {
          type: 'treasure',
          position: treasurePos,
          name: 'Buried Treasure'
        };
        
        if (mapItem.setTargetStructureLocation) {
          mapItem.setTargetStructureLocation(treasureStructure);
        }
        
        // Add this treasure to world data for future discovery
        if (this.gameContext.world.addHiddenTreasure) {
          this.gameContext.world.addHiddenTreasure(treasurePos, 'buried_treasure');
        }
        break;
    }
  }
  
  /**
   * Get all known locations of a specific type
   * @param {string} locationType - Type of location to get
   * @returns {Array} Matching locations
   */
  getLocationsOfType(locationType) {
    if (!locationType) return [];
    
    return this.knownLocations.filter(location => location.type === locationType);
  }
  
  /**
   * Get all active Trailblazer villagers
   * @returns {Array} Active Trailblazers
   */
  getActiveTrailblazers() {
    return Object.values(this.activeTrailblazers);
  }
  
  /**
   * Get a Trailblazer by ID
   * @param {string} id - Trailblazer ID
   * @returns {Object} Trailblazer or null if not found
   */
  getTrailblazer(id) {
    return this.activeTrailblazers[id] || null;
  }
  
  /**
   * Serialize manager data for saving
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      knownLocations: this.knownLocations,
      trailblazerChance: this.trailblazerChance,
      chunkValidationEnabled: this.chunkValidationEnabled
    };
  }
  
  /**
   * Load manager data from serialized form
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    if (!data) return;
    
    if (data.knownLocations) {
      this.knownLocations = data.knownLocations;
    }
    
    if (data.trailblazerChance !== undefined) {
      this.trailblazerChance = data.trailblazerChance;
    }
    
    if (data.chunkValidationEnabled !== undefined) {
      this.chunkValidationEnabled = data.chunkValidationEnabled;
    }
  }
}

module.exports = TrailblazerManager; 