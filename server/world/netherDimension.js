/**
 * NetherDimension - Represents the Nether world with specialized terrain generation
 */

const NoiseGenerator = require('../utils/noiseGenerator');
const { FBMNoise, InterpolatedNoise } = NoiseGenerator;

class NetherDimension {
  /**
   * Create a new Nether dimension
   * @param {Object} options - Dimension options
   * @param {Number} options.seed - World seed
   * @param {Object} options.server - Server instance
   */
  constructor(options = {}) {
    this.id = 'nether';
    this.name = 'The Nether';
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    this.server = options.server;
    
    // Nether blocks storage
    this.blocks = new Map();
    
    // Entities in the nether
    this.entities = new Map();
    
    // Listeners for events
    this.listeners = new Map();
    
    // Initialize noise generators
    this.initNoiseGenerators();
    
    // Chunk tracking to identify which chunks are generated
    this.generatedChunks = new Set();
    this.chunkSize = 16;
    
    // Nether-specific settings
    this.ceilingHeight = 128;
    this.lavaLevel = 32;
    this.floorLevel = 30;
    
    // Block types for nether
    this.blockTypes = {
      // Nether-specific blocks
      netherrack: { name: 'Netherrack', hardness: 0.4 },
      nether_quartz_ore: { name: 'Nether Quartz Ore', hardness: 1.5 },
      soul_sand: { name: 'Soul Sand', hardness: 0.5 },
      gravel: { name: 'Gravel', hardness: 0.6 },
      glowstone: { name: 'Glowstone', hardness: 0.3 },
      lava: { name: 'Lava', hardness: 0, fluid: true },
      nether_brick: { name: 'Nether Brick', hardness: 2 },
      nether_wart_block: { name: 'Nether Wart Block', hardness: 1 },
      magma_block: { name: 'Magma Block', hardness: 0.5, damage: true }
    };
  }
  
  /**
   * Initialize noise generators for terrain generation
   */
  initNoiseGenerators() {
    // Primary terrain noise
    this.terrainNoise = new FBMNoise({
      seed: this.seed,
      octaves: 4,
      persistence: 0.5,
      lacunarity: 2.0,
      scale: 100
    });
    
    // Cave noise for large open areas
    this.caveNoise = new FBMNoise({
      seed: this.seed + 1,
      octaves: 3,
      persistence: 0.5,
      lacunarity: 2.0,
      scale: 50
    });
    
    // Soul sand valley noise
    this.soulSandNoise = new InterpolatedNoise({
      seed: this.seed + 2,
      scale: 150
    });
    
    // Glowstone ceiling noise
    this.glowstoneNoise = new InterpolatedNoise({
      seed: this.seed + 3,
      scale: 20
    });
    
    // Quartz ore noise
    this.quartzNoise = new InterpolatedNoise({
      seed: this.seed + 4,
      scale: 15
    });
  }
  
  /**
   * Gets a block type at specific coordinates
   * @param {String|Object} position - Block position as "x,y,z" string or {x,y,z} object
   * @returns {String|null} The block type or null if no block exists
   */
  getBlockType(position) {
    const posKey = typeof position === 'string' ? position : `${position.x},${position.y},${position.z}`;
    const block = this.blocks.get(posKey);
    return block ? block.type : null;
  }
  
  /**
   * Sets a block at specific coordinates
   * @param {String|Object} position - Block position as "x,y,z" string or {x,y,z} object
   * @param {Object} blockData - Block data with type and properties
   */
  setBlock(position, blockData) {
    const posKey = typeof position === 'string' ? position : `${position.x},${position.y},${position.z}`;
    this.blocks.set(posKey, blockData);
    
    // Notify clients about the block update
    if (this.server) {
      this.server.emit('blockUpdate', { 
        dimension: this.id,
        position: posKey, 
        type: blockData.type 
      });
    }
  }
  
  /**
   * Removes a block at specific coordinates
   * @param {String|Object} position - Block position as "x,y,z" string or {x,y,z} object
   */
  removeBlock(position) {
    const posKey = typeof position === 'string' ? position : `${position.x},${position.y},${position.z}`;
    this.blocks.delete(posKey);
    
    // Notify clients about the block removal
    if (this.server) {
      this.server.emit('blockUpdate', { 
        dimension: this.id,
        position: posKey, 
        type: null 
      });
    }
  }
  
  /**
   * Adds an entity to the nether dimension
   * @param {Object} entity - The entity to add
   */
  addEntity(entity) {
    if (!entity || !entity.id) return;
    
    this.entities.set(entity.id, entity);
    
    // Update entity's dimension reference
    entity.dimension = this.id;
    
    // Notify clients about the entity addition
    if (this.server) {
      this.server.emit('entityEnterDimension', {
        entityId: entity.id,
        dimension: this.id,
        position: entity.position
      });
    }
  }
  
