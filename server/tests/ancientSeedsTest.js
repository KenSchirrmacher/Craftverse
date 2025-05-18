const assert = require('assert');
const TestBase = require('./testBase');
const AncientSeedItem = require('../items/ancientSeedItem');
const AncientPlantBlock = require('../blocks/ancientPlantBlock');
const WorldGenerator = require('../world/worldGenerator');

/**
 * Test suite for the Ancient Seeds feature
 * Part of the Minecraft 1.23 Update
 */
class AncientSeedsTest extends TestBase {
  constructor() {
    super('Ancient Seeds Tests');
    
    this.mockPlayer = {
      id: 'player-1',
      position: { x: 0, y: 64, z: 0 },
      inventory: {
        addItem: (item) => true,
        removeItem: (item) => true,
        hasItem: (itemType) => true
      },
      giveItem: (item) => true,
      emitSound: (sound, options) => true,
      rotation: { y: 0 }
    };
    
    this.mockWorld = {
      blocks: {},
      getBlockState: (x, y, z) => this.blocks[`${x},${y},${z}`] || null,
      setBlockState: (x, y, z, block) => {
        this.blocks[`${x},${y},${z}`] = block;
        return true;
      },
      getLightLevel: (x, y, z) => 15, // Default to full light
      getTemperature: (x, y, z) => 0.8, // Default to moderate temperature
      getMoisture: (x, y, z) => 0.6, // Default to moderate moisture
      getBiome: (x, y, z) => ({ type: 'plains' }) // Default to plains biome
    };
  }

  async runTests() {
    // Run all ancient seed tests
    await this.testAncientSeedBase();
    await this.testAncientSeedVariants();
    await this.testAncientPlantGrowth();
    await this.testHarvestingMechanics();
    await this.testSpecialEffects();
    await this.testBiomeIntegration();
    await this.testSeedRarity();
    await this.testCrossbreeding();
  }
  
  async testAncientSeedBase() {
    this.runTest('AncientSeedItem base functionality', () => {
      const seed = new AncientSeedItem();
      assert.strictEqual(seed.type, 'ancient_seed', 'Type should be set correctly');
      assert.strictEqual(seed.stackable, true, 'Seeds should be stackable');
      assert.strictEqual(seed.maxStackSize, 64, 'Max stack size should be 64');
      assert.strictEqual(seed.placeable, true, 'Seeds should be placeable');
      assert.strictEqual(typeof seed.place, 'function', 'Seeds should have a place method');
    });
    
    this.runTest('AncientSeedItem placement', () => {
      const seed = new AncientSeedItem();
      const position = { x: 0, y: 64, z: 0 };
      
      // Place the seed
      const result = seed.place(this.mockWorld, position, this.mockPlayer);
      assert.strictEqual(result, true, 'Placement should succeed');
      
      // Check block at placement position
      const placedBlock = this.mockWorld.getBlockState(position.x, position.y, position.z);
      assert.strictEqual(placedBlock.type, 'ancient_plant', 'Should create an ancient plant block');
      assert.strictEqual(placedBlock.growthStage, 0, 'Should start at growth stage 0');
    });
  }
  
  async testAncientSeedVariants() {
    this.runTest('Ancient seed variants', () => {
      // Test torchflower seed
      const torchflowerSeed = new AncientSeedItem({ variant: 'torchflower' });
      assert.strictEqual(torchflowerSeed.variant, 'torchflower', 'Variant should be set correctly');
      assert.strictEqual(torchflowerSeed.type, 'ancient_seed_torchflower', 'Type should include variant');
      
      // Test pitcher pod seed
      const pitcherPodSeed = new AncientSeedItem({ variant: 'pitcher_pod' });
      assert.strictEqual(pitcherPodSeed.variant, 'pitcher_pod', 'Variant should be set correctly');
      assert.strictEqual(pitcherPodSeed.type, 'ancient_seed_pitcher_pod', 'Type should include variant');
      
      // Test unique properties for each variant
      assert.notStrictEqual(torchflowerSeed.growthTime, pitcherPodSeed.growthTime, 'Different variants should have different growth times');
      assert.notStrictEqual(torchflowerSeed.lightRequirement, pitcherPodSeed.lightRequirement, 'Different variants should have different light requirements');
    });
    
    this.runTest('Unique seed variant properties', () => {
      // Test mystic seed (unique to 1.23 update)
      const mysticSeed = new AncientSeedItem({ variant: 'mystic' });
      assert.strictEqual(mysticSeed.variant, 'mystic', 'Variant should be set correctly');
      assert.strictEqual(typeof mysticSeed.specialEffect, 'function', 'Mystic seed should have a special effect function');
      
      // Test crystal seed (unique to 1.23 update)
      const crystalSeed = new AncientSeedItem({ variant: 'crystal' });
      assert.strictEqual(crystalSeed.variant, 'crystal', 'Variant should be set correctly');
      assert.strictEqual(typeof crystalSeed.getGrowthRequirements, 'function', 'Crystal seed should have growth requirements function');
    });
  }
  
