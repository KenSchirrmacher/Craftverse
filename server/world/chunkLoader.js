/**
 * ChunkLoader - Handles chunk loading, unloading, and persistence based on player positions
 */

const EventEmitter = require('events');

class ChunkLoader extends EventEmitter {
  /**
   * Creates a new Chunk Loader
   * @param {Object} options - Configuration options
   * @param {Object} options.world - World instance
   * @param {Number} options.viewDistance - View distance in chunks
   * @param {Number} options.unloadDelay - Delay in ms before unloading unused chunks
   * @param {Boolean} options.persistChunks - Whether to persist chunks to disk
   */
  constructor(options = {}) {
    super();
    this.world = options.world;
    this.viewDistance = options.viewDistance || 8;
    this.unloadDelay = options.unloadDelay || 30000; // 30 seconds default
    this.persistChunks = options.persistChunks !== false;
    
    // Track loaded chunks and their usage
    this.loadedChunks = new Map(); // Maps chunkKey -> {chunk, lastUsed, keepLoaded}
    
    // Track force-loaded chunks (e.g., spawn chunks)
    this.forceLoadedChunks = new Set();
    
    // Track chunk tickets - entities/processes that want chunks loaded
    this.chunkTickets = new Map(); // Maps chunkKey -> Set of ticket IDs
    
    // Queue for chunk loading/unloading
    this.loadQueue = [];
    this.unloadQueue = [];
    
    // Prioritize chunks near players
    this.playerChunks = new Map(); // Maps playerID -> Set of chunk keys
    
    // Interval for checking chunks to unload
    this.unloadInterval = setInterval(() => this.checkChunksToUnload(), 10000);
  }
  
  /**
   * Gets a unique key for a chunk position
   * @param {Number} x - Chunk X coordinate
   * @param {Number} z - Chunk Z coordinate
   * @returns {String} Chunk key
   */
  getChunkKey(x, z) {
    return `${x},${z}`;
  }
  
  /**
   * Parses a chunk key into coordinates
   * @param {String} key - Chunk key
   * @returns {Object} Chunk coordinates {x, z}
   */
  parseChunkKey(key) {
    const [x, z] = key.split(',').map(Number);
    return { x, z };
  }
  
  /**
   * Loads a chunk
   * @param {Number} x - Chunk X coordinate
   * @param {Number} z - Chunk Z coordinate
   * @param {Boolean} generate - Whether to generate the chunk if it doesn't exist
   * @returns {Promise<Object>} The loaded chunk
   */
  async loadChunk(x, z, generate = true) {
    const chunkKey = this.getChunkKey(x, z);
    
    // Check if already loaded
    if (this.loadedChunks.has(chunkKey)) {
      const chunkData = this.loadedChunks.get(chunkKey);
      chunkData.lastUsed = Date.now();
      return chunkData.chunk;
    }
    
    // Try to load from disk or generate
    try {
      let chunk;
      
      // Try to load from storage
      if (this.world.storage) {
        chunk = await this.world.storage.loadChunk(this.world.dimension, x, z);
      }
      
      // Generate if not found and generation is allowed
      if (!chunk && generate) {
        chunk = await this.world.generator.generateChunk(x, z);
        
        if (chunk) {
          // Save the newly generated chunk
          if (this.world.storage && this.persistChunks) {
            this.world.storage.saveChunk(this.world.dimension, x, z, chunk);
          }
        }
      }
      
      if (chunk) {
        // Store in loaded chunks map
        this.loadedChunks.set(chunkKey, {
          chunk,
          lastUsed: Date.now(),
          keepLoaded: this.forceLoadedChunks.has(chunkKey)
        });
        
        // Emit chunk loaded event
        this.emit('chunkLoaded', { x, z, chunk });
        
        return chunk;
      }
    } catch (error) {
      console.error(`Error loading chunk at ${x},${z}:`, error);
    }
    
    return null;
  }
  
