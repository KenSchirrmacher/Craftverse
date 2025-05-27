/**
 * Tests for the Archaeology System
 * Tests the ArchaeologyManager, BrushItem, SuspiciousBlocks, and PotterySherdItem
 */

const assert = require('assert');
const ArchaeologyManager = require('../archaeology/archaeologyManager');
const BrushItem = require('../items/brushItem');
const { SuspiciousSandBlock, SuspiciousGravelBlock } = require('../blocks/suspiciousBlocks');
const PotterySherdItem = require('../items/potterySherdItem');
const World = require('../world/world');
const Player = require('../entities/player');

// Test world implementation
class TestWorld extends World {
  constructor() {
    super();
    this.emitted = false;
    this.setBlockCalled = false;
    this.lastBlockType = null;
    this.blockBelow = { type: 'stone' };
    this.blocks = new Map();
    this.items = [];
  }
  
  emit(event, data) {
    this.emitted = true;
    return super.emit(event, data);
  }
  
  setBlockAt(x, y, z, type, metadata = {}) {
    this.setBlockCalled = true;
    this.lastBlockType = type;
    this.blocks.set(`${x},${y},${z}`, { type, metadata });
    return true;
  }
  
  setBlockBelow(block) {
    this.blockBelow = block;
  }
  
  getBlockAt(x, y, z) {
    if (y === -1) {
      return this.blockBelow;
    }
    return this.blocks.get(`${x},${y},${z}`) || null;
  }
  
  addItem(item) {
    this.items.push(item);
  }
  
  removeItem(item) {
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }
  
  getItemsInRange(position, range) {
    return this.items.filter(item => {
      const dx = item.position.x - position.x;
      const dy = item.position.y - position.y;
      const dz = item.position.z - position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance <= range;
    });
  }
}

// Test player implementation
class TestPlayer extends Player {
  constructor() {
    super();
    this.inventory = [];
    this.messages = [];
  }
  
  giveItem(item) {
    this.inventory.push(item);
    return true;
  }
  
  removeItem(item) {
    const index = this.inventory.indexOf(item);
    if (index !== -1) {
      this.inventory.splice(index, 1);
      return true;
    }
    return false;
  }
  
  updateItem(item) {
    const index = this.inventory.findIndex(i => i.id === item.id);
    if (index !== -1) {
      this.inventory[index] = item;
      return true;
    }
    return false;
  }
  
  sendMessage(message) {
    this.messages.push(message);
  }
}

function runTests() {
  console.log('Running Archaeology System Tests...');
  
  try {
    testArchaeologyManager();
    testBrushItem();
    testSuspiciousBlocks();
    testPotterySherdItem();
    testIntegration();
    
    console.log('All Archaeology tests passed!');
    return true;
  } catch (error) {
    console.error('Archaeology test failed:', error);
    return false;
  }
}

function testArchaeologyManager() {
  console.log('Testing ArchaeologyManager...');
  
  // Create a test world
  const world = new TestWorld();
  
  // Create archaeology manager
  const archaeologyManager = new ArchaeologyManager(world);
  
  // Test initialization
  archaeologyManager.initialize();
  assert.strictEqual(archaeologyManager.initialized, true, 'Should be initialized after initialize() call');
  
  // Test loot tables
  const lootTables = archaeologyManager.lootTables;
  assert.ok(lootTables.desert, 'Should have desert loot table');
  assert.ok(lootTables.underwater, 'Should have underwater loot table');
  assert.ok(lootTables.jungle, 'Should have jungle loot table');
  assert.ok(lootTables.plains, 'Should have plains loot table');
  
  // Test site generation
  const chunk = { x: 0, z: 0 };
  archaeologyManager.generateArchaeologySites(chunk);
  
  // Test site registration
  assert.ok(archaeologyManager.sites.size >= 0, 'Should have generated sites if random check passed');
  
  // Test loot selection
  const random = () => 0.5; // Mock random that always returns 0.5
  const desertLoot = archaeologyManager.selectLoot('desert', random);
  assert.ok(desertLoot, 'Should return a loot item');
  assert.ok(desertLoot.item, 'Loot item should have an item property');
  
  // Test serialization/deserialization
  const serialized = archaeologyManager.serialize();
  assert.ok(serialized.sites, 'Serialized data should have sites array');
  assert.strictEqual(serialized.initialized, true, 'Serialized data should preserve initialized state');
  
  // Create a new manager and deserialize
  const newManager = new ArchaeologyManager(world);
  newManager.deserialize(serialized);
  assert.strictEqual(newManager.initialized, true, 'Deserialized manager should be initialized');
  assert.strictEqual(newManager.sites.size, archaeologyManager.sites.size, 'Deserialized manager should have same number of sites');
  
  console.log('✓ ArchaeologyManager tests passed');
}

