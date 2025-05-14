/**
 * AmethystGeode - Generates amethyst geodes in the world
 * Part of the Caves & Cliffs update
 */

class AmethystGeode {
  /**
   * Create a new AmethystGeode generator
   * @param {Object} options - Generator configuration options
   */
  constructor(options = {}) {
    this.id = 'amethyst_geode';
    this.rarity = options.rarity || 24; // Higher = more rare (1/x chance per chunk)
    this.minY = options.minY || 6;
    this.maxY = options.maxY || 46;
    this.minSize = options.minSize || 4;
    this.maxSize = options.maxSize || 7;
    this.budChance = options.budChance || 0.2; // Chance of amethyst buds forming
    this.clusterChance = options.clusterChance || 0.1; // Chance of full clusters forming
  }

  /**
   * Check if an amethyst geode can generate at the given position
   * @param {Object} world - The world object
   * @param {Object} position - The potential generation position
   * @returns {Boolean} - Whether a geode can generate here
   */
  canGenerate(world, position) {
    // Check if position is within valid Y range
    if (position.y < this.minY || position.y > this.maxY) {
      return false;
    }
    
    // Check if we're in a valid biome for geode generation
    const biome = world.getBiome(position);
    if (!biome) return false;
    
    // Geodes can generate in most underground biomes
    const validBiomes = [
      'plains', 'desert', 'mountains', 'forest', 'taiga', 'swamp', 'river', 'frozen_river',
      'snowy_tundra', 'snowy_mountains', 'mushroom_fields', 'beach', 'stone_shore',
      'dripstone_caves', 'lush_caves'
    ];
    
    return validBiomes.includes(biome.id);
  }

  /**
   * Generate an amethyst geode at the given position
   * @param {Object} world - The world object
   * @param {Object} position - The center position for the geode
   * @param {Object} random - Random number generator
   * @returns {Boolean} - Whether the geode was successfully generated
   */
  generate(world, position, random) {
    if (!this.canGenerate(world, position)) {
      return false;
    }
    
    // Determine geode size
    const size = Math.floor(random() * (this.maxSize - this.minSize + 1)) + this.minSize;
    
    // Generate the geode layers
    this.generateGeodeLayers(world, position, size, random);
    
    return true;
  }
  
  /**
   * Generate the layers of the amethyst geode
   * @param {Object} world - The world object
   * @param {Object} center - The center position of the geode
   * @param {Number} size - The radius of the geode
   * @param {Object} random - Random number generator
   */
  generateGeodeLayers(world, center, size, random) {
    // We'll create 3 layers:
    // 1. Outer layer: Smooth basalt
    // 2. Middle layer: Calcite
    // 3. Inner layer: Amethyst blocks with some clusters and buds
    
    // Generate from outside in
    this.generateSphereLayer(world, center, size, 'smooth_basalt', random);
    this.generateSphereLayer(world, center, size - 1, 'calcite', random);
    this.generateSphereLayer(world, center, size - 2, 'amethyst_block', random);
    
    // Create hollow center - replace some of the inner amethyst blocks with air
    this.generateSphereLayer(world, center, size - 3, 'air', random);
    
    // Add amethyst clusters and buds to the inner surfaces
    this.addAmethystFormations(world, center, size - 3, random);
  }
  
