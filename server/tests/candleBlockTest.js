/**
 * Tests for candle block implementation
 * Verifies the functionality of candles from Caves & Cliffs update
 */

const assert = require('assert');
const { CandleBlock, RedCandle } = require('../blocks/candleBlock');

// Mock objects
class MockWorld {
  constructor() {
    this.blocks = {};
  }

  getBlockAt(x, y, z) {
    return this.blocks[`${x},${y},${z}`];
  }

  setBlockAt(x, y, z, block) {
    this.blocks[`${x},${y},${z}`] = block;
    return true;
  }
}

class MockPlayer {
  constructor() {
    this.id = 'test-player';
  }
}

// Test suite
describe('CandleBlock', () => {
  let world;
  let player;
  
  beforeEach(() => {
    world = new MockWorld();
    player = new MockPlayer();
    
    // Setup solid block below for placement tests
    world.setBlockAt(5, 0, 5, { type: 'stone', solid: true });
  });
  
  describe('Basic properties', () => {
    it('should initialize with default properties', () => {
      const candle = new CandleBlock();
      
      assert.strictEqual(candle.type, 'candle');
      assert.strictEqual(candle.hardness, 0.1);
      assert.strictEqual(candle.transparent, true);
      assert.strictEqual(candle.state.count, 1);
      assert.strictEqual(candle.state.lit, false);
      assert.strictEqual(candle.state.waterlogged, false);
      assert.strictEqual(candle.state.color, 'white');
    });
    
    it('should initialize with custom properties', () => {
      const candle = new CandleBlock({
        count: 2,
        lit: true,
        waterlogged: true,
        color: 'blue'
      });
      
      assert.strictEqual(candle.state.count, 2);
      assert.strictEqual(candle.state.lit, true);
      assert.strictEqual(candle.state.waterlogged, true);
      assert.strictEqual(candle.state.color, 'blue');
    });
    
    it('should generate correct positions based on count', () => {
      const candle1 = new CandleBlock({ count: 1 });
      assert.strictEqual(candle1.positions.length, 1);
      assert.deepStrictEqual(candle1.positions[0], { x: 0.5, z: 0.5 });
      
      const candle4 = new CandleBlock({ count: 4 });
      assert.strictEqual(candle4.positions.length, 4);
    });
  });
  
  describe('Light emission', () => {
    it('should emit no light when not lit', () => {
      const candle = new CandleBlock({ count: 4, lit: false });
      assert.strictEqual(candle.getLightLevel(), 0);
    });
    
    it('should emit light based on candle count when lit', () => {
      const candle1 = new CandleBlock({ count: 1, lit: true });
      assert.strictEqual(candle1.getLightLevel(), 3);
      
      const candle2 = new CandleBlock({ count: 2, lit: true });
      assert.strictEqual(candle2.getLightLevel(), 4);
      
      const candle3 = new CandleBlock({ count: 3, lit: true });
      assert.strictEqual(candle3.getLightLevel(), 5);
      
      const candle4 = new CandleBlock({ count: 4, lit: true });
      assert.strictEqual(candle4.getLightLevel(), 6);
    });
  });
  
  describe('Candle stacking', () => {
    it('should stack candles up to 4', () => {
      const candle = new CandleBlock();
      
      assert.strictEqual(candle.state.count, 1);
      assert.strictEqual(candle.state.addCandles(1), true);
      assert.strictEqual(candle.state.count, 2);
      assert.strictEqual(candle.state.addCandles(2), true);
      assert.strictEqual(candle.state.count, 4);
    });
    
    it('should not allow stacking beyond 4 candles', () => {
      const candle = new CandleBlock({ count: 3 });
      
      assert.strictEqual(candle.state.count, 3);
      assert.strictEqual(candle.state.addCandles(1), true);
      assert.strictEqual(candle.state.count, 4);
      assert.strictEqual(candle.state.addCandles(1), false);
      assert.strictEqual(candle.state.count, 4);
    });
    
    it('should allow adding candles to existing candle block', () => {
      // Place first candle
      const candle1 = new CandleBlock();
      world.setBlockAt(5, 1, 5, candle1);
      
      // Create second candle to add
      const candle2 = new CandleBlock();
      
      // Add second candle
      let eventFired = false;
      candle1.on('update', () => {
        eventFired = true;
      });
      
      candle2.onPlace(world, { x: 5, y: 1, z: 5 }, player);
      
      assert.strictEqual(candle1.state.count, 2);
      assert.strictEqual(eventFired, true);
    });
    
    it('should not allow adding different colored candles', () => {
      // Place first candle (white)
      const candle1 = new CandleBlock();
      world.setBlockAt(5, 1, 5, candle1);
      
      // Create second candle (red)
      const candle2 = new RedCandle();
      
      // Try to add red candle to white
      const result = candle2.onPlace(world, { x: 5, y: 1, z: 5 }, player);
      
      assert.strictEqual(result, false);
      assert.strictEqual(candle1.state.count, 1);
    });
  });
  
  describe('Placement rules', () => {
    it('should require solid block below', () => {
      const candle = new CandleBlock();
      
      // Valid placement
      assert.strictEqual(candle.canPlaceAt(world, { x: 5, y: 1, z: 5 }), true);
      
      // Invalid placement (no solid block below)
      assert.strictEqual(candle.canPlaceAt(world, { x: 6, y: 1, z: 6 }), false);
    });
    
    it('should allow placement in water', () => {
      const candle = new CandleBlock();
      
      // Place water
      world.setBlockAt(5, 1, 5, { type: 'water' });
      
      // Check if placement in water is allowed
      assert.strictEqual(candle.canPlaceAt(world, { x: 5, y: 1, z: 5 }), true);
    });
    
    it('should set waterlogged when placed in water', () => {
      const candle = new CandleBlock();
      
      // Place water
      world.setBlockAt(5, 1, 5, { type: 'water' });
      
      // Place candle in water
      candle.onPlace(world, { x: 5, y: 1, z: 5 }, player);
      
      assert.strictEqual(candle.state.waterlogged, true);
    });
  });
  
  describe('Interaction mechanics', () => {
    it('should light with flint and steel', () => {
      const candle = new CandleBlock();
      world.setBlockAt(5, 1, 5, candle);
      
      let eventFired = false;
      candle.on('update', () => {
        eventFired = true;
      });
      
      const result = candle.onInteract(world, { x: 5, y: 1, z: 5 }, player, { type: 'flint_and_steel' });
      
      assert.strictEqual(result, true);
      assert.strictEqual(candle.state.lit, true);
      assert.strictEqual(eventFired, true);
    });
    
    it('should not light if waterlogged', () => {
      const candle = new CandleBlock({ waterlogged: true });
      world.setBlockAt(5, 1, 5, candle);
      
      const result = candle.onInteract(world, { x: 5, y: 1, z: 5 }, player, { type: 'flint_and_steel' });
      
      assert.strictEqual(result, false);
      assert.strictEqual(candle.state.lit, false);
    });
    
    it('should extinguish with empty hand', () => {
      const candle = new CandleBlock({ lit: true });
      world.setBlockAt(5, 1, 5, candle);
      
      let eventFired = false;
      let particlesFired = false;
      
      candle.on('update', () => {
        eventFired = true;
      });
      
      candle.on('particles', (data) => {
        particlesFired = true;
        assert.strictEqual(data.type, 'smoke');
        assert.strictEqual(data.count, 2); // 2 particles for a single candle
      });
      
      const result = candle.onInteract(world, { x: 5, y: 1, z: 5 }, player, { type: 'empty' });
      
      assert.strictEqual(result, true);
      assert.strictEqual(candle.state.lit, false);
      assert.strictEqual(eventFired, true);
      assert.strictEqual(particlesFired, true);
    });
    
    it('should extinguish when water flows from above', () => {
      const candle = new CandleBlock({ lit: true });
      world.setBlockAt(5, 1, 5, candle);
      
      // Place water above candle
      world.setBlockAt(5, 2, 5, { type: 'water' });
      
      let eventFired = false;
      let particlesFired = false;
      
      candle.on('update', () => {
        eventFired = true;
      });
      
      candle.on('particles', () => {
        particlesFired = true;
      });
      
      // Simulate block update from above
      candle.onNeighborUpdate(world, { x: 5, y: 1, z: 5 }, 'up');
      
      assert.strictEqual(candle.state.lit, false);
      assert.strictEqual(candle.state.waterlogged, true);
      assert.strictEqual(eventFired, true);
      assert.strictEqual(particlesFired, true);
    });
  });
  
  describe('Block drops', () => {
    it('should drop the correct number of candles', () => {
      const candle = new CandleBlock({ count: 3 });
      const drops = candle.getDrops();
      
      assert.strictEqual(drops.length, 1);
      assert.strictEqual(drops[0].type, 'candle');
      assert.strictEqual(drops[0].count, 3);
    });
    
    it('should drop colored candles with the correct type', () => {
      const redCandle = new RedCandle({ count: 2 });
      const drops = redCandle.getDrops();
      
      assert.strictEqual(drops.length, 1);
      assert.strictEqual(drops[0].type, 'red_candle');
      assert.strictEqual(drops[0].count, 2);
    });
  });
  
  describe('Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const original = new CandleBlock({
        count: 3,
        lit: true,
        waterlogged: false,
        color: 'white'
      });
      
      const serialized = original.serialize();
      const deserialized = CandleBlock.deserialize(serialized);
      
      assert.strictEqual(deserialized.type, 'candle');
      assert.strictEqual(deserialized.state.count, 3);
      assert.strictEqual(deserialized.state.lit, true);
      assert.strictEqual(deserialized.state.waterlogged, false);
      assert.strictEqual(deserialized.state.color, 'white');
      assert.strictEqual(deserialized.positions.length, 3);
    });
    
    it('should serialize and deserialize colored candles correctly', () => {
      const original = new RedCandle({
        count: 2,
        lit: true
      });
      
      const serialized = original.serialize();
      const deserialized = CandleBlock.deserialize(serialized);
      
      assert.strictEqual(deserialized.type, 'red_candle');
      assert.strictEqual(deserialized.state.count, 2);
      assert.strictEqual(deserialized.state.lit, true);
      assert.strictEqual(deserialized.state.color, 'red');
      assert.strictEqual(deserialized.positions.length, 2);
    });
  });
}); 