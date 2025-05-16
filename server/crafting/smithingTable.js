/**
 * SmithingTable - Handles smithing recipes including armor trims
 */

const { ArmorTrimMaterials } = require('../items/armorItem');
const { v4: uuidv4 } = require('uuid');

class SmithingTable {
  /**
   * Create a new smithing table
   */
  constructor() {
    // Regular smithing recipes (for upgrading gear)
    this.recipes = [];
    
    // Initialize with default recipes
    this.registerDefaultRecipes();
    
    // Flag to enable/disable requiring templates for netherite upgrades (for backward compatibility)
    this.requireNetheriteTemplate = true;
  }
  
  /**
   * Register a new smithing recipe
   * @param {Object} recipe - Recipe data
   */
  registerRecipe(recipe) {
    if (!recipe.id) {
      recipe.id = uuidv4();
    }
    
    this.recipes.push(recipe);
  }
  
  /**
   * Register default smithing recipes
   * @private
   */
  registerDefaultRecipes() {
    // Diamond to Netherite upgrade recipes
    const itemTypes = ['helmet', 'chestplate', 'leggings', 'boots', 'sword', 'pickaxe', 'axe', 'shovel', 'hoe'];
    
    for (const itemType of itemTypes) {
      this.registerRecipe({
        id: `diamond_to_netherite_${itemType}`,
        base: { type: `diamond_${itemType}` },
        addition: { type: 'netherite_ingot' },
        result: { type: `netherite_${itemType}`, id: `netherite_${itemType}` },
        requiresTemplate: true, // New flag for 1.20 update
        templateType: 'netherite_upgrade_template'
      });
    }
  }
  
  /**
   * Set whether netherite upgrades require a template
   * @param {boolean} require - Whether to require the template
   */
  setRequireNetheriteTemplate(require) {
    this.requireNetheriteTemplate = !!require;
  }
  
  /**
   * Apply an armor trim to an armor piece
   * @param {Object} armor - Armor item to trim
   * @param {Object} template - Trim template item
   * @param {Object} material - Trim material item
   * @returns {Object|null} Modified armor item or null if trim can't be applied
   */
  applyArmorTrim(armor, template, material) {
    // Verify inputs
    if (!armor || !template || !material) return null;
    
    // Check if template is a valid trim template
    if (!template.isArmorTrimTemplate) return null;
    
    // Check if material is valid for trims
    if (!isValidTrimMaterial(material.type)) return null;
    
    // Check if the armor can be trimmed (must have applyTrim method)
    if (typeof armor.applyTrim !== 'function') return null;
    
    // Create a copy of the armor item
    const result = JSON.parse(JSON.stringify(armor));
    
    // Apply the trim with the pattern from the template and the material
    const materialId = getTrimMaterialIdFromItem(material.type);
    result.trim = {
      pattern: template.pattern,
      material: materialId
    };
    
    return result;
  }
  
  /**
   * Process a smithing operation
   * @param {Object} base - Base item
   * @param {Object} template - Template item (can be null for non-trim recipes)
   * @param {Object} addition - Addition item
   * @returns {Object|null} Result item or null if recipe not found
   */
  process(base, template, addition) {
    // First check if this is an armor trim application
    if (template && template.isArmorTrimTemplate && isArmorItem(base)) {
      return this.applyArmorTrim(base, template, addition);
    }
    
    // Check if this is a netherite upgrade with template
    if (template && template.isNetheriteUpgradeTemplate && 
        base && base.type && base.type.startsWith('diamond_') &&
        addition && addition.type === 'netherite_ingot') {
      // Find the corresponding recipe
      const targetType = base.type.replace('diamond_', 'netherite_');
      const recipe = this.recipes.find(r => 
        r.result.type === targetType && 
        r.requiresTemplate && 
        r.templateType === template.type
      );
      
      if (recipe) {
        // Create a copy of the result
        const result = JSON.parse(JSON.stringify(recipe.result));
        
        // Add additional fields that might be needed
        if (!result.id) {
          result.id = recipe.result.type;
        }
        
        if (!result.name) {
          result.name = result.type ? result.type.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Unknown Item';
        }
        
        // Preserve all properties from the base item that should be kept
        this.transferItemProperties(base, result);
        
        // Generate unique ID for the new item
        result.uuid = uuidv4();
        
        return result;
      }
    }
    
    // Otherwise look for matching upgrade recipe
    for (const recipe of this.recipes) {
      if (matchesRecipe(base, recipe.base) && matchesRecipe(addition, recipe.addition)) {
        // Check if this recipe requires a template but none was provided
        if (recipe.requiresTemplate && this.requireNetheriteTemplate && 
            (!template || template.type !== recipe.templateType)) {
          continue; // Skip this recipe
        }
        
        // Create a copy of the result
        const result = JSON.parse(JSON.stringify(recipe.result));
        
        // Add additional fields that might be needed
        if (!result.id) {
          result.id = recipe.result.type;
        }
        
        if (!result.name) {
          result.name = result.type ? result.type.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Unknown Item';
        }
        
        // Preserve all properties from the base item that should be kept
        this.transferItemProperties(base, result);
        
        // Generate unique ID for the new item
        result.uuid = uuidv4();
        
        return result;
      }
    }
    
    return null;
  }
  
