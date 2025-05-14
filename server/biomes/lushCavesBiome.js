/**
 * LushCavesBiome - Underground cave biome featuring lush vegetation, moss, and glow berries
 * Part of the Caves & Cliffs update
 */

const Biome = require('./baseBiome');

class LushCavesBiome extends Biome {
  /**
   * Create a new Lush Caves biome
   * @param {Object} props - Optional properties to override defaults
   */
  constructor(props = {}) {
    // Call parent constructor with lush caves specific defaults
    super({
      id: 'lush_caves',
      name: 'Lush Caves',
      color: '#8EDB67',
      
      // Climate ranges - lush caves are warm and wet
      temperatureRange: { min: 0.5, max: 0.95 },
      precipitationRange: { min: 0.7, max: 1.0 },
      continentalnessRange: { min: 0.3, max: 0.7 },
      erosionRange: { min: 0.2, max: 0.8 },
      weirdnessRange: { min: -0.4, max: 0.4 },
      
      // Terrain properties
      baseHeight: 30,
      heightVariation: 5,
      hilliness: 0.4,
      
      // Block types
      topBlock: { id: 'moss_block', metadata: 0 },
      fillerBlock: { id: 'clay', metadata: 0 },
      undergroundBlock: { id: 'stone', metadata: 0 },
      underwaterBlock: { id: 'gravel', metadata: 0 },
      
      // Vegetation
      treeDensity: 0.0,       // No trees
      grassDensity: 0.7,      // Moss and grass
      flowerDensity: 0.5,     // Flowers and fungi
      
      // Features and structures
      features: [
        { id: 'glow_berry_vine', weight: 0.4 },
        { id: 'spore_blossom', weight: 0.3 },
        { id: 'big_dripleaf', weight: 0.3 },
        { id: 'small_dripleaf', weight: 0.3 },
        { id: 'azalea', weight: 0.2 },
        { id: 'flowering_azalea', weight: 0.1 },
        { id: 'moss_carpet', weight: 0.5 },
        { id: 'hanging_roots', weight: 0.3 }
      ],
      structures: [
        { id: 'water_pool', weight: 0.2 }
      ],
      
      // Mob spawn rates
      spawnRates: {
        passive: {
          axolotl: 0.4,
          glow_squid: 0.3
        },
        neutral: {
          bat: 0.3
        },
        hostile: {
          zombie: 0.1,
          skeleton: 0.1,
          spider: 0.1
        }
      },
      
      // Weather properties - not really applicable underground
      weatherProperties: {
        rainChance: 0.0,
        thunderChance: 0.0,
        fogDensity: 0.15,
        temperature: 0.8,
        rainfall: 0.9
      },
      
      // Visual and sound effects
      visualEffects: {
        skyColor: '#7BA4FF',     // Not visible underground
        fogColor: '#86B783',     // Slight green tint to fog
        waterColor: '#62B7FF',   // Clear blue water
        waterFogColor: '#050533',
        grassColor: '#8EDB67',   // Vibrant green
        foliageColor: '#69CE56'  // Bright green foliage
      },
      
      ambientSounds: {
        day: ['ambient.cave'],
        night: ['ambient.cave'],
        mood: ['ambient.cave.mood']
      },
      
      // Override any properties provided
      ...props
    });
    
    // Additional lush caves specific properties
    this.isUnderground = true;
    this.minHeight = 0;
    this.maxHeight = 60;
    this.mossFrequency = 0.6;
    this.glowBerryFrequency = 0.1;
    this.dripleafFrequency = 0.1;
    this.azaleaFrequency = 0.05;
    this.sporeBlossomFrequency = 0.08;
    this.waterPuddleFrequency = 0.2;
    this.clayPatchFrequency = 0.15;
    this.rootFrequency = 0.2;
  }

