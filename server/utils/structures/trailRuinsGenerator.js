/**
 * TrailRuinsGenerator - Generates Trail Ruins structures for the 1.24 Update (Trail Tales)
 * Handles procedural generation of partially buried ancient ruins with archaeological elements
 */

class TrailRuinsGenerator {
  /**
   * Create a new Trail Ruins generator
   * @param {Object} world - World instance
   */
  constructor(world) {
    this.world = world;
    this.random = world ? world.random : Math.random;
    
    // Trail Ruins configuration
    this.config = {
      // Structure layout
      minBuildings: 3,
      maxBuildings: 7,
      buildingSizeMin: 5,
      buildingSizeMax: 12,
      pathwayWidth: 2,
      plazaChance: 0.6, // 60% chance to have a central plaza
      
      // Biome-specific styling
      biomeBlocks: {
        plains: {
          primary: 'stone_bricks',
          secondary: 'cobblestone',
          accent: 'chiseled_stone_bricks',
          detail: 'oak_planks'
        },
        forest: {
          primary: 'mossy_stone_bricks',
          secondary: 'mossy_cobblestone',
          accent: 'chiseled_stone_bricks',
          detail: 'oak_planks'
        },
        taiga: {
          primary: 'stone_bricks',
          secondary: 'mossy_cobblestone',
          accent: 'chiseled_stone_bricks',
          detail: 'spruce_planks'
        },
        snowy: {
          primary: 'stone_bricks',
          secondary: 'cobblestone',
          accent: 'chiseled_stone_bricks',
          detail: 'spruce_planks'
        },
        desert: {
          primary: 'sandstone',
          secondary: 'cut_sandstone',
          accent: 'chiseled_sandstone',
          detail: 'terracotta'
        },
        savanna: {
          primary: 'stone_bricks',
          secondary: 'terracotta',
          accent: 'chiseled_stone_bricks',
          detail: 'acacia_planks'
        }
      },
      
      // Archaeology
      suspiciousBlockChance: 0.15, // 15% chance for a block to be suspicious
      suspiciousBlocks: ['suspicious_sand', 'suspicious_gravel'],
      
      // Decoration and loot
      decoratedPotChance: 0.4, // 40% chance for a building to have decorated pots
      potPatterns: ['angler', 'arms_up', 'blade', 'brewer', 'burn', 'danger', 'explorer', 'friend', 'heart', 'heartbreak', 'howl', 'miner', 'mourner', 'plenty', 'prize', 'sheaf', 'shelter', 'skull', 'snort'],
      treasureChestChance: 0.6, // 60% chance for a building to have a treasure chest
      
      // Loot tables
      lootTables: {
        common: 'trail_ruins/common',
        uncommon: 'trail_ruins/uncommon',
        rare: 'trail_ruins/rare'
      },
      
      // Generation parameters
      maxAttempts: 50,
      buriedPercentMin: 0.2, // Minimum 20% of structure is buried
      buriedPercentMax: 0.7  // Maximum 70% of structure is buried
    };
  }
  
  /**
   * Set world reference
   * @param {Object} world - World instance
   */
  setWorld(world) {
    this.world = world;
    this.random = world.random || Math.random;
  }
  
  /**
   * Get a random integer between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random integer
   */
  getRandomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
  
  /**
   * Get a random floating point number between min and max
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random float
   */
  getRandomFloat(min, max) {
    return this.random() * (max - min) + min;
  }
  
  /**
   * Generate a Trail Ruins structure
   * @param {Object} startPos - Starting position
   * @param {Object} options - Generation options
   * @returns {Object} Generated structure info
   */
  generate(startPos, options = {}) {
    const startTime = Date.now();
    console.log(`Generating Trail Ruins structure at ${JSON.stringify(startPos)}...`);
    
    // Merge options with defaults
    const config = { ...this.config, ...options };
    
    // Determine biome type for this Trail Ruins
    let biomeType = 'plains'; // Default
    
    if (this.world) {
      const biome = this.world.getBiome(startPos.x, startPos.z);
      if (biome) {
        // Map biome to one of our supported variants
        if (biome.type.includes('forest')) biomeType = 'forest';
        else if (biome.type.includes('taiga')) biomeType = 'taiga';
        else if (biome.type.includes('snow')) biomeType = 'snowy';
        else if (biome.type.includes('desert')) biomeType = 'desert';
        else if (biome.type.includes('savanna')) biomeType = 'savanna';
        else biomeType = 'plains'; // Default for other biomes
      }
    }
    
    // Initialize structure data
    const structure = {
      position: { ...startPos },
      buildings: [],
      pathways: [],
      plazas: [],
      archaeologySites: [],
      treasureChests: [],
      decoratedPots: [],
      biomeType: biomeType,
      bounds: {
        min: { ...startPos },
        max: { ...startPos }
      }
    };
    
    // Determine number of buildings
    const numBuildings = this.getRandomInt(config.minBuildings, config.maxBuildings);
    
    // Should we have a central plaza?
    const hasPlaza = this.random() < config.plazaChance;
    
    // Generate central plaza if needed
    if (hasPlaza) {
      this.generatePlaza(structure, startPos, config, biomeType);
    }
    
    // Generate buildings
    this.generateBuildings(structure, numBuildings, config, biomeType);
    
    // Generate pathways between buildings
    this.generatePathways(structure, config, biomeType);
    
    // Generate archaeology sites
    this.generateArchaeologySites(structure, config, biomeType);
    
    // Add decorations, pots, and chests
    this.addDecorations(structure, config, biomeType);
    
    // Actually build the structure in the world
    this.buildStructure(structure, config);
    
    const endTime = Date.now();
    console.log(`Generated Trail Ruins with ${structure.buildings.length} buildings in ${endTime - startTime}ms`);
    
    return structure;
  }
  
