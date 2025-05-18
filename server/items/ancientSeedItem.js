/**
 * AncientSeedItem - Special seed item from the Minecraft 1.23 Update
 * Seeds that can be planted to grow rare and ancient plants with special properties
 */

const Item = require('./item');

class AncientSeedItem extends Item {
  /**
   * Create a new ancient seed item
   * @param {Object} options - Item options
   */
  constructor(options = {}) {
    // Set up the variant (default to generic ancient seed)
    const variant = options.variant || 'generic';
    
    // Determine name based on variant
    let name = 'Ancient Seed';
    if (variant !== 'generic') {
      const formattedVariant = variant
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      name = `${formattedVariant} Seed`;
    }
    
    // Configure item properties
    super({
      id: options.id || `ancient_seed_${variant === 'generic' ? '' : variant}`.replace(/^ancient_seed_$/, 'ancient_seed'),
      type: `ancient_seed${variant === 'generic' ? '' : '_' + variant}`,
      name,
      stackable: true,
      maxStackSize: 64,
      placeable: true,
      ...options
    });
    
    // Ancient seed properties
    this.variant = variant;
    this.rarity = this.getRarityForVariant(variant);
    this.growthTime = this.getGrowthTimeForVariant(variant);
    this.lightRequirement = this.getLightRequirementForVariant(variant);
    this.moistureRequirement = this.getMoistureRequirementForVariant(variant);
    this.temperatureRange = this.getTemperatureRangeForVariant(variant);
    this.optimalBiomes = this.getOptimalBiomesForVariant(variant);
    
    // Special functionality based on variant
    if (variant === 'mystic') {
      this.specialEffect = this.createMysticEffect();
    }
    
    if (variant === 'crystal') {
      this.getGrowthRequirements = this.createCrystalGrowthRequirements();
    }
  }
  
  /**
   * Get rarity level for a variant
   * @param {string} variant - Seed variant
   * @returns {string} - Rarity level
   * @private
   */
  getRarityForVariant(variant) {
    const rarityMap = {
      'generic': 'common',
      'torchflower': 'common',
      'pitcher_pod': 'uncommon',
      'mystic': 'rare',
      'crystal': 'epic',
      'arcane': 'epic',
      'frost': 'rare'
    };
    
    return rarityMap[variant] || 'common';
  }
  
  /**
   * Get growth time for a variant (in ticks)
   * @param {string} variant - Seed variant
   * @returns {number} - Growth time
   * @private
   */
  getGrowthTimeForVariant(variant) {
    const growthTimeMap = {
      'generic': 2400, // 2 minutes
      'torchflower': 2000, // 1.67 minutes
      'pitcher_pod': 3000, // 2.5 minutes
      'mystic': 4800, // 4 minutes
      'crystal': 6000, // 5 minutes
      'arcane': 5400, // 4.5 minutes
      'frost': 3600 // 3 minutes
    };
    
    return growthTimeMap[variant] || 2400;
  }
  
  /**
   * Get minimum light level required for a variant
   * @param {string} variant - Seed variant
   * @returns {number} - Light level (0-15)
   * @private
   */
  getLightRequirementForVariant(variant) {
    const lightMap = {
      'generic': 8,
      'torchflower': 10,
      'pitcher_pod': 7,
      'mystic': 9,
      'crystal': 12,
      'arcane': 11,
      'frost': 6 // Can grow in lower light
    };
    
    return lightMap[variant] || 8;
  }
  
  /**
   * Get moisture requirement for a variant
   * @param {string} variant - Seed variant
   * @returns {number} - Moisture level (0-1)
   * @private
   */
  getMoistureRequirementForVariant(variant) {
    const moistureMap = {
      'generic': 0.3,
      'torchflower': 0.5,
      'pitcher_pod': 0.7, // Needs high moisture
      'mystic': 0.4,
      'crystal': 0.2, // Lower moisture tolerance
      'arcane': 0.3,
      'frost': 0.6
    };
    
    return moistureMap[variant] || 0.3;
  }
  
  /**
   * Get temperature range for a variant
   * @param {string} variant - Seed variant
   * @returns {Object} - Min and max temperature values
   * @private
   */
  getTemperatureRangeForVariant(variant) {
    const temperatureMap = {
      'generic': { min: 0.2, max: 0.9 },
      'torchflower': { min: 0.5, max: 1.2 }, // Prefers warmer climates
      'pitcher_pod': { min: 0.4, max: 1.0 },
      'mystic': { min: 0.3, max: 0.8 },
      'crystal': { min: 0.1, max: 0.6 }, // Can grow in colder areas
      'arcane': { min: 0.2, max: 0.7 },
      'frost': { min: 0.0, max: 0.4 } // Cold climate plant
    };
    
    return temperatureMap[variant] || { min: 0.2, max: 0.9 };
  }
  
