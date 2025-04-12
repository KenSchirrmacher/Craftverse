/**
 * Enchantment Table - Handles the enchantment table interface and functionality
 */

const EnchantmentManager = require('./enchantmentManager');

class EnchantmentTable {
  constructor() {
    this.enchantmentManager = new EnchantmentManager();
    
    // Track active enchantment tables in the world
    this.activeTables = new Map(); // Map of tableId -> tableState
  }
  
  /**
   * Initialize an enchantment table at a specific position
   * @param {string} tableId - Unique ID for this table
   * @param {Object} position - Position of the table {x, y, z}
   */
  registerTable(tableId, position) {
    this.activeTables.set(tableId, {
      id: tableId,
      position,
      bookshelfCount: 0,
      lastBookshelfScan: 0, // Timestamp of last bookshelf scan
      players: new Set() // Players currently using the table
    });
  }
  
  /**
   * Remove a table from the registry
   * @param {string} tableId - Table ID to remove
   */
  unregisterTable(tableId) {
    this.activeTables.delete(tableId);
  }
  
  /**
   * Track a player using the enchantment table
   * @param {string} tableId - Table ID
   * @param {string} playerId - Player ID using the table
   */
  playerOpenTable(tableId, playerId) {
    const table = this.activeTables.get(tableId);
    if (table) {
      table.players.add(playerId);
      
      // Scan for bookshelves if needed
      this.updateBookshelfCount(tableId);
    }
  }
  
  /**
   * Remove a player from using the enchantment table
   * @param {string} tableId - Table ID
   * @param {string} playerId - Player ID no longer using the table
   */
  playerCloseTable(tableId, playerId) {
    const table = this.activeTables.get(tableId);
    if (table) {
      table.players.delete(playerId);
    }
  }
  
  /**
   * Scan for bookshelves around an enchantment table
   * @param {string} tableId - Table ID to scan
   * @param {Object} world - World object for block checking
   */
  updateBookshelfCount(tableId, world) {
    const table = this.activeTables.get(tableId);
    if (!table || !world) return;
    
    // Only rescan every 30 seconds to avoid excessive calculations
    const now = Date.now();
    if (now - table.lastBookshelfScan < 30000) return;
    
    table.lastBookshelfScan = now;
    
    // Get table position
    const { x, y, z } = table.position;
    
    // Count bookshelves - 5x5x5 area with the table at the center
    // Bookshelves must be 2 blocks away with air in between to count
    let bookshelfCount = 0;
    
    // Scan the potential positions for bookshelves
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 0; dy <= 1; dy++) { // Only check at table level and one above
          // Skip blocks adjacent to the table
          if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1 && dy <= 1) continue;
          
          // Skip corners (must be exactly 2 blocks away in one direction)
          if ((Math.abs(dx) === 2 && Math.abs(dz) === 2)) continue;
          
          const blockX = x + dx;
          const blockY = y + dy;
          const blockZ = z + dz;
          
          // Check if there's a bookshelf at this position
          const block = world.getBlock(blockX, blockY, blockZ);
          