  /**
   * Gets the terrain height at the specified coordinates
   * Implementation specific to lush caves biome - mostly flat with gentle hills
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate 
   * @param {Object} noiseGenerators - Noise generators
   * @returns {number} - Terrain height at this position
   */
  getHeight(x, z, noiseGenerators) {
    // For cave biomes, this represents cave ceiling height
    const baseHeight = super.getHeight(x, z, noiseGenerators);
    
    // Random cave height variations
    const caveNoise = noiseGenerators.caveHeight ? 
      noiseGenerators.caveHeight.get(x * 0.05, z * 0.05) : 
      Math.sin(x * 0.05) * Math.cos(z * 0.05);
    
    // Add gentle undulation for cave ceiling
    return this.baseHeight + (baseHeight - this.baseHeight) * 0.5 + caveNoise * 3;
  }

  /**
   * Get block at specified coordinates with lush caves-specific generation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate 
   * @param {number} z - Z coordinate
   * @param {number} surfaceHeight - Height of the surface at this position
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Object} - Block type {id, metadata} at this position
   */
  getBlockAt(x, y, z, surfaceHeight, noiseGenerators) {
    // First check standard blocks
    const baseBlock = super.getBlockAt(x, y, z, surfaceHeight, noiseGenerators);
    
    // Only modify blocks in cave regions
    if (!this.isInCaveRegion(x, y, z, noiseGenerators)) {
      return baseBlock;
    }
    
    // Check if this is an open cave space or solid stone
    const isCaveSpace = this.isOpenCaveSpace(x, y, z, noiseGenerators);
    
    // Keep air blocks as air
    if (baseBlock.id === 'air' || baseBlock.id === 'cave_air') {
      // Sometimes add water pools on the floor
      if (y < 40 && Math.random() < this.waterPuddleFrequency) {
        const noiseVal = noiseGenerators.waterPools ? 
          noiseGenerators.waterPools.get(x * 0.1, z * 0.1) : 
          Math.sin(x * 0.1) * Math.cos(z * 0.1);
          
        if (noiseVal > 0.7 && this.isSolidBlockAt(x, y - 1, z, noiseGenerators)) {
          return { id: 'water', metadata: 0 };
        }
      }
      return baseBlock;
    }
    
    // For solid blocks in cave regions, add moss and clay
    if (baseBlock.id === 'stone' || baseBlock.id === 'dirt') {
      const mossNoise = noiseGenerators.moss ? 
        noiseGenerators.moss.get(x * 0.2, y * 0.2, z * 0.2) : 
        Math.sin(x * 0.2) * Math.cos(z * 0.2);
        
      // Moss blocks replace stone on surfaces
      if (mossNoise > 0.3 && Math.random() < this.mossFrequency && this.isBlockExposed(x, y, z, noiseGenerators)) {
        return { id: 'moss_block', metadata: 0 };
      }
      
      // Clay patches
      if (mossNoise > 0.5 && Math.random() < this.clayPatchFrequency) {
        return { id: 'clay', metadata: 0 };
      }
    }
    
    return baseBlock;
  }
  
  /**
   * Check if a block is in the cave region for this biome
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate 
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators
   * @returns {boolean} - Whether the block is in a cave region
   */
  isInCaveRegion(x, y, z, noiseGenerators) {
    // Lush caves exist in specific underground regions
    if (y < this.minHeight || y > this.maxHeight) {
      return false;
    }
    
    // Use 3D noise to define cave regions
    const caveNoise = noiseGenerators.caveMask ? 
      noiseGenerators.caveMask.get(x * 0.01, y * 0.01, z * 0.01) : 
      Math.sin(x * 0.01) * Math.cos(z * 0.01) * Math.sin(y * 0.01);
    
    return caveNoise > 0.4;
  }
  
  /**
   * Check if a position is an open cave space
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate 
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators
   * @returns {boolean} - Whether the position is an open cave space
   */
  isOpenCaveSpace(x, y, z, noiseGenerators) {
    const block = super.getBlockAt(x, y, z, 0, noiseGenerators);
    return block.id === 'air' || block.id === 'cave_air';
  }
  
