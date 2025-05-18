/**
 * AncientPlantBlock - Implementation of ancient plants grown from ancient seeds
 * Part of the Minecraft 1.23 Update
 */

const Block = require('./block');
const AncientSeedItem = require('../items/ancientSeedItem');

class AncientPlantBlock extends Block {
  /**
   * Create a new ancient plant block
   * @param {Object} options - Block options
   */
  constructor(options = {}) {
    // Set up variant and other properties
    const variant = options.variant || 'generic';
    
    // Format the name based on variant
    let name = 'Ancient Plant';
    if (variant !== 'generic') {
      const formattedVariant = variant
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      name = `${formattedVariant} Plant`;
    }
    
    // Configure block properties
    super({
      id: options.id || `ancient_plant_${variant === 'generic' ? '' : variant}`.replace(/^ancient_plant_$/, 'ancient_plant'),
      type: 'ancient_plant',
      name,
      hardness: 0.0, // Easy to break like other plants
      toolType: null, // Can break with anything
      solid: false,
      transparent: true,
      ...options
    });
    
    // Ancient plant specific properties
    this.variant = variant;
    this.growthStage = options.growthStage !== undefined ? options.growthStage : 0;
    this.maxGrowthStage = this.getMaxGrowthStageForVariant(variant);
    this.isFullyGrown = this.growthStage >= this.maxGrowthStage;
    this.age = options.age || 0; // Age in ticks
    this.plantedAt = options.plantedAt || Date.now();
    
    // Growth requirements
    this.lightRequirement = options.lightRequirement || this.getLightRequirementForVariant(variant);
    this.moistureRequirement = options.moistureRequirement || this.getMoistureRequirementForVariant(variant);
    this.temperatureRange = options.temperatureRange || this.getTemperatureRangeForVariant(variant);
    
    // Special variant properties
    if (variant === 'mystic') {
      this.emitParticles = this.createMysticParticleEmitter();
      this.applyEffectToPlayer = this.createMysticPlayerEffect();
    }
    
    if (variant === 'crystal') {
      this.getLightEmission = this.createCrystalLightEmission();
      this.getMaxLightEmission = () => 10; // Maximum light level (0-15)
    }
  }
  
  /**
   * Get max growth stage for a variant
   * @param {string} variant - Plant variant
   * @returns {number} - Maximum growth stage
   * @private
   */
  getMaxGrowthStageForVariant(variant) {
    const growthStages = {
      'generic': 3,
      'torchflower': 3,
      'pitcher_pod': 3,
      'mystic': 4,
      'crystal': 5,
      'arcane': 4,
      'frost': 3
    };
    
    return growthStages[variant] || 3;
  }
  
  /**
   * Get light requirement for a variant
   * @param {string} variant - Plant variant
   * @returns {number} - Minimum light level needed (0-15)
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
   * @param {string} variant - Plant variant
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
   * @param {string} variant - Plant variant
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
   * Create particle emitter for mystic plants
   * @returns {Function} - Particle emission function
   * @private
   */
  createMysticParticleEmitter() {
    return (world, position) => {
      if (!world || !position) return false;
      
      // Only emit particles if fully grown
      if (!this.isFullyGrown) return false;
      
      // Define particle properties
      const particleType = 'enchant'; // Enchantment particles
      const count = 3 + Math.floor(Math.random() * 3); // 3-5 particles
      const speed = 0.1;
      const spreadX = 0.3;
      const spreadY = 0.5;
      const spreadZ = 0.3;
      
      // Emit particles in the world
      if (world.spawnParticles) {
        world.spawnParticles(particleType, {
          position,
          count,
          speed,
          spread: { x: spreadX, y: spreadY, z: spreadZ }
        });
        return true;
      }
      
      return false;
    };
  }
  
  /**
   * Create player effect function for mystic plants
   * @returns {Function} - Effect application function
   * @private
   */
  createMysticPlayerEffect() {
    return (player) => {
      if (!player) return false;
      
      // Only apply effects if fully grown
      if (!this.isFullyGrown) return false;
      
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
      
      // Apply the effect to the player
      if (player.applyStatusEffect) {
        player.applyStatusEffect({
          type: randomEffect,
          duration,
          amplifier
        });
        return true;
      }
      
      return false;
    };
  }
  
