const { BlockRegistry } = require('../blocks/blockRegistry');
const { EntityRegistry } = require('../entity/entityRegistry');

class World {
  constructor() {
    this.blocks = new Map();
    this.entities = new Map();
    this.blockStates = new Map();
    this.particleEffects = [];
    this.soundEffects = [];
    this.dimension = 'overworld';
  }

  getBlock(x, y, z) {
    return this.blocks.get(`${x},${y},${z}`);
  }

  setBlock(x, y, z, block) {
    this.blocks.set(`${x},${y},${z}`, block);
  }

  getBlockState(x, y, z) {
    return this.blockStates.get(`${x},${y},${z}`);
  }

  setBlockState(x, y, z, state) {
    this.blockStates.set(`${x},${y},${z}`, state);
  }

  addEntity(entity) {
    this.entities.set(entity.id, entity);
  }

  removeEntity(entityId) {
    this.entities.delete(entityId);
  }

  getEntity(entityId) {
    return this.entities.get(entityId);
  }

  addParticleEffect(effect) {
    this.particleEffects.push(effect);
  }

  playSound(sound) {
    this.soundEffects.push(sound);
  }

  setDimension(dimension) {
    this.dimension = dimension;
  }

  getDimension() {
    return this.dimension;
  }

  // Helper method to check if a position is within bounds
  isInBounds(x, y, z) {
    return x >= -30000000 && x <= 30000000 &&
           y >= 0 && y <= 256 &&
           z >= -30000000 && z <= 30000000;
  }

  // Helper method to get all blocks in a region
  getBlocksInRegion(x1, y1, z1, x2, y2, z2) {
    const blocks = [];
    for (let x = x1; x <= x2; x++) {
      for (let y = y1; y <= y2; y++) {
        for (let z = z1; z <= z2; z++) {
          const block = this.getBlock(x, y, z);
          if (block) {
            blocks.push({ x, y, z, block });
          }
        }
      }
    }
    return blocks;
  }

  getParticleCount() {
    return this.particles.length;
  }

  getSoundCount() {
    return this.sounds.length;
  }

  addParticleEffect(particle) {
    this.particles.push(particle);
  }

  playSound(sound) {
    this.sounds.push(sound);
  }
}

module.exports = { World }; 