  /**
   * Transfer properties from base item to result
   * @param {Object} base - Base item
   * @param {Object} result - Result item
   * @private
   */
  transferItemProperties(base, result) {
    // Properties to preserve
    const propertiesToKeep = [
      'enchantments',
      'customName',
      'lore',
      'durability',
      'repairs',
      'attributes',
      'nbtData'
    ];
    
    for (const prop of propertiesToKeep) {
      if (base[prop] !== undefined) {
        // For arrays and objects, create deep copies
        if (Array.isArray(base[prop])) {
          result[prop] = [...base[prop]];
        } else if (typeof base[prop] === 'object' && base[prop] !== null) {
          result[prop] = JSON.parse(JSON.stringify(base[prop]));
        } else {
          result[prop] = base[prop];
        }
      }
    }
  }
  
  /**
   * Get all registered smithing recipes
   * @returns {Array} All recipes
   */
  getAllRecipes() {
    return [...this.recipes];
  }
}

/**
 * Check if a material is valid for armor trims
 * @param {string} materialType - Material item type
 * @returns {boolean} Whether material is valid
 * @private
 */
function isValidTrimMaterial(materialType) {
  const validMaterials = [
    'iron_ingot', 'copper_ingot', 'gold_ingot', 'lapis_lazuli',
    'emerald', 'diamond', 'netherite_ingot', 'redstone',
    'amethyst_shard', 'quartz'
  ];
  
  return validMaterials.includes(materialType);
}

/**
 * Get the trim material ID from an item type
 * @param {string} materialType - Material item type
 * @returns {string} Trim material ID
 * @private
 */
function getTrimMaterialIdFromItem(materialType) {
  const materialMapping = {
    'iron_ingot': 'iron',
    'copper_ingot': 'copper',
    'gold_ingot': 'gold',
    'lapis_lazuli': 'lapis',
    'emerald': 'emerald',
    'diamond': 'diamond',
    'netherite_ingot': 'netherite',
    'redstone': 'redstone',
    'amethyst_shard': 'amethyst',
    'quartz': 'quartz',
    // Add simpler versions without _ingot suffix
    'iron': 'iron',
    'copper': 'copper',
    'gold': 'gold',
    'lapis': 'lapis',
    'netherite': 'netherite',
    // Add plural forms
    'redstone_dust': 'redstone',
    'lapis_lazuli_nuggets': 'lapis'
  };
  
  return materialMapping[materialType] || 'iron';
}

/**
 * Check if an item is an armor item
 * @param {Object} item - Item to check
 * @returns {boolean} Whether item is armor
 * @private
 */
function isArmorItem(item) {
  if (!item || !item.type) return false;
  
  // Check if it has the armorType property (preferred way)
  if (item.armorType) return true;
  
  // Check if the type ends with common armor suffixes
  const armorTypes = [
    '_helmet', '_chestplate', '_leggings', '_boots',
    'leather_cap', 'leather_tunic', 'leather_pants', 'leather_boots',
    'turtle_shell'
  ];
  
  return armorTypes.some(type => item.type.endsWith(type) || item.type === type);
}

/**
 * Check if an item matches a recipe component
 * @param {Object} item - Item to check
 * @param {Object} component - Recipe component
 * @returns {boolean} Whether item matches component
 * @private
 */
function matchesRecipe(item, component) {
  if (!item || !component) return false;
  
  // If item has type property, check it against component.type
  if (item.type && component.type) {
    // Direct match
    if (item.type === component.type) return true;
    
    // Handle special cases for armor item types
    if (component.type.includes('_helmet') && 
        (item.type === component.type || 
         (item.armorType === 'helmet' && item.armorMaterial && 
          item.armorMaterial.toLowerCase() === component.type.split('_')[0]))) {
      return true;
    }
    
    if (component.type.includes('_chestplate') && 
        (item.type === component.type || 
         (item.armorType === 'chestplate' && item.armorMaterial && 
          item.armorMaterial.toLowerCase() === component.type.split('_')[0]))) {
      return true;
    }
    
    if (component.type.includes('_leggings') && 
        (item.type === component.type || 
         (item.armorType === 'leggings' && item.armorMaterial && 
          item.armorMaterial.toLowerCase() === component.type.split('_')[0]))) {
      return true;
    }
    
    if (component.type.includes('_boots') && 
        (item.type === component.type || 
         (item.armorType === 'boots' && item.armorMaterial && 
          item.armorMaterial.toLowerCase() === component.type.split('_')[0]))) {
      return true;
    }
    
    // Handle material items
    if (component.type === 'netherite_ingot' && 
        (item.type === 'netherite_ingot' || item.type === 'netherite')) {
      return true;
    }
  }
  
  // If item has id property, check it against component.id
  if (item.id && component.id && item.id === component.id) {
    return true;
  }
  
  // Check for armor items with armorType and armorMaterial properties
  if (component.armorType && component.armorMaterial) {
    if (item.armorType === component.armorType && 
        item.armorMaterial && item.armorMaterial.toLowerCase() === component.armorMaterial.toLowerCase()) {
      return true;
    }
  }
  
  return false;
}

module.exports = SmithingTable; 