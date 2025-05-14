/**
 * Tests for the Sculk Sensor block
 */

const assert = require('assert');
const SculkSensorBlock = require('../blocks/sculkSensorBlock');

describe('SculkSensorBlock', () => {
  let block;

  beforeEach(() => {
    block = new SculkSensorBlock({
      x: 0,
      y: 0,
      z: 0,
      world: {
        getAdjacentBlocks: () => []
      }
    });
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      assert.strictEqual(block.id, 'sculk_sensor');
      assert.strictEqual(block.name, 'Sculk Sensor');
      assert.strictEqual(block.hardness, 1.5);
      assert.strictEqual(block.blastResistance, 1.5);
      assert.strictEqual(block.requiresTool, true);
      assert.strictEqual(block.toolType, 'hoe');
      assert.strictEqual(block.vibrationRange, 8);
      assert.strictEqual(block.vibrationCooldown, 40);
      assert.strictEqual(block.powerLevel, 0);
      assert.strictEqual(block.isActive, false);
    });
  });

  describe('handleVibration', () => {
    it('should detect valid vibrations in range', () => {
      const event = {
        type: 'block_place',
        x: 2,
        y: 0,
        z: 0
      };
      const result = block.handleVibration(event, 0);
      assert.strictEqual(result, true);
      assert.strictEqual(block.isActive, true);
      assert.strictEqual(block.powerLevel > 0, true);
    });

    it('should ignore vibrations out of range', () => {
      const event = {
        type: 'block_place',
        x: 10,
        y: 0,
        z: 0
      };
      const result = block.handleVibration(event, 0);
      assert.strictEqual(result, false);
      assert.strictEqual(block.isActive, false);
      assert.strictEqual(block.powerLevel, 0);
    });

    it('should ignore undetectable vibration types', () => {
      const event = {
        type: 'invalid_vibration',
        x: 2,
        y: 0,
        z: 0
      };
      const result = block.handleVibration(event, 0);
      assert.strictEqual(result, false);
      assert.strictEqual(block.isActive, false);
      assert.strictEqual(block.powerLevel, 0);
    });

    it('should respect cooldown period', () => {
      const event = {
        type: 'block_place',
        x: 2,
        y: 0,
        z: 0
      };
      block.handleVibration(event, 0);
      const result = block.handleVibration(event, 20);
      assert.strictEqual(result, false);
    });
  });

  describe('update', () => {
    it('should deactivate after cooldown period', () => {
      const event = {
        type: 'block_place',
        x: 2,
        y: 0,
        z: 0
      };
      block.handleVibration(event, 0);
      block.update(41);
      assert.strictEqual(block.isActive, false);
      assert.strictEqual(block.powerLevel, 0);
    });

    it('should remain active during cooldown period', () => {
      const event = {
        type: 'block_place',
        x: 2,
        y: 0,
        z: 0
      };
      block.handleVibration(event, 0);
      block.update(20);
      assert.strictEqual(block.isActive, true);
      assert.strictEqual(block.powerLevel > 0, true);
    });
  });

  describe('getRedstonePower', () => {
    it('should return 0 when inactive', () => {
      assert.strictEqual(block.getRedstonePower(), 0);
    });

    it('should return power level when active', () => {
      const event = {
        type: 'block_place',
        x: 2,
        y: 0,
        z: 0
      };
      block.handleVibration(event, 0);
      assert.strictEqual(block.getRedstonePower() > 0, true);
    });
  });

  describe('serialization', () => {
    it('should correctly serialize and deserialize block state', () => {
      const event = {
        type: 'block_place',
        x: 2,
        y: 0,
        z: 0
      };
      block.handleVibration(event, 0);
      
      const serialized = block.toJSON();
      const deserialized = SculkSensorBlock.fromJSON(serialized);
      
      assert.strictEqual(deserialized.id, block.id);
      assert.strictEqual(deserialized.lastVibrationTime, block.lastVibrationTime);
      assert.strictEqual(deserialized.powerLevel, block.powerLevel);
      assert.strictEqual(deserialized.isActive, block.isActive);
    });
  });
}); 