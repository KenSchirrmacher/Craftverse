/**
 * Village Generator - Creates village structures with buildings and villagers
 */
const { v4: uuidv4 } = require('uuid');
const SeededRandom = require('./noiseGenerator').SeededRandom;

class VillageGenerator {
  /**
   * Create a new VillageGenerator
   * @param {Object} options - Village generation options
   */
  constructor(options = {}) {
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(this.seed);
    
    // Village size parameters
    this.minSize = options.minSize || 4;  // Minimum number of buildings
    this.maxSize = options.maxSize || 12; // Maximum number of buildings
    
    // Village variation by biome
    this.biomeStyles = {
      plains: {
        woodType: 'oak',
        wallMaterial: 'oak_planks',
        roofMaterial: 'oak_stairs',
        pathMaterial: 'gravel',
        farming: true,
        fishingHuts: false
      },
      desert: {
        woodType: 'acacia',
        wallMaterial: 'sandstone',
        roofMaterial: 'sandstone_stairs',
        pathMaterial: 'sand',
        farming: false,
        fishingHuts: false
      },
      taiga: {
        woodType: 'spruce',
        wallMaterial: 'spruce_planks',
        roofMaterial: 'spruce_stairs',
        pathMaterial: 'coarse_dirt',
        farming: true,
        fishingHuts: true
      },
      savanna: {
        woodType: 'acacia',
        wallMaterial: 'acacia_planks',
        roofMaterial: 'acacia_stairs',
        pathMaterial: 'dirt',
        farming: true,
        fishingHuts: false
      }
    };
    
    // Building types and their weights
    this.buildingTypes = [
      { type: 'house_small', weight: 3, professions: ['nitwit', 'librarian', 'butcher'] },
      { type: 'house_medium', weight: 2, professions: ['farmer', 'shepherd', 'fletcher'] },
      { type: 'blacksmith', weight: 1, professions: ['armorer', 'weaponsmith', 'toolsmith'] },
      { type: 'farm', weight: 2, professions: ['farmer'] },
      { type: 'library', weight: 1, professions: ['librarian'] },
      { type: 'church', weight: 1, professions: ['cleric'] },
      { type: 'butcher_shop', weight: 1, professions: ['butcher'] }
    ];
  }
  
  /**
   * Generate a village at the specified position
   * @param {Object} position - Central position for the village
   * @param {string} biomeName - Biome name for village styling
   * @param {Function} blockSetter - Function to set blocks in the world
   * @param {Function} entitySpawner - Function to spawn entities (villagers)
   * @returns {Object} Village data
   */
  generateVillage(position, biomeName, blockSetter, entitySpawner) {
    const biomeStyle = this.biomeStyles[biomeName] || this.biomeStyles.plains;
    
    // Determine village size
    const villageSize = this.minSize + Math.floor(this.rng.random() * (this.maxSize - this.minSize + 1));
    
    // Create village data object
    const villageId = uuidv4();
    const village = {
      id: villageId,
      position: { ...position },
      biome: biomeName,
      size: villageSize,
      buildings: [],
      roads: [],
      villagers: [],
      style: { ...biomeStyle }
    };
    
    // Generate village center (well or meeting point)
    const centerBuilding = this.generateVillageCenter(village, position, biomeStyle, blockSetter);
    village.buildings.push(centerBuilding);
    
    // Generate buildings around center
    this.generateBuildingsAroundCenter(village, position, biomeStyle, villageSize, blockSetter, entitySpawner);
    
    // Generate connecting roads
    this.generateRoads(village, biomeStyle, blockSetter);
    
    return village;
  }
  
  /**
   * Generate village center structure (well or meeting point)
   * @param {Object} village - Village data
   * @param {Object} position - Center position
   * @param {Object} biomeStyle - Biome-specific styling
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} Center building data
   */
  generateVillageCenter(village, position, biomeStyle, blockSetter) {
    const centerType = this.rng.random() < 0.7 ? 'well' : 'meeting_point';
    const centerBuilding = {
      id: uuidv4(),
      type: centerType,
      position: { ...position },
      size: { width: 5, depth: 5, height: 3 }
    };
    
    // Build the center structure
    if (centerType === 'well') {
      this.buildWell(position, biomeStyle, blockSetter);
    } else {
      this.buildMeetingPoint(position, biomeStyle, blockSetter);
    }
    
    return centerBuilding;
  }
  
