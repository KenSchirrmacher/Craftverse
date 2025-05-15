/**
 * Ancient City Generator - Handles generation of Ancient City structures
 * for the Deep Dark biome in the Wild Update
 */

class AncientCityGenerator {
  /**
   * Create a new AncientCityGenerator
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    
    // Initialize block palettes
    this.palettes = {
      primary: {
        main: { type: 'deepslate_tiles' },
        cracked: { type: 'cracked_deepslate_tiles' },
        brick: { type: 'deepslate_bricks' },
        cobbled: { type: 'cobbled_deepslate' },
        reinforced: { type: 'reinforced_deepslate' }
      },
      accent: {
        sculk: { type: 'sculk' },
        catalyst: { type: 'sculk_catalyst' },
        sensor: { type: 'sculk_sensor' },
        shrieker: { type: 'sculk_shrieker' },
        vein: { type: 'sculk_vein' }
      },
      decoration: {
        soulFire: { type: 'soul_fire' },
        soulLantern: { type: 'soul_lantern' },
        candle: { type: 'candle' }
      }
    };
  }
  
  /**
   * Generate an Ancient City structure
   * @param {Object} position - Position {x, y, z}
   * @param {Object} options - Additional options
   * @param {Function} blockSetter - Function to set blocks
   * @param {Function} entitySpawner - Function to spawn entities
   * @returns {Object} Generated structure data
   */
  generateAncientCity(position, options, blockSetter, entitySpawner) {
    const { x, y, z } = position;
    
    // Ancient Cities should be generated deep underground
    const baseY = Math.min(y, 25);
    
    // Structure dimensions
    const width = 108;
    const height = 20;
    const depth = 108;
    
    // Track rooms and features
    const rooms = [];
    const corridors = [];
    const features = [];
    
    // Generate the main structure
    this.generateMainPlatform(x, baseY, z, width, depth, blockSetter);
    this.generateCenterStructure(x, baseY, z, blockSetter, features);
    this.generatePathwaysAndRooms(x, baseY, z, blockSetter, rooms, corridors);
    this.generateSculkGrowth(x, baseY, z, width, depth, blockSetter);
    this.addDecorations(x, baseY, z, width, depth, blockSetter);
    
    // Add some treasure chests with loot
    this.addLootChests(x, baseY, z, blockSetter, rooms);
    
    // Return structure data
    return {
      type: 'ancient_city',
      position: { x, y: baseY, z },
      size: { width, height, depth },
      rooms,
      corridors,
      features
    };
  }
  
