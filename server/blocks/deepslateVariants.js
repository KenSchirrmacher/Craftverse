/**
 * Deepslate Variants for Caves & Cliffs Update
 * These blocks appear in the deeper parts of caves, below y=0
 */

const Block = require('./blockBase');

/**
 * Base Deepslate Block
 * Natural stone variant that appears in the deepest parts of the world
 */
class DeepslateBlock extends Block {
  /**
   * Create a new deepslate block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'deepslate',
      name: 'Deepslate',
      hardness: 3.0, // Harder than regular stone (1.5)
      miningLevel: 'stone', // Requires stone pickaxe or better
      miningTime: 2.0, // Slower to mine than regular stone
      blast_resistance: 6.0,
      drops: 'cobbled_deepslate', // Drops cobbled variant when mined
      ...options
    });
    
    // Deepslate is directional with different top/bottom textures
    this.directional = true;
    this.pillarBlock = true; // Acts as a pillar with vertical axis
    this.textures = {
      top: 'blocks/deepslate_top',
      bottom: 'blocks/deepslate_top',
      sides: 'blocks/deepslate'
    };
  }
  
  /**
   * Get drops when mined without silk touch
   * @param {Object} tool - The tool used to mine
   * @returns {Array} Array of item drops
   */
  getDrops(tool) {
    // Check for silk touch
    if (tool && tool.enchantments && tool.enchantments.silk_touch) {
      return [{ id: this.id, count: 1 }];
    }
    
    // Normal drop is cobbled deepslate
    return [{ id: 'cobbled_deepslate', count: 1 }];
  }
  
  /**
   * Handle block placement
   * @param {Object} world - The game world
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   * @param {Object} player - The player placing the block
   * @param {number} face - The face being placed on
   */
  onPlace(world, x, y, z, player, face) {
    // Determine block orientation based on player facing
    if (face === 0 || face === 1) { // Placing on top or bottom face
      this.orientation = 'vertical';
    } else {
      // Determine horizontal orientation based on player facing
      this.orientation = 'vertical'; // Default vertical for pillar look
    }
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      orientation: this.orientation
    };
  }
  
  /**
   * Deserialize from saved data
   * @param {Object} data - The data to deserialize from
   */
  deserialize(data) {
    super.deserialize(data);
    if (data.orientation) {
      this.orientation = data.orientation;
    }
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {DeepslateBlock} New block instance
   */
  static deserialize(data) {
    const block = new DeepslateBlock();
    block.deserialize(data);
    return block;
  }
}

/**
 * Cobbled Deepslate Block
 * Created when mining deepslate
 */
class CobbledDeepslateBlock extends Block {
  /**
   * Create a new cobbled deepslate block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'cobbled_deepslate',
      name: 'Cobbled Deepslate',
      hardness: 3.5,
      miningLevel: 'stone',
      miningTime: 2.2,
      blast_resistance: 6.0,
      ...options
    });
    
    // Cobbled deepslate has a single texture for all sides
    this.textures = {
      all: 'blocks/cobbled_deepslate'
    };
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {CobbledDeepslateBlock} New block instance
   */
  static deserialize(data) {
    const block = new CobbledDeepslateBlock();
    block.deserialize(data);
    return block;
  }
}

/**
 * Deepslate Bricks Block
 * Crafted from cobbled deepslate
 */
class DeepslateBricksBlock extends Block {
  /**
   * Create a new deepslate bricks block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'deepslate_bricks',
      name: 'Deepslate Bricks',
      hardness: 3.5,
      miningLevel: 'stone',
      miningTime: 2.2,
      blast_resistance: 6.0,
      ...options
    });
    
    // Deepslate bricks have a single texture for all sides
    this.textures = {
      all: 'blocks/deepslate_bricks'
    };
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {DeepslateBricksBlock} New block instance
   */
  static deserialize(data) {
    const block = new DeepslateBricksBlock();
    block.deserialize(data);
    return block;
  }
}

/**
 * Cracked Deepslate Bricks Block
 * Created by smelting deepslate bricks
 */
class CrackedDeepslateBricksBlock extends Block {
  /**
   * Create a new cracked deepslate bricks block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'cracked_deepslate_bricks',
      name: 'Cracked Deepslate Bricks',
      hardness: 3.5,
      miningLevel: 'stone',
      miningTime: 2.2,
      blast_resistance: 6.0,
      ...options
    });
    
    // Cracked deepslate bricks have a single texture for all sides
    this.textures = {
      all: 'blocks/cracked_deepslate_bricks'
    };
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {CrackedDeepslateBricksBlock} New block instance
   */
  static deserialize(data) {
    const block = new CrackedDeepslateBricksBlock();
    block.deserialize(data);
    return block;
  }
}

/**
 * Deepslate Tiles Block
 * Crafted from deepslate bricks
 */
