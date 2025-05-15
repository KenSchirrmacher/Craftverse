/**
 * Mangrove Swamp Biome - A swampy biome with mangrove trees and mud blocks
 * Features special vegetation, shallow water, and frogs
 */

const BiomeBase = require('./biomeBase');

class MangroveSwampBiome extends BiomeBase {
  /**
   * Create a new Mangrove Swamp biome
   */
  constructor(options = {}) {
    super({
      id: 'mangrove_swamp',
      name: 'Mangrove Swamp',
      
      // Climate properties
      temperature: 0.8, // Warm biome
      precipitation: 0.9, // Very wet
      continentalness: 0.4, // Somewhat continental (inland water bodies)
      erosion: 0.7, // Moderately eroded terrain
      weirdness: 0.2, // Slightly unusual
      
      // Visual properties
      color: '#3D6E33', // Greenish-brown
      fogColor: '#8BA151', // Greenish-yellow fog
      fogDensity: 0.3, // Moderate fog
      waterColor: '#617B64', // Muddy green
      waterFogColor: '#232317', // Dark murky
      grassColor: '#6A7039', // Olive green
      foliageColor: '#495225', // Dark olive
      
      // Surface configuration
      topBlock: 'grass', // Will be modified with mud in implementation
      fillerBlock: 'dirt',
      underwaterBlock: 'mud', // New block type
      oceanFloorBlock: 'mud',
      
      // Height configuration
      baseHeight: 0.1, // Low-lying terrain
      heightVariation: 0.1, // Fairly flat
      
      // Additional properties
      ...options
    });
    
    // Special features for mangrove swamp
    this.hasMangroves = true;
    this.hasMudBlocks = true;
    this.hasFrogs = true;
    
    // Features and structures
    this.features = [
      { id: 'mangrove_tree', weight: 0.8 },
      { id: 'mangrove_roots', weight: 0.9 },
      { id: 'mud_block', weight: 0.7 },
      { id: 'water_pool', weight: 0.5 },
      { id: 'seagrass', weight: 0.3 },
      { id: 'lily_pad', weight: 0.3 },
      { id: 'vines', weight: 0.4 }
    ];
    
    this.structures = [
      { id: 'mud_hut', weight: 0.01 },
      { id: 'fallen_mangrove', weight: 0.05 }
    ];
    
    // Mob spawning
    this.mobSpawns = {
      passive: [
        { type: 'frog', weight: 15, minCount: 2, maxCount: 5 },
        { type: 'parrot', weight: 5, minCount: 1, maxCount: 2 }
      ],
      neutral: [
        { type: 'slime', weight: 10, minCount: 1, maxCount: 3 }
      ],
      hostile: [
        { type: 'zombie', weight: 10, minCount: 1, maxCount: 4 },
        { type: 'skeleton', weight: 8, minCount: 1, maxCount: 3 },
        { type: 'spider', weight: 8, minCount: 1, maxCount: 3 }
      ],
      water: [
        { type: 'tadpole', weight: 10, minCount: 2, maxCount: 5 },
        { type: 'squid', weight: 5, minCount: 1, maxCount: 2 },
        { type: 'glow_squid', weight: 3, minCount: 1, maxCount: 1 }
      ]
    };
  }
  
  /**
   * Get the height at a specific position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Object} baseNoise - Noise value
   * @returns {number} - Height at this position
   */
  getHeightAt(x, z, baseNoise) {
    // Mangrove swamps are typically flat with slight variations 
    // and occasional shallow pools
    const swampNoise = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.5;
    const poolNoise = Math.sin(x * 0.04 + 0.5) * Math.cos(z * 0.04 + 0.5);
    
    // Create shallow pools where poolNoise is very negative
    let heightMod = 0;
    if (poolNoise < -0.7) {
      heightMod = (poolNoise + 0.7) * 3; // Create a depression
    }
    
    return baseNoise * this.heightVariation + this.baseHeight + swampNoise * 0.3 + heightMod;
  }
  
