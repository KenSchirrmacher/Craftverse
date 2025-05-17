/**
 * CalibratedSculkSensorBlock - An advanced sculk sensor that can filter specific vibration types
 * Part of the 1.20 Update
 */

const SculkSensorBlock = require('./sculkSensorBlock');

class CalibratedSculkSensorBlock extends SculkSensorBlock {
  /**
   * Create a new Calibrated Sculk Sensor
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    const defaults = {
      id: 'calibrated_sculk_sensor',
      name: 'Calibrated Sculk Sensor',
      hardness: 1.5,
      resistance: 1.5,
      requiresTool: true,
      toolType: 'hoe',
      drops: [{ id: 'calibrated_sculk_sensor', count: 1 }]
    };
    
    // Make sure defaults are correctly merged with options
    const mergedOptions = {...defaults, ...options};
    
    // Call parent constructor with the merged options
    super(mergedOptions);

    // Filter settings
    this.filterType = options.filterType || 'none'; // Current filter setting
    this.availableFilters = [
      'none',          // No filtering, detect all vibrations (default)
      'step',          // Player/mob movement
      'break_block',   // Breaking blocks
      'place_block',   // Placing blocks
      'open_door',     // Opening doors/trapdoors/gates
      'close_door',    // Closing doors/trapdoors/gates
      'item_drop',     // Dropping items
      'fluid_place',   // Placing fluids
      'fluid_pickup',  // Picking up fluids
      'projectile_land', // Arrows landing, etc.
      'container_open', // Opening chests, etc.
      'container_close', // Closing chests, etc.
      'explosion',     // Explosions
      'lightning_strike', // Lightning strikes
      'bell_ring'      // Ringing bells
    ];
    
    // Calibrated sensor can have a longer range
    this.vibrationRadius = 12; // Extended range compared to regular sculk sensor
  }

  /**
   * Set the vibration filter type
   * @param {string} filterType - Type of vibration to filter for
   * @returns {boolean} Whether the filter was successfully set
   */
  setFilter(filterType) {
    if (this.availableFilters.includes(filterType)) {
      this.filterType = filterType;
      return true;
    }
    return false;
  }

  /**
   * Get the current filter type
   * @returns {string} Current filter type
   */
  getFilter() {
    return this.filterType;
  }

  /**
   * Handle a vibration event in the world, applying filtering
   * @param {Object} vibration - Vibration event
   * @param {string} vibration.type - Type of vibration
   * @param {Object} vibration.position - Source position
   * @param {Object} vibration.data - Additional vibration data
   * @param {number} currentTime - Current game time in ticks
   * @returns {boolean} Whether the vibration was detected and processed
   * @override
   */
  handleVibration(vibration, currentTime) {
    // Skip if in cooldown
    if (this.cooldown > 0) {
      return false;
    }

    // Apply filter - if filter is set to something other than 'none',
    // only detect vibrations of that specific type
    if (this.filterType !== 'none' && vibration.type !== this.filterType) {
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
    
    // For calibrated sensors, always emit full power when matching the filter
    if (this.filterType !== 'none' && vibration.type === this.filterType) {
      this.redstonePower = this.maxRedstonePower;
    } else {
      // Normal behavior for unfiltered mode
      this.redstonePower = Math.min(frequency, this.maxRedstonePower);
    }
    
    // Activate the sensor
    this.activate(currentTime);
    
    // Emit vibration detected event with filter info
    this.vibrationEmitter.emit('vibrationDetected', {
      type: vibration.type,
      position: vibration.position,
      power: this.redstonePower,
      frequency: frequency,
      filtered: this.filterType !== 'none',
      matchesFilter: vibration.type === this.filterType
    });

    return true;
  }

  /**
   * Interact with the block - used to change filter settings
   * @param {Object} player - Player interacting with the block
   * @param {Object} item - Item used for interaction
   * @returns {boolean} Whether interaction was successful
   */
  interact(player, item) {
    // Cycle through filter types when interacted with
    const currentIndex = this.availableFilters.indexOf(this.filterType);
    const nextIndex = (currentIndex + 1) % this.availableFilters.length;
    this.filterType = this.availableFilters[nextIndex];
    
    // Notify player of new filter setting
    if (player && player.sendMessage) {
      player.sendMessage(`Filter set to: ${this.filterType}`);
    }
    
    return true;
  }

  /**
   * Serialize block state
   * @returns {Object} Serialized block data
   * @override
   */
  toJSON() {
    return {
      ...super.toJSON(),
      filterType: this.filterType
    };
  }

  /**
   * Deserialize block state
   * @param {Object} data - Serialized block data
   * @returns {CalibratedSculkSensorBlock} New block instance
   * @static
   */
  static fromJSON(data) {
    const block = new CalibratedSculkSensorBlock(data);
    block.active = data.active || false;
    block.cooldown = data.cooldown || 0;
    block.redstonePower = data.redstonePower || 0;
    block.filterType = data.filterType || 'none';
    return block;
  }
}

module.exports = CalibratedSculkSensorBlock; 