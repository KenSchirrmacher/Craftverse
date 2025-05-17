/**
 * Wind Turbine Test - Tests for the Wind Turbine structure
 * Part of the 1.22 Sorcery Update
 */

const assert = require('assert');
const WindTurbine = require('../structures/windTurbine');
const WindTurbineGenerator = require('../utils/structures/windTurbineGenerator');
const WindEnergyTransmitter = require('../blocks/windEnergyTransmitter');

// Mock classes
class MockWorld {
  constructor() {
    this.blocks = new Map();
    this.structures = [];
    this.redstoneSignals = {};
    this.weatherState = { state: 'clear' };
    this.biomes = new Map();
    this.structurePlacementAttempts = [];
    this.structureChecks = [];
  }
  
  setBlock(position, block) {
    const key = `${position.x},${position.y},${position.z}`;
    this.blocks.set(key, block);
  }
  
  getBlock(position) {
    const key = `${position.x},${position.y},${position.z}`;
    return this.blocks.get(key);
  }
  
  addStructure(structure) {
    this.structures.push(structure);
  }
  
  getStructures(type) {
    if (type) {
      return this.structures.filter(s => s.type === type);
    }
    return this.structures;
  }
  
  updateRedstoneSignal(position, signalStrength) {
    const key = `${position.x},${position.y},${position.z}`;
    this.redstoneSignals[key] = signalStrength;
  }
  
  getRedstoneSignal(position) {
    const key = `${position.x},${position.y},${position.z}`;
    return this.redstoneSignals[key] || 0;
  }
  
  getWeatherState() {
    return this.weatherState;
  }
  
  setWeatherState(state) {
    this.weatherState = state;
  }
  
  getSpawnPosition() {
    return { x: 0, y: 64, z: 0 };
  }
  
  getBiomeAt(position) {
    const key = `${Math.floor(position.x / 16)},${Math.floor(position.z / 16)}`;
    return this.biomes.get(key) || { id: 'plains' };
  }
  
  setBiomeAt(position, biome) {
    const key = `${Math.floor(position.x / 16)},${Math.floor(position.z / 16)}`;
    this.biomes.set(key, biome);
  }
  
  checkStructurePlacement(structureType, position) {
    this.structurePlacementAttempts.push({ structureType, position });
    
    // For the test, we'll return true for specific coordinates
    if (position.x === 500 && position.z === 500) {
      return true;
    }
    return false;
  }
  
  addStructureCheck(structureType, position, result) {
    this.structureChecks.push({ structureType, position, result });
  }
}

// Run all tests
function runTests() {
  console.log('Starting Wind Turbine Tests...');
  
  testTurbineCreation();
  testWindTurbineGeneration();
  testEnergyTransmitter();
  testWeatherEffects();
  testHeightEffects();
  testObstructions();
  testPlacementRules();
  testWorldGeneration();
  
  console.log('All Wind Turbine tests completed successfully!');
}

/**
 * Test Wind Turbine creation
 */
function testTurbineCreation() {
  console.log('Testing Wind Turbine creation...');
  
  // Create a new Wind Turbine
  const turbine = new WindTurbine({
    position: { x: 0, y: 80, z: 0 },
    height: 12,
    rotorSize: 7
  });
  
  // Test properties
  assert.strictEqual(turbine.position.x, 0, 'Position X should match');
  assert.strictEqual(turbine.position.y, 80, 'Position Y should match');
  assert.strictEqual(turbine.position.z, 0, 'Position Z should match');
  assert.strictEqual(turbine.height, 12, 'Height should match');
  assert.strictEqual(turbine.rotorSize, 7, 'Rotor size should match');
  assert.strictEqual(turbine.energyOutput, 0, 'Initial energy output should be 0');
  assert.strictEqual(turbine.active, false, 'Turbine should not be active initially');
  
  console.log('Wind Turbine creation tests passed!');
}

/**
 * Test Wind Turbine generation
 */