  /**
   * Create light emission function for crystal plants
   * @returns {Function} - Light emission function
   * @private
   */
  createCrystalLightEmission() {
    return () => {
      // Light level depends on growth stage
      const maxLight = this.getMaxLightEmission();
      const lightLevel = Math.floor((this.growthStage / this.maxGrowthStage) * maxLight);
      
      return Math.max(1, lightLevel); // At least level 1 light
    };
  }
  
  /**
   * Handle random tick updates
   * @param {Object} world - The game world
   * @param {Object} position - Current position
   */
  onRandomTick(world, position) {
    if (!world || !position) return;
    
    // Increment age
    this.age++;
    
    // Check if the plant can grow
    if (!this.isFullyGrown && this.canGrow(world, position)) {
      // Calculate growth chance
      const baseChance = 0.1; // 10% chance per random tick
      const biomeModifier = this.getGrowthRateForBiome(world, position);
      const growthChance = baseChance * biomeModifier;
      
      // Attempt to grow
      if (Math.random() < growthChance) {
        this.growthStage++;
        
        // Update fully grown status
        if (this.growthStage >= this.maxGrowthStage) {
          this.isFullyGrown = true;
          
          // Emit particles on reaching maturity
          if (world.spawnParticles) {
            world.spawnParticles('happy_villager', {
              position,
              count: 5,
              speed: 0.1,
              spread: { x: 0.3, y: 0.5, z: 0.3 }
            });
          }
        }
        
        // Update block state in the world
        world.setBlockState(position.x, position.y, position.z, this);
      }
    }
    
    // Special variant behaviors
    if (this.variant === 'mystic' && this.emitParticles) {
      // Randomly emit particles
      if (Math.random() < 0.2) { // 20% chance each tick
        this.emitParticles(world, position);
      }
    }
    
    // Handle crossbreeding
    if (this.isFullyGrown && Math.random() < 0.05) { // 5% chance each tick when fully grown
      this.attemptCrossbreed(world, position);
    }
  }
  