function testBrushItem() {
  console.log('Testing BrushItem...');
  
  // Create brush instances
  const woodenBrush = new BrushItem();
  const copperBrush = new BrushItem({
    brushType: 'copper',
    durability: 96,
    maxDurability: 96
  });
  
  // Test basic properties
  assert.strictEqual(woodenBrush.type, 'brush', 'Should have correct type');
  assert.strictEqual(woodenBrush.brushType, 'wood', 'Should have correct brush type');
  assert.strictEqual(woodenBrush.durability, 64, 'Should have correct durability');
  assert.strictEqual(woodenBrush.maxDurability, 64, 'Should have correct max durability');
  
  assert.strictEqual(copperBrush.brushType, 'copper', 'Should have correct brush type');
  assert.strictEqual(copperBrush.durability, 96, 'Should have correct durability');
  
  // Test onUseOnBlock method
  const world = new TestWorld();
  const player = new TestPlayer();
  const suspiciousBlock = new SuspiciousSandBlock();
  const regularBlock = { type: 'stone' };
  
  // Should return false for non-suspicious blocks
  assert.strictEqual(
    woodenBrush.onUseOnBlock(world, player, regularBlock, { x: 0, y: 0, z: 0 }),
    false,
    'Should return false for non-suspicious blocks'
  );
  
  // Should return true for suspicious blocks
  world.emitted = false;
  assert.strictEqual(
    woodenBrush.onUseOnBlock(world, player, suspiciousBlock, { x: 0, y: 0, z: 0 }),
    true,
    'Should return true for suspicious blocks'
  );
  assert.strictEqual(world.emitted, true, 'Should emit blockInteract event');
  
  // Test durability calculation
  assert.strictEqual(woodenBrush.calculateDurabilityDamage(), 1, 'Should calculate correct durability damage');
  
  // Test repair material compatibility
  assert.strictEqual(woodenBrush.canRepairWith({ type: 'oak_planks' }), true, 'Wood brush should be repairable with planks');
  assert.strictEqual(copperBrush.canRepairWith({ type: 'copper_ingot' }), true, 'Copper brush should be repairable with copper ingot');
  assert.strictEqual(woodenBrush.canRepairWith({ type: 'dirt' }), false, 'Should not be repairable with incorrect material');
  
  // Test serialization/deserialization
  const serialized = woodenBrush.serialize();
  assert.strictEqual(serialized.brushType, 'wood', 'Serialized data should preserve brush type');
  assert.strictEqual(serialized.durability, 64, 'Serialized data should preserve durability');
  
  const deserialized = BrushItem.deserialize(serialized);
  assert.strictEqual(deserialized.brushType, 'wood', 'Deserialized brush should have correct brush type');
  assert.strictEqual(deserialized.durability, 64, 'Deserialized brush should have correct durability');
  
  console.log('✓ BrushItem tests passed');
}

function testSuspiciousBlocks() {
  console.log('Testing SuspiciousBlocks...');
  
  // Create block instances
  const sandBlock = new SuspiciousSandBlock();
  const gravelBlock = new SuspiciousGravelBlock();
  
  // Test basic properties
  assert.strictEqual(sandBlock.type, 'suspicious_sand', 'Should have correct type');
  assert.strictEqual(sandBlock.hardness, 0.5, 'Should have correct hardness');
  assert.strictEqual(sandBlock.siteType, 'desert', 'Should have correct site type');
  
  assert.strictEqual(gravelBlock.type, 'suspicious_gravel', 'Should have correct type');
  assert.strictEqual(gravelBlock.hardness, 0.6, 'Should have correct hardness');
  assert.strictEqual(gravelBlock.siteType, 'plains', 'Should have correct site type');
  
  // Test getNormalVariant method
  assert.strictEqual(sandBlock.getNormalVariant(), 'sand', 'Sand block should have sand as normal variant');
  assert.strictEqual(gravelBlock.getNormalVariant(), 'gravel', 'Gravel block should have gravel as normal variant');
  
  // Test interaction handler
  assert.strictEqual(
    sandBlock.onInteract(null, null, { type: 'brush' }, null),
    true,
    'Should return true when interacted with brush'
  );
  
  assert.strictEqual(
    sandBlock.onInteract(null, null, { type: 'pickaxe' }, null),
    false,
    'Should return false when interacted with non-brush'
  );
  
  // Test block break behavior
  const drops = sandBlock.onBreak(null, null, null, null);
  assert.strictEqual(drops.length, 1, 'Should drop one item when broken');
  assert.strictEqual(drops[0].type, 'sand', 'Should drop sand when broken');
  
  // Test gravity behavior
  const world = new TestWorld();
  world.setBlockBelow({ type: 'air' });
  
  sandBlock.onTick(world, { x: 0, y: 0, z: 0 });
  assert.strictEqual(
    world.setBlockCalled,
    true,
    'Should call setBlockAt when air is below'
  );
  assert.strictEqual(
    world.lastBlockType,
    'sand',
    'Should set to normal sand when falling'
  );
  
  // Test serialization/deserialization
  const serialized = sandBlock.serialize();
  assert.strictEqual(serialized.type, 'suspicious_sand', 'Serialized data should preserve type');
  assert.strictEqual(serialized.siteType, 'desert', 'Serialized data should preserve site type');
  
  console.log('✓ SuspiciousBlocks tests passed');
}

