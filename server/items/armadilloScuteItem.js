/**
 * ArmadilloScuteItem - Dropped by armadillos
 * Part of the 1.22 Sorcery Update
 */

const Item = require('./item');

class ArmadilloScuteItem extends Item {
  /**
   * Create a new Armadillo Scute item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    const defaults = {
      id: 'armadillo_scute',
      name: 'Armadillo Scute',
      description: 'A protective plate shed by armadillos',
      type: 'armadillo_scute',
      subtype: 'crafting_material',
      category: 'materials',
      stackable: true,
      maxStackSize: 64,
      rarity: 'uncommon'
    };
    
    super({...defaults, ...options});
  }
  
  /**
   * Get the tooltip text for the item
   * @returns {string[]} Array of tooltip lines
   */
  getTooltip() {
    return [
      this.name,
      'A protective plate shed by armadillos',
      'Used in crafting armor with enhanced protection'
    ];
  }
  
  /**
   * Get client-side data for this item
   * @returns {Object} Data for the client
   */
  getClientData() {
    const data = super.getClientData();
    
    return {
      ...data,
      texture: 'armadillo_scute',
      model: 'armadillo_scute'
    };
  }
  
  /**
   * Serialize to JSON
   * @returns {Object} Serialized data
   * @override
   */
  toJSON() {
    return super.toJSON();
  }
  
  /**
   * Deserialize from JSON
   * @param {Object} data - Serialized data
   * @returns {ArmadilloScuteItem} New armadillo scute item
   * @static
   */
  static fromJSON(data) {
    return new ArmadilloScuteItem(data);
  }
}

module.exports = ArmadilloScuteItem; 