/**
 * Block - Base class for all block types
 * Handles common block functionality and properties
 */
const { v4: uuidv4 } = require('uuid');

class Block {
  /**
   * Create a block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    // Basic properties
    this.id = options.id || 'block';
    this.name = options.name || 'Block';
    this.type = options.type || 'block';
    this.subtype = options.subtype || 'solid';
    
    // Physical properties
    this.isSolid = options.isSolid !== undefined ? options.isSolid : true;
    this.isTransparent = options.isTransparent !== undefined ? options.isTransparent : false;
    this.isLiquid = options.isLiquid !== undefined ? options.isLiquid : false;
    this.isAir = options.isAir !== undefined ? options.isAir : false;
    
    // Visual properties
    this.texture = options.texture || 'stone';
    this.textures = options.textures || {
      top: this.texture,
      bottom: this.texture,
      front: this.texture,
      back: this.texture,
      left: this.texture,
      right: this.texture
    };
    this.tint = options.tint || null;
    this.lightLevel = options.lightLevel || 0;
    this.lightOpacity = options.lightOpacity || 15;
    
    // State properties
    this.state = options.state || {};
    this.variant = options.variant || 'default';
    this.age = options.age || 0;
    this.ticks = options.ticks || 0;
    
    // Interaction properties
    this.hardness = options.hardness || 1.0;
    this.resistance = options.resistance || 1.0;
    this.toolType = options.toolType || null;
    this.minToolTier = options.minToolTier || 0;
    this.drops = options.drops || [];
    this.experience = options.experience || 0;
    
    // Special properties
    this.isRedstoneConductor = options.isRedstoneConductor !== undefined ? options.isRedstoneConductor : true;
    this.isRedstonePowerSource = options.isRedstonePowerSource !== undefined ? options.isRedstonePowerSource : false;
    this.isContainer = options.isContainer !== undefined ? options.isContainer : false;
    this.isInteractable = options.isInteractable !== undefined ? options.isInteractable : false;
    
    // Unique identifier for this block instance
    this.instanceId = options.instanceId || uuidv4();
  }
  
  /**
   * Get the block's bounding box
   * @returns {Object} The bounding box
   */
  getBoundingBox() {
    return {
      minX: 0,
      minY: 0,
      minZ: 0,
      maxX: 1,
      maxY: 1,
      maxZ: 1
    };
  }
  
  /**
   * Check if the block can be placed at the given position
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @returns {boolean} Whether the block can be placed
   */
  canPlaceAt(world, x, y, z) {
    // Check if the position is valid
    const currentBlock = world.getBlock(x, y, z);
    if (currentBlock && currentBlock.isSolid) {
      return false;
    }
    
    // Check if there's a solid block below
    const belowBlock = world.getBlock(x, y - 1, z);
    if (!belowBlock || !belowBlock.isSolid) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Handle block placement
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} player - The player placing the block
   * @returns {boolean} Whether the placement was successful
   */
  onPlace(world, x, y, z, player) {
    if (!this.canPlaceAt(world, x, y, z)) {
      return false;
    }
    
    // Set the block
    world.setBlock(x, y, z, this);
    
    // Emit block update event
    world.emitBlockUpdate(x, y, z);
    
    return true;
  }
  
  /**
   * Handle block break
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} player - The player breaking the block
   * @returns {boolean} Whether the break was successful
   */
  onBreak(world, x, y, z, player) {
    // Check if the player has the right tool
    if (this.toolType && player.getHeldItem()) {
      const heldItem = player.getHeldItem();
      if (heldItem.type !== this.toolType || heldItem.tier < this.minToolTier) {
        return false;
      }
    }
    
    // Remove the block
    world.setBlock(x, y, z, null);
    
    // Drop items
    this.dropItems(world, x, y, z, player);
    
    // Emit block update event
    world.emitBlockUpdate(x, y, z);
    
    return true;
  }
  
  /**
   * Drop items when the block is broken
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} player - The player breaking the block
   */
  dropItems(world, x, y, z, player) {
    // Drop configured items
    for (const drop of this.drops) {
      if (Math.random() < drop.chance) {
        const count = Math.floor(drop.count * (1 + Math.random() * drop.variance));
        world.dropItem(x, y, z, drop.item, count);
      }
    }
    
    // Drop experience
    if (this.experience > 0) {
      world.dropExperience(x, y, z, this.experience);
    }
  }
  
  /**
   * Handle block update (e.g., from neighbor changes)
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   */
  onNeighborUpdate(world, x, y, z) {
    // Base implementation does nothing
  }
  
  /**
   * Handle block tick
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   */
  onTick(world, x, y, z) {
    this.ticks++;
  }
  
  /**
   * Handle block interaction
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} player - The player interacting with the block
   * @returns {boolean} Whether the interaction was handled
   */
  onInteract(world, x, y, z, player) {
    return false;
  }
  
  /**
   * Get the block's light emission
   * @returns {number} The light level
   */
  getLightLevel() {
    return this.lightLevel;
  }
  
  /**
   * Get the block's light opacity
   * @returns {number} The light opacity
   */
  getLightOpacity() {
    return this.lightOpacity;
  }
  
  /**
   * Serialize the block state
   * @returns {Object} The serialized state
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      subtype: this.subtype,
      isSolid: this.isSolid,
      isTransparent: this.isTransparent,
      isLiquid: this.isLiquid,
      isAir: this.isAir,
      texture: this.texture,
      textures: this.textures,
      tint: this.tint,
      lightLevel: this.lightLevel,
      lightOpacity: this.lightOpacity,
      state: this.state,
      variant: this.variant,
      age: this.age,
      ticks: this.ticks,
      hardness: this.hardness,
      resistance: this.resistance,
      toolType: this.toolType,
      minToolTier: this.minToolTier,
      drops: this.drops,
      experience: this.experience,
      isRedstoneConductor: this.isRedstoneConductor,
      isRedstonePowerSource: this.isRedstonePowerSource,
      isContainer: this.isContainer,
      isInteractable: this.isInteractable,
      instanceId: this.instanceId
    };
  }
  
  /**
   * Deserialize the block state
   * @param {Object} data - The serialized state
   * @returns {Block} The deserialized block
   */
  static deserialize(data) {
    return new Block(data);
  }
}

module.exports = Block; 