  /**
   * Check if a block is exposed to air (used for moss placement)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate 
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators
   * @returns {boolean} - Whether the block is exposed to air
   */
  isBlockExposed(x, y, z, noiseGenerators) {
    // Check all six faces to see if any are air
    return this.isOpenCaveSpace(x + 1, y, z, noiseGenerators) ||
           this.isOpenCaveSpace(x - 1, y, z, noiseGenerators) ||
           this.isOpenCaveSpace(x, y + 1, z, noiseGenerators) ||
           this.isOpenCaveSpace(x, y - 1, z, noiseGenerators) ||
           this.isOpenCaveSpace(x, y, z + 1, noiseGenerators) ||
           this.isOpenCaveSpace(x, y, z - 1, noiseGenerators);
  }
  
  /**
   * Check if a position has a solid block
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate 
   * @param {number} z - Z coordinate
   * @param {Object} noiseGenerators - Noise generators
   * @returns {boolean} - Whether there's a solid block at this position
   */
  isSolidBlockAt(x, y, z, noiseGenerators) {
    const block = super.getBlockAt(x, y, z, 0, noiseGenerators);
    return block.id !== 'air' && block.id !== 'cave_air' && block.id !== 'water' && block.id !== 'lava';
  }

  /**
   * Get features at specified coordinates with lush caves-specific generation
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Seeded random function
   * @param {Object} noiseGenerators - Noise generators
   * @returns {Array} - Array of features to place at this position
   */
  getFeaturesAt(x, z, random, noiseGenerators) {
    const features = [];
    
    // Only create features in cave regions
    if (!this.isInCaveRegion(x, this.baseHeight, z, noiseGenerators)) {
      return features;
    }
    
    // Check for ceiling features
    if (random() < this.glowBerryFrequency) {
      features.push({
        type: 'cave_feature',
        id: 'glow_berry_vine',
        x, z,
        yOffset: -3,  // Hanging from ceiling
        length: Math.floor(random() * 4) + 1
      });
    }
    
    if (random() < this.sporeBlossomFrequency) {
      features.push({
        type: 'cave_feature',
        id: 'spore_blossom',
        x, z,
        yOffset: -1  // Attached to ceiling
      });
    }
    
    // Check for floor features
    if (random() < this.dripleafFrequency) {
      features.push({
        type: 'cave_feature',
        id: random() < 0.7 ? 'big_dripleaf' : 'small_dripleaf',
        x, z,
        yOffset: 1,  // Growing from floor
        height: Math.floor(random() * 2) + 1
      });
    }
    
    if (random() < this.azaleaFrequency) {
      features.push({
        type: 'cave_feature',
        id: random() < 0.4 ? 'flowering_azalea' : 'azalea',
        x, z,
        yOffset: 1  // On floor
      });
    }
    
    if (random() < this.rootFrequency) {
      features.push({
        type: 'cave_feature',
        id: 'hanging_roots',
        x, z,
        yOffset: -1,
        length: Math.floor(random() * 3) + 1
      });
    }
    
    return features;
  }

  /**
   * Get structures to place at specified coordinates
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {Function} random - Seeded random function
   * @returns {Array} - Array of structures to place at this position
   */
  getStructuresAt(x, z, random) {
    const structures = [];
    
    // Water pools with axolotls occasionally
    if (random() < 0.005) {
      structures.push({
        type: 'structure',
        id: 'water_pool',
        variant: 'lush_cave',
        x, z,
        hasAxolotls: random() < 0.6
      });
    }
    
    return structures;
  }