  /**
   * Unloads a chunk
   * @param {Number} x - Chunk X coordinate
   * @param {Number} z - Chunk Z coordinate
   * @param {Boolean} forceSave - Whether to force save the chunk
   * @returns {Boolean} Whether the chunk was unloaded
   */
  async unloadChunk(x, z, forceSave = false) {
    const chunkKey = this.getChunkKey(x, z);
    
    // Check if this chunk is force-loaded
    if (this.forceLoadedChunks.has(chunkKey)) {
      return false;
    }
    
    // Check if this chunk has tickets
    if (this.chunkTickets.has(chunkKey) && this.chunkTickets.get(chunkKey).size > 0) {
      return false;
    }
    
    // Get the chunk data
    const chunkData = this.loadedChunks.get(chunkKey);
    if (!chunkData) {
      return false;
    }
    
    try {
      // Save the chunk if it's dirty or force save is requested
      if ((chunkData.chunk.dirty || forceSave) && this.world.storage && this.persistChunks) {
        await this.world.storage.saveChunk(this.world.dimension, x, z, chunkData.chunk);
      }
      
      // Remove from loaded chunks
      this.loadedChunks.delete(chunkKey);
      
      // Emit event
      this.emit('chunkUnloaded', { x, z });
      
      return true;
    } catch (error) {
      console.error(`Error unloading chunk at ${x},${z}:`, error);
      return false;
    }
  }
  
  /**
   * Forces a chunk to stay loaded
   * @param {Number} x - Chunk X coordinate
   * @param {Number} z - Chunk Z coordinate
   * @param {Boolean} keepLoaded - Whether to keep the chunk loaded
   */
  setForceLoaded(x, z, keepLoaded = true) {
    const chunkKey = this.getChunkKey(x, z);
    
    if (keepLoaded) {
      this.forceLoadedChunks.add(chunkKey);
      
      // Update the chunk data if already loaded
      if (this.loadedChunks.has(chunkKey)) {
        const chunkData = this.loadedChunks.get(chunkKey);
        chunkData.keepLoaded = true;
      } else {
        // Add to load queue if not already loaded
        this.queueChunkForLoading(x, z, true);
      }
    } else {
      this.forceLoadedChunks.delete(chunkKey);
      
      // Update the chunk data if loaded
      if (this.loadedChunks.has(chunkKey)) {
        const chunkData = this.loadedChunks.get(chunkKey);
        chunkData.keepLoaded = false;
      }
    }
  }
  
  /**
   * Adds a ticket to keep a chunk loaded
   * @param {Number} x - Chunk X coordinate
   * @param {Number} z - Chunk Z coordinate
   * @param {String} ticketId - Unique ticket identifier
   */
  addChunkTicket(x, z, ticketId) {
    const chunkKey = this.getChunkKey(x, z);
    
    if (!this.chunkTickets.has(chunkKey)) {
      this.chunkTickets.set(chunkKey, new Set());
    }
    
    this.chunkTickets.get(chunkKey).add(ticketId);
    
    // Make sure the chunk is loaded
    if (!this.loadedChunks.has(chunkKey)) {
      this.queueChunkForLoading(x, z, true);
    }
  }
  
  /**
   * Removes a ticket from a chunk
   * @param {Number} x - Chunk X coordinate
   * @param {Number} z - Chunk Z coordinate
   * @param {String} ticketId - Ticket identifier to remove
   */
  removeChunkTicket(x, z, ticketId) {
    const chunkKey = this.getChunkKey(x, z);
    
    if (this.chunkTickets.has(chunkKey)) {
      this.chunkTickets.get(chunkKey).delete(ticketId);
      
      // Clean up empty ticket sets
      if (this.chunkTickets.get(chunkKey).size === 0) {
        this.chunkTickets.delete(chunkKey);
      }
    }
  }
  
