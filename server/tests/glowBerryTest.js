/**
 * Test suite for GlowBerryItem
 * Tests functionality of glow berries as food items and as plantable items
 */

// Dependencies
const assert = require('assert');
const GlowBerryItem = require('../items/glowBerryItem');
const { CaveVineHeadBlock } = require('../blocks/caveVineBlock');

// Mock classes
class MockWorld {
  constructor() {
    this.blocks = new Map();
    this.sounds = [];
    this.items = [];
  }
  
  getBlockAt(x, y, z) {
    return this.blocks.get(`${x},${y},${z}`);
  }
  
  setBlock(x, y, z, block) {
    this.blocks.set(`${x},${y},${z}`, block);
    return true;
  }
  
  removeBlock(x, y, z) {
    this.blocks.delete(`${x},${y},${z}`);
    return true;
  }
  
  spawnItem(item, position) {
    this.items.push({ item, position });
  }
}

class MockPlayer {
  constructor() {
    this.inventory = new MockInventory();
    this.hunger = 10;
    this.saturation = 5;
    this.position = { x: 0, y: 0, z: 0 };
  }
}

class MockInventory {
  constructor() {
    this.items = {};
    this.removedItems = {};
  }
  
  addItem(type, count) {
    this.items[type] = (this.items[type] || 0) + count;
    return true;
  }
  
  removeItem(type, count) {
    this.removedItems[type] = (this.removedItems[type] || 0) + count;
    return true;
  }
}