  /**
   * Generate biome-specific features (plants, decorations, etc.)
   * @param {Object} chunk - Chunk data
   * @param {Object} chunkPos - Chunk position
   * @param {Object} noiseGen - Noise generator
   */
  generateFeatures(chunk, chunkPos, noiseGen) {
    const { x: chunkX, z: chunkZ } = chunkPos;
    
    // Generate moss carpet and blocks
    this.generateMoss(chunk, chunkX, chunkZ, noiseGen);
    
    // Generate clay patches
    this.generateClayPools(chunk, chunkX, chunkZ, noiseGen);
    
    // Generate dripleaf plants
    this.generateDripleaf(chunk, chunkX, chunkZ, noiseGen);
    
    // Generate azalea bushes
    this.generateAzalea(chunk, chunkX, chunkZ, noiseGen);
    
    // Generate cave vines with glow berries
    this.generateCaveVines(chunk, chunkX, chunkZ, noiseGen);
    
    // Generate spore blossoms on cave ceilings
    this.generateSporeBlossoms(chunk, chunkX, chunkZ, noiseGen);
  }

  /**
   * Generate spore blossoms on cave ceilings
   * @param {Object} chunk - Chunk data
   * @param {number} chunkX - Chunk X position 
   * @param {number} chunkZ - Chunk Z position
   * @param {Object} noiseGen - Noise generator
   */
  generateSporeBlossoms(chunk, chunkX, chunkZ, noiseGen) {
    const blockRegistry = require('../blocks/blockRegistry');
    const sporeBlossomBlock = blockRegistry.getBlock('spore_blossom');
    
    if (!sporeBlossomBlock) {
      console.warn('Spore Blossom block not registered in block registry');
      return;
    }
    
    const chunkSize = 16;
    const sporeBlossomFrequency = 0.03; // Adjust as needed
    
    // Iterate through chunk positions
    for (let localX = 0; localX < chunkSize; localX++) {
      const worldX = chunkX * chunkSize + localX;
      
      for (let localZ = 0; localZ < chunkSize; localZ++) {
        const worldZ = chunkZ * chunkSize + localZ;
        
        // Use a different noise function to avoid patterns matching other features
        const sporeBlossomNoise = noiseGen.simplex3(
          worldX * 0.1,
          101.0, // Fixed Y value for consistent horizontal distribution
          worldZ * 0.1
        );
        
        // Only place spore blossoms in certain noise regions (rare)
        if (sporeBlossomNoise > 0.7) {
          // Find suitable ceiling positions
          for (let y = this.minY; y < this.maxY - 1; y++) {
            // Check if this is a cave ceiling (solid block with air below)
            const blockAbove = chunk.getBlock(localX, y + 1, localZ);
            const blockAtPos = chunk.getBlock(localX, y, localZ);
            const blockBelow = chunk.getBlock(localX, y - 1, localZ);
            
            if (blockAbove && blockAbove.solid && 
                blockAtPos && blockAtPos.type === 'air' &&
                blockBelow && blockBelow.type === 'air') {
              
              // Check distance from other similar blocks
              let tooClose = false;
              const checkRadius = 5;
              
              for (let nx = -checkRadius; nx <= checkRadius; nx++) {
                for (let nz = -checkRadius; nz <= checkRadius; nz++) {
                  if (nx === 0 && nz === 0) continue;
                  
                  const nearbyX = localX + nx;
                  const nearbyZ = localZ + nz;
                  
                  // Skip if outside chunk - will handle in that chunk's generation
                  if (nearbyX < 0 || nearbyX >= 16 || nearbyZ < 0 || nearbyZ >= 16) {
                    continue;
                  }
                  
                  // Check if there's already a spore blossom nearby
                  for (let ny = y - checkRadius; ny <= y + checkRadius; ny++) {
                    const nearbyBlock = chunk.getBlock(nearbyX, ny, nearbyZ);
                    if (nearbyBlock && nearbyBlock.type === 'spore_blossom') {
                      tooClose = true;
                      break;
                    }
                  }
                  
                  if (tooClose) break;
                }
                if (tooClose) break;
              }
              
              // Place spore blossom if not too close to another one
              if (!tooClose && Math.random() < sporeBlossomFrequency) {
                chunk.setBlock(localX, y, localZ, sporeBlossomBlock);
                break; // Only place one per column
              }
            }
          }
        }
      }
    }
  }
}

module.exports = LushCavesBiome; 