/**
 * CopperBulbBlock - A redstone-powered light source with oxidation mechanics
 * Part of the Minecraft 1.21 (Tricky Trials) Update
 */

// Fix import to get CopperBlock from cavesCliffsBlocks
const Block = require('./block');
const { CopperBlock } = require('./cavesCliffsBlocks');

/**
 * Copper Bulb - A redstone-powered light source that can oxidize over time
 */
class CopperBulbBlock extends CopperBlock {
  /**
   * Create a new CopperBulbBlock
   * @param {Object} options - Block configuration options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'copper_bulb',
      name: options.name || 'Copper Bulb',
      hardness: 3.0,
      toolType: 'pickaxe',
      minToolLevel: 'stone',
      drops: ['copper_bulb'],
      oxidationState: options.oxidationState || 'none',
      waxed: options.waxed || false,
      ...options
    });
    
    // Copper Bulb specific properties
    this.powered = options.powered || false;
    this.baseLightLevel = 15; // Max light level when powered
    this.lightLevel = this.powered ? this.baseLightLevel : 0;
    
    // Redstone-related properties
    this.emitsRedstone = false; // Only receives, doesn't emit signals
    this.redstoneCooldown = 0; // Cooldown to prevent rapid toggling
    
    // Set texture based on the oxidation state and power status
    this.updateTexture();
  }
  
  /**
   * Update method called on each tick
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @param {Number} deltaTime - Time since last update in ms
   * @returns {Object|null} - Block update data or null if no update
   */
  update(world, position, deltaTime) {
    // First check for oxidation updates
    const oxidationUpdate = super.update(world, position, deltaTime);
    if (oxidationUpdate) {
      // Update our local oxidation state to match the update
      this.oxidationState = oxidationUpdate.oxidationState;
      
      // Maintain power state during oxidation
      return {
        ...oxidationUpdate,
        powered: this.powered,
        lightLevel: this.lightLevel
      };
    }
    
    // Handle redstone cooldown
    if (this.redstoneCooldown > 0) {
      this.redstoneCooldown -= deltaTime;
    }
    
    // Check for redstone power changes if world is available
    if (world) {
      const isPowered = this.isReceivingRedstonePower(world, position);
      
      // Only update if power state changed and not in cooldown
      if (isPowered !== this.powered && this.redstoneCooldown <= 0) {
        this.powered = isPowered;
        this.lightLevel = this.powered ? this.baseLightLevel : 0;
        this.redstoneCooldown = 4; // 4 tick cooldown (200ms at 20 ticks/sec)
        
        // Update texture based on new power status
        this.updateTexture();
        
        // Return update with changed properties
        return {
          type: this.id,
          oxidationState: this.oxidationState,
          waxed: this.waxed,
          powered: this.powered,
          lightLevel: this.lightLevel
        };
      }
    }
    
    return null;
  }
  
