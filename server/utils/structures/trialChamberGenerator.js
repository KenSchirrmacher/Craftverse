/**
 * TrialChamberGenerator - Generates Trial Chamber structures for the 1.21 Update
 * Handles procedural generation of rooms, hallways, and populating with trial spawners
 */

const TrialSpawnerBlock = require('../../blocks/trialSpawner');

class TrialChamberGenerator {
  /**
   * Create a new Trial Chamber generator
   * @param {Object} world - World instance
   */
  constructor(world) {
    this.world = world;
    this.random = world ? world.random : Math.random;
    
    // Trial Chamber configuration
    this.config = {
      minRooms: 5,
      maxRooms: 8,
      roomSizeMin: 7,
      roomSizeMax: 12,
      corridorWidth: 3,
      maxAttempts: 50,
      yRange: { min: -45, max: -20 },
      defaultBlock: 'deepslate_bricks',
      decorationBlocks: [
        'deepslate_tiles', 
        'cracked_deepslate_bricks', 
        'chiseled_deepslate',
        'deepslate_brick_slab',
        'deepslate_brick_stairs'
      ],
      treasureRoomChance: 0.7, // 70% chance to have a treasure room
      spawnerRoomChance: 0.8,  // 80% chance a room has a spawner
      lootTables: {
        common: 'trial_chambers/common',
        rare: 'trial_chambers/rare',
        epic: 'trial_chambers/epic'
      }
    };
  }
  
  /**
   * Set world reference
   * @param {Object} world - World instance
   */
  setWorld(world) {
    this.world = world;
    this.random = world.random || Math.random;
  }
  
  /**
   * Get a random integer between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random integer
   */
  getRandomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
  
  /**
   * Generate a Trial Chamber structure
   * @param {Object} startPos - Starting position
   * @param {Object} options - Generation options
   * @returns {Object} Generated structure info
   */
  generate(startPos, options = {}) {
    const startTime = Date.now();
    console.log(`Generating Trial Chamber structure at ${JSON.stringify(startPos)}...`);
    
    // Merge options with defaults
    const config = { ...this.config, ...options };
    
    // Initialize structure data
    const structure = {
      position: { ...startPos },
      rooms: [],
      corridors: [],
      spawners: [],
      chests: [],
      bounds: {
        min: { ...startPos },
        max: { ...startPos }
      }
    };
    
    // Determine number of rooms
    const numRooms = this.getRandomInt(config.minRooms, config.maxRooms);
    
    // Generate rooms
    this.generateRooms(structure, numRooms, config);
    
    // Generate corridors between rooms
    this.generateCorridors(structure, config);
    
    // Place trial spawners and loot chests
    this.populateRooms(structure, config);
    
    // Add decorations and details
    this.addDecorations(structure, config);
    
    // Actually build the structure in the world
    this.buildStructure(structure, config);
    
    const endTime = Date.now();
    console.log(`Generated Trial Chamber with ${structure.rooms.length} rooms and ${structure.spawners.length} spawners in ${endTime - startTime}ms`);
    
    return structure;
  }
  
