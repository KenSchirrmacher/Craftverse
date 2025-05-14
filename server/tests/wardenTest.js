/**
 * Tests for the Warden mob implementation
 */

const assert = require('assert');
const Warden = require('../mobs/warden');

describe('Warden Mob', () => {
  let warden;
  let mockWorld;
  let mockPlayer;
  
  beforeEach(() => {
    // Create a warden at position 0,0,0
    warden = new Warden({ x: 0, y: 0, z: 0 });
    
    // Mock world
    mockWorld = {
      getBlockAt: function(x, y, z) {
        return { type: 'stone' }; // Default block
      },
      setBlockAt: function(x, y, z, blockType) {
        this.lastSetBlock = { x, y, z, type: blockType };
      },
      lastSetBlock: null,
      emitVibration: function(data) {
        this.lastVibration = data;
      },
      lastVibration: null
    };
    
    // Mock player
    mockPlayer = {
      id: 'player-1',
      position: { x: 10, y: 0, z: 0 }, // 10 blocks away from warden
      health: 20,
      maxHealth: 20,
      takeDamage: function(amount, source) {
        this.health = Math.max(0, this.health - amount);
        this.lastDamageSource = source;
        return true;
      },
      applyKnockback: function(vector) {
        this.lastKnockback = vector;
      },
      lastDamageSource: null,
      lastKnockback: null
    };
  });
  
  describe('Basic properties', () => {
    it('should have correct identification and stats', () => {
      assert.strictEqual(warden.type, 'warden');
      assert.strictEqual(warden.health, 500);
      assert.strictEqual(warden.maxHealth, 500);
      assert.strictEqual(warden.speed, 0.3);
      assert.strictEqual(warden.attackDamage, 30);
      assert.strictEqual(warden.persistent, true);
    });
    
    it('should be hostile', () => {
      assert.strictEqual(warden.isHostile(), true);
    });
    
    it('should start in emerging state with no anger', () => {
      assert.strictEqual(warden.state, 'emerging');
      assert.strictEqual(warden.angerLevel, 0);
      assert.strictEqual(warden.isDiggingOut, false);
      assert.strictEqual(warden.diggingProgress, 0);
      assert.deepStrictEqual(warden.detectedEntities, {});
    });
    
    it('should have inactive tendrils when not angry', () => {
      assert.strictEqual(warden.tendrils.active, false);
      assert.strictEqual(warden.tendrils.pulseRate, 0);
      assert.strictEqual(warden.tendrils.brightness, 0);
    });
  });
  
  describe('Emerging behavior', () => {
    it('should progress through the emerging animation', () => {
      // Initial state
      assert.strictEqual(warden.state, 'emerging');
      assert.strictEqual(warden.diggingProgress, 0);
      
      // Simulate update with deltaTime of 25 (fast-forward animation)
      warden.update(mockWorld, {}, {}, 25);
      
      // Check progress
      assert.ok(warden.diggingProgress > 0, 'Digging progress should increase');
      assert.strictEqual(warden.state, 'emerging', 'Should still be in emerging state');
      
      // Simulate completion
      warden.update(mockWorld, {}, {}, 75);
      
      // Should have finished emerging
      assert.strictEqual(warden.diggingProgress, 100, 'Should have completed emerging');
      assert.strictEqual(warden.state, 'idle', 'Should transition to idle state');
    });
  });
  
  describe('Vibration detection', () => {
    it('should detect and react to vibrations', () => {
      // Complete emerging first
      warden.state = 'idle';
      
      // Create test vibration
      const vibration = {
        type: 'break_block',
        position: { x: 5, y: 0, z: 0 },
        entity: mockPlayer
      };
      
      // Handle vibration
      const detected = warden.handleVibration(vibration);
      
      // Should detect since it's within range
      assert.strictEqual(detected, true, 'Should detect vibration within range');
      assert.ok(warden.angerLevel > 0, 'Should increase anger level');
      assert.deepStrictEqual(warden.lastVibrationSource, vibration.position, 'Should record vibration source');
      assert.ok(warden.detectedEntities[mockPlayer.id] > 0, 'Should associate anger with player');
    });
    
    it('should not detect vibrations outside detection range', () => {
      // Complete emerging first
      warden.state = 'idle';
      
      // Create test vibration far away
      const vibration = {
        type: 'step',
        position: { x: 50, y: 0, z: 0 }, // 50 blocks away
        entity: mockPlayer
      };
      
      // Handle vibration
      const detected = warden.handleVibration(vibration);
      
      // Should not detect since it's out of range
      assert.strictEqual(detected, false, 'Should not detect vibration outside range');
      assert.strictEqual(warden.angerLevel, 0, 'Should not increase anger level');
    });
    
    it('should not detect vibrations while emerging', () => {
      // Ensure warden is in emerging state
      warden.state = 'emerging';
      
      // Create test vibration
      const vibration = {
        type: 'break_block',
        position: { x: 5, y: 0, z: 0 },
        entity: mockPlayer
      };
      
      // Handle vibration
      const detected = warden.handleVibration(vibration);
      
      // Should not detect while emerging
      assert.strictEqual(detected, false, 'Should not detect vibration while emerging');
      assert.strictEqual(warden.angerLevel, 0, 'Should not increase anger level');
    });
    
    it('should react differently to different vibration types', () => {
      // Complete emerging first
      warden.state = 'idle';
      
      // Test with step vibration (minimal anger)
      let vibration = {
        type: 'step',
        position: { x: 5, y: 0, z: 0 },
        entity: mockPlayer
      };
      
      warden.handleVibration(vibration);
      const angerFromStep = warden.angerLevel;
      
      // Reset anger
      warden.angerLevel = 0;
      warden.detectedEntities = {};
      
      // Test with explosion vibration (major anger)
      vibration = {
        type: 'explosion',
        position: { x: 5, y: 0, z: 0 },
        entity: mockPlayer
      };
      
      warden.handleVibration(vibration);
      const angerFromExplosion = warden.angerLevel;
      
      // Explosion should cause more anger
      assert.ok(angerFromExplosion > angerFromStep, 'Explosion should cause more anger than step');
    });
  });
  
  describe('Anger system', () => {
    it('should update state based on anger level', () => {
      // Complete emerging first
      warden.state = 'idle';
      
      // Low anger - investigating
      warden.angerLevel = 15;
      warden.updateStateFromAnger();
      assert.strictEqual(warden.state, 'investigating', 'Low anger should trigger investigating state');
      
      // Medium anger - hunting
      warden.angerLevel = 50;
      warden.updateStateFromAnger();
      assert.strictEqual(warden.state, 'hunting', 'Medium anger should trigger hunting state');
      
      // High anger - attacking
      warden.angerLevel = 100;
      warden.updateStateFromAnger();
      assert.strictEqual(warden.state, 'attacking', 'High anger should trigger attacking state');
      
      // Back to low anger
      warden.angerLevel = 5;
      warden.updateStateFromAnger();
      assert.strictEqual(warden.state, 'idle', 'Low anger should return to idle state');
    });
    
    it('should decay anger over time', () => {
      // Complete emerging first
      warden.state = 'idle';
      
      // Set initial anger
      warden.angerLevel = 20;
      warden.detectedEntities['player-1'] = 20;
      
      // Simulate several update ticks
      for (let i = 0; i < 5; i++) {
        warden.angerDecayTimer = 19; // Just below the 20 tick threshold
        warden.updateAnger(1); // Should trigger decay
      }
      
      // Anger should have decayed
      assert.ok(warden.angerLevel < 20, 'Anger level should decay');
      assert.ok(warden.detectedEntities['player-1'] < 20, 'Entity-specific anger should decay');
    });
    
    it('should update tendril state based on anger', () => {
      // Complete emerging first
      warden.state = 'idle';
      
      // No anger - inactive tendrils
      warden.angerLevel = 0;
      warden.updateTendrils();
      assert.strictEqual(warden.tendrils.active, false, 'Tendrils should be inactive with no anger');
      
      // Some anger - active tendrils
      warden.angerLevel = 30;
      warden.updateTendrils();
      assert.strictEqual(warden.tendrils.active, true, 'Tendrils should be active with some anger');
      assert.ok(warden.tendrils.pulseRate > 0, 'Pulse rate should increase with anger');
      assert.ok(warden.tendrils.brightness > 0, 'Brightness should increase with anger');
      
      // Max anger - maximum tendril activity
      warden.angerLevel = warden.maxAngerLevel;
      warden.updateTendrils();
      assert.strictEqual(warden.tendrils.pulseRate, 1, 'Pulse rate should be maximum with max anger');
      assert.strictEqual(warden.tendrils.brightness, 1, 'Brightness should be maximum with max anger');
    });
  });
  
  describe('Sniffing behavior', () => {
    it('should detect nearby players when sniffing', () => {
      // Complete emerging first
      warden.state = 'idle';
      
      // Position player within sniff range
      mockPlayer.position = { x: 15, y: 0, z: 0 }; // 15 blocks away
      
      // Set up sniffing state
      warden.isSniffing = true;
      warden.detectNearbyEntities(mockWorld, { 'player-1': mockPlayer });
      
      // Should have detected player
      assert.ok(warden.angerLevel > 0, 'Should increase anger level when sniffing detects player');
      assert.ok(warden.detectedEntities['player-1'] > 0, 'Should associate anger with detected player');
    });
    
    it('should not detect players outside sniff range', () => {
      // Complete emerging first
      warden.state = 'idle';
      
      // Position player outside sniff range
      mockPlayer.position = { x: 30, y: 0, z: 0 }; // 30 blocks away
      
      // Set up sniffing state
      warden.isSniffing = true;
      warden.detectNearbyEntities(mockWorld, { 'player-1': mockPlayer });
      
      // Should not have detected player
      assert.strictEqual(warden.angerLevel, 0, 'Should not increase anger level for players outside sniff range');
      assert.strictEqual(Object.keys(warden.detectedEntities).length, 0, 'Should not detect players outside range');
    });
    
    it('should not detect players when not sniffing', () => {
      // Complete emerging first
      warden.state = 'idle';
      
      // Position player within sniff range
      mockPlayer.position = { x: 15, y: 0, z: 0 }; // 15 blocks away
      
      // Ensure not sniffing
      warden.isSniffing = false;
      warden.detectNearbyEntities(mockWorld, { 'player-1': mockPlayer });
      
      // Should not have detected player
      assert.strictEqual(warden.angerLevel, 0, 'Should not increase anger level when not sniffing');
      assert.strictEqual(Object.keys(warden.detectedEntities).length, 0, 'Should not detect players when not sniffing');
    });
  });
  
  describe('Attack behaviors', () => {
    it('should perform melee attack when in range', () => {
      // Complete emerging and set attacking state
      warden.state = 'attacking';
      warden.attackWarningLevel = 3; // Ready to attack
      warden.attackCooldown = 0;
      
      // Set player as target
      warden.targetEntity = mockPlayer;
      
      // Position player within melee range
      mockPlayer.position = { x: 2, y: 0, z: 0 }; // 2 blocks away
      
      // Update warden
      warden.updateAttacking(mockWorld, { 'player-1': mockPlayer }, {}, 1);
      
      // Should have attacked player
      assert.ok(mockPlayer.health < mockPlayer.maxHealth, 'Should damage player with melee attack');
      assert.strictEqual(mockPlayer.lastDamageSource, warden, 'Warden should be damage source');
    });
    
    it('should perform sonic boom attack when out of melee range', () => {
      // Complete emerging and set attacking state
      warden.state = 'attacking';
      warden.attackWarningLevel = 3; // Ready to attack
      warden.sonicBoomCooldown = 0;
      
      // Set player as target
      warden.targetEntity = mockPlayer;
      
      // Position player outside melee range but within sonic boom range
      mockPlayer.position = { x: 10, y: 0, z: 0 }; // 10 blocks away
      
      // Update warden
      warden.updateAttacking(mockWorld, { 'player-1': mockPlayer }, {}, 1);
      
      // Should transition to sonic boom state
      assert.strictEqual(warden.state, 'sonic_boom', 'Should transition to sonic boom state');
      
      // Execute sonic boom
      warden.updateSonicBoom(mockWorld, { 'player-1': mockPlayer }, 1);
      
      // Should have damaged and knocked back player
      assert.ok(mockPlayer.health < mockPlayer.maxHealth, 'Should damage player with sonic boom');
      assert.ok(mockPlayer.lastKnockback !== null, 'Should apply knockback to player');
      assert.ok(warden.sonicBoomCooldown > 0, 'Should set cooldown after sonic boom');
    });
    
    it('should progress through warning levels before attacking', () => {
      // Complete emerging and set attacking state
      warden.state = 'attacking';
      warden.attackWarningLevel = 0;
      warden.attackWarningTime = 0;
      
      // Set player as target
      warden.targetEntity = mockPlayer;
      
      // Position player within attack range
      mockPlayer.position = { x: 2, y: 0, z: 0 };
      
      // Initial health
      const initialHealth = mockPlayer.health;
      
      // First update - should not attack yet
      warden.updateAttacking(mockWorld, { 'player-1': mockPlayer }, {}, 10);
      assert.strictEqual(warden.attackWarningLevel, 1, 'Warning level should increase');
      assert.strictEqual(mockPlayer.health, initialHealth, 'Should not attack during first warning');
      
      // Second update - should not attack yet
      warden.updateAttacking(mockWorld, { 'player-1': mockPlayer }, {}, 10);
      assert.strictEqual(warden.attackWarningLevel, 2, 'Warning level should increase');
      assert.strictEqual(mockPlayer.health, initialHealth, 'Should not attack during second warning');
      
      // Third update - should not attack yet
      warden.updateAttacking(mockWorld, { 'player-1': mockPlayer }, {}, 10);
      assert.strictEqual(warden.attackWarningLevel, 3, 'Warning level should increase');
      
      // Player health should still be intact after warning level reaches 3
      // No attack should have happened yet
      assert.strictEqual(mockPlayer.health, initialHealth, 'Should not attack during third warning');
      
      // Fourth update - should attack
      // But need to ensure attackCooldown is 0 first
      warden.attackCooldown = 0;  
      warden.updateAttacking(mockWorld, { 'player-1': mockPlayer }, {}, 1);
      
      // Now the player should have been attacked
      assert.ok(mockPlayer.health < initialHealth, 'Should attack after warnings complete');
    });
  });
  
  describe('Hunting behavior', () => {
    it('should track entity with highest anger value', () => {
      // Complete emerging and set hunting state
      warden.state = 'hunting';
      
      // Set up multiple entities with different anger levels
      warden.detectedEntities['player-1'] = 20;
      warden.detectedEntities['player-2'] = 40;
      
      const mockPlayer2 = {
        id: 'player-2',
        position: { x: -5, y: 0, z: 0 }
      };
      
      // Update hunting behavior
      warden.updateHunting(mockWorld, { 
        'player-1': mockPlayer, 
        'player-2': mockPlayer2 
      }, 1);
      
      // Should target entity with highest anger
      assert.strictEqual(warden.targetEntity, mockPlayer2, 'Should target entity with highest anger value');
    });
  });
  
  describe('Taking damage', () => {
    it('should become very angry when damaged', () => {
      // Complete emerging first
      warden.state = 'idle';
      warden.angerLevel = 0;
      
      // Take damage from player
      warden.takeDamage(10, mockPlayer);
      
      // Should become very angry at attacker
      assert.ok(warden.angerLevel >= 80, 'Should become highly angry when attacked');
      assert.ok(warden.detectedEntities[mockPlayer.id] >= 80, 'Should attribute high anger to attacker');
      assert.strictEqual(warden.state, 'attacking', 'Should transition to attacking state when damaged');
    });
  });
  
  describe('Drops and serialization', () => {
    it('should drop experience when killed', () => {
      const drops = warden.getDrops();
      const hasExperience = drops.some(drop => drop.type === 'experience');
      assert.ok(hasExperience, 'Should drop experience');
    });
    
    it('should serialize all important state', () => {
      // Set up some state
      warden.angerLevel = 50;
      warden.detectedEntities['player-1'] = 50;
      warden.lastVibrationSource = { x: 5, y: 0, z: 0 };
      warden.isSniffing = true;
      
      const serialized = warden.serialize();
      
      // Check serialized data
      assert.strictEqual(serialized.angerLevel, 50, 'Should serialize anger level');
      assert.deepStrictEqual(serialized.detectedEntities, warden.detectedEntities, 'Should serialize detected entities');
      assert.deepStrictEqual(serialized.lastVibrationSource, warden.lastVibrationSource, 'Should serialize vibration source');
      assert.strictEqual(serialized.isSniffing, true, 'Should serialize sniffing state');
    });
    
    it('should provide client data for rendering', () => {
      // Set up some state
      warden.angerLevel = 70;
      warden.tendrils.active = true;
      warden.tendrils.pulseRate = 0.5;
      
      const clientData = warden.getClientData();
      
      // Check client data
      assert.strictEqual(clientData.angerLevel, 70, 'Should include anger level in client data');
      assert.strictEqual(clientData.state, warden.state, 'Should include state in client data');
      assert.strictEqual(clientData.tendrils.active, true, 'Should include tendril state in client data');
      assert.strictEqual(clientData.tendrils.pulseRate, 0.5, 'Should include tendril pulse rate in client data');
    });
  });
}); 