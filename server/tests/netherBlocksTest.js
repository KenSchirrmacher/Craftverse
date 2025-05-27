/**
 * Nether Blocks Test
 * Tests the functionality of blocks added in the Nether Update
 */

const assert = require('assert');
const {
  AncientDebrisBlock,
  BasaltBlock,
  PolishedBasaltBlock,
  BlackstoneBlock,
  PolishedBlackstoneBlock,
  ChiseledPolishedBlackstoneBlock,
  GildedBlackstoneBlock,
  NetherGoldOreBlock,
  SoulSoilBlock,
  SoulFireTorchBlock
} = require('../blocks/netherBlocks');
const { BlockFace } = require('../blocks/blockFace');

// Mock world for testing
class MockWorld {
  constructor() {
    this.blocks = {};
    this.events = [];
  }

  setBlock(position, block) {
    const posKey = `${position.x},${position.y},${position.z}`;
    this.blocks[posKey] = block;
    return true;
  }

  getBlockAt(position) {
    const posKey = `${position.x},${position.y},${position.z}`;
    return this.blocks[posKey];
  }

  removeBlock(position) {
    const posKey = `${position.x},${position.y},${position.z}`;
    if (this.blocks[posKey]) {
      delete this.blocks[posKey];
      return true;
    }
    return false;
  }

  // For tracking test events
  logEvent(event) {
    this.events.push(event);
  }
}

// Mock player for testing
class MockPlayer {
  constructor(id) {
    this.id = id;
    this.inventory = {};
    this.effects = {};
    this.enchantments = {};
    this.position = { x: 0, y: 0, z: 0 };
  }

  giveItem(type, count) {
    if (!this.inventory[type]) {
      this.inventory[type] = 0;
    }
    this.inventory[type] += count;
  }

  hasEnchantment(name) {
    return !!this.enchantments[name];
  }

  addEnchantment(name, level) {
    this.enchantments[name] = level;
  }

  applyMovementModifier(type, value) {
    this.movementModifier = { type, value };
  }
}

