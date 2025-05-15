/**
 * Ancient City Generator
 * Handles the generation of Ancient City structures in the Deep Dark biome
 */

class AncientCityGenerator {
  /**
   * Create a new Ancient City Generator
   * @param {Object} options - Configuration options
   * @param {number} options.seed - Seed for generation
   */
  constructor(options = {}) {
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    this.palettes = this.initializePalettes();
  }

  /**
   * Initialize block palettes for different parts of the city
   * @private
   * @returns {Object} - Block palettes
   */
  initializePalettes() {
    return {
      primary: {
        main: { type: 'deepslate_tiles' },
        cracked: { type: 'cracked_deepslate_tiles' },
        brick: { type: 'deepslate_bricks' },
        crackedBrick: { type: 'cracked_deepslate_bricks' },
        cobbled: { type: 'cobbled_deepslate' },
        reinforced: { type: 'reinforced_deepslate' }
      },
      accent: {
        sculk: { type: 'sculk' },
        sculkCatalyst: { type: 'sculk_catalyst' },
        sculkSensor: { type: 'sculk_sensor' },
        sculkShrieker: { type: 'sculk_shrieker' },
        sculkVein: { type: 'sculk_vein' }
      },
      decoration: {
        soulFire: { type: 'soul_fire' },
        soulLantern: { type: 'soul_lantern' },
        soulTorch: { type: 'soul_torch' },
        candle: { type: 'candle' }
      }
    };
  }

  /**
   * Generate an Ancient City at the specified position
   * @param {Object} position - Position {x, y, z}
   * @param {Object} options - Additional generation options
   * @param {Function} blockSetter - Function to set blocks in the world
   * @returns {Object} - Structure data
   */
  generateAncientCity(position, options = {}, blockSetter) {
    const { x, y, z } = position;
    
    // Adjust Y position to be deep underground
    const baseY = Math.min(y, 20);
    
    // Structure parameters
    const width = 108;
    const height = 20;
    const depth = 108;
    
    // Track rooms and features
    const rooms = [];
    const specialFeatures = [];
    
    // Generate the base platform
    this.generateCityBase(x, baseY, z, width, depth, blockSetter);
    
    // Generate the central structure with altar
    this.generateCentralStructure(x, baseY, z, blockSetter, specialFeatures);
    
    // Generate pathways and side buildings
    this.generatePathways(x, baseY, z, blockSetter, rooms);
    
    // Add sculk growth throughout the city
    this.addSculkGrowth(x, baseY, z, width, height, depth, blockSetter);
    
    // Add treasure rooms with loot
    this.generateTreasureRooms(x, baseY, z, blockSetter, rooms);
    
    // Add decorative features
    this.addDecorativeFeatures(x, baseY, z, width, depth, blockSetter);
    
    return {
      type: 'ancient_city',
      position: { x, y: baseY, z },
      size: { width, height, depth },
      rooms,
      specialFeatures
    };
  }