  async testAncientPlantGrowth() {
    this.runTest('Ancient plant growth stages', () => {
      // Create a plant and simulate growth
      const plant = new AncientPlantBlock({ 
        variant: 'torchflower',
        growthStage: 0
      });
      
      // Test initial state
      assert.strictEqual(plant.growthStage, 0, 'Plant should start at stage 0');
      assert.strictEqual(plant.isFullyGrown, false, 'Plant should not be fully grown initially');
      
      // Simulate growth ticks
      plant.onRandomTick(this.mockWorld, { x: 0, y: 64, z: 0 });
      assert.strictEqual(plant.growthStage, 1, 'Plant should advance to stage 1');
      
      // Grow to full
      plant.growthStage = plant.maxGrowthStage - 1;
      plant.onRandomTick(this.mockWorld, { x: 0, y: 64, z: 0 });
      assert.strictEqual(plant.isFullyGrown, true, 'Plant should be fully grown at max stage');
    });
    
    this.runTest('Growth requirements check', () => {
      const plant = new AncientPlantBlock({ variant: 'crystal' });
      
      // Test with suitable conditions
      const goodResult = plant.canGrow(this.mockWorld, { x: 0, y: 64, z: 0 });
      assert.strictEqual(goodResult, true, 'Should grow in default conditions');
      
      // Test with poor light
      this.mockWorld.getLightLevel = () => 3;
      const poorLightResult = plant.canGrow(this.mockWorld, { x: 0, y: 64, z: 0 });
      assert.strictEqual(poorLightResult, false, 'Should not grow in poor light');
      
      // Reset and test with poor soil
      this.mockWorld.getLightLevel = () => 15;
      this.mockWorld.getMoisture = () => 0.1;
      const poorSoilResult = plant.canGrow(this.mockWorld, { x: 0, y: 64, z: 0 });
      assert.strictEqual(poorSoilResult, false, 'Should not grow in poor soil conditions');
    });
  }
  
  async testHarvestingMechanics() {
    this.runTest('Harvesting fully grown plants', () => {
      // Setup a fully grown plant
      const plant = new AncientPlantBlock({ 
        variant: 'torchflower',
        growthStage: 3, // Fully grown
      });
      
      // Test harvesting
      const drops = plant.getDrops();
      assert.ok(Array.isArray(drops), 'Drops should be an array');
      assert.ok(drops.length > 0, 'Fully grown plant should drop items');
      
      // Check for seeds in drops
      const seedDrop = drops.find(item => item.type.includes('ancient_seed'));
      assert.ok(seedDrop, 'Drops should include seeds');
      assert.ok(seedDrop.count >= 1, 'Should drop at least one seed');
      
      // Check for additional drops
      const flowerDrop = drops.find(item => item.type.includes('torchflower'));
      assert.ok(flowerDrop, 'Drops should include the plant itself');
    });
    
    this.runTest('Harvesting immature plants', () => {
      // Setup an immature plant
      const plant = new AncientPlantBlock({ 
        variant: 'pitcher_pod',
        growthStage: 1, // Not fully grown
      });
      
      // Test harvesting
      const drops = plant.getDrops();
      assert.ok(drops.length > 0, 'Should drop something');
      
      // Check for seeds in drops
      const seedDrop = drops.find(item => item.type.includes('ancient_seed'));
      assert.ok(seedDrop, 'Drops should include seeds');
      
      // No plant drop expected for immature plants
      const plantDrop = drops.find(item => item.type.includes('pitcher_pod') && !item.type.includes('seed'));
      assert.strictEqual(plantDrop, undefined, 'Should not drop the plant item when immature');
    });
  }
  
