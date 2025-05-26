/**
 * TorchBlock - Base class for all torch variants
 * Handles common torch functionality like placement and lighting
 */
const Block = require('./blockBase');
const { BlockFace } = require('./blockFace');

class TorchBlock extends Block {
  /**
   * Create a torch block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: options.id || 'torch',
      name: options.name || 'Torch',
      type: 'torch',
      isSolid: false,
      isTransparent: true,
      lightLevel: options.lightLevel || 14,
      ...options
    });
    
    // Torch specific properties
    this.face = options.face || BlockFace.UP;
    this.canFloat = options.canFloat || false;
    this.breakOnWater = options.breakOnWater || true;
  }
  
  /**
   * Check if the torch can be placed at the given position
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {string} face - The face to place against
   * @returns {boolean} Whether the torch can be placed
   */
  canPlaceAt(world, x, y, z, face) {
    // Check if there's a solid block to attach to
    const attachPos = this.getAttachPosition(x, y, z, face);
    const attachBlock = world.getBlock(attachPos.x, attachPos.y, attachPos.z);
    
    if (!attachBlock || !attachBlock.isSolid) {
      return false;
    }
    
    // Check if the torch position is valid
    const torchPos = world.getBlock(x, y, z);
    if (torchPos && torchPos.isSolid) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get the position where the torch should attach
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {string} face - The face to place against
   * @returns {Object} The attach position
   */
  getAttachPosition(x, y, z, face) {
    const vector = BlockFace.getVectorFromFace(face);
    return {
      x: x + vector.x,
      y: y + vector.y,
      z: z + vector.z
    };
  }
  
  /**
   * Handle block update (e.g., when attached block is broken)
   * @param {Object} world - The world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   */
  onNeighborUpdate(world, x, y, z) {
    const attachPos = this.getAttachPosition(x, y, z, this.face);
    const attachBlock = world.getBlock(attachPos.x, attachPos.y, attachPos.z);
    
    if (!attachBlock || !attachBlock.isSolid) {
      world.setBlock(x, y, z, null);
    }
  }
  
  /**
   * Get the block's bounding box
   * @returns {Object} The bounding box
   */
  getBoundingBox() {
    // Torches have a smaller hitbox
    return {
      minX: 0.4,
      minY: 0.0,
      minZ: 0.4,
      maxX: 0.6,
      maxY: 0.6,
      maxZ: 0.6
    };
  }
  
  /**
   * Get the block's light emission
   * @returns {number} The light level
   */
  getLightLevel() {
    return this.lightLevel;
  }
  
  /**
   * Serialize the block state
   * @returns {Object} The serialized state
   */
  serialize() {
    return {
      ...super.serialize(),
      face: this.face
    };
  }
  
  /**
   * Deserialize the block state
   * @param {Object} data - The serialized state
   * @returns {TorchBlock} The deserialized block
   */
  static deserialize(data) {
    return new TorchBlock({
      ...data,
      face: data.face
    });
  }
}

module.exports = TorchBlock; 