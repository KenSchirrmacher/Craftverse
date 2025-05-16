/**
 * World - Main world class that manages all world systems
 */

const { EventEmitter } = require('events');
const WorldGenerator = require('./utils/worldGenerator');
const ParticleSystem = require('./particles/particleSystem');
const ArchaeologyManager = require('./archaeology/archaeologyManager');

class World extends EventEmitter {
  /**
   * Create a new world
   * @param {Object} options - World options
   */
  constructor(options = {}) {
    super();
    
    // Basic world properties
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    this.name = options.name || 'World';
    this.dimension = options.dimension || 'overworld';
    this.timeOfDay = options.timeOfDay || 0; // 0-1 representing time of day
    this.minHeight = options.minHeight || 0;
    this.maxHeight = options.maxHeight || 256;
    this.seaLevel = options.seaLevel || 63;
    
    // Create world generator
    this.generator = options.generator || new WorldGenerator({
      seed: this.seed,
      seaLevel: this.seaLevel,
      worldHeight: this.maxHeight,
      worldDepth: this.minHeight
    });
    
    // Create particle system
    this.particleSystem = options.particleSystem || new ParticleSystem();
    
    // Storage for blocks, entities
    this.blocks = new Map();
    this.entities = new Map();
    this.players = new Map();
    this.chunksGenerated = new Set();
    
    // Create archaeology manager
    this.archaeologyManager = new ArchaeologyManager(this);
    this.archaeologyManager.initialize();
    
    // World state
    this.initialized = false;
    this.ticks = 0;
  }
  
  /**
   * Initialize the world
   */
  initialize() {
    if (this.initialized) return;
    
    this.initialized = true;
    this.emit('initialized');
  }
  
  /**
   * Update the world state
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    // Update time of day
    this.timeOfDay = (this.timeOfDay + 0.00001 * deltaTime) % 1;
    
    // Update particles
    if (this.particleSystem) {
      this.particleSystem.update(deltaTime);
    }
    
    // Update entities
    this.updateEntities(deltaTime);
    
    // Increment tick counter
    this.ticks++;
    
    // Emit tick event for other systems
    this.emit('tick', { deltaTime, tick: this.ticks });
  }
  
  /**
   * Update all entities in the world
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  updateEntities(deltaTime) {
    for (const entity of this.entities.values()) {
      if (entity.update && typeof entity.update === 'function') {
        entity.update(this, this.getPlayersNearEntity(entity), this.getEntitiesNearEntity(entity), deltaTime);
      }
    }
  }
  
  /**
   * Get all players near an entity
   * @param {Object} entity - Entity to check
   * @param {number} range - Range to check (default: 64)
   * @returns {Array} - Array of nearby players
   */
  getPlayersNearEntity(entity, range = 64) {
    if (!entity || !entity.position) return [];
    
    const nearbyPlayers = [];
    const rangeSquared = range * range;
    
    for (const player of this.players.values()) {
      if (this.getDistanceSquared(entity.position, player.position) <= rangeSquared) {
        nearbyPlayers.push(player);
      }
    }
    
    return nearbyPlayers;
  }
  
  /**
   * Get all entities near an entity
   * @param {Object} entity - Entity to check
   * @param {number} range - Range to check (default: 16)
   * @returns {Array} - Array of nearby entities
   */
  getEntitiesNearEntity(entity, range = 16) {
    if (!entity || !entity.position) return [];
    
    const nearbyEntities = [];
    const rangeSquared = range * range;
    
    for (const otherEntity of this.entities.values()) {
      if (otherEntity.id === entity.id) continue;
      
      if (this.getDistanceSquared(entity.position, otherEntity.position) <= rangeSquared) {
        nearbyEntities.push(otherEntity);
      }
    }
    
    return nearbyEntities;
  }
  
  /**
   * Get squared distance between two positions
   * @private
   * @param {Object} pos1 - First position
   * @param {Object} pos2 - Second position
   * @returns {number} - Squared distance
   */
  getDistanceSquared(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    return dx * dx + dy * dy + dz * dz;
  }
  
  /**
   * Add an entity to the world
   * @param {Object} entity - Entity to add
   */
  addEntity(entity) {
    if (!entity || !entity.id) return;
    
    this.entities.set(entity.id, entity);
    this.emit('entityAdded', { entity });
  }
  
  /**
   * Remove an entity from the world
   * @param {string} id - Entity ID to remove
   */
  removeEntity(id) {
    if (!id) return;
    
    const entity = this.entities.get(id);
    if (entity) {
      this.entities.delete(id);
      this.emit('entityRemoved', { id, entity });
    }
  }
  
  /**
   * Add a player to the world
   * @param {Object} player - Player to add
   */
  addPlayer(player) {
    if (!player || !player.id) return;
    
    this.players.set(player.id, player);
    this.emit('playerJoined', { player });
  }
  
  /**
   * Remove a player from the world
   * @param {string} id - Player ID to remove
   */
  removePlayer(id) {
    if (!id) return;
    
    const player = this.players.get(id);
    if (player) {
      this.players.delete(id);
      this.emit('playerLeft', { id, player });
    }
  }
  