function testWindTurbineGeneration() {
  console.log('Testing Wind Turbine generation...');
  
  const world = new MockWorld();
  const position = { x: 0, y: 80, z: 0 };
  const blockSetter = (key, block) => {
    const [x, y, z] = key.split(',').map(Number);
    world.setBlock({ x, y, z }, block);
  };
  
  // Create generator
  const generator = new WindTurbineGenerator(world);
  
  // Generate the structure
  const structure = generator.generate(position, {
    height: 10,
    rotorSize: 5,
    rotorFacing: 'north'
  }, blockSetter);
  
  // Test structure properties
  assert.strictEqual(structure.position.x, position.x, 'Structure X position should match');
  assert.strictEqual(structure.position.y, position.y, 'Structure Y position should match');
  assert.strictEqual(structure.position.z, position.z, 'Structure Z position should match');
  assert.strictEqual(structure.height, 10, 'Structure height should match');
  assert.strictEqual(structure.rotorSize, 5, 'Structure rotor size should match');
  assert.strictEqual(structure.rotorFacing, 'north', 'Structure rotor facing should match');
  
  // Test blocks were placed
  assert.ok(world.getBlock({ x: 0, y: 80, z: 0 }), 'Base block should be placed');
  assert.ok(world.getBlock({ x: 0, y: 89, z: 0 }), 'Top block should be placed');
  
  // Check for energy transmitter at the base
  const transmitter = world.getBlock({ x: 0, y: 80, z: 0 });
  assert.strictEqual(transmitter.type, 'wind_energy_transmitter', 'Energy transmitter should be placed at the base');
  
  // Check for redstone blocks around the base
  assert.strictEqual(world.getBlock({ x: 1, y: 80, z: 0 }).type, 'redstone_block', 'Redstone block should be placed');
  assert.strictEqual(world.getBlock({ x: -1, y: 80, z: 0 }).type, 'redstone_block', 'Redstone block should be placed');
  assert.strictEqual(world.getBlock({ x: 0, y: 80, z: 1 }).type, 'redstone_block', 'Redstone block should be placed');
  assert.strictEqual(world.getBlock({ x: 0, y: 80, z: -1 }).type, 'redstone_block', 'Redstone block should be placed');
  
  console.log('Wind Turbine generation tests passed!');
}

/**
 * Test Wind Energy Transmitter
 */
function testEnergyTransmitter() {
  console.log('Testing Wind Energy Transmitter...');
  
  const world = new MockWorld();
  
  // Create a Wind Energy Transmitter
  const transmitter = new WindEnergyTransmitter();
  transmitter.position = { x: 0, y: 80, z: 0 };
  transmitter.world = world;
  
  // Test initial state
  assert.strictEqual(transmitter.energyLevel, 0, 'Initial energy level should be 0');
  assert.strictEqual(transmitter.isActive, false, 'Transmitter should not be active initially');
  
  // Test energy update
  transmitter.updateEnergyLevel(10);
  assert.strictEqual(transmitter.energyLevel, 10, 'Energy level should be updated');
  assert.strictEqual(transmitter.isActive, true, 'Transmitter should be active after energy update');
  
  // Test redstone signal emission
  transmitter.emitRedstoneSignal();
  assert.strictEqual(world.getRedstoneSignal({ x: 0, y: 80, z: 0 }), 10, 'Redstone signal should match energy level');
  
  // Test connecting and disconnecting blocks
  const receivingBlock = {
    position: { x: 1, y: 80, z: 0 },
    block: {
      receiveEnergy: (energy) => { receivingBlock.energy = energy; }
    }
  };
  
  // Connect block
  assert.ok(transmitter.connectBlock(receivingBlock), 'Block should be connected successfully');
  assert.strictEqual(transmitter.connectedBlocks.length, 1, 'Connected blocks list should have one item');
  assert.strictEqual(receivingBlock.energy, 10, 'Connected block should receive energy immediately');
  
  // Update energy and check if connected block receives update
  transmitter.updateEnergyLevel(15);
  assert.strictEqual(receivingBlock.energy, 15, 'Connected block should receive updated energy');
  
  // Disconnect block
  assert.ok(transmitter.disconnectBlock({ x: 1, y: 80, z: 0 }), 'Block should be disconnected successfully');
  assert.strictEqual(transmitter.connectedBlocks.length, 0, 'Connected blocks list should be empty');
  
  console.log('Wind Energy Transmitter tests passed!');
}

/**
 * Test weather effects on Wind Turbine
 */