  /**
   * Removes an entity from the nether dimension
   * @param {String} entityId - The entity ID to remove
   */
  removeEntity(entityId) {
    if (!entityId) return;
    
    this.entities.delete(entityId);
    
    // Notify clients about the entity removal
    if (this.server) {
      this.server.emit('entityLeaveDimension', {
        entityId,
        dimension: this.id
      });
    }
  }
  
  /**
   * Generates a chunk of terrain in the nether
   * @param {Number} chunkX - Chunk X coordinate
   * @param {Number} chunkZ - Chunk Z coordinate
   * @returns {Object} The generated chunk data
   */
  generateChunk(chunkX, chunkZ) {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    // Skip if this chunk is already generated
    if (this.generatedChunks.has(chunkKey)) {
      return;
    }
    
    // Generate a new chunk
    const startX = chunkX * this.chunkSize;
    const startZ = chunkZ * this.chunkSize;
    
    // For each block position in the chunk
    for (let x = 0; x < this.chunkSize; x++) {
      for (let z = 0; z < this.chunkSize; z++) {
        const worldX = startX + x;
        const worldZ = startZ + z;
        
        // Generate terrain from floor to ceiling
        this.generateNetherColumn(worldX, worldZ);
      }
    }
    
    // Mark chunk as generated
    this.generatedChunks.add(chunkKey);
    
    // Return a reference to the generated area
    return {
      chunkX,
      chunkZ,
      dimension: this.id
    };
  }
  
  /**
   * Generates a single vertical column of nether terrain
   * @param {Number} x - World X coordinate
   * @param {Number} z - World Z coordinate
   */
  generateNetherColumn(x, z) {
    // Get terrain and cave noise values
    const terrainValue = this.terrainNoise.get2D(x, z);
    const caveValue = this.caveNoise.get2D(x, z);
    
    // Soul sand areas
    const soulSandValue = this.soulSandNoise.get2D(x, z);
    const isSoulSandArea = soulSandValue > 0.6;
    
    // Generate blocks from bottom (y=0) to top (y=ceilingHeight)
    for (let y = 0; y < this.ceilingHeight; y++) {
      // Skip middle area for large open spaces (with occasional terrain)
      if (y > this.floorLevel + 5 && y < this.ceilingHeight - 10) {
        const caveNoiseValue = this.caveNoise.get3D(x, y, z);
        
        // Only place blocks occasionally in the middle space
        if (caveNoiseValue < 0.3) {
          continue;
        }
      }
      
      // Position key
      const posKey = `${x},${y},${z}`;
      
      // Lava layer
      if (y < this.lavaLevel) {
        // Check if should be lava or solid
        if (y < this.lavaLevel - 2) {
          // Bottom layer is always lava
          this.blocks.set(posKey, { type: 'lava' });
        } else {
          // Near lava level, mix with netherrack based on noise
          const lavaEdgeNoise = Math.abs(this.terrainNoise.get3D(x, y, z));
          if (lavaEdgeNoise < 0.4) {
            this.blocks.set(posKey, { type: 'lava' });
          } else {
            // Soul sand varies the landscape
            if (isSoulSandArea && y >= this.lavaLevel - 5) {
              this.blocks.set(posKey, { type: 'soul_sand' });
            } else {
              this.blocks.set(posKey, { type: 'netherrack' });
            }
          }
        }
      }
      // Floor level terrain
      else if (y < this.floorLevel + 10) {
        // Terrain variation
        const normalizedHeight = (y - this.floorLevel) / 10;
        const heightFactor = 1 - normalizedHeight;
        
        // Combine noise factors to determine if block should be placed
        const combinedNoise = (terrainValue * 0.5 + 0.5) * heightFactor;
        
        if (combinedNoise > 0.35) {
          // Decide block type
          if (isSoulSandArea) {
            // Soul sand areas
            this.blocks.set(posKey, { type: 'soul_sand' });
            
            // Occasional gravel in soul sand areas
            if (this.terrainNoise.get3D(x, y, z) > 0.7 && y >= this.floorLevel + 1) {
              this.blocks.set(posKey, { type: 'gravel' });
            }
          } else {
            // Typical netherrack areas
            this.blocks.set(posKey, { type: 'netherrack' });
            
            // Add quartz ore veins
            const quartzValue = this.quartzNoise.get3D(x, y, z);
            if (quartzValue > 0.8) {
              this.blocks.set(posKey, { type: 'nether_quartz_ore' });
            }
            
            // Add magma blocks near lava level
            if (y === this.lavaLevel || y === this.lavaLevel + 1) {
              const magmaValue = Math.abs(this.terrainNoise.get3D(x, y * 0.5, z));
              if (magmaValue > 0.7) {
                this.blocks.set(posKey, { type: 'magma_block' });
              }
            }
          }
        }
      }
      // Ceiling level
      else if (y > this.ceilingHeight - 10) {
        // Ceiling tends to be more solid
        const ceilingNoise = this.terrainNoise.get3D(x, y, z) * 0.5 + 0.5;
        const normalizedHeight = (this.ceilingHeight - y) / 10;
        const heightFactor = 1 - normalizedHeight;
        
        if (ceilingNoise * heightFactor > 0.3) {
          this.blocks.set(posKey, { type: 'netherrack' });
          
          // Glowstone clusters on the ceiling
          const glowstoneValue = this.glowstoneNoise.get3D(x, y, z);
          if (glowstoneValue > 0.85 && y > this.ceilingHeight - 5) {
            this.blocks.set(posKey, { type: 'glowstone' });
          }
        }
      }
      // Middle area - sparse netherrack formations
      else {
        const middleNoise = this.caveNoise.get3D(x, y, z);
        
        // Floating islands
        if (middleNoise > 0.7) {
          this.blocks.set(posKey, { type: 'netherrack' });
        }
      }
    }
  }
  
