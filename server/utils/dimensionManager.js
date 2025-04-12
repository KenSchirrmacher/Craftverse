/**
 * DimensionManager - Manages multiple dimensions in the game
 * Handles dimension transitions, coordinate conversions, and separate world generators
 */

const WorldGenerator = require('./worldGenerator');
const BiomeRegistry = require('../biomes/biomeRegistry');

class DimensionManager {
  /**
   * Create a new DimensionManager
   * @param {Object} options - Configuration options
   * @param {number} options.seed - World seed
   */
  constructor(options = {}) {
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    
    // Track dimensions
    this.dimensions = new Map();
    
    // Initialize default dimensions
    this.initializeDefaultDimensions();
    
    // Active dimension trackers by player
    this.playerDimensions = new Map();
    
    // Portal cache for linked portals
    this.portalLinks = new Map();
    
    // Maximum portal search radius
    this.maxPortalSearchRadius = 128;
    
    // Default coordinate scale between Overworld and Nether (8:1 ratio)
    this.netherCoordinateScale = 8;
  }
  
  /**
   * Initialize default dimensions (Overworld and Nether)
   * @private
   */
  initializeDefaultDimensions() {
    // Create overworld generator
    const overworldGenerator = new WorldGenerator({
      seed: this.seed,
      seaLevel: 63,
      worldHeight: 256,
      worldDepth: 0,
      generationSettings: {
        generateCaves: true,
        generateStructures: true,
        generateDecorations: true,
        chunkSize: 16,
        generateBedrock: true
      }
    });
    
    // Create nether generator with different settings
    const netherGenerator = new WorldGenerator({
      seed: this.seed,
      seaLevel: 31,
      worldHeight: 128,
      worldDepth: 0,
      biomeManager: this.createNetherBiomeManager(),
      generationSettings: {
        generateCaves: true,
        generateStructures: true,
        generateDecorations: true,
        chunkSize: 16,
        generateBedrock: true,
        generateNetherFortress: true,
        lavaSeaLevel: 31,
        netherCeiling: true
      }
    });
    
    // Register dimensions
    this.registerDimension('overworld', {
      generator: overworldGenerator,
      blocks: {},
      name: 'Overworld',
      skyColor: '#87CEEB',
      fogColor: '#C6D9F1',
      hasDay: true,
      gravity: 1.0,
      respawnDimension: 'overworld',
      bedUsable: true
    });
    
    this.registerDimension('nether', {
      generator: netherGenerator,
      blocks: {},
      name: 'The Nether',
      skyColor: '#3F3F3F',
      fogColor: '#330808',
      hasDay: false,
      gravity: 1.0,
      respawnDimension: 'overworld',
      bedUsable: false
    });
  }
  
  /**
   * Create a biome manager specifically for the Nether
   * @private
   * @returns {BiomeManager} Nether biome manager
   */
  createNetherBiomeManager() {
    // Get only nether biomes from the registry
    const netherBiomes = BiomeRegistry.getNetherBiomes();
    
    // Create noise generators for the nether
    const netherNoiseGenerators = {
      // We'll use different base frequencies for nether terrain
      continentalness: this.createNoiseGenerator(this.seed + 1, { scale: 256, octaves: 4 }),
      erosion: this.createNoiseGenerator(this.seed + 2, { scale: 128, octaves: 3 }),
      temperature: this.createNoiseGenerator(this.seed + 3, { scale: 256, octaves: 2 }),
      weirdness: this.createNoiseGenerator(this.seed + 4, { scale: 128, octaves: 3 }),
    };
    
    return new BiomeManager({
      biomes: netherBiomes,
      noiseGenerators: netherNoiseGenerators,
      blendRadius: 4,  // Less biome blending in the nether for more distinct borders
      isNether: true
    });
  }
  
  /**
   * Create a noise generator with specific parameters
   * @private
   * @param {number} seed - Noise seed
   * @param {Object} options - Noise options
   * @returns {Object} Noise generator
   */
  createNoiseGenerator(seed, options) {
    // This is a stub - we'll use the actual noise generator implementation
    // that already exists in the codebase
    return {
      seed,
      options,
      getValue: (x, y, z) => Math.sin(x * 0.1 + y * 0.1 + z * 0.1 + seed * 0.01)
    };
  }
  
