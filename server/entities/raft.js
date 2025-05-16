/**
 * Raft entity - A variant of boat with different properties
 * Part of the 1.20 Update
 */
const Boat = require('./boat');

class Raft extends Boat {
  /**
   * Create a new raft entity
   * @param {Object} world - World instance
   * @param {Object} options - Raft options
   */
  constructor(world, options = {}) {
    // Initialize with boat properties first
    super(world, options);
    
    // Override type
    this.type = options.woodType ? `${options.woodType}_raft` : 'raft';
    
    // Raft-specific properties
    this.isRaft = true;
    this.health = 60; // Rafts have higher health than boats (was 40)
    this.maxHealth = 60;
    this.buoyancy = 1.2; // Increased buoyancy (was 1.0)
    this.speed = 0.08; // Slower than boats (was 0.1)
    this.turnSpeed = 2.5; // Slower turning (was 3)
    this.dragFactor = 1.2; // More drag in water
    
    // Passenger capacity
    this.maxPassengers = 2; // Rafts can carry two players
    this.passengers = []; // Array of passenger entities
    
    // Display properties
    this.raftHeight = 0.4; // Lower profile than boats (was 0.6)
    this.raftWidth = 1.5; // Wider than boats (was 1.4)
    
    // Update dimensions
    this.width = this.raftWidth;
    this.height = this.raftHeight;
  }
  
  /**
   * Apply raft-specific physics
   * @param {number} delta - Time elapsed since last update
   */
  applyBoatPhysics(delta) {
    // Call parent method first
    super.applyBoatPhysics(delta);
    
    // Apply additional raft-specific physics
    if (this.isInWater) {
      // Rafts have more drag in water
      this.velocity.x *= 0.90 / this.dragFactor;
      this.velocity.z *= 0.90 / this.dragFactor;
      
      // Rafts are more stable in water
      if (this.passengers.length === 0) {
        // Reduce bobbing effect
        this.velocity.y *= 0.9;
      }
    }
  }
  
  /**
   * Override addPassenger to handle multiple passengers
   * @param {Entity} entity - Entity to add as passenger
   * @returns {boolean} Whether passenger was added
   */
  addPassenger(entity) {
    if (!entity) return false;
    
    // Check if we already have max passengers
    if (this.passengers.length >= this.maxPassengers) {
      return false;
    }
    
    // Add passenger to the list
    this.passengers.push(entity);
    
    // If this is the first passenger, they control the raft
    if (this.passengers.length === 1) {
      this.passenger = entity;
    }
    
    // Notify entity they are riding this raft
    if (entity.startRiding) {
      entity.startRiding(this);
    }
    
    // Emit event
    this.emit('passengerAdded', { entity });
    
    return true;
  }
  
  /**
   * Remove a specific passenger
   * @param {Entity} entity - Passenger to remove
   * @returns {boolean} Whether passenger was removed
   */
  removePassenger(entity) {
    if (!entity) return false;
    
    // Find passenger index
    const index = this.passengers.findIndex(p => p === entity || p.id === entity.id);
    if (index === -1) return false;
    
    // Remove passenger
    const removedEntity = this.passengers.splice(index, 1)[0];
    
    // If primary passenger (driver) was removed, update controller
    if (this.passenger === removedEntity || this.passenger?.id === removedEntity.id) {
      // Assign next passenger as controller if available
      this.passenger = this.passengers.length > 0 ? this.passengers[0] : null;
    }
    
    // Notify entity they stopped riding
    if (removedEntity.stopRiding) {
      removedEntity.stopRiding();
    }
    
    // Emit event
    this.emit('passengerRemoved', { entity: removedEntity });
    
    return true;
  }
  
  /**
   * Remove all passengers
   */
  removeAllPassengers() {
    // Copy passengers array to avoid modification during iteration
    const currentPassengers = [...this.passengers];
    
    // Remove each passenger
    currentPassengers.forEach(passenger => {
      this.removePassenger(passenger);
    });
    
    // Clear arrays to be safe
    this.passengers = [];
    this.passenger = null;
  }
  
  /**
   * Process passenger input - can be from either the first or second passenger
   * @param {number} delta - Time elapsed since last update
   */
  processPassengerInput(delta) {
    // Combine inputs from all passengers (only the first passenger steers)
    const input = this.lastInput;
    
    // Apply forward/backward movement
    if (input.forward !== 0) {
      // Calculate movement direction based on raft rotation
      const radians = this.rotation.y * (Math.PI / 180);
      const moveX = -Math.sin(radians) * this.speed * input.forward * delta;
      const moveZ = Math.cos(radians) * this.speed * input.forward * delta;
      
      this.velocity.x += moveX;
      this.velocity.z += moveZ;
    }
    
    // Apply turning (only first passenger controls turning)
    if (input.turn !== 0) {
      this.rotation.y += this.turnSpeed * input.turn * delta;
      
      // Normalize rotation to 0-360
      this.rotation.y = (this.rotation.y + 360) % 360;
    }
  }
  
  /**
   * Get passenger position based on index
   * @param {number} index - Passenger index (0 for driver, 1 for passenger)
   * @returns {Object} Position offset from raft center
   */
  getPassengerPosition(index) {
    // Base position (centered on raft)
    const basePosition = {
      x: this.position.x,
      y: this.position.y + this.height, // Position on top of raft
      z: this.position.z
    };
    
    // For single passenger, center them
    if (this.passengers.length === 1) {
      return basePosition;
    }
    
    // For multiple passengers, offset them based on index
    const offsetX = 0.4; // Distance from center
    
    // Apply offset based on passenger index and rotation
    const radians = this.rotation.y * (Math.PI / 180);
    
    // First passenger sits in front, second in back
    const xOffset = index === 0 ? offsetX : -offsetX;
    
    // Calculate rotated offset
    const rotatedX = Math.sin(radians) * xOffset;
    const rotatedZ = Math.cos(radians) * xOffset;
    
    return {
      x: basePosition.x - rotatedX,
      y: basePosition.y,
      z: basePosition.z + rotatedZ
    };
  }
  
  /**
   * Update the position of all passengers
   */
  updatePassengerPositions() {
    this.passengers.forEach((passenger, index) => {
      if (passenger && passenger.setPosition) {
        const pos = this.getPassengerPosition(index);
        passenger.setPosition(pos.x, pos.y, pos.z);
      }
    });
  }
  
  /**
   * Update the raft state
   * @param {number} delta - Time elapsed since last update
   */
  update(delta) {
    // Call parent update
    super.update(delta);
    
    // Update passenger positions
    this.updatePassengerPositions();
  }
  
  /**
   * Serialize raft data
   * @returns {Object} Serialized raft data
   */
  serialize() {
    const data = super.serialize();
    
    // Add raft-specific properties
    data.isRaft = true;
    data.dragFactor = this.dragFactor;
    data.maxPassengers = this.maxPassengers;
    data.passengers = this.passengers.map(p => p.id);
    
    return data;
  }
  
  /**
   * Create raft from serialized data
   * @param {Object} data - Serialized data
   * @param {Object} world - World instance
   * @returns {Raft} Raft instance
   */
  static deserialize(data, world) {
    return new Raft(world, data);
  }
}

module.exports = Raft; 