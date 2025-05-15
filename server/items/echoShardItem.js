/**
 * EchoShardItem - Material found in Ancient Cities used to craft Recovery Compass
 * Part of the Wild Update features
 */
const Item = require('./item');

class EchoShardItem extends Item {
  /**
   * Create a new echo shard item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    super({
      id: 'echo_shard',
      name: 'Echo Shard',
      stackable: true,
      maxStackSize: 64,
      type: 'material',
      subtype: 'crafting_material',
      category: 'materials',
      ...options
    });
  }
  
  /**
   * Convert echo shard to JSON representation for serialization
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON()
    };
  }
  
  /**
   * Create echo shard from JSON data
   * @param {Object} data - JSON data
   * @returns {EchoShardItem} Item instance
   */
  static fromJSON(data) {
    return new EchoShardItem({
      id: data.id,
      name: data.name,
      data: data.data
    });
  }
  
  /**
   * Get client-side data for this item
   * @returns {Object} Data for the client
   */
  getClientData() {
    return {
      ...super.getClientData(),
      description: 'A mysterious shard that resonates with the voices of the dead. Used to craft a Recovery Compass.'
    };
  }
}

module.exports = EchoShardItem; 