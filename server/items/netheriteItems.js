/**
 * Netherite Items
 * Implements Netherite crafting components and equipment items:
 * - Netherite Scrap (from smelting Ancient Debris)
 * - Netherite Ingot (from Netherite Scrap + Gold Ingots)
 * - Netherite tools and armor with special properties
 */

const Item = require('./item');
const { ArmorItem } = require('./armorItem');
const { ToolItem } = require('./toolItem');

/**
 * Netherite Scrap - Crafting component obtained by smelting Ancient Debris
 */
class NetheriteScrapItem extends Item {
  constructor() {
    super({
      id: 'netherite_scrap',
      name: 'Netherite Scrap',
      stackSize: 64,
      durability: null,
      category: 'materials'
    });
  }
}

/**
 * Netherite Ingot - Crafting component made from 4 Netherite Scrap + 4 Gold Ingots
 * Used for crafting Netherite equipment
 */
class NetheriteIngotItem extends Item {
  constructor() {
    super({
      id: 'netherite_ingot',
      name: 'Netherite Ingot',
      stackSize: 64,
      durability: null,
      category: 'materials',
      fireResistant: true // Netherite items don't burn in lava or fire
    });
  }
  
  /**
   * Netherite items are immune to fire and lava
   */
  isFireResistant() {
    return true;
  }
}

/**
 * Base class for all Netherite tools with shared properties
 */
class NetheriteToolItem extends ToolItem {
  constructor(options) {
    super({
      ...options,
      material: 'netherite',
      durability: options.durability || 2031, // Base Netherite durability
      miningSpeed: options.miningSpeed || 9.0, // Faster than diamond
      attackDamage: options.attackDamage || 0, // Set by specific tools
      enchantability: 15, // Same as diamond
      fireResistant: true, // Netherite items don't burn in lava or fire
      tier: 4 // Netherite is tier 4 (highest tier)
    });
  }
  
  /**
   * Netherite items are immune to fire and lava
   */
  isFireResistant() {
    return true;
  }
  
  /**
   * Netherite tools float in lava (don't despawn)
   */
  floatsInLava() {
    return true;
  }
}

/**
 * Netherite Sword - Highest tier melee weapon
 */
class NetheriteSwordItem extends NetheriteToolItem {
  constructor() {
    super({
      id: 'netherite_sword',
      name: 'Netherite Sword',
      attackDamage: 8, // 1 more than diamond
      attackSpeed: 1.6, // Same as diamond
      durability: 2031, // Higher than diamond (1561)
      toolType: 'sword'
    });
  }
}

/**
 * Netherite Pickaxe - Highest tier mining tool
 */
class NetheritePickaxeItem extends NetheriteToolItem {
  constructor() {
    super({
      id: 'netherite_pickaxe',
      name: 'Netherite Pickaxe',
      attackDamage: 6, // 1 more than diamond
      attackSpeed: 1.2, // Same as diamond
      durability: 2031,
      toolType: 'pickaxe',
      miningLevel: 4 // Can mine all blocks
    });
  }
}

/**
 * Netherite Axe - Highest tier chopping tool and combat weapon
 */
class NetheriteAxeItem extends NetheriteToolItem {
  constructor() {
    super({
      id: 'netherite_axe',
      name: 'Netherite Axe',
      attackDamage: 10, // 1 more than diamond
      attackSpeed: 1.0, // Same as diamond
      durability: 2031,
      toolType: 'axe',
      miningLevel: 4
    });
  }
  
  /**
   * Axes have a chance to disable shields
   */
  getShieldDisableChance() {
    return 1.0; // 100% chance for Netherite Axe
  }
}

/**
 * Netherite Shovel - Highest tier digging tool
 */
class NetheriteShovelItem extends NetheriteToolItem {
  constructor() {
    super({
      id: 'netherite_shovel',
      name: 'Netherite Shovel',
      attackDamage: 6.5, // 1 more than diamond
      attackSpeed: 1.0, // Same as diamond
      durability: 2031,
      toolType: 'shovel',
      miningLevel: 4
    });
  }
}

/**
 * Netherite Hoe - Highest tier farming tool
 */
class NetheriteHoeItem extends NetheriteToolItem {
  constructor() {
    super({
      id: 'netherite_hoe',
      name: 'Netherite Hoe',
      attackDamage: 1, // Hoes have low damage
      attackSpeed: 4.0, // Faster attack speed
      durability: 2031,
      toolType: 'hoe',
      miningLevel: 4
    });
  }
}

/**
 * Base class for all Netherite armor with shared properties
 */
class NetheriteArmorItem extends ArmorItem {
  constructor(options) {
    super({
      ...options,
      material: 'netherite',
      durability: options.durability || 0, // Set by specific pieces
      toughness: 3.0, // Higher than diamond (2.0)
      knockbackResistance: 0.1, // 10% knockback resistance per piece
      fireResistant: true, // Netherite items don't burn in lava or fire
      enchantability: 15, // Same as diamond
      tier: 4 // Netherite is tier 4 (highest tier)
    });
  }
  
  /**
   * Netherite items are immune to fire and lava
   */
  isFireResistant() {
    return true;
  }
  
  /**
   * Netherite items float in lava (don't despawn)
   */
  floatsInLava() {
    return true;
  }
  
  /**
   * Apply knockback resistance effect when wearing this armor
   * @param {Player} player - Player wearing the armor
   */
  applyArmorEffect(player) {
    if (player && player.addKnockbackResistance) {
      player.addKnockbackResistance(this.knockbackResistance);
    }
  }
}

/**
 * Netherite Helmet - Highest tier head armor
 */
class NetheriteHelmetItem extends NetheriteArmorItem {
  constructor() {
    super({
      id: 'netherite_helmet',
      name: 'Netherite Helmet',
      durability: 407, // Higher than diamond (363)
      defense: 3, // Same as diamond
      slot: 'head'
    });
  }
}

/**
 * Netherite Chestplate - Highest tier chest armor
 */
class NetheriteChestplateItem extends NetheriteArmorItem {
  constructor() {
    super({
      id: 'netherite_chestplate',
      name: 'Netherite Chestplate',
      durability: 592, // Higher than diamond (528)
      defense: 8, // Same as diamond
      slot: 'chest'
    });
  }
}

/**
 * Netherite Leggings - Highest tier leg armor
 */
class NetheriteLeggingsItem extends NetheriteArmorItem {
  constructor() {
    super({
      id: 'netherite_leggings',
      name: 'Netherite Leggings',
      durability: 555, // Higher than diamond (495)
      defense: 6, // Same as diamond
      slot: 'legs'
    });
  }
}

/**
 * Netherite Boots - Highest tier foot armor
 */
class NetheriteBootsItem extends NetheriteArmorItem {
  constructor() {
    super({
      id: 'netherite_boots',
      name: 'Netherite Boots',
      durability: 481, // Higher than diamond (429)
      defense: 3, // Same as diamond
      slot: 'feet'
    });
  }
}

module.exports = {
  NetheriteScrapItem,
  NetheriteIngotItem,
  NetheriteSwordItem,
  NetheritePickaxeItem,
  NetheriteAxeItem,
  NetheriteShovelItem,
  NetheriteHoeItem,
  NetheriteHelmetItem,
  NetheriteChestplateItem,
  NetheriteLeggingsItem,
  NetheriteBootsItem
}; 