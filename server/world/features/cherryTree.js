/**
 * Cherry Tree Feature - Generates cherry blossom trees with pink leaves
 * Added in the Trails & Tales Update
 */

const BaseFeature = require('./baseFeature');

class CherryTree extends BaseFeature {
  constructor() {
    super('cherry');
    
    // Cherry tree properties
    this.trunkHeight = { min: 4, max: 7 };
    this.canopySize = { min: 5, max: 9 };
    this.branchCount = { min: 3, max: 6 };
    
    // Block types used for this tree
    this.trunkBlock = 'cherry_log';
    this.leavesBlock = 'cherry_leaves';
    
    // Bee nest properties
    this.beeNestChance = 0.05; // 5% chance
    this.beeCount = { min: 2, max: 3 };
    this.flowerRadiusCheck = 2; // Check 2 blocks around for flowers
  }

  /**
   * Generate the cherry tree at the given position
   * @param {Object} world - World instance
   * @param {Object} position - Position to generate
   * @param {Object} random - Random generator
   * @returns {boolean} - Success or failure
   */
  generate(world, position, random) {
    // Validate position
    if (!this.canGenerate(world, position)) {
      return false;
    }
    
    // Determine tree dimensions
    const trunkHeight = random.nextInt(this.trunkHeight.max - this.trunkHeight.min + 1) + this.trunkHeight.min;
    const canopyRadius = Math.floor((random.nextInt(this.canopySize.max - this.canopySize.min + 1) + this.canopySize.min) / 2);
    const branchCount = random.nextInt(this.branchCount.max - this.branchCount.min + 1) + this.branchCount.min;
    
    // Generate the trunk
    this.generateTrunk(world, position, trunkHeight);
    
    // Generate branches and leaves
    this.generateBranches(world, position, trunkHeight, canopyRadius, branchCount, random);
    
    // Add bee nest if flowers are nearby
    this.tryGenerateBeeNest(world, position, trunkHeight, random);
    
    return true;
  }

  /**
   * Check if a tree can be generated at the given position
   * @param {Object} world - World instance
   * @param {Object} position - Position to check
   * @returns {boolean} - Whether tree can generate
   */
  canGenerate(world, position) {
    // Check if there's enough vertical space for the tree
    const minHeight = this.trunkHeight.min + 5; // For trunk + some branches
    for (let y = 1; y <= minHeight; y++) {
      const block = world.getBlockState(position.x, position.y + y, position.z);
      if (block && block.type !== 'air') {
        return false;
      }
    }
    
    // Check if the ground is suitable
    const groundBlock = world.getBlockState(position.x, position.y - 1, position.z);
    return groundBlock && 
      (groundBlock.type === 'grass_block' || 
       groundBlock.type === 'dirt' || 
       groundBlock.type === 'podzol' ||
       groundBlock.type === 'coarse_dirt' ||
       groundBlock.type === 'mycelium' ||
       groundBlock.type === 'moss_block' ||
       groundBlock.type === 'rooted_dirt');
  }

  /**
   * Generate the tree trunk
   * @param {Object} world - World instance
   * @param {Object} position - Position to generate
   * @param {number} height - Height of the trunk
   */
  generateTrunk(world, position, height) {
    for (let y = 0; y < height; y++) {
      world.setBlockState(position.x, position.y + y, position.z, { type: this.trunkBlock });
    }
  }

  /**
   * Generate branches and leaves for the cherry tree
   * @param {Object} world - World instance
   * @param {Object} position - Base position
   * @param {number} trunkHeight - Height of the trunk
   * @param {number} canopyRadius - Radius of the canopy
   * @param {number} branchCount - Number of branches
   * @param {Object} random - Random generator
   */
  generateBranches(world, position, trunkHeight, canopyRadius, branchCount, random) {
    // The top of the trunk
    const topY = position.y + trunkHeight - 1;
    
    // Direction vectors for branches
    const directions = [
      { x: 1, z: 0 },
      { x: -1, z: 0 },
      { x: 0, z: 1 },
      { x: 0, z: -1 },
      { x: 1, z: 1 },
      { x: -1, z: 1 },
      { x: 1, z: -1 },
      { x: -1, z: -1 }
    ];
    
    // Shuffle directions for randomness
    this.shuffleArray(directions, random);
    
    // Generate branches in random directions
    for (let i = 0; i < branchCount; i++) {
      const dirIndex = i % directions.length;
      const dir = directions[dirIndex];
      
      // Start from a random height in the upper part of the trunk
      const startY = topY - random.nextInt(Math.floor(trunkHeight / 2));
      
      // Branch length is random but scaled by canopy radius
      const branchLength = random.nextInt(canopyRadius) + 2;
      
      // Generate a curved branch
      this.generateCurvedBranch(world, 
        position.x, startY, position.z, 
        dir.x, dir.z, 
        branchLength, 
        random);
    }
    
    // Additionally, generate a top canopy
    this.generateTopCanopy(world, position.x, topY, position.z, canopyRadius, random);
  }

