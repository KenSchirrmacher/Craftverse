class Chunk {
  constructor(x, y, z, size) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.size = size;
    this.blocks = new Array(size * size * size).fill(null);
    this.blockStates = new Map();
    this.lightLevels = new Array(size * size * size).fill(0);
    this.isDirty = false;
  }

  getBlockIndex(x, y, z) {
    return x + (y * this.size) + (z * this.size * this.size);
  }

  getBlock(x, y, z) {
    if (!this.isValidPosition(x, y, z)) {
      return null;
    }
    const index = this.getBlockIndex(x, y, z);
    return this.blocks[index];
  }

  setBlock(x, y, z, block) {
    if (!this.isValidPosition(x, y, z)) {
      return false;
    }
    const index = this.getBlockIndex(x, y, z);
    this.blocks[index] = block;
    this.isDirty = true;
    return true;
  }

  getBlockState(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blockStates.get(key);
  }

  setBlockState(x, y, z, state) {
    if (!this.isValidPosition(x, y, z)) {
      return false;
    }
    const key = `${x},${y},${z}`;
    this.blockStates.set(key, state);
    this.isDirty = true;
    return true;
  }

  getLightLevel(x, y, z) {
    if (!this.isValidPosition(x, y, z)) {
      return 0;
    }
    const index = this.getBlockIndex(x, y, z);
    return this.lightLevels[index];
  }

  setLightLevel(x, y, z, level) {
    if (!this.isValidPosition(x, y, z)) {
      return false;
    }
    const index = this.getBlockIndex(x, y, z);
    this.lightLevels[index] = level;
    this.isDirty = true;
    return true;
  }

  isValidPosition(x, y, z) {
    return x >= 0 && x < this.size &&
           y >= 0 && y < this.size &&
           z >= 0 && z < this.size;
  }

  save() {
    if (!this.isDirty) {
      return;
    }
    // In a real implementation, this would save the chunk to disk
    // For testing purposes, we'll just mark it as clean
    this.isDirty = false;
  }

  load() {
    // In a real implementation, this would load the chunk from disk
    // For testing purposes, we'll just return true
    return true;
  }

  getWorldPosition(x, y, z) {
    return {
      x: this.x * this.size + x,
      y: this.y * this.size + y,
      z: this.z * this.size + z
    };
  }

  getChunkPosition(x, y, z) {
    return {
      x: x - (this.x * this.size),
      y: y - (this.y * this.size),
      z: z - (this.z * this.size)
    };
  }
}

module.exports = { Chunk }; 