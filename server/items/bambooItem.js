/**
 * Bamboo Items - Item implementations for the Bamboo wood set
 * Part of the 1.20 Update
 */

const Item = require('./item');

/**
 * Base class for bamboo items
 */
class BambooItem extends Item {
  /**
   * Create a new bamboo item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'bamboo',
      type: options.id || 'bamboo',
      name: options.name || 'Bamboo',
      description: options.description || 'A versatile plant material used for crafting',
      stackable: true,
      maxStackSize: 64,
      ...options
    });
    
    this.material = 'bamboo';
  }
}

/**
 * Bamboo Sign Item - Places bamboo signs
 */
class BambooSignItem extends Item {
  /**
   * Create a new bamboo sign item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: 'bamboo_sign',
      type: 'bamboo_sign',
      name: 'Bamboo Sign',
      description: 'A sign made of bamboo for displaying text',
      stackable: true,
      maxStackSize: 16,
      placeable: true,
      ...options
    });
    
    this.material = 'bamboo';
  }
  
  /**
   * Place sign in the world
   * @param {Object} world - The world object
   * @param {Object} position - The position to place at
   * @param {Object} player - The player placing the sign
   * @param {string} face - The face being placed on
   * @returns {boolean} Whether placement was successful
   */
  place(world, position, player, face) {
    if (!world || !position) return false;
    
    // Determine if it's a wall sign or standing sign
    const isWallSign = face !== 'top' && face !== 'bottom';
    const blockId = isWallSign ? 'bamboo_wall_sign' : 'bamboo_sign';
    
    // Calculate rotation for standing signs
    let rotationY = 0;
    if (!isWallSign && player) {
      // Convert player yaw to block rotation
      const yaw = player.rotation.yaw;
      rotationY = Math.floor(((yaw + 180) % 360) / 22.5) * 22.5;
    }
    
    // Set block data
    const blockData = {
      rotationY: rotationY
    };
    
    // Wall signs need to know which wall they're attached to
    if (isWallSign) {
      blockData.face = face;
    }
    
    // Create the block
    const block = world.createBlock(blockId, position, blockData);
    if (!block) return false;
    
    return true;
  }
}

/**
 * Bamboo Button Item - Places bamboo buttons
 */
class BambooButtonItem extends Item {
  /**
   * Create a new bamboo button item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: 'bamboo_button',
      type: 'bamboo_button',
      name: 'Bamboo Button',
      description: 'A button made of bamboo that can be pressed',
      stackable: true,
      maxStackSize: 64,
      placeable: true,
      ...options
    });
    
    this.material = 'bamboo';
  }
  
  /**
   * Place button in the world
   * @param {Object} world - The world object
   * @param {Object} position - The position to place at
   * @param {Object} player - The player placing the button
   * @param {string} face - The face being placed on
   * @returns {boolean} Whether placement was successful
   */
  place(world, position, player, face) {
    if (!world || !position || !face) return false;
    
    // Buttons must be placed on a block face
    if (face === 'none') return false;
    
    // Create the block with face data
    const block = world.createBlock('bamboo_button', position, {
      face: face
    });
    
    if (!block) return false;
    
    return true;
  }
}

/**
 * Bamboo Pressure Plate Item - Places bamboo pressure plates
 */
class BambooPressurePlateItem extends Item {
  /**
   * Create a new bamboo pressure plate item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: 'bamboo_pressure_plate',
      type: 'bamboo_pressure_plate',
      name: 'Bamboo Pressure Plate',
      description: 'A pressure plate made of bamboo that activates when stepped on',
      stackable: true,
      maxStackSize: 64,
      placeable: true,
      ...options
    });
    
    this.material = 'bamboo';
  }
  
  /**
   * Place pressure plate in the world
   * @param {Object} world - The world object
   * @param {Object} position - The position to place at
   * @param {Object} player - The player placing the pressure plate
   * @returns {boolean} Whether placement was successful
   */
  place(world, position, player) {
    if (!world || !position) return false;
    
    // Pressure plates can only be placed on top of solid blocks
    const blockBelow = world.getBlock(position.x, position.y - 1, position.z);
    if (!blockBelow || !blockBelow.solid) return false;
    
    // Create the block
    const block = world.createBlock('bamboo_pressure_plate', position);
    if (!block) return false;
    
    return true;
  }
}

module.exports = {
  BambooItem,
  BambooSignItem,
  BambooButtonItem,
  BambooPressurePlateItem
}; 