  /**
   * Generate a curved branch with leaves
   * @param {Object} world - World instance
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} startZ - Starting Z coordinate
   * @param {number} dirX - X direction
   * @param {number} dirZ - Z direction
   * @param {number} length - Branch length
   * @param {Object} random - Random generator
   */
  generateCurvedBranch(world, startX, startY, startZ, dirX, dirZ, length, random) {
    let x = startX;
    let y = startY;
    let z = startZ;
    
    // Create a curved branch by placing logs with some upward trend
    for (let i = 0; i < length; i++) {
      // Move in main direction
      x += dirX;
      z += dirZ;
      
      // Add slight curve upward and sideways
      if (i > 0 && random.nextFloat() < 0.4) {
        y += 1;
        
        // Occasional sideways curve
        if (random.nextFloat() < 0.3) {
          if (dirX !== 0) {
            z += random.nextFloat() < 0.5 ? 1 : -1;
          } else {
            x += random.nextFloat() < 0.5 ? 1 : -1;
          }
        }
      }
      
      // Place branch block
      world.setBlockState(x, y, z, { type: this.trunkBlock });
      
      // Generate leaves around the branch
      this.generateLeafCluster(world, x, y, z, random);
    }
  }

  /**
   * Generate a cluster of leaves around a point
   * @param {Object} world - World instance
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} z - Center Z coordinate
   * @param {Object} random - Random generator
   */
  generateLeafCluster(world, x, y, z, random) {
    // Determine cluster size (higher at branch ends)
    const baseRadius = 2;
    
    // Generate a roughly spherical cluster
    for (let dx = -baseRadius; dx <= baseRadius; dx++) {
      for (let dy = -baseRadius; dy <= baseRadius; dy++) {
        for (let dz = -baseRadius; dz <= baseRadius; dz++) {
          // Skip center block (that's the branch)
          if (dx === 0 && dy === 0 && dz === 0) continue;
          
          // Calculate distance from center
          const distance = Math.sqrt(dx * dx + dy * dy * 1.5 + dz * dz);
          
          // Leaves have a decreasing chance of appearing as distance increases
          if (distance <= baseRadius && random.nextFloat() < (baseRadius - distance) / baseRadius) {
            // Make sure there's no solid block there already
            const blockX = x + dx;
            const blockY = y + dy;
            const blockZ = z + dz;
            
            const existingBlock = world.getBlockState(blockX, blockY, blockZ);
            if (!existingBlock || existingBlock.type === 'air') {
              world.setBlockState(blockX, blockY, blockZ, { type: this.leavesBlock });
            }
          }
        }
      }
    }
  }