describe('Nether Blocks Tests', () => {
  let mockWorld;
  let mockPlayer;

  beforeEach(() => {
    mockWorld = new MockWorld();
    mockPlayer = new MockPlayer('test-player-1');
  });

  describe('Ancient Debris Tests', () => {
    it('should have very high blast resistance', () => {
      const debris = new AncientDebrisBlock({ x: 0, y: 0, z: 0 });
      assert.equal(debris.blastResistance, 1200, 'Ancient Debris should have 1200 blast resistance');
    });

    it('should require a diamond pickaxe to be mined', () => {
      const debris = new AncientDebrisBlock({ x: 0, y: 0, z: 0 });
      assert.equal(debris.requiredTool, 'diamond_pickaxe', 'Ancient Debris should require a diamond pickaxe');
    });

    it('should drop itself when mined', () => {
      const debris = new AncientDebrisBlock({ x: 0, y: 0, z: 0 });
      const drops = debris.getDrops('diamond_pickaxe', 3);
      assert.equal(drops.length, 1, 'Should drop exactly one item');
      assert.equal(drops[0].type, 'ancient_debris', 'Should drop ancient_debris');
      assert.equal(drops[0].count, 1, 'Should drop exactly 1 ancient_debris');
    });
  });

  describe('Basalt Tests', () => {
    it('should be placeable with different orientations', () => {
      const basalt = new BasaltBlock({ x: 0, y: 0, z: 0 });
      
      // Test vertical orientation (default)
      assert.equal(basalt.orientation, 'vertical', 'Default orientation should be vertical');
      assert.equal(basalt.getTextureForFace(BlockFace.TOP), 'basalt_top', 'Top face should have top texture');
      assert.equal(basalt.getTextureForFace(BlockFace.NORTH), 'basalt_side', 'Side face should have side texture');
      
      // Test placed orientation updates
      const eastWestPlacement = { face: BlockFace.EAST };
      basalt.onPlaced(mockWorld, mockPlayer, eastWestPlacement);
      assert.equal(basalt.orientation, 'east_west', 'Should update to east_west orientation');
      assert.equal(basalt.getTextureForFace(BlockFace.EAST), 'basalt_top', 'East face should have top texture');
      assert.equal(basalt.getTextureForFace(BlockFace.NORTH), 'basalt_side', 'North face should have side texture');
    });

    it('should store orientation in metadata', () => {
      const basalt = new BasaltBlock({ x: 0, y: 0, z: 0 });
      const placement = { face: BlockFace.NORTH };
      basalt.onPlaced(mockWorld, mockPlayer, placement);
      
      assert.equal(basalt.metadata.orientation, 'north_south', 'Metadata should store orientation');
    });
  });

  describe('Polished Basalt Tests', () => {
    it('should inherit properties from Basalt', () => {
      const polishedBasalt = new PolishedBasaltBlock({ x: 0, y: 0, z: 0 });
      
      assert.equal(polishedBasalt.type, 'polished_basalt', 'Type should be polished_basalt');
      assert.equal(polishedBasalt.orientation, 'vertical', 'Default orientation should be vertical');
      assert.equal(polishedBasalt.getTextureForFace(BlockFace.TOP), 'polished_basalt_top', 'Top face should have top texture');
    });
  });

  describe('Blackstone Variants Tests', () => {
    it('should have correct properties for regular blackstone', () => {
      const blackstone = new BlackstoneBlock({ x: 0, y: 0, z: 0 });
      
      assert.equal(blackstone.type, 'blackstone', 'Type should be blackstone');
      assert.equal(blackstone.hardness, 1.5, 'Hardness should be 1.5');
      assert.equal(blackstone.blastResistance, 6, 'Blast resistance should be 6');
    });

    it('should have correct properties for polished blackstone', () => {
      const polishedBlackstone = new PolishedBlackstoneBlock({ x: 0, y: 0, z: 0 });
      
      assert.equal(polishedBlackstone.type, 'polished_blackstone', 'Type should be polished_blackstone');
      assert.equal(polishedBlackstone.hardness, 2, 'Hardness should be 2');
    });

    it('should have correct properties for chiseled polished blackstone', () => {
      const chiseledBlackstone = new ChiseledPolishedBlackstoneBlock({ x: 0, y: 0, z: 0 });
      
      assert.equal(chiseledBlackstone.type, 'chiseled_polished_blackstone', 'Type should be chiseled_polished_blackstone');
    });
  });

  describe('Gilded Blackstone Tests', () => {
    it('should drop gold nuggets with a 10% chance', () => {
      const gildedBlackstone = new GildedBlackstoneBlock({ x: 0, y: 0, z: 0 });
      
      // Mock random to force gold nuggets drop
      const originalRandom = Math.random;
      Math.random = () => 0.05; // Less than 0.1 to trigger gold nugget drop
      
      const drops = gildedBlackstone.getDrops('pickaxe', 1);
      
      assert.equal(drops[0].type, 'gold_nugget', 'Should drop gold nuggets');
      assert(drops[0].count >= 2 && drops[0].count <= 5, 'Should drop 2-5 gold nuggets');
      
      // Restore original random
      Math.random = originalRandom;
    });

    it('should drop blackstone with a 90% chance', () => {
      const gildedBlackstone = new GildedBlackstoneBlock({ x: 0, y: 0, z: 0 });
      
      // Mock random to force blackstone drop
      const originalRandom = Math.random;
      Math.random = () => 0.5; // Greater than 0.1 to trigger blackstone drop
      
      const drops = gildedBlackstone.getDrops('pickaxe', 1);
      
      assert.equal(drops[0].type, 'blackstone', 'Should drop blackstone');
      assert.equal(drops[0].count, 1, 'Should drop 1 blackstone');
      
      // Restore original random
      Math.random = originalRandom;
    });

    it('should drop itself with silk touch', () => {
      const gildedBlackstone = new GildedBlackstoneBlock({ x: 0, y: 0, z: 0 });
      
      const drops = gildedBlackstone.getDrops('pickaxe', 1, { silkTouch: 1 });
      
      assert.equal(drops[0].type, 'gilded_blackstone', 'Should drop itself with silk touch');
      assert.equal(drops[0].count, 1, 'Should drop 1 gilded_blackstone');
    });
  });

  describe('Nether Gold Ore Tests', () => {
    it('should drop gold nuggets', () => {
      const netherGoldOre = new NetherGoldOreBlock({ x: 0, y: 0, z: 0 });
      
      const drops = netherGoldOre.getDrops('pickaxe', 1);
      
      assert.equal(drops[0].type, 'gold_nugget', 'Should drop gold nuggets');
      assert(drops[0].count >= 2 && drops[0].count <= 6, 'Should drop 2-6 gold nuggets');
    });

    it('should drop more nuggets with fortune enchantment', () => {
      const netherGoldOre = new NetherGoldOreBlock({ x: 0, y: 0, z: 0 });
      
      // Mock random to give consistent results
      const originalRandom = Math.random;
      Math.random = () => 0.5;
      
      const dropsWithoutFortune = netherGoldOre.getDrops('pickaxe', 1);
      const dropsWithFortune = netherGoldOre.getDrops('pickaxe', 1, { fortune: 3 });
      
      assert(dropsWithFortune[0].count >= dropsWithoutFortune[0].count, 
        'Fortune should increase drop count');
      
      // Restore original random
      Math.random = originalRandom;
    });

    it('should drop itself with silk touch', () => {
      const netherGoldOre = new NetherGoldOreBlock({ x: 0, y: 0, z: 0 });
      
      const drops = netherGoldOre.getDrops('pickaxe', 1, { silkTouch: 1 });
      
      assert.equal(drops[0].type, 'nether_gold_ore', 'Should drop itself with silk touch');
      assert.equal(drops[0].count, 1, 'Should drop 1 nether_gold_ore');
    });
  });

  describe('Soul Soil Tests', () => {
    it('should have correct properties', () => {
      const soulSoil = new SoulSoilBlock({ x: 0, y: 0, z: 0 });
      
      assert.equal(soulSoil.type, 'soul_soil', 'Type should be soul_soil');
      assert.equal(soulSoil.hardness, 0.5, 'Hardness should be 0.5');
      assert.equal(soulSoil.blastResistance, 0.5, 'Blast resistance should be 0.5');
      assert.equal(soulSoil.transparent, false, 'Should not be transparent');
    });

    it('should slow down entities', () => {
      const soulSoil = new SoulSoilBlock({ x: 0, y: 0, z: 0 });
      const player = new MockPlayer('test-player');
      
      soulSoil.onEntityWalk(mockWorld, player, { x: 0, y: 0, z: 0 });
      
      assert.equal(player.movementModifier.type, 'multiply', 'Should apply movement modifier');
      assert.equal(player.movementModifier.value, 0.4, 'Should slow down to 40% speed');
    });

    it('should drop itself when mined', () => {
      const soulSoil = new SoulSoilBlock({ x: 0, y: 0, z: 0 });
      const drops = soulSoil.getDrops('shovel', 1);
      
      assert.equal(drops.length, 1, 'Should drop exactly one item');
      assert.equal(drops[0].type, 'soul_soil', 'Should drop soul_soil');
      assert.equal(drops[0].count, 1, 'Should drop exactly 1 soul_soil');
    });
  });

  describe('Soul Fire Torch Tests', () => {
    it('should have correct properties', () => {
      const soulTorch = new SoulFireTorchBlock({ x: 0, y: 0, z: 0 });
      
      assert.equal(soulTorch.type, 'soul_fire_torch', 'Type should be soul_fire_torch');
      assert.equal(soulTorch.hardness, 0, 'Hardness should be 0');
      assert.equal(soulTorch.transparent, true, 'Should be transparent');
      assert.equal(soulTorch.lightLevel, 10, 'Should emit light level 10');
    });

    it('should emit blue light', () => {
      const soulTorch = new SoulFireTorchBlock({ x: 0, y: 0, z: 0 });
      
      assert.equal(soulTorch.lightColor, '#3F76E4', 'Should emit blue light');
    });

    it('should be placeable on solid blocks', () => {
      const soulTorch = new SoulFireTorchBlock({ x: 0, y: 0, z: 0 });
      const placement = { face: BlockFace.NORTH };
      
      assert.equal(soulTorch.canBePlacedOn(mockWorld, { x: 0, y: 0, z: 0 }, placement), true, 
        'Should be placeable on solid blocks');
    });

    it('should not be placeable on non-solid blocks', () => {
      const soulTorch = new SoulFireTorchBlock({ x: 0, y: 0, z: 0 });
      const placement = { face: BlockFace.NORTH };
      
      // Set a non-solid block
      mockWorld.setBlock({ x: 0, y: 0, z: 0 }, { solid: false });
      
      assert.equal(soulTorch.canBePlacedOn(mockWorld, { x: 0, y: 0, z: 0 }, placement), false, 
        'Should not be placeable on non-solid blocks');
    });

    it('should drop itself when broken', () => {
      const soulTorch = new SoulFireTorchBlock({ x: 0, y: 0, z: 0 });
      const drops = soulTorch.getDrops();
      
      assert.equal(drops.length, 1, 'Should drop exactly one item');
      assert.equal(drops[0].type, 'soul_fire_torch', 'Should drop soul_fire_torch');
      assert.equal(drops[0].count, 1, 'Should drop exactly 1 soul_fire_torch');
    });
  });
});