  /**
   * Register a new dimension
   * @param {string} dimensionId - Unique identifier for the dimension
   * @param {Object} dimensionData - Dimension properties and generator
   */
  registerDimension(dimensionId, dimensionData) {
    this.dimensions.set(dimensionId, dimensionData);
  }
  
  /**
   * Get a dimension by ID
   * @param {string} dimensionId - Dimension ID to retrieve
   * @returns {Object|null} Dimension data or null if not found
   */
  getDimension(dimensionId) {
    return this.dimensions.get(dimensionId) || null;
  }
  
  /**
   * Get world generator for a specific dimension
   * @param {string} dimensionId - Dimension ID
   * @returns {WorldGenerator|null} World generator for the dimension
   */
  getGenerator(dimensionId) {
    const dimension = this.getDimension(dimensionId);
    return dimension ? dimension.generator : null;
  }
  
  /**
   * Generate a chunk in a specific dimension
   * @param {string} dimensionId - Dimension ID
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkZ - Chunk Z coordinate
   * @returns {Object|null} Generated blocks or null if dimension not found
   */
  generateChunk(dimensionId, chunkX, chunkZ) {
    const generator = this.getGenerator(dimensionId);
    if (!generator) return null;
    
    return generator.generateChunk(chunkX, chunkZ);
  }
  
  /**
   * Set a player's current dimension
   * @param {string} playerId - Player's unique ID
   * @param {string} dimensionId - Dimension ID
   */
  setPlayerDimension(playerId, dimensionId) {
    if (!this.dimensions.has(dimensionId)) {
      throw new Error(`Dimension ${dimensionId} does not exist`);
    }
    
    this.playerDimensions.set(playerId, dimensionId);
  }
  
  /**
   * Get a player's current dimension
   * @param {string} playerId - Player's unique ID
   * @returns {string} Dimension ID (defaults to 'overworld')
   */
  getPlayerDimension(playerId) {
    return this.playerDimensions.get(playerId) || 'overworld';
  }
  
  /**
   * Convert coordinates between dimensions
   * @param {Object} position - Position object with x, y, z
   * @param {string} fromDimension - Source dimension
   * @param {string} toDimension - Target dimension
   * @returns {Object} Converted position
   */
  convertCoordinates(position, fromDimension, toDimension) {
    // Copy position to avoid modifying original
    const newPosition = { ...position };
    
    if (fromDimension === 'overworld' && toDimension === 'nether') {
      // Overworld to Nether (divide by 8)
      newPosition.x = Math.floor(position.x / this.netherCoordinateScale);
      newPosition.z = Math.floor(position.z / this.netherCoordinateScale);
      // Y-coordinate stays the same or is adjusted to find valid position
      
    } else if (fromDimension === 'nether' && toDimension === 'overworld') {
      // Nether to Overworld (multiply by 8)
      newPosition.x = position.x * this.netherCoordinateScale;
      newPosition.z = position.z * this.netherCoordinateScale;
      // Y-coordinate stays the same or is adjusted to find valid position
    }
    
    return newPosition;
  }
  
