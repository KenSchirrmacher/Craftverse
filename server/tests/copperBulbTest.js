/**
 * Tests for CopperBulbBlock implementation
 * Verifies the functionality of copper bulbs for 1.21 Tricky Trials update
 */

const assert = require('assert');
const CopperBulbBlock = require('../blocks/copperBulbBlock');

// Mock world for testing
class MockWorld {
  constructor() {
    this.blocks = new Map();
    this.redstonePower = 0;
  }
  
  getBlockAt(x, y, z) {
    return this.blocks.get(`${x},${y},${z}`);
  }
  
  setBlockAt(x, y, z, block) {
    this.blocks.set(`${x},${y},${z}`, block);
  }
  
  getRedstonePowerAt(x, y, z) {
    return this.redstonePower;
  }
  
  setRedstonePower(power) {
    this.redstonePower = power;
  }
}

/**
 * Run all the tests for CopperBulbBlock
 * @returns {boolean} Whether all tests passed
 */
function run() {
  console.log('Running CopperBulbBlock Tests...');
  let success = true;
  
  try {
    // Basic Properties Tests
    console.log('\nTesting: Basic Properties');
    
    const bulb = new CopperBulbBlock();
    
    // Verify basic properties
    assert.strictEqual(bulb.id, 'copper_bulb', 'id should be copper_bulb');
    assert.strictEqual(bulb.name, 'Copper Bulb', 'name should be Copper Bulb');
    assert.strictEqual(bulb.hardness, 3.0, 'hardness should be 3.0');
    assert.strictEqual(bulb.toolType, 'pickaxe', 'toolType should be pickaxe');
    assert.strictEqual(bulb.oxidationState, 'none', 'oxidationState should be none');
    assert.strictEqual(bulb.waxed, false, 'waxed should be false');
    
    // Verify copper bulb specific properties
    assert.strictEqual(bulb.powered, false, 'powered should be false');
    assert.strictEqual(bulb.lightLevel, 0, 'lightLevel should be 0');
    assert.strictEqual(bulb.baseLightLevel, 15, 'baseLightLevel should be 15');
    assert.strictEqual(bulb.emitsRedstone, false, 'emitsRedstone should be false');
    
    console.log('- Basic properties test passed');
    
    // Custom Oxidation State Test
    console.log('\nTesting: Custom Oxidation State');
    
    const weatheredBulb = new CopperBulbBlock({
      oxidationState: 'weathered',
      id: 'weathered_copper_bulb',
      name: 'Weathered Copper Bulb'
    });
    
    assert.strictEqual(weatheredBulb.id, 'weathered_copper_bulb', 'id should be weathered_copper_bulb');
    assert.strictEqual(weatheredBulb.name, 'Weathered Copper Bulb', 'name should be Weathered Copper Bulb');
    assert.strictEqual(weatheredBulb.oxidationState, 'weathered', 'oxidationState should be weathered');
    
    console.log('- Custom oxidation state test passed');
    
    // Waxed State Test
    console.log('\nTesting: Waxed State');
    
    const waxedBulb = new CopperBulbBlock({
      waxed: true,
      id: 'waxed_copper_bulb',
      name: 'Waxed Copper Bulb'
    });
    
    assert.strictEqual(waxedBulb.id, 'waxed_copper_bulb', 'id should be waxed_copper_bulb');
    assert.strictEqual(waxedBulb.waxed, true, 'waxed should be true');
    
    console.log('- Waxed state test passed');
    
    // Redstone Interaction Tests
    console.log('\nTesting: Redstone Interaction');
    
    const testBulb = new CopperBulbBlock();
    const world = new MockWorld();
    const position = { x: 0, y: 0, z: 0 };
    
    // Test initial state
    assert.strictEqual(testBulb.powered, false, 'initial powered should be false');
    assert.strictEqual(testBulb.lightLevel, 0, 'initial lightLevel should be 0');
    
    // Apply redstone power
    world.setRedstonePower(15);
    
    // Update the bulb
    const update = testBulb.update(world, position, 1);
    
    // Verify the update result
    assert.notStrictEqual(update, null, 'update should not be null');
    assert.strictEqual(update.powered, true, 'update.powered should be true');
    assert.strictEqual(update.lightLevel, 15, 'update.lightLevel should be 15');
    
    // Apply the update to the bulb
    testBulb.powered = update.powered;
    testBulb.lightLevel = update.lightLevel;
    
    // Verify the bulb state after update
    assert.strictEqual(testBulb.powered, true, 'powered should be true after update');
    assert.strictEqual(testBulb.lightLevel, 15, 'lightLevel should be 15 after update');
    
    console.log('- Redstone power detection test passed');
    
    // Test power removal
    const poweredBulb = new CopperBulbBlock({ powered: true });
    poweredBulb.lightLevel = poweredBulb.baseLightLevel;
    world.setRedstonePower(0);
    
    // Reset cooldown to allow immediate update
    poweredBulb.redstoneCooldown = 0;
    
    // Update the bulb
    const powerOffUpdate = poweredBulb.update(world, position, 1);
    
    // Verify power was removed
    assert.notStrictEqual(powerOffUpdate, null, 'powerOffUpdate should not be null');
    assert.strictEqual(powerOffUpdate.powered, false, 'powerOffUpdate.powered should be false');
    assert.strictEqual(powerOffUpdate.lightLevel, 0, 'powerOffUpdate.lightLevel should be 0');
    
    console.log('- Redstone power removal test passed');
    
    // Test redstone item interaction
    console.log('\nTesting: Redstone Item Interaction');
    
    const interactionBulb = new CopperBulbBlock();
    
    // Simulate using a redstone item on the bulb
    const result = interactionBulb.interact(
      { id: 'player1' }, // Mock player
      'use_item',
      { item: 'redstone_torch' }
    );
    
    // Verify interaction result
    assert.strictEqual(result.success, true, 'interaction should be successful');
    assert.strictEqual(result.newBlock.powered, true, 'interaction should power the bulb');
    assert.strictEqual(result.newBlock.lightLevel, 15, 'interaction should set light level to 15');
    
    console.log('- Redstone item interaction test passed');
    
    // Oxidation Tests
    console.log('\nTesting: Oxidation Mechanics');
    
    const oxidationBulb = new CopperBulbBlock({ powered: true });
    oxidationBulb.lightLevel = oxidationBulb.baseLightLevel;
    
    // Initial state
    assert.strictEqual(oxidationBulb.oxidationState, 'none', 'initial oxidationState should be none');
    assert.strictEqual(oxidationBulb.powered, true, 'initial powered should be true');
    
    // Force oxidation by setting timer near threshold
    oxidationBulb.oxidationTimer = oxidationBulb.oxidationThreshold - 1;
    
    // Update with enough time to trigger oxidation
    const oxidationUpdate = oxidationBulb.update(world, position, 2);
    
    // Verify the bulb oxidized while maintaining power
    assert.notStrictEqual(oxidationUpdate, null, 'oxidationUpdate should not be null');
    assert.strictEqual(oxidationUpdate.oxidationState, 'exposed', 'oxidationUpdate.oxidationState should be exposed');
    assert.strictEqual(oxidationUpdate.powered, true, 'oxidationUpdate.powered should be true');
    
    console.log('- Oxidation while maintaining power test passed');
    
    // Test waxed oxidation prevention
    const waxedOxidationBulb = new CopperBulbBlock({ waxed: true });
    
    // Force oxidation by setting timer near threshold
    waxedOxidationBulb.oxidationTimer = waxedOxidationBulb.oxidationThreshold - 1;
    
    // Update with enough time to trigger oxidation
    const waxedOxidationUpdate = waxedOxidationBulb.update(world, position, 2);
    
    // Verify the bulb did not oxidize
    assert.strictEqual(waxedOxidationUpdate, null, 'waxedOxidationUpdate should be null');
    assert.strictEqual(waxedOxidationBulb.oxidationState, 'none', 'oxidationState should still be none');
    
    console.log('- Waxed oxidation prevention test passed');
    
    // Serialization Tests
    console.log('\nTesting: Serialization');
    
    // Create bulb with specific state
    const serializationBulb = new CopperBulbBlock({
      oxidationState: 'weathered',
      waxed: true,
      id: 'waxed_weathered_copper_bulb',
      name: 'Waxed Weathered Copper Bulb'
    });
    serializationBulb.powered = true;
    serializationBulb.lightLevel = serializationBulb.baseLightLevel;
    
    // Serialize
    try {
      const serialized = serializationBulb.serialize();
      console.log('Serialized data:', JSON.stringify(serialized, null, 2));

      // Verify serialized data
      assert.strictEqual(serialized.id, 'waxed_weathered_copper_bulb', 'serialized.id should match');
      assert.strictEqual(serialized.oxidationState, 'weathered', 'serialized.oxidationState should match');
      assert.strictEqual(serialized.waxed, true, 'serialized.waxed should match');
      assert.strictEqual(serialized.powered, true, 'serialized.powered should match');
      assert.strictEqual(serialized.lightLevel, 15, 'serialized.lightLevel should match');
      
      // Deserialize
      const deserialized = CopperBulbBlock.deserialize(serialized);
      
      // Verify deserialized block
      assert.strictEqual(deserialized.id, 'waxed_weathered_copper_bulb', 'deserialized.id should match');
      assert.strictEqual(deserialized.oxidationState, 'weathered', 'deserialized.oxidationState should match');
      assert.strictEqual(deserialized.waxed, true, 'deserialized.waxed should match');
      assert.strictEqual(deserialized.powered, true, 'deserialized.powered should match');
      assert.strictEqual(deserialized.lightLevel, 15, 'deserialized.lightLevel should match');
    } catch (error) {
      console.error('Serialization error:', error);
      console.error('serializationBulb:', serializationBulb);
      throw error;
    }
    
    console.log('- Serialization and deserialization test passed');
    
    console.log('\n✅ ALL TESTS PASSED: CopperBulbBlock tests completed successfully');
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