  /**
   * Generate rooms for the structure
   * @param {Object} structure - Structure data
   * @param {number} numRooms - Number of rooms to generate
   * @param {Object} config - Configuration options
   */
  generateRooms(structure, numRooms, config) {
    // Create first room at starting position
    const firstRoom = this.createRoom(
      structure.position,
      this.getRandomInt(config.roomSizeMin, config.roomSizeMax),
      this.getRandomInt(config.roomSizeMin, config.roomSizeMax),
      this.getRandomInt(4, 6) // Height
    );
    
    structure.rooms.push(firstRoom);
    this.updateBounds(structure, firstRoom);
    
    // Generate additional rooms
    let attempts = 0;
    let roomsCreated = 1;
    
    while (roomsCreated < numRooms && attempts < config.maxAttempts) {
      // Pick a random existing room to branch from
      const sourceRoom = structure.rooms[Math.floor(this.random() * structure.rooms.length)];
      
      // Determine direction and distance
      const direction = ['north', 'south', 'east', 'west'][Math.floor(this.random() * 4)];
      const distance = this.getRandomInt(4, 8); // Distance between rooms
      
      // Calculate new room position
      let newPos = { ...sourceRoom.center };
      switch (direction) {
        case 'north': newPos.z -= sourceRoom.size.z / 2 + distance; break;
        case 'south': newPos.z += sourceRoom.size.z / 2 + distance; break;
        case 'east': newPos.x += sourceRoom.size.x / 2 + distance; break;
        case 'west': newPos.x -= sourceRoom.size.x / 2 + distance; break;
      }
      
      // Y position variation (slight inclines/declines between rooms)
      newPos.y += this.getRandomInt(-1, 1);
      
      // Ensure y position stays within range
      newPos.y = Math.max(config.yRange.min, Math.min(config.yRange.max, newPos.y));
      
      // Create room dimensions
      const roomWidth = this.getRandomInt(config.roomSizeMin, config.roomSizeMax);
      const roomLength = this.getRandomInt(config.roomSizeMin, config.roomSizeMax);
      const roomHeight = this.getRandomInt(4, 6);
      
      // Create the new room
      const newRoom = this.createRoom(newPos, roomWidth, roomLength, roomHeight);
      
      // Check if room overlaps with existing rooms
      const overlaps = structure.rooms.some(room => this.roomsOverlap(newRoom, room, 1));
      
      if (!overlaps) {
        structure.rooms.push(newRoom);
        roomsCreated++;
        this.updateBounds(structure, newRoom);
        
        // Connect rooms with a corridor
        const corridor = this.createCorridor(sourceRoom, newRoom, config.corridorWidth);
        if (corridor) {
          structure.corridors.push(corridor);
        }
      }
      
      attempts++;
    }
    
    // Special rooms
    // If we have enough rooms, designate one as a treasure room
    if (structure.rooms.length >= 3 && this.random() < config.treasureRoomChance) {
      // Select a room that's not the first room and far from entrance
      let bestRoom = null;
      let maxDistance = 0;
      
      for (let i = 1; i < structure.rooms.length; i++) {
        const room = structure.rooms[i];
        const distance = this.calculateDistance(structure.position, room.center);
        
        if (distance > maxDistance) {
          maxDistance = distance;
          bestRoom = room;
        }
      }
      
      if (bestRoom) {
        bestRoom.isSpecial = true;
        bestRoom.specialType = 'treasure';
      }
    }
  }
  
  /**
   * Generate corridors to connect rooms
   * @param {Object} structure - Structure data 
   * @param {Object} config - Configuration options
   */
  generateCorridors(structure, config) {
    // Corridors are already created during room generation in our implementation
    // This method exists for future extensions or more complex corridor generation
    
    // We could add additional corridor generation logic here if needed
    // For example, to ensure all rooms are accessible, or to add shortcuts
    
    // For now, all rooms are already connected by corridors in generateRooms method
    // But we could enhance this to create a more realistic dungeon layout
    
    // Make sure we have corridors for each room (except possibly the first one)
    const connectedRooms = new Set();
    
    // Add all rooms that are already connected by corridors
    for (const corridor of structure.corridors) {
      connectedRooms.add(corridor.room1);
      connectedRooms.add(corridor.room2);
    }
    
    // Check if any rooms are not connected
    const disconnectedRooms = structure.rooms.filter(room => !connectedRooms.has(room));
    
    // Connect any disconnected rooms to the closest connected room
    for (const room of disconnectedRooms) {
      // Skip the first room (it's the entrance, might be intentionally isolated)
      if (room === structure.rooms[0] && disconnectedRooms.length > 1) {
        continue;
      }
      
      // Find closest connected room
      let closestRoom = null;
      let minDistance = Infinity;
      
      for (const connectedRoom of connectedRooms) {
        const distance = this.calculateDistance(room.center, connectedRoom.center);
        if (distance < minDistance) {
          minDistance = distance;
          closestRoom = connectedRoom;
        }
      }
      
      // If we found a connected room, add a corridor
      if (closestRoom) {
        const corridor = this.createCorridor(closestRoom, room, config.corridorWidth);
        if (corridor) {
          structure.corridors.push(corridor);
          connectedRooms.add(room);
        }
      }
    }
  }
  
