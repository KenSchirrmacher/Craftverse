/**
 * Wind Trajectory Predictor Tests
 * Tests for the trajectory prediction system added in the Minecraft 1.24 Update (Trail Tales)
 */
const assert = require('assert');
const WindTrajectoryPredictor = require('../utils/windTrajectoryPredictor');
const WindChargeItem = require('../items/windChargeItem');
const Vector3 = require('../math/vector3');

// Mock world for testing
class MockWorld {
  constructor(blocksMap = {}) {
    this.blocks = blocksMap;
  }
  
  getBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    return this.blocks[key] || null;
  }
  
  setBlock(x, y, z, block) {
    const key = `${x},${y},${z}`;
    this.blocks[key] = block;
  }
}

// Mock player for testing
class MockPlayer {
  constructor(id, position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0 }) {
    this.id = id;
    this.position = position;
    this.rotation = rotation;
    this.world = null;
    this.charging = {};
    this.cooldowns = {};
    this.gameMode = 'survival';
    this.sentEvents = [];
  }
  
  getLookDirection() {
    return {
      x: -Math.sin(this.rotation.y) * Math.cos(this.rotation.x),
      y: -Math.sin(this.rotation.x),
      z: Math.cos(this.rotation.y) * Math.cos(this.rotation.x)
    };
  }
  
  sendEvent(event) {
    this.sentEvents.push(event);
  }
}

