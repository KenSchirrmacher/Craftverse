/**
 * Structure Generator - Handles generation of predefined structures in the world
 */
const VillageGenerator = require('./villageGenerator');

class StructureGenerator {
  /**
   * Create a new StructureGenerator
   * @param {Object} options - Configuration options
   * @param {number} options.seed - Seed for structure generation
   */
  constructor(options = {}) {
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    this.structures = {};
    
    // Create village generator
    this.villageGenerator = new VillageGenerator({ seed: this.seed });
    
    // Entity spawner function (to be set by server)
    this.entitySpawner = null;
    
    // Register built-in structure generators
    this.registerDefaultStructures();
  }
  
  /**
   * Set the entity spawner function
   * @param {Function} spawner - Function to spawn entities
   */
  setEntitySpawner(spawner) {
    this.entitySpawner = spawner;
  }
  
  /**
   * Register default structure generators
   * @private
   */
  registerDefaultStructures() {
    // Small structures
    this.registerStructure('desert_well', this.generateDesertWell);
    this.registerStructure('boulder_pile', this.generateBoulderPile);
    this.registerStructure('fallen_tree', this.generateFallenTree);
    
    // Medium structures
    this.registerStructure('desert_pyramid', this.generateDesertPyramid);
    this.registerStructure('small_ruin', this.generateSmallRuin);
    this.registerStructure('witch_hut', this.generateWitchHut);
    
    // Underground structures
    this.registerStructure('dungeon', this.generateDungeon);
    
    // Ocean structures
    this.registerStructure('ocean_ruins', this.generateOceanRuins);
    
    // Large structures (placeholder functions)
    this.registerStructure('village', this.generateVillage);
    this.registerStructure('stronghold', this.generateStronghold);
    this.registerStructure('mineshaft', this.generateMineshaft);
    this.registerStructure('ocean_monument', this.generateOceanMonument);
  }
  
  /**
   * Register a structure generator
   * @param {string} structureId - Unique ID for the structure
   * @param {Function} generatorFunction - Function to generate the structure
   * @returns {boolean} - Whether registration was successful
   */
  registerStructure(structureId, generatorFunction) {
    if (this.structures[structureId]) {
      console.warn(`Structure with ID ${structureId} is already registered`);
      return false;
    }
    
    this.structures[structureId] = generatorFunction;
    return true;
  }
  
  /**
   * Generate a structure in the world
   * @param {string} structureId - ID of the structure to generate
   * @param {Object} position - Position {x, y, z} to generate the structure
   * @param {Object} options - Additional options for generation
   * @param {Object} blockSetter - Function to set blocks in the world
   * @returns {Object|null} - Structure data or null if generation failed
   */
  generateStructure(structureId, position, options = {}, blockSetter) {
    const generator = this.structures[structureId];
    
    if (!generator) {
      console.warn(`Unknown structure type: ${structureId}`);
      return null;
    }
    
    // Call the generator function
    return generator.call(this, position, options, blockSetter);
  }
  
  /**
   * Set a block in the world using the provided block setter function
   * @private
   * @param {Object} blockSetter - Function to set blocks
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} block - Block data to set
   */
  setBlock(blockSetter, x, y, z, block) {
    blockSetter(`${x},${y},${z}`, block);
  }
  
