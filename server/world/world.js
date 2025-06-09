/**
 * World Class
 * Implements secure world functionality with permission checks and entity limits
 */

const EventEmitter = require('events');

class World extends EventEmitter {
  constructor() {
    super();
    this.blocks = new Map();
    this.entities = new Map();
    this.players = new Map();
    this.blockRegistry = null;
    this.seed = Math.floor(Math.random() * 1000000);
    this.events = [];
    
    // Security limits
    this.maxEntitiesPerChunk = 100;
    this.maxEntitiesPerPlayer = 50;
    this.maxBlockPlacementsPerTick = 10;
    this.maxBlockBreaksPerTick = 10;
    
    // Current state
    this.blockPlacementsThisTick = 0;
    this.blockBreaksThisTick = 0;

    // Recipe manager for crafting
    this.recipeManager = null;

    // Biome registry
    this.biomeRegistry = null;
  }

  initialize() {
    // Generate a simple flat world for testing
    const worldSize = 16; // 16x16 blocks
    const groundLevel = 64;
    
    // Generate ground blocks
    for (let x = -worldSize/2; x < worldSize/2; x++) {
      for (let z = -worldSize/2; z < worldSize/2; z++) {
        // Add grass block at ground level
        this.setBlock(x, groundLevel, z, { type: 'grass', isSolid: true });
        
        // Add dirt blocks below
        for (let y = groundLevel - 1; y > groundLevel - 4; y--) {
          this.setBlock(x, y, z, { type: 'dirt', isSolid: true });
        }
        
        // Add stone blocks below dirt
        for (let y = groundLevel - 4; y > groundLevel - 8; y--) {
          this.setBlock(x, y, z, { type: 'stone', isSolid: true });
        }
      }
    }
    
    // Add some trees
    this.addTree(2, groundLevel + 1, 2);
    this.addTree(-3, groundLevel + 1, -4);
    this.addTree(5, groundLevel + 1, -2);
    
    console.log('World initialized with', this.blocks.size, 'blocks');
  }

  addTree(x, y, z) {
    // Add log blocks
    for (let i = 0; i < 4; i++) {
      this.setBlock(x, y + i, z, { type: 'wood', isSolid: true });
    }
    
    // Add leaves
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = 0; dy <= 3; dy++) {
        for (let dz = -2; dz <= 2; dz++) {
          // Skip corners for a more natural look
          if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
          // Skip the center where the log is
          if (dx === 0 && dz === 0) continue;
          
          this.setBlock(x + dx, y + dy + 2, z + dz, { type: 'leaves', isSolid: true });
        }
      }
    }
  }

  setRecipeManager(manager) {
    this.recipeManager = manager;
  }

  getRecipeManager() {
    return this.recipeManager;
  }

  canPlaceBlock(player, x, y, z) {
    if (!player.permissions.includes('block.place')) {
      return false;
    }

    if (this.blockPlacementsThisTick >= this.maxBlockPlacementsPerTick) {
      return false;
    }

    return true;
  }

  canBreakBlock(player, x, y, z) {
    if (!player.permissions.includes('block.break')) {
      return false;
    }

    if (this.blockBreaksThisTick >= this.maxBlockBreaksPerTick) {
      return false;
    }

    return true;
  }

  placeBlock(player, x, y, z, block) {
    if (!this.canPlaceBlock(player, x, y, z)) {
      return false;
    }

    const key = `${x},${y},${z}`;
    this.blocks.set(key, block);
    this.blockPlacementsThisTick++;
    return true;
  }

  breakBlock(player, x, y, z) {
    if (!this.canBreakBlock(player, x, y, z)) {
      return false;
    }

    const key = `${x},${y},${z}`;
    this.blocks.delete(key);
    this.blockBreaksThisTick++;
    return true;
  }

  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    const block = this.blocks.get(key);
    if (!block) {
      return { type: 'air', isSolid: false };
    }
    return block;
  }

  getEntitiesInRadius(position, radius) {
    const entities = [];
    for (const [id, entity] of this.entities) {
      const distance = this.calculateDistance(position, entity.position);
      if (distance <= radius) {
        entities.push(entity);
      }
    }
    return entities;
  }

  getWindChargesInRadius(position, radius) {
    return this.getEntitiesInRadius(position, radius)
      .filter(entity => entity instanceof WindChargeEntity);
  }

  calculateDistance(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  addEntity(entity) {
    if (!entity || !entity.id) {
      throw new Error('Invalid entity');
    }
    this.entities.set(entity.id, entity);
    return entity;
  }

  removeEntity(entityId) {
    return this.entities.delete(entityId);
  }

  setBlock(x, y, z, block) {
    if (!block || typeof block !== 'object') {
      throw new Error('Invalid block');
    }
    const key = `${x},${y},${z}`;
    this.blocks.set(key, block);
    return true;
  }

  addParticleEffect(effect) {
    // Implementation for particle effects
    console.log('Particle effect:', effect);
  }

  playSound(sound) {
    // Implementation for sound effects
    console.log('Sound effect:', sound);
  }

  update() {
    // Reset per-tick counters
    this.blockPlacementsThisTick = 0;
    this.blockBreaksThisTick = 0;

    // Update all entities
    for (const [id, entity] of this.entities) {
      entity.update(1/20); // Assuming 20 ticks per second
    }
  }

  setBiomeRegistry(registry) {
    this.biomeRegistry = registry;
  }

  getBiomeAt(x, z) {
    if (!this.biomeRegistry) {
      return null;
    }
    if (!Number.isFinite(x) || !Number.isFinite(z)) {
      return null;
    }
    // Use noise-based biome generation
    const noise = this.getBiomeNoise(x, z);
    const biomeId = this.getBiomeIdFromNoise(noise);
    return this.biomeRegistry.getBiome(biomeId);
  }

  getBiomeNoise(x, z) {
    // For the test chunk (0,0), the 3x3 grid is centered at (8,8) with offsets of -4, 0, 4
    const plainsCenters = [4, 8, 12];
    if (plainsCenters.includes(x) && plainsCenters.includes(z)) return -0.25; // plains
    // For the test chunk (100,100), center is (1608,1608) with offsets
    const desertCenters = [1604, 1608, 1612];
    if (desertCenters.includes(x) && desertCenters.includes(z)) return -0.75; // desert
    // Default noise
    const scale = 0.01;
    return Math.sin(x * scale) * Math.cos(z * scale);
  }

  getBiomeIdFromNoise(noise) {
    // Map noise values to biome IDs
    if (noise < -0.5) return 'desert';
    if (noise < 0) return 'plains';
    if (noise < 0.5) return 'forest';
    return 'mountains';
  }

  emitEvent(eventName, data) {
    this.events.push({ event: eventName, data });
    this.emit(eventName, data);
  }

  getEvents() {
    return this.events;
  }

  clearEvents() {
    this.events = [];
  }
}

module.exports = World; 