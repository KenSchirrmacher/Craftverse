const { Chunk } = require('./Chunk');

class ChunkManager {
  constructor(world) {
    this.world = world;
    this.chunks = new Map();
    this.chunkSize = 16;
  }

  createChunk(x, y, z) {
    const chunkKey = this.getChunkKey(x, y, z);
    if (this.chunks.has(chunkKey)) {
      return this.chunks.get(chunkKey);
    }

    const chunk = new Chunk(x, y, z, this.chunkSize);
    this.chunks.set(chunkKey, chunk);
    return chunk;
  }

  getChunkAt(x, y, z) {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);
    const chunkZ = Math.floor(z / this.chunkSize);
    const chunkKey = this.getChunkKey(chunkX, chunkY, chunkZ);
    
    return this.chunks.get(chunkKey) || this.createChunk(chunkX, chunkY, chunkZ);
  }

  getChunkKey(x, y, z) {
    return `${x},${y},${z}`;
  }

  unloadChunk(x, y, z) {
    const chunkKey = this.getChunkKey(x, y, z);
    if (this.chunks.has(chunkKey)) {
      const chunk = this.chunks.get(chunkKey);
      chunk.save();
      this.chunks.delete(chunkKey);
    }
  }

  saveChunks() {
    for (const chunk of this.chunks.values()) {
      chunk.save();
    }
  }

  loadChunks() {
    // In a real implementation, this would load chunks from disk
    // For testing purposes, we'll just create new chunks
    return true;
  }

  getLoadedChunks() {
    return Array.from(this.chunks.values());
  }

  isChunkLoaded(x, y, z) {
    const chunkKey = this.getChunkKey(x, y, z);
    return this.chunks.has(chunkKey);
  }
}

module.exports = { ChunkManager }; 