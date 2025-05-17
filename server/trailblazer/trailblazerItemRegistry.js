/**
 * TrailblazerItemRegistry - Registry for all Trailblazer profession items
 * Part of the Minecraft 1.23 Update
 */

const MapItem = require('../items/mapItem');
const BiomeMapItem = require('../items/biomeMapItem');
const StructureMapItem = require('../items/structureMapItem');
const ExplorerCompassItem = require('../items/explorerCompassItem');
const TrailMarkerItem = require('../items/trailMarkerItem');

class TrailblazerItemRegistry {
  /**
   * Initialize the registry
   * @param {Object} options - Registry options
   */
  constructor(options = {}) {
    this.itemManager = options.itemManager;
    this.initialized = false;
    
    // Registry of all trailblazer items by ID
    this.trailblazerItems = {};
    
    // Special items that can be crafted or found in world
    this.treasureMapItems = [];
    this.rareStructureMapItems = [];
  }
  
  /**
   * Initialize and register all Trailblazer items
   * @param {Object} gameContext - Game context containing required managers
   * @returns {boolean} Success status
   */
  initialize(gameContext) {
    if (this.initialized) return true;
    
    if (!gameContext || !gameContext.itemManager) {
      console.error('Cannot initialize TrailblazerItemRegistry: itemManager required');
      return false;
    }
    
    this.itemManager = gameContext.itemManager;
    
    // Register basic items
    this.registerBasicItems();
    
    // Register special maps
    this.registerSpecialMaps();
    
    // Register crafting recipes if we have a recipe manager
    if (gameContext.recipeManager) {
      this.registerCraftingRecipes(gameContext.recipeManager);
    }
    
    this.initialized = true;
    return true;
  }
  
  /**
   * Register basic trailblazer items
   */
  registerBasicItems() {
    // Basic empty map
    const emptyMap = new MapItem({
      id: 'empty_map',
      name: 'Empty Map',
      stackable: true,
      maxStackSize: 64
    });
    this.registerItem(emptyMap);
    
    // Biome map (generic)
    const biomeMap = new BiomeMapItem();
    this.registerItem(biomeMap);
    
    // Structure map (generic)
    const structureMap = new StructureMapItem();
    this.registerItem(structureMap);
    
    // Rare structure map
    const rareStructureMap = new StructureMapItem({
      id: 'rare_structure_map',
      name: 'Rare Structure Map',
      isRare: true,
      mapColor: '#ffaa00' // Darker orange
    });
    this.registerItem(rareStructureMap);
    
    // Explorer compass
    const explorerCompass = new ExplorerCompassItem();
    this.registerItem(explorerCompass);
    
    // Trail marker in different colors
    const basicTrailMarker = new TrailMarkerItem();
    this.registerItem(basicTrailMarker);
    
    const coloredMarkers = [
      { id: 'trail_marker_green', name: 'Green Trail Marker', color: '#00ff00' },
      { id: 'trail_marker_blue', name: 'Blue Trail Marker', color: '#0000ff' },
      { id: 'trail_marker_yellow', name: 'Yellow Trail Marker', color: '#ffff00' },
      { id: 'trail_marker_purple', name: 'Purple Trail Marker', color: '#800080' }
    ];
    
    for (const markerConfig of coloredMarkers) {
      const coloredMarker = new TrailMarkerItem({
        id: markerConfig.id,
        name: markerConfig.name,
        markerColor: markerConfig.color
      });
      this.registerItem(coloredMarker);
    }
    
    // Treasure map (special loot)
    const treasureMap = new StructureMapItem({
      id: 'treasure_map',
      name: 'Treasure Map',
      isRare: true,
      mapColor: '#ffd700', // Gold color
      targetStructure: 'treasure'
    });
    this.registerItem(treasureMap);
    this.treasureMapItems.push(treasureMap);
    
    // Map updater (upgrading maps)
    const mapUpdater = new MapItem({
      id: 'map_updater',
      name: 'Map Updater',
      stackable: false,
      maxStackSize: 1
    });
    this.registerItem(mapUpdater);
    
    // Map bundle (multiple maps in one)
    const mapBundle = new MapItem({
      id: 'map_bundle',
      name: 'Map Bundle',
      stackable: false,
      maxStackSize: 1
    });
    this.registerItem(mapBundle);
    
    // Trailblazer backpack (special item)
    const trailblazerBackpack = new MapItem({
      id: 'trailblazer_backpack',
      name: 'Trailblazer Backpack',
      stackable: false,
      maxStackSize: 1,
      type: 'tool',
      subtype: 'backpack',
      category: 'tools'
    });
    this.registerItem(trailblazerBackpack);
  }
  
