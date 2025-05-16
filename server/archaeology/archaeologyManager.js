/**
 * ArchaeologyManager - Handles archaeology site generation and excavation mechanics
 * Part of the Trails & Tales Update
 */

class ArchaeologyManager {
  /**
   * Create a new archaeology manager
   * @param {Object} world - World instance for integration
   */
  constructor(world) {
    this.world = world;
    this.sites = new Map(); // Map of archaeology sites (position key -> site data)
    this.lootTables = this.initializeLootTables();
    this.initialized = false;
  }

  /**
   * Initialize archaeology system
   */
  initialize() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Register block handlers with the world
    if (this.world) {
      this.world.on('blockInteract', (data) => this.handleBlockInteraction(data));
      this.world.on('chunkGenerated', (chunk) => this.generateArchaeologySites(chunk));
    }
  }
  
  /**
   * Initialize loot tables for archaeology sites
   * @private
   * @returns {Object} Loot tables organized by site type
   */
  initializeLootTables() {
    return {
      desert: [
        { 
          item: 'pottery_sherd_arms_up', 
          rarity: 0.15, 
          metadata: { pattern: 'arms_up' }
        },
        { 
          item: 'pottery_sherd_skull', 
          rarity: 0.15, 
          metadata: { pattern: 'skull' }
        },
        {
          item: 'emerald',
          rarity: 0.05,
          metadata: { count: { min: 1, max: 3 } }
        },
        {
          item: 'gold_nugget',
          rarity: 0.1,
          metadata: { count: { min: 2, max: 8 } }
        },
        {
          item: 'diamond',
          rarity: 0.02,
          metadata: { count: 1 }
        }
      ],
      underwater: [
        { 
          item: 'pottery_sherd_brewer', 
          rarity: 0.15, 
          metadata: { pattern: 'brewer' } 
        },
        { 
          item: 'pottery_sherd_heartbreak', 
          rarity: 0.15, 
          metadata: { pattern: 'heartbreak' } 
        },
        {
          item: 'prismarine_shard',
          rarity: 0.15,
          metadata: { count: { min: 1, max: 4 } }
        },
        {
          item: 'nautilus_shell',
          rarity: 0.05,
          metadata: { count: 1 }
        },
        {
          item: 'gold_ingot',
          rarity: 0.08,
          metadata: { count: { min: 1, max: 2 } }
        }
      ],
      jungle: [
        { 
          item: 'pottery_sherd_explorer', 
          rarity: 0.15, 
          metadata: { pattern: 'explorer' } 
        },
        { 
          item: 'pottery_sherd_friend', 
          rarity: 0.15, 
          metadata: { pattern: 'friend' } 
        },
        {
          item: 'emerald',
          rarity: 0.08,
          metadata: { count: { min: 1, max: 2 } }
        },
        {
          item: 'bamboo',
          rarity: 0.15,
          metadata: { count: { min: 2, max: 6 } }
        },
        {
          item: 'golden_apple',
          rarity: 0.01,
          metadata: { count: 1 }
        }
      ],
      plains: [
        { 
          item: 'pottery_sherd_archer', 
          rarity: 0.15, 
          metadata: { pattern: 'archer' } 
        },
        { 
          item: 'pottery_sherd_prize', 
          rarity: 0.15, 
          metadata: { pattern: 'prize' } 
        },
        {
          item: 'iron_nugget',
          rarity: 0.15,
          metadata: { count: { min: 3, max: 9 } }
        },
        {
          item: 'bone',
          rarity: 0.1,
          metadata: { count: { min: 1, max: 3 } }
        },
        {
          item: 'name_tag',
          rarity: 0.03,
          metadata: { count: 1 }
        }
      ]
    };
  }
  
  /**
   * Generate archaeology sites in a newly generated chunk
   * @param {Object} chunk - Chunk data
   */
  generateArchaeologySites(chunk) {
    if (!chunk || !chunk.x || !chunk.z) return;
    
    // Determine if this chunk should contain archaeology sites
    const chunkSeed = this.getChunkSeed(chunk.x, chunk.z);
    const random = this.seededRandom(chunkSeed);
    
    // About 1 in 20 chunks have an archaeology site
    if (random() > 0.05) return;
    
    // Determine site type based on biome and chunk position
    const biome = this.getBiomeForChunk(chunk);
    if (!biome) return;
    
    let siteType;
    if (biome.type.includes('desert')) {
      siteType = 'desert';
    } else if (biome.type.includes('ocean') || biome.type.includes('river')) {
      siteType = 'underwater';
    } else if (biome.type.includes('jungle')) {
      siteType = 'jungle';
    } else {
      siteType = 'plains';
    }
    
    // Generate 1-3 sites per chunk that has archaeology
    const numSites = Math.floor(random() * 3) + 1;
    
    for (let i = 0; i < numSites; i++) {
      const x = (chunk.x * 16) + Math.floor(random() * 16);
      const z = (chunk.z * 16) + Math.floor(random() * 16);
      
      // Determine y based on terrain
      const y = this.findSuitableY(x, z, siteType);
      if (y === null) continue;
      
      // Create the archaeology site
      this.createArchaeologySite(x, y, z, siteType, random);
    }
  }
  
  /**
   * Find a suitable Y position for an archaeology site
   * @private
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {string} siteType - Type of archaeology site
   * @returns {number|null} Suitable Y position or null if none found
   */
  findSuitableY(x, z, siteType) {
    if (!this.world) return null;
    
    if (siteType === 'underwater') {
      // Find water level, then the ground beneath it
      let y = this.world.getWaterLevel(x, z);
      
      // Check a few blocks below water level for solid ground
      for (let i = 0; i < 5; i++) {
        const block = this.world.getBlockAt(x, y - i, z);
        if (block && (block.type === 'sand' || block.type === 'gravel' || block.type === 'clay')) {
          return y - i;
        }
      }
    } else {
      // For land sites, find the highest non-air block and check if it's suitable
      const y = this.world.getHighestBlock(x, z);
      if (y === null) return null;
      
      const block = this.world.getBlockAt(x, y, z);
      if (!block) return null;
      
      if (siteType === 'desert' && block.type !== 'sand') return null;
      if (siteType === 'jungle' && !['grass', 'dirt', 'moss'].includes(block.type)) return null;
      if (siteType === 'plains' && !['grass', 'dirt'].includes(block.type)) return null;
      
      return y;
    }
    
    return null;
  }
  
  /**
   * Create an archaeology site at the specified position
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {string} siteType - Type of archaeology site
   * @param {Function} random - Seeded random function
   */
  createArchaeologySite(x, y, z, siteType, random) {
    if (!this.world) return;
    
    // Create a 3x3 area of suspicious blocks
    const size = Math.floor(random() * 2) + 2; // 2-3 blocks in each direction
    
    for (let dx = -size; dx <= size; dx++) {
      for (let dz = -size; dz <= size; dz++) {
        // Skip some blocks for more natural appearance
        if (Math.abs(dx) === size && Math.abs(dz) === size && random() < 0.7) continue;
        
        const blockX = x + dx;
        const blockZ = z + dz;
        const blockY = this.adjustYForBlock(blockX, blockZ, y, siteType);
        
        if (blockY === null) continue;
        
        // Determine the block type based on site type
        let blockType;
        if (siteType === 'desert') {
          blockType = 'suspicious_sand';
        } else if (siteType === 'underwater') {
          blockType = 'suspicious_gravel';
        } else {
          // Jungle and plains use suspicious gravel
          blockType = 'suspicious_gravel';
        }
        
        // Set the suspicious block
        this.world.setBlockAt(blockX, blockY, blockZ, blockType, { 
          siteType,
          lootTable: this.selectLoot(siteType, random)
        });
        
        // Register this block in our sites map
        const posKey = `${blockX},${blockY},${blockZ}`;
        this.sites.set(posKey, { 
          x: blockX, 
          y: blockY, 
          z: blockZ, 
          type: siteType,
          generated: Date.now()
        });
      }
    }
  }
  
  /**
   * Adjust Y position for a specific block placement
   * @private
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @param {number} baseY - Base Y position
   * @param {string} siteType - Type of archaeology site
   * @returns {number|null} Adjusted Y position or null if not suitable
   */
  adjustYForBlock(x, z, baseY, siteType) {
    if (!this.world) return null;
    
    // Check if the block can be replaced
    const block = this.world.getBlockAt(x, baseY, z);
    if (!block) return null;
    
    if (siteType === 'underwater') {
      // For underwater, need a solid block
      if (['sand', 'gravel', 'clay'].includes(block.type)) {
        return baseY;
      }
    } else if (siteType === 'desert') {
      // For desert, need sand
      if (block.type === 'sand') {
        return baseY;
      }
    } else {
      // For jungle and plains, need a suitable surface block
      if (['grass', 'dirt', 'moss'].includes(block.type)) {
        return baseY;
      }
    }
    
    return null;
  }
  
  /**
   * Select a loot item from the appropriate loot table
   * @private
   * @param {string} siteType - Type of archaeology site
   * @param {Function} random - Random function
   * @returns {Object|null} Selected loot item or null
   */
  selectLoot(siteType, random) {
    const lootTable = this.lootTables[siteType];
    if (!lootTable || lootTable.length === 0) return null;
    
    // Get the total rarity weight
    let totalWeight = 0;
    for (const entry of lootTable) {
      totalWeight += entry.rarity;
    }
    
    // Select an item based on weighted probability
    let r = random() * totalWeight;
    let cumulativeWeight = 0;
    
    for (const entry of lootTable) {
      cumulativeWeight += entry.rarity;
      if (r <= cumulativeWeight) {
        // Create a copy of the entry to prevent reference issues
        const result = { ...entry };
        
        // Handle count ranges
        if (result.metadata && result.metadata.count && 
            typeof result.metadata.count === 'object' && 
            result.metadata.count.min !== undefined && 
            result.metadata.count.max !== undefined) {
          const min = result.metadata.count.min;
          const max = result.metadata.count.max;
          result.metadata.count = Math.floor(random() * (max - min + 1)) + min;
        }
        
        return result;
      }
    }
    
    return null;
  }
  
  /**
   * Handle block interaction for archaeology
   * @param {Object} data - Interaction data
   */
  handleBlockInteraction(data) {
    if (!data || !data.player || !data.position || !data.item) return;
    
    const { player, position, item } = data;
    const { x, y, z } = position;
    
    // Check if the block is a suspicious block
    const block = this.world.getBlockAt(x, y, z);
    if (!block || !['suspicious_sand', 'suspicious_gravel'].includes(block.type)) return;
    
    // Check if the item is a brush
    if (item.type !== 'brush') return;
    
    // Start the excavation process
    this.startExcavation(player, x, y, z, block, item);
  }
  
  /**
   * Start the excavation process for an archaeology block
   * @param {Object} player - Player performing the excavation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} block - Block being excavated
   * @param {Object} brush - Brush item being used
   */
  startExcavation(player, x, y, z, block, brush) {
    if (!player || !block || !brush) return;
    
    // Get the site key
    const posKey = `${x},${y},${z}`;
    const site = this.sites.get(posKey);
    
    if (!site) {
      // If not in our registry, check block metadata
      if (!block.metadata || !block.metadata.siteType || !block.metadata.lootTable) {
        // Replace with normal block if no metadata found
        const normalBlock = block.type === 'suspicious_sand' ? 'sand' : 'gravel';
        this.world.setBlockAt(x, y, z, normalBlock);
        return;
      }
    }
    
    // Define how long it takes to excavate (in ticks)
    const excavationTime = 40; // 2 seconds at 20 ticks per second
    
    // Start excavation process
    const excavationId = `${player.id}_${x}_${y}_${z}`;
    
    // Track excavation status
    if (!player.excavations) {
      player.excavations = {};
    }
    
    // Cancel any existing excavation by this player
    if (player.excavations.current) {
      clearTimeout(player.excavations.current.timeout);
      this.world.sendParticles({ 
        type: 'block_break',
        position: { x, y, z },
        blockType: block.type,
        count: 1
      });
    }
    
    // Send particles to show excavation in progress
    this.world.sendParticles({ 
      type: 'excavation',
      position: { x, y, z },
      blockType: block.type,
      count: 5
    });
    
    // Set up new excavation
    player.excavations.current = {
      id: excavationId,
      position: { x, y, z },
      progress: 0,
      timeout: setTimeout(() => {
        this.completeExcavation(player, x, y, z, block);
      }, excavationTime * 50) // Convert ticks to milliseconds
    };
    
    // Damage the brush item
    if (brush.durability && brush.maxDurability) {
      brush.durability -= 1;
      if (brush.durability <= 0) {
        // Break the brush
        player.removeItem(brush);
        this.world.playSound('item_break', player.position);
      } else {
        // Update brush durability
        player.updateItem(brush);
      }
    }
  }
  
  /**
   * Complete the excavation process
   * @param {Object} player - Player performing the excavation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Object} block - Block being excavated
   */
  completeExcavation(player, x, y, z, block) {
    if (!player || !block) return;
    
    // Clear the excavation tracking
    if (player.excavations && player.excavations.current) {
      delete player.excavations.current;
    }
    
    // Get loot information from block metadata or site registry
    const posKey = `${x},${y},${z}`;
    const site = this.sites.get(posKey);
    
    let lootTable;
    if (site && site.lootTable) {
      lootTable = site.lootTable;
    } else if (block.metadata && block.metadata.lootTable) {
      lootTable = block.metadata.lootTable;
    }
    
    // Convert to normal block
    const normalBlock = block.type === 'suspicious_sand' ? 'sand' : 'gravel';
    this.world.setBlockAt(x, y, z, normalBlock);
    
    // Remove from sites registry
    if (site) {
      this.sites.delete(posKey);
    }
    
    // Give rewards if available
    if (lootTable) {
      // Create the item stack
      const itemStack = {
        type: lootTable.item,
        count: lootTable.metadata && lootTable.metadata.count ? lootTable.metadata.count : 1,
        metadata: { ...lootTable.metadata }
      };
      
      // Give item to player
      player.giveItem(itemStack);
      
      // Play special sound for pottery sherds
      if (lootTable.item.includes('pottery_sherd')) {
        this.world.playSound('archaeology_find', player.position);
      } else {
        this.world.playSound('item_pickup', player.position);
      }
      
      // Send success message
      player.sendMessage(`You found ${itemStack.count} ${itemStack.type.replace('_', ' ')}!`);
    } else {
      // Play normal digging sound if no loot
      this.world.playSound('block_break', { x, y, z });
    }
  }
  
  /**
   * Generate a seed for a chunk based on coordinates
   * @private
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkZ - Chunk Z coordinate
   * @returns {number} Chunk seed
   */
  getChunkSeed(chunkX, chunkZ) {
    const worldSeed = this.world ? (this.world.seed || 0) : 0;
    return (chunkX * 341873128712) ^ (chunkZ * 132897987541) ^ worldSeed;
  }
  
  /**
   * Get a seeded random function
   * @private
   * @param {number} seed - Random seed
   * @returns {Function} Seeded random function
   */
  seededRandom(seed) {
    let s = seed;
    return function() {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }
  
  /**
   * Get the biome for a chunk
   * @private
   * @param {Object} chunk - Chunk data
   * @returns {Object|null} Biome object or null
   */
  getBiomeForChunk(chunk) {
    if (!this.world || !this.world.getBiomeAt) return null;
    
    // Sample the biome at the center of the chunk
    const x = (chunk.x * 16) + 8;
    const z = (chunk.z * 16) + 8;
    
    return this.world.getBiomeAt(x, z);
  }
  
  /**
   * Serialize archaeological site data for saving
   * @returns {Object} Serialized data
   */
  serialize() {
    const sitesData = [];
    
    for (const [key, site] of this.sites.entries()) {
      sitesData.push({
        key,
        x: site.x,
        y: site.y,
        z: site.z,
        type: site.type,
        generated: site.generated
      });
    }
    
    return {
      sites: sitesData,
      initialized: this.initialized
    };
  }
  
  /**
   * Deserialize archaeological site data
   * @param {Object} data - Serialized data
   */
  deserialize(data) {
    if (!data) return;
    
    this.sites.clear();
    this.initialized = data.initialized || false;
    
    if (data.sites && Array.isArray(data.sites)) {
      for (const site of data.sites) {
        if (site.key && site.x !== undefined && site.y !== undefined && site.z !== undefined) {
          this.sites.set(site.key, {
            x: site.x,
            y: site.y,
            z: site.z,
            type: site.type || 'plains',
            generated: site.generated || Date.now()
          });
        }
      }
    }
  }
}

module.exports = ArchaeologyManager; 