function testWeatherEffects() {
  console.log('Testing weather effects on Wind Turbine...');
  
  const world = new MockWorld();
  
  // Create a Wind Turbine
  const turbine = new WindTurbine({
    position: { x: 0, y: 100, z: 0 },
    height: 15,
    maxEnergyOutput: 15
  });
  turbine.setWorld(world);
  
  // Test different weather states
  
  // Clear weather
  world.setWeatherState({ state: 'clear' });
  turbine.update(world, 1000);
  const clearOutput = turbine.energyOutput;
  
  // Rainy weather (should increase output)
  world.setWeatherState({ state: 'rain' });
  turbine.update(world, 1021); // 21 ticks later to trigger update
  const rainOutput = turbine.energyOutput;
  assert.ok(rainOutput > clearOutput, 'Rain should increase energy output');
  
  // Thunder weather (should increase output even more)
  world.setWeatherState({ state: 'thunder' });
  turbine.update(world, 1042); // 21 ticks later
  const thunderOutput = turbine.energyOutput;
  assert.ok(thunderOutput > rainOutput, 'Thunder should increase energy output further');
  
  console.log('Weather effect tests passed!');
}

/**
 * Test height effects on Wind Turbine
 */
function testHeightEffects() {
  console.log('Testing height effects on Wind Turbine...');
  
  const world = new MockWorld();
  world.setWeatherState({ state: 'clear' }); // Use consistent weather
  
  // Create a low altitude turbine
  const lowTurbine = new WindTurbine({
    position: { x: 0, y: 64, z: 0 }, // Just above ground level
    height: 10,
    maxEnergyOutput: 15
  });
  lowTurbine.setWorld(world);
  lowTurbine.update(world, 1000);
  
  // Create a medium altitude turbine
  const mediumTurbine = new WindTurbine({
    position: { x: 0, y: 100, z: 0 }, // Medium height
    height: 10,
    maxEnergyOutput: 15
  });
  mediumTurbine.setWorld(world);
  mediumTurbine.update(world, 1000);
  
  // Create a high altitude turbine
  const highTurbine = new WindTurbine({
    position: { x: 0, y: 150, z: 0 }, // High altitude
    height: 10,
    maxEnergyOutput: 15
  });
  highTurbine.setWorld(world);
  highTurbine.update(world, 1000);
  
  // Test height effects
  assert.ok(mediumTurbine.energyOutput > lowTurbine.energyOutput, 'Medium altitude should produce more energy than low altitude');
  assert.ok(highTurbine.energyOutput > mediumTurbine.energyOutput, 'High altitude should produce more energy than medium altitude');
  
  console.log('Height effect tests passed!');
}

/**
 * Test obstructions affecting Wind Turbine
 */
function testObstructions() {
  console.log('Testing obstructions affecting Wind Turbine...');
  
  const world = new MockWorld();
  
  // Create a Wind Turbine
  const turbine = new WindTurbine({
    position: { x: 0, y: 80, z: 0 },
    height: 10,
    rotorSize: 5,
    maxEnergyOutput: 15
  });
  turbine.setWorld(world);
  
  // Test unobstructed operation
  turbine.update(world, 1000);
  const unobstructedOutput = turbine.energyOutput;
  assert.ok(unobstructedOutput > 0, 'Unobstructed turbine should produce energy');
  
  // Place an obstruction near the rotor
  world.setBlock({ x: 3, y: 90, z: 0 }, { type: 'stone', solid: true });
  
  // Test with obstruction
  turbine.update(world, 1021); // 21 ticks later
  assert.strictEqual(turbine.energyOutput, 0, 'Obstructed turbine should not produce energy');
  assert.strictEqual(turbine.active, false, 'Obstructed turbine should not be active');
  
  // Remove obstruction
  world.setBlock({ x: 3, y: 90, z: 0 }, { type: 'air', solid: false });
  
  // Test after obstruction removal
  turbine.update(world, 1042); // 21 ticks later
  assert.ok(turbine.energyOutput > 0, 'Turbine should produce energy after obstruction removal');
  assert.strictEqual(turbine.active, true, 'Turbine should be active after obstruction removal');
  
  console.log('Obstruction tests passed!');
}

/**
 * Test placement rules for Wind Turbines
 */