  /**
   * Create a portal at the specified position in the given dimension
   * @param {string} dimensionId - Dimension to create portal in
   * @param {Object} position - Position of the portal
   * @param {string} orientation - Portal orientation ('x' or 'z')
   * @returns {Object} Portal data including position and blocks
   */
  createPortal(dimensionId, position, orientation = 'z') {
    const dimension = this.getDimension(dimensionId);
    if (!dimension) return null;
    
    // Portal configuration
    const width = 4; // Standard portal width
    const height = 5; // Standard portal height
    
    // Determine portal blocks based on dimension
    const frameBlock = dimensionId === 'nether' ? 'obsidian' : 'obsidian';
    const portalBlock = dimensionId === 'nether' ? 'nether_portal' : 'nether_portal';
    
    // Calculate portal positions
    const portalBlocks = {};
    
    if (orientation === 'x') {
      // X-aligned portal (extends along x axis)
      for (let x = -1; x <= width; x++) {
        for (let y = 0; y <= height; y++) {
          // Frame blocks
          if (x === -1 || x === width || y === 0 || y === height) {
            const key = `${position.x + x},${position.y + y},${position.z}`;
            portalBlocks[key] = { type: frameBlock };
          } 
          // Portal blocks inside the frame
          else {
            const key = `${position.x + x},${position.y + y},${position.z}`;
            portalBlocks[key] = { type: portalBlock, orientation: 'x' };
          }
        }
      }
    } else {
      // Z-aligned portal (extends along z axis)
      for (let z = -1; z <= width; z++) {
        for (let y = 0; y <= height; y++) {
          // Frame blocks
          if (z === -1 || z === width || y === 0 || y === height) {
            const key = `${position.x},${position.y + y},${position.z + z}`;
            portalBlocks[key] = { type: frameBlock };
          } 
          // Portal blocks inside the frame
          else {
            const key = `${position.x},${position.y + y},${position.z + z}`;
            portalBlocks[key] = { type: portalBlock, orientation: 'z' };
          }
        }
      }
    }
    
    const portalData = {
      position,
      dimensionId,
      orientation,
      width,
      height,
      blocks: portalBlocks
    };
    
    return portalData;
  }
  
  /**
   * Find or create a linked portal in the destination dimension
   * @param {string} srcDimensionId - Source dimension ID
   * @param {Object} srcPosition - Source position
   * @param {string} destDimensionId - Destination dimension ID
   * @returns {Object} Destination portal position
   */
  findOrCreateLinkedPortal(srcDimensionId, srcPosition, destDimensionId) {
    // Create a unique key for the source portal
    const srcKey = `${srcDimensionId}:${Math.floor(srcPosition.x)},${Math.floor(srcPosition.y)},${Math.floor(srcPosition.z)}`;
    
    // Check if we already have a linked portal
    if (this.portalLinks.has(srcKey)) {
      return this.portalLinks.get(srcKey);
    }
    
    // Convert coordinates to destination dimension
    const idealDestPosition = this.convertCoordinates(srcPosition, srcDimensionId, destDimensionId);
    
    // Search for existing portal near the ideal position
    const existingPortal = this.findExistingPortal(destDimensionId, idealDestPosition);
    
    if (existingPortal) {
      // Create bidirectional link
      this.portalLinks.set(srcKey, existingPortal);
      
      const destKey = `${destDimensionId}:${Math.floor(existingPortal.x)},${Math.floor(existingPortal.y)},${Math.floor(existingPortal.z)}`;
      this.portalLinks.set(destKey, srcPosition);
      
      return existingPortal;
    }
    
    // No existing portal found, create a new one
    // First find a valid location near the ideal position
    const validPosition = this.findValidPortalLocation(destDimensionId, idealDestPosition);
    
    // Create the portal
    const orientation = Math.random() > 0.5 ? 'x' : 'z'; // Random orientation
    const newPortal = this.createPortal(destDimensionId, validPosition, orientation);
    
    // Create bidirectional link
    this.portalLinks.set(srcKey, validPosition);
    
    const destKey = `${destDimensionId}:${Math.floor(validPosition.x)},${Math.floor(validPosition.y)},${Math.floor(validPosition.z)}`;
    this.portalLinks.set(destKey, srcPosition);
    
    return validPosition;
  }
  
  /**
   * Find an existing portal near the specified position
   * @param {string} dimensionId - Dimension to search in
   * @param {Object} position - Position to search around
   * @returns {Object|null} Portal position or null if none found
   */
  findExistingPortal(dimensionId, position) {
    const dimension = this.getDimension(dimensionId);
    if (!dimension) return null;
    
    // This is a stub - in a real implementation, we would:
    // 1. Search through blocks in the dimension around the position
    // 2. Look for portal blocks
    // 3. Return position of the base of the portal if found
    
    // For now, just return null to always create new portals
    return null;
  }
  
