/**
 * TrailblazerTest - Tests for the Trailblazer villager profession
 * Part of the Minecraft 1.23 Update
 */

const assert = require('assert');
const TrailblazerVillager = require('../mobs/trailblazerVillager');
const TrailblazerManager = require('../trailblazer/trailblazerManager');
const TrailblazerItemRegistry = require('../trailblazer/trailblazerItemRegistry');
const MapItem = require('../items/mapItem');
const BiomeMapItem = require('../items/biomeMapItem');
const StructureMapItem = require('../items/structureMapItem');
const ExplorerCompassItem = require('../items/explorerCompassItem');
const TrailMarkerItem = require('../items/trailMarkerItem');

class TrailblazerTest {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };
    
    // Mock game objects
    this.mockVillagerManager = {
      registerProfession: () => true,
      hasNearbyBlock: () => true
    };
    
    this.mockItemManager = {
      registerItem: () => true
    };
    
    this.mockRecipeManager = {
      registerShapedRecipe: () => true,
      registerShapelessRecipe: () => true
    };
    
    this.mockEventManager = {
      on: () => {},
      emit: () => {}
    };
    
    this.mockWorld = {
      addEntity: () => true,
      replaceEntity: () => true,
      getStructuresInChunk: () => [],
      getBiomeAt: () => 'plains',
      getBiomesInRadius: () => [
        { type: 'plains', position: { x: 0, y: 64, z: 0 } },
        { type: 'forest', position: { x: 200, y: 64, z: 200 } },
        { type: 'desert', position: { x: -200, y: 64, z: -200 } }
      ],
      getStructuresInRadius: () => [
        { type: 'village', position: { x: 100, y: 64, z: 100 }, name: 'Village' },
        { type: 'temple', position: { x: -100, y: 64, z: -100 }, name: 'Temple' }
      ],
      addHiddenTreasure: () => true
    };
    
    this.mockGameContext = {
      villagerManager: this.mockVillagerManager,
      itemManager: this.mockItemManager,
      recipeManager: this.mockRecipeManager,
      eventManager: this.mockEventManager,
      world: this.mockWorld
    };
    
    // Create test instances
    this.trailblazerManager = new TrailblazerManager({
      gameContext: this.mockGameContext
    });
    
    this.itemRegistry = new TrailblazerItemRegistry({
      itemManager: this.mockItemManager
    });
  }
  
  /**
   * Run all tests
   * @returns {Object} Test results
   */
  runTests() {
    console.log('Starting Trailblazer Villager Profession Tests...');
    
    try {
      // Initialize components
      this.trailblazerManager.initialize(this.mockGameContext);
      this.itemRegistry.initialize(this.mockGameContext);
      
      // Run test suites
      this.testTrailblazerVillager();
      this.testMapItems();
      this.testExplorerCompass();
      this.testTrailMarker();
      this.testTrailblazerManager();
      this.testItemRegistry();
      
      console.log(`\nTrailblazer Tests Complete: ${this.testResults.passed} passed, ${this.testResults.failed} failed, ${this.testResults.skipped} skipped (${this.testResults.total} total)`);
      
      return this.testResults;
    } catch (error) {
      console.error('Error running Trailblazer tests:', error);
      this.testResults.failed++;
      return this.testResults;
    }
  }
  
  /**
   * Test TrailblazerVillager class
   */
  testTrailblazerVillager() {
    console.log('\n--- Testing TrailblazerVillager ---');
    
    // Test 1: Create a basic Trailblazer
    this.runTest('Creating TrailblazerVillager', () => {
      const trailblazer = new TrailblazerVillager({ x: 0, y: 64, z: 0 });
      
      assert.strictEqual(trailblazer.profession, 'trailblazer');
      assert.strictEqual(trailblazer.workstationType, 'trailblazer_table');
      assert.ok(Array.isArray(trailblazer.trades));
      assert.ok(Array.isArray(trailblazer.discoveredLocations));
    });
    
    // Test 2: Generate trades
    this.runTest('Generating trades', () => {
      const trailblazer = new TrailblazerVillager({ x: 0, y: 64, z: 0 }, { level: 3 });
      
      const trades = trailblazer.trades;
      assert.ok(trades.length > 0);
      
      // Check that level-appropriate trades are included
      const hasBiomeMap = trades.some(trade => trade.outputItem.id === 'biome_map');
      const hasStructureMap = trades.some(trade => trade.outputItem.id === 'structure_map');
      
      assert.ok(hasBiomeMap, 'Should have biome map trade');
      assert.ok(hasStructureMap, 'Should have structure map trade for level 3');
    });
    
    // Test 3: Add discovered location
    this.runTest('Adding discovered locations', () => {
      const trailblazer = new TrailblazerVillager({ x: 0, y: 64, z: 0 });
      
      trailblazer.addDiscoveredLocation({
        type: 'village',
        position: { x: 100, y: 64, z: 100 },
        name: 'Test Village'
      });
      
      assert.strictEqual(trailblazer.discoveredLocations.length, 1);
      assert.strictEqual(trailblazer.discoveredLocations[0].type, 'village');
      assert.strictEqual(trailblazer.discoveredLocations[0].name, 'Test Village');
    });
    
    // Test 4: Generate a location map
    this.runTest('Generating location maps', () => {
      const trailblazer = new TrailblazerVillager({ x: 0, y: 64, z: 0 });
      
      // Add a discovered location
      trailblazer.addDiscoveredLocation({
        type: 'village',
        position: { x: 100, y: 64, z: 100 },
        name: 'Test Village'
      });
      
      // Generate a map to it
      const map = trailblazer.generateLocationMap('village');
      
      assert.ok(map);
      assert.strictEqual(map.centerX, 100);
      assert.strictEqual(map.centerZ, 100);
      assert.strictEqual(map.locationMarkers.length, 1);
      assert.strictEqual(map.locationMarkers[0].type, 'village');
    });
    
    // Test 5: Serialization
    this.runTest('Serialization and deserialization', () => {
      const trailblazer = new TrailblazerVillager({ x: 10, y: 65, z: 20 }, { level: 2 });
      
      // Add a discovered location
      trailblazer.addDiscoveredLocation({
        type: 'temple',
        position: { x: 300, y: 64, z: 300 },
        name: 'Test Temple'
      });
      
      // Serialize
      const data = trailblazer.serialize();
      
      // Deserialize to a new instance
      const restored = TrailblazerVillager.deserialize(data);
      
      assert.strictEqual(restored.profession, 'trailblazer');
      assert.strictEqual(restored.level, 2);
      assert.strictEqual(restored.position.x, 10);
      assert.strictEqual(restored.position.y, 65);
      assert.strictEqual(restored.position.z, 20);
      assert.strictEqual(restored.discoveredLocations.length, 1);
      assert.strictEqual(restored.discoveredLocations[0].type, 'temple');
    });
  }
  
  /**
   * Test map item classes
   */
  testMapItems() {
    console.log('\n--- Testing Map Items ---');
    
    // Test 1: Basic MapItem
    this.runTest('Creating basic MapItem', () => {
      const map = new MapItem();
      
      assert.strictEqual(map.id, 'map');
      assert.strictEqual(map.type, 'tool');
      assert.strictEqual(map.subtype, 'map');
      assert.strictEqual(map.stackable, false);
      assert.strictEqual(map.maxStackSize, 1);
    });
    
    // Test 2: Map boundaries
    this.runTest('Map boundaries calculation', () => {
      const map = new MapItem({
        centerX: 100,
        centerZ: 200,
        scale: 2
      });
      
      const bounds = map.getBoundaries();
      
      assert.strictEqual(bounds.minX, 100 - 128 * 2);
      assert.strictEqual(bounds.maxX, 100 + 128 * 2);
      assert.strictEqual(bounds.minZ, 200 - 128 * 2);
      assert.strictEqual(bounds.maxZ, 200 + 128 * 2);
    });
    
    // Test 3: BiomeMapItem
    this.runTest('Creating BiomeMapItem', () => {
      const biomeMap = new BiomeMapItem({
        targetBiome: 'desert'
      });
      
      assert.strictEqual(biomeMap.id, 'biome_map');
      assert.strictEqual(biomeMap.targetBiome, 'desert');
      assert.ok(biomeMap.biomeColors);
    });
    
    // Test 4: Setting target biome
    this.runTest('Setting target biome', () => {
      const biomeMap = new BiomeMapItem();
      
      biomeMap.setTargetBiome('jungle');
      
      assert.strictEqual(biomeMap.targetBiome, 'jungle');
      assert.ok(biomeMap.locationMarkers.length > 0);
      assert.strictEqual(biomeMap.locationMarkers[0].type, 'biome');
    });
    
    // Test 5: StructureMapItem
    this.runTest('Creating StructureMapItem', () => {
      const structureMap = new StructureMapItem({
        targetStructure: 'village',
        isRare: false
      });
      
      assert.strictEqual(structureMap.id, 'structure_map');
      assert.strictEqual(structureMap.targetStructure, 'village');
      assert.strictEqual(structureMap.isRare, false);
    });
    
    // Test 6: Setting target structure location
    this.runTest('Setting target structure location', () => {
      const structureMap = new StructureMapItem();
      
      const success = structureMap.setTargetStructureLocation({
        type: 'fortress',
        position: { x: 500, y: 70, z: 600 },
        name: 'Nether Fortress'
      });
      
      assert.strictEqual(success, true);
      assert.strictEqual(structureMap.targetStructure, 'fortress');
      assert.strictEqual(structureMap.centerX, 500);
      assert.strictEqual(structureMap.centerZ, 600);
      assert.ok(structureMap.locationMarkers.length > 0);
      assert.strictEqual(structureMap.locationMarkers[0].type, 'structure');
      assert.strictEqual(structureMap.locationMarkers[0].name, 'Nether Fortress');
    });
  }
  
  /**
   * Test ExplorerCompassItem
   */
  testExplorerCompass() {
    console.log('\n--- Testing ExplorerCompassItem ---');
    
    // Test 1: Basic compass
    this.runTest('Creating ExplorerCompassItem', () => {
      const compass = new ExplorerCompassItem();
      
      assert.strictEqual(compass.id, 'explorer_compass');
      assert.strictEqual(compass.type, 'tool');
      assert.strictEqual(compass.subtype, 'compass');
      assert.strictEqual(compass.targetType, 'unexplored');
      assert.ok(compass.searchRadius > 0);
    });
    
    // Test 2: Target type setting
    this.runTest('Setting target type', () => {
      const compass = new ExplorerCompassItem();
      
      const success = compass.setTargetType('biome', 'desert');
      
      assert.strictEqual(success, true);
      assert.strictEqual(compass.targetType, 'biome');
      assert.strictEqual(compass.preferBiome, 'desert');
      assert.strictEqual(compass.preferStructure, null);
    });
    
    // Test 3: Finding target
    this.runTest('Finding target location', () => {
      const compass = new ExplorerCompassItem();
      
      const player = {
        position: { x: 0, y: 64, z: 0 },
        dimension: 'overworld'
      };
      
      const world = {
        getBiomesInRadius: () => [
          { type: 'plains', position: { x: 0, y: 64, z: 0 } },
          { type: 'desert', position: { x: 200, y: 64, z: 200 } }
        ]
      };
      
      // Set to target biomes
      compass.setTargetType('biome', 'desert');
      
      // Update target
      const success = compass.updateTarget(player, world);
      
      assert.strictEqual(success, true);
      assert.ok(compass.targetLocation);
      assert.strictEqual(compass.targetLocation.type, 'biome');
    });
    
    // Test 4: Target reached detection
    this.runTest('Detecting reached target', () => {
      const compass = new ExplorerCompassItem();
      
      // Set a target manually
      compass.targetLocation = {
        x: 10,
        y: 64,
        z: 10,
        type: 'unexplored'
      };
      
      // Player far from target
      let player = {
        position: { x: 100, y: 64, z: 100 }
      };
      
      assert.strictEqual(compass.isTargetReached(player), false);
      
      // Player close to target
      player = {
        position: { x: 15, y: 64, z: 12 }
      };
      
      assert.strictEqual(compass.isTargetReached(player), true);
    });
  }
  
  /**
   * Test TrailMarkerItem
   */
  testTrailMarker() {
    console.log('\n--- Testing TrailMarkerItem ---');
    
    // Test 1: Basic marker
    this.runTest('Creating TrailMarkerItem', () => {
      const marker = new TrailMarkerItem();
      
      assert.strictEqual(marker.id, 'trail_marker');
      assert.strictEqual(marker.type, 'placeable');
      assert.strictEqual(marker.subtype, 'marker');
      assert.strictEqual(marker.stackable, true);
      assert.strictEqual(marker.maxStackSize, 16);
      assert.ok(marker.markerColor);
      assert.ok(marker.glowInDark);
    });
    
    // Test 2: Color setting
    this.runTest('Setting marker color', () => {
      const marker = new TrailMarkerItem();
      
      // Set by hex color
      let success = marker.setColor('#00ff00');
      assert.strictEqual(success, true);
      assert.strictEqual(marker.markerColor, '#00ff00');
      
      // Set by named color
      success = marker.setColor('blue');
      assert.strictEqual(success, true);
      assert.strictEqual(marker.markerColor, '#0000ff');
      
      // Invalid color
      success = marker.setColor('not-a-color');
      assert.strictEqual(success, false);
    });
    
    // Test 3: Marker placement
    this.runTest('Creating marker entity', () => {
      const marker = new TrailMarkerItem();
      
      const world = {};
      const position = { x: 10, y: 64, z: 20 };
      const player = {
        id: 'player-123',
        name: 'TestPlayer',
        dimension: 'overworld'
      };
      
      const entity = marker.createMarkerEntity(world, position, player);
      
      assert.ok(entity.id);
      assert.strictEqual(entity.type, 'trail_marker');
      assert.strictEqual(entity.position.x, 10.5); // Center of block
      assert.strictEqual(entity.position.z, 20.5); // Center of block
      assert.strictEqual(entity.placedBy, 'player-123');
      assert.strictEqual(entity.placedByName, 'TestPlayer');
      assert.strictEqual(entity.color, marker.markerColor);
      assert.strictEqual(entity.dimension, 'overworld');
    });
    
    // Test 4: Toggling glow
    this.runTest('Toggling glow in dark', () => {
      const marker = new TrailMarkerItem({
        glowInDark: true
      });
      
      // Toggle to false
      let glowState = marker.toggleGlow();
      assert.strictEqual(glowState, false);
      assert.strictEqual(marker.glowInDark, false);
      
      // Toggle back to true
      glowState = marker.toggleGlow();
      assert.strictEqual(glowState, true);
      assert.strictEqual(marker.glowInDark, true);
    });
  }
  
  /**
   * Test TrailblazerManager
   */
  testTrailblazerManager() {
    console.log('\n--- Testing TrailblazerManager ---');
    
    // Test 1: Manager initialization
    this.runTest('Initializing TrailblazerManager', () => {
      const manager = new TrailblazerManager({
        gameContext: this.mockGameContext
      });
      
      const success = manager.initialize();
      
      assert.strictEqual(success, true);
      assert.strictEqual(manager.initialized, true);
      assert.strictEqual(manager.workstationBlockId, 'cartography_table');
    });
    
    // Test 2: Trailblazer registration
    this.runTest('Registering a Trailblazer', () => {
      const manager = new TrailblazerManager({
        gameContext: this.mockGameContext
      });
      manager.initialize();
      
      const trailblazer = new TrailblazerVillager(
        { x: 0, y: 64, z: 0 },
        { id: 'test-trailblazer' }
      );
      
      // Ensure trailblazer has an ID property
      trailblazer.id = 'test-trailblazer';
      
      const success = manager.registerTrailblazer(trailblazer);
      
      assert.strictEqual(success, true);
      assert.ok(manager.activeTrailblazers['test-trailblazer']);
      assert.strictEqual(manager.activeTrailblazers['test-trailblazer'], trailblazer);
    });
    
    // Test 3: Location discovery
    this.runTest('Handling location discovery', () => {
      const manager = new TrailblazerManager({
        gameContext: this.mockGameContext
      });
      manager.initialize();
      
      const player = {
        id: 'player-123',
        name: 'TestPlayer',
        position: { x: 0, y: 64, z: 0 }
      };
      
      const location = {
        type: 'monument',
        position: { x: 500, y: 64, z: 500 },
        name: 'Ocean Monument'
      };
      
      manager.handleLocationDiscovery(player, location);
      
      assert.strictEqual(manager.knownLocations.length, 1);
      assert.strictEqual(manager.knownLocations[0].type, 'monument');
      assert.strictEqual(manager.knownLocations[0].name, 'Ocean Monument');
      assert.strictEqual(manager.knownLocations[0].discoveredBy, 'TestPlayer');
    });
    
    // Test 4: Chunk validation
    this.runTest('Validating chunk for locations', () => {
      const manager = new TrailblazerManager({
        gameContext: this.mockGameContext
      });
      manager.initialize();
      
      // Mock the getStructuresInChunk method with test data
      manager.gameContext.world.getStructuresInChunk = () => [
        {
          type: 'mansion',
          position: { x: 400, y: 64, z: 400 },
          name: 'Woodland Mansion'
        }
      ];
      
      const chunk = { x: 25, z: 25 };
      
      manager.validateChunkForLocations(chunk);
      
      assert.strictEqual(manager.knownLocations.length, 1);
      assert.strictEqual(manager.knownLocations[0].type, 'mansion');
      assert.strictEqual(manager.knownLocations[0].discoveredBy, 'world_generation');
    });
    
    // Test 5: Map customization
    this.runTest('Customizing maps for players', () => {
      const manager = new TrailblazerManager({
        gameContext: this.mockGameContext
      });
      manager.initialize();
      
      // Mock player with inventory
      const player = {
        id: 'player-123',
        position: { x: 0, y: 64, z: 0 },
        inventory: {
          findItem: (predicate) => {
            const items = [
              new BiomeMapItem({ id: 'biome_map' }),
              new StructureMapItem({ id: 'structure_map' }),
              new StructureMapItem({ id: 'rare_structure_map', isRare: true }),
              new StructureMapItem({ id: 'treasure_map', isRare: true })
            ];
            return items.find(predicate) || null;
          }
        }
      };
      
      // Test biome map customization
      manager.customizeMapForPlayer(player, 'biome_map');
      
      // Test structure map customization
      manager.customizeMapForPlayer(player, 'structure_map');
      
      // Test rare structure map customization
      manager.customizeMapForPlayer(player, 'rare_structure_map');
      
      // Test treasure map customization
      manager.customizeMapForPlayer(player, 'treasure_map');
      
      // No assertions here because we're just checking that these run without errors
      assert.ok(true);
    });
  }
  
  /**
   * Test TrailblazerItemRegistry
   */
  testItemRegistry() {
    console.log('\n--- Testing TrailblazerItemRegistry ---');
    
    // Test 1: Registry initialization
    this.runTest('Initializing ItemRegistry', () => {
      const registry = new TrailblazerItemRegistry({
        itemManager: this.mockItemManager
      });
      
      const success = registry.initialize(this.mockGameContext);
      
      assert.strictEqual(success, true);
      assert.strictEqual(registry.initialized, true);
    });
    
    // Test 2: Item registration
    this.runTest('Registering items', () => {
      const registry = new TrailblazerItemRegistry({
        itemManager: this.mockItemManager
      });
      registry.initialize(this.mockGameContext);
      
      const testItem = new MapItem({
        id: 'test_map',
        name: 'Test Map'
      });
      
      const success = registry.registerItem(testItem);
      
      assert.strictEqual(success, true);
      assert.ok(registry.trailblazerItems['test_map']);
      assert.deepStrictEqual(registry.trailblazerItems['test_map'], testItem);
    });
    
    // Test 3: Getting items
    this.runTest('Getting items from registry', () => {
      const registry = new TrailblazerItemRegistry({
        itemManager: this.mockItemManager
      });
      registry.initialize(this.mockGameContext);
      
      // Register a test item
      const testItem = new MapItem({
        id: 'test_map_2',
        name: 'Test Map 2'
      });
      registry.registerItem(testItem);
      
      // Get by ID
      const item = registry.getItem('test_map_2');
      assert.ok(item);
      assert.strictEqual(item.id, 'test_map_2');
      
      // Get all items
      const allItems = registry.getAllItems();
      assert.ok(Array.isArray(allItems));
      assert.ok(allItems.length > 0);
    });
    
    // Test 4: Basic items check
    this.runTest('Basic items creation', () => {
      const registry = new TrailblazerItemRegistry({
        itemManager: this.mockItemManager
      });
      registry.initialize(this.mockGameContext);
      
      // Check that basic required items are created
      assert.ok(registry.getItem('empty_map'));
      assert.ok(registry.getItem('biome_map'));
      assert.ok(registry.getItem('structure_map'));
      assert.ok(registry.getItem('explorer_compass'));
      assert.ok(registry.getItem('trail_marker'));
      assert.ok(registry.getItem('treasure_map'));
    });
    
    // Test 5: Special maps creation
    this.runTest('Special maps creation', () => {
      const registry = new TrailblazerItemRegistry({
        itemManager: this.mockItemManager
      });
      registry.initialize(this.mockGameContext);
      
      // Check for biome-specific maps
      assert.ok(registry.getItem('desert_map'));
      assert.ok(registry.getItem('jungle_map'));
      
      // Check for structure-specific maps
      assert.ok(registry.getItem('village_map'));
      assert.ok(registry.getItem('mansion_map'));
      
      // Check random helpers
      const treasureMap = registry.getRandomTreasureMap();
      assert.ok(treasureMap);
      
      const rareMap = registry.getRandomRareStructureMap();
      assert.ok(rareMap);
    });
  }
  
  /**
   * Run a single test with proper error handling
   * @param {string} name - Test name
   * @param {function} testFn - Test function
   */
  runTest(name, testFn) {
    this.testResults.total++;
    
    try {
      testFn();
      console.log(`✓ ${name}`);
      this.testResults.passed++;
    } catch (error) {
      console.error(`✗ ${name} - ${error.message}`);
      this.testResults.failed++;
    }
  }
}

module.exports = TrailblazerTest; 