  /**
   * Generate a central plaza for the ruins
   * @param {Object} structure - Structure data
   * @param {Object} position - Center position
   * @param {Object} config - Configuration
   * @param {string} biomeType - Biome type
   */
  generatePlaza(structure, position, config, biomeType) {
    // Create a plaza of random size
    const width = this.getRandomInt(10, 16);
    const length = this.getRandomInt(10, 16);
    
    const plaza = {
      position: { ...position },
      size: { width, length },
      features: [],
      blocks: [],
      buried: this.getRandomFloat(config.buriedPercentMin, config.buriedPercentMax)
    };
    
    // Add some features to the plaza (fountains, benches, etc.)
    const numFeatures = this.getRandomInt(1, 3);
    for (let i = 0; i < numFeatures; i++) {
      const featureType = this.getRandomInt(0, 2);
      let feature;
      
      switch (featureType) {
        case 0: // Fountain
          feature = {
            type: 'fountain',
            position: {
              x: position.x + this.getRandomInt(-3, 3),
              y: position.y,
              z: position.z + this.getRandomInt(-3, 3)
            },
            size: { width: 3, length: 3, height: 2 }
          };
          break;
          
        case 1: // Statue
          feature = {
            type: 'statue',
            position: {
              x: position.x + this.getRandomInt(-4, 4),
              y: position.y,
              z: position.z + this.getRandomInt(-4, 4)
            },
            size: { width: 1, length: 1, height: 3 }
          };
          break;
          
        case 2: // Benches
          feature = {
            type: 'benches',
            positions: [
              {
                x: position.x + this.getRandomInt(-5, 5),
                y: position.y,
                z: position.z + this.getRandomInt(-5, 5)
              },
              {
                x: position.x + this.getRandomInt(-5, 5),
                y: position.y,
                z: position.z + this.getRandomInt(-5, 5)
              }
            ]
          };
          break;
      }
      
      plaza.features.push(feature);
    }
    
    structure.plazas.push(plaza);
    this.updateBounds(structure, plaza);
  }
  
  /**
   * Generate buildings for the ruins
   * @param {Object} structure - Structure data
   * @param {number} numBuildings - Number of buildings to generate
   * @param {Object} config - Configuration
   * @param {string} biomeType - Biome type
   */
  generateBuildings(structure, numBuildings, config, biomeType) {
    const plazaCenter = structure.plazas.length > 0 
      ? structure.plazas[0].position 
      : structure.position;
    
    // Create buildings
    let attempts = 0;
    let buildingsCreated = 0;
    
    while (buildingsCreated < numBuildings && attempts < config.maxAttempts) {
      // Determine building type and size
      const buildingType = this.getRandomBuildingType();
      const buildingConfig = this.getBuildingConfig(buildingType, config);
      
      // Determine direction and distance from plaza/center
      const angle = this.random() * Math.PI * 2;
      const distance = this.getRandomInt(10, 25);
      
      // Calculate position
      const x = Math.floor(plazaCenter.x + Math.cos(angle) * distance);
      const z = Math.floor(plazaCenter.z + Math.sin(angle) * distance);
      
      // Slight y variation
      const y = plazaCenter.y + this.getRandomInt(-1, 1);
      
      // Create building
      const building = {
        position: { x, y, z },
        size: {
          width: this.getRandomInt(buildingConfig.minWidth, buildingConfig.maxWidth),
          length: this.getRandomInt(buildingConfig.minLength, buildingConfig.maxLength),
          height: this.getRandomInt(buildingConfig.minHeight, buildingConfig.maxHeight)
        },
        type: buildingType,
        blocks: [],
        features: [],
        buried: this.getRandomFloat(config.buriedPercentMin, config.buriedPercentMax)
      };
      
      // Check if this building overlaps with existing structures
      const overlaps = this.checkBuildingOverlap(structure, building);
      
      if (!overlaps) {
        structure.buildings.push(building);
        buildingsCreated++;
        this.updateBounds(structure, building);
      }
      
      attempts++;
    }
  }
  
