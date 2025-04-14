/**
 * CandleBlock implementation
 * Provides decorative light sources with stacking and color variants
 * Part of the Caves & Cliffs update
 */

// Dependencies
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

/**
 * CandleState class to track candle properties
 * @private
 */
class CandleState {
  /**
   * Create a new candle state
   * @param {Object} options - Candle state options
   */
  constructor(options = {}) {
    this.count = options.count || 1;
    this.lit = options.lit || false;
    this.waterlogged = options.waterlogged || false;
    this.color = options.color || 'white'; // Default white
  }

  /**
   * Add candles to the current state
   * @param {number} count - Number of candles to add
   * @returns {boolean} - Whether candles were successfully added
   */
  addCandles(count) {
    if (this.count + count > 4) {
      return false;
    }
    this.count += count;
    return true;
  }

  /**
   * Get light level based on candle count and lit state
   * @returns {number} - Light level (0-15)
   */
  getLightLevel() {
    if (!this.lit) {
      return 0;
    }
    // Each candle adds 3 light levels
    return Math.min(3 + (this.count - 1), 12);
  }
}

/**
 * CandleBlock class for decorative light sources
 * Supports stacking, coloring, and lighting interactions
 */
class CandleBlock extends EventEmitter {
  /**
   * Create a new candle block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super();
    
    // Basic block properties
    this.id = options.id || uuidv4();
    this.type = options.type || 'candle';
    this.hardness = 0.1;
    this.resistance = 0.1;
    this.transparent = true;
    this.solid = true;
    this.gravity = false;
    
    // Candle-specific properties
    this.state = new CandleState({
      count: options.count || 1,
      lit: options.lit || false,
      waterlogged: options.waterlogged || false,
      color: options.color || 'white'
    });
    
    // Placement information (for multiple candles in one block)
    this.positions = options.positions || this.generatePositions(this.state.count);
    
    // Tool information
    this.toolType = 'any';
    this.minToolTier = 0;
  }

  /**
   * Generate positions for candles based on count
   * @private
   * @param {number} count - Number of candles
   * @returns {Array} - Array of position objects with x, z coordinates
   */
  generatePositions(count) {
    const positions = [];
    
    // Positioning patterns based on candle count
    switch (count) {
      case 1:
        positions.push({ x: 0.5, z: 0.5 }); // Center
        break;
      case 2:
        positions.push({ x: 0.3, z: 0.3 }); // North-west
        positions.push({ x: 0.7, z: 0.7 }); // South-east
        break;
      case 3:
        positions.push({ x: 0.3, z: 0.3 }); // North-west
        positions.push({ x: 0.7, z: 0.3 }); // North-east
        positions.push({ x: 0.5, z: 0.7 }); // South
        break;
      case 4:
        positions.push({ x: 0.3, z: 0.3 }); // North-west
        positions.push({ x: 0.7, z: 0.3 }); // North-east
        positions.push({ x: 0.3, z: 0.7 }); // South-west
        positions.push({ x: 0.7, z: 0.7 }); // South-east
        break;
      default:
        positions.push({ x: 0.5, z: 0.5 }); // Default center
    }
    
    return positions;
  }

  /**
   * Check if a candle can be placed here
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @returns {boolean} - Whether placement is valid
   */
  canPlaceAt(world, position) {
    // Check block below
    const blockBelow = world.getBlockAt(position.x, position.y - 1, position.z);
    if (!blockBelow || !blockBelow.solid) {
      return false;
    }
    
    // Check block at position (for adding candles)
    const blockAt = world.getBlockAt(position.x, position.y, position.z);
    if (blockAt) {
      // Can add to existing candle block if same color and not at max count
      if (blockAt.type === 'candle' && 
          blockAt.state.color === this.state.color &&
          blockAt.state.count < 4) {
        return true;
      }
      // Can place in water if waterlogging is supported
      if (blockAt.type === 'water') {
        return true;
      }
      return false;
    }
    
    return true;
  }

  /**
   * Handle block placement
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @param {Object} player - Player object
   * @returns {boolean} - Whether placement was successful
   */
  onPlace(world, position, player) {
    // Handle placement in water
    const blockAt = world.getBlockAt(position.x, position.y, position.z);
    if (blockAt && blockAt.type === 'water') {
      this.state.waterlogged = true;
    }
    
    // Handle adding to existing candle
    if (blockAt && blockAt.type === 'candle') {
      // Only add if same color
      if (blockAt.state.color !== this.state.color) {
        return false;
      }
      
      // Try to add candles
      if (!blockAt.state.addCandles(this.state.count)) {
        return false;
      }
      
      // Update positions
      blockAt.positions = this.generatePositions(blockAt.state.count);
      
      // Signal update
      blockAt.emit('update', { block: blockAt, position });
      return true;
    }
    
    // Normal placement
    this.emit('place', { block: this, position });
    return true;
  }