  /**
   * Get optimal biomes for a variant
   * @param {string} variant - Seed variant
   * @returns {Array} - Array of optimal biome types
   * @private
   */
  getOptimalBiomesForVariant(variant) {
    const biomeMap = {
      'generic': ['plains', 'forest'],
      'torchflower': ['flower_forest', 'sunflower_plains', 'jungle'],
      'pitcher_pod': ['swamp', 'jungle', 'mangrove_swamp'],
      'mystic': ['lush_caves', 'mushroom_fields'],
      'crystal': ['dripstone_caves', 'frozen_peaks'],
      'arcane': ['deep_dark', 'end_midlands'],
      'frost': ['snowy_plains', 'frozen_river', 'grove']
    };
    
    return biomeMap[variant] || ['plains', 'forest'];
  }
  
  /**
   * Create the special effect for mystic seeds
   * @returns {Function} - Effect function
   * @private
   */
  createMysticEffect() {
    return (player) => {
      // Apply a random positive status effect to the player
      const effects = [
        'speed',
        'strength',
        'regeneration',
        'resistance',
        'night_vision',
        'water_breathing'
      ];
      
      const randomEffect = effects[Math.floor(Math.random() * effects.length)];
      const duration = 300; // 15 seconds (in ticks)
      const amplifier = 0; // Level 1 effect
      
      return {
        effect: randomEffect,
        duration,
        amplifier
      };
    };
  }
  
  /**
   * Create growth requirements for crystal seeds
   * @returns {Function} - Requirements function
   * @private
   */
  createCrystalGrowthRequirements() {
    return (world, position) => {
      // Crystal seeds need specific conditions to grow
      const requireAmethyst = true; // Needs amethyst blocks nearby
      const requiresLowLight = false; // Does not require low light
      const requiresHighLight = true; // Requires high light
      
      return {
        requireAmethyst,
        requiresLowLight,
        requiresHighLight,
        minLightLevel: 10,
        maxLightLevel: 15,
        minTemperature: 0.1,
        maxTemperature: 0.6
      };
    };
  }
  
  /**
   * Calculate drop chance based on rarity
   * @returns {number} - Drop chance (0-1)
   */
  getDropChance() {
    const rarityChances = {
      'common': 0.35,
      'uncommon': 0.20,
      'rare': 0.10,
      'epic': 0.05
    };
    
    return rarityChances[this.rarity] || 0.25;
  }
  
  /**
   * Get loot table for a specific source
   * @param {string} source - Loot source (e.g., 'sniffer_dig')
   * @returns {Array} - Loot table entries
   * @static
   */
  static getLootTable(source) {
    // General loot table for ancient seeds
    const lootTables = {
      'sniffer_dig': [
        { item: 'ancient_seed_torchflower', weight: 45, count: [1, 2] },
        { item: 'ancient_seed_pitcher_pod', weight: 35, count: [1, 2] },
        { item: 'ancient_seed_mystic', weight: 15, count: 1 },
        { item: 'ancient_seed_crystal', weight: 5, count: 1 }
      ],
      'ancient_city_chest': [
        { item: 'ancient_seed_torchflower', weight: 25, count: [1, 3] },
        { item: 'ancient_seed_pitcher_pod', weight: 25, count: [1, 3] },
        { item: 'ancient_seed_mystic', weight: 30, count: [1, 2] },
        { item: 'ancient_seed_crystal', weight: 15, count: 1 },
        { item: 'ancient_seed_arcane', weight: 5, count: 1 }
      ],
      'treasure_chest': [
        { item: 'ancient_seed_torchflower', weight: 40, count: [1, 4] },
        { item: 'ancient_seed_pitcher_pod', weight: 30, count: [1, 3] },
        { item: 'ancient_seed_mystic', weight: 20, count: [1, 2] },
        { item: 'ancient_seed_crystal', weight: 10, count: 1 }
      ]
    };
    
    return lootTables[source] || [];
  }
  
  /**
   * Crossbreed two seed variants to potentially create a new variant
   * @param {string} variant1 - First seed variant
   * @param {string} variant2 - Second seed variant
   * @returns {AncientSeedItem} - Resulting seed
   * @static
   */
  static crossbreed(variant1, variant2) {
    // If same variant, return the same type
    if (variant1 === variant2) {
      return new AncientSeedItem({ variant: variant1 });
    }
    
    // Define special combinations
    const specialCombinations = {
      'torchflower_pitcher_pod': 'mystic',
      'pitcher_pod_torchflower': 'mystic',
      'mystic_crystal': 'arcane',
      'crystal_mystic': 'arcane',
      'torchflower_crystal': 'frost',
      'crystal_torchflower': 'frost'
    };
    
    const combinationKey = `${variant1}_${variant2}`;
    
    // Check for special combination
    if (specialCombinations[combinationKey]) {
      return new AncientSeedItem({ variant: specialCombinations[combinationKey] });
    }
    
    // Random chance for a successful crossbreed if no special combination
    const crossbreedChance = 0.25; // 25% chance
    
    if (Math.random() < crossbreedChance) {
      // Successfully create a random seed
      const possibleResults = ['mystic', 'crystal', 'frost'];
      const randomVariant = possibleResults[Math.floor(Math.random() * possibleResults.length)];
      return new AncientSeedItem({ variant: randomVariant });
    }
    
    // Default to returning the first variant
    return new AncientSeedItem({ variant: variant1 });
  }
  