  /**
   * Create a room object
   * @param {Object} center - Room center position
   * @param {number} width - Room width (X)
   * @param {number} length - Room length (Z)
   * @param {number} height - Room height (Y)
   * @returns {Object} Room object
   */
  createRoom(center, width, length, height) {
    const halfWidth = Math.floor(width / 2);
    const halfLength = Math.floor(length / 2);
    const halfHeight = Math.floor(height / 2);
    
    return {
      center: { ...center },
      size: { x: width, y: height, z: length },
      bounds: {
        min: {
          x: center.x - halfWidth,
          y: center.y - 1,
          z: center.z - halfLength
        },
        max: {
          x: center.x + halfWidth,
          y: center.y + height - 1,
          z: center.z + halfLength
        }
      },
      isSpecial: false,
      specialType: null,
      spawners: [],
      chests: []
    };
  }
  
  /**
   * Check if two rooms overlap
   * @param {Object} room1 - First room
   * @param {Object} room2 - Second room
   * @param {number} padding - Additional padding between rooms
   * @returns {boolean} Whether rooms overlap
   */
  roomsOverlap(room1, room2, padding = 0) {
    return !(
      room1.bounds.max.x + padding < room2.bounds.min.x - padding ||
      room1.bounds.min.x - padding > room2.bounds.max.x + padding ||
      room1.bounds.max.z + padding < room2.bounds.min.z - padding ||
      room1.bounds.min.z - padding > room2.bounds.max.z + padding ||
      room1.bounds.max.y + padding < room2.bounds.min.y - padding ||
      room1.bounds.min.y - padding > room2.bounds.max.y + padding
    );
  }
  
  /**
   * Create a corridor between two rooms
   * @param {Object} room1 - First room
   * @param {Object} room2 - Second room
   * @param {number} width - Corridor width
   * @returns {Object|null} Corridor object or null if failed
   */
  createCorridor(room1, room2, width) {
    // Determine path points
    const startPoint = { ...room1.center };
    const endPoint = { ...room2.center };
    
    // Create L-shaped corridor
    const midPoint = {
      x: startPoint.x,
      y: this.getLerpValue(startPoint.y, endPoint.y, 0.5),
      z: endPoint.z
    };
    
    // Create corridor segments
    const segment1 = {
      start: startPoint,
      end: { x: midPoint.x, y: midPoint.y, z: startPoint.z },
      width: width,
      height: 3
    };
    
    const segment2 = {
      start: { x: midPoint.x, y: midPoint.y, z: startPoint.z },
      end: midPoint,
      width: width,
      height: 3
    };
    
    const segment3 = {
      start: midPoint,
      end: endPoint,
      width: width,
      height: 3
    };
    
    return {
      segments: [segment1, segment2, segment3],
      room1: room1,
      room2: room2
    };
  }
  
  /**
   * Linear interpolation between two values
   * @param {number} a - First value
   * @param {number} b - Second value
   * @param {number} t - Interpolation factor (0 to 1)
   * @returns {number} Interpolated value
   */
  getLerpValue(a, b, t) {
    return a + (b - a) * t;
  }
  
  /**
   * Update structure bounds based on a room
   * @param {Object} structure - Structure data
   * @param {Object} room - Room to include in bounds
   */
  updateBounds(structure, room) {
    structure.bounds.min.x = Math.min(structure.bounds.min.x, room.bounds.min.x);
    structure.bounds.min.y = Math.min(structure.bounds.min.y, room.bounds.min.y);
    structure.bounds.min.z = Math.min(structure.bounds.min.z, room.bounds.min.z);
    
    structure.bounds.max.x = Math.max(structure.bounds.max.x, room.bounds.max.x);
    structure.bounds.max.y = Math.max(structure.bounds.max.y, room.bounds.max.y);
    structure.bounds.max.z = Math.max(structure.bounds.max.z, room.bounds.max.z);
  }
  
