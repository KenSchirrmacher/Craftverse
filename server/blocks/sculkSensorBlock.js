/**
 * SculkSensorBlock - A sculk block that detects vibrations and emits redstone signals
 */

const Block = require('./block');
const EventEmitter = require('events');

class SculkSensorBlock extends Block {
  /**
   * Create a new SculkSensorBlock
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    super({
      id: 'sculk_sensor',
      name: 'Sculk Sensor',
      hardness: 1.5,
      resistance: 1.5,
      requiresTool: true,
      toolType: 'hoe',
      drops: [{ id: 'sculk_sensor', count: 1 }],
      ...options
    });

    // Vibration detection properties
    this.active = false; // Whether the sensor is currently active
    this.cooldown = 0; // Cooldown ticks before it can be activated again
    this.maxCooldown = 40; // Number of ticks to stay in cooldown (2 seconds)
    this.vibrationRadius = 8; // Maximum detection radius in blocks
    this.redstonePower = 0; // Current redstone power level
    this.maxRedstonePower = 15; // Maximum redstone power level
    
    // Use an EventEmitter for the vibration event system
    this.vibrationEmitter = new EventEmitter();
    
    // Listening for vibrations
    this.frequencies = {
      step: 1,
      break_block: 10,
      place_block: 10,
      open_door: 5,
      close_door: 5,
      item_drop: 2,
      fluid_place: 6,
      fluid_pickup: 6,
      projectile_land: 5,
      container_open: 5,
      container_close: 5,
      explosion: 15,
      lightning_strike: 15,
      bell_ring: 12
    };
  }

  /**
   * Handle a vibration event in the world
   * @param {Object} vibration - Vibration event
   * @param {string} vibration.type - Type of vibration
   * @param {Object} vibration.position - Source position
   * @param {Object} vibration.data - Additional vibration data
   * @param {number} currentTime - Current game time in ticks
   * @returns {boolean} Whether the vibration was detected
   */
  handleVibration(vibration, currentTime) {
    // Skip if in cooldown
    if (this.cooldown > 0) {
      return false;
    }

    // Calculate distance to vibration
    const dx = vibration.position.x - this.x;
    const dy = vibration.position.y - this.y;
    const dz = vibration.position.z - this.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Check if vibration is in range
    if (distance > this.vibrationRadius) {
      return false;
    }

    // Get vibration frequency
    const frequency = this.frequencies[vibration.type] || 1;
    
    // Determine redstone power based on frequency
    this.redstonePower = Math.min(frequency, this.maxRedstonePower);
    
    // Activate the sensor
    this.activate(currentTime);
    
    // Emit vibration detected event
    this.vibrationEmitter.emit('vibrationDetected', {
      type: vibration.type,
      position: vibration.position,
      power: this.redstonePower,
      frequency: frequency
    });

    return true;
  }

  /**
   * Activate the sculk sensor
   * @param {number} currentTime - Current game time in ticks
   */
  activate(currentTime) {
    this.active = true;
    this.cooldown = this.maxCooldown;
    
    // Emit redstone signal to adjacent blocks
    if (this.world) {
      this.emitRedstoneSignal();
    }
  }

  /**
   * Emit a redstone signal to adjacent blocks
   */
  emitRedstoneSignal() {
    // Get adjacent blocks
    const adjacentBlocks = this.world.getAdjacentBlocks(this.x, this.y, this.z);

    // Update redstone state for each adjacent block
    for (const block of adjacentBlocks) {
      if (block && block.updateRedstoneState) {
        block.updateRedstoneState(this.redstonePower);
      }
    }
  }

  /**
   * Update block state
   * @param {Object} world - World object
   * @param {Object} position - Block position
   * @param {number} currentTime - Current game time in ticks
   */
  update(world, position, currentTime) {
    // Update cooldown
    if (this.cooldown > 0) {
      this.cooldown--;
      
      // Deactivate after cooldown
      if (this.cooldown === 0) {
        this.active = false;
        this.redstonePower = 0;
        
        // Update redstone signal
        if (world) {
          this.world = world;
          this.x = position.x;
          this.y = position.y;
          this.z = position.z;
          this.emitRedstoneSignal();
        }
      }
    }
  }

  /**
   * Get the current redstone power level
   * @returns {number} Power level (0-15)
   */
  getRedstonePower() {
    return this.active ? this.redstonePower : 0;
  }

  /**
   * Serialize block state
   * @returns {Object} Serialized block data
   */
  toJSON() {
    return {
      ...super.toJSON(),
      active: this.active,
      cooldown: this.cooldown,
      redstonePower: this.redstonePower
    };
  }

  /**
   * Deserialize block state
   * @param {Object} data - Serialized block data
   * @returns {SculkSensorBlock} New block instance
   */
  static fromJSON(data) {
    const block = new SculkSensorBlock(data);
    block.active = data.active || false;
    block.cooldown = data.cooldown || 0;
    block.redstonePower = data.redstonePower || 0;
    return block;
  }
}

module.exports = SculkSensorBlock; 