          if (block && block.type === 'bookshelf') {
            // Check if there's air in the path between the table and bookshelf
            let pathClear = true;
            
            // Determine the path to check
            if (Math.abs(dx) === 2 && dz === 0) {
              // Bookshelf to the east/west
              pathClear = world.getBlock(x + Math.sign(dx), blockY, blockZ)?.type === 'air';
            } else if (dx === 0 && Math.abs(dz) === 2) {
              // Bookshelf to the north/south
              pathClear = world.getBlock(blockX, blockY, z + Math.sign(dz))?.type === 'air';
            } else if (Math.abs(dx) === 1 && Math.abs(dz) === 2) {
              // Bookshelf at diagonal
              pathClear = world.getBlock(blockX, blockY, z + Math.sign(dz))?.type === 'air';
            } else if (Math.abs(dx) === 2 && Math.abs(dz) === 1) {
              // Bookshelf at diagonal
              pathClear = world.getBlock(x + Math.sign(dx), blockY, blockZ)?.type === 'air';
            }
            
            if (pathClear) {
              bookshelfCount++;
            }
          }
        }
      }
    }
    
    // Maximum of 15 bookshelves have an effect
    table.bookshelfCount = Math.min(15, bookshelfCount);
  }
  
  /**
   * Get enchantment options for an item on the enchantment table
   * @param {string} tableId - Table ID
   * @param {Object} item - Item to enchant
   * @param {number} playerLevel - Player's XP level
   * @returns {Array} - Array of enchantment options
   */
  getEnchantmentOptions(tableId, item, playerLevel) {
    const table = this.activeTables.get(tableId);
    if (!table) return [];
    
    // Cannot enchant already enchanted items unless they're books
    if (item.enchantments && item.enchantments.length > 0 && item.type !== 'book') {
      return [];
    }
    
    // Generate three enchantment options with levels 1, 2, and 3
    const options = this.enchantmentManager.generateEnchantmentTableOptions(
      item,
      30, // Max level
      table.bookshelfCount,
      playerLevel
    );
    
    // Adjust costs based on bookshelf count
    const maxBookshelfFactor = 1 + (table.bookshelfCount / 15);
    
    return options.map((option, index) => {
      // Scale the level based on the slot (1, 2, or 3)
      const slotLevel = (index + 1) * 10;
      
      // Scale XP cost based on bookshelf count and slot
      const levelCost = Math.max(1, Math.floor(
        (index + 1) * (maxBookshelfFactor * 0.5) + (index + 1)
      ));
      
      return {
        ...option,
        level: Math.min(slotLevel, 30),
        xpLevelCost: levelCost,
        bookshelfCount: table.bookshelfCount
      };
    });
  }
  
  /**
   * Enchant an item with the selected option
   * @param {string} tableId - Table ID
   * @param {Object} item - Item to enchant
   * @param {number} optionIndex - Selected enchantment option index (0-2)
   * @param {number} playerLevel - Player's current XP level
   * @returns {Object} - Result with the enchanted item or an error
   */
  enchantItem(tableId, item, optionIndex, playerLevel) {
    const table = this.activeTables.get(tableId);
    if (!table) {
      return { success: false, error: 'Invalid enchantment table' };
    }
    
    // Generate options for this item
    const options = this.getEnchantmentOptions(tableId, item, playerLevel);
    
    if (optionIndex < 0 || optionIndex >= options.length) {
      return { success: false, error: 'Invalid enchantment option' };
    }
    
    const selectedOption = options[optionIndex];
    
    // Check if player has enough levels
    if (playerLevel < selectedOption.xpLevelCost) {
      return { success: false, error: 'Not enough experience levels' };
    }
    
    // Apply enchantments
    let enchantedItem = { ...item };
    
    // Initialize enchantments array if not present
    if (!enchantedItem.enchantments) {
      enchantedItem.enchantments = [];
    }
    
    // Apply each enchantment from the option
    for (const enchantment of selectedOption.enchantments) {
      enchantedItem = this.enchantmentManager.applyEnchantment(
        enchantedItem,
        enchantment.id,
        enchantment.level,
        false
      );
      
      if (!enchantedItem) {
        return { 
          success: false, 
          error: 'Failed to apply enchantment: ' + enchantment.id 
        };
      }
    }
    
    // Set lore and glowing effect (should be done by applyEnchantment, but double-check)
    this.enchantmentManager.updateItemEnchantmentDisplay(enchantedItem);
    
    return {
      success: true,
      item: enchantedItem,
      levelCost: selectedOption.xpLevelCost,
      enchantments: selectedOption.enchantments
    };
  }
  
  /**
   * Handle the anvil enchantment combining
   * @param {Object} item1 - First item (target)
   * @param {Object} item2 - Second item (sacrifice)
   * @param {number} playerLevel - Player's XP level
   * @returns {Object} - Result with the combined item or an error
   */
  combineItems(item1, item2, playerLevel) {
    // Can't combine if types don't match (exception: book can be used on anything)
    if (item1.type !== item2.type && item2.type !== 'book') {
      return { success: false, error: 'Items cannot be combined' };
    }
    
    // If second item has no enchantments, can't combine
    if (!item2.enchantments || item2.enchantments.length === 0) {
      return { success: false, error: 'Second item has no enchantments' };
    }
    
    // Make a copy of the target item
    const resultItem = { ...item1 };
    
    // Initialize enchantments array if not present
    if (!resultItem.enchantments) {
      resultItem.enchantments = [];
    }
    
    // Track levels needed and if any enchantments were added/upgraded
    let levelCost = 0;
    let anyChanges = false;
    
    // Apply each enchantment from the second item to the first
    for (const enchantment of item2.enchantments) {
      // Find if the target already has this enchantment
      const existingIndex = resultItem.enchantments.findIndex(e => e.id === enchantment.id);
      
      if (existingIndex >= 0) {
        // Already has this enchantment - only upgrade if same or higher level
        const existing = resultItem.enchantments[existingIndex];
        
        if (enchantment.level > existing.level) {
          // Upgrade to higher level
          resultItem.enchantments[existingIndex].level = enchantment.level;
          levelCost += enchantment.level * 2;
          anyChanges = true;
        } else if (enchantment.level === existing.level && enchantment.level < this.getMaxLevelForEnchantment(enchantment.id)) {
          // Same level - combine to make a higher level if not already at max
          resultItem.enchantments[existingIndex].level = enchantment.level + 1;
          levelCost += (enchantment.level + 1) * 2;
          anyChanges = true;
        }
      } else {
        // Check if the new enchantment conflicts with existing ones
        const conflictsWithExisting = resultItem.enchantments.some(existing => 
          this.doEnchantmentsConflict(enchantment.id, existing.id)
        );
        
        if (!conflictsWithExisting) {
          // Add the new enchantment
          resultItem.enchantments.push({ ...enchantment });
          levelCost += enchantment.level * 2;
          anyChanges = true;
        }
      }
    }
    
    // If no changes, nothing to do
    if (!anyChanges) {
      return { success: false, error: 'No applicable enchantments to combine' };
    }
    
    // Check if player has enough levels
    if (playerLevel < levelCost) {
      return { success: false, error: 'Not enough experience levels', requiredLevel: levelCost };
    }
    
    // Update item display
    this.enchantmentManager.updateItemEnchantmentDisplay(resultItem);
    
    return {
      success: true,
      item: resultItem,
      levelCost,
    };
  }
  
  /**
   * Check if two enchantments conflict
   * @param {string} enchantmentId1 - First enchantment ID
   * @param {string} enchantmentId2 - Second enchantment ID
   * @returns {boolean} - Whether the enchantments conflict
   */
  doEnchantmentsConflict(enchantmentId1, enchantmentId2) {
    return this.enchantmentManager.doEnchantmentsConflict(
      { id: enchantmentId1 },
      { id: enchantmentId2 }
    );
  }
  
  /**
   * Get the maximum level for an enchantment
   * @param {string} enchantmentId - Enchantment ID
   * @returns {number} - Maximum level
   */
  getMaxLevelForEnchantment(enchantmentId) {
    const enchantment = Object.values(require('./enchantmentTypes').EnchantmentTypes)
      .find(e => e.id === enchantmentId);
    
    return enchantment ? enchantment.maxLevel : 1;
  }
}

module.exports = EnchantmentTable; 