  /**
   * Place the seed in the world
   * @param {Object} world - The game world
   * @param {Object} position - The position to place at
   * @param {Object} player - The player placing the seed
   * @returns {boolean} - Whether placement was successful
   */
  place(world, position, player) {
    if (!world || !position) return false;
    
    // Check if the block below is suitable for planting
    const blockBelow = world.getBlockState(position.x, position.y - 1, position.z);
    if (!blockBelow || !this.canPlantOn(blockBelow)) {
      return false;
    }
    
    // Check if the current position is empty
    const currentBlock = world.getBlockState(position.x, position.y, position.z);
    if (currentBlock && currentBlock.type !== 'air') {
      return false;
    }
    
    // Create the plant block
    const plantBlock = {
      type: 'ancient_plant',
      variant: this.variant,
      growthStage: 0,
      isFullyGrown: false,
      age: 0,
      plantedAt: Date.now(),
      lightRequirement: this.lightRequirement,
      moistureRequirement: this.moistureRequirement,
      temperatureRange: this.temperatureRange
    };
    
    // Place it in the world
    const success = world.setBlockState(position.x, position.y, position.z, plantBlock);
    
    // Play placement sound if successful
    if (success && player && player.emitSound) {
      player.emitSound('item.crop.plant', { 
        position, 
        volume: 0.8, 
        pitch: 0.8 + Math.random() * 0.4 
      });
    }
    
    return success;
  }
  
  /**
   * Check if the seed can be planted on a specific block
   * @param {Object} block - The block to check
   * @returns {boolean} - Whether the block is suitable
   * @private
   */
  canPlantOn(block) {
    // Default blocks that can be planted on
    const plantableBlocks = [
      'grass_block',
      'dirt',
      'coarse_dirt',
      'podzol',
      'farmland',
      'rooted_dirt',
      'moss_block'
    ];
    
    // Add variant-specific requirements
    if (this.variant === 'pitcher_pod') {
      plantableBlocks.push('mud', 'clay');
    }
    
    if (this.variant === 'crystal') {
      plantableBlocks.push('stone', 'deepslate', 'tuff');
    }
    
    return plantableBlocks.includes(block.type);
  }
  
  /**
   * Get information for the item tooltip
   * @returns {Array} - Array of tooltip lines
   */
  getTooltip() {
    const tooltip = [this.name];
    
    // Add rarity
    const formattedRarity = this.rarity.charAt(0).toUpperCase() + this.rarity.slice(1);
    tooltip.push(`Rarity: ${formattedRarity}`);
    
    // Add variant-specific information
    switch (this.variant) {
      case 'torchflower':
        tooltip.push('Grows into a vibrant, flame-colored flower');
        tooltip.push('Prefers warm, sunny locations');
        break;
      case 'pitcher_pod':
        tooltip.push('Grows into a unique pitcher-shaped plant');
        tooltip.push('Thrives in moist, humid environments');
        break;
      case 'mystic':
        tooltip.push('Grows into a plant with mystical properties');
        tooltip.push('May provide beneficial effects when nearby');
        break;
      case 'crystal':
        tooltip.push('Grows into a crystalline plant that emits light');
        tooltip.push('Requires special growing conditions');
        break;
      case 'arcane':
        tooltip.push('A rare hybrid with potent magical properties');
        tooltip.push('Difficult to grow, but highly rewarding');
        break;
      case 'frost':
        tooltip.push('Produces a cold-resistant flowering plant');
        tooltip.push('Thrives in colder climates');
        break;
      default:
        tooltip.push('An ancient plant seed with unknown properties');
        tooltip.push('Try planting it to discover what grows');
    }
    
    // Add crossbreeding hint
    if (this.rarity !== 'epic') {
      tooltip.push('');
      tooltip.push('Plant near other ancient plants for');
      tooltip.push('a chance of creating new varieties');
    }
    
    return tooltip;
  }
  
  /**
   * Serialize the ancient seed data
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      variant: this.variant,
      rarity: this.rarity,
      growthTime: this.growthTime,
      lightRequirement: this.lightRequirement,
      moistureRequirement: this.moistureRequirement,
      temperatureRange: this.temperatureRange
    };
  }
  
  /**
   * Create ancient seed from serialized data
   * @param {Object} data - Serialized data
   * @returns {AncientSeedItem} - New ancient seed instance
   * @static
   */
  static deserialize(data) {
    if (!data) return null;
    
    return new AncientSeedItem({
      id: data.id,
      count: data.count,
      variant: data.variant
    });
  }
}

module.exports = AncientSeedItem; 