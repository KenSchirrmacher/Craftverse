/**
 * EndDimension - Represents The End dimension with specialized terrain generation
 */

const NoiseGenerator = require('../utils/noiseGenerator');
const { FBMNoise, InterpolatedNoise } = NoiseGenerator;

class EndDimension {
  /**
   * Create a new End dimension
   * @param {Object} options - Dimension options
   * @param {Number} options.seed - World seed
   * @param {Object} options.server - Server instance
   */
  constructor(options = {}) {
    this.id = 'end';
    this.name = 'The End';
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    this.server = options.server;
    
    // End blocks storage
    this.blocks = new Map();
    
    // Entities in the end
    this.entities = new Map();
    
    // Listeners for events
    this.listeners = new Map();
    
    // Initialize noise generators
    this.initNoiseGenerators();
    
    // Chunk tracking to identify which chunks are generated
    this.generatedChunks = new Set();
    this.chunkSize = 16;
    
    // End-specific settings
    this.islandRadius = 100;
    this.mainIslandHeight = 64;
    this.voidHeight = 0;
    
    // Dragon fight state
    this.dragonFightActive = false;
    this.dragonSpawned = false;
    this.enderCrystals = [];
    
    // Block types for end
    this.blockTypes = {
      end_stone: { name: 'End Stone', hardness: 3 },
      obsidian: { name: 'Obsidian', hardness: 50, blast_resistance: 1200 },
      bedrock: { name: 'Bedrock', hardness: -1, unbreakable: true },
      end_portal: { name: 'End Portal', hardness: -1, solid: false, transparent: true, light: 15 },
      end_portal_frame: { name: 'End Portal Frame', hardness: -1, unbreakable: true },
      end_gateway: { name: 'End Gateway', hardness: -1, solid: false, transparent: true, light: 15 },
      dragon_egg: { name: 'Dragon Egg', hardness: 3, drops: 'dragon_egg' },
      chorus_plant: { name: 'Chorus Plant', hardness: 0.4 },
      chorus_flower: { name: 'Chorus Flower', hardness: 0.4 },
      purpur_block: { name: 'Purpur Block', hardness: 1.5 },
      purpur_pillar: { name: 'Purpur Pillar', hardness: 1.5 },
      purpur_stairs: { name: 'Purpur Stairs', hardness: 1.5 },
      purpur_slab: { name: 'Purpur Slab', hardness: 1.5 },
      end_rod: { name: 'End Rod', hardness: 0, light: 14 },
      end_crystal: { name: 'End Crystal', hardness: 0, solid: false, transparent: true }
    };
  }
  