  /**
   * Generate a simple desert well
   * @param {Object} position - Position to generate the well
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateDesertWell(position, options, blockSetter) {
    const { x, y, z } = position;
    
    // Well base (sandstone slab rectangle)
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        this.setBlock(blockSetter, x + dx, y, z + dz, { type: 'sandstone_slab' });
      }
    }
    
    // Well walls (sandstone blocks)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue; // Skip center
        this.setBlock(blockSetter, x + dx, y + 1, z + dz, { type: 'sandstone' });
      }
    }
    
    // Well center (water)
    this.setBlock(blockSetter, x, y, z, { type: 'sandstone' });
    this.setBlock(blockSetter, x, y + 1, z, { type: 'water' });
    
    // Add some decoration
    for (let i = 0; i < 4; i++) {
      const corner = [
        { dx: -1, dz: -1 },
        { dx: 1, dz: -1 },
        { dx: -1, dz: 1 },
        { dx: 1, dz: 1 }
      ][i];
      
      this.setBlock(blockSetter, x + corner.dx, y + 1, z + corner.dz, { type: 'sandstone_wall' });
    }
    
    return {
      type: 'desert_well',
      position: { x, y, z },
      size: { width: 5, height: 2, depth: 5 }
    };
  }
  
  /**
   * Generate a pile of boulders
   * @param {Object} position - Position to generate the boulders
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateBoulderPile(position, options, blockSetter) {
    const { x, y, z } = position;
    const { count = 5, material = 'stone' } = options;
    
    // Generate several boulders of different sizes
    for (let i = 0; i < count; i++) {
      // Random position within the area
      const dx = Math.floor(Math.random() * 5) - 2;
      const dy = Math.floor(Math.random() * 2);
      const dz = Math.floor(Math.random() * 5) - 2;
      
      // Random size of boulder
      const size = Math.floor(Math.random() * 2) + 1;
      
      // Create the boulder
      for (let bx = -size; bx <= size; bx++) {
        for (let by = -size; by <= size; by++) {
          for (let bz = -size; bz <= size; bz++) {
            // Make it roughly spherical by checking distance from center
            if (bx*bx + by*by + bz*bz <= size*size + 1) {
              this.setBlock(blockSetter, x + dx + bx, y + dy + by, z + dz + bz, { type: material });
            }
          }
        }
      }
    }
    
    return {
      type: 'boulder_pile',
      position: { x, y, z },
      size: { width: 6, height: 4, depth: 6 }
    };
  }
  
  /**
   * Generate a fallen tree
   * @param {Object} position - Position to generate the fallen tree
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateFallenTree(position, options, blockSetter) {
    const { x, y, z } = position;
    const { length = 5, variant = 'oak' } = options;
    
    // Random direction
    const direction = Math.floor(Math.random() * 4);
    let dx = 0, dz = 0;
    
    switch (direction) {
      case 0: dx = 1; break;  // East
      case 1: dx = -1; break; // West
      case 2: dz = 1; break;  // South
      case 3: dz = -1; break; // North
    }
    
    // Place the tree trunk
    for (let i = 0; i < length; i++) {
      this.setBlock(blockSetter, x + dx * i, y, z + dz * i, { type: 'wood', metadata: variant === 'oak' ? 0 : (variant === 'birch' ? 1 : 2) });
      
      // Add some mushrooms or moss on the log
      if (Math.random() < 0.3) {
        const blockType = Math.random() < 0.5 ? 'red_mushroom' : 'brown_mushroom';
        this.setBlock(blockSetter, x + dx * i, y + 1, z + dz * i, { type: blockType });
      }
    }
    
    return {
      type: 'fallen_tree',
      position: { x, y, z },
      size: { width: dx * length, height: 1, depth: dz * length }
    };
  }
  
  /**
   * Generate a desert pyramid
   * @param {Object} position - Position to generate the pyramid
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateDesertPyramid(position, options, blockSetter) {
    const { x, y, z } = position;
    
    // Size of the pyramid
    const size = 8; // Size from center to edge
    
    // Generate the pyramid layers
    for (let layer = 0; layer < size; layer++) {
      const layerSize = size - layer;
      
      // Generate a square layer
      for (let dx = -layerSize; dx <= layerSize; dx++) {
        for (let dz = -layerSize; dz <= layerSize; dz++) {
          // For the bottom layer, use a mix of sandstone types
          if (layer === 0) {
            const blockType = Math.random() < 0.7 ? 'sandstone' : 
              (Math.random() < 0.5 ? 'cut_sandstone' : 'chiseled_sandstone');
            this.setBlock(blockSetter, x + dx, y + layer, z + dz, { type: blockType });
          }
          // For upper layers, only fill if it's the edge or inside
          else if (Math.abs(dx) === layerSize || Math.abs(dz) === layerSize) {
            const blockType = Math.random() < 0.8 ? 'sandstone' : 'cut_sandstone';
            this.setBlock(blockSetter, x + dx, y + layer, z + dz, { type: blockType });
          }
        }
      }
    }
    
    // Create an entrance (on a random side)
    const entranceSide = Math.floor(Math.random() * 4);
    let entranceX = x, entranceZ = z;
    
    switch (entranceSide) {
      case 0: entranceX = x + size - 1; break; // East
      case 1: entranceX = x - size + 1; break; // West
      case 2: entranceZ = z + size - 1; break; // South
      case 3: entranceZ = z - size + 1; break; // North
    }
    
    // Create a doorway
    this.setBlock(blockSetter, entranceX, y + 1, entranceZ, { type: 'air' });
    this.setBlock(blockSetter, entranceX, y + 2, entranceZ, { type: 'air' });
    
    // Add some decoration
    if (entranceSide === 0 || entranceSide === 1) {
      // East/West entrance, add blocks to the north and south of door
      this.setBlock(blockSetter, entranceX, y + 3, entranceZ - 1, { type: 'chiseled_sandstone' });
      this.setBlock(blockSetter, entranceX, y + 3, entranceZ + 1, { type: 'chiseled_sandstone' });
    } else {
      // North/South entrance, add blocks to the east and west of door
      this.setBlock(blockSetter, entranceX - 1, y + 3, entranceZ, { type: 'chiseled_sandstone' });
      this.setBlock(blockSetter, entranceX + 1, y + 3, entranceZ, { type: 'chiseled_sandstone' });
    }
    
    // Add a hidden chamber inside
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        this.setBlock(blockSetter, x + dx, y + 1, z + dz, { type: 'air' });
        this.setBlock(blockSetter, x + dx, y + 2, z + dz, { type: 'air' });
      }
    }
    
    // Add a chest with loot
    this.setBlock(blockSetter, x, y + 1, z, { type: 'chest', metadata: { loot: 'desert_pyramid' } });
    
    // Add some decoration inside
    this.setBlock(blockSetter, x - 2, y + 1, z - 2, { type: 'sandstone_stairs', metadata: 0 });
    this.setBlock(blockSetter, x + 2, y + 1, z - 2, { type: 'sandstone_stairs', metadata: 1 });
    this.setBlock(blockSetter, x - 2, y + 1, z + 2, { type: 'sandstone_stairs', metadata: 2 });
    this.setBlock(blockSetter, x + 2, y + 1, z + 2, { type: 'sandstone_stairs', metadata: 3 });
    
    return {
      type: 'desert_pyramid',
      position: { x, y, z },
      size: { width: size * 2 + 1, height: size, depth: size * 2 + 1 }
    };
  }
  
  /**
   * Generate a small ruined structure
   * @param {Object} position - Position to generate the ruin
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateSmallRuin(position, options, blockSetter) {
    const { x, y, z } = position;
    const { material = 'cobblestone', ruinLevel = 0.5 } = options;
    
    // Size of the ruin
    const width = 5 + Math.floor(Math.random() * 3);
    const depth = 5 + Math.floor(Math.random() * 3);
    const height = 3 + Math.floor(Math.random() * 2);
    
    // Generate the foundation
    for (let dx = -width; dx <= width; dx++) {
      for (let dz = -depth; dz <= depth; dz++) {
        if (Math.random() > ruinLevel * 0.5) { // Foundation is more intact
          this.setBlock(blockSetter, x + dx, y, z + dz, { type: material });
        }
      }
    }
    
    // Generate walls
    for (let dy = 1; dy < height; dy++) {
      for (let dx = -width; dx <= width; dx++) {
        for (let dz = -depth; dz <= depth; dz++) {
          // Only build walls, not the inside
          if (dx === -width || dx === width || dz === -depth || dz === depth) {
            // Add randomness for ruin effect
            if (Math.random() > ruinLevel * dy / height) { // Higher parts are more ruined
              this.setBlock(blockSetter, x + dx, y + dy, z + dz, { type: material });
            }
          }
        }
      }
    }
    
    // Add a doorway
    const doorSide = Math.floor(Math.random() * 4);
    let doorX = x, doorZ = z;
    
    switch (doorSide) {
      case 0: doorX = x + width; doorZ = z; break;
      case 1: doorX = x - width; doorZ = z; break;
      case 2: doorX = x; doorZ = z + depth; break;
      case 3: doorX = x; doorZ = z - depth; break;
    }
    
    // Create a doorway
    this.setBlock(blockSetter, doorX, y + 1, doorZ, { type: 'air' });
    this.setBlock(blockSetter, doorX, y + 2, doorZ, { type: 'air' });
    
    // Add some windows
    for (let i = 0; i < 4; i++) {
      const windowSide = Math.floor(Math.random() * 4);
      let windowX = x, windowZ = z;
      
      switch (windowSide) {
        case 0: windowX = x + width; windowZ = z + Math.floor(Math.random() * depth) - Math.floor(depth/2); break;
        case 1: windowX = x - width; windowZ = z + Math.floor(Math.random() * depth) - Math.floor(depth/2); break;
        case 2: windowX = x + Math.floor(Math.random() * width) - Math.floor(width/2); windowZ = z + depth; break;
        case 3: windowX = x + Math.floor(Math.random() * width) - Math.floor(width/2); windowZ = z - depth; break;
      }
      
      // Create a window if not on the door side
      if (!(windowX === doorX && windowZ === doorZ)) {
        this.setBlock(blockSetter, windowX, y + 2, windowZ, { type: 'air' });
      }
    }
    
    // Add some debris inside
    for (let i = 0; i < 5; i++) {
      const debrisX = x + Math.floor(Math.random() * (width*2-1)) - (width-1);
      const debrisZ = z + Math.floor(Math.random() * (depth*2-1)) - (depth-1);
      
      if (Math.random() < 0.7) {
        this.setBlock(blockSetter, debrisX, y + 1, debrisZ, { type: material });
      } else {
        // Sometimes add a different block type for variety
        const debrisType = Math.random() < 0.5 ? 'mossy_cobblestone' : 'cracked_stone_bricks';
        this.setBlock(blockSetter, debrisX, y + 1, debrisZ, { type: debrisType });
      }
    }
    
    return {
      type: 'small_ruin',
      position: { x, y, z },
      size: { width: width * 2 + 1, height, depth: depth * 2 + 1 }
    };
  }
  
  /**
   * Generate a witch hut
   * @param {Object} position - Position to generate the hut
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateWitchHut(position, options, blockSetter) {
    const { x, y, z } = position;
    
    // Size of the hut
    const width = 4;
    const depth = 4;
    const height = 5;
    
    // Generate the platform (stilts in swamp)
    for (let dx = -width; dx <= width; dx++) {
      for (let dz = -depth; dz <= depth; dz++) {
        // Floor
        this.setBlock(blockSetter, x + dx, y, z + dz, { type: 'oak_planks' });
        
        // Stilts
        if ((Math.abs(dx) === width && Math.abs(dz) === depth) ||
            (Math.abs(dx) === width-2 && Math.abs(dz) === depth-2)) {
          for (let dy = -3; dy < 0; dy++) {
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, { type: 'oak_log' });
          }
        }
      }
    }
    
    // Generate walls
    for (let dy = 1; dy < height - 1; dy++) {
      for (let dx = -width; dx <= width; dx++) {
        for (let dz = -depth; dz <= depth; dz++) {
          // Only build walls, not the inside
          if (dx === -width || dx === width || dz === -depth || dz === depth) {
            // Wall
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, { type: 'oak_planks' });
          }
        }
      }
    }
    
    // Generate roof
    for (let dx = -width-1; dx <= width+1; dx++) {
      for (let dz = -depth-1; dz <= depth+1; dz++) {
        this.setBlock(blockSetter, x + dx, y + height - 1, z + dz, { type: 'spruce_planks' });
      }
    }
    
    // Add pointy witch hat roof
    for (let dy = 0; dy < 3; dy++) {
      const roofSize = width - dy;
      for (let dx = -roofSize; dx <= roofSize; dx++) {
        for (let dz = -roofSize; dz <= roofSize; dz++) {
          if (dy < 2 || (Math.abs(dx) < 2 && Math.abs(dz) < 2)) {
            this.setBlock(blockSetter, x + dx, y + height - 1 + dy, z + dz, { type: 'spruce_planks' });
          }
        }
      }
    }
    
    // Add a doorway
    const doorSide = Math.floor(Math.random() * 4);
    let doorX = x, doorZ = z;
    
    switch (doorSide) {
      case 0: doorX = x + width; break;
      case 1: doorX = x - width; break;
      case 2: doorZ = z + depth; break;
      case 3: doorZ = z - depth; break;
    }
    
    // Create a doorway
    this.setBlock(blockSetter, doorX, y + 1, doorZ, { type: 'air' });
    this.setBlock(blockSetter, doorX, y + 2, doorZ, { type: 'air' });
    
    // Add windows
    for (let i = 0; i < 2; i++) {
      const windowSide = (doorSide + 1 + i) % 4;
      let windowX = x, windowZ = z;
      
      switch (windowSide) {
        case 0: windowX = x + width; break;
        case 1: windowX = x - width; break;
        case 2: windowZ = z + depth; break;
        case 3: windowZ = z - depth; break;
      }
      
      // Add window
      this.setBlock(blockSetter, windowX, y + 2, windowZ, { type: 'glass_pane' });
    }
    
    // Add witch-themed decoration
    this.setBlock(blockSetter, x, y + 1, z, { type: 'cauldron' });
    this.setBlock(blockSetter, x - 1, y + 1, z - 1, { type: 'crafting_table' });
    this.setBlock(blockSetter, x + 1, y + 1, z - 1, { type: 'bookshelf' });
    
    // Add a black cat (as metadata to be processed by the world generator)
    this.setBlock(blockSetter, x - 1, y + 1, z + 1, { type: 'air', metadata: { mobSpawn: 'black_cat' } });
    
    return {
      type: 'witch_hut',
      position: { x, y, z },
      size: { width: width * 2 + 3, height: height + 3, depth: depth * 2 + 3 }
    };
  }
  
  /**
   * Generate a village at the specified position
   * @param {Object} position - Position to generate the village
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateVillage(position, options, blockSetter) {
    const { x, y, z } = position;
    const biomeType = options.biome || 'plains';
    
    // Use the village generator to create a village
    const entitySpawner = (type, pos, entityOptions) => {
      // Use the entity spawner if available, otherwise just return the data
      if (this.entitySpawner) {
        return this.entitySpawner(type, pos, entityOptions);
      }
      
      // Fallback return entity data only
      return {
        type,
        position: pos,
        ...entityOptions
      };
    };
    
    const village = this.villageGenerator.generateVillage(
      position,
      biomeType,
      blockSetter,
      entitySpawner
    );
    
    // Return village data
    return {
      type: 'village',
      id: village.id,
      position: { x, y, z },
      size: { 
        width: 64, // Approximate village size
        height: 8, 
        depth: 64 
      },
      biome: biomeType,
      buildings: village.buildings.length,
      villagers: village.villagers.length,
      data: village // Include full village data
    };
  }
  
  /**
   * Generate a stronghold structure
   * @param {Object} position - Position to generate the stronghold
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateStronghold(position, options, blockSetter) {
    const { x, y, z } = position;
    
    // Adjust position to be underground
    const strongholdY = Math.min(y - 10, 30);
    
    // Main building materials
    const primaryMaterial = { type: 'stone_bricks' };
    const crackedMaterial = { type: 'cracked_stone_bricks' };
    const mossyMaterial = { type: 'mossy_stone_bricks' };
    const accentMaterial = { type: 'chiseled_stone_bricks' };
    const secondaryMaterial = { type: 'cobblestone' };
    const floorMaterial = { type: 'stone_brick_slab' };
    const lightMaterial = { type: 'torch' };
    
    // Dimensions of the stronghold
    const width = 24;
    const height = 12;
    const depth = 24;
    
    // Track the rooms that have been created
    const rooms = [];
    
    // Generate the main structure
    this.generateStrongholdEntrance(x, strongholdY, z, primaryMaterial, secondaryMaterial, blockSetter);
    rooms.push({
      type: 'entrance',
      x, y: strongholdY, z,
      width: 5, height: 5, depth: 5
    });
    
    // Generate corridors connecting entrance to other rooms
    const corridorLength = 8;
    const mainCorridorEnd = {
      x: x, y: strongholdY, z: z + corridorLength
    };
    
    this.generateStrongholdCorridor(
      x, strongholdY, z,
      mainCorridorEnd.x, mainCorridorEnd.y, mainCorridorEnd.z,
      primaryMaterial, floorMaterial, lightMaterial, blockSetter
    );
    
    rooms.push({
      type: 'corridor',
      x, y: strongholdY, z,
      endX: mainCorridorEnd.x, endY: mainCorridorEnd.y, endZ: mainCorridorEnd.z
    });
    
    // Generate a small room with a staircase leading down
    const stairsRoomX = mainCorridorEnd.x;
    const stairsRoomY = mainCorridorEnd.y;
    const stairsRoomZ = mainCorridorEnd.z + 3;
    
    this.generateStrongholdStairsRoom(
      stairsRoomX, stairsRoomY, stairsRoomZ,
      primaryMaterial, crackedMaterial, mossyMaterial, secondaryMaterial, lightMaterial,
      blockSetter
    );
    
    rooms.push({
      type: 'stairs_room',
      x: stairsRoomX, y: stairsRoomY, z: stairsRoomZ,
      width: 7, height: 6, depth: 7
    });
    
    // Generate a corridor from stairs to library
    const lowerLevel = stairsRoomY - 5;
    const libraryCorridorStart = {
      x: stairsRoomX + 5, y: lowerLevel, z: stairsRoomZ
    };
    
    const libraryCorridorEnd = {
      x: libraryCorridorStart.x + 8, y: lowerLevel, z: libraryCorridorStart.z
    };
    
    this.generateStrongholdCorridor(
      libraryCorridorStart.x, libraryCorridorStart.y, libraryCorridorStart.z,
      libraryCorridorEnd.x, libraryCorridorEnd.y, libraryCorridorEnd.z,
      primaryMaterial, floorMaterial, lightMaterial, blockSetter
    );
    
    rooms.push({
      type: 'corridor',
      x: libraryCorridorStart.x, y: libraryCorridorStart.y, z: libraryCorridorStart.z,
      endX: libraryCorridorEnd.x, endY: libraryCorridorEnd.y, endZ: libraryCorridorEnd.z
    });
    
    // Generate a library room
    const libraryX = libraryCorridorEnd.x + 6;
    const libraryY = lowerLevel;
    const libraryZ = libraryCorridorEnd.z;
    
    this.generateStrongholdLibrary(
      libraryX, libraryY, libraryZ,
      primaryMaterial, crackedMaterial, mossyMaterial, accentMaterial, secondaryMaterial, lightMaterial,
      blockSetter
    );
    
    rooms.push({
      type: 'library',
      x: libraryX, y: libraryY, z: libraryZ,
      width: 11, height: 7, depth: 9
    });
    
    // Generate a corridor from stairs to portal room
    const portalCorridorStart = {
      x: stairsRoomX, y: lowerLevel, z: stairsRoomZ + 5
    };
    
    const portalCorridorEnd = {
      x: portalCorridorStart.x, y: lowerLevel, z: portalCorridorStart.z + 8
    };
    
    this.generateStrongholdCorridor(
      portalCorridorStart.x, portalCorridorStart.y, portalCorridorStart.z,
      portalCorridorEnd.x, portalCorridorEnd.y, portalCorridorEnd.z,
      primaryMaterial, floorMaterial, lightMaterial, blockSetter
    );
    
    rooms.push({
      type: 'corridor',
      x: portalCorridorStart.x, y: portalCorridorStart.y, z: portalCorridorStart.z,
      endX: portalCorridorEnd.x, endY: portalCorridorEnd.y, endZ: portalCorridorEnd.z
    });
    
    // Generate the portal room
    const portalRoomX = portalCorridorEnd.x;
    const portalRoomY = lowerLevel;
    const portalRoomZ = portalCorridorEnd.z + 6;
    
    this.generateStrongholdPortalRoom(
      portalRoomX, portalRoomY, portalRoomZ,
      primaryMaterial, accentMaterial, secondaryMaterial, lightMaterial,
      blockSetter
    );
    
    rooms.push({
      type: 'portal_room',
      x: portalRoomX, y: portalRoomY, z: portalRoomZ,
      width: 11, height: 7, depth: 11
    });
    
    // Optionally spawn silverfish in the stronghold
    if (this.entitySpawner) {
      // Spawn a few silverfish in hidden blocks
      for (let i = 0; i < 3; i++) {
        // Choose a random room
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        
        // Random position in the room
        const silverfishX = room.x + (Math.random() * 3) - 1;
        const silverfishY = room.y + 1;
        const silverfishZ = room.z + (Math.random() * 3) - 1;
        
        // Hidden silverfish in infested block
        this.setBlock(blockSetter, silverfishX, silverfishY, silverfishZ, { type: 'infested_stone_bricks' });
        
        // Spawn an active silverfish occasionally
        if (Math.random() < 0.3) {
          this.entitySpawner({
            type: 'silverfish',
            position: { x: silverfishX, y: silverfishY + 1, z: silverfishZ }
          });
        }
      }
    }
    
    return {
      type: 'stronghold',
      position: { x, y: strongholdY, z },
      size: { width, height, depth },
      significantStructure: true,
      rooms
    };
  }
  
  /**
   * Generate the entrance to a stronghold
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} primaryMaterial - Primary building material
   * @param {Object} secondaryMaterial - Secondary building material
   * @param {Function} blockSetter - Function to set blocks
   */
  generateStrongholdEntrance(x, y, z, primaryMaterial, secondaryMaterial, blockSetter) {
    // Create a 5x5x5 entrance chamber
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = 0; dy <= 4; dy++) {
        for (let dz = -2; dz <= 2; dz++) {
          // If it's a wall, ceiling, or floor block
          if (Math.abs(dx) === 2 || Math.abs(dz) === 2 || dy === 0 || dy === 4) {
            // Use some variation in the materials
            const material = Math.random() < 0.8 ? primaryMaterial : secondaryMaterial;
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, material);
          } else {
            // Interior is air
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, { type: 'air' });
          }
        }
      }
    }
    
    // Create a doorway to the south
    this.setBlock(blockSetter, x, y + 1, z + 2, { type: 'air' });
    this.setBlock(blockSetter, x, y + 2, z + 2, { type: 'air' });
    
    // Add some light
    this.setBlock(blockSetter, x - 1, y + 2, z - 1, { type: 'torch', metadata: { facing: 'up' } });
    this.setBlock(blockSetter, x + 1, y + 2, z - 1, { type: 'torch', metadata: { facing: 'up' } });
  }
  
  /**
   * Generate a corridor in a stronghold
   * @private
   * @param {number} startX - Start X coordinate
   * @param {number} startY - Start Y coordinate
   * @param {number} startZ - Start Z coordinate
   * @param {number} endX - End X coordinate
   * @param {number} endY - End Y coordinate
   * @param {number} endZ - End Z coordinate
   * @param {Object} wallMaterial - Wall material
   * @param {Object} floorMaterial - Floor material
   * @param {Object} lightMaterial - Light material
   * @param {Function} blockSetter - Function to set blocks
   */
  generateStrongholdCorridor(startX, startY, startZ, endX, endY, endZ, wallMaterial, floorMaterial, lightMaterial, blockSetter) {
    // Determine corridor direction
    const isHorizontal = startZ === endZ;
    
    // Corridor dimensions
    const corridorLength = isHorizontal 
      ? Math.abs(endX - startX) 
      : Math.abs(endZ - startZ);
    
    // Direction multipliers
    const xStep = isHorizontal ? (endX > startX ? 1 : -1) : 0;
    const zStep = !isHorizontal ? (endZ > startZ ? 1 : -1) : 0;
    
    // Build the corridor
    for (let i = 0; i <= corridorLength; i++) {
      const currX = startX + (i * xStep);
      const currZ = startZ + (i * zStep);
      
      // Create a 3x3 corridor segment
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = 0; dy <= 2; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            // Skip corners for a better look
            if ((Math.abs(dx) === 1 && Math.abs(dz) === 1)) {
              continue;
            }
            
            // If it's a wall, ceiling, or floor
            if (Math.abs(dx) === 1 || Math.abs(dz) === 1 || dy === 0 || dy === 2) {
              // Floor might be different material
              if (dy === 0) {
                this.setBlock(blockSetter, currX + dx, startY + dy, currZ + dz, floorMaterial);
              } else {
                this.setBlock(blockSetter, currX + dx, startY + dy, currZ + dz, wallMaterial);
              }
            } else {
              // Interior is air
              this.setBlock(blockSetter, currX + dx, startY + dy, currZ + dz, { type: 'air' });
            }
          }
        }
      }
      
      // Add occasional lighting
      if (i % 5 === 0 && i > 0 && i < corridorLength) {
        if (isHorizontal) {
          this.setBlock(blockSetter, currX, startY + 2, currZ + 1, { type: 'torch', metadata: { facing: 'south' } });
        } else {
          this.setBlock(blockSetter, currX + 1, startY + 2, currZ, { type: 'torch', metadata: { facing: 'east' } });
        }
      }
    }
  }
  
  /**
   * Generate a stairs room in a stronghold
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} primaryMaterial - Primary building material
   * @param {Object} crackedMaterial - Cracked version of primary material
   * @param {Object} mossyMaterial - Mossy version of primary material
   * @param {Object} secondaryMaterial - Secondary building material
   * @param {Object} lightMaterial - Light material
   * @param {Function} blockSetter - Function to set blocks
   */
  generateStrongholdStairsRoom(x, y, z, primaryMaterial, crackedMaterial, mossyMaterial, secondaryMaterial, lightMaterial, blockSetter) {
    // Create a 7x6x7 room
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = 0; dy <= 5; dy++) {
        for (let dz = -3; dz <= 3; dz++) {
          // If it's a wall, ceiling, or floor
          if (Math.abs(dx) === 3 || Math.abs(dz) === 3 || dy === 0 || dy === 5) {
            // Use some variation in the materials for worn look
            let material = primaryMaterial;
            const rand = Math.random();
            if (rand < 0.15) {
              material = crackedMaterial;
            } else if (rand < 0.25) {
              material = mossyMaterial;
            }
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, material);
          } else {
            // Interior is air unless it's part of the stairs
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, { type: 'air' });
          }
        }
      }
    }
    
    // Create doorways
    // North doorway
    this.setBlock(blockSetter, x, y + 1, z - 3, { type: 'air' });
    this.setBlock(blockSetter, x, y + 2, z - 3, { type: 'air' });
    // East doorway
    this.setBlock(blockSetter, x + 3, y + 1, z, { type: 'air' });
    this.setBlock(blockSetter, x + 3, y + 2, z, { type: 'air' });
    // South doorway
    this.setBlock(blockSetter, x, y + 1, z + 3, { type: 'air' });
    this.setBlock(blockSetter, x, y + 2, z + 3, { type: 'air' });
    
    // Create stairs going down to the lower level
    // 5-step staircase going down to the west
    for (let i = 0; i < 5; i++) {
      this.setBlock(blockSetter, x - i, y - i, z, { type: 'stone_brick_stairs', metadata: { facing: 'west' } });
      
      // Clear air above stairs
      this.setBlock(blockSetter, x - i, y + 1 - i, z, { type: 'air' });
      this.setBlock(blockSetter, x - i, y + 2 - i, z, { type: 'air' });
      
      // Support under stairs
      for (let j = 1; j <= i; j++) {
        this.setBlock(blockSetter, x - i, y - j, z, primaryMaterial);
      }
    }
    
    // Add lighting
    this.setBlock(blockSetter, x + 2, y + 3, z + 2, { type: 'torch', metadata: { facing: 'up' } });
    this.setBlock(blockSetter, x - 2, y + 3, z + 2, { type: 'torch', metadata: { facing: 'up' } });
    this.setBlock(blockSetter, x + 2, y + 3, z - 2, { type: 'torch', metadata: { facing: 'up' } });
    
    // Add some decoration
    this.setBlock(blockSetter, x + 2, y + 1, z + 2, secondaryMaterial);
    this.setBlock(blockSetter, x - 2, y + 1, z + 2, secondaryMaterial);
    this.setBlock(blockSetter, x + 2, y + 1, z - 2, secondaryMaterial);
  }
  
  /**
   * Generate a library room in a stronghold
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} primaryMaterial - Primary building material
   * @param {Object} crackedMaterial - Cracked version of primary material
   * @param {Object} mossyMaterial - Mossy version of primary material
   * @param {Object} accentMaterial - Accent building material
   * @param {Object} secondaryMaterial - Secondary building material
   * @param {Object} lightMaterial - Light material
   * @param {Function} blockSetter - Function to set blocks
   */
  generateStrongholdLibrary(x, y, z, primaryMaterial, crackedMaterial, mossyMaterial, accentMaterial, secondaryMaterial, lightMaterial, blockSetter) {
    // Create a 11x7x9 library
    for (let dx = -5; dx <= 5; dx++) {
      for (let dy = 0; dy <= 6; dy++) {
        for (let dz = -4; dz <= 4; dz++) {
          // If it's a wall, ceiling, or floor
          if (Math.abs(dx) === 5 || Math.abs(dz) === 4 || dy === 0 || dy === 6) {
            // Use some variation in the materials for worn look
            let material = primaryMaterial;
            const rand = Math.random();
            if (rand < 0.15) {
              material = crackedMaterial;
            } else if (rand < 0.25) {
              material = mossyMaterial;
            }
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, material);
          } else {
            // Interior is air (will add bookshelves separately)
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, { type: 'air' });
          }
        }
      }
    }
    
    // Create entrance doorway
    this.setBlock(blockSetter, x - 5, y + 1, z, { type: 'air' });
    this.setBlock(blockSetter, x - 5, y + 2, z, { type: 'air' });
    
    // Add bookshelves along the walls
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = 1; dy <= 3; dy++) {
        // Skip the entrance area
        if (dx === -4 && Math.abs(dy - 1.5) < 1 && Math.abs(z) < 1) continue;
        
        // North and south walls
        if (Math.abs(dx) !== 4 && !(dx === 0 && dy === 1)) { // Leave space for a table
          this.setBlock(blockSetter, x + dx, y + dy, z - 3, { type: 'bookshelf' });
          this.setBlock(blockSetter, x + dx, y + dy, z + 3, { type: 'bookshelf' });
        }
      }
    }
    
    // Add bookshelves along the east wall
    for (let dz = -2; dz <= 2; dz++) {
      for (let dy = 1; dy <= 3; dy++) {
        this.setBlock(blockSetter, x + 4, y + dy, z + dz, { type: 'bookshelf' });
      }
    }
    
    // Add a large table in the center
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        this.setBlock(blockSetter, x + dx, y + 1, z + dz, { type: 'oak_planks' });
      }
    }
    
    // Add lighting
    this.setBlock(blockSetter, x - 3, y + 4, z, { type: 'torch', metadata: { facing: 'up' } });
    this.setBlock(blockSetter, x, y + 4, z, { type: 'torch', metadata: { facing: 'up' } });
    this.setBlock(blockSetter, x + 3, y + 4, z, { type: 'torch', metadata: { facing: 'up' } });
    
    // Add chests with loot
    this.setBlock(blockSetter, x + 3, y + 1, z, { type: 'chest', metadata: { loot: 'stronghold_library' } });
    
    // Add some decoration - lectern with book
    this.setBlock(blockSetter, x, y + 2, z, { type: 'lectern', metadata: { has_book: true } });
    
    // Add some cobwebs in the corners for atmosphere
    this.setBlock(blockSetter, x - 4, y + 5, z - 3, { type: 'cobweb' });
    this.setBlock(blockSetter, x + 4, y + 5, z + 3, { type: 'cobweb' });
  }
  
  /**
   * Generate a portal room in a stronghold
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} primaryMaterial - Primary building material
   * @param {Object} accentMaterial - Accent building material
   * @param {Object} secondaryMaterial - Secondary building material
   * @param {Object} lightMaterial - Light material
   * @param {Function} blockSetter - Function to set blocks
   */
  generateStrongholdPortalRoom(x, y, z, primaryMaterial, accentMaterial, secondaryMaterial, lightMaterial, blockSetter) {
    // Create a 11x7x11 circular portal room
    const radius = 5;
    const height = 6;
    
    // Create the circular room
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = 0; dy <= height; dy++) {
        for (let dz = -radius; dz <= radius; dz++) {
          // Calculate distance from center
          const distance = Math.sqrt(dx*dx + dz*dz);
          
          // If it's within the circle (wall), or floor/ceiling
          if (distance <= radius + 0.5 && (distance >= radius - 0.5 || dy === 0 || dy === height)) {
            // Use accent material for floor and ceiling center
            if ((dy === 0 || dy === height) && distance < 3) {
              this.setBlock(blockSetter, x + dx, y + dy, z + dz, accentMaterial);
            } else {
              this.setBlock(blockSetter, x + dx, y + dy, z + dz, primaryMaterial);
            }
          } else if (distance < radius - 0.5) {
            // Interior is air
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, { type: 'air' });
          }
        }
      }
    }
    
    // Create entrance doorway
    this.setBlock(blockSetter, x, y + 1, z - radius, { type: 'air' });
    this.setBlock(blockSetter, x, y + 2, z - radius, { type: 'air' });
    
    // Create the end portal frame
    this.generateEndPortal(x, y + 1, z + 1, blockSetter);
    
    // Add lighting around the portal frame
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;
      const lightX = Math.round(x + Math.cos(angle) * 3.5);
      const lightZ = Math.round(z + 1 + Math.sin(angle) * 3.5);
      
      this.setBlock(blockSetter, lightX, y + 1, lightZ, secondaryMaterial);
      this.setBlock(blockSetter, lightX, y + 2, lightZ, { type: 'torch', metadata: { facing: 'up' } });
    }
    
    // Add lava under the portal for effect
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue; // Skip center, we'll put the silverfish spawner there
        this.setBlock(blockSetter, x + dx, y, z + 1 + dz, { type: 'lava' });
      }
    }
    
    // Place silverfish spawner in the center under the portal
    this.setBlock(blockSetter, x, y, z + 1, { type: 'monster_spawner', metadata: { entity_type: 'silverfish' } });
  }
  
  /**
   * Generate an end portal frame
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Function} blockSetter - Function to set blocks
   */
  generateEndPortal(x, y, z, blockSetter) {
    // Create a 5x5 platform for the portal
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        // If it's the outer frame, put end portal frame blocks
        if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
          // Calculate the facing direction based on position
          let facing = 0;
          if (dx === 2) facing = 1; // East
          if (dz === 2) facing = 2; // South
          if (dx === -2) facing = 3; // West
          if (dz === -2) facing = 0; // North
          
          // Some frames have eyes, some don't
          // For demo purposes, leave them all without eyes so player can activate
          const hasEye = false;
          
          this.setBlock(blockSetter, x + dx, y, z + dz, { 
            type: 'end_portal_frame', 
            metadata: { 
              facing, 
              hasEye
            } 
          });
        }
      }
    }
  }
  
  /**
   * Generate a mineshaft structure
   * @param {Object} position - Position to generate the mineshaft
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateMineshaft(position, options, blockSetter) {
    const { x, y, z } = position;
    
    // Adjust position to be underground
    const mineshaftY = Math.min(y, 40); // Mineshafts typically generate underground
    
    // Main building materials
    const primaryMaterial = { type: 'oak_planks' };
    const supportMaterial = { type: 'fence' };
    const railMaterial = { type: 'rail' };
    const torchMaterial = { type: 'torch', metadata: { facing: 'up' } };
    const webMaterial = { type: 'cobweb' };
    
    // Mineshaft size parameters
    const mainCorridorLength = 24 + Math.floor(Math.random() * 12); // 24-36 blocks
    const numBranches = 2 + Math.floor(Math.random() * 3); // 2-4 branches
    const branchMinLength = 8;
    const branchMaxLength = 16;
    
    // Track all tunnel segments for later reference
    const tunnels = [];
    
    // Generate main corridor along z-axis
    this.generateMineshaftCorridor(
      x, mineshaftY, z,
      x, mineshaftY, z + mainCorridorLength,
      primaryMaterial, supportMaterial, railMaterial, torchMaterial,
      blockSetter
    );
    
    tunnels.push({
      startX: x, startY: mineshaftY, startZ: z,
      endX: x, endY: mineshaftY, endZ: z + mainCorridorLength
    });
    
    // Generate branches from main corridor
    const branchPositions = [];
    
    for (let i = 0; i < numBranches; i++) {
      // Choose a position along the main corridor for the branch
      const branchZ = z + 4 + Math.floor(Math.random() * (mainCorridorLength - 8));
      const branchX = x;
      const branchY = mineshaftY;
      
      // Random branch direction (east or west)
      const direction = Math.random() < 0.5 ? -1 : 1;
      const branchLength = branchMinLength + Math.floor(Math.random() * (branchMaxLength - branchMinLength));
      
      // Generate the branch corridor
      this.generateMineshaftCorridor(
        branchX, branchY, branchZ,
        branchX + (direction * branchLength), branchY, branchZ,
        primaryMaterial, supportMaterial, railMaterial, torchMaterial,
        blockSetter
      );
      
      tunnels.push({
        startX: branchX, startY: branchY, startZ: branchZ,
        endX: branchX + (direction * branchLength), endY: branchY, endZ: branchZ
      });
      
      branchPositions.push({
        x: branchX, y: branchY, z: branchZ,
        direction, length: branchLength
      });
    }
    
    // Add some special features along the corridors
    this.addMineshaftFeatures(tunnels, primaryMaterial, supportMaterial, webMaterial, blockSetter);
    
    // Create an intersection room if we have enough space in the main corridor
    if (mainCorridorLength >= 16) {
      const intersectionZ = z + Math.floor(mainCorridorLength / 2);
      this.generateMineshaftIntersection(
        x, mineshaftY, intersectionZ,
        primaryMaterial, supportMaterial, torchMaterial,
        blockSetter
      );
    }
    
    // Add a minecart with chest at the end of the main corridor or one of the branches
    if (Math.random() < 0.7) {
      // End of main corridor
      this.generateMineshaftChest(x, mineshaftY, z + mainCorridorLength - 1, blockSetter);
    } else {
      // End of a random branch
      const randomBranch = branchPositions[Math.floor(Math.random() * branchPositions.length)];
      const chestX = randomBranch.x + (randomBranch.direction * (randomBranch.length - 1));
      this.generateMineshaftChest(chestX, randomBranch.y, randomBranch.z, blockSetter);
    }
    
    // Occasionally add a spawner room
    if (Math.random() < 0.3) {
      // Choose a random position along one of the tunnels
      const randomTunnelIndex = Math.floor(Math.random() * tunnels.length);
      const tunnel = tunnels[randomTunnelIndex];
      
      let spawnerX, spawnerZ;
      
      // Horizontal tunnel along z-axis
      if (tunnel.startX === tunnel.endX) {
        spawnerX = tunnel.startX;
        spawnerZ = tunnel.startZ + Math.floor(Math.random() * (tunnel.endZ - tunnel.startZ));
      } else {
        // Horizontal tunnel along x-axis
        spawnerX = tunnel.startX + Math.floor(Math.random() * (tunnel.endX - tunnel.startX));
        spawnerZ = tunnel.startZ;
      }
      
      this.generateSpawnerRoom(
        spawnerX, tunnel.startY, spawnerZ,
        primaryMaterial, supportMaterial, webMaterial,
        blockSetter
      );
    }
    
    return {
      type: 'mineshaft',
      position: { x, y: mineshaftY, z },
      size: { 
        width: mainCorridorLength, 
        height: 4, 
        depth: mainCorridorLength
      },
      tunnels
    };
  }
  
  /**
   * Generate a mineshaft corridor
   * @private
   * @param {number} startX - Start X coordinate
   * @param {number} startY - Start Y coordinate
   * @param {number} startZ - Start Z coordinate
   * @param {number} endX - End X coordinate
   * @param {number} endY - End Y coordinate
   * @param {number} endZ - End Z coordinate
   * @param {Object} floorMaterial - Material for the floor
   * @param {Object} supportMaterial - Material for supports
   * @param {Object} railMaterial - Material for rails
   * @param {Object} lightMaterial - Material for lighting
   * @param {Function} blockSetter - Function to set blocks
   */
  generateMineshaftCorridor(startX, startY, startZ, endX, endY, endZ, floorMaterial, supportMaterial, railMaterial, lightMaterial, blockSetter) {
    // Determine corridor direction and length
    const isXDirection = startZ === endZ;
    const length = isXDirection 
      ? Math.abs(endX - startX) 
      : Math.abs(endZ - startZ);
    
    // Direction multipliers
    const xStep = isXDirection ? (endX > startX ? 1 : -1) : 0;
    const zStep = !isXDirection ? (endZ > startZ ? 1 : -1) : 0;
    
    // Generate the corridor
    for (let i = 0; i <= length; i++) {
      const currX = startX + (i * xStep);
      const currZ = startZ + (i * zStep);
      
      // Clear a 3x3 area for the corridor
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = 0; dy <= 2; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            this.setBlock(blockSetter, currX + dx, startY + dy, currZ + dz, { type: 'air' });
          }
        }
      }
      
      // Place oak plank floor
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          this.setBlock(blockSetter, currX + dx, startY - 1, currZ + dz, floorMaterial);
        }
      }
      
      // Place support beams every 4 blocks
      if (i % 4 === 0) {
        // Vertical support posts
        this.setBlock(blockSetter, currX - 1, startY, currZ - 1, supportMaterial);
        this.setBlock(blockSetter, currX + 1, startY, currZ - 1, supportMaterial);
        this.setBlock(blockSetter, currX - 1, startY, currZ + 1, supportMaterial);
        this.setBlock(blockSetter, currX + 1, startY, currZ + 1, supportMaterial);
        
        this.setBlock(blockSetter, currX - 1, startY + 1, currZ - 1, supportMaterial);
        this.setBlock(blockSetter, currX + 1, startY + 1, currZ - 1, supportMaterial);
        this.setBlock(blockSetter, currX - 1, startY + 1, currZ + 1, supportMaterial);
        this.setBlock(blockSetter, currX + 1, startY + 1, currZ + 1, supportMaterial);
        
        // Ceiling supports
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            this.setBlock(blockSetter, currX + dx, startY + 2, currZ + dz, floorMaterial);
          }
        }
        
        // Add lighting
        if (i % 8 === 0) {
          this.setBlock(blockSetter, currX, startY + 1, currZ, lightMaterial);
        }
      }
      
      // Place rails along the center of the corridor
      if (i % 4 !== 0) { // Skip at support beam locations
        this.setBlock(blockSetter, currX, startY, currZ, railMaterial);
      }
    }
  }
  
  /**
   * Generate an intersection room in the mineshaft
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} floorMaterial - Material for the floor
   * @param {Object} supportMaterial - Material for supports
   * @param {Object} lightMaterial - Material for lighting
   * @param {Function} blockSetter - Function to set blocks
   */
  generateMineshaftIntersection(x, y, z, floorMaterial, supportMaterial, lightMaterial, blockSetter) {
    // Create a larger 5x5 room at the intersection
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = 0; dy <= 3; dy++) {
        for (let dz = -2; dz <= 2; dz++) {
          this.setBlock(blockSetter, x + dx, y + dy, z + dz, { type: 'air' });
        }
      }
    }
    
    // Add floor
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        this.setBlock(blockSetter, x + dx, y - 1, z + dz, floorMaterial);
      }
    }
    
    // Add ceiling
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        this.setBlock(blockSetter, x + dx, y + 3, z + dz, floorMaterial);
      }
    }
    
    // Add corner support pillars
    for (let dy = 0; dy <= 2; dy++) {
      this.setBlock(blockSetter, x - 2, y + dy, z - 2, supportMaterial);
      this.setBlock(blockSetter, x + 2, y + dy, z - 2, supportMaterial);
      this.setBlock(blockSetter, x - 2, y + dy, z + 2, supportMaterial);
      this.setBlock(blockSetter, x + 2, y + dy, z + 2, supportMaterial);
    }
    
    // Add lighting in the center
    this.setBlock(blockSetter, x, y + 2, z, lightMaterial);
    
    // Add some decoration
    if (Math.random() < 0.5) {
      // Add a small table or workstation
      this.setBlock(blockSetter, x, y, z, { type: 'crafting_table' });
    } else {
      // Or maybe a chest
      this.generateMineshaftChest(x, y, z, blockSetter);
    }
  }
  
  /**
   * Generate a minecart with chest
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Function} blockSetter - Function to set blocks
   */
  generateMineshaftChest(x, y, z, blockSetter) {
    // Place a rail with a minecart chest on top
    this.setBlock(blockSetter, x, y, z, { type: 'rail' });
    this.setBlock(blockSetter, x, y + 1, z, { 
      type: 'chest_minecart',
      metadata: { 
        loot: 'mineshaft'
      }
    });
  }
  
  /**
   * Generate a spawner room
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} floorMaterial - Material for the floor
   * @param {Object} supportMaterial - Material for supports
   * @param {Object} webMaterial - Material for cobwebs
   * @param {Function} blockSetter - Function to set blocks
   */
  generateSpawnerRoom(x, y, z, floorMaterial, supportMaterial, webMaterial, blockSetter) {
    // Create a small 5x5 room
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = 0; dy <= 3; dy++) {
        for (let dz = -2; dz <= 2; dz++) {
          this.setBlock(blockSetter, x + dx, y + dy, z + dz, { type: 'air' });
        }
      }
    }
    
    // Add floor
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        this.setBlock(blockSetter, x + dx, y - 1, z + dz, floorMaterial);
      }
    }
    
    // Add ceiling
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        this.setBlock(blockSetter, x + dx, y + 3, z + dz, floorMaterial);
      }
    }
    
    // Add corner support pillars
    for (let dy = 0; dy <= 2; dy++) {
      this.setBlock(blockSetter, x - 2, y + dy, z - 2, supportMaterial);
      this.setBlock(blockSetter, x + 2, y + dy, z - 2, supportMaterial);
      this.setBlock(blockSetter, x - 2, y + dy, z + 2, supportMaterial);
      this.setBlock(blockSetter, x + 2, y + dy, z + 2, supportMaterial);
    }
    
    // Place spawner in the center
    this.setBlock(blockSetter, x, y, z, { 
      type: 'monster_spawner', 
      metadata: { entity_type: 'cave_spider' } 
    });
    
    // Add cobwebs throughout the room
    for (let i = 0; i < 8; i++) {
      const dx = Math.floor(Math.random() * 5) - 2;
      const dy = Math.floor(Math.random() * 3);
      const dz = Math.floor(Math.random() * 5) - 2;
      
      // Don't place directly on the spawner
      if (dx === 0 && dy === 0 && dz === 0) continue;
      
      this.setBlock(blockSetter, x + dx, y + dy, z + dz, webMaterial);
    }
  }
  
  /**
   * Add features to mineshaft tunnels
   * @private
   * @param {Array} tunnels - List of tunnel segments
   * @param {Object} floorMaterial - Material for the floor
   * @param {Object} supportMaterial - Material for supports
   * @param {Object} webMaterial - Material for cobwebs
   * @param {Function} blockSetter - Function to set blocks
   */
  addMineshaftFeatures(tunnels, floorMaterial, supportMaterial, webMaterial, blockSetter) {
    // Add random features along tunnels
    for (const tunnel of tunnels) {
      const isXTunnel = tunnel.startZ === tunnel.endZ;
      const length = isXTunnel 
        ? Math.abs(tunnel.endX - tunnel.startX) 
        : Math.abs(tunnel.endZ - tunnel.startZ);
      
      // Add some collapse points
      const numCollapsePoints = Math.floor(length / 12); // Roughly one collapse every 12 blocks
      
      for (let i = 0; i < numCollapsePoints; i++) {
        // Choose a position along the tunnel
        let collapseX, collapseZ;
        
        if (isXTunnel) {
          collapseX = tunnel.startX + Math.floor(Math.random() * length);
          collapseZ = tunnel.startZ;
        } else {
          collapseX = tunnel.startX;
          collapseZ = tunnel.startZ + Math.floor(Math.random() * length);
        }
        
        // Create a partial collapse
        this.generateTunnelCollapse(
          collapseX, 
          tunnel.startY, 
          collapseZ, 
          floorMaterial, 
          supportMaterial, 
          webMaterial, 
          blockSetter
        );
      }
    }
  }
  
  /**
   * Generate a partial tunnel collapse
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} floorMaterial - Material for the floor
   * @param {Object} supportMaterial - Material for supports
   * @param {Object} webMaterial - Material for cobwebs
   * @param {Function} blockSetter - Function to set blocks
   */
  generateTunnelCollapse(x, y, z, floorMaterial, supportMaterial, webMaterial, blockSetter) {
    // Create a partially collapsed ceiling
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        // Skip center to keep tunnel passable
        if (dx === 0 && dz === 0) continue;
        
        // Random collapse pattern
        if (Math.random() < 0.3) {
          this.setBlock(blockSetter, x + dx, y + 2, z + dz, { type: 'gravel' });
        }
        
        if (Math.random() < 0.2) {
          this.setBlock(blockSetter, x + dx, y + 1, z + dz, { type: 'gravel' });
        }
      }
    }
    
    // Add some broken support beams
    if (Math.random() < 0.6) {
      const corner = Math.floor(Math.random() * 4);
      let dx, dz;
      
      switch (corner) {
        case 0: dx = -1; dz = -1; break;
        case 1: dx = 1; dz = -1; break;
        case 2: dx = -1; dz = 1; break;
        case 3: dx = 1; dz = 1; break;
      }
      
      // Broken support beam
      this.setBlock(blockSetter, x + dx, y, z + dz, supportMaterial);
      this.setBlock(blockSetter, x + dx, y + 1, z + dz, { type: 'air' });
    }
    
    // Add some cobwebs around collapse
    for (let i = 0; i < 2; i++) {
      const dx = Math.floor(Math.random() * 3) - 1;
      const dy = Math.floor(Math.random() * 3);
      const dz = Math.floor(Math.random() * 3) - 1;
      
      this.setBlock(blockSetter, x + dx, y + dy, z + dz, webMaterial);
    }
  }
  
  /**
   * Generate a dungeon structure
   * @param {Object} position - Position to generate the dungeon
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateDungeon(position, options, blockSetter) {
    const { x, y, z } = position;
    
    // Dungeons should be underground
    const dungeonY = Math.min(y, 50);
    
    // Main building materials
    const primaryMaterials = [
      { type: 'cobblestone' },
      { type: 'mossy_cobblestone' }
    ];
    
    // Room parameters
    const width = 7 + Math.floor(Math.random() * 4); // 7-10 blocks
    const height = 4 + Math.floor(Math.random() * 2); // 4-5 blocks
    const depth = 7 + Math.floor(Math.random() * 4); // 7-10 blocks
    
    // Calculate room bounds
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Generate the basic room
    this.generateDungeonRoom(
      x, dungeonY, z,
      width, height, depth,
      primaryMaterials,
      blockSetter
    );
    
    // Add a mob spawner in the center
    this.generateDungeonSpawner(
      x, dungeonY, z,
      blockSetter
    );
    
    // Add chests around the room
    this.generateDungeonChests(
      x, dungeonY, z,
      halfWidth, halfDepth,
      blockSetter
    );
    
    // Add doorways/entrances to the dungeon
    const entrances = this.generateDungeonEntrances(
      x, dungeonY, z,
      halfWidth, height, halfDepth,
      primaryMaterials,
      blockSetter
    );
    
    // Add decorative elements
    this.generateDungeonDecorations(
      x, dungeonY, z,
      halfWidth, height, halfDepth,
      blockSetter
    );
    
    return {
      type: 'dungeon',
      position: { x, y: dungeonY, z },
      size: { width, height, depth },
      entrances
    };
  }
  
  /**
   * Generate the basic dungeon room
   * @private
   * @param {number} x - X coordinate of the center
   * @param {number} y - Y coordinate of the floor
   * @param {number} z - Z coordinate of the center
   * @param {number} width - Room width
   * @param {number} height - Room height
   * @param {number} depth - Room depth
   * @param {Array} materials - Building materials
   * @param {Function} blockSetter - Function to set blocks
   */
  generateDungeonRoom(x, y, z, width, height, depth, materials, blockSetter) {
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Generate the room (walls, floor, ceiling)
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dy = 0; dy <= height; dy++) {
        for (let dz = -halfDepth; dz <= halfDepth; dz++) {
          // Determine if this is a wall, floor, or ceiling block
          const isWall = Math.abs(dx) === halfWidth || Math.abs(dz) === halfDepth;
          const isFloor = dy === 0;
          const isCeiling = dy === height;
          
          if (isWall || isFloor || isCeiling) {
            // Choose randomly between cobblestone and mossy cobblestone
            const materialIndex = Math.random() < 0.4 ? 1 : 0; // 40% chance for mossy
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, materials[materialIndex]);
          } else {
            // Interior is air
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, { type: 'air' });
          }
        }
      }
    }
  }
  
  /**
   * Generate a mob spawner in the dungeon
   * @private
   * @param {number} x - X coordinate of the center
   * @param {number} y - Y coordinate of the floor
   * @param {number} z - Z coordinate of the center
   * @param {Function} blockSetter - Function to set blocks
   */
  generateDungeonSpawner(x, y, z, blockSetter) {
    // Choose a random mob type for the spawner
    const mobTypes = ['zombie', 'skeleton', 'spider'];
    const mobType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
    
    // Place the spawner
    this.setBlock(blockSetter, x, y + 1, z, { 
      type: 'monster_spawner', 
      metadata: { entity_type: mobType } 
    });
  }
  
  /**
   * Generate chests in the dungeon
   * @private
   * @param {number} x - X coordinate of the center
   * @param {number} y - Y coordinate of the floor
   * @param {number} z - Z coordinate of the center
   * @param {number} halfWidth - Half of the room width
   * @param {number} halfDepth - Half of the room depth
   * @param {Function} blockSetter - Function to set blocks
   */
  generateDungeonChests(x, y, z, halfWidth, halfDepth, blockSetter) {
    // Number of chests to place (1-2)
    const chestCount = 1 + Math.floor(Math.random() * 2);
    
    // Possible chest positions (against walls)
    const possiblePositions = [];
    
    // Add positions along the walls (excluding corners)
    for (let dx = -halfWidth + 1; dx <= halfWidth - 1; dx++) {
      if (dx !== 0) { // Skip center positions
        possiblePositions.push({ dx, dz: -halfDepth + 1, facing: 'south' });
        possiblePositions.push({ dx, dz: halfDepth - 1, facing: 'north' });
      }
    }
    
    for (let dz = -halfDepth + 1; dz <= halfDepth - 1; dz++) {
      if (dz !== 0) { // Skip center positions
        possiblePositions.push({ dx: -halfWidth + 1, dz, facing: 'east' });
        possiblePositions.push({ dx: halfWidth - 1, dz, facing: 'west' });
      }
    }
    
    // Shuffle positions
    for (let i = possiblePositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [possiblePositions[i], possiblePositions[j]] = [possiblePositions[j], possiblePositions[i]];
    }
    
    // Place the chests
    for (let i = 0; i < Math.min(chestCount, possiblePositions.length); i++) {
      const pos = possiblePositions[i];
      this.setBlock(blockSetter, x + pos.dx, y + 1, z + pos.dz, { 
        type: 'chest', 
        metadata: { 
          facing: pos.facing,
          loot: 'dungeon' 
        } 
      });
    }
  }
  
  /**
   * Generate entrances to the dungeon
   * @private
   * @param {number} x - X coordinate of the center
   * @param {number} y - Y coordinate of the floor
   * @param {number} z - Z coordinate of the center
   * @param {number} halfWidth - Half of the room width
   * @param {number} height - Room height
   * @param {number} halfDepth - Half of the room depth
   * @param {Array} materials - Building materials
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Array} - List of entrance positions
   */
  generateDungeonEntrances(x, y, z, halfWidth, height, halfDepth, materials, blockSetter) {
    // Number of entrances to create (1-2)
    const entranceCount = 1 + Math.floor(Math.random() * 2);
    
    // Possible entrance positions
    const possibleEntrances = [
      { dx: 0, dz: -halfDepth, direction: 'north' },
      { dx: halfWidth, dz: 0, direction: 'east' },
      { dx: 0, dz: halfDepth, direction: 'south' },
      { dx: -halfWidth, dz: 0, direction: 'west' }
    ];
    
    // Shuffle entrance positions
    for (let i = possibleEntrances.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [possibleEntrances[i], possibleEntrances[j]] = [possibleEntrances[j], possibleEntrances[i]];
    }
    
    const entrances = [];
    
    // Create the entrances
    for (let i = 0; i < entranceCount; i++) {
      const entrance = possibleEntrances[i];
      
      // Create a doorway (2x3 opening)
      for (let dy = 1; dy <= 2; dy++) {
        this.setBlock(blockSetter, x + entrance.dx, y + dy, z + entrance.dz, { type: 'air' });
      }
      
      // Record the entrance
      entrances.push({
        x: x + entrance.dx,
        y: y + 1,
        z: z + entrance.dz,
        direction: entrance.direction
      });
      
      // Create a small tunnel extending the entrance (length 2-3 blocks)
      const tunnelLength = 2 + Math.floor(Math.random() * 2);
      
      for (let j = 1; j <= tunnelLength; j++) {
        let tx = 0, tz = 0;
        
        switch (entrance.direction) {
          case 'north': tz = -j; break;
          case 'east':  tx = j;  break;
          case 'south': tz = j;  break;
          case 'west':  tx = -j; break;
        }
        
        // Create the tunnel blocks
        for (let dy = 0; dy <= 3; dy++) {
          for (let tdx = -1; tdx <= 1; tdx++) {
            for (let tdz = -1; tdz <= 1; tdz++) {
              // Skip center blocks to create the actual tunnel
              if ((tdx === 0 && tdz === 0) || (Math.abs(tdx) + Math.abs(tdz) === 1 && dy > 0 && dy < 3)) {
                this.setBlock(blockSetter, x + entrance.dx + tx + tdx, y + dy, z + entrance.dz + tz + tdz, { type: 'air' });
              } else if (dy === 0 || dy === 3 || Math.abs(tdx) + Math.abs(tdz) === 2) {
                // Choose randomly between cobblestone and mossy cobblestone
                const materialIndex = Math.random() < 0.4 ? 1 : 0; // 40% chance for mossy
                this.setBlock(blockSetter, x + entrance.dx + tx + tdx, y + dy, z + entrance.dz + tz + tdz, materials[materialIndex]);
              }
            }
          }
        }
      }
    }
    
    return entrances;
  }
  
  /**
   * Generate decorative elements in the dungeon
   * @private
   * @param {number} x - X coordinate of the center
   * @param {number} y - Y coordinate of the floor
   * @param {number} z - Z coordinate of the center
   * @param {number} halfWidth - Half of the room width
   * @param {number} height - Room height
   * @param {number} halfDepth - Half of the room depth
   * @param {Function} blockSetter - Function to set blocks
   */
  generateDungeonDecorations(x, y, z, halfWidth, height, halfDepth, blockSetter) {
    // Add some cobwebs in the corners and ceiling
    const numCobwebs = 3 + Math.floor(Math.random() * 5); // 3-7 cobwebs
    
    for (let i = 0; i < numCobwebs; i++) {
      // Generate position, with bias towards edges and ceiling
      const dx = Math.floor(Math.random() * (2 * halfWidth + 1)) - halfWidth;
      const dy = Math.floor(Math.random() * height) + 1; // +1 to avoid floor
      const dz = Math.floor(Math.random() * (2 * halfDepth + 1)) - halfDepth;
      
      // Only place cobwebs if they're not in the center or directly above the spawner
      if ((Math.abs(dx) > 1 || Math.abs(dz) > 1)) {
        this.setBlock(blockSetter, x + dx, y + dy, z + dz, { type: 'cobweb' });
      }
    }
    
    // Add torches on the walls
    if (Math.random() < 0.3) { // 30% chance for torches
      // Choose random wall positions
      const numTorches = 1 + Math.floor(Math.random() * 2); // 1-2 torches
      
      const possiblePositions = [];
      
      // Add positions along the walls (excluding corners)
      for (let dx = -halfWidth + 1; dx <= halfWidth - 1; dx++) {
        if (dx !== 0) { // Skip center positions
          possiblePositions.push({ dx, dz: -halfDepth + 1, facing: 'south' });
          possiblePositions.push({ dx, dz: halfDepth - 1, facing: 'north' });
        }
      }
      
      for (let dz = -halfDepth + 1; dz <= halfDepth - 1; dz++) {
        if (dz !== 0) { // Skip center positions
          possiblePositions.push({ dx: -halfWidth + 1, dz, facing: 'east' });
          possiblePositions.push({ dx: halfWidth - 1, dz, facing: 'west' });
        }
      }
      
      // Shuffle positions
      for (let i = possiblePositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possiblePositions[i], possiblePositions[j]] = [possiblePositions[j], possiblePositions[i]];
      }
      
      // Place the torches
      for (let i = 0; i < Math.min(numTorches, possiblePositions.length); i++) {
        const pos = possiblePositions[i];
        this.setBlock(blockSetter, x + pos.dx, y + 2, z + pos.dz, { 
          type: 'torch', 
          metadata: { 
            facing: pos.facing 
          } 
        });
      }
    }
  }
  
  /**
   * Generate a desert temple (pyramid) structure
   * @param {Object} position - Position to generate the temple
   * @param {Object} options - Generation options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} Generated structure data
   */
  generateDesertTemple(position, options, blockSetter) {
    const { x, y, z } = position;
    
    // Temple dimensions
    const width = 21;
    const height = 15;
    const halfWidth = Math.floor(width / 2);
    
    // Generate base using sandstone
    const sandstone = { type: 'sandstone' };
    const chiseledSandstone = { type: 'sandstone', metadata: { variant: 'chiseled' } };
    const cutSandstone = { type: 'sandstone', metadata: { variant: 'cut' } };
    const orangeWool = { type: 'wool', metadata: { color: 'orange' } };
    const blueWool = { type: 'wool', metadata: { color: 'blue' } };
    
    // Generate pyramid base (solid)
    for (let py = 0; py < 4; py++) {
      const layerOffset = py;
      for (let dx = -halfWidth + layerOffset; dx <= halfWidth - layerOffset; dx++) {
        for (let dz = -halfWidth + layerOffset; dz <= halfWidth - layerOffset; dz++) {
          this.setBlock(blockSetter, x + dx, y + py, z + dz, sandstone);
        }
      }
    }
    
    // Generate hollow inside above base
    for (let py = 4; py < height; py++) {
      const layerOffset = py - 4;
      
      // Outer layer
      for (let dx = -halfWidth + layerOffset; dx <= halfWidth - layerOffset; dx++) {
        for (let dz = -halfWidth + layerOffset; dz <= halfWidth - layerOffset; dz++) {
          // Only place blocks on the exterior
          if (dx === -halfWidth + layerOffset || dx === halfWidth - layerOffset || 
              dz === -halfWidth + layerOffset || dz === halfWidth - layerOffset) {
            
            // Create decorative pattern on the exterior
            if ((dx + dz) % 2 === 0 && py < 10) {
              this.setBlock(blockSetter, x + dx, y + py, z + dz, chiseledSandstone);
            } else {
              this.setBlock(blockSetter, x + dx, y + py, z + dz, sandstone);
            }
          } else {
            // Create hollow interior
            this.setBlock(blockSetter, x + dx, y + py, z + dz, { type: 'air' });
          }
        }
      }
    }
    
    // Create entrance (south side)
    for (let py = 4; py < 7; py++) {
      for (let dx = -1; dx <= 1; dx++) {
        this.setBlock(blockSetter, x + dx, y + py, z + halfWidth - 4, { type: 'air' });
      }
    }
    
    // Add decorative pillars around entrance
    for (let py = 4; py < 9; py++) {
      this.setBlock(blockSetter, x - 2, y + py, z + halfWidth - 4, py % 2 === 0 ? blueWool : orangeWool);
      this.setBlock(blockSetter, x + 2, y + py, z + halfWidth - 4, py % 2 === 0 ? blueWool : orangeWool);
    }
    
    // Create internal corridor
    for (let dz = halfWidth - 5; dz >= 0; dz--) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let py = 4; py < 7; py++) {
          this.setBlock(blockSetter, x + dx, y + py, z + dz, { type: 'air' });
        }
      }
    }
    
    // Generate main chamber
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -5; dz <= 5; dz++) {
        for (let py = 4; py < 10; py++) {
          // Create the chamber (skip corners for a more circular look)
          if (Math.abs(dx) + Math.abs(dz) <= 9) {
            this.setBlock(blockSetter, x + dx, y + py, z + dz, { type: 'air' });
          }
        }
      }
    }
    
    // Add decorative pillars in the chamber
    for (let py = 4; py < 9; py++) {
      this.setBlock(blockSetter, x - 3, y + py, z - 3, py % 2 === 0 ? blueWool : orangeWool);
      this.setBlock(blockSetter, x + 3, y + py, z - 3, py % 2 === 0 ? blueWool : orangeWool);
      this.setBlock(blockSetter, x - 3, y + py, z + 3, py % 2 === 0 ? blueWool : orangeWool);
      this.setBlock(blockSetter, x + 3, y + py, z + 3, py % 2 === 0 ? blueWool : orangeWool);
    }
    
    // Create secret chamber below with TNT trap
    this.generateDesertTempleTrap(x, y, z, blockSetter);
    
    // Add treasure chests
    this.generateDesertTempleTreasure(x, y, z, blockSetter);
    
    return {
      type: 'desert_temple',
      position: { x, y, z },
      size: { width, height, width }
    };
  }
  
  /**
   * Generate the TNT trap for a desert temple
   * @private
   * @param {number} x - X coordinate of temple center
   * @param {number} y - Y coordinate of temple base
   * @param {number} z - Z coordinate of temple center
   * @param {Function} blockSetter - Function to set blocks
   */
  generateDesertTempleTrap(x, y, z, blockSetter) {
    // Create chamber
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        // Floor
        this.setBlock(blockSetter, x + dx, y, z + dz, { type: 'sandstone' });
        
        // Walls
        if (Math.abs(dx) === 3 || Math.abs(dz) === 3) {
          for (let py = 1; py <= 3; py++) {
            this.setBlock(blockSetter, x + dx, y + py, z + dz, { type: 'sandstone' });
          }
        } else {
          // Interior space
          for (let py = 1; py <= 3; py++) {
            this.setBlock(blockSetter, x + dx, y + py, z + dz, { type: 'air' });
          }
        }
      }
    }
    
    // Place TNT pattern in the floor
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (Math.abs(dx) !== 2 || Math.abs(dz) !== 2) { // Skip corners
          this.setBlock(blockSetter, x + dx, y, z + dz, { type: 'tnt' });
        }
      }
    }
    
    // Stone pressure plate in the center
    this.setBlock(blockSetter, x, y + 1, z, { type: 'stone_pressure_plate' });
    
    // Create shaft to the trap from main chamber
    for (let py = 4; py >= 1; py--) {
      this.setBlock(blockSetter, x, y + py, z, { type: 'air' });
    }
  }
  
  /**
   * Generate treasure chests for desert temple
   * @private
   * @param {number} x - X coordinate of temple center
   * @param {number} y - Y coordinate of temple base
   * @param {number} z - Z coordinate of temple center
   * @param {Function} blockSetter - Function to set blocks
   */
  generateDesertTempleTreasure(x, y, z, blockSetter) {
    // Place four chests around the center
    this.setBlock(blockSetter, x - 2, y + 1, z - 2, { 
      type: 'chest',
      metadata: { 
        facing: 'south',
        loot_table: 'desert_temple'
      }
    });
    
    this.setBlock(blockSetter, x + 2, y + 1, z - 2, { 
      type: 'chest',
      metadata: { 
        facing: 'south',
        loot_table: 'desert_temple'
      }
    });
    
    this.setBlock(blockSetter, x - 2, y + 1, z + 2, { 
      type: 'chest',
      metadata: { 
        facing: 'north',
        loot_table: 'desert_temple'
      }
    });
    
    this.setBlock(blockSetter, x + 2, y + 1, z + 2, { 
      type: 'chest',
      metadata: { 
        facing: 'north',
        loot_table: 'desert_temple'
      }
    });
  }
  
  /**
   * Generate a jungle temple structure
   * @param {Object} position - Position to generate the temple
   * @param {Object} options - Generation options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} Generated structure data
   */
  generateJungleTemple(position, options, blockSetter) {
    const { x, y, z } = position;
    
    // Temple dimensions
    const width = 17;
    const depth = 19;
    const height = 10;
    
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Materials
    const cobblestone = { type: 'cobblestone' };
    const mossyCobblestone = { type: 'cobblestone', metadata: { variant: 'mossy' } };
    const stoneBricks = { type: 'stone_bricks' };
    const mossyStoneBricks = { type: 'stone_bricks', metadata: { variant: 'mossy' } };
    const crackedStoneBricks = { type: 'stone_bricks', metadata: { variant: 'cracked' } };
    const chiseledStoneBricks = { type: 'stone_bricks', metadata: { variant: 'chiseled' } };
    
    // Generate main structure
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dz = -halfDepth; dz <= halfDepth; dz++) {
        // Floor
        if (Math.random() < 0.3) {
          this.setBlock(blockSetter, x + dx, y, z + dz, mossyCobblestone);
        } else {
          this.setBlock(blockSetter, x + dx, y, z + dz, cobblestone);
        }
        
        // Walls
        if (dx === -halfWidth || dx === halfWidth || dz === -halfDepth || dz === halfDepth) {
          for (let py = 1; py < height; py++) {
            // Random stone brick variations
            const rand = Math.random();
            if (rand < 0.4) {
              this.setBlock(blockSetter, x + dx, y + py, z + dz, mossyStoneBricks);
            } else if (rand < 0.6) {
              this.setBlock(blockSetter, x + dx, y + py, z + dz, crackedStoneBricks);
            } else {
              this.setBlock(blockSetter, x + dx, y + py, z + dz, stoneBricks);
            }
          }
        } else {
          // Interior
          for (let py = 1; py < height; py++) {
            this.setBlock(blockSetter, x + dx, y + py, z + dz, { type: 'air' });
          }
        }
        
        // Ceiling
        if (Math.random() < 0.3) {
          this.setBlock(blockSetter, x + dx, y + height, z + dz, mossyStoneBricks);
        } else {
          this.setBlock(blockSetter, x + dx, y + height, z + dz, stoneBricks);
        }
      }
    }
    
    // Create entrance (south side)
    for (let py = 1; py < 4; py++) {
      for (let dx = -1; dx <= 1; dx++) {
        this.setBlock(blockSetter, x + dx, y + py, z + halfDepth, { type: 'air' });
      }
    }
    
    // Decorative archway around entrance
    for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) >= 2) {
        for (let py = 1; py < 5; py++) {
          this.setBlock(blockSetter, x + dx, y + py, z + halfDepth - 1, chiseledStoneBricks);
        }
      } else if (dx !== 0) {
        for (let py = 4; py < 6; py++) {
          this.setBlock(blockSetter, x + dx, y + py, z + halfDepth - 1, chiseledStoneBricks);
        }
      } else {
        this.setBlock(blockSetter, x, y + 5, z + halfDepth - 1, chiseledStoneBricks);
      }
    }
    
    // Create inner chambers
    this.generateJungleTempleInnerChambers(x, y, z, halfWidth, halfDepth, height, blockSetter);
    
    // Generate traps
    this.generateJungleTempleTraps(x, y, z, blockSetter);
    
    // Add treasure chests
    this.generateJungleTempleTreasure(x, y, z, blockSetter);
    
    return {
      type: 'jungle_temple',
      position: { x, y, z },
      size: { width, depth, height }
    };
  }
  
  /**
   * Generate inner chambers for a jungle temple
   * @private
   * @param {number} x - X coordinate of temple center
   * @param {number} y - Y coordinate of temple base
   * @param {number} z - Z coordinate of temple center
   * @param {number} halfWidth - Half width of the temple
   * @param {number} halfDepth - Half depth of the temple
   * @param {number} height - Height of the temple
   * @param {Function} blockSetter - Function to set blocks
   */
  generateJungleTempleInnerChambers(x, y, z, halfWidth, halfDepth, height, blockSetter) {
    // Materials
    const stoneBricks = { type: 'stone_bricks' };
    const mossyStoneBricks = { type: 'stone_bricks', metadata: { variant: 'mossy' } };
    
    // Create dividing wall halfway through the temple
    for (let dx = -halfWidth + 1; dx <= halfWidth - 1; dx++) {
      for (let py = 1; py < height; py++) {
        if (dx === 0 && py < 4) {
          // Doorway
          this.setBlock(blockSetter, x + dx, y + py, z, { type: 'air' });
        } else {
          // Wall
          this.setBlock(blockSetter, x + dx, y + py, z, Math.random() < 0.3 ? mossyStoneBricks : stoneBricks);
        }
      }
    }
    
    // Create pillars in the main hall
    for (let dx = -halfWidth + 3; dx <= halfWidth - 3; dx += 3) {
      for (let dz = 3; dz <= halfDepth - 3; dz += 3) {
        if (dx !== 0) { // Skip center for entrance path
          for (let py = 1; py < height; py++) {
            this.setBlock(blockSetter, x + dx, y + py, z + dz, Math.random() < 0.3 ? mossyStoneBricks : stoneBricks);
          }
        }
      }
    }
  }
  
  /**
   * Generate traps for a jungle temple
   * @private
   * @param {number} x - X coordinate of temple center
   * @param {number} y - Y coordinate of temple base
   * @param {number} z - Z coordinate of temple center
   * @param {Function} blockSetter - Function to set blocks
   */
  generateJungleTempleTraps(x, y, z, blockSetter) {
    // Materials
    const stoneBricks = { type: 'stone_bricks' };
    const mossyStoneBricks = { type: 'stone_bricks', metadata: { variant: 'mossy' } };

    // 1. Hidden corridor with tripwire and dispensers
    // Create a corridor on the north side
    const corridorZ = z - 5;
    const corridorLength = 7;
    
    // Create corridor walls and floor
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = 0; dz < corridorLength; dz++) {
        // Floor
        this.setBlock(blockSetter, x + dx, y + 1, corridorZ - dz, { type: 'mossy_cobblestone' });
        
        // Walls
        if (dx === -1 || dx === 1) {
          for (let py = 2; py <= 3; py++) {
            if (Math.random() < 0.4) {
              this.setBlock(blockSetter, x + dx, y + py, corridorZ - dz, mossyStoneBricks);
            } else {
              this.setBlock(blockSetter, x + dx, y + py, corridorZ - dz, stoneBricks);
            }
          }
        }
        
        // Ceiling
        this.setBlock(blockSetter, x + dx, y + 4, corridorZ - dz, mossyStoneBricks);
      }
    }
    
    // Set tripwire hooks at the ends of the corridor
    this.setBlock(blockSetter, x, y + 2, corridorZ, { 
      type: 'tripwire_hook',
      metadata: { facing: 'south', attached: true }
    });
    
    this.setBlock(blockSetter, x, y + 2, corridorZ - (corridorLength - 1), { 
      type: 'tripwire_hook',
      metadata: { facing: 'north', attached: true }
    });
    
    // Set tripwire along the corridor
    for (let dz = 1; dz < corridorLength - 1; dz++) {
      this.setBlock(blockSetter, x, y + 2, corridorZ - dz, { 
        type: 'tripwire',
        metadata: { attached: true }
      });
    }
    
    // Place dispensers on both sides of the corridor facing inward
    for (let dz = 2; dz < corridorLength - 2; dz += 2) {
      // Left side dispenser
      this.setBlock(blockSetter, x - 1, y + 2, corridorZ - dz, { 
        type: 'dispenser',
        metadata: { 
          facing: 'east',
          contents: [{ type: 'arrow', count: 5 }]
        }
      });
      
      // Right side dispenser
      this.setBlock(blockSetter, x + 1, y + 2, corridorZ - dz, { 
        type: 'dispenser',
        metadata: { 
          facing: 'west',
          contents: [{ type: 'arrow', count: 5 }]
        }
      });
    }
    
    // 2. Hidden piston trap with pressure plate
    const trapX = x + 4;
    const trapZ = z;
    
    // Hidden chamber with piston trap
    // Create a small chamber
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        // Air space
        this.setBlock(blockSetter, trapX + dx, y + 2, trapZ + dz, { type: 'air' });
        this.setBlock(blockSetter, trapX + dx, y + 3, trapZ + dz, { type: 'air' });
        
        // Floor - stone pressure plate in the center
        if (dx === 0 && dz === 0) {
          this.setBlock(blockSetter, trapX, y + 1, trapZ, { type: 'stone_pressure_plate' });
        } else {
          this.setBlock(blockSetter, trapX + dx, y + 1, trapZ + dz, { type: 'mossy_cobblestone' });
        }
      }
    }
    
    // Hidden pistons in the walls above
    this.setBlock(blockSetter, trapX, y + 4, trapZ - 1, { 
      type: 'piston', 
      metadata: { facing: 'south', extended: false }
    });
    
    this.setBlock(blockSetter, trapX, y + 4, trapZ + 1, { 
      type: 'piston', 
      metadata: { facing: 'north', extended: false }
    });
    
    this.setBlock(blockSetter, trapX - 1, y + 4, trapZ, { 
      type: 'piston', 
      metadata: { facing: 'east', extended: false }
    });
    
    this.setBlock(blockSetter, trapX + 1, y + 4, trapZ, { 
      type: 'piston', 
      metadata: { facing: 'west', extended: false }
    });
    
    // 3. Lever puzzle for hidden treasure
    const leverX = x - 4;
    const leverZ = z;
    
    // Create a lever wall
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = 1; dy <= 3; dy++) {
        const blockX = leverX + dx;
        const blockY = y + dy;
        const blockZ = leverZ;
        
        // Place wall blocks
        if (Math.random() < 0.4) {
          this.setBlock(blockSetter, blockX, blockY, blockZ, mossyStoneBricks);
        } else {
          this.setBlock(blockSetter, blockX, blockY, blockZ, stoneBricks);
        }
      }
    }
    
    // Place levers on the wall
    this.setBlock(blockSetter, leverX - 1, y + 2, leverZ, { 
      type: 'lever',
      metadata: { facing: 'east', powered: false }
    });
    
    this.setBlock(blockSetter, leverX, y + 2, leverZ, { 
      type: 'lever',
      metadata: { facing: 'east', powered: false }
    });
    
    this.setBlock(blockSetter, leverX + 1, y + 2, leverZ, { 
      type: 'lever',
      metadata: { facing: 'east', powered: false }
    });
    
    // Secret door - set up blocks that would be moved by redstone
    this.setBlock(blockSetter, leverX - 1, y + 1, leverZ - 1, { type: 'redstone_torch' });
  }
  
  /**
   * Generate treasure chests for a jungle temple
   * @private
   * @param {number} x - X coordinate of temple center
   * @param {number} y - Y coordinate of temple base
   * @param {number} z - Z coordinate of temple center
   * @param {Function} blockSetter - Function to set blocks
   */
  generateJungleTempleTreasure(x, y, z, blockSetter) {
    // Main visible treasure chest near the levers
    const mainChestX = x - 4;
    const mainChestZ = z - 2;
    
    // Create a small depression in the floor for the chest
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) {
          // Place chest in the center
          this.setBlock(blockSetter, mainChestX + dx, y + 1, mainChestZ + dz, {
            type: 'chest',
            metadata: {
              facing: 'south',
              loot_table: 'jungle_temple'
            }
          });
        } else {
          // Surround with decorative blocks
          this.setBlock(blockSetter, mainChestX + dx, y + 1, mainChestZ + dz, {
            type: 'mossy_cobblestone'
          });
        }
      }
    }
    
    // Hidden treasure behind the trap
    const hiddenChestX = x + 4;
    const hiddenChestZ = z + 3;
    
    // Create hidden chamber
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        // Clear area
        this.setBlock(blockSetter, hiddenChestX + dx, y + 2, hiddenChestZ + dz, { type: 'air' });
        this.setBlock(blockSetter, hiddenChestX + dx, y + 3, hiddenChestZ + dz, { type: 'air' });
        
        // Floor
        this.setBlock(blockSetter, hiddenChestX + dx, y + 1, hiddenChestZ + dz, { 
          type: 'mossy_cobblestone' 
        });
      }
    }
    
    // Place special loot chest with better items
    this.setBlock(blockSetter, hiddenChestX, y + 2, hiddenChestZ, {
      type: 'chest',
      metadata: {
        facing: 'north',
        loot_table: 'jungle_temple_dispenser'
      }
    });
    
    // Add some decorative blocks around the hidden chest
    this.setBlock(blockSetter, hiddenChestX - 1, y + 2, hiddenChestZ, { 
      type: 'vines',
      metadata: { east: true }
    });
    
    this.setBlock(blockSetter, hiddenChestX + 1, y + 2, hiddenChestZ, { 
      type: 'vines',
      metadata: { west: true }
    });
    
    // Secret passage mechanism (fake wall)
    // Mark position where a secret door would be (for reference)
    const doorwayX = hiddenChestX;
    const doorwayZ = hiddenChestZ - 3;
    
    // Create the appearance of a solid wall but it would be moved by redstone
    for (let dx = -1; dx <= 1; dx++) {
      this.setBlock(blockSetter, doorwayX + dx, y + 2, doorwayZ, {
        type: 'mossy_stone_bricks',
        metadata: { movable: true } // This indicates it could be moved by pistons
      });
      
      this.setBlock(blockSetter, doorwayX + dx, y + 3, doorwayZ, {
        type: 'mossy_stone_bricks',
        metadata: { movable: true }
      });
    }
    
    // Add rare emerald ore as decoration and extra reward
    this.setBlock(blockSetter, hiddenChestX - 1, y + 2, hiddenChestZ + 1, { type: 'emerald_ore' });
    this.setBlock(blockSetter, hiddenChestX + 1, y + 2, hiddenChestZ + 1, { type: 'emerald_ore' });
  }
  
  /**
   * Generate a structure at the specified position
   * @param {Object} blocks - Block data object to modify
   * @param {Object} pos - Position object {x, y, z}
   * @param {string} type - Type of structure to generate
   * @param {Object} options - Additional options for the structure
   */
  generateStructure(blocks, pos, type, options = {}) {
    switch (type) {
      case 'desert_pyramid':
      case 'desert_temple':
        return this.generateDesertTemple(blocks, pos, options);
      case 'jungle_temple':
        return this.generateJungleTemple(blocks, pos, options);
      case 'small_ruin':
        return this.generateSmallRuin(blocks, pos, options);
      case 'witch_hut':
        return this.generateWitchHut(blocks, pos, options);
      case 'village':
        return this.generateVillage(blocks, pos, options);
      case 'stronghold':
        return this.generateStronghold(blocks, pos, options);
      case 'mineshaft':
        return this.generateMineshaft(blocks, pos, options);
      default:
        console.warn(`Unknown structure type: ${type}`);
        return false;
    }
  }

  /**
   * Generate a desert temple (pyramid) at the specified position
   * @param {Object} blocks - Block data object to modify
   * @param {Object} pos - Position object {x, y, z}
   * @param {Object} options - Additional options for the temple
   * @returns {boolean} - Success status
   */
  generateDesertTemple(blocks, pos, options = {}) {
    // Find the ground level
    const groundY = this.findGroundLevel(blocks, pos.x, pos.z);
    if (groundY === -1) return false;

    const baseY = groundY;
    
    // Temple dimensions
    const width = 21;
    const height = 15;
    const halfWidth = Math.floor(width / 2);
    
    // Generate the main pyramid structure
    for (let y = 0; y < height; y++) {
      const layerWidth = width - (y * 2);
      if (layerWidth <= 0) break;
      
      const halfLayerWidth = Math.floor(layerWidth / 2);
      const startX = pos.x - halfLayerWidth;
      const startZ = pos.z - halfLayerWidth;
      
      for (let x = 0; x < layerWidth; x++) {
        for (let z = 0; z < layerWidth; z++) {
          // Determine if this is an outer edge block (for the pyramid pattern)
          const isEdge = x === 0 || x === layerWidth - 1 || z === 0 || z === layerWidth - 1;
          const blockX = startX + x;
          const blockZ = startZ + z;
          const blockY = baseY + y;
          
          // The main building material is sandstone
          if (y < 4 || isEdge) {
            blocks[`${blockX},${blockY},${blockZ}`] = { type: 'sandstone' };
          }
        }
      }
    }
    
    // Create hollow interior
    const innerStartX = pos.x - halfWidth + 3;
    const innerEndX = pos.x + halfWidth - 3;
    const innerStartZ = pos.z - halfWidth + 3;
    const innerEndZ = pos.z + halfWidth - 3;
    
    for (let x = innerStartX; x <= innerEndX; x++) {
      for (let z = innerStartZ; z <= innerEndZ; z++) {
        for (let y = baseY + 1; y < baseY + 12; y++) {
          blocks[`${x},${y},${z}`] = { type: 'air' };
        }
      }
    }
    
    // Create the entrance (on north side)
    const entranceZ = pos.z - halfWidth;
    for (let y = baseY; y <= baseY + 4; y++) {
      blocks[`${pos.x},${y},${entranceZ}`] = { type: 'air' };
      blocks[`${pos.x + 1},${y},${entranceZ}`] = { type: 'air' };
      blocks[`${pos.x - 1},${y},${entranceZ}`] = { type: 'air' };
    }
    
    // Add an entrance corridor
    for (let z = entranceZ + 1; z < entranceZ + 6; z++) {
      for (let y = baseY; y <= baseY + 4; y++) {
        blocks[`${pos.x},${y},${z}`] = { type: 'air' };
        blocks[`${pos.x + 1},${y},${z}`] = { type: 'air' };
        blocks[`${pos.x - 1},${y},${z}`] = { type: 'air' };
      }
    }
    
    // Create the main chamber
    const chamberY = baseY + 1;
    
    // Add some decorated blocks (orange terracotta patterns)
    for (let y = baseY + 2; y <= baseY + 4; y += 2) {
      // Decorative patterns on the walls
      for (let x = innerStartX - 1; x <= innerEndX + 1; x += 2) {
        blocks[`${x},${y},${innerStartZ - 1}`] = { type: 'orange_terracotta' };
        blocks[`${x},${y},${innerEndZ + 1}`] = { type: 'orange_terracotta' };
      }
      
      for (let z = innerStartZ - 1; z <= innerEndZ + 1; z += 2) {
        blocks[`${innerStartX - 1},${y},${z}`] = { type: 'orange_terracotta' };
        blocks[`${innerEndX + 1},${y},${z}`] = { type: 'orange_terracotta' };
      }
    }
    
    // Add a treasure room at the bottom
    const treasureX = pos.x;
    const treasureY = baseY - 4;
    const treasureZ = pos.z;
    
    // Create a small chamber
    for (let x = treasureX - 2; x <= treasureX + 2; x++) {
      for (let z = treasureZ - 2; z <= treasureZ + 2; z++) {
        for (let y = treasureY; y <= treasureY + 3; y++) {
          blocks[`${x},${y},${z}`] = { type: 'air' };
        }
      }
    }
    
    // Add a secret shaft down to the treasure room
    for (let y = baseY; y > treasureY; y--) {
      blocks[`${treasureX},${y},${treasureZ}`] = { type: 'air' };
    }
    
    // Add pressure plate trap with TNT
    blocks[`${treasureX},${treasureY},${treasureZ}`] = { type: 'stone_pressure_plate' };
    
    // Add TNT under the pressure plate
    blocks[`${treasureX},${treasureY - 1},${treasureZ}`] = { type: 'tnt' };
    
    // Add chests with loot
    blocks[`${treasureX - 1},${treasureY},${treasureZ - 1}`] = { type: 'chest', data: { loot_table: 'desert_pyramid' } };
    blocks[`${treasureX + 1},${treasureY},${treasureZ + 1}`] = { type: 'chest', data: { loot_table: 'desert_pyramid' } };
    
    // Add decorative blocks - blue terracotta
    blocks[`${treasureX - 1},${treasureY},${treasureZ + 1}`] = { type: 'blue_terracotta' };
    blocks[`${treasureX + 1},${treasureY},${treasureZ - 1}`] = { type: 'blue_terracotta' };
    
    return true;
  }

  /**
   * Generate a jungle temple at the specified position
   * @param {Object} blocks - Block data object to modify
   * @param {Object} pos - Position object {x, y, z}
   * @param {Object} options - Additional options for the temple
   * @returns {boolean} - Success status
   */
  generateJungleTemple(blocks, pos, options = {}) {
    // Find the ground level
    const groundY = this.findGroundLevel(blocks, pos.x, pos.z);
    if (groundY === -1) return false;

    const baseY = groundY;
    
    // Temple dimensions
    const width = 19;
    const length = 23;
    const height = 12;
    
    const halfWidth = Math.floor(width / 2);
    const halfLength = Math.floor(length / 2);
    
    // Generate the main temple structure (solid at first, we'll hollow it out later)
    for (let x = pos.x - halfWidth; x <= pos.x + halfWidth; x++) {
      for (let z = pos.z - halfLength; z <= pos.z + halfLength; z++) {
        for (let y = baseY; y <= baseY + height; y++) {
          // Main walls use mossy cobblestone or cobblestone
          if (x === pos.x - halfWidth || x === pos.x + halfWidth ||
              z === pos.z - halfLength || z === pos.z + halfLength ||
              y === baseY || y === baseY + height) {
            
            // Random mix of mossy and normal cobblestone for weathered look
            const blockType = Math.random() < 0.6 ? 'mossy_cobblestone' : 'cobblestone';
            blocks[`${x},${y},${z}`] = { type: blockType };
          }
        }
      }
    }
    
    // Create hollow interior
    for (let x = pos.x - halfWidth + 1; x <= pos.x + halfWidth - 1; x++) {
      for (let z = pos.z - halfLength + 1; z <= pos.z + halfLength - 1; z++) {
        for (let y = baseY + 1; y <= baseY + height - 1; y++) {
          blocks[`${x},${y},${z}`] = { type: 'air' };
        }
      }
    }
    
    // Add a floor (mix of cobblestone and mossy cobblestone)
    for (let x = pos.x - halfWidth + 1; x <= pos.x + halfWidth - 1; x++) {
      for (let z = pos.z - halfLength + 1; z <= pos.z + halfLength - 1; z++) {
        const blockType = Math.random() < 0.5 ? 'mossy_cobblestone' : 'cobblestone';
        blocks[`${x},${baseY},${z}`] = { type: blockType };
      }
    }
    
    // Create the entrance (on east side)
    const entranceX = pos.x + halfWidth;
    const entranceZ = pos.z;
    
    // Door opening
    for (let y = baseY + 1; y <= baseY + 4; y++) {
      blocks[`${entranceX},${y},${entranceZ}`] = { type: 'air' };
      blocks[`${entranceX},${y},${entranceZ + 1}`] = { type: 'air' };
      blocks[`${entranceX},${y},${entranceZ - 1}`] = { type: 'air' };
    }
    
    // Add stairs leading up to the entrance
    for (let i = 1; i <= 3; i++) {
      const stairX = entranceX + i;
      
      // Create stairs on 3 blocks wide
      blocks[`${stairX},${baseY + i - 1},${entranceZ}`] = { type: 'stone_stairs', data: { facing: 'west' } };
      blocks[`${stairX},${baseY + i - 1},${entranceZ + 1}`] = { type: 'stone_stairs', data: { facing: 'west' } };
      blocks[`${stairX},${baseY + i - 1},${entranceZ - 1}`] = { type: 'stone_stairs', data: { facing: 'west' } };
      
      // Add support blocks underneath
      for (let y = baseY; y < baseY + i - 1; y++) {
        blocks[`${stairX},${y},${entranceZ}`] = { type: 'cobblestone' };
        blocks[`${stairX},${y},${entranceZ + 1}`] = { type: 'cobblestone' };
        blocks[`${stairX},${y},${entranceZ - 1}`] = { type: 'cobblestone' };
      }
    }
    
    // Create inner walls to divide the temple into sections
    const innerWallZ = pos.z;
    
    for (let x = pos.x - halfWidth + 1; x <= pos.x + halfWidth - 1; x++) {
      for (let y = baseY + 1; y <= baseY + height - 1; y++) {
        if (x !== pos.x && x !== pos.x - 1 && x !== pos.x + 1) { // Leave doorways
          blocks[`${x},${y},${innerWallZ}`] = { type: 'cobblestone' };
        }
      }
    }
    
    // Create a hidden room with trapped chest (puzzle/trap area)
    const puzzleRoomStartX = pos.x - halfWidth + 3;
    const puzzleRoomEndX = pos.x - 2;
    const puzzleRoomStartZ = pos.z - halfLength + 3;
    const puzzleRoomEndZ = pos.z - 2;
    
    // Add lever puzzle
    blocks[`${puzzleRoomStartX},${baseY + 2},${puzzleRoomStartZ}`] = { type: 'lever', data: { facing: 'south' } };
    blocks[`${puzzleRoomEndX},${baseY + 2},${puzzleRoomStartZ}`] = { type: 'lever', data: { facing: 'south' } };
    blocks[`${puzzleRoomStartX},${baseY + 2},${puzzleRoomEndZ}`] = { type: 'lever', data: { facing: 'north' } };
    
    // Add pressure plate traps
    for (let x = puzzleRoomStartX + 1; x < puzzleRoomEndX; x++) {
      for (let z = puzzleRoomStartZ + 1; z < puzzleRoomEndZ; z++) {
        if (Math.random() < 0.3) {
          blocks[`${x},${baseY + 1},${z}`] = { type: 'stone_pressure_plate' };
          // Add TNT under some pressure plates
          if (Math.random() < 0.5) {
            blocks[`${x},${baseY},${z}`] = { type: 'tnt' };
          }
        }
      }
    }
    
    // Add some pillars for decoration
    for (let x = pos.x - halfWidth + 2; x <= pos.x + halfWidth - 2; x += 4) {
      for (let z = pos.z - halfLength + 2; z <= pos.z + halfLength - 2; z += 4) {
        // Skip pillars in puzzle room area
        if (!(x >= puzzleRoomStartX && x <= puzzleRoomEndX && 
              z >= puzzleRoomStartZ && z <= puzzleRoomEndZ)) {
          for (let y = baseY + 1; y <= baseY + height - 1; y++) {
            blocks[`${x},${y},${z}`] = { type: 'chiseled_stone_bricks' };
          }
        }
      }
    }
    
    // Add some vines on the exterior for jungle atmosphere
    for (let x = pos.x - halfWidth; x <= pos.x + halfWidth; x++) {
      for (let z = pos.z - halfLength; z <= pos.z + halfLength; z++) {
        for (let y = baseY + 1; y <= baseY + height; y++) {
          // Only on exterior walls
          if ((x === pos.x - halfWidth || x === pos.x + halfWidth ||
               z === pos.z - halfLength || z === pos.z + halfLength) &&
              Math.random() < 0.3) {
            blocks[`${x},${y},${z}`] = { type: 'vine', data: { 
              north: z === pos.z + halfLength, 
              south: z === pos.z - halfLength,
              east: x === pos.x - halfWidth,
              west: x === pos.x + halfWidth
            }};
          }
        }
      }
    }
    
    // Add treasure room at the back of the temple
    const treasureRoomX = pos.x;
    const treasureRoomZ = pos.z - halfLength + 3;
    
    // Add chests with loot
    blocks[`${treasureRoomX - 2},${baseY + 1},${treasureRoomZ}`] = { type: 'chest', data: { loot_table: 'jungle_temple' } };
    blocks[`${treasureRoomX + 2},${baseY + 1},${treasureRoomZ}`] = { type: 'chest', data: { loot_table: 'jungle_temple' } };
    
    // Add some decorative blocks
    blocks[`${treasureRoomX},${baseY + 1},${treasureRoomZ}`] = { type: 'chiseled_stone_bricks' };
    blocks[`${treasureRoomX},${baseY + 2},${treasureRoomZ}`] = { type: 'chiseled_stone_bricks' };
    blocks[`${treasureRoomX},${baseY + 3},${treasureRoomZ}`] = { type: 'chiseled_stone_bricks' };
    
    return true;
  }

  /**
   * Generate an ocean monument at the specified position
   * @param {Object} blocks - Block data object to modify
   * @param {Object} pos - Position object {x, y, z}
   * @param {Object} options - Additional options for the monument
   * @returns {boolean} - Success status
   */
  generateOceanMonument(blocks, pos, options = {}) {
    const waterLevel = options.waterLevel || 62;
    
    // Ocean monuments should be built underwater
    // Base Y should be on the ocean floor
    const oceanFloorY = this.findOceanFloor(blocks, pos.x, pos.z, waterLevel);
    if (oceanFloorY === -1 || oceanFloorY > waterLevel - 15) return false;
    
    const baseY = oceanFloorY;
    
    // Monument dimensions
    const width = 29;
    const length = 29;
    const height = 21;
    
    const halfWidth = Math.floor(width / 2);
    const halfLength = Math.floor(length / 2);
    
    // Generate the main external monument structure
    for (let x = pos.x - halfWidth; x <= pos.x + halfWidth; x++) {
      for (let z = pos.z - halfLength; z <= pos.z + halfLength; z++) {
        // Base platform (2 blocks thick)
        for (let y = baseY; y <= baseY + 1; y++) {
          blocks[`${x},${y},${z}`] = { type: 'prismarine' };
        }
        
        // Main structure walls
        const distX = Math.abs(x - pos.x);
        const distZ = Math.abs(z - pos.z);
        const isOuterWall = distX === halfWidth || distZ === halfLength;
        const isSecondWall = distX === halfWidth - 2 || distZ === halfLength - 2;
        const isCorner = distX >= halfWidth - 2 && distZ >= halfLength - 2;
        
        // Create the outer walls
        if (isOuterWall) {
          for (let y = baseY + 2; y <= baseY + height - 3; y++) {
            const blockType = y % 2 === 0 ? 'prismarine' : 'prismarine_bricks';
            blocks[`${x},${y},${z}`] = { type: blockType };
          }
        }
        
        // Create the second inner wall layer
        if (isSecondWall && !isCorner) {
          for (let y = baseY + 2; y <= baseY + height - 3; y++) {
            blocks[`${x},${y},${z}`] = { type: 'prismarine_bricks' };
          }
        }
        
        // Top dome/roof
        const distFromCenter = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(z - pos.z, 2));
        if (distFromCenter <= halfWidth - 2) {
          const roofY = baseY + height - 2;
          blocks[`${x},${roofY},${z}`] = { type: 'prismarine_bricks' };
          
          // Central dome
          if (distFromCenter <= 5) {
            blocks[`${x},${roofY + 1},${z}`] = { type: 'prismarine_bricks' };
            
            if (distFromCenter <= 3) {
              blocks[`${x},${roofY + 2},${z}`] = { type: 'prismarine_bricks' };
              
              if (distFromCenter <= 1) {
                blocks[`${x},${roofY + 3},${z}`] = { type: 'sea_lantern' };
              }
            }
          }
        }
      }
    }
    
    // Hollow out the interior
    for (let x = pos.x - halfWidth + 2; x <= pos.x + halfWidth - 2; x++) {
      for (let z = pos.z - halfLength + 2; z <= pos.z + halfLength - 2; z++) {
        const distFromCenter = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(z - pos.z, 2));
        
        // Skip the central column
        if (distFromCenter <= 1) continue;
        
        for (let y = baseY + 2; y <= baseY + height - 4; y++) {
          blocks[`${x},${y},${z}`] = { type: 'water' };
        }
      }
    }
    
    // Create internal floors (3 levels)
    const floorLevels = [baseY + 6, baseY + 12, baseY + 18];
    
    floorLevels.forEach(floorY => {
      for (let x = pos.x - halfWidth + 2; x <= pos.x + halfWidth - 2; x++) {
        for (let z = pos.z - halfLength + 2; z <= pos.z + halfLength - 2; z++) {
          const distFromCenter = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(z - pos.z, 2));
          
          // Create a circular pattern for the floors with some holes
          if (distFromCenter <= halfWidth - 3) {
            // Add some random holes in the floor
            if (Math.random() > 0.9 && distFromCenter > 4) {
              continue;
            }
            
            blocks[`${x},${floorY},${z}`] = { type: 'prismarine_bricks' };
          }
        }
      }
    });
    
    // Create entrance (south side)
    const entranceZ = pos.z + halfLength;
    
    for (let y = baseY + 2; y <= baseY + 5; y++) {
      blocks[`${pos.x},${y},${entranceZ}`] = { type: 'water' };
      blocks[`${pos.x - 1},${y},${entranceZ}`] = { type: 'water' };
      blocks[`${pos.x + 1},${y},${entranceZ}`] = { type: 'water' };
    }
    
    // Create supporting pillars
    const pillarPositions = [
      { x: pos.x - halfWidth + 5, z: pos.z - halfLength + 5 },
      { x: pos.x - halfWidth + 5, z: pos.z + halfLength - 5 },
      { x: pos.x + halfWidth - 5, z: pos.z - halfLength + 5 },
      { x: pos.x + halfWidth - 5, z: pos.z + halfLength - 5 },
    ];
    
    pillarPositions.forEach(pillarPos => {
      for (let y = baseY + 2; y <= baseY + height - 5; y++) {
        blocks[`${pillarPos.x},${y},${pillarPos.z}`] = { type: 'prismarine_bricks' };
      }
    });
    
    // Add sea lanterns for lighting
    const lanternPositions = [
      { x: pos.x - 7, z: pos.z - 7, y: baseY + 4 },
      { x: pos.x - 7, z: pos.z + 7, y: baseY + 4 },
      { x: pos.x + 7, z: pos.z - 7, y: baseY + 4 },
      { x: pos.x + 7, z: pos.z + 7, y: baseY + 4 },
      { x: pos.x, z: pos.z, y: baseY + 14 },
      { x: pos.x - 10, z: pos.z, y: baseY + 10 },
      { x: pos.x + 10, z: pos.z, y: baseY + 10 },
      { x: pos.x, z: pos.z - 10, y: baseY + 10 },
      { x: pos.x, z: pos.z + 10, y: baseY + 10 },
    ];
    
    lanternPositions.forEach(lPos => {
      blocks[`${lPos.x},${lPos.y},${lPos.z}`] = { type: 'sea_lantern' };
    });
    
    // Create elder guardian chambers
    const guardianRooms = [
      { x: pos.x - 8, z: pos.z - 8, y: baseY + 7 },  // Bottom floor
      { x: pos.x + 8, z: pos.z + 8, y: baseY + 13 }, // Middle floor
      { x: pos.x, z: pos.z, y: baseY + 19 }          // Top floor (central)
    ];
    
    guardianRooms.forEach(room => {
      // Create a small chamber
      for (let x = room.x - 2; x <= room.x + 2; x++) {
        for (let z = room.z - 2; z <= room.z + 2; z++) {
          blocks[`${x},${room.y},${z}`] = { type: 'prismarine_bricks' };  // Floor
          blocks[`${x},${room.y + 4},${z}`] = { type: 'prismarine_bricks' }; // Ceiling
          
          // Walls
          if (x === room.x - 2 || x === room.x + 2 || z === room.z - 2 || z === room.z + 2) {
            for (let y = room.y + 1; y <= room.y + 3; y++) {
              blocks[`${x},${y},${z}`] = { type: 'prismarine_bricks' };
            }
          }
        }
      }
      
      // Add door
      const doorX = room.x + 2;
      const doorZ = room.z;
      blocks[`${doorX},${room.y + 1},${doorZ}`] = { type: 'water' };
      blocks[`${doorX},${room.y + 2},${doorZ}`] = { type: 'water' };
      
      // Add gold blocks and sponges as treasure
      blocks[`${room.x},${room.y + 1},${room.z}`] = { type: 'gold_block' };
      blocks[`${room.x - 1},${room.y + 1},${room.z}`] = { type: 'sponge' };
      blocks[`${room.x + 1},${room.y + 1},${room.z}`] = { type: 'sponge' };
    });
    
    // Fill the rest with water (from top to bottom to ensure proper water flow)
    for (let y = baseY + height; y > waterLevel; y--) {
      for (let x = pos.x - halfWidth - 3; x <= pos.x + halfWidth + 3; x++) {
        for (let z = pos.z - halfLength - 3; z <= pos.z + halfLength + 3; z++) {
          if (!blocks[`${x},${y},${z}`]) {
            blocks[`${x},${y},${z}`] = { type: 'water' };
          }
        }
      }
    }
    
    // Mark spawn locations for elder guardians (these would be processed later by the mob spawner)
    const elderGuardianPositions = guardianRooms.map(room => ({ x: room.x, y: room.y + 2, z: room.z }));
    
    // Return true and include spawn points for elder guardians
    return {
      success: true,
      mobSpawns: {
        'elder_guardian': elderGuardianPositions
      }
    };
  }
  
  /**
   * Find the ocean floor level at the specified coordinates
   * @param {Object} blocks - Block data object
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {number} waterLevel - The water level (default: 62)
   * @returns {number} - The Y coordinate of the ocean floor, or -1 if not found
   */
  findOceanFloor(blocks, x, z, waterLevel = 62) {
    const maxDepth = 30; // Maximum search depth below water level
    
    // Start from water level and search downward
    for (let y = waterLevel; y >= waterLevel - maxDepth; y--) {
      const blockKey = `${x},${y},${z}`;
      const block = blocks[blockKey];
      
      // Skip if block doesn't exist or is water
      if (!block || block.type === 'water') {
        continue;
      }
      
      // Check if the block is solid (ocean floor)
      if (['sand', 'gravel', 'dirt', 'clay', 'stone'].includes(block.type)) {
        return y;
      }
    }
    
    return -1; // Ocean floor not found within search depth
  }
  
  /**
   * Generate ocean ruins structure
   * @param {Object} position - Position to generate the ocean ruins
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateOceanRuins(position, options, blockSetter) {
    const { x, y, z } = position;
    const { 
      size = Math.random() < 0.3 ? 'large' : 'small',
      type = Math.random() < 0.5 ? 'stone' : 'sandstone',
      degradation = 0.4 + Math.random() * 0.4 // Between 0.4 and 0.8
    } = options;
    
    // Materials based on type
    const primaryMaterial = { type: type === 'stone' ? 'stone_bricks' : 'sandstone' };
    const crackedMaterial = { type: type === 'stone' ? 'cracked_stone_bricks' : 'smooth_sandstone' };
    const mossyMaterial = { type: type === 'stone' ? 'mossy_stone_bricks' : 'chiseled_sandstone' };
    
    // Structure parameters
    const width = size === 'large' ? 7 + Math.floor(Math.random() * 4) : 4 + Math.floor(Math.random() * 3);
    const length = size === 'large' ? 7 + Math.floor(Math.random() * 4) : 4 + Math.floor(Math.random() * 3);
    const height = size === 'large' ? 4 + Math.floor(Math.random() * 2) : 3;
    
    // Amount of coral and seagrass to add
    const coralAmount = 0.15 + Math.random() * 0.2; // 15-35%
    const seagrassAmount = 0.1 + Math.random() * 0.2; // 10-30%
    
    // Function to determine if a block should be placed based on degradation level
    const shouldPlaceBlock = (dx, dy, dz) => {
      // Higher degradation at the top of the structure
      const heightFactor = dy / height;
      // More degradation at the edges
      const edgeFactor = Math.max(
        Math.abs(dx) / width,
        Math.abs(dz) / length
      );
      
      // Combined degradation factor
      const degradeFactor = degradation * (0.7 + heightFactor * 0.3) * (0.7 + edgeFactor * 0.3);
      
      return Math.random() > degradeFactor;
    };
    
    // Function to choose material based on wear
    const chooseMaterial = () => {
      const r = Math.random();
      if (r < 0.2) return mossyMaterial;
      if (r < 0.5) return crackedMaterial;
      return primaryMaterial;
    };
    
    // Generate the foundation
    for (let dx = -width; dx <= width; dx++) {
      for (let dz = -length; dz <= length; dz++) {
        // Skip corners for a more natural rounded shape
        if (Math.sqrt((dx/width)*(dx/width) + (dz/length)*(dz/length)) > 1) continue;
        
        if (shouldPlaceBlock(dx, 0, dz)) {
          this.setBlock(blockSetter, x + dx, y, z + dz, chooseMaterial());
        }
      }
    }
    
    // Generate walls
    for (let dy = 1; dy < height; dy++) {
      for (let dx = -width; dx <= width; dx++) {
        for (let dz = -length; dz <= length; dz++) {
          // Skip corners for a more natural rounded shape
          if (Math.sqrt((dx/width)*(dx/width) + (dz/length)*(dz/length)) > 1) continue;
          
          // Only build walls, not the inside
          const isWall = Math.abs(dx) === width || Math.abs(dz) === length ||
                         Math.abs(dx) === width-1 || Math.abs(dz) === length-1;
                         
          if (isWall && shouldPlaceBlock(dx, dy, dz)) {
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, chooseMaterial());
          }
        }
      }
    }
    
    // Generate the roof for larger ruins
    if (size === 'large') {
      for (let dx = -width + 1; dx <= width - 1; dx++) {
        for (let dz = -length + 1; dz <= length - 1; dz++) {
          // Skip corners for a more natural rounded shape
          if (Math.sqrt((dx/(width-1))*(dx/(width-1)) + (dz/(length-1))*(dz/(length-1))) > 1) continue;
          
          if (shouldPlaceBlock(dx, height, dz)) {
            this.setBlock(blockSetter, x + dx, y + height, z + dz, chooseMaterial());
          }
        }
      }
    }
    
    // Add a doorway
    const doorSide = Math.floor(Math.random() * 4);
    let doorX = x, doorZ = z;
    
    switch (doorSide) {
      case 0: doorX = x + width - 1; doorZ = z; break;
      case 1: doorX = x - width + 1; doorZ = z; break;
      case 2: doorX = x; doorZ = z + length - 1; break;
      case 3: doorX = x; doorZ = z - length + 1; break;
    }
    
    // Create a doorway
    this.setBlock(blockSetter, doorX, y + 1, doorZ, { type: 'water' });
    this.setBlock(blockSetter, doorX, y + 2, doorZ, { type: 'water' });
    
    // Add coral and seagrass decoration
    for (let dx = -width - 1; dx <= width + 1; dx++) {
      for (let dz = -length - 1; dz <= length + 1; dz++) {
        // Add coral around the structure
        if (Math.random() < coralAmount) {
          const coralTypes = ['fire_coral', 'brain_coral', 'tube_coral', 'horn_coral', 'bubble_coral'];
          const coralType = coralTypes[Math.floor(Math.random() * coralTypes.length)];
          const blockType = Math.random() < 0.5 ? coralType : `${coralType}_block`;
          
          this.setBlock(blockSetter, x + dx, y + 1, z + dz, { type: blockType });
        }
        
        // Add seagrass/tall seagrass
        if (Math.random() < seagrassAmount) {
          const seagrassType = Math.random() < 0.3 ? 'tall_seagrass' : 'seagrass';
          this.setBlock(blockSetter, x + dx, y + 1, z + dz, { type: seagrassType });
          
          // If tall seagrass, add the top part
          if (seagrassType === 'tall_seagrass') {
            this.setBlock(blockSetter, x + dx, y + 2, z + dz, { type: 'tall_seagrass', metadata: { part: 'upper' } });
          }
        }
      }
    }
    
    // Add chests with loot in larger ruins
    if (size === 'large') {
      // Add a buried treasure chest
      const treasureX = x + (Math.random() < 0.5 ? 1 : -1) * Math.floor(Math.random() * (width - 2));
      const treasureZ = z + (Math.random() < 0.5 ? 1 : -1) * Math.floor(Math.random() * (length - 2));
      
      this.setBlock(blockSetter, treasureX, y, treasureZ, { type: 'chest', metadata: { loot: 'ocean_ruin' } });
      
      // Hide chest with some blocks on top
      for (let i = 0; i < 3; i++) {
        this.setBlock(blockSetter, treasureX, y + i + 1, treasureZ, chooseMaterial());
      }
    } else {
      // Small ruins have a 30% chance of a chest
      if (Math.random() < 0.3) {
        const chestX = x + Math.floor(Math.random() * 3) - 1;
        const chestZ = z + Math.floor(Math.random() * 3) - 1;
        
        this.setBlock(blockSetter, chestX, y, chestZ, { type: 'chest', metadata: { loot: 'ocean_ruin' } });
      }
    }
    
    // Occasionally add a drowned zombie
    if (Math.random() < 0.4) {
      const drownedCount = size === 'large' ? 1 + Math.floor(Math.random() * 2) : 1;
      
      const spawns = [];
      for (let i = 0; i < drownedCount; i++) {
        const spawnX = x + Math.floor(Math.random() * (width*2-2)) - (width-1);
        const spawnZ = z + Math.floor(Math.random() * (length*2-2)) - (length-1);
        
        spawns.push({ x: spawnX, y: y + 1, z: spawnZ });
      }
      
      // Return mob spawns
      return {
        type: 'ocean_ruin',
        variant: type,
        size,
        position: { x, y, z },
        size: { width: width * 2, height, depth: length * 2 },
        mobSpawns: {
          'drowned': spawns
        }
      };
    }
    
    return {
      type: 'ocean_ruin',
      variant: type,
      size,
      position: { x, y, z },
      size: { width: width * 2, height, depth: length * 2 }
    };
  }

  /**
   * Generate a ruined portal structure
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {string} dimension - Dimension ('overworld' or 'nether')
   * @param {Object} options - Generation options
   * @returns {Object} Structure blocks and entities
   */
  generateRuinedPortal(x, y, z, dimension, options = {}) {
    // Structure container
    const structure = {
      blocks: {},
      entities: [],
      position: { x, y, z },
      type: 'ruined_portal'
    };
    
    // Default options
    const defaults = {
      size: 'medium', // small, medium, large
      decay: 0.7,     // 0-1, higher means more decay
      buried: dimension === 'overworld' ? Math.random() < 0.5 : false, // 50% chance in overworld, never in nether
      tilted: Math.random() < 0.3, // 30% chance to be tilted
      hasChest: Math.random() < 0.75, // 75% chance to have a chest
      seed: Math.floor(Math.random() * 10000)
    };
    
    // Merge with provided options
    const config = { ...defaults, ...options };
    
    // Set random number generator with seed
    let rng = this.createRNG(config.seed);
    
    // Determine portal size
    let portalWidth, portalHeight;
    
    switch (config.size) {
      case 'small':
        portalWidth = 4;
        portalHeight = 5;
        break;
      case 'large':
        portalWidth = 6;
        portalHeight = 7;
        break;
      case 'medium':
      default:
        portalWidth = 5;
        portalHeight = 6;
        break;
    }
    
    // Determine base material based on dimension
    const baseMaterial = dimension === 'overworld' 
      ? (rng() < 0.5 ? 'stone_bricks' : 'cobblestone')
      : (rng() < 0.5 ? 'blackstone' : 'basalt');
    
    // Array for possible decorative blocks
    const decorativeBlocks = dimension === 'overworld'
      ? ['mossy_stone_bricks', 'cracked_stone_bricks', 'iron_bars', 'vine']
      : ['gilded_blackstone', 'polished_blackstone', 'blackstone', 'chain'];
    
    // Create the base platform
    const platformWidth = portalWidth + 4;
    const platformDepth = 4;
    
    // Calculate offset due to tilting
    let tiltOffsetX = 0;
    let tiltOffsetZ = 0;
    let tiltAngle = 0;
    
    if (config.tilted) {
      // Determine tilt direction and angle
      tiltAngle = (rng() * Math.PI / 6) - (Math.PI / 12); // -15 to +15 degrees
      if (rng() < 0.5) {
        // Tilt along X axis
        tiltOffsetZ = Math.sin(tiltAngle) * portalHeight;
      } else {
        // Tilt along Z axis
        tiltOffsetX = Math.sin(tiltAngle) * portalHeight;
      }
    }
    
    // Generate portal frame
    const frameBlocks = this.generatePortalFrame(
      structure,
      x, y, z,
      portalWidth, portalHeight,
      { 
        obsidianDecay: config.decay * 0.7,
        tiltOffsetX,
        tiltOffsetZ,
        tiltAngle
      }
    );
    
    // Generate surrounding structure
    this.generatePortalSurroundings(
      structure,
      x, y, z,
      portalWidth, portalHeight,
      platformWidth, platformDepth,
      {
        baseMaterial,
        decorativeBlocks,
        decay: config.decay,
        buried: config.buried,
        dimension
      }
    );
    
    // Add chest with loot if configured
    if (config.hasChest) {
      const chestX = x + (rng() < 0.5 ? -2 : platformWidth + 1);
      const chestZ = z + Math.floor(rng() * platformDepth);
      const chestY = y - (config.buried ? Math.floor(rng() * 2) : 0);
      
      structure.blocks[`${chestX},${chestY},${chestZ}`] = {
        type: 'chest',
        loot_table: 'ruined_portal'
      };
      
      // Add some gold blocks or netherrack nearby
      const goldCount = Math.floor(rng() * 3);
      for (let i = 0; i < goldCount; i++) {
        const goldX = chestX + Math.floor(rng() * 3) - 1;
        const goldZ = chestZ + Math.floor(rng() * 3) - 1;
        const goldY = chestY + (rng() < 0.3 ? 1 : 0);
        
        if (!structure.blocks[`${goldX},${goldY},${goldZ}`]) {
          structure.blocks[`${goldX},${goldY},${goldZ}`] = {
            type: dimension === 'overworld' ? 'gold_block' : 'gilded_blackstone'
          };
        }
      }
    }
    
    // Add some netherrack and fire for atmosphere
    const netherrackCount = Math.floor(5 + rng() * 5);
    for (let i = 0; i < netherrackCount; i++) {
      const nx = x + Math.floor(rng() * platformWidth);
      const nz = z + Math.floor(rng() * platformDepth);
      const ny = y + (config.buried ? -1 : 0);
      
      // Add netherrack
      const blockKey = `${nx},${ny},${nz}`;
      if (!structure.blocks[blockKey]) {
        structure.blocks[blockKey] = { type: 'netherrack' };
        
        // Sometimes add fire on top
        if (rng() < 0.4) {
          const fireKey = `${nx},${ny + 1},${nz}`;
          if (!structure.blocks[fireKey]) {
            structure.blocks[fireKey] = { type: 'fire' };
          }
        }
      }
    }
    
    // Add magma blocks in nether version
    if (dimension === 'nether') {
      const magmaCount = Math.floor(3 + rng() * 5);
      for (let i = 0; i < magmaCount; i++) {
        const mx = x + Math.floor(rng() * platformWidth);
        const mz = z + Math.floor(rng() * platformDepth);
        const my = y - 1;
        
        const blockKey = `${mx},${my},${mz}`;
        if (!structure.blocks[blockKey]) {
          structure.blocks[blockKey] = { type: 'magma_block' };
        }
      }
    }
    
    // If buried, add blocks above the structure
    if (config.buried) {
      const buryDepth = Math.floor(2 + rng() * 3);
      const surfaceMaterial = dimension === 'overworld' 
        ? (rng() < 0.5 ? 'dirt' : 'stone')
        : (rng() < 0.5 ? 'netherrack' : 'soul_soil');
      
      // Add blocks above
      for (let dy = 1; dy <= buryDepth; dy++) {
        for (let dx = -1; dx <= platformWidth + 1; dx++) {
          for (let dz = -1; dz <= platformDepth + 1; dz++) {
            const bx = x + dx;
            const by = y + dy;
            const bz = z + dz;
            
            // Skip if there's already a block here
            const blockKey = `${bx},${by},${bz}`;
            if (structure.blocks[blockKey]) continue;
            
            // Add with decay (more blocks missing higher up)
            if (rng() < (config.decay * 0.5 * dy / buryDepth)) continue;
            
            structure.blocks[blockKey] = { type: surfaceMaterial };
          }
        }
      }
    }
    
    return structure;
  }

  /**
   * Helper method to generate the obsidian portal frame
   * @private
   */
  generatePortalFrame(structure, x, y, z, width, height, options) {
    const { obsidianDecay, tiltOffsetX, tiltOffsetZ, tiltAngle } = options;
    
    const frameBlocks = {};
    
    // Function to calculate tilted coordinates
    const getTiltedCoords = (dx, dy, dz) => {
      if (tiltOffsetX !== 0) {
        // Tilt along Z axis
        const tiltedX = dx;
        const tiltedY = dy + (tiltOffsetX * (dx / width));
        const tiltedZ = dz;
        return { x: Math.round(tiltedX), y: Math.round(tiltedY), z: Math.round(tiltedZ) };
      } else if (tiltOffsetZ !== 0) {
        // Tilt along X axis
        const tiltedX = dx;
        const tiltedY = dy + (tiltOffsetZ * (dz / 4));
        const tiltedZ = dz;
        return { x: Math.round(tiltedX), y: Math.round(tiltedY), z: Math.round(tiltedZ) };
      }
      return { x: dx, y: dy, z: dz };
    };
    
    // Generate the frame
    for (let dx = 0; dx < width; dx++) {
      for (let dy = 0; dy < height; dy++) {
        // Only add blocks for the frame border
        const isFrame = dx === 0 || dx === width - 1 || dy === 0 || dy === height - 1;
        if (!isFrame) continue;
        
        // Get tilted coordinates
        const coords = getTiltedCoords(dx, dy, 0);
        
        // Calculate block position
        const bx = x + coords.x;
        const by = y + coords.y;
        const bz = z + coords.z;
        
        // Skip based on decay factor
        if (Math.random() < obsidianDecay) continue;
        
        // Add the block
        const blockKey = `${bx},${by},${bz}`;
        structure.blocks[blockKey] = { type: 'obsidian' };
        frameBlocks[blockKey] = true;
      }
    }
    
    return frameBlocks;
  }

  /**
   * Helper method to generate surroundings for the portal
   * @private
   */
  generatePortalSurroundings(structure, x, y, z, portalWidth, portalHeight, platformWidth, platformDepth, options) {
    const { baseMaterial, decorativeBlocks, decay, buried, dimension } = options;
    
    // Generate base platform
    for (let dx = -2; dx <= portalWidth + 1; dx++) {
      for (let dz = -2; dz <= platformDepth + 1; dz++) {
        // Skip center where portal is
        if (dx >= 0 && dx < portalWidth && dz === 0) continue;
        
        const bx = x + dx;
        const by = y - 1;
        const bz = z + dz;
        
        // Skip based on decay factor
        if (Math.random() < decay * 0.5) continue;
        
        // Add the block, sometimes use decorative variants
        const useDecorative = Math.random() < 0.3;
        const blockType = useDecorative ? 
          decorativeBlocks[Math.floor(Math.random() * decorativeBlocks.length)] : 
          baseMaterial;
        
        structure.blocks[`${bx},${by},${bz}`] = { type: blockType };
      }
    }
    
    // Generate some walls and decorative elements
    for (let dx = -1; dx <= portalWidth; dx++) {
      for (let dy = 0; dy < portalHeight; dy++) {
        // Skip the portal frame
        if (dx >= 0 && dx < portalWidth && dy < portalHeight) continue;
        
        // Add side decorations with more decay
        if (Math.random() < decay * 0.8) continue;
        
        const bx = x + dx;
        const by = y + dy;
        const bz = z - 1; // Wall in front
        
        // Add the block, sometimes use decorative variants
        const useDecorative = Math.random() < 0.4;
        const blockType = useDecorative ? 
          decorativeBlocks[Math.floor(Math.random() * decorativeBlocks.length)] : 
          baseMaterial;
        
        structure.blocks[`${bx},${by},${bz}`] = { type: blockType };
      }
    }
    
    // Add some blocks behind the portal
    for (let dx = -1; dx <= portalWidth; dx++) {
      for (let dy = 0; dy < Math.ceil(portalHeight * 0.7); dy++) {
        // Skip based on decay factor
        if (Math.random() < decay * 0.6) continue;
        
        const bx = x + dx;
        const by = y + dy;
        const bz = z + 1; // Wall behind
        
        // Add the block, sometimes use decorative variants
        const useDecorative = Math.random() < 0.3;
        const blockType = useDecorative ? 
          decorativeBlocks[Math.floor(Math.random() * decorativeBlocks.length)] : 
          baseMaterial;
        
        structure.blocks[`${bx},${by},${bz}`] = { type: blockType };
      }
    }
  }
}

module.exports = StructureGenerator; 