  async testSpecialEffects() {
    this.runTest('Mystic seed special effects', () => {
      // Create mystic plant
      const mysticPlant = new AncientPlantBlock({ 
        variant: 'mystic',
        growthStage: 3 // Fully grown
      });
      
      // Check particle effects
      assert.strictEqual(typeof mysticPlant.emitParticles, 'function', 'Should have particle emission function');
      
      // Check effect on players
      assert.strictEqual(typeof mysticPlant.applyEffectToPlayer, 'function', 'Should have player effect function');
      
      // Test effect application
      let effectApplied = false;
      const playerWithEffect = {
        ...this.mockPlayer,
        applyStatusEffect: (effect) => { 
          effectApplied = true; 
          return true;
        }
      };
      
      mysticPlant.applyEffectToPlayer(playerWithEffect);
      assert.strictEqual(effectApplied, true, 'Should apply status effect to player');
    });
    
    this.runTest('Crystal seed light emission', () => {
      // Create crystal plant
      const crystalPlant = new AncientPlantBlock({ 
        variant: 'crystal',
        growthStage: 3 // Fully grown
      });
      
      // Check light emission
      assert.strictEqual(typeof crystalPlant.getLightEmission, 'function', 'Should have light emission function');
      assert.ok(crystalPlant.getLightEmission() > 0, 'Should emit light when fully grown');
      
      // Check growth stage effect on light
      crystalPlant.growthStage = 1;
      assert.ok(crystalPlant.getLightEmission() < crystalPlant.getMaxLightEmission(), 'Light emission should be lower at earlier growth stages');
    });
  }
  
  async testBiomeIntegration() {
    this.runTest('Biome effects on growth rate', () => {
      // Create plant for testing
      const plant = new AncientPlantBlock({ variant: 'torchflower' });
      
      // Test in default plains biome
      const plainsGrowthRate = plant.getGrowthRateForBiome(this.mockWorld, { x: 0, y: 64, z: 0 });
      
      // Test in different biomes
      this.mockWorld.getBiome = () => ({ type: 'jungle' });
      const jungleGrowthRate = plant.getGrowthRateForBiome(this.mockWorld, { x: 0, y: 64, z: 0 });
      
      this.mockWorld.getBiome = () => ({ type: 'desert' });
      const desertGrowthRate = plant.getGrowthRateForBiome(this.mockWorld, { x: 0, y: 64, z: 0 });
      
      // Different biomes should have different effects
      assert.notStrictEqual(plainsGrowthRate, jungleGrowthRate, 'Jungle should have different growth rate than plains');
      assert.notStrictEqual(plainsGrowthRate, desertGrowthRate, 'Desert should have different growth rate than plains');
    });
    
    this.runTest('Natural generation in biomes', () => {
      const worldGen = new WorldGenerator();
      
      // Test ancient seed generation in lush caves
      const lushFeatures = worldGen.getBiomeFeatures('lush_caves');
      const hasAncientSeeds = lushFeatures.some(feature => 
        feature.type === 'vegetation' && feature.plants.some(p => p.includes('ancient_plant')));
      
      assert.strictEqual(hasAncientSeeds, true, 'Ancient plants should generate in lush caves');
      
      // Test absence in inappropriate biomes
      const desertFeatures = worldGen.getBiomeFeatures('desert');
      const noAncientSeedsDesert = !desertFeatures.some(feature => 
        feature.type === 'vegetation' && feature.plants.some(p => p.includes('ancient_plant')));
      
      assert.strictEqual(noAncientSeedsDesert, true, 'Ancient plants should not generate in deserts');
    });
  }
  