  /**
   * Check if this block is receiving redstone power
   * @param {Object} world - The world object
   * @param {Object} position - The position of this block
   * @returns {boolean} - Whether the block is receiving power
   */
  isReceivingRedstonePower(world, position) {
    // Check direct redstone power
    if (world.getRedstonePowerAt(position.x, position.y, position.z) > 0) {
      return true;
    }
    
    // Check power from adjacent blocks
    const adjacentPositions = [
      { x: position.x + 1, y: position.y, z: position.z },
      { x: position.x - 1, y: position.y, z: position.z },
      { x: position.x, y: position.y + 1, z: position.z },
      { x: position.x, y: position.y - 1, z: position.z },
      { x: position.x, y: position.y, z: position.z + 1 },
      { x: position.x, y: position.y, z: position.z - 1 }
    ];
    
    for (const pos of adjacentPositions) {
      const adjacentBlock = world.getBlockAt(pos.x, pos.y, pos.z);
      
      // Check if adjacent block is emitting redstone power
      if (adjacentBlock && adjacentBlock.emitsRedstone) {
        // For simplicity, just check if it's powered
        if (adjacentBlock.powered) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Update the texture based on oxidation state and power status
   */
  updateTexture() {
    const oxidationPrefix = this.oxidationState === 'none' ? '' : `${this.oxidationState}_`;
    const waxedPrefix = this.waxed ? 'waxed_' : '';
    const powerSuffix = this.powered ? '_powered' : '';
    
    this.textures = {
      all: `blocks/${waxedPrefix}${oxidationPrefix}copper_bulb${powerSuffix}`
    };
  }
  
  /**
   * Process an interaction with this block
   * @param {Object} player - Player who interacted
   * @param {String} action - Type of interaction
   * @param {Object} data - Additional data for the interaction
   * @returns {Object} - Result of the interaction
   */
  interact(player, action, data) {
    // Check if player is holding a redstone torch or similar
    if (action === 'use_item' && data.item && data.item.includes('redstone')) {
      // Toggle power state
      this.powered = !this.powered;
      this.lightLevel = this.powered ? this.baseLightLevel : 0;
      this.updateTexture();
      
      return {
        success: true,
        message: this.powered ? 'Copper bulb powered on' : 'Copper bulb powered off',
        newBlock: {
          type: this.id,
          oxidationState: this.oxidationState,
          waxed: this.waxed,
          powered: this.powered,
          lightLevel: this.lightLevel
        }
      };
    }
    
    // Handle standard copper interactions (waxing, scraping)
    return super.interact(player, action, data);
  }
  
  /**
   * Get the block's data for client
   * @returns {Object} - Block data for the client
   */
  getState() {
    return {
      ...super.getState(),
      powered: this.powered,
      lightLevel: this.lightLevel
    };
  }
  
  /**
   * Serialize the block for saving
   * @returns {Object} - Serialized data
   */
  serialize() {
    // Instead of relying on super.serialize() which is causing issues,
    // build the serialized data using parent class properties directly
    return {
      ...this.toJSON(), // Get base Block properties
      id: this.id,
      oxidationState: this.oxidationState,
      waxed: this.waxed,
      oxidationTimer: this.oxidationTimer,
      powered: this.powered,
      lightLevel: this.lightLevel
    };
  }
  
  /**
   * Deserialize data to restore the block's state
   * @param {Object} data - Saved data
   */
  deserialize(data) {
    // Handle base Block properties
    if (data.id) this.id = data.id;
    if (data.name) this.name = data.name;
    if (data.hardness !== undefined) this.hardness = data.hardness;
    if (data.toolType !== undefined) this.toolType = data.toolType;
    if (data.stackSize !== undefined) this.stackSize = data.stackSize;
    if (data.lightLevel !== undefined) this.lightLevel = data.lightLevel;
    
    // Handle CopperBlock properties
    if (data.oxidationState) {
      this.oxidationState = data.oxidationState;
    }
    if (data.waxed !== undefined) {
      this.waxed = data.waxed;
    }
    if (data.oxidationTimer !== undefined) {
      this.oxidationTimer = data.oxidationTimer;
    }
    
    // Handle CopperBulbBlock properties
    if (data.powered !== undefined) {
      this.powered = data.powered;
    }
    if (data.lightLevel !== undefined) {
      this.lightLevel = data.lightLevel;
    }
    
    // Update texture based on loaded state
    this.updateTexture();
  }
  
  /**
   * Create a copper bulb block from serialized data
   * @param {Object} data - Serialized data
   * @returns {CopperBulbBlock} - New instance
   */
  static deserialize(data) {
    // Create a new instance with basic properties
    const block = new CopperBulbBlock({
      id: data.id,
      name: data.name,
      oxidationState: data.oxidationState,
      waxed: data.waxed
    });
    
    // Set additional properties
    if (data.oxidationTimer !== undefined) {
      block.oxidationTimer = data.oxidationTimer;
    }
    if (data.powered !== undefined) {
      block.powered = data.powered;
    }
    if (data.lightLevel !== undefined) {
      block.lightLevel = data.lightLevel;
    }
    
    // Update texture
    block.updateTexture();
    
    return block;
  }
}

module.exports = CopperBulbBlock; 