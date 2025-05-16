/**
 * Structure Generator - Handles generation of predefined structures in the world
 */
const VillageGenerator = require('./villageGenerator');
const AncientCityGenerator = require('./structures/ancientCityGenerator');

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
   * Set entity spawner function
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
    this.registerStructure('ancient_city', this.generateAncientCity);
    
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
    
    // Add interior chambers and traps (simplified)
    this.setBlock(blockSetter, x, y + 2, z, { type: 'chest', metadata: { loot: 'desert_pyramid' } });
    
    return {
      type: 'desert_pyramid',
      position: { x, y, z },
      size: { width: size * 2 + 1, height: size, depth: size * 2 + 1 }
    };
  }
  
  /**
   * Generate small ruins
   * @param {Object} position - Position to generate the ruins
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateSmallRuin(position, options, blockSetter) {
    const { x, y, z } = position;
    const { size = 5, style = 'stone' } = options;
    
    // Materials based on style
    const materials = {
      stone: ['cobblestone', 'mossy_cobblestone', 'stone_bricks'],
      sandstone: ['sandstone', 'cut_sandstone', 'smooth_sandstone'],
      prismarine: ['prismarine', 'prismarine_bricks', 'dark_prismarine']
    };
    
    const blockTypes = materials[style] || materials.stone;
    
    // Generate foundation
    for (let dx = -size; dx <= size; dx++) {
      for (let dz = -size; dz <= size; dz++) {
        if (Math.abs(dx) === size || Math.abs(dz) === size) continue; // Skip outer edge
        
        const blockType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
        this.setBlock(blockSetter, x + dx, y, z + dz, { type: blockType });
      }
    }
    
    // Generate partial walls
    for (let dx = -size + 1; dx <= size - 1; dx++) {
      for (let dz = -size + 1; dz <= size - 1; dz++) {
        if (Math.abs(dx) !== size - 1 && Math.abs(dz) !== size - 1) continue; // Only place on edges
        
        if (Math.random() < 0.7) { // 70% chance for a wall block
          const height = Math.floor(Math.random() * 3) + 1; // Wall height 1-3
          
          for (let h = 1; h <= height; h++) {
            const blockType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
            this.setBlock(blockSetter, x + dx, y + h, z + dz, { type: blockType });
          }
        }
      }
    }
    
    // Add some decoration
    if (Math.random() < 0.3) { // 30% chance for a chest
      this.setBlock(blockSetter, x, y + 1, z, { type: 'chest', metadata: { loot: 'small_ruin' } });
    }
    
    return {
      type: 'small_ruin',
      position: { x, y, z },
      size: { width: size * 2 + 1, height: 4, depth: size * 2 + 1 }
    };
  }
  
  /**
   * Generate a witch hut
   * @param {Object} position - Position to generate the witch hut
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateWitchHut(position, options, blockSetter) {
    const { x, y, z } = position;
    
    // Platform
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        this.setBlock(blockSetter, x + dx, y, z + dz, { type: 'oak_planks' });
      }
    }
    
    // Walls
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
          this.setBlock(blockSetter, x + dx, y + 1, z + dz, { type: 'spruce_planks' });
          this.setBlock(blockSetter, x + dx, y + 2, z + dz, { type: 'spruce_planks' });
        }
      }
    }
    
    // Door
    this.setBlock(blockSetter, x, y + 1, z + 2, { type: 'air' }); // Door opening
    
    // Roof
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        this.setBlock(blockSetter, x + dx, y + 3, z + dz, { type: 'spruce_planks' });
      }
    }
    
    // Interior
    this.setBlock(blockSetter, x, y + 1, z, { type: 'crafting_table' });
    this.setBlock(blockSetter, x + 1, y + 1, z, { type: 'cauldron' });
    
    // Spawn the witch if entity spawner is set
    if (this.entitySpawner) {
      this.entitySpawner('witch', { x, y: y + 1, z }, { patrolArea: 5 });
    }
    
    return {
      type: 'witch_hut',
      position: { x, y, z },
      size: { width: 7, height: 4, depth: 7 }
    };
  }
  
  /**
   * Generate a dungeon
   * @param {Object} position - Position to generate the dungeon
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateDungeon(position, options, blockSetter) {
    const { x, y, z } = position;
    const { width = 7, height = 4, depth = 7, type = 'zombie' } = options;
    
    // Solid walls
    for (let dx = -Math.floor(width/2); dx <= Math.floor(width/2); dx++) {
      for (let dy = 0; dy < height; dy++) {
        for (let dz = -Math.floor(depth/2); dz <= Math.floor(depth/2); dz++) {
          // If it's the edge, place mossy or regular cobblestone
          if (dx === -Math.floor(width/2) || dx === Math.floor(width/2) || 
              dy === 0 || dy === height - 1 || 
              dz === -Math.floor(depth/2) || dz === Math.floor(depth/2)) {
            
            const blockType = Math.random() < 0.4 ? 'mossy_cobblestone' : 'cobblestone';
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, { type: blockType });
          } else {
            // Empty space inside
            this.setBlock(blockSetter, x + dx, y + dy, z + dz, { type: 'air' });
          }
        }
      }
    }
    
    // Place spawner in center
    this.setBlock(blockSetter, x, y + 1, z, { 
      type: 'mob_spawner', 
      metadata: { entityType: type } 
    });
    
    // Add chest
    const chestX = x + (Math.random() < 0.5 ? 1 : -1) * Math.floor(Math.random() * (Math.floor(width/2) - 1) + 1);
    const chestZ = z + (Math.random() < 0.5 ? 1 : -1) * Math.floor(Math.random() * (Math.floor(depth/2) - 1) + 1);
    
    this.setBlock(blockSetter, chestX, y + 1, chestZ, {
      type: 'chest',
      metadata: { loot: 'dungeon' }
    });
    
    return {
      type: 'dungeon',
      position: { x, y, z },
      size: { width, height, depth }
    };
  }
  
  /**
   * Generate ocean ruins
   * @param {Object} position - Position to generate the ruins
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateOceanRuins(position, options, blockSetter) {
    const { x, y, z } = position;
    const { style = 'stone' } = options;
    
    // Choose blocks based on style
    const mainBlock = style === 'warm' ? 'sandstone' : 'stone_bricks';
    const accentBlock = style === 'warm' ? 'cut_sandstone' : 'mossy_stone_bricks';
    
    // Generate simple ruin structure (e.g., a partially destroyed 'L' shape)
    const width = 7;
    const depth = 9;
    
    // Foundation floor
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth; dz++) {
        if (dx < 4 || dz < 4) { // L shape
          const useAccent = Math.random() < 0.3; // 30% chance for accent block
          this.setBlock(blockSetter, x + dx, y, z + dz, { 
            type: useAccent ? accentBlock : mainBlock 
          });
        }
      }
    }
    
    // Partial walls
    const wallHeight = Math.floor(Math.random() * 2) + 2; // 2-3 blocks high
    
    // First wall section
    for (let dx = 0; dx < 4; dx++) {
      for (let dy = 1; dy < wallHeight; dy++) {
        if (Math.random() < 0.7) { // 70% chance to place a block (weathered look)
          const useAccent = Math.random() < 0.3;
          this.setBlock(blockSetter, x + dx, y + dy, z, { 
            type: useAccent ? accentBlock : mainBlock 
          });
        }
      }
    }
    
    // Second wall section
    for (let dz = 0; dz < 4; dz++) {
      for (let dy = 1; dy < wallHeight; dy++) {
        if (Math.random() < 0.7) {
          const useAccent = Math.random() < 0.3;
          this.setBlock(blockSetter, x, y + dy, z + dz, { 
            type: useAccent ? accentBlock : mainBlock 
          });
        }
      }
    }
    
    // Add a chest with some loot occasionally
    if (Math.random() < 0.4) {
      this.setBlock(blockSetter, x + 2, y + 1, z + 2, {
        type: 'chest',
        metadata: { 
          loot: 'ocean_ruins',
          waterlogged: true
        }
      });
    }
    
    // Add some decoration (e.g., coral if warm, seagrass, etc.)
    if (style === 'warm') {
      const coralTypes = ['fire_coral', 'brain_coral', 'tube_coral', 'bubble_coral', 'horn_coral'];
      
      for (let i = 0; i < 5; i++) {
        const dx = Math.floor(Math.random() * width);
        const dz = Math.floor(Math.random() * depth);
        if (dx < 4 || dz < 4) { // Only place on the L shape
          const coralType = coralTypes[Math.floor(Math.random() * coralTypes.length)];
          this.setBlock(blockSetter, x + dx, y + 1, z + dz, { type: coralType });
        }
      }
    } else {
      // Add some seagrass and other decorations for cold ruins
      for (let i = 0; i < 8; i++) {
        const dx = Math.floor(Math.random() * width);
        const dz = Math.floor(Math.random() * depth);
        if (dx < 4 || dz < 4) {
          this.setBlock(blockSetter, x + dx, y + 1, z + dz, { 
            type: Math.random() < 0.7 ? 'seagrass' : 'tall_seagrass' 
          });
        }
      }
    }
    
    return {
      type: 'ocean_ruins',
      position: { x, y, z },
      size: { width, height: wallHeight, depth },
      style
    };
  }
  
  /**
   * Generate a village
   * @param {Object} position - Position to generate the village
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateVillage(position, options, blockSetter) {
    // Use the village generator to create the village
    return this.villageGenerator.generateVillage(position, options, blockSetter, this.entitySpawner);
  }
  
  /**
   * Generate a stronghold
   * @param {Object} position - Position to generate the stronghold
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateStronghold(position, options, blockSetter) {
    // Placeholder for future implementation
    const { x, y, z } = position;
    
    // Just generate a small marker structure for now
    this.setBlock(blockSetter, x, y, z, { type: 'end_portal_frame' });
    this.setBlock(blockSetter, x, y + 1, z, { type: 'end_stone' });
    
    return {
      type: 'stronghold',
      position: { x, y, z },
      size: { width: 1, height: 2, depth: 1 }
    };
  }
  
  /**
   * Generate a mineshaft
   * @param {Object} position - Position to generate the mineshaft
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Structure data
   */
  generateMineshaft(position, options, blockSetter) {
    // Placeholder for future implementation
    const { x, y, z } = position;
    
    // Just generate a small marker structure for now
    this.setBlock(blockSetter, x, y, z, { type: 'rail' });
    this.setBlock(blockSetter, x + 1, y, z, { type: 'rail' });
    this.setBlock(blockSetter, x - 1, y, z, { type: 'rail' });
    
    return {
      type: 'mineshaft',
      position: { x, y, z },
      size: { width: 3, height: 1, depth: 1 }
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
    // Placeholder for future implementation
    const { x, y, z } = position;
    
    // Just generate a small marker structure for now
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        this.setBlock(blockSetter, x + dx, y, z + dz, { type: 'prismarine' });
      }
    }
    this.setBlock(blockSetter, x, y + 1, z, { type: 'sea_lantern' });
    
    return {
      type: 'ocean_monument',
      position: { x, y, z },
      size: { width: 3, height: 2, depth: 3 }
    };
  }
  
  /**
   * Generate an Ancient City structure
   * @param {Object} position - Position to generate the structure
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} Generated structure data
   */
  generateAncientCity(position, options, blockSetter) {
    // Initialize Ancient City Generator if not already created
    if (!this.ancientCityGenerator) {
      this.ancientCityGenerator = new AncientCityGenerator({ seed: this.seed });
    }
    
    // Use the Ancient City Generator to create the structure
    return this.ancientCityGenerator.generateAncientCity(
      position,
      options,
      blockSetter,
      this.entitySpawner
    );
  }
}

module.exports = StructureGenerator; 