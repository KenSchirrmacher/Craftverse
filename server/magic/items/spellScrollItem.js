/**
 * Spell Scroll Item - Single-use scrolls that cast a specific spell
 * Part of the Minecraft 1.22 "Sorcery Update" features
 */

const { v4: uuidv4 } = require('uuid');
const { SpellElement, SpellRarity } = require('../spellRegistry');

class SpellScrollItem {
  constructor(options = {}) {
    this.id = options.id || `spell_scroll_${uuidv4()}`;
    this.name = options.name || 'Spell Scroll';
    this.description = options.description || 'A magical scroll containing a spell';
    this.spellId = options.spellId || null;
    this.spellLevel = options.spellLevel || 1;
    this.element = options.element || SpellElement.NEUTRAL;
    this.rarity = options.rarity || SpellRarity.COMMON;
    this.usedWithoutMana = options.usedWithoutMana || false; // Whether the scroll can be used without mana
    this.stackable = true;
    this.maxStackSize = 16;
  }
  
  /**
   * Initialize the spell scroll with server reference
   * @param {Object} server - Server instance
   */
  initialize(server) {
    this.server = server;
  }
  
  /**
   * Handle using the spell scroll
   * @param {Object} player - Player using the item
   * @param {Object} options - Use options
   * @returns {Object} - Result of using the item
   */
  use(player, options = {}) {
    if (!player) {
      return { success: false, message: 'Invalid player' };
    }
    
    if (!this.spellId) {
      return { success: false, message: 'This scroll contains no spell' };
    }
    
    // Cast the spell using spell manager
    if (this.server.spellManager) {
      const target = options.target || null;
      
      // Only check if player knows the spell if usedWithoutMana is false
      // If usedWithoutMana is true, allow using the scroll without knowing the spell
      if (!this.usedWithoutMana) {
        const playerSpells = this.server.spellManager.playerSpells.get(player.id) || [];
        
        if (!playerSpells.includes(this.spellId)) {
          return { success: false, message: 'You do not know this spell' };
        }
      }
      
      // Cast the spell
      const castResult = this.server.spellManager.handleCastSpell({
        playerId: player.id,
        spellId: this.spellId,
        target: target,
        options: {
          level: this.spellLevel,
          scrollItem: this.id,
          ignoreMana: this.usedWithoutMana, // Skip mana check if usedWithoutMana is true
          ignoreCooldown: true // Scrolls bypass cooldowns
        }
      });
      
      // If spell was cast successfully, consume the scroll
      if (castResult.success) {
        return {
          ...castResult,
          consumed: true
        };
      }
      
      return castResult;
    }
    
    return { success: false, message: 'Unable to cast spell from scroll' };
  }
  
  /**
   * Get information about the spell in this scroll
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
      manaCost: this.usedWithoutMana ? 0 : spell.manaCost,
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
      displayName = `Scroll of ${spellInfo.name}`;
      description = `${spellInfo.description}\nLevel: ${this.spellLevel}`;
      
      if (this.usedWithoutMana) {
        description += '\nCan be used without knowing the spell or having mana.';
      } else {
        description += '\nRequires knowledge of the spell to use.';
      }
    }
    
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
      isScroll: true
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
      element: this.element,
      rarity: this.rarity,
      usedWithoutMana: this.usedWithoutMana
    };
  }
  
  /**
   * Deserialize the item from storage
   * @param {Object} data - Serialized data
   * @returns {SpellScrollItem} - Deserialized item
   */
  static fromJSON(data) {
    return new SpellScrollItem({
      id: data.id,
      name: data.name,
      description: data.description,
      spellId: data.spellId,
      spellLevel: data.spellLevel,
      element: data.element,
      rarity: data.rarity,
      usedWithoutMana: data.usedWithoutMana
    });
  }
}

module.exports = SpellScrollItem; 