/**
 * NetherTest - Tests for the Nether dimension implementation
 */

const assert = require('assert');
const BiomeRegistry = require('../biomes/biomeRegistry');
const DimensionManager = require('../world/dimensionManager');
const PortalManager = require('../world/portalManager');
const NetherDimension = require('../world/netherDimension');
const NetherPortalBlock = require('../blocks/netherPortalBlock');

class NetherTest {
  /**
   * Run all nether tests
   */
  static runAllTests() {
    try {
      console.log('🧪 Starting Nether implementation tests...');
      
      // Run all test methods
      this.testNetherBiomes();
      this.testNetherDimension();
      this.testPortalCreation();
      this.testCoordinateScaling();
      this.testDimensionTransition();
      
      console.log('✅ All Nether tests passed!');
      return true;
    } catch (error) {
      console.error('❌ Nether tests failed:', error);
      return false;
    }
  }
  
  /**
   * Test that all required Nether biomes are registered
   */
  static testNetherBiomes() {
    console.log('Testing Nether biomes registration...');
    
    // Check that we have the expected Nether biomes
    const netherBiomes = BiomeRegistry.getNetherBiomes();
    
    // We expect at least 5 nether biomes
    assert(netherBiomes.length >= 5, `Expected at least 5 Nether biomes, got ${netherBiomes.length}`);
    
    // Check for specific biomes
    const biomeTypes = netherBiomes.map(biome => biome.id);
    assert(biomeTypes.includes('nether_wastes'), 'Missing Nether Wastes biome');
    assert(biomeTypes.includes('soul_sand_valley'), 'Missing Soul Sand Valley biome');
    assert(biomeTypes.includes('crimson_forest'), 'Missing Crimson Forest biome');
    assert(biomeTypes.includes('warped_forest'), 'Missing Warped Forest biome');
    assert(biomeTypes.includes('basalt_deltas'), 'Missing Basalt Deltas biome');
    
    // Check that each biome has nether-specific properties
    for (const biome of netherBiomes) {
      assert(biome.isNether, `Biome ${biome.id} is not marked as a Nether biome`);
      assert(biome.temperature >= 2.0, `Biome ${biome.id} temperature should be at least 2.0`);
      assert(biome.hasLavaOcean !== undefined, `Biome ${biome.id} missing hasLavaOcean property`);
    }
    
    console.log('✅ Nether biomes test passed!');
  }
  
  /**
   * Test NetherDimension class functionality
   */
  static testNetherDimension() {
    console.log('Testing NetherDimension class...');
    
    // Create a test nether dimension
    const testSeed = 12345;
    const nether = new NetherDimension({ seed: testSeed });
    
    // Test basic properties
    assert(nether.id === 'nether', 'Nether dimension ID should be "nether"');
    assert(nether.seed === testSeed, 'Nether seed should match test seed');
    assert(nether.lavaLevel > 0, 'Nether should have a lava level defined');
    
    // Test noise generators initialization
    assert(nether.terrainNoise, 'Terrain noise generator should be initialized');
    assert(nether.caveNoise, 'Cave noise generator should be initialized');
    
    // Test chunk generation
    const chunk = nether.generateChunk(0, 0);
    assert(chunk, 'Should be able to generate a chunk');
    assert(nether.generatedChunks.has('0,0'), 'Chunk should be marked as generated');
    
    // Test block generation
    const blocks = Array.from(nether.blocks.entries());
    assert(blocks.length > 0, 'Chunk generation should create blocks');
    
    // Test different block types
    let hasNetherrack = false;
    let hasLava = false;
    
    for (const [_, block] of blocks) {
      if (block.type === 'netherrack') hasNetherrack = true;
      if (block.type === 'lava') hasLava = true;
    }
    
    assert(hasNetherrack, 'Generated blocks should include netherrack');
    assert(hasLava, 'Generated blocks should include lava');
    
    console.log('✅ NetherDimension test passed!');
  }
  
