/**
 * Tests for the Lightning Rod block
 */

const assert = require('assert');
const LightningRodBlock = require('../blocks/lightningRodBlock');

describe('LightningRodBlock', () => {
  let block;
  
  beforeEach(() => {
    block = new LightningRodBlock();
  });
  
  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      assert.strictEqual(block.id, 'lightning_rod');
      assert.strictEqual(block.name, 'Lightning Rod');
      assert.strictEqual(block.hardness, 3);
      assert.strictEqual(block.blastResistance, 6);
      assert.strictEqual(block.transparent, false);
      assert.strictEqual(block.luminance, 0);
      assert.strictEqual(block.attractionRange, 128);
      assert.strictEqual(block.powerLevel, 0);
      assert.strictEqual(block.isActive, false);
      assert.strictEqual(block.lastStrikeTime, 0);
      assert.strictEqual(block.cooldown, 100);
    });
  });
  
  describe('handleLightningStrike', () => {
    it('should activate the block and emit redstone signal', () => {
      const result = block.handleLightningStrike();
      assert.strictEqual(result, true);
      assert.strictEqual(block.isActive, true);
      assert.strictEqual(block.powerLevel, 15);
      assert.strictEqual(block.lastStrikeTime, 0); // Will be set to current time in actual game
    });
    
    it('should respect cooldown period', () => {
      block.lastStrikeTime = 50;
      const result = block.handleLightningStrike();
      assert.strictEqual(result, false);
      assert.strictEqual(block.isActive, false);
      assert.strictEqual(block.powerLevel, 0);
    });
  });
  
  describe('update', () => {
    it('should deactivate after cooldown period', () => {
      block.isActive = true;
      block.powerLevel = 15;
      block.lastStrikeTime = 0;
      
      block.update(101); // Update after cooldown period
      
      assert.strictEqual(block.isActive, false);
      assert.strictEqual(block.powerLevel, 0);
    });
    
    it('should remain active during cooldown period', () => {
      block.isActive = true;
      block.powerLevel = 15;
      block.lastStrikeTime = 0;
      
      block.update(50); // Update during cooldown period
      
      assert.strictEqual(block.isActive, true);
      assert.strictEqual(block.powerLevel, 15);
    });
  });
  
  describe('getRedstonePower', () => {
    it('should return correct power level when active', () => {
      block.isActive = true;
      block.powerLevel = 15;
      assert.strictEqual(block.getRedstonePower(), 15);
    });
    
    it('should return 0 when inactive', () => {
      block.isActive = false;
      block.powerLevel = 0;
      assert.strictEqual(block.getRedstonePower(), 0);
    });
  });
  
  describe('serialization', () => {
    it('should correctly serialize block state', () => {
      block.isActive = true;
      block.powerLevel = 15;
      block.lastStrikeTime = 100;
      
      const json = block.toJSON();
      
      assert.strictEqual(json.isActive, true);
      assert.strictEqual(json.powerLevel, 15);
      assert.strictEqual(json.lastStrikeTime, 100);
    });
    
    it('should correctly deserialize block state', () => {
      const json = {
        isActive: true,
        powerLevel: 15,
        lastStrikeTime: 100
      };
      
      const newBlock = LightningRodBlock.fromJSON(json);
      
      assert.strictEqual(newBlock.isActive, true);
      assert.strictEqual(newBlock.powerLevel, 15);
      assert.strictEqual(newBlock.lastStrikeTime, 100);
    });
  });
}); 