  /**
   * Generate the base platform for the Ancient City
   * @private
   * @param {number} x - Center X coordinate
   * @param {number} y - Base Y coordinate
   * @param {number} z - Center Z coordinate
   * @param {number} width - Width of the city
   * @param {number} depth - Depth of the city
   * @param {Function} blockSetter - Function to set blocks
   */
  generateCityBase(x, y, z, width, depth, blockSetter) {
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Create the base platform
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dz = -halfDepth; dz <= halfDepth; dz++) {
        // Skip edges for irregular shape
        if (Math.sqrt(Math.pow(dx/halfWidth, 2) + Math.pow(dz/halfDepth, 2)) > 0.9) {
          if (Math.random() < 0.7) continue;
        }
        
        // Base layer (mix of deepslate tiles and bricks)
        const baseBlock = Math.random() < 0.7 
          ? this.palettes.primary.main 
          : (Math.random() < 0.5 ? this.palettes.primary.brick : this.palettes.primary.cracked);
        
        blockSetter(`${x + dx},${y},${z + dz}`, baseBlock);
        
        // Add some sculk on the floor
        if (Math.random() < 0.1) {
          blockSetter(`${x + dx},${y + 1},${z + dz}`, this.palettes.accent.sculk);
        }
      }
    }
  }

  /**
   * Generate the central structure with altar
   * @private
   * @param {number} x - Center X coordinate
   * @param {number} y - Base Y coordinate
   * @param {number} z - Center Z coordinate
   * @param {Function} blockSetter - Function to set blocks
   * @param {Array} specialFeatures - Array to add special features to
   */
  generateCentralStructure(x, y, z, blockSetter, specialFeatures) {
    // Central structure dimensions
    const width = 21;
    const height = 12;
    const depth = 21;
    
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Create the central chamber
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dz = -halfDepth; dz <= halfDepth; dz++) {
        for (let dy = 1; dy <= height; dy++) {
          // Calculate distance from center for circular shape
          const distance = Math.sqrt(dx*dx + dz*dz);
          
          // Walls/floor/ceiling
          if (distance >= halfWidth - 1 || dy === 1 || dy === height) {
            const wallBlock = dy === 1 ? this.palettes.primary.brick : this.palettes.primary.main;
            
            // Add cracked variants for worn look
            if (Math.random() < 0.25) {
              blockSetter(`${x + dx},${y + dy},${z + dz}`, 
                dy === 1 ? this.palettes.primary.crackedBrick : this.palettes.primary.cracked);
            } else {
              blockSetter(`${x + dx},${y + dy},${z + dz}`, wallBlock);
            }
          } else {
            // Interior space (air)
            blockSetter(`${x + dx},${y + dy},${z + dz}`, { type: 'air' });
          }
        }
      }
    }
    
    // Create doorways/entrances
    const doorwayPositions = [
      { dx: 0, dz: halfDepth, direction: 'south' },
      { dx: 0, dz: -halfDepth, direction: 'north' },
      { dx: halfWidth, dz: 0, direction: 'east' },
      { dx: -halfWidth, dz: 0, direction: 'west' }
    ];
    
    doorwayPositions.forEach(door => {
      for (let dy = 1; dy <= 3; dy++) {
        blockSetter(`${x + door.dx},${y + dy},${z + door.dz}`, { type: 'air' });
      }
    });
    
    // Create altar at the center
    this.generateCentralAltar(x, y, z, blockSetter, specialFeatures);
  }

  /**
   * Generate central altar with reinforced deepslate and soul fire
   * @private
   * @param {number} x - Center X coordinate
   * @param {number} y - Base Y coordinate
   * @param {number} z - Center Z coordinate
   * @param {Function} blockSetter - Function to set blocks
   * @param {Array} specialFeatures - Array to add special features to
   */
  generateCentralAltar(x, y, z, blockSetter, specialFeatures) {
    // Create reinforced deepslate platform
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        // Reinforced deepslate base
        blockSetter(`${x + dx},${y + 1},${z + dz}`, this.palettes.primary.reinforced);
      }
    }
    
    // Add soul fire in the center
    blockSetter(`${x},${y + 2},${z}`, this.palettes.decoration.soulFire);
    
    // Add sculk sensors around the altar
    blockSetter(`${x + 2},${y + 2},${z}`, this.palettes.accent.sculkSensor);
    blockSetter(`${x - 2},${y + 2},${z}`, this.palettes.accent.sculkSensor);
    blockSetter(`${x},${y + 2},${z + 2}`, this.palettes.accent.sculkSensor);
    blockSetter(`${x},${y + 2},${z - 2}`, this.palettes.accent.sculkSensor);
    
    // Add sculk catalyst near the altar
    blockSetter(`${x + 2},${y + 2},${z + 2}`, this.palettes.accent.sculkCatalyst);
    blockSetter(`${x - 2},${y + 2},${z - 2}`, this.palettes.accent.sculkCatalyst);
    
    // Add sculk shrieker with warning level
    blockSetter(`${x + 1},${y + 2},${z + 1}`, this.palettes.accent.sculkShrieker);
    blockSetter(`${x - 1},${y + 2},${z - 1}`, this.palettes.accent.sculkShrieker);
    
    // Add this as a special feature
    specialFeatures.push({
      type: 'central_altar',
      position: { x, y: y + 1, z },
      soulFire: true,
      hasReinforcedDeepslate: true
    });
  }

  /**
   * Generate pathways connecting to the central structure
   * @private
   * @param {number} x - Center X coordinate
   * @param {number} y - Base Y coordinate
   * @param {number} z - Center Z coordinate
   * @param {Function} blockSetter - Function to set blocks
   * @param {Array} rooms - Array to add rooms to
   */
  generatePathways(x, y, z, blockSetter, rooms) {
    // Primary pathways from the central chamber
    const pathways = [
      { dx: 0, dz: 1, length: 40, direction: 'south' },
      { dx: 0, dz: -1, length: 40, direction: 'north' },
      { dx: 1, dz: 0, length: 40, direction: 'east' },
      { dx: -1, dz: 0, length: 40, direction: 'west' }
    ];
    
    pathways.forEach(path => {
      // Create the main pathway
      this.generatePathway(
        x, y, z,
        path.dx, path.dz,
        path.length,
        blockSetter
      );
      
      // Add rooms along the pathway
      const numRooms = 1 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < numRooms; i++) {
        // Position along the pathway
        const distance = 15 + Math.floor(Math.random() * (path.length - 20));
        const roomX = x + (path.dx * distance);
        const roomZ = z + (path.dz * distance);
        
        // Create a small room
        const roomData = this.generateRoom(
          roomX, y, roomZ,
          3 + Math.floor(Math.random() * 3),
          2 + Math.floor(Math.random() * 2),
          3 + Math.floor(Math.random() * 3),
          blockSetter
        );
        
        rooms.push(roomData);
      }
    });
  }

  /**
   * Generate a single pathway
   * @private
   * @param {number} startX - Start X coordinate
   * @param {number} startY - Start Y coordinate
   * @param {number} startZ - Start Z coordinate
   * @param {number} dirX - X direction (0, 1, or -1)
   * @param {number} dirZ - Z direction (0, 1, or -1)
   * @param {number} length - Length of the pathway
   * @param {Function} blockSetter - Function to set blocks
   */
  generatePathway(startX, startY, startZ, dirX, dirZ, length, blockSetter) {
    for (let i = 0; i < length; i++) {
      const pathX = startX + (dirX * i);
      const pathZ = startZ + (dirZ * i);
      
      // Create path blocks (5 blocks wide)
      for (let offset = -2; offset <= 2; offset++) {
        const dx = dirZ !== 0 ? offset : 0;
        const dz = dirX !== 0 ? offset : 0;
        
        // Path floor
        const pathBlock = Math.random() < 0.7 
          ? this.palettes.primary.main 
          : (Math.random() < 0.5 ? this.palettes.primary.brick : this.palettes.primary.cracked);
        
        blockSetter(`${pathX + dx},${startY + 1},${pathZ + dz}`, pathBlock);
        
        // Occasionally add sculk on the path
        if (Math.random() < 0.07) {
          blockSetter(`${pathX + dx},${startY + 2},${pathZ + dz}`, this.palettes.accent.sculk);
        }
        
        // Occasionally add soul lanterns for lighting
        if (Math.abs(offset) === 2 && i % 8 === 0 && Math.random() < 0.7) {
          blockSetter(`${pathX + dx},${startY + 3},${pathZ + dz}`, this.palettes.decoration.soulLantern);
        }
      }
    }
  }

  /**
   * Generate a room along the pathway
   * @private
   * @param {number} x - Center X coordinate
   * @param {number} y - Base Y coordinate
   * @param {number} z - Center Z coordinate
   * @param {number} width - Width of the room
   * @param {number} height - Height of the room
   * @param {number} depth - Depth of the room
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Room data
   */
  generateRoom(x, y, z, width, height, depth, blockSetter) {
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Create the room structure
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dz = -halfDepth; dz <= halfDepth; dz++) {
        for (let dy = 0; dy <= height + 1; dy++) {
          // Walls/floor/ceiling
          if (Math.abs(dx) === halfWidth || Math.abs(dz) === halfDepth || dy === 0 || dy === height + 1) {
            const wallBlock = dy === 0 ? this.palettes.primary.brick : this.palettes.primary.main;
            
            // Add cracked variants for worn look
            if (Math.random() < 0.25) {
              blockSetter(`${x + dx},${y + dy + 1},${z + dz}`, 
                dy === 0 ? this.palettes.primary.crackedBrick : this.palettes.primary.cracked);
            } else {
              blockSetter(`${x + dx},${y + dy + 1},${z + dz}`, wallBlock);
            }
          } else {
            // Interior space (air)
            blockSetter(`${x + dx},${y + dy + 1},${z + dz}`, { type: 'air' });
          }
        }
      }
    }
    
    // Add a doorway
    const doorPosition = Math.random() < 0.5 ? 
      { dx: 0, dz: halfDepth, direction: 'south' } : 
      { dx: halfWidth, dz: 0, direction: 'east' };
    
    for (let dy = 1; dy <= 2; dy++) {
      blockSetter(`${x + doorPosition.dx},${y + dy + 1},${z + doorPosition.dz}`, { type: 'air' });
    }
    
    // Add some decorations inside
    if (Math.random() < 0.4) {
      // Add chest with loot
      blockSetter(`${x},${y + 2},${z}`, { type: 'chest', metadata: { loot: 'ancient_city' } });
    }
    
    // Add sculk features
    if (Math.random() < 0.3) {
      // Add sculk sensor
      blockSetter(`${x - 1},${y + 2},${z - 1}`, this.palettes.accent.sculkSensor);
    }
    
    // Add lighting
    blockSetter(`${x},${y + height},${z}`, this.palettes.decoration.soulLantern);
    
    return {
      type: 'room',
      position: { x, y: y + 1, z },
      size: { width, height, depth },
      hasChest: Math.random() < 0.4
    };
  }

  /**
   * Generate treasure rooms throughout the city
   * @private
   * @param {number} x - Center X coordinate
   * @param {number} y - Base Y coordinate
   * @param {number} z - Center Z coordinate
   * @param {Function} blockSetter - Function to set blocks
   * @param {Array} rooms - Array to add treasure rooms to
   */
  generateTreasureRooms(x, y, z, blockSetter, rooms) {
    // Create 2-3 treasure rooms
    const numTreasureRooms = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numTreasureRooms; i++) {
      // Position somewhat far from center
      const distance = 30 + Math.random() * 20;
      const angle = (i * (Math.PI * 2 / numTreasureRooms)) + (Math.random() * 0.5);
      
      const roomX = x + Math.round(Math.cos(angle) * distance);
      const roomZ = z + Math.round(Math.sin(angle) * distance);
      
      // Create the treasure room
      const treasureRoom = this.generateTreasureRoom(roomX, y, roomZ, blockSetter);
      rooms.push(treasureRoom);
    }
  }

  /**
   * Generate a treasure room with valuable loot
   * @private
   * @param {number} x - Center X coordinate
   * @param {number} y - Base Y coordinate
   * @param {number} z - Center Z coordinate
   * @param {Function} blockSetter - Function to set blocks
   * @returns {Object} - Treasure room data
   */
  generateTreasureRoom(x, y, z, blockSetter) {
    // Room dimensions
    const width = 7;
    const height = 4;
    const depth = 7;
    
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Create the room structure
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dz = -halfDepth; dz <= halfDepth; dz++) {
        for (let dy = 0; dy <= height + 1; dy++) {
          // Walls/floor/ceiling
          if (Math.abs(dx) === halfWidth || Math.abs(dz) === halfDepth || dy === 0 || dy === height + 1) {
            // Use reinforced deepslate for some walls (harder to mine)
            if ((Math.abs(dx) === halfWidth && Math.abs(dz) === halfDepth) || (Math.random() < 0.3)) {
              blockSetter(`${x + dx},${y + dy + 1},${z + dz}`, this.palettes.primary.reinforced);
            } else {
              blockSetter(`${x + dx},${y + dy + 1},${z + dz}`, this.palettes.primary.main);
            }
          } else {
            // Interior space (air)
            blockSetter(`${x + dx},${y + dy + 1},${z + dz}`, { type: 'air' });
          }
        }
      }
    }
    
    // Add hidden entrance (small 1-block doorway)
    const entrancePos = { dx: halfWidth, dz: 0 };
    blockSetter(`${x + entrancePos.dx},${y + 2},${z + entrancePos.dz}`, { type: 'air' });
    
    // Add chest with valuable loot
    blockSetter(`${x},${y + 2},${z}`, { 
      type: 'chest', 
      metadata: { 
        loot: 'ancient_city_treasure',
        items: [
          { type: 'echo_shard', count: 1 + Math.floor(Math.random() * 3) },
          { type: 'enchanted_book', metadata: { enchantment: 'swift_sneak', level: 1 + Math.floor(Math.random() * 3) } },
          { type: 'music_disc_otherside', count: Math.random() < 0.5 ? 1 : 0 }
        ]
      } 
    });
    
    // Add decoration
    for (let i = 0; i < 4; i++) {
      const cornerX = i % 2 === 0 ? -1 : 1;
      const cornerZ = i < 2 ? -1 : 1;
      
      // Add candles in corners
      blockSetter(`${x + cornerX},${y + 2},${z + cornerZ}`, this.palettes.decoration.candle);
    }
    
    // Add sculk sensors as traps/alarm
    blockSetter(`${x + 1},${y + 2},${z}`, this.palettes.accent.sculkSensor);
    blockSetter(`${x - 1},${y + 2},${z}`, this.palettes.accent.sculkSensor);
    
    // Add sculk shrieker as defense
    blockSetter(`${x},${y + 2},${z + 1}`, this.palettes.accent.sculkShrieker);
    
    return {
      type: 'treasure_room',
      position: { x, y: y + 1, z },
      size: { width, height, depth },
      hasTreasureChest: true,
      hasReinforcedDeepslate: true
    };
  }

  /**
   * Add sculk growth throughout the city
   * @private
   * @param {number} x - Center X coordinate
   * @param {number} y - Base Y coordinate
   * @param {number} z - Center Z coordinate
   * @param {number} width - Width of the city
   * @param {number} height - Height of the city
   * @param {number} depth - Depth of the city
   * @param {Function} blockSetter - Function to set blocks
   */
  addSculkGrowth(x, y, z, width, height, depth, blockSetter) {
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Create several sculk patches
    const numPatches = 15 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < numPatches; i++) {
      // Random position within the city
      const patchX = x + Math.floor(Math.random() * width) - halfWidth;
      const patchZ = z + Math.floor(Math.random() * depth) - halfDepth;
      
      // Random patch size
      const patchSize = 3 + Math.floor(Math.random() * 5);
      
      // Create sculk growth
      for (let dx = -patchSize; dx <= patchSize; dx++) {
        for (let dz = -patchSize; dz <= patchSize; dz++) {
          // Calculate distance from center for circular shape
          const distance = Math.sqrt(dx*dx + dz*dz);
          
          // Only place within radius and fade out at edges
          if (distance <= patchSize && Math.random() < (1 - distance/patchSize)) {
            // Main sculk block
            blockSetter(`${patchX + dx},${y + 1},${patchZ + dz}`, this.palettes.accent.sculk);
            
            // Add veins on nearby blocks
            if (Math.random() < 0.3) {
              blockSetter(`${patchX + dx},${y + 2},${patchZ + dz}`, this.palettes.accent.sculkVein);
            }
          }
        }
      }
      
      // Occasionally add special sculk blocks
      if (Math.random() < 0.4) {
        blockSetter(`${patchX},${y + 1},${patchZ}`, this.palettes.accent.sculkSensor);
      }
      
      if (Math.random() < 0.2) {
        blockSetter(`${patchX},${y + 1},${patchZ}`, this.palettes.accent.sculkCatalyst);
      }
      
      if (Math.random() < 0.1) {
        blockSetter(`${patchX},${y + 1},${patchZ}`, this.palettes.accent.sculkShrieker);
      }
    }
  }

  /**
   * Add decorative features throughout the city
   * @private
   * @param {number} x - Center X coordinate
   * @param {number} y - Base Y coordinate
   * @param {number} z - Center Z coordinate
   * @param {number} width - Width of the city
   * @param {number} depth - Depth of the city
   * @param {Function} blockSetter - Function to set blocks
   */
  addDecorativeFeatures(x, y, z, width, depth, blockSetter) {
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Add decorative columns
    const numColumns = 20 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < numColumns; i++) {
      // Random position within the city
      const colX = x + Math.floor(Math.random() * width) - halfWidth;
      const colZ = z + Math.floor(Math.random() * depth) - halfDepth;
      
      // Random height
      const colHeight = 4 + Math.floor(Math.random() * 6);
      
      // Create column
      for (let dy = 0; dy < colHeight; dy++) {
        // Use mix of deepslate blocks for texture
        const blockType = Math.random() < 0.7 
          ? this.palettes.primary.main 
          : (Math.random() < 0.5 ? this.palettes.primary.brick : this.palettes.primary.cracked);
        
        blockSetter(`${colX},${y + dy + 1},${colZ}`, blockType);
      }
      
      // Add soul lantern on top for some columns
      if (Math.random() < 0.3) {
        blockSetter(`${colX},${y + colHeight + 1},${colZ}`, this.palettes.decoration.soulLantern);
      }
    }
    
    // Add soul fire braziers
    const numBraziers = 5 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < numBraziers; i++) {
      // Random position within the city
      const brazierX = x + Math.floor(Math.random() * width) - halfWidth;
      const brazierZ = z + Math.floor(Math.random() * depth) - halfDepth;
      
      // Create brazier base
      blockSetter(`${brazierX},${y + 1},${brazierZ}`, this.palettes.primary.cobbled);
      
      // Add soul fire on top
      blockSetter(`${brazierX},${y + 2},${brazierZ}`, this.palettes.decoration.soulFire);
    }
  }
}

module.exports = AncientCityGenerator; 