function testPlacementRules() {
  console.log('Testing Wind Turbine placement rules...');
  
  const world = new MockWorld();
  
  // For testing purposes, we need to pass testMode option
  // This overrides normal location finding with a test-friendly approach
  const position = WindTurbine.findSuitableLocation(world, { testMode: true });
  assert.ok(position, 'Should find a suitable position for wind turbine');
  assert.ok(position.y >= 64, 'Position should be above ground level');
  
  // Manually create suitable area
  const hillPos = { x: 20, y: 75, z: 20 };
  
  // Create a 9x9 solid platform
  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      world.setBlock({ 
        x: hillPos.x + dx, 
        y: hillPos.y,
        z: hillPos.z + dz 
      }, { type: 'grass_block', solid: true });
    }
  }
  
  // Perform manual area suitability check - should pass
  const areaSuitable = WindTurbine.checkAreaSuitability(
    world, 
    hillPos,
    { width: 7, height: 1, length: 7 }
  );
  
  assert.strictEqual(areaSuitable, true, 'Created area should be suitable for wind turbine');
  
  // Test actual turbine generation on our suitable spot
  const turbine = WindTurbine.generate(world, hillPos, { height: 10, rotorSize: 5 });
  assert.ok(turbine, 'Wind turbine should be generated on suitable area');
  
  console.log('Wind Turbine placement rule tests passed!');
}

/**
 * Test world generation integration for Wind Turbines
 */
function testWorldGeneration() {
  console.log('Testing Wind Turbine world generation integration...');
  
  const world = new MockWorld();
  
  // Create a mock structure generator just for testing
  const mockStructureGenerator = new MockStructureGenerator(world);
  
  // Test specific location for wind turbine placement
  world.checkStructurePlacement('wind_turbine', { x: 500, y: 0, z: 500 });
  
  // Setup some varied terrain and biomes
  // Plains biome (should allow turbines)
  world.setBiomeAt({ x: 500, z: 500 }, { id: 'plains' });
  for (let y = 0; y < 65; y++) {
    world.setBlock({ x: 500, y, z: 500 }, { type: 'stone', solid: true });
  }
  world.setBlock({ x: 500, y: 65, z: 500 }, { type: 'grass_block', solid: true });
  
  // Ocean biome (shouldn't be ideal for turbines)
  world.setBiomeAt({ x: 1000, z: 1000 }, { id: 'ocean' });
  for (let y = 0; y < 60; y++) {
    world.setBlock({ x: 1000, y, z: 1000 }, { type: 'stone', solid: true });
  }
  
  // Forest biome (trees could obstruct)
  world.setBiomeAt({ x: 1500, z: 1500 }, { id: 'forest' });
  for (let y = 0; y < 68; y++) {
    world.setBlock({ x: 1500, y, z: 1500 }, { type: 'stone', solid: true });
  }
  world.setBlock({ x: 1500, y: 68, z: 1500 }, { type: 'grass_block', solid: true });
  
  // Test suitability of our specific plains location
  // Make it suitable for the test
  const plainsPosition = { x: 500, y: 65, z: 500 };
  for (let dx = -5; dx <= 5; dx++) {
    for (let dz = -5; dz <= 5; dz++) {
      world.setBlock({ x: plainsPosition.x + dx, y: plainsPosition.y, z: plainsPosition.z + dz }, 
        { type: 'grass_block', solid: true });
    }
  }
  
  // Test plains suitability (should be suitable)
  const plainsSuitable = WindTurbine.checkAreaSuitability(world, 
    { x: plainsPosition.x, y: plainsPosition.y, z: plainsPosition.z }, 
    { width: 5, height: 1, length: 5 }
  );
  assert.ok(plainsSuitable, 'Plains biome should be suitable for wind turbine');
  
  // Test actual structure generation in world
  const turbine = WindTurbine.generate(world, plainsPosition, { height: 10, rotorSize: 5 });
  assert.ok(turbine, 'Wind turbine should be generated in plains biome');
  assert.strictEqual(turbine.position.x, plainsPosition.x, 'Turbine X position should match');
  assert.strictEqual(turbine.position.y, plainsPosition.y, 'Turbine Y position should match');
  assert.strictEqual(turbine.position.z, plainsPosition.z, 'Turbine Z position should match');
  
  console.log('Wind Turbine world generation integration tests passed!');
}

// Mock structure generator for world generation tests
class MockStructureGenerator {
  constructor(world) {
    this.world = world;
  }
  
  checkWindTurbinePlacement(position) {
    return WindTurbine.checkAreaSuitability(
      this.world, 
      position, 
      { width: 9, height: 1, length: 9 }
    );
  }
}

// Run all tests when this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests
}; 