  /**
   * Generate buildings around the village center
   * @param {Object} village - Village data
   * @param {Object} centerPos - Center position
   * @param {Object} biomeStyle - Biome-specific styling
   * @param {number} villageSize - Number of buildings to generate
   * @param {Function} blockSetter - Function to set blocks
   * @param {Function} entitySpawner - Function to spawn entities
   */
  generateBuildingsAroundCenter(village, centerPos, biomeStyle, villageSize, blockSetter, entitySpawner) {
    // Calculate ring sizes based on village size
    const rings = Math.ceil(villageSize / 8) + 1;
    
    // Buildings left to place
    let remainingBuildings = villageSize - 1; // -1 for center
    
    // Generate buildings in rings around center
    for (let ring = 1; ring <= rings && remainingBuildings > 0; ring++) {
      const ringRadius = ring * 16; // Spacing between rings (blocks)
      const maxBuildingsInRing = Math.min(remainingBuildings, Math.floor(ring * 8)); // More buildings in outer rings
      
      // Place buildings evenly around the ring
      const angleStep = (2 * Math.PI) / maxBuildingsInRing;
      
      for (let i = 0; i < maxBuildingsInRing && remainingBuildings > 0; i++) {
        // Calculate position on the ring
        const angle = i * angleStep + (this.rng.random() * 0.2 - 0.1); // Small random variation
        const offsetX = Math.sin(angle) * ringRadius;
        const offsetZ = Math.cos(angle) * ringRadius;
        
        // Building position
        const buildingPos = {
          x: Math.floor(centerPos.x + offsetX),
          y: centerPos.y,
          z: Math.floor(centerPos.z + offsetZ)
        };
        
        // Select a random building type weighted by frequency
        const buildingType = this.selectWeightedBuildingType();
        
        // Generate the building
        const building = this.generateBuilding(
          buildingType,
          buildingPos,
          biomeStyle,
          blockSetter
        );
        
        if (building) {
          village.buildings.push(building);
          
          // Spawn villagers for this building
          const villagers = this.spawnVillagersForBuilding(
            building,
            village.id,
            entitySpawner
          );
          
          village.villagers.push(...villagers);
          
          remainingBuildings--;
        }
      }
    }
  }
  
  /**
   * Select a random building type based on weights
   * @returns {Object} Selected building type
   */
  selectWeightedBuildingType() {
    // Calculate total weight
    let totalWeight = 0;
    for (const building of this.buildingTypes) {
      totalWeight += building.weight;
    }
    
    // Select building based on weight
    let randomValue = this.rng.random() * totalWeight;
    
    for (const building of this.buildingTypes) {
      randomValue -= building.weight;
      if (randomValue <= 0) {
        return building;
      }
    }
    
    // Fallback to first building type
    return this.buildingTypes[0];
  }
  
  /**
   * Generate a building at the specified position
   * @param {Object} buildingType - Type of building to generate
   * @param {Object} position - Position for the building
   * @param {Object} biomeStyle - Biome-specific styling
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} Building data
   */
  generateBuilding(buildingType, position, biomeStyle, blockSetter) {
    // Create building data object
    const building = {
      id: uuidv4(),
      type: buildingType.type,
      position: { ...position },
      size: { width: 0, depth: 0, height: 0 },
      professions: buildingType.professions,
      workstations: [],
      beds: []
    };
    
    // Generate building based on type
    switch (buildingType.type) {
      case 'house_small':
        this.buildSmallHouse(building, position, biomeStyle, blockSetter);
        break;
      case 'house_medium':
        this.buildMediumHouse(building, position, biomeStyle, blockSetter);
        break;
      case 'blacksmith':
        this.buildBlacksmith(building, position, biomeStyle, blockSetter);
        break;
      case 'farm':
        this.buildFarm(building, position, biomeStyle, blockSetter);
        break;
      case 'library':
        this.buildLibrary(building, position, biomeStyle, blockSetter);
        break;
      case 'church':
        this.buildChurch(building, position, biomeStyle, blockSetter);
        break;
      case 'butcher_shop':
        this.buildButcherShop(building, position, biomeStyle, blockSetter);
        break;
      default:
        // Unknown building type
        return null;
    }
    
    return building;
  }
  