  /**
   * Queues a chunk for loading
   * @param {Number} x - Chunk X coordinate
   * @param {Number} z - Chunk Z coordinate
   * @param {Boolean} highPriority - Whether this is a high priority load
   */
  queueChunkForLoading(x, z, highPriority = false) {
    const chunkKey = this.getChunkKey(x, z);
    
    // Skip if already loaded or in queue
    if (this.loadedChunks.has(chunkKey)) {
      return;
    }
    
    // Check if already in queue
    const existingIndex = this.loadQueue.findIndex(item => item.key === chunkKey);
    if (existingIndex >= 0) {
      // If already in queue, possibly update priority
      if (highPriority) {
        this.loadQueue[existingIndex].priority = true;
      }
      return;
    }
    
    // Add to queue
    const queueItem = { key: chunkKey, x, z, priority: highPriority };
    
    if (highPriority) {
      // High priority items go to the front
      this.loadQueue.unshift(queueItem);
    } else {
      this.loadQueue.push(queueItem);
    }
  }
  
  /**
   * Queues a chunk for unloading
   * @param {Number} x - Chunk X coordinate
   * @param {Number} z - Chunk Z coordinate
   */
  queueChunkForUnloading(x, z) {
    const chunkKey = this.getChunkKey(x, z);
    
    // Skip if not loaded or already in unload queue
    if (!this.loadedChunks.has(chunkKey)) {
      return;
    }
    
    // Check if force loaded or has tickets
    if (this.forceLoadedChunks.has(chunkKey)) {
      return;
    }
    
    if (this.chunkTickets.has(chunkKey) && this.chunkTickets.get(chunkKey).size > 0) {
      return;
    }
    
    // Check if already in queue
    const existingIndex = this.unloadQueue.findIndex(item => item.key === chunkKey);
    if (existingIndex >= 0) {
      return;
    }
    
    // Add to unload queue
    this.unloadQueue.push({ key: chunkKey, x, z });
  }
  
  /**
   * Processes the chunk load queue
   * @param {Number} maxChunks - Maximum number of chunks to process
   */
  async processLoadQueue(maxChunks = 10) {
    // Process up to maxChunks chunks
    const toProcess = Math.min(maxChunks, this.loadQueue.length);
    
    if (toProcess === 0) return;
    
    // Process chunks
    for (let i = 0; i < toProcess; i++) {
      const { x, z } = this.loadQueue.shift();
      await this.loadChunk(x, z, true);
    }
  }
  
  /**
   * Processes the chunk unload queue
   * @param {Number} maxChunks - Maximum number of chunks to process
   */
  async processUnloadQueue(maxChunks = 5) {
    // Process up to maxChunks chunks
    const toProcess = Math.min(maxChunks, this.unloadQueue.length);
    
    if (toProcess === 0) return;
    
    // Process chunks
    for (let i = 0; i < toProcess; i++) {
      const { x, z } = this.unloadQueue.shift();
      await this.unloadChunk(x, z);
    }
  }
  
  /**
   * Updates chunks based on player position
   * @param {Object} player - Player object
   */
  updatePlayerChunks(player) {
    if (!player || !player.position) return;
    
    // Calculate player's chunk coordinates
    const playerChunkX = Math.floor(player.position.x / 16);
    const playerChunkZ = Math.floor(player.position.z / 16);
    
    // Create a set for this player if it doesn't exist
    if (!this.playerChunks.has(player.id)) {
      this.playerChunks.set(player.id, new Set());
    }
    
    const currentChunks = this.playerChunks.get(player.id);
    const newChunks = new Set();
    
    // Calculate chunks in view distance
    for (let dx = -this.viewDistance; dx <= this.viewDistance; dx++) {
      for (let dz = -this.viewDistance; dz <= this.viewDistance; dz++) {
        const chunkX = playerChunkX + dx;
        const chunkZ = playerChunkZ + dz;
        const chunkKey = this.getChunkKey(chunkX, chunkZ);
        
        // Prioritize chunks closer to the player
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance <= this.viewDistance) {
          newChunks.add(chunkKey);
          
          // Queue for loading if not already loaded
          if (!this.loadedChunks.has(chunkKey)) {
            // Higher priority for closer chunks
            const highPriority = distance <= 2;
            this.queueChunkForLoading(chunkX, chunkZ, highPriority);
          } else {
            // Update last used time
            const chunkData = this.loadedChunks.get(chunkKey);
            chunkData.lastUsed = Date.now();
          }
        }
      }
    }
    