  /**
   * Generate the top canopy of the tree
   * @param {Object} world - World instance
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} z - Center Z coordinate
   * @param {number} radius - Radius of canopy
   * @param {Object} random - Random generator
   */
  generateTopCanopy(world, x, y, z, radius, random) {
    // Add an upward extension first
    for (let i = 1; i <= 2; i++) {
      world.setBlockState(x, y + i, z, { type: this.trunkBlock });
    }
    
    // Generate a larger leaf cluster at the top
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = 0; dy <= Math.ceil(radius / 2); dy++) {
        for (let dz = -radius; dz <= radius; dz++) {
          // Skip trunk blocks
          if (dx === 0 && dz === 0 && dy < 3) continue;
          
          // Calculate distance from center (slightly flatter in y-axis)
          const distance = Math.sqrt(dx * dx + dy * dy * 2 + dz * dz);
          
          // The top canopy is denser than branch leaves
          if (distance <= radius && random.nextFloat() < (radius - distance) / radius + 0.1) {
            const blockX = x + dx;
            const blockY = y + dy + 2; // Start above the trunk extension
            const blockZ = z + dz;
            
            const existingBlock = world.getBlockState(blockX, blockY, blockZ);
            if (!existingBlock || existingBlock.type === 'air') {
              world.setBlockState(blockX, blockY, blockZ, { type: this.leavesBlock });
            }
          }
        }
      }
    }
    
    // Add some hanging leaves underneath
    this.generateHangingLeaves(world, x, y + 2, z, radius - 1, random);
  }

  /**
   * Generate hanging leaves under the canopy
   * @param {Object} world - World instance
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} z - Center Z coordinate
   * @param {number} radius - Radius of area
   * @param {Object} random - Random generator
   */
  generateHangingLeaves(world, x, y, z, radius, random) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        // Calculate distance from center
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Only add hanging leaves in the middle area
        if (distance <= radius && random.nextFloat() < 0.4) {
          const hangLength = random.nextInt(3) + 1;
          
          for (let dy = -1; dy >= -hangLength; dy--) {
            const blockX = x + dx;
            const blockY = y + dy;
            const blockZ = z + dz;
            
            const existingBlock = world.getBlockState(blockX, blockY, blockZ);
            if (!existingBlock || existingBlock.type === 'air') {
              world.setBlockState(blockX, blockY, blockZ, { type: this.leavesBlock });
            }
          }
        }
      }
    }
  }

  /**
   * Try to generate a bee nest on the tree trunk
   * @param {Object} world - World instance
   * @param {Object} position - Base position of tree
   * @param {number} trunkHeight - Height of trunk
   * @param {Object} random - Random generator
   */
  tryGenerateBeeNest(world, position, trunkHeight, random) {
    // Only generate if random check passes
    if (random.nextFloat() >= this.beeNestChance) {
      return;
    }
    
    // Check if there are flowers nearby
    let foundFlowers = false;
    
    // Check in a radius around the tree base
    for (let dx = -this.flowerRadiusCheck; dx <= this.flowerRadiusCheck && !foundFlowers; dx++) {
      for (let dz = -this.flowerRadiusCheck; dz <= this.flowerRadiusCheck && !foundFlowers; dz++) {
        const blockX = position.x + dx;
        const blockZ = position.z + dz;
        
        // Check the block and a few blocks above it (flowers might not be at ground level)
        for (let dy = -1; dy <= 2; dy++) {
          const blockY = position.y + dy;
          const block = world.getBlockState(blockX, blockY, blockZ);
          
          if (block && this.isFlower(block.type)) {
            foundFlowers = true;
            break;
          }
        }
      }
    }
    
    // Only generate if flowers were found
    if (foundFlowers) {
      // Choose a random height on the trunk for the bee nest
      const nestHeight = Math.floor(trunkHeight / 2) + random.nextInt(Math.floor(trunkHeight / 2));
      
      // Choose a random direction
      const directions = [
        { x: 1, z: 0 },
        { x: -1, z: 0 },
        { x: 0, z: 1 },
        { x: 0, z: -1 }
      ];
      
      const dir = directions[random.nextInt(directions.length)];
      
      // Place the bee nest
      world.setBlockState(
        position.x + dir.x,
        position.y + nestHeight,
        position.z + dir.z,
        { 
          type: 'bee_nest', 
          beeCount: random.nextInt(this.beeCount.max - this.beeCount.min + 1) + this.beeCount.min 
        }
      );
    }
  }

  /**
   * Check if a block type is a flower
   * @param {string} blockType - Type of block
   * @returns {boolean} - Whether the block is a flower
   */
  isFlower(blockType) {
    const flowers = [
      'dandelion', 'poppy', 'blue_orchid', 'allium', 'azure_bluet',
      'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip', 'oxeye_daisy',
      'cornflower', 'lily_of_the_valley', 'sunflower', 'lilac', 'rose_bush',
      'peony', 'torchflower'
    ];
    
    return flowers.includes(blockType);
  }

  /**
   * Shuffle an array in-place
   * @param {Array} array - Array to shuffle
   * @param {Object} random - Random generator
   */
  shuffleArray(array, random) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = random.nextInt(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

module.exports = CherryTree; 