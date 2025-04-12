/**
 * WorldGenerator handles procedural world generation using noise-based algorithms
 * and the BiomeManager for biome selection and terrain features.
 */

const { createTerrainNoiseGenerators, createClimateNoiseGenerators } = require('./noiseGenerator');
const BiomeManager = require('../biomes/biomeManager');
const BiomeRegistry = require('../biomes/biomeRegistry');
const StructureGenerator = require('./structureGenerator');

class WorldGenerator {
  /**
   * Create a new WorldGenerator
   * @param {Object} options - Generator options
   * @param {number} options.seed - World seed for noise generation
   * @param {number} options.seaLevel - Sea level height (default: 63)
   * @param {number} options.worldHeight - Maximum world height (default: 256)
   * @param {number} options.worldDepth - Minimum world depth (default: 0)
   * @param {BiomeManager} options.biomeManager - Biome manager instance (will create one if not provided)
   * @param {Object} options.generationSettings - Additional world generation settings
   */
  constructor(options = {}) {
    // Store world seed
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    
    // World dimensions
    this.seaLevel = options.seaLevel || 63;
    this.worldHeight = options.worldHeight || 256;
    this.worldDepth = options.worldDepth || 0;
    
    // Create terrain noise generators with the world seed
    this.terrainNoiseGenerators = createTerrainNoiseGenerators(this.seed);
    
    // Create climate noise generators with a different seed to make climate independent of terrain
    this.climateNoiseGenerators = createClimateNoiseGenerators(this.seed + 12345);
    
    // Set up the biome manager - use provided one or create a new one
    this.biomeManager = options.biomeManager || this.createBiomeManager();
    
    // Create a structure generator with the world seed
    this.structureGenerator = new StructureGenerator({ seed: this.seed });
    
    // Generation settings
    this.generationSettings = options.generationSettings || {
      generateCaves: true,
      generateStructures: true,
      generateDecorations: true,
      chunkSize: 16,
      generateBedrock: true
    };
    
    // Cache for generated chunks
    this.chunkCache = new Map();
    this.maxChunkCacheSize = 100; // Prevent memory issues
    
    // Structure placeholders - used to track structure locations
    this.structurePlaceholders = new Map();
  }

  /**
   * Create and configure a biome manager instance
   * @private
   * @returns {BiomeManager} - Configured biome manager
   */
  createBiomeManager() {
    // Get all biomes from the registry
    const biomes = BiomeRegistry.getAllBiomes();
    
    // Create a biome manager with noise generators and all registered biomes
    return new BiomeManager({
      biomes,
      noiseGenerators: {
        ...this.terrainNoiseGenerators,
        temperature: this.climateNoiseGenerators.temperature,
        precipitation: this.climateNoiseGenerators.precipitation,
        continentalness: this.climateNoiseGenerators.continentalness,
        erosion: this.climateNoiseGenerators.erosion,
        weirdness: this.climateNoiseGenerators.weirdness
      },
      blendRadius: 8 // Biome blend radius in blocks
    });
  }

  /**
   * Generate a chunk of terrain
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkZ - Chunk Z coordinate 
   * @returns {Object} - Generated blocks in the chunk
   */
  generateChunk(chunkX, chunkZ) {
    // Check cache first
    const cacheKey = `${chunkX},${chunkZ}`;
    if (this.chunkCache.has(cacheKey)) {
      return this.chunkCache.get(cacheKey);
    }
    
    const chunkBlocks = {};
    const chunkSize = this.generationSettings.chunkSize;
    
    // Calculate world coordinates
    const startX = chunkX * chunkSize;
    const startZ = chunkZ * chunkSize;
    
    // Generate base terrain
    this.generateBaseTerrain(chunkBlocks, startX, startZ, chunkSize);
    
    // Generate additional features
    if (this.generationSettings.generateCaves) {
      this.generateCaves(chunkBlocks, startX, startZ, chunkSize);
    }
    
    if (this.generationSettings.generateDecorations) {
      this.generateDecorations(chunkBlocks, startX, startZ, chunkSize);
    }
    
    if (this.generationSettings.generateStructures) {
      this.generateStructures(chunkBlocks, startX, startZ, chunkSize);
    }
    
    // Cache the generated chunk
    this.chunkCache.set(cacheKey, chunkBlocks);
    
    // Manage cache size
    if (this.chunkCache.size > this.maxChunkCacheSize) {
      // Remove oldest entries (first 10% of max size)
      const keysToDelete = Array.from(this.chunkCache.keys())
        .slice(0, Math.floor(this.maxChunkCacheSize * 0.1));
      
      keysToDelete.forEach(key => this.chunkCache.delete(key));
    }
    
    return chunkBlocks;
  }
  
