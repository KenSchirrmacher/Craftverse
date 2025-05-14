/**
 * Nether Update Blocks
 * Implements the new block types introduced in the Nether Update:
 * - Ancient Debris
 * - Basalt (normal, polished)
 * - Blackstone (normal, polished, chiseled, gilded)
 * - Nether Gold Ore
 * - Soul Soil
 * - Soul Fire related blocks
 */

const Block = require('./block');
const { BlockFace } = require('./blockFace');

/**
 * Ancient Debris - A rare ore found in the Nether that can be smelted into Netherite Scrap
 * Has high blast resistance and requires a diamond pickaxe or better to mine
 */
class AncientDebrisBlock extends Block {
  constructor(position) {
    super({
      position,
      type: 'ancient_debris',
      isSolid: true,
      isTransparent: false,
      isFlammable: false,
      lightLevel: 0,
      hardness: 30,
      blastResistance: 1200,
      requiredTool: 'diamond_pickaxe',
      drops: [{ type: 'ancient_debris', count: 1 }]
    });
  }
}

/**
 * Basalt Block - A decorative block found in the Nether
 * Has slight blast resistance and pillar-like orientation
 */
class BasaltBlock extends Block {
  constructor(position, orientation = 'vertical') {
    super({
      position,
      type: 'basalt',
      isSolid: true,
      isTransparent: false,
      isFlammable: false,
      lightLevel: 0,
      hardness: 1.25,
      blastResistance: 4.2,
      requiredTool: 'pickaxe',
      drops: [{ type: 'basalt', count: 1 }],
      metadata: { orientation }
    });
    
    this.orientation = orientation; // vertical, east_west, north_south
  }

  /**
   * Gets the correct texture variant based on orientation
   */
  getTextureForFace(face) {
    if (this.orientation === 'vertical') {
      if (face === BlockFace.TOP || face === BlockFace.BOTTOM) {
        return 'basalt_top';
      }
      return 'basalt_side';
    } else if (this.orientation === 'east_west') {
      if (face === BlockFace.EAST || face === BlockFace.WEST) {
        return 'basalt_top';
      }
      return 'basalt_side';
    } else { // north_south
      if (face === BlockFace.NORTH || face === BlockFace.SOUTH) {
        return 'basalt_top';
      }
      return 'basalt_side';
    }
  }

  /**
   * Update the block orientation when placed by a player
   */
  onPlaced(world, player, placementData) {
    if (placementData && placementData.face) {
      if (placementData.face === BlockFace.TOP || placementData.face === BlockFace.BOTTOM) {
        this.orientation = 'vertical';
      } else if (placementData.face === BlockFace.EAST || placementData.face === BlockFace.WEST) {
        this.orientation = 'east_west';
      } else {
        this.orientation = 'north_south';
      }
      this.metadata.orientation = this.orientation;
    }
    return true;
  }
}

/**
 * Polished Basalt - A smooth variant of basalt created by crafting
 */
class PolishedBasaltBlock extends BasaltBlock {
  constructor(position, orientation = 'vertical') {
    super(position, orientation);
    this.type = 'polished_basalt';
    this.drops = [{ type: 'polished_basalt', count: 1 }];
  }

  /**
   * Gets the correct texture variant based on orientation
   */
  getTextureForFace(face) {
    if (this.orientation === 'vertical') {
      if (face === BlockFace.TOP || face === BlockFace.BOTTOM) {
        return 'polished_basalt_top';
      }
      return 'polished_basalt_side';
    } else if (this.orientation === 'east_west') {
      if (face === BlockFace.EAST || face === BlockFace.WEST) {
        return 'polished_basalt_top';
      }
      return 'polished_basalt_side';
    } else { // north_south
      if (face === BlockFace.NORTH || face === BlockFace.SOUTH) {
        return 'polished_basalt_top';
      }
      return 'polished_basalt_side';
    }
  }
}

/**
 * Blackstone - A stone variant found in the Nether
 * Functions similarly to normal stone but has different appearance
 */
class BlackstoneBlock extends Block {
  constructor(position) {
    super({
      position,
      type: 'blackstone',
      isSolid: true,
      isTransparent: false,
      isFlammable: false,
      lightLevel: 0,
      hardness: 1.5,
      blastResistance: 6,
      requiredTool: 'pickaxe',
      drops: [{ type: 'blackstone', count: 1 }]
    });
  }
}

/**
 * Polished Blackstone - A smooth variant of blackstone
 */
class PolishedBlackstoneBlock extends Block {
  constructor(position) {
    super({
      position,
      type: 'polished_blackstone',
      isSolid: true,
      isTransparent: false,
      isFlammable: false,
      lightLevel: 0,
      hardness: 2,
      blastResistance: 6,
      requiredTool: 'pickaxe',
      drops: [{ type: 'polished_blackstone', count: 1 }]
    });
  }
}

/**
 * Chiseled Polished Blackstone - A decorative variant of polished blackstone
 */
class ChiseledPolishedBlackstoneBlock extends Block {
  constructor(position) {
    super({
      position,
      type: 'chiseled_polished_blackstone',
      isSolid: true,
      isTransparent: false,
      isFlammable: false,
      lightLevel: 0,
      hardness: 1.5,
      blastResistance: 6,
      requiredTool: 'pickaxe',
      drops: [{ type: 'chiseled_polished_blackstone', count: 1 }]
    });
  }
}