  /**
   * Register special maps for different biomes and structures
   */
  registerSpecialMaps() {
    // Biome maps for specific biomes
    const biomeTypes = [
      'desert', 'plains', 'forest', 'taiga', 'swamp',
      'jungle', 'savanna', 'badlands', 'mountains', 'cherry_grove'
    ];
    
    for (const biomeType of biomeTypes) {
      const biomeName = biomeType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
      const biomeMap = new BiomeMapItem({
        id: `${biomeType}_map`,
        name: `${biomeName} Map`,
        targetBiome: biomeType
      });
      
      this.registerItem(biomeMap);
    }
    
    // Structure maps for common structures
    const structureTypes = [
      'village', 'fortress', 'monument', 'temple',
      'pyramid', 'mineshaft', 'stronghold', 'shipwreck'
    ];
    
    for (const structureType of structureTypes) {
      const structureName = structureType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
      const structureMap = new StructureMapItem({
        id: `${structureType}_map`,
        name: `${structureName} Map`,
        targetStructure: structureType
      });
      
      this.registerItem(structureMap);
    }
    
    // Rare structure maps
    const rareStructureTypes = [
      'mansion', 'ruins', 'ancient_city', 'bastion', 'end_city'
    ];
    
    for (const structureType of rareStructureTypes) {
      const structureName = structureType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
      const rareStructureMap = new StructureMapItem({
        id: `${structureType}_map`,
        name: `${structureName} Map`,
        targetStructure: structureType,
        isRare: true,
        mapColor: '#ffaa00' // Darker orange
      });
      
      this.registerItem(rareStructureMap);
      this.rareStructureMapItems.push(rareStructureMap);
    }
  }
  
  /**
   * Register crafting recipes for Trailblazer items
   * @param {Object} recipeManager - Recipe manager
   */
  registerCraftingRecipes(recipeManager) {
    if (!recipeManager) return;
    
    // Empty map (paper + compass)
    recipeManager.registerShapedRecipe({
      id: 'empty_map_recipe',
      result: { id: 'empty_map', count: 1 },
      pattern: [
        'PPP',
        'PCP',
        'PPP'
      ],
      key: {
        'P': { item: 'paper' },
        'C': { item: 'compass' }
      }
    });
    
    // Explorer compass (compass + map + redstone)
    recipeManager.registerShapedRecipe({
      id: 'explorer_compass_recipe',
      result: { id: 'explorer_compass', count: 1 },
      pattern: [
        ' R ',
        'RCR',
        ' M '
      ],
      key: {
        'R': { item: 'redstone' },
        'C': { item: 'compass' },
        'M': { item: 'map' }
      }
    });
    
    // Trail marker (stick + dye + glowstone dust)
    recipeManager.registerShapedRecipe({
      id: 'trail_marker_recipe',
      result: { id: 'trail_marker', count: 4 },
      pattern: [
        ' G ',
        ' D ',
        ' S '
      ],
      key: {
        'G': { item: 'glowstone_dust' },
        'D': { item: 'red_dye' },
        'S': { item: 'stick' }
      }
    });
    
    // Green trail marker
    recipeManager.registerShapelessRecipe({
      id: 'green_trail_marker_recipe',
      result: { id: 'trail_marker_green', count: 1 },
      ingredients: [
        { item: 'trail_marker' },
        { item: 'green_dye' }
      ]
    });
    
    // Blue trail marker
    recipeManager.registerShapelessRecipe({
      id: 'blue_trail_marker_recipe',
      result: { id: 'trail_marker_blue', count: 1 },
      ingredients: [
        { item: 'trail_marker' },
        { item: 'blue_dye' }
      ]
    });
    
    // Map updater (empty map + redstone + lapis)
    recipeManager.registerShapedRecipe({
      id: 'map_updater_recipe',
      result: { id: 'map_updater', count: 1 },
      pattern: [
        'LRL',
        'RMR',
        'LRL'
      ],
      key: {
        'L': { item: 'lapis_lazuli' },
        'R': { item: 'redstone' },
        'M': { item: 'empty_map' }
      }
    });
    
    // Map bundle (chest + 3 empty maps)
    recipeManager.registerShapedRecipe({
      id: 'map_bundle_recipe',
      result: { id: 'map_bundle', count: 1 },
      pattern: [
        'MMM',
        'MCM',
        '   '
      ],
      key: {
        'M': { item: 'empty_map' },
        'C': { item: 'chest' }
      }
    });
  }
  
  /**
   * Register a single item
   * @param {Object} item - Item to register
   * @returns {boolean} Success status
   */
  registerItem(item) {
    if (!item || !item.id) {
      console.error('Cannot register invalid item');
      return false;
    }
    
    // Add to our registry
    this.trailblazerItems[item.id] = item;
    
    // Register with the game's item manager if available
    if (this.itemManager && this.itemManager.registerItem) {
      this.itemManager.registerItem(item);
    }
    
    return true;
  }
  
  /**
   * Get an item by ID
   * @param {string} itemId - Item ID
   * @returns {Object} Item or null if not found
   */
  getItem(itemId) {
    return this.trailblazerItems[itemId] || null;
  }
  
  /**
   * Get all registered trailblazer items
   * @returns {Array} Array of all items
   */
  getAllItems() {
    return Object.values(this.trailblazerItems);
  }
  
  /**
   * Get a random treasure map item
   * @returns {Object} Random treasure map item or null
   */
  getRandomTreasureMap() {
    if (this.treasureMapItems.length === 0) return null;
    
    const index = Math.floor(Math.random() * this.treasureMapItems.length);
    return this.treasureMapItems[index];
  }
  
  /**
   * Get a random rare structure map item
   * @returns {Object} Random rare structure map item or null
   */
  getRandomRareStructureMap() {
    if (this.rareStructureMapItems.length === 0) return null;
    
    const index = Math.floor(Math.random() * this.rareStructureMapItems.length);
    return this.rareStructureMapItems[index];
  }
}

module.exports = TrailblazerItemRegistry; 