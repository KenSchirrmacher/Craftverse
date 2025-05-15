/**
 * Glow Berry Item Implementation
 * Provides edible berries that glow and can be planted to grow cave vines
 * Part of the Caves & Cliffs update
 */

// Dependencies
const Item = require('./item');
const { CaveVineHeadBlock } = require('../blocks/caveVineBlock');

/**
 * GlowBerryItem class that provides a food item that can also be planted
 */
class GlowBerryItem extends Item {
  /**
   * Create a new glow berry item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'glow_berries',
      name: options.name || 'Glow Berries',
      stackable: true,
      maxStackSize: 64,
      type: 'food',
      subtype: 'plantable',
      category: 'food',
      texture: 'glow_berries',
      ...options
    });
    
    // Food properties
    this.foodValue = options.foodValue !== undefined ? options.foodValue : 2;
    this.saturation = options.saturation !== undefined ? options.saturation : 0.4;
    
    // Planting properties
    this.isPlantable = options.isPlantable !== undefined ? options.isPlantable : true;
    this.plantBlock = options.plantBlock || 'cave_vine_head';
  }
  
  /**
   * Use the item (eating)
   * @param {Player} player - The player using the item
   * @param {Object} context - Use context
   * @returns {boolean} Whether the use was successful
   */
  use(player, context) {
    // Handle eating
    if (player && player.hunger < 20) {
      // Increase hunger and saturation
      player.hunger = Math.min(20, player.hunger + this.foodValue);
      player.saturation = Math.min(20, player.saturation + this.saturation);
      
      // Remove one berry from the stack
      if (player.inventory) {
        player.inventory.removeItem('glow_berries', 1);
      }
      
      // Play eating sound
      this.emit('sound', {
        type: 'entity.player.eat',
        position: player.position,
        volume: 1.0,
        pitch: 1.0
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle item use on block (right-click on block)
   * @param {Object} world - World object
   * @param {Object} position - Position object where the block was clicked
   * @param {Object} face - Face that was clicked
   * @param {Object} player - Player object
   * @returns {boolean} - Whether use was handled
   */
  onUseOnBlock(world, position, face, player) {
    // Get the clicked block
    const clickedBlock = world.getBlockAt(position.x, position.y, position.z);
    
    // Calculate target position (where the vine would be placed)
    const targetPos = {
      x: position.x,
      y: position.y,
      z: position.z
    };
    
    // Adjust position based on clicked face
    switch (face) {
      case 'up':
        targetPos.y += 1;
        break;
      case 'down':
        targetPos.y -= 1;
        break;
      case 'north':
        targetPos.z -= 1;
        break;
      case 'south':
        targetPos.z += 1;
        break;
      case 'west':
        targetPos.x -= 1;
        break;
      case 'east':
        targetPos.x += 1;
        break;
    }
    
    // Check if target position is valid for cave vine
    const targetBlock = world.getBlockAt(targetPos.x, targetPos.y, targetPos.z);
    if (targetBlock && targetBlock.type !== 'air' && targetBlock.type !== 'cave_air') {
      return false;
    }
    
    // Only allow placement on the bottom face of a block
    if (face !== 'down') {
      return false;
    }
    
    // Check if clicked block is valid for attaching vine
    const newVine = new CaveVineHeadBlock();
    const canPlaceVine = newVine.canPlaceAt(world, targetPos);
    
    if (canPlaceVine) {
      // Place the vine
      world.setBlock(targetPos.x, targetPos.y, targetPos.z, newVine);
      
      // Remove one berry from the stack
      if (player && player.inventory) {
        player.inventory.removeItem('glow_berries', 1);
      }
      
      // Play placement sound
      this.emit('sound', {
        type: 'block.cave_vines.place',
        position: targetPos,
        volume: 1.0,
        pitch: 1.0
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the tooltip text for the item
   * @returns {string[]} Array of tooltip lines
   */
  getTooltip() {
    const tooltip = super.getTooltip();
    tooltip.push(`Food: +${this.foodValue} hunger`);
    tooltip.push('Can be planted to grow cave vines');
    tooltip.push('Emits light when growing on vines');
    return tooltip;
  }
  
  /**
   * Convert item to JSON representation for serialization
   * @returns {Object} JSON representation of item
   */
  toJSON() {
    const json = super.toJSON();
    return {
      ...json,
      foodValue: this.foodValue,
      saturation: this.saturation,
      isPlantable: this.isPlantable,
      plantBlock: this.plantBlock
    };
  }
  
  /**
   * Create an item from JSON data
   * @param {Object} data - JSON data
   * @returns {GlowBerryItem} - Deserialized item
   */
  static fromJSON(data) {
    return new GlowBerryItem(data);
  }
}

// Export the class
module.exports = GlowBerryItem; 