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
   * Placeholder for stronghold generation
   * @param {Object} position - Position to generate the stronghold
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateStronghold(position, options, blockSetter) {
    // In a real implementation, this would be much more complex
    const { x, y, z } = position;
    
    // For now, just place a simple marker block
    this.setBlock(blockSetter, x, y, z, { type: 'end_portal_frame', metadata: { structureType: 'stronghold' } });
    
    return {
      type: 'stronghold',
      position: { x, y, z },
      size: { width: 1, height: 1, depth: 1 }
    };
  }
  
  /**
   * Placeholder for mineshaft generation
   * @param {Object} position - Position to generate the mineshaft
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateMineshaft(position, options, blockSetter) {
    // In a real implementation, this would be much more complex
    const { x, y, z } = position;
    
    // For now, just place a simple marker block
    this.setBlock(blockSetter, x, y, z, { type: 'rail', metadata: { structureType: 'mineshaft' } });
    
    return {
      type: 'mineshaft',
      position: { x, y, z },
      size: { width: 1, height: 1, depth: 1 }
    };
  }
  
  /**
   * Generate an ocean monument
   * @param {Object} position - Position to generate the monument
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateOceanMonument(position, options, blockSetter) {
    const { x, y, z } = position;
    
    // Adjust the position to ensure it's underwater
    const monumentY = Math.min(y, 60 - 15); // Monument should be fully underwater
    
    // Main building materials
    const primaryMaterial = { type: 'prismarine' };
    const secondaryMaterial = { type: 'prismarine_bricks' };
    const accentMaterial = { type: 'dark_prismarine' };
    const lightMaterial = { type: 'sea_lantern' };
    const waterMaterial = { type: 'water' };
    
    // Monument dimensions
    const width = 21;
    const height = 18;
    const depth = 21;
    
    // Generate the monument base
    this.generateOceanMonumentBase(x, monumentY, z, width, depth, primaryMaterial, secondaryMaterial, accentMaterial, blockSetter);
    
    // Generate the monument interior
    this.generateOceanMonumentInterior(x, monumentY, z, width, height, depth, primaryMaterial, secondaryMaterial, lightMaterial, waterMaterial, blockSetter);
    
    // Generate the monument roof and spires
    this.generateOceanMonumentRoof(x, monumentY + 12, z, width, depth, primaryMaterial, secondaryMaterial, accentMaterial, lightMaterial, blockSetter);
    
    // Spawn guardians if entity spawner is available
    if (this.entitySpawner) {
      // Spawn regular guardians
      for (let i = 0; i < 6; i++) {
        const guardianX = x + (Math.random() * 16) - 8;
        const guardianY = monumentY + 5 + (Math.random() * 8);
        const guardianZ = z + (Math.random() * 16) - 8;
        
        this.entitySpawner({
          type: 'guardian',
          position: { x: guardianX, y: guardianY, z: guardianZ }
        });
      }
      
      // Spawn an elder guardian in the center
      this.entitySpawner({
        type: 'elder_guardian',
        position: { x, y: monumentY + 8, z }
      });
    }
    
    return {
      type: 'ocean_monument',
      position: { x, y: monumentY, z },
      size: { width, height, depth },
      significantStructure: true
    };
  }
  
  /**
   * Generate the base of an ocean monument
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} width - Monument width
   * @param {number} depth - Monument depth
   * @param {Object} primaryMaterial - Primary building material
   * @param {Object} secondaryMaterial - Secondary building material
   * @param {Object} accentMaterial - Accent building material
   * @param {Function} blockSetter - Function to set blocks
   */
  generateOceanMonumentBase(x, y, z, width, depth, primaryMaterial, secondaryMaterial, accentMaterial, blockSetter) {
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Generate a platform as the base
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dz = -halfDepth; dz <= halfDepth; dz++) {
        // Use primary material for the base
        this.setBlock(blockSetter, x + dx, y, z + dz, primaryMaterial);
        
        // Add a layer of secondary material for the floor
        this.setBlock(blockSetter, x + dx, y + 1, z + dz, secondaryMaterial);
        
        // Add accent border around the edges
        if (Math.abs(dx) === halfWidth || Math.abs(dz) === halfDepth) {
          for (let dy = 1; dy <= 3; dy++) {
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, accentMaterial);
          }
        }
      }
    }
    
    // Create entrance steps
    for (let step = 0; step < 3; step++) {
      for (let i = -2; i <= 2; i++) {
        this.setBlock(blockSetter, x + i, y - step, z + halfDepth + step + 1, primaryMaterial);
      }
    }
  }
  
  /**
   * Generate the interior of an ocean monument
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} width - Monument width
   * @param {number} height - Monument height
   * @param {number} depth - Monument depth
   * @param {Object} primaryMaterial - Primary building material
   * @param {Object} secondaryMaterial - Secondary building material
   * @param {Object} lightMaterial - Light material
   * @param {Object} waterMaterial - Water material
   * @param {Function} blockSetter - Function to set blocks
   */
  generateOceanMonumentInterior(x, y, z, width, height, depth, primaryMaterial, secondaryMaterial, lightMaterial, waterMaterial, blockSetter) {
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Generate walls
    for (let dx = -halfWidth + 1; dx <= halfWidth - 1; dx++) {
      for (let dz = -halfDepth + 1; dz <= halfDepth - 1; dz++) {
        // Skip the inside of the monument (fill with water later)
        if (Math.abs(dx) < halfWidth - 1 && Math.abs(dz) < halfDepth - 1) {
          continue;
        }
        
        // Build walls
        for (let dy = 2; dy < height - 3; dy++) {
          this.setBlock(blockSetter, x + dx, y + dy, z + dz, primaryMaterial);
          
          // Add decorative windows at regular intervals
          if ((dy % 3 === 0) && (Math.abs(dx) === halfWidth - 1 || Math.abs(dz) === halfDepth - 1)) {
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, secondaryMaterial);
          }
        }
      }
    }
    
    // Create central chambers and hallways
    this.createCentralChamber(x, y + 4, z, primaryMaterial, secondaryMaterial, lightMaterial, waterMaterial, blockSetter);
    
    // Fill interior with water
    for (let dx = -halfWidth + 2; dx <= halfWidth - 2; dx++) {
      for (let dy = 2; dy < height - 4; dy++) {
        for (let dz = -halfDepth + 2; dz <= halfDepth - 2; dz++) {
          // Skip areas where chambers and hallways are built
          if (Math.abs(dx) < 3 && Math.abs(dz) < 3 && dy >= 4 && dy <= 8) {
            continue;
          }
          
          this.setBlock(blockSetter, x + dx, y + dy, z + dz, waterMaterial);
        }
      }
    }
    
    // Add decorative light sources
    for (let dx = -halfWidth + 3; dx <= halfWidth - 3; dx += 4) {
      for (let dz = -halfDepth + 3; dz <= halfDepth - 3; dz += 4) {
        this.setBlock(blockSetter, x + dx, y + 3, z + dz, lightMaterial);
        this.setBlock(blockSetter, x + dx, y + height - 5, z + dz, lightMaterial);
      }
    }
  }
  
  /**
   * Create a central chamber in the ocean monument
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} primaryMaterial - Primary building material
   * @param {Object} secondaryMaterial - Secondary building material
   * @param {Object} lightMaterial - Light material
   * @param {Object} waterMaterial - Water material
   * @param {Function} blockSetter - Function to set blocks
   */
  createCentralChamber(x, y, z, primaryMaterial, secondaryMaterial, lightMaterial, waterMaterial, blockSetter) {
    // Create a 5x5x5 chamber
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = 0; dy <= 4; dy++) {
        for (let dz = -2; dz <= 2; dz++) {
          // If it's a wall block
          if (Math.abs(dx) === 2 || Math.abs(dz) === 2 || dy === 0 || dy === 4) {
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, secondaryMaterial);
          } else {
            // Interior is water
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, waterMaterial);
          }
        }
      }
    }
    
    // Add light sources in the corners
    this.setBlock(blockSetter, x + 2, y + 1, z + 2, lightMaterial);
    this.setBlock(blockSetter, x - 2, y + 1, z + 2, lightMaterial);
    this.setBlock(blockSetter, x + 2, y + 1, z - 2, lightMaterial);
    this.setBlock(blockSetter, x - 2, y + 1, z - 2, lightMaterial);
    
    // Add a decorative centerpiece
    this.setBlock(blockSetter, x, y + 1, z, primaryMaterial);
    this.setBlock(blockSetter, x, y + 2, z, lightMaterial);
    
    // Create doorways/passages in four directions
    // North
    this.setBlock(blockSetter, x, y + 1, z - 2, waterMaterial);
    this.setBlock(blockSetter, x, y + 2, z - 2, waterMaterial);
    // South
    this.setBlock(blockSetter, x, y + 1, z + 2, waterMaterial);
    this.setBlock(blockSetter, x, y + 2, z + 2, waterMaterial);
    // East
    this.setBlock(blockSetter, x + 2, y + 1, z, waterMaterial);
    this.setBlock(blockSetter, x + 2, y + 2, z, waterMaterial);
    // West
    this.setBlock(blockSetter, x - 2, y + 1, z, waterMaterial);
    this.setBlock(blockSetter, x - 2, y + 2, z, waterMaterial);
  }
  
  /**
   * Generate the roof and spires of an ocean monument
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate (roof level)
   * @param {number} z - Z coordinate
   * @param {number} width - Monument width
   * @param {number} depth - Monument depth
   * @param {Object} primaryMaterial - Primary building material
   * @param {Object} secondaryMaterial - Secondary building material
   * @param {Object} accentMaterial - Accent building material
   * @param {Object} lightMaterial - Light material
   * @param {Function} blockSetter - Function to set blocks
   */
  generateOceanMonumentRoof(x, y, z, width, depth, primaryMaterial, secondaryMaterial, accentMaterial, lightMaterial, blockSetter) {
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Create a flat roof
    for (let dx = -halfWidth + 1; dx <= halfWidth - 1; dx++) {
      for (let dz = -halfDepth + 1; dz <= halfDepth - 1; dz++) {
        this.setBlock(blockSetter, x + dx, y, z + dz, secondaryMaterial);
      }
    }
    
    // Add decorative elements to the roof
    for (let dx = -halfWidth + 3; dx <= halfWidth - 3; dx += 5) {
      for (let dz = -halfDepth + 3; dz <= halfDepth - 3; dz += 5) {
        this.setBlock(blockSetter, x + dx, y + 1, z + dz, accentMaterial);
        
        // Create small spires at regular intervals
        if ((dx === 0 || dz === 0) && !(dx === 0 && dz === 0)) {
          for (let dy = 1; dy <= 3; dy++) {
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, primaryMaterial);
          }
          this.setBlock(blockSetter, x + dx, y + 4, z + dz, accentMaterial);
        }
      }
    }
    
    // Create main central spire
    for (let dy = 1; dy <= 5; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dz === 0) {
            this.setBlock(blockSetter, x, y + dy, z, secondaryMaterial);
          } else {
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, primaryMaterial);
          }
        }
      }
    }
    
    // Add a light at the top of the central spire
    this.setBlock(blockSetter, x, y + 6, z, lightMaterial);
    
    // Add smaller corner spires
    const cornerSpires = [
      { dx: halfWidth - 3, dz: halfDepth - 3 },
      { dx: halfWidth - 3, dz: -(halfDepth - 3) },
      { dx: -(halfWidth - 3), dz: halfDepth - 3 },
      { dx: -(halfWidth - 3), dz: -(halfDepth - 3) }
    ];
    
    for (const spire of cornerSpires) {
      for (let dy = 1; dy <= 3; dy++) {
        this.setBlock(blockSetter, x + spire.dx, y + dy, z + spire.dz, primaryMaterial);
      }
      this.setBlock(blockSetter, x + spire.dx, y + 4, z + spire.dz, accentMaterial);
    }
  }
}

module.exports = StructureGenerator; 