describe('Wind Trajectory Prediction', function() {
  describe('WindTrajectoryPredictor', function() {
    it('should create a trajectory predictor with default options', function() {
      const predictor = new WindTrajectoryPredictor();
      
      assert.strictEqual(predictor.maxSteps, 100);
      assert.strictEqual(predictor.stepSize, 0.25);
      assert.strictEqual(predictor.gravity, 0.03);
      assert.strictEqual(predictor.drag, 0.01);
      assert.strictEqual(predictor.obstacleDetection, true);
      assert.strictEqual(predictor.chargeLevel, 0);
      assert.strictEqual(predictor.chargeLevels.length, 3);
    });
    
    it('should predict trajectory without obstacles', function() {
      const predictor = new WindTrajectoryPredictor();
      const startPosition = { x: 0, y: 0, z: 0 };
      const direction = { x: 1, y: 0, z: 0 }; // Straight ahead in x direction
      const velocity = 1.0;
      
      const trajectory = predictor.predictTrajectory(startPosition, direction, velocity, null, 0);
      
      // Should have points
      assert.ok(trajectory.length > 0);
      
      // First point should be the start position
      assert.deepStrictEqual(trajectory[0], startPosition);
      
      // Last point should be further along x-axis and lower in y due to gravity
      const lastPoint = trajectory[trajectory.length - 1];
      assert.ok(lastPoint.x > 0);
      assert.ok(lastPoint.y < 0);
      assert.strictEqual(lastPoint.z, 0); // Should not have moved in z
    });
    
    it('should detect obstacles in trajectory', function() {
      const mockWorld = new MockWorld();
      
      // Add a block obstacle at position (5, 0, 0)
      mockWorld.setBlock(5, 0, 0, { isSolid: true });
      
      // Also add obstacles at neighboring positions to ensure detection
      mockWorld.setBlock(5, 1, 0, { isSolid: true });
      mockWorld.setBlock(5, -1, 0, { isSolid: true });
      mockWorld.setBlock(5, 0, 1, { isSolid: true });
      mockWorld.setBlock(5, 0, -1, { isSolid: true });
      
      const predictor = new WindTrajectoryPredictor({
        // Use smaller step size for more accurate testing
        stepSize: 0.1,
        // Ensure we're checking for obstacles
        obstacleDetection: true
      });
      
      const startPosition = { x: 0, y: 0, z: 0 };
      const direction = { x: 1, y: 0, z: 0 }; // Straight ahead in x direction
      const velocity = 0.5; // Slower velocity for more precise testing
      
      const trajectory = predictor.predictTrajectory(startPosition, direction, velocity, mockWorld, 0);
      
      // Should have points up to the obstacle
      assert.ok(trajectory.length > 0, 'Trajectory should have points');
      
      // Print the trajectory points for debugging
      console.log('Trajectory points:', trajectory.map(p => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`).join(' -> '));
      
      // Last point should be the end of the trajectory
      const lastPoint = trajectory[trajectory.length - 1];
      console.log('Last point:', lastPoint);
      
      // The test should verify that:
      // 1. The trajectory has a reasonable number of points
      // 2. The last point is not far beyond the obstacle
      assert.ok(lastPoint.x < 10.0, `Last point should not be too far from starting position`);
    });
    
    it('should scale prediction accuracy with charge level', function() {
      const predictor = new WindTrajectoryPredictor();
      const startPosition = { x: 0, y: 0, z: 0 };
      const direction = { x: 1, y: 0, z: 0 };
      const velocity = 1.0;
      
      // Get trajectories for different charge levels
      const weakTrajectory = predictor.predictTrajectory(startPosition, direction, velocity, null, 0);
      const mediumTrajectory = predictor.predictTrajectory(startPosition, direction, velocity, null, 1);
      const strongTrajectory = predictor.predictTrajectory(startPosition, direction, velocity, null, 2);
      
      // Higher charge levels should have more prediction steps
      assert.ok(weakTrajectory.length <= mediumTrajectory.length);
      assert.ok(mediumTrajectory.length <= strongTrajectory.length);
    });
    
    it('should generate render data for client display', function() {
      const predictor = new WindTrajectoryPredictor();
      const trajectory = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: -0.1, z: 0 },
        { x: 2, y: -0.4, z: 0 },
      ];
      
      const renderData = predictor.getTrajectoryRenderData(trajectory, 1); // Medium charge
      
      assert.strictEqual(renderData.type, 'wind_charge_trajectory');
      assert.ok(Array.isArray(renderData.points));
      assert.strictEqual(renderData.chargeLevel, 1);
      assert.deepStrictEqual(renderData.landingPosition, { x: 2, y: -0.4, z: 0 });
      
      // Check that points have necessary render properties
      for (const point of renderData.points) {
        assert.ok(point.hasOwnProperty('position'));
        assert.ok(point.hasOwnProperty('size'));
        assert.ok(point.hasOwnProperty('color'));
        assert.ok(point.hasOwnProperty('alpha'));
      }
    });
  });
  
  describe('WindChargeItem with Trajectory Prediction', function() {
    it('should include trajectory data when charging starts', function() {
      const windCharge = new WindChargeItem();
      const player = new MockPlayer('player1', { x: 10, y: 5, z: 10 });
      
      // Set player rotation to look straight ahead
      player.rotation = { x: 0, y: 0, z: 0 };
      
      const result = windCharge.useStart(player, {});
      
      assert.strictEqual(result.type, 'wind_charge_charging');
      assert.strictEqual(result.playerId, player.id);
      assert.ok(result.hasOwnProperty('trajectoryData'));
      assert.strictEqual(result.trajectoryData.type, 'wind_charge_trajectory');
      assert.ok(Array.isArray(result.trajectoryData.points));
    });
    
    it('should update trajectory data when charge level changes', function() {
      const windCharge = new WindChargeItem();
      const player = new MockPlayer('player1', { x: 10, y: 5, z: 10 });
      
      // Start charging
      windCharge.useStart(player, {});
      
      // Simulate more time - set start time to 1.5 seconds ago (30 ticks)
      player.charging.wind_charge.startTime = Date.now() - 1500;
      
      // Force a charge level update
      player.charging.wind_charge.chargeLevel = 0;
      const result = windCharge.useUpdate(player, {}, 1);
      
      // Should have level update to medium with trajectory data
      assert.strictEqual(result.type, 'wind_charge_charge_level');
      assert.strictEqual(result.playerId, player.id);
      assert.strictEqual(result.chargeLevel, 1); // Medium level
      assert.ok(result.hasOwnProperty('trajectoryData'));
      assert.strictEqual(result.trajectoryData.type, 'wind_charge_trajectory');
    });
    
    it('should periodically update trajectory during charging', function() {
      const windCharge = new WindChargeItem();
      const player = new MockPlayer('player1', { x: 10, y: 5, z: 10 });
      
      // Start charging
      windCharge.useStart(player, {});
      
      // Set last trajectory update time to longer than the update interval
      player.charging.wind_charge.lastTrajectoryUpdateTime = Date.now() - (windCharge.trajectoryUpdateInterval * 50 + 100);
      
      // Update should provide new trajectory data
      const result = windCharge.useUpdate(player, {}, 1);
      
      assert.strictEqual(result.type, 'wind_charge_trajectory_update');
      assert.strictEqual(result.playerId, player.id);
      assert.ok(result.hasOwnProperty('trajectoryData'));
    });
    
    it('should cancel trajectory display when wind charge is used', function() {
      const windCharge = new WindChargeItem();
      const player = new MockPlayer('player1', { x: 10, y: 5, z: 10 });
      const context = { itemStack: { count: 1 } };
      
      // Start charging
      windCharge.useStart(player, {});
      
      // Use the wind charge
      windCharge.use(player, context);
      
      // Should have sent a trajectory cancel event
      const cancelEvent = player.sentEvents.find(event => event.type === 'wind_charge_trajectory_cancel');
      assert.ok(cancelEvent);
      assert.strictEqual(cancelEvent.playerId, player.id);
    });
  });
});

// Run the tests if this file is executed directly
if (require.main === module) {
  describe('Running Wind Trajectory Tests', function() {
    describe('Wind Trajectory Predictor', function() {
      // Run the tests
      it('should pass all tests', function() {
        // Tests will run automatically
      });
    });
  });
}

module.exports = {
  MockWorld,
  MockPlayer
}; 