  /**
   * Calculate distance between two points
   * @param {Object} point1 - First point
   * @param {Object} point2 - Second point
   * @returns {number} Distance
   */
  calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Place spawners and loot in rooms
   * @param {Object} structure - Structure data
   * @param {Object} config - Configuration options
   */
  populateRooms(structure, config) {
    // Process each room
    for (const room of structure.rooms) {
      // Skip first room (entrance) for spawners
      const isEntrance = room === structure.rooms[0];
      
      // Place trial spawner in regular rooms
      if (!isEntrance && !room.isSpecial && this.random() < config.spawnerRoomChance) {
        const spawnerPos = {
          x: room.center.x,
          y: room.center.y,
          z: room.center.z
        };
        
        // Determine difficulty based on distance from entrance
        const distanceFromEntrance = this.calculateDistance(structure.position, spawnerPos);
        const difficulty = Math.min(1.0, distanceFromEntrance / 50);
        
        // More waves and mobs for harder spawners
        const totalWaves = 2 + Math.floor(difficulty * 2);
        const maxMobsPerWave = 3 + Math.floor(difficulty * 3);
        
        // Create spawner
        const spawner = {
          position: spawnerPos,
          totalWaves: totalWaves,
          maxMobsPerWave: maxMobsPerWave,
          mobTypes: this.getSpawnerMobTypes(difficulty)
        };
        
        // Add to room and structure
        room.spawners.push(spawner);
        structure.spawners.push(spawner);
        
        // Add reward chests around the spawner
        const chestCount = 1 + Math.floor(difficulty * 2);
        this.placeRewardChests(room, spawner, chestCount, structure);
      }
      
      // Place treasure in special rooms
      if (room.isSpecial && room.specialType === 'treasure') {
        // Place multiple valuable chests
        const chestCount = this.getRandomInt(3, 5);
        for (let i = 0; i < chestCount; i++) {
          const offset = {
            x: this.getRandomInt(-2, 2),
            y: 0,
            z: this.getRandomInt(-2, 2)
          };
          
          const chestPos = {
            x: room.center.x + offset.x,
            y: room.center.y + offset.y,
            z: room.center.z + offset.z
          };
          
          const chest = {
            position: chestPos,
            lootTable: config.lootTables.epic,
            isSpecial: true
          };
          
          room.chests.push(chest);
          structure.chests.push(chest);
        }
      }
    }
  }
  
  /**
   * Get mob types for a spawner based on difficulty
   * @param {number} difficulty - Difficulty factor (0 to 1)
   * @returns {string[]} Array of mob types
   */
  getSpawnerMobTypes(difficulty) {
    const mobPool = ['zombie', 'skeleton', 'spider'];
    
    // Add tougher mobs as difficulty increases
    if (difficulty > 0.3) mobPool.push('creeper');
    if (difficulty > 0.5) mobPool.push('witch');
    if (difficulty > 0.7) mobPool.push('breeze');
    if (difficulty > 0.9) {
      mobPool.push('vindicator');
      if (this.random() < 0.3) mobPool.push('evoker');
    }
    
    // Select a subset of mobs for this spawner
    const mobCount = 2 + Math.floor(difficulty * 3);
    const selectedMobs = [];
    
    for (let i = 0; i < mobCount; i++) {
      if (i < mobPool.length) {
        selectedMobs.push(mobPool[i]);
      }
    }
    
    return selectedMobs;
  }
  
  /**
   * Place reward chests around a spawner
   * @param {Object} room - Room data
   * @param {Object} spawner - Spawner data
   * @param {number} count - Number of chests to place
   * @param {Object} structure - Structure data
   */
  placeRewardChests(room, spawner, count, structure) {
    const angles = [];
    const chestDistance = 3;
    
    // Generate evenly spaced angles
    const angleStep = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      angles.push(i * angleStep);
    }
    
