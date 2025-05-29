const assert = require('assert');
const TestBase = require('./testBase');
const AncientSeedBlock = require('../blocks/ancientSeedBlock');
const AncientPlantBlock = require('../blocks/ancientPlantBlock');
const World = require('../world/world');
const Player = require('../entities/player');
const BiomeRegistry = require('../biomes/biomeRegistry');

class AncientSeedsTest extends TestBase {
  constructor() {
    super();
    this.world = new World();
    this.biomeRegistry = new BiomeRegistry();
    this.world.setBiomeRegistry(this.biomeRegistry);
    
    this.player = new Player({
      id: 'test-player',
      name: 'TestPlayer',
      permissions: ['block.place', 'block.break']
    });
    
    this.world.addPlayer(this.player);
  }

  async runTests() {
    console.log('\nRunning Ancient Seeds Tests...');
    
    await this.testSeedPlacement();
    await this.testPlantGrowth();
    await this.testBiomeIntegration();
    
    console.log('All Ancient Seeds tests completed!');
  }

  async testSeedPlacement() {
    this.runTest('Seed placement mechanics', () => {
      const seed = new AncientSeedBlock();
      const position = { x: 0, y: 64, z: 0 };
      
      // Test valid placement
      const result = seed.place(this.world, position, this.player);
      assert.strictEqual(result, true, 'Should place seed successfully');
      
      const placedBlock = this.world.getBlock(position.x, position.y, position.z);
      assert.ok(placedBlock instanceof AncientSeedBlock, 'Should place AncientSeedBlock');
      
      // Test invalid placement (non-farmland)
      const invalidPosition = { x: 0, y: 65, z: 0 };
      const invalidResult = seed.place(this.world, invalidPosition, this.player);
      assert.strictEqual(invalidResult, false, 'Should not place on non-farmland');
    });
  }

  async testPlantGrowth() {
    this.runTest('Plant growth mechanics', () => {
      const plant = new AncientPlantBlock({ variant: 'torchflower' });
      const position = { x: 0, y: 64, z: 0 };
      
      // Place plant
      this.world.setBlock(position.x, position.y, position.z, plant);
      
      // Test growth with good conditions
      this.world.setLightLevel(position.x, position.y, position.z, 15);
      this.world.setMoisture(position.x, position.y, position.z, 0.8);
      
      plant.onRandomTick(this.world, position);
      assert.strictEqual(plant.growthStage, 1, 'Should grow with good conditions');
      
      // Test growth with poor conditions
      this.world.setLightLevel(position.x, position.y, position.z, 3);
      plant.onRandomTick(this.world, position);
      assert.strictEqual(plant.growthStage, 1, 'Should not grow with poor light');
      
      // Test growth rate calculation
      const goodResult = plant.canGrow(this.world, position);
      assert.strictEqual(goodResult, true, 'Should grow with good conditions');
      
      this.world.setLightLevel(position.x, position.y, position.z, 3);
      const poorLightResult = plant.canGrow(this.world, position);
      assert.strictEqual(poorLightResult, false, 'Should not grow with poor light');
      
      this.world.setLightLevel(position.x, position.y, position.z, 15);
      this.world.setMoisture(position.x, position.y, position.z, 0.1);
      const poorSoilResult = plant.canGrow(this.world, position);
      assert.strictEqual(poorSoilResult, false, 'Should not grow with poor soil');
    });
  }

  async testBiomeIntegration() {
    this.runTest('Biome effects on growth rate', () => {
      // Create plant for testing
      const plant = new AncientPlantBlock({ variant: 'torchflower' });
      const position = { x: 0, y: 64, z: 0 };
      
      // Test in default plains biome
      const plainsGrowthRate = plant.getGrowthRateForBiome(this.world, position);
      
      // Test in different biomes
      this.world.setBiomeAt(position.x, position.z, this.biomeRegistry.getBiome('jungle'));
      const jungleGrowthRate = plant.getGrowthRateForBiome(this.world, position);
      
      this.world.setBiomeAt(position.x, position.z, this.biomeRegistry.getBiome('desert'));
      const desertGrowthRate = plant.getGrowthRateForBiome(this.world, position);
      
      // Different biomes should have different effects
      assert.notStrictEqual(plainsGrowthRate, jungleGrowthRate, 'Jungle should have different growth rate than plains');
      assert.notStrictEqual(plainsGrowthRate, desertGrowthRate, 'Desert should have different growth rate than plains');
    });
  }
}

// Run the tests
const test = new AncientSeedsTest();
test.runTests(); 