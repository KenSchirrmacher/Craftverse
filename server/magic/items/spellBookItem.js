/**
 * Spell Book Item - Base class for spell books that can hold and cast spells
 * Part of the Minecraft 1.22 "Sorcery Update" features
 */

const { v4: uuidv4 } = require('uuid');
const { SpellElement, SpellRarity } = require('../spellRegistry');

class SpellBookItem {
  constructor(options = {}) {
    this.id = options.id || `spell_book_${uuidv4()}`;
    this.name = options.name || 'Spell Book';
    this.description = options.description || 'A book containing magical spells';
    this.spellId = options.spellId || null;
    this.spellLevel = options.spellLevel || 1;
    this.maxSpellLevel = options.maxSpellLevel || 5;
    this.element = options.element || SpellElement.NEUTRAL;
    this.rarity = options.rarity || SpellRarity.COMMON;
    this.durability = options.durability || 50;
    this.maxDurability = options.maxDurability || 50;
    this.learnable = options.learnable !== false; // Whether this book teaches spells
    this.usable = options.usable !== false; // Whether this book can cast spells
    this.stackable = false;
    this.maxStackSize = 1;
  }
  
  /**
   * Initialize the spell book with server reference
   * @param {Object} server - Server instance
   */
  initialize(server) {
    this.server = server;
  }
  
  /**
   * Handle using the spell book
   * @param {Object} player - Player using the item
   * @param {Object} options - Use options
   * @returns {Object} - Result of using the item
   */
  use(player, options = {}) {
    if (!player) {
      return { success: false, message: 'Invalid player' };
    }
    
    if (!this.spellId) {
      return { success: false, message: 'This spell book contains no spell' };
    }
    
    // If this is a learnable book, teach the spell
    if (this.learnable && this.server.spellManager) {
      const learned = this.server.spellManager.teachSpell(player.id, this.spellId);
      
      if (learned) {
        // Book is consumed when the spell is learned
        this.durability = 0;
        
        return {
          success: true,
          message: `You learned the ${this.name} spell`,
          consumed: true
        };
      }
    }
    
    // If this is a usable book, cast the spell
    if (this.usable && this.server.spellManager) {
      const target = options.target || null;
      
      // Cast the spell
      const castResult = this.server.spellManager.handleCastSpell({
        playerId: player.id,
        spellId: this.spellId,
        target: target,
        options: {
          level: this.spellLevel,
          bookItem: this.id
        }
      });
      
      // If spell was cast successfully, reduce durability
      if (castResult.success) {
        this.durability--;
        
        // Check if the book is depleted
        if (this.durability <= 0) {
          return {
            ...castResult,
            consumed: true
          };
        }
      }
      
      return castResult;
    }
    
    return { success: false, message: 'This spell book cannot be used' };
  }
  
  /**
   * Get information about the spell in this book
   * @returns {Object} - Spell information
   */
  getSpellInfo() {
    if (!this.spellId || !this.server?.spellManager) {
      return null;
    }
    
    const spell = this.server.spellManager.spells.get(this.spellId);
    if (!spell) return null;
    
    return {
      id: spell.id,
      name: spell.name,
      description: spell.description,
      manaCost: spell.manaCost,
      cooldown: spell.cooldown,
      level: this.spellLevel,
      element: spell.element,
      category: spell.category,
      duration: spell.duration,
      area: spell.area
    };
  }
  
  /**
   * Get display information for this item
   * @returns {Object} - Display information
   */
  getDisplayInfo() {
    const spellInfo = this.getSpellInfo();
    
    let displayName = this.name;
    let description = this.description;
    
    if (spellInfo) {
      displayName = `${spellInfo.name} Spell Book`;
      description = `${spellInfo.description}\nLevel: ${this.spellLevel}/${this.maxSpellLevel}`;
      
      if (this.learnable) {
        description += '\nRight-click to learn this spell.';
      }
      
      if (this.usable) {
        description += '\nCan be used to cast the spell.';
      }
    }
    
    // Add durability information
    description += `\nDurability: ${this.durability}/${this.maxDurability}`;
    
    // Add element and rarity
    let rarityColor;
    switch (this.rarity) {
      case SpellRarity.COMMON:
        rarityColor = '#FFFFFF'; // White
        break;
      case SpellRarity.UNCOMMON:
        rarityColor = '#55FF55'; // Green
        break;
      case SpellRarity.RARE:
        rarityColor = '#5555FF'; // Blue
        break;
      case SpellRarity.EPIC:
        rarityColor = '#AA00AA'; // Purple
        break;
      case SpellRarity.LEGENDARY:
        rarityColor = '#FFAA00'; // Gold
        break;
      default:
        rarityColor = '#FFFFFF';
    }
    
    return {
      displayName,
      description,
      rarityColor,
      element: this.element,
      durability: {
        current: this.durability,
        max: this.maxDurability
      }
    };
  }
  
  /**
   * Serialize the item for storage
   * @returns {Object} - Serialized data
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      spellId: this.spellId,
      spellLevel: this.spellLevel,
      maxSpellLevel: this.maxSpellLevel,
      element: this.element,
      rarity: this.rarity,
      durability: this.durability,
      maxDurability: this.maxDurability,
      learnable: this.learnable,
      usable: this.usable
    };
  }
  
  /**
   * Deserialize the item from storage
   * @param {Object} data - Serialized data
   * @returns {SpellBookItem} - Deserialized item
   */
  static fromJSON(data) {
    return new SpellBookItem({
      id: data.id,
      name: data.name,
      description: data.description,
      spellId: data.spellId,
      spellLevel: data.spellLevel,
      maxSpellLevel: data.maxSpellLevel,
      element: data.element,
      rarity: data.rarity,
      durability: data.durability,
      maxDurability: data.maxDurability,
      learnable: data.learnable,
      usable: data.usable
    });
  }
}

module.exports = SpellBookItem; 