  /**
   * Get a random building type
   * @returns {string} Building type
   */
  getRandomBuildingType() {
    const types = ['house', 'tower', 'storage', 'shrine'];
    const weights = [0.4, 0.2, 0.3, 0.1]; // Weights for each type
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = this.random() * totalWeight;
    
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        return types[i];
      }
      random -= weights[i];
    }
    
    return types[0]; // Fallback
  }
  
  /**
   * Get configuration for a building type
   * @param {string} type - Building type
   * @param {Object} config - General configuration
   * @returns {Object} Building-specific configuration
   */
  getBuildingConfig(type, config) {
    switch (type) {
      case 'house':
        return {
          minWidth: 5,
          maxWidth: 8,
          minLength: 5,
          maxLength: 8,
          minHeight: 3,
          maxHeight: 5
        };
        
      case 'tower':
        return {
          minWidth: 4,
          maxWidth: 6,
          minLength: 4,
          maxLength: 6,
          minHeight: 5,
          maxHeight: 8
        };
        
      case 'storage':
        return {
          minWidth: 4,
          maxWidth: 7,
          minLength: 4,
          maxLength: 7,
          minHeight: 3,
          maxHeight: 4
        };
        
      case 'shrine':
        return {
          minWidth: 5,
          maxWidth: 7,
          minLength: 5,
          maxLength: 7,
          minHeight: 4,
          maxHeight: 6
        };
        
      default:
        return {
          minWidth: config.buildingSizeMin,
          maxWidth: config.buildingSizeMax,
          minLength: config.buildingSizeMin,
          maxLength: config.buildingSizeMax,
          minHeight: 3,
          maxHeight: 6
        };
    }
  }
  
  /**
   * Check if a building overlaps with existing structures
   * @param {Object} structure - Structure data
   * @param {Object} building - Building to check
   * @returns {boolean} Whether there's an overlap
   */
  checkBuildingOverlap(structure, building) {
    const padding = 3; // Minimum spacing between buildings
    
    // Building bounds
    const bldgBounds = {
      min: {
        x: building.position.x - Math.floor(building.size.width / 2) - padding,
        y: building.position.y - padding,
        z: building.position.z - Math.floor(building.size.length / 2) - padding
      },
      max: {
        x: building.position.x + Math.floor(building.size.width / 2) + padding,
        y: building.position.y + building.size.height + padding,
        z: building.position.z + Math.floor(building.size.length / 2) + padding
      }
    };
    
    // Check overlap with plazas
    for (const plaza of structure.plazas) {
      const plazaBounds = {
        min: {
          x: plaza.position.x - Math.floor(plaza.size.width / 2) - padding,
          y: plaza.position.y - padding,
          z: plaza.position.z - Math.floor(plaza.size.length / 2) - padding
        },
        max: {
          x: plaza.position.x + Math.floor(plaza.size.width / 2) + padding,
          y: plaza.position.y + 3 + padding, // Assume plaza height is around 3
          z: plaza.position.z + Math.floor(plaza.size.length / 2) + padding
        }
      };
      
      if (this.boundsOverlap(bldgBounds, plazaBounds)) {
        return true;
      }
    }
    
    // Check overlap with other buildings
    for (const otherBuilding of structure.buildings) {
      const otherBounds = {
        min: {
          x: otherBuilding.position.x - Math.floor(otherBuilding.size.width / 2) - padding,
          y: otherBuilding.position.y - padding,
          z: otherBuilding.position.z - Math.floor(otherBuilding.size.length / 2) - padding
        },
        max: {
          x: otherBuilding.position.x + Math.floor(otherBuilding.size.width / 2) + padding,
          y: otherBuilding.position.y + otherBuilding.size.height + padding,
          z: otherBuilding.position.z + Math.floor(otherBuilding.size.length / 2) + padding
        }
      };
      
      if (this.boundsOverlap(bldgBounds, otherBounds)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if two bounding boxes overlap
   * @param {Object} bounds1 - First bounding box
   * @param {Object} bounds2 - Second bounding box
   * @returns {boolean} Whether the bounds overlap
   */
  boundsOverlap(bounds1, bounds2) {
    return (
      bounds1.min.x <= bounds2.max.x &&
      bounds1.max.x >= bounds2.min.x &&
      bounds1.min.y <= bounds2.max.y &&
      bounds1.max.y >= bounds2.min.y &&
      bounds1.min.z <= bounds2.max.z &&
      bounds1.max.z >= bounds2.min.z
    );
  }
  
  /**
   * Update the structure bounds to include a new element
   * @param {Object} structure - Structure data
   * @param {Object} element - Element to include in bounds
   */
  updateBounds(structure, element) {
    const halfWidth = Math.floor((element.size ? element.size.width : 0) / 2);
    const halfLength = Math.floor((element.size ? element.size.length : 0) / 2);
    const height = element.size ? element.size.height : 0;
    
    // Calculate element bounds
    const elementBounds = {
      min: {
        x: element.position.x - halfWidth,
        y: element.position.y,
        z: element.position.z - halfLength
      },
      max: {
        x: element.position.x + halfWidth,
        y: element.position.y + height,
        z: element.position.z + halfLength
      }
    };
    
    // Update structure bounds
    structure.bounds.min.x = Math.min(structure.bounds.min.x, elementBounds.min.x);
    structure.bounds.min.y = Math.min(structure.bounds.min.y, elementBounds.min.y);
    structure.bounds.min.z = Math.min(structure.bounds.min.z, elementBounds.min.z);
    
    structure.bounds.max.x = Math.max(structure.bounds.max.x, elementBounds.max.x);
    structure.bounds.max.y = Math.max(structure.bounds.max.y, elementBounds.max.y);
    structure.bounds.max.z = Math.max(structure.bounds.max.z, elementBounds.max.z);
  }
  
  /**
   * Generate pathways between buildings
   * @param {Object} structure - Structure data
   * @param {Object} config - Configuration
   * @param {string} biomeType - Biome type
   */
  generatePathways(structure, config, biomeType) {
    // If we have a plaza, connect all buildings to it
    const hasPlaza = structure.plazas.length > 0;
    const plazaCenter = hasPlaza ? structure.plazas[0].position : null;
    
    // Generate pathways between buildings or from plaza to buildings
    for (let i = 0; i < structure.buildings.length; i++) {
      const building = structure.buildings[i];
      
      if (hasPlaza) {
        // Connect building to plaza
        const pathway = this.createPathway(
          plazaCenter,
          building.position,
          config.pathwayWidth,
          config,
          biomeType
        );
        
        structure.pathways.push(pathway);
      } else if (i > 0) {
        // Connect buildings to each other
        // Each building connects to the previous building
        const prevBuilding = structure.buildings[i - 1];
        
        const pathway = this.createPathway(
          prevBuilding.position,
          building.position,
          config.pathwayWidth,
          config,
          biomeType
        );
        
        structure.pathways.push(pathway);
      }
    }
    
    // Add some random connections between buildings for more complexity
    if (structure.buildings.length >= 3) {
      const extraConnections = this.getRandomInt(1, Math.min(3, Math.floor(structure.buildings.length / 2)));
      
      for (let i = 0; i < extraConnections; i++) {
        const buildingA = structure.buildings[this.getRandomInt(0, structure.buildings.length - 1)];
        let buildingB;
        
        // Find a different building that's not already connected
        let attempts = 0;
        do {
          buildingB = structure.buildings[this.getRandomInt(0, structure.buildings.length - 1)];
          attempts++;
        } while (buildingA === buildingB && attempts < 10);
        
        if (buildingA !== buildingB) {
          const pathway = this.createPathway(
            buildingA.position,
            buildingB.position,
            config.pathwayWidth,
            config,
            biomeType
          );
          
          structure.pathways.push(pathway);
        }
      }
    }
  }
  
  /**
   * Create a pathway between two points
   * @param {Object} start - Start position
   * @param {Object} end - End position
   * @param {number} width - Pathway width
   * @param {Object} config - Configuration
   * @param {string} biomeType - Biome type
   * @returns {Object} Pathway data
   */
  createPathway(start, end, width, config, biomeType) {
    // Calculate path length and direction
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // Create pathway object
    const pathway = {
      start: { ...start },
      end: { ...end },
      width: width,
      length: Math.ceil(distance),
      blocks: [],
      buried: this.getRandomFloat(config.buriedPercentMin, config.buriedPercentMax)
    };
    
    return pathway;
  }
  
  /**
   * Generate archaeology sites around the ruins
   * @param {Object} structure - Structure data
   * @param {Object} config - Configuration
   * @param {string} biomeType - Biome type
   */
  generateArchaeologySites(structure, config, biomeType) {
    // Number of archaeology sites scales with number of buildings
    const numSites = Math.ceil(structure.buildings.length * 0.6);
    
    for (let i = 0; i < numSites; i++) {
      // Pick a random location near a building or plaza
      let baseElement;
      
      if (structure.plazas.length > 0 && this.random() < 0.3) {
        // 30% chance to be near a plaza
        baseElement = structure.plazas[0];
      } else {
        // Otherwise pick a random building
        baseElement = structure.buildings[this.getRandomInt(0, structure.buildings.length - 1)];
      }
      
      // Position near the base element
      const offset = {
        x: this.getRandomInt(-8, 8),
        z: this.getRandomInt(-8, 8)
      };
      
      const sitePosition = {
        x: baseElement.position.x + offset.x,
        y: baseElement.position.y - 1, // Slightly lower than ground level
        z: baseElement.position.z + offset.z
      };
      
      // Create the archaeology site
      const site = {
        position: sitePosition,
        size: {
          width: this.getRandomInt(3, 6),
          length: this.getRandomInt(3, 6),
          height: 1  // Typically just one block high
        },
        blocks: [],
        loot: this.getRandomArchaeologyLoot(config, biomeType)
      };
      
      // Check if site overlaps with buildings or other sites
      const overlaps = this.checkSiteOverlap(structure, site);
      
      if (!overlaps) {
        structure.archaeologySites.push(site);
        this.updateBounds(structure, site);
      }
    }
  }
  
  /**
   * Check if an archaeology site overlaps with other structures
   * @param {Object} structure - Structure data
   * @param {Object} site - Archaeology site
   * @returns {boolean} Whether there's an overlap
   */
  checkSiteOverlap(structure, site) {
    const padding = 1; // Minimum spacing
    
    // Site bounds
    const siteBounds = {
      min: {
        x: site.position.x - Math.floor(site.size.width / 2) - padding,
        y: site.position.y - padding,
        z: site.position.z - Math.floor(site.size.length / 2) - padding
      },
      max: {
        x: site.position.x + Math.floor(site.size.width / 2) + padding,
        y: site.position.y + site.size.height + padding,
        z: site.position.z + Math.floor(site.size.length / 2) + padding
      }
    };
    
    // Check overlap with buildings
    for (const building of structure.buildings) {
      const buildingBounds = {
        min: {
          x: building.position.x - Math.floor(building.size.width / 2) - padding,
          y: building.position.y - padding,
          z: building.position.z - Math.floor(building.size.length / 2) - padding
        },
        max: {
          x: building.position.x + Math.floor(building.size.width / 2) + padding,
          y: building.position.y + building.size.height + padding,
          z: building.position.z + Math.floor(building.size.length / 2) + padding
        }
      };
      
      if (this.boundsOverlap(siteBounds, buildingBounds)) {
        return true;
      }
    }
    
    // Check overlap with other archaeology sites
    for (const otherSite of structure.archaeologySites) {
      const otherBounds = {
        min: {
          x: otherSite.position.x - Math.floor(otherSite.size.width / 2) - padding,
          y: otherSite.position.y - padding,
          z: otherSite.position.z - Math.floor(otherSite.size.length / 2) - padding
        },
        max: {
          x: otherSite.position.x + Math.floor(otherSite.size.width / 2) + padding,
          y: otherSite.position.y + otherSite.size.height + padding,
          z: otherSite.position.z + Math.floor(otherSite.size.length / 2) + padding
        }
      };
      
      if (this.boundsOverlap(siteBounds, otherBounds)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get random archaeology loot for a site
   * @param {Object} config - Configuration
   * @param {string} biomeType - Biome type
   * @returns {Object} Loot configuration
   */
  getRandomArchaeologyLoot(config, biomeType) {
    // Define possible sherds and loot
    const sherds = ['angler', 'arms_up', 'blade', 'brewer', 'burn', 'danger', 'explorer', 'friend', 'heart', 'heartbreak', 'howl', 'miner', 'mourner', 'plenty', 'prize', 'sheaf', 'shelter', 'skull', 'snort'];
    
    // Pick random sherds for this site
    const selectedSherds = [];
    const numSherds = this.getRandomInt(1, 3);
    
    for (let i = 0; i < numSherds; i++) {
      const sherd = sherds[this.getRandomInt(0, sherds.length - 1)];
      if (!selectedSherds.includes(sherd)) {
        selectedSherds.push(sherd);
      }
    }
    
    // Other potential loot items
    const lootItems = [];
    
    // 20% chance for special items
    if (this.random() < 0.2) {
      lootItems.push({
        type: this.random() < 0.5 ? 'emerald' : 'diamond',
        count: this.getRandomInt(1, 3)
      });
    }
    
    // 30% chance for gold items
    if (this.random() < 0.3) {
      lootItems.push({
        type: 'gold_ingot',
        count: this.getRandomInt(1, 5)
      });
    }
    
    return {
      sherds: selectedSherds,
      items: lootItems
    };
  }
  
  /**
   * Add decorations, pots, and chests to the structure
   * @param {Object} structure - Structure data
   * @param {Object} config - Configuration
   * @param {string} biomeType - Biome type
   */
  addDecorations(structure, config, biomeType) {
    // Add decorated pots
    this.addDecoratedPots(structure, config, biomeType);
    
    // Add treasure chests
    this.addTreasureChests(structure, config, biomeType);
  }
  
  /**
   * Add decorated pots to buildings
   * @param {Object} structure - Structure data
   * @param {Object} config - Configuration
   * @param {string} biomeType - Biome type
   */
  addDecoratedPots(structure, config, biomeType) {
    for (const building of structure.buildings) {
      if (this.random() < config.decoratedPotChance) {
        // Add 1-3 pots per building
        const potCount = this.getRandomInt(1, 3);
        
        for (let i = 0; i < potCount; i++) {
          // Position within building
          const offset = {
            x: this.getRandomInt(-Math.floor(building.size.width / 2) + 1, Math.floor(building.size.width / 2) - 1),
            z: this.getRandomInt(-Math.floor(building.size.length / 2) + 1, Math.floor(building.size.length / 2) - 1)
          };
          
          const potPosition = {
            x: building.position.x + offset.x,
            y: building.position.y,
            z: building.position.z + offset.z
          };
          
          // Random rotation
          const rotation = this.getRandomInt(0, 3) * 90;
          
          // Random pattern
          const pattern = config.potPatterns[this.getRandomInt(0, config.potPatterns.length - 1)];
          
          structure.decoratedPots.push({
            position: potPosition,
            rotation: rotation,
            pattern: pattern
          });
        }
      }
    }
  }
  
  /**
   * Add treasure chests to buildings
   * @param {Object} structure - Structure data
   * @param {Object} config - Configuration
   * @param {string} biomeType - Biome type
   */
  addTreasureChests(structure, config, biomeType) {
    for (const building of structure.buildings) {
      if (this.random() < config.treasureChestChance) {
        // Position within building
        const offset = {
          x: this.getRandomInt(-Math.floor(building.size.width / 2) + 1, Math.floor(building.size.width / 2) - 1),
          z: this.getRandomInt(-Math.floor(building.size.length / 2) + 1, Math.floor(building.size.length / 2) - 1)
        };
        
        const chestPosition = {
          x: building.position.x + offset.x,
          y: building.position.y,
          z: building.position.z + offset.z
        };
        
        // Random rotation
        const rotation = this.getRandomInt(0, 3) * 90;
        
        // Loot table based on building type
        let lootTable;
        if (building.type === 'tower') {
          lootTable = config.lootTables.rare;
        } else if (building.type === 'shrine') {
          lootTable = config.lootTables.uncommon;
        } else {
          lootTable = config.lootTables.common;
        }
        
        structure.treasureChests.push({
          position: chestPosition,
          rotation: rotation,
          lootTable: lootTable
        });
      }
    }
  }
  
  /**
   * Actually build the structure in the world
   * @param {Object} structure - Structure data
   * @param {Object} config - Configuration
   */
  buildStructure(structure, config) {
    if (!this.world) return;
    
    // Build all elements of the structure
    
    // 1. Build plazas
    for (const plaza of structure.plazas) {
      this.buildPlaza(plaza, config, structure.biomeType);
    }
    
    // 2. Build buildings
    for (const building of structure.buildings) {
      this.buildBuilding(building, config, structure.biomeType);
    }
    
    // 3. Build pathways
    for (const pathway of structure.pathways) {
      this.buildPathway(pathway, config, structure.biomeType);
    }
    
    // 4. Build archaeology sites
    for (const site of structure.archaeologySites) {
      this.buildArchaeologySite(site, config, structure.biomeType);
    }
    
    // 5. Place decorated pots
    for (const pot of structure.decoratedPots) {
      this.world.setBlock(pot.position, {
        id: 'decorated_pot',
        rotation: pot.rotation,
        pattern: pot.pattern
      });
    }
    
    // 6. Place treasure chests
    for (const chest of structure.treasureChests) {
      this.world.setBlock(chest.position, {
        id: 'chest',
        rotation: chest.rotation,
        lootTable: chest.lootTable
      });
    }
  }
  
  /**
   * Build a plaza in the world
   * @param {Object} plaza - Plaza data
   * @param {Object} config - Configuration
   * @param {string} biomeType - Biome type
   */
  buildPlaza(plaza, config, biomeType) {
    if (!this.world) return;
    
    const blocks = config.biomeBlocks[biomeType] || config.biomeBlocks.plains;
    const halfWidth = Math.floor(plaza.size.width / 2);
    const halfLength = Math.floor(plaza.size.length / 2);
    
    // Build plaza floor
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dz = -halfLength; dz <= halfLength; dz++) {
        const x = plaza.position.x + dx;
        const y = plaza.position.y;
        const z = plaza.position.z + dz;
        
        // Determine if this part should be buried
        const distanceFromEdge = Math.min(
          Math.abs(dx + halfWidth),
          Math.abs(dx - halfWidth),
          Math.abs(dz + halfLength),
          Math.abs(dz - halfLength)
        );
        
        const chanceToBeBuried = plaza.buried - (distanceFromEdge / Math.max(halfWidth, halfLength));
        
        if (this.random() > chanceToBeBuried) {
          // Place floor block
          this.world.setBlock({ x, y, z }, {
            id: this.getRandomInt(0, 5) === 0 ? blocks.accent : blocks.primary
          });
        }
      }
    }
    
    // Build features
    for (const feature of plaza.features) {
      this.buildPlazaFeature(feature, blocks, plaza.position);
    }
  }
  
  /**
   * Build a feature in a plaza
   * @param {Object} feature - Feature data
   * @param {Object} blocks - Block types
   * @param {Object} plazaPosition - Plaza position
   */
  buildPlazaFeature(feature, blocks, plazaPosition) {
    if (!this.world) return;
    
    switch (feature.type) {
      case 'fountain':
        // Build a small fountain
        const fountainPos = feature.position;
        const fountainSize = feature.size;
        
        // Bottom layer
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            this.world.setBlock({
              x: fountainPos.x + dx,
              y: fountainPos.y,
              z: fountainPos.z + dz
            }, { id: blocks.primary });
          }
        }
        
        // Middle layer (walls)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            if (dx === -1 || dx === 1 || dz === -1 || dz === 1) {
              this.world.setBlock({
                x: fountainPos.x + dx,
                y: fountainPos.y + 1,
                z: fountainPos.z + dz
              }, { id: blocks.accent });
            }
          }
        }
        
        // Water in the middle
        this.world.setBlock({
          x: fountainPos.x,
          y: fountainPos.y + 1,
          z: fountainPos.z
        }, { id: 'water' });
        break;
        
      case 'statue':
        // Build a simple statue
        const statuePos = feature.position;
        
        // Base
        this.world.setBlock({
          x: statuePos.x,
          y: statuePos.y,
          z: statuePos.z
        }, { id: blocks.accent });
        
        // Body
        this.world.setBlock({
          x: statuePos.x,
          y: statuePos.y + 1,
          z: statuePos.z
        }, { id: blocks.primary });
        
        // Head
        this.world.setBlock({
          x: statuePos.x,
          y: statuePos.y + 2,
          z: statuePos.z
        }, { id: blocks.accent });
        break;
        
      case 'benches':
        // Build benches
        for (const benchPos of feature.positions) {
          // Bench seat
          this.world.setBlock({
            x: benchPos.x,
            y: benchPos.y,
            z: benchPos.z
          }, { id: blocks.secondary });
          
          // Bench back
          this.world.setBlock({
            x: benchPos.x,
            y: benchPos.y + 1,
            z: benchPos.z - 1
          }, { id: blocks.secondary });
        }
        break;
    }
  }
  
  /**
   * Build a building in the world
   * @param {Object} building - Building data
   * @param {Object} config - Configuration
   * @param {string} biomeType - Biome type
   */
  buildBuilding(building, config, biomeType) {
    if (!this.world) return;
    
    const blocks = config.biomeBlocks[biomeType] || config.biomeBlocks.plains;
    const halfWidth = Math.floor(building.size.width / 2);
    const halfLength = Math.floor(building.size.length / 2);
    const height = building.size.height;
    
    // Build foundation
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dz = -halfLength; dz <= halfLength; dz++) {
        const x = building.position.x + dx;
        const y = building.position.y - 1; // One block below for foundation
        const z = building.position.z + dz;
        
        this.world.setBlock({ x, y, z }, { id: blocks.secondary });
      }
    }
    
    // Build walls and floor
    for (let y = 0; y < height; y++) {
      for (let dx = -halfWidth; dx <= halfWidth; dx++) {
        for (let dz = -halfLength; dz <= halfLength; dz++) {
          const isWall = dx === -halfWidth || dx === halfWidth || dz === -halfLength || dz === halfLength;
          const isCorner = (dx === -halfWidth || dx === halfWidth) && (dz === -halfLength || dz === halfLength);
          
          // Skip if this section is buried
          const distanceFromEdge = Math.min(
            Math.abs(dx + halfWidth),
            Math.abs(dx - halfWidth),
            Math.abs(dz + halfLength),
            Math.abs(dz - halfLength)
          );
          
          // Increased chance of burial for higher blocks
          const heightFactor = y / height;
          const chanceToBeBuried = building.buried + (heightFactor * 0.3) - (distanceFromEdge / Math.max(halfWidth, halfLength));
          
          if (this.random() < chanceToBeBuried) {
            continue; // Skip this block (it's buried)
          }
          
          const x = building.position.x + dx;
          const blockY = building.position.y + y;
          const z = building.position.z + dz;
          
          if (y === 0) {
            // Floor
            this.world.setBlock({ x, y: blockY, z }, { id: blocks.secondary });
          } else if (isWall) {
            // Walls
            if (isCorner) {
              this.world.setBlock({ x, y: blockY, z }, { id: blocks.primary });
            } else {
              // Random degradation for non-corner walls
              const isIntact = this.random() < 0.8; // 80% chance to be intact
              if (isIntact) {
                this.world.setBlock({ x, y: blockY, z }, { id: blocks.primary });
              }
            }
          }
        }
      }
    }
    
    // Add doors and windows
    this.addBuildingFeatures(building, blocks);
  }
  
  /**
   * Add features to a building (doors, windows)
   * @param {Object} building - Building data
   * @param {Object} blocks - Block types
   */
  addBuildingFeatures(building, blocks) {
    if (!this.world) return;
    
    const halfWidth = Math.floor(building.size.width / 2);
    const halfLength = Math.floor(building.size.length / 2);
    
    // Add a door on a random wall
    const doorWall = this.getRandomInt(0, 3); // 0=north, 1=east, 2=south, 3=west
    
    let doorX = building.position.x;
    let doorZ = building.position.z;
    
    switch (doorWall) {
      case 0: // North
        doorX += this.getRandomInt(-halfWidth + 1, halfWidth - 1);
        doorZ -= halfLength;
        break;
      case 1: // East
        doorX += halfWidth;
        doorZ += this.getRandomInt(-halfLength + 1, halfLength - 1);
        break;
      case 2: // South
        doorX += this.getRandomInt(-halfWidth + 1, halfWidth - 1);
        doorZ += halfLength;
        break;
      case 3: // West
        doorX -= halfWidth;
        doorZ += this.getRandomInt(-halfLength + 1, halfLength - 1);
        break;
    }
    
    // Place door frame
    this.world.setBlock({ x: doorX, y: building.position.y + 1, z: doorZ }, { id: 'air' });
    this.world.setBlock({ x: doorX, y: building.position.y + 2, z: doorZ }, { id: 'air' });
    
    // Add windows
    const numWindows = this.getRandomInt(1, 4);
    
    for (let i = 0; i < numWindows; i++) {
      // Pick a wall that's not the door wall
      let windowWall;
      do {
        windowWall = this.getRandomInt(0, 3);
      } while (windowWall === doorWall);
      
      let windowX = building.position.x;
      let windowZ = building.position.z;
      
      switch (windowWall) {
        case 0: // North
          windowX += this.getRandomInt(-halfWidth + 1, halfWidth - 1);
          windowZ -= halfLength;
          break;
        case 1: // East
          windowX += halfWidth;
          windowZ += this.getRandomInt(-halfLength + 1, halfLength - 1);
          break;
        case 2: // South
          windowX += this.getRandomInt(-halfWidth + 1, halfWidth - 1);
          windowZ += halfLength;
          break;
        case 3: // West
          windowX -= halfWidth;
          windowZ += this.getRandomInt(-halfLength + 1, halfLength - 1);
          break;
      }
      
      // Place window (just an air block)
      this.world.setBlock({ x: windowX, y: building.position.y + 2, z: windowZ }, { id: 'air' });
    }
  }
  
  /**
   * Build a pathway in the world
   * @param {Object} pathway - Pathway data
   * @param {Object} config - Configuration
   * @param {string} biomeType - Biome type
   */
  buildPathway(pathway, config, biomeType) {
    if (!this.world) return;
    
    const blocks = config.biomeBlocks[biomeType] || config.biomeBlocks.plains;
    
    // Calculate direction vector
    const dx = pathway.end.x - pathway.start.x;
    const dz = pathway.end.z - pathway.start.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // Normalized direction
    const dirX = dx / distance;
    const dirZ = dz / distance;
    
    // Perpendicular direction for width
    const perpX = -dirZ;
    const perpZ = dirX;
    
    // Half width for positioning
    const halfWidth = Math.floor(pathway.width / 2);
    
    // Build the path
    for (let i = 0; i < distance; i++) {
      // Position along the path
      const x = Math.floor(pathway.start.x + dirX * i);
      const z = Math.floor(pathway.start.z + dirZ * i);
      const y = pathway.start.y;
      
      // Build across the width
      for (let w = -halfWidth; w <= halfWidth; w++) {
        const pathX = Math.floor(x + perpX * w);
        const pathZ = Math.floor(z + perpZ * w);
        
        // Determine if this part should be buried
        const distanceRatio = i / distance;
        const widthRatio = Math.abs(w) / halfWidth;
        
        // More chance of burial at the edges
        const chanceToBeBuried = pathway.buried + (widthRatio * 0.2);
        
        if (this.random() > chanceToBeBuried) {
          // Place path block with some variation
          const block = this.random() < 0.3 ? blocks.secondary : blocks.primary;
          this.world.setBlock({ x: pathX, y, z: pathZ }, { id: block });
        }
      }
    }
  }
  
  /**
   * Build an archaeology site in the world
   * @param {Object} site - Archaeology site data
   * @param {Object} config - Configuration
   * @param {string} biomeType - Biome type
   */
  buildArchaeologySite(site, config, biomeType) {
    if (!this.world) return;
    
    const halfWidth = Math.floor(site.size.width / 2);
    const halfLength = Math.floor(site.size.length / 2);
    
    // Build suspicious blocks
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dz = -halfLength; dz <= halfLength; dz++) {
        const x = site.position.x + dx;
        const y = site.position.y;
        const z = site.position.z + dz;
        
        // Determine if this block should be suspicious
        const isCenter = Math.abs(dx) <= 1 && Math.abs(dz) <= 1;
        const isSuspicious = isCenter || this.random() < config.suspiciousBlockChance;
        
        if (isSuspicious) {
          // Choose suspicious block type
          const blockType = config.suspiciousBlocks[this.getRandomInt(0, config.suspiciousBlocks.length - 1)];
          
          // Place with loot data if it's in the center
          if (isCenter && site.loot.sherds.length > 0) {
            // Pop a sherd from the list
            const sherd = site.loot.sherds.pop();
            
            this.world.setBlock({ x, y, z }, {
              id: blockType,
              loot: {
                type: 'pottery_sherd',
                pattern: sherd
              }
            });
          } else {
            this.world.setBlock({ x, y, z }, { id: blockType });
          }
        } else {
          // Place regular block (gravel or coarse dirt)
          const regularBlock = this.random() < 0.5 ? 'gravel' : 'coarse_dirt';
          this.world.setBlock({ x, y, z }, { id: regularBlock });
        }
      }
    }
  }
}

module.exports = TrailRuinsGenerator; 