    // Place chests
    for (let i = 0; i < count; i++) {
      const angle = angles[i];
      const chestPos = {
        x: spawner.position.x + Math.cos(angle) * chestDistance,
        y: spawner.position.y,
        z: spawner.position.z + Math.sin(angle) * chestDistance
      };
      
      // Use appropriate loot table
      let lootTable;
      if (spawner.totalWaves > 3) {
        // Use the passed structure's config if available, otherwise fall back to this generator's config
        lootTable = (structure.config && structure.config.lootTables.rare) || 
                    this.config.lootTables.rare;
      } else {
        lootTable = (structure.config && structure.config.lootTables.common) || 
                    this.config.lootTables.common;
      }
      
      const chest = {
        position: chestPos,
        lootTable: lootTable,
        isReward: true,
        spawnerId: spawner.id
      };
      
      room.chests.push(chest);
      structure.chests.push(chest);
    }
  }
  
  /**
   * Add decorations and details to the structure
   * @param {Object} structure - Structure data
   * @param {Object} config - Configuration options
   */
  addDecorations(structure, config) {
    // Add decorations to rooms
    for (const room of structure.rooms) {
      // More decorations for special rooms
      const decorationCount = room.isSpecial ? 
        this.getRandomInt(8, 12) : 
        this.getRandomInt(4, 8);
      
      for (let i = 0; i < decorationCount; i++) {
        // Random position within room bounds
        const pos = {
          x: this.getRandomInt(room.bounds.min.x + 1, room.bounds.max.x - 1),
          y: this.getRandomInt(room.bounds.min.y + 1, room.bounds.max.y - 1),
          z: this.getRandomInt(room.bounds.min.z + 1, room.bounds.max.z - 1)
        };
        
        // Mark as decoration position
        // These will be procedurally filled with decoration blocks during building
        if (!room.decorations) room.decorations = [];
        room.decorations.push(pos);
      }
    }
    
    // Add decorations to corridors
    for (const corridor of structure.corridors) {
      for (const segment of corridor.segments) {
        const segmentLength = this.calculateDistance(segment.start, segment.end);
        const decorationCount = Math.floor(segmentLength / 3);
        
        if (!corridor.decorations) corridor.decorations = [];
        
        for (let i = 0; i < decorationCount; i++) {
          const t = (i + 1) / (decorationCount + 1);
          const pos = {
            x: this.getLerpValue(segment.start.x, segment.end.x, t),
            y: this.getLerpValue(segment.start.y, segment.end.y, t),
            z: this.getLerpValue(segment.start.z, segment.end.z, t)
          };
          
          // Add random offset to make it less regular
          pos.x += this.getRandomInt(-1, 1);
          pos.z += this.getRandomInt(-1, 1);
          
          corridor.decorations.push(pos);
        }
      }
    }
  }
  
  /**
   * Actually build the structure in the world
   * @param {Object} structure - Structure data
   * @param {Object} config - Configuration options
   */
  buildStructure(structure, config) {
    const world = this.world;
    if (!world) {
      console.warn('Cannot build Trial Chamber: no world instance');
      return;
    }
    
    // Build rooms
    for (const room of structure.rooms) {
      this.buildRoom(room, config);
    }
    
    // Build corridors
    for (const corridor of structure.corridors) {
      this.buildCorridor(corridor, config);
    }
    
    // Place trial spawners
    for (const spawnerData of structure.spawners) {
      const spawner = new TrialSpawnerBlock({
        totalWaves: spawnerData.totalWaves,
        maxMobsPerWave: spawnerData.maxMobsPerWave,
        mobTypes: spawnerData.mobTypes
      });
      
      // Set position and world reference
      spawner.setPosition(spawnerData.position);
      spawner.setWorld(world);
      
      // Place in world
      world.setBlock(spawnerData.position, spawner);
    }
    
    // Place chests
    for (const chest of structure.chests) {
      // Create chest with appropriate loot
      world.setBlock(chest.position, {
        id: 'chest',
        lootTable: chest.lootTable,
        isReward: chest.isReward || false,
        isSpecial: chest.isSpecial || false
      });
    }
  }
  
  /**
   * Build a room in the world
   * @param {Object} room - Room data
   * @param {Object} config - Configuration options
   */
  buildRoom(room, config) {
    const world = this.world;
    if (!world) return;
    
    // Fill room area with air to clear any existing blocks
    for (let x = room.bounds.min.x; x <= room.bounds.max.x; x++) {
      for (let y = room.bounds.min.y; y <= room.bounds.max.y; y++) {
        for (let z = room.bounds.min.z; z <= room.bounds.max.z; z++) {
          // Skip edges (walls, floor, ceiling)
          if (x > room.bounds.min.x && x < room.bounds.max.x &&
              y > room.bounds.min.y && y < room.bounds.max.y &&
              z > room.bounds.min.z && z < room.bounds.max.z) {
            world.setBlock({ x, y, z }, { id: 'air' });
          }
        }
      }
    }
    
    // Build walls, floor, ceiling
    for (let x = room.bounds.min.x; x <= room.bounds.max.x; x++) {
      for (let z = room.bounds.min.z; z <= room.bounds.max.z; z++) {
        // Floor
        world.setBlock({ x, y: room.bounds.min.y, z }, { id: config.defaultBlock });
        
        // Ceiling
        world.setBlock({ x, y: room.bounds.max.y, z }, { id: config.defaultBlock });
        
        // Walls
        if (x === room.bounds.min.x || x === room.bounds.max.x ||
            z === room.bounds.min.z || z === room.bounds.max.z) {
          for (let y = room.bounds.min.y + 1; y < room.bounds.max.y; y++) {
            world.setBlock({ x, y, z }, { id: config.defaultBlock });
          }
        }
      }
    }
    
    // Add decorations
    if (room.decorations) {
      for (const pos of room.decorations) {
        // Select a random decoration block
        const blockId = config.decorationBlocks[
          Math.floor(this.random() * config.decorationBlocks.length)
        ];
        
        world.setBlock(pos, { id: blockId });
      }
    }
    
    // Add special decorations for treasure rooms
    if (room.isSpecial && room.specialType === 'treasure') {
      // Add gold and iron blocks as decoration
      const specialDecorationCount = this.getRandomInt(5, 8);
      for (let i = 0; i < specialDecorationCount; i++) {
        const pos = {
          x: this.getRandomInt(room.bounds.min.x + 1, room.bounds.max.x - 1),
          y: room.bounds.min.y,
          z: this.getRandomInt(room.bounds.min.z + 1, room.bounds.max.z - 1)
        };
        
        const blockId = this.random() < 0.3 ? 'gold_block' : 'iron_block';
        world.setBlock(pos, { id: blockId });
      }
    }
  }
  
  /**
   * Build a corridor in the world
   * @param {Object} corridor - Corridor data
   * @param {Object} config - Configuration options
   */
  buildCorridor(corridor, config) {
    const world = this.world;
    if (!world) return;
    
    // Build each segment
    for (const segment of corridor.segments) {
      this.buildCorridorSegment(segment, config);
    }
    
    // Add decorations
    if (corridor.decorations) {
      for (const pos of corridor.decorations) {
        // Select a random decoration block
        const blockId = config.decorationBlocks[
          Math.floor(this.random() * config.decorationBlocks.length)
        ];
        
        world.setBlock(pos, { id: blockId });
      }
    }
  }
  
  /**
   * Build a corridor segment in the world
   * @param {Object} segment - Corridor segment data
   * @param {Object} config - Configuration options
   */
  buildCorridorSegment(segment, config) {
    const world = this.world;
    if (!world) return;
    
    // Determine direction and length
    const dx = segment.end.x - segment.start.x;
    const dy = segment.end.y - segment.start.y;
    const dz = segment.end.z - segment.start.z;
    const length = Math.ceil(Math.sqrt(dx * dx + dy * dy + dz * dz));
    
    // Build segment
    for (let i = 0; i <= length; i++) {
      const t = i / length;
      const pos = {
        x: Math.round(segment.start.x + dx * t),
        y: Math.round(segment.start.y + dy * t),
        z: Math.round(segment.start.z + dz * t)
      };
      
      // Determine corridor orientation
      const isHorizontalX = Math.abs(dx) > Math.abs(dz);
      
      // Clear corridor area
      const halfWidth = Math.floor(segment.width / 2);
      for (let offsetY = 0; offsetY < segment.height; offsetY++) {
        for (let offsetW = -halfWidth; offsetW <= halfWidth; offsetW++) {
          const blockPos = {
            x: isHorizontalX ? pos.x : pos.x + offsetW,
            y: pos.y + offsetY,
            z: isHorizontalX ? pos.z + offsetW : pos.z
          };
          
          // Interior is air
          world.setBlock(blockPos, { id: 'air' });
          
          // Build floor
          world.setBlock({ ...blockPos, y: blockPos.y - 1 }, { id: config.defaultBlock });
          
          // Build ceiling
          world.setBlock({ ...blockPos, y: blockPos.y + segment.height }, { id: config.defaultBlock });
          
          // Build walls
          if (offsetW === -halfWidth || offsetW === halfWidth) {
            world.setBlock(blockPos, { id: config.defaultBlock });
          }
        }
      }
    }
  }
}

module.exports = TrialChamberGenerator; 