  /**
   * Initialize noise generators for terrain generation
   */
  initNoiseGenerators() {
    // Primary terrain noise
    this.terrainNoise = new FBMNoise({
      seed: this.seed,
      octaves: 6,
      persistence: 0.7,
      lacunarity: 1.8,
      scale: 100
    });
    
    // Outer islands noise
    this.islandsNoise = new FBMNoise({
      seed: this.seed + 1,
      octaves: 4,
      persistence: 0.5,
      lacunarity: 2.0,
      scale: 150
    });
    
    // Detail noise for surface variation
    this.detailNoise = new InterpolatedNoise({
      seed: this.seed + 2,
      scale: 20
    });
    
    // Chorus plant distribution
    this.chorusNoise = new InterpolatedNoise({
      seed: this.seed + 3,
      scale: 30
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
   * Adds an entity to the end dimension
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
   * Removes an entity from the end dimension
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
   * Generates a chunk of terrain in the end
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
        
        // Calculate distance from center (0,0)
        const distanceFromCenter = Math.sqrt(worldX * worldX + worldZ * worldZ);
        
        // Generate the main island
        if (distanceFromCenter < this.islandRadius) {
          this.generateMainIsland(worldX, worldZ);
        } 
        // Generate outer islands
        else if (distanceFromCenter > 1000) {
          this.generateOuterIslands(worldX, worldZ);
        }
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
   * Generates the main central island of The End
   * @param {Number} x - World X coordinate
   * @param {Number} z - World Z coordinate
   */
  generateMainIsland(x, z) {
    // Calculate distance from center (0,0)
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    
    // Calculate base height - higher in the center, falling off towards the edges
    let baseHeight = this.mainIslandHeight;
    
    // Distance falloff - island gets thinner at the edges
    if (distanceFromCenter > this.islandRadius * 0.3) {
      const falloffFactor = 1 - ((distanceFromCenter - this.islandRadius * 0.3) / (this.islandRadius * 0.7));
      baseHeight *= Math.max(0, falloffFactor * falloffFactor); // Square for smoother falloff
    }
    
    // Add noise variation to the height
    const noiseValue = this.terrainNoise.get2D(x, z);
    const heightVariation = noiseValue * 15; // Up to 15 blocks of variation
    
    const surfaceHeight = Math.round(baseHeight + heightVariation);
    
    // Generate end stone column down to void
    for (let y = this.voidHeight; y <= surfaceHeight; y++) {
      const posKey = `${x},${y},${z}`;
      this.blocks.set(posKey, { type: 'end_stone' });
      
      // Sometimes add obsidian pillars on the outer edges
      if (distanceFromCenter > this.islandRadius * 0.7 && 
          distanceFromCenter < this.islandRadius * 0.9 && 
          y > surfaceHeight - 5 && 
          this.detailNoise.getValue(x, 0, z) > 0.95) {
        
        // Create an obsidian pillar with an end crystal on top
        for (let pillarHeight = 0; pillarHeight < 10; pillarHeight++) {
          const pillarKey = `${x},${surfaceHeight + pillarHeight},${z}`;
          this.blocks.set(pillarKey, { type: 'obsidian' });
        }
        
        // Add end crystal on top of the pillar
        const crystalKey = `${x},${surfaceHeight + 10},${z}`;
        this.blocks.set(crystalKey, { type: 'end_crystal' });
        
        // Track this end crystal for the dragon fight
        this.enderCrystals.push({
          x, 
          y: surfaceHeight + 10, 
          z,
          health: 1,
          beamTarget: { x: 0, y: this.mainIslandHeight, z: 0 } // Beam points to center
        });
      }
    }
    
    // Add chorus plants on the outer part of the main island
    if (distanceFromCenter > this.islandRadius * 0.5 && 
        distanceFromCenter < this.islandRadius * 0.9 && 
        this.chorusNoise.getValue(x, 0, z) > 0.97) {
      
      this.generateChorusPlant(x, surfaceHeight + 1, z);
    }
    
    // Add bedrock at the exit portal location (center of the island)
    if (distanceFromCenter < 3) {
      // Create the exit portal structure
      if (distanceFromCenter < 1) {
        const portalKey = `${x},${this.mainIslandHeight},${z}`;
        this.blocks.set(portalKey, { type: 'end_portal' });
      }
      
      // Bedrock frame
      if (distanceFromCenter >= 1 && distanceFromCenter < 3) {
        const bedrockKey = `${x},${this.mainIslandHeight},${z}`;
        this.blocks.set(bedrockKey, { type: 'bedrock' });
      }
    }
  }
  
  /**
   * Generates the outer islands of The End
   * @param {Number} x - World X coordinate
   * @param {Number} z - World Z coordinate
   */
  generateOuterIslands(x, z) {
    // Use noise to determine if an island should generate here
    const islandNoise = this.islandsNoise.get2D(x, z);
    
    // Only generate islands where noise is high enough
    if (islandNoise > 0.7) {
      // Calculate base island height
      const baseHeight = this.mainIslandHeight - 20; // Outer islands are a bit lower
      
      // Island size is determined by how far the noise is above threshold
      const islandSize = (islandNoise - 0.7) * 30;
      
      // Add noise variation to the height
      const heightVariation = this.detailNoise.getValue(x, 0, z) * 10;
      
      const surfaceHeight = Math.round(baseHeight + heightVariation);
      
      // Generate end stone
      for (let y = surfaceHeight - islandSize; y <= surfaceHeight; y++) {
        const posKey = `${x},${y},${z}`;
        this.blocks.set(posKey, { type: 'end_stone' });
      }
      
      // Add chorus plants with higher probability on outer islands
      if (this.chorusNoise.getValue(x, 0, z) > 0.85) {
        this.generateChorusPlant(x, surfaceHeight + 1, z);
      }
      
      // Occasionally add end cities on larger islands
      if (islandSize > 10 && this.islandsNoise.get2D(x+50, z+50) > 0.85) {
        // This would be a placeholder for more detailed end city generation
        this.blocks.set(`${x},${surfaceHeight + 1},${z}`, { type: 'purpur_block' });
        this.blocks.set(`${x},${surfaceHeight + 2},${z}`, { type: 'purpur_block' });
        this.blocks.set(`${x},${surfaceHeight + 3},${z}`, { type: 'end_rod' });
      }
    }
  }
  
  /**
   * Generates a chorus plant at the specified position
   * @param {Number} x - X coordinate
   * @param {Number} y - Y coordinate
   * @param {Number} z - Z coordinate
   */
  generateChorusPlant(x, y, z) {
    // Set the chorus plant base
    this.blocks.set(`${x},${y},${z}`, { type: 'chorus_plant' });
    
    // Create a simple random number generator for this plant
    const rng = this.getPositionRNG(x, y, z);
    
    // Determine plant height (1-5 blocks)
    const height = 1 + Math.floor(rng() * 5);
    
    // Generate the main stem
    for (let i = 1; i <= height; i++) {
      this.blocks.set(`${x},${y + i},${z}`, { type: 'chorus_plant' });
      
      // Add branches with 40% chance per level above the first
      if (i > 0 && rng() < 0.4) {
        this.generateChorusPlantBranch(x, y + i, z, rng);
      }
    }
    
    // Add the flower on top
    this.blocks.set(`${x},${y + height + 1},${z}`, { type: 'chorus_flower' });
  }
  
  /**
   * Generates a branch for a chorus plant
   * @param {Number} x - Base X coordinate
   * @param {Number} y - Base Y coordinate
   * @param {Number} z - Base Z coordinate
   * @param {Function} rng - Random number generator
   */
  generateChorusPlantBranch(x, y, z, rng) {
    // Choose a direction
    const direction = Math.floor(rng() * 4);
    let dx = 0, dz = 0;
    
    // Set direction offsets
    switch(direction) {
      case 0: dx = 1; break;
      case 1: dx = -1; break;
      case 2: dz = 1; break;
      case 3: dz = -1; break;
    }
    
    // Place the branch block
    this.blocks.set(`${x + dx},${y},${z + dz}`, { type: 'chorus_plant' });
    
    // Determine branch height (0-2 blocks)
    const branchHeight = Math.floor(rng() * 3);
    
    // Generate the branch stem
    for (let i = 1; i <= branchHeight; i++) {
      this.blocks.set(`${x + dx},${y + i},${z + dz}`, { type: 'chorus_plant' });
    }
    
    // Add the flower on top of the branch
    this.blocks.set(`${x + dx},${y + branchHeight + 1},${z + dz}`, { type: 'chorus_flower' });
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
   * Get a random number generator based on position and seed
   * @param {Number} x - X coordinate
   * @param {Number} y - Y coordinate
   * @param {Number} z - Z coordinate
   * @param {Number} seed - Additional seed (optional)
   * @returns {Function} A random number generator function
   */
  getPositionRNG(x, y, z, seed = 0) {
    // Create a deterministic seed from the position
    const positionSeed = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) % 2147483647;
    const combinedSeed = (this.seed + positionSeed + seed) % 2147483647;
    
    // Simple LCG random number generator
    let state = combinedSeed;
    return function() {
      state = (state * 48271) % 2147483647;
      return state / 2147483647;
    };
  }
  
  /**
   * Spawns the Ender Dragon for the boss fight
   */
  spawnEnderDragon() {
    if (this.dragonSpawned) return;
    
    // Create the dragon entity
    const dragon = {
      id: 'ender_dragon',
      type: 'ender_dragon',
      position: { x: 0, y: this.mainIslandHeight + 20, z: 0 },
      health: 200,
      maxHealth: 200,
      isActive: true,
      phase: 'circling', // start in circling phase
      target: { x: 0, y: this.mainIslandHeight + 20, z: 0 },
      lastDamagedCrystal: null
    };
    
    // Add the dragon to entities
    this.entities.set(dragon.id, dragon);
    
    // Set dragon fight state
    this.dragonSpawned = true;
    this.dragonFightActive = true;
    
    // Notify clients
    if (this.server) {
      this.server.emit('dragonSpawned', { dragon });
    }
    
    return dragon;
  }
  
  /**
   * Handle dragon defeat - spawn egg, gateway, etc.
   */
  handleDragonDefeat() {
    // Set dragon fight as inactive
    this.dragonFightActive = false;
    this.dragonSpawned = false;
    
    // Spawn dragon egg at the exit portal
    this.blocks.set(`0,${this.mainIslandHeight + 1},0`, { type: 'dragon_egg' });
    
    // Create an end gateway somewhere on the island
    const gatewayDistance = this.islandRadius * 0.7;
    const gatewayAngle = Math.random() * Math.PI * 2;
    const gatewayX = Math.floor(Math.cos(gatewayAngle) * gatewayDistance);
    const gatewayZ = Math.floor(Math.sin(gatewayAngle) * gatewayDistance);
    
    // Find surface height at gateway position
    let gatewayY = 0;
    for (let y = this.mainIslandHeight + 30; y >= this.voidHeight; y--) {
      if (this.getBlockType({ x: gatewayX, y: y - 1, z: gatewayZ }) === 'end_stone') {
        gatewayY = y;
        break;
      }
    }
    
    // Create gateway blocks
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) {
          // Center is the gateway portal
          this.blocks.set(`${gatewayX},${gatewayY},${gatewayZ}`, { type: 'end_gateway' });
        } else {
          // Surrounding blocks are bedrock
          this.blocks.set(`${gatewayX + dx},${gatewayY},${gatewayZ + dz}`, { type: 'bedrock' });
        }
      }
    }
    
    // Notify clients
    if (this.server) {
      this.server.emit('dragonDefeated', { 
        gatewayPosition: { x: gatewayX, y: gatewayY, z: gatewayZ } 
      });
    }
  }
  
  /**
   * Plays a sound in the end dimension
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
    
    // Clear ender crystals
    this.enderCrystals = [];
    
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
    
    // Convert entities map to object
    const serializedEntities = {};
    for (const [entityId, entity] of this.entities.entries()) {
      serializedEntities[entityId] = entity;
    }
    
    return {
      id: this.id,
      name: this.name,
      seed: this.seed,
      blocks: serializedBlocks,
      entities: serializedEntities,
      enderCrystals: this.enderCrystals,
      dragonFightActive: this.dragonFightActive,
      dragonSpawned: this.dragonSpawned,
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
    
    // Load entities
    this.entities.clear();
    if (data.entities) {
      for (const entityId in data.entities) {
        this.entities.set(entityId, data.entities[entityId]);
      }
    }
    
    // Load ender crystals
    this.enderCrystals = data.enderCrystals || [];
    
    // Load dragon fight state
    this.dragonFightActive = data.dragonFightActive || false;
    this.dragonSpawned = data.dragonSpawned || false;
    
    // Load generated chunks
    this.generatedChunks.clear();
    if (data.generatedChunks) {
      for (const chunkKey of data.generatedChunks) {
        this.generatedChunks.add(chunkKey);
      }
    }
  }
}

module.exports = EndDimension; 