  /**
   * Generate roads connecting buildings
   * @param {Object} village - Village data
   * @param {Object} biomeStyle - Biome-specific styling
   * @param {Function} blockSetter - Function to set blocks
   */
  generateRoads(village, biomeStyle, blockSetter) {
    const center = village.buildings[0].position; // Center building
    
    // Connect all buildings to the center
    for (let i = 1; i < village.buildings.length; i++) {
      const building = village.buildings[i];
      const roadPath = this.generateRoadPath(center, building.position);
      
      if (roadPath.length > 0) {
        // Create road between points
        const road = {
          id: uuidv4(),
          path: roadPath,
          material: biomeStyle.pathMaterial
        };
        
        village.roads.push(road);
        
        // Build the road
        this.buildRoad(road, biomeStyle, blockSetter);
      }
    }
    
    // Connect some nearby buildings to each other (not just to center)
    for (let i = 1; i < village.buildings.length; i++) {
      const building1 = village.buildings[i];
      
      // Find closest building
      let closestIndex = -1;
      let closestDistance = Infinity;
      
      for (let j = 1; j < village.buildings.length; j++) {
        if (i === j) continue;
        
        const building2 = village.buildings[j];
        const distance = this.calculateDistance(building1.position, building2.position);
        
        if (distance < closestDistance && distance < 30) { // Max 30 blocks distance
          closestDistance = distance;
          closestIndex = j;
        }
      }
      
      // If we found a close building, connect them
      if (closestIndex !== -1 && this.rng.random() < 0.7) { // 70% chance to connect
        const building2 = village.buildings[closestIndex];
        const roadPath = this.generateRoadPath(building1.position, building2.position);
        
        if (roadPath.length > 0) {
          // Create road between buildings
          const road = {
            id: uuidv4(),
            path: roadPath,
            material: biomeStyle.pathMaterial
          };
          
          village.roads.push(road);
          
          // Build the road
          this.buildRoad(road, biomeStyle, blockSetter);
        }
      }
    }
  }
  
  /**
   * Calculate distance between two positions
   * @param {Object} pos1 - First position
   * @param {Object} pos2 - Second position
   * @returns {number} Distance
   */
  calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  
  /**
   * Generate a path for a road between two points
   * @param {Object} start - Start position
   * @param {Object} end - End position
   * @returns {Array} Array of positions forming the path
   */
  generateRoadPath(start, end) {
    const path = [];
    
    // Simple L-shaped path
    // First go along X axis
    const midPoint = { x: end.x, y: start.y, z: start.z };
    
    // Add start point
    path.push({ ...start });
    
    // Add mid point if not the same as start or end
    if (this.calculateDistance(start, midPoint) > 1 && 
        this.calculateDistance(end, midPoint) > 1) {
      path.push({ ...midPoint });
    }
    
    // Add end point
    path.push({ ...end });
    
    return path;
  }
  
  /**
   * Build a road in the world
   * @param {Object} road - Road data
   * @param {Object} biomeStyle - Biome-specific styling
   * @param {Function} blockSetter - Function to set blocks
   */
  buildRoad(road, biomeStyle, blockSetter) {
    const path = road.path;
    const material = road.material;
    
    // For each segment in the path
    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];
      
      // Determine if segment is along X or Z axis
      const isXAxis = start.z === end.z;
      