class DeepslateTilesBlock extends Block {
  /**
   * Create a new deepslate tiles block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'deepslate_tiles',
      name: 'Deepslate Tiles',
      hardness: 3.5,
      miningLevel: 'stone',
      miningTime: 2.2,
      blast_resistance: 6.0,
      ...options
    });
    
    // Deepslate tiles have a single texture for all sides
    this.textures = {
      all: 'blocks/deepslate_tiles'
    };
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {DeepslateTilesBlock} New block instance
   */
  static deserialize(data) {
    const block = new DeepslateTilesBlock();
    block.deserialize(data);
    return block;
  }
}

/**
 * Cracked Deepslate Tiles Block
 * Created by smelting deepslate tiles
 */
class CrackedDeepslateTilesBlock extends Block {
  /**
   * Create a new cracked deepslate tiles block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'cracked_deepslate_tiles',
      name: 'Cracked Deepslate Tiles',
      hardness: 3.5,
      miningLevel: 'stone',
      miningTime: 2.2,
      blast_resistance: 6.0,
      ...options
    });
    
    // Cracked deepslate tiles have a single texture for all sides
    this.textures = {
      all: 'blocks/cracked_deepslate_tiles'
    };
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {CrackedDeepslateTilesBlock} New block instance
   */
  static deserialize(data) {
    const block = new CrackedDeepslateTilesBlock();
    block.deserialize(data);
    return block;
  }
}

/**
 * Chiseled Deepslate Block
 * Decorative variant
 */
class ChiseledDeepslateBlock extends Block {
  /**
   * Create a new chiseled deepslate block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'chiseled_deepslate',
      name: 'Chiseled Deepslate',
      hardness: 3.5,
      miningLevel: 'stone',
      miningTime: 2.2,
      blast_resistance: 6.0,
      ...options
    });
    
    // Chiseled deepslate has different top/bottom and side textures
    this.textures = {
      top: 'blocks/chiseled_deepslate_top',
      bottom: 'blocks/chiseled_deepslate_top',
      sides: 'blocks/chiseled_deepslate_side'
    };
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {ChiseledDeepslateBlock} New block instance
   */
  static deserialize(data) {
    const block = new ChiseledDeepslateBlock();
    block.deserialize(data);
    return block;
  }
}

/**
 * Polished Deepslate Block
 * Crafted from cobbled deepslate
 */
class PolishedDeepslateBlock extends Block {
  /**
   * Create a new polished deepslate block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'polished_deepslate',
      name: 'Polished Deepslate',
      hardness: 3.5,
      miningLevel: 'stone',
      miningTime: 2.2,
      blast_resistance: 6.0,
      ...options
    });
    
    // Polished deepslate has a single texture for all sides
    this.textures = {
      all: 'blocks/polished_deepslate'
    };
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {PolishedDeepslateBlock} New block instance
   */
  static deserialize(data) {
    const block = new PolishedDeepslateBlock();
    block.deserialize(data);
    return block;
  }
}

/**
 * Deepslate Coal Ore Block
 * Coal ore variant that generates in deepslate
 */
class DeepslateCoalOreBlock extends Block {
  /**
   * Create a new deepslate coal ore block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'deepslate_coal_ore',
      name: 'Deepslate Coal Ore',
      hardness: 4.5, // Harder than regular coal ore
      miningLevel: 'stone',
      miningTime: 3.0,
      blast_resistance: 6.0,
      ...options
    });
    
    // Deepslate coal ore has a single texture
    this.textures = {
      all: 'blocks/deepslate_coal_ore'
    };
  }
  
  /**
   * Get drops when mined
   * @param {Object} tool - The tool used to mine
   * @returns {Array} Array of item drops
   */
  getDrops(tool) {
    // Check for silk touch
    if (tool && tool.enchantments && tool.enchantments.silk_touch) {
      return [{ id: this.id, count: 1 }];
    }
    
    // Fortune enchantment increases drops
    let count = 1;
    if (tool && tool.enchantments && tool.enchantments.fortune) {
      const fortuneLevel = tool.enchantments.fortune;
      // Each level of fortune has a chance to increase drops
      const extraDrops = Math.random() < (fortuneLevel * 0.1) ? fortuneLevel : 0;
      count += extraDrops;
    }
    
    return [{ id: 'coal', count }];
  }
  
  /**
   * Create block from serialized data
   * @param {Object} data - Serialized data
   * @returns {DeepslateCoalOreBlock} New block instance
   */
  static deserialize(data) {
    const block = new DeepslateCoalOreBlock();
    block.deserialize(data);
    return block;
  }
}

// Export all block variants
module.exports = {
  DeepslateBlock,
  CobbledDeepslateBlock,
  DeepslateBricksBlock,
  CrackedDeepslateBricksBlock,
  DeepslateTilesBlock,
  CrackedDeepslateTilesBlock,
  ChiseledDeepslateBlock,
  PolishedDeepslateBlock,
  DeepslateCoalOreBlock
}; 