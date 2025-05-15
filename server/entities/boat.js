/**
 * Boat entity - Represents a boat that can be placed in water and ridden by players
 */
const Entity = require('./entity');

class Boat extends Entity {
  /**
   * Create a new boat entity
   * @param {Object} world - World instance
   * @param {Object} options - Boat options
   */
  constructor(world, options = {}) {
    // Initialize with entity properties
    super(world, {
      type: 'boat',
      width: 1.4,
      height: 0.6,
      gravity: 0.04, // Lower gravity for boats
      drag: 0.05,    // Higher drag for water movement
      ...options
    });
    
    // Boat specific properties
    this.woodType = options.woodType || 'oak';
    this.hasChest = options.hasChest || false;
    this.inventory = options.inventory || [];
    this.inventorySize = this.hasChest ? 27 : 0; // 3 rows of 9 slots for chest boat
    this.passenger = null;
    this.isInWater = false;
    this.waterLevel = 0;
    this.lastInput = { forward: 0, turn: 0 };
    this.damageTimer = 0;
    this.health = 40; // Boats have 40 health
    this.maxHealth = 40;
    this.buoyancy = 1.0; // Increased buoyancy value (was 0.6)
    this.speed = 0.1;   // Base movement speed
    this.turnSpeed = 3; // Rotation speed in degrees per tick
    
    // Create inventory if boat has chest
    if (this.hasChest && !options.inventory) {
      this.inventory = new Array(this.inventorySize).fill(null);
    }
  }
  
  /**
   * Update the boat's state
   * @param {number} delta - Time elapsed since last update
   */
  update(delta) {
    // Update water state first
    this.updateWaterState();
    
    // Process damage timer
    if (this.damageTimer > 0) {
      this.damageTimer -= delta;
    }
    
    // Apply specific physics based on environment
    this.applyBoatPhysics(delta);
    
    // Process passenger input
    if (this.passenger) {
      this.processPassengerInput(delta);
    }
    
    // Call parent update
    super.update(delta);
  }
  
  /**
   * Update water state
   */
  updateWaterState() {
    // If isInWater is forced for testing, don't update it
    if (this._isInWaterForced) return;
    
    if (!this.world) return;
    
    // Check for water at boat position
    const x = Math.floor(this.position.x);
    const y = Math.floor(this.position.y);
    const z = Math.floor(this.position.z);
    
    const block = this.world.getBlock(x, y, z);
    const blockBelow = this.world.getBlock(x, y - 1, z);
    
    // Check if boat is in water
    this.isInWater = (block && block.material === 'water') || 
                     (blockBelow && blockBelow.material === 'water');
    
    // Find water level
    if (this.isInWater) {
      // In Minecraft, water has a height of 0.9 blocks
      this.waterLevel = Math.floor(this.position.y) + 0.9;
    }
  }
  
  /**
   * Override the isInWater state for testing
   * @param {boolean} value - New isInWater value
   * @param {number} waterLevel - Optional water level to set
   */
  setInWater(value, waterLevel) {
    this.isInWater = value;
    this._isInWaterForced = true;
    
    if (waterLevel !== undefined) {
      this.waterLevel = waterLevel;
    } else if (value) {
      this.waterLevel = Math.floor(this.position.y) + 0.9;
    }
  }
  
  /**
   * Apply boat-specific physics
   * @param {number} delta - Time elapsed since last update
   */
  applyBoatPhysics(delta) {
    if (this.dead) return;
    
    if (this.isInWater) {
      // Apply buoyancy in water
      const depth = this.waterLevel - this.position.y;
      
      if (depth > 0) {
        // Apply stronger upward force based on depth
        const buoyancyForce = Math.min(depth * this.buoyancy, 0.2) * delta;
        this.velocity.y += buoyancyForce;
        
        // Apply more drag in water
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
      }
      
      // Cap falling speed in water
      if (this.velocity.y < -0.1) {
        this.velocity.y = -0.1; // Reduced maximum sink rate (was -0.3)
      }
      
      // Apply slight bobbing in water
      if (this.passenger === null) {
        this.velocity.y += Math.sin(this.age * 0.1) * 0.004 * delta;
      }
      
      // Ensure boat stays at surface
      if (Math.abs(this.velocity.y) < 0.01 && Math.abs(this.position.y - this.waterLevel) < 0.1) {
        this.position.y = this.waterLevel - 0.05; // Position boat to float just below water surface
        this.velocity.y = 0; // Stop vertical movement when stable at surface
      }
    } else {
      // On land, boats move slower
      this.velocity.x *= 0.5;
      this.velocity.z *= 0.5;
    }
    
    // Cap boat velocity
    const maxSpeed = this.isInWater ? 0.4 : 0.2;
    
    const speedSq = 
      this.velocity.x * this.velocity.x + 
      this.velocity.z * this.velocity.z;
      
    if (speedSq > maxSpeed * maxSpeed) {
      const speedFactor = maxSpeed / Math.sqrt(speedSq);
      this.velocity.x *= speedFactor;
      this.velocity.z *= speedFactor;
    }
  }
  
  /**
   * Process passenger input
   * @param {number} delta - Time elapsed since last update
   */
  processPassengerInput(delta) {
    const input = this.lastInput;
    
    // Apply forward/backward movement
    if (input.forward !== 0) {
      // Calculate movement direction based on boat rotation
      const radians = this.rotation.y * (Math.PI / 180);
      const moveX = -Math.sin(radians) * this.speed * input.forward * delta;
      const moveZ = Math.cos(radians) * this.speed * input.forward * delta;
      
      this.velocity.x += moveX;
      this.velocity.z += moveZ;
    }
    
    // Apply turning
    if (input.turn !== 0) {
      this.rotation.y += this.turnSpeed * input.turn * delta;
      
      // Normalize rotation to 0-360
      this.rotation.y = (this.rotation.y + 360) % 360;
    }
  }
  