  /**
   * Find a valid location to create a portal
   * @param {string} dimensionId - Dimension ID
   * @param {Object} idealPosition - Ideal position for the portal
   * @returns {Object} Valid position for portal creation
   */
  findValidPortalLocation(dimensionId, idealPosition) {
    const dimension = this.getDimension(dimensionId);
    if (!dimension) return idealPosition;
    
    // This is a stub - in a real implementation, we would:
    // 1. Start at ideal position
    // 2. Check if there's enough space for a portal
    // 3. If not, spiral outward looking for valid space
    // 4. Return the first valid position
    
    // For now, just return the ideal position slightly adjusted
    // to avoid potential bedrock or other issues
    const adjustedPosition = { ...idealPosition };
    
    // Make sure y-coordinate is valid
    if (dimensionId === 'nether') {
      // In nether, find space between the floor and ceiling
      adjustedPosition.y = Math.max(10, Math.min(110, adjustedPosition.y));
    } else {
      // In overworld, ensure it's on valid ground
      adjustedPosition.y = Math.max(5, adjustedPosition.y);
    }
    
    return adjustedPosition;
  }
  
  /**
   * Teleport a player to another dimension
   * @param {string} playerId - Player ID
   * @param {string} targetDimension - Target dimension ID
   * @param {Object} sourcePosition - Current position
   * @returns {Object} New position in target dimension
   */
  teleportPlayerToDimension(playerId, targetDimension, sourcePosition) {
    const sourceDimension = this.getPlayerDimension(playerId);
    
    // Find or create linked portal
    const targetPosition = this.findOrCreateLinkedPortal(
      sourceDimension, 
      sourcePosition, 
      targetDimension
    );
    
    // Set player's dimension
    this.setPlayerDimension(playerId, targetDimension);
    
    return targetPosition;
  }
  
  /**
   * Get all the blocks for a dimension
   * @param {string} dimensionId - Dimension ID
   * @returns {Object} Block data for the dimension
   */
  getDimensionBlocks(dimensionId) {
    const dimension = this.getDimension(dimensionId);
    return dimension ? dimension.blocks : {};
  }
  
  /**
   * Set a block in a specific dimension
   * @param {string} dimensionId - Dimension ID
   * @param {string} key - Block coordinate key (x,y,z)
   * @param {Object} blockData - Block data
   */
  setBlock(dimensionId, key, blockData) {
    const dimension = this.getDimension(dimensionId);
    if (dimension) {
      dimension.blocks[key] = blockData;
    }
  }
  
  /**
   * Get a block from a specific dimension
   * @param {string} dimensionId - Dimension ID
   * @param {string} key - Block coordinate key (x,y,z)
   * @returns {Object|null} Block data or null if not found
   */
  getBlock(dimensionId, key) {
    const dimension = this.getDimension(dimensionId);
    return dimension && dimension.blocks[key] ? dimension.blocks[key] : null;
  }
  
  /**
   * Check if a portal can be created at the given position
   * @param {string} dimensionId - Dimension ID
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {string} orientation - Portal orientation ('x' or 'z')
   * @returns {boolean} True if portal can be created
   */
  canCreatePortal(dimensionId, x, y, z, orientation) {
    const width = 4;
    const height = 5;
    
    // Check portal frame
    if (orientation === 'x') {
      // X-oriented portal (extends along x-axis)
      for (let dx = -1; dx <= width; dx++) {
        for (let dy = 0; dy <= height; dy++) {
          const blockKey = `${x + dx},${y + dy},${z}`;
          const block = this.getBlock(dimensionId, blockKey);
          
          // Frame positions must be obsidian
          if (dx === -1 || dx === width || dy === 0 || dy === height) {
            if (!block || block.type !== 'obsidian') {
              return false;
            }
          } else {
            // Interior positions must be air
            if (block && block.type !== 'air') {
              return false;
            }
          }
        }
      }
    } else {
      // Z-oriented portal (extends along z-axis)
      for (let dz = -1; dz <= width; dz++) {
        for (let dy = 0; dy <= height; dy++) {
          const blockKey = `${x},${y + dy},${z + dz}`;
          const block = this.getBlock(dimensionId, blockKey);
          
          // Frame positions must be obsidian
          if (dz === -1 || dz === width || dy === 0 || dy === height) {
            if (!block || block.type !== 'obsidian') {
              return false;
            }
          } else {
            // Interior positions must be air
            if (block && block.type !== 'air') {
              return false;
            }
          }
        }
      }
    }
    
    return true;
  }
}

module.exports = DimensionManager; 