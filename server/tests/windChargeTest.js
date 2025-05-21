const assert = require('assert');
const WindChargeItem = require('../items/windChargeItem');
const WindTrajectoryPredictor = require('../utils/windTrajectoryPredictor');
const Vector3 = require('../math/vector3');

describe('Wind Charge System', () => {
  let windCharge;
  let mockPlayer;
  let mockWorld;
  
  beforeEach(() => {
    // Create Wind Charge item
    windCharge = new WindChargeItem();
    
    // Create mock player
    mockPlayer = {
      id: 'test_player',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0 },
      cooldowns: {},
      charging: {},
      getLookDirection: () => ({
        x: 0,
        y: 0,
        z: 1
      })
    };
    
    // Create mock world
    mockWorld = {
      getBlock: (x, y, z) => ({
        isSolid: false
      })
    };
  });
  
  describe('Wind Charge Item', () => {
    it('should initialize with correct properties', () => {
      assert.strictEqual(windCharge.id, 'wind_charge');
      assert.strictEqual(windCharge.name, 'Wind Charge');
      assert.strictEqual(windCharge.type, 'wind_charge');
      assert.strictEqual(windCharge.maxStackSize, 16);
      assert.strictEqual(windCharge.cooldown, 20);
      assert.strictEqual(windCharge.maxChargeTime, 60);
    });
    
    it('should have three charge levels', () => {
      assert.strictEqual(windCharge.chargeLevels.length, 3);
      assert.deepStrictEqual(windCharge.chargeLevels[0], {
        name: 'weak',
        threshold: 0,
        damageMultiplier: 1.0,
        radiusMultiplier: 1.0,
        powerMultiplier: 1.0
      });
    });
    
    it('should start charging when used', () => {
      const result = windCharge.useStart(mockPlayer);
      assert(result);
      assert.strictEqual(result.type, 'wind_charge_charging');
      assert.strictEqual(result.playerId, mockPlayer.id);
      assert(mockPlayer.charging.wind_charge);
    });
    
    it('should respect cooldown', () => {
      // First use
      windCharge.useStart(mockPlayer);
      windCharge.use(mockPlayer);
      
      // Try to use again immediately
      const result = windCharge.useStart(mockPlayer);
      assert.strictEqual(result, false);
    });
    
    it('should update charge level correctly', () => {
      windCharge.useStart(mockPlayer);
      
      // Simulate charging for 1 second (20 ticks)
      const result = windCharge.useUpdate(mockPlayer, {}, 20);
      assert(result);
      assert.strictEqual(result.type, 'wind_charge_charge_level');
      assert.strictEqual(result.chargeLevel, 1); // Should be medium charge
    });
    
    it('should calculate trajectory correctly', () => {
      const trajectory = windCharge.calculateTrajectory(mockPlayer, 0);
      assert(trajectory);
      assert(trajectory.points);
      assert(trajectory.landingPosition);
    });
  });
  
  describe('Wind Trajectory Predictor', () => {
    let predictor;
    
    beforeEach(() => {
      predictor = new WindTrajectoryPredictor();
    });
    
    it('should initialize with correct properties', () => {
      assert.strictEqual(predictor.maxSteps, 100);
      assert.strictEqual(predictor.stepSize, 0.25);
      assert.strictEqual(predictor.gravity, 0.03);
      assert.strictEqual(predictor.drag, 0.01);
    });
    
    it('should predict trajectory with no obstacles', () => {
      const startPosition = { x: 0, y: 0, z: 0 };
      const direction = { x: 0, y: 0, z: 1 };
      const velocity = 1.5;
      
      const trajectory = predictor.predictTrajectory(
        startPosition,
        direction,
        velocity,
        mockWorld,
        0
      );
      
      assert(Array.isArray(trajectory));
      assert(trajectory.length > 0);
      assert.deepStrictEqual(trajectory[0], startPosition);
    });
    
    it('should stop trajectory at obstacles', () => {
      // Create world with a solid block
      const worldWithObstacle = {
        getBlock: (x, y, z) => ({
          isSolid: z > 5 // Solid block at z > 5
        })
      };
      
      const startPosition = { x: 0, y: 0, z: 0 };
      const direction = { x: 0, y: 0, z: 1 };
      const velocity = 1.5;
      
      const trajectory = predictor.predictTrajectory(
        startPosition,
        direction,
        velocity,
        worldWithObstacle,
        0
      );
      
      assert(Array.isArray(trajectory));
      assert(trajectory.length > 0);
      assert(trajectory[trajectory.length - 1].z <= 5);
    });
    
    it('should provide different predictions for different charge levels', () => {
      const startPosition = { x: 0, y: 0, z: 0 };
      const direction = { x: 0, y: 0, z: 1 };
      const velocity = 1.5;
      
      const weakTrajectory = predictor.predictTrajectory(
        startPosition,
        direction,
        velocity,
        mockWorld,
        0
      );
      
      const strongTrajectory = predictor.predictTrajectory(
        startPosition,
        direction,
        velocity,
        mockWorld,
        2
      );
      
      assert.notDeepStrictEqual(weakTrajectory, strongTrajectory);
      assert(strongTrajectory.length > weakTrajectory.length);
    });
    
    it('should generate correct render data', () => {
      const trajectory = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: 2 }
      ];
      
      const renderData = predictor.getTrajectoryRenderData(trajectory, 0);
      
      assert.strictEqual(renderData.type, 'wind_charge_trajectory');
      assert(Array.isArray(renderData.points));
      assert(renderData.landingPosition);
      assert.strictEqual(renderData.chargeLevel, 0);
    });
  });
  
  describe('Wind Charge Chain Reactions', () => {
    it('should trigger chain reactions when hitting blocks', () => {
      // Create world with chainable blocks
      const worldWithChainableBlocks = {
        getBlock: (x, y, z) => ({
          isSolid: true,
          isChainable: true,
          triggerChainReaction: () => true
        })
      };
      
      const result = windCharge.use(mockPlayer, {
        world: worldWithChainableBlocks,
        position: { x: 0, y: 0, z: 5 }
      });
      
      assert(result);
      assert(result.chainReaction);
      assert(Array.isArray(result.chainReaction.affectedBlocks));
    });
    
    it('should respect line of sight for chain reactions', () => {
      // Create world with solid blocks blocking line of sight
      const worldWithObstacles = {
        getBlock: (x, y, z) => ({
          isSolid: true,
          isChainable: true,
          blocksLineOfSight: true
        })
      };
      
      const result = windCharge.use(mockPlayer, {
        world: worldWithObstacles,
        position: { x: 0, y: 0, z: 5 }
      });
      
      assert(result);
      assert(!result.chainReaction.affectedBlocks.some(block => 
        block.x > 1 || block.z > 6
      ));
    });
  });
  
  describe('Wind Charge Block Interactions', () => {
    it('should interact with bells', () => {
      const worldWithBell = {
        getBlock: (x, y, z) => ({
          isSolid: true,
          type: 'bell',
          ring: () => true
        })
      };
      
      const result = windCharge.use(mockPlayer, {
        world: worldWithBell,
        position: { x: 0, y: 0, z: 5 }
      });
      
      assert(result);
      assert(result.blockInteractions.some(interaction => 
        interaction.type === 'bell_ring'
      ));
    });
    
    it('should interact with note blocks', () => {
      const worldWithNoteBlock = {
        getBlock: (x, y, z) => ({
          isSolid: true,
          type: 'note_block',
          playNote: () => true
        })
      };
      
      const result = windCharge.use(mockPlayer, {
        world: worldWithNoteBlock,
        position: { x: 0, y: 0, z: 5 }
      });
      
      assert(result);
      assert(result.blockInteractions.some(interaction => 
        interaction.type === 'note_block_play'
      ));
    });
    
    it('should interact with campfires', () => {
      const worldWithCampfire = {
        getBlock: (x, y, z) => ({
          isSolid: true,
          type: 'campfire',
          extinguish: () => true
        })
      };
      
      const result = windCharge.use(mockPlayer, {
        world: worldWithCampfire,
        position: { x: 0, y: 0, z: 5 }
      });
      
      assert(result);
      assert(result.blockInteractions.some(interaction => 
        interaction.type === 'campfire_extinguish'
      ));
    });
    
    it('should interact with wind turbines', () => {
      const worldWithWindTurbine = {
        getBlock: (x, y, z) => ({
          isSolid: true,
          type: 'wind_turbine',
          generatePower: () => true
        })
      };
      
      const result = windCharge.use(mockPlayer, {
        world: worldWithWindTurbine,
        position: { x: 0, y: 0, z: 5 }
      });
      
      assert(result);
      assert(result.blockInteractions.some(interaction => 
        interaction.type === 'wind_turbine_power'
      ));
    });
  });
});