  /**
   * Generates terrain around a player
   * @param {Object} player - The player
   * @param {Number} chunkRadius - Radius in chunks to generate
   */
  generateAroundPlayer(player, chunkRadius = 4) {
    if (!player || !player.position) return;
    
    // Get player chunk coordinates
    const playerChunkX = Math.floor(player.position.x / this.chunkSize);
    const playerChunkZ = Math.floor(player.position.z / this.chunkSize);
    
    // Generate chunks in radius
    for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
      for (let dz = -chunkRadius; dz <= chunkRadius; dz++) {
        const chunkX = playerChunkX + dx;
        const chunkZ = playerChunkZ + dz;
        
        this.generateChunk(chunkX, chunkZ);
      }
    }
  }
  
  /**
   * Places a nether fortress in the world
   * @param {Number} startX - Starting X coordinate
   * @param {Number} startY - Starting Y coordinate
   * @param {Number} startZ - Starting Z coordinate
   */
  placeNetherFortress(startX, startY, startZ) {
    // This would be a more complex implementation to generate a nether fortress
    // For demonstration, just place a simple platform
    const size = 10;
    
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const posKey = `${startX + x},${startY},${startZ + z}`;
        this.blocks.set(posKey, { type: 'nether_brick' });
        
        // Add walls and pillars
        if (x === 0 || x === size - 1 || z === 0 || z === size - 1) {
          for (let y = 1; y < 5; y++) {
            const wallPosKey = `${startX + x},${startY + y},${startZ + z}`;
            this.blocks.set(wallPosKey, { type: 'nether_brick' });
          }
        }
      }
    }
  }
  
  /**
   * Plays a sound in the nether dimension
   * @param {Object} soundData - Sound data
   */
  playSound(soundData) {
    if (!this.server) return;
    
    // Add dimension information
    const dimensionSoundData = {
      ...soundData,
      dimension: this.id
    };
    
    // Emit sound event
    this.server.emit('playSound', dimensionSoundData);
  }
  
  /**
   * Cleans up resources
   */
  cleanup() {
    // Clear blocks
    this.blocks.clear();
    
    // Clear entities
    this.entities.clear();
    
    // Clear generated chunks tracking
    this.generatedChunks.clear();
  }
  
  /**
   * Serialize the dimension for saving
   * @returns {Object} Serialized dimension data
   */
  serialize() {
    // Convert blocks map to object for JSON serialization
    const serializedBlocks = {};
    for (const [posKey, block] of this.blocks.entries()) {
      serializedBlocks[posKey] = block;
    }
    
    return {
      id: this.id,
      name: this.name,
      seed: this.seed,
      blocks: serializedBlocks,
      generatedChunks: Array.from(this.generatedChunks)
    };
  }
  
  /**
   * Deserialize dimension data
   * @param {Object} data - Serialized dimension data
   */
  deserialize(data) {
    if (!data) return;
    
    this.id = data.id || this.id;
    this.name = data.name || this.name;
    this.seed = data.seed || this.seed;
    
    // Reinitialize noise generators with the loaded seed
    this.initNoiseGenerators();
    
    // Load blocks
    this.blocks.clear();
    if (data.blocks) {
      for (const posKey in data.blocks) {
        this.blocks.set(posKey, data.blocks[posKey]);
      }
    }
    
    // Load generated chunks
    this.generatedChunks.clear();
    if (data.generatedChunks) {
      for (const chunkKey of data.generatedChunks) {
        this.generatedChunks.add(chunkKey);
      }
    }
  }
}

module.exports = NetherDimension; 