// For manual test execution
if (require.main === module) {
  console.log('Running Nether Blocks Tests...');
  let passed = 0;
  let failed = 0;
  
  // Run all tests
  const tests = describe('Nether Blocks', () => {});
  
  for (const suite of tests.suites) {
    console.log(`\nTest Suite: ${suite.title}`);
    
    for (const test of suite.tests) {
      try {
        test.run();
        console.log(`  ✓ ${test.title}`);
        passed++;
      } catch (error) {
        console.log(`  ✗ ${test.title}`);
        console.log(`    Error: ${error.message}`);
        failed++;
      }
    }
  }
  
  const total = passed + failed;
  console.log(`\nTests completed: ${total} total, ${passed} passed, ${failed} failed`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Test runner setup
function describe(title, fn) {
  const suite = {
    title,
    suites: [],
    tests: []
  };
  
  if (fn) {
    const originalDescribe = global.describe;
    const originalIt = global.it;
    const originalBeforeEach = global.beforeEach;
    
    global.describe = (title, fn) => {
      const childSuite = describe(title, fn);
      suite.suites.push(childSuite);
      return childSuite;
    };
    
    global.it = (title, fn) => {
      const test = { title, run: fn };
      suite.tests.push(test);
      return test;
    };
    
    global.beforeEach = (fn) => {
      suite.beforeEach = fn;
    };
    
    fn();
    
    global.describe = originalDescribe;
    global.it = originalIt;
    global.beforeEach = originalBeforeEach;
  }
  
  return suite;
}

// Export test functions
module.exports = {
  runTests: function() {
    console.log('Running Nether Blocks Tests...');
    let passedTests = 0;
    let failedTests = 0;
    
    // Run the tests
    const testSuite = describe('Nether Blocks', () => {});
    
    for (const suite of testSuite.suites) {
      console.log(`\n${suite.title}:`);
      
      for (const test of suite.tests) {
        try {
          if (suite.beforeEach) {
            suite.beforeEach();
          }
          test.run();
          passedTests++;
          console.log(`  ✓ ${test.title}`);
        } catch (error) {
          failedTests++;
          console.log(`  ✗ ${test.title}`);
          console.log(`    ${error.message}`);
        }
      }
    }
    
    const totalTests = passedTests + failedTests;
    console.log(`\n${passedTests}/${totalTests} tests passed.`);
    
    return failedTests === 0;
  }
}; 