  /**
   * Check if the plant can grow
   * @param {Object} world - The game world
   * @param {Object} position - Current position
   * @returns {boolean} - Whether growth conditions are met
   */
  canGrow(world, position) {
    if (!world || !position) return false;
    
    // Check light level
    const lightLevel = world.getLightLevel(position.x, position.y, position.z);
    if (lightLevel < this.lightRequirement) {
      return false;
    }
    
    // Check moisture
    const moisture = world.getMoisture(position.x, position.y, position.z);
    if (moisture < this.moistureRequirement) {
      return false;
    }
    
    // Check temperature
    const temperature = world.getTemperature(position.x, position.y, position.z);
    if (temperature < this.temperatureRange.min || temperature > this.temperatureRange.max) {
      return false;
    }
    
    // Special requirements for crystal variant
    if (this.variant === 'crystal') {
      // Check for nearby amethyst
      const hasAmethyst = this.checkForAmethyst(world, position);
      if (!hasAmethyst) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check for amethyst blocks nearby
   * @param {Object} world - The game world
   * @param {Object} position - Current position
   * @returns {boolean} - Whether amethyst is nearby
   * @private
   */
  checkForAmethyst(world, position) {
    if (!world || !position) return false;
    
    // Check in a 2-block radius
    for (let x = -2; x <= 2; x++) {
      for (let y = -2; y <= 2; y++) {
        for (let z = -2; z <= 2; z++) {
          const block = world.getBlockState(
            position.x + x,
            position.y + y,
            position.z + z
          );
          
          if (block && (
            block.type === 'amethyst_block' ||
            block.type === 'budding_amethyst' ||
            block.type === 'amethyst_cluster'
          )) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Get the growth rate modifier based on biome
   * @param {Object} world - The game world
   * @param {Object} position - Current position
   * @returns {number} - Growth rate modifier
   */
  getGrowthRateForBiome(world, position) {
    if (!world || !position) return 1.0;
    
    const biome = world.getBiome(position.x, position.y, position.z);
    if (!biome || !biome.type) return 1.0;
    
    // Check if current biome is in optimal biomes for this variant
    const seedItem = new AncientSeedItem({ variant: this.variant });
    const optimalBiomes = seedItem.optimalBiomes;
    
    if (optimalBiomes.includes(biome.type)) {
      return 1.5; // 50% faster growth in optimal biomes
    }
    
    // Specific biome modifiers
    const biomeModifiers = {
      'lush_caves': 1.3, // Good for most plants
      'jungle': 1.2,
      'swamp': 1.2,
      'flower_forest': 1.3,
      'plains': 1.0, // Neutral
      'desert': 0.7, // Poor for most plants
      'snowy_plains': 0.8,
      'frozen_peaks': 0.6
    };
    
    // Special cases for specific variants
    if (this.variant === 'frost' && biome.type.includes('snow')) {
      return 1.4; // Frost plants grow well in snowy biomes
    }
    
    if (this.variant === 'pitcher_pod' && biome.type.includes('swamp')) {
      return 1.5; // Pitcher pods thrive in swamps
    }
    
    return biomeModifiers[biome.type] || 1.0;
  }
  
  /**
   * Attempt to crossbreed with nearby plants
   * @param {Object} world - The game world
   * @param {Object} position - Current position
   * @private
   */
  attemptCrossbreed(world, position) {
    if (!world || !position) return;
    
    // Find neighboring plants
    const neighbors = this.checkForNeighboringPlants(world, position);
    if (neighbors.length === 0) return;
    
    // Calculate chance of successful crossbreed
    const crossbreedChance = this.calculateCrossbreedChance(world, position);
    
    if (Math.random() < crossbreedChance) {
      // Choose a random neighbor to crossbreed with
      const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      
      // Create a new seed from crossbreeding
      const newSeed = AncientSeedItem.crossbreed(this.variant, randomNeighbor.variant);
      
      // Spawn the seed as a dropped item
      if (world.spawnItem) {
        world.spawnItem(newSeed, {
          x: position.x + 0.5,
          y: position.y + 0.2,
          z: position.z + 0.5
        });
        
        // Spawn particles to indicate successful crossbreeding
        if (world.spawnParticles) {
          world.spawnParticles('heart', {
            position: {
              x: position.x + 0.5,
              y: position.y + 0.5,
              z: position.z + 0.5
            },
            count: 5,
            speed: 0.1,
            spread: { x: 0.3, y: 0.3, z: 0.3 }
          });
        }
      }
    }
  }
  
  /**
   * Check for neighboring ancient plants
   * @param {Object} world - The game world
   * @param {Object} position - Current position
   * @returns {Array} - Array of neighboring plants
   */
  checkForNeighboringPlants(world, position) {
    if (!world || !position) return [];
    
    const neighbors = [];
    
    // Check in a 1-block radius
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        // Skip self position
        if (x === 0 && z === 0) continue;
        
        const block = world.getBlockState(
          position.x + x,
          position.y,
          position.z + z
        );
        
        // Check if it's an ancient plant and fully grown
        if (block && 
            block.type === 'ancient_plant' && 
            block.variant !== this.variant && 
            block.isFullyGrown) {
          neighbors.push(block);
        }
      }
    }
    
    return neighbors;
  }
  
  /**
   * Calculate chance of successful crossbreeding
   * @param {Object} world - The game world
   * @param {Object} position - Current position
   * @returns {number} - Chance of crossbreeding (0-1)
   */
  calculateCrossbreedChance(world, position) {
    if (!world || !position) return 0.0;
    
    // Base chance is low
    let chance = 0.05; // 5% base chance
    
    // Increase chance based on number of neighbors
    const neighbors = this.checkForNeighboringPlants(world, position);
    chance += neighbors.length * 0.03; // +3% per neighbor
    
    // Check for optimal biome
    const biome = world.getBiome(position.x, position.y, position.z);
    if (biome) {
      const seedItem = new AncientSeedItem({ variant: this.variant });
      if (seedItem.optimalBiomes.includes(biome.type)) {
        chance *= 1.5; // 50% increased chance in optimal biomes
      }
    }
    
    // Check for full moon (good for magical plants)
    if (world.getMoonPhase && world.getMoonPhase() === 0) {
      chance *= 2.0; // Double chance during full moon
    }
    
    return Math.min(0.5, chance); // Cap at 50% chance
  }
  
  /**
   * Handle block interaction
   * @param {Object} player - The player interacting
   * @param {Object} item - Item the player is holding
   * @returns {Object|boolean} - Result of interaction
   */
  interact(player, item) {
    if (!player) return false;
    
    // Apply mystic effect if applicable
    if (this.variant === 'mystic' && this.applyEffectToPlayer) {
      const effectApplied = this.applyEffectToPlayer(player);
      
      if (effectApplied) {
        return {
          success: true,
          message: 'You feel a strange energy from the plant...'
        };
      }
    }
    
    // Handle bone meal interaction to speed growth
    if (item && item.type === 'bone_meal' && !this.isFullyGrown) {
      // Advance growth stage
      this.growthStage = Math.min(this.maxGrowthStage, this.growthStage + 1);
      
      // Update fully grown status
      if (this.growthStage >= this.maxGrowthStage) {
        this.isFullyGrown = true;
      }
      
      // Consume one bone meal
      return {
        success: true,
        message: 'The plant grows quickly!',
        itemInHand: item.count > 1 ? { ...item, count: item.count - 1 } : null
      };
    }
    
    return false;
  }
  
  /**
   * Get drops when the block is broken
   * @returns {Array} - Array of items to drop
   */
  getDrops() {
    const drops = [];
    
    // Always drop at least one seed
    drops.push({
      type: `ancient_seed${this.variant === 'generic' ? '' : '_' + this.variant}`,
      count: 1
    });
    
    // Chance for additional seeds if fully grown
    if (this.isFullyGrown && Math.random() < 0.3) { // 30% chance
      drops.push({
        type: `ancient_seed${this.variant === 'generic' ? '' : '_' + this.variant}`,
        count: 1
      });
    }
    
    // Drop the plant item if fully grown
    if (this.isFullyGrown) {
      drops.push({
        type: this.getPlantItemType(),
        count: 1
      });
    }
    
    return drops;
  }
  
  /**
   * Get the type of item dropped by the plant
   * @returns {string} - Item type
   * @private
   */
  getPlantItemType() {
    const itemTypes = {
      'generic': 'ancient_flower',
      'torchflower': 'torchflower',
      'pitcher_pod': 'pitcher_plant',
      'mystic': 'mystic_flower',
      'crystal': 'crystal_bloom',
      'arcane': 'arcane_blossom',
      'frost': 'frost_lily'
    };
    
    return itemTypes[this.variant] || 'ancient_flower';
  }
  
  /**
   * Get data for rendering the block
   * @returns {Object} - Render data
   */
  getRenderData() {
    return {
      id: this.id,
      type: this.type,
      variant: this.variant,
      growthStage: this.growthStage,
      maxGrowthStage: this.maxGrowthStage,
      isFullyGrown: this.isFullyGrown,
      // Include light emission for crystal plants
      lightLevel: this.getLightEmission ? this.getLightEmission() : 0
    };
  }
  
  /**
   * Serialize the ancient plant data
   * @returns {Object} - Serialized data
   */
  serialize() {
    return {
      ...super.serialize(),
      variant: this.variant,
      growthStage: this.growthStage,
      maxGrowthStage: this.maxGrowthStage,
      isFullyGrown: this.isFullyGrown,
      age: this.age,
      plantedAt: this.plantedAt,
      lightRequirement: this.lightRequirement,
      moistureRequirement: this.moistureRequirement,
      temperatureRange: this.temperatureRange
    };
  }
  
  /**
   * Create ancient plant from serialized data
   * @param {Object} data - Serialized data
   * @returns {AncientPlantBlock} - New ancient plant block instance
   * @static
   */
  static deserialize(data) {
    if (!data) return null;
    
    return new AncientPlantBlock({
      id: data.id,
      variant: data.variant,
      growthStage: data.growthStage,
      maxGrowthStage: data.maxGrowthStage,
      isFullyGrown: data.isFullyGrown,
      age: data.age,
      plantedAt: data.plantedAt,
      lightRequirement: data.lightRequirement,
      moistureRequirement: data.moistureRequirement,
      temperatureRange: data.temperatureRange
    });
  }
}

module.exports = AncientPlantBlock; 