  /**
   * Get a block at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @returns {Object|null} - Block data or null if not found
   */
  getBlockAt(x, y, z) {
    // Bounds check
    if (y < this.minHeight || y >= this.maxHeight) return null;
    
    // Check if block is already in memory
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    if (this.blocks.has(key)) {
      return this.blocks.get(key);
    }
    
    // If block isn't in memory, try to generate it
    return this.generator.getBlockAt(x, y, z);
  }
  
  /**
   * Set a block at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {string} type - Block type
   * @param {Object} metadata - Block metadata
   * @returns {boolean} - Whether the block was set successfully
   */
  setBlockAt(x, y, z, type, metadata = {}) {
    // Bounds check
    if (y < this.minHeight || y >= this.maxHeight) return false;
    
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    
    if (type === null || type === 'air') {
      // Remove block
      this.blocks.delete(key);
    } else {
      // Add or update block
      this.blocks.set(key, { type, metadata });
    }
    
    // Emit block update event
    this.emit('blockUpdate', {
      x: Math.floor(x),
      y: Math.floor(y),
      z: Math.floor(z),
      type,
      metadata
    });
    
    return true;
  }
  
  /**
   * Check if a position is in water
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @returns {boolean} - Whether the position is in water
   */
  isWaterAt(x, y, z) {
    const block = this.getBlockAt(x, y, z);
    return block && block.type === 'water';
  }
  
  /**
   * Get the water level at a specific position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @returns {number|null} - Y coordinate of water level or null if no water
   */
  getWaterLevel(x, z) {
    // Default to sea level if generator doesn't have a specific method
    return this.seaLevel;
  }
  
  /**
   * Get the highest block Y position at a specific X,Z coordinate
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @returns {number|null} - Y coordinate of highest block or null
   */
  getHighestBlock(x, z) {
    // Try to use generator if available
    if (this.generator && typeof this.generator.getHighestBlock === 'function') {
      return this.generator.getHighestBlock(x, z);
    }
    
    // Otherwise, search from top to bottom
    for (let y = this.maxHeight - 1; y >= this.minHeight; y--) {
      const block = this.getBlockAt(x, y, z);
      if (block && block.type !== 'air' && block.type !== 'water') {
        return y;
      }
    }
    
    return null;
  }
  
  /**
   * Get the biome at a specific position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @returns {Object|null} - Biome data or null
   */
  getBiomeAt(x, z) {
    if (this.generator && this.generator.biomeManager) {
      return this.generator.biomeManager.getBiomeAt(x, z);
    }
    return null;
  }
  
  /**
   * Send particles to all players in range
   * @param {Object} options - Particle options
   * @returns {number[]} - Array of particle IDs created
   */
  sendParticles(options) {
    if (!this.particleSystem) return [];
    
    return this.particleSystem.emitParticles(options);
  }
  
  /**
   * Play a sound at the specified position
   * @param {string} sound - Sound name
   * @param {Object} position - Position to play sound
   * @param {Object} options - Sound options (volume, pitch)
   */
  playSound(sound, position, options = {}) {
    this.emit('playSound', { sound, position, options });
  }
  
  /**
   * Notify players of a chunk being generated
   * @param {Object} chunk - Chunk data
   */
  notifyChunkGenerated(chunk) {
    if (!chunk || !chunk.x || !chunk.z) return;
    
    const key = `${chunk.x},${chunk.z}`;
    if (this.chunksGenerated.has(key)) return;
    
    this.chunksGenerated.add(key);
    this.emit('chunkGenerated', chunk);
  }
  
  /**
   * Serialize world data for saving
   * @returns {Object} - Serialized world data
   */
  serialize() {
    // Convert blocks map to object for serialization
    const serializedBlocks = {};
    for (const [key, block] of this.blocks.entries()) {
      serializedBlocks[key] = block;
    }
    
    // Serialize entities
    const serializedEntities = [];
    for (const entity of this.entities.values()) {
      if (entity.serialize && typeof entity.serialize === 'function') {
        serializedEntities.push(entity.serialize());
      }
    }
    
    return {
      seed: this.seed,
      name: this.name,
      dimension: this.dimension,
      timeOfDay: this.timeOfDay,
      ticks: this.ticks,
      blocks: serializedBlocks,
      entities: serializedEntities,
      archaeology: this.archaeologyManager ? this.archaeologyManager.serialize() : null
    };
  }
  
  /**
   * Deserialize world data from saved state
   * @param {Object} data - Serialized world data
   */
  deserialize(data) {
    if (!data) return;
    
    // Restore basic properties
    this.seed = data.seed || this.seed;
    this.name = data.name || this.name;
    this.dimension = data.dimension || this.dimension;
    this.timeOfDay = data.timeOfDay || this.timeOfDay;
    this.ticks = data.ticks || this.ticks;
    
    // Restore blocks
    this.blocks.clear();
    if (data.blocks) {
      for (const [key, block] of Object.entries(data.blocks)) {
        this.blocks.set(key, block);
      }
    }
    
    // Restore archaeology data
    if (data.archaeology && this.archaeologyManager) {
      this.archaeologyManager.deserialize(data.archaeology);
    }
    
    // Note: Entities are typically handled separately with their own deserialization
  }
}

module.exports = World; 