  async testSeedRarity() {
    this.runTest('Seed rarity tiers', () => {
      // Common variant
      const commonSeed = new AncientSeedItem({ variant: 'torchflower' });
      assert.strictEqual(commonSeed.rarity, 'common', 'Torchflower seeds should be common rarity');
      
      // Uncommon variant
      const uncommonSeed = new AncientSeedItem({ variant: 'pitcher_pod' });
      assert.strictEqual(uncommonSeed.rarity, 'uncommon', 'Pitcher pod seeds should be uncommon rarity');
      
      // Rare variant
      const rareSeed = new AncientSeedItem({ variant: 'mystic' });
      assert.strictEqual(rareSeed.rarity, 'rare', 'Mystic seeds should be rare');
      
      // Epic variant
      const epicSeed = new AncientSeedItem({ variant: 'crystal' });
      assert.strictEqual(epicSeed.rarity, 'epic', 'Crystal seeds should be epic rarity');
    });
    
    this.runTest('Drop chance based on rarity', () => {
      // Test drop chance calculation
      const commonSeed = new AncientSeedItem({ variant: 'torchflower' });
      const rareSeed = new AncientSeedItem({ variant: 'mystic' });
      
      assert.ok(commonSeed.getDropChance() > rareSeed.getDropChance(), 
                'Common seeds should have higher drop chance than rare seeds');
      
      // Test loot table integration
      const lootTable = AncientSeedItem.getLootTable('sniffer_dig');
      assert.ok(Array.isArray(lootTable), 'Loot table should be an array');
      assert.ok(lootTable.length >= 4, 'Loot table should contain all seed variants');
      
      // Check weightings in loot table
      const commonEntry = lootTable.find(entry => entry.item.includes('torchflower'));
      const rareEntry = lootTable.find(entry => entry.item.includes('mystic'));
      
      assert.ok(commonEntry.weight > rareEntry.weight, 
                'Common seeds should have higher weight in loot tables');
    });
  }
  
  async testCrossbreeding() {
    this.runTest('Seed crossbreeding mechanics', () => {
      // Test crossbreeding function
      const crossbreedResult = AncientSeedItem.crossbreed('torchflower', 'pitcher_pod');
      assert.ok(crossbreedResult, 'Crossbreeding should return a result');
      assert.strictEqual(typeof crossbreedResult.variant, 'string', 'Result should have a variant property');
      
      // Test specific combinations
      const rareCombination = AncientSeedItem.crossbreed('mystic', 'crystal');
      assert.strictEqual(rareCombination.rarity, 'epic', 'Rare seed combinations should produce epic results');
      
      // Test "failure" case (non-compatible combinations)
      const failedCombination = AncientSeedItem.crossbreed('torchflower', 'torchflower');
      assert.strictEqual(failedCombination.variant, 'torchflower', 'Same-type crossbreeding should not produce new variants');
    });
    
    this.runTest('Plant proximity crossbreeding', () => {
      // Setup test plants
      const plant1 = new AncientPlantBlock({ 
        variant: 'torchflower',
        growthStage: 3 // Fully grown
      });
      
      const plant2 = new AncientPlantBlock({ 
        variant: 'pitcher_pod',
        growthStage: 3 // Fully grown
      });
      
      // Place plants in the world
      this.mockWorld.setBlockState(0, 64, 0, plant1);
      this.mockWorld.setBlockState(1, 64, 0, plant2);
      
      // Check proximity detection
      const proximityResult = plant1.checkForNeighboringPlants(this.mockWorld, { x: 0, y: 64, z: 0 });
      assert.strictEqual(proximityResult.length, 1, 'Should detect one neighboring plant');
      assert.strictEqual(proximityResult[0].variant, 'pitcher_pod', 'Should identify the correct variant');
      
      // Test crossbreeding chance
      const crossbreedChance = plant1.calculateCrossbreedChance(this.mockWorld, { x: 0, y: 64, z: 0 });
      assert.ok(crossbreedChance > 0, 'Should have a chance to crossbreed');
      assert.ok(crossbreedChance <= 1, 'Chance should be a probability (0-1)');
    });
  }
}

module.exports = AncientSeedsTest; 