      if (isXAxis) {
        // X-axis road
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        
        for (let x = minX; x <= maxX; x++) {
          // Place road blocks (3 wide)
          blockSetter(`${x},${start.y},${start.z}`, { type: material });
          blockSetter(`${x},${start.y},${start.z - 1}`, { type: material });
          blockSetter(`${x},${start.y},${start.z + 1}`, { type: material });
        }
      } else {
        // Z-axis road
        const minZ = Math.min(start.z, end.z);
        const maxZ = Math.max(start.z, end.z);
        
        for (let z = minZ; z <= maxZ; z++) {
          // Place road blocks (3 wide)
          blockSetter(`${start.x},${start.y},${z}`, { type: material });
          blockSetter(`${start.x - 1},${start.y},${z}`, { type: material });
          blockSetter(`${start.x + 1},${start.y},${z}`, { type: material });
        }
      }
    }
  }
  
  /**
   * Build a well at the specified position
   * @param {Object} position - Position to build at
   * @param {Object} biomeStyle - Biome-specific styling
   * @param {Function} blockSetter - Function to set blocks
   */
  buildWell(position, biomeStyle, blockSetter) {
    const { x, y, z } = position;
    
    // Build well base (5x5)
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        blockSetter(`${x + dx},${y},${z + dz}`, { type: 'cobblestone' });
      }
    }
    
    // Build well walls
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue; // Skip center
        blockSetter(`${x + dx},${y + 1},${z + dz}`, { type: 'cobblestone' });
      }
    }
    
    // Build well water
    blockSetter(`${x},${y},${z}`, { type: 'cobblestone' });
    blockSetter(`${x},${y + 1},${z}`, { type: 'water' });
    
    // Add roof supports
    for (const corner of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const [dx, dz] = corner;
      blockSetter(`${x + dx},${y + 1},${z + dz}`, { type: biomeStyle.woodType + '_fence' });
      blockSetter(`${x + dx},${y + 2},${z + dz}`, { type: biomeStyle.woodType + '_fence' });
    }
    
    // Add roof
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        blockSetter(`${x + dx},${y + 3},${z + dz}`, { type: biomeStyle.roofMaterial });
      }
    }
  }
  
  /**
   * Build a meeting point at the specified position
   * @param {Object} position - Position to build at
   * @param {Object} biomeStyle - Biome-specific styling
   * @param {Function} blockSetter - Function to set blocks
   */
  buildMeetingPoint(position, biomeStyle, blockSetter) {
    const { x, y, z } = position;
    
    // Build platform (7x7)
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        blockSetter(`${x + dx},${y},${z + dz}`, { type: 'cobblestone' });
      }
    }
    
    // Build campfire in center
    blockSetter(`${x},${y + 1},${z}`, { type: 'campfire' });
    
    // Add benches around
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2; // 4 directions
      const dx = Math.round(Math.sin(angle) * 2);
      const dz = Math.round(Math.cos(angle) * 2);
      
      blockSetter(`${x + dx},${y + 1},${z + dz}`, { type: biomeStyle.woodType + '_slab' });
    }
    
    // Add some decorative elements
    blockSetter(`${x + 2},${y + 1},${z + 2}`, { type: 'lantern' });
    blockSetter(`${x - 2},${y + 1},${z - 2}`, { type: 'lantern' });
  }
  
  /**
   * Build a small house at the specified position
   * @param {Object} building - Building data to update
   * @param {Object} position - Position to build at
   * @param {Object} biomeStyle - Biome-specific styling
   * @param {Function} blockSetter - Function to set blocks
   */
  buildSmallHouse(building, position, biomeStyle, blockSetter) {
    const { x, y, z } = position;
    const width = 5;
    const depth = 5;
    const height = 4;
    
    // Update building size
    building.size = { width, depth, height };
    
    // Build floor
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth; dz++) {
        blockSetter(`${x + dx},${y},${z + dz}`, { type: biomeStyle.woodType + '_planks' });
      }
    }
    
    // Build walls
    for (let dx = 0; dx < width; dx++) {
      for (let dy = 1; dy < height; dy++) {
        blockSetter(`${x + dx},${y + dy},${z}`, { type: biomeStyle.wallMaterial });
        blockSetter(`${x + dx},${y + dy},${z + depth - 1}`, { type: biomeStyle.wallMaterial });
      }
    }
    
    for (let dz = 0; dz < depth; dz++) {
      for (let dy = 1; dy < height; dy++) {
        blockSetter(`${x},${y + dy},${z + dz}`, { type: biomeStyle.wallMaterial });
        blockSetter(`${x + width - 1},${y + dy},${z + dz}`, { type: biomeStyle.wallMaterial });
      }
    }
    
    // Add door
    const doorX = x + Math.floor(width / 2);
    const doorZ = z;
    blockSetter(`${doorX},${y + 1},${doorZ}`, { type: 'air' }); // Door space
    blockSetter(`${doorX},${y + 2},${doorZ}`, { type: 'air' }); // Door space
    
    // Add window
    const windowX = x + 1;
    const windowZ = z + depth - 1;
    blockSetter(`${windowX},${y + 2},${windowZ}`, { type: 'glass_pane' });
    
    // Add bed
    const bedX = x + 3;
    const bedZ = z + 3;
    blockSetter(`${bedX},${y + 1},${bedZ}`, { type: 'bed', metadata: { color: 'red' } });
    
    // Register bed location
    building.beds.push({ x: bedX, y: y + 1, z: bedZ });
    
    // Add workstation based on profession
    if (building.professions.includes('librarian')) {
      const workstationX = x + 1;
      const workstationZ = z + 2;
      blockSetter(`${workstationX},${y + 1},${workstationZ}`, { type: 'lectern' });
      building.workstations.push({ x: workstationX, y: y + 1, z: workstationZ, type: 'lectern' });
    } else if (building.professions.includes('butcher')) {
      const workstationX = x + 1;
      const workstationZ = z + 2;
      blockSetter(`${workstationX},${y + 1},${workstationZ}`, { type: 'smoker' });
      building.workstations.push({ x: workstationX, y: y + 1, z: workstationZ, type: 'smoker' });
    }
    
    // Add roof
    for (let dx = -1; dx <= width; dx++) {
      for (let dz = -1; dz <= depth; dz++) {
        blockSetter(`${x + dx},${y + height},${z + dz}`, { type: biomeStyle.roofMaterial });
      }
    }
  }
  
  /**
   * Spawn villagers for a building
   * @param {Object} building - Building data
   * @param {string} villageId - Village ID
   * @param {Function} entitySpawner - Function to spawn entities
   * @returns {Array} Spawned villagers
   */
  spawnVillagersForBuilding(building, villageId, entitySpawner) {
    const villagers = [];
    
    // Determine number of villagers to spawn
    const maxVillagers = building.beds.length;
    let villagersToSpawn = 0;
    
    if (maxVillagers > 0) {
      // At least one villager per occupied house
      villagersToSpawn = 1;
      
      // Small chance for a child
      if (maxVillagers >= 2 && this.rng.random() < 0.3) {
        villagersToSpawn++;
      }
    }
    
    // Spawn villagers
    for (let i = 0; i < villagersToSpawn; i++) {
      // Choose a profession from the building's allowed professions
      const profession = building.professions.length > 0
        ? building.professions[Math.floor(this.rng.random() * building.professions.length)]
        : 'nitwit';
      
      // Determine if this should be a child
      const isChild = i > 0 && this.rng.random() < 0.3;
      
      // Spawn position near the building
      const spawnPos = {
        x: building.position.x + 1, // Offset slightly
        y: building.position.y + 1, // Above floor
        z: building.position.z + 1  // Offset slightly
      };
      
      // Create villager options
      const villagerOptions = {
        profession,
        level: 1 + Math.floor(this.rng.random() * 3), // Level 1-3
        isChild,
        canBreed: !isChild,
        homePosition: building.position,
        villagerId: villageId
      };
      
      // Add workstation if available
      if (building.workstations.length > 0 && !isChild) {
        villagerOptions.workstation = building.workstations[0];
      }
      
      // Add bed if available
      if (building.beds.length > 0) {
        villagerOptions.bedPosition = building.beds[i % building.beds.length];
      }
      
      // Spawn the villager
      const villager = entitySpawner('villager', spawnPos, villagerOptions);
      if (villager) {
        villagers.push(villager);
      }
    }
    
    return villagers;
  }
  
  // Additional building methods would be implemented here,
  // such as buildMediumHouse, buildBlacksmith, buildFarm, etc.
  // These would follow the same pattern as buildSmallHouse
  
  // For brevity, we've omitted these implementations, but they would 
  // create more complex structures with appropriate workstations,
  // decorations, and furniture depending on the building type
}

module.exports = VillageGenerator; 