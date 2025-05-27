/**
 * World Class
 * Implements secure world functionality with permission checks and entity limits
 */

class World {
  constructor() {
    this.blocks = new Map();
    this.entities = new Map();
    this.players = new Map();
    
    // Security limits
    this.maxEntitiesPerChunk = 100;
    this.maxEntitiesPerPlayer = 50;
    this.maxBlockPlacementsPerTick = 10;
    this.maxBlockBreaksPerTick = 10;
    
    // Current state
    this.blockPlacementsThisTick = 0;
    this.blockBreaksThisTick = 0;
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
    return this.blocks.get(key) || { type: 'air', isSolid: false };
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

  update() {
    // Reset per-tick counters
    this.blockPlacementsThisTick = 0;
    this.blockBreaksThisTick = 0;

    // Update all entities
    for (const [id, entity] of this.entities) {
      entity.update();
    }
  }
}

module.exports = World; 