  /**
   * Test portal creation and validation
   */
  static testPortalCreation() {
    console.log('Testing portal creation...');
    
    // Mock world with blocks
    const mockWorld = {
      blocks: {},
      getBlockType(posKey) {
        return this.blocks[posKey] ? this.blocks[posKey].type : null;
      },
      setBlock(posKey, blockData) {
        this.blocks[posKey] = blockData;
      },
      playSound() {}
    };
    
    // Create a portal frame in the mock world
    // A 4x5 portal frame (internal size 2x3)
    
    // Bottom row
    mockWorld.blocks['0,0,0'] = { type: 'obsidian' };
    mockWorld.blocks['1,0,0'] = { type: 'obsidian' };
    mockWorld.blocks['2,0,0'] = { type: 'obsidian' };
    mockWorld.blocks['3,0,0'] = { type: 'obsidian' };
    
    // Side pillars
    mockWorld.blocks['0,1,0'] = { type: 'obsidian' };
    mockWorld.blocks['3,1,0'] = { type: 'obsidian' };
    mockWorld.blocks['0,2,0'] = { type: 'obsidian' };
    mockWorld.blocks['3,2,0'] = { type: 'obsidian' };
    mockWorld.blocks['0,3,0'] = { type: 'obsidian' };
    mockWorld.blocks['3,3,0'] = { type: 'obsidian' };
    
    // Top row
    mockWorld.blocks['0,4,0'] = { type: 'obsidian' };
    mockWorld.blocks['1,4,0'] = { type: 'obsidian' };
    mockWorld.blocks['2,4,0'] = { type: 'obsidian' };
    mockWorld.blocks['3,4,0'] = { type: 'obsidian' };
    
    // Create a portal manager
    const portalManager = new PortalManager();
    
    // Test frame detection
    const frame = portalManager.findPortalFrame(mockWorld, { x: 0, y: 0, z: 0 }, 'x');
    assert(frame, 'Portal frame should be detected');
    assert(frame.width === 3, `Frame width should be 3, got ${frame.width}`);
    assert(frame.height === 4, `Frame height should be 4, got ${frame.height}`);
    
    // Test frame validation
    const isValid = portalManager.validatePortalFrame(mockWorld, frame);
    assert(isValid, 'Portal frame should be valid');
    
    // Test portal activation
    // Place fire inside the frame
    mockWorld.blocks['1,1,0'] = { type: 'fire' };
    
    // Process the portal activation
    portalManager.tryActivatePortal(mockWorld, { x: 1, y: 1, z: 0 });
    
    // Check that portal blocks were created
    assert(mockWorld.blocks['1,1,0'].type === 'nether_portal', 'Portal should be activated at fire position');
    assert(mockWorld.blocks['2,1,0'].type === 'nether_portal', 'Portal should fill width');
    assert(mockWorld.blocks['1,2,0'].type === 'nether_portal', 'Portal should fill height');
    assert(mockWorld.blocks['2,2,0'].type === 'nether_portal', 'Portal should fill center');
    assert(mockWorld.blocks['1,3,0'].type === 'nether_portal', 'Portal should fill to top');
    assert(mockWorld.blocks['2,3,0'].type === 'nether_portal', 'Portal should fill top-right');
    
    console.log('✅ Portal creation test passed!');
  }
  
  /**
   * Test coordinate scaling between dimensions
   */
  static testCoordinateScaling() {
    console.log('Testing coordinate scaling...');
    
    // Create a dimension manager
    const dimensionManager = new DimensionManager();
    
    // Test overworld to nether
    const overworldPos = { x: 80, y: 64, z: -160 };
    const netherPos = dimensionManager.convertCoordinates(
      overworldPos, 
      'overworld', 
      'nether'
    );
    
    assert(netherPos.x === 10, `Expected x=10, got ${netherPos.x}`);
    assert(netherPos.z === -20, `Expected z=-20, got ${netherPos.z}`);
    
    // Test nether to overworld
    const backToOverworld = dimensionManager.convertCoordinates(
      netherPos,
      'nether',
      'overworld'
    );
    
    assert(backToOverworld.x === 80, `Expected x=80, got ${backToOverworld.x}`);
    assert(backToOverworld.z === -160, `Expected z=-160, got ${backToOverworld.z}`);
    
    console.log('✅ Coordinate scaling test passed!');
  }
  
  /**
   * Test dimension transition
   */
  static testDimensionTransition() {
    console.log('Testing dimension transition...');
    
    // Create a mock server
    const mockServer = {
      events: [],
      emit(event, data) {
        this.events.push({ event, data });
      }
    };
    
    // Create a dimension manager
    const dimensionManager = new DimensionManager({ server: mockServer });
    
    // Create mock dimensions
    const overworld = {
      id: 'overworld',
      blocks: {},
      getBlockType(posKey) {
        return this.blocks[posKey] ? this.blocks[posKey].type : null;
      },
      setBlock(posKey, blockData) {
        this.blocks[posKey] = blockData;
      }
    };
    
    const nether = new NetherDimension({ seed: 12345, server: mockServer });
    
    // Register the dimensions
    dimensionManager.registerDimension('overworld', overworld);
    dimensionManager.registerDimension('nether', nether);
    
    // Test portal creation
    const portalData = {
      dimension: 'overworld',
      targetDimension: 'nether',
      orientation: 'x',
      position: { x: 0, y: 64, z: 0 },
      width: 2,
      height: 3
    };
    
    dimensionManager.registerPortal(portalData);
    
    // Check if the overworld portal was registered
    assert(dimensionManager.findPortalAt('overworld', portalData.position), 
           'Overworld portal should be registered');
    
    // Simulate an entity entering a portal
    const mockEntity = {
      id: 'player1',
      position: { x: 0, y: 64, z: 0 },
      teleport(data) {
        this.position = data.position;
        this.dimension = data.dimension;
      }
    };
    
    dimensionManager.handleEntityEnterPortal({
      entity: mockEntity,
      portalPosition: { x: 0, y: 64, z: 0 },
      dimension: 'overworld',
      portalType: 'nether_portal'
    });
    
    // Process the pending teleport (skipping the delay)
    const pendingTeleport = Array.from(dimensionManager.pendingTeleports.values())[0];
    pendingTeleport.completionCallback();
    
    // Check if the entity was teleported
    assert(mockEntity.dimension === 'nether', 
           `Entity should be teleported to nether, got ${mockEntity.dimension}`);
    
    // Convert to nether coordinates manually for the check (overworld position ÷ 8)
    const expectedX = 0;  // Original x=0 ÷ 8 = 0
    assert(Math.abs(mockEntity.position.x - expectedX) < 3, 
           `Entity x position should be close to ${expectedX}, got ${mockEntity.position.x}`);
    
    console.log('✅ Dimension transition test passed!');
  }
}

// If this file is run directly, execute the tests
if (require.main === module) {
  NetherTest.runAllTests();
}

module.exports = NetherTest; 