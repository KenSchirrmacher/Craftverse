/**
 * Mud Block - A wet dirt-like block found in Mangrove Swamps
 * Slows down entities moving on it
 */

const Block = require('./baseBlock');

class MudBlock extends Block {
  /**
   * Create a new mud block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'mud',
      name: 'Mud Block',
      hardness: 0.5,
      resistance: 0.5,
      requiresTool: false, // Can be broken without tools
      transparent: false,
      solid: true,
      lightLevel: 0,
      model: 'cube',
      texture: 'mud',
      sounds: {
        break: 'block.mud.break',
        step: 'block.mud.step',
        place: 'block.mud.place',
        hit: 'block.mud.hit',
        fall: 'block.mud.fall'
      },
      ...options
    });
    
    // Special mud properties
    this.slipperiness = 0.8; // Makes entities slide a bit (default is 0.6)
    this.slownessFactor = 0.6; // Movement speed multiplier when walking on mud
  }
  
  /**
   * Handle entity collision with mud
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Entity} entity - Entity colliding with mud
   */
  onEntityCollision(world, position, entity) {
    // Apply slowness effect to entities walking on mud
    if (entity && entity.isOnGround && world.statusEffectsManager) {
      // Don't apply slowness to entities already in water
      if (!entity.isInWater) {
        world.statusEffectsManager.addEffect(entity.id, 'SLOWNESS', {
          level: 0, // Level 1 slowness (0-based index)
          duration: 20, // Very brief duration, will be continuously reapplied
          showParticles: false,
          ambient: true
        });
      }
      
      // Make player sink slightly into mud
      if (entity.type === 'player') {
        // Adjust player eye height to simulate sinking
        entity.eyeHeightOffset = -0.15;
      }
      
      // Create bubble particles occasionally
      if (Math.random() < 0.05) {
        world.addParticle({
          type: 'bubble_pop',
          position: {
            x: position.x + Math.random(),
            y: position.y + 1.0,
            z: position.z + Math.random()
          },
          count: 1,
          speed: 0.01
        });
      }
    }
  }
  
  /**
   * Handle player right clicking on mud
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Player} player - Player who clicked
   * @param {Object} options - Additional options
   * @returns {boolean} Whether the interaction was handled
   */
  onInteract(world, position, player, options = {}) {
    // If player is holding a water bottle, the mud can become more wet
    const heldItem = player.getHeldItem();
    
    if (heldItem && heldItem.id === 'water_bottle') {
      // Create splash particles
      world.addParticle({
        type: 'splash',
        position: {
          x: position.x + 0.5,
          y: position.y + 1.0,
          z: position.z + 0.5
        },
        count: 8,
        speed: 0.2
      });
      
      // Play sound
      world.playSound('item.bottle.empty', position, 1.0, 1.0);
      
      // Give back glass bottle
      player.addItem({ id: 'glass_bottle', count: 1 });
      
      // Remove water bottle from player
      player.removeHeldItem(1);
      
      return true;
    }
    
    // If player is holding a shovel, convert to dirt path
    if (heldItem && heldItem.type === 'shovel') {
      world.setBlock(position, 'dirt_path');
      
      // Play sound
      world.playSound('item.shovel.flatten', position, 1.0, 1.0);
      
      // Damage the shovel
      if (player.gameMode !== 'creative') {
        player.damageHeldItem(1);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get mining time for this block
   * @param {Player} player - Player mining the block
   * @param {Object} options - Additional options (e.g., tool)
   * @returns {number} Mining time in milliseconds
   */
  getMiningTime(player, options = {}) {
    let baseTime = this.hardness * 1500; // Base time in milliseconds
    
    if (player && options.tool) {
      const tool = options.tool;
      
      // Shovel is the best tool for mud
      if (tool.type === 'shovel') {
        // Faster mining with shovels
        const efficiency = tool.efficiency || 1.0;
        baseTime /= (efficiency * 1.5);
      }
      
      // Apply player mining speed modifiers
      if (player.miningSpeedModifier) {
        baseTime /= player.miningSpeedModifier;
      }
    }
    
    return Math.max(50, baseTime); // Minimum 50ms, even with best tools
  }
  
  /**
   * Get items dropped when block is broken
   * @param {Player} player - Player who broke the block
   * @param {Object} options - Additional options (e.g., tool)
   * @returns {Array} Array of drop objects (id, count)
   */
  getDrops(player, options = {}) {
    // Mud always drops itself regardless of tool used
    return [{ id: 'mud', count: 1 }];
  }
  
  /**
   * Handle random block updates
   * @param {World} world - World object
   * @param {Vector3} position - Block position
   * @param {Object} options - Additional update options
   */
  update(world, position, options = {}) {
    // Mud has a small chance to create mud particles
    if (Math.random() < 0.01) {
      world.addParticle({
        type: 'mud',
        position: {
          x: position.x + 0.5,
          y: position.y + 0.5,
          z: position.z + 0.5
        },
        count: 1,
        speed: 0.01
      });
    }
  }
  
  /**
   * Convert block to JSON for serialization
   * @returns {Object} Block data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      slipperiness: this.slipperiness,
      slownessFactor: this.slownessFactor
    };
  }
  
  /**
   * Create block from JSON data
   * @param {Object} data - Block data
   * @returns {MudBlock} Block instance
   */
  static fromJSON(data) {
    return new MudBlock({
      slipperiness: data.slipperiness,
      slownessFactor: data.slownessFactor
    });
  }
}

module.exports = MudBlock; 