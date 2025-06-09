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
    
    // Initialize world generation parameters
    this.initializeWorld();
    
    // Initialize biome features
    this.initializeBiomeFeatures();
  }

  /**
   * Create and configure a biome manager instance
   * @private
   * @returns {BiomeManager} - Configured biome manager
   */
  createBiomeManager() {
    // Get all biomes from the registry
    const biomeRegistry = new BiomeRegistry();
    const biomes = biomeRegistry.getAllBiomes();
    
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
    const caveMaskNoise = this.terrainNoiseGenerators.caveMaskNoise;
    
    // Track potential dungeon locations
    const potentialDungeonLocations = [];
    
    // Track air pockets for potential dungeon locations
    const airPockets = new Map();
    
    // Precheck for lush caves biome potential
    const isLushCavesRegion = {};
    
    // Check if this chunk can contain lush caves
    for (let x = 0; x < chunkSize; x++) {
      for (let z = 0; z < chunkSize; z++) {
        const worldX = startX + x;
        const worldZ = startZ + z;
        
        // Get biome at this position
        const biome = this.biomeManager.getBiomeAt(worldX, this.seaLevel, worldZ, this.seed);
        
        // Check if the biome supports lush caves
        if (biome && biome.id === 'plains' || biome.id === 'forest' || biome.id === 'jungle') {
          // Use noise to place lush caves in clusters
          const lushNoise = this.climateNoiseGenerators.precipitation.get(worldX * 0.005, worldZ * 0.005);
          if (lushNoise > 0.7) {
            isLushCavesRegion[`${worldX},${worldZ}`] = true;
          }
        }
      }
    }
    
    // Process each block in the chunk
    for (let x = 0; x < chunkSize; x++) {
      for (let z = 0; z < chunkSize; z++) {
        const worldX = startX + x;
        const worldZ = startZ + z;
        
        // Get maximum terrain height at this position
        const maxHeight = this.seaLevel + 5; // Only dig caves up to slightly above sea level
        const minHeight = 5; // Do not dig caves at the very bottom of the world
        
        // Check for lush caves potential in this column
        const hasLushCavesPotential = isLushCavesRegion[`${worldX},${worldZ}`];
        
        // Track consecutive air blocks for dungeon detection
        let airCount = 0;
        let lastAirY = 0;
        
        // Generate caves from bottom to top
        for (let y = minHeight; y < maxHeight; y++) {
          const key = `${worldX},${y},${worldZ}`;
          
          // Skip if this position doesn't have a block or is already open
          if (!chunkBlocks[key] || chunkBlocks[key].type === 'air' || 
              chunkBlocks[key].type === 'water' || chunkBlocks[key].type === 'lava') {
            continue;
          }
          
          // Cave generation is based on 3D Perlin noise
          const caveValue = Math.abs(caveNoise.get(worldX * 0.02, y * 0.02, worldZ * 0.02));
          
          // Higher cave density deeper underground
          const depthFactor = 1.0 - (y - minHeight) / (maxHeight - minHeight);
          const caveThreshold = 0.5 - (depthFactor * 0.2);
          
          // Check if we should place a cave here
          if (caveValue > caveThreshold) {
            // Skip if this is bedrock
            if (chunkBlocks[key].type === 'bedrock') {
              continue;
            }
            
            // Create a cave
            if (y < this.seaLevel - 8) {
              // Below sea level, we have a chance for lava pools
              const lavaChance = (this.seaLevel - y) / (this.seaLevel - minHeight) * 0.15;
              if (Math.random() < lavaChance) {
                chunkBlocks[key] = { type: 'lava' };
              } else {
                chunkBlocks[key] = { type: 'cave_air' };
              }
            } else {
              // Regular cave air
              chunkBlocks[key] = { type: 'cave_air' };
            }
            
            // Track air count for dungeon detection
            airCount++;
            lastAirY = y;
          } else {
            // When we hit a solid block after air, check for dungeon placement
            if (airCount >= 5 && lastAirY > minHeight + 10) {
              potentialDungeonLocations.push({ x: worldX, y: lastAirY - Math.floor(airCount / 2), z: worldZ });
            }
            airCount = 0;
          }
          
          // Apply lush caves biome decorations
          if (hasLushCavesPotential && chunkBlocks[key].type === 'cave_air') {
            // Use 3D noise to determine lush cave regions
            const lushCaveValue = caveMaskNoise ? 
              caveMaskNoise.get(worldX * 0.01, y * 0.01, worldZ * 0.01) : 
              Math.sin(worldX * 0.01) * Math.cos(worldZ * 0.01) * Math.sin(y * 0.01);
            
            if (lushCaveValue > 0.4) {
              // Check ceiling and floor blocks
              const floorKey = `${worldX},${y-1},${worldZ}`;
              const ceilingKey = `${worldX},${y+1},${worldZ}`;
              
              const hasSolidFloor = chunkBlocks[floorKey] && 
                chunkBlocks[floorKey].type !== 'air' && 
                chunkBlocks[floorKey].type !== 'cave_air' &&
                chunkBlocks[floorKey].type !== 'water';
              
              const hasSolidCeiling = chunkBlocks[ceilingKey] && 
                chunkBlocks[ceilingKey].type !== 'air' && 
                chunkBlocks[ceilingKey].type !== 'cave_air' &&
                chunkBlocks[ceilingKey].type !== 'water';
              
              // 10% chance to replace floor with moss blocks
              if (hasSolidFloor && chunkBlocks[floorKey].type === 'stone' && Math.random() < 0.1) {
                chunkBlocks[floorKey] = { type: 'moss_block' };
              }
              
              // Ceiling decorations (glow berries, spore blossoms)
              if (hasSolidCeiling && Math.random() < 0.05) {
                // Randomly select between glow berries and spore blossoms
                if (Math.random() < 0.5) {
                  chunkBlocks[key] = { type: 'glow_berry_vine', length: Math.floor(Math.random() * 3) + 1 };
                } else {
                  chunkBlocks[key] = { type: 'spore_blossom' };
                }
              }
              
              // Small water puddles on the floor
              if (hasSolidFloor && Math.random() < 0.03) {
                chunkBlocks[key] = { type: 'water' };
              }
              
              // Floor vegetation (dripleafs, azaleas)
              if (hasSolidFloor && Math.random() < 0.08) {
                if (Math.random() < 0.6) {
                  // Small dripleaf
                  chunkBlocks[key] = { type: 'small_dripleaf' };
                } else {
                  // Azalea
                  const isFlowering = Math.random() < 0.4;
                  chunkBlocks[key] = { type: isFlowering ? 'flowering_azalea' : 'azalea' };
                }
              }
            }
          }
        }
      }
    }
    
    // After basic cave generation, place dungeons
    if (potentialDungeonLocations.length > 0) {
      this.generateCaveDungeons(chunkBlocks, potentialDungeonLocations);
    }
  }
  
  /**
   * Generate dungeons in suitable cave locations
   * @private
   * @param {Object} chunkBlocks - Block data to modify
   * @param {Array} potentialLocations - List of potential dungeon locations
   */
  generateCaveDungeons(chunkBlocks, potentialLocations) {
    // Skip if no potential locations or dungeons are disabled
    if (!potentialLocations.length || !this.generationSettings.generateStructures) {
      return;
    }
    
    // Normalize the dungeon frequency based on world seed
    const dungeonFrequency = 0.15 + (this.randomFromSeed(this.seed + 500) * 0.1); // 15-25% chance
    
    // Sort locations by y-level (prefer deeper dungeons)
    potentialLocations.sort((a, b) => a.y - b.y);
    
    // For each potential location, decide if we should place a dungeon
    for (const location of potentialLocations) {
      // Check if we should generate a dungeon here
      if (this.randomFromSeed(this.seed + location.x * 174.3 + location.z * 93.7) < dungeonFrequency) {
        // Check if there's enough space for a dungeon
        if (this.isSpaceForDungeon(chunkBlocks, location.x, location.y, location.z)) {
          // Place a dungeon at this location
          this.generateStructureWithGenerator(
            chunkBlocks,
            { x: location.x, y: location.y, z: location.z },
            'dungeon',
            {}
          );
          
          // Register the dungeon to avoid placing structures too close
          this.registerStructurePlacement(location.x, location.z, 'dungeon');
          
          // Only place one dungeon per chunk to avoid overcrowding
          break;
        }
      }
    }
  }
  
  /**
   * Check if there's enough space for a dungeon
   * @private
   * @param {Object} chunkBlocks - Block data to check
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @returns {boolean} - Whether there's enough space
   */
  isSpaceForDungeon(chunkBlocks, x, y, z) {
    // Check for a roughly 7x7x5 area around the position
    const checkRadius = 4;
    const checkHeight = 3;
    
    // Count how many air blocks are in the potential dungeon space
    let airCount = 0;
    const totalBlocks = (checkRadius * 2 + 1) * (checkHeight * 2 + 1) * (checkRadius * 2 + 1);
    
    // We want at least 50% of the volume to be air for a good dungeon location
    const requiredAirPercentage = 0.5;
    
    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      for (let dy = -checkHeight; dy <= checkHeight; dy++) {
        for (let dz = -checkRadius; dz <= checkRadius; dz++) {
          const blockKey = `${x + dx},${y + dy},${z + dz}`;
          const block = chunkBlocks[blockKey];
          
          if (!block || block.type === 'air') {
            airCount++;
          }
        }
      }
    }
    
    // Check if there's enough air space for a dungeon
    return (airCount / totalBlocks) >= requiredAirPercentage;
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
   * Initialize world generation parameters and prepare the world for generation
   * @private
   */
  initializeWorld() {
    // Set up the biome manager to use our noise generators
    if (this.biomeManager) {
      this.biomeManager.setNoiseGenerators(this.climateNoiseGenerators);
    }

    // Set the entity spawner on the structure generator
    this.structureGenerator.entitySpawner = (entityData) => {
      // Store the entity spawn data to be processed by the server
      if (!this.pendingEntitySpawns) {
        this.pendingEntitySpawns = [];
      }
      
      this.pendingEntitySpawns.push(entityData);
      return entityData;
    };
    
    // Initialize global structures like strongholds and mineshafts
    this.globalStructures = {
      strongholds: [],
      mineshafts: [],
      desertTemples: [],
      jungleTemples: []
    };
    
    // Generate stronghold positions
    // Strongholds are placed in rings around the origin
    this.generateStrongholdPositions();
    
    // Generate mineshaft positions - more common than strongholds
    this.generateMineshaftPositions();
    
    // Generate desert temple positions
    this.generateDesertTemplePositions();
    
    // Generate jungle temple positions
    this.generateJungleTemplePositions();
  }
  
  /**
   * Generate stronghold positions
   * @private
   */
  generateStrongholdPositions() {
    // Strongholds are placed in rings around the origin
    // Typically 3-8 strongholds generate in concentric rings around the world origin
    const strongholdCount = 3 + Math.floor(this.randomFromSeed(this.seed + 1) * 5); // 3-8 strongholds
    
    // Generate strongholds in a ring around the origin, between 1000-5000 blocks away
    const minDistance = 1000;
    const maxDistance = 5000;
    
    for (let i = 0; i < strongholdCount; i++) {
      // Calculate angle based on position in the ring
      const angle = (i / strongholdCount) * Math.PI * 2;
      
      // Calculate distance from origin (with some randomness)
      const distance = minDistance + this.randomFromSeed(this.seed + i * 100) * (maxDistance - minDistance);
      
      // Calculate coordinates
      const x = Math.floor(Math.cos(angle) * distance);
      const z = Math.floor(Math.sin(angle) * distance);
      
      // Store stronghold position
      this.globalStructures.strongholds.push({
        x, z, 
        generated: false
      });
    }
  }
  
  /**
   * Generate mineshaft positions
   * @private
   */
  generateMineshaftPositions() {
    // Mineshafts are more numerous and randomly distributed underground
    // They spawn within chunks according to a probability function
    
    // We'll pre-determine some mineshaft locations for specific chunks
    // rather than checking on every chunk generation (which would be less efficient)
    const mineshaftCount = 15 + Math.floor(this.randomFromSeed(this.seed + 2000) * 10); // 15-25 mineshafts
    
    // Distribution range - within a large area around the origin
    const maxRange = 8000;
    
    // Minimum distance between mineshafts
    const minDistance = 400;
    
    for (let i = 0; i < mineshaftCount; i++) {
      // Generate a random position within the range
      let attempts = 0;
      let validPosition = false;
      let x, z;
      
      // Try to find a position that's at least minDistance away from other mineshafts
      while (!validPosition && attempts < 20) {
        x = Math.floor(this.randomFromSeed(this.seed + i * 200 + attempts) * maxRange * 2) - maxRange;
        z = Math.floor(this.randomFromSeed(this.seed + i * 200 + 100 + attempts) * maxRange * 2) - maxRange;
        
        validPosition = true;
        
        // Check distance to other mineshafts
        for (const mineshaft of this.globalStructures.mineshafts) {
          const dx = x - mineshaft.x;
          const dz = z - mineshaft.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance < minDistance) {
            validPosition = false;
            break;
          }
        }
        
        attempts++;
      }
      
      // If we found a valid position, add the mineshaft
      if (validPosition) {
        this.globalStructures.mineshafts.push({
          x, z,
          generated: false
        });
      }
    }
  }
  
  /**
   * Generate desert temple positions throughout the world
   * @private
   */
  generateDesertTemplePositions() {
    // Desert temples should only generate in desert biomes
    // Store them to generate when those chunks are loaded
    const numTemples = 20; // Number of temples in the world
    const range = 8000; // Range from spawn for temples
    
    for (let i = 0; i < numTemples; i++) {
      // Generate random position
      const x = Math.floor((Math.random() * 2 - 1) * range);
      const z = Math.floor((Math.random() * 2 - 1) * range);
      
      // Only place in desert biomes
      const biome = this.biomeManager.getBiomeAt(x, z);
      if (biome && biome.id.includes('desert')) {
        this.globalStructures.desertTemples.push({
          x,
          z,
          generated: false
        });
      }
    }
  }
  
  /**
   * Generate jungle temple positions throughout the world
   * @private
   */
  generateJungleTemplePositions() {
    // Jungle temples should only generate in jungle biomes
    // Store them to generate when those chunks are loaded
    const numTemples = 15; // Number of temples in the world
    const range = 8000; // Range from spawn for temples
    
    for (let i = 0; i < numTemples; i++) {
      // Generate random position
      const x = Math.floor((Math.random() * 2 - 1) * range);
      const z = Math.floor((Math.random() * 2 - 1) * range);
      
      // Only place in jungle biomes
      const biome = this.biomeManager.getBiomeAt(x, z);
      if (biome && biome.id.includes('jungle')) {
        this.globalStructures.jungleTemples.push({
          x,
          z,
          generated: false
        });
      }
    }
  }
  
  /**
   * Generates a random number between 0 and 1 based on a seed
   * @private
   * @param {number} seed - Seed value
   * @returns {number} - Random value between 0 and 1
   */
  randomFromSeed(seed) {
    // Simple but deterministic random number generator
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
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
    // First check if any global structures should be placed in this chunk
    this.generateGlobalStructures(chunkBlocks, startX, startZ, chunkSize);
    
    // Then determine if any biome-specific structures should spawn in this chunk
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
   * Generate global structures like strongholds in a chunk
   * @private
   * @param {Object} chunkBlocks - Block data to modify
   * @param {number} startX - Starting X coordinate
   * @param {number} startZ - Starting Z coordinate
   * @param {number} chunkSize - Size of chunk in blocks
   */
  generateGlobalStructures(chunkBlocks, startX, startZ, chunkSize) {
    // Check if any strongholds should be in this chunk
    if (this.globalStructures && this.globalStructures.strongholds) {
      for (const stronghold of this.globalStructures.strongholds) {
        // Skip if already generated
        if (stronghold.generated) continue;
        
        // Check if the stronghold is within this chunk
        if (stronghold.x >= startX && stronghold.x < startX + chunkSize &&
            stronghold.z >= startZ && stronghold.z < startZ + chunkSize) {
          
          // Get the surface height at this position and go underground
          const surfaceY = Math.floor(this.biomeManager.getBlendedHeight(stronghold.x, stronghold.z, this.seed));
          const undergroundY = Math.max(10, surfaceY - 20); // Ensure it's underground but above bedrock
          
          // Use the structure generator to create the stronghold
          this.generateStructureWithGenerator(
            chunkBlocks,
            { x: stronghold.x, y: undergroundY, z: stronghold.z },
            'stronghold',
            {}
          );
          
          // Mark as generated and register it
          stronghold.generated = true;
          this.registerStructurePlacement(stronghold.x, stronghold.z, 'stronghold');
          
          console.log(`Generated stronghold at ${stronghold.x}, ${undergroundY}, ${stronghold.z}`);
        }
      }
    }
    
    // Check if any mineshafts should be in this chunk
    if (this.globalStructures && this.globalStructures.mineshafts) {
      for (const mineshaft of this.globalStructures.mineshafts) {
        // Skip if already generated
        if (mineshaft.generated) continue;
        
        // Check if the mineshaft is within this chunk
        if (mineshaft.x >= startX && mineshaft.x < startX + chunkSize &&
            mineshaft.z >= startZ && mineshaft.z < startZ + chunkSize) {
          
          // Get the surface height at this position and go deeper underground
          const surfaceY = Math.floor(this.biomeManager.getBlendedHeight(mineshaft.x, mineshaft.z, this.seed));
          // Mineshafts typically spawn between y=10 and y=40
          const undergroundY = Math.min(Math.max(10, surfaceY - 40), 40);
          
          // Use the structure generator to create the mineshaft
          this.generateStructureWithGenerator(
            chunkBlocks,
            { x: mineshaft.x, y: undergroundY, z: mineshaft.z },
            'mineshaft',
            {}
          );
          
          // Mark as generated and register it
          mineshaft.generated = true;
          this.registerStructurePlacement(mineshaft.x, mineshaft.z, 'mineshaft');
          
          console.log(`Generated mineshaft at ${mineshaft.x}, ${undergroundY}, ${mineshaft.z}`);
        }
      }
    }
    
    // Check if any desert temples should be in this chunk
    if (this.globalStructures && this.globalStructures.desertTemples) {
      for (const temple of this.globalStructures.desertTemples) {
        // Skip if already generated
        if (temple.generated) continue;
        
        // Check if the temple is within this chunk
        if (temple.x >= startX && temple.x < startX + chunkSize &&
            temple.z >= startZ && temple.z < startZ + chunkSize) {
          
          // Get the surface height at this position
          const surfaceY = Math.floor(this.biomeManager.getBlendedHeight(temple.x, temple.z, this.seed));
          
          // Use the structure generator to create the desert temple
          this.generateStructureWithGenerator(
            chunkBlocks,
            { x: temple.x, y: surfaceY, z: temple.z },
            'desert_temple',
            {}
          );
          
          // Mark as generated and register it
          temple.generated = true;
          this.registerStructurePlacement(temple.x, temple.z, 'desert_temple');
          
          console.log(`Generated desert temple at ${temple.x}, ${surfaceY}, ${temple.z}`);
        }
      }
    }
    
    // Check if any jungle temples should be in this chunk
    if (this.globalStructures && this.globalStructures.jungleTemples) {
      for (const temple of this.globalStructures.jungleTemples) {
        // Skip if already generated
        if (temple.generated) continue;
        
        // Check if the temple is within this chunk
        if (temple.x >= startX && temple.x < startX + chunkSize &&
            temple.z >= startZ && temple.z < startZ + chunkSize) {
          
          // Get the surface height at this position
          const surfaceY = Math.floor(this.biomeManager.getBlendedHeight(temple.x, temple.z, this.seed));
          
          // Use the structure generator to create the jungle temple
          this.generateStructureWithGenerator(
            chunkBlocks,
            { x: temple.x, y: surfaceY, z: temple.z },
            'jungle_temple',
            {}
          );
          
          // Mark as generated and register it
          temple.generated = true;
          this.registerStructurePlacement(temple.x, temple.z, 'jungle_temple');
          
          console.log(`Generated jungle temple at ${temple.x}, ${surfaceY}, ${temple.z}`);
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
    // Define minimum distances for different structure types
    const distanceMap = {
      'village': 512,
      'stronghold': 1024,
      'mineshaft': 256,
      'desert_temple': 512,
      'jungle_temple': 512,
      'dungeon': 64,
      'small_ruin': 128
      // Add other structures as needed
    };
    
    return distanceMap[structureType] || 64; // Default to 64 blocks
  }
  
  /**
   * Check if a structure is significant enough to prevent other structures nearby
   * @private
   * @param {string} structureType - Type of structure
   * @returns {boolean} - Whether the structure is significant
   */
  isSignificantStructure(structureType) {
    // List of significant structures that should not be close to other structures
    return ['village', 'stronghold', 'mineshaft', 'desert_temple', 'jungle_temple'].includes(structureType);
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
   * Generate a square region of world blocks
   * @param {number} width - Width of the area to generate (centered at origin)
   * @param {number} depth - Depth of the area to generate (centered at origin)
   * @returns {Object} - All blocks in the generated area
   */
  generateWorld(width, depth) {
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    const allBlocks = {};
    
    // Get chunk size from settings
    const chunkSize = this.generationSettings.chunkSize;
    
    // Calculate chunk range to cover the requested area
    const minChunkX = Math.floor((-halfWidth) / chunkSize);
    const maxChunkX = Math.floor((halfWidth) / chunkSize);
    const minChunkZ = Math.floor((-halfDepth) / chunkSize);
    const maxChunkZ = Math.floor((halfDepth) / chunkSize);
    
    // Generate all chunks in range
    for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
      for (let chunkZ = minChunkZ; chunkZ <= maxChunkZ; chunkZ++) {
        const chunkBlocks = this.generateChunk(chunkX, chunkZ);
        
        // Add chunk blocks to all blocks
        Object.assign(allBlocks, chunkBlocks);
      }
    }
    
    // Process any entity spawns that were queued during generation
    if (this.pendingEntitySpawns && this.pendingEntitySpawns.length > 0) {
      console.log(`Generated ${this.pendingEntitySpawns.length} entities during world generation`);
      
      // In a real implementation, these would be added to the world
      // For now, just clear the pending spawns
      this.pendingEntitySpawns = [];
    }
    
    return allBlocks;
  }

  /**
   * Clear the internal cache
   */
  clearCache() {
    this.chunkCache.clear();
    this.biomeManager.clearCache();
  }

  /**
   * Initialize biome features for all biomes
   * @private
   */
  initializeBiomeFeatures() {
    // Store biome features for lookup
    this.biomeFeatures = {
      // Overworld biomes
      'plains': [
        { type: 'vegetation', density: 0.8, plants: ['grass', 'flower', 'dandelion', 'poppy'] },
        { type: 'tree', density: 0.1, treeType: 'oak' }
      ],
      'forest': [
        { type: 'vegetation', density: 0.7, plants: ['grass', 'flower', 'dandelion', 'poppy', 'lily_of_the_valley'] },
        { type: 'tree', density: 0.6, treeType: 'oak' },
        { type: 'tree', density: 0.2, treeType: 'birch' }
      ],
      'jungle': [
        { type: 'vegetation', density: 0.9, plants: ['grass', 'fern', 'jungle_bush', 'bamboo'] },
        { type: 'tree', density: 0.8, treeType: 'jungle' }
      ],
      'desert': [
        { type: 'vegetation', density: 0.1, plants: ['cactus', 'dead_bush'] }
      ],
      'swamp': [
        { type: 'vegetation', density: 0.8, plants: ['grass', 'fern', 'lily_pad', 'blue_orchid'] },
        { type: 'tree', density: 0.4, treeType: 'swamp_oak' }
      ],
      'mushroom_fields': [
        { type: 'vegetation', density: 0.8, plants: ['red_mushroom', 'brown_mushroom'] },
        { type: 'feature', density: 0.2, feature: 'huge_mushroom' }
      ],
      'lush_caves': [
        { type: 'vegetation', density: 0.9, plants: ['moss', 'flowering_azalea', 'spore_blossom', 'glow_berry_vine', 'ancient_plant'] },
        { type: 'feature', density: 0.4, feature: 'clay_pool' },
        { type: 'feature', density: 0.3, feature: 'moss_patch' }
      ],
      'dripstone_caves': [
        { type: 'feature', density: 0.7, feature: 'dripstone_cluster' },
        { type: 'feature', density: 0.3, feature: 'dripstone_pool' }
      ],
      'frozen_peaks': [
        { type: 'vegetation', density: 0.2, plants: ['snow_grass', 'frozen_bush', 'ancient_plant_frost'] },
        { type: 'feature', density: 0.6, feature: 'ice_patch' }
      ],
      'snowy_plains': [
        { type: 'vegetation', density: 0.4, plants: ['snow_grass', 'frozen_bush'] },
        { type: 'tree', density: 0.1, treeType: 'spruce' }
      ],
      'flower_forest': [
        { type: 'vegetation', density: 1.0, plants: ['grass', 'flower', 'dandelion', 'poppy', 'allium', 'azure_bluet', 'tulip', 'sunflower', 'ancient_plant_torchflower'] },
        { type: 'tree', density: 0.4, treeType: 'oak' },
        { type: 'tree', density: 0.2, treeType: 'birch' }
      ],
      'mangrove_swamp': [
        { type: 'vegetation', density: 0.8, plants: ['mangrove_roots', 'lily_pad', 'seagrass', 'ancient_plant_pitcher_pod'] },
        { type: 'tree', density: 0.5, treeType: 'mangrove' }
      ],
      'deep_dark': [
        { type: 'vegetation', density: 0.3, plants: ['sculk', 'sculk_vein', 'ancient_plant_mystic'] },
        { type: 'feature', density: 0.5, feature: 'sculk_patch' }
      ],
      'cherry_grove': [
        { type: 'vegetation', density: 0.9, plants: ['grass', 'pink_petals', 'cherry_sapling'] },
        { type: 'tree', density: 0.7, treeType: 'cherry' }
      ],
      // Add more biomes as needed
    };
  }

  /**
   * Get features for a specific biome
   * @param {string} biomeType - The biome type to get features for
   * @returns {Array} Array of feature objects for the biome
   */
  getBiomeFeatures(biomeType) {
    // Return biome features or empty array if not found
    return this.biomeFeatures[biomeType] || [];
  }
}

module.exports = WorldGenerator; 