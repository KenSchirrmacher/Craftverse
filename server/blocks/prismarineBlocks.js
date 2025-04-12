/**
 * Prismarine Blocks - Ocean Monument specific blocks
 * Contains prismarine, prismarine bricks, dark prismarine, and sea lantern
 */
const Block = require('./block');

// Base Prismarine Block
class PrismarineBlock extends Block {
  constructor(properties = {}) {
    super(Object.assign({
      id: 'prismarine',
      name: 'Prismarine',
      hardness: 1.5,
      resistance: 6.0,
      toolType: 'pickaxe',
      minToolLevel: 1, // Stone pickaxe or better
      transparent: false,
      lightLevel: 0,
      gravity: false
    }, properties));
  }
  
  getDrops(toolType, toolLevel) {
    // Requires at least a wooden pickaxe to drop
    if (toolType === 'pickaxe' && toolLevel >= 0) {
      return [{ type: this.id, count: 1 }];
    }
    return [];
  }
}

// Prismarine Bricks Block
class PrismarineBricksBlock extends PrismarineBlock {
  constructor() {
    super({
      id: 'prismarine_bricks',
      name: 'Prismarine Bricks',
      hardness: 1.5, // Same hardness as base prismarine
      resistance: 6.0
    });
  }
}

// Dark Prismarine Block
class DarkPrismarineBlock extends PrismarineBlock {
  constructor() {
    super({
      id: 'dark_prismarine',
      name: 'Dark Prismarine',
      hardness: 1.5, // Same hardness as base prismarine
      resistance: 6.0
    });
  }
}

// Sea Lantern Block - emits light
class SeaLanternBlock extends Block {
  constructor() {
    super({
      id: 'sea_lantern',
      name: 'Sea Lantern',
      hardness: 0.3, // More fragile than prismarine
      resistance: 0.3,
      toolType: 'any', // Any tool works, but hand is slowest
      minToolLevel: 0,
      transparent: true, // Light can pass through
      lightLevel: 15, // Maximum light level (same as glowstone)
      gravity: false
    });
  }
  
  getDrops(toolType, toolLevel) {
    // Drops 2-3 prismarine crystals without Silk Touch
    // With Silk Touch, drops the sea lantern itself
    if (toolLevel >= 0) {
      if (this.hasSilkTouch) {
        return [{ type: 'sea_lantern', count: 1 }];
      } else {
        const crystalCount = Math.floor(Math.random() * 2) + 2; // 2-3 crystals
        return [{ type: 'prismarine_crystal', count: crystalCount }];
      }
    }
    return [];
  }
  
  // Sea lanterns emit light in all directions
  onBlockUpdate(world, x, y, z) {
    // Update lighting in the area
    world.updateLightLevel(x, y, z, this.lightLevel);
  }
  
  // Override place method to handle lighting when placed
  onPlace(world, x, y, z, player) {
    super.onPlace(world, x, y, z, player);
    
    // Update lighting when placed
    world.updateLightLevel(x, y, z, this.lightLevel);
  }
  
  // Override break method to handle lighting when removed
  onBreak(world, x, y, z, player) {
    super.onBreak(world, x, y, z, player);
    
    // Reset lighting when removed
    world.updateLightLevel(x, y, z, 0);
  }
}

// Export all block classes
module.exports = {
  PrismarineBlock,
  PrismarineBricksBlock,
  DarkPrismarineBlock,
  SeaLanternBlock
}; 