  /**
   * Handle block interaction (right-click)
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @param {Object} player - Player object
   * @param {Object} item - Item used for interaction
   * @returns {boolean} - Whether interaction was handled
   */
  onInteract(world, position, player, item) {
    // Can't light if waterlogged
    if (this.state.waterlogged) {
      return false;
    }
    
    // Light candle with flint and steel
    if (!this.state.lit && item && item.type === 'flint_and_steel') {
      this.state.lit = true;
      this.emit('update', { block: this, position });
      return true;
    }
    
    // Extinguish with empty hand
    if (this.state.lit && (!item || item.type === 'empty')) {
      this.state.lit = false;
      this.emit('update', { block: this, position });
      
      // Spawn smoke particles
      this.emit('particles', {
        type: 'smoke',
        position: {
          x: position.x + 0.5,
          y: position.y + 0.7,
          z: position.z + 0.5
        },
        count: this.state.count * 2
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Handle updates from adjacent blocks
   * @param {Object} world - World object
   * @param {Object} position - Position object
   * @param {string} face - Face that was updated
   * @returns {boolean} - Whether the update was handled
   */
  onNeighborUpdate(world, position, face) {
    // Handle water flow
    if (face === 'up') {
      const blockAbove = world.getBlockAt(position.x, position.y + 1, position.z);
      if (blockAbove && blockAbove.type === 'water') {
        // Extinguish if lit
        if (this.state.lit) {
          this.state.lit = false;
          this.emit('update', { block: this, position });
          
          // Spawn extinguish particles
          this.emit('particles', {
            type: 'smoke',
            position: {
              x: position.x + 0.5,
              y: position.y + 0.7,
              z: position.z + 0.5
            },
            count: this.state.count * 2
          });
        }
        
        // Set as waterlogged
        this.state.waterlogged = true;
      }
    }
    
    return true;
  }

  /**
   * Get the light level of this block
   * @returns {number} - Light level (0-15)
   */
  getLightLevel() {
    return this.state.getLightLevel();
  }

  /**
   * Get drops when broken
   * @param {Object} tool - Tool used to break
   * @returns {Array} - Array of item drops
   */
  getDrops(tool) {
    const drops = [];
    
    // Drop candles equal to count
    drops.push({
      type: this.state.color === 'white' ? 'candle' : `${this.state.color}_candle`,
      count: this.state.count
    });
    
    return drops;
  }

  /**
   * Serialize block for saving
   * @returns {Object} - Serialized block data
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      state: {
        count: this.state.count,
        lit: this.state.lit,
        waterlogged: this.state.waterlogged,
        color: this.state.color
      },
      positions: this.positions
    };
  }

  /**
   * Deserialize block from saved data
   * @param {Object} data - Serialized block data
   * @returns {CandleBlock} - Deserialized block
   */
  static deserialize(data) {
    return new CandleBlock({
      id: data.id,
      type: data.type,
      count: data.state.count,
      lit: data.state.lit,
      waterlogged: data.state.waterlogged,
      color: data.state.color,
      positions: data.positions
    });
  }
}

/**
 * Factory function to create a colored candle
 * @param {string} color - Color name
 * @returns {Function} - Constructor for the colored candle
 */
function createColoredCandle(color) {
  return class extends CandleBlock {
    constructor(options = {}) {
      super({
        ...options,
        type: `${color}_candle`,
        color: color
      });
    }
  };
}

// Export the base class and convenience factory
module.exports = {
  CandleBlock,
  WhiteCandle: CandleBlock, // Base candle is white
  OrangeCandle: createColoredCandle('orange'),
  MagentaCandle: createColoredCandle('magenta'),
  LightBlueCandle: createColoredCandle('light_blue'),
  YellowCandle: createColoredCandle('yellow'),
  LimeCandle: createColoredCandle('lime'),
  PinkCandle: createColoredCandle('pink'),
  GrayCandle: createColoredCandle('gray'),
  LightGrayCandle: createColoredCandle('light_gray'),
  CyanCandle: createColoredCandle('cyan'),
  PurpleCandle: createColoredCandle('purple'),
  BlueCandle: createColoredCandle('blue'),
  BrownCandle: createColoredCandle('brown'),
  GreenCandle: createColoredCandle('green'),
  RedCandle: createColoredCandle('red'),
  BlackCandle: createColoredCandle('black')
}; 