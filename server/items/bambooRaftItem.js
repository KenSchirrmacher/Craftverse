/**
 * Bamboo Raft Item - Implementation of the bamboo raft item
 * Part of the 1.20 Update
 */

const BoatItem = require('./boatItem');

/**
 * Bamboo Raft Item - A variant of boat made from bamboo
 */
class BambooRaftItem extends BoatItem {
  /**
   * Create a new bamboo raft item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    // Default options for bamboo raft
    const raftOptions = {
      id: options.hasChest ? 'bamboo_chest_raft' : 'bamboo_raft',
      name: options.hasChest ? 'Bamboo Chest Raft' : 'Bamboo Raft',
      description: options.hasChest 
        ? 'A bamboo raft with a chest for storage'
        : 'A simple raft made of bamboo for water travel',
      woodType: 'bamboo',
      hasChest: options.hasChest || false,
      isRaft: true,
      ...options
    };
    
    super(raftOptions);
    
    // Special raft properties
    this.isRaft = true;
    this.speed = 1.1; // Slightly slower than regular boats
    this.maxHealth = 300; // More durability than regular boats
  }
  
  /**
   * Place the raft in water
   * @param {Object} world - The world object
   * @param {Object} position - The position to place at
   * @param {Object} player - The player placing the raft
   * @returns {boolean} Whether placement was successful
   */
  place(world, position, player) {
    if (!world || !position) return false;
    
    // Check if position is in water
    const block = world.getBlock(position.x, position.y, position.z);
    if (!block || !block.isWater) {
      // Can only place rafts in water
      return false;
    }
    
    // Calculate rotation based on player's yaw
    let rotationY = 0;
    if (player) {
      const yaw = player.rotation.yaw;
      rotationY = Math.floor(((yaw + 180) % 360) / 45) * 45;
    }
    
    // Create entity data
    const entityData = {
      type: this.hasChest ? 'bamboo_chest_raft' : 'bamboo_raft',
      position: { ...position },
      rotation: { yaw: rotationY, pitch: 0, roll: 0 },
      speed: this.speed,
      health: this.maxHealth,
      woodType: this.woodType,
      hasChest: this.hasChest,
      isRaft: true
    };
    
    // If it has a chest, initialize inventory
    if (this.hasChest) {
      entityData.inventory = {
        slots: 27,
        items: Array(27).fill(null)
      };
    }
    
    // Create the raft entity
    const entity = world.createEntity(entityData);
    if (!entity) return false;
    
    return true;
  }
  
  /**
   * Get a description of the item
   * @returns {string} Item description
   */
  getDescription() {
    let description = this.description;
    
    if (this.hasChest) {
      description += ' Contains 27 slots of storage.';
    }
    
    return description;
  }
  
  /**
   * Serialize the bamboo raft item
   * @returns {Object} Serialized item data
   */
  toJSON() {
    const data = super.toJSON();
    data.isRaft = true;
    data.speed = this.speed;
    data.maxHealth = this.maxHealth;
    return data;
  }
  
  /**
   * Deserialize bamboo raft item data
   * @param {Object} data - Serialized data
   * @returns {BambooRaftItem} Deserialized bamboo raft item
   */
  static fromJSON(data) {
    return new BambooRaftItem({
      hasChest: data.hasChest || false,
      isRaft: true,
      speed: data.speed,
      maxHealth: data.maxHealth
    });
  }
}

module.exports = BambooRaftItem; 