  /**
   * Set passenger input state
   * @param {Object} input - Input state object
   */
  setInput(input) {
    this.lastInput = { ...input };
  }
  
  /**
   * Add a passenger to the boat
   * @param {Object} entity - Entity to add as passenger
   * @returns {boolean} Whether passenger was added successfully
   */
  addPassenger(entity) {
    if (this.passenger !== null) {
      return false; // Already has a passenger
    }
    
    this.passenger = entity.id;
    
    // Emit passenger added event
    this.emit('passengerAdded', {
      boat: this.id,
      passenger: entity.id
    });
    
    return true;
  }
  
  /**
   * Remove passenger from boat
   * @returns {string|null} ID of removed passenger
   */
  removePassenger() {
    if (this.passenger === null) {
      return null;
    }
    
    const passengerId = this.passenger;
    this.passenger = null;
    
    // Emit passenger removed event
    this.emit('passengerRemoved', {
      boat: this.id,
      passenger: passengerId
    });
    
    return passengerId;
  }
  
  /**
   * Take damage from an entity or source
   * @param {number} amount - Amount of damage
   * @param {Object} source - Source of damage
   * @returns {boolean} Whether damage was applied
   */
  damage(amount, source) {
    // Can't damage if already damaged recently
    if (this.damageTimer > 0) {
      return false;
    }
    
    // Apply damage
    this.health -= amount;
    
    // Set damage timer to prevent rapid damage
    this.damageTimer = 10;
    
    // Check if boat should break
    if (this.health <= 0) {
      this.break(source);
      return true;
    }
    
    // Emit damage event
    this.emit('damaged', {
      target: this.id,
      source: source ? source.id : null,
      amount: amount
    });
    
    return true;
  }
  
  /**
   * Break the boat and create drops
   * @param {Object} source - Entity that broke the boat
   */
  break(source) {
    if (this.dead) return;
    
    // Remove passenger if any
    if (this.passenger) {
      this.removePassenger();
    }
    
    // Create appropriate drops
    if (this.world && this.world.createDrop) {
      // Create boat item drop
      const dropType = this.hasChest ? 'boat_with_chest' : 'boat';
      this.world.createDrop({
        position: this.position,
        type: dropType,
        count: 1,
        metadata: {
          woodType: this.woodType,
          hasChest: this.hasChest
        }
      });
      
      // Drop any items in chest
      if (this.hasChest && this.inventory) {
        for (const item of this.inventory) {
          if (item) {
            this.world.createDrop({
              position: this.position,
              type: item.type,
              count: item.count,
              metadata: item.metadata || {}
            });
          }
        }
      }
    }
    
    // Mark as dead
    this.dead = true;
    
    // Remove from world
    if (this.world && this.world.removeEntity) {
      this.world.removeEntity(this.id);
    }
    
    // Emit break event
    this.emit('broken', {
      target: this.id,
      source: source ? source.id : null,
      position: { ...this.position }
    });
  }
  
  /**
   * Add an item to the boat's inventory
   * @param {Object} item - Item to add
   * @returns {boolean} Whether item was added successfully
   */
  addItem(item) {
    // Only boats with chests can store items
    if (!this.hasChest) {
      return false;
    }
    
    // Find an empty slot
    const emptySlot = this.inventory.findIndex(slot => slot === null);
    if (emptySlot === -1) {
      return false; // Inventory full
    }
    
    // Add item to inventory
    this.inventory[emptySlot] = item;
    
    // Emit item added event
    this.emit('itemAdded', {
      boat: this.id,
      slot: emptySlot,
      item: item
    });
    
    return true;
  }
  
  /**
   * Remove an item from the boat's inventory
   * @param {number} slot - Inventory slot to remove from
   * @returns {Object|null} Removed item or null if slot is empty/invalid
   */
  removeItem(slot) {
    // Only boats with chests can store items
    if (!this.hasChest) {
      return null;
    }
    
    // Check if slot is valid
    if (slot < 0 || slot >= this.inventorySize || !this.inventory[slot]) {
      return null;
    }
    
    // Remove and return item
    const item = this.inventory[slot];
    this.inventory[slot] = null;
    
    // Emit item removed event
    this.emit('itemRemoved', {
      boat: this.id,
      slot: slot,
      item: item
    });
    
    return item;
  }
  
  /**
   * Serialize boat to JSON
   * @returns {Object} Serialized boat data
   */
  serialize() {
    const data = super.serialize();
    
    // Make a deep copy of the inventory to avoid reference issues
    const serializedInventory = this.inventory ? 
      this.inventory.map(item => item ? { ...item } : null) : 
      [];
    
    return {
      ...data,
      woodType: this.woodType,
      hasChest: this.hasChest,
      inventory: serializedInventory,
      passenger: this.passenger
    };
  }
  
  /**
   * Deserialize JSON data into boat
   * @param {Object} data - Serialized boat data
   */
  deserialize(data) {
    super.deserialize(data);
    
    this.woodType = data.woodType || 'oak';
    this.hasChest = data.hasChest || false;
    
    // Handle the inventory data
    this.inventorySize = this.hasChest ? 27 : 0;
    
    // Initialize empty inventory of correct size
    this.inventory = new Array(this.inventorySize).fill(null);
    
    // Copy items from serialized inventory if available
    if (data.inventory && Array.isArray(data.inventory)) {
      for (let i = 0; i < Math.min(data.inventory.length, this.inventorySize); i++) {
        if (data.inventory[i]) {
          this.inventory[i] = { ...data.inventory[i] };
        }
      }
    }
    
    this.passenger = data.passenger || null;
  }
}

module.exports = Boat; 