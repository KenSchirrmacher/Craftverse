/**
 * SmithingManager - Handles smithing template and upgrade functionality
 * Manages the registration and processing of smithing templates
 */
const { ItemStack } = require('../items/itemStack');
const { ItemType } = require('../items/itemType');

class SmithingManager {
  constructor() {
    this.templates = new Map();
    this.upgrades = new Map();
  }
  
  /**
   * Register a new smithing template
   * @param {string} id - Template ID
   * @param {Object} template - Template data
   */
  registerTemplate(id, template) {
    this.templates.set(id, template);
  }
  
  /**
   * Register a new upgrade recipe
   * @param {string} id - Upgrade ID
   * @param {Object} recipe - Upgrade recipe
   */
  registerUpgrade(id, recipe) {
    this.upgrades.set(id, recipe);
  }
  
  /**
   * Get a smithing template by ID
   * @param {string} id - Template ID
   * @returns {Object} The template data
   */
  getTemplate(id) {
    return this.templates.get(id);
  }
  
  /**
   * Get an upgrade recipe by ID
   * @param {string} id - Upgrade ID
   * @returns {Object} The upgrade recipe
   */
  getUpgrade(id) {
    return this.upgrades.get(id);
  }
  
  /**
   * Check if an item can be upgraded
   * @param {ItemStack} item - The item to check
   * @param {string} templateId - The template ID
   * @returns {boolean} Whether the item can be upgraded
   */
  canUpgrade(item, templateId) {
    const template = this.getTemplate(templateId);
    if (!template) return false;
    
    return template.materials.some(material => 
      item.type === material.type && item.material === material.material
    );
  }
  
  /**
   * Apply an upgrade to an item
   * @param {ItemStack} item - The item to upgrade
   * @param {string} templateId - The template ID
   * @returns {ItemStack} The upgraded item
   */
  applyUpgrade(item, templateId) {
    const template = this.getTemplate(templateId);
    if (!template) return item;
    
    const upgrade = this.getUpgrade(template.upgradeId);
    if (!upgrade) return item;
    
    // Create new item with upgraded properties
    const upgradedItem = new ItemStack({
      type: upgrade.resultType,
      material: upgrade.resultMaterial,
      count: item.count,
      durability: upgrade.durability || item.durability,
      enchantments: [...item.enchantments, ...(upgrade.enchantments || [])]
    });
    
    return upgradedItem;
  }
  
  /**
   * Get all available templates
   * @returns {Array} List of template IDs
   */
  getAvailableTemplates() {
    return Array.from(this.templates.keys());
  }
  
  /**
   * Get all available upgrades
   * @returns {Array} List of upgrade IDs
   */
  getAvailableUpgrades() {
    return Array.from(this.upgrades.keys());
  }
  
  /**
   * Serialize the manager state
   * @returns {Object} The serialized state
   */
  serialize() {
    return {
      templates: Array.from(this.templates.entries()),
      upgrades: Array.from(this.upgrades.entries())
    };
  }
  
  /**
   * Deserialize the manager state
   * @param {Object} data - The serialized state
   * @returns {SmithingManager} The deserialized manager
   */
  static deserialize(data) {
    const manager = new SmithingManager();
    
    data.templates.forEach(([id, template]) => {
      manager.registerTemplate(id, template);
    });
    
    data.upgrades.forEach(([id, recipe]) => {
      manager.registerUpgrade(id, recipe);
    });
    
    return manager;
  }
}

module.exports = SmithingManager; 