  /**
   * Generate the base terrain for a chunk
   * @private
   * @param {Object} chunkBlocks - Block data to populate
   * @param {number} startX - Starting X coordinate
   * @param {number} startZ - Starting Z coordinate
   * @param {number} chunkSize - Size of chunk in blocks
   */
  generateBaseTerrain(chunkBlocks, startX, startZ, chunkSize) {
    // Generate base terrain based on biome heights and block types
    for (let x = 0; x < chunkSize; x++) {
      for (let z = 0; z < chunkSize; z++) {
        const worldX = startX + x;
        const worldZ = startZ + z;
        
        // Get terrain height and base block data for this position
        const height = Math.floor(this.biomeManager.getBlendedHeight(worldX, worldZ, this.seed));
        
        // Generate column from bedrock to surface
        for (let y = this.worldDepth; y <= height; y++) {
          // Get appropriate block for this position
          const block = this.biomeManager.getBlockAt(worldX, y, worldZ, this.seed);
          
          // Add block to chunk
          const key = `${worldX},${y},${worldZ}`;
          chunkBlocks[key] = block;
        }
        
        // Fill with water up to sea level if below sea level
        if (height < this.seaLevel) {
          for (let y = height + 1; y <= this.seaLevel; y++) {
            const key = `${worldX},${y},${worldZ}`;
            chunkBlocks[key] = { type: 'water' };
          }
        }
        
        // Add bedrock at the bottom of the world if enabled
        if (this.generationSettings.generateBedrock) {
          const bedrockKey = `${worldX},${this.worldDepth},${worldZ}`;
          chunkBlocks[bedrockKey] = { type: 'bedrock' };
        }
      }
    }
  }

  /**
   * Generate cave systems in a chunk
   * @private
   * @param {Object} chunkBlocks - Block data to modify
   * @param {number} startX - Starting X coordinate
   * @param {number} startZ - Starting Z coordinate
   * @param {number} chunkSize - Size of chunk in blocks
   */
  generateCaves(chunkBlocks, startX, startZ, chunkSize) {
    // Get cave noise functions
    const caveNoise = this.terrainNoiseGenerators.caveNoise;
    
    // Iterate through potential cave areas
    for (let x = 0; x < chunkSize; x++) {
      for (let z = 0; z < chunkSize; z++) {
        const worldX = startX + x;
        const worldZ = startZ + z;
        
        // Get surface height at this position
        const surfaceHeight = Math.floor(this.biomeManager.getBlendedHeight(worldX, worldZ, this.seed));
        
        // Generate caves only below ground level
        for (let y = this.worldDepth + 1; y < surfaceHeight - 1; y++) {
          // Skip if we're within 10 blocks of the world depth (preserve bedrock layer)
          if (y - this.worldDepth < 10) continue;
          
          // Calculate cave noise value for this position
          const noiseValue = caveNoise.get(worldX * 0.05, y * 0.05, worldZ * 0.05);
          
          // Lower density (higher threshold) near the surface
          const depthFactor = Math.min((surfaceHeight - y) / 20, 1.0);
          const threshold = 0.2 + (0.2 * depthFactor);
          
          // If noise value is above threshold, create a cave (air block)
          if (noiseValue > threshold) {
            const key = `${worldX},${y},${worldZ}`;
            
            // Only replace solid blocks, not water or other non-solid
            const currentBlock = chunkBlocks[key];
            if (currentBlock && currentBlock.type !== 'water' && currentBlock.type !== 'air') {
              chunkBlocks[key] = { type: 'air' };
            }
          }
        }
      }
    }
  }

