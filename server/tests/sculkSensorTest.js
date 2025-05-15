/**
 * Tests for the SculkSensorBlock functionality
 */

const assert = require('assert');
const SculkSensorBlock = require('../blocks/sculkSensorBlock');

describe('SculkSensorBlock', () => {
  let sculkSensor;
  
  beforeEach(() => {
    sculkSensor = new SculkSensorBlock();
  });
  
  describe('Basic Properties', () => {
    it('should have correct identification values', () => {
      assert.strictEqual(sculkSensor.id, 'sculk_sensor');
      assert.strictEqual(sculkSensor.name, 'Sculk Sensor');
    });
    
    it('should have appropriate block properties', () => {
      assert.strictEqual(sculkSensor.hardness, 1.5);
      assert.strictEqual(sculkSensor.resistance, 1.5);
      assert.strictEqual(sculkSensor.requiresTool, true);
      assert.ok(sculkSensor instanceof Object);
    });
    
    it('should initialize with inactive state', () => {
      assert.strictEqual(sculkSensor.active, false);
      assert.strictEqual(sculkSensor.cooldown, 0);
      assert.strictEqual(sculkSensor.redstonePower, 0);
    });
    
    it('should have proper vibration detection properties', () => {
      assert.strictEqual(sculkSensor.vibrationRadius, 8);
      assert.strictEqual(sculkSensor.maxRedstonePower, 15);
      assert.strictEqual(typeof sculkSensor.vibrationEmitter, 'object');
    });
  });
  
  describe('Vibration Handling', () => {
    it('should detect vibrations within radius', () => {
      // Set position
      sculkSensor.x = 0;
      sculkSensor.y = 0;
      sculkSensor.z = 0;
      
      // Create vibration event within range
      const vibration = {
        type: 'break_block',
        position: { x: 5, y: 0, z: 0 },
        data: {}
      };
      
      const result = sculkSensor.handleVibration(vibration, 0);
      assert.strictEqual(result, true, 'Should detect vibration within range');
      assert.strictEqual(sculkSensor.active, true, 'Should be activated');
      assert.strictEqual(sculkSensor.redstonePower, 10, 'Should have break_block power level');
    });
    
    it('should not detect vibrations outside radius', () => {
      // Set position
      sculkSensor.x = 0;
      sculkSensor.y = 0;
      sculkSensor.z = 0;
      
      // Create vibration event outside range
      const vibration = {
        type: 'break_block',
        position: { x: 20, y: 0, z: 0 },
        data: {}
      };
      
      const result = sculkSensor.handleVibration(vibration, 0);
      assert.strictEqual(result, false, 'Should not detect vibration outside range');
      assert.strictEqual(sculkSensor.active, false, 'Should remain inactive');
    });
    
    it('should apply different power levels based on vibration type', () => {
      sculkSensor.x = 0;
      sculkSensor.y = 0;
      sculkSensor.z = 0;
      
      // Test different vibration types
      const testTypes = [
        { type: 'step', expectedPower: 1 },
        { type: 'break_block', expectedPower: 10 },
        { type: 'explosion', expectedPower: 15 },
        { type: 'unknown_type', expectedPower: 1 } // Default to 1 for unknown types
      ];
      
      for (const test of testTypes) {
        // Reset state
        sculkSensor.active = false;
        sculkSensor.redstonePower = 0;
        sculkSensor.cooldown = 0;
        
        const vibration = {
          type: test.type,
          position: { x: 2, y: 0, z: 0 },
          data: {}
        };
        
        sculkSensor.handleVibration(vibration, 0);
        assert.strictEqual(
          sculkSensor.redstonePower, 
          test.expectedPower, 
          `Should set power level ${test.expectedPower} for ${test.type}`
        );
      }
    });
    
    it('should ignore vibrations during cooldown', () => {
      sculkSensor.x = 0;
      sculkSensor.y = 0;
      sculkSensor.z = 0;
      sculkSensor.cooldown = 10; // Set cooldown
      
      const vibration = {
        type: 'break_block',
        position: { x: 2, y: 0, z: 0 },
        data: {}
      };
      
      const result = sculkSensor.handleVibration(vibration, 0);
      assert.strictEqual(result, false, 'Should ignore vibrations during cooldown');
    });
    
    it('should emit event when vibration is detected', (done) => {
      sculkSensor.x = 0;
      sculkSensor.y = 0;
      sculkSensor.z = 0;
      
      const vibration = {
        type: 'break_block',
        position: { x: 2, y: 0, z: 0 },
        data: {}
      };
      
      // Listen for the event
      sculkSensor.vibrationEmitter.once('vibrationDetected', (data) => {
        assert.strictEqual(data.type, 'break_block');
        assert.strictEqual(data.power, 10);
        assert.strictEqual(data.frequency, 10);
        done();
      });
      
      sculkSensor.handleVibration(vibration, 0);
    });
  });
  
  describe('Cooldown and Update', () => {
    it('should deactivate after cooldown period', () => {
      // Mock world and position
      const mockWorld = {
        getAdjacentBlocks: () => []
      };
      const position = { x: 0, y: 0, z: 0 };
      
      // Activate the sensor
      sculkSensor.active = true;
      sculkSensor.cooldown = 5;
      sculkSensor.redstonePower = 10;
      
      // Update for part of the cooldown
      sculkSensor.update(mockWorld, position, 0);
      assert.strictEqual(sculkSensor.cooldown, 4);
      assert.strictEqual(sculkSensor.active, true);
      
      // Update until cooldown expires
      sculkSensor.update(mockWorld, position, 0);
      sculkSensor.update(mockWorld, position, 0);
      sculkSensor.update(mockWorld, position, 0);
      sculkSensor.update(mockWorld, position, 0);
      
      assert.strictEqual(sculkSensor.cooldown, 0);
      assert.strictEqual(sculkSensor.active, false);
      assert.strictEqual(sculkSensor.redstonePower, 0);
    });
  });
  
  describe('Redstone Integration', () => {
    it('should return the correct redstone power level', () => {
      sculkSensor.active = true;
      sculkSensor.redstonePower = 10;
      assert.strictEqual(sculkSensor.getRedstonePower(), 10);
      
      sculkSensor.active = false;
      assert.strictEqual(sculkSensor.getRedstonePower(), 0);
    });
  });
  
  describe('Serialization', () => {
    it('should serialize and deserialize properly', () => {
      // Set up a block with custom state
      sculkSensor.active = true;
      sculkSensor.cooldown = 10;
      sculkSensor.redstonePower = 8;
      
      // Serialize
      const serialized = sculkSensor.toJSON();
      
      // Deserialize
      const deserialized = SculkSensorBlock.fromJSON(serialized);
      
      // Check state was preserved
      assert.strictEqual(deserialized.active, true);
      assert.strictEqual(deserialized.cooldown, 10);
      assert.strictEqual(deserialized.redstonePower, 8);
      assert.strictEqual(deserialized.id, 'sculk_sensor');
    });
  });
}); 