  /**
   * Generate a spherical layer of blocks
   * @param {Object} world - The world object
   * @param {Object} center - The center position of the sphere
   * @param {Number} radius - The radius of the sphere
   * @param {String} blockType - The type of block to place
   * @param {Object} random - Random number generator
   */
  generateSphereLayer(world, center, radius, blockType, random) {
    // Generate blocks in a spherical pattern
    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        for (let z = -radius; z <= radius; z++) {
          // Calculate distance from center
          const distance = Math.sqrt(x * x + y * y + z * z);
          
          // Slightly randomize the radius for a more natural look
          const effectiveRadius = radius * (0.95 + random() * 0.1);
          
          // Check if the block is within the sphere radius
          if (distance <= effectiveRadius) {
            const blockPos = {
              x: center.x + x,
              y: center.y + y,
              z: center.z + z
            };
            
            // Don't replace existing geode blocks or bedrock
            const currentBlock = world.getBlock(blockPos);
            if (currentBlock && (
                currentBlock.type === 'bedrock' ||
                currentBlock.type === 'amethyst_block' ||
                currentBlock.type === 'budding_amethyst' ||
                currentBlock.type === 'calcite' ||
                currentBlock.type === 'smooth_basalt')) {
              continue;
            }
            
            // Place the block
            world.setBlock(blockPos, { type: blockType });
          }
        }
      }
    }
  }
  
  /**
   * Add amethyst buds and clusters to the inner surface of the geode
   * @param {Object} world - The world object
   * @param {Object} center - The center position of the geode
   * @param {Number} radius - The radius of the inner air pocket
   * @param {Object} random - Random number generator
   */
  addAmethystFormations(world, center, radius, random) {
    // Convert some amethyst blocks to budding amethyst
    for (let x = -radius - 1; x <= radius + 1; x++) {
      for (let y = -radius - 1; y <= radius + 1; y++) {
        for (let z = -radius - 1; z <= radius + 1; z++) {
          const blockPos = {
            x: center.x + x,
            y: center.y + y,
            z: center.z + z
          };
          
          // Check if this is an amethyst block
          const block = world.getBlock(blockPos);
          if (block && block.type === 'amethyst_block') {
            // Check if it's adjacent to air (inner cavity)
            const hasAirAdjacent = this.hasAdjacentBlock(world, blockPos, 'air');
            
            if (hasAirAdjacent && random() < 0.2) { // 20% chance to convert to budding amethyst
              world.setBlock(blockPos, { type: 'budding_amethyst' });
              
              // Check if we should add buds or clusters to adjacent air blocks
              this.tryAddAmethystGrowth(world, blockPos, random);
            }
          }
        }
      }
    }
  }
  
  /**
   * Check if a block has an adjacent block of the specified type
   * @param {Object} world - The world object
   * @param {Object} position - The position to check
   * @param {String} blockType - The type of block to look for
   * @returns {Boolean} - Whether an adjacent block of the specified type exists
   */
  hasAdjacentBlock(world, position, blockType) {
    const directions = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 }
    ];
    
    for (const dir of directions) {
      const checkPos = {
        x: position.x + dir.x,
        y: position.y + dir.y,
        z: position.z + dir.z
      };
      
      const block = world.getBlock(checkPos);
      if (block && block.type === blockType) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Try to add amethyst buds or clusters on surfaces adjacent to budding amethyst
   * @param {Object} world - The world object
   * @param {Object} position - The budding amethyst position
   * @param {Object} random - Random number generator
   */
  tryAddAmethystGrowth(world, position, random) {
    const directions = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 }
    ];
    
    for (const dir of directions) {
      const growthPos = {
        x: position.x + dir.x,
        y: position.y + dir.y,
        z: position.z + dir.z
      };
      
      // Check if position is air
      const block = world.getBlock(growthPos);
      if (block && block.type === 'air') {
        // Determine if we place a bud or cluster
        if (random() < this.clusterChance) {
          // Full amethyst cluster
          world.setBlock(growthPos, { 
            type: 'amethyst_cluster',
            growth: 3,
            facing: this.getDirName(dir)
          });
        } else if (random() < this.budChance) {
          // Amethyst bud with random growth stage
          const growthStage = Math.floor(random() * 3); // 0-2 for small, medium, large buds
          world.setBlock(growthPos, { 
            type: 'amethyst_bud',
            growth: growthStage,
            facing: this.getDirName(dir)
          });
        }
      }
    }
  }
  
  /**
   * Convert a direction vector to a facing direction name
   * @param {Object} dir - The direction vector
   * @returns {String} - The direction name
   */
  getDirName(dir) {
    if (dir.y > 0) return 'up';
    if (dir.y < 0) return 'down';
    if (dir.x > 0) return 'east';
    if (dir.x < 0) return 'west';
    if (dir.z > 0) return 'south';
    if (dir.z < 0) return 'north';
    return 'up'; // Default
  }
}

module.exports = AmethystGeode; 