  /**
   * Generate decorations (trees, plants, etc.) in a chunk
   * @private
   * @param {Object} chunkBlocks - Block data to modify
   * @param {number} startX - Starting X coordinate
   * @param {number} startZ - Starting Z coordinate
   * @param {number} chunkSize - Size of chunk in blocks
   */
  generateDecorations(chunkBlocks, startX, startZ, chunkSize) {
    // Add trees, plants, and other features
    for (let x = 0; x < chunkSize; x++) {
      for (let z = 0; z < chunkSize; z++) {
        const worldX = startX + x;
        const worldZ = startZ + z;
        
        // Get features to place at this position
        const features = this.biomeManager.getFeaturesAt(worldX, worldZ, this.seed);
        
        if (features && features.length > 0) {
          // Place all features
          for (const feature of features) {
            this.placeFeature(chunkBlocks, worldX, worldZ, feature);
          }
        }
      }
    }
  }

  /**
   * Place a feature (tree, plant, rock formation, etc.) at specified position
   * @private
   * @param {Object} chunkBlocks - Block data to modify
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Object} feature - Feature data to place
   */
  placeFeature(chunkBlocks, x, z, feature) {
    // Get surface height at this position
    const surfaceY = Math.floor(this.biomeManager.getBlendedHeight(x, z, this.seed));
    
    // Place different features based on type
    switch (feature.type) {
      case 'tree':
        this.placeTree(chunkBlocks, x, surfaceY + 1, z, feature);
        break;
        
      case 'plant':
        // Simple plant placement (1 block high)
        const plantKey = `${x},${surfaceY + 1},${z}`;
        chunkBlocks[plantKey] = { type: feature.blockType || 'plant' };
        break;
        
      case 'boulder':
        // Place a small boulder formation
        for (let bx = -1; bx <= 1; bx++) {
          for (let by = 0; by <= 1; by++) {
            for (let bz = -1; bz <= 1; bz++) {
              // Skip corners for a more natural shape
              if (Math.abs(bx) + Math.abs(by) + Math.abs(bz) > 2) continue;
              
              const rockKey = `${x + bx},${surfaceY + by},${z + bz}`;
              chunkBlocks[rockKey] = { type: feature.blockType || 'stone' };
            }
          }
        }
        break;
    }
  }

  /**
   * Place a tree at the specified position
   * @private
   * @param {Object} chunkBlocks - Block data to modify
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate (base of tree)
   * @param {number} z - Z coordinate
   * @param {Object} feature - Tree feature data
   */
  placeTree(chunkBlocks, x, y, z, feature) {
    const treeType = feature.variant || 'oak';
    const height = feature.height || (4 + Math.floor(Math.random() * 3));
    
    // Different tree types have different shapes
    switch (treeType) {
      case 'oak':
      case 'birch':
        // Place trunk
        for (let dy = 0; dy < height; dy++) {
          chunkBlocks[`${x},${y + dy},${z}`] = { type: 'wood', metadata: treeType === 'birch' ? 1 : 0 };
        }
        
        // Place leaves
        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -3; dy <= 0; dy++) {
            for (let dz = -2; dz <= 2; dz++) {
              // Skip trunk position
              if (dx === 0 && dz === 0 && dy > -3) continue;
              
              // Place leaves in a roughly circular pattern
              if (dx * dx + dy * dy + dz * dz <= 4 + (Math.random() * 2 - 1)) {
                const leafY = y + height + dy;
                
                // Ensure leaves are not placed below the highest trunk block
                if (leafY <= y + height) {
                  chunkBlocks[`${x + dx},${leafY},${z + dz}`] = { type: 'leaves', metadata: treeType === 'birch' ? 1 : 0 };
                }
              }
            }
          }
        }
        break;
        