/**
 * Gilded Blackstone - A special blackstone variant that can drop gold nuggets when mined
 */
class GildedBlackstoneBlock extends Block {
  constructor(position) {
    super({
      position,
      type: 'gilded_blackstone',
      isSolid: true,
      isTransparent: false,
      isFlammable: false,
      lightLevel: 0,
      hardness: 1.5,
      blastResistance: 6,
      requiredTool: 'pickaxe',
      // Special drop logic implemented in getDrops()
    });
  }

  /**
   * Custom drop logic - chance to drop gold nuggets
   */
  getDrops(toolType, toolTier, enchantments = {}) {
    // Check for silk touch
    if (enchantments.silkTouch) {
      return [{ type: 'gilded_blackstone', count: 1 }];
    }
    
    // 10% chance to drop 2-5 gold nuggets, else drop blackstone
    if (Math.random() < 0.1) {
      const nuggetCount = 2 + Math.floor(Math.random() * 4); // 2-5 nuggets
      return [{ type: 'gold_nugget', count: nuggetCount }];
    } else {
      return [{ type: 'blackstone', count: 1 }];
    }
  }
}

/**
 * Nether Gold Ore - An ore found in the Nether that drops gold nuggets
 */
class NetherGoldOreBlock extends Block {
  constructor(position) {
    super({
      position,
      type: 'nether_gold_ore',
      isSolid: true,
      isTransparent: false,
      isFlammable: false,
      lightLevel: 0,
      hardness: 3,
      blastResistance: 3,
      requiredTool: 'pickaxe',
      // Special drop logic implemented in getDrops()
    });
  }

  /**
   * Custom drop logic - drops gold nuggets, affected by Fortune
   */
  getDrops(toolType, toolTier, enchantments = {}) {
    // Check for silk touch
    if (enchantments.silkTouch) {
      return [{ type: 'nether_gold_ore', count: 1 }];
    }
    
    // Base drops: 2-6 gold nuggets
    let nuggetCount = 2 + Math.floor(Math.random() * 5);
    
    // Apply fortune enchantment if present
    if (enchantments.fortune) {
      const fortuneLevel = enchantments.fortune;
      // Fortune increases drop count
      nuggetCount += Math.floor(Math.random() * (fortuneLevel + 1));
    }
    
    return [{ type: 'gold_nugget', count: nuggetCount }];
  }
}

/**
 * Soul Soil - A block that can sustain soul fire and slows down players
 */
class SoulSoilBlock extends Block {
  constructor(position) {
    super({
      position,
      type: 'soul_soil',
      isSolid: true,
      isTransparent: false,
      isFlammable: false,
      lightLevel: 0,
      hardness: 0.5,
      blastResistance: 0.5,
      requiredTool: 'shovel',
      drops: [{ type: 'soul_soil', count: 1 }]
    });
  }

  /**
   * Apply movement slowdown when a player walks on this block
   */
  onEntityWalk(entity) {
    // If entity is a player or mob, slow them down by 30%
    if (entity && entity.applyMovementModifier) {
      entity.applyMovementModifier('soul_soil', 0.7);
    }
    return true;
  }

  /**
   * Special interaction with fire - creates soul fire
   */
  onFirePlaced(world, position) {
    // Convert regular fire to soul fire when placed on this block
    return 'soul_fire';
  }
}

/**
 * Soul Fire Torch - A decorative light source with blue flame
 */
class SoulFireTorchBlock extends Block {
  constructor(position, placement = 'floor') {
    super({
      position,
      type: 'soul_fire_torch',
      isSolid: false,
      isTransparent: true,
      isFlammable: false,
      lightLevel: 10, // Lower light level than regular torch (12)
      hardness: 0,
      blastResistance: 0,
      drops: [{ type: 'soul_fire_torch', count: 1 }],
      metadata: { placement }
    });
    
    this.placement = placement; // 'floor', 'north', 'south', 'east', 'west'
  }

  /**
   * Can only be placed on solid blocks
   */
  canBePlacedOn(blockBelow) {
    return blockBelow && blockBelow.isSolid;
  }

  /**
   * Update placement based on where it was placed
   */
  onPlaced(world, player, placementData) {
    if (placementData && placementData.face) {
      if (placementData.face === BlockFace.TOP) {
        this.placement = 'floor';
      } else if (placementData.face === BlockFace.NORTH) {
        this.placement = 'south'; // Faces opposite to the attached face
      } else if (placementData.face === BlockFace.SOUTH) {
        this.placement = 'north'; 
      } else if (placementData.face === BlockFace.EAST) {
        this.placement = 'west';
      } else if (placementData.face === BlockFace.WEST) {
        this.placement = 'east';
      }
      this.metadata.placement = this.placement;
    }
    return true;
  }
}

module.exports = {
  AncientDebrisBlock,
  BasaltBlock,
  PolishedBasaltBlock,
  BlackstoneBlock,
  PolishedBlackstoneBlock,
  ChiseledPolishedBlackstoneBlock,
  GildedBlackstoneBlock,
  NetherGoldOreBlock,
  SoulSoilBlock,
  SoulFireTorchBlock
}; 