  /**
   * Generate the main platform for the Ancient City
   * @private
   */
  generateMainPlatform(x, y, z, width, depth, blockSetter) {
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Generate the main platform with deepslate tiles
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dz = -halfDepth; dz <= halfDepth; dz++) {
        // Skip corners for more natural shape
        if (Math.sqrt(Math.pow(dx/halfWidth, 2) + Math.pow(dz/halfDepth, 2)) > 0.9) {
          if (Math.random() < 0.7) continue;
        }
        
        // Choose block type
        const blockType = Math.random() < 0.7 ? 
          this.palettes.primary.main : 
          (Math.random() < 0.5 ? this.palettes.primary.brick : this.palettes.primary.cracked);
        
        blockSetter(`${x + dx},${y},${z + dz}`, blockType);
      }
    }
  }
  
  /**
   * Generate the central structure with the altar
   * @private
   */
  generateCenterStructure(x, y, z, blockSetter, features) {
    // Central structure size
    const radius = 15;
    const height = 12;
    
    // Generate circular central structure
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        // Calculate distance for circular shape
        const distance = Math.sqrt(dx*dx + dz*dz);
        
        if (distance <= radius) {
          // Floor uses deepslate bricks
          blockSetter(`${x + dx},${y + 1},${z + dz}`, this.palettes.primary.brick);
          
          // Walls use deepslate tiles
          if (distance >= radius - 1) {
            for (let dy = 2; dy <= height; dy++) {
              // Add some cracks for detail
              const blockType = Math.random() < 0.25 ? 
                this.palettes.primary.cracked : this.palettes.primary.main;
              
              blockSetter(`${x + dx},${y + dy},${z + dz}`, blockType);
            }
          } else {
            // Clear interior
            for (let dy = 2; dy <= height; dy++) {
              blockSetter(`${x + dx},${y + dy},${z + dz}`, { type: 'air' });
            }
          }
        }
      }
    }
    
    // Add central altar with reinforced deepslate
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        if (Math.abs(dx) + Math.abs(dz) <= 5) {
          blockSetter(`${x + dx},${y + 2},${z + dz}`, this.palettes.primary.reinforced);
        }
      }
    }
    
    // Add soul fire in the center
    blockSetter(`${x},${y + 3},${z}`, this.palettes.decoration.soulFire);
    
    // Add sculk sensors and shriekers around the altar
    blockSetter(`${x + 2},${y + 3},${z}`, this.palettes.accent.sensor);
    blockSetter(`${x - 2},${y + 3},${z}`, this.palettes.accent.sensor);
    blockSetter(`${x},${y + 3},${z + 2}`, this.palettes.accent.sensor);
    blockSetter(`${x},${y + 3},${z - 2}`, this.palettes.accent.sensor);
    
    blockSetter(`${x + 1},${y + 3},${z + 1}`, this.palettes.accent.shrieker);
    blockSetter(`${x - 1},${y + 3},${z - 1}`, this.palettes.accent.shrieker);
    
    // Add to features list
    features.push({
      type: 'central_altar',
      position: { x, y: y + 2, z },
      reinforcedDeepslate: true,
      soulFire: true
    });
    
    // Create doorways
    const doorways = [
      { dx: 0, dz: radius, direction: 'south' },
      { dx: 0, dz: -radius, direction: 'north' },
      { dx: radius, dz: 0, direction: 'east' },
      { dx: -radius, dz: 0, direction: 'west' }
    ];
    
    doorways.forEach(door => {
      for (let dy = 1; dy <= 3; dy++) {
        blockSetter(`${x + door.dx},${y + dy + 1},${z + door.dz}`, { type: 'air' });
      }
    });
  }
  
  /**
   * Generate pathways and rooms connecting from the center
   * @private
   */
  generatePathwaysAndRooms(x, y, z, blockSetter, rooms, corridors) {
    // Main pathways
    const pathways = [
      { dx: 0, dz: 1, length: 40, direction: 'south' },
      { dx: 0, dz: -1, length: 40, direction: 'north' },
      { dx: 1, dz: 0, length: 40, direction: 'east' },
      { dx: -1, dz: 0, length: 40, direction: 'west' }
    ];
    
    pathways.forEach(path => {
      this.generatePathway(
        x, y, z,
        path.dx, path.dz,
        path.length,
        blockSetter,
        corridors
      );
      
      // Add rooms along the pathway
      const roomCount = 1 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < roomCount; i++) {
        const distance = 15 + Math.floor(Math.random() * (path.length - 20));
        const roomX = x + (path.dx * distance);
        const roomZ = z + (path.dz * distance);
        
        // Add a side room
        this.generateRoom(
          roomX, y, roomZ,
          5 + Math.floor(Math.random() * 4),
          4 + Math.floor(Math.random() * 2),
          5 + Math.floor(Math.random() * 4),
          blockSetter,
          rooms
        );
      }
    });
    
    // Add some treasure rooms
    this.generateTreasureRooms(x, y, z, blockSetter, rooms);
  }
  
  /**
   * Generate a single pathway
   * @private
   */
  generatePathway(startX, startY, startZ, dirX, dirZ, length, blockSetter, corridors) {
    // Pathway width
    const width = 5;
    const halfWidth = Math.floor(width / 2);
    
    for (let i = 0; i < length; i++) {
      const pathX = startX + (dirX * i);
      const pathZ = startZ + (dirZ * i);
      
      // Create path blocks
      for (let offset = -halfWidth; offset <= halfWidth; offset++) {
        const dx = dirZ !== 0 ? offset : 0;
        const dz = dirX !== 0 ? offset : 0;
        
        // Path floor
        const floorBlock = Math.random() < 0.7 ? 
          this.palettes.primary.main : 
          (Math.random() < 0.5 ? this.palettes.primary.brick : this.palettes.primary.cracked);
        
        blockSetter(`${pathX + dx},${startY + 1},${pathZ + dz}`, floorBlock);
        
        // Add occasional decorations along the path
        if (Math.abs(offset) === halfWidth && i % 8 === 0) {
          // Add pillars/columns
          for (let dy = 2; dy <= 4; dy++) {
            blockSetter(`${pathX + dx},${startY + dy},${pathZ + dz}`, this.palettes.primary.brick);
          }
          
          // Add lighting
          if (Math.random() < 0.7) {
            blockSetter(`${pathX + dx},${startY + 3},${pathZ + dz}`, 
              this.palettes.decoration.soulLantern);
          }
        }
        
        // Sometimes add sculk on the path
        if (Math.random() < 0.05 && Math.abs(offset) < halfWidth) {
          blockSetter(`${pathX + dx},${startY + 2},${pathZ + dz}`, this.palettes.accent.sculk);
        }
      }
    }
    
    // Record corridor data
    corridors.push({
      start: { x: startX, y: startY + 1, z: startZ },
      end: { 
        x: startX + (dirX * length), 
        y: startY + 1, 
        z: startZ + (dirZ * length) 
      },
      width,
      direction: dirX !== 0 ? (dirX > 0 ? 'east' : 'west') : (dirZ > 0 ? 'south' : 'north')
    });
  }
  
  /**
   * Generate a single room
   * @private
   */
  generateRoom(x, y, z, width, height, depth, blockSetter, rooms) {
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Generate the room structure
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      for (let dz = -halfDepth; dz <= halfDepth; dz++) {
        for (let dy = 0; dy <= height; dy++) {
          // Determine if this is wall, floor, or ceiling
          const isWall = dx === -halfWidth || dx === halfWidth || dz === -halfDepth || dz === halfDepth;
          const isFloor = dy === 0;
          const isCeiling = dy === height;
          
          if (isWall || isFloor || isCeiling) {
            // Choose block type based on position
            let blockType;
            
            if (isFloor) {
              blockType = Math.random() < 0.7 ? 
                this.palettes.primary.brick : 
                this.palettes.primary.cobbled;
            } else {
              blockType = Math.random() < 0.75 ? 
                this.palettes.primary.main : 
                this.palettes.primary.cracked;
            }
            
            blockSetter(`${x + dx},${y + dy + 1},${z + dz}`, blockType);
          } else {
            // Interior space
            blockSetter(`${x + dx},${y + dy + 1},${z + dz}`, { type: 'air' });
          }
        }
      }
    }
    
    // Add doorway
    let doorX, doorZ;
    if (Math.random() < 0.5) {
      // Door on X-axis wall
      doorX = Math.random() < 0.5 ? -halfWidth : halfWidth;
      doorZ = 0;
    } else {
      // Door on Z-axis wall
      doorX = 0;
      doorZ = Math.random() < 0.5 ? -halfDepth : halfDepth;
    }
    
    // Create doorway
    for (let dy = 1; dy <= 2; dy++) {
      blockSetter(`${x + doorX},${y + dy + 1},${z + doorZ}`, { type: 'air' });
    }
    
    // Add room to list
    rooms.push({
      type: 'standard_room',
      position: { x, y: y + 1, z },
      size: { width, height, depth }
    });
  }
  
  /**
   * Generate treasure rooms with valuable loot
   * @private
   */
  generateTreasureRooms(x, y, z, blockSetter, rooms) {
    // Generate 2-3 treasure rooms
    const treasureRoomCount = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < treasureRoomCount; i++) {
      // Position somewhat far from center
      const angle = (i * 2 * Math.PI / treasureRoomCount) + (Math.random() * 0.5);
      const distance = 30 + Math.floor(Math.random() * 20);
      
      const roomX = x + Math.round(Math.cos(angle) * distance);
      const roomZ = z + Math.round(Math.sin(angle) * distance);
      
      // Room dimensions
      const width = 7;
      const height = 5;
      const depth = 7;
      
      const halfWidth = Math.floor(width / 2);
      const halfDepth = Math.floor(depth / 2);
      
      // Generate room structure
      for (let dx = -halfWidth; dx <= halfWidth; dx++) {
        for (let dz = -halfDepth; dz <= halfDepth; dz++) {
          for (let dy = 0; dy <= height; dy++) {
            // Determine if this is wall, floor, or ceiling
            const isWall = dx === -halfWidth || dx === halfWidth || dz === -halfDepth || dz === halfDepth;
            const isFloor = dy === 0;
            const isCeiling = dy === height;
            
            if (isWall || isFloor || isCeiling) {
              // Use reinforced deepslate for some parts (especially corners)
              if ((Math.abs(dx) === halfWidth && Math.abs(dz) === halfDepth) || Math.random() < 0.3) {
                blockSetter(`${roomX + dx},${y + dy + 1},${roomZ + dz}`, this.palettes.primary.reinforced);
              } else {
                const blockType = isFloor ? this.palettes.primary.brick : this.palettes.primary.main;
                blockSetter(`${roomX + dx},${y + dy + 1},${roomZ + dz}`, blockType);
              }
            } else {
              // Interior space
              blockSetter(`${roomX + dx},${y + dy + 1},${roomZ + dz}`, { type: 'air' });
            }
          }
        }
      }
      
      // Add small hidden entrance
      let entranceX, entranceZ;
      if (Math.random() < 0.5) {
        entranceX = halfWidth;
        entranceZ = 0;
      } else {
        entranceX = 0;
        entranceZ = halfDepth;
      }
      
      // Just make a 1-block doorway
      blockSetter(`${roomX + entranceX},${y + 2},${roomZ + entranceZ}`, { type: 'air' });
      
      // Add chest with treasure loot
      blockSetter(`${roomX},${y + 2},${roomZ}`, { 
        type: 'chest', 
        metadata: { 
          loot: 'ancient_city_treasure',
          items: [
            { type: 'echo_shard', count: 1 + Math.floor(Math.random() * 3) },
            { type: 'music_disc_otherside', count: Math.random() < 0.5 ? 1 : 0 },
            { type: 'enchanted_book', enchantment: 'swift_sneak' }
          ]
        } 
      });
      
      // Add sculk items as traps
      blockSetter(`${roomX + 1},${y + 2},${roomZ + 1}`, this.palettes.accent.sensor);
      blockSetter(`${roomX - 1},${y + 2},${roomZ - 1}`, this.palettes.accent.shrieker);
      
      // Add candles for lighting/decoration
      blockSetter(`${roomX + 1},${y + 2},${roomZ - 1}`, this.palettes.decoration.candle);
      blockSetter(`${roomX - 1},${y + 2},${roomZ + 1}`, this.palettes.decoration.candle);
      
      // Record room data
      rooms.push({
        type: 'treasure_room',
        position: { roomX, y: y + 1, roomZ },
        size: { width, height, depth },
        reinforcedDeepslate: true,
        treasureChest: true
      });
    }
  }
  
  /**
   * Generate sculk growth patches throughout the city
   * @private
   */
  generateSculkGrowth(x, y, z, width, depth, blockSetter) {
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Create several sculk patches
    const patchCount = 15 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < patchCount; i++) {
      // Random position within the city
      const patchX = x + Math.floor(Math.random() * width) - halfWidth;
      const patchZ = z + Math.floor(Math.random() * depth) - halfDepth;
      
      // Random patch size
      const patchRadius = 3 + Math.floor(Math.random() * 5);
      
      // Create the sculk patch
      for (let dx = -patchRadius; dx <= patchRadius; dx++) {
        for (let dz = -patchRadius; dz <= patchRadius; dz++) {
          // Determine distance for circular shape
          const distance = Math.sqrt(dx*dx + dz*dz);
          
          if (distance <= patchRadius && Math.random() < (1 - distance/patchRadius)) {
            // Add sculk block
            blockSetter(`${patchX + dx},${y + 1},${patchZ + dz}`, this.palettes.accent.sculk);
            
            // Add veins in some places
            if (Math.random() < 0.3) {
              blockSetter(`${patchX + dx},${y + 2},${patchZ + dz}`, this.palettes.accent.vein);
            }
          }
        }
      }
      
      // Occasionally add special sculk blocks
      if (Math.random() < 0.3) {
        blockSetter(`${patchX},${y + 1},${patchZ}`, this.palettes.accent.sensor);
      }
      
      if (Math.random() < 0.15) {
        blockSetter(`${patchX},${y + 1},${patchZ}`, this.palettes.accent.catalyst);
      }
      
      if (Math.random() < 0.1) {
        blockSetter(`${patchX},${y + 1},${patchZ}`, this.palettes.accent.shrieker);
      }
    }
  }
  
  /**
   * Add decorations throughout the city
   * @private
   */
  addDecorations(x, y, z, width, depth, blockSetter) {
    const halfWidth = Math.floor(width / 2);
    const halfDepth = Math.floor(depth / 2);
    
    // Add columns
    const columnCount = 20 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < columnCount; i++) {
      // Random position
      const colX = x + Math.floor(Math.random() * width) - halfWidth;
      const colZ = z + Math.floor(Math.random() * depth) - halfDepth;
      
      // Random height
      const columnHeight = 4 + Math.floor(Math.random() * 5);
      
      // Create column
      for (let dy = 1; dy <= columnHeight; dy++) {
        const blockType = Math.random() < 0.7 ? 
          this.palettes.primary.main : 
          this.palettes.primary.brick;
        
        blockSetter(`${colX},${y + dy},${colZ}`, blockType);
      }
      
      // Add lantern on top of some columns
      if (Math.random() < 0.3) {
        blockSetter(`${colX},${y + columnHeight + 1},${colZ}`, this.palettes.decoration.soulLantern);
      }
    }
    
    // Add soul fire braziers
    const brazierCount = 5 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < brazierCount; i++) {
      const brazierX = x + Math.floor(Math.random() * width) - halfWidth;
      const brazierZ = z + Math.floor(Math.random() * depth) - halfDepth;
      
      // Cobbled base
      blockSetter(`${brazierX},${y + 1},${brazierZ}`, this.palettes.primary.cobbled);
      
      // Soul fire on top
      blockSetter(`${brazierX},${y + 2},${brazierZ}`, this.palettes.decoration.soulFire);
    }
  }
  
  /**
   * Add loot chests throughout the structure
   * @private
   */
  addLootChests(x, y, z, blockSetter, rooms) {
    // Add chests to some standard rooms
    for (let room of rooms) {
      if (room.type === 'standard_room' && Math.random() < 0.4) {
        // Add a chest with standard loot
        blockSetter(`${room.position.x},${room.position.y + 1},${room.position.z}`, {
          type: 'chest',
          metadata: { loot: 'ancient_city' }
        });
        
        room.hasChest = true;
      }
    }
  }
}

module.exports = AncientCityGenerator; 