  /**
   * Get surface block at a specific position and depth
   * @param {number} x - X coordinate 
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} depth - Depth from surface
   * @param {boolean} isUnderwater - Whether position is underwater
   * @returns {string} - Block ID
   */
  getSurfaceBlock(x, y, z, depth, isUnderwater) {
    // Create mud patches with random distribution
    const mudNoise = Math.sin(x * 0.1) * Math.cos(z * 0.1);
    const isMudPatch = mudNoise > 0.3;
    
    if (isUnderwater) {
      // Underwater blocks
      if (depth === 0) {
        return 'mud'; // Top layer is mud when underwater
      } else if (depth < 4) {
        return isMudPatch ? 'mud' : this.fillerBlock;
      }
    } else {
      // Above water blocks
      if (depth === 0) {
        return isMudPatch ? 'mud' : this.topBlock;
      } else if (depth < 3) {
        return isMudPatch ? 'mud' : this.fillerBlock;
      }
    }
    
    // Default to stone for deeper layers
    return 'stone';
  }
  
  /**
   * Get features to generate at a specific position
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Random function
   * @returns {Array} - Features to generate
   */
  getFeaturesAt(x, z, random) {
    const features = [];
    
    // Mangrove tree placement
    if (random() < 0.1) {
      features.push({
        type: 'tree',
        variant: 'mangrove',
        size: 1 + random() * 0.5, // Variation in size
        x, z
      });
    }
    
    // Mangrove roots as standalone features
    if (random() < 0.2) {
      features.push({
        type: 'mangrove_roots',
        x, z
      });
    }
    
    // Water vegetation
    if (random() < 0.3) {
      const waterPlant = random() < 0.5 ? 'lily_pad' : 'seagrass';
      features.push({
        type: 'water_plant',
        variant: waterPlant,
        x, z
      });
    }
    
    // Vines
    if (random() < 0.15) {
      features.push({
        type: 'hanging_vegetation',
        variant: 'vine',
        length: 1 + Math.floor(random() * 3),
        x, z
      });
    }
    
    return features;
  }
  
  /**
   * Apply biome-specific effects to entities
   * @param {Object} entity - Entity
   * @param {number} duration - Time entity has been in biome
   * @param {Object} world - World object
   * @returns {Object} - Applied effects
   */
  applyEntityEffects(entity, duration, world) {
    const appliedEffects = {};
    
    // Slowing movement in mud and shallow water
    if (entity.type === 'player' || entity.type === 'mob') {
      // Check if player is on mud or in shallow water
      const pos = entity.position;
      const blockBelow = world.getBlockAt(Math.floor(pos.x), Math.floor(pos.y) - 1, Math.floor(pos.z));
      
      if (blockBelow === 'mud' || (blockBelow === 'water' && world.getWaterDepth(pos.x, pos.z) < 2)) {
        if (world && world.statusEffectsManager) {
          world.statusEffectsManager.addEffect(entity.id, 'SLOWNESS', {
            level: 0, // Level 1 slowness
            duration: 30, // Very short duration
            showParticles: false,
            ambient: true
          });
          
          appliedEffects.slowness = true;
        }
      }
    }
    
    return appliedEffects;
  }
  
  /**
   * Check if this biome has a specific feature
   * @param {string} feature - Feature to check
   * @returns {boolean} - Whether biome has this feature
   */
  hasFeature(feature) {
    switch (feature) {
      case 'mangrove_trees':
        return this.hasMangroves;
      case 'mud_blocks':
        return this.hasMudBlocks;
      case 'frogs':
        return this.hasFrogs;
      case 'water_pools':
        return true;
      default:
        return super.hasFeature(feature);
    }
  }
  
  /**
   * Get random value from coordinates with salt
   * @private
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate 
   * @param {string} salt - Salt for variation
   * @returns {number} - Random value between 0-1
   */
  getRandomFromCoords(x, z, salt = '') {
    const hash = (Math.sin(x * 12.9898 + z * 78.233 + salt.charCodeAt(0)) * 43758.5453) % 1;
    return Math.abs(hash);
  }
}

module.exports = MangroveSwampBiome; 