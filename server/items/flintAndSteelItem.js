/**
 * FlintAndSteelItem - Implementation of flint and steel item used to light fires and nether portals
 */

const NetherPortalBlock = require('../blocks/netherPortalBlock');

class FlintAndSteelItem {
  /**
   * Create a new FlintAndSteelItem
   */
  constructor() {
    this.id = 'flint_and_steel';
    this.name = 'Flint and Steel';
    this.durability = 64;
    this.cooldown = 500; // ms
    this.stackSize = 1;
    this.type = 'tool';
    this.subtype = 'igniter';
    this.category = 'tools';
    this.texture = 'flint_and_steel';
  }
  
  /**
   * Use the flint and steel on a block
   * @param {Object} world - The world object
   * @param {Object} player - The player using the item
   * @param {Object} targetBlock - The block being clicked on
   * @param {Object} targetPosition - The position of the targeted block
   * @param {Object} face - The face of the block that was clicked
   * @returns {Object} Result of the interaction
   */
  use(world, player, targetBlock, targetPosition, face) {
    // Check if we're targeting an obsidian block (potential portal frame)
    if (targetBlock && targetBlock.type === 'obsidian') {
      const result = this.tryLightPortal(world, targetPosition);
      if (result.success) {
        this.reduceDurability(player);
        return {
          success: true,
          message: 'Portal activated',
          sound: 'portal.ignite',
          particles: {
            type: 'portal_activation',
            position: targetPosition,
            count: 20,
            color: '#BD00FC'
          }
        };
      }
    }
    
    // Place fire block in the world if not targeting a potential portal
    const adjacentPos = this.getAdjacentPosition(targetPosition, face);
    const adjacentKey = `${adjacentPos.x},${adjacentPos.y},${adjacentPos.z}`;
    
    // Check if the space is empty
    const existingBlock = world.getBlock(adjacentKey);
    if (existingBlock && existingBlock.type !== 'air') {
      return { success: false, message: 'Cannot place fire here' };
    }
    
    // Place fire at the adjacent position
    world.setBlock(adjacentKey, { type: 'fire' });
    
    // Reduce durability
    this.reduceDurability(player);
    
    return {
      success: true,
      message: 'Fire ignited',
      sound: 'fire.ignite',
      particles: {
        type: 'smoke',
        position: adjacentPos,
        count: 5
      }
    };
  }
  
  /**
   * Try to light a Nether Portal
   * @param {Object} world - The world object
   * @param {Object} position - Position of the obsidian block
   * @returns {Object} Result of the portal lighting attempt
   */
  tryLightPortal(world, position) {
    // Validate if there's a valid portal frame
    const portalInfo = NetherPortalBlock.validatePortalFrame(world, position);
    
    if (!portalInfo) {
      return { success: false, message: 'Invalid portal frame' };
    }
    
    // Create portal blocks inside the frame
    const { width, height, position: basePos, orientation } = portalInfo;
    
    // Place portal blocks in the interior
    if (orientation === 'x') {
      for (let x = 1; x < width + 1; x++) {
        for (let y = 1; y < height; y++) {
          const key = `${basePos.x + x},${basePos.y + y},${basePos.z}`;
          world.setBlock(key, { 
            type: 'nether_portal',
            orientation: 'x'
          });
        }
      }
    } else {
      for (let z = 1; z < width + 1; z++) {
        for (let y = 1; y < height; y++) {
          const key = `${basePos.x},${basePos.y + y},${basePos.z + z}`;
          world.setBlock(key, { 
            type: 'nether_portal',
            orientation: 'z'
          });
        }
      }
    }
    
    return { 
      success: true, 
      portal: {
        position: basePos,
        width,
        height,
        orientation
      }
    };
  }
  
  /**
   * Get position adjacent to a block face
   * @param {Object} position - Block position
   * @param {Object} face - Face that was clicked
   * @returns {Object} Adjacent position
   */
  getAdjacentPosition(position, face) {
    const { x, y, z } = position;
    
    switch (face) {
      case 'top':
        return { x, y: y + 1, z };
      case 'bottom':
        return { x, y: y - 1, z };
      case 'north':
        return { x, y, z: z - 1 };
      case 'south':
        return { x, y, z: z + 1 };
      case 'east':
        return { x: x + 1, y, z };
      case 'west':
        return { x: x - 1, y, z };
      default:
        return { x, y, z };
    }
  }
  
  /**
   * Reduce the durability of the item
   * @param {Object} player - The player using the item
   */
  reduceDurability(player) {
    const inventory = player.inventory;
    const heldItem = inventory.getHeldItem();
    
    if (heldItem && heldItem.id === this.id) {
      if (!heldItem.data) {
        heldItem.data = { durability: this.durability };
      }
      
      // Reduce durability
      heldItem.data.durability = Math.max(0, heldItem.data.durability - 1);
      
      // If durability is depleted, remove the item
      if (heldItem.data.durability <= 0) {
        inventory.removeHeldItem();
      } else {
        inventory.updateHeldItem(heldItem);
      }
    }
  }
  
  /**
   * Get client-side data for this item
   * @returns {Object} Data for the client
   */
  getClientData() {
    return {
      id: this.id,
      name: this.name,
      durability: this.durability,
      cooldown: this.cooldown,
      stackSize: this.stackSize,
      type: this.type,
      subtype: this.subtype,
      category: this.category,
      texture: this.texture
    };
  }
}

module.exports = FlintAndSteelItem; 