      case 'pine':
      case 'spruce':
        // Place trunk
        for (let dy = 0; dy < height; dy++) {
          chunkBlocks[`${x},${y + dy},${z}`] = { type: 'wood', metadata: 2 };
        }
        
        // Place conical leaves
        for (let layer = 0; layer < 4; layer++) {
          const layerSize = 3 - layer;
          const layerY = y + height - 2 - layer;
          
          for (let dx = -layerSize; dx <= layerSize; dx++) {
            for (let dz = -layerSize; dz <= layerSize; dz++) {
              // Create a circular-ish layer
              if (dx * dx + dz * dz <= layerSize * layerSize + 1) {
                chunkBlocks[`${x + dx},${layerY},${z + dz}`] = { type: 'leaves', metadata: 2 };
              }
            }
          }
        }
        
        // Pointy top
        chunkBlocks[`${x},${y + height - 1},${z}`] = { type: 'leaves', metadata: 2 };
        break;
        
      case 'cactus':
        // Simple cactus
        for (let dy = 0; dy < Math.min(height, 3); dy++) {
          chunkBlocks[`${x},${y + dy},${z}`] = { type: 'cactus' };
        }
        break;
    }
  }

  /**
   * Generate structures in a chunk
   * @private
   * @param {Object} chunkBlocks - Block data to modify
   * @param {number} startX - Starting X coordinate
   * @param {number} startZ - Starting Z coordinate
   * @param {number} chunkSize - Size of chunk in blocks
   */
  generateStructures(chunkBlocks, startX, startZ, chunkSize) {
    // Determine if any structures should spawn in this chunk
    const structures = this.biomeManager.getStructuresAt(startX + chunkSize/2, startZ + chunkSize/2, this.seed);
    
    if (structures && structures.length > 0) {
      // Place all structures
      for (const structure of structures) {
        // Find a suitable position within the chunk for the structure
        const offsetX = Math.floor(Math.random() * (chunkSize - 4)) + 2;
        const offsetZ = Math.floor(Math.random() * (chunkSize - 4)) + 2;
        
        const structureX = startX + offsetX;
        const structureZ = startZ + offsetZ;
        
        // Only place a structure if no nearby structures exist
        if (this.canPlaceStructureAt(structureX, structureZ, structure.type)) {
          // Get the surface height at this position
          const surfaceY = Math.floor(this.biomeManager.getBlendedHeight(structureX, structureZ, this.seed));
          
          // Use the structure generator to create the structure
          this.generateStructureWithGenerator(
            chunkBlocks, 
            { x: structureX, y: surfaceY, z: structureZ }, 
            structure.type, 
            structure.options || {}
          );
          
          // Register the structure placement to avoid too many structures close together
          this.registerStructurePlacement(structureX, structureZ, structure.type);
        }
      }
    }
  }
  
  /**
   * Generate a structure using the structure generator
   * @private
   * @param {Object} chunkBlocks - Block data to modify
   * @param {Object} position - Position {x, y, z} for the structure
   * @param {string} structureType - Type of structure to generate
   * @param {Object} options - Additional options for the structure
   * @returns {Object|null} - Structure data or null if generation failed
   */
  generateStructureWithGenerator(chunkBlocks, position, structureType, options = {}) {
    // Create a block setter function that adds blocks to the chunk data
    const blockSetter = (key, block) => {
      chunkBlocks[key] = block;
    };
    
    // Use the structure generator to generate the structure
    return this.structureGenerator.generateStructure(structureType, position, options, blockSetter);
  }
  
  /**
   * Check if a structure can be placed at the specified location
   * @private
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {string} structureType - Type of structure
   * @returns {boolean} - Whether the structure can be placed
   */
  canPlaceStructureAt(x, z, structureType) {
    // Get minimum distance between structures of this type
    const minDistance = this.getStructureMinDistance(structureType);
    
    // Check for nearby structures
    for (const [key, info] of this.structurePlaceholders.entries()) {
      const [sx, sz, type] = key.split(':');
      const structX = parseInt(sx);
      const structZ = parseInt(sz);
      
      // Calculate distance to existing structure
      const dx = x - structX;
      const dz = z - structZ;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      // If too close to another structure of the same type, can't place
      if (type === structureType && distance < minDistance) {
        return false;
      }
      
      // If too close to another significant structure, can't place
      if (this.isSignificantStructure(type) && distance < 24) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Register a structure placement to track structure locations
   * @private
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {string} structureType - Type of structure
   */
  registerStructurePlacement(x, z, structureType) {
    const key = `${x}:${z}:${structureType}`;
    this.structurePlaceholders.set(key, {
      position: { x, z },
      type: structureType,
      timestamp: Date.now()
    });
    
    // Prune old entries if the map gets too large
    if (this.structurePlaceholders.size > 1000) {
      // Sort by timestamp and remove oldest 10%
      const entries = Array.from(this.structurePlaceholders.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = Math.floor(entries.length * 0.1);
      for (let i = 0; i < toRemove; i++) {
        this.structurePlaceholders.delete(entries[i][0]);
      }
    }
  }
  
  /**
   * Get minimum distance between structures of a specific type
   * @private
   * @param {string} structureType - Type of structure
   * @returns {number} - Minimum distance in blocks
   */
  getStructureMinDistance(structureType) {
    // Different structure types have different spacing requirements
    switch (structureType) {
      case 'village':
        return 80;
      case 'desert_pyramid':
      case 'jungle_temple':
      case 'witch_hut':
        return 64;
      case 'stronghold':
        return 128;
      case 'mineshaft':
        return 32;
      case 'small_ruin':
        return 24;
      case 'boulder_pile':
      case 'desert_well':
      case 'fallen_tree':
        return 16;
      default:
        return 24;
    }
  }
  
  /**
   * Check if a structure type is significant enough to prevent other structures nearby
   * @private
   * @param {string} structureType - Type of structure
   * @returns {boolean} - Whether it's a significant structure
   */
  isSignificantStructure(structureType) {
    return [
      'village',
      'desert_pyramid',
      'jungle_temple',
      'witch_hut',
      'stronghold'
    ].includes(structureType);
  }

  /**
   * Place a structure at the specified position
   * @private
   * @param {Object} chunkBlocks - Block data to modify
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Object} structure - Structure data to place
   */
  placeStructure(chunkBlocks, x, z, structure) {
    // This is now just a wrapper around the new structure generator method
    const surfaceY = Math.floor(this.biomeManager.getBlendedHeight(x, z, this.seed));
    
    this.generateStructureWithGenerator(
      chunkBlocks, 
      { x, y: surfaceY, z }, 
      structure.type, 
      structure
    );
  }

  /**
   * Generate an entire world of specified size
   * @param {number} sizeX - World size in X direction (blocks)
   * @param {number} sizeZ - World size in Z direction (blocks)
   * @returns {Object} - Complete world data
   */
  generateWorld(sizeX, sizeZ) {
    const worldBlocks = {};
    const chunkSize = this.generationSettings.chunkSize;
    
    // Calculate number of chunks needed
    const chunksX = Math.ceil(sizeX / chunkSize);
    const chunksZ = Math.ceil(sizeZ / chunkSize);
    
    // Generate all chunks
    for (let cx = 0; cx < chunksX; cx++) {
      for (let cz = 0; cz < chunksZ; cz++) {
        const chunkData = this.generateChunk(cx - Math.floor(chunksX/2), cz - Math.floor(chunksZ/2));
        
        // Add chunk data to world
        Object.assign(worldBlocks, chunkData);
      }
    }
    
    return worldBlocks;
  }

  /**
   * Clear the internal cache
   */
  clearCache() {
    this.chunkCache.clear();
    this.biomeManager.clearCache();
  }
}

module.exports = WorldGenerator; 