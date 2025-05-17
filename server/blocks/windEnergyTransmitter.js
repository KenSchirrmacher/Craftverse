/**
 * WindEnergyTransmitter - Block that distributes energy from a Wind Turbine
 * Part of the 1.22 Update (Sorcery Update)
 */

const Block = require('./block');

class WindEnergyTransmitter extends Block {
  /**
   * Create a new Wind Energy Transmitter block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    const defaults = {
      id: 'wind_energy_transmitter',
      name: 'Wind Energy Transmitter',
      hardness: 3.0,
      resistance: 3.0,
      requiresTool: true,
      toolType: 'pickaxe',
      drops: [{ id: 'wind_energy_transmitter', count: 1 }],
      transparent: false,
      solid: true
    };
    
    super({ ...defaults, ...options });
    
    // Energy properties
    this.energyLevel = options.energyLevel || 0;
    this.maxEnergyLevel = options.maxEnergyLevel || 15;
    this.lastUpdateTime = options.lastUpdateTime || 0;
    this.connectedBlocks = options.connectedBlocks || [];
    this.isActive = options.isActive || false;
    
    // Visual properties for client
    this.activeTexture = 'wind_energy_transmitter_active';
    this.inactiveTexture = 'wind_energy_transmitter';
    
    // Wind turbine reference
    this.turbineId = options.turbineId || null;
  }
  
  /**
   * Update energy level of the transmitter
   * @param {number} newLevel - New energy level
   */
  updateEnergyLevel(newLevel) {
    const previousLevel = this.energyLevel;
    this.energyLevel = Math.min(this.maxEnergyLevel, Math.max(0, newLevel));
    this.isActive = this.energyLevel > 0;
    
    // Update block appearance
    if (this.world) {
      // Update texture for client rendering
      this.world.updateBlockAppearance?.(this.position, {
        texture: this.isActive ? this.activeTexture : this.inactiveTexture
      });
      
      // Update connected blocks if energy level changed
      if (previousLevel !== this.energyLevel) {
        this.distributeEnergy();
      }
    }
  }
  
  /**
   * Distribute energy to connected blocks
   */
  distributeEnergy() {
    if (!this.world) return;
    
    // Update connected blocks with energy
    for (const connectedBlock of this.connectedBlocks) {
      if (connectedBlock.block && connectedBlock.block.receiveEnergy) {
        connectedBlock.block.receiveEnergy(this.energyLevel);
      }
    }
    
    // Emit redstone signal
    this.emitRedstoneSignal();
  }
  
  /**
   * Emit a redstone signal to adjacent blocks
   */
  emitRedstoneSignal() {
    if (!this.world) return;
    
    // Update redstone signal in the world
    this.world.updateRedstoneSignal(this.position, this.energyLevel);
    
    // Get adjacent blocks
    const adjacentBlocks = this.world.getAdjacentBlocks?.(this.position.x, this.position.y, this.position.z) || [];
    
    // Update redstone state for each adjacent block
    for (const block of adjacentBlocks) {
      if (block && block.updateRedstoneState) {
        block.updateRedstoneState(this.energyLevel);
      }
    }
  }
  