// Test suite
describe('GlowBerryItem', function() {
  let glowBerry;
  let world;
  let player;
  
  beforeEach(function() {
    glowBerry = new GlowBerryItem();
    world = new MockWorld();
    player = new MockPlayer();
    
    // Set up sound event listener
    glowBerry.on('sound', (sound) => {
      world.sounds.push(sound);
    });
  });
  
  describe('Basic Properties', function() {
    it('should have the correct item properties', function() {
      assert.strictEqual(glowBerry.id, 'glow_berries');
      assert.strictEqual(glowBerry.name, 'Glow Berries');
      assert.strictEqual(glowBerry.type, 'food');
      assert.strictEqual(glowBerry.subtype, 'plantable');
      assert.strictEqual(glowBerry.category, 'food');
      assert.strictEqual(glowBerry.stackable, true);
      assert.strictEqual(glowBerry.maxStackSize, 64);
    });
    
    it('should have the correct food properties', function() {
      assert.strictEqual(glowBerry.foodValue, 2);
      assert.strictEqual(glowBerry.saturation, 0.4);
    });
    
    it('should have the correct planting properties', function() {
      assert.strictEqual(glowBerry.isPlantable, true);
      assert.strictEqual(glowBerry.plantBlock, 'cave_vine_head');
    });
  });
  
  describe('Food Functionality', function() {
    it('should increase hunger and saturation when eaten', function() {
      const initialHunger = player.hunger;
      const initialSaturation = player.saturation;
      
      const result = glowBerry.use(player, {});
      
      assert.strictEqual(result, true);
      assert.strictEqual(player.hunger, initialHunger + glowBerry.foodValue);
      assert.strictEqual(player.saturation, initialSaturation + glowBerry.saturation);
    });
    
    it('should remove one berry from inventory when eaten', function() {
      glowBerry.use(player, {});
      
      assert.strictEqual(player.inventory.removedItems['glow_berries'], 1);
    });
    
    it('should play eating sound when eaten', function() {
      glowBerry.use(player, {});
      
      assert.strictEqual(world.sounds.length, 1);
      assert.strictEqual(world.sounds[0].type, 'entity.player.eat');
    });
    
    it('should not allow eating when hunger is full', function() {
      player.hunger = 20;
      
      const result = glowBerry.use(player, {});
      
      assert.strictEqual(result, false);
      assert.strictEqual(player.inventory.removedItems['glow_berries'], undefined);
    });
  });
  
  describe('Planting Functionality', function() {
    beforeEach(function() {
      // Set up a valid ceiling for vine placement
      world.setBlock(0, 2, 0, { 
        type: 'stone', 
        solid: true 
      });
      
      // Mock the CaveVineHeadBlock.canPlaceAt method
      CaveVineHeadBlock.prototype.canPlaceAt = function(world, position) {
        const blockAbove = world.getBlockAt(position.x, position.y + 1, position.z);
        return blockAbove && blockAbove.solid;
      };
    });
    
    it('should place a vine when used on a valid ceiling', function() {
      const result = glowBerry.onUseOnBlock(world, { x: 0, y: 2, z: 0 }, 'down', player);
      
      assert.strictEqual(result, true);
      
      const placedBlock = world.getBlockAt(0, 1, 0);
      assert.notStrictEqual(placedBlock, undefined);
      assert.strictEqual(placedBlock instanceof CaveVineHeadBlock, true);
    });
    
    it('should not place a vine when not used on bottom face', function() {
      const result = glowBerry.onUseOnBlock(world, { x: 0, y: 2, z: 0 }, 'up', player);
      
      assert.strictEqual(result, false);
      
      const placedBlock = world.getBlockAt(0, 3, 0);
      assert.strictEqual(placedBlock, undefined);
    });
    
    it('should not place a vine when there is already a block', function() {
      world.setBlock(0, 1, 0, { type: 'dirt' });
      
      const result = glowBerry.onUseOnBlock(world, { x: 0, y: 2, z: 0 }, 'down', player);
      
      assert.strictEqual(result, false);
    });
    
    it('should consume one berry when successfully planted', function() {
      glowBerry.onUseOnBlock(world, { x: 0, y: 2, z: 0 }, 'down', player);
      
      assert.strictEqual(player.inventory.removedItems['glow_berries'], 1);
    });
    
    it('should play placement sound when successfully planted', function() {
      glowBerry.onUseOnBlock(world, { x: 0, y: 2, z: 0 }, 'down', player);
      
      assert.strictEqual(world.sounds.length, 1);
      assert.strictEqual(world.sounds[0].type, 'block.cave_vines.place');
    });
  });
  
  describe('Serialization', function() {
    it('should correctly serialize to JSON', function() {
      const json = glowBerry.toJSON();
      
      assert.strictEqual(json.id, 'glow_berries');
      assert.strictEqual(json.name, 'Glow Berries');
      assert.strictEqual(json.type, 'food');
      assert.strictEqual(json.foodValue, 2);
      assert.strictEqual(json.saturation, 0.4);
      assert.strictEqual(json.isPlantable, true);
    });
    
    it('should correctly deserialize from JSON', function() {
      const json = {
        id: 'glow_berries',
        name: 'Custom Glow Berries',
        foodValue: 3,
        saturation: 0.6
      };
      
      const deserializedItem = GlowBerryItem.fromJSON(json);
      
      assert.strictEqual(deserializedItem.id, 'glow_berries');
      assert.strictEqual(deserializedItem.name, 'Custom Glow Berries');
      assert.strictEqual(deserializedItem.foodValue, 3);
      assert.strictEqual(deserializedItem.saturation, 0.6);
    });
  });
  
  describe('Tooltip', function() {
    it('should include food and planting information in tooltip', function() {
      const tooltip = glowBerry.getTooltip();
      
      assert(tooltip.includes('Glow Berries'));
      assert(tooltip.some(line => line.includes('Food: +2 hunger')));
      assert(tooltip.some(line => line.includes('Can be planted')));
      assert(tooltip.some(line => line.includes('Emits light')));
    });
  });
});

// Run the tests
if (require.main === module) {
  describe('Running Glow Berry Tests', function() {
    this.timeout(5000);
    
    before(function() {
      console.log('Starting Glow Berry tests...');
    });
    
    require('mocha').run();
    
    after(function() {
      console.log('Glow Berry tests completed.');
    });
  });
} 