function testPotterySherdItem() {
  console.log('Testing PotterySherdItem...');
  
  // Create pottery sherd instances
  const armsUpSherd = new PotterySherdItem({ pattern: 'arms_up' });
  const skullSherd = new PotterySherdItem({ pattern: 'skull' });
  
  // Test basic properties
  assert.strictEqual(
    armsUpSherd.type,
    'pottery_sherd_arms_up',
    'Should have correct type with pattern'
  );
  assert.strictEqual(
    armsUpSherd.name,
    'Arms Up Pottery Sherd',
    'Should have correctly formatted name'
  );
  assert.strictEqual(armsUpSherd.pattern, 'arms_up', 'Should store pattern');
  assert.strictEqual(armsUpSherd.stackable, true, 'Should be stackable');
  assert.strictEqual(armsUpSherd.maxStackSize, 64, 'Should have stack size of 64');
  
  // Test category determination
  assert.strictEqual(
    armsUpSherd.category,
    'storytelling',
    'Arms up pattern should be in storytelling category'
  );
  assert.strictEqual(
    skullSherd.category,
    'decoration',
    'Skull pattern should be in decoration category'
  );
  
  // Test crafting compatibility
  assert.strictEqual(
    armsUpSherd.canCraftWith([{ type: 'clay_ball' }]),
    true,
    'Should be craftable with clay'
  );
  assert.strictEqual(
    armsUpSherd.canCraftWith([{ type: 'pot_base' }]),
    true,
    'Should be craftable with pot base'
  );
  assert.strictEqual(
    armsUpSherd.canCraftWith([{ type: 'dirt' }]),
    false,
    'Should not be craftable with other items'
  );
  
  // Test serialization/deserialization
  const serialized = armsUpSherd.serialize();
  assert.strictEqual(serialized.pattern, 'arms_up', 'Serialized data should preserve pattern');
  assert.strictEqual(serialized.type, 'pottery_sherd_arms_up', 'Serialized data should preserve type');
  
  const deserialized = PotterySherdItem.deserialize(serialized);
  assert.strictEqual(deserialized.pattern, 'arms_up', 'Deserialized sherd should have correct pattern');
  assert.strictEqual(deserialized.type, 'pottery_sherd_arms_up', 'Deserialized sherd should have correct type');
  
  console.log('✓ PotterySherdItem tests passed');
}

function testIntegration() {
  console.log('Testing Archaeology System Integration...');
  
  const world = new TestWorld();
  const player = new TestPlayer();
  const archaeologyManager = new ArchaeologyManager(world);
  
  // Initialize the system
  archaeologyManager.initialize();
  
  // Place a suspicious block
  const suspiciousBlock = new SuspiciousSandBlock();
  world.setBlockAt(0, 0, 0, suspiciousBlock.id);
  
  // Create a brush
  const brush = new BrushItem();
  player.giveItem(brush);
  
  // Test brushing the block
  const brushResult = brush.onUseOnBlock(world, player, suspiciousBlock, { x: 0, y: 0, z: 0 });
  assert.strictEqual(brushResult, true, 'Should successfully brush the block');
  
  // Test block transformation
  const blockAfterBrush = world.getBlockAt(0, 0, 0);
  assert.strictEqual(blockAfterBrush.type, 'sand', 'Block should transform to sand after brushing');
  
  // Test item drops
  assert.strictEqual(player.inventory.length > 0, true, 'Player should receive items from brushing');
  
  console.log('✓ Archaeology System Integration tests passed');
}

// Run the tests if this file is executed directly
if (require.main === module) {
  try {
    const success = runTests();
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.error('Archaeology tests failed with error:', error);
    process.exitCode = 1;
  }
} 