  /**
   * Connect a block to receive energy
   * @param {Object} blockInfo - Block information to connect
   * @returns {boolean} Whether connection was successful
   */
  connectBlock(blockInfo) {
    if (!blockInfo || !blockInfo.position || !blockInfo.block || !blockInfo.block.receiveEnergy) {
      return false;
    }
    
    // Check if block is already connected
    const existingIndex = this.connectedBlocks.findIndex(b => 
      b.position.x === blockInfo.position.x &&
      b.position.y === blockInfo.position.y &&
      b.position.z === blockInfo.position.z
    );
    
    if (existingIndex === -1) {
      // Add new connection
      this.connectedBlocks.push(blockInfo);
      
      // Immediately send energy if active
      if (this.isActive && blockInfo.block.receiveEnergy) {
        blockInfo.block.receiveEnergy(this.energyLevel);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Disconnect a block from energy distribution
   * @param {Object} position - Position of block to disconnect
   * @returns {boolean} Whether disconnection was successful
   */
  disconnectBlock(position) {
    if (!position) return false;
    
    const index = this.connectedBlocks.findIndex(b => 
      b.position.x === position.x &&
      b.position.y === position.y &&
      b.position.z === position.z
    );
    
    if (index !== -1) {
      // Remove connection
      const removed = this.connectedBlocks.splice(index, 1)[0];
      
      // Reset energy level for disconnected block
      if (removed.block && removed.block.receiveEnergy) {
        removed.block.receiveEnergy(0);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the current energy level
   * @returns {number} Current energy level
   */
  getEnergyLevel() {
    return this.energyLevel;
  }
  
  /**
   * Get redstone power level
   * @returns {number} Redstone power level (0-15)
   */
  getRedstoneSignal() {
    return this.energyLevel;
  }
  
  /**
   * Set the turbine ID associated with this transmitter
   * @param {string} turbineId - ID of the wind turbine
   */
  setTurbineId(turbineId) {
    this.turbineId = turbineId;
  }
  
  /**
   * Get the turbine ID associated with this transmitter
   * @returns {string|null} Turbine ID or null if none
   */
  getTurbineId() {
    return this.turbineId;
  }
  
  /**
   * Handle block placement
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} player - Player placing the block
   * @returns {boolean} Whether placement was successful
   */
  onPlace(world, position, player) {
    super.onPlace(world, position, player);
    
    // Initialize position and world reference
    this.position = { ...position };
    this.world = world;
    
    // Check for nearby wind turbines
    this.findNearbyWindTurbine();
    
    return true;
  }
  
  /**
   * Find and connect to a nearby wind turbine
   * @returns {boolean} Whether a turbine was found
   */
  findNearbyWindTurbine() {
    if (!this.world) return false;
    
    // Get all wind turbines in the world
    const turbines = this.world.getStructures?.('wind_turbine') || [];
    
    // Find the closest turbine that's at this position
    for (const turbine of turbines) {
      if (turbine.position.x === this.position.x &&
          turbine.position.y === this.position.y &&
          turbine.position.z === this.position.z) {
        // Found a matching turbine
        this.turbineId = turbine.id;
        
        // Update energy level from turbine
        this.updateEnergyLevel(turbine.energyOutput || 0);
        
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Handle block interaction
   * @param {Object} player - Player interacting with the block
   * @param {Object} item - Item used for interaction
   * @returns {boolean} Whether interaction was successful
   */
  interact(player, item) {
    if (!player) return false;
    
    // Tell player about current status
    if (player.sendMessage) {
      if (this.turbineId) {
        player.sendMessage(`Wind Energy Transmitter connected to turbine ${this.turbineId}`);
        player.sendMessage(`Current energy output: ${this.energyLevel}/${this.maxEnergyLevel}`);
        player.sendMessage(`Connected blocks: ${this.connectedBlocks.length}`);
      } else {
        player.sendMessage('Wind Energy Transmitter not connected to any turbine');
      }
    }
    
    return true;
  }
  
  /**
   * Handle block update
   * @param {Object} world - World instance
   * @param {Object} position - Block position
   * @param {Object} options - Update options
   */
  update(world, position, options = {}) {
    super.update(world, position, options);
    
    // Update only every 20 ticks (1 second) to avoid excessive processing
    const currentTime = options.currentTime || Date.now();
    if (currentTime - this.lastUpdateTime < 20) {
      return;
    }
    
    this.lastUpdateTime = currentTime;
    
    // If not connected to a turbine, try to find one
    if (!this.turbineId && world) {
      this.findNearbyWindTurbine();
    }
    
    // Visual effects if active
    if (this.isActive && world) {
      // Add particle effects for active transmitter
      world.addParticleEffect?.({
        type: 'energy',
        position: { ...position, y: position.y + 0.5 },
        count: Math.ceil(this.energyLevel / 3),
        color: '#ff3300',
        radius: 0.5
      });
    }
  }
  
  /**
   * Convert this block to JSON for serialization
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON(),
      energyLevel: this.energyLevel,
      maxEnergyLevel: this.maxEnergyLevel,
      lastUpdateTime: this.lastUpdateTime,
      connectedBlocks: this.connectedBlocks.map(b => ({
        position: { ...b.position }
      })),
      isActive: this.isActive,
      turbineId: this.turbineId
    };
  }
  
  /**
   * Create a wind energy transmitter from JSON data
   * @param {Object} data - JSON data
   * @returns {WindEnergyTransmitter} New instance
   * @static
   */
  static fromJSON(data) {
    return new WindEnergyTransmitter({
      id: data.id || 'wind_energy_transmitter',
      name: data.name || 'Wind Energy Transmitter',
      energyLevel: data.energyLevel || 0,
      maxEnergyLevel: data.maxEnergyLevel || 15,
      lastUpdateTime: data.lastUpdateTime || 0,
      connectedBlocks: data.connectedBlocks || [],
      isActive: data.isActive || false,
      turbineId: data.turbineId || null,
      position: data.position
    });
  }
}

module.exports = WindEnergyTransmitter; 