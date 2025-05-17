/**
 * Tests for CopperGrateBlock implementation
 * Verifies the functionality of copper grates for 1.21 Tricky Trials update
 */

const assert = require('assert');
const CopperGrateBlock = require('../blocks/copperGrateBlock');

// Mock entity for testing
class MockEntity {
  constructor(type, size = 'normal') {
    this.type = type;
    this.size = size;
    this.noCollision = false;
    this.velocity = { x: 1.0, y: 0.5, z: 1.0 };
  }
}

// Mock world for testing entity interactions
class MockWorld {
  constructor() {
    this.entities = [];
    this.blocks = new Map();
  }
  
  getBlockAt(x, y, z) {
    return this.blocks.get(`${x},${y},${z}`);
  }
  
  setBlockAt(x, y, z, block) {
    this.blocks.set(`${x},${y},${z}`, block);
  }
  
  addEntity(entity) {
    this.entities.push(entity);
  }
  
  getEntitiesInBox(x1, y1, z1, x2, y2, z2) {
    // In the mock, just return all entities
    return this.entities;
  }
}

/**
 * Run all the tests for CopperGrateBlock
 * @returns {boolean} Whether all tests passed
 */
function run() {
  console.log('Running CopperGrateBlock Tests...');
  let success = true;
  
  try {
    // Basic Properties Tests
    console.log('\nTesting: Basic Properties');
    
    const grate = new CopperGrateBlock();
    
    // Verify basic properties
    assert.strictEqual(grate.id, 'copper_grate', 'id should be copper_grate');
    assert.strictEqual(grate.name, 'Copper Grate', 'name should be Copper Grate');
    assert.strictEqual(grate.hardness, 3.0, 'hardness should be 3.0');
    assert.strictEqual(grate.toolType, 'pickaxe', 'toolType should be pickaxe');
    assert.strictEqual(grate.oxidationState, 'none', 'oxidationState should be none');
    assert.strictEqual(grate.waxed, false, 'waxed should be false');
    
    // Verify grate specific properties
    assert.strictEqual(grate.transparent, true, 'transparent should be true');
    assert.strictEqual(grate.solid, false, 'solid should be false');
    assert.strictEqual(grate.filterEfficiency, 1.0, 'filterEfficiency should be 1.0');
    
    // Verify entity lists
    assert.ok(Array.isArray(grate.alwaysPassEntities), 'alwaysPassEntities should be an array');
    assert.ok(Array.isArray(grate.smallEntities), 'smallEntities should be an array');
    assert.ok(grate.alwaysPassEntities.includes('item'), 'alwaysPassEntities should include item');
    assert.ok(grate.smallEntities.includes('bat'), 'smallEntities should include bat');
    
    console.log('- Basic properties test passed');
    
    // Custom Oxidation State Test
    console.log('\nTesting: Custom Oxidation State');
    
    const weatheredGrate = new CopperGrateBlock({
      oxidationState: 'weathered',
      id: 'weathered_copper_grate',
      name: 'Weathered Copper Grate'
    });
    
    assert.strictEqual(weatheredGrate.id, 'weathered_copper_grate', 'id should be weathered_copper_grate');
    assert.strictEqual(weatheredGrate.name, 'Weathered Copper Grate', 'name should be Weathered Copper Grate');
    assert.strictEqual(weatheredGrate.oxidationState, 'weathered', 'oxidationState should be weathered');
    assert.strictEqual(weatheredGrate.filterEfficiency, 0.8, 'filterEfficiency should be 0.8 for weathered state');
    
    console.log('- Custom oxidation state test passed');
    
    // Filter Efficiency Test
    console.log('\nTesting: Filter Efficiency');
    
    const none = new CopperGrateBlock({ oxidationState: 'none' });
    const exposed = new CopperGrateBlock({ oxidationState: 'exposed' });
    const weathered = new CopperGrateBlock({ oxidationState: 'weathered' });
    const oxidized = new CopperGrateBlock({ oxidationState: 'oxidized' });
    
    assert.strictEqual(none.filterEfficiency, 1.0, 'none efficiency should be 1.0');
    assert.strictEqual(exposed.filterEfficiency, 0.9, 'exposed efficiency should be 0.9');
    assert.strictEqual(weathered.filterEfficiency, 0.8, 'weathered efficiency should be 0.8');
    assert.strictEqual(oxidized.filterEfficiency, 0.7, 'oxidized efficiency should be 0.7');
    
    console.log('- Filter efficiency by oxidation state test passed');
    
    // Efficiency Update On Oxidation Test
    console.log('\nTesting: Filter Efficiency Update On Oxidation');
    
    const testGrate = new CopperGrateBlock();
    const world = new MockWorld();
    const position = { x: 0, y: 0, z: 0 };
    
    // Initial state
    assert.strictEqual(testGrate.oxidationState, 'none', 'initial oxidationState should be none');
    assert.strictEqual(testGrate.filterEfficiency, 1.0, 'initial filterEfficiency should be 1.0');
    
    // Force oxidation by setting timer near threshold
    testGrate.oxidationTimer = testGrate.oxidationThreshold - 1;
    
    // Update with enough time to trigger oxidation
    const update = testGrate.update(world, position, 2);
    
    // Verify the grate oxidized and filter efficiency changed
    assert.notStrictEqual(update, null, 'update should not be null');
    assert.strictEqual(update.oxidationState, 'exposed', 'oxidationState should be exposed');
    assert.strictEqual(update.filterEfficiency, 0.9, 'filterEfficiency should be updated to 0.9');
    
    console.log('- Filter efficiency update on oxidation test passed');
    
    // Entity Filtering Tests
    console.log('\nTesting: Entity Filtering');
    
    // Test always-pass entities
    const itemEntity = new MockEntity('item');
    const canItemPass = testGrate.canEntityPassThrough(itemEntity);
    assert.strictEqual(canItemPass, true, 'items should always pass through');
    
    // Test small entity with probability
    const oxidizedGrate = new CopperGrateBlock({ oxidationState: 'oxidized' });
    const batEntity = new MockEntity('bat');
    
    // With 70% efficiency (oxidized), we expect most entities to pass
    let passCount = 0;
    const trials = 100;
    
    for (let i = 0; i < trials; i++) {
      if (oxidizedGrate.canEntityPassThrough(batEntity)) {
        passCount++;
      }
    }
    
    // Check that roughly 70% of attempts pass (with some margin for randomness)
    const passRate = passCount / trials;
    assert.ok(passRate > 0.5, 'Pass rate should be around 70% for oxidized grate');
    assert.ok(passRate < 0.9, 'Pass rate should be around 70% for oxidized grate');
    
    console.log('- Small entity pass rate test passed');
    
    // Test larger entity blocking
    const zombieEntity = new MockEntity('zombie');
    const canZombiePass = testGrate.canEntityPassThrough(zombieEntity);
    assert.strictEqual(canZombiePass, false, 'larger entities should be blocked');
    
    console.log('- Large entity blocking test passed');
    
    // Entity Processing Test
    console.log('\nTesting: Entity Processing');
    
    const processingGrate = new CopperGrateBlock();
    const processingWorld = new MockWorld();
    const processingPosition = { x: 0, y: 0, z: 0 };
    
    // Add entities to the world
    const testItemEntity = new MockEntity('item');
    const testBatEntity = new MockEntity('bat');
    const testZombieEntity = new MockEntity('zombie');
    
    processingWorld.addEntity(testItemEntity);
    processingWorld.addEntity(testBatEntity);
    processingWorld.addEntity(testZombieEntity);
    
    // Directly call the entity processing method
    processingGrate.processEntitiesPassingThrough(processingWorld, processingPosition);
    
    // Check that the correct entities had collision disabled
    assert.strictEqual(testItemEntity.noCollision, true, 'Item should pass through (noCollision == true)');
    
    // Either bat passes or its velocity is reduced
    const batPassing = testBatEntity.noCollision === true;
    const batSlowed = testBatEntity.velocity.x < 1.0;
    
    assert.ok(batPassing || batSlowed, 'Bat should either pass through or be slowed');
    
    // Zombie should not have collision disabled
    assert.strictEqual(testZombieEntity.noCollision, false, 'Zombie should not pass through');
    
    console.log('- Entity processing test passed');
    
    // Waxed Oxidation Prevention Test
    console.log('\nTesting: Waxed Oxidation Prevention');
    
    const waxedGrate = new CopperGrateBlock({ waxed: true });
    
    // Force oxidation by setting timer near threshold
    waxedGrate.oxidationTimer = waxedGrate.oxidationThreshold - 1;
    
    // Update with enough time to trigger oxidation
    const waxedUpdate = waxedGrate.update(world, position, 2);
    
    // Verify the grate did not oxidize
    assert.strictEqual(waxedUpdate, null, 'waxedUpdate should be null');
    assert.strictEqual(waxedGrate.oxidationState, 'none', 'oxidationState should still be none');
    
    console.log('- Waxed oxidation prevention test passed');
    
    // Serialization Tests
    console.log('\nTesting: Serialization');
    
    // Create grate with specific state
    const serializationGrate = new CopperGrateBlock({
      oxidationState: 'weathered',
      waxed: true,
      id: 'waxed_weathered_copper_grate',
      name: 'Waxed Weathered Copper Grate'
    });
    
    // Serialize
    const serialized = serializationGrate.serialize();
    
    // Verify serialized data
    assert.strictEqual(serialized.id, 'waxed_weathered_copper_grate', 'serialized.id should match');
    assert.strictEqual(serialized.oxidationState, 'weathered', 'serialized.oxidationState should match');
    assert.strictEqual(serialized.waxed, true, 'serialized.waxed should match');
    assert.strictEqual(serialized.filterEfficiency, 0.8, 'serialized.filterEfficiency should match');
    
    // Deserialize
    const deserialized = CopperGrateBlock.deserialize(serialized);
    
    // Verify deserialized block
    assert.strictEqual(deserialized.id, 'waxed_weathered_copper_grate', 'deserialized.id should match');
    assert.strictEqual(deserialized.oxidationState, 'weathered', 'deserialized.oxidationState should match');
    assert.strictEqual(deserialized.waxed, true, 'deserialized.waxed should match');
    assert.strictEqual(deserialized.filterEfficiency, 0.8, 'deserialized.filterEfficiency should match');
    
    console.log('- Serialization and deserialization test passed');
    
    console.log('\n✅ ALL TESTS PASSED: CopperGrateBlock tests completed successfully');
  } catch (error) {
    console.error(`❌ TEST FAILED: ${error.message}`);
    console.error(error.stack);
    success = false;
  }
  
  return success;
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const success = run();
  process.exit(success ? 0 : 1);
}

module.exports = { run }; 