    // Find chunks that are no longer in range
    const chunksToRemove = new Set();
    for (const chunkKey of currentChunks) {
      if (!newChunks.has(chunkKey)) {
        chunksToRemove.add(chunkKey);
      }
    }
    
    // Remove player references from chunks out of range
    for (const chunkKey of chunksToRemove) {
      currentChunks.delete(chunkKey);
      
      // Check if any players still need this chunk
      let isNeeded = false;
      for (const [_, playerChunks] of this.playerChunks) {
        if (playerChunks.has(chunkKey)) {
          isNeeded = true;
          break;
        }
      }
      
      // Queue for unloading if not needed
      if (!isNeeded) {
        const { x, z } = this.parseChunkKey(chunkKey);
        this.queueChunkForUnloading(x, z);
      }
    }
    
    // Update player's current chunks
    this.playerChunks.set(player.id, newChunks);
  }
  
  /**
   * Removes a player from chunk tracking
   * @param {String} playerId - Player ID
   */
  removePlayer(playerId) {
    if (!this.playerChunks.has(playerId)) return;
    
    const playerChunks = this.playerChunks.get(playerId);
    
    // Check each chunk to see if other players need it
    for (const chunkKey of playerChunks) {
      let isNeeded = false;
      
      for (const [pid, chunks] of this.playerChunks) {
        if (pid !== playerId && chunks.has(chunkKey)) {
          isNeeded = true;
          break;
        }
      }
      
      // Queue for unloading if not needed
      if (!isNeeded) {
        const { x, z } = this.parseChunkKey(chunkKey);
        this.queueChunkForUnloading(x, z);
      }
    }
    
    // Remove player from tracking
    this.playerChunks.delete(playerId);
  }
  
  /**
   * Checks for chunks that can be unloaded
   */
  checkChunksToUnload() {
    const now = Date.now();
    
    for (const [chunkKey, chunkData] of this.loadedChunks.entries()) {
      // Skip force-loaded chunks
      if (chunkData.keepLoaded) continue;
      
      // Skip chunks with tickets
      if (this.chunkTickets.has(chunkKey) && this.chunkTickets.get(chunkKey).size > 0) {
        continue;
      }
      
      // Check if any players are using this chunk
      let isPlayerChunk = false;
      for (const [_, playerChunks] of this.playerChunks) {
        if (playerChunks.has(chunkKey)) {
          isPlayerChunk = true;
          break;
        }
      }
      
      // Skip chunks in use by players
      if (isPlayerChunk) continue;
      
      // Check if it's been unused for long enough
      if (now - chunkData.lastUsed > this.unloadDelay) {
        const { x, z } = this.parseChunkKey(chunkKey);
        this.queueChunkForUnloading(x, z);
      }
    }
  }
  
  /**
   * Processes chunk queues
   */
  async processQueues() {
    // Process load queue first
    await this.processLoadQueue();
    
    // Then process unload queue
    await this.processUnloadQueue();
  }
  
  /**
   * Saves all loaded chunks
   */
  async saveAllChunks() {
    if (!this.world.storage || !this.persistChunks) {
      return;
    }
    
    const savePromises = [];
    
    for (const [chunkKey, chunkData] of this.loadedChunks.entries()) {
      if (chunkData.chunk.dirty) {
        const { x, z } = this.parseChunkKey(chunkKey);
        savePromises.push(
          this.world.storage.saveChunk(this.world.dimension, x, z, chunkData.chunk)
        );
      }
    }
    
    await Promise.all(savePromises);
  }
  
  /**
   * Gets an array of loaded chunk coordinates
   * @returns {Array} Array of {x, z} objects
   */
  getLoadedChunkCoordinates() {
    const coords = [];
    for (const chunkKey of this.loadedChunks.keys()) {
      coords.push(this.parseChunkKey(chunkKey));
    }
    return coords;
  }
  
  /**
   * Cleans up resources
   */
  dispose() {
    clearInterval(this.unloadInterval);
    this.removeAllListeners();
    
    // Save all chunks before disposing
    this.saveAllChunks().catch(err => {
      console.error('Error saving chunks during disposal:', err);
    });
  }
}

module.exports = ChunkLoader; 