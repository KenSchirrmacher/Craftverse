/**
 * SignBlock - Base class for signs with editable text
 * Foundation for both regular signs and hanging signs in the Trails & Tales Update
 */

const Block = require('./block');

class SignBlock extends Block {
  /**
   * Create a new sign block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    // Generate the ID and type based on wood type and if it's a wall sign
    const woodType = options.woodType || 'oak';
    const isWallSign = options.isWallSign || false;
    const id = options.id || `${woodType}_${isWallSign ? 'wall_' : ''}sign`;
    const type = `${woodType}_${isWallSign ? 'wall_' : ''}sign`;
    
    super({
      id: id,
      name: options.name || 'Oak Sign',
      hardness: 1.0,
      toolType: 'axe',
      transparent: true,
      solid: false,
      ...options
    });
    
    // Ensure type is set properly
    this.type = type;
    
    // Material/wood type of the sign
    this.woodType = woodType;
    
    // Text content (4 lines maximum)
    this.text = options.text || ['', '', '', ''];
    
    // Text color and formatting
    this.textColor = options.textColor || 'black';
    this.isGlowing = options.isGlowing || false;
    this.isWaxed = options.isWaxed || false; // Prevents editing when true
    
    // Placement properties
    this.facing = options.facing || 0; // 0-15 for rotation (standing) or N/E/S/W (wall)
    this.isWallSign = isWallSign;
    
    // For wall signs, the wall direction determines which face the sign is attached to
    this.wallDirection = options.wallDirection || 'north';
  }
  
  /**
   * Check if this sign block can be edited
   * @returns {boolean} - Whether the sign can be edited
   */
  canEdit() {
    return !this.isWaxed;
  }
  
  /**
   * Set the text content of the sign
   * @param {Array<string>} lines - Text lines (up to 4)
   * @returns {boolean} - Whether the operation was successful
   */
  setText(lines) {
    if (!this.canEdit()) return false;
    
    // Limit to 4 lines
    this.text = lines.slice(0, 4);
    
    // Ensure we have exactly 4 lines (null or empty for unused)
    while (this.text.length < 4) {
      this.text.push('');
    }
    
    return true;
  }
  
  /**
   * Set the text color
   * @param {string} color - Text color name
   * @returns {boolean} - Whether the operation was successful
   */
  setTextColor(color) {
    if (!this.canEdit()) return false;
    
    const validColors = [
      'black', 'dark_blue', 'dark_green', 'dark_aqua', 'dark_red', 'dark_purple', 
      'gold', 'gray', 'dark_gray', 'blue', 'green', 'aqua', 'red', 'light_purple', 
      'yellow', 'white'
    ];
    
    if (validColors.includes(color)) {
      this.textColor = color;
      return true;
    }
    
    return false;
  }
  
  /**
   * Toggle the glowing effect on the sign text
   * @returns {boolean} - Whether the operation was successful
   */
  toggleGlowing() {
    if (!this.canEdit()) return false;
    
    this.isGlowing = !this.isGlowing;
    return true;
  }
  
  /**
   * Apply wax to the sign to prevent further editing
   * @returns {boolean} - Whether the operation was successful
   */
  applyWax() {
    if (this.isWaxed) return false;
    
    this.isWaxed = true;
    return true;
  }
  
  /**
   * Handle right-click interaction with the sign
   * @param {Object} player - The player interacting with the sign
   * @param {Object} itemInHand - Item the player is holding
   * @returns {Object|boolean} - Result of the interaction
   */
  interact(player, itemInHand) {
    if (!player) return false;
    
    // Handle dye interaction to change text color
    if (itemInHand && itemInHand.type.endsWith('_dye')) {
      const color = itemInHand.type.replace('_dye', '');
      const success = this.setTextColor(color);
      
      if (success) {
        // Reduce item count
        return {
          success: true,
          itemInHand: {
            ...itemInHand,
            count: itemInHand.count - 1
          }
        };
      }
    }
    
    // Handle glow ink sac interaction
    if (itemInHand && itemInHand.type === 'glow_ink_sac' && !this.isGlowing) {
      const success = this.toggleGlowing();
      
      if (success) {
        return {
          success: true,
          itemInHand: {
            ...itemInHand,
            count: itemInHand.count - 1
          }
        };
      }
    }
    
    // Handle ink sac interaction to remove glow
    if (itemInHand && itemInHand.type === 'ink_sac' && this.isGlowing) {
      const success = this.toggleGlowing();
      
      if (success) {
        return {
          success: true,
          itemInHand: {
            ...itemInHand,
            count: itemInHand.count - 1
          }
        };
      }
    }
    
    // Handle honeycomb interaction for waxing
    if (itemInHand && itemInHand.type === 'honeycomb' && !this.isWaxed) {
      const success = this.applyWax();
      
      if (success) {
        return {
          success: true,
          itemInHand: {
            ...itemInHand,
            count: itemInHand.count - 1
          }
        };
      }
    }
    
    // Empty hand opens the sign editor (handled by client)
    if (!itemInHand || itemInHand.type === 'air') {
      // Only open editor if sign is not waxed
      if (this.canEdit()) {
        return {
          success: true,
          openEditor: true,
          currentText: this.text
        };
      }
    }
    
    return false;
  }
  
  /**
   * Get the drops when breaking this sign
   * @returns {Array} - Array of items to drop
   */
  getDrops() {
    return [
      {
        type: `${this.woodType}_sign`,
        count: 1
      }
    ];
  }
  
  /**
   * Get data for rendering the block
   * @returns {Object} - Render data
   */
  getRenderData() {
    return {
      ...super.getRenderData(),
      woodType: this.woodType,
      text: this.text,
      textColor: this.textColor,
      isGlowing: this.isGlowing,
      facing: this.facing,
      isWallSign: this.isWallSign,
      wallDirection: this.wallDirection
    };
  }
  
  /**
   * Serialize the sign data
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      woodType: this.woodType,
      text: this.text,
      textColor: this.textColor,
      isGlowing: this.isGlowing,
      isWaxed: this.isWaxed,
      facing: this.facing,
      isWallSign: this.isWallSign,
      wallDirection: this.wallDirection
    };
  }
  
  /**
   * Create sign block from serialized data
   * @param {Object} data - Serialized data
   * @returns {SignBlock} - New sign instance
   * @static
   */
  static deserialize(data) {
    if (!data) return null;
    
    return new SignBlock({
      id: data.id,
      woodType: data.woodType,
      text: data.text,
      textColor: data.textColor,
      isGlowing: data.isGlowing,
      isWaxed: data.isWaxed,
      facing: data.facing,
      isWallSign: data.isWallSign,
